import { deleteRoleService, saveRoleService } from "./services/saveRole.access.service.js";
import { listPermissionOptionsService, listRolesService } from "./services/listRoles.access.service.js";
import { createUserService, listUsersService, setUserRolesService } from "./services/users.access.service.js";

export async function listRoles(req, res) { res.json({ data: await listRolesService() }); }
export async function permissionOptions(req, res) { res.json({ data: await listPermissionOptionsService() }); }
export async function createRole(req, res) { res.status(201).json({ data: await saveRoleService(undefined, req.body) }); }
export async function updateRole(req, res) { res.json({ data: await saveRoleService(req.params.id, req.body) }); }
export async function deleteRole(req, res) { await deleteRoleService(req.params.id); res.status(204).send(); }
export async function listUsers(req, res) { res.json({ data: await listUsersService() }); }
export async function createUser(req, res) { res.status(201).json({ data: await createUserService(req.body) }); }
export async function setUserRoles(req, res) { res.json({ data: await setUserRolesService(req.params.id, req.body.roleIds) }); }
