import { NextRequest } from 'next/server';
import { simulationEngine } from '@/lib/simulation-engine';
import type { SimulationBroadcast } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: SimulationBroadcast) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // 客户端已断开
        }
      };

      // 发送初始状态
      send({
        status: simulationEngine.getStatus(),
        readings: simulationEngine.getReadings(),
        elapsedSeconds: 0,
        totalSeconds: 0,
        isStable: false,
        temperatureDrift: 0,
        messages: [],
        currentProductId: '',
        currentTestId: '',
      });

      // 注册更新回调
      const unsubscribe = simulationEngine.onUpdate(send);

      // 客户端断开时清理
      request.signal.addEventListener('abort', () => {
        isClosed = true;
        unsubscribe();
        try { controller.close(); } catch { /* noop */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
