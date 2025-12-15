# DataFusion - AI-Powered Synthetic Data Platform

DataFusion is a full-stack platform for generating high-quality synthetic datasets using an ensemble of AI models, tokenizing datasets via bonding curves and NFTs, and operating a marketplace for dataset distribution and monetization.

## 🚀 Features

- Multi-AI data generation (OpenAI, Anthropic Claude, Google Gemini)
- RAG-powered dataset chat and validation
- Tokenization with Bonding Curve contracts and Dataset NFTs
- Marketplace with Stripe payments and dataset licensing
- Real-time generation tracking (Socket.io)
- Queue-based background processing (BullMQ)

## 🏗️ Architecture (high level)

- Frontend: Next.js 15 + React, TailwindCSS
- Backend: Node.js, TypeScript, Express, Prisma + PostgreSQL
- Queue: Redis + BullMQ
- Storage: MinIO / S3, IPFS (Pinata)
- Search: Elasticsearch (optional)
- Blockchain: Solidity contracts, Hardhat, Ethers.js

## 📦 Tech Stack

**Backend:** Node.js, TypeScript, Express, Prisma, PostgreSQL

**Frontend:** Next.js 15, React, TailwindCSS

**Blockchain:** Solidity, Hardhat, Ethers v6

**Infrastructure:** Redis, Elasticsearch, MinIO, BullMQ

## 🛠️ Quickstart (development)

1. Clone the repository

```bash
git clone <repo-url>
cd DataFusion
```

1. Frontend

```bash
cd frontend
cp .env.local.example .env.local
pnpm install
pnpm dev
```

1. Backend (requires Postgres with `vector` extension and Redis)

```bash
cd backend
cp .env.example .env
# edit .env: DATABASE_URL, SHADOW_DATABASE_URL, BLOCKCHAIN_RPC_URL, DEPLOYER_PRIVATE_KEY, etc.
pnpm install
# If using Prisma migrations:
npx prisma generate
npx prisma migrate dev --name init
pnpm dev
```

1. Contracts: compile, export ABIs and deploy (optional)

```bash
cd backend/contracts
pnpm install
npx hardhat compile
# export flat ABIs for backend runtime loader
node scripts/export-abis.js
# deploy to testnet (example)
npx hardhat run scripts/deploy-factory.ts --network polygonMumbai
```

After deployment add the printed addresses to `backend/.env`:

```env
DATASET_NFT_ADDRESS=0x...
BONDING_CURVE_FACTORY_ADDRESS=0x...
```

## 📖 Documentation

- API reference: `backend/docs/API_REFERENCE.md`
- Blockchain architecture: `backend/docs/BLOCKCHAIN_ARCHITECTURE.md`
- Deployment guide: `backend/docs/DEPLOYMENT_GUIDE.md`
- Smart contract notes: `backend/docs/SMART_CONTRACTS.md`
- Feature status (roadmap -> implementation): `docs/FEATURE_STATUS.md`

## 🧪 Tests

- Backend unit/integration tests (if present):

```bash
cd backend
pnpm test
```

- Frontend component tests:

```bash
cd frontend
pnpm test
```

> Note: add or integrate CI workflows to run Hardhat tests and export ABI step during build.

## Continuous Integration (GitHub Actions)

This repository includes a CI workflow at `.github/workflows/ci.yml` which runs on pushes and PRs to `main`. The workflow will:

- Install frontend dependencies and run `pnpm test` (frontend tests use Vitest and produce coverage reports).
- Install backend dependencies and run `pnpm test` (backend tests use Jest with coverage collection enabled).
- Upload `frontend/coverage` and `backend/coverage` as workflow artifacts for inspection.

Run tests locally:

```bash
# frontend
cd frontend
pnpm install
pnpm test

# backend
cd ../backend
pnpm install
pnpm test
```

Future: the CI workflow is prepared for adding Hardhat contract tests — you can add a job step to `backend` that runs `npx hardhat test` and uploads contract artifacts.

## ✅ Recommended developer checklist

- Create `.env.local` in the frontend from `frontend/.env.local.example`.
- Ensure Postgres has the `vector` extension if using pgvector columns.
- Run `node backend/contracts/scripts/export-abis.js` after compiling contracts so the backend can load ABIs at runtime.
- Use a secrets manager (KMS/Vault) for `DEPLOYER_PRIVATE_KEY` in production.

## 📄 License

This project does not include a license file. Add a `LICENSE` file appropriate for your needs (MIT/Apache-2.0/etc.).
