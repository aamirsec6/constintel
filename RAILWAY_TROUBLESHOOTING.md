# Railway Deployment Troubleshooting Guide

## Site Not Loading - Common Issues and Fixes

### 1. Check Service Status in Railway Dashboard

1. Go to [railway.app](https://railway.app)
2. Open your project
3. Check each service:
   - **Backend** - Should show "Active" status
   - **Frontend** - Should show "Active" status
   - **ML Service** - Should show "Active" status
   - **PostgreSQL** - Should show "Active" status
   - **Redis** - Should show "Active" status

**If a service shows "Failed" or "Crashed":**
- Click on the service
- Go to "Deployments" tab
- Check the logs for errors
- Common issues:
  - Build failures
  - Missing environment variables
  - Database connection errors

### 2. Check Environment Variables

**Backend Service:**
- `DATABASE_URL` - Should be auto-provided by Railway PostgreSQL
- `REDIS_URL` - Should be auto-provided by Railway Redis
- `NODE_ENV=production`
- `JWT_SECRET` - Must be set (32+ characters)
- `ENCRYPTION_KEY` - Must be set (32+ characters)
- `PORT=3000` (or let Railway auto-assign)

**Frontend Service:**
- `NEXT_PUBLIC_API_URL` - **CRITICAL** - Must be your backend Railway URL
  - Format: `https://your-backend-service.up.railway.app`
  - **NOT** `http://localhost:3000`
- `NEXT_PUBLIC_ML_API_URL` - Must be your ML service Railway URL
  - Format: `https://your-ml-service.up.railway.app`
  - **NOT** `http://localhost:8000`
- `NODE_ENV=production`

**To check/fix:**
1. Go to Railway dashboard → Your service → Variables
2. Verify all variables are set correctly
3. Update `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_ML_API_URL` with actual Railway URLs

### 3. Get Service URLs

1. In Railway dashboard, click on each service
2. Go to "Settings" → "Networking"
3. Click "Generate Domain" if no domain exists
4. Copy the public URL (e.g., `https://backend-production.up.railway.app`)
5. Update frontend environment variables with these URLs

### 4. Check Build Logs

**Common Build Errors:**

**Backend:**
- `Prisma Client not generated` - Run: `railway run npx prisma generate`
- `TypeScript errors` - Check `backend/tsconfig.json`
- `Missing dependencies` - Check `backend/package.json`

**Frontend:**
- `Next.js build errors` - Check `frontend/next.config.js`
- `Environment variable errors` - Ensure `NEXT_PUBLIC_*` variables are set
- `Module not found` - Check `frontend/package.json`

**To view logs:**
```bash
# Via CLI (after railway login)
cd backend && railway logs
cd frontend && railway logs

# Or in Railway dashboard:
# Service → Deployments → Click latest deployment → View logs
```

### 5. Database Migration Issues

If backend starts but can't connect to database:

```bash
# Run migrations
cd backend
railway run npx prisma migrate deploy

# Generate Prisma client
railway run npx prisma generate
```

### 6. CORS Issues

If frontend can't connect to backend:

**Backend CORS is already configured** (`app.use(cors())`), but verify:
- Frontend URL is correct in `NEXT_PUBLIC_API_URL`
- Backend is accessible (test: `curl https://your-backend.up.railway.app/health`)

### 7. Port Configuration

Railway automatically assigns ports. Don't hardcode ports:
- Backend should use `process.env.PORT` (Railway provides this)
- Frontend should use `process.env.PORT` (Railway provides this)

### 8. Health Check Endpoints

Test if services are running:

```bash
# Backend health check
curl https://your-backend.up.railway.app/health

# ML service health check  
curl https://your-ml-service.up.railway.app/health

# Frontend (should return HTML)
curl https://your-frontend.up.railway.app
```

### 9. Common Error Messages

**"502 Bad Gateway"**
- Service is crashing on startup
- Check service logs
- Verify environment variables are set

**"503 Service Unavailable"**
- Service is not running
- Check Railway dashboard for service status
- Restart the service

**"Connection refused"**
- Frontend can't reach backend
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend is running and accessible

**"Database connection error"**
- `DATABASE_URL` not set or incorrect
- PostgreSQL service not running
- Run migrations: `railway run npx prisma migrate deploy`

**"Redis connection error"**
- `REDIS_URL` not set or incorrect
- Redis service not running

### 10. Quick Fix Checklist

- [ ] All services show "Active" in Railway dashboard
- [ ] `DATABASE_URL` is set (auto-provided by Railway PostgreSQL)
- [ ] `REDIS_URL` is set (auto-provided by Railway Redis)
- [ ] `NEXT_PUBLIC_API_URL` is set to backend Railway URL (not localhost)
- [ ] `NEXT_PUBLIC_ML_API_URL` is set to ML service Railway URL (not localhost)
- [ ] `JWT_SECRET` is set (32+ characters)
- [ ] `ENCRYPTION_KEY` is set (32+ characters)
- [ ] Database migrations have been run
- [ ] All services have been deployed successfully
- [ ] Service URLs are accessible (test with curl)

### 11. Redeploy Services

If issues persist, try redeploying:

```bash
# Redeploy backend
cd backend
railway up

# Redeploy frontend
cd frontend
railway up

# Redeploy ML service
cd services/ml_service
railway up
```

### 12. Check Railway Status

Visit [status.railway.app](https://status.railway.app) to check if Railway is experiencing any outages.

### 13. Get Help

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Check service logs in Railway dashboard for specific error messages

