import { createDoctorService } from "./services/createDoctor.doctor.service.js";
import { deleteDoctorService } from "./services/deleteDoctor.doctor.service.js";
import { getDoctorService } from "./services/getDoctor.doctor.service.js";
import { getDoctorPatientsService } from "./services/getDoctorPatients.doctor.service.js";
import { getDoctorsService } from "./services/getDoctors.doctor.service.js";
import { updateDoctorService } from "./services/updateDoctor.doctor.service.js";

export async function getDoctors(req, res) {
  res.json(await getDoctorsService(req.query));
}

export async function getDoctor(req, res) {
  res.json({ data: await getDoctorService(req.params.id) });
}

export async function createDoctor(req, res) {
  res.status(201).json({ data: await createDoctorService(req.body) });
}

export async function updateDoctor(req, res) {
  res.json({ data: await updateDoctorService(req.params.id, req.body) });
}

export async function deleteDoctor(req, res) {
  await deleteDoctorService(req.params.id);
  res.status(204).send();
}

export async function getDoctorPatients(req, res) {
  res.json(await getDoctorPatientsService(req.params.id, req.query));
}
