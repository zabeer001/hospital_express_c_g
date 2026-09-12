import { prisma } from "../../../config/database.js";
import { toPatientResponse } from "../../../utils/response-mappers.js";
import { validateId } from "../../../validators/common.js";
import { validateVisitCompletion } from "../../../validators/patient.validator.js";
import { getPatientService } from "./getPatient.patient.service.js";

export async function completePatientVisitService(id, body) {
  const patientId = await validateId(id);
  await getPatientService(patientId);
  const { completedAt } = await validateVisitCompletion(body);
  const patient = await prisma.patient.update({
    where: { id: patientId },
    data: { visitCompletedAt: completedAt },
    include: { doctor: { select: { name: true, specialization: true } } },
  });
  return toPatientResponse(patient);
}
