# Hospital Management API

Express REST API for the dashboard in `hospital_frontend`. It uses PostgreSQL through Prisma ORM, native ES modules, and follows a route → controller → service → Prisma architecture. Authentication is intentionally not included yet.

## Included services

- API: `http://localhost:4000`
- PostgreSQL: `localhost:5432`
- pgAdmin: `http://localhost:5050`

The Docker defaults are suitable for local development:

- Database: `hospital_management`
- Database user: `hospital_user`
- Database password: `hospital_password`
- pgAdmin login: `admin@example.com` / `admin123`

After signing in to pgAdmin, open the preconfigured **Hospital PostgreSQL** server and enter `hospital_password` when it asks for the database password.

## Start with Docker

```bash
cp .env.example .env
docker compose up --build
```

PostgreSQL runs `database/init.sql` only when its data volume is first created. It creates the tables, constraints, indexes, and sample records used by the dashboard.

## Run API locally

Start only PostgreSQL and pgAdmin:

```bash
docker compose up -d db pgadmin
cp .env.example .env
npm install
npm run prisma:generate
npm run dev
```

To inspect or synchronize the Prisma schema during development:

```bash
npm run prisma:studio
npm run prisma:push
npm run db:seed
```

The seed command uses Laravel-style factory and seeder classes. `DatabaseSeeder`
clears the existing patient/doctor records, then creates 24 doctors and 28
patients with Faker—four frontend pages for each directory.

Prisma uses a multi-file schema configured by `prisma.config.js`. `prisma/schema.prisma` contains the generator and datasource, while models and enums live in their own files under `prisma/models` and `prisma/enums`.

Set this in the frontend environment when its API client is connected:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## CI/CD deployment

Pushes to `main` run the tests in GitHub Actions. Deployment runs directly
from the local `production` helper, so GitHub deployment secrets are not used.
The helper reads the existing VPS connection values from the local `.env`,
then the VPS reads its own `.env.production` (or `.env` fallback) for application
configuration.

The VPS pulls the latest code and recreates only the API container. It uses the
standard `node:22-bookworm-slim` runtime image instead of building a custom image.
Dependencies and the generated Prisma client are stored in a Docker volume and
refreshed only when `package-lock.json`, `prisma.config.js`, or Prisma schema
files change. PostgreSQL is not recreated, restarted, or reseeded.

Use the deployment helper from the project root:

```bash
./cicd/bash.sh local "your commit message"
./cicd/bash.sh production
```

All successful single-record responses use `{ "data": {...} }`. List responses use `{ "data": [...], "meta": {...} }`. Errors use `{ "error": { "message": "...", "details": {...} } }`. Validation uses Laravel-style rule strings through `node-input-validator`; each field in `details` contains an array of messages.

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API and database health |
| POST | `/api/auth/signin` | Sign in and receive access/refresh JWTs |
| POST | `/api/auth/refresh` | Rotate a refresh token |
| GET, POST | `/api/auth/profile`, `/api/auth/signout` | Current user/sign out |
| PATCH | `/api/auth/profile/password` | Change password and revoke sessions |
| GET, POST | `/api/roles` | List/create roles (requires `roles.manage`) |
| PATCH, DELETE | `/api/roles/:id` | Update/delete a role |
| GET | `/api/permissions` | Permission options |
| GET, POST | `/api/users` | List/create users (requires `users.manage`) |
| PATCH | `/api/users/:id/roles` | Replace a user's roles |
| GET, POST | `/api/doctors` | List/create doctors |
| GET, PATCH, DELETE | `/api/doctors/:id` | Doctor CRUD |
| GET | `/api/doctors/:id/patients?upcoming=true` | Doctor schedule/patients |
| GET, POST | `/api/patients` | List/create patients |
| GET, PATCH, DELETE | `/api/patients/:id` | Patient CRUD |
| PATCH | `/api/patients/:id/complete-visit` | Mark a booked visit completed |
| GET | `/api/dashboard/summary` | Dashboard metrics, charts, and recent rows |

Doctor list filters: `search`, `specialization`, `hospital`, `createdFrom`, `createdTo`, `page`, `limit`.

Patient list filters: `search`, `doctorId`, `condition`, `status`, `admittedFrom`, `admittedTo`, `upcoming`, `page`, `limit`.

## Authentication and access control

All doctor, patient, dashboard, role, and user endpoints require
`Authorization: Bearer <accessToken>`. Roles inherit named permissions and the
API middleware remains the final authorization safeguard. Access is global;
there is no branch, outlet, or hospital-based tenancy.

The RBAC seeder creates only the protected `software_engineer` role, grants it
every permission, and creates or updates its account from the real
`SOFTWARE_ENGINEER_*` environment values. This role cannot be edited,
deleted, assigned, or removed through the API. The software engineer creates
the `superadmin` role and all lower roles through the access-management API.
Existing databases must apply `database/migrations/001_add_auth_rbac.sql`.
After the tables exist, `npm run db:seed:rbac` safely seeds only access-control
data; unlike the full database seeder, it does not replace doctors or patients.

Example doctor creation:

```bash
curl -X POST http://localhost:4000/api/doctors \
  -H 'Content-Type: application/json' \
  -d '{"name":"Dr. Ayesha Rahman","specialization":"Cardiology","hospital":"Central Medical Centre","phone":"+880 1700 000 000","email":"ayesha@example.com"}'
```

Example patient creation:

```bash
curl -X POST http://localhost:4000/api/patients \
  -H 'Content-Type: application/json' \
  -d '{"doctorId":1,"name":"Patient Name","age":35,"gender":"Female","phone":"+880 1700 000 001","condition":"Hypertension","status":"Active","admittedAt":"2026-09-12","appointmentAt":"2026-09-14T10:30:00+06:00"}'
```

## Project structure

```text
src/
  config/         environment and Prisma client
  controllers/    domain controllers and one-file-per-use-case services
  middleware/     404 and centralized error responses
  routes/         REST endpoint definitions
  utils/          shared pagination and response helpers
  validators/     Laravel-style request validation rules
prisma/
  schema.prisma   generator and datasource
  models/         one Prisma model per file
  enums/          shared Prisma enums
database/         PostgreSQL schema and seed data
  factories/      Faker-based model factories
  seeders/        domain seeders and the main DatabaseSeeder
pgadmin/          preconfigured local server registration
test/             unit tests
```
