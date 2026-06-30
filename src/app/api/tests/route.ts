import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 获取所有试验列表（支持查询参数）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || '2000-01-01';
    const to = searchParams.get('to') || '2099-12-31';
    const productId = searchParams.get('productId') || '';
    const operator = searchParams.get('operator') || '';
    const listOperators = searchParams.get('listOperators') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // 返回操作员列表（用于筛选下拉）
    if (listOperators) {
      const raw = await prisma.testMaster.findMany({
        select: { operator: true },
        distinct: ['operator'],
        where: { operator: { not: '' } },
        orderBy: { operator: 'asc' },
      });
      const operators = raw.map(r => r.operator).filter(Boolean);
      return NextResponse.json({ operators });
    }

    const where: any = {
      testdate: {
        gte: new Date(from),
        lte: new Date(to + 'T23:59:59'),
      },
    };
    if (productId) {
      where.productid = { contains: productId };
    }
    if (operator) {
      where.operator = operator;
    }

    const [tests, total] = await Promise.all([
      prisma.testMaster.findMany({
        where,
        orderBy: { testdate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.testMaster.count({ where }),
    ]);

    return NextResponse.json({ tests, total, page, pageSize });
  } catch (error) {
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}

// 新建试验
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId, productName, specific, diameter, height,
      ambtemp, ambhumi, operator, preweight,
      durationMode, targetDuration,
    } = body;

    // 生成 testId：yyyyMMdd-HHmmss
    const now = new Date();
    const testId = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    // 获取设备信息
    const apparatus = await prisma.apparatus.findFirst({ where: { apparatusid: 0 } });
    if (!apparatus) {
      return NextResponse.json({ error: '设备未初始化' }, { status: 500 });
    }

    // 插入或更新样品信息
    await prisma.productMaster.upsert({
      where: { productid: productId },
      update: { productname: productName || '', specific: specific || '', diameter: diameter || 0, height: height || 0 },
      create: {
        productid: productId,
        productname: productName || '',
        specific: specific || '',
        diameter: diameter || 0,
        height: height || 0,
      },
    });

    // 创建试验记录
    await prisma.testMaster.create({
      data: {
        productid: productId,
        testid: testId,
        testdate: now,
        ambtemp: ambtemp || 25,
        ambhumi: ambhumi || 50,
        according: 'ISO 11820:2022',
        operator: operator || '',
        apparatusid: String(apparatus.apparatusid),
        apparatusname: apparatus.apparatusname,
        apparatuschkdate: apparatus.checkdatet,
        rptno: productId,
        preweight: preweight || 0,
        postweight: 0,
        lostweight: 0,
        lostweightPer: 0,
        phenocode: '',
        flametime: 0,
        flameduration: 0,
      },
    });

    return NextResponse.json({
      success: true,
      productId,
      testId,
      testDate: now.toISOString(),
    });
  } catch (error) {
    console.error('Create test error:', error);
    return NextResponse.json({ error: '创建试验失败' }, { status: 500 });
  }
}
