INSERT INTO "Permission" ("name") VALUES
  ('bookings.index'),
  ('bookings.show'),
  ('bookings.create'),
  ('bookings.update'),
  ('bookings.delete')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" AS role
CROSS JOIN "Permission" AS permission
WHERE role."name" = 'software_engineer'
  AND permission."name" LIKE 'bookings.%'
ON CONFLICT DO NOTHING;
