#!/bin/bash
# Railway Deployment Script
# Run this after: railway login

set -e

echo "🚀 Starting Railway Deployment for ConstIntel"
echo "=============================================="
echo ""

# Check if logged in
echo "📋 Checking Railway authentication..."
if ! railway whoami &>/dev/null; then
    echo "❌ Not logged in. Please run: railway login"
    exit 1
fi

echo "✅ Logged in to Railway"
echo ""

# Initialize project (if not already linked)
echo "📦 Initializing Railway project..."
if [ ! -f ".railway/project.json" ]; then
    railway init
else
    echo "✅ Project already linked"
fi

echo ""

# Add PostgreSQL
echo "🐘 Adding PostgreSQL database..."
railway add postgresql

echo ""

# Add Redis
echo "📦 Adding Redis..."
railway add redis

echo ""

# Deploy Backend
echo "🔧 Deploying Backend Service..."
cd backend

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set ENCRYPTION_KEY="$ENCRYPTION_KEY"
railway variables set LOG_LEVEL=info

echo "✅ Backend environment variables set"
echo ""

# Deploy backend
railway up --detach

# Get backend URL
echo "⏳ Waiting for backend deployment..."
sleep 10
BACKEND_URL=$(railway domain 2>/dev/null || echo "")
if [ -z "$BACKEND_URL" ]; then
    echo "⚠️  Backend URL not available yet. Check Railway dashboard for the URL."
    echo "   You'll need to set NEXT_PUBLIC_API_URL manually later."
else
    echo "✅ Backend deployed at: $BACKEND_URL"
    BACKEND_URL="https://$BACKEND_URL"
fi

cd ..

echo ""

# Run database migrations
echo "🔄 Running database migrations..."
cd backend
railway run npx prisma migrate deploy
cd ..

echo ""

# Deploy ML Service
echo "🤖 Deploying ML Service..."
cd services/ml_service
railway up --detach
sleep 10
ML_URL=$(railway domain 2>/dev/null || echo "")
if [ -z "$ML_URL" ]; then
    echo "⚠️  ML Service URL not available yet. Check Railway dashboard for the URL."
    echo "   You'll need to set NEXT_PUBLIC_ML_API_URL manually later."
else
    echo "✅ ML Service deployed at: https://$ML_URL"
    ML_URL="https://$ML_URL"
fi
cd ../..

echo ""

# Deploy Frontend
echo "🎨 Deploying Frontend Service..."
cd frontend

# Set frontend environment variables
if [ ! -z "$BACKEND_URL" ]; then
    railway variables set NEXT_PUBLIC_API_URL="$BACKEND_URL"
fi
if [ ! -z "$ML_URL" ]; then
    railway variables set NEXT_PUBLIC_ML_API_URL="$ML_URL"
fi
railway variables set NODE_ENV=production

railway up --detach
sleep 10
FRONTEND_URL=$(railway domain 2>/dev/null || echo "")
if [ -z "$FRONTEND_URL" ]; then
    echo "⚠️  Frontend URL not available yet. Check Railway dashboard for the URL."
else
    echo "✅ Frontend deployed at: https://$FRONTEND_URL"
fi

cd ..

echo ""
echo "✅ Deployment Complete!"
echo "======================"
echo ""
echo "📋 Next Steps:"
echo "1. Check Railway dashboard for service URLs: https://railway.app"
echo "2. If URLs weren't captured, update frontend environment variables:"
echo "   - NEXT_PUBLIC_API_URL (backend URL)"
echo "   - NEXT_PUBLIC_ML_API_URL (ML service URL)"
echo "3. Verify all services are running in Railway dashboard"
echo "4. Test your application at the frontend URL"
echo ""
echo "🔍 View logs:"
echo "   - Backend: cd backend && railway logs"
echo "   - ML Service: cd services/ml_service && railway logs"
echo "   - Frontend: cd frontend && railway logs"
echo ""

