#!/bin/bash
cd frontend
echo "Deploying frontend to Railway..."
for i in {1..3}; do
  echo "Attempt $i..."
  if railway up --detach 2>&1 | grep -q "Build Logs"; then
    echo "✅ Deployment started!"
    exit 0
  fi
  echo "Retrying in 10 seconds..."
  sleep 10
done
echo "❌ Deployment failed after 3 attempts"
exit 1
