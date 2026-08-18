import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import mediaRoutes from "./routes/media.routes";

import { env } from "./config/env";
import healthRoutes from "./routes/health.routes";

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/media", mediaRoutes);

app.listen(env.port, () => {
  console.log(
    `VIATOR backend running on http://localhost:${env.port}`
  );
});