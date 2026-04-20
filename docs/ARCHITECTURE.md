# Atlantic eSIM Platform - Architecture

## Overview

Atlantic eSIM Platform is a production-ready multi-provider eSIM aggregation system built with NestJS and React. It enables users to purchase, manage, and activate eSIM profiles from multiple providers through a unified interface.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│                    (Port 3001)                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/REST
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  API Gateway (NestJS)                        │
│                    (Port 3002)                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Global Middleware & Filters                         │   │
│  │  - Exception Handling                                │   │
│  │  - Request Validation                                │   │
│  │  - Rate Limiting                                     │   │
│  │  - CORS                                              │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐    ┌──────────┐    ┌──────────────┐
   │PostgreSQL│    │  Redis   │    │ Stripe API   │
   │Database  │    │  Cache   │    │ (Payments)   │
   └─────────┘    └──────────┘    └──────────────┘
        │
        ▼
   ┌─────────────────────────────────────────┐
   │  Prisma ORM                             │
   │  - Schema Management                    │
   │  - Migrations                           │
   │  - Type Safety                          │
   └─────────────────────────────────────────┘
```

## Module Structure

### Core Modules

#### 1. **Auth Module** (`src/modules/auth/`)
Handles user authentication and authorization.

**Responsibilities:**
- User registration and login
- JWT token generation and validation
- Password hashing with bcrypt
- Passport strategies (JWT, Local)

**Key Files:**
- `auth.service.ts` - Authentication logic
- `auth.controller.ts` - Auth endpoints
- `strategies/` - Passport strategies
- `guards/` - JWT and role-based guards

#### 2. **Users Module** (`src/modules/users/`)
Manages user profiles and preferences.

**Responsibilities:**
- User profile management
- User data retrieval
- Profile updates
- User preferences

**Key Files:**
- `users.service.ts` - User operations
- `users.controller.ts` - User endpoints
- `dto/` - Data transfer objects

#### 3. **Providers Module** (`src/modules/providers/`)
Manages eSIM provider integrations.

**Responsibilities:**
- Provider configuration
- Provider health checks
- Provider-specific adapters
- API key management

**Key Files:**
- `providers.service.ts` - Provider management
- `adapters/` - Provider-specific implementations

#### 4. **Packages Module** (`src/modules/packages/`)
Manages eSIM packages and pricing.

**Responsibilities:**
- Package search and filtering
- Package comparison
- Pricing information
- Coverage details

**Key Files:**
- `packages.service.ts` - Package operations
- `packages.controller.ts` - Package endpoints

#### 5. **Orders Module** (`src/modules/orders/`)
Handles order creation and management.

**Responsibilities:**
- Order creation
- Order status tracking
- Order cancellation
- Order history

**Key Files:**
- `orders.service.ts` - Order operations
- `orders.controller.ts` - Order endpoints
- `dto/` - Order DTOs

#### 6. **eSIMs Module** (`src/modules/esims/`)
Manages eSIM operations and activation.

**Responsibilities:**
- eSIM activation
- QR code generation
- Usage tracking
- Status management

**Key Files:**
- `esims.service.ts` - eSIM operations
- `esims.controller.ts` - eSIM endpoints

#### 7. **Payments Module** (`src/modules/payments/`)
Handles payment processing with Stripe.

**Responsibilities:**
- Payment intent creation
- Payment processing
- Refund handling
- Webhook management

**Key Files:**
- `payments.service.ts` - Payment operations
- `payments.controller.ts` - Payment endpoints

- `admin.controller.ts` - Admin endpoints

#### 9. **Partners Module** (`src/modules/partners/`)
B2B Reseller & Aggregator Infrastructure.

**Responsibilities:**
- Prepaid wallet management (Ledger)
- White-label partner branding
- API Key generation & rotate
- HMAC-signed Webhook dispatching
- Bulk eSIM ordering

**Key Files:**
- `wallet.service.ts` - Atomic ledger operations
- `partner-profile.service.ts` - Branding & margins
- `webhook-dispatcher.service.ts` - HMAC-SHA256 signature logic
- `partner-console.controller.ts` - B2B web frontend endpoints
- `partners.controller.ts` - Machine-to-machine API

### Common Utilities

#### Decorators (`src/common/decorators/`)
- `@Roles()` - Role-based access control

#### Guards (`src/common/guards/`)
- `RolesGuard` - Role validation
- `JwtAuthGuard` - JWT validation

#### Filters (`src/common/filters/`)
- `HttpExceptionFilter` - Global exception handling

#### Interfaces (`src/common/interfaces/`)
- `ProviderInterface` - Provider contract

## Data Flow

### User Registration Flow
```
1. User submits registration form
2. Frontend validates input
3. POST /api/v1/auth/register
4. Backend validates email format
5. Backend hashes password with bcrypt
6. Backend creates user in database
7. Return user object (without password)
```

10. Return order confirmation
```

### B2B Wallet Activation Flow
```
1. Partner initiates order via API (x-api-key)
2. Backend validates partner credit in Wallet (Ledger)
3. Backend applies Wholesale Margin / Smart-Select routing
4. If credit OK: Backend creates BullMQ activation job
5. BullMQ Worker: Provision eSIM with upstream provider
6. Worker: Deducts cost from Partner Wallet atomically
7. Worker: Dispatches HMAC-Signed Webhook to Partner URL
```

### eSIM Activation Flow
```
1. User requests eSIM activation
2. POST /api/v1/esims/:id/activate
3. Backend contacts provider API
4. Provider activates eSIM
5. Backend updates eSIM status
6. Backend generates QR code
7. Return activation confirmation
```

## Database Schema

### Key Tables

**users**
- id (UUID)
- email (unique)
- password (hashed)
- name
- role (enum: END_USER, BUSINESS_PARTNER, ADMIN, SUPPORT_AGENT)
- isActive
- createdAt, updatedAt

**orders**
- id (UUID)
- userId (FK)
- packageId (FK)
- providerId (FK)
- status (enum: PENDING, PROCESSING, CONFIRMED, ACTIVATED, COMPLETED, FAILED, CANCELLED, REFUNDED)
- paymentAmount
- paymentStatus
- transactionId
- createdAt, updatedAt

**esims**
- id (UUID)
- orderId (FK, unique)
- userId (FK)
- providerId (FK)
- iccid (unique)
- status (enum: INACTIVE, ACTIVE, EXPIRED, DEPLETED, SUSPENDED)
- qrCode
- activationCode
- dataUsed
- dataTotal
- validUntil
- createdAt, updatedAt

**packages**
- id (UUID)
- providerId (FK)
- name
- countries (array)
- regions (array)
- dataAmount
- dataUnit (enum: MB, GB)
- price
- features (array)
- hasVoice, hasSms
- createdAt, updatedAt

## Security Architecture

### Authentication
- JWT tokens with 24-hour expiration
- Refresh token mechanism
- Secure password hashing (bcrypt with 10 rounds)

### Authorization
- Role-based access control (RBAC)
- Route-level guards
- Resource-level permissions

### Data Protection
- HTTPS enforcement
- CORS configuration
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- XSS protection

### API Security
- Rate limiting per endpoint
- Request validation
- Error message sanitization
- Security headers (Helmet)

## Deployment Architecture

### Development
- Docker Compose with PostgreSQL and Redis
- Hot reload with NestJS watch mode
- Local Stripe testing

### Production
- Docker containers
- PostgreSQL managed database
- Redis cache layer
- Nginx reverse proxy
- SSL/TLS encryption
- CI/CD pipeline

## Performance Considerations

### Caching
- Redis for session management
- Query result caching
- Rate limit tracking

### Database Optimization
- Indexed queries
- Connection pooling
- Query optimization

### API Optimization
- Response compression
- Pagination for large datasets
- Lazy loading of related data

## Error Handling

### Global Exception Filter
- Catches all exceptions
- Formats error responses
- Logs errors appropriately
- Hides sensitive information in production

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request",
  "timestamp": "2025-11-18T12:00:00Z",
  "path": "/api/v1/endpoint"
}
```

## Monitoring & Logging

### Logging Levels
- ERROR: Critical errors
- WARN: Warnings and deprecations
- LOG: General information
- DEBUG: Detailed debugging information

### Metrics to Track
- API response times
- Error rates
- Database query performance
- Payment success rates
- Provider API availability

## Key Intelligence Features (V3)

### AI Smart-Select™ Routing
The platform utilizes an `AggregatorLogicService` that:
- Benchmarks wholesale costs across 6+ providers.
- Factors in API latency and provider reliability.
- Flags the "Best Value" package for frontend prioritization.

### Predictive Usage Pulse
The `UsagePredictorService` performs time-series analysis on `UsageUpdate` snapshots to:
- Calculate real-time consumption velocity (MB/hr).
- Predict the exact date and time of eSIM data depletion.
- Trigger proactive top-up alerts for enterprise users.

## Current Maturity
The platform is currently rated as **Institutional Grade**. All financial transactions are ledger-backed, all background operations are resilient via BullMQ, and all external notifications are cryptographically signed.

## Future Enhancements

1. **Microservices Architecture** - Split into independent services
2. **Message Queue** - Async processing with RabbitMQ/Kafka
3. **GraphQL API** - Alternative to REST
4. **Real-time Updates** - WebSocket support
5. **Advanced Analytics** - Machine learning for recommendations
6. **Multi-language Support** - i18n implementation
7. **Mobile App** - Native iOS/Android applications
