'use client';

import type { TestStatus } from '@/lib/types';
import { Play, Square, CircleStop, FileText, Plus, Activity } from 'lucide-react';

interface ControlPanelProps {
  status: TestStatus;
  hasUnsavedTest: boolean;
  activeTest: {
    productId: string;
    testId: string;
    ambtemp: number;
    ambhumi: number;
    preweight: number;
    durationMode: 'standard' | 'custom';
    targetDuration: number;
  } | null;
  isStable: boolean;
  onCreateTest: () => void;
  onSaveRecord: () => void;
}

export default function ControlPanel({
  status,
  hasUnsavedTest,
  activeTest,
  isStable,
  onCreateTest,
  onSaveRecord,
}: ControlPanelProps) {
  const canCreateTest =
    (status === 'Idle' || status === 'Preparing') && !hasUnsavedTest;

  const canStartHeating = status === 'Idle' && activeTest !== null;

  const canStopHeating =
    status === 'Preparing' || status === 'Ready' || status === 'Complete';

  const canStartRecording = status === 'Ready';

  const canStopRecording = status === 'Recording';

  const canSaveRecord = status === 'Complete';

  const handleCommand = async (action: string) => {
    try {
      await fetch('/api/simulation/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
    } catch (e) {
      console.error('Command failed:', e);
    }
  };

  return (
    <div className="panel space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Activity className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium text-gray-300">操作控制</span>
      </div>

      {/* 当前活动试验信息 */}
      {activeTest && (
        <div className="bg-[#0a0a15] rounded-lg px-3 py-2 border border-[#1a1a3a] text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">样品:</span>
            <span className="text-gray-300">{activeTest.productId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">试验:</span>
            <span className="text-gray-300">{activeTest.testId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">模式:</span>
            <span className="text-gray-300">
              {activeTest.durationMode === 'standard' ? '标准60分钟' : `自定义 ${activeTest.targetDuration}s`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">样品质量:</span>
            <span className="text-gray-300">{activeTest.preweight}g</span>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="space-y-2">
        <button
          onClick={onCreateTest}
          disabled={!canCreateTest}
          className="btn btn-primary w-full justify-center"
          title={hasUnsavedTest ? '请先保存上一条试验记录' : '新建试验'}
        >
          <Plus className="w-4 h-4" />
          新建试验
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleCommand('startHeating')}
            disabled={!canStartHeating}
            className="btn btn-success w-full justify-center"
          >
            <Play className="w-4 h-4" />
            开始升温
          </button>
          <button
            onClick={() => handleCommand('stopHeating')}
            disabled={!canStopHeating}
            className="btn btn-outline w-full justify-center"
          >
            <CircleStop className="w-4 h-4" />
            停止升温
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleCommand('startRecording')}
            disabled={!canStartRecording}
            className="btn btn-success w-full justify-center"
          >
            <Play className="w-4 h-4" />
            开始记录
          </button>
          <button
            onClick={() => handleCommand('stopRecording')}
            disabled={!canStopRecording}
            className="btn btn-danger w-full justify-center"
          >
            <Square className="w-4 h-4" />
            停止记录
          </button>
        </div>

        <button
          onClick={onSaveRecord}
          disabled={!canSaveRecord}
          className="btn btn-primary w-full justify-center"
        >
          <FileText className="w-4 h-4" />
          试验记录
        </button>
      </div>

      {/* 保护提示 */}
      {hasUnsavedTest && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-xs text-yellow-400">
          有未保存的试验记录，请先保存后再新建试验
        </div>
      )}

      {status === 'Ready' && isStable && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-xs text-green-400">
          温度已稳定，可以开始记录
        </div>
      )}

      {status === 'Cooling' && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-cyan-400">
          系统正在降温，请等待炉温降至安全温度...
        </div>
      )}
    </div>
  );
}
