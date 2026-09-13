import express from "express";
import { documentation, health } from "../controllers/system.controller.js";
import dashboardRouter from "./dashboard.route.js";
import doctorRouter from "./doctor.route.js";
import patientRouter from "./patient.route.js";
import authRouter from "./auth.route.js";
import accessRouter from "./access.route.js";

const apiRouter = express.Router();

apiRouter.get("/", documentation);
apiRouter.get("/health", health);
apiRouter.use("/auth", authRouter);
apiRouter.use(accessRouter);
apiRouter.use("/doctors", doctorRouter);
apiRouter.use("/patients", patientRouter);
apiRouter.use("/dashboard", dashboardRouter);

export default apiRouter;
