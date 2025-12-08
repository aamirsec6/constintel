# Deployment Guide

Complete guide for deploying ConstIntel to staging and production environments.

## Overview

This platform uses Docker Compose on a single server for staging and production deployments. Each environment is completely isolated with separate databases, networks, and ports.

## Architecture

- **Staging**: Instance ID 1, Ports 3010-3019
- **Production**: Instance ID 2, Ports 3020-3029
- **Isolation**: Separate databases, Redis, networks for each environment

## Quick Start

### 1. Initial Setup

```bash
# Set up staging environment
cd infra
./setup-staging.sh

# Set up production environment (requires confirmation)
./setup-production.sh
```

### 2. First Deployment

```bash
# Deploy to staging
./deploy-staging.sh

# Deploy to production (after staging validation)
./deploy-production.sh
```

## Environment Setup

### Staging Environment

1. **Create staging instance:**
   ```bash
   cd infra
   ./setup-staging.sh
   ```

2. **Configure staging:**
   - Edit `instances/staging/.env`
   - Set up API keys and secrets
   - Configure email service

3. **Start staging:**
   ```bash
   ./start-instance.sh staging
   ```

4. **Run migrations:**
   ```bash
   ./migrate.sh staging --backup
   ```

### Production Environment

1. **Create production instance:**
   ```bash
   cd infra
   ./setup-production.sh
   ```
   ⚠️ Requires confirmation as this sets up production infrastructure.

2. **Configure production:**
   - Edit `instances/production/.env`
   - Set up production API keys
   - Configure production email service (SendGrid/AWS SES recommended)
   - Review `instances/production/.env.secrets` for generated secrets

3. **Start production:**
   ```bash
   ./start-instance.sh production
   ```

4. **Run migrations:**
   ```bash
   ./migrate.sh production --backup
   ```

## Deployment Process

### Staging Deployment

Staging deployments are triggered automatically on push to `develop` branch via CI/CD, or can be done manually:

```bash
cd infra
./deploy-staging.sh
```

**What happens:**
1. Runs tests (can skip with `--skip-tests`)
2. Builds Docker images
3. Backs up database
4. Stops services
5. Runs migrations (can skip with `--skip-migrations`)
6. Starts services
7. Performs health checks

### Production Deployment

Production deployments require confirmation and can be triggered via CI/CD or manually:

```bash
cd infra
./deploy-production.sh
```

**What happens:**
1. Requires confirmation (safety check)
2. Runs tests (can skip with `--skip-tests`)
3. Creates full database backup (mandatory)
4. Builds Docker images
5. Zero-downtime deployment:
   - Deploys backend first
   - Waits for health check
   - Deploys ML service
   - Deploys frontend
   - Deploys workers
6. Comprehensive health checks
7. Automatic rollback on failure

## Database Migrations

### Running Migrations

```bash
# Staging
./migrate.sh staging --backup

# Production
./migrate.sh production --backup
```

**Migration Workflow:**
1. Create migration in development: `npx prisma migrate dev --name migration_name`
2. Test in staging first
3. Apply to production after validation

### Migration Strategy

- **Staging**: Test all migrations before production
- **Production**: Use `migrate deploy` (no new migrations created)
- **Backup**: Always create backup before migrations (`--backup` flag)

## Backup and Restore

### Creating Backups

```bash
# Manual backup
./backup-database.sh staging daily-backup
./backup-database.sh production daily-backup

# Automatic backups are created before deployments
```

### Restoring from Backup

```bash
# Restore specific backup
./restore-backup.sh staging backups/daily-backup.dump
./restore-backup.sh production backups/pre-deployment-20241203-120000.dump

# Restore most recent backup
./restore-backup.sh production
```

⚠️ **Warning**: Restore will overwrite existing database!

## Health Checks

### Manual Health Check

```bash
./health-check.sh staging
./health-check.sh production
```

**Checks:**
- PostgreSQL container and connectivity
- Redis container and connectivity
- Backend API health endpoint
- ML Service health endpoint
- Frontend accessibility
- Worker processes
- Disk space

## Rollback

### Rolling Back Deployment

```bash
# Rollback to most recent backup
./rollback.sh production

# Rollback to specific backup
./rollback.sh production backups/pre-deployment-20241203-120000.dump
```

**What happens:**
1. Stops services
2. Creates safety backup
3. Restores database from backup
4. Restarts services

## CI/CD Workflows

### Staging Deployment

- **Trigger**: Push to `develop` branch
- **Workflow**: `.github/workflows/deploy-staging.yml`
- **Steps**: Tests → Build → Deploy → Health Check

### Production Deployment

- **Trigger**: Push to `main` branch OR manual dispatch
- **Workflow**: `.github/workflows/deploy-production.yml`
- **Steps**: Pre-checks → Backup → Deploy → Health Check → Monitor

### Test Workflow

- **Trigger**: PR or push to `main`/`develop`
- **Workflow**: `.github/workflows/test.yml`
- **Steps**: Backend tests → Frontend tests → ML service tests → Integration tests

## Monitoring

### View Logs

```bash
# All services
docker-compose -f docker-compose.instance.yml --env-file instances/staging/.env -p staging logs -f

# Specific service
docker-compose -f docker-compose.instance.yml --env-file instances/staging/.env -p staging logs -f backend
```

### Service Status

```bash
# List running containers
docker ps | grep staging
docker ps | grep production

# Check service health
curl http://localhost:3010/health  # Staging backend
curl http://localhost:3020/health  # Production backend
```

## Troubleshooting

### Services Won't Start

1. Check logs: `docker-compose logs -f`
2. Check health: `./health-check.sh <instance-name>`
3. Verify environment variables: `cat instances/<instance-name>/.env`
4. Check port conflicts: `netstat -tulpn | grep <port>`

### Database Issues

1. Check database container: `docker ps | grep postgres`
2. Test connection: `docker exec <instance>-postgres psql -U <user> -d <db>`
3. Check migrations: `docker exec <instance>-postgres psql -U <user> -d <db> -c "SELECT * FROM _prisma_migrations;"`

### Migration Failures

1. Check migration status
2. Review error logs
3. Restore from backup if needed
4. Fix migration and retry

### Health Check Failures

1. Check service logs
2. Verify environment variables
3. Check database connectivity
4. Verify API endpoints are accessible

## Security Best Practices

### Production Environment

1. **Secrets Management:**
   - Never commit `.env.secrets` to Git
   - Use strong, unique passwords
   - Rotate secrets regularly

2. **Access Control:**
   - Limit SSH access to production server
   - Use SSH keys, not passwords
   - Implement firewall rules

3. **Monitoring:**
   - Set up alerts for failures
   - Monitor disk space
   - Track error rates

4. **Backups:**
   - Automated daily backups
   - Test restore procedures
   - Off-site backup storage

## Next Steps

- See [STAGING_SETUP.md](STAGING_SETUP.md) for detailed staging setup
- See [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) for detailed production setup
- See [ROLLBACK_GUIDE.md](ROLLBACK_GUIDE.md) for rollback procedures
- See [MONITORING.md](MONITORING.md) for monitoring and alerting

