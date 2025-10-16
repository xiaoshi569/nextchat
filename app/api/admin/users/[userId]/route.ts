import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest, isAdmin } from '@/app/lib/auth';

interface RouteParams {
  params: {
    userId: string;
  };
}

// 更新用户状态（启用/禁用）
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getUserFromRequest(request);

    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    const { userId } = params;
    const body = await request.json();

    // 不能禁用自己
    if (userId === user.userId) {
      return NextResponse.json(
        { error: '不能禁用自己的账号' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: body.isActive,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: '更新用户失败' },
      { status: 500 }
    );
  }
}

// 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getUserFromRequest(request);

    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    const { userId } = params;

    // 不能删除自己
    if (userId === user.userId) {
      return NextResponse.json(
        { error: '不能删除自己的账号' },
        { status: 400 }
      );
    }

    // 删除用户（级联删除相关数据）
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: '用户已删除',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: '删除用户失败' },
      { status: 500 }
    );
  }
}

