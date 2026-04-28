# ── Stage 1: Build ──
FROM node:24-alpine AS builder

WORKDIR /usr/src/app

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

RUN npm install

# Copy source files
COPY . .

# Build arguments for Vite env variables (injected at build time)
ARG VITE_API_URL=https://cookshare.me/api/v1
ARG VITE_APP_NAME=cookshare
ARG VITE_DEBUG=false
ARG VITE_API_TIMEOUT=30000

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_DEBUG=$VITE_DEBUG
ENV VITE_API_TIMEOUT=$VITE_API_TIMEOUT

RUN npm run build

# ── Stage 2: Serve ──
FROM node:24-alpine AS production

WORKDIR /usr/src/app

RUN npm install -g serve@14

# Copy only the built output
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 5173

# Serve the static files on port 5173 with SPA fallback
CMD ["serve", "-s", "dist", "-l", "5173"]
