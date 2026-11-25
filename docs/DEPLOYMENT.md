# Deployment Guide

SINA AI STUDIO is deployed as one production container on SnapDeploy.

## Existing deployment target

- **Platform:** SnapDeploy
- **Existing SnapDeploy application/container:** `ai_studio_ai`
- **Repository:** `sina6565/AI_Studio_AI`
- **Production branch:** `main` (the branch linked to the existing application)
- **Container port:** `3000`
- **Dockerfile:** repository-root `Dockerfile`

Do not create a duplicate SnapDeploy application for normal releases. Merging an
approved change into `main` is the release trigger for the GitHub-linked
application; SnapDeploy then builds the root `Dockerfile` and replaces the
running container.

## Production image layout

The root Dockerfile has three stages:

1. Build the TypeScript backend.
2. Build the Vite frontend with `VITE_API_URL=/api`, so browser API calls stay
   on the same public origin as the website.
3. Copy the backend runtime to `/app/dist` and the built frontend to
   `/app/public`, then run `node dist/index.js` with `NODE_ENV=production`.

Express serves the built homepage and SPA routes while preserving:

- `GET /health` and `GET /health/live` for liveness;
- `GET /health/ready` for readiness;
- the versioned API under `/api/v1`;
- JSON `404 NOT_FOUND` responses for unknown API routes.

Point SnapDeploy liveness at `/health`, not `/`, as also described in
`docs/OPERATIONS.md`. The root path `/` is the public homepage in the Docker
image.

## Environment

Production secrets belong only in the SnapDeploy application settings. Never
commit real values to this repository. At minimum, production needs a real
`JWT_SECRET` and a MongoDB connection through `MONGODB_URI` or `DATABASE_URL`.
Provider settings such as Agnes remain controlled by their existing
environment variables.


## Gemini runtime activation

The backend registers Gemini when a runtime API key is supplied, unless
`GEMINI_ENABLED=false` is explicitly set. Configure the key in the
**SnapDeploy application settings** for `ai_studio_ai`:

- `GOOGLE_API_KEY` (preferred), or `GEMINI_API_KEY`.
- `GEMINI_MODEL=gemini-2.5-flash` (unless a different verified model is selected).
- `GEMINI_ENABLED` may be omitted when a key is present; set it to `false`
  as an explicit kill switch.

Never put real keys in source code, GitHub commits, frontend variables, or
committed environment files. GitHub Actions secrets are not automatically
injected into the SnapDeploy container. Restart/redeploy after changing
runtime variables.

A successful provider initialization and a real generation request through
the production application are both required before calling Gemini live.
A CI mock or a GitHub Actions key check alone does not prove the production
container has the key or can use the provider.

## Release checklist

1. Merge the reviewed pull request into `main`.
2. Wait for the SnapDeploy build/deployment for `ai_studio_ai` to finish.
3. Verify the public homepage returns the Sina Studio AI page.
4. Verify `/health` returns HTTP 200 JSON.
5. Verify `/api/v1/health` returns HTTP 200 JSON.
6. Verify an SPA route such as `/preorder` returns the application HTML.
7. Verify an unknown `/api/v1/...` route still returns the JSON 404 contract.
8. Open the site at a mobile viewport and check navigation, text, the prompt
   controls, language switching (EN LTR / FA RTL), and reduced-motion behavior.

## Rollback

Use SnapDeploy's deployment history for `ai_studio_ai` to redeploy the previous
known-good deployment, or revert the release commit on `main` through a normal
reviewed pull request. Do not force-push production history.
