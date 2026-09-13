# Postman Testing — Doctor Controller

Every request requires `Authorization: Bearer {{accessToken}}`.

Collection variables: `baseUrl`, `accessToken`, and `doctorId`.

## List doctors

```http
GET {{baseUrl}}/api/doctors?page=1&limit=20
```

Permission: `doctors.index`. Expected: `200` with `data` and pagination `meta`.

Optional query parameters:

| Parameter | Meaning |
| --- | --- |
| `search` | Case-insensitive name, email, hospital, or specialization search |
| `specialization` | Exact specialization |
| `hospital` | Exact hospital |
| `createdFrom` | Start date as `YYYY-MM-DD` |
| `createdTo` | End date as `YYYY-MM-DD` |
| `page` | Integer at least 1; default 1 |
| `limit` | Integer 1–100; default 100 |

## Create doctor

```http
POST {{baseUrl}}/api/doctors
Content-Type: application/json
```

Permission: `doctors.create`.

```json
{
  "name": "Dr. Postman Test",
  "specialization": "Cardiology",
  "hospital": "Central Medical Centre",
  "phone": "+8801700000000",
  "email": "postman.doctor@example.com"
}
```

`name` and `specialization` are required. `hospital`, `phone`, and `email` are
optional/nullable. Expected: `201`.

```javascript
pm.test("Doctor created", () => pm.response.to.have.status(201));
pm.collectionVariables.set("doctorId", pm.response.json().data.id);
```

Errors: `422` validation failure or `409` duplicate email.

## Get doctor

```http
GET {{baseUrl}}/api/doctors/{{doctorId}}
```

Permission: `doctors.show`. Expected: `200`, including `patientCount` and
`upcomingCount`. Errors: `400` invalid ID or `404 Doctor not found`.

## Update doctor

```http
PATCH {{baseUrl}}/api/doctors/{{doctorId}}
Content-Type: application/json
```

Permission: `doctors.update`.

```json
{
  "hospital": "Updated Medical Centre",
  "phone": "+8801800000000"
}
```

At least one field is required. Use `null` to clear hospital, phone, or email.
Expected: `200`. Errors: `400`, `404`, `422`, or `409` duplicate email.

## Delete doctor

```http
DELETE {{baseUrl}}/api/doctors/{{doctorId}}
```

Permission: `doctors.delete`. Expected: `204`. Returns `409` while bookings
still reference the doctor.

## List doctor's patients

```http
GET {{baseUrl}}/api/doctors/{{doctorId}}/patients?page=1&limit=20&upcoming=true
```

Permission: `patients.index`. Expected: `200` with `data` and pagination `meta`.
`upcoming=true` selects future, incomplete, non-cancelled bookings. Without it,
patients with any booking for the doctor are eligible.

