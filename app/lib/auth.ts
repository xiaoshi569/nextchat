// 用户认证工具函数
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-please-change-in-production'
);

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN';
}

// 密码哈希
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// 验证密码
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// 生成JWT Token
export async function generateToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7天过期
    .sign(JWT_SECRET);
}

// 验证JWT Token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// 从请求中获取用户信息
export async function getUserFromRequest(
  request: NextRequest
): Promise<JWTPayload | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    // 尝试从cookie中获取
    const cookieToken = request.cookies.get('auth-token')?.value;
    if (!cookieToken) return null;
    return verifyToken(cookieToken);
  }

  return verifyToken(token);
}

// 检查是否为管理员
export function isAdmin(user: JWTPayload | null): boolean {
  return user?.role === 'ADMIN';
}

