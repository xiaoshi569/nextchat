import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest } from '@/app/lib/auth';

interface RouteParams {
  params: {
    sessionId: string;
  };
}

// 获取单个会话详情（包含消息）
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const { sessionId } = params;

    // 验证会话所有权（数据隔离）
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: user.userId, // 确保只能访问自己的会话
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: '会话不存在或无权访问' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: '获取会话失败' },
      { status: 500 }
    );
  }
}

// 更新会话
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const { sessionId } = params;
    const body = await request.json();

    // 验证会话所有权
    const existingSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: user.userId,
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: '会话不存在或无权访问' },
        { status: 404 }
      );
    }

    // 更新会话
    const updateData: any = {
      lastUpdate: new Date(),
    };

    if (body.topic !== undefined) updateData.topic = body.topic;
    if (body.memoryPrompt !== undefined) updateData.memoryPrompt = body.memoryPrompt;
    if (body.lastSummarizeIndex !== undefined) updateData.lastSummarizeIndex = body.lastSummarizeIndex;
    if (body.clearContextIndex !== undefined) updateData.clearContextIndex = body.clearContextIndex;
    if (body.maskConfig !== undefined) updateData.maskConfig = JSON.stringify(body.maskConfig);
    if (body.stat) {
      updateData.tokenCount = body.stat.tokenCount;
      updateData.wordCount = body.stat.wordCount;
      updateData.charCount = body.stat.charCount;
    }

    const updatedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });
  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json(
      { error: '更新会话失败' },
      { status: 500 }
    );
  }
}

// 删除会话
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const { sessionId } = params;

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

    // 删除会话（会级联删除所有消息）
    await prisma.chatSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({
      success: true,
      message: '会话已删除',
    });
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json(
      { error: '删除会话失败' },
      { status: 500 }
    );
  }
}

