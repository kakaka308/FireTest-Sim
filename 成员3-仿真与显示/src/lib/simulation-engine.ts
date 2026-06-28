import { SIMULATION } from './constants';
import type { SensorReading, MasterMessage, TestStatus, SimulationBroadcast, TemperaturePoint } from './types';

// 线型回归计算温漂
function linearRegression(data: number[]): number {
  const n = data.length;
  if (n < 10) return 0;
  const xValues = Array.from({ length: n }, (_, i) => i);
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * data[i], 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope * SIMULATION.DRIFT_WINDOW_SECONDS; // 转换为 °C/10min
}

type SimulationCallback = (broadcast: SimulationBroadcast) => void;

export class SimulationEngine {
  private status: TestStatus = 'Idle';
  private readings: SensorReading = {
    tf1: 25, tf2: 25, ts: 25, tc: 25, tcal: 25,
  };
  private elapsedSeconds = 0;
  private totalSeconds = 0;
  private isStable = false;
  private stableTicks = 0;
  private messages: MasterMessage[] = [];
  private history: TemperaturePoint[] = [];
  private temperatureDrift = 0;
  private currentProductId = '';
  private currentTestId = '';
  private durationMode: 'standard' | 'custom' = 'standard';
  private targetDuration = SIMULATION.STANDARD_DURATION_SECONDS;
  private ambtemp = 25;
  private timer: ReturnType<typeof setInterval> | null = null;
  private callbacks: Set<SimulationCallback> = new Set();
  // 恒功率 PID 输出队列
  private pidOutputQueue: number[] = [];
  private isHeatingActive = false;

  // 获取当前状态（只读快照）
  getState() {
    return {
      status: this.status,
      readings: { ...this.readings },
      elapsedSeconds: this.elapsedSeconds,
      totalSeconds: this.totalSeconds,
      isStable: this.isStable,
      temperatureDrift: this.temperatureDrift,
      messages: [...this.messages],
      history: [...this.history],
      currentProductId: this.currentProductId,
      currentTestId: this.currentTestId,
    };
  }

  getStatus(): TestStatus {
    return this.status;
  }

  getReadings(): SensorReading {
    return { ...this.readings };
  }

  getHistory(): TemperaturePoint[] {
    return [...this.history];
  }

  // 初始化：设置活动试验
  init(productId: string, testId: string, ambTemp: number, durationMode: 'standard' | 'custom', customDuration?: number) {
    this.currentProductId = productId;
    this.currentTestId = testId;
    this.ambtemp = ambTemp;
    this.durationMode = durationMode;
    this.targetDuration = durationMode === 'standard'
      ? SIMULATION.STANDARD_DURATION_SECONDS
      : (customDuration || SIMULATION.STANDARD_DURATION_SECONDS);
    this.status = 'Idle';
    this.elapsedSeconds = 0;
    this.totalSeconds = 0;
    this.isStable = false;
    this.stableTicks = 0;
    this.temperatureDrift = 0;
    this.messages = [];
    this.history = [];
    this.pidOutputQueue = [];
    this.isHeatingActive = false;
    this.readings = { tf1: 25, tf2: 25, ts: 25, tc: 25, tcal: 25 };
  }

  // 开始升温
  startHeating() {
    if (this.status !== 'Idle') {
      this.log('当前状态不允许升温操作', 'warning');
      return false;
    }
    this.status = 'Preparing';
    this.isHeatingActive = true;
    // 设置初始炉温
    this.readings.tf1 = SIMULATION.INITIAL_FURNACE_TEMP;
    this.readings.tf2 = SIMULATION.INITIAL_FURNACE_TEMP;
    this.readings.ts = SIMULATION.INITIAL_FURNACE_TEMP * 0.3;
    this.readings.tc = SIMULATION.INITIAL_FURNACE_TEMP * 0.25;
    this.readings.tcal = SIMULATION.INITIAL_FURNACE_TEMP;
    this.log('开始升温，系统升温中', 'info');
    this.startTick();
    return true;
  }

  // 停止升温 → 进入降温阶段
  stopHeating() {
    if (this.status !== 'Preparing' && this.status !== 'Ready' && this.status !== 'Complete') {
      this.log('当前状态不允许停止升温', 'warning');
      return false;
    }
    this.status = 'Cooling';
    this.isHeatingActive = false;
    this.isStable = false;
    this.stableTicks = 0;
    this.log('停止升温，系统正在降温...', 'info');
    this.startTick(); // 确保 tick 在运行以处理降温
    this.broadcast();
    return true;
  }

  // 开始记录
  startRecording() {
    if (this.status !== 'Ready') {
      this.log('温度未稳定，无法开始记录', 'warning');
      return false;
    }
    // 计算恒功率
    const constPower = this.pidOutputQueue.length > 0
      ? Math.round(this.pidOutputQueue.reduce((a, b) => a + b, 0) / this.pidOutputQueue.length)
      : SIMULATION.CONST_POWER;

    this.status = 'Recording';
    this.elapsedSeconds = 0;
    this.totalSeconds = 0;
    this.history = [];
    this.log('开始记录，计时开始', 'info');
    this.broadcast();
    return { constPower };
  }

  // 停止记录
  stopRecording() {
    if (this.status !== 'Recording') {
      return false;
    }
    // 检查是否有有效记录样本
    if (this.history.length > 0) {
      this.status = 'Complete';
      this.log('用户手动停止记录', 'info');
    } else {
      this.status = 'Preparing';
      this.log('无有效记录，回到就绪状态', 'warning');
    }
    this.broadcast();
    return true;
  }

  // 重置为空闲
  reset() {
    this.stopTick();
    this.status = 'Idle';
    this.isHeatingActive = false;
    this.isStable = false;
    this.stableTicks = 0;
    this.elapsedSeconds = 0;
    this.totalSeconds = 0;
    this.temperatureDrift = 0;
    this.history = [];
    this.pidOutputQueue = [];
    this.currentProductId = '';
    this.currentTestId = '';
    this.log('系统已重置', 'info');
    this.broadcast();
  }

  // 完成保存后回到 Preparing（保持炉温）
  completeToPreparing() {
    if (this.status !== 'Complete') return;
    this.status = 'Preparing';
    this.elapsedSeconds = 0;
    this.totalSeconds = 0;
    this.history = [];
    this.currentProductId = '';
    this.currentTestId = '';
    // 如果当前温度很高，保持温度；否则升温
    if (this.readings.tf1 < SIMULATION.INITIAL_FURNACE_TEMP) {
      this.readings.tf1 = SIMULATION.INITIAL_FURNACE_TEMP;
      this.readings.tf2 = SIMULATION.INITIAL_FURNACE_TEMP;
      this.readings.tcal = SIMULATION.INITIAL_FURNACE_TEMP;
    }
    this.isHeatingActive = true;
    this.log('试验记录已保存，炉温保持中，可新建下一个试验', 'info');
    this.startTick();
    this.broadcast();
  }

  // 注册回调
  onUpdate(callback: SimulationCallback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  // ========== 内部方法 ==========

  private rand(): number {
    return (Math.random() * 2 - 1) * SIMULATION.TEMP_FLUCTUATION;
  }

  private startTick() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), SIMULATION.TICK_INTERVAL_MS);
  }

  private stopTick() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick() {
    const rate = SIMULATION.HEATING_RATE_PER_SECOND * (SIMULATION.TICK_INTERVAL_MS / 1000);
    const coolRate = SIMULATION.COOLING_RATE_PER_SECOND * (SIMULATION.TICK_INTERVAL_MS / 1000);

    if (this.status === 'Cooling') {
      // 降温阶段：所有通道温度逐渐下降
      this.readings.tf1 -= coolRate + Math.abs(this.rand() * 0.3);
      this.readings.tf2 -= coolRate + Math.abs(this.rand() * 0.3);
      this.readings.ts -= coolRate * 0.7 + Math.abs(this.rand() * 0.2);
      this.readings.tc -= coolRate * 0.6 + Math.abs(this.rand() * 0.2);
      this.readings.tcal -= coolRate + Math.abs(this.rand() * 0.3);

      // 下限保护：不低于环境温度
      if (this.readings.tf1 < this.ambtemp) this.readings.tf1 = this.ambtemp;
      if (this.readings.tf2 < this.ambtemp) this.readings.tf2 = this.ambtemp;
      if (this.readings.ts < this.ambtemp) this.readings.ts = this.ambtemp;
      if (this.readings.tc < this.ambtemp) this.readings.tc = this.ambtemp;
      if (this.readings.tcal < this.ambtemp) this.readings.tcal = this.ambtemp;

      // 检查是否降到目标温度以下
      if (this.readings.tf1 <= SIMULATION.COOLING_TARGET_TEMP) {
        this.stopTick();
        this.status = 'Idle';
        this.readings = { tf1: this.ambtemp, tf2: this.ambtemp, ts: this.ambtemp, tc: this.ambtemp, tcal: this.ambtemp };
        this.elapsedSeconds = 0;
        this.totalSeconds = 0;
        this.history = [];
        this.pidOutputQueue = [];
        this.isHeatingActive = false;
        this.isStable = false;
        this.stableTicks = 0;
        this.log('降温完毕，系统已空闲', 'info');
      }
    }

    if (this.status === 'Preparing' || this.status === 'Ready') {
      // 升温/稳定阶段
      if (this.readings.tf1 < SIMULATION.TARGET_TEMP - SIMULATION.STABLE_THRESHOLD) {
        // 升温
        this.readings.tf1 += rate * 0.8 + this.rand();
        this.readings.tf2 += rate * 0.8 + this.rand();
        this.readings.ts = this.readings.tf1 * 0.3 + this.rand();
        this.readings.tc = this.readings.tf1 * 0.25 + this.rand();
        this.readings.tcal = this.readings.tf1 + this.rand() * 2;
        this.stableTicks = 0;
        this.isStable = false;
      } else {
        // 稳定
        this.readings.tf1 = SIMULATION.TARGET_TEMP + this.rand();
        this.readings.tf2 = SIMULATION.TARGET_TEMP + this.rand();
        this.readings.ts = this.readings.tf1 * 0.3 + this.rand();
        this.readings.tc = this.readings.tf1 * 0.25 + this.rand();
        this.readings.tcal = this.readings.tf1 + this.rand() * 2;
        this.stableTicks++;
        if (this.stableTicks > SIMULATION.STABLE_TICK_COUNT) {
          this.isStable = true;
        }
      }

      // 检查是否就绪
      this.checkStartCriteria();

      // 模拟 PID 输出值
      const pidOutput = SIMULATION.CONST_POWER + Math.floor(this.rand() * 50);
      this.pidOutputQueue.push(pidOutput);
      if (this.pidOutputQueue.length > 600) this.pidOutputQueue.shift();
    }
    else if (this.status === 'Recording') {
      // 保持炉温稳定
      this.readings.tf1 = SIMULATION.TARGET_TEMP + this.rand();
      this.readings.tf2 = SIMULATION.TARGET_TEMP + this.rand();
      this.readings.tcal = this.readings.tf1 + this.rand() * 2;

      // 表面温和中心温指数接近目标
      const surfaceTarget = Math.min(this.readings.tf1 * 0.95, 800);
      this.readings.ts += (surfaceTarget - this.readings.ts) * 0.02 + this.rand();

      const centerTarget = Math.min(this.readings.tf1 * 0.85, 750);
      this.readings.tc += (centerTarget - this.readings.tc) * 0.01 + this.rand();

      // 每秒记录一个点（800ms tick，累计到秒）
      this.totalSeconds++;
      this.elapsedSeconds++;

      // 记录历史数据点
      this.history.push({
        time: this.elapsedSeconds,
        tf1: this.readings.tf1,
        tf2: this.readings.tf2,
        ts: this.readings.ts,
        tc: this.readings.tc,
      });

      // 检查终止条件
      this.checkTermination();
    }

    // 计算温漂
    this.computeDrift();

    // 广播数据
    this.broadcast();
  }

  private checkStartCriteria() {
    if (this.status !== 'Preparing') return;
    const inRange = this.readings.tf1 >= SIMULATION.STABLE_TEMP_MIN &&
                    this.readings.tf1 <= SIMULATION.STABLE_TEMP_MAX;
    if (inRange && this.isStable) {
      this.status = 'Ready';
      this.log('温度已稳定，可以开始记录', 'info');
    }
    // Ready 状态下温度跌出范围，回退到 Preparing
    if (this.status === 'Ready' && !inRange) {
      this.status = 'Preparing';
      this.isStable = false;
      this.stableTicks = 0;
      this.log('温度波动，重新稳定中', 'warning');
    }
  }

  private checkTermination() {
    if (this.status !== 'Recording') return;

    // 手动终止
    if (this.totalSeconds >= this.targetDuration) {
      this.status = 'Complete';
      this.log(`记录时间到达 ${this.targetDuration} 秒，试验自动结束`, 'info');
      return;
    }

    // 标准模式：每5分钟检查一次提前终止条件
    if (this.durationMode === 'standard' && this.elapsedSeconds >= 1800) {
      // 30分钟以上，每5分钟检查
      if (this.elapsedSeconds % 300 < 1 && Math.abs(this.temperatureDrift) <= SIMULATION.MAX_TEMP_DRIFT) {
        this.status = 'Complete';
        this.log('满足终止条件，试验结束', 'warning');
      }
    }
  }

  private computeDrift() {
    // 使用最近10分钟炉温1数据计算温漂
    const windowSize = Math.floor(SIMULATION.DRIFT_WINDOW_SECONDS / (SIMULATION.TICK_INTERVAL_MS / 1000));
    const tf1History = this.history.slice(-windowSize).map(p => p.tf1);
    if (tf1History.length > 10) {
      this.temperatureDrift = linearRegression(tf1History);
    }
  }

  private log(message: string, type: MasterMessage['type'] = 'info') {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    this.messages.push({ time, message, type });
    if (this.messages.length > 200) this.messages.shift();
  }

  private broadcast() {
    const broadcast: SimulationBroadcast = {
      status: this.status,
      readings: { ...this.readings },
      elapsedSeconds: this.elapsedSeconds,
      totalSeconds: this.totalSeconds,
      isStable: this.isStable,
      temperatureDrift: this.temperatureDrift,
      messages: [...this.messages],
      currentProductId: this.currentProductId,
      currentTestId: this.currentTestId,
    };
    for (const cb of this.callbacks) {
      try { cb(broadcast); } catch (e) { /* ignore */ }
    }
  }
}

// 全局单例
const globalForSim = globalThis as unknown as { __simEngine: SimulationEngine };
export const simulationEngine = globalForSim.__simEngine || new SimulationEngine();
if (process.env.NODE_ENV !== 'production') globalForSim.__simEngine = simulationEngine;
