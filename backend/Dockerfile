# GENERATOR: FULL_PLATFORM
# Backend Dockerfile (Production)
# Using Debian-based image for Prisma compatibility

FROM node:20

WORKDIR /app

# Copy package files
COPY package*.json ./
# Install all dependencies (tsx needed for running TypeScript)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 3000

# Use tsx to run TypeScript directly (avoids build errors)
CMD ["npx", "tsx", "src/server.ts"]

