import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../db/client.js';
import { env } from '../config/env.js';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

interface AccessTokenPayload {
  userId: string;
  email: string;
}

interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface UserResponse {
  id: string;
  email: string;
  name: string | null;
}

interface AuthResult {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

async function generateRefreshToken(userId: string): Promise<string> {
  const tokenId = crypto.randomUUID();
  const token = jwt.sign(
    { userId, tokenId } satisfies RefreshTokenPayload,
    env.JWT_REFRESH_SECRET,
    { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` },
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

async function generateTokens(user: { id: string; email: string }): Promise<AuthTokens> {
  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = await generateRefreshToken(user.id);
  return { accessToken, refreshToken };
}

export async function register(
  email: string,
  password: string,
  name: string,
): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError('A user with this email already exists');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
    },
  });

  const tokens = await generateTokens(user);

  return {
    user: { id: user.id, email: user.email, name: user.name },
    ...tokens,
  };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const tokens = await generateTokens(user);

  return {
    user: { id: user.id, email: user.email, name: user.name },
    ...tokens,
  };
}

export async function refreshAccessToken(
  refreshTokenValue: string,
): Promise<AuthResult> {
  let payload: RefreshTokenPayload;
  try {
    payload = jwt.verify(refreshTokenValue, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { id: payload.tokenId },
  });

  if (!storedToken || storedToken.token !== refreshTokenValue) {
    // Possible token reuse detected -- revoke all tokens for the user
    if (storedToken) {
      await prisma.refreshToken.deleteMany({
        where: { userId: storedToken.userId },
      });
    }
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new UnauthorizedError('Refresh token has expired');
  }

  // Rotate: delete old token, issue new pair
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  const tokens = await generateTokens(user);

  return {
    user: { id: user.id, email: user.email, name: user.name },
    ...tokens,
  };
}

export async function findOrCreateGoogleUser(profile: {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}): Promise<AuthResult> {
  let user = await prisma.user.findUnique({
    where: { googleId: profile.googleId },
  });

  if (!user) {
    // Check if a user with the same email exists (link accounts)
    const existingByEmail = await prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (existingByEmail) {
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl ?? existingByEmail.avatarUrl,
          name: existingByEmail.name ?? profile.name,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: profile.email,
          googleId: profile.googleId,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
        },
      });
    }
  }

  const tokens = await generateTokens(user);

  return {
    user: { id: user.id, email: user.email, name: user.name },
    ...tokens,
  };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function updateAccount(
  userId: string,
  data: { name?: string; email?: string },
): Promise<UserResponse> {
  if (data.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== userId) {
      throw new ConflictError('A user with this email already exists');
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
    },
  });

  return { id: user.id, email: user.email, name: user.name };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Cannot change password for this account');
  }

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });
}

export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
}

// ─── Password Reset ──────────────────────────────────────────────

const RESET_TOKEN_EXPIRY_HOURS = 1;

export async function requestPasswordReset(email: string): Promise<{ token: string } | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal if user exists — return null silently
    return null;
  }

  // Invalidate any existing tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  // In development, log the token (no email sending)
  if (env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[DEV] Password reset token for ${email}: ${token}`);
  }

  return { token };
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    throw new UnauthorizedError('Invalid or expired reset token');
  }

  if (resetToken.used) {
    throw new UnauthorizedError('This reset token has already been used');
  }

  if (resetToken.expiresAt < new Date()) {
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });
    throw new UnauthorizedError('This reset token has expired');
  }

  const newHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: newHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    }),
    // Revoke all refresh tokens for security
    prisma.refreshToken.deleteMany({
      where: { userId: resetToken.userId },
    }),
  ]);
}
