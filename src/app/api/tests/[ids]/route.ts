import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { COMPLETED_FLAG } from '@/lib/constants';

// 获取试验详情
export async function GET(
  request: NextRequest,
  { params }: { params: { ids: string } }
) {
  try {
    // ids format: "productId-testId"
    const [productId, testId] = params.ids.split('--');
    if (!productId || !testId) {
      return NextResponse.json({ error: '参数格式错误' }, { status: 400 });
    }

    const test = await prisma.testMaster.findUnique({
      where: { productid_testid: { productid: productId, testid: testId } },
    });

    if (!test) {
      return NextResponse.json({ error: '试验记录不存在' }, { status: 404 });
    }

    return NextResponse.json({ test });
  } catch (error) {
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}

// 更新试验记录（保存现象信息和试验后质量）
export async function PUT(
  request: NextRequest,
  { params }: { params: { ids: string } }
) {
  try {
    const [productId, testId] = params.ids.split('--');
    if (!productId || !testId) {
      return NextResponse.json({ error: '参数格式错误' }, { status: 400 });
    }

    const body = await request.json();
    const {
      postweight, flametime, flameduration, hasFlame, memo,
      maxtf1, maxtf2, maxts, maxtc,
      maxtf1Time, maxtf2Time, maxtsTime, maxtcTime,
      finaltf1, finaltf2, finalts, finaltc,
      finaltf1Time, finaltf2Time, finaltsTime, finaltcTime,
      deltatf1, deltatf2, deltatf, deltats, deltatc,
      totaltesttime, ambtemp, preweight,
    } = body;

    const lostweight = (preweight || 0) - (postweight || 0);
    const lostweightPer = preweight > 0 ? (lostweight / preweight) * 100 : 0;

    const phenoItems: string[] = [];
    if (hasFlame) phenoItems.push('flame');
    const phenocode = phenoItems.join(',');

    await prisma.testMaster.update({
      where: { productid_testid: { productid: productId, testid: testId } },
      data: {
        postweight: postweight || 0,
        lostweight: lostweight,
        lostweightPer: lostweightPer,
        phenocode: phenocode,
        flametime: flametime || 0,
        flameduration: flameduration || 0,
        memo: memo || '',
        flag: COMPLETED_FLAG,
        totaltesttime: totaltesttime || 0,
        maxtf1: maxtf1 || 0,
        maxtf2: maxtf2 || 0,
        maxts: maxts || 0,
        maxtc: maxtc || 0,
        maxtf1Time: maxtf1Time || 0,
        maxtf2Time: maxtf2Time || 0,
        maxtsTime: maxtsTime || 0,
        maxtcTime: maxtcTime || 0,
        finaltf1: finaltf1 || 0,
        finaltf2: finaltf2 || 0,
        finalts: finalts || 0,
        finaltc: finaltc || 0,
        finaltf1Time: finaltf1Time || 0,
        finaltf2Time: finaltf2Time || 0,
        finaltsTime: finaltsTime || 0,
        finaltcTime: finaltcTime || 0,
        deltatf1: deltatf1 || 0,
        deltatf2: deltatf2 || 0,
        deltatf: deltatf || 0,
        deltats: deltats || 0,
        deltatc: deltatc || 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update test error:', error);
    return NextResponse.json({ error: '保存试验记录失败' }, { status: 500 });
  }
}
