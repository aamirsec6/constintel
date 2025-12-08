// GENERATOR: ONBOARDING_SYSTEM
// Infrastructure provisioning status tracking
// Tracks real-time status of infrastructure provisioning for brands

import { getRedisClient } from '../streams/redisStreams';

export type ProvisioningStatus =
  | 'pending'
  | 'initializing'
  | 'creating_instance'
  | 'setting_up_database'
  | 'configuring_redis'
  | 'starting_services'
  | 'running_migrations'
  | 'completed'
  | 'failed';

export interface ProvisioningProgress {
  status: ProvisioningStatus;
  progress: number; // 0-100
  currentStep: string;
  steps: Array<{
    name: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    message?: string;
  }>;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number; // seconds
}

const PROVISIONING_STEPS = [
  { name: 'Initializing', key: 'initializing' },
  { name: 'Creating Docker Instance', key: 'creating_instance' },
  { name: 'Setting Up Database', key: 'setting_up_database' },
  { name: 'Configuring Redis', key: 'configuring_redis' },
  { name: 'Starting Services', key: 'starting_services' },
  { name: 'Running Migrations', key: 'running_migrations' },
];

/**
 * Get provisioning status for a brand
 */
export async function getProvisioningStatus(brandId: string): Promise<ProvisioningProgress | null> {
  try {
    const redis = await getRedisClient();
    const statusKey = `provisioning:status:${brandId}`;
    
    const statusData = await redis.get(statusKey);
    
    if (!statusData) {
      return null;
    }

    return JSON.parse(statusData) as ProvisioningProgress;
  } catch (error) {
    console.error('Error getting provisioning status:', error);
    return null;
  }
}

/**
 * Update provisioning status
 */
export async function updateProvisioningStatus(
  brandId: string,
  status: ProvisioningStatus,
  currentStep?: string,
  error?: string
): Promise<void> {
  try {
    const redis = await getRedisClient();
    const statusKey = `provisioning:status:${brandId}`;
    
    const current = await getProvisioningStatus(brandId);
    
    const stepIndex = PROVISIONING_STEPS.findIndex((s) => s.key === status);
    const progress = status === 'completed' ? 100 : status === 'failed' ? 0 : Math.round(((stepIndex + 1) / PROVISIONING_STEPS.length) * 100);
    
    const updated: ProvisioningProgress = {
      status,
      progress,
      currentStep: currentStep || PROVISIONING_STEPS[stepIndex]?.name || 'Unknown',
      steps: PROVISIONING_STEPS.map((step, idx) => ({
        name: step.name,
        status:
          idx < stepIndex
            ? 'completed'
            : idx === stepIndex && status !== 'failed'
            ? 'in_progress'
            : status === 'failed' && idx === stepIndex
            ? 'failed'
            : 'pending',
      })),
      error,
      startedAt: current?.startedAt || new Date(),
      completedAt: status === 'completed' || status === 'failed' ? new Date() : undefined,
      estimatedTimeRemaining:
        status === 'completed' || status === 'failed'
          ? undefined
          : Math.max(0, (PROVISIONING_STEPS.length - stepIndex) * 30), // ~30 seconds per step
    };

    await redis.set(statusKey, JSON.stringify(updated), {
      EX: 3600, // Expire after 1 hour
    });
  } catch (error) {
    console.error('Error updating provisioning status:', error);
  }
}

/**
 * Initialize provisioning status
 */
export async function initializeProvisioningStatus(brandId: string): Promise<void> {
  await updateProvisioningStatus(brandId, 'pending', 'Initializing provisioning...');
}

/**
 * Clear provisioning status (after completion or cleanup)
 */
export async function clearProvisioningStatus(brandId: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    const statusKey = `provisioning:status:${brandId}`;
    await redis.del(statusKey);
  } catch (error) {
    console.error('Error clearing provisioning status:', error);
  }
}

