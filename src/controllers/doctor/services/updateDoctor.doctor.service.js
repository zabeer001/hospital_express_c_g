import { prisma } from "../../../config/database.js";
import { ApiError } from "../../../utils/api-error.js";
import { toDoctorResponse } from "../../../utils/response-mappers.js";
import { validateId } from "../../../validators/common.js";
import { validateDoctor } from "../../../validators/doctor.validator.js";
import { getDoctorService } from "./getDoctor.doctor.service.js";

export async function updateDoctorService(id, body) {
  const doctorId = await validateId(id);
  await getDoctorService(doctorId);
  const data = await validateDoctor(body, { partial: true });

  if (!Object.keys(data).length) {
    throw new ApiError(422, "Provide at least one doctor field to update");
  }

  const doctor = await prisma.doctor.update({ where: { id: doctorId }, data });
  return toDoctorResponse(doctor);
}
