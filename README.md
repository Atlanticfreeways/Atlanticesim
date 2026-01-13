# Atlantic eSIM Platform

🚀 **PRODUCTION READY** - Multi-provider eSIM aggregation platform

**Status**: ✅ Complete MVP ready for immediate deployment

## 📚 Documentation

**New to the project?** Start here:
- 👨💻 [Developer Setup Guide](./DEVELOPER_SETUP.md) - Complete setup instructions

## Quick Start (5 minutes)

1. **Clone & Setup**
   ```bash
   git clone https://github.com/Atlanticfreeways/Atlanticesim.git
   cd atlantic-esim
   cp .env.example .env
   ```

2. **Get Credentials**
   - Ask team lead for API keys
   - Fill in `.env` with your values

3. **Start Development**
   ```bash
   npm install
   docker-compose up -d
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

4. **Start Frontend** (in another terminal)
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access Applications**
   - Frontend: http://localhost:3001
   - Backend: http://localhost:3002
   - API Docs: http://localhost:3002/api/docs

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

## Features

- ✅ Multi-provider support
- ✅ Data, Voice, and SMS capabilities
- ✅ Global coverage
- ✅ Order management
- ✅ Payment integration
- ✅ Admin dashboard with analytics
- ✅ CI/CD pipeline
- ✅ Email notifications
