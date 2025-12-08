# CI/CD Pipeline

## Overview

GitHub Actions workflows for continuous integration and deployment.

## Workflows

### 1. CI/CD Pipeline (`ci.yml`)

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual trigger

**Jobs**:
1. **Backend Tests**: Unit tests, linting, Prisma migrations
2. **Frontend Tests**: Build, linting
3. **ML Service Tests**: Import checks, training script validation
4. **Integration Tests**: Full stack testing (backend + ML service)
5. **Build Docker Images**: Build all service images (main branch only)

### 2. Deploy (`deploy.yml`)

**Triggers**:
- After successful CI run on `main` branch
- Manual trigger

**Jobs**:
- Deploy to production (customize for your infrastructure)

## Setup

### 1. Repository Secrets

Configure these secrets in GitHub Settings → Secrets:

- `DATABASE_URL` (for production deployments)
- `REDIS_URL` (for production deployments)
- `KUBECONFIG` (if using Kubernetes)
- AWS/Cloud credentials (if deploying to cloud)

### 2. Environment Variables

Workflows use environment variables defined in workflow files. For production, add secrets:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  REDIS_URL: ${{ secrets.REDIS_URL }}
```

### 3. Customize Deployment

Edit `.github/workflows/deploy.yml` to match your deployment target:

- **Kubernetes**: Add kubectl deployment steps
- **AWS ECS**: Add ECS update-service commands
- **Docker Compose**: Add docker-compose commands
- **Custom**: Add your deployment scripts

## Running Locally

### Test Backend

```bash
cd backend
npm test
```

### Test Frontend

```bash
cd frontend
npm run build
```

### Test ML Service

```bash
cd services/ml_service
python3 -c "from train.train_models import load_training_data; print('OK')"
```

## Workflow Status

View workflow runs: `https://github.com/<org>/<repo>/actions`

## Troubleshooting

### Tests Failing

1. Check service dependencies (PostgreSQL, Redis)
2. Verify environment variables
3. Check test data setup

### Build Failing

1. Check Node.js/Python versions
2. Verify dependencies are up to date
3. Check for breaking changes in dependencies

### Deployment Failing

1. Verify deployment credentials
2. Check target infrastructure status
3. Review deployment logs

