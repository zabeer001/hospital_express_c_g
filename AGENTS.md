# Hospital Backend — Codex Project Instructions

## Project Stack

- Node.js with native ES modules.
- Express provides the HTTP API.
- Prisma ORM connects to PostgreSQL.
- Request flow follows route → controller → service → Prisma.
- Validation lives in `src/validators`.
- Database factories and seeders live under `database`.
- Tests use the built-in Node.js test runner.

## Working Style

- Codex may inspect and edit project files.
- Keep changes focused on the user's request.
- When the user has not provided a file path, ask where the relevant file is instead of searching the repository for it.
- When the user provides a file path, work directly with that file.

## Tracing an API Request

- Treat a user-provided API URL as a relevant path. Extract its path and do not ask for a file path.
- Example: for `http://localhost:4000/api/doctors/1`, start with `/api/doctors/:id`.
- Find the matching route under `src/routes`.
- Follow the route to its controller under `src/controllers`.
- Follow the controller to the exact domain service that implements the operation.
- Inspect the related request validator, Prisma model, response mapper, and error handling when relevant.
- Use this order when diagnosing or changing an API-backed feature:
  1. HTTP method and API path
  2. API router and route definition
  3. Controller method
  4. Domain service
  5. Request validator
  6. Prisma model and relations
  7. Response mapper and error middleware
- Do not guess behavior from the URL alone; verify the complete request flow.
- Backend validation is the final safeguard even when a frontend also validates input.

## Express Conventions

- Keep route handlers thin and delegate business logic to domain services.
- Keep one service file per use case, following the existing naming convention.
- Use `next(error)` or the project's established async error flow rather than swallowing errors.
- Return responses through the existing response-mapping conventions.
- Throw `ApiError` for expected client-facing errors.
- Keep shared middleware and utilities domain-neutral.
- Use the shared Prisma client from `src/config/database.js` in application code.
- Preserve native ES module imports, including `.js` file extensions.

## Prisma and Database Conventions

- Keep the generator and datasource in `prisma/schema.prisma`.
- Keep each Prisma model in its own file under `prisma/models` and shared enums under `prisma/enums`.
- Keep reusable fake-data builders under `database/factories`.
- Keep model-specific seeders under `database/seeders` and use `DatabaseSeeder.js` as the main orchestrator.
- Seeders must respect relation order and foreign-key constraints.
- Do not run migrations, schema pushes, resets, or seeders without explicit permission.

## Commands Requiring Explicit Permission

Do not automatically run builds, tests, migrations, seeders, deployments, dependency installation or update commands, Docker rebuild or restart commands, or any other heavy or long-running command.

Only run one of these commands when the user explicitly asks for that specific action.

Restricted examples include, but are not limited to:

- `npm install`
- `npm update`
- `npm audit fix`
- `npm run db:seed`
- `npm run prisma:generate`
- `npm run prisma:push`
- `npx prisma generate`
- `npx prisma migrate dev`
- `npx prisma db push`
- `npx prisma db seed`
- `npx prisma migrate reset`
- `npm test`
- `npm run build`
- `npm run dev`
- `docker compose build`
- `docker compose up`
- `docker compose down`
- `docker compose restart`
- `docker compose exec ... npm run db:seed`
- deployment commands
- dependency installation or update commands
- broad formatting, linting, code-generation, or validation commands

Permission for one command does not imply permission for another command or for future runs of the same command.

## After Editing

- Do not automatically verify changes with restricted commands.
- Briefly summarize what was changed.
- Tell the user which commands, if any, they should run manually to migrate, seed, build, test, format, deploy, or verify the changes.
- If no manual command is needed, say so clearly.
