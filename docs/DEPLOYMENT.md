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
