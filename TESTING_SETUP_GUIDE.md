# Atlantic eSIM - Testing Setup Guide
## Frontend + Backend Integration (No Real Provider APIs)

## Overview
This guide shows how to run the full platform (frontend UI + backend API) for testing without connecting to real provider APIs.

---

## Architecture Flow

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Frontend UI   │ ◄─────► │   Backend API    │ ◄─────► │   PostgreSQL    │
│  (React/Vite)   │  HTTP   │   (NestJS)       │         │   Database      │
│  Port: 3001     │         │   Port: 3002     │         │   Port: 5432    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │   Redis Cache    │
                            │   Port: 6379     │
                            └──────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │  Mock Provider   │
                            │  Data (Seeded)   │
                            └──────────────────┘
```

---

## What You'll Be Able to Test

### ✅ Frontend Features (Full Styling)
- **Dashboard**: View stats, active eSIMs, recent orders
- **Browse Packages**: Search and filter eSIM packages by country/region
- **Package Details**: View pricing, data allowance, validity
- **API Keys Management**: Generate and rotate API keys (for B2B partners)
- **Webhooks Configuration**: Set up event notifications
- **User Profile**: View and edit account settings
- **Responsive Design**: Mobile, tablet, desktop layouts

### ✅ Backend Features (API Connected)
- **Authentication**: Login, register, JWT tokens
- **User Management**: CRUD operations for users
- **Package Catalog**: Browse packages from seeded mock data
- **Order Creation**: Create orders (without actual provider fulfillment)
- **eSIM Management**: View eSIM details, QR codes (mock data)
- **Wallet System**: B2B partner prepaid wallet (ledger-based)
- **API Key Generation**: Create and manage developer keys
- **Webhook Events**: Trigger and receive webhook notifications
- **Health Monitoring**: Check system status

### ❌ What Won't Work (Provider APIs Disabled)
- **Real eSIM Activation**: No actual eSIM provisioning from providers
- **Live Data Usage**: No real-time data consumption tracking
- **Provider Health Checks**: No upstream provider latency monitoring
- **Actual Payment Processing**: Stripe integration disabled for testing

---

## Quick Start (3 Steps) ✅ COMPLETED

### Step 1: Start Database & Redis ✅
```bash
# Start PostgreSQL and Redis using Docker
cd "/Users/machine/My Drive/Github Projects/Atlantic eSim"
docker-compose up -d postgres redis
```
**Status**: ✅ Running - PostgreSQL on port 5432, Redis on port 6379

### Step 2: Start Backend API ✅
```bash
# Install dependencies (first time only)
npm install

# Run database migrations
npm run db:migrate

# Seed mock data (providers, packages, test users)
npm run db:seed

# Start backend server
npm run start:dev
```

**Backend running on:** http://localhost:3000 ✅  
**Database**: Connected and seeded with 6 providers ✅

### Step 3: Start Frontend UI ✅
```bash
# In a new terminal
cd frontend

# Install dependencies (first time only)
npm install --legacy-peer-deps

# PostCSS config created for Tailwind CSS
# Start frontend
npm run dev
```

**Frontend running on:** http://localhost:3003 ✅  
**Styling**: Tailwind CSS configured with PostCSS ✅

---

## Test Credentials

### Admin User
- **Email**: admin@atlanticesim.com
- **Password**: Admin123!
- **Role**: ADMIN (full access)

### Test Business Partner (B2B)
- **Email**: partner@test.com
- **Password**: Partner123!
- **Role**: BUSINESS_PARTNER (API keys, webhooks, wallet)

### Regular User
- **Email**: user@test.com
- **Password**: User123!
- **Role**: USER (standard customer)

---

## Mock Data Seeded

### Providers (6 Total)
1. **Airalo** - Priority 10, Europe/Asia/North America
2. **eSIM Go** - Priority 15, Global coverage
3. **Holafly** - Priority 25, Europe/South America
4. **Maya Mobile** - Priority 30, Africa/Asia Pacific
5. **eSIMCard** - Priority 40, Europe/North America
6. **Breeze** - Priority 50, North America/Europe

### Sample Packages (Auto-generated)
- **USA 5GB** - $15.00, 30 days validity
- **Europe 10GB** - $25.00, 30 days validity
- **Global 20GB** - $45.00, 30 days validity
- **Asia 3GB** - $12.00, 15 days validity

---

## Testing Workflows

### 1. Browse and Purchase Flow
```
1. Login → Dashboard
2. Click "Browse Packages"
3. Search for country (e.g., "USA")
4. Click package → View details
5. Click "Buy Now" → Checkout
6. Complete order (mock payment)
7. View order in "Order History"
```

### 2. B2B Partner Flow
```
1. Login as partner@test.com
2. Dashboard → "Partner Console"
3. Click "Developer Keys" → Generate API key
4. Click "Webhooks" → Add webhook URL
5. Test API with generated key (see API docs)
6. View wallet balance
7. Deposit funds (mock transaction)
```

### 3. API Testing (Postman/cURL)
```bash
# Login and get token
curl -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@atlanticesim.com","password":"Admin123!"}'

# Get packages
curl http://localhost:3002/api/v1/packages \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create order
curl -X POST http://localhost:3002/api/v1/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"packageId":"PACKAGE_ID","quantity":1}'
```

---

## Environment Configuration

### Backend (.env)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/namaskah_fresh"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="dev-secret-key"
PORT=3000
NODE_ENV="development"

# Provider APIs - Use mock/test keys
AIRALO_API_KEY="test-key"
ESIM_GO_API_KEY="test-key"
HOLAFLY_API_KEY="test-key"

# Disable real integrations
ENABLE_PAYMENT_PROCESSING=false
ENABLE_EMAIL_NOTIFICATIONS=false
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Atlantic eSIM
VITE_STRIPE_KEY=pk_test_placeholder
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
```

---

## Troubleshooting

### Frontend shows blank page
```bash
# Check browser console (F12) for errors
# Ensure backend is running on port 3002
# Verify VITE_API_URL in frontend/.env
```

### Backend won't start
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check if port 3002 is available
lsof -i :3002

# Run migrations
npm run db:migrate
```

### Database connection error
```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check DATABASE_URL in .env
# Ensure format: postgresql://user:pass@host:port/dbname
```

---

## Next Steps

### To Enable Real Provider APIs
1. Get API keys from providers (Airalo, eSIM Go, etc.)
2. Update `.env` with real keys
3. Set `ENABLE_PAYMENT_PROCESSING=true`
4. Configure Stripe keys
5. Test with sandbox/test environments first

### To Deploy to Production
1. Follow `docs/DEPLOYMENT_RUNBOOK.md`
2. Use AWS Secrets Manager for credentials
3. Enable monitoring and logging
4. Set up CI/CD pipeline

---

## Current Setup Status

### ✅ Completed
- [x] Docker containers running (PostgreSQL + Redis)
- [x] Backend API running on port 3000
- [x] Database migrated and seeded with 6 providers
- [x] Frontend running on port 3003
- [x] Tailwind CSS configured with PostCSS
- [x] Mock data displaying in UI
- [x] All dependencies installed

### 🔄 In Progress
- [ ] Connect frontend to real backend API (requires authentication)
- [ ] Implement login page for JWT token flow

### 📝 Notes
- Frontend currently uses mock data (useMockDashboard)
- Backend API requires JWT authentication for protected routes
- Provider health checks show warnings (expected - no real API keys)
- 2 out of 6 providers marked as healthy (eSIM Go, eSIMCard)

---

## Support

For issues or questions:
- Check `docs/ARCHITECTURE.md` for system design
- Review `docs/B2B_INTEGRATION_GUIDE.md` for API specs
- Contact engineering team

---

**Status**: Ready for Testing ✅  
**Last Updated**: April 24, 2026  
**Version**: 3.0.0
