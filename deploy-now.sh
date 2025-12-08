#!/bin/bash
# Quick Railway Deployment - Run this script in your terminal

set -e

echo "🚀 Deploying ConstIntel to Railway"
echo "===================================="
echo ""

# Check if logged in
if ! railway whoami &>/dev/null; then
    echo "❌ Not logged in. Run: railway login --browserless"
    exit 1
fi

echo "✅ Logged in to Railway"
echo ""

# Add databases (these will prompt you to select)
echo "📦 Adding PostgreSQL database..."
railway add --database postgres

echo ""
echo "📦 Adding Redis database..."
railway add --database redis

echo ""
echo "🔧 Deploying Backend Service..."
cd backend

# Link to project
railway link

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
echo "🚀 Deploying backend..."
railway up

echo ""
echo "⏳ Waiting for backend to deploy..."
sleep 15

# Get backend URL
BACKEND_URL=$(railway domain 2>/dev/null || echo "")
if [ ! -z "$BACKEND_URL" ]; then
    echo "✅ Backend URL: https://$BACKEND_URL"
else
    echo "⚠️  Get backend URL from Railway dashboard"
fi

# Run migrations
echo ""
echo "🔄 Running database migrations..."
railway run npx prisma migrate deploy

cd ..

echo ""
echo "🤖 Deploying ML Service..."
cd services/ml_service

railway link
railway up

sleep 15
ML_URL=$(railway domain 2>/dev/null || echo "")
if [ ! -z "$ML_URL" ]; then
    echo "✅ ML Service URL: https://$ML_URL"
else
    echo "⚠️  Get ML service URL from Railway dashboard"
fi

cd ../..

echo ""
echo "🎨 Deploying Frontend Service..."
cd frontend

railway link

# Set frontend environment variables
if [ ! -z "$BACKEND_URL" ]; then
    railway variables set NEXT_PUBLIC_API_URL="https://$BACKEND_URL"
fi
if [ ! -z "$ML_URL" ]; then
    railway variables set NEXT_PUBLIC_ML_API_URL="https://$ML_URL"
fi
railway variables set NODE_ENV=production

railway up

sleep 15
FRONTEND_URL=$(railway domain 2>/dev/null || echo "")
if [ ! -z "$FRONTEND_URL" ]; then
    echo "✅ Frontend URL: https://$FRONTEND_URL"
else
    echo "⚠️  Get frontend URL from Railway dashboard"
fi

cd ..

echo ""
echo "✅ Deployment Complete!"
echo "======================"
echo ""
echo "📋 Your URLs:"
[ ! -z "$BACKEND_URL" ] && echo "   Backend: https://$BACKEND_URL"
[ ! -z "$ML_URL" ] && echo "   ML Service: https://$ML_URL"
[ ! -z "$FRONTEND_URL" ] && echo "   Frontend: https://$FRONTEND_URL"
echo ""
echo "🔍 If URLs are missing, check Railway dashboard: https://railway.app"
echo "   Go to each service → Settings → Networking → Generate Domain"
echo ""

