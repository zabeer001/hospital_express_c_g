# Postman Testing — Booking Controller

Use collection variables `baseUrl`, `accessToken`, `bookingId`, `patientId`, and
`doctorId`. Select Bearer Token authorization with `{{accessToken}}`.

## List bookings

```http
GET {{baseUrl}}/api/bookings?page=1&limit=20
```

Permission: `bookings.index`. Optional filters are `search`, `patientId`,
`doctorId`, `status`, `appointmentFrom`, and `appointmentTo`. Appointment dates
use `YYYY-MM-DD`; status is one of `Pending`, `Confirmed`, `Admitted`,
`Completed`, or `Cancelled`.

## Create booking

```http
POST {{baseUrl}}/api/bookings
Content-Type: application/json
```

```json
{
  "patientId": {{patientId}},
  "doctorId": {{doctorId}},
  "appointmentAt": "2026-09-20T10:30:00+06:00",
  "condition": "Follow-up consultation",
  "status": "Confirmed"
}
```

Permission: `bookings.create`. Expected status: `201`.

Post-response script:

```javascript
pm.test("Booking created", () => pm.response.to.have.status(201));
pm.collectionVariables.set("bookingId", pm.response.json().data.id);
```

## Get booking

```http
GET {{baseUrl}}/api/bookings/{{bookingId}}
```

Permission: `bookings.show`. Expected status: `200`.

## Update or cancel booking

```http
PATCH {{baseUrl}}/api/bookings/{{bookingId}}
Content-Type: application/json
```

```json
{
  "status": "Cancelled"
}
```

Permission: `bookings.update`. At least one booking field is required.

## Delete booking

```http
DELETE {{baseUrl}}/api/bookings/{{bookingId}}
```

Permission: `bookings.delete`. Expected status: `200` with a success message.
