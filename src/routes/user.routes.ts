import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";
import { getCurrentUser } from "../controllers/user.controller";

const router = Router();

router.get(
  "/me",
  authenticate,
  getCurrentUser
);

export default router;