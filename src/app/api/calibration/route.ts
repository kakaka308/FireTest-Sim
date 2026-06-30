import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const records = await prisma.calibrationRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ records });
  } catch (error) {
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const record = await prisma.calibrationRecord.create({
      data: {
        guid: uuidv4(),
        calibrationDate: body.calibrationDate || new Date().toISOString(),
        calibrationType: body.calibrationType || 'Surface',
        apparatusId: body.apparatusId || 0,
        operator: body.operator || '',
        temperatureData: JSON.stringify(body.temperatureData || []),
        uniformityResult: body.uniformityResult || null,
        maxDeviation: body.maxDeviation || null,
        averageTemperature: body.averageTemperature || null,
        passedCriteria: body.passedCriteria ? 1 : 0,
        remarks: body.remarks || '',
        createdAt: new Date().toISOString(),
      },
    });
    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('Calibration save error:', error);
    return NextResponse.json({ error: '保存校准记录失败' }, { status: 500 });
  }
}
