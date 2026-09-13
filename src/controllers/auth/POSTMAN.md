# Postman Testing — Auth Controller

Collection variables:

| Variable | Value |
| --- | --- |
| `baseUrl` | `http://localhost:4000` |
| `email` | Seeded account email |
| `password` | Seeded account password |
| `accessToken` | Set after sign-in |
| `refreshToken` | Set after sign-in |

## Sign in

```http
POST {{baseUrl}}/api/auth/signin
Content-Type: application/json
```

```json
{
  "email": "{{email}}",
  "password": "{{password}}"
}
```

Expected: `200` with access token, refresh token, expiry, and user permissions.

Tests script:

```javascript
pm.test("Sign-in succeeded", () => pm.response.to.have.status(200));
const body = pm.response.json();
pm.collectionVariables.set("accessToken", body.data.accessToken);
pm.collectionVariables.set("refreshToken", body.data.refreshToken);
```

Errors: `422` invalid input; `401 Invalid email or password` for incorrect,
unknown, or inactive credentials.

## Refresh tokens

```http
POST {{baseUrl}}/api/auth/refresh
Content-Type: application/json
```

```json
{
  "refreshToken": "{{refreshToken}}"
}
```

Expected: `200`. The refresh token is rotated, so save both new tokens:

```javascript
pm.test("Refresh succeeded", () => pm.response.to.have.status(200));
const body = pm.response.json();
pm.collectionVariables.set("accessToken", body.data.accessToken);
pm.collectionVariables.set("refreshToken", body.data.refreshToken);
```

Errors: `401` when missing, malformed, expired, rotated, or revoked.

## Current profile

```http
GET {{baseUrl}}/api/auth/profile
Authorization: Bearer {{accessToken}}
```

Expected: `200` with `id`, `name`, `email`, `isActive`, `roleNames`, and
flattened `permissions`.

## Change password

```http
PATCH {{baseUrl}}/api/auth/profile/password
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

```json
{
  "currentPassword": "{{password}}",
  "password": "NewPassword123!",
  "passwordConfirmation": "NewPassword123!"
}
```

Expected: `204`. The password must have at least 8 characters. Changing it
revokes every session, including the access token used for this request.

Errors: `422` for missing fields, wrong current password, short new password,
or mismatched confirmation.

## Sign out

```http
POST {{baseUrl}}/api/auth/signout
Authorization: Bearer {{accessToken}}
```

Expected: `204`. Reusing this session's access or refresh token returns `401`.

## Authentication checks

- Protected request without a token: `401 Authentication required`.
- Protected request with an invalid/expired/revoked token: `401`.
- Valid authenticated user lacking permission: `403`, handled by the domain
  route after authentication.

