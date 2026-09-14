# Local Development Setup

This guide explains how to run the Hospital Backend locally for the first time with Docker.

## Prerequisites

Install these tools before starting:

- Git
- Docker Engine or Docker Desktop
- Docker Compose v2 (`docker compose`)

Node.js and PostgreSQL do not need to be installed on the host when using the Docker workflow below. The API container uses Node.js 22, and the database container uses PostgreSQL 16.

Run every command in this guide from the backend project root (the directory that contains `package.json` and `docker-compose.local.yml`).

## First-time setup with Docker

### 1. Clone the repository and enter it

```bash
git clone <repository-url>
cd hospital_backend
```

If the repository is already cloned, just open a terminal in the backend project root.

### 2. Create the local environment file

```bash
cp .env.example .env
```

Review `.env` before continuing. At minimum, check these values:

```env
PORT=4000
POSTGRES_DB=hospital_management
POSTGRES_USER=hospital_user
POSTGRES_PASSWORD=your_local_database_password
POSTGRES_PORT=5432
PGADMIN_PORT=5050
SOFTWARE_ENGINEER_NAME="Software Engineer"
SOFTWARE_ENGINEER_EMAIL=engineer@hospital.local
SOFTWARE_ENGINEER_PASSWORD="Engineer123!"
```

Do not commit `.env`. The three `SOFTWARE_ENGINEER_*` values are optional, but all three must be provided together if you want the initial protected login account.

### 3. Start PostgreSQL first

```bash
docker compose --env-file .env -f docker-compose.local.yml up -d --wait db
```

On the first start, PostgreSQL runs `database/init.sql` automatically. It creates the current tables, indexes, permissions, roles, and sample hospital records.

Important: `database/init.sql` runs only when the PostgreSQL Docker volume is empty. Restarting the containers does not run it again.

### 4. Install the Node.js packages inside Docker

The local Compose file stores `node_modules` in a Docker volume. Populate it with:

```bash
docker compose --env-file .env -f docker-compose.local.yml run --rm --no-deps --user root api npm ci
```

You do not need to run `npm install` on the host for the Docker-only workflow.

### 5. Generate the Prisma client

Prisma generation creates application client code; it does not create database tables.

```bash
docker compose --env-file .env -f docker-compose.local.yml run --rm --no-deps --user root api npm run prisma:generate
```

### 6. Synchronize the local database schema

A brand-new database is already created by `database/init.sql`, so this should normally report that the database is in sync:

```bash
docker compose --env-file .env -f docker-compose.local.yml run --rm api npm run prisma:push
```

This project currently uses `prisma db push` for local schema synchronization and ordered SQL files under `database/migrations` for deployed databases. Do not use `prisma:push` against production.

Read Prisma's output before accepting any destructive schema change. If it warns about data loss, stop and confirm that the change is intended.

### 7. Seed access-control data and the local login account

```bash
docker compose --env-file .env -f docker-compose.local.yml run --rm api npm run db:seed:rbac
```

This command safely synchronizes permissions and roles. It also creates or updates the protected software-engineer account when all three `SOFTWARE_ENGINEER_*` values exist in `.env`.

Do not confuse it with the full development seeder:

```bash
docker compose --env-file .env -f docker-compose.local.yml run --rm api npm run db:seed
```

The full seeder deletes and recreates the booking, patient, and doctor development data. Run it only when replacing that local data is intentional.

### 8. Start the complete application

```bash
docker compose --env-file .env -f docker-compose.local.yml up -d
```

The local services are now available at:

| Service | Address |
| --- | --- |
| API | `http://localhost:4000` |
| Health check | `http://localhost:4000/api/health` |
| pgAdmin | `http://localhost:5050` |
| PostgreSQL from the host | `localhost:5432` |

If you changed `PORT`, `PGADMIN_PORT`, or `POSTGRES_PORT` in `.env`, use those values instead.

Check the containers and API health:

```bash
docker compose --env-file .env -f docker-compose.local.yml ps
curl http://localhost:4000/api/health
```

## Enter a running container

Open a shell in the API container:

```bash
docker compose --env-file .env -f docker-compose.local.yml exec api sh
```

Inside that shell, `/app` is the project working directory. For example:

```bash
npm run db:seed:rbac
exit
```

The running API container normally uses the unprivileged `node` user. If Prisma needs to write a regenerated client into the shared `node_modules` volume, run it as root from the host:

```bash
docker compose --env-file .env -f docker-compose.local.yml exec --user root api npm run prisma:generate
```

Open PostgreSQL's `psql` shell directly:

```bash
docker compose --env-file .env -f docker-compose.local.yml exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Useful `psql` commands:

```text
\dt     list tables
\d User describe the User table
\q      exit psql
```

## Normal daily workflow

Start all services:

```bash
docker compose --env-file .env -f docker-compose.local.yml up -d
```

Follow API logs:

```bash
docker compose --env-file .env -f docker-compose.local.yml logs -f api
```

Stop the services without deleting data:

```bash
docker compose --env-file .env -f docker-compose.local.yml down
```

Restart the API:

```bash
docker compose --env-file .env -f docker-compose.local.yml restart api
```

After changing `package.json` or `package-lock.json`, reinstall packages in the Docker volume and restart the API:

```bash
docker compose --env-file .env -f docker-compose.local.yml run --rm --no-deps --user root api npm ci
docker compose --env-file .env -f docker-compose.local.yml restart api
```

After changing files under `prisma/`, regenerate the client, synchronize the local database, and restart the API:

```bash
docker compose --env-file .env -f docker-compose.local.yml run --rm --no-deps --user root api npm run prisma:generate
docker compose --env-file .env -f docker-compose.local.yml run --rm api npm run prisma:push
docker compose --env-file .env -f docker-compose.local.yml restart api
```

## pgAdmin connection

Sign in at `http://localhost:5050` using `PGADMIN_DEFAULT_EMAIL` and `PGADMIN_DEFAULT_PASSWORD` from `.env`.

The **Hospital PostgreSQL** server is preconfigured. When prompted for the database password, enter `POSTGRES_PASSWORD` from `.env`.

When connecting from one Docker container to another, PostgreSQL uses these values:

```text
Host: db
Port: 5432
Database: value of POSTGRES_DB
Username: value of POSTGRES_USER
Password: value of POSTGRES_PASSWORD
```

Do not use `localhost` as the database host from inside the API or pgAdmin containers; `localhost` would refer to that same container. The Compose service hostname is `db`.

## Reset the local database completely

Warning: the following command permanently deletes the local PostgreSQL data, pgAdmin data, and installed `node_modules` Docker volumes for this Compose project:

```bash
docker compose --env-file .env -f docker-compose.local.yml down -v
```

After deleting the volumes, repeat the first-time setup from step 3. PostgreSQL will run `database/init.sql` again, and the Node dependencies must be installed again.

## Common problems

### API exits with a missing-package error

The `api_node_modules` Docker volume is empty or outdated. Repeat steps 4 and 5, then start or restart the API.

### Port is already in use

Change the conflicting host port in `.env`, for example:

```env
PORT=4001
POSTGRES_PORT=5433
PGADMIN_PORT=5051
```

Then recreate the services with `docker compose ... up -d`.

### Database changes do not appear after editing `init.sql`

That file runs only for a new PostgreSQL volume. For normal local model changes, update the Prisma schema and run `npm run prisma:push` through Compose. To rebuild a disposable local database from `init.sql`, use the destructive reset procedure above.

### View container logs

```bash
docker compose --env-file .env -f docker-compose.local.yml logs --tail 100 api
docker compose --env-file .env -f docker-compose.local.yml logs --tail 100 db
```

NOTE: INSIDE CONTAINER PERMISSION ERROR 

docker exec -it --user root hospital_express_api sh 

USE this command. 
