import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || '';

    const where: any = {};
    if (keyword) {
      where.OR = [
        { productid: { contains: keyword } },
        { productname: { contains: keyword } },
      ];
    }

    const products = await prisma.productMaster.findMany({
      where,
      orderBy: { productid: 'desc' },
      take: 50,
    });

    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}
