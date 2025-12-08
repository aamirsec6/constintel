# Railway Deployment Guide

Complete guide for deploying ConstIntel to Railway, making it accessible on the internet.

## Deployment Methods

This guide supports two deployment methods:

1. **Railway CLI (Recommended)** - Deploy directly from your local machine without GitHub
2. **Railway Dashboard** - Use the web interface (still requires CLI for code deployment)

**Note:** You don't need a GitHub repository to deploy. Railway CLI can deploy directly from your local codebase.

## Prerequisites

- Railway account (sign up at [railway.app](https://railway.app))
- Railway CLI installed: `npm i -g @railway/cli`
- Git installed (for version control, Railway CLI uses it)
- Local codebase ready for deployment

## Quick Start (Using Railway CLI - Recommended)

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Create Railway Project**
   ```bash
   railway init
   ```
   This will create a new project and link your local directory to it.

4. **Provision Managed Services**
   - Add PostgreSQL: `railway add postgresql`
   - Add Redis: `railway add redis`

5. **Deploy Services**
   - Deploy backend: `cd backend && railway up`
   - Deploy ML service: `cd services/ml_service && railway up`
   - Deploy frontend: `cd frontend && railway up`

6. **Configure Environment Variables**
   - Set variables using CLI or Railway dashboard
   - See `railway.env.template` for required variables

7. **Run Database Migrations**
   ```bash
   railway run --service backend npx prisma migrate deploy
   ```

## Alternative: Deploy via Railway Dashboard

If you prefer using the web dashboard instead of CLI, see "Deploy via Railway Dashboard" section below.

## Detailed Deployment Steps

### Method 1: Deploy Using Railway CLI (Recommended)

#### Step 1: Install and Setup Railway CLI

```bash
# Install Railway CLI globally
npm i -g @railway/cli

# Login to Railway
railway login
```

#### Step 2: Initialize Railway Project

```bash
# Navigate to your project root
cd /path/to/constintel

# Initialize Railway project (creates new project and links it)
railway init
```

This will:
- Create a new Railway project
- Link your local directory to the Railway project
- Create a `.railway` directory with project configuration

#### Step 3: Provision PostgreSQL Database

```bash
# Add PostgreSQL service
railway add postgresql
```

Railway will automatically:
- Create a PostgreSQL instance
- Generate `$DATABASE_URL` environment variable
- Make it available to all services in the project

#### Step 4: Provision Redis

```bash
# Add Redis service
railway add redis
```

Railway will automatically:
- Create a Redis instance
- Generate `$REDIS_URL` environment variable
- Make it available to all services

#### Step 5: Deploy Backend Service

```bash
# Navigate to backend directory
cd backend

# Link to the same Railway project (if not already linked)
railway link

# Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set ENCRYPTION_KEY=$(openssl rand -base64 32)
railway variables set LOG_LEVEL=info

# Deploy the backend service
railway up
```

Railway will:
- Detect the `Dockerfile` in the backend directory
- Build the Docker image
- Deploy the service
- Provide a public URL

**Note the backend URL** (e.g., `https://backend-production.up.railway.app`)

#### Step 6: Run Database Migrations

```bash
# Run migrations in the backend service
railway run npx prisma migrate deploy
```

#### Step 7: Deploy ML Service

```bash
# Navigate to ML service directory
cd ../services/ml_service

# Link to the same Railway project
railway link

# Deploy the ML service
railway up
```

**Note the ML service URL** (e.g., `https://ml-service-production.up.railway.app`)

#### Step 8: Deploy Frontend Service

```bash
# Navigate to frontend directory
cd ../../frontend

# Link to the same Railway project
railway link

# Set environment variables (use the URLs from previous steps)
railway variables set NEXT_PUBLIC_API_URL=https://your-backend-service.up.railway.app
railway variables set NEXT_PUBLIC_ML_API_URL=https://your-ml-service.up.railway.app
railway variables set NODE_ENV=production

# Deploy the frontend service
railway up
```

**Note the frontend URL** (e.g., `https://frontend-production.up.railway.app`)

#### Step 9: Deploy Worker Services (Optional)

```bash
# Navigate back to backend directory
cd ../backend

# Deploy event worker as a separate service
railway up --service event-worker
# Or set the start command: railway variables set START_COMMAND="npm run worker:event"

# Deploy automation worker
railway up --service automation-worker
# Or set the start command: railway variables set START_COMMAND="npm run worker:automation"
```

### Method 2: Mixed Approach (Dashboard + CLI)

You can use the Railway dashboard to create services and manage them, but you'll still need Railway CLI to deploy code:

1. **Create Project in Dashboard:**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Empty Project"

2. **Add Services via Dashboard:**
   - Add PostgreSQL: Click "+ New" → "Database" → "Add PostgreSQL"
   - Add Redis: Click "+ New" → "Database" → "Add Redis"

3. **Deploy Code via CLI:**
   - Install CLI: `npm i -g @railway/cli`
   - Login: `railway login`
   - Link project: `railway link` (from project root)
   - Deploy services using CLI commands from Method 1

4. **Manage via Dashboard:**
   - View logs, set environment variables, monitor services
   - All management can be done in the web dashboard

**Note:** Railway CLI is required for deploying code without GitHub. The dashboard is great for managing services, but code deployment needs the CLI.

### Step 8: Update Frontend URLs

After all services are deployed:

1. Get the public URLs from Railway dashboard:
   - Backend: `https://backend-production.up.railway.app`
   - ML Service: `https://ml-service-production.up.railway.app`

2. Update frontend environment variables:
   - Go to frontend service → Variables
   - Update:
     ```
     NEXT_PUBLIC_API_URL=https://backend-production.up.railway.app
     NEXT_PUBLIC_ML_API_URL=https://ml-service-production.up.railway.app
     ```

3. Redeploy frontend (Railway will auto-redeploy on variable change, or trigger manually)

## Environment Variables Reference

See `railway.env.template` for complete list of environment variables.

### Required Variables

- `JWT_SECRET` - Strong secret for JWT tokens (min 32 chars)
- `ENCRYPTION_KEY` - Encryption key (min 32 chars)
- `NEXT_PUBLIC_API_URL` - Backend public URL
- `NEXT_PUBLIC_ML_API_URL` - ML service public URL

### Auto-Provided by Railway

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `RAILWAY_PUBLIC_DOMAIN` - Public domain for service
- `RAILWAY_ENVIRONMENT` - Environment name

### Generating Secrets

Generate strong secrets using:

```bash
# JWT Secret
openssl rand -base64 32

# Encryption Key
openssl rand -base64 32
```

## Database Migrations

### Using Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run migrations
railway run --service backend npx prisma migrate deploy
```

### Using Railway Dashboard

1. Go to backend service → Deployments
2. Click "Run Command"
3. Enter: `npx prisma migrate deploy`
4. Click "Run"

## Custom Domains

Railway provides default domains, but you can add custom domains:

1. Go to your service → Settings → Domains
2. Click "Generate Domain" or "Custom Domain"
3. For custom domain, add DNS records as instructed
4. Update `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_ML_API_URL` if using custom domains

## Monitoring and Logs

### View Logs

1. Go to Railway dashboard → Your service
2. Click "Deployments" → Select a deployment
3. View real-time logs

### Using Railway CLI

```bash
railway logs --service backend
railway logs --service frontend
railway logs --service ml-service
```

## Health Checks

Railway automatically performs health checks based on the healthcheck configuration in `railway-compose.yml`.

Verify services are healthy:

1. Backend: `https://your-backend.up.railway.app/health`
2. ML Service: `https://your-ml-service.up.railway.app/health`
3. Frontend: `https://your-frontend.up.railway.app`

## Troubleshooting

### Service Won't Start

1. **Check Logs:**
   - Go to Railway dashboard → Service → Deployments → Logs
   - Look for error messages

2. **Check Environment Variables:**
   - Verify all required variables are set
   - Check `DATABASE_URL` and `REDIS_URL` are available

3. **Check Build Logs:**
   - Review build process for errors
   - Verify Dockerfile is correct

### Database Connection Issues

1. **Verify PostgreSQL Service:**
   - Ensure PostgreSQL service is running
   - Check `DATABASE_URL` is set correctly

2. **Run Migrations:**
   - Database might need migrations
   - Run: `railway run --service backend npx prisma migrate deploy`

### Frontend Can't Connect to Backend

1. **Check URLs:**
   - Verify `NEXT_PUBLIC_API_URL` is set correctly
   - Ensure backend service is deployed and running

2. **Check CORS:**
   - Backend should allow requests from frontend domain
   - Check backend CORS configuration

### Workers Not Processing Events

1. **Check Worker Service:**
   - Ensure worker service is running
   - Check worker logs for errors

2. **Check Redis Connection:**
   - Verify `REDIS_URL` is set correctly
   - Check Redis service is running

## Scaling

Railway allows you to scale services:

1. Go to service → Settings → Scaling
2. Adjust resources (CPU, Memory)
3. Railway will automatically handle load balancing

## Cost Optimization

- Railway offers a free tier with $5 credit/month
- Monitor usage in Railway dashboard
- Consider:
  - Using smaller instance sizes for non-critical services
  - Combining workers into single service if low volume
  - Using Railway's sleep feature for preview environments

## Security Best Practices

1. **Secrets Management:**
   - Never commit secrets to Git
   - Use Railway's environment variables
   - Rotate secrets regularly

2. **Database Security:**
   - Railway PostgreSQL is automatically secured
   - Use strong passwords (Railway generates them)
   - Enable SSL connections (Railway does this by default)

3. **API Security:**
   - Use HTTPS (Railway provides automatically)
   - Implement rate limiting
   - Validate all inputs

## Next Steps

After deployment:

1. **Test the Application:**
   - Visit frontend URL
   - Test signup/login
   - Verify data ingestion
   - Check analytics dashboard

2. **Set Up Monitoring:**
   - Configure Railway alerts
   - Set up external monitoring (optional)

3. **Backup Strategy:**
   - Railway PostgreSQL includes automatic backups
   - Consider additional backup solutions for critical data

4. **Custom Domain:**
   - Add custom domain for production
   - Update DNS records
   - Configure SSL (automatic with Railway)

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Railway Status: [status.railway.app](https://status.railway.app)

## Additional Resources

- See `railway.env.template` for environment variables
- See `railway-compose.yml` for service configuration
- See `DEPLOYMENT.md` for general deployment information

