#!/bin/bash
# Quick Railway Deployment Health Check
# Run this after: railway login

echo "🔍 Railway Deployment Health Check"
echo "==================================="
echo ""

# Check if logged in
if ! railway whoami &>/dev/null; then
    echo "❌ Not logged in. Run: railway login"
    exit 1
fi

echo "✅ Logged in to Railway"
echo ""

# Check project status
echo "📦 Project Status:"
railway status 2>&1 | head -10
echo ""

# Check backend
echo "🔧 Backend Service:"
cd backend 2>/dev/null && railway status 2>&1 | head -5 || echo "⚠️  Backend directory not found or not linked"
cd .. 2>/dev/null

# Check frontend
echo ""
echo "🎨 Frontend Service:"
cd frontend 2>/dev/null && railway status 2>&1 | head -5 || echo "⚠️  Frontend directory not found or not linked"
cd .. 2>/dev/null

# Check ML service
echo ""
echo "🤖 ML Service:"
cd services/ml_service 2>/dev/null && railway status 2>&1 | head -5 || echo "⚠️  ML service directory not found or not linked"
cd ../../.. 2>/dev/null

echo ""
echo "📋 Next Steps:"
echo "1. Check Railway dashboard: https://railway.app"
echo "2. Verify all services are 'Active'"
echo "3. Check environment variables (especially NEXT_PUBLIC_API_URL)"
echo "4. View logs: railway logs (from each service directory)"
echo "5. Test endpoints: curl https://your-service.up.railway.app/health"
echo ""

