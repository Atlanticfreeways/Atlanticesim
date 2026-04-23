# Production Deployment Hotfix - Prisma OpenSSL Issue

**Date:** April 23, 2026  
**Severity:** P0 - BLOCKER  
**Status:** 🔴 Production Down  
**ETA:** 2-4 hours

---

## Problem Summary

Production deployment failed due to Prisma query engine unable to load OpenSSL 1.1 library in Alpine Linux Docker container.

**Error:**
```
Error loading shared library libssl.so.1.1: No such file or directory
(needed by /app/node_modules/.prisma/client/libquery_engine-linux-musl.so.node)
```

**Impact:**
- Database connection fails completely
- Application cannot start
- Port 3000 never binds
- Health checks fail
- Deployment marked as failed

---

## Root Cause

Alpine Linux (used in `node:18-alpine` base image) ships with OpenSSL 3.x by default, but Prisma's pre-built query engine binary requires OpenSSL 1.1.x.

---

## Solution

### Option 1: Install OpenSSL 1.1 Compatibility (RECOMMENDED)

**Update Dockerfile:**

```dockerfile
FROM node:18-alpine AS builder

# Install OpenSSL 1.1 compatibility + build dependencies
RUN apk add --no-cache \
    openssl1.1-compat \
    libc6-compat \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    openssl1.1-compat \
    libc6-compat

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/main"]
```

**Pros:**
- Quick fix
- Minimal changes
- Works with existing Prisma setup

**Cons:**
- Relies on compatibility layer
- OpenSSL 1.1 is EOL (end of life)

---

### Option 2: Use Debian-based Image (ALTERNATIVE)

**Update Dockerfile:**

```dockerfile
FROM node:18-slim AS builder

# Install dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY . .
RUN npm run build

# Production stage
FROM node:18-slim

RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main"]
```

**Pros:**
- Native OpenSSL support
- More compatible with various libraries
- Larger ecosystem

**Cons:**
- Larger image size (~200MB vs ~150MB)
- Slightly slower builds

---

### Option 3: Specify Prisma Binary Target (ADVANCED)

**Update prisma/schema.prisma:**

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

**Then regenerate:**
```bash
npx prisma generate
```

**Pros:**
- Uses OpenSSL 3.x (modern)
- Smaller image size

**Cons:**
- Requires Prisma 4.8.0+
- May need testing with all queries

---

## Recommended Action Plan

**Use Option 1 (OpenSSL 1.1 Compatibility) for immediate fix:**

### Step 1: Update Dockerfile (5 minutes)

```bash
cd /path/to/atlantic-esim
# Edit Dockerfile with Option 1 changes above
```

### Step 2: Rebuild Docker Image (10 minutes)

```bash
docker build -t atlantic-esim:hotfix-openssl .
```

### Step 3: Test Locally (10 minutes)

```bash
# Start with docker-compose
docker-compose up

# Verify logs show successful database connection
docker-compose logs app | grep "Database connected"

# Test health endpoint
curl http://localhost:3000/health
```

### Step 4: Deploy to Staging (15 minutes)

```bash
# Push image to registry
docker tag atlantic-esim:hotfix-openssl registry.example.com/atlantic-esim:hotfix-openssl
docker push registry.example.com/atlantic-esim:hotfix-openssl

# Deploy to staging
# (Use your deployment method - Render, AWS, etc.)

# Run smoke tests
npm run test:e2e:staging
```

### Step 5: Deploy to Production (30 minutes)

```bash
# Deploy to production
# (Use your deployment method)

# Monitor logs
# Watch for "Database connected successfully"
# Watch for "Application listening on port 3000"

# Run smoke tests
curl https://api.atlantic-esim.com/health
curl https://api.atlantic-esim.com/api/v1/packages?country=US
```

### Step 6: Verify (15 minutes)

- [ ] Application starts successfully
- [ ] Database connection established
- [ ] Port 3000 bound and responding
- [ ] Health check returns 200 OK
- [ ] Provider health checks running
- [ ] API endpoints responding
- [ ] No errors in logs

---

## Additional Fixes Needed

While fixing the Prisma issue, also address:

### 1. Provider API URLs

**Verify these environment variables:**

```bash
# Check if URLs are accessible
curl -I https://sandbox-api.airalo.com/v2/status
curl -I https://api.mayamobile.com/v1/status
curl -I https://api.breeze.com/v1/status
```

**If any fail, update .env:**

```bash
# Use correct URLs (check provider documentation)
AIRALO_API_URL=https://api.airalo.com/v2  # Remove 'sandbox-' if production
MAYA_MOBILE_API_URL=https://api.mayamobile.io/v1  # Check correct domain
BREEZE_API_URL=https://api.getbreeze.com/v1  # Check correct domain
```

### 2. API Keys

**Ensure all provider API keys are set:**

```bash
# Check environment variables
echo $AIRALO_CLIENT_ID
echo $AIRALO_CLIENT_SECRET
# ... etc for all providers
```

---

## Rollback Plan

If deployment fails after fix:

1. **Immediate:** Revert to previous Docker image
   ```bash
   docker tag registry.example.com/atlantic-esim:previous registry.example.com/atlantic-esim:latest
   # Redeploy
   ```

2. **Database:** No schema changes in this hotfix, no rollback needed

3. **Monitoring:** Watch error rates, response times, database connections

---

## Prevention (Long-term)

Add to CI/CD pipeline:

1. **Pre-deployment validation:**
   ```bash
   # Test Docker image locally before deploy
   docker run --rm atlantic-esim:latest node -e "console.log('Image OK')"
   ```

2. **Prisma binary check:**
   ```bash
   # Verify Prisma can load
   docker run --rm atlantic-esim:latest npx prisma version
   ```

3. **Dependency audit:**
   ```bash
   # Check for missing system libraries
   docker run --rm atlantic-esim:latest ldd /app/node_modules/.prisma/client/*.node
   ```

4. **Staging deployment required:**
   - Never deploy to production without staging validation
   - Run full smoke test suite on staging
   - Require manual approval for production

---

## Communication

**Status Page Update:**
```
🔴 INVESTIGATING: Database connectivity issues preventing application startup.
ETA: 2-4 hours for resolution.
```

**Team Notification:**
```
@channel Production deployment failed due to Prisma/OpenSSL compatibility issue.
Hotfix in progress. ETA: 2-4 hours.
No data loss. Previous version still available for rollback if needed.
```

---

## Success Criteria

- [ ] Application starts without errors
- [ ] Database connection successful
- [ ] All 6 provider health checks pass (or known failures documented)
- [ ] API responds to requests
- [ ] No errors in logs for 30 minutes
- [ ] Smoke tests pass
- [ ] Monitoring shows normal metrics

---

**Assignee:** DevOps Lead + Backend Engineer  
**Started:** April 23, 2026 22:29 UTC  
**Target Completion:** April 24, 2026 02:00 UTC  
**Status:** 🔴 In Progress
