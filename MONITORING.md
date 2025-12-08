# Monitoring and Alerting Guide

Complete guide for monitoring staging and production environments.

## Overview

Effective monitoring helps identify issues early, maintain system health, and ensure reliable service delivery.

## Health Checks

### Automated Health Checks

```bash
# Manual health check
cd infra
./health-check.sh staging
./health-check.sh production

# Automated (cron job)
*/5 * * * * cd /path/to/constintel/infra && ./health-check.sh production || alert-script
```

**What's Checked:**
- PostgreSQL container status and connectivity
- Redis container status and connectivity
- Backend API health endpoint
- ML Service health endpoint
- Frontend accessibility
- Worker processes status
- Disk space usage

## Service Monitoring

### Backend API

**Health Endpoint:**
```bash
curl http://localhost:3010/health  # Staging
curl http://localhost:3020/health  # Production
```

**Metrics to Monitor:**
- Response time
- Error rate
- Request rate
- CPU usage
- Memory usage

### ML Service

**Health Endpoint:**
```bash
curl http://localhost:8010/health  # Staging
curl http://localhost:8020/health  # Production
```

**Metrics to Monitor:**
- Response time
- Model loading status
- Prediction accuracy
- Resource usage

### Database

**Connection Test:**
```bash
docker exec staging-postgres psql -U constintel_staging -d constintel_staging -c "SELECT 1"
```

**Metrics to Monitor:**
- Connection count
- Query performance
- Database size
- Replication lag (if applicable)

### Redis

**Connection Test:**
```bash
docker exec staging-redis redis-cli ping
```

**Metrics to Monitor:**
- Memory usage
- Hit rate
- Connection count
- Command latency

## Log Monitoring

### View Logs

```bash
# All services
docker-compose -f docker-compose.instance.yml --env-file instances/production/.env -p production logs -f

# Specific service
docker-compose -f docker-compose.instance.yml --env-file instances/production/.env -p production logs -f backend

# Last 100 lines
docker-compose -f docker-compose.instance.yml --env-file instances/production/.env -p production logs --tail=100
```

### Error Logs

```bash
# Filter errors
docker-compose -f docker-compose.instance.yml --env-file instances/production/.env -p production logs | grep ERROR

# Count errors
docker-compose -f docker-compose.instance.yml --env-file instances/production/.env -p production logs | grep -c ERROR
```

### Log Levels

- **Production**: `LOG_LEVEL=error` (errors only)
- **Staging**: `LOG_LEVEL=debug` (verbose logging)

## Resource Monitoring

### Container Resource Usage

```bash
# Real-time stats
docker stats

# Specific containers
docker stats staging-backend staging-postgres staging-redis
```

### Disk Usage

```bash
# Instance directory
du -sh instances/production/

# Database size
docker exec production-postgres psql -U constintel_production -d constintel_production -c "SELECT pg_size_pretty(pg_database_size('constintel_production'));"

# Docker volumes
docker system df -v
```

### System Resources

```bash
# CPU and Memory
top
htop

# Disk space
df -h

# Network
iftop
```

## Alerting

### Health Check Alerts

Set up automated alerts for health check failures:

```bash
#!/bin/bash
# alert-script.sh
cd /path/to/constintel/infra
if ! ./health-check.sh production; then
    # Send alert (email, Slack, PagerDuty, etc.)
    echo "Production health check failed!" | mail -s "Alert: Production Issue" admin@example.com
fi
```

### Error Rate Alerts

Monitor error rates and alert if threshold exceeded:

```bash
ERROR_COUNT=$(docker-compose -f docker-compose.instance.yml --env-file instances/production/.env -p production logs --since 5m | grep -c ERROR)
if [ "$ERROR_COUNT" -gt 100 ]; then
    echo "High error rate detected: $ERROR_COUNT errors in last 5 minutes"
fi
```

### Resource Alerts

Alert on high resource usage:

```bash
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "Disk usage critical: ${DISK_USAGE}%"
fi
```

## Monitoring Tools

### Built-in Tools

- Health check script: `./health-check.sh`
- Docker stats: `docker stats`
- Log viewing: `docker-compose logs`

### Recommended Tools

1. **Application Monitoring:**
   - New Relic
   - Datadog
   - Sentry (error tracking)

2. **Infrastructure Monitoring:**
   - Prometheus + Grafana
   - Nagios
   - Zabbix

3. **Log Aggregation:**
   - ELK Stack (Elasticsearch, Logstash, Kibana)
   - Splunk
   - CloudWatch Logs

4. **Uptime Monitoring:**
   - Pingdom
   - UptimeRobot
   - StatusCake

## Key Metrics

### Application Metrics

- **Response Time**: Average API response time
- **Error Rate**: Percentage of failed requests
- **Throughput**: Requests per second
- **Uptime**: Service availability percentage

### Infrastructure Metrics

- **CPU Usage**: Percentage of CPU used
- **Memory Usage**: Percentage of memory used
- **Disk Usage**: Percentage of disk used
- **Network I/O**: Network traffic

### Database Metrics

- **Connection Pool**: Active connections
- **Query Time**: Average query duration
- **Database Size**: Total database size
- **Cache Hit Rate**: Query cache efficiency

### Business Metrics

- **Active Users**: Concurrent users
- **Transactions**: Successful operations
- **Revenue**: If applicable
- **Conversion Rate**: If applicable

## Alert Thresholds

### Critical Alerts (Immediate Action)

- Service down
- Database unreachable
- Disk usage > 95%
- Error rate > 10%
- Response time > 5s

### Warning Alerts (Investigate Soon)

- High error rate (> 1%)
- Slow response time (> 2s)
- High CPU usage (> 80%)
- High memory usage (> 80%)
- Disk usage > 85%

### Info Alerts (Monitor)

- Deployment completed
- Backup completed
- Migration completed
- Health check passed

## Dashboard Setup

### Create Monitoring Dashboard

1. **Choose Tool**: Select monitoring tool (Grafana recommended)
2. **Set Up Data Source**: Connect to metrics source
3. **Create Panels**: Add metric panels
4. **Set Alerts**: Configure alert rules
5. **Share Dashboard**: Make accessible to team

### Dashboard Panels

- Service health status
- Response time graph
- Error rate graph
- Resource usage graphs
- Database metrics
- Active users
- Request rate

## Maintenance Windows

### Scheduled Monitoring

- **Real-time**: Continuous monitoring
- **Hourly**: Resource checks
- **Daily**: Health check reports
- **Weekly**: Performance review

### Monitoring During Deployments

- Monitor health checks closely
- Watch error rates
- Check response times
- Verify functionality

## Troubleshooting

### High Error Rate

1. Check error logs
2. Identify error patterns
3. Check recent deployments
4. Review database queries

### Slow Performance

1. Check resource usage
2. Review slow queries
3. Check cache hit rate
4. Analyze request patterns

### Service Down

1. Check container status
2. Review logs
3. Check health endpoints
4. Verify dependencies

## Next Steps

- Set up monitoring tools
- Configure alerts
- Create dashboards
- Establish on-call rotation
- Document escalation procedures

## Resources

- See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment procedures
- See [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) for production setup
- See [ROLLBACK_GUIDE.md](ROLLBACK_GUIDE.md) for rollback procedures

