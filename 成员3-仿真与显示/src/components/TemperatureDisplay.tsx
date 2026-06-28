'use client';

import type { SensorReading, TestStatus } from '@/lib/types';
import { Thermometer, Timer } from 'lucide-react';

interface TemperatureDisplayProps {
  readings: SensorReading;
  elapsedSeconds: number;
  status: TestStatus;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function TempBox({ label, value, color, active }: {
  label: string; value: number; color: string; active: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-gray-500 mb-1">{label}</span>
      <div className={`led-display ${active ? 'recording' : ''}`} style={{ color, minWidth: '100px' }}>
        {value.toFixed(1)}°C
      </div>
    </div>
  );
}

export default function TemperatureDisplay({ readings, elapsedSeconds, status }: TemperatureDisplayProps) {
  const isRecording = status === 'Recording';

  return (
    <div className="panel space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Thermometer className="w-4 h-4 text-orange-400" />
        <span className="text-sm font-medium text-gray-300">实时温度</span>
      </div>

      {/* 主温度通道 */}
      <div className="grid grid-cols-2 gap-3">
        <TempBox label="炉温1" value={readings.tf1} color="#ff4757" active={isRecording} />
        <TempBox label="炉温2" value={readings.tf2} color="#ff6b81" active={isRecording} />
        <TempBox label="表面温" value={readings.ts} color="#2ed573" active={isRecording} />
        <TempBox label="中心温" value={readings.tc} color="#1e90ff" active={isRecording} />
      </div>

      {/* 校准温度 */}
      <div className="border-t border-[#2a2a4a] pt-3">
        <TempBox label="校准温 (TCal)" value={readings.tcal} color="#ffa502" active={false} />
      </div>

      {/* 计时器 */}
      <div className="border-t border-[#2a2a4a] pt-3">
        <div className="flex items-center gap-2 mb-2">
          <Timer className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-gray-300">记录计时</span>
          {isRecording && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
        </div>
        <div className={`led-display text-center text-2xl ${isRecording ? 'recording' : ''}`}
          style={{ color: isRecording ? '#00c853' : '#a0a0b0' }}>
          {formatTime(elapsedSeconds)}
        </div>
      </div>
    </div>
  );
}
