# Railway Deployment - Step by Step Commands

Run these commands in your terminal one by one:

## Step 1: Initialize Project
```bash
cd /Users/aamirhabibsaudagar/constintel
railway init
# Select your workspace when prompted
# Choose "Create a new project" or select existing project
```

## Step 2: Add PostgreSQL Database
```bash
railway add postgresql
```

## Step 3: Add Redis
```bash
railway add redis
```

## Step 4: Deploy Backend Service
```bash
cd backend

# Link to project (if not already linked)
railway link

# Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set ENCRYPTION_KEY=$(openssl rand -base64 32)
railway variables set LOG_LEVEL=info

# Deploy
railway up

# Note the backend URL from the output or Railway dashboard
```

## Step 5: Run Database Migrations
```bash
# Still in backend directory
railway run npx prisma migrate deploy
```

## Step 6: Deploy ML Service
```bash
cd ../services/ml_service

# Link to project
railway link

# Deploy
railway up

# Note the ML service URL
```

## Step 7: Deploy Frontend Service
```bash
cd ../../frontend

# Link to project
railway link

# Set environment variables (REPLACE with your actual URLs from steps 4 and 6)
railway variables set NEXT_PUBLIC_API_URL=https://your-backend-service.up.railway.app
railway variables set NEXT_PUBLIC_ML_API_URL=https://your-ml-service.up.railway.app
railway variables set NODE_ENV=production

# Deploy
railway up

# Note the frontend URL
```

## Step 8: Update Frontend URLs (if needed)
After deployment, get the actual URLs from Railway dashboard and update:
```bash
cd frontend
railway variables set NEXT_PUBLIC_API_URL=<actual-backend-url>
railway variables set NEXT_PUBLIC_ML_API_URL=<actual-ml-url>
```

## Step 9: Verify Deployment
1. Go to Railway dashboard: https://railway.app
2. Check all services are "Active"
3. Test your frontend URL
4. Check logs if there are issues: `railway logs`

## Getting Service URLs
To get service URLs:
- Railway Dashboard → Your Service → Settings → Networking → Generate Domain
- Or run: `railway domain` (from service directory)

