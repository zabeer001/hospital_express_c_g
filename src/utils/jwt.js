import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { ApiError } from "./api-error.js";

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signature(value) {
  return createHmac("sha256", env.jwtSecret).update(value).digest("base64url");
}

function signToken(payload, ttlSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const body = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ ...payload, iat: now, exp: now + ttlSeconds })}`;
  return `${body}.${signature(body)}`;
}

function verifyToken(token, expectedType) {
  const parts = String(token).split(".");
  if (parts.length !== 3) throw new ApiError(401, "Invalid authentication token");
  const body = `${parts[0]}.${parts[1]}`;
  const actual = Buffer.from(parts[2]);
  const expected = Buffer.from(signature(body));
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new ApiError(401, "Invalid authentication token");
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    throw new ApiError(401, "Invalid authentication token");
  }
  if (payload.exp <= Math.floor(Date.now() / 1000)) throw new ApiError(401, "Authentication token has expired");
  if (payload.type !== expectedType) throw new ApiError(401, "Invalid authentication token type");
  return payload;
}

export { signToken, verifyToken };
