import { getFirebaseAuth } from "@/lib/firebase";

export const delay = (ms = 600) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] || "http://localhost:5000/api/v1";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string) {
    super(message);
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, "body" | "headers"> {
  body?: BodyInit | Record<string, unknown>;
  headers?: HeadersInit;
  authentication?: boolean;
}

export async function apiRequest<T>(
  path: string,
  { body, headers: suppliedHeaders, authentication = true, ...options }: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(suppliedHeaders);

  if (authentication) {
    const user = getFirebaseAuth().currentUser;
    if (!user) throw new ApiError("Please sign in to continue.", 401);
    headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  }

  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    requestBody = typeof body === "string" ? body : JSON.stringify(body);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, body: requestBody ?? null });
  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | { message?: string; error?: { code?: string } }
    | null;

  if (!response.ok) {
    throw new ApiError(
      payload?.message || "Unable to complete the request.",
      response.status,
      payload && "error" in payload ? payload.error?.code : undefined,
    );
  }

  return (payload as ApiEnvelope<T>).data;
}
