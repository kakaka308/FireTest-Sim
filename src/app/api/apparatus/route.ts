import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const apparatus = await prisma.apparatus.findFirst({ where: { apparatusid: 0 } });
    if (!apparatus) {
      return NextResponse.json({ error: '设备未初始化' }, { status: 404 });
    }
    return NextResponse.json({ apparatus });
  } catch (error) {
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    await prisma.apparatus.update({
      where: { apparatusid: 0 },
      data: {
        constpower: body.constpower,
        checkdatef: body.checkdatef ? new Date(body.checkdatef) : undefined,
        checkdatet: body.checkdatet ? new Date(body.checkdatet) : undefined,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
