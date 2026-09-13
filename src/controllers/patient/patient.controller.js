import { completePatientVisitService } from "./services/completePatientVisit.patient.service.js";
import { createPatientService } from "./services/createPatient.patient.service.js";
import { deletePatientService } from "./services/deletePatient.patient.service.js";
import { getPatientService } from "./services/getPatient.patient.service.js";
import { getPatientsService } from "./services/getPatients.patient.service.js";
import { updatePatientService } from "./services/updatePatient.patient.service.js";
import { sendSuccess } from "../../utils/api-response.js";

export async function getPatients(req, res) {
  const { data, meta } = await getPatientsService(req.query);
  return sendSuccess(res, {
    message: "Patients retrieved successfully",
    data,
    meta,
  });
}

export async function getPatient(req, res) {
  return sendSuccess(res, {
    message: "Patient retrieved successfully",
    data: await getPatientService(req.params.id),
  });
}

export async function createPatient(req, res) {
  return sendSuccess(res, {
    statusCode: 201,
    message: "Patient created successfully",
    data: await createPatientService(req.body),
  });
}

export async function updatePatient(req, res) {
  return sendSuccess(res, {
    message: "Patient updated successfully",
    data: await updatePatientService(req.params.id, req.body),
  });
}

export async function completePatientVisit(req, res) {
  return sendSuccess(res, {
    message: "Patient visit completed successfully",
    data: await completePatientVisitService(req.params.id, req.body || {}),
  });
}

export async function deletePatient(req, res) {
  await deletePatientService(req.params.id);
  return sendSuccess(res, { message: "Patient deleted successfully" });
}
