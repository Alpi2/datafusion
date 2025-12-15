# Blockchain Architecture — DataFusion

Overview

This document describes the high-level architecture of the blockchain microservice for DataFusion. It summarizes components, data flows, event handling, and integration points with the rest of the platform.

Components

- Smart Contracts

  - `DatasetNFT` (ERC-721): represents dataset ownership and stores metadata URI (IPFS).
  - `BondingCurve` (ERC-20-like): represents dataset shares using a quadratic bonding curve. Supports `buy`, `sell`, fees, and a graduation trigger to Uniswap V3.
  - `BondingCurveFactory`: factory contract that mints the NFT and deploys a `BondingCurve` for a dataset.

- Backend Services

  - ContractService: deploys contracts and performs on-chain calls (ethers v6).
  - TransactionService: signs and sends transactions (local signer / KMS integration).
  - IPFSService: uploads metadata/files to Pinata (IPFS) and returns `ipfs://` URIs.
  - EventListenerService: subscribes to on-chain events and synchronizes DB records and emits WebSocket events.
  - Queue & Workers (BullMQ): offload long-running blockchain operations (deploy, mint, buy, sell).

- Database

  - PostgreSQL + Prisma ORM. Key tables: `bonding_curves`, `trades`, and relations to `datasets`.

- Real-time
  - Socket.io emitter used to broadcast bonding events to frontend clients.

Data Flows

1. User requests tokenization via API.
2. Backend uploads metadata to IPFS and enqueues a deploy job.
3. Worker executes job: uses Deployer key to call `BondingCurveFactory.deployBondingCurve` and mint NFT.
4. On-chain events (`TokensPurchased`, `TokensSold`, `Graduated`) are captured by `EventListenerService`.
5. Event listener persists `Trade` rows, updates `BondingCurve` stats and emits socket events.

Operational Notes

- Keep the deployer private key secure (KMS/Vault). Avoid storing raw private keys in `.env` for production.
- Ensure the Hardhat build produces contract artifacts in `backend/contracts/artifacts/` for ABI loading.
- Ensure database has `pgvector` extension if using vector columns (embeddings). A shadow DB for Prisma migrations must also have pgvector.

Roadmap items

- Hardhat full test coverage and CI integration
- Optional: make event listeners horizontally scalable (message broker/consumer group)
- Optional: move deployer to a multisig or delegated KMS signing flow

Wallets & UX

- Primary wallet: stored on the `User.walletAddress` field. This is the default address associated with the user.
- Additional wallets: users can register additional wallets (e.g. via WalletConnect) using the `/api/blockchain/wallets` endpoint. These are stored in the `user_wallets` table and related to the `User` record.
- Wallet activation: Clients may request to activate a connected wallet via `PATCH /api/blockchain/wallets/:id/activate`. The server marks the chosen wallet `isActive` and the client should swap the active signer accordingly.
- Signing UX: the backend does not custody private keys. All buy/sell transactions are prepared server-side (unsigned calldata) and returned to the client; the client signs and broadcasts the transaction from the chosen wallet.

Gas estimation strategy

- `GasService` queries the configured JSON-RPC provider using `provider.getFeeData()` and returns `slow`, `average`, and `fast` estimates (in Gwei) to the client via `GET /api/blockchain/gas`.
- Estimates are cached for a short TTL (default 15s) to limit RPC calls. If the provider fails, conservative fallback estimates are returned.
- Clients should present slow/average/fast and estimate fiat-equivalent costs when a price oracle is available.

Transaction history

- Endpoint: `GET /api/blockchain/transactions` (requires auth)
- Aggregation sources:
  - On-chain `trades` table (bonding curve trades) matched by `traderAddress` against the stored `User.walletAddress` and any `user_wallets` entries.
  - `purchases` (off-chain purchases) for `buyerId` matches.
  - `earnings` when present for the user.
- Normalized response includes `txHash`, `type` (trade/purchase/earning), `amount`, `datasetId`, `blockNumber`, and `createdAt`.

Sync into dashboard

- On-chain events are ingested by `EventListenerService` and persisted to `trades`.
- `EarningsService.recordEarning` persists earnings and emits `earnings:update` socket events to the user room; the dashboard subscribes to these events to refresh earnings/transactions in real time.
