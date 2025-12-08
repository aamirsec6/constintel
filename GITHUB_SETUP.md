# GitHub Repository Setup for Railway

## Step 1: Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `constintel` (or any name you prefer)
3. Description: "ConstIntel - Unified Commerce Platform"
4. Choose: **Private** or **Public** (your choice)
5. **DO NOT** initialize with README, .gitignore, or license (we already have code)
6. Click **"Create repository"**

## Step 2: Push Your Code to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
cd /Users/aamirhabibsaudagar/constintel

# Add your GitHub repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/constintel.git

# Push your code
git branch -M main
git push -u origin main
```

## Step 3: Connect to Railway

1. Go back to Railway Dashboard
2. Click on "frontend" service
3. Go to "Settings" → "Source"
4. Click **"Connect Repo"** button
5. Select your GitHub account
6. Choose the `constintel` repository
7. Set **Root Directory** to: `frontend`
8. Railway will automatically deploy!

## Step 4: Deploy ML Service

1. Click on "ml-service" service
2. Go to "Settings" → "Source"
3. Click **"Connect Repo"**
4. Select the same `constintel` repository
5. Set **Root Directory** to: `services/ml_service`
6. Railway will automatically deploy!

## That's It!

Once connected, Railway will:
- Auto-deploy on every git push
- Show build logs
- Handle deployments automatically

No more CLI upload timeouts! 🎉

