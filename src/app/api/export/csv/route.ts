import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/** Prisma TemperatureData 模型映射类型（prisma generate 完成后可从 @prisma/client 导入） */
type TempRow = {
  timestamp: number;
  temp1: number;
  temp2: number;
  tempSurface: number;
  tempCenter: number;
  tempCal: number;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || '';
    const testId = searchParams.get('testId') || '';

    const data = await prisma.temperatureData.findMany({
      where: { productid: productId, testid: testId },
      orderBy: { timestamp: 'asc' },
    });

    const header = 'Time,Temp1,Temp2,TempSurface,TempCenter,TempCalibration\n';
    const rows = data.map((d: TempRow) =>
      `${d.timestamp},${d.temp1.toFixed(1)},${d.temp2.toFixed(1)},${d.tempSurface.toFixed(1)},${d.tempCenter.toFixed(1)},${d.tempCal.toFixed(1)}`
    ).join('\n');
    const csv = header + rows;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${productId}_${testId}_sensor_data.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: '导出CSV失败' }, { status: 500 });
  }
}
