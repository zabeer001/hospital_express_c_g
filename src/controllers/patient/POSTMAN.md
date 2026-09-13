# Postman Testing — Patient Controller

Every request requires `Authorization: Bearer {{accessToken}}`.

Collection variables: `baseUrl`, `accessToken`, `doctorId`, and `patientId`.

## List patients

```http
GET {{baseUrl}}/api/patients?page=1&limit=20
```

Permission: `patients.index`. Expected: `200` with `data` and pagination `meta`.

Optional query parameters:

| Parameter | Meaning |
| --- | --- |
| `search` | Patient name, phone, condition, or doctor name |
| `doctorId` | Patients with a booking for this doctor |
| `condition` | Exact condition |
| `status` | Patient status filter |
| `admittedFrom` | Admission start date as `YYYY-MM-DD` |
| `admittedTo` | Admission end date as `YYYY-MM-DD` |
| `upcoming` | Use `true` for future, incomplete, non-cancelled bookings |
| `page` | Integer at least 1; default 1 |
| `limit` | Integer 1–100; default 100 |

## Create patient and booking

```http
POST {{baseUrl}}/api/patients
Content-Type: application/json
```

Permission: `patients.create`.

```json
{
  "doctorId": {{doctorId}},
  "appointmentAt": "2026-10-15T10:30:00+06:00",
  "name": "Postman Patient",
  "age": 35,
  "gender": "Female",
  "phone": "+8801700000001",
   "condition": "Hypertension",
  "status": "Active",
  "admittedAt": null,
  "visitCompletedAt": null
}
```

Required: existing positive `doctorId`, ISO `appointmentAt`, `name`, age 0–120,
and gender `Female`, `Male`, or `Other`.

Optional: nullable `phone`, `condition`, `admittedAt`, `visitCompletedAt`, and
status `Active`, `Monitoring`, or `Recovered`. Expected: `201`.

```javascript
pm.test("Patient created", () => pm.response.to.have.status(201));
pm.collectionVariables.set("patientId", pm.response.json().data.id);
```

Errors: `422` invalid input or missing assigned doctor.

## Get patient

```http
GET {{baseUrl}}/api/patients/{{patientId}}
```

Permission: `patients.show`. Expected: `200`, including latest booking and
doctor details. Errors: `400` invalid ID or `404 Patient not found`.

## Update patient/latest booking

```http
PATCH {{baseUrl}}/api/patients/{{patientId}}
Content-Type: application/json
```

Permission: `patients.update`.

```json
{
  "status": "Monitoring",
  "condition": "Controlled hypertension",
  "appointmentAt": "2026-10-20T11:00:00+06:00"
}
```

At least one field is required. Patient fields update the patient; doctor and
visit fields update the latest booking. Expected: `200`. Errors: `400`, `404`,
`422`, or `409` if a requested booking update has no booking.

## Complete active visit

```http
PATCH {{baseUrl}}/api/patients/{{patientId}}/complete-visit
Content-Type: application/json
```

Permission: `patients.complete-visit`.

Use the current server time:

```json
{}
```

Or provide a time:

```json
{
  "completedAt": "2026-10-20T12:00:00+06:00"
}
```

Expected: `200`; the active booking becomes `Completed`. Errors: `400`, `404`,
`422`, or `409 Patient does not have an active booking to complete`.

## Delete patient

```http
DELETE {{baseUrl}}/api/patients/{{patientId}}
```

Permission: `patients.delete`. Expected: `204` only when no booking references
the patient. Existing booking history causes `409` because the foreign key is
restrictive.

