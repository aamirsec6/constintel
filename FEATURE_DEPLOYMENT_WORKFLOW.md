# Feature Deployment Workflow Guide

Complete step-by-step guide for building features in staging and promoting them to production.

## Overview

This guide teaches you the complete workflow:
1. **Develop** feature locally
2. **Test** in staging environment
3. **Validate** everything works
4. **Promote** to production

## Workflow Diagram

```
Local Development
       ↓
Create Feature Branch
       ↓
Develop & Test Locally
       ↓
Push to Feature Branch
       ↓
Create Pull Request → develop
       ↓
Review & Merge to develop
       ↓
Auto-Deploy to STAGING
       ↓
Test & Validate in Staging
       ↓
Merge develop → main
       ↓
Auto-Deploy to PRODUCTION
       ↓
Monitor Production
```

## Step-by-Step Process

### Step 1: Develop Feature Locally

#### 1.1 Create Feature Branch

```bash
# Start from develop branch
git checkout develop
git pull origin develop

# Create new feature branch
git checkout -b feature/my-new-feature

# Example feature names:
# - feature/add-analytics-dashboard
# - feature/improve-user-authentication
# - feature/fix-payment-bug
```

#### 1.2 Develop Your Feature

Make your code changes:

```bash
# Example: Adding a new API endpoint
# 1. Create backend route: backend/src/routes/myFeature.ts
# 2. Create frontend component: frontend/components/myFeature/Component.tsx
# 3. Create database migration if needed: backend/prisma/migrations/...

# Test locally
cd backend
npm run dev

cd ../frontend
npm run dev
```

#### 1.3 Test Locally

```bash
# Run backend tests
cd backend
npm test

# Run frontend build
cd ../frontend
npm run build

# Test manually in browser
# Visit http://localhost:3001
```

#### 1.4 Commit Changes

```bash
# Stage your changes
git add .

# Commit with descriptive message
git commit -m "feat: Add new analytics dashboard

- Created analytics API endpoint
- Built dashboard component
- Added database schema changes
- Updated documentation"

# Push to remote
git push origin feature/my-new-feature
```

**Commit Message Convention:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

### Step 2: Create Pull Request to Staging

#### 2.1 Create PR on GitHub

1. Go to your GitHub repository
2. Click "Pull Requests" → "New Pull Request"
3. Select:
   - **Base**: `develop` (staging branch)
   - **Compare**: `feature/my-new-feature`
4. Fill in PR description:
   ```
   ## Description
   Add new analytics dashboard feature
   
   ## Changes
   - Created analytics API endpoint
   - Built dashboard UI component
   - Added database migrations
   
   ## Testing
   - [ ] Tested locally
   - [ ] All tests passing
   - [ ] No breaking changes
   
   ## Screenshots
   [Add screenshots if UI changes]
   ```

#### 2.2 Wait for CI Tests

GitHub Actions will automatically:
- ✅ Run backend tests
- ✅ Run frontend tests
- ✅ Run linter checks
- ✅ Build Docker images

Wait for all checks to pass (green checkmarks).

#### 2.3 Code Review

- Request review from team members
- Address review comments
- Update PR if needed

#### 2.4 Merge to Develop

Once approved:
1. Click "Merge pull request"
2. This triggers automatic deployment to **staging**

```bash
# Or merge locally:
git checkout develop
git pull origin develop
git merge feature/my-new-feature
git push origin develop
```

### Step 3: Test in Staging

#### 3.1 Wait for Auto-Deployment

When you merge to `develop`, GitHub Actions automatically:
1. Deploys to staging server
2. Runs database migrations
3. Performs health checks

**Check deployment status:**
- Go to GitHub Actions tab
- Look for "Deploy to Staging" workflow
- Wait for green checkmark ✅

#### 3.2 Access Staging Environment

**Staging URLs:**
- Frontend: http://localhost:3011 (or your staging domain)
- Backend API: http://localhost:3010
- ML Service: http://localhost:8010

**If using remote server:**
- Frontend: http://staging.yourdomain.com
- Backend: http://staging-api.yourdomain.com

#### 3.3 Test Your Feature

**Comprehensive Testing Checklist:**

1. **Functional Testing:**
   - [ ] Feature works as expected
   - [ ] All buttons/links work
   - [ ] Forms submit correctly
   - [ ] Data displays correctly

2. **Integration Testing:**
   - [ ] API endpoints respond correctly
   - [ ] Database queries work
   - [ ] External services integrated properly

3. **UI/UX Testing:**
   - [ ] Looks good on desktop
   - [ ] Looks good on mobile
   - [ ] Loading states work
   - [ ] Error messages clear

4. **Performance Testing:**
   - [ ] Page loads quickly
   - [ ] API responses fast
   - [ ] No memory leaks

5. **Regression Testing:**
   - [ ] Existing features still work
   - [ ] No breaking changes
   - [ ] Backward compatibility maintained

#### 3.4 Check Logs

```bash
# SSH into staging server (if remote)
ssh user@staging-server

# Or if local, check logs:
cd infra
docker-compose -f docker-compose.instance.yml --env-file instances/staging/.env -p staging logs -f backend

# Look for errors
docker-compose -f docker-compose.instance.yml --env-file instances/staging/.env -p staging logs | grep ERROR
```

#### 3.5 Test Database Migrations

If you added migrations:

```bash
cd infra

# Check migration status
docker exec staging-postgres psql -U constintel_staging -d constintel_staging -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"

# Verify tables created
docker exec staging-postgres psql -U constintel_staging -d constintel_staging -c "\dt"
```

#### 3.6 Run Health Checks

```bash
cd infra
./health-check.sh staging
```

**Expected Output:**
```
✅ PostgreSQL: Container is running and ready
✅ Redis: Container is running and responding
✅ Backend API: Container is running and healthy
✅ ML Service: Container is running and healthy
✅ Overall Health: HEALTHY
```

### Step 4: Validate in Staging

#### 4.1 Team Review

- Show feature to team members
- Get feedback
- Make any necessary fixes

#### 4.2 Performance Validation

```bash
# Check resource usage
docker stats staging-backend staging-postgres staging-redis

# Check response times
curl -w "@curl-format.txt" http://localhost:3010/api/your-endpoint

# Monitor for 5-10 minutes
```

#### 4.3 User Acceptance Testing (UAT)

If applicable:
- Have test users try the feature
- Collect feedback
- Address any issues

### Step 5: Promote to Production

#### 5.1 Merge Develop → Main

**Option A: GitHub Merge (Recommended)**

1. Go to GitHub repository
2. Click "Pull Requests" → "New Pull Request"
3. Select:
   - **Base**: `main` (production branch)
   - **Compare**: `develop`
4. Title: "Release: Deploy to Production - [Your Feature Name]"
5. Description:
   ```
   ## Summary
   Promoting [feature name] from staging to production
   
   ## Validated in Staging
   - [x] Feature tested and working
   - [x] All tests passing
   - [x] Performance acceptable
   - [x] No breaking changes
   - [x] Team approval received
   
   ## Deployment Checklist
   - [x] Staging validated for X days
   - [x] Database migrations tested
   - [x] Rollback plan prepared
   - [x] Team notified
   ```

**Option B: Command Line**

```bash
# Switch to main branch
git checkout main
git pull origin main

# Merge develop into main
git merge develop

# Push to trigger production deployment
git push origin main
```

#### 5.2 Production Deployment

**Automatic Deployment:**

When you push to `main`, GitHub Actions automatically:
1. Runs pre-deployment checks
2. Creates database backup
3. Deploys to production (zero-downtime)
4. Runs migrations
5. Performs health checks

**Check deployment:**
- GitHub Actions → "Deploy to Production"
- Wait for all steps to complete ✅

**Manual Deployment (if needed):**

```bash
# SSH into production server
ssh user@production-server

cd /path/to/constintel/infra

# Deploy
./deploy-production.sh
```

### Step 6: Monitor Production

#### 6.1 Immediate Monitoring (First 30 minutes)

```bash
# Check health
./health-check.sh production

# Watch logs
docker-compose -f docker-compose.instance.yml --env-file instances/production/.env -p production logs -f

# Monitor errors
docker-compose -f docker-compose.instance.yml --env-file instances/production/.env -p production logs | grep ERROR
```

#### 6.2 Verify Feature Works

1. **Access Production:**
   - Visit production URL
   - Test your feature
   - Verify data integrity

2. **Check Metrics:**
   - Response times
   - Error rates
   - Resource usage

#### 6.3 Watch for Issues

**Monitor for:**
- Increased error rates
- Slow response times
- High resource usage
- User complaints

#### 6.4 If Issues Occur

**Quick Response:**

1. **Check Health:**
   ```bash
   cd infra
   ./health-check.sh production
   ```

2. **Review Logs:**
   ```bash
   docker-compose logs --tail=100 | grep ERROR
   ```

3. **Rollback if Needed:**
   ```bash
   cd infra
   ./rollback.sh production
   ```

4. **Fix and Re-deploy:**
   - Fix issue in feature branch
   - Repeat workflow

## Complete Example Workflow

Let's say you want to add a "Export Data" feature:

### 1. Local Development

```bash
# Create branch
git checkout develop
git pull origin develop
git checkout -b feature/export-data

# Make changes
# - backend/src/routes/export.ts
# - frontend/components/ExportButton.tsx
# - backend/prisma/migrations/... (if needed)

# Test locally
cd backend && npm test
cd ../frontend && npm run build

# Commit
git add .
git commit -m "feat: Add data export functionality"
git push origin feature/export-data
```

### 2. Staging Deployment

```bash
# Create PR: feature/export-data → develop
# Wait for CI tests ✅
# Get code review ✅
# Merge PR ✅

# Auto-deploys to staging
# Wait 5-10 minutes
```

### 3. Test in Staging

```bash
# Access staging
# http://localhost:3011 (or staging domain)

# Test export feature:
# - Click export button
# - Verify file downloads
# - Check data accuracy

# Check logs
cd infra
./health-check.sh staging
docker-compose logs | grep ERROR
```

### 4. Validate (2-3 days)

- Team reviews feature
- Test users try it
- Monitor for issues
- Fix any bugs found

### 5. Production Deployment

```bash
# Create PR: develop → main
# Title: "Release: Export Data Feature"
# Merge when ready ✅

# Auto-deploys to production
# Monitor closely for 30 minutes
```

### 6. Monitor Production

```bash
cd infra
./health-check.sh production

# Watch for:
# - Export requests working
# - No errors in logs
# - Good performance
```

## Best Practices

### ✅ Do's

1. **Always test in staging first**
   - Never skip staging
   - Validate thoroughly

2. **Use descriptive branch names**
   - `feature/add-login` ✅
   - `fix/payment-bug` ✅
   - `branch1` ❌

3. **Write good commit messages**
   - Clear description
   - List changes
   - Reference issues

4. **Test database migrations**
   - Test in staging
   - Backup before production
   - Verify data integrity

5. **Monitor after deployment**
   - Watch logs
   - Check metrics
   - Verify functionality

### ❌ Don'ts

1. **Don't skip staging**
   - Always test first
   - Catch issues early

2. **Don't push directly to main**
   - Use PR workflow
   - Get approvals

3. **Don't deploy on Fridays**
   - Deploy early in week
   - Have time to fix issues

4. **Don't ignore staging failures**
   - Fix before production
   - Understand root cause

5. **Don't skip monitoring**
   - Watch after deployment
   - Be ready to rollback

## Troubleshooting

### Feature Not Appearing in Staging

1. Check deployment status in GitHub Actions
2. Verify code merged to `develop`
3. Check staging logs: `docker-compose logs`
4. Verify staging instance running: `./health-check.sh staging`

### Migration Failed

1. Check migration file syntax
2. Test migration locally first
3. Review staging migration logs
4. Fix migration and re-deploy

### Feature Works in Staging But Not Production

1. Check environment variables
2. Verify database migrations ran
3. Check production logs
4. Compare staging vs production configs

### Need to Rollback

```bash
cd infra
./rollback.sh production

# Then:
# - Fix issue in feature branch
# - Re-test in staging
# - Re-deploy when ready
```

## Quick Reference

### Common Commands

```bash
# Create feature branch
git checkout -b feature/my-feature

# Deploy to staging (automatic on merge)
git push origin develop

# Deploy to production (automatic on merge)
git push origin main

# Manual staging deployment
cd infra && ./deploy-staging.sh

# Manual production deployment
cd infra && ./deploy-production.sh

# Check health
cd infra && ./health-check.sh staging
cd infra && ./health-check.sh production

# View logs
docker-compose logs -f

# Rollback
cd infra && ./rollback.sh production
```

## Next Steps

1. **Practice with a small feature**
   - Try the complete workflow
   - Get comfortable with process

2. **Set up your environments**
   - Follow STAGING_SETUP.md
   - Follow PRODUCTION_SETUP.md

3. **Configure CI/CD**
   - Set up GitHub Secrets
   - Test deployment workflows

4. **Establish team workflow**
   - Define review process
   - Set deployment schedule
   - Create on-call rotation

## Resources

- **DEPLOYMENT.md** - Complete deployment guide
- **STAGING_SETUP.md** - Staging setup details
- **PRODUCTION_SETUP.md** - Production setup details
- **ROLLBACK_GUIDE.md** - Rollback procedures
- **MONITORING.md** - Monitoring guide

---

**Happy Deploying!** 🚀

Remember: Test in staging → Validate → Deploy to production → Monitor

