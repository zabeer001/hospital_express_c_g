import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";

async function start() {
  await prisma.$connect();
  const server = app.listen(env.port, () => {
    console.log(`Hospital API listening on http://localhost:${env.port}`);
  });

  async function shutdown(signal) {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch(async (error) => {
  console.error("Unable to start API", error);
  await prisma.$disconnect();
  process.exit(1);
});
