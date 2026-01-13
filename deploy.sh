#!/bin/bash

# Atlantic eSIM - Production Deployment Script

set -e

echo "🚀 Atlantic eSIM - Production Deployment"
echo "=========================================="
echo ""

# Step 1: Stop development containers
echo "📦 Step 1: Stopping development containers..."
docker-compose down 2>/dev/null || true
sleep 5

# Step 2: Check if .env.production exists
echo "📝 Step 2: Checking environment file..."
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production not found!"
    echo ""
    echo "Please create .env.production with:"
    echo "  POSTGRES_DB=atlantic_esim"
    echo "  POSTGRES_USER=postgres"
    echo "  POSTGRES_PASSWORD=your-secure-password"
    echo "  DATABASE_URL=postgresql://postgres:your-password@postgres:5432/atlantic_esim"
    echo "  REDIS_URL=redis://redis:6379"
    echo "  JWT_SECRET=your-jwt-secret"
    echo "  STRIPE_SECRET_KEY=sk_live_xxx"
    echo "  STRIPE_WEBHOOK_SECRET=whsec_xxx"
    exit 1
fi
echo "✅ .env.production found"

# Step 3: Load environment variables
echo "🔧 Step 3: Loading environment variables..."
export $(cat .env.production | xargs)

# Step 4: Start production services
echo "🐳 Step 4: Starting production services..."
docker-compose -f docker-compose.prod.yml up -d
echo "✅ Services started"

# Step 5: Wait for services to be ready
echo "⏳ Step 5: Waiting for services to be ready..."
sleep 20

# Step 6: Check service status
echo "📊 Step 6: Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# Step 7: Run database migrations
echo "🗄️  Step 7: Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T app npx prisma migrate deploy
echo "✅ Migrations completed"

# Step 8: Seed database (optional)
echo ""
echo "🌱 Step 8: Seed database? (optional)"
read -p "Do you want to seed the database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose -f docker-compose.prod.yml exec -T app npm run db:seed
    echo "✅ Database seeded"
fi

# Step 9: Summary
echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "📍 Access your application:"
echo "   Frontend: http://localhost:3001"
echo "   Backend API: http://localhost:3002/api/v1"
echo "   API Docs: http://localhost:3002/api/docs"
echo ""
echo "📊 Check status:"
echo "   docker-compose -f docker-compose.prod.yml ps"
echo ""
echo "📋 View logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose -f docker-compose.prod.yml down"
echo ""
