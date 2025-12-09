# Backend Environment Variables Setup for Railway

## 🔧 Required Environment Variables

The backend needs these environment variables to run properly. Without them, it will return 502 errors.

### Auto-Provided by Railway (Don't set manually)
- `DATABASE_URL` - Automatically set when PostgreSQL service is added
- `REDIS_URL` - Automatically set when Redis service is added

### Required - Must Set Manually

#### 1. JWT_SECRET
- **Purpose**: Used to sign and verify JWT tokens for authentication
- **Generated Value**: `8pwx2mqbkSOe0J8JW2dg1ggXSqFvFgoeb3ypxsXPelo=`
- **How to set**: Railway Dashboard → backend service → Variables → Add Variable

#### 2. ENCRYPTION_KEY
- **Purpose**: Used for encrypting sensitive data
- **Generated Value**: `64KpL1Nlt70Tneb2srrSrEP9iV4iWsPklJgZ/+uFMF8=`
- **How to set**: Railway Dashboard → backend service → Variables → Add Variable

#### 3. NODE_ENV
- **Value**: `production`
- **Purpose**: Sets the environment mode

## 📋 Step-by-Step Setup

### Step 1: Go to Railway Dashboard
1. Open: https://railway.app/project/ebd54346-321d-4311-b0c3-505820f12086
2. Click on `backend` service (left sidebar)

### Step 2: Add Environment Variables
1. Click on `Variables` tab
2. Click `+ New Variable` button
3. Add each variable:

   **Variable 1:**
   - **Name**: `JWT_SECRET`
   - **Value**: `8pwx2mqbkSOe0J8JW2dg1ggXSqFvFgoeb3ypxsXPelo=`
   - Click `Add`

   **Variable 2:**
   - **Name**: `ENCRYPTION_KEY`
   - **Value**: `64KpL1Nlt70Tneb2srrSrEP9iV4iWsPklJgZ/+uFMF8=`
   - Click `Add`

   **Variable 3:**
   - **Name**: `NODE_ENV`
   - **Value**: `production`
   - Click `Add`

### Step 3: Verify Auto-Provided Variables
Check that these exist (they should be auto-set by Railway):
- `DATABASE_URL` - Should be set automatically
- `REDIS_URL` - Should be set automatically

### Step 4: Wait for Redeployment
- Railway will automatically detect the new variables
- It will trigger a new deployment
- Wait 2-3 minutes for the backend to restart

### Step 5: Verify Backend is Working
1. Go to `Deployments` tab
2. Check latest deployment shows "Online"
3. Go to `Logs` tab - should see "Server running on..."
4. Test the health endpoint:
   ```bash
   curl https://backend-production-98dd.up.railway.app/health
   ```

## 🔍 Troubleshooting

### If Backend Still Shows 502 Error:

1. **Check Logs:**
   - Go to `Logs` tab in Railway Dashboard
   - Look for errors like:
     - "JWT_SECRET is required"
     - "ENCRYPTION_KEY is required"
     - Database connection errors

2. **Verify Variables:**
   - Go to `Variables` tab
   - Make sure all required variables are present
   - Check for typos in variable names

3. **Redeploy:**
   - Go to `Deployments` tab
   - Click `Redeploy` on the latest deployment

4. **Check Database Connection:**
   - Verify `DATABASE_URL` is set
   - Check that PostgreSQL service is "Online"

## ✅ After Setup

Once backend is online:
1. Test signup: Should work now!
2. Frontend can connect to backend
3. All API endpoints should respond

## 🔐 Security Note

The generated secrets are strong and secure. Keep them private and don't commit them to git.

