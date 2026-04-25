#!/bin/bash

# Atlantic eSIM - Production Startup Guide
# This script ensures stable backend and frontend startup in production

set -e

echo "🚀 Atlantic eSIM - Production Startup"
echo "===================================="

# 1. Environment Setup
echo "1️⃣  Setting up environment..."
export NODE_ENV=production
export PORT=${PORT:-3000}
export REDIS_HOST=${REDIS_HOST:-localhost}
export REDIS_PORT=${REDIS_PORT:-6379}

# 2. Database Setup
echo "2️⃣  Setting up database..."
npx prisma migrate deploy --skip-generate
npx prisma generate

# 3. Build Backend
echo "3️⃣  Building backend..."
npm run build

# 4. Build Frontend
echo "4️⃣  Building frontend..."
cd frontend
npm run build
cd ..

# 5. Start Backend
echo "5️⃣  Starting backend server..."
npm run start &
BACKEND_PID=$!

# 6. Wait for backend to be ready
echo "6️⃣  Waiting for backend to be ready..."
sleep 5
for i in {1..30}; do
  if curl -s http://localhost:$PORT/api/v1/health > /dev/null; then
    echo "✅ Backend is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Backend failed to start"
    kill $BACKEND_PID
    exit 1
  fi
  echo "Waiting... ($i/30)"
  sleep 1
done

# 7. Verify Frontend is Served
echo "7️⃣  Verifying frontend..."
if curl -s http://localhost:$PORT/ | grep -q "Atlantic eSIM"; then
  echo "✅ Frontend is being served!"
else
  echo "⚠️  Frontend may not be loading correctly"
fi

# 8. Health Check
echo "8️⃣  Running health checks..."
HEALTH=$(curl -s http://localhost:$PORT/api/v1/health)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "✅ System health check passed!"
  echo "Response: $HEALTH"
else
  echo "❌ Health check failed"
  kill $BACKEND_PID
  exit 1
fi

echo ""
echo "🎉 Production startup complete!"
echo "================================"
echo "Backend: http://localhost:$PORT"
echo "Frontend: http://localhost:$PORT/"
echo "Health: http://localhost:$PORT/api/v1/health"
echo ""
echo "Press Ctrl+C to stop the server"

# Keep process running
wait $BACKEND_PID
