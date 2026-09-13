import { prisma } from "../../../config/database.js";
import { ApiError } from "../../../utils/api-error.js";
import { hashPassword, verifyPassword } from "../../../utils/password.js";
import { validatePasswordChange } from "../../../validators/auth.validator.js";

export async function changePasswordService(user, body) {
  const data = await validatePasswordChange(body);
  if (!(await verifyPassword(data.currentPassword, user.passwordHash)))
    throw new ApiError(422, "Current password is incorrect");
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(data.password) },
    }),
    prisma.authSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}
