'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import type { TestStatus, TemperaturePoint } from '@/lib/types';
import { CHANNEL_COLORS } from '@/lib/constants';
import { TrendingUp } from 'lucide-react';

interface TemperatureChartProps {
  history: TemperaturePoint[];
  status: TestStatus;
  temperatureDrift: number;
}

export default function TemperatureChart({ history, status, temperatureDrift }: TemperatureChartProps) {
  // 只显示最近 10 分钟（600秒）数据
  const chartData = useMemo(() => {
    if (history.length === 0) return [];
    const maxTime = history[history.length - 1].time;
    const minTime = Math.max(0, maxTime - 600);
    return history
      .filter(p => p.time >= minTime)
      .map(p => ({
        time: p.time,
        炉温1: +p.tf1.toFixed(1),
        炉温2: +p.tf2.toFixed(1),
        表面温: +p.ts.toFixed(1),
        中心温: +p.tc.toFixed(1),
      }));
  }, [history]);

  return (
    <div className="panel h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-gray-300">温度曲线</span>
          {status === 'Recording' && (
            <span className="text-xs text-gray-500">（最近10分钟）</span>
          )}
        </div>
        <div className="text-xs text-gray-500">
          温漂: <span className={Math.abs(temperatureDrift) <= 2 ? 'text-green-400' : 'text-yellow-400'}>
            {temperatureDrift.toFixed(2)} °C/10min
          </span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-600 text-sm">
          等待数据...
        </div>
      ) : (
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3a" />
              <XAxis
                dataKey="time"
                stroke="#4a4a6a"
                fontSize={11}
                tickFormatter={(t) => `${t}s`}
                domain={['dataMin', 'dataMax']}
              />
              <YAxis
                stroke="#4a4a6a"
                fontSize={11}
                domain={[0, 800]}
                tickFormatter={(v) => `${v}°C`}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1a2e',
                  border: '1px solid #2a2a4a',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelFormatter={(t) => `时间: ${t}s`}
                formatter={(value: number, name: string) => [`${value.toFixed(1)}°C`, name]}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', color: '#a0a0b0' }}
              />
              <ReferenceLine y={750} stroke="#ff4757" strokeDasharray="5 5" strokeOpacity={0.4} />
              <Line type="monotone" dataKey="炉温1" stroke={CHANNEL_COLORS.tf1} dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="炉温2" stroke={CHANNEL_COLORS.tf2} dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="表面温" stroke={CHANNEL_COLORS.ts} dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="中心温" stroke={CHANNEL_COLORS.tc} dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {history.length > 0 && (
        <div className="text-xs text-gray-600 mt-1">
          数据点: {history.length} | 记录时间: {history[history.length - 1].time}s
        </div>
      )}
    </div>
  );
}
