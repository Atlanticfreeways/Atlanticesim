# Atlantic eSIM: Active Todo & Future Roadmap

**Status**: 🚀 Institutional Grade (Phase 10 Complete)  
**Last Updated**: April 22, 2026  
**Current Focus**: Phase 11 - Package Classification & Smart Routing (Foundation Complete)

---

## 📅 Immediate Tasks (Maintenance)

- [ ] **Provider Pulse**: Perform manual sanity check on the "AI Smart-Select" route logic for the new May 2026 rate sheets.
- [ ] **Log Rotation**: Verify production log rotation policies for the `winston` logger to prevent storage bloat.
- [ ] **Database Migration**: Apply Phase 11 migration when production DB is available (`npx prisma migrate deploy`)

---

## 🚀 Phase 11: Package Classification, Smart Routing & Usage Intelligence

> **Full spec**: [docs/PHASE_11_PACKAGE_CLASSIFICATION.md](./PHASE_11_PACKAGE_CLASSIFICATION.md)  
> **Progress**: [docs/PHASE_11_PROGRESS.md](./PHASE_11_PROGRESS.md)  
> **Quick Reference**: [docs/CLASSIFICATION_REFERENCE.md](./CLASSIFICATION_REFERENCE.md)

### 🏷️ 1. Package Type & Scope Classification (Priority: Critical) ✅ FOUNDATION COMPLETE
- [x] Add `PackageType` enum: DATA_ONLY, VOICE_ONLY, TEXT_ONLY, DATA_WITH_TEXT, DATA_WITH_CALL, DATA_WITH_ALL_UNLIMITED, TEXT_WITH_CALL, ALL_INCLUSIVE
- [x] Add `ScopeType` enum: LOCAL, REGIONAL, GLOBAL, MULTI_COUNTRY
- [x] Create `package-classifier.util.ts` + `country-regions.ts` mapping (190+ countries)
- [x] Prisma migration: new enums + fields on Package, ESim, UsageUpdate, Provider
- [x] Update all 6 adapters to map voice/SMS/unlimited/scope from provider APIs
- [x] Unit tests for classifier (14/14 passing)
- [ ] Add `@WithCircuitBreaker()` to Maya Mobile, eSIMCard, Breeze, Holafly
- [ ] Update adapter unit tests to verify classification logic

### 📊 2. Daily Usage Sync Engine (Priority: Critical)
- [ ] Build `UsageSyncService` — cron every 6 hours, polls all active eSIMs
- [ ] Track data MB, voice minutes, SMS count per snapshot
- [ ] Extend `UsagePredictorService` for voice/SMS depletion predictions
- [ ] Add `GET /esims/:id/usage/daily` and `GET /esims/:id/usage/summary`
- [ ] Trigger `esim.usage.warning` webhook at 80% consumption (data/voice/SMS)

### 🧠 3. Smart Provider Routing (Priority: Critical)
- [ ] Build `ProviderRouterService` — auto-select cheapest healthy provider
- [ ] Make `providerId` optional in `POST /orders`
- [ ] Add fallback chain in `ActivationProcessor` — try alt provider before FAILED
- [ ] Seed provider priority + preferredRegions in database

### 📦 4. Catalog Sync & Search (Priority: High)
- [ ] Build `CatalogSyncService` — nightly sync of all provider catalogs to local DB
- [ ] Rewrite `PackagesService.searchPackages()` to query DB first, live fallback
- [ ] Extend `SearchPackagesDto`: packageType, scopeType, region, hasSms, duration, sortBy

---

## 🔮 Phase 12: The Scaling Era (Future)

### 📱 1. Native Mobile Transition
- [ ] Evaluate React Native vs. Flutter for native eSIM provisioning.
- [ ] Design native push notification architecture for "Data Exhaustion" alerts.
- [ ] Prototype high-fidelity "Usage Dashboard" for mobile.

### 💼 2. Partner CRM (B2B Expansion)
- [ ] Design a sub-partner management dashboard for resellers.
- [ ] Add "Wholesale Insights" report for partners (most popular regions, usage peaks).
- [ ] Implement automated invoicing for month-end reconciliation.

### 🛡️ 3. Advanced Security & Compliance
- [ ] Implement ML-driven fraud detection for anomalous B2B traffic.
- [ ] Automate VAT/GST calculations for EU/UK regions.
- [ ] Perform a bi-annual penetration test on the Webhook HMAC engine.

### 🌍 4. Global Connectivity
- [ ] Integrate 2 additional Tier-1 providers (Starlink/Satellite data evaluation).
- [ ] Optimize "Smart-Select" weights for Latency vs. Cost.

---

## ✅ Completed (Recent)

### Phase 10: Unified Startup & Production Stability (April 21, 2026)

#### Build Pipeline Fixes
- [x] **Created `tsconfig.build.json`**: Excluded `*.spec.ts` and `*.e2e-spec.ts` from `nest build` — resolved 18 TypeScript errors from stale Stripe-based payment test files referencing removed `createPaymentIntent` method.
- [x] **Updated `nest-cli.json`**: Added `tsConfigPath: "tsconfig.build.json"` so the NestJS CLI uses the correct compilation config.
- [x] **Fixed Prisma 5.x `Decimal` import**: Changed `@prisma/client/runtime` → `@prisma/client/runtime/library` in `pricing.service.ts` and `wallet.service.ts`.

#### Dependency Injection Fixes
- [x] **Fixed `PartnersModule`**: Registered and exported `WalletService`, `PartnerProfileService`, and `WebhookDispatcherService` — these were missing from the module's providers/exports.
- [x] **Fixed `QueuesModule`**: Imported `PartnersModule` so `ActivationProcessor` can resolve its partner service dependencies.
- [x] **Fixed `HealthModule`**: Imported `QueuesModule` to make the `BullQueue_activations` token available for `HealthController`.

#### Deprecated/Broken Middleware Removal
- [x] **Removed `csurf`**: Deprecated package, incompatible with JWT-based API architecture — every POST/PUT/DELETE was blocked without a CSRF token.
- [x] **Removed `connect-timeout`**: Unnecessary Express middleware — NestJS handles request timeouts natively.

#### Unified Single-Port Architecture
- [x] **NestJS serves frontend**: `main.ts` now serves the built React app from `frontend/dist/` as static assets with SPA fallback for client-side routing.
- [x] **Unified port 3000**: Backend API + frontend UI served from a single port — eliminated the need for separate Vite dev server (port 3001) and backend (port 3002) in production.
- [x] **Graceful shutdown**: Added `enableShutdownHooks()` for clean process termination on SIGTERM/SIGINT.

#### Configuration Fixes
- [x] **Fixed Redis config mismatch**: `app.module.ts` BullMQ config now parses `REDIS_URL` from `.env` instead of reading non-existent `REDIS_HOST`/`REDIS_PORT` vars.
- [x] **Fixed `.env` broken quote**: `ESIMCARD_API_KEY` was missing its closing `"`, corrupting all subsequent environment variables.
- [x] **Updated `.env` ports**: Unified `PORT`, `FRONTEND_URL`, `BACKEND_URL`, and `ALLOWED_ORIGINS` to port 3000.
- [x] **Updated `frontend/.env`**: `VITE_API_URL` now points to unified port 3000.
- [x] **Updated `frontend/vite.config.ts`**: Dev proxy target updated to port 3000.

#### Docker & Deployment
- [x] **Unified `Dockerfile`**: Multi-stage build compiles both frontend and backend into a single container — no separate nginx required.
- [x] **Simplified `docker-compose.yml`**: Single app port (3000), healthchecks on Postgres and Redis, `depends_on` with `condition: service_healthy`.
- [x] **Simplified `docker-compose.prod.yml`**: Removed separate nginx service — NestJS handles static serving. Single exposed port 3000.
- [x] **Added build scripts**: `build:all` (backend + frontend), `start:unified` (build + run) in `package.json`.

#### Dependency Audit
- [x] **Removed `csurf` and `@types/csurf`** from `package.json`.
- [x] **Removed `connect-timeout` and `@types/connect-timeout`** from `package.json`.

### Earlier Phases
- [x] **Phase 9 Graduation**: Operational Excellence & B2B Webhooks.
- [x] **AI UsagePredictor™**: real-time MB/hr modeling.
- [x] **HMAC Webhook Signatures**: Cryptographic verification for partners.
- [x] **Provider Health Monitoring**: Automatic failover logic.
