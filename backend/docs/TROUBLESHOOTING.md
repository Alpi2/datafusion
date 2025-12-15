# Troubleshooting — Blockchain Microservice

This document lists common problems and resolutions encountered during development and local setup.

1. Prisma migrations fail with `vector` type / P3006

Cause: Postgres instance (or shadow DB) lacks the `pgvector` extension.
Fix:

- Use a Postgres image with `pgvector` (e.g., `ankane/pgvector`).
- Create the extension in both the main DB and shadow DB:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

2. `DATABASE_URL` or `SHADOW_DATABASE_URL` not found (P1012)

Cause: `.env` missing or environment variables not set.
Fix:

- Copy `backend/.env.example` to `.env` and update values.
- Ensure `SHADOW_DATABASE_URL` is set for Prisma commands that need migrations.

3. TypeScript errors after adding controller/routes

Cause: wrong import paths or missing types.
Fix:

- Run `npx tsc -p tsconfig.json --noEmit` and fix import paths (prefer relative imports within backend).

4. ABI not found when ContractService loads artifacts

Cause: Hardhat artifacts were not compiled or path mismatch.
Fix:

- Run `cd backend/contracts && npx hardhat compile`.
- Ensure artifacts (ABI JSON) are output under `backend/contracts/artifacts/` or update `loadAbi` path.

5. Event listener shows no events or lags

Cause:

- Wrong RPC URL, provider misconfiguration, or contract ABI mismatch.
- Missing subscriptions for newly deployed contracts.
  Fix:
- Verify `BLOCKCHAIN_RPC_URL` and that the provider supports `eth_subscribe` (WebSocket provider recommended for real-time).
- Ensure ABIs match deployed contracts and `EventListenerService` is subscribed to the correct contract addresses.
- Confirm the backend process has network connectivity and no rate-limiting from RPC provider.

6. Socket.io events not reaching frontend

Cause: CORS or URL mismatch.
Fix:

- Confirm `NEXT_PUBLIC_API_URL` matches backend host/port used by `SocketService`.
- Check server logs for emitter errors; ensure `socketService` is initialized before event listeners start.

7. Deployment fails due to insufficient gas or wrong chain

Cause: wrong RPC network or insufficient wallet funds.
Fix:

- Verify `BLOCKCHAIN_RPC_URL` corresponds to the intended network (Mumbai vs Mainnet).
- Fund deployer wallet with test MATIC for testnet.

8. Failure writing earnings or user lookup on event handling

Cause: `creatorAddress` is a wallet address; `Earning.userId` expects a user id.
Fix:

- Update event handler to resolve user by `walletAddress` (e.g., `prisma.user.findUnique({where:{walletAddress: creatorAddress}})`) and use `user.id` for `earning.userId`.

9. Duplicate trades inserted for same tx

Cause: event processing retries or duplicated logs.
Fix:

- Add idempotency check before inserting a `Trade` (e.g., check `transactionHash` unique constraint) and handle unique constraint errors gracefully.

10. Hardhat plugin / ethers version mismatch

Cause: ethers v6 vs plugin version expecting v5.
Fix:

- Ensure `@nomiclabs/hardhat-ethers` and `ethers` versions are compatible. Use `hardhat-ethers` that supports ethers v6 or switch to ethers v5 if necessary.

If you hit an issue not listed here, collect logs from the backend, the event listener, and the RPC provider responses and open an issue in the repo with relevant traces.
