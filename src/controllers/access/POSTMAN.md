# Postman Testing — Access Controller

Every request requires:

```http
Authorization: Bearer {{accessToken}}
```

Collection variables: `baseUrl`, `accessToken`, `permissionId`, `roleId`, and
`userId`.

## List roles

```http
GET {{baseUrl}}/api/roles
```

Permission: `roles.manage`. Expected: `200` with role `id`, `name`,
`description`, `userCount`, and permission-name array.

## List permissions

```http
GET {{baseUrl}}/api/permissions
```

Permission: `roles.manage`. Expected: `200` with permission records.

```javascript
pm.test("Permissions loaded", () => pm.response.to.have.status(200));
pm.collectionVariables.set("permissionId", pm.response.json().data[0].id);
```

## Create role

```http
POST {{baseUrl}}/api/roles
Content-Type: application/json
```

Permission: `roles.manage`.

```json
{
  "name": "receptionist",
  "description": "Front-desk hospital staff",
  "permissionIds": [{{permissionId}}]
}
```

Expected: `201`.

```javascript
pm.test("Role created", () => pm.response.to.have.status(201));
pm.collectionVariables.set("roleId", pm.response.json().data.id);
```

Role names must start with a letter and contain 2–50 lowercase letters,
numbers, underscores, or hyphens. Errors: `422` invalid input/permission IDs,
`403` protected role, or `409` duplicate name.

## Update role

```http
PATCH {{baseUrl}}/api/roles/{{roleId}}
Content-Type: application/json
```

Permission: `roles.manage`.

```json
{
  "name": "reception_manager",
  "description": "Reception team manager",
  "permissionIds": [{{permissionId}}]
}
```

Expected: `200`. `permissionIds` replaces the existing permission set.
Errors: `404`, `422`, `403` for the protected role, or `409` duplicate name.

## Delete role

```http
DELETE {{baseUrl}}/api/roles/{{roleId}}
```

Permission: `roles.manage`. Expected: `204`.

Errors: `404` missing role, `403` protected role, or `409` while users remain
assigned.

## List users

```http
GET {{baseUrl}}/api/users
```

Permission: `users.manage`. Expected: `200`. Password hashes are never returned.

## Create user

```http
POST {{baseUrl}}/api/users
Content-Type: application/json
```

Permission: `users.manage`.

```json
{
  "name": "API Test User",
  "email": "postman.user@example.com",
  "password": "Postman123!",
  "roleIds": [{{roleId}}]
}
```

Expected: `201`.

```javascript
pm.test("User created", () => pm.response.to.have.status(201));
pm.collectionVariables.set("userId", pm.response.json().data.id);
```

Errors: `422` invalid data/roles, `403` assigning `software_engineer`, or `409`
duplicate email.

## Replace user roles

```http
PATCH {{baseUrl}}/api/users/{{userId}}/roles
Content-Type: application/json
```

Permission: `users.manage`.

```json
{
  "roleIds": [{{roleId}}]
}
```

Expected: `200`. The array replaces all current roles; `[]` removes every role
from a normal user. The protected user's role cannot be changed, and the
protected role cannot be assigned through the API (`403`).

