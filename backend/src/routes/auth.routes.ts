import { Router } from "express";
import {
  AuthenticatedRequest,
  authenticate,
} from "../middleware/auth.middleware";
import { successResponse } from "../utils/apiResponse";

const router = Router();

router.get(
  "/me",
  authenticate,
  (req: AuthenticatedRequest, res) => {
    return successResponse(
      res,
      "Authentication successful.",
      {
        uid: req.user?.uid,
        email: req.user?.email ?? null,
        name: req.user?.name ?? null,
      }
    );
  }
);

export default router;