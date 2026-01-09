# =========================
# Builder stage
# =========================
FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the project (TypeScript / NestJS)
RUN npm run build

# =========================
# Production stage
# =========================
FROM node:24-alpine AS production

# Create non-root user
# RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

RUN chown -R node:node /app

USER node

# Copy package files and install production deps
COPY --chown=app:app package*.json ./
RUN npm ci --omit=dev

# Copy built code from builder
COPY --from=builder --chown=app:app /app/dist ./dist

# Expose API port
EXPOSE 5001

# Start the app
CMD ["npm", "start"]
