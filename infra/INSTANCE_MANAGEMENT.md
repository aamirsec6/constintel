# Instance Management Guide

This guide explains how to create and manage isolated ConstIntel instances. Each instance has completely separate infrastructure (database, Redis, services) with no shared data.

## Overview

Isolated instances allow you to run multiple ConstIntel deployments side-by-side:
- **Development and Production**: Separate dev and prod environments
- **Multiple Brands**: Different instances for different brand IDs
- **Testing**: Isolated test environments
- **Staging**: Pre-production staging instances

Each instance has:
- ✅ Separate PostgreSQL database
- ✅ Separate Redis instance
- ✅ Separate Docker network
- ✅ Separate volumes (persistent data)
- ✅ Unique ports (no conflicts)

## Quick Start

### 1. Create an Instance

```bash
cd infra
./create-instance.sh <instance-name> <instance-id>
```

**Examples:**
```bash
# Development instance (default ports: 3000, 3001, 8000, 5432, 6379)
./create-instance.sh dev 0

# Staging instance (ports: 3010, 3011, 8010, 5433, 6380)
./create-instance.sh staging 1

# Production instance (ports: 3020, 3021, 8020, 5434, 6381)
./create-instance.sh prod 2
```

### 2. Start the Instance

```bash
./start-instance.sh <instance-name>
```

This will:
- Start all services (PostgreSQL, Redis, Backend, Frontend, ML Service, Workers)
- Run database migrations if needed
- Display access URLs

### 3. Access Your Instance

Once started, access the services:
- **Frontend**: http://localhost:`<FRONTEND_PORT>`
- **Backend API**: http://localhost:`<BACKEND_PORT>`
- **ML Service**: http://localhost:`<ML_SERVICE_PORT>`

### 4. Stop the Instance

```bash
./stop-instance.sh <instance-name>
```

### 5. List All Instances

```bash
./list-instances.sh
```

Shows all instances with their ports and status (RUNNING/STOPPED).

### 6. Remove an Instance

**⚠️ WARNING: This permanently deletes all data!**

```bash
./remove-instance.sh <instance-name>
```

## Port Allocation

Ports are allocated based on `instance-id`:

| Instance ID | Backend | Frontend | ML Service | PostgreSQL | Redis |
|-------------|---------|----------|------------|------------|-------|
| 0           | 3000    | 3001     | 8000       | 5432       | 6379  |
| 1           | 3010    | 3011     | 8010       | 5433       | 6380  |
| 2           | 3020    | 3021     | 8020       | 5434       | 6381  |
| 3           | 3030    | 3031     | 8030       | 5435       | 6382  |
| ...         | ...     | ...      | ...        | ...        | ...   |

**Formula**: Base port + (instance_id × 10)

For PostgreSQL and Redis: Base port + instance_id

## Instance Configuration

Each instance has its own configuration file:
- Location: `infra/instances/<instance-name>/.env`
- Contains: Ports, database credentials, environment variables

### Customizing an Instance

1. **Edit Configuration**:
   ```bash
   nano infra/instances/<instance-name>/.env
   ```

2. **Available Variables**:
   - `INSTANCE_NAME`: Instance identifier
   - `INSTANCE_ID`: Numeric ID for port calculation
   - `BACKEND_PORT`, `FRONTEND_PORT`, `ML_SERVICE_PORT`: Service ports
   - `POSTGRES_PORT`, `REDIS_PORT`: Infrastructure ports
   - `DATABASE_NAME`, `POSTGRES_USER`, `POSTGRES_PASSWORD`: Database credentials
   - Integration secrets (Shopify, WooCommerce, Twilio, etc.)
   - Security keys (`JWT_SECRET`, `ENCRYPTION_KEY`)

3. **Restart** after changes:
   ```bash
   ./stop-instance.sh <instance-name>
   ./start-instance.sh <instance-name>
   ```

## Data Isolation

Each instance has completely isolated data:

### Database
- Separate PostgreSQL database: `constintel_<instance-name>`
- Separate database user and password
- No cross-instance data access

### Redis
- Separate Redis instance on unique port
- Isolated cache and streams
- Separate Redis data volume

### Volumes
- `{instance-name}_postgres_data`: PostgreSQL data
- `{instance-name}_redis_data`: Redis persistence
- `{instance-name}_ml_models`: ML model storage

### Network
- Isolated Docker network: `{instance-name}_network`
- Containers can only communicate within the same instance

## Common Workflows

### Development Workflow

```bash
# Create dev instance
./create-instance.sh dev 0

# Start dev environment
./start-instance.sh dev

# Work on code (changes auto-reload)
# Access at http://localhost:3001

# Stop when done
./stop-instance.sh dev
```

### Multi-Environment Setup

```bash
# Development
./create-instance.sh dev 0
./start-instance.sh dev

# Staging
./create-instance.sh staging 1
./start-instance.sh staging

# Production (careful!)
./create-instance.sh prod 2
# Review config first!
./start-instance.sh prod
```

### Testing Different Configurations

```bash
# Test instance with different settings
./create-instance.sh test-config 3

# Edit configuration
nano instances/test-config/.env
# Change ports, database settings, etc.

# Start and test
./start-instance.sh test-config

# Clean up when done
./remove-instance.sh test-config
```

## Managing Services

### View Logs

```bash
# All services
docker-compose -f docker-compose.instance.yml \
  --env-file instances/<instance-name>/.env \
  -p <instance-name> logs -f

# Specific service
docker-compose -f docker-compose.instance.yml \
  --env-file instances/<instance-name>/.env \
  -p <instance-name> logs -f backend
```

### Restart a Service

```bash
docker-compose -f docker-compose.instance.yml \
  --env-file instances/<instance-name>/.env \
  -p <instance-name> restart backend
```

### Execute Commands

```bash
# Access database
docker exec -it <instance-name>-postgres psql -U <user> -d <database>

# Access Redis CLI
docker exec -it <instance-name>-redis redis-cli

# Run backend commands
docker exec -it <instance-name>-backend npm run <command>
```

## Troubleshooting

### Port Conflicts

**Error**: `port is already allocated`

**Solution**: Choose a different instance ID:
```bash
./create-instance.sh my-instance 5  # Uses ports 3050, 3051, etc.
```

### Instance Won't Start

1. **Check if ports are in use**:
   ```bash
   lsof -i :3000  # Check backend port
   lsof -i :5432  # Check postgres port
   ```

2. **Check Docker resources**:
   ```bash
   docker ps -a | grep <instance-name>
   docker volume ls | grep <instance-name>
   ```

3. **View error logs**:
   ```bash
   docker-compose -f docker-compose.instance.yml \
     --env-file instances/<instance-name>/.env \
     -p <instance-name> logs
   ```

### Database Migration Issues

If migrations fail:
```bash
# Connect to the database
docker exec -it <instance-name>-postgres psql -U <user> -d <database>

# Check tables
\dt

# If needed, run migrations manually
cd backend
DATABASE_URL="postgresql://user:pass@localhost:<port>/db" npx prisma db push
```

### Instance Not Found

**Error**: `Instance 'xyz' not found`

**Solution**: 
1. Check if instance exists: `ls instances/`
2. Verify `.env` file exists: `ls instances/<instance-name>/.env`
3. Create the instance: `./create-instance.sh <name> <id>`

## Default Instance (Legacy)

The original `docker-compose.yml` still works for backward compatibility:
- Uses `INSTANCE_NAME` environment variable (defaults to "default")
- If not set, uses original container names (`constintel-*`)
- Can be used alongside isolated instances

To use it:
```bash
cd infra
docker-compose up -d
```

Or set instance name:
```bash
INSTANCE_NAME=my-instance docker-compose up -d
```

## Best Practices

1. **Naming Conventions**:
   - Use lowercase: `dev`, `staging`, `prod`
   - Be descriptive: `brand1-prod`, `test-env-v2`

2. **Instance IDs**:
   - Start from 0 for your primary instance
   - Increment by 1 for each new instance
   - Keep a list of which IDs are in use

3. **Security**:
   - Use strong passwords in production instances
   - Don't commit `.env` files to version control
   - Use different secrets for each environment

4. **Resource Management**:
   - Stop unused instances to free resources
   - Remove test instances when done
   - Monitor disk usage (each instance has its own volumes)

5. **Backups**:
   - Backup instance volumes: `docker volume inspect <volume-name>`
   - Export databases: `docker exec <postgres-container> pg_dump -U user db > backup.sql`

## File Structure

```
infra/
├── docker-compose.yml              # Main compose file (backward compatible)
├── docker-compose.instance.yml     # Template for isolated instances
├── create-instance.sh              # Create new instance
├── start-instance.sh               # Start instance
├── stop-instance.sh                # Stop instance
├── list-instances.sh               # List all instances
├── remove-instance.sh              # Remove instance
├── INSTANCE_MANAGEMENT.md          # This file
└── instances/
    ├── .env.template               # Configuration template
    └── <instance-name>/
        └── .env                    # Instance-specific config
```

## Examples

### Example 1: Development and Production

```bash
# Development
./create-instance.sh dev 0
./start-instance.sh dev
# Access at http://localhost:3001

# Production
./create-instance.sh prod 1
# Edit prod/.env with production credentials
./start-instance.sh prod
# Access at http://localhost:3011
```

### Example 2: Multiple Brand Instances

```bash
# Brand 1
./create-instance.sh brand1 0
./start-instance.sh brand1

# Brand 2
./create-instance.sh brand2 1
./start-instance.sh brand2

# Brand 3
./create-instance.sh brand3 2
./start-instance.sh brand3
```

### Example 3: Feature Testing

```bash
# Create test instance for new feature
./create-instance.sh feature-test 5

# Configure with test data
nano instances/feature-test/.env

# Start and test
./start-instance.sh feature-test

# Clean up when done
./remove-instance.sh feature-test
```

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

