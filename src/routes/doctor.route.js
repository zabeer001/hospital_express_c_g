import express from "express";
import {
  createDoctor,
  deleteDoctor,
  getDoctor,
  getDoctorPatients,
  getDoctors,
  updateDoctor,
} from "../controllers/doctor/doctor.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();
router.use(authenticate);

router.get("/", authorize("doctors.index"), getDoctors);
router.post("/", authorize("doctors.create"), createDoctor);

router.get("/:id/patients", authorize("patients.index"), getDoctorPatients);
router.get("/:id", authorize("doctors.show"), getDoctor);
router.patch("/:id", authorize("doctors.update"), updateDoctor);
router.delete("/:id", authorize("doctors.delete"), deleteDoctor);

export default router;
