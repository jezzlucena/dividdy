import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../middleware/errorHandler.js';
import { sendMagicLinkEmail } from '../utils/email.js';
import {
  generateAccessToken,
  generateMagicLink,
  generateRefreshToken,
  revokeAllUserRefreshTokens,
  revokeRefreshToken,
  verifyMagicLink,
  verifyRefreshToken,
} from '../utils/jwt.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const magicLinkSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
      },
    });

    // Generate tokens
    const token = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = await generateRefreshToken(user.id);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const token = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = await generateRefreshToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/magic-link
router.post('/magic-link', async (req, res, next) => {
  try {
    const data = magicLinkSchema.parse(req.body);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      // Create user without password for magic link auth
      user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          name: data.email.split('@')[0], // Use email prefix as name
        },
      });
    }

    // Generate and send magic link
    const token = await generateMagicLink(user.id);
    await sendMagicLinkEmail(user.email, token);

    res.json({ message: 'Magic link sent to your email' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/verify
router.post('/verify', async (req, res, next) => {
  try {
    const data = verifyTokenSchema.parse(req.body);

    // Verify magic link
    const { userId } = await verifyMagicLink(data.token);

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate tokens
    const token = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = await generateRefreshToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Magic link')) {
      next(new BadRequestError(error.message));
      return;
    }
    next(error);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const data = refreshTokenSchema.parse(req.body);

    // Verify refresh token
    const { userId } = await verifyRefreshToken(data.refreshToken);

    // Revoke old refresh token (rotation)
    await revokeRefreshToken(data.refreshToken);

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate new tokens
    const token = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = await generateRefreshToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('token')) {
      next(new UnauthorizedError(error.message));
      return;
    }
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken;
    
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout-all
router.post('/logout-all', authenticate, async (req, res, next) => {
  try {
    await revokeAllUserRefreshTokens(req.user!.id);
    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    next(error);
  }
});

export default router;

