# Monitoring Setup - ConstIntel

## Overview

ConstIntel uses Prometheus for metrics collection and Grafana for visualization.

## Services

- **Prometheus**: Metrics collection and storage (port 9090)
- **Grafana**: Dashboards and visualization (port 3002)

## Access

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3002
  - Username: `admin`
  - Password: `admin` (or set `GRAFANA_PASSWORD` in `.env`)

## Metrics Endpoints

- **Backend**: http://localhost:3000/metrics
- **ML Service**: http://localhost:8000/metrics (if implemented)

## Starting Monitoring

```bash
cd infra
docker-compose up -d prometheus grafana
```

Or start all services:
```bash
docker-compose up -d
```

## Metrics Collected

### HTTP Metrics
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration

### Database Metrics
- `db_query_duration_seconds` - Query execution time
- `db_connections_active` - Active connections

### Event Metrics
- `events_ingested_total` - Events ingested
- `events_processed_duration_seconds` - Processing time

### ML Metrics
- `ml_predictions_total` - ML predictions generated
- `ml_prediction_duration_seconds` - Prediction time

### System Metrics
- `active_profiles` - Number of active profiles
- `queue_size` - Queue sizes

## Grafana Dashboards

Default dashboard: **ConstIntel Platform Overview**

Includes:
- API request rate
- API response time (p95)
- Error rate
- Database connections

## Configuration

- Prometheus config: `infra/monitoring/prometheus.yml`
- Grafana datasources: `infra/monitoring/grafana/provisioning/datasources/`
- Grafana dashboards: `infra/monitoring/grafana/dashboards/`

## Next Steps

1. Start services: `docker-compose up -d prometheus grafana`
2. Access Grafana: http://localhost:3002
3. Create custom dashboards for your needs
4. Set up alerting rules in Prometheus

