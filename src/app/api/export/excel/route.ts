import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// exceljs 是 CJS 模块，在 ESM 环境下需要特殊处理
const ExcelJS = require('exceljs');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || '';
    const testId = searchParams.get('testId') || '';

    const test = await prisma.testMaster.findUnique({
      where: { productid_testid: { productid: productId, testid: testId } },
    });

    const tempData = await prisma.temperatureData.findMany({
      where: { productid: productId, testid: testId },
      orderBy: { timestamp: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ISO 11820 System';

    // Sheet1: 试验信息
    const sheet1 = workbook.addWorksheet('试验信息');
    sheet1.columns = [
      { header: '项目', key: 'key', width: 22 },
      { header: '值', key: 'value', width: 35 },
    ];
    // 标题行样式
    sheet1.getRow(1).font = { bold: true, size: 11 };
    if (test) {
      const rows = [
        ['样品编号', test.productid],
        ['试验ID', test.testid],
        ['试验日期', new Date(test.testdate).toLocaleDateString('zh-CN')],
        ['环境温度(°C)', test.ambtemp],
        ['环境湿度(%)', test.ambhumi],
        ['依据标准', test.according],
        ['操作员', test.operator],
        ['设备名称', test.apparatusname],
        ['设备编号', test.apparatusid],
        ['试验前质量(g)', test.preweight],
        ['试验后质量(g)', test.postweight],
        ['失重量(g)', test.lostweight],
        ['失重率(%)', test.lostweightPer],
        ['总时长(秒)', test.totaltesttime],
        ['恒功率', test.constpower],
        ['火焰开始时刻(秒)', test.flametime],
        ['火焰持续时间(秒)', test.flameduration],
        ['炉温1温升(°C)', test.deltatf1],
        ['炉温2温升(°C)', test.deltatf2],
        ['样品温升(°C)', test.deltatf],
        ['表面温升(°C)', test.deltats],
        ['中心温升(°C)', test.deltatc],
        ['备注', test.memo || ''],
      ] as [string, unknown][];
      rows.forEach(([k, v]) => sheet1.addRow({ key: k, value: v !== null && v !== undefined ? String(v) : '' }));
    }

    // Sheet2: 温度数据
    const sheet2 = workbook.addWorksheet('温度数据');
    sheet2.columns = [
      { header: '时间(秒)', key: 'time', width: 14 },
      { header: '炉温1(°C)', key: 'tf1', width: 15 },
      { header: '炉温2(°C)', key: 'tf2', width: 15 },
      { header: '表面温(°C)', key: 'ts', width: 15 },
      { header: '中心温(°C)', key: 'tc', width: 15 },
      { header: '校准温(°C)', key: 'tcal', width: 15 },
    ];
    sheet2.getRow(1).font = { bold: true };
    tempData.forEach((d) => {
      sheet2.addRow({
        time: d.timestamp,
        tf1: +d.temp1.toFixed(1),
        tf2: +d.temp2.toFixed(1),
        ts: +d.tempSurface.toFixed(1),
        tc: +d.tempCenter.toFixed(1),
        tcal: +d.tempCal.toFixed(1),
      });
    });

    // Sheet3: 判定结论
    if (test) {
      const sheet3 = workbook.addWorksheet('判定结论');
      sheet3.columns = [
        { header: '判定项', key: 'item', width: 22 },
        { header: '实测值', key: 'value', width: 18 },
        { header: '标准要求', key: 'standard', width: 18 },
        { header: '结论', key: 'result', width: 12 },
      ];
      sheet3.getRow(1).font = { bold: true };

      const deltaTf = test.deltatf || 0;
      const lostPer = test.lostweightPer || 0;
      const flameDuration = test.flameduration || 0;

      const judgeRows = [
        { item: '样品表面温升', value: `${deltaTf.toFixed(2)} °C`, standard: '≤ 50 °C', result: deltaTf <= 50 ? '通过' : '不通过' },
        { item: '失重率', value: `${lostPer.toFixed(2)} %`, standard: '≤ 50 %', result: lostPer <= 50 ? '通过' : '不通过' },
        { item: '火焰持续时间', value: `${flameDuration} 秒`, standard: '< 5 秒', result: flameDuration < 5 ? '通过' : '不通过' },
      ];
      judgeRows.forEach((r) => {
        const row = sheet3.addRow(r);
        if (r.result === '不通过') {
          row.getCell(4).font = { color: { argb: 'FFFF0000' }, bold: true };
        } else {
          row.getCell(4).font = { color: { argb: 'FF00C853' }, bold: true };
        }
      });

      // 综合判定
      const passed = deltaTf <= 50 && lostPer <= 50 && flameDuration < 5;
      sheet3.addRow({});
      const conclusionRow = sheet3.addRow({
        item: '综合判定',
        value: '',
        standard: '',
        result: passed ? '通过' : '不通过',
      });
      conclusionRow.getCell(4).font = {
        color: { argb: passed ? 'FF00C853' : 'FFFF0000' },
        bold: true,
        size: 14,
      };
      conclusionRow.getCell(1).font = { bold: true, size: 12 };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = encodeURIComponent(`${testId}_报告.xlsx`);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
      },
    });
  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json({ error: `导出Excel失败: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
  }
}
