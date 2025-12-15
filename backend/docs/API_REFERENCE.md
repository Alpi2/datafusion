# Blockchain API Reference

Base path: `/api` (backend)

## POST /api/bonding/deploy

Create a bonding curve and mint dataset NFT.

Request body (JSON):

```json
{
  "datasetId": "<uuid>",
  "tokenName": "My Dataset Token",
  "tokenSymbol": "MDT"
}
```

Response:

- 200 OK: `{ success: true, bondingCurve: { id, contractAddress, nftTokenId, transactionHash } }`
- 4xx/5xx: error object

## POST /api/bonding/buy/:datasetId

Buy tokens from the bonding curve for dataset.

Request body:

```json
{ "amount": "1.5" }
```

Response:

- 200 OK: `{ success: true, transactionHash: "0x..." }`

## POST /api/bonding/sell/:datasetId

Sell tokens back to the bonding curve.

Request body:

```json
{ "amount": "0.5" }
```

Response:

- 200 OK: `{ success: true, transactionHash: "0x..." }`

## GET /api/bonding/price/:datasetId

Get current price and market data for the bonding curve.

Response:

- 200 OK: `{ currentPrice: string, marketCap: string, supply: string, graduated: boolean }`

## GET /api/bonding/status/:datasetId

Get status including recent trades.

Response:

- 200 OK: `{ contractAddress, currentSupply, currentPrice, marketCap, totalVolume, holderCount, graduated, uniswapPool, recentTrades }`

## Webhook: POST /api/webhook

Used by IPFS/Pinata webhook to notify when files are pinned (optional).

## WebSocket Topics

- `bonding:trade` — emitted when a trade occurs; payload contains trade and updated stats.
- `bonding:graduated` — emitted when a bonding curve graduates to Uniswap; payload includes pool address.

---

# Additional API Endpoints (Generation, Marketplace, Dashboard, Chat & Embeddings)

Base path: `/api`

## Generation API

- **POST /api/generation/create**
  - Description: Enqueue a generation job for a dataset using selected tier and models.
  - Body (JSON): `{ prompt: string, tier?: string, schema?: object, aiModels?: string[], validationLevel?: string, knowledgeDocumentIds?: string[] }`
  - Response: `200 OK: { jobId: string }`

- **GET /api/generation/status/:jobId**
  - Description: Get current status and progress of a generation job.
  - Response: `200 OK: { jobId, status: 'pending'|'processing'|'completed'|'failed', progress: number, currentStep?: string, resultUrl?: string, datasetId?: string }`

- **GET /api/generation/history**
  - Description: List previous generation jobs for the authenticated user.
  - Query: `?page=1&limit=20`
  - Response: `200 OK: { jobs: [...], pagination: {...} }`

- **POST /api/generation/cancel/:jobId**
  - Description: Cancel a running/pending generation job.
  - Response: `200 OK: { success: true, cancelled: boolean }`

- **POST /api/generation/validate**
  - Description: Request a validation run for a dataset prior to publishing.
  - Body: `{ datasetId: string, validationLevel?: string }`
  - Response: `200 OK: { validationId: string, status: 'queued' }`

## Marketplace API

- **GET /api/marketplace/datasets**
  - Description: Paginated list of marketplace datasets.
  - Query: `?page=1&limit=20&category=&priceMin=&priceMax=`
  - Response: `200 OK: { datasets: [...], pagination: {...} }`

- **POST /api/marketplace/search**
  - Description: Full-text / filter search for datasets.
  - Body: `{ query: string, category?: string, priceMin?: number, priceMax?: number, sortBy?: string, page?: number, limit?: number }`
  - Response: `200 OK: { datasets: [...], pagination: {...} }`

- **GET /api/marketplace/datasets/:id**
  - Description: Get dataset details by id.
  - Response: `200 OK: { dataset }`

- **POST /api/marketplace/purchase/:datasetId**
  - Description: Initiate purchase flow (Stripe or on-chain); returns purchase session or transaction payload.
  - Body: `{ paymentMethod: 'stripe'|'onchain', priceId?: string }`
  - Response: `200 OK: { sessionId?: string, unsignedTx?: {...} }`

- **GET /api/marketplace/datasets/:id/download**
  - Description: Download dataset (authorized users only).
  - Response: `200 OK: { downloadUrl: string }`

## Dashboard API

- **GET /api/dashboard/stats/:userId**
  - Description: Retrieve summary statistics for a user (earnings, published datasets).
  - Response: `200 OK: { totalEarnings, monthlyEarnings, publishedDatasets, rankingPosition }`

- **GET /api/dashboard/datasets/:userId**
  - Description: List datasets owned/created by user.
  - Response: `200 OK: { datasets: [...] }`

- **GET /api/dashboard/earnings/:userId**
  - Description: Earnings summary and breakdown.
  - Response: `200 OK: { total, monthly, weekly, tradingFeeRate }`

- **GET /api/analytics/performance/:userId**
  - Description: Performance metrics for user's datasets.
  - Response: `200 OK: { metrics: {...} }`

## Chat & Embeddings API

- **POST /api/chat/dataset/:id**
  - Description: Query dataset via RAG-powered chat endpoint.
  - Body: `{ message: string, conversationHistory?: Array<{role, content}> }`
  - Response: `200 OK: { response: string }`

- **GET /api/chat/dataset/:id/patterns**
  - Description: Run pattern detection / analytics on dataset.
  - Response: `200 OK: { patterns: [...] }`

- **POST /api/embeddings/upload**
  - Description: Upload document to be embedded and indexed.
  - Body: `multipart/form-data` with `file` field.
  - Response: `200 OK: { documentId: string }`

- **POST /api/embeddings/search**
  - Description: Perform semantic search over indexed documents.
  - Body: `{ query: string, topK?: number }`
  - Response: `200 OK: { results: [...] }`

---

## OpenAPI / Swagger

This file is a human-friendly summary. For automated API docs, generate an OpenAPI spec from route handlers or create a `openapi.yaml` in `backend/docs/` and wire a Swagger UI route (e.g., `/docs`).


## Standard Error Response

All API endpoints return errors in a canonical JSON shape to make client handling predictable. The top-level error is placed under the `error` key and contains at minimum a `code` and `message`. Optionally handlers may include a `details` field with structured information.

Example:

```json
{
  "error": {
    "code": "dataset_not_found",
    "message": "Dataset not found",
    "details": { "datasetId": "..." }
  }
}
```

- `code` (string): machine-readable error code, useful for analytics and branching logic on the client.
- `message` (string): human-readable error message intended for logs and optionally for UI.
- `details` (optional): an object or array with additional context about the error.

Server-side internal errors will typically use `code: "internal_error"` and status `500`. Clients should prefer `error.code` and `error.message` and may fall back to HTTP status or top-level `message` fields when `error` is absent.

When adding new endpoints, make sure to propagate errors via the central `AppError` (or `next(err)`) so the error handler emits the canonical shape.
