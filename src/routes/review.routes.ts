import { Router } from "express";

import {
  createPOIReviewController,
  deleteReviewController,
  getPOIReviewsController,
  updateReviewController,
} from "../controllers/review.controller";
import { authenticate } from "../middleware/auth.middleware";

export const poiReviewRoutes = Router({ mergeParams: true });

poiReviewRoutes.get("/", getPOIReviewsController);
poiReviewRoutes.post("/", authenticate, createPOIReviewController);

const router = Router();

router.patch("/:id", authenticate, updateReviewController);
router.delete("/:id", authenticate, deleteReviewController);

export default router;
