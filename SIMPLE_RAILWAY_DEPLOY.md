# Simple Railway Deployment Guide - Step by Step

## Your Current Situation
- ✅ Backend: Already deployed and working
- ⏳ Frontend: Service created but not deployed
- ⏳ ML Service: Service created but not deployed

## Step-by-Step: Deploy Frontend

### Method 1: Using Railway Dashboard (Easiest)

1. **Go to Railway Dashboard**
   - Open: https://railway.app/project/ebd54346-321d-4311-b0c3-505820f12086

2. **Click on "frontend" service** (the card on the left)

3. **Go to "Settings" tab**
   - Click "Settings" at the top (next to Deployments, Variables, etc.)

4. **Configure Source**
   - Find "Source" section
   - Look for "Root Directory" field
   - Change it from "/" to: `frontend`
   - This tells Railway where your frontend code is located

5. **Go to "Deployments" tab**
   - Click "Deployments" at the top

6. **Start Deployment**
   - Click the purple button that says **"Make a deployment to get started →"**
   - OR if you see "New Deployment" button, click that

7. **Wait 2-3 minutes**
   - You'll see "Building..." then "Deploying..." status
   - When done, status changes to "Online" ✅

---

## Step-by-Step: Deploy ML Service

1. **Click on "ml-service" service** (the card on the left)

2. **Go to "Settings" tab**

3. **Configure Source**
   - Find "Root Directory" field
   - Change it to: `services/ml_service`

4. **Go to "Deployments" tab**

5. **Start Deployment**
   - Click **"Make a deployment to get started →"**

6. **Wait 2-3 minutes**
   - Status will change to "Online" when ready ✅

---

## Alternative: If "Make a deployment" doesn't work

If you don't see a deployment button:

1. **Go to Settings → Source**
2. **Click "Connect Repo"** (if you have GitHub)
   - OR
3. **Click "Connect Image"** (if you want to use Docker)
   - Enter: Your Docker image name

But since you're deploying from local code, the Root Directory method above should work.

---

## What Happens During Deployment

1. **Building** - Railway builds your Docker image (1-2 minutes)
2. **Deploying** - Railway starts your service (30 seconds)
3. **Online** - Your service is live! 🎉

---

## After Deployment

Once both services show "Online":

- **Frontend**: https://frontend-production-fa00.up.railway.app
- **Backend**: https://backend-production-98dd.up.railway.app (already working)
- **ML Service**: https://ml-service-production-730f.up.railway.app

---

## Troubleshooting

**If deployment fails:**
1. Go to "Deployments" tab
2. Click on the failed deployment
3. Check "Build Logs" for errors
4. Common issues:
   - Wrong Root Directory → Fix in Settings
   - Missing Dockerfile → Make sure Dockerfile exists
   - Build errors → Check the logs

**If service stays "offline":**
- Make sure Root Directory is set correctly
- Make sure you clicked "Make a deployment to get started"
- Wait a few more minutes (builds can take 3-4 minutes)

---

## Quick Checklist

- [ ] Frontend: Set Root Directory to `frontend` in Settings
- [ ] Frontend: Click "Make a deployment to get started"
- [ ] ML Service: Set Root Directory to `services/ml_service` in Settings  
- [ ] ML Service: Click "Make a deployment to get started"
- [ ] Wait 2-3 minutes for each
- [ ] Check both show "Online" status
- [ ] Test your frontend URL

---

That's it! Much simpler than the docs. Just set Root Directory and click deploy! 🚀

