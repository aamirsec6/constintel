# Staging Environment Setup

Complete guide for setting up the staging environment.

## Overview

Staging is a testing environment that mirrors production but with relaxed security and debugging enabled. Use staging to:
- Test new features before production
- Validate database migrations
- Test deployment procedures
- Debug issues in a production-like environment

## Initial Setup

### 1. Create Staging Instance

```bash
cd infra
./setup-staging.sh
```

This will:
- Create staging instance (ID: 1)
- Configure ports: 3010-3019
- Generate secrets
- Create environment file

### 2. Configure Staging Environment

Edit the staging configuration:

```bash
nano instances/staging/.env
```

**Key settings to configure:**

```bash
# Environment
NODE_ENV=staging
LOG_LEVEL=debug
DEBUG_MODE=true
ALLOW_TEST_DATA=true

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3010
NEXT_PUBLIC_ML_API_URL=http://localhost:8010

# Email (use test email service)
EMAIL_PROVIDER=smtp
EMAIL_FROM=staging@constintel.com

# Integration secrets (use test credentials)
SHOPIFY_API_KEY=your-test-key
SHOPIFY_API_SECRET=your-test-secret
```

### 3. Start Staging Services

```bash
./start-instance.sh staging
```

### 4. Run Database Migrations

```bash
./migrate.sh staging --backup
```

### 5. Create Admin User

```bash
# Connect to backend container
docker exec -it staging-backend sh

# Create admin user (use your auth service)
# Or use your user creation script
```

## Staging URLs

- **Backend API**: http://localhost:3010
- **Frontend**: http://localhost:3011
- **ML Service**: http://localhost:8010
- **PostgreSQL**: localhost:5433
- **Redis**: localhost:6380

## Development Workflow

### 1. Develop Features

Work on feature in your local development environment.

### 2. Test Locally

Run tests and verify functionality locally.

### 3. Deploy to Staging

```bash
# Merge to develop branch triggers automatic deployment
# OR deploy manually:
cd infra
./deploy-staging.sh
```

### 4. Validate in Staging

- Test all functionality
- Verify database migrations
- Check performance
- Test integration with external services

### 5. Promote to Production

Once validated in staging, merge to `main` branch for production deployment.

## Staging-Specific Features

### Debug Mode

Staging runs with debug mode enabled:
- Verbose logging
- Detailed error messages
- Debug endpoints enabled

### Test Data

Staging allows test data:
- Can seed test data
- Can reset database easily
- Safe to experiment

### Relaxed Security

- Debug endpoints available
- Less strict CORS
- Can access internal services

## Maintenance

### Regular Backups

```bash
# Daily backup
./backup-database.sh staging daily-$(date +%Y%m%d)
```

### Health Monitoring

```bash
# Check staging health
./health-check.sh staging
```

### View Logs

```bash
docker-compose -f docker-compose.instance.yml --env-file instances/staging/.env -p staging logs -f
```

## Resetting Staging

To reset staging environment:

```bash
# Stop services
./stop-instance.sh staging

# Remove instance (WARNING: deletes all data)
./remove-instance.sh staging

# Recreate
./setup-staging.sh
```

## Troubleshooting

### Services Not Starting

1. Check logs: `docker-compose logs -f`
2. Verify ports are available: `netstat -tulpn | grep 301`
3. Check environment variables: `cat instances/staging/.env`

### Database Issues

1. Check database container: `docker ps | grep staging-postgres`
2. Test connection: `docker exec staging-postgres psql -U constintel_staging -d constintel_staging`
3. Check migrations: Review `_prisma_migrations` table

### Performance Issues

Staging may be slower than production. This is normal. Focus on functionality validation.

## Best Practices

1. **Keep Staging Updated**: Regularly sync with production schema
2. **Test Migrations**: Always test migrations in staging first
3. **Monitor Health**: Regular health checks
4. **Clean Data**: Periodically reset test data
5. **Document Issues**: Log any issues found for production

## Next Steps

- See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment procedures
- See [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) for production setup
- See [MONITORING.md](MONITORING.md) for monitoring setup

