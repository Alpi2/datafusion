# Feature Status

This document provides a single place to check the implementation status of major platform features (mapped from `liste.md` and `TODO.md`). Use this as the canonical quick-check before proposing changes or opening roadmap issues.

Status key:

- **Done**: Implemented and wired (may still need polish/tests)
- **Partial**: Core implementation exists but UX, tests or edge-cases remain
- **Planned**: Spec'd in roadmap, work not started

---

## Auth & Session Management

- Status: **Partial**
- Notes: Web3 wallet connect (injected + nonce signin) implemented; Redis-backed sessions and JWTs present. Improvements: multi-wallet flows and WalletConnect integration.
- Main files:
  - `backend/src/services/auth/controllers/wallet.controller.ts`
  - `backend/src/services/auth/middleware/auth.middleware.ts`
  - `backend/src/services/auth/utils/redis.util.ts`
  - `frontend/src/app/auth` (pages + client flows)

## Generation (AI dataset generation)

- Status: **Partial**
- Notes: Queue-based generation, preview endpoints and controller implemented. Need expanded templates, preview UX polish and cost estimator integration.
- Main files:
  - `backend/src/services/generation/controllers/generation.controller.ts`
  - `backend/src/services/generation/queue/*`
  - `frontend/src/components/generation/GenerationInterface.tsx`
  - `frontend/src/components/generation/SchemaBuilder.tsx`

## Marketplace (browse / purchase / download)

- Status: **Partial**
- Notes: Marketplace listing, purchase initiation (Stripe) and download paths exist. Wishlist, comparison tool, and advanced filters have basic scaffolding or tests but need UX polish and review moderation.
- Main files:
  - `backend/src/services/marketplace/controllers/marketplace.controller.ts`
  - `backend/src/services/marketplace/routes/marketplace.routes.ts`
  - `frontend/src/components/marketplace/*` (DatasetCard, MarketplaceInterface, compare page)

## Onboarding & UX

- Status: **Partial**
- Notes: Basic onboarding tour scaffold exists (`frontend/src/app/onboarding`). Needs guided walkthrough content, A/B experiments and tutorial videos.
- Main files:
  - `frontend/src/app/onboarding/OnboardingTour.tsx`
  - `docs/UX-Roadmap-Issues.md`

## Blockchain & Tokenization (Bonding curves, NFT)

- Status: **Partial**
- Notes: Bonding curve deployment, buy/sell unsigned tx payloads, gas estimates and transaction history endpoints are present. Multi-wallet management and WalletConnect support are planned/partially implemented on the frontend.
- Main files:
  - `backend/src/services/blockchain/controllers/bonding.controller.ts`
  - `backend/src/services/blockchain/services/gas.service.ts`
  - `backend/src/services/blockchain/controllers/transactions.controller.ts`
  - `frontend/src/app/auto-price-engine/page.tsx` (blockchain dashboard)

## Dashboard, Analytics & Earnings

- Status: **Partial**
- Notes: Dashboard controllers, earnings recording and aggregation service exist. Real-time earnings via sockets implemented; per-dataset analytics and forecasting require work.
- Main files:
  - `backend/src/services/dashboard/controllers/dashboard.controller.ts`
  - `backend/src/services/dashboard/services/earnings.service.ts`
  - `frontend/src/app/dashboard/*`

## Testing & CI

- Status: **Partial**
- Notes: Jest (backend) and Vitest (frontend) configured with coverage. CI updated to enforce coverage thresholds; more integration/e2e tests (DB+Redis) are planned.
- Main files:
  - `backend/jest.config.cjs`
  - `frontend/vitest.config.ts`
  - `.github/workflows/ci.yml`
  - `backend/tests/*`, `frontend/__tests__/*`

## Infrastructure & Ops

- Status: **Planned**
- Notes: Deployment and infra docs exist (`backend/docs/DEPLOYMENT_GUIDE.md`). Recommended next steps: Terraform/Helm manifests, secrets/Vault integration and production observability hardening.
- Main files:
  - `backend/docs/DEPLOYMENT_GUIDE.md`
  - `docker-compose.yml` (if present)

---

Guidance

- Keep this document up to date when completing roadmap items. Add PR links or issue numbers in the notes when a section moves from `Partial` to `Done`.
- Use the `Component / Files` lists to find the implementation surface quickly when triaging bugs or planning UX changes.
