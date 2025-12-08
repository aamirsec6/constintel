// GENERATOR: ONBOARDING_SYSTEM
// Onboarding service for managing brand onboarding flow
// Handles step-by-step onboarding process

import { getPrismaClient } from '../../db/prismaClient';
import { z } from 'zod';

export interface OnboardingStepData {
  step: number;
  data: Record<string, any>;
}

export interface OnboardingState {
  currentStep: number;
  completed: boolean;
  data: {
    brandInfo?: {
      name: string;
      domain?: string;
      industry?: string;
      companySize?: string;
      description?: string;
    };
    contactDetails?: {
      contactEmail: string;
      phone?: string;
      contactPerson?: string;
      billingAddress?: string;
    };
    integrations?: {
      shopify?: any;
      woocommerce?: any;
      twilio?: any;
    };
    configuration?: {
      timezone: string;
      currency: string;
      preferences?: Record<string, any>;
    };
  };
}

const brandInfoSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  domain: z.string().trim().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  description: z.string().optional(),
});

const contactDetailsSchema = z.object({
  contactPerson: z.string().min(1, 'Contact person is required'),
  contactEmail: z.string().email('Contact email is required'),
  phone: z.string().optional(),
  billingAddress: z.string().optional(),
});

const integrationSchema = z.object({
  shopify: z.object({ enabled: z.boolean().optional() }).optional(),
  woocommerce: z.object({ enabled: z.boolean().optional() }).optional(),
  twilio: z.object({ enabled: z.boolean().optional() }).optional(),
}).optional();

const configurationSchema = z.object({
  timezone: z.string().min(1),
  currency: z.string().min(1),
  preferences: z.record(z.any()).optional(),
});

/**
 * Get onboarding state for a brand
 */
export async function getOnboardingState(brandId: string): Promise<OnboardingState | null> {
  const prisma = getPrismaClient();

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: {
      onboardingState: true,
      onboardingCompleted: true,
    },
  });

  if (!brand || !brand.onboardingState) {
    return {
      currentStep: 1,
      completed: false,
      data: {},
    };
  }

  return brand.onboardingState as OnboardingState;
}

/**
 * Update onboarding step
 */
export async function updateOnboardingStep(
  brandId: string,
  step: number,
  stepData: Record<string, any>
): Promise<OnboardingState> {
  const prisma = getPrismaClient();

  const currentState = await getOnboardingState(brandId);

  // Validate and map step data
  let validatedData: any = {};
  switch (step) {
    case 1:
      validatedData = { brandInfo: brandInfoSchema.parse(stepData.brandInfo || stepData) };
      break;
    case 2:
      validatedData = { contactDetails: contactDetailsSchema.parse(stepData.contactDetails || stepData) };
      break;
    case 3:
      validatedData = { integrations: integrationSchema.parse(stepData.integrations || stepData) || {} };
      break;
    case 4:
      validatedData = { configuration: configurationSchema.parse(stepData.configuration || stepData) };
      break;
    default:
      validatedData = stepData;
  }

  const updatedState: OnboardingState = {
    currentStep: step,
    completed: false,
    data: {
      ...(currentState?.data || {}),
      ...validatedData,
    },
  };

  // Apply step-specific updates to Brand settings
  if (step === 1 && updatedState.data.brandInfo) {
    const { name, domain, industry } = updatedState.data.brandInfo;
    await prisma.brand.update({
      where: { id: brandId },
      data: { name, domain, industry },
    });
  }

  if (step === 4 && updatedState.data.configuration) {
    const { timezone, currency, preferences } = updatedState.data.configuration;
    await prisma.brand.update({
      where: { id: brandId },
      data: {
        settings: {
          ...(currentState?.data.configuration?.preferences || {}),
          timezone,
          currency,
          ...(preferences || {}),
        } as any,
      },
    });
  }

  await prisma.brand.update({
    where: { id: brandId },
    data: {
      onboardingState: updatedState as any,
    },
  });

  return updatedState;
}

/**
 * Complete onboarding
 */
export async function completeOnboarding(brandId: string): Promise<void> {
  const prisma = getPrismaClient();

  const currentState = (await getOnboardingState(brandId)) || {
    currentStep: 1,
    completed: false,
    data: {},
  };

  await prisma.brand.update({
    where: { id: brandId },
    data: {
      onboardingState: {
        ...currentState,
        completed: true,
        currentStep: 6, // Provisioning / completion step
      } as any,
      onboardingCompleted: true,
      status: 'active', // Activate brand
    },
  });
}

/**
 * Get onboarding progress percentage
 */
export async function getOnboardingProgress(brandId: string): Promise<number> {
  const state = await getOnboardingState(brandId);
  
  if (!state) {
    return 0;
  }

  if (state.completed) {
    return 100;
  }

  const totalSteps = 5;
  const step = Math.min(state.currentStep, totalSteps);
  return Math.round((step / totalSteps) * 100);
}

