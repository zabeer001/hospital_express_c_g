import { prisma } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";
import { authUserInclude, toAuthUser } from "../utils/auth-response.js";
import { verifyToken } from "../utils/jwt.js";

async function authenticate(req, res, next) {
  try {
    const [scheme, token] = String(req.headers.authorization || "").split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) throw new ApiError(401, "Authentication required");
    const payload = verifyToken(token, "access");
    const session = await prisma.authSession.findFirst({
      where: { id: payload.sid, userId: Number(payload.sub), revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: { include: authUserInclude } },
    });
    if (!session || !session.user.isActive) throw new ApiError(401, "Authentication session is no longer active");
    req.auth = { sessionId: session.id, user: session.user, authorization: toAuthUser(session.user) };
    next();
  } catch (error) {
    next(error);
  }
}

export { authenticate };
