# ---------- Combined Build Stage: backend + frontend ----------
# Keep both builds in one stage to satisfy SnapDeploy Small's 2-stage limit.
FROM node:20-alpine AS app-builder

# Build backend first, then remove its development dependencies to reduce
# the builder's disk footprint before installing frontend dependencies.
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY backend/ ./
RUN npm run build && rm -rf node_modules

# Build the frontend with same-origin API routing.
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
ENV VITE_API_URL=/api
RUN npm run build && rm -rf node_modules

# ---------- Production Stage ----------
FROM node:20-alpine AS production

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=app-builder /app/backend/dist ./dist
# Express serves the frontend build while /health and /api/v1 keep their behavior.
COPY --from=app-builder /app/frontend/dist ./public

ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", "dist/index.js"]
