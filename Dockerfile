# ---------- Build Stage: backend ----------
FROM node:20-alpine AS backend-builder

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --no-audit --no-fund

COPY backend/ .
RUN npm run build

# ---------- Build Stage: frontend ----------
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/ .
# Same-origin API: the backend serves this build and the API under /api/v1.
ENV VITE_API_URL=/api
RUN npm run build

# ---------- Production Stage ----------
FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=backend-builder /app/dist ./dist
# Built web frontend; Express serves it (see resolveFrontendDist in
# backend/src/app.ts) while /health and /api/v1 keep their exact behavior.
COPY --from=frontend-builder /app/dist ./public

ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", "dist/index.js"]
