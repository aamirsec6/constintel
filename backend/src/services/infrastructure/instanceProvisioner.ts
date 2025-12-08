// GENERATOR: AUTH_SYSTEM
// Automatic isolated infrastructure provisioning for new brands
// Calls create-instance.sh script to provision isolated Docker instance

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

// Path from backend/src/services/infrastructure to project root/infra
const INFRA_DIR = path.join(__dirname, '../../../../infra');
const CREATE_INSTANCE_SCRIPT = path.join(INFRA_DIR, 'create-instance.sh');

export interface ProvisionedInstance {
  instanceName: string;
  instanceId: number;
  backendPort: number;
  frontendPort: number;
  mlServicePort: number;
  postgresPort: number;
  redisPort: number;
}

/**
 * Get next available instance ID
 */
async function getNextInstanceId(): Promise<number> {
  const instancesDir = path.join(INFRA_DIR, 'instances');
  
  if (!fs.existsSync(instancesDir)) {
    return 0;
  }

  const existingInstances = fs.readdirSync(instancesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory());

  // Find highest instance ID
  let maxId = -1;
  for (const dirent of existingInstances) {
    const envFile = path.join(instancesDir, dirent.name, '.env');
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf-8');
      const match = envContent.match(/INSTANCE_ID=(\d+)/);
      if (match) {
        const id = parseInt(match[1], 10);
        if (id > maxId) {
          maxId = id;
        }
      }
    }
  }

  return maxId + 1;
}

/**
 * Provision isolated infrastructure for a brand
 */
export async function provisionInstance(
  brandId: string,
  brandName: string
): Promise<ProvisionedInstance> {
  // Sanitize brand name for instance name (lowercase, alphanumeric + hyphens)
  const instanceName = `brand-${brandId.slice(0, 8)}-${brandName.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 20)}`.replace(/-+/g, '-').replace(/^-|-$/g, '');
  
  // Get next available instance ID
  const instanceId = await getNextInstanceId();

  // Check if script exists
  if (!fs.existsSync(CREATE_INSTANCE_SCRIPT)) {
    throw new Error('Instance provisioning script not found. Please ensure infra/create-instance.sh exists.');
  }

  // Make script executable
  await execAsync(`chmod +x ${CREATE_INSTANCE_SCRIPT}`);

  try {
    // Execute create-instance script (requires instance name and ID)
    const { stdout, stderr } = await execAsync(
      `cd ${INFRA_DIR} && bash ${CREATE_INSTANCE_SCRIPT} ${instanceName} ${instanceId}`
    );

    if (stderr && !stderr.includes('Warning')) {
      console.error('Instance provisioning stderr:', stderr);
    }

    // Calculate ports based on instance ID (matching create-instance.sh logic)
    const backendPort = 3000 + (instanceId * 10);
    const frontendPort = 3001 + (instanceId * 10);
    const mlServicePort = 8000 + (instanceId * 10);
    const postgresPort = 5432 + instanceId;
    const redisPort = 6379 + instanceId;

    return {
      instanceName,
      instanceId,
      backendPort,
      frontendPort,
      mlServicePort,
      postgresPort,
      redisPort,
    };
  } catch (error: any) {
    console.error('Failed to provision instance:', error);
    throw new Error(`Failed to provision isolated infrastructure: ${error.message}`);
  }
}

/**
 * Start a provisioned instance
 */
export async function startInstance(instanceName: string): Promise<void> {
  const startScript = path.join(INFRA_DIR, 'start-instance.sh');
  
  if (!fs.existsSync(startScript)) {
    throw new Error('Start instance script not found');
  }

  await execAsync(`chmod +x ${startScript}`);

  try {
    const { stdout, stderr } = await execAsync(
      `cd ${INFRA_DIR} && ${startScript} ${instanceName}`
    );

    if (stderr && !stderr.includes('Warning')) {
      console.error('Instance start stderr:', stderr);
    }
  } catch (error: any) {
    console.error('Failed to start instance:', error);
    throw new Error(`Failed to start instance: ${error.message}`);
  }
}

/**
 * Stop a provisioned instance
 */
export async function stopInstance(instanceName: string): Promise<void> {
  const stopScript = path.join(INFRA_DIR, 'stop-instance.sh');
  
  if (!fs.existsSync(stopScript)) {
    throw new Error('Stop instance script not found');
  }

  await execAsync(`chmod +x ${stopScript}`);

  try {
    await execAsync(`cd ${INFRA_DIR} && ${stopScript} ${instanceName}`);
  } catch (error: any) {
    console.error('Failed to stop instance:', error);
    throw new Error(`Failed to stop instance: ${error.message}`);
  }
}

