import { prisma } from "../../config/database.js";
import { sendSuccess } from "../../utils/api-response.js";
import { authUserInclude, toAuthUser } from "../../utils/auth-response.js";
import { changePasswordService } from "./services/changePassword.auth.service.js";
import { refreshService } from "./services/refresh.auth.service.js";
import { signInService } from "./services/signIn.auth.service.js";

export async function signIn(req, res) {
  return sendSuccess(res, {
    message: "Signed in successfully",
    data: await signInService(req.body),
  });
}

export async function refresh(req, res) {
  return sendSuccess(res, {
    message: "Token refreshed successfully",
    data: await refreshService(req.body.refreshToken),
  });
}

export async function profile(req, res) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.auth.user.id },
    include: authUserInclude,
  });
  return sendSuccess(res, {
    message: "Profile retrieved successfully",
    data: toAuthUser(user),
  });
}

export async function signOut(req, res) {
  await prisma.authSession.update({
    where: { id: req.auth.sessionId },
    data: { revokedAt: new Date() },
  });
  return sendSuccess(res, { message: "Signed out successfully" });
}

export async function changePassword(req, res) {
  await changePasswordService(req.auth.user, req.body);
  return sendSuccess(res, { message: "Password changed successfully" });
}
