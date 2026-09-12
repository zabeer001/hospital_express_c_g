import { prisma } from "../../../config/database.js";
import { toDoctorResponse } from "../../../utils/response-mappers.js";
import { validateDoctor } from "../../../validators/doctor.validator.js";

export async function createDoctorService(body) {
  const data = await validateDoctor(body);
  const doctor = await prisma.doctor.create({ data });
  return toDoctorResponse(doctor);
}
