#!/bin/bash

# Restart frontend with cache clear for UI updates

echo "🔄 Restarting frontend with UI enhancements..."

# Kill existing processes
echo "⏹️  Stopping existing frontend..."
pkill -f "next dev" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
sleep 2

# Clear Next.js cache
echo "🧹 Clearing Next.js cache..."
cd frontend
rm -rf .next
echo "✅ Cache cleared"

# Restart
echo "🚀 Starting frontend on port 3001..."
cd ..
cd frontend && npm run dev > /tmp/frontend-ui.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > /tmp/frontend-ui.pid

sleep 5

echo ""
echo "✅ Frontend restarted!"
echo "📊 Dashboard URL: http://localhost:3001/analytics/dashboard"
echo ""
echo "⚠️  IMPORTANT:"
echo "   1. Hard refresh your browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
echo "   2. Or clear browser cache completely"
echo "   3. You should see enhanced UI with gradients and sparklines"
echo ""
echo "📋 Frontend logs: tail -f /tmp/frontend-ui.log"

