import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

const databaseUrl = new URL(env.databaseUrl);
if (env.databaseSsl && !databaseUrl.searchParams.has("sslmode")) {
  databaseUrl.searchParams.set("sslmode", "require");
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl.toString() } },
  log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"],
});

export { prisma };
