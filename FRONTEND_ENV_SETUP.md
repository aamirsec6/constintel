# Frontend Environment Variables Setup for Railway

## Required Environment Variables

The frontend service needs these environment variables to connect to backend and ML service:

### 1. NEXT_PUBLIC_API_URL
- **Value**: `https://backend-production-98dd.up.railway.app`
- **Purpose**: Frontend uses this to make API calls to the backend

### 2. NEXT_PUBLIC_ML_API_URL
- **Value**: `https://ml-service-production-730f.up.railway.app`
- **Purpose**: Frontend uses this to connect to the ML service for AI features

## How to Set in Railway Dashboard

1. **Go to Railway Dashboard:**
   - Open: https://railway.app/project/ebd54346-321d-4311-b0c3-505820f12086

2. **Select Frontend Service:**
   - Click on `frontend` service in the left sidebar

3. **Go to Variables Tab:**
   - Click on `Variables` tab at the top

4. **Add Environment Variables:**
   - Click `+ New Variable` button
   - Add each variable:
     - **Name**: `NEXT_PUBLIC_API_URL`
     - **Value**: `https://backend-production-98dd.up.railway.app`
     - Click `Add`
   
   - **Name**: `NEXT_PUBLIC_ML_API_URL`
   - **Value**: `https://ml-service-production-730f.up.railway.app`
     - Click `Add`

5. **Save and Redeploy:**
   - Railway will automatically detect the changes
   - It will trigger a new deployment
   - Wait 2-3 minutes for the build to complete

## Verify Deployment

1. **Check Deployments Tab:**
   - Go to `Deployments` tab in frontend service
   - Look for latest deployment status
   - Should show "Building" → "Deploying" → "Online"

2. **Check Logs:**
   - Go to `Logs` tab
   - Look for any errors
   - Should see "Ready" message when successful

3. **Get Public URL:**
   - Go to `Settings` → `Networking`
   - Copy the `Public Domain` URL
   - That's your live frontend URL!

## Troubleshooting

### If Frontend Still Shows "Offline" or "Build Failed":

1. **Check Build Logs:**
   - Go to `Deployments` tab
   - Click on the latest deployment
   - Check `Build Logs` for errors

2. **Common Issues:**
   - Missing environment variables (add them as above)
   - Build errors (check TypeScript/build errors)
   - Port mismatch (should use PORT env var, already configured)

3. **Redeploy:**
   - If needed, go to `Deployments` tab
   - Click `Redeploy` on the latest deployment

## Current Service URLs

- **Backend**: https://backend-production-98dd.up.railway.app ✅
- **ML Service**: https://ml-service-production-730f.up.railway.app ✅
- **Frontend**: Set environment variables and check Railway Dashboard

