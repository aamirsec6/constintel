# Rollback Guide

Complete guide for rolling back deployments when issues occur.

## When to Rollback

Rollback should be considered when:

- Health checks fail after deployment
- Critical errors appear in logs
- Performance degrades significantly
- Database migrations fail
- Security issues are discovered
- User-facing errors occur

## Rollback Strategies

### 1. Database Rollback

Rolls back the database to a previous state:

```bash
cd infra
./rollback.sh production
```

This will:
- Stop services
- Create safety backup
- Restore database from backup
- Restart services

### 2. Code Rollback

Rolls back code changes (if database changes are compatible):

1. Revert code changes in Git
2. Re-deploy previous version

```bash
git revert HEAD
git push origin main
# Triggers deployment with previous code
```

### 3. Full Rollback

Rolls back both code and database:

1. Rollback database first
2. Revert code changes
3. Re-deploy

## Rollback Procedures

### Quick Rollback (Most Recent Backup)

```bash
cd infra
./rollback.sh production
```

This uses the most recent backup automatically.

### Rollback to Specific Backup

```bash
cd infra
./rollback.sh production backups/pre-deployment-20241203-120000.dump
```

### Manual Rollback Steps

If automated rollback fails:

1. **Stop services:**
   ```bash
   docker-compose -f docker-compose.instance.yml --env-file instances/production/.env -p production down
   ```

2. **Restore database:**
   ```bash
   ./restore-backup.sh production backups/specific-backup.dump
   ```

3. **Revert code (if needed):**
   ```bash
   git checkout <previous-commit>
   git push --force origin main
   ```

4. **Restart services:**
   ```bash
   ./start-instance.sh production
   ```

## Before Rollback

### 1. Assess the Situation

- What is the issue?
- How severe is it?
- Is rollback the right solution?
- What data will be lost?

### 2. Check Available Backups

```bash
ls -lh instances/production/backups/
```

### 3. Notify Team

Inform team about rollback plan and timeline.

### 4. Create Current Backup

Before rollback, backup current state:

```bash
./backup-database.sh production pre-rollback-$(date +%Y%m%d-%H%M%S)
```

## Rollback Scenarios

### Scenario 1: Deployment Failure

**Symptoms**: Services fail to start after deployment

**Solution**:
```bash
cd infra
./rollback.sh production
```

### Scenario 2: Database Migration Failure

**Symptoms**: Migration fails, database in inconsistent state

**Solution**:
```bash
# Restore database from backup before migration
./restore-backup.sh production backups/pre-migration-YYYYMMDD-HHMMSS.dump
```

### Scenario 3: Code Bug

**Symptoms**: Application errors, incorrect behavior

**Solution**:
1. Rollback code changes
2. If database changed, may need database rollback too

### Scenario 4: Performance Degradation

**Symptoms**: Slow responses, high resource usage

**Solution**:
1. Check if code change caused it
2. Rollback code if necessary
3. Monitor after rollback

### Scenario 5: Security Issue

**Symptoms**: Security vulnerability discovered

**Solution**:
1. Immediately rollback if exploit is active
2. Fix security issue
3. Re-deploy after fix

## After Rollback

### 1. Verify Rollback Success

```bash
./health-check.sh production
```

### 2. Monitor Application

- Check logs
- Monitor metrics
- Watch for errors
- Verify functionality

### 3. Investigate Root Cause

- Review deployment logs
- Check error logs
- Identify what went wrong
- Document findings

### 4. Fix Issues

- Fix the problem
- Test in staging
- Plan re-deployment

### 5. Document Rollback

- Record what happened
- Document rollback steps taken
- Note any data loss
- Update runbook

## Prevention

### Before Deployment

- ✅ Test thoroughly in staging
- ✅ Review code changes
- ✅ Check database migrations
- ✅ Verify health checks
- ✅ Plan rollback strategy

### During Deployment

- ✅ Monitor deployment progress
- ✅ Watch health checks
- ✅ Check error logs
- ✅ Verify functionality

### Best Practices

1. **Always backup before deployment**
2. **Test migrations in staging first**
3. **Use feature flags for risky changes**
4. **Deploy during low-traffic periods**
5. **Have rollback plan ready**
6. **Monitor closely after deployment**

## Emergency Contacts

Maintain a list of emergency contacts:

- DevOps team
- Database administrator
- Security team
- Management

## Rollback Checklist

- [ ] Issue identified and assessed
- [ ] Team notified
- [ ] Backup created (if possible)
- [ ] Rollback procedure selected
- [ ] Rollback executed
- [ ] Health checks passed
- [ ] Monitoring active
- [ ] Root cause investigation started
- [ ] Documentation updated

## Next Steps

- See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment procedures
- See [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) for production setup
- See [MONITORING.md](MONITORING.md) for monitoring setup

