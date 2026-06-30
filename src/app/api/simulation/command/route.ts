import { NextRequest, NextResponse } from 'next/server';
import { simulationEngine } from '@/lib/simulation-engine';

// 仿真控制命令
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'init': {
        // 初始化仿真引擎
        const { productId, testId, ambtemp, durationMode, targetDuration } = params;
        if (!productId || !testId) {
          return NextResponse.json({ error: '缺少产品ID或试验ID' }, { status: 400 });
        }
        simulationEngine.init(productId, testId, ambtemp || 25, durationMode || 'standard', targetDuration);
        return NextResponse.json({ success: true });
      }

      case 'startHeating': {
        const ok = simulationEngine.startHeating();
        if (!ok) return NextResponse.json({ error: '当前状态不允许升温' }, { status: 400 });
        return NextResponse.json({ success: true });
      }

      case 'stopHeating': {
        const ok = simulationEngine.stopHeating();
        if (!ok) return NextResponse.json({ error: '当前状态不允许停止升温' }, { status: 400 });
        return NextResponse.json({ success: true });
      }

      case 'startRecording': {
        const result = simulationEngine.startRecording();
        if (!result) return NextResponse.json({ error: '当前状态不允许开始记录' }, { status: 400 });
        return NextResponse.json({ success: true, constPower: (result as { constPower: number }).constPower });
      }

      case 'stopRecording': {
        const ok = simulationEngine.stopRecording();
        if (!ok) return NextResponse.json({ error: '当前状态不允许停止记录' }, { status: 400 });
        return NextResponse.json({ success: true });
      }

      case 'completeToPreparing': {
        simulationEngine.completeToPreparing();
        return NextResponse.json({ success: true });
      }

      case 'reset': {
        simulationEngine.reset();
        return NextResponse.json({ success: true });
      }

      case 'getState': {
        return NextResponse.json({ state: simulationEngine.getState() });
      }

      default:
        return NextResponse.json({ error: `未知操作: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Simulation command error:', error);
    return NextResponse.json({ error: '命令执行失败' }, { status: 500 });
  }
}
