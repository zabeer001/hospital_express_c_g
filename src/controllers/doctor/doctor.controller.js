import { sendSuccess } from "../../utils/api-response.js";
import { createDoctorService } from "./services/createDoctor.doctor.service.js";
import { deleteDoctorService } from "./services/deleteDoctor.doctor.service.js";
import { getDoctorService } from "./services/getDoctor.doctor.service.js";
import { getDoctorPatientsService } from "./services/getDoctorPatients.doctor.service.js";
import { getDoctorsService } from "./services/getDoctors.doctor.service.js";
import { updateDoctorService } from "./services/updateDoctor.doctor.service.js";

export async function getDoctors(req, res) {
  const { data, meta } = await getDoctorsService(req.query);
  return sendSuccess(res, {
    message: "Doctors retrieved successfully",
    data,
    meta,
  });
}

export async function getDoctor(req, res) {
  return sendSuccess(res, {
    message: "Doctor retrieved successfully",
    data: await getDoctorService(req.params.id),
  });
}

export async function createDoctor(req, res) {
  return sendSuccess(res, {
    statusCode: 201,
    message: "Doctor created successfully",
    data: await createDoctorService(req.body),
  });
}

export async function updateDoctor(req, res) {
  return sendSuccess(res, {
    message: "Doctor updated successfully",
    data: await updateDoctorService(req.params.id, req.body),
  });
}

export async function deleteDoctor(req, res) {
  await deleteDoctorService(req.params.id);
  return sendSuccess(res, {
    message: "Doctor deleted successfully",
  });
}

export async function getDoctorPatients(req, res) {
  const { data, meta } = await getDoctorPatientsService(req.params.id, req.query);
  return sendSuccess(res, {
    message: "Doctor patients retrieved successfully",
    data,
    meta,
  });
}
