# Week 1 Implementation Tasks - Provider Foundation

**Week**: 1 of 8  
**Dates**: January 14-20, 2026  
**Goal**: Foundation setup + First provider integration  
**Status**: 🟡 In Progress

---

## 📋 Quick Reference

**Today's Priority Tasks**:
1. Add NotificationsModule import (5 min)
2. Configure CORS (10 min)
3. Update environment variables (30 min)
4. Sign up for provider APIs (1-2 hours)

**This Week's Goal**: Complete Airalo adapter implementation and testing

---

## Day 1: Foundation & Quick Fixes (TODAY - Jan 14)

### ✅ COMPLETED
- [x] Git repository initialization
- [x] Initial commit with ROADMAP.md
- [x] Push to remote (GitHub)
- [x] Resolve merge conflicts

### 🔴 TO DO TODAY

#### Task 1.1: Add NotificationsModule Import
**Time**: 5 minutes | **Priority**: 🔴 CRITICAL

**File**: `src/app.module.ts`

```typescript
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    // ... existing imports
    NotificationsModule, // ← ADD THIS
  ],
})
```

**Test**: `npm run start:dev` should start without errors

---

#### Task 1.2: Basic CORS Configuration
**Time**: 10 minutes | **Priority**: 🔴 CRITICAL

**File**: `src/main.ts`

```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**Add to `.env`**:
```bash
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:5173
```

---

#### Task 1.3: Environment Configuration
**Time**: 30 minutes | **Priority**: 🟡 HIGH

**Update `.env`** with:
```bash
# Application
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:5173

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/atlantic_esim

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Stripe (TEST MODE)
STRIPE_SECRET_KEY=sk_test_
STRIPE_PUBLISHABLE_KEY=pk_test_

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Provider APIs (to be filled)
AIRALO_API_KEY=
AIRALO_BASE_URL=https://sandbox.airalo.com/v2
BREEZE_API_KEY=
ESIMCARD_API_KEY=
HOLAFLY_API_KEY=
MAYA_MOBILE_API_KEY=
```

**Test**: `npm run db:push && npm run start:dev`

---

#### Task 1.4: Provider API Signups
**Time**: 1-2 hours | **Priority**: 🔴 CRITICAL

**Sign up for all 5 providers** (approval takes 3-5 days):

- [ ] **Airalo**: https://partners.airalo.com
- [ ] **Breeze**: Contact sales for API access
- [ ] **eSIMCard**: api@esimcard.com
- [ ] **Holafly**: https://www.holafly.com/partners
- [ ] **Maya Mobile**: Contact for API docs

**Track progress**:
```
Provider    | Applied | Approved | Credentials
------------|---------|----------|------------
Airalo      | [ ]     | [ ]      | [ ]
Breeze      | [ ]     | [ ]      | [ ]
eSIMCard    | [ ]     | [ ]      | [ ]
Holafly     | [ ]     | [ ]      | [ ]
Maya Mobile | [ ]     | [ ]      | [ ]
```

---

## Day 2: Provider Interface Design (Jan 15)

### Task 2.1: Create Provider Interface
**Time**: 2 hours | **Priority**: 🔴 CRITICAL

**File**: `src/common/interfaces/provider.interface.ts`

```typescript
export interface IProviderAdapter {
  getProviderName(): string;
  checkHealth(): Promise<ProviderHealth>;
  searchPackages(filters: PackageFilters): Promise<Package[]>;
  getPackageDetails(packageId: string): Promise<Package>;
  createOrder(orderData: CreateOrderDto): Promise<Order>;
  getOrderStatus(orderId: string): Promise<OrderStatus>;
  activateESIM(esimId: string): Promise<ActivationResult>;
  getESIMDetails(esimId: string): Promise<ESIMDetails>;
  getQRCode(esimId: string): Promise<string>;
}
```

---

### Task 2.2: Create Base Provider Class
**Time**: 1 hour | **Priority**: 🟢 MEDIUM

**File**: `src/common/providers/base-provider.adapter.ts`

```typescript
export abstract class BaseProviderAdapter {
  protected readonly logger: Logger;
  protected readonly httpClient: AxiosInstance;
  
  constructor(providerName: string, baseUrl: string, apiKey: string) {
    this.logger = new Logger(`${providerName}Adapter`);
    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
  }
  
  abstract searchPackages(filters: any): Promise<any[]>;
  // ... other abstract methods
}
```

---

## Day 3-4: Implement Airalo Adapter (Jan 16-17)

### Task 3.1: Airalo Adapter Implementation
**Time**: 4 hours | **Priority**: 🔴 CRITICAL

**File**: `src/modules/providers/adapters/airalo.adapter.ts`

```typescript
@Injectable()
export class AiraloAdapter extends BaseProviderAdapter {
  constructor(private configService: ConfigService) {
    super(
      'Airalo',
      configService.get('AIRALO_BASE_URL'),
      configService.get('AIRALO_API_KEY'),
    );
  }

  async searchPackages(filters: PackageFilters): Promise<Package[]> {
    const response = await this.httpClient.get('/packages', { params: filters });
    return response.data.data.map(pkg => this.normalizePackage(pkg));
  }
  
  // Implement all other methods...
}
```

---

### Task 3.2: Write Tests
**Time**: 2 hours | **Priority**: 🟡 HIGH

**Files**:
- `src/modules/providers/adapters/airalo.adapter.spec.ts` (unit)
- `test/integration/airalo.integration.spec.ts` (integration)

**Test coverage target**: >80%

---

## Day 5: Polish & Testing (Jan 18)

### Task 5.1: Update Provider Service
**Time**: 1 hour | **Priority**: 🟡 HIGH

**File**: `src/modules/providers/providers.service.ts`

```typescript
@Injectable()
export class ProvidersService {
  private providers: Map<string, IProviderAdapter> = new Map();

  constructor(private airaloAdapter: AiraloAdapter) {
    this.providers.set('airalo', this.airaloAdapter);
  }

  async searchAllProviders(filters: any): Promise<any[]> {
    const results = await Promise.allSettled(
      Array.from(this.providers.values()).map(p => p.searchPackages(filters))
    );
    return results.flatMap((r: any) => r.status === 'fulfilled' ? r.value : []);
  }
}
```

---

### Task 5.2: Manual Testing
**Time**: 1 hour | **Priority**: 🟢 MEDIUM

**Test checklist**:
```bash
# 1. Start backend
npm run start:dev

# 2. Test health
curl http://localhost:3000/api/v1/health

# 3. Test package search
curl http://localhost:3000/api/v1/packages?country=US

# 4. Test package details
curl http://localhost:3000/api/v1/packages/{id}
```

**Verify**:
- [ ] Backend starts without errors
- [ ] Package search returns results
- [ ] Package details work
- [ ] Error handling works

---

## Week 1 Success Criteria

### Must Have ✅
- [ ] Git initialized ✅ DONE
- [x] NotificationsModule imported
- [x] CORS configured
- [ ] Environment variables set
- [ ] All 5 provider API applications submitted
- [ ] Provider interface designed
- [ ] Airalo adapter implemented
- [ ] Airalo adapter tested
- [ ] At least 1 successful package search

### Nice to Have 🎯
- [ ] All provider APIs approved
- [ ] Base provider class with retry logic
- [ ] Health check endpoint
- [ ] API documentation started

---

## Daily Progress

**Day 1** (Jan 14):
- [x] Git setup
- [x] NotificationsModule
- [x] CORS
- [x] Environment (template updated)
- [ ] Provider signups

**Day 2** (Jan 15):
- [ ] Provider interface
- [ ] Base class

**Day 3-4** (Jan 16-17):
- [ ] Airalo adapter
- [ ] Tests

**Day 5** (Jan 18):
- [ ] Integration testing
- [ ] Manual testing

---

## Quick Commands

```bash
# Start development
npm run start:dev

# Run tests
npm run test
npm run test:e2e

# Database
npm run db:push
npm run db:seed

# Check git status
git status
git log --oneline -5
```

---

## Resources

- **NestJS Docs**: https://docs.nestjs.com
- **Prisma Docs**: https://www.prisma.io/docs
- **Project Roadmap**: `ROADMAP.md`
- **Architecture**: `docs/ARCHITECTURE.md`

---

**Last Updated**: January 14, 2026  
**Status**: 🟡 In Progress (15% complete)  
**Next**: Complete Day 1 tasks
