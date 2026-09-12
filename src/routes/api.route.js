import express from "express";
import { documentation, health } from "../controllers/system.controller.js";
import dashboardRouter from "./dashboard.route.js";
import doctorRouter from "./doctor.route.js";
import patientRouter from "./patient.route.js";

const apiRouter = express.Router();

apiRouter.get("/", documentation);
apiRouter.get("/health", health);
apiRouter.use("/doctors", doctorRouter);
apiRouter.use("/patients", patientRouter);
apiRouter.use("/dashboard", dashboardRouter);

export default apiRouter;
