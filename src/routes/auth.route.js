import express from "express";
import { changePassword, profile, refresh, signIn, signOut } from "../controllers/auth/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.post("/signin", signIn);
router.post("/refresh", refresh);
router.get("/profile", authenticate, profile);
router.post("/signout", authenticate, signOut);
router.patch("/profile/password", authenticate, changePassword);

export default router;
