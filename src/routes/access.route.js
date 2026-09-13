import express from "express";
import { createRole, createUser, deleteRole, listRoles, listUsers, permissionOptions, setUserRoles, updateRole } from "../controllers/access/access.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();
router.use(authenticate);
router.get("/roles", authorize("roles.manage"), listRoles);
router.get("/permissions", authorize("roles.manage"), permissionOptions);
router.post("/roles", authorize("roles.manage"), createRole);
router.patch("/roles/:id", authorize("roles.manage"), updateRole);
router.delete("/roles/:id", authorize("roles.manage"), deleteRole);
router.get("/users", authorize("users.manage"), listUsers);
router.post("/users", authorize("users.manage"), createUser);
router.patch("/users/:id/roles", authorize("users.manage"), setUserRoles);

export default router;
