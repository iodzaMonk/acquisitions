# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands you’ll use most

- Install deps: `npm ci` (or `npm install`)
- Run the API in watch mode: `npm run dev` (starts `src/index.js` which loads `src/server.js`)
- Lint all files: `npm run lint`
- Lint and fix: `npm run lint:fix`
- Format all files: `npm run format`
- Check formatting: `npm run format:check`
- Generate Drizzle SQL from models: `npm run db:generate`
- Apply migrations: `npm run db:migrate`
- Explore DB schema/data: `npm run db:studio`

Notes:
- Database commands require `DATABASE_URL` in the environment. Prefer using an `.env` file (already supported via `dotenv`).
- There is no test runner configured and no `test` script. If tests are added later (e.g., Jest/Vitest), update this file with how to run a single test.

## High-level architecture

Runtime
- Node.js ESM project (`"type": "module"`). Uses native Node package import aliases via `package.json#imports` (e.g., `#config/*`, `#controllers/*`, etc.).
- Express 5 app with common hardening middleware (Helmet, CORS), logging, JSON parsing, cookies.

Entrypoints
- `src/index.js`: Loads environment (`dotenv/config`) and boots the server by importing `src/server.js`.
- `src/server.js`: Reads `PORT` and calls `app.listen(...)`.
- `src/app.js`: Constructs and configures the Express app, mounts routes, and exports the app instance.

Request flow
- Router layer: `src/routes/` (e.g., `auth.routes.js`) defines endpoints and maps to controllers under `/api/*` (e.g., `/api/auth/sign-up`).
- Controller layer: `src/controllers/` (e.g., `auth.controller.js`) validates input (Zod), calls services, sets cookies/JWTs, and shapes responses.
- Service layer: `src/services/` (e.g., `auth.service.js`) contains business logic and DB interactions.
- Data access: `src/config/database.js` initializes Drizzle ORM over Neon HTTP; `src/models/` defines tables (e.g., `user.model.js`).
- Validation: `src/validations/` holds Zod schemas.
- Utilities: `src/utils/` includes helpers for JWT, cookies, and formatting.
- Logging: `src/config/logger.js` provides a Winston logger (console in non-prod, files under `logs/`). Morgan writes HTTP logs to Winston.

Database and migrations
- ORM: Drizzle ORM with PostgreSQL (Neon serverless driver).
- Schema source: `src/models/*.js`.
- Drizzle config: `drizzle.config.js` outputs generated SQL/migrations to `./drizzle`.
- Ensure `DATABASE_URL` is set before running `db:*` scripts.

Routing overview (current)
- Health: `GET /health` returns service status.
- API base: `GET /api` returns a simple alive message.
- Auth: `POST /api/auth/sign-up` creates a user, sets a short-lived auth cookie with a signed JWT.

Path aliases (package.json#imports)
- `#config/*` → `./src/config/*`
- `#controllers/*` → `./src/controllers/*`
- `#middleware/*` → `./src/middleware/*`
- `#models/*` → `./src/models/*`
- `#routes/*` → `./src/routes/*`
- `#services/*` → `./src/services/*`
- `#utils/*` → `./src/utils/*`
- `#validations/*` → `./src/validations/*`

Environment
- Common variables: `PORT`, `NODE_ENV`, `LOG_LEVEL`, `DATABASE_URL`, `JWT_SECRET`.
- Loaded automatically via `dotenv` at startup; keep secrets in `.env` and out of VCS.

Additional notes
- The repository contains a root-level `index.js` (Hello World) that is not used by the dev flow; the active server starts from `src/index.js`.
