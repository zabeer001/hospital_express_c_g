import { randomUUID } from "node:crypto";
import { prisma } from "../../../config/database.js";
import { env } from "../../../config/env.js";
import { ApiError } from "../../../utils/api-error.js";
import { signToken, verifyToken } from "../../../utils/jwt.js";
import { tokenHash } from "./signIn.auth.service.js";

export async function refreshService(refreshToken) {
  if (!refreshToken) throw new ApiError(401, "Refresh token is required");
  const payload = verifyToken(refreshToken, "refresh");
  const session = await prisma.authSession.findFirst({
    where: {
      id: payload.sid,
      userId: Number(payload.sub),
      tokenHash: tokenHash(refreshToken),
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });
  if (!session || !session.user.isActive)
    throw new ApiError(401, "Invalid refresh token");

  const base = { sub: String(session.userId), sid: session.id };
  const accessToken = signToken(
    { ...base, type: "access" },
    env.jwtAccessTtlSeconds,
  );
  const nextRefreshToken = signToken(
    { ...base, type: "refresh", nonce: randomUUID() },
    env.jwtRefreshTtlSeconds,
  );
  await prisma.authSession.update({
    where: { id: session.id },
    data: { tokenHash: tokenHash(nextRefreshToken) },
  });
  return {
    accessToken,
    refreshToken: nextRefreshToken,
    tokenType: "Bearer",
    expiresIn: env.jwtAccessTtlSeconds,
  };
}
