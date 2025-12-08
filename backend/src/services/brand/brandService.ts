// GENERATOR: AUTH_SYSTEM
// Brand management service
// Handles brand creation, updates, and infrastructure provisioning

import { getPrismaClient } from '../../db/prismaClient';
import { provisionInstance, startInstance } from '../infrastructure/instanceProvisioner';
import { randomBytes } from 'crypto';

export interface CreateBrandData {
  name: string;
  domain?: string;
  industry?: string;
  plan?: string;
}

/**
 * Create a new brand with automatic infrastructure provisioning
 */
export async function createBrand(data: CreateBrandData): Promise<{
  brand: any;
  instance: {
    instanceName: string;
    instanceId: number;
    ports: {
      backend: number;
      frontend: number;
      mlService: number;
      postgres: number;
      redis: number;
    };
  };
}> {
  const prisma = getPrismaClient();

  // Generate API key
  const apiKey = `ci_${randomBytes(24).toString('hex')}`;

  // Create brand first (we'll update with instance info)
  const brand = await prisma.brand.create({
    data: {
      name: data.name,
      domain: data.domain,
      industry: data.industry,
      plan: data.plan || 'free',
      status: 'trial',
      apiKey,
      settings: {
        timezone: 'UTC',
        currency: 'USD',
      },
    },
  });

  try {
    // Provision isolated infrastructure
    const instance = await provisionInstance(brand.id, brand.name);

    // Update brand with instance information
    const updatedBrand = await prisma.brand.update({
      where: { id: brand.id },
      data: {
        instanceId: instance.instanceName,
        instanceConfig: {
          instanceId: instance.instanceId,
          ports: {
            backend: instance.backendPort,
            frontend: instance.frontendPort,
            mlService: instance.mlServicePort,
            postgres: instance.postgresPort,
            redis: instance.redisPort,
          },
        },
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Start the instance (async, don't wait)
    startInstance(instance.instanceName).catch((error) => {
      console.error(`Failed to auto-start instance ${instance.instanceName}:`, error);
    });

    return {
      brand: updatedBrand,
      instance: {
        instanceName: instance.instanceName,
        instanceId: instance.instanceId,
        ports: {
          backend: instance.backendPort,
          frontend: instance.frontendPort,
          mlService: instance.mlServicePort,
          postgres: instance.postgresPort,
          redis: instance.redisPort,
        },
      },
    };
  } catch (error) {
    // If provisioning fails, mark brand as failed
    await prisma.brand.update({
      where: { id: brand.id },
      data: { status: 'suspended' },
    });
    throw error;
  }
}

/**
 * Get brand by ID
 */
export async function getBrandById(brandId: string) {
  const prisma = getPrismaClient();

  return prisma.brand.findUnique({
    where: { id: brandId },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          role: true,
          emailVerified: true,
          lastLogin: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          users: true,
        },
      },
    },
  });
}

/**
 * Update brand
 */
export async function updateBrand(
  brandId: string,
  data: Partial<CreateBrandData & { status?: string; plan?: string }>
) {
  const prisma = getPrismaClient();

  return prisma.brand.update({
    where: { id: brandId },
    data: {
      name: data.name,
      domain: data.domain,
      industry: data.industry,
      plan: data.plan,
      status: data.status,
      updatedAt: new Date(),
    },
  });
}

/**
 * Update brand last activity timestamp
 */
export async function updateBrandActivity(brandId: string): Promise<void> {
  const prisma = getPrismaClient();

  await prisma.brand.update({
    where: { id: brandId },
    data: {
      lastActivityAt: new Date(),
    },
  });
}

/**
 * List all brands (admin only)
 */
export async function listBrands(filters?: {
  status?: string;
  plan?: string;
  limit?: number;
  offset?: number;
}) {
  const prisma = getPrismaClient();

  const where: any = {};
  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.plan) {
    where.plan = filters.plan;
  }

  const [brands, total] = await Promise.all([
    prisma.brand.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
    }),
    prisma.brand.count({ where }),
  ]);

  return {
    brands,
    total,
    limit: filters?.limit || 100,
    offset: filters?.offset || 0,
  };
}

