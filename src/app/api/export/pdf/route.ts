import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// jspdf 在 Next.js ESM 环境下需要使用 require
const { jsPDF } = require('jspdf');
const autoTableModule = require('jspdf-autotable');
const autoTable = autoTableModule.default || autoTableModule;

// 缓存中文字体（避免每次请求都读取 10MB 文件）
let fontBase64Cache: string | null = null;
const FONT_NAME = 'SimHei';

function getCJKFontBase64(): string | null {
  if (fontBase64Cache) return fontBase64Cache;

  // 按优先级查找系统中可用的中文字体（仅 TTF，不含 TTC）
  const fontCandidates = [
    'C:\\Windows\\Fonts\\simhei.ttf',   // 黑体
    'C:\\Windows\\Fonts\\Deng.ttf',     // 等线
    '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf', // Linux
    '/System/Library/Fonts/STHeiti Light.ttc',                   // macOS（TTC 不支持）
  ];

  for (const fontPath of fontCandidates) {
    try {
      if (fs.existsSync(fontPath) && fontPath.toLowerCase().endsWith('.ttf')) {
        console.log(`[PDF] Loading CJK font: ${fontPath}`);
        const data = fs.readFileSync(fontPath);
        fontBase64Cache = data.toString('base64');
        console.log(`[PDF] Font loaded, size: ${(data.length / 1024 / 1024).toFixed(1)} MB`);
        return fontBase64Cache;
      }
    } catch {
      // 尝试下一个
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || '';
    const testId = searchParams.get('testId') || '';

    const test = await prisma.testMaster.findUnique({
      where: { productid_testid: { productid: productId, testid: testId } },
    });

    if (!test) {
      return NextResponse.json({ error: '试验记录不存在' }, { status: 404 });
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // 尝试加载中文字体
    const fontBase64 = getCJKFontBase64();
    let useCJK = false;
    if (fontBase64) {
      doc.addFileToVFS('simhei.ttf', fontBase64);
      doc.addFont('simhei.ttf', FONT_NAME, 'normal');
      doc.setFont(FONT_NAME);
      useCJK = true;
      console.log('[PDF] CJK font registered successfully');
    } else {
      console.warn('[PDF] No CJK font found, Chinese text may display as garbled');
    }

    // 标题
    doc.setFontSize(16);
    doc.text('ISO 11820 建筑材料不燃性试验报告', 105, 15, { align: 'center' });

    // 基本信息表
    doc.setFontSize(11);
    const infoRows = [
      ['样品编号', test.productid],
      ['试验ID', test.testid],
      ['试验日期', new Date(test.testdate).toLocaleDateString('zh-CN')],
      ['环境温度', `${test.ambtemp} °C`],
      ['环境湿度', `${test.ambhumi} %`],
      ['操作员', test.operator],
      ['设备', test.apparatusname],
    ];
    autoTable(doc, {
      startY: 25,
      head: [['项目', '值']],
      body: infoRows,
      theme: 'grid',
      styles: { fontSize: 9, font: useCJK ? FONT_NAME : undefined },
      headStyles: { fillColor: [44, 62, 80], font: useCJK ? FONT_NAME : undefined },
    });

    // 试验结果
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const resultRows = [
      ['试验前质量', `${test.preweight} g`],
      ['试验后质量', `${test.postweight} g`],
      ['失重量', `${test.lostweight} g`],
      ['失重率', `${test.lostweightPer} %`],
      ['炉温1温升', `${test.deltatf1} °C`],
      ['炉温2温升', `${test.deltatf2} °C`],
      ['样品温升', `${test.deltatf} °C`],
      ['总试验时长', `${test.totaltesttime} 秒`],
    ];
    autoTable(doc, {
      startY: finalY,
      head: [['试验结果', '数值']],
      body: resultRows,
      theme: 'grid',
      styles: { fontSize: 9, font: useCJK ? FONT_NAME : undefined },
      headStyles: { fillColor: [44, 62, 80], font: useCJK ? FONT_NAME : undefined },
    });

    // 判定结论
    const deltaTf = test.deltatf;
    const lostPer = test.lostweightPer;
    const flameDuration = test.flameduration;
    const passed = deltaTf <= 50 && lostPer <= 50 && flameDuration < 5;

    const conclusionY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(13);
    doc.setTextColor(passed ? '#00c853' : '#e94560');
    doc.text(`判定结论：${passed ? '通过' : '不通过'}`, 105, conclusionY, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor('#666666');
    doc.text(`温升 ${deltaTf}°C ≤ 50°C | 失重率 ${lostPer}% ≤ 50% | 火焰持续时间 ${flameDuration}s < 5s`, 105, conclusionY + 8, { align: 'center' });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const filename = encodeURIComponent(`${testId}_报告.pdf`);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json({ error: `导出PDF失败: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
  }
}
