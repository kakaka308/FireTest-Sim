'use client';

import { useState, useEffect } from 'react';
import { Save, Thermometer, History } from 'lucide-react';
import type { SensorReading } from '@/lib/types';

interface CalibrationPanelProps {
  readings: SensorReading;
  operator: string;
}

interface CalRecord {
  guid: string;
  calibrationDate: string;
  calibrationType: string;
  operator: string;
  temperatureData: string;
  passedCriteria: number;
  remarks: string;
  createdAt: string;
}

export default function CalibrationPanel({ readings, operator }: CalibrationPanelProps) {
  const [records, setRecords] = useState<CalRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [tempPoints, setTempPoints] = useState<string[]>([]);
  const [remarks, setRemarks] = useState('');
  const [calType, setCalType] = useState('Surface');

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/calibration');
      const data = await res.json();
      setRecords(data.records || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleRecordPoint = () => {
    const point = `${readings.tcal.toFixed(1)}°C`;
    setTempPoints(prev => [...prev, point]);
  };

  const handleSave = async () => {
    if (tempPoints.length === 0) return;
    setSaving(true);
    try {
      await fetch('/api/calibration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calibrationType: calType,
          apparatusId: 0,
          operator,
          temperatureData: tempPoints,
          uniformityResult: null,
          passedCriteria: true,
          remarks,
        }),
      });
      setTempPoints([]);
      setRemarks('');
      fetchRecords();
    } catch (e) {
      console.error('Calibration save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 校准数据采集 */}
      <div className="panel space-y-4">
        <div className="flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-orange-400" />
          <h2 className="text-lg font-bold text-white">设备校准</h2>
        </div>

        {/* 校准温度实时显示 */}
        <div className="bg-[#0a0a15] rounded-lg p-4 text-center border border-[#1a1a3a]">
          <div className="text-xs text-gray-500 mb-2">当前校准通道温度 (TCal)</div>
          <div className="led-display text-3xl inline-block" style={{ color: '#ffa502' }}>
            {readings.tcal.toFixed(1)}°C
          </div>
        </div>

        {/* 校准类型选择 */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">校准类型</label>
          <div className="flex gap-3">
            {['Surface', 'Center'].map(t => (
              <button
                key={t}
                onClick={() => setCalType(t)}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${
                  calType === t
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-700 text-gray-500 hover:border-gray-500'
                }`}
              >
                {t === 'Surface' ? '表面校准' : '中心校准'}
              </button>
            ))}
          </div>
        </div>

        {/* 记录温度点 */}
        <button
          onClick={handleRecordPoint}
          className="btn btn-primary w-full justify-center"
        >
          记录当前温度点
        </button>

        {/* 已记录的温度点 */}
        {tempPoints.length > 0 && (
          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              已记录 {tempPoints.length} 个温度点
            </label>
            <div className="bg-[#0a0a15] rounded-lg p-3 border border-[#1a1a3a] max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {tempPoints.map((p, i) => (
                  <span key={i} className="text-xs bg-[#1a1a3a] px-2 py-1 rounded text-gray-300 font-mono">
                    #{i + 1}: {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 备注 */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">备注</label>
          <textarea
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            className="input-field h-20 resize-none"
            placeholder="校准备注..."
          />
        </div>

        {/* 保存 */}
        <button
          onClick={handleSave}
          disabled={tempPoints.length === 0 || saving}
          className="btn btn-success w-full justify-center"
        >
          <Save className="w-4 h-4" />
          {saving ? '保存中...' : '保存校准记录'}
        </button>
      </div>

      {/* 历史校准记录 */}
      <div className="panel space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">校准历史</h2>
          <span className="text-xs text-gray-500 ml-auto">{records.length} 条记录</span>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {records.length === 0 ? (
            <div className="text-center text-gray-600 py-8">暂无校准记录</div>
          ) : (
            records.map((r) => (
              <div key={r.guid} className="bg-[#0a0a15] rounded-lg p-3 border border-[#1a1a3a] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">{r.calibrationDate}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${r.passedCriteria ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {r.passedCriteria ? '通过' : '未通过'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">类型:</span>
                  <span className="text-gray-300">{r.calibrationType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">操作员:</span>
                  <span className="text-gray-300">{r.operator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">温度点:</span>
                  <span className="text-gray-300">{r.temperatureData?.length || 0} 个</span>
                </div>
                {r.remarks && (
                  <div className="text-gray-500 mt-1">{r.remarks}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
