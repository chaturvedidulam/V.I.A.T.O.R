import { Router } from "express";

import {
  getAllPOIsController,
  getPOIByIdController,
} from "../controllers/poi.controller";
import { createPOISaveController, deletePOISaveController } from "../controllers/save.controller";
import { authenticate } from "../middleware/auth.middleware";
import { poiReviewRoutes } from "./review.routes";

const router = Router();

router.get("/", getAllPOIsController);
router.use("/:id/reviews", poiReviewRoutes);
router.post("/:id/save", authenticate, createPOISaveController);
router.delete("/:id/save", authenticate, deletePOISaveController);
router.get("/:id", getPOIByIdController);

export default router;
