import { prisma } from "../../../config/database.js";
import { validateId } from "../../../validators/common.js";
import { getDoctorService } from "./getDoctor.doctor.service.js";

export async function deleteDoctorService(id) {
  const doctorId = await validateId(id);
  await getDoctorService(doctorId);
  await prisma.doctor.delete({ where: { id: doctorId } });
}
