import express from "express";
import {
  completePatientVisit,
  createPatient,
  deletePatient,
  getPatient,
  getPatients,
  updatePatient,
} from "../controllers/patient/patient.controller.js";

const router = express.Router();

router.get("/", getPatients);
router.post("/", createPatient);

router.patch("/:id/complete-visit", completePatientVisit);
router.get("/:id", getPatient);
router.patch("/:id", updatePatient);
router.delete("/:id", deletePatient);

export default router;
