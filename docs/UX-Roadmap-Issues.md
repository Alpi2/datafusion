# UX Roadmap → Issue List

This file maps items from `TODO.md` into discrete issues ready to be copied into your issue tracker (GitHub Issues, Jira, etc.). Each entry includes a suggested title, description, labels, priority, and suggested owner/component.

Refer to `docs/FEATURE_STATUS.md` for a live status mapping from roadmap items to implementing files and current completion state.

## High Priority (Start here)

1. Title: Onboarding — Interactive guided tour for new users

   - Description: Implement an in-app guided onboarding tour for first-time users that highlights core actions (create dataset, generate, publish, dashboard). Use a lightweight library (Shepherd.js / Intro.js) and persist completion per-user. Include 'skip' and 'replay' actions.
   - Labels: ux, onboarding, frontend
   - Priority: P0
   - Component / Files: `frontend/src/app/onboarding/*`, `frontend/src/app/layout.tsx` (trigger), analytics
   - Est. effort: 3–5 d

2. Title: Onboarding — Sample dataset generation walkthrough

   - Description: Clickable walkthrough that generates a sample dataset (small preview), shows preview modal and demonstrates publish flow with mocked payment flow for demo users.
   - Labels: ux, onboarding, frontend, demo
   - Priority: P0
   - Component / Files: generation UI (`GenerationInterface.tsx`), onboarding route
   - Est. effort: 2–4 d

3. Title: Generation Preview and Cost Estimator

   - Description: Add a preview step that displays 5–10 sample rows for the requested generation and add an estimator that shows expected credits/cost and ETA based on tier/rows/AI models.
   - Labels: ux, generation, frontend
   - Priority: P0
   - Component / Files: `frontend/src/components/generation/GenerationInterface.tsx`, `frontend/src/lib/api/generation.ts`
   - Est. effort: 3–5 d

4. Title: Marketplace — Advanced filtering (persist in URL)

   - Description: Add date-range, creator-reputation and other advanced filters. Filters should persist to the URL (query params) and be deep-linkable/shareable.
   - Labels: ux, marketplace, frontend
   - Priority: P0
   - Component / Files: `frontend/src/components/marketplace/*`, `frontend/src/app/marketplace/page.tsx`
   - Est. effort: 3 d

5. Title: Marketplace — Dataset comparison tool (up to 3)
   - Description: Allow users to select up to 3 datasets and compare schema, preview, price, and quality side-by-side.
   - Labels: ux, marketplace, frontend
   - Priority: P0
   - Component / Files: Marketplace list, `DatasetCard`, comparison route (`/marketplace/compare`)
   - Est. effort: 4 d

## Medium Priority

- Wishlist functionality: persist per-user, list in profile (P1)
- Schema builder improvements (drag/drop, presets) (P1)
- Template library expansion and browse UI (P1)
- Dashboard: real-time earnings (WebSocket) (P1)

## Lower Priority / Future

- Video tutorials linked in onboarding (P2)
- Competitor analysis & revenue forecasting (P2)
- Dataset versioning, collaborative editing, API access (P2–P3)

## Suggested workflow to move items to Issues

1. Create a new GitHub label set: `ux`, `frontend`, `backend`, `onboarding`, `p0`, `p1`, `p2`.
2. Copy each high-priority entry above into a new GitHub Issue, assign `p0` label and link to this file.
3. Create child tasks (checklist) inside each issue for discrete frontend PRs (UI scaffold, API wiring, tests, analytics events).

---

If you'd like, I can open draft issues via the GitHub API (requires a token) or create a branch and PR that scaffolds `/frontend/src/app/onboarding` and the initial components (I already scaffolded a starter in the codebase). Tell me if you want me to proceed and whether to use GitHub Issues or Jira.
