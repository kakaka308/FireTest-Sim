'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSimulationStore } from '@/store/useSimulationStore';
import { SIMULATION, COMPLETED_FLAG } from '@/lib/constants';
import type { SimulationBroadcast } from '@/lib/types';

import NavTabs from '@/components/NavTabs';
import TemperatureDisplay from '@/components/TemperatureDisplay';
import TemperatureChart from '@/components/TemperatureChart';
import ControlPanel from '@/components/ControlPanel';
import SystemMessages from '@/components/SystemMessages';
import TestCreator from '@/components/TestCreator';
import TestRecorder from '@/components/TestRecorder';
import TestHistory from '@/components/TestHistory';
import CalibrationPanel from '@/components/CalibrationPanel';
import StatusIndicator from '@/components/StatusIndicator';

export default function DashboardPage() {
  const router = useRouter();
  const user = useSimulationStore((s) => s.user);
  const store = useSimulationStore();

  const [activeTab, setActiveTab] = useState<'test' | 'calibration' | 'history'>('test');
  const [showCreator, setShowCreator] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [hasUnsavedTest, setHasUnsavedTest] = useState(false);

  // 检查是否有未保存的试验
  const checkUnsaved = useCallback(async () => {
    try {
      const res = await fetch('/api/tests?pageSize=1&page=1');
      const data = await res.json();
      if (data.tests?.length > 0) {
        const latest = data.tests[0];
        if (latest.totaltesttime > 0 && latest.flag !== COMPLETED_FLAG) {
          setHasUnsavedTest(true);
        } else {
          setHasUnsavedTest(false);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // SSE 连接
  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    checkUnsaved();

    const eventSource = new EventSource('/api/simulation/sse');

    eventSource.onmessage = (event) => {
      try {
        const data: SimulationBroadcast = JSON.parse(event.data);

        // 更新状态
        store.updateFromBroadcast(data);

        // 检查是否有未保存试验
        if (data.status === 'Complete' && data.elapsedSeconds > 0) {
          checkUnsaved();
        }
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onopen = () => {
      store.setConnected(true);
    };

    eventSource.onerror = () => {
      store.setConnected(false);
    };

    return () => {
      eventSource.close();
      store.setConnected(false);
    };
  }, [user, store.updateFromBroadcast]);

  // 保存温度数据到数据库（Recording 期间每 5 秒批量写入）
  const lastPersistedRef = useRef(0);

  useEffect(() => {
    if (store.status !== 'Recording') {
      lastPersistedRef.current = 0;
      return;
    }
    if (!store.currentProductId || !store.currentTestId) return;

    const interval = setInterval(async () => {
      try {
        const lastTs = lastPersistedRef.current;
        // 获取上次持久化之后新增的温度点（需要从最新 store 获取）
        const currentHistory = useSimulationStore.getState().history;
        const newPoints = currentHistory.filter(p => p.time > lastTs);

        if (newPoints.length > 0) {
          const records = newPoints.map(p => ({
            timestamp: p.time,
            temp1: p.tf1,
            temp2: p.tf2,
            tempsurface: p.ts,
            tempcenter: p.tc,
            tempcal: 0,
          }));

          await fetch(`/api/tests/${store.currentProductId}--${store.currentTestId}/temperature`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ records }),
          });

          // 更新最后持久化时间戳
          const maxTime = Math.max(...newPoints.map(p => p.time));
          lastPersistedRef.current = maxTime;
        }
      } catch {
        // ignore - 会在下次间隔重试
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [store.status, store.currentProductId, store.currentTestId]);

  // 试验完成后保存温度数据
  useEffect(() => {
    if (store.status !== 'Complete') return;
    if (!store.currentProductId || !store.currentTestId) return;
    if (store.history.length === 0) return;

    const saveTemperature = async () => {
      try {
        const records = store.history.map(p => ({
          timestamp: p.time,
          temp1: p.tf1,
          temp2: p.tf2,
          tempsurface: p.ts,
          tempcenter: p.tc,
          tempcal: 0,
        }));

        await fetch(`/api/tests/${store.currentProductId}--${store.currentTestId}/temperature`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records }),
        });
      } catch {
        // ignore
      }
    };

    saveTemperature();
  }, [store.status]);

  if (!user) return null;

  const { status, readings, elapsedSeconds, totalSeconds, isStable, temperatureDrift, connected } = store;

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-[#1a1a2e] border-b border-[#2a2a4a] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-white">
            ISO 11820 试验仿真系统
          </h1>
          <StatusIndicator status={status} connected={connected} />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {user.username} ({user.usertype === 'admin' ? '管理员' : '试验员'})
          </span>
          <button
            onClick={() => {
              store.setUser(null);
              router.push('/');
            }}
            className="text-sm text-gray-500 hover:text-gray-300"
          >
            退出
          </button>
        </div>
      </header>

      {/* Tab 导航 */}
      <NavTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 主内容 */}
      <div className="flex-1 p-4 overflow-auto">
        {activeTab === 'test' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            {/* 左列：温度显示 + 控制 */}
            <div className="space-y-4">
              <TemperatureDisplay
                readings={readings}
                elapsedSeconds={elapsedSeconds}
                status={status}
              />

              <ControlPanel
                status={status}
                hasUnsavedTest={hasUnsavedTest}
                activeTest={store.activeTest}
                isStable={isStable}
                onCreateTest={() => setShowCreator(true)}
                onSaveRecord={() => setShowRecorder(true)}
              />
            </div>

            {/* 中列：曲线图 */}
            <div className="lg:col-span-2 space-y-4">
              <TemperatureChart
                history={store.history}
                status={status}
                temperatureDrift={temperatureDrift}
              />

              <SystemMessages messages={store.messages} />
            </div>
          </div>
        )}

        {activeTab === 'calibration' && (
          <CalibrationPanel readings={readings} operator={user.username} />
        )}

        {activeTab === 'history' && (
          <TestHistory />
        )}
      </div>

      {/* 新建试验弹窗 */}
      {showCreator && (
        <TestCreator
          operator={user.username}
          onClose={() => setShowCreator(false)}
          onCreated={async (testData) => {
            try {
              const res = await fetch('/api/tests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData),
              });
              const data = await res.json();
              if (data.success) {
                store.setActiveTest({
                  productId: data.productId,
                  testId: data.testId,
                  ambtemp: testData.ambtemp,
                  ambhumi: testData.ambhumi,
                  preweight: testData.preweight,
                  durationMode: testData.durationMode || 'standard',
                  targetDuration: testData.targetDuration || SIMULATION.STANDARD_DURATION_SECONDS,
                });
                // 初始化仿真引擎
                await fetch('/api/simulation/command', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'init',
                    productId: data.productId,
                    testId: data.testId,
                    ambtemp: testData.ambtemp,
                    durationMode: testData.durationMode || 'standard',
                    targetDuration: testData.targetDuration || SIMULATION.STANDARD_DURATION_SECONDS,
                  }),
                });
                setShowCreator(false);
              }
            } catch (e) {
              console.error('Create test failed:', e);
            }
          }}
        />
      )}

      {/* 试验记录弹窗 */}
      {showRecorder && store.activeTest && (
        <TestRecorder
          productId={store.currentProductId || store.activeTest.productId}
          testId={store.currentTestId || store.activeTest.testId}
          preweight={store.activeTest.preweight}
          ambtemp={store.activeTest.ambtemp}
          history={store.history}
          onClose={() => setShowRecorder(false)}
          onSaved={async (record) => {
            try {
              // 计算统计值
              const maxtf1 = Math.max(...store.history.map(p => p.tf1), 0);
              const maxtf2 = Math.max(...store.history.map(p => p.tf2), 0);
              const maxts = Math.max(...store.history.map(p => p.ts), 0);
              const maxtc = Math.max(...store.history.map(p => p.tc), 0);
              const finaltf1 = store.history.length > 0 ? store.history[store.history.length - 1].tf1 : 0;
              const finaltf2 = store.history.length > 0 ? store.history[store.history.length - 1].tf2 : 0;
              const finalts = store.history.length > 0 ? store.history[store.history.length - 1].ts : 0;
              const finaltc = store.history.length > 0 ? store.history[store.history.length - 1].tc : 0;
              const ambtemp = store.activeTest?.ambtemp || 25;

              await fetch(`/api/tests/${store.currentProductId || store.activeTest!.productId}--${store.currentTestId || store.activeTest!.testId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...record,
                  preweight: store.activeTest?.preweight || 0,
                  totaltesttime: elapsedSeconds,
                  maxtf1, maxtf2, maxts, maxtc,
                  maxtf1Time: store.history.find(p => p.tf1 === maxtf1)?.time || 0,
                  maxtf2Time: store.history.find(p => p.tf2 === maxtf2)?.time || 0,
                  maxtsTime: store.history.find(p => p.ts === maxts)?.time || 0,
                  maxtcTime: store.history.find(p => p.tc === maxtc)?.time || 0,
                  finaltf1, finaltf2, finalts, finaltc,
                  finaltf1Time: elapsedSeconds,
                  finaltf2Time: elapsedSeconds,
                  finaltsTime: elapsedSeconds,
                  finaltcTime: elapsedSeconds,
                  deltatf1: finaltf1 - ambtemp,
                  deltatf2: finaltf2 - ambtemp,
                  deltatf: finalts - ambtemp,
                  deltats: finalts - ambtemp,
                  deltatc: finaltc - ambtemp,
                }),
              });

              // 通知仿真引擎
              await fetch('/api/simulation/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'completeToPreparing' }),
              });

              setHasUnsavedTest(false);
              setShowRecorder(false);
              store.setActiveTest(null);
            } catch (e) {
              console.error('Save record failed:', e);
            }
          }}
        />
      )}
    </div>
  );
}
