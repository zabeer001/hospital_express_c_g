# Postman Testing — Controller Index

Use `http://localhost:4000` locally or
`https://apihospital.officexyztest.sbs` in production as `{{baseUrl}}`.

Controller-specific guides:

- [Auth controller](auth/POSTMAN.md)
- [Access controller](access/POSTMAN.md)
- [Doctor controller](doctor/POSTMAN.md)
- [Patient controller](patient/POSTMAN.md)
- [Dashboard controller](dashboard/POSTMAN.md)

## System controller

System endpoints do not require authentication.

### API information

```http
GET {{baseUrl}}/
```

Expected: `200`

```json
{
  "name": "Hospital tracker API",
  "version": "1.0.0",
  "documentation": "/api"
}
```

### Endpoint index

```http
GET {{baseUrl}}/api
```

Expected: `200` with an `endpoints` object.

### Health check

```http
GET {{baseUrl}}/api/health
```

Expected: `200`

```json
{
  "data": {
    "status": "ok",
    "database": "connected"
  }
}
```

The health endpoint executes a database query, so it verifies Express and
PostgreSQL connectivity.

## Common status codes

| Status | Meaning |
| --- | --- |
| `200` | Successful read, update, or action |
| `201` | Resource created |
| `204` | Successful operation with no response body |
| `400` | Invalid identifier or pagination |
| `401` | Authentication missing, invalid, expired, or revoked |
| `403` | Authenticated user lacks permission |
| `404` | Route or resource not found |
| `409` | Database or resource-state conflict |
| `422` | Request validation failed |
| `500` | Unexpected backend/database error; inspect API logs |

