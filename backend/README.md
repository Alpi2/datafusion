# Backend - ESM/CJS Policy

This project intentionally keeps the backend running under CommonJS at runtime while allowing source code to use ESM-style `import`/`export` in TypeScript.

Reasons and rules

- `package.json` intentionally DOES NOT include `"type": "module"` so Node will run the compiled code as CommonJS by default. This preserves compatibility with tools and hosting platforms that expect CommonJS.
- TypeScript source may use `import`/`export` syntax. The TypeScript compiler is configured to emit CommonJS modules so Node can run the transpiled output.
- Frontend (Next.js) remains independent and uses modern ESM-style imports. `viem` / `wagmi` and other ESM-first packages are recommended for the frontend.

How this is configured

- `backend/tsconfig.json` uses `"module": "CommonJS"` and `esModuleInterop: true` so TypeScript `import` syntax works and the runtime output is CommonJS.
- `backend/package.json` has no `type` field (CommonJS default).

Notes on ESM-only packages

- If you need to use an ESM-only package from the backend, you have these options:
  - Use dynamic `await import('pkg')` where needed.
  - Switch backend to ESM (`"type": "module"` and `tsconfig` -> `module: "NodeNext"`) — this is a breaking change and requires updating start/dev tooling.
  - Run the ESM-only functionality in a separate process/service (recommended if mixing runtimes is complex).

Run & dev commands

From `backend/`:

```bash
# install dependencies (choose pnpm/npm/yarn)
pnpm install

# generate prisma client
pnpm run prisma:generate

# dev (fast, using ts-node-dev)
pnpm run dev

# build for production
pnpm run build
pnpm start
```

Docker compose

The repo includes `backend/docker-compose.yml` to start Postgres and Redis for local development. To run them:

```bash
cd backend
docker-compose up -d
```

If you'd like me to flip the backend to native ESM (NodeNext) instead, I can update `package.json`, `tsconfig.json`, and scripts — but that will require adjusting dev tooling (ts-node-dev/nodemon) to work with ESM. For now, this CommonJS runtime + ESM-style TypeScript source approach is the safest and most compatible option for deployment on Vercel/other platforms.
