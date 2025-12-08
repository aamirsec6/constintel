# Starting All Services

## Port Configuration

- **Backend API**: Port `3000`
- **Frontend (Next.js)**: Port `3001` 
- **ML Service (Python)**: Port `8000`
- **PostgreSQL**: Port `5432` (if using Docker)
- **Redis**: Port `6379` (if using Docker)

## Quick Start

### Option 1: Start All Services (Recommended)

I've created startup scripts. Run:

```bash
# Stop all services first
./stop-all-services.sh

# Start all services
./start-all-services.sh
```

### Option 2: Start Services Manually

#### 1. Start Backend (Port 3000)
```bash
cd backend
npm run dev
```

#### 2. Start ML Service (Port 8000)
```bash
cd services/ml_service
source venv/bin/activate  # or create venv if needed
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

#### 3. Start Frontend (Port 3001)
```bash
cd frontend
# Clear cache first
rm -rf .next
# Start with port 3001
PORT=3001 npm run dev
```

### Option 3: Use Docker Compose

```bash
cd infra
docker-compose up -d
```

## Verify Services

Check if services are running:
```bash
# Backend
curl http://localhost:3000/health

# ML Service  
curl http://localhost:8000/health

# Frontend (should load in browser)
open http://localhost:3001
```

## Troubleshooting

If ports are already in use:
```bash
# Find what's using the port
lsof -i :3000
lsof -i :3001
lsof -i :8000

# Kill the process
kill -9 <PID>
```

