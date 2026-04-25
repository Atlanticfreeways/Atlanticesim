# Render Deployment - Command Reference

## Pre-Deployment Commands

### 1. Verify Code Quality
```bash
# Build backend
npm run build

# Lint backend
npm run lint

# Build frontend
cd frontend
npm run build
cd ..

# Check for TypeScript errors
npm run build
```

### 2. Commit Changes
```bash
# Stage all changes
git add .

# Commit with message
git commit -m "Configure Render deployment with frontend and backend services"

# Push to main branch
git push origin main
```

### 3. Verify Git Status
```bash
# Check current branch
git branch

# Check uncommitted changes
git status

# View recent commits
git log --oneline -5
```

## Render CLI Commands

### Installation
```bash
# Install Render CLI
npm install -g render-cli

# Or using Homebrew (macOS)
brew install render-cli
```

### Authentication
```bash
# Login to Render
render login

# Verify authentication
render whoami
```

### Deployment
```bash
# Deploy using render.yaml
render deploy

# Deploy specific service
render deploy atlantic-esim-api
render deploy atlantic-esim-frontend

# View deployment status
render status
```

### Environment Variables
```bash
# Set environment variable
render env set atlantic-esim-api AIRALO_CLIENT_ID=your_value

# Get environment variable
render env get atlantic-esim-api AIRALO_CLIENT_ID

# List all environment variables
render env list atlantic-esim-api

# Delete environment variable
render env delete atlantic-esim-api AIRALO_CLIENT_ID
```

### Logs
```bash
# View service logs
render logs atlantic-esim-api

# View logs with follow (live)
render logs atlantic-esim-api --follow

# View logs from specific time
render logs atlantic-esim-api --since 1h

# View frontend logs
render logs atlantic-esim-frontend
```

### Service Management
```bash
# Restart service
render restart atlantic-esim-api

# Redeploy service
render redeploy atlantic-esim-api

# View service details
render service atlantic-esim-api

# List all services
render services
```

### Database
```bash
# Connect to database shell
render psql atlantic-esim-db

# View database info
render database atlantic-esim-db

# Backup database
render backup atlantic-esim-db
```

## Manual Render Dashboard Actions

### Deploy via Dashboard
```
1. Go to https://render.com/dashboard
2. Click "New +" → "Blueprint"
3. Select GitHub repository
4. Click "Deploy"
5. Wait for services to build
6. Add environment variables
7. Services auto-redeploy
```

### Add Environment Variables via Dashboard
```
1. Go to https://render.com/dashboard
2. Select service (e.g., atlantic-esim-api)
3. Click "Environment" tab
4. Click "Add Environment Variable"
5. Enter key and value
6. Click "Save"
7. Service auto-redeploys
```

### View Logs via Dashboard
```
1. Go to https://render.com/dashboard
2. Select service
3. Click "Logs" tab
4. View real-time logs
5. Search for errors
```

## Backend-Specific Commands

### Build Backend
```bash
# Install dependencies
npm ci

# Build NestJS
npm run build

# Check build output
ls -la dist/
```

### Database Migrations
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name migration_name

# View database
npx prisma studio
```

### Start Backend Locally
```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

## Frontend-Specific Commands

### Build Frontend
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm ci

# Build with Vite
npm run build

# Check build output
ls -la dist/

# Preview build
npm run preview
```

### Development
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Docker Commands

### Build Docker Images Locally
```bash
# Build frontend image
docker build -f frontend/Dockerfile -t atlantic-esim-frontend:latest .

# Build backend image
docker build -t atlantic-esim-api:latest .

# List images
docker images | grep atlantic
```

### Run Docker Containers Locally
```bash
# Run frontend
docker run -p 80:80 atlantic-esim-frontend:latest

# Run backend
docker run -p 3000:3000 atlantic-esim-api:latest

# Run with environment variables
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://... \
  atlantic-esim-api:latest
```

### Docker Compose
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild images
docker-compose build --no-cache
```

## Testing Commands

### Backend Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

### Frontend Tests
```bash
cd frontend

# Run tests (if configured)
npm run test

# Run tests in watch mode
npm run test:watch
```

## Verification Commands

### Verify Deployment
```bash
# Check frontend
curl https://atlantic-esim-frontend.onrender.com

# Check backend health
curl https://atlantic-esim-api.onrender.com/api/v1/health

# Check with verbose output
curl -v https://atlantic-esim-api.onrender.com/api/v1/health

# Check response headers
curl -i https://atlantic-esim-api.onrender.com/api/v1/health
```

### Check API Endpoints
```bash
# Get eSIM packages
curl https://atlantic-esim-api.onrender.com/api/v1/packages

# Get countries
curl https://atlantic-esim-api.onrender.com/api/v1/countries

# Check authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://atlantic-esim-api.onrender.com/api/v1/user
```

## Troubleshooting Commands

### Check Logs
```bash
# Backend logs
render logs atlantic-esim-api

# Frontend logs
render logs atlantic-esim-frontend

# Database logs
render logs atlantic-esim-db

# Follow logs in real-time
render logs atlantic-esim-api --follow
```

### Check Environment
```bash
# List backend environment variables
render env list atlantic-esim-api

# List frontend environment variables
render env list atlantic-esim-frontend

# Check specific variable
render env get atlantic-esim-api DATABASE_URL
```

### Restart Services
```bash
# Restart backend
render restart atlantic-esim-api

# Restart frontend
render restart atlantic-esim-frontend

# Redeploy backend
render redeploy atlantic-esim-api

# Redeploy frontend
render redeploy atlantic-esim-frontend
```

### Check Service Status
```bash
# View all services
render services

# View specific service
render service atlantic-esim-api

# Check deployment history
render deploys atlantic-esim-api
```

## Git Commands

### Prepare for Deployment
```bash
# Check current branch
git branch

# Switch to main
git checkout main

# Pull latest changes
git pull origin main

# Check status
git status

# View changes
git diff

# Stage changes
git add .

# Commit changes
git commit -m "Configure Render deployment"

# Push to GitHub
git push origin main
```

### Rollback
```bash
# View commit history
git log --oneline -10

# Revert to previous commit
git revert HEAD

# Reset to previous commit (careful!)
git reset --hard HEAD~1

# Push changes
git push origin main
```

## Environment Variable Setup Commands

### Backend Variables
```bash
# Set Airalo credentials
render env set atlantic-esim-api AIRALO_CLIENT_ID=your_id
render env set atlantic-esim-api AIRALO_CLIENT_SECRET=your_secret

# Set eSIM Go key
render env set atlantic-esim-api ESIM_GO_API_KEY=your_key

# Set Paystack keys
render env set atlantic-esim-api PAYSTACK_PUBLIC_KEY=pk_test_...
render env set atlantic-esim-api PAYSTACK_SECRET_KEY=sk_test_...

# Set SMTP credentials
render env set atlantic-esim-api SMTP_HOST=smtp.gmail.com
render env set atlantic-esim-api SMTP_PORT=587
render env set atlantic-esim-api SMTP_USER=your_email@gmail.com
render env set atlantic-esim-api SMTP_PASS=your_app_password
render env set atlantic-esim-api SMTP_FROM_EMAIL=noreply@atlanticesim.com
```

### Frontend Variables
```bash
# Set Stripe key
render env set atlantic-esim-frontend VITE_STRIPE_KEY=pk_test_...
```

## Quick Deploy Script

Save as `deploy.sh`:
```bash
#!/bin/bash

echo "🚀 Starting Render deployment..."

# Check git status
echo "📝 Checking git status..."
git status

# Build backend
echo "🔨 Building backend..."
npm run build

# Build frontend
echo "🔨 Building frontend..."
cd frontend && npm run build && cd ..

# Commit changes
echo "📤 Committing changes..."
git add .
git commit -m "Deploy to Render"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

# Deploy to Render
echo "🚀 Deploying to Render..."
render deploy

echo "✅ Deployment started! Check Render dashboard for progress."
```

Run with:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Useful Aliases

Add to `.bashrc` or `.zshrc`:
```bash
# Render aliases
alias render-logs-api="render logs atlantic-esim-api --follow"
alias render-logs-frontend="render logs atlantic-esim-frontend --follow"
alias render-restart-api="render restart atlantic-esim-api"
alias render-restart-frontend="render restart atlantic-esim-frontend"
alias render-status="render services"

# Git aliases
alias gp="git push origin main"
alias gc="git commit -m"
alias ga="git add ."
alias gs="git status"
```

## Common Command Sequences

### Full Deployment
```bash
npm run build && \
cd frontend && npm run build && cd .. && \
git add . && \
git commit -m "Deploy to Render" && \
git push origin main && \
render deploy
```

### Quick Redeploy
```bash
git add . && \
git commit -m "Update" && \
git push origin main
# Render auto-redeploys on push
```

### Check Everything
```bash
echo "=== Git Status ===" && git status && \
echo "=== Backend Health ===" && curl -s https://atlantic-esim-api.onrender.com/api/v1/health && \
echo "=== Frontend ===" && curl -s https://atlantic-esim-frontend.onrender.com | head -20
```

---

**Note**: Replace `your_value` with actual values when running commands.
