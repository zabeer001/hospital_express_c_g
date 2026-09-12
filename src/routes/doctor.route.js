import express from "express";
import {
  createDoctor,
  deleteDoctor,
  getDoctor,
  getDoctorPatients,
  getDoctors,
  updateDoctor,
} from "../controllers/doctor/doctor.controller.js";

const router = express.Router();

router.get("/", getDoctors);
router.post("/", createDoctor);

router.get("/:id/patients", getDoctorPatients);
router.get("/:id", getDoctor);
router.patch("/:id", updateDoctor);
router.delete("/:id", deleteDoctor);

export default router;
