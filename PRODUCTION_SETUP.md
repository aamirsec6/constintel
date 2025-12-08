# Production Environment Setup

Complete guide for setting up the production environment.

## Overview

Production is the live environment serving real customers. This setup requires careful attention to security, performance, and reliability.

## Initial Setup

### 1. Prerequisites

Before setting up production:

- ✅ Staging environment is working
- ✅ All migrations tested in staging
- ✅ SSL/TLS certificates ready
- ✅ Production domain configured
- ✅ Monitoring tools configured
- ✅ Backup strategy defined

### 2. Create Production Instance

```bash
cd infra
./setup-production.sh
```

⚠️ **WARNING**: This requires confirmation as it sets up production infrastructure.

This will:
- Create production instance (ID: 2)
- Configure ports: 3020-3029
- Generate strong secrets
- Create environment files
- Save secrets to `.env.secrets` (KEEP SECURE!)

### 3. Secure Production Secrets

**IMPORTANT**: Review and secure the secrets file:

```bash
cat instances/production/.env.secrets
```

- ✅ Never commit this file to Git
- ✅ Store in secure location
- ✅ Limit file permissions: `chmod 600 instances/production/.env.secrets`
- ✅ Back up secrets securely

### 4. Configure Production Environment

Edit the production configuration:

```bash
nano instances/production/.env
```

**Critical settings:**

```bash
# Environment
NODE_ENV=production
LOG_LEVEL=error
DEBUG_MODE=false
ALLOW_TEST_DATA=false
ENABLE_BACKUP=true
ENABLE_MONITORING=true

# Security - Use strong secrets from .env.secrets
JWT_SECRET=<from .env.secrets>
ENCRYPTION_KEY=<from .env.secrets>
POSTGRES_PASSWORD=<from .env.secrets>

# Production API URLs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_ML_API_URL=https://ml.yourdomain.com

# Email - Use production service
EMAIL_PROVIDER=sendgrid  # or ses
SENDGRID_API_KEY=your-production-key
# OR
AWS_SES_USER=your-ses-user
AWS_SES_PASS=your-ses-password

# Integration secrets (production credentials)
SHOPIFY_API_KEY=your-production-key
SHOPIFY_API_SECRET=your-production-secret
```

### 5. Configure SSL/TLS

Set up reverse proxy (nginx/traefik) with SSL certificates:

```nginx
# Example nginx config
server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3020;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 6. Set Up Firewall

```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### 7. Start Production Services

```bash
./start-instance.sh production
```

### 8. Run Database Migrations

```bash
# ALWAYS backup first
./backup-database.sh production pre-initial-migration

# Run migrations
./migrate.sh production --backup
```

### 9. Create Production Admin User

Create the first admin user through your auth system.

## Production URLs

- **Backend API**: http://localhost:3020 (internal) or https://api.yourdomain.com (external)
- **Frontend**: http://localhost:3021 (internal) or https://yourdomain.com (external)
- **ML Service**: http://localhost:8020 (internal) or https://ml.yourdomain.com (external)
- **PostgreSQL**: localhost:5434 (internal only)
- **Redis**: localhost:6381 (internal only)

## Deployment Process

### Standard Deployment

1. **Validate in Staging**: Ensure feature works in staging
2. **Merge to Main**: Merge code to `main` branch
3. **Automatic Deployment**: CI/CD deploys to production
4. **Monitor**: Watch for issues

### Manual Deployment

```bash
cd infra
./deploy-production.sh
```

**Deployment includes:**
- Automatic backup
- Zero-downtime deployment
- Health checks
- Automatic rollback on failure

## Security Checklist

### Environment Variables

- ✅ All secrets in `.env.secrets` (not in `.env`)
- ✅ Strong passwords (min 32 characters)
- ✅ Unique JWT secret
- ✅ Unique encryption keys

### Network Security

- ✅ Firewall configured
- ✅ Only necessary ports exposed
- ✅ Internal services not exposed publicly
- ✅ SSL/TLS enabled

### Access Control

- ✅ SSH keys only (no passwords)
- ✅ Limited SSH access
- ✅ Separate user accounts
- ✅ Audit logging enabled

### Database Security

- ✅ Strong database password
- ✅ Database not exposed publicly
- ✅ Regular backups
- ✅ Backup encryption

### Monitoring

- ✅ Error logging configured
- ✅ Alerts set up
- ✅ Health checks automated
- ✅ Performance monitoring

## Backup Strategy

### Automated Backups

Set up daily backups via cron:

```bash
# Add to crontab
0 2 * * * cd /path/to/constintel/infra && ./backup-database.sh production daily-$(date +\%Y\%m\%d)
```

### Backup Retention

- **Daily**: Keep 7 days
- **Weekly**: Keep 4 weeks
- **Monthly**: Keep 12 months

### Backup Storage

- Store backups off-server
- Encrypt backups
- Test restore procedures

## Monitoring

### Health Checks

```bash
# Manual check
./health-check.sh production

# Automated (set up cron)
*/5 * * * * cd /path/to/constintel/infra && ./health-check.sh production || alert-admin
```

### Log Monitoring

```bash
# View logs
docker-compose -f docker-compose.instance.yml --env-file instances/production/.env -p production logs -f

# Check error logs
docker-compose -f docker-compose.instance.yml --env-file instances/production/.env -p production logs | grep ERROR
```

### Metrics to Monitor

- CPU usage
- Memory usage
- Disk space
- Database connections
- API response times
- Error rates
- Request rates

## Maintenance

### Regular Tasks

1. **Weekly**:
   - Review logs
   - Check disk space
   - Verify backups

2. **Monthly**:
   - Review security
   - Update dependencies
   - Test restore procedures

3. **Quarterly**:
   - Security audit
   - Performance review
   - Disaster recovery test

### Updates

1. Test updates in staging first
2. Schedule maintenance windows
3. Notify users if needed
4. Backup before updates
5. Monitor after updates

## Troubleshooting

### Service Outages

1. Check health: `./health-check.sh production`
2. Check logs: `docker-compose logs -f`
3. Verify resources: `docker stats`
4. Check database: `docker exec production-postgres psql -U constintel_production -d constintel_production`

### Performance Issues

1. Check resource usage
2. Review slow queries
3. Check Redis cache
4. Monitor API response times

### Security Incidents

1. Immediately assess impact
2. Isolate affected services if needed
3. Review logs for intrusion
4. Change compromised secrets
5. Document incident

## Rollback Procedures

### Quick Rollback

```bash
cd infra
./rollback.sh production
```

### Manual Rollback

1. Stop services
2. Restore database backup
3. Revert code changes
4. Restart services

See [ROLLBACK_GUIDE.md](ROLLBACK_GUIDE.md) for detailed procedures.

## Disaster Recovery

### Recovery Plan

1. **Identify Issue**: Determine scope
2. **Isolate**: Stop affected services
3. **Restore**: Restore from backup
4. **Verify**: Health checks
5. **Monitor**: Watch for issues

### Recovery Time Objectives

- **RTO**: 1 hour (time to restore)
- **RPO**: 24 hours (data loss tolerance)

## Next Steps

- See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment procedures
- See [ROLLBACK_GUIDE.md](ROLLBACK_GUIDE.md) for rollback procedures
- See [MONITORING.md](MONITORING.md) for monitoring setup

