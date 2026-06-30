import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 获取温度时序数据
export async function GET(
  request: NextRequest,
  { params }: { params: { ids: string } }
) {
  try {
    const [productId, testId] = params.ids.split('--');
    if (!productId || !testId) {
      return NextResponse.json({ error: '参数格式错误' }, { status: 400 });
    }

    const data = await prisma.temperatureData.findMany({
      where: { productid: productId, testid: testId },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}

// 批量写入温度数据
export async function POST(
  request: NextRequest,
  { params }: { params: { ids: string } }
) {
  try {
    const [productId, testId] = params.ids.split('--');
    if (!productId || !testId) {
      return NextResponse.json({ error: '参数格式错误' }, { status: 400 });
    }

    const body = await request.json();
    const { records } = body; // { timestamp, temp1, temp2, tempsurface, tempcenter, tempcal }[]

    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ error: '无效的数据格式' }, { status: 400 });
    }

    // 批量插入
    await prisma.temperatureData.createMany({
      data: records.map((r: any) => ({
        productid: productId,
        testid: testId,
        timestamp: r.timestamp,
        temp1: r.temp1,
        temp2: r.temp2,
        tempSurface: r.tempsurface,
        tempCenter: r.tempcenter,
        tempCal: r.tempcal,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, count: records.length });
  } catch (error) {
    console.error('Save temperature data error:', error);
    return NextResponse.json({ error: '保存温度数据失败' }, { status: 500 });
  }
}
