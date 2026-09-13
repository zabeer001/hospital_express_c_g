# Postman Testing — Dashboard Controller

Collection variables: `baseUrl` and `accessToken`.

## Dashboard summary

```http
GET {{baseUrl}}/api/dashboard/summary
Authorization: Bearer {{accessToken}}
```

Permission: `dashboard.view`.

Expected: `200`

```json
{
  "data": {
    "metrics": {
      "totalDoctors": 10,
      "totalPatients": 28,
      "activePatients": 20,
      "newThisMonth": 4
    },
    "patientStatuses": [
      { "status": "Active", "count": 20 }
    ],
    "topConditions": [
      { "condition": "Hypertension", "count": 5 }
    ],
    "monthlyAdmissions": [
      { "month": "2026-09", "count": 4 }
    ],
    "busiestDoctors": [
      {
        "id": 1,
        "name": "Dr. Ayesha Rahman",
        "specialization": "Cardiology",
        "patientCount": 3
      }
    ],
    "recentPatients": []
  }
}
```

`monthlyAdmissions` contains the latest six UTC months.

Failure checks:

- No/invalid/expired token: `401`.
- Valid user without `dashboard.view`: `403`.
- `500` indicates an unexpected backend/database error, not an authorization
  failure; inspect `docker logs --tail 100 prod_express_api`.

