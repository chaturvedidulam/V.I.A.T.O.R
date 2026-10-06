import { Router } from "express";
import { planRouteController } from "../controllers/route.controller";

const router = Router();

router.post("/plan", planRouteController);

export default router;
