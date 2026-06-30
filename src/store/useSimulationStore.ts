import { create } from 'zustand';
import type { TestStatus, SensorReading, MasterMessage, TemperaturePoint, CurrentUser } from '@/lib/types';

interface SimulationStore {
  // 用户
  user: CurrentUser | null;
  setUser: (user: CurrentUser | null) => void;

  // 仿真状态
  status: TestStatus;
  readings: SensorReading;
  elapsedSeconds: number;
  totalSeconds: number;
  isStable: boolean;
  temperatureDrift: number;
  messages: MasterMessage[];
  history: TemperaturePoint[];
  currentProductId: string;
  currentTestId: string;
  connected: boolean;
  lastPersistedTimestamp: number; // 已持久化到数据库的最后时间戳

  // 活动试验
  activeTest: {
    productId: string;
    testId: string;
    ambtemp: number;
    ambhumi: number;
    preweight: number;
    durationMode: 'standard' | 'custom';
    targetDuration: number;
  } | null;
  setActiveTest: (test: SimulationStore['activeTest']) => void;

  // 更新仿真数据
  updateFromBroadcast: (data: {
    status: TestStatus;
    readings: SensorReading;
    elapsedSeconds: number;
    totalSeconds: number;
    isStable: boolean;
    temperatureDrift: number;
    messages: MasterMessage[];
    currentProductId: string;
    currentTestId: string;
  }) => void;

  // 添加温度点
  addTemperaturePoint: (point: TemperaturePoint) => void;

  // 连接状态
  setConnected: (connected: boolean) => void;

  // 重置
  reset: () => void;
}

const initialState = {
  user: null,
  status: 'Idle' as TestStatus,
  readings: { tf1: 25, tf2: 25, ts: 25, tc: 25, tcal: 25 } as SensorReading,
  elapsedSeconds: 0,
  totalSeconds: 0,
  isStable: false,
  temperatureDrift: 0,
  messages: [] as MasterMessage[],
  history: [] as TemperaturePoint[],
  currentProductId: '',
  currentTestId: '',
  connected: false,
  lastPersistedTimestamp: 0,
  activeTest: null,
};

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  ...initialState,

  setUser: (user) => set({ user }),

  setActiveTest: (test) => set({ activeTest: test }),

  updateFromBroadcast: (data) => {
    const state = get();
    // 追加温度历史点
    const newHistory = [...state.history];
    if (data.status === 'Recording' && data.elapsedSeconds > state.history.length) {
      newHistory.push({
        time: data.elapsedSeconds,
        tf1: data.readings.tf1,
        tf2: data.readings.tf2,
        ts: data.readings.ts,
        tc: data.readings.tc,
      });
    }
    // 限制历史数据量
    if (newHistory.length > 4000) {
      newHistory.splice(0, newHistory.length - 4000);
    }

    // 状态切换时重置持久化标记
    const newLastPersisted = data.status !== 'Recording' ? 0 : state.lastPersistedTimestamp;

    set({
      status: data.status,
      readings: data.readings,
      elapsedSeconds: data.elapsedSeconds,
      totalSeconds: data.totalSeconds,
      isStable: data.isStable,
      temperatureDrift: data.temperatureDrift,
      messages: data.messages.slice(-50),
      history: newHistory,
      currentProductId: data.currentProductId,
      currentTestId: data.currentTestId,
      lastPersistedTimestamp: newLastPersisted,
    });
  },

  addTemperaturePoint: (point) => {
    set((state) => {
      const newHistory = [...state.history, point];
      if (newHistory.length > 4000) {
        newHistory.splice(0, newHistory.length - 4000);
      }
      return { history: newHistory };
    });
  },

  setConnected: (connected) => set({ connected }),

  reset: () => set({ ...initialState, user: get().user }),
}));
