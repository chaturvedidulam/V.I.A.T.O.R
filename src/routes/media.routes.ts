import { Router } from "express";

import { uploadMediaController } from "../controllers/media.controller";
import { authenticate } from "../middleware/auth.middleware";
import { uploadSingleImage } from "../middleware/upload.middleware";

const router = Router();

router.post(
  "/upload",
  authenticate,
  uploadSingleImage,
  uploadMediaController
);

export default router;