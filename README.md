# Acquisitions API – Docker & Neon Setup

This repository now includes a containerized workflow for running the API against Neon in both local development (via Neon Local) and production (via Neon Cloud). The Docker artifacts keep application code identical while letting you swap Postgres backends by switching environment files.

## Prerequisites
- Docker Engine + Docker Compose v2
- A Neon project with:
  - API key that can manage branches
  - Project/branch identifiers for the environments you intend to target
- (Optional) An Arcjet API key if you plan to exercise the request-throttling middleware

## Environment files
Two committed templates drive the configuration:

| File | Purpose | Key values |
| --- | --- | --- |
| `.env.development` | Used by `docker-compose.dev.yml`. Points the app at the Neon Local proxy inside the Compose network and includes your Neon API credentials (`NEON_API_KEY`, `NEON_PROJECT_ID`, `PARENT_BRANCH_ID`) so the proxy can spin up ephemeral branches automatically. | `DATABASE_URL=postgres://neon:npg@neon-local:5432/appdb?sslmode=disable`<br>`NEON_LOCAL_PROXY_URL=http://neon-local:5432/sql` |
| `.env.production` | Consumed by `docker-compose.prod.yml`. Holds the real Neon Cloud connection string and production secrets. | `DATABASE_URL=postgres://…neon.tech…?sslmode=require` |

> Tip: copy the appropriate template to `.env` when you want to run scripts directly on your host (outside Docker) so Drizzle CLI and other tooling pick up the same settings.

## Development with Neon Local
1. Populate `.env.development` with your Neon credentials. `PARENT_BRANCH_ID` should reference the branch you want ephemeral branches cloned from (for example, your staging branch). Each `docker compose up` cycle will create a short-lived child branch and drop it when the proxy stops.
2. Start the stack:
   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```
   - Service `neon-local` runs the proxy (`ghcr.io/neondatabase-labs/neon-local`) and exposes Postgres on `localhost:5432` for convenience.
   - Service `app` builds from the same `Dockerfile` (development target) and runs `npm run dev` with source code mounted from `./src`, so edits hot-reload inside the container.
3. The API listens on `http://localhost:3000`. `DATABASE_URL` inside the container is `postgres://neon:npg@neon-local:5432/appdb?sslmode=disable`, while the Neon serverless driver is pointed at the proxy via `NEON_LOCAL_PROXY_URL`.
4. Run project commands inside the container when needed, e.g. `docker compose -f docker-compose.dev.yml exec app npm run db:migrate`.

## Production / staging deployment
1. Fill in `.env.production` with the Neon Cloud branch you want to target (these secrets should ultimately be sourced from your runtime secret store).
2. Build and start the containerized API:
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```
   - Only the `app` service runs; it connects to Neon Cloud directly using the provided `DATABASE_URL`.
   - The production stage in `Dockerfile` installs only runtime dependencies and starts the server with `node src/index.js`.
3. To update the deployment, rerun the same command with `--build` so the image picks up new code.

## How the environments switch
- Both Compose files reference the same `Dockerfile`. Different build targets (`development` vs `production`) set the runtime command and dependency pruning level.
- Environment variables are injected exclusively through `env_file` entries:
  - Dev: `.env.development` declares a Neon Local connection string plus the proxy URL needed by `@neondatabase/serverless`.
  - Prod: `.env.production` carries the managed Neon Cloud URL (no proxy) and production-only secrets.
- The application code reads `process.env.DATABASE_URL`; no URLs are hard-coded. When `NEON_LOCAL_PROXY_URL` is defined, the Neon serverless driver is reconfigured to talk to the local proxy, otherwise it defaults to Neon Cloud.

## Next steps
- Configure your Neon API key with the limited scope required to create/delete branches.
- Hook these Compose files into your CI/CD pipeline or deployment platform (e.g., use `docker-compose.prod.yml` as the basis for a container release workflow).

## Helper script
Use `./setup-docker.sh [dev|prod]` to run the appropriate Compose file without remembering all the flags:

```bash
# start dev stack with Neon Local
./setup-docker.sh

# deploy production compose (detached)
./setup-docker.sh prod
```
