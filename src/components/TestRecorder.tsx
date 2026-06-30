'use client';

import { useState } from 'react';
import { X, ClipboardCheck, AlertTriangle } from 'lucide-react';
import type { TemperaturePoint } from '@/lib/types';

interface TestRecorderProps {
  productId: string;
  testId: string;
  preweight: number;
  ambtemp: number;
  history: TemperaturePoint[];
  onClose: () => void;
  onSaved: (record: {
    postweight: number;
    flametime: number;
    flameduration: number;
    hasFlame: boolean;
    memo: string;
  }) => void;
}

export default function TestRecorder({
  productId, testId, preweight, ambtemp, history,
  onClose, onSaved,
}: TestRecorderProps) {
  const [postweight, setPostweight] = useState(preweight);
  const [hasFlame, setHasFlame] = useState(false);
  const [flametime, setFlametime] = useState(0);
  const [flameduration, setFlameduration] = useState(0);
  const [memo, setMemo] = useState('');

  // 计算预估值
  const lostweight = preweight - postweight;
  const lostweightPer = preweight > 0 ? (lostweight / preweight) * 100 : 0;
  const finalts = history.length > 0 ? history[history.length - 1].ts : 0;
  const deltatf = finalts - ambtemp;

  const handleSave = () => {
    if (!postweight && postweight !== 0) return;
    onSaved({
      postweight,
      flametime,
      flameduration,
      hasFlame,
      memo,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a4a]">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-bold text-white">试验现象记录</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 基本信息 */}
          <div className="bg-[#0a0a15] rounded-lg p-3 border border-[#1a1a3a] text-xs space-y-1">
            <div className="flex justify-between"><span className="text-gray-500">样品编号:</span><span className="text-gray-300">{productId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">试验ID:</span><span className="text-gray-300">{testId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">试验前质量:</span><span className="text-gray-300">{preweight} g</span></div>
            <div className="flex justify-between"><span className="text-gray-500">记录样本数:</span><span className="text-gray-300">{history.length}</span></div>
          </div>

          {/* 是否出现火焰 */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasFlame}
                onChange={e => setHasFlame(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-transparent accent-red-500"
              />
              <span className="text-sm text-gray-300">是否出现持续火焰</span>
            </label>
            {hasFlame && (
              <div className="grid grid-cols-2 gap-3 mt-3 ml-6">
                <div>
                  <label>火焰发生时刻 (秒)</label>
                  <input
                    type="number"
                    value={flametime}
                    onChange={e => setFlametime(+e.target.value)}
                    className="input-field"
                    min={0}
                  />
                </div>
                <div>
                  <label>火焰持续时间 (秒)</label>
                  <input
                    type="number"
                    value={flameduration}
                    onChange={e => setFlameduration(+e.target.value)}
                    className="input-field"
                    min={0}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 试验后质量 */}
          <div>
            <label className="text-sm text-gray-300">试验后质量 (g) *</label>
            <input
              type="number"
              value={postweight}
              onChange={e => setPostweight(+e.target.value)}
              className="input-field mt-1"
              step="0.1"
              min={0}
            />
          </div>

          {/* 备注 */}
          <div>
            <label className="text-sm text-gray-300">备注</label>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              className="input-field mt-1 h-20 resize-none"
              placeholder="可选备注..."
            />
          </div>

          {/* 自动计算结果 */}
          <div className="bg-[#0a0a15] rounded-lg p-3 border border-[#1a1a3a] space-y-2 text-sm">
            <h4 className="text-xs font-medium text-gray-400 mb-2">自动计算结果</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-500">失重量: </span>
                <span className="text-gray-300">{lostweight.toFixed(2)} g</span>
              </div>
              <div>
                <span className="text-gray-500">失重率: </span>
                <span className={lostweightPer > 50 ? 'text-red-400' : 'text-green-400'}>
                  {lostweightPer.toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="text-gray-500">样品温升: </span>
                <span className={deltatf > 50 ? 'text-red-400' : 'text-green-400'}>
                  {deltatf.toFixed(2)}°C
                </span>
              </div>
              <div>
                <span className="text-gray-500">记录时长: </span>
                <span className="text-gray-300">{history.length}s</span>
              </div>
            </div>

            {/* 判定提示 */}
            <div className={`flex items-center gap-2 text-xs p-2 rounded ${
              lostweightPer <= 50 && deltatf <= 50 && flameduration < 5
                ? 'bg-green-500/10 text-green-400'
                : 'bg-yellow-500/10 text-yellow-400'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" />
              {lostweightPer <= 50 && deltatf <= 50 && flameduration < 5
                ? '预估判定：通过'
                : '预估判定：不通过'}
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="btn btn-outline">取消</button>
            <button onClick={handleSave} className="btn btn-success">
              保存试验记录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
