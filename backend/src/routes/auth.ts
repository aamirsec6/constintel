// GENERATOR: AUTH_SYSTEM
// Authentication routes (login, signup, logout, password reset)
// HOW TO USE: Mount at /api/auth

import { Router, Request, Response } from 'express';
import {
  login,
  signup,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
} from '../services/auth/authService';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  brandName: z.string().min(1),
  domain: z.string().optional(),
  industry: z.string().optional(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

/**
 * POST /api/auth/signup
 * Register a new brand owner
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const validated = signupSchema.parse(req.body);
    const result = await signup(validated);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Brand registered successfully. Please check your email for verification.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    if (error.message.includes('already registered')) {
      res.status(409).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: error.message || 'Signup failed',
    });
  }
});

/**
 * POST /api/auth/login
 * Login user (brand user or admin)
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await login(validated);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    if (error.message.includes('Invalid email or password')) {
      res.status(401).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Login failed',
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal, but we can track here if needed)
 */
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  // In a JWT-based system, logout is primarily client-side (remove token)
  // If you need server-side session invalidation, implement token blacklist
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getUserById } = await import('../services/auth/authService');
    const user = await getUserById(req.user!.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user',
    });
  }
});

/**
 * POST /api/auth/verify-email
 * Verify email with token
 */
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Verification token required',
      });
      return;
    }

    await verifyEmail(token);

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Email verification failed',
    });
  }
});

/**
 * POST /api/auth/request-password-reset
 * Request password reset
 */
router.post('/request-password-reset', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email required',
      });
      return;
    }

    await requestPasswordReset(email);

    // Always return success (don't reveal if user exists)
    res.json({
      success: true,
      message: 'If an account exists, a password reset email has been sent',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to request password reset',
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const validated = resetPasswordSchema.parse(req.body);
    await resetPassword(validated.token, validated.newPassword);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: error.message || 'Password reset failed',
    });
  }
});

export default router;

