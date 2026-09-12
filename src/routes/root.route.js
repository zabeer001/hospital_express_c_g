import express from "express";
import { info } from "../controllers/system.controller.js";

const rootRouter = express.Router();

rootRouter.get("/", info);

export default rootRouter;
