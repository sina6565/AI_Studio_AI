# ---------- Build Stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/ .
RUN npm run build

# ---------- Production Stage ----------
FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", "dist/index.js"]
