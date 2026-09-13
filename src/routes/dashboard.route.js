import express from "express";
import { getDashboardSummary } from "../controllers/dashboard/dashboard.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.get("/summary", authenticate, authorize("dashboard.view"), getDashboardSummary);

export default router;
