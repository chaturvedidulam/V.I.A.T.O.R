import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";
import { getCurrentUser, updateCurrentUserBio } from "../controllers/user.controller";
import { getCurrentUserSavesController } from "../controllers/save.controller";

const router = Router();

router.get(
  "/me",
  authenticate,
  getCurrentUser
);

router.get(
  "/me/saves",
  authenticate,
  getCurrentUserSavesController
);

router.patch(
  "/me",
  authenticate,
  updateCurrentUserBio
);

export default router;
