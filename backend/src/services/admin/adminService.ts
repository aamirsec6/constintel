// GENERATOR: AUTH_SYSTEM
// Admin service for platform management
// Provides admin-only functionality for managing brands and platform

import { getPrismaClient } from '../../db/prismaClient';
import { listBrands, getBrandById, updateBrand } from '../brand/brandService';
import { stopInstance, startInstance } from '../infrastructure/instanceProvisioner';

/**
 * Get platform statistics
 */
export async function getPlatformStats() {
  const prisma = getPrismaClient();

  const [
    totalBrands,
    activeBrands,
    trialBrands,
    suspendedBrands,
    totalUsers,
    brandsToday,
    brandsThisWeek,
    brandsThisMonth,
  ] = await Promise.all([
    prisma.brand.count(),
    prisma.brand.count({ where: { status: 'active' } }),
    prisma.brand.count({ where: { status: 'trial' } }),
    prisma.brand.count({ where: { status: 'suspended' } }),
    prisma.user.count(),
    prisma.brand.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.brand.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.brand.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    brands: {
      total: totalBrands,
      active: activeBrands,
      trial: trialBrands,
      suspended: suspendedBrands,
      newToday: brandsToday,
      newThisWeek: brandsThisWeek,
      newThisMonth: brandsThisMonth,
    },
    users: {
      total: totalUsers,
    },
  };
}

/**
 * Get brand list with filters (admin only)
 */
export async function adminListBrands(filters?: {
  status?: string;
  plan?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return listBrands(filters);
}

/**
 * Get brand details (admin only)
 */
export async function adminGetBrandDetails(brandId: string) {
  return getBrandById(brandId);
}

/**
 * Suspend a brand
 */
export async function suspendBrand(brandId: string, reason?: string): Promise<void> {
  const prisma = getPrismaClient();

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
  });

  if (!brand) {
    throw new Error('Brand not found');
  }

  // Update status
  await prisma.brand.update({
    where: { id: brandId },
    data: {
      status: 'suspended',
      settings: {
        ...(brand.settings as any || {}),
        suspensionReason: reason,
        suspendedAt: new Date().toISOString(),
      },
    },
  });

  // Stop instance if it exists
  if (brand.instanceId) {
    try {
      await stopInstance(brand.instanceId);
    } catch (error) {
      console.error(`Failed to stop instance for brand ${brandId}:`, error);
    }
  }
}

/**
 * Activate a brand
 */
export async function activateBrand(brandId: string): Promise<void> {
  const prisma = getPrismaClient();

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
  });

  if (!brand) {
    throw new Error('Brand not found');
  }

  // Update status
  await prisma.brand.update({
    where: { id: brandId },
    data: {
      status: 'active',
    },
  });

  // Start instance if it exists
  if (brand.instanceId) {
    try {
      await startInstance(brand.instanceId);
    } catch (error) {
      console.error(`Failed to start instance for brand ${brandId}:`, error);
    }
  }
}

/**
 * Create admin user (first-time setup)
 */
export async function createAdminUser(email: string, password: string): Promise<void> {
  const prisma = getPrismaClient();

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'admin' },
  });

  if (existingAdmin) {
    throw new Error('Admin user already exists');
  }

  const { hashPassword } = await import('../auth/passwordService');
  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
      emailVerified: true,
    },
  });
}

