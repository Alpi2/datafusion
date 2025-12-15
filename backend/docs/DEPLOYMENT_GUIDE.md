# Deployment Guide — DataFusion Blockchain Service

This guide explains deploying contracts and the backend components for the blockchain microservice.

Prerequisites

- Node.js 18+
- pnpm / npm
- Docker (for local Postgres with pgvector)
- Hardhat and dependencies installed in `backend/contracts`
- A funded deployer wallet for testnet/mainnet (store private key in KMS for production)

Environment

Copy `.env.example` to `.env` and configure the following variables (minimum):

- `DATABASE_URL` — Postgres connection URL
- `SHADOW_DATABASE_URL` — Prisma shadow DB URL (used during migrations)
- `BLOCKCHAIN_RPC_URL` — polygonMumbai or mainnet RPC URL
- `DEPLOYER_PRIVATE_KEY` — use KMS in production
- `UNISWAP_V3_FACTORY`, `UNISWAP_V3_POSITION_MANAGER` — Uniswap contracts
- `PINATA_JWT` or `PINATA_API_KEY` & `PINATA_SECRET_KEY`
- `FRONTEND_URL` — frontend URL used for metadata `external_url`

Local Postgres (pgvector)

Use `ankane/pgvector` image to have pgvector available:

```bash
docker run --name datafusion-pg -e POSTGRES_PASSWORD=postgres -p 5433:5432 -d ankane/pgvector
```

Create the `vector` extension in both the main DB and the Shadow DB used by Prisma:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Hardhat: compile & tests

```bash
cd backend/contracts
pnpm install
npx hardhat compile
npx hardhat test
```

Export ABIs (required by backend)

After compiling, run the ABI export script to create a flat `abis/` folder the backend can load at runtime:

```bash
cd backend/contracts
node scripts/export-abis.js
```

The script copies compiled artifacts from `artifacts/contracts/*/*.json` into `backend/contracts/abis/<ContractName>.json`.

Deploy contracts (testnet example)

```bash
cd backend/contracts
# ensure env vars are loaded (UNISWAP_*, WRAPPED_NATIVE and DEPLOYER_PRIVATE_KEY)
npx hardhat run scripts/deploy-factory.ts --network polygonMumbai
```

The deploy script will print `DATASET_NFT_ADDRESS` and `BONDING_CURVE_FACTORY_ADDRESS` — add these addresses to `backend/.env` (or your secrets manager) as follows:

```env
DATASET_NFT_ADDRESS=0x...
BONDING_CURVE_FACTORY_ADDRESS=0x...
```

Backend: migrations & start

1. Ensure `.env` contains `DATABASE_URL` and `SHADOW_DATABASE_URL` (shadow DB requires pgvector too).
2. Run migrations:

```bash
cd backend
npx prisma migrate dev --name add_blockchain_tables
npx prisma generate
```

3. Start backend (dev):

```bash
cd backend
pnpm install
pnpm dev
```

Production notes

- Store `DEPLOYER_PRIVATE_KEY` in KMS and sign transactions via a signing service.
- Use a multisig for actual contract deployments on mainnet.
- Monitor event listeners and run multiple listener nodes for redundancy.

## Docker Compose (production) example

You can run the backend and required services with Docker Compose for a simple production-like setup. This is a starting point; adapt resource limits, networks and volumes for your environment.

```yaml
version: '3.8'
services:
	postgres:
		image: ankane/pgvector:latest
		environment:
			POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
		volumes:
			- pgdata:/var/lib/postgresql/data
		ports:
			- "5432:5432"

	redis:
		image: redis:7-alpine
		ports:
			- "6379:6379"

	backend:
		build: ./backend
		env_file:
			- ./backend/.env
		depends_on:
			- postgres
			- redis
		ports:
			- "4000:4000"
		restart: unless-stopped

volumes:
	pgdata:
```

## Environment variable checklist

Ensure the following variables are set (examples):

```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/datafusion
SHADOW_DATABASE_URL=postgresql://postgres:postgres@postgres:5432/datafusion_shadow
BLOCKCHAIN_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/<KEY>
DEPLOYER_PRIVATE_KEY=<hex_private_key>   # use KMS in production
UNISWAP_V3_FACTORY=0x1F98431c8aD98523631AE4a59f267346ea31F984
UNISWAP_V3_POSITION_MANAGER=0xC36442b4a4522E871399CD717aBDD847Ab11FE88
WRAPPED_NATIVE=<weth_address>
DATASET_NFT_ADDRESS=<deployed_dataset_nft_address>
BONDING_CURVE_FACTORY_ADDRESS=<deployed_factory_address>
PINATA_JWT=<pinata_jwt>
FRONTEND_URL=https://your-frontend.example
REDIS_URL=redis://redis:6379
```

## Database migration strategy

- Use Prisma migrations in development: `npx prisma migrate dev`.
- For CI/CD and production deploys, use `npx prisma migrate deploy` against the production database (do not use `migrate dev`).
- Ensure `SHADOW_DATABASE_URL` points to a database with the `vector` extension when running `prisma migrate dev` locally or in CI.
- Backup strategy before running migrations:
	- Take a logical backup (`pg_dump`) and snapshot the volume.
	- Use a rolling migration strategy for large tables (create new tables, backfill, swap) to avoid long locks.

## Smart contract deployment workflow (recommended)

1. Compile contracts locally: `npx hardhat compile`.
2. Run unit tests and coverage in Hardhat.
3. Use a forked mainnet for integration tests (optional): run Hardhat node forked from mainnet and simulate graduation and trades.
4. Export ABIs for backend: `node scripts/export-abis.js`.
5. Deploy to testnet first using a controlled deployer (KMS or ephemeral key):

```bash
export DEPLOYER_PRIVATE_KEY=... # or use env file
npx hardhat run scripts/deploy-factory.ts --network polygonMumbai
```

6. Verify addresses and add them to `backend/.env` or secrets manager.
7. For mainnet, use a manual, audited process with multisig and a deployment checklist (gas estimation, timelocks, slippage tests).

## Frontend build and deploy

- Build command:

```bash
cd frontend
pnpm build
```

- Deploy options:
	- Vercel: Connect repo, set environment variables in project settings, and deploy. Vercel handles serverless Next.js builds.
	- Netlify: Build command `pnpm build` and publish directory `.next` (or use adapter if SSR required).

## Backend deploy options

- Railway / Render: Good for quick deploys; provide `DATABASE_URL`, `REDIS_URL` and secrets via the platform.
- AWS ECS / EKS: For production scale; use secrets manager for keys and KMS for signing.
- Docker Compose / Docker Swarm: For self-hosted setups.

## Monitoring and logging

- Logging:
	- Use structured logs (JSON) via `winston` or similar.
	- Forward logs to centralized logging (ELK / Logflare / Datadog).

- Monitoring & APM:
	- Expose healthcheck endpoints: `/health` (DB, Redis, optional RPC checks).
	- Integrate with Prometheus for metrics and Grafana for dashboards.
	- Use Sentry or Datadog APM for error tracking and traces.

## Backup strategy

- Database backups:
	- Schedule `pg_dump` daily and keep retention (7/30/90 days as appropriate).
	- Snapshot volumes in cloud providers (EBS snapshots for AWS) before large migrations.

- Artifact backups:
	- Store contract artifacts and exported ABIs in artifact storage (S3) during CI builds.

- Event replay and state recovery:
	- Persist on-chain events and keep periodic snapshots of computed aggregates to allow replaying events in case of corruption.

## Additional operational notes

- Run event listeners with an offset checkpoint (e.g., store last processed block) to enable safe restarts and horizontal scaling.
- Use a message queue or task deduplication to ensure idempotent processing of webhooks and jobs.

