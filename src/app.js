import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { notFound } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";
import apiRouter from "./routes/api.route.js";
import rootRouter from "./routes/root.route.js";

const app = express();

app.disable("x-powered-by");
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes("*") || env.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    const error = new Error("Origin is not allowed by CORS");
    error.status = 403;
    return callback(error);
  },
}));
app.use(express.json({ limit: "1mb" }));

app.use("/", rootRouter);
app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);

export { app };
