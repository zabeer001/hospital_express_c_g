import { completePatientVisitService } from "./services/completePatientVisit.patient.service.js";
import { createPatientService } from "./services/createPatient.patient.service.js";
import { deletePatientService } from "./services/deletePatient.patient.service.js";
import { getPatientService } from "./services/getPatient.patient.service.js";
import { getPatientsService } from "./services/getPatients.patient.service.js";
import { updatePatientService } from "./services/updatePatient.patient.service.js";

export async function getPatients(req, res) {
  res.json(await getPatientsService(req.query));
}

export async function getPatient(req, res) {
  res.json({ data: await getPatientService(req.params.id) });
}

export async function createPatient(req, res) {
  res.status(201).json({ data: await createPatientService(req.body) });
}

export async function updatePatient(req, res) {
  res.json({ data: await updatePatientService(req.params.id, req.body) });
}

export async function completePatientVisit(req, res) {
  res.json({ data: await completePatientVisitService(req.params.id, req.body || {}) });
}

export async function deletePatient(req, res) {
  await deletePatientService(req.params.id);
  res.status(204).send();
}
