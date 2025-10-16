import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest, isAdmin } from '@/app/lib/auth';
import { encryptApiKey } from '@/app/lib/encryption';

interface RouteParams {
  params: {
    keyId: string;
  };
}

// 更新API密钥
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

    const { keyId } = params;
    const body = await request.json();

    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.baseUrl !== undefined) updateData.baseUrl = body.baseUrl;
    
    // 如果提供了新的API密钥，需要重新加密
    if (body.apiKey) {
      updateData.apiKey = encryptApiKey(body.apiKey);
    }

    const updatedKey = await prisma.apiKey.update({
      where: { id: keyId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      apiKey: updatedKey,
    });
  } catch (error) {
    console.error('Update API key error:', error);
    return NextResponse.json(
      { error: '更新API密钥失败' },
      { status: 500 }
    );
  }
}

// 删除API密钥
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

    const { keyId } = params;

    await prisma.apiKey.delete({
      where: { id: keyId },
    });

    return NextResponse.json({
      success: true,
      message: 'API密钥已删除',
    });
  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json(
      { error: '删除API密钥失败' },
      { status: 500 }
    );
  }
}

