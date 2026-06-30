// 仿真配置
export const SIMULATION = {
  TICK_INTERVAL_MS: 800,
  TARGET_TEMP: 750.0,
  STABLE_THRESHOLD: 3.0,       // 747°C = 750 - 3
  STABLE_TEMP_MIN: 745.0,
  STABLE_TEMP_MAX: 755.0,
  STABLE_TICK_COUNT: 3,         // 连续稳定 tick 数
  HEATING_RATE_PER_SECOND: 40.0,
  TEMP_FLUCTUATION: 0.5,
  INITIAL_FURNACE_TEMP: 720.0,
  CONST_POWER: 2048,
  STANDARD_DURATION_SECONDS: 3600, // 60 分钟
  DRIFT_WINDOW_SECONDS: 600,    // 10 分钟
  MAX_TEMP_DRIFT: 2.0,          // 最大温漂
  COOLING_RATE_PER_SECOND: 2.0, // 降温速率 °C/s
  COOLING_TARGET_TEMP: 80.0,    // 降至此温度以下进入空闲
  TERMINATION_CHECK_INTERVAL: 300, // 5 分钟检查一次
};

// 角色
export const ROLES = {
  admin: { username: 'admin', defaultPwd: '123456' },
  experimenter: { username: 'experimenter', defaultPwd: '123456' },
} as const;

// 状态中文名
export const STATUS_LABELS: Record<string, string> = {
  Idle: '空闲',
  Preparing: '升温中',
  Ready: '就绪',
  Recording: '记录中',
  Complete: '完成',
  Cooling: '降温中',
};

// 完成标记
export const COMPLETED_FLAG = '10000000';

// 通道颜色
export const CHANNEL_COLORS = {
  tf1: '#ff4757',
  tf2: '#ff6b81',
  ts: '#2ed573',
  tc: '#1e90ff',
  tcal: '#ffa502',
};

// 通道显示名
export const CHANNEL_LABELS: Record<string, string> = {
  tf1: '炉温1',
  tf2: '炉温2',
  ts: '表面温',
  tc: '中心温',
  tcal: '校准温',
};

// 图表 Y 轴范围
export const CHART_Y_MIN = 0;
export const CHART_Y_MAX = 800;

// 图表 X 轴显示范围（秒）
export const CHART_X_WINDOW = 600; // 10 分钟

// 文件存储基础目录
export const BASE_DIR = process.env.BASE_DIR || './data';
