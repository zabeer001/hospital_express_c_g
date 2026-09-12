import { prisma } from "../../../config/database.js";
import { ApiError } from "../../../utils/api-error.js";
import { toPatientResponse } from "../../../utils/response-mappers.js";
import { validateId } from "../../../validators/common.js";

export async function getPatientService(id) {
  const patientId = await validateId(id);
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { doctor: { select: { name: true, specialization: true } } },
  });

  if (!patient) throw new ApiError(404, "Patient not found");
  return toPatientResponse(patient);
}
