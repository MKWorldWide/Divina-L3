# GameDin L3 Gaming Blockchain - Production Dockerfile
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    bash

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S gamedin -u 1001

# Set working directory
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=base /app/dist ./dist
COPY --from=base /app/artifacts ./artifacts
COPY --from=base /app/contracts ./contracts
COPY --from=base /app/scripts ./scripts
COPY --from=base /app/hardhat.config.cjs ./

# Copy frontend build
COPY --from=base /app/gdi-dapp/build ./gdi-dapp/build

# Create necessary directories
RUN mkdir -p logs cache

# Change ownership to app user
RUN chown -R gamedin:nodejs /app
USER gamedin

# Expose ports
EXPOSE 3000 8545 9546 3001 9090

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Default command
CMD ["npm", "run", "start:all"]

# Development stage
FROM base AS development

# Install development dependencies
RUN npm install

# Expose ports
EXPOSE 3000 8545 9546 3001 9090

# Default command for development
CMD ["npm", "run", "dev"]

# Testing stage
FROM base AS testing

# Install all dependencies including dev dependencies
RUN npm install

# Copy test files
COPY test ./test

# Run tests
CMD ["npm", "run", "test"]

# Multi-stage build for different environments
FROM production AS staging
ENV NODE_ENV=staging

FROM production AS production
ENV NODE_ENV=production

# Labels
LABEL maintainer="GameDin Team <team@gamedin.com>"
LABEL version="1.0.0"
LABEL description="GameDin L3 Gaming Blockchain - AI-Powered Gaming Infrastructure"
LABEL org.opencontainers.image.source="https://github.com/gamedin/gamedin-l3-gaming-blockchain" 