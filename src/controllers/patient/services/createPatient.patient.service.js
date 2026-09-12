import { prisma } from "../../../config/database.js";
import { toPatientResponse } from "../../../utils/response-mappers.js";
import { validatePatient } from "../../../validators/patient.validator.js";
import { ensureDoctorExists } from "./utils/ensureDoctorExists.util.js";

export async function createPatientService(body) {
  const data = await validatePatient(body);
  await ensureDoctorExists(data.doctorId);
  const patient = await prisma.patient.create({
    data,
    include: { doctor: { select: { name: true, specialization: true } } },
  });
  return toPatientResponse(patient);
}
