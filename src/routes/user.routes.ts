import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";
import { getCurrentUser, updateCurrentUserBio } from "../controllers/user.controller";

const router = Router();

router.get(
  "/me",
  authenticate,
  getCurrentUser
);

router.patch(
  "/me",
  authenticate,
  updateCurrentUserBio
);

export default router;
