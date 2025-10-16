import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest, isAdmin } from '@/app/lib/auth';
import { encryptApiKey, decryptApiKey } from '@/app/lib/encryption';
import { z } from 'zod';

// API密钥验证
const apiKeySchema = z.object({
  provider: z.string().min(1, '请选择提供商'),
  name: z.string().min(1, '请输入密钥名称'),
  apiKey: z.string().min(1, 'API密钥不能为空'),
  baseUrl: z.string().optional(),
  priority: z.number().int().min(0).default(0),
});

// 获取所有API密钥
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    const apiKeys = await prisma.apiKey.findMany({
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // 返回时解密API密钥（仅显示部分）
    const maskedKeys = apiKeys.map(key => ({
      ...key,
      apiKey: maskApiKey(key.apiKey),
    }));

    return NextResponse.json({
      success: true,
      apiKeys: maskedKeys,
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    return NextResponse.json(
      { error: '获取API密钥失败' },
      { status: 500 }
    );
  }
}

// 添加新API密钥
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = apiKeySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { provider, name, apiKey, baseUrl, priority } = validation.data;

    // 加密API密钥
    const encryptedKey = encryptApiKey(apiKey);

    // 创建API密钥记录
    const newApiKey = await prisma.apiKey.create({
      data: {
        provider,
        name,
        apiKey: encryptedKey,
        baseUrl,
        priority,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      apiKey: {
        ...newApiKey,
        apiKey: maskApiKey(encryptedKey),
      },
    });
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json(
      { error: '添加API密钥失败' },
      { status: 500 }
    );
  }
}

// 工具函数：掩码API密钥
function maskApiKey(encryptedKey: string): string {
  try {
    const decrypted = decryptApiKey(encryptedKey);
    if (decrypted.length <= 8) return '***';
    return `${decrypted.substring(0, 4)}...${decrypted.substring(decrypted.length - 4)}`;
  } catch {
    return '***';
  }
}

