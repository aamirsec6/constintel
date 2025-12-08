# Quick Start Guide - All Services

## ✅ Services Are Running

All services have been started with proper ports:

### Port Configuration

- **Frontend**: http://localhost:3001 (Next.js dashboard)
- **Backend API**: http://localhost:3000 (Express API)
- **ML Service**: http://localhost:8000 (Python FastAPI)

## Quick Commands

### Restart All Services
```bash
./restart-services.sh
```

### Stop All Services  
```bash
./stop-all-services.sh
```

### Check Service Health

```bash
# Backend
curl http://localhost:3000/health

# ML Service
curl http://localhost:8000/health

# Frontend (open in browser)
open http://localhost:3001
```

### View Logs

```bash
# Backend logs
tail -f logs/backend.log

# ML Service logs
tail -f logs/ml-service.log

# Frontend logs
tail -f logs/frontend.log
```

## Access URLs

- **Analytics Dashboard**: http://localhost:3001/analytics/dashboard
- **Cohort Analysis**: http://localhost:3001/analytics/cohorts
- **Funnel Analysis**: http://localhost:3001/analytics/funnels
- **Channel Attribution**: http://localhost:3001/analytics/channels
- **API Health**: http://localhost:3000/health
- **ML Service Health**: http://localhost:8000/health

## Fixing Recharts Error

If you still see the recharts error in the browser:

1. **The packages are already installed** ✅
2. **You just need to refresh the page** (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)

Or if that doesn't work:
```bash
cd frontend
rm -rf .next
./restart-services.sh
```

The services are now running correctly on their proper ports!

