import express from "express";
import {
  completePatientVisit,
  createPatient,
  deletePatient,
  getPatient,
  getPatients,
  updatePatient,
} from "../controllers/patient/patient.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();
router.use(authenticate);

router.get("/", authorize("patients.index"), getPatients);
router.post("/", authorize("patients.create"), createPatient);

router.patch("/:id/complete-visit", authorize("patients.complete-visit"), completePatientVisit);
router.get("/:id", authorize("patients.show"), getPatient);
router.patch("/:id", authorize("patients.update"), updatePatient);
router.delete("/:id", authorize("patients.delete"), deletePatient);

export default router;
