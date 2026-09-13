import { createHash, randomUUID } from "node:crypto";
import { prisma } from "../../../config/database.js";
import { env } from "../../../config/env.js";
import { ApiError } from "../../../utils/api-error.js";
import { authUserInclude, toAuthUser } from "../../../utils/auth-response.js";
import { signToken } from "../../../utils/jwt.js";
import { verifyPassword } from "../../../utils/password.js";
import { validateSignIn } from "../../../validators/auth.validator.js";

function tokenHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function signInService(body) {
  const credentials = await validateSignIn(body);
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
    include: authUserInclude,
  });
  if (
    !user ||
    !user.isActive ||
    !(await verifyPassword(credentials.password, user.passwordHash))
  ) {
    throw new ApiError(401, "Invalid email or password");
  }

  const sid = randomUUID();
  const base = { sub: String(user.id), sid };
  const accessToken = signToken(
    { ...base, type: "access" },
    env.jwtAccessTtlSeconds,
  );
  const refreshToken = signToken(
    { ...base, type: "refresh" },
    env.jwtRefreshTtlSeconds,
  );
  await prisma.authSession.create({
    data: {
      id: sid,
      userId: user.id,
      tokenHash: tokenHash(refreshToken),
      expiresAt: new Date(Date.now() + env.jwtRefreshTtlSeconds * 1000),
    },
  });

  return {
    accessToken,
    refreshToken,
    tokenType: "Bearer",
    expiresIn: env.jwtAccessTtlSeconds,
    user: toAuthUser(user),
  };
}

export { tokenHash };
