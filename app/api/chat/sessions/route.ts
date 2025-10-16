import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest } from '@/app/lib/auth';

// 获取用户的所有会话
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 只返回当前用户的会话（数据隔离）
    const sessions = await prisma.chatSession.findMany({
      where: {
        userId: user.userId,
      },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        lastUpdate: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: '获取会话列表失败' },
      { status: 500 }
    );
  }
}

// 创建新会话
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const session = await prisma.chatSession.create({
      data: {
        userId: user.userId,
        topic: body.topic || 'New Chat',
        memoryPrompt: body.memoryPrompt || '',
        maskConfig: JSON.stringify(body.mask || {}),
      },
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: '创建会话失败' },
      { status: 500 }
    );
  }
}

