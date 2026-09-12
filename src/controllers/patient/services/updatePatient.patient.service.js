import { prisma } from "../../../config/database.js";
import { ApiError } from "../../../utils/api-error.js";
import { toPatientResponse } from "../../../utils/response-mappers.js";
import { validateId } from "../../../validators/common.js";
import { validatePatient } from "../../../validators/patient.validator.js";
import { getPatientService } from "./getPatient.patient.service.js";
import { ensureDoctorExists } from "./utils/ensureDoctorExists.util.js";

export async function updatePatientService(id, body) {
  const patientId = await validateId(id);
  await getPatientService(patientId);
  const data = await validatePatient(body, { partial: true });

  if (!Object.keys(data).length) {
    throw new ApiError(422, "Provide at least one patient field to update");
  }
  if (data.doctorId) await ensureDoctorExists(data.doctorId);

  const patient = await prisma.patient.update({
    where: { id: patientId },
    data,
    include: { doctor: { select: { name: true, specialization: true } } },
  });
  return toPatientResponse(patient);
}
