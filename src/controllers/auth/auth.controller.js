import { prisma } from "../../config/database.js";
import { authUserInclude, toAuthUser } from "../../utils/auth-response.js";
import { changePasswordService } from "./services/changePassword.auth.service.js";
import { refreshService } from "./services/refresh.auth.service.js";
import { signInService } from "./services/signIn.auth.service.js";

export async function signIn(req, res) {
  res.json({ data: await signInService(req.body) });
}

export async function refresh(req, res) {
  res.json({ data: await refreshService(req.body.refreshToken) });
}

export async function profile(req, res) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.auth.user.id },
    include: authUserInclude,
  });
  res.json({ data: toAuthUser(user) });
}

export async function signOut(req, res) {
  await prisma.authSession.update({
    where: { id: req.auth.sessionId },
    data: { revokedAt: new Date() },
  });
  res.status(204).send();
}

export async function changePassword(req, res) {
  await changePasswordService(req.auth.user, req.body);
  res.status(204).send();
}
