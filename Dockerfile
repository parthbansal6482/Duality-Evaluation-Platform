# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
# Copy only package files first for better caching
COPY dualityFrontend/package*.json ./
RUN npm install

# Copy source and build
COPY dualityFrontend ./
RUN npm run build


# --- Stage 2: Final Production Server ---
FROM node:20-slim

# Install minimal tools for health checking and troubleshooting
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Copy backend package files and install production deps first
COPY dualityBackend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# 2. Copy backend source code
COPY dualityBackend ./

# 3. Copy built frontend files from Stage 1 into the backend's public folder
COPY --from=frontend-builder /app/frontend/build ./public

# Set ownership to non-root user
RUN chown -R node:node /app

# Environment Configuration
ENV NODE_ENV=production
ENV START_WORKER=false
ENV PORT=5001

# Switch to non-privileged user
USER node

EXPOSE 5001

# The backend server serves both API and the static React files in ./public
CMD ["node", "src/server.js"]
