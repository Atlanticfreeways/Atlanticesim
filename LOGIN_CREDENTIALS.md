# 🔐 Atlantic eSIM - Login Credentials

## Development Login

### Admin Account
- **Email**: `admin@atlanticesim.com`
- **Password**: `Admin123!`
- **Role**: Admin

---

## Application URLs

- **Frontend**: http://localhost:3001/
- **Backend API**: http://localhost:3002/api/v1/
- **API Documentation**: http://localhost:3002/api/v1/docs (if Swagger is enabled)

---

## Quick Start

1. Open http://localhost:3001/ in your browser
2. Click "Login" or "Sign In"
3. Enter the admin credentials above
4. You're ready to go! 🚀

## ✅ Fixed Issues

- **Proxy Configuration**: Updated Vite proxy to forward API requests from port 3001 → 3002
- **Database Connection**: Resolved by removing conflicting local PostgreSQL instance
- **Admin User**: Successfully seeded into database

---

## Creating Additional Users

You can register new users via:
- Frontend registration page
- API endpoint: `POST http://localhost:3002/api/v1/auth/register`

```bash
curl -X POST http://localhost:3002/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "YourPassword123!",
    "name": "Your Name"
  }'
```

---

## Database Seeded Data

The database has been seeded with:
- ✅ 1 Admin user
- ✅ 5 eSIM providers (Airalo, Maya Mobile, eSIMCard, Breeze, Holafly)

---

**Note**: These are development credentials. Change them in production!
