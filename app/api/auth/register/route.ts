import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { hashPassword, generateToken } from '@/app/lib/auth';
import { z } from 'zod';

// 注册请求验证
const registerSchema = z.object({
  email: z.string().email('无效的邮箱地址'),
  username: z.string().min(3, '用户名至少3个字符').max(20, '用户名最多20个字符'),
  password: z.string().min(6, '密码至少6个字符'),
});

export async function POST(request: NextRequest) {
  try {
    // 检查是否允许注册
    const allowRegister = await prisma.systemConfig.findUnique({
      where: { key: 'ALLOW_REGISTER' },
    });

    if (allowRegister?.value === 'false') {
      return NextResponse.json(
        { error: '系统暂不开放注册' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // 验证输入
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, username, password } = validation.data;

    // 检查邮箱是否已存在
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    // 检查用户名是否已存在
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: '该用户名已被使用' },
        { status: 400 }
      );
    }

    // 创建用户
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'USER',
      },
    });

    // 创建用户设置
    await prisma.userSettings.create({
      data: {
        userId: user.id,
        config: JSON.stringify({}),
      },
    });

    // 生成Token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}

