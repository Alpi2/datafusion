# CSRF Protection (Frontend Integration)

Important: In the current repository configuration, CSRF middleware is not active for the API routes — the codebase assumes JWT Bearer authentication for JSON APIs and therefore does not register cookie-based CSRF protection. The `/api/csrf-token` endpoint is not defined in the running server. CSRF middleware should only be re-enabled when you switch to cookie-based session authentication (for example, when using express-session and cookies to authenticate users).

If in the future you decide to enable cookie-based sessions and re-introduce CSRF protection for JSON endpoints, follow this pattern:

1. Ensure your server issues a secure, HTTP-only session cookie (e.g. via `express-session`) so CSRF tokens can be tied to a server-side session.
2. Add the CSRF middleware (for example `csurf`) configured to validate requests that modify state, and expose a token endpoint for SPA clients.

Example client flow (for the "future enabled" scenario):

```js
// fetch token (server must implement GET /api/csrf-token and set/require cookies)
const resp = await fetch(`${API_URL}/api/csrf-token`, { credentials: 'include' });
const { csrfToken } = await resp.json();

// include token in mutating requests
await fetch(`${API_URL}/api/some/endpoint`, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
  body: JSON.stringify(payload),
});
```

Implementation notes and guidance:

- Do not enable CSRF for pure Bearer-JWT JSON APIs; CSRF is meaningful when the browser automatically attaches credentials (cookies). For JWT in `Authorization` headers, CSRF protections are generally unnecessary.
- When re-introducing `csurf`, be careful to exclude any purely API endpoints that are intended to be called cross-origin without cookies, or provide a separate token-exchange endpoint that the SPA can call with credentials included.
- Update server-side routes and middleware in `backend/src/app.ts` when you switch to cookie sessions; add tests that exercise CSRF errors and the happy path.

This document is intended to be a reference for a future change — at present the codebase does not register CSRF middleware for API routes and the `/api/csrf-token` example is provided as a guidance-only snippet for future activation.
