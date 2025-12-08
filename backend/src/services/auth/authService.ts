// GENERATOR: AUTH_SYSTEM
// Core authentication service
// Handles login, signup, token generation

import { getPrismaClient } from '../../db/prismaClient';
import { hashPassword, verifyPassword, validatePasswordStrength } from './passwordService';
import { generateAccessToken, generateRefreshToken, TokenPayload } from './jwtService';
import { createBrand } from '../brand/brandService';
import { randomBytes } from 'crypto';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  brandName: string;
  domain?: string;
  industry?: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    role: string;
    brandId?: string;
    emailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Login user with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResult> {
  const prisma = getPrismaClient();

  const user = await prisma.user.findUnique({
    where: { email: credentials.email.toLowerCase() },
    include: { brand: true },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isValidPassword = await verifyPassword(credentials.password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    brandId: user.brandId || undefined,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      brandId: user.brandId || undefined,
      emailVerified: user.emailVerified,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Signup new brand owner
 */
export async function signup(data: SignupData): Promise<AuthResult> {
  const prisma = getPrismaClient();

  // Validate password strength
  const passwordValidation = validatePasswordStrength(data.password);
  if (!passwordValidation.valid) {
    throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Generate email verification token
  const emailVerifyToken = randomBytes(32).toString('hex');

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Create brand with isolated infrastructure (in transaction)
  const { brand, instance } = await createBrand({
    name: data.brandName,
    domain: data.domain,
    industry: data.industry,
    plan: 'free',
  });

  // Create user linked to brand
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      role: 'brand_owner',
      brandId: brand.id,
      emailVerifyToken,
    },
    include: {
      brand: true,
    },
  });

  const result = { user, brand };

  const payload: TokenPayload = {
    userId: result.user.id,
    email: result.user.email,
    role: result.user.role,
    brandId: result.user.brandId || undefined,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // TODO: Send welcome email with verification link

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      brandId: result.user.brandId || undefined,
      emailVerified: result.user.emailVerified,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<boolean> {
  const prisma = getPrismaClient();

  const user = await prisma.user.findFirst({
    where: { emailVerifyToken: token },
  });

  if (!user) {
    throw new Error('Invalid verification token');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
    },
  });

  return true;
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const prisma = getPrismaClient();

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Don't reveal if user exists (security best practice)
    return;
  }

  const resetToken = randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 3600000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires,
    },
  });

  // TODO: Send password reset email
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const prisma = getPrismaClient();

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  return true;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const prisma = getPrismaClient();

  return prisma.user.findUnique({
    where: { id: userId },
    include: { brand: true },
    select: {
      id: true,
      email: true,
      role: true,
      brandId: true,
      emailVerified: true,
      lastLogin: true,
      createdAt: true,
      brand: {
        select: {
          id: true,
          name: true,
          domain: true,
          industry: true,
          plan: true,
          status: true,
        },
      },
    },
  });
}

