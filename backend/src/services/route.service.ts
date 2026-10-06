import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import path from "path";

export type RoutePlanRequest = {
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  preference: "fastest" | "scenic" | "nature" | "food" | "culture" | "hidden-gems";
};

const PROCESS_TIMEOUT_MS = 120_000;
const MAX_STDOUT_BYTES = 20 * 1024 * 1024;
const MAX_STDERR_BYTES = 16 * 1024;
const ENGINE_PATH = path.resolve(__dirname, "../../gis/route_engine.py");

export class RoutePlanningError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "RoutePlanningError";
  }
}

type EngineResult = Record<string, unknown> & { success?: unknown; error?: unknown };

export function planRoute(request: RoutePlanRequest): Promise<EngineResult> {
  const pythonPath = process.env.VIATOR_PYTHON_PATH || (process.platform === "win32" ? "python" : "python3");

  return new Promise((resolve, reject) => {
    let child: ChildProcessWithoutNullStreams;
    try {
      // Fixed executable arguments and fixed script path; request data is sent only over stdin.
      child = spawn(pythonPath, [ENGINE_PATH], { shell: false, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    } catch (error) {
      reject(new RoutePlanningError("Python route service is unavailable.", "ROUTE_PYTHON_UNAVAILABLE", 503));
      return;
    }

    let stdout = "";
    let stdoutBytes = 0;
    let stderr = "";
    let settled = false;
    let timedOut = false;
    let outputTooLarge = false;

    const finishError = (error: RoutePlanningError) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    };

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, PROCESS_TIMEOUT_MS);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdoutBytes += Buffer.byteLength(chunk, "utf8");
      if (stdoutBytes > MAX_STDOUT_BYTES) {
        outputTooLarge = true;
        child.kill();
        return;
      }
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      if (stderr.length < MAX_STDERR_BYTES) stderr += chunk.slice(0, MAX_STDERR_BYTES - stderr.length);
    });
    child.on("error", (error: NodeJS.ErrnoException) => {
      const missing = error.code === "ENOENT";
      finishError(new RoutePlanningError(
        missing ? "Python route service is unavailable; configure VIATOR_PYTHON_PATH." : "Unable to start Python route service.",
        missing ? "ROUTE_PYTHON_UNAVAILABLE" : "ROUTE_PROCESS_ERROR",
        503
      ));
    });
    child.on("close", (code: number | null) => {
      if (settled) return;
      clearTimeout(timer);
      if (timedOut) {
        finishError(new RoutePlanningError("Route planning timed out.", "ROUTE_TIMEOUT", 504));
        return;
      }
      if (outputTooLarge) {
        finishError(new RoutePlanningError("Route engine returned an oversized response.", "ROUTE_ENGINE_RESPONSE_INVALID", 502));
        return;
      }

      let result: EngineResult;
      try {
        result = JSON.parse(stdout) as EngineResult;
      } catch {
        console.error("Route engine returned malformed JSON.", stderr);
        finishError(new RoutePlanningError("Route engine returned an invalid response.", "ROUTE_ENGINE_RESPONSE_INVALID", 502));
        return;
      }

      if (!result || typeof result !== "object" || Array.isArray(result)) {
        finishError(new RoutePlanningError("Route engine returned an invalid response.", "ROUTE_ENGINE_RESPONSE_INVALID", 502));
        return;
      }
      if (result.success !== true) {
        const engineMessage = typeof result.error === "string" ? result.error : "Route engine failed.";
        console.error("Route engine failed:", engineMessage, stderr);
        finishError(new RoutePlanningError("Route planning is temporarily unavailable.", "ROUTE_UPSTREAM_ERROR", 502));
        return;
      }
      if (code !== 0) {
        console.error("Route engine exited with a non-zero status.", stderr);
        finishError(new RoutePlanningError("Route planning is temporarily unavailable.", "ROUTE_ENGINE_ERROR", 502));
        return;
      }
      settled = true;
      resolve(result);
    });

    child.stdin.on("error", () => {
      // close/error handlers produce the public process error response.
    });
    child.stdin.end(JSON.stringify(request));
  });
}
