import { sendSuccess } from "../../utils/api-response.js";
import { deleteRoleService, saveRoleService } from "./services/saveRole.access.service.js";
import { listPermissionOptionsService, listRolesService } from "./services/listRoles.access.service.js";
import { createUserService, listUsersService, setUserRolesService } from "./services/users.access.service.js";

export async function listRoles(req, res) {
  return sendSuccess(res, { message: "Roles retrieved successfully", data: await listRolesService() });
}

export async function permissionOptions(req, res) {
  return sendSuccess(res, {
    message: "Permission options retrieved successfully",
    data: await listPermissionOptionsService(),
  });
}

export async function createRole(req, res) {
  return sendSuccess(res, {
    statusCode: 201,
    message: "Role created successfully",
    data: await saveRoleService(undefined, req.body),
  });
}

export async function updateRole(req, res) {
  return sendSuccess(res, {
    message: "Role updated successfully",
    data: await saveRoleService(req.params.id, req.body),
  });
}

export async function deleteRole(req, res) {
  await deleteRoleService(req.params.id);
  return sendSuccess(res, { message: "Role deleted successfully" });
}

export async function listUsers(req, res) {
  return sendSuccess(res, { message: "Users retrieved successfully", data: await listUsersService() });
}

export async function createUser(req, res) {
  return sendSuccess(res, {
    statusCode: 201,
    message: "User created successfully",
    data: await createUserService(req.body),
  });
}

export async function setUserRoles(req, res) {
  return sendSuccess(res, {
    message: "User roles updated successfully",
    data: await setUserRolesService(req.params.id, req.body.roleIds),
  });
}
