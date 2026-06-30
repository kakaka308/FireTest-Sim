'use client';

import { useState, useEffect } from 'react';
import { X, FlaskConical } from 'lucide-react';
import type { ApparatusInfo } from '@/lib/types';

interface TestCreatorProps {
  operator: string;
  onClose: () => void;
  onCreated: (data: {
    productId: string;
    productName: string;
    specific: string;
    diameter: number;
    height: number;
    ambtemp: number;
    ambhumi: number;
    operator: string;
    preweight: number;
    durationMode: 'standard' | 'custom';
    targetDuration?: number;
  }) => void;
}

export default function TestCreator({ operator, onClose, onCreated }: TestCreatorProps) {
  const [apparatus, setApparatus] = useState<ApparatusInfo | null>(null);
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [specific, setSpecific] = useState('');
  const [diameter, setDiameter] = useState(45);
  const [height, setHeight] = useState(50);
  const [ambtemp, setAmbtemp] = useState(25);
  const [ambhumi, setAmbhumi] = useState(50);
  const [preweight, setPreweight] = useState(100);
  const [durationMode, setDurationMode] = useState<'standard' | 'custom'>('standard');
  const [targetDuration, setTargetDuration] = useState(3600);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/apparatus')
      .then(r => r.json())
      .then(d => setApparatus(d.apparatus))
      .catch(() => {});
  }, []);

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!productId.trim()) errs.push('请输入样品编号');
    if (!productName.trim()) errs.push('请输入样品名称');
    if (!specific.trim()) errs.push('请输入规格型号');
    if (diameter <= 0) errs.push('直径必须大于0');
    if (height <= 0) errs.push('高度必须大于0');
    if (preweight <= 0) errs.push('试验前质量必须大于0');
    if (ambtemp < -50 || ambtemp > 100) errs.push('环境温度范围: -50 ~ 100°C');
    if (durationMode === 'custom' && targetDuration <= 0) errs.push('自定义时长必须大于0');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onCreated({
      productId: productId.trim(),
      productName: productName.trim(),
      specific: specific.trim(),
      diameter,
      height,
      ambtemp,
      ambhumi,
      operator,
      preweight,
      durationMode,
      targetDuration: durationMode === 'standard' ? 3600 : targetDuration,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a4a]">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">新建试验</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 环境信息 */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">环境信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>环境温度 (°C)</label>
                <input type="number" value={ambtemp} onChange={e => setAmbtemp(+e.target.value)} className="input-field" />
              </div>
              <div>
                <label>环境湿度 (%)</label>
                <input type="number" value={ambhumi} onChange={e => setAmbhumi(+e.target.value)} className="input-field" />
              </div>
            </div>
          </div>

          {/* 样品信息 */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">样品信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>样品编号 *</label>
                <input value={productId} onChange={e => setProductId(e.target.value)} className="input-field" placeholder="如 20240613-001" />
              </div>
              <div>
                <label>样品名称 *</label>
                <input value={productName} onChange={e => setProductName(e.target.value)} className="input-field" placeholder="如 岩棉隔热板" />
              </div>
              <div>
                <label>规格型号 *</label>
                <input value={specific} onChange={e => setSpecific(e.target.value)} className="input-field" placeholder="如 100×50×25mm" />
              </div>
              <div>
                <label>试验前质量 (g) *</label>
                <input type="number" value={preweight} onChange={e => setPreweight(+e.target.value)} className="input-field" />
              </div>
              <div>
                <label>直径 (mm)</label>
                <input type="number" value={diameter} onChange={e => setDiameter(+e.target.value)} className="input-field" />
              </div>
              <div>
                <label>高度 (mm)</label>
                <input type="number" value={height} onChange={e => setHeight(+e.target.value)} className="input-field" />
              </div>
            </div>
          </div>

          {/* 试验参数 */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">试验参数</h3>
            <div className="space-y-3">
              <div>
                <label>操作员</label>
                <input value={operator} disabled className="input-field" />
              </div>
              <div>
                <label>试验时长模式</label>
                <div className="flex gap-3 mt-1">
                  <button
                    onClick={() => setDurationMode('standard')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm ${
                      durationMode === 'standard'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-gray-700 text-gray-500'
                    }`}
                  >
                    标准 60 分钟
                  </button>
                  <button
                    onClick={() => setDurationMode('custom')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm ${
                      durationMode === 'custom'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-gray-700 text-gray-500'
                    }`}
                  >
                    自定义时长
                  </button>
                </div>
              </div>
              {durationMode === 'custom' && (
                <div>
                  <label>目标时长 (秒)</label>
                  <input type="number" value={targetDuration} onChange={e => setTargetDuration(+e.target.value)} className="input-field" />
                </div>
              )}
            </div>
          </div>

          {/* 设备信息（自动带入） */}
          {apparatus && (
            <div className="bg-[#0a0a15] rounded-lg p-3 border border-[#1a1a3a]">
              <h3 className="text-sm font-medium text-gray-400 mb-2">设备信息（自动带入）</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div>设备编号: <span className="text-gray-300">{apparatus.innernumber}</span></div>
                <div>设备名称: <span className="text-gray-300">{apparatus.apparatusname}</span></div>
                <div>检定日期: <span className="text-gray-300">{apparatus.checkdatef?.toString().split('T')[0]}</span></div>
                <div>恒功率值: <span className="text-gray-300">{apparatus.constpower}</span></div>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              {errors.map((e, i) => (
                <div key={i} className="text-sm text-red-400">{e}</div>
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="btn btn-outline">取消</button>
            <button onClick={handleSubmit} className="btn btn-primary">
              创建试验
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
