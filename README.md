# Atlantic eSIM Platform

🚀 **PRODUCTION READY** - Multi-provider eSIM aggregation platform integrating 5 major providers: Maya Mobile, eSIMCard, eSIM Go/Breeze, Holafly Business, and Airalo.

**Status**: ✅ Complete MVP ready for immediate deployment

## Quick Start

1. **Setup Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start Backend**
   ```bash
   docker-compose up -d postgres redis
   npm install
   npm run db:migrate
   npm run start:dev
   ```

3. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access Applications**
   - Frontend: http://localhost:3001
   - API Documentation: http://localhost:3000/api/docs

## Project Structure

```
src/                    # Backend (NestJS)
├── modules/
│   ├── auth/           # Authentication & JWT
│   ├── users/          # User management
│   ├── providers/      # Provider adapters
│   ├── packages/       # eSIM packages
│   ├── orders/         # Order management
│   ├── esims/          # eSIM operations
│   └── payments/       # Payment processing
├── common/             # Shared utilities
└── config/             # Configuration & Prisma

frontend/               # Frontend (React)
├── src/
│   ├── components/     # Reusable components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom hooks
│   ├── services/       # API services
│   └── types/          # TypeScript types
```

## Available Scripts

- `npm run start:dev` - Development server
- `npm run build` - Build for production
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm test` - Run tests

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

### User Profile
- `GET /api/v1/user/profile` - Get user profile
- `PUT /api/v1/user/profile` - Update user profile

### Packages
- `GET /api/v1/packages` - Search packages
- `GET /api/v1/packages/:id` - Package details
- `GET /api/v1/packages/compare` - Compare packages

### Orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders` - List user orders
- `GET /api/v1/orders/:id` - Get order details
- `POST /api/v1/orders/:id/cancel` - Cancel order

### eSIMs
- `GET /api/v1/esims` - List user eSIMs
- `GET /api/v1/esims/:id` - Get eSIM details
- `GET /api/v1/esims/:id/qr` - Get QR code
- `GET /api/v1/esims/:id/usage` - Get usage data
- `POST /api/v1/esims/:id/activate` - Activate eSIM

### Payments
- `POST /api/v1/payments/create-intent` - Create payment intent
- `POST /api/v1/payments/webhook` - Stripe webhook
- `POST /api/v1/payments/refund` - Refund payment

## Provider Integration Status

- ✅ Airalo (Data-only)
- ✅ Maya Mobile (Data + Voice + SMS)
- ✅ eSIMCard (Data + Voice + SMS)
- ✅ eSIM Go/Breeze (Data + Voice + SMS)
- ✅ Holafly Business (Data-only)

## Development Progress

### Phase 1: Foundation ✅
- [x] Project structure
- [x] Database schema
- [x] Authentication system
- [x] First provider adapter (Airalo)
- [x] Package search API

### Phase 2: Core Features ✅
- [x] Order management
- [x] Payment integration (Stripe)
- [x] eSIM operations
- [x] QR code generation
- [x] Usage tracking
- [x] Additional provider adapters

### Phase 3: Frontend ✅
- [x] React web application
- [x] User dashboard
- [x] Package browsing
- [x] Authentication UI
- [x] eSIM management
- [x] QR code display
- [x] Admin panel

### Phase 4: Production Ready ✅
- [x] All 5 provider adapters
- [x] Admin dashboard with analytics
- [x] CI/CD pipeline setup
- [x] Production Docker configuration
- [x] Nginx reverse proxy
- [x] Email notifications