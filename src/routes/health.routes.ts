import { Router } from "express";
import { successResponse } from "../utils/apiResponse";

const router = Router();

router.get("/", (_req, res) => {
  return successResponse(
    res,
    "VIATOR backend is healthy.",
    {
      service: "viator-backend",
      status: "healthy",
    },
    200
  );
});

export default router;