import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const operators = await prisma.operator.findMany({
      select: { username: true, usertype: true },
    });
    return NextResponse.json({ operators });
  } catch (error) {
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}
