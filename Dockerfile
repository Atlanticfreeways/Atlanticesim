# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY . .

RUN npm run build

# Production Stage
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
# Copy node_modules is handled by npm ci above, but we need generated prisma client?
# Usually generated client is in node_modules/@prisma/client.
# So we might need to copy node_modules from builder OR re-run generate in prod.
# Re-running generate is safer for architecture matching, but needs dev deps (prisma CLI).
# Alternate: Copy the generated client from builder.
# The standard recommendation is to run `npx prisma generate` in production stage or copy specific folders.
# Let's simple copy the builder's node_modules which includes everything if we ran npm ci (including dev).
# No, we want small image.
# We will regenerate prisma client in production using the schema.
# But `prisma` CLI is a dev dependency. 
# Best practice: Copy generated client or install prisma globally?
# Let's copy the generated client from builder:
# Default location: node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

CMD ["node", "dist/main"]