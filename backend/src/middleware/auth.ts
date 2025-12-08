// GENERATOR: AUTH_SYSTEM
// Authentication middleware for Express routes
// Validates JWT tokens and attaches user info to request

import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../services/auth/jwtService';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Middleware to authenticate requests using JWT token
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const payload = verifyToken(token);
      req.user = payload;
      next();
    } catch (error: any) {
      if (error.message === 'Token expired') {
        res.status(401).json({ error: 'Token expired' });
        return;
      }
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
    return;
  }
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

/**
 * Middleware to check if user is admin
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  requireRole('admin')(req, res, next);
}

/**
 * Middleware to check if user belongs to a brand (or is admin)
 */
export function requireBrandAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Admins can access any brand
  if (req.user.role === 'admin') {
    next();
    return;
  }

  // Check if brand_id in params/body matches user's brand
  const requestedBrandId = req.params.brandId || req.body.brandId || req.headers['x-brand-id'];
  const userBrandId = req.user.brandId;

  // If user has no brandId in token, allow if they're requesting a brand (for development/testing)
  if (!userBrandId && requestedBrandId) {
    // In development, allow access if brandId is provided
    if (process.env.NODE_ENV === 'development') {
      next();
      return;
    }
  }

  if (requestedBrandId && userBrandId && requestedBrandId === userBrandId) {
    next();
    return;
  }

  // For routes without explicit brand_id, allow if user has a brand
  if (!requestedBrandId && userBrandId) {
    next();
    return;
  }

  // If no brandId match but we have a requested brandId, allow in development
  if (requestedBrandId && process.env.NODE_ENV === 'development') {
    console.warn(`Brand access check: user brandId=${userBrandId}, requested=${requestedBrandId} - allowing in development`);
    next();
    return;
  }

  res.status(403).json({ error: 'Access denied to this brand' });
  return;
}

