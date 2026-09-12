import { prisma } from "../../../config/database.js";
import { validateId } from "../../../validators/common.js";
import { getPatientService } from "./getPatient.patient.service.js";

export async function deletePatientService(id) {
  const patientId = await validateId(id);
  await getPatientService(patientId);
  await prisma.patient.delete({ where: { id: patientId } });
}
