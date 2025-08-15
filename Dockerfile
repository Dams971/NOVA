# NOVA Dental Practice Management Platform
# Multi-stage Docker build for Next.js 15 with healthcare-grade security

# =====================================
# Dependencies Stage
# =====================================
FROM node:18-alpine AS dependencies

# Install security updates and required packages
RUN apk add --no-cache \
  libc6-compat \
  openssl \
  ca-certificates \
  && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with security audit
RUN npm ci --only=production --audit --audit-level=moderate && \
  npm cache clean --force

# =====================================
# Builder Stage
# =====================================
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
  libc6-compat \
  openssl \
  && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Set build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# =====================================
# Production Stage
# =====================================
FROM node:18-alpine AS production

# Install security updates
RUN apk add --no-cache \
  dumb-init \
  openssl \
  ca-certificates \
  && addgroup -g 1001 -S nodejs \
  && adduser -S nova -u 1001 -G nodejs \
  && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy production dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nova:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nova:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nova:nodejs /app/public ./public

# Create directories for logs and uploads
RUN mkdir -p /app/logs /app/uploads \
  && chown -R nova:nodejs /app/logs /app/uploads

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nova

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node healthcheck.js || exit 1

# Start application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

# =====================================
# Development Stage
# =====================================
FROM node:18-alpine AS development

# Install development dependencies
RUN apk add --no-cache \
  libc6-compat \
  openssl \
  ca-certificates \
  git \
  && rm -rf /var/cache/apk/*

# Create non-root user for development
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nova -u 1001 -G nodejs

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Change ownership
RUN chown -R nova:nodejs /app

# Set development environment
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nova

# Start development server
CMD ["npm", "run", "dev"]

# =====================================
# Testing Stage
# =====================================
FROM development AS testing

# Switch back to root for test setup
USER root

# Install additional test dependencies
RUN apk add --no-cache \
  chromium \
  chromium-chromedriver \
  && rm -rf /var/cache/apk/*

# Set Playwright environment
ENV PLAYWRIGHT_BROWSERS_PATH=/usr/bin
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Switch back to nova user
USER nova

# Run tests
CMD ["npm", "run", "test"]