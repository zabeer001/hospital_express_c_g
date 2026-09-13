import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function booleanValue(value, fallback = false) {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === "true";
}

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  requestTimeoutMs: positiveInteger(process.env.REQUEST_TIMEOUT_MS, 10000),
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://hospital_user:hospital_password@localhost:5432/hospital_management",
  databaseSsl: booleanValue(process.env.DATABASE_SSL),
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || "development-only-change-this-secret",
  jwtAccessTtlSeconds: positiveInteger(process.env.JWT_ACCESS_TTL_SECONDS, 900),
  jwtRefreshTtlSeconds: positiveInteger(process.env.JWT_REFRESH_TTL_SECONDS, 2592000),
};

if (env.nodeEnv === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required in production");
}

export { env };
