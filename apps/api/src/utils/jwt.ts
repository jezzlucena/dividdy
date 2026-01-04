import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import { prisma } from '../lib/prisma.js';

interface TokenPayload {
  userId: string;
  email: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
  return jwt.sign(payload, secret, { expiresIn });
}

export async function generateRefreshToken(userId: string): Promise<string> {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET not configured');
  }

  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const token = jwt.sign({ userId, jti: uuidv4() }, secret, { expiresIn });

  // Calculate expiry date
  const decoded = jwt.decode(token) as { exp: number };
  const expiresAt = new Date(decoded.exp * 1000);

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string }> {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET not configured');
  }

  // Verify JWT signature and expiry
  const decoded = jwt.verify(token, secret) as { userId: string };

  // Check if token exists in database and is not revoked
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!storedToken) {
    throw new Error('Refresh token not found');
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { token } });
    throw new Error('Refresh token expired');
  }

  return { userId: decoded.userId };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { token },
  });
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

export async function generateMagicLink(userId: string): Promise<string> {
  const secret = process.env.MAGIC_LINK_SECRET;
  if (!secret) {
    throw new Error('MAGIC_LINK_SECRET not configured');
  }

  const expiresIn = process.env.MAGIC_LINK_EXPIRES_IN || '15m';
  const token = jwt.sign({ userId, type: 'magic_link', jti: uuidv4() }, secret, { expiresIn });

  // Calculate expiry date
  const decoded = jwt.decode(token) as { exp: number };
  const expiresAt = new Date(decoded.exp * 1000);

  // Store magic link in database
  await prisma.magicLink.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
}

export async function verifyMagicLink(token: string): Promise<{ userId: string }> {
  const secret = process.env.MAGIC_LINK_SECRET;
  if (!secret) {
    throw new Error('MAGIC_LINK_SECRET not configured');
  }

  // Verify JWT signature and expiry
  const decoded = jwt.verify(token, secret) as { userId: string; type: string };

  if (decoded.type !== 'magic_link') {
    throw new Error('Invalid token type');
  }

  // Check if token exists in database and hasn't been used
  const storedToken = await prisma.magicLink.findUnique({
    where: { token },
  });

  if (!storedToken) {
    throw new Error('Magic link not found');
  }

  if (storedToken.usedAt) {
    throw new Error('Magic link already used');
  }

  if (storedToken.expiresAt < new Date()) {
    throw new Error('Magic link expired');
  }

  // Mark token as used
  await prisma.magicLink.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  return { userId: decoded.userId };
}

