import jwt from 'jsonwebtoken';
import { User } from '@shared/schema';

// For development purposes, set default values if environment variables are not defined
if (!process.env.JWT_ACCESS_SECRET) {
  console.log("Setting default JWT_ACCESS_SECRET for development");
  process.env.JWT_ACCESS_SECRET = "webscanner_access_secret_key_development";
}

if (!process.env.JWT_REFRESH_SECRET) {
  console.log("Setting default JWT_REFRESH_SECRET for development");
  process.env.JWT_REFRESH_SECRET = "webscanner_refresh_secret_key_development";
}

console.log("Environment variables check:");
console.log(`JWT_ACCESS_SECRET: ${process.env.JWT_ACCESS_SECRET ? 'Set' : 'Not set'}`);
console.log(`JWT_REFRESH_SECRET: ${process.env.JWT_REFRESH_SECRET ? 'Set' : 'Not set'}`);

const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

type TokenPayload = {
  id: string;
  email: string;
  role: string;
  tier: string;
};

export function generateAccessToken(user: User): string {
  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    tier: user.tier
  };

  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: ACCESS_TOKEN_EXPIRY
  });
}

export function generateRefreshToken(user: User): string {
  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    tier: user.tier
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: REFRESH_TOKEN_EXPIRY
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid access token');
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

export function calculateTokenExpiry(expiresIn: string): Date {
  const units: Record<string, number> = {
    's': 1,
    'm': 60,
    'h': 60 * 60,
    'd': 24 * 60 * 60,
  };

  const match = expiresIn.match(/(\d+)([smhd])/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

  const value = parseInt(match[1]);
  const unit = match[2];
  
  const secondsToAdd = value * (units[unit] || 1);
  return new Date(Date.now() + secondsToAdd * 1000);
}
