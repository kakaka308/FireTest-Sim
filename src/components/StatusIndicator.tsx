'use client';

import { STATUS_LABELS } from '@/lib/constants';
import type { TestStatus } from '@/lib/types';
import { Wifi, WifiOff } from 'lucide-react';

interface StatusIndicatorProps {
  status: TestStatus;
  connected: boolean;
}

const statusClassMap: Record<TestStatus, string> = {
  Idle: 'status-idle',
  Preparing: 'status-preparing',
  Ready: 'status-ready',
  Recording: 'status-recording',
  Complete: 'status-complete',
  Cooling: 'status-cooling',
};

const statusDotMap: Record<TestStatus, string> = {
  Idle: 'bg-gray-500',
  Preparing: 'bg-blue-500 animate-pulse',
  Ready: 'bg-green-500',
  Recording: 'bg-red-500 animate-pulse',
  Complete: 'bg-yellow-500',
  Cooling: 'bg-cyan-500 animate-pulse',
};

export default function StatusIndicator({ status, connected }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${statusDotMap[status]}`} />
        <span className={`status-badge ${statusClassMap[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        {connected ? (
          <Wifi className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-red-500" />
        )}
        <span className={connected ? 'text-green-500' : 'text-red-500'}>
          {connected ? '已连接' : '未连接'}
        </span>
      </div>
    </div>
  );
}
