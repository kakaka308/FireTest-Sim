'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Eye } from 'lucide-react';
import { COMPLETED_FLAG } from '@/lib/constants';
import { X } from 'lucide-react';

interface TestRecord {
  productid: string;
  testid: string;
  testdate: string;
  operator: string;
  preweight: number;
  postweight: number;
  lostweightPer: number;
  deltatf: number;
  totaltesttime: number;
  flameduration: number;
  flag: string;
  memo: string;
}

export default function TestHistory() {
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [operators, setOperators] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestRecord | null>(null);

  // 加载操作员列表
  const fetchOperators = async () => {
    try {
      const res = await fetch('/api/tests?listOperators=1');
      const data = await res.json();
      setOperators(data.operators || []);
    } catch {
      // ignore
    }
  };

  const fetchTests = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      if (searchProduct) params.set('productId', searchProduct);
      if (selectedOperator) params.set('operator', selectedOperator);
      params.set('page', String(p));
      params.set('pageSize', '20');

      const res = await fetch(`/api/tests?${params}`);
      const data = await res.json();
      setTests(data.tests || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } catch (e) {
      console.error('Fetch tests failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
    fetchTests(1);
  }, []);

  const handleExport = (format: 'csv' | 'excel' | 'pdf', productId: string, testId: string) => {
    const url = `/api/export/${format}?productId=${encodeURIComponent(productId)}&testId=${encodeURIComponent(testId)}`;
    // 使用 <a> 标签下载，避免被浏览器弹窗拦截
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="panel">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label>开始日期</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label>结束日期</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label>样品编号</label>
            <input
              value={searchProduct}
              onChange={e => setSearchProduct(e.target.value)}
              className="input-field"
              placeholder="模糊搜索..."
              onKeyDown={e => e.key === 'Enter' && fetchTests(1)}
            />
          </div>
          <div>
            <label>操作员</label>
            <select
              value={selectedOperator}
              onChange={e => { setSelectedOperator(e.target.value); }}
              className="input-field"
            >
              <option value="">全部</option>
              {operators.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => fetchTests(1)} className="btn btn-primary w-full justify-center">
              <Search className="w-4 h-4" />
              查询
            </button>
          </div>
          <div className="flex items-end text-sm text-gray-500 self-end">
            共 {total} 条记录
          </div>
        </div>
      </div>

      {/* 数据表 */}
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a4a] text-gray-400 text-xs">
              <th className="text-left py-3 px-3">样品编号</th>
              <th className="text-left py-3 px-3">试验ID</th>
              <th className="text-left py-3 px-3">日期</th>
              <th className="text-left py-3 px-3">操作员</th>
              <th className="text-right py-3 px-3">失重率%</th>
              <th className="text-right py-3 px-3">温升°C</th>
              <th className="text-right py-3 px-3">时长s</th>
              <th className="text-center py-3 px-3">状态</th>
              <th className="text-center py-3 px-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-500">加载中...</td>
              </tr>
            ) : tests.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-500">暂无数据</td>
              </tr>
            ) : (
              tests.map((t) => (
                <tr key={`${t.productid}-${t.testid}`} className="border-b border-[#1a1a3a] hover:bg-[#1a1a3a] transition-colors">
                  <td className="py-2.5 px-3 text-gray-300 font-mono text-xs">{t.productid}</td>
                  <td className="py-2.5 px-3 text-gray-300 font-mono text-xs">{t.testid}</td>
                  <td className="py-2.5 px-3 text-gray-400">{t.testdate?.toString().split('T')[0]}</td>
                  <td className="py-2.5 px-3 text-gray-400">{t.operator}</td>
                  <td className={`py-2.5 px-3 text-right font-mono ${t.lostweightPer > 50 ? 'text-red-400' : 'text-green-400'}`}>
                    {t.lostweightPer?.toFixed(2)}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-mono ${t.deltatf > 50 ? 'text-red-400' : 'text-green-400'}`}>
                    {t.deltatf?.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-400">{t.totaltesttime}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      t.flag === COMPLETED_FLAG
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {t.flag === COMPLETED_FLAG ? '已完成' : '未保存'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedTest(t)}
                        className="p-1 hover:bg-[#2a2a4a] rounded text-gray-400 hover:text-blue-400"
                        title="查看详情"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleExport('csv', t.productid, t.testid)}
                        className="p-1 hover:bg-[#2a2a4a] rounded text-gray-400 hover:text-green-400"
                        title="导出CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleExport('excel', t.productid, t.testid)}
                        className="p-1 hover:bg-[#2a2a4a] rounded text-gray-400 hover:text-blue-400 text-xs"
                        title="导出Excel"
                      >
                        XLS
                      </button>
                      <button
                        onClick={() => handleExport('pdf', t.productid, t.testid)}
                        className="p-1 hover:bg-[#2a2a4a] rounded text-gray-400 hover:text-red-400 text-xs"
                        title="导出PDF"
                      >
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => fetchTests(i + 1)}
                className={`px-3 py-1 rounded text-sm ${
                  page === i + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1a1a2e] text-gray-400 hover:bg-[#2a2a4a]'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {selectedTest && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl w-full max-w-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a4a]">
              <h2 className="text-lg font-bold text-white">试验详情</h2>
              <button onClick={() => setSelectedTest(null)} className="text-gray-500 hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              {[
                ['样品编号', selectedTest.productid],
                ['试验ID', selectedTest.testid],
                ['试验日期', selectedTest.testdate?.toString().split('T')[0]],
                ['操作员', selectedTest.operator],
                ['试验前质量', `${selectedTest.preweight} g`],
                ['试验后质量', `${selectedTest.postweight} g`],
                ['失重率', `${selectedTest.lostweightPer?.toFixed(2)}%`],
                ['温升', `${selectedTest.deltatf?.toFixed(2)}°C`],
                ['总时长', `${selectedTest.totaltesttime} 秒`],
                ['火焰持续时间', `${selectedTest.flameduration} 秒`],
                ['状态', selectedTest.flag === COMPLETED_FLAG ? '已完成' : '未保存'],
                ['备注', selectedTest.memo || '-'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-[#1a1a3a] pb-2">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-300">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-[#2a2a4a]">
              <button onClick={() => setSelectedTest(null)} className="btn btn-outline">关闭</button>
              <button onClick={() => { handleExport('excel', selectedTest.productid, selectedTest.testid); setSelectedTest(null); }} className="btn btn-primary">
                <Download className="w-4 h-4" /> 导出Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
