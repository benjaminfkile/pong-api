# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps (incl. dev) first for better caching
COPY package*.json ./
RUN npm ci

# Copy sources and build
COPY tsconfig.json ./
COPY src ./src
COPY index.ts ./index.ts
RUN npx tsc -p tsconfig.json

# ---- Runtime stage ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Only prod deps
COPY package*.json ./
RUN npm ci --omit=dev

# App artifacts
COPY --from=builder /app/dist ./dist

EXPOSE 8000
CMD ["node", "dist/index.js"]
