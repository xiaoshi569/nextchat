import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest } from '@/app/lib/auth';

// 添加消息到会话
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
    const { sessionId, role, content, model, tools, audioUrl, isMcpResponse } = body;

    // 验证会话所有权
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: user.userId,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: '会话不存在或无权访问' },
        { status: 404 }
      );
    }

    // 创建消息
    const message = await prisma.chatMessage.create({
      data: {
        sessionId,
        role,
        content: typeof content === 'string' ? content : JSON.stringify(content),
        model,
        date: new Date().toLocaleString(),
        tools: tools ? JSON.stringify(tools) : null,
        audioUrl,
        isMcpResponse: isMcpResponse || false,
      },
    });

    // 更新会话的最后更新时间
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { lastUpdate: new Date() },
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Create message error:', error);
    return NextResponse.json(
      { error: '添加消息失败' },
      { status: 500 }
    );
  }
}

