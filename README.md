# ISO 11820 建筑材料不燃性试验仿真系统

> **版本**: 1.0.0  
> **技术栈**: Next.js 14 + TypeScript + Prisma + PostgreSQL + Tailwind CSS  
> **用途**: 基于 ISO 11820 标准的建筑材料不燃性试验仿真与数据管理系统（Web 版）

---

## 目录

- [项目简介](#项目简介)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
  - [环境要求](#环境要求)
  - [安装与配置](#安装与配置)
  - [数据库初始化](#数据库初始化)
  - [启动项目](#启动项目)
- [可用脚本](#可用脚本)
- [系统架构](#系统架构)
  - [整体架构](#整体架构)
  - [仿真引擎](#仿真引擎)
  - [实时数据流](#实时数据流)
  - [试验状态机](#试验状态机)
  - [按钮控制逻辑](#按钮控制逻辑)
- [数据库设计](#数据库设计)
  - [ER 模型](#er-模型)
  - [表结构详解](#表结构详解)
- [API 接口文档](#api-接口文档)
- [核心模块说明](#核心模块说明)
  - [前端页面](#前端页面)
  - [React 组件](#react-组件)
  - [状态管理](#状态管理)
  - [工具库](#工具库)
- [仿真参数配置](#仿真参数配置)
- [判定标准](#判定标准)
- [数据导出](#数据导出)
- [用户角色](#用户角色)
- [UI 设计说明](#ui-设计说明)
- [环境变量](#环境变量)
- [开发指南](#开发指南)
- [许可证](#许可证)

---

## 项目简介

**ISO 11820 建筑材料不燃性试验仿真系统** 是一套基于 ISO 11820 国际标准的建筑材料不燃性试验 Web 应用。系统模拟了炉温升温、恒温稳定、试验记录、冷却降温等完整试验流程，支持多通道温度数据实时采集与可视化、试验记录的增删改查、数据导出（CSV/Excel/PDF），以及设备校准管理等功能。

本项目参考了原有的 C# WinForms 桌面版开发文档，使用 **Next.js 14 App Router** 全栈重构，前后端一体化部署，实现了原桌面应用的所有核心功能并增加了 Web 端的优势特性。

---

## 功能特性

### 核心试验功能

| 功能 | 说明 |
|------|------|
| **5 通道温度仿真** | TF1（炉温1）、TF2（炉温2）、TS（表面温）、TC（中心温）、TCal（校准温），带有独立随机噪声 |
| **完整试验流程** | 升温 → 恒温稳定 → 开始记录 → 停止记录 → 完成保存 → 降温冷却 |
| **实时温度曲线** | 基于 recharts 绘制的 4 线折线图，展示最近 10 分钟数据 |
| **LED 风格数显** | 暗色主题面板 + 等宽字体 + 发光效果，模拟实验室设备界面 |
| **温漂自动计算** | 对最近 10 分钟炉温数据进行线性回归，计算温度漂移趋势 |
| **自动判定** | 根据样品温升、失重率、火焰持续时间三项指标自动判定试验结果 |
| **现象备注** | 支持试验过程中记录冒烟、变形、闪燃等现象和备注 |

### 数据管理

| 功能 | 说明 |
|------|------|
| **试验历史查询** | 按日期范围、样品编号、操作员多条件组合查询，分页显示 |
| **试验详情查看** | 弹窗展示完整试验信息（含温度曲线） |
| **多格式导出** | 支持 CSV（原始数据）、Excel（含图表）、PDF（完整报告） |
| **设备校准** | 表面/中心温度校准记录管理与历史查看 |

### 系统特性

| 功能 | 说明 |
|------|------|
| **角色权限** | 管理员 / 试验员 两种角色 |
| **SSE 实时推送** | 仿真引擎数据通过 Server-Sent Events 实时推送到前端 |
| **未保存保护** | 存在未保存试验时阻止新建试验并提示 |
| **自动降温** | 停止记录后自动进入降温冷却流程，降至 80°C 以下自动恢复空闲 |

---

## 技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **框架** | Next.js | ^14.2.0 | 全栈 React 框架（App Router） |
| **UI 库** | React | ^18.3.0 | 用户界面构建 |
| **语言** | TypeScript | ^5.4.0 | 类型安全 |
| **ORM** | Prisma | ^5.20.0 | 数据库 ORM |
| **数据库** | PostgreSQL | - | 关系型数据库 |
| **样式** | Tailwind CSS | ^3.4.0 | 原子化 CSS |
| **图标** | lucide-react | ^0.400.0 | SVG 图标库 |
| **图表** | recharts | ^2.12.0 | 温度曲线图 |
| **状态管理** | zustand | ^4.5.0 | 轻量全局状态 |
| **Excel 导出** | exceljs | ^4.4.0 | Excel 文件生成 |
| **PDF 导出** | jspdf + autotable | ^2.5.0 / ^3.8.0 | PDF 报告生成 |
| **UUID** | uuid | ^9.0.0 | 唯一标识符生成 |

---

## 项目结构

```
FireTest/
├── .env                              # 环境变量配置
├── .gitignore                        # Git 忽略规则
├── next.config.js                    # Next.js 配置
├── tsconfig.json                     # TypeScript 配置
├── tailwind.config.ts                # Tailwind CSS 配置
├── postcss.config.js                 # PostCSS 配置
├── package.json                      # 项目依赖与脚本
├── package-lock.json                 # 依赖锁定文件
├── DB-数据库设计.md                   # 数据库设计参考文档
├── ISO11820-开发文档.md               # 原始 C# 版本开发文档
├── README.md                         # 项目说明文档（本文件）
│
├── prisma/                           # Prisma 相关
│   ├── schema.prisma                 # 数据库 Schema 定义
│   └── seed.ts                       # 数据库种子数据脚本
│
└── src/                              # 源代码目录
    ├── app/                          # Next.js App Router 页面
    │   ├── globals.css               # 全局样式（暗色主题 + LED 效果）
    │   ├── layout.tsx                # 根布局组件
    │   ├── page.tsx                  # 登录页面
    │   ├── dashboard/
    │   │   └── page.tsx              # 仪表盘主页（试验控制中心）
    │   └── api/                      # API 路由
    │       ├── auth/login/           # POST - 用户登录
    │       ├── apparatus/            # GET/PUT - 设备信息
    │       ├── products/             # GET - 样品列表
    │       ├── operators/            # GET - 操作员列表
    │       ├── tests/                # GET/POST - 试验列表/创建
    │       ├── tests/[ids]/          # GET/PUT - 试验详情/更新
    │       ├── tests/[ids]/temperature/  # GET/POST - 温度时序数据
    │       ├── calibration/          # GET/POST - 校准记录
    │       ├── simulation/command/   # POST - 仿真控制命令
    │       ├── simulation/sse/       # GET - SSE 实时数据推送
    │       └── export/
    │           ├── csv/              # GET - 导出 CSV
    │           ├── excel/            # GET - 导出 Excel
    │           └── pdf/              # GET - 导出 PDF
    ├── components/                   # React 组件
    │   ├── CalibrationPanel.tsx      # 设备校准面板
    │   ├── ControlPanel.tsx          # 操作控制面板（按钮）
    │   ├── NavTabs.tsx               # 顶部标签导航
    │   ├── StatusIndicator.tsx       # 状态指示灯
    │   ├── SystemMessages.tsx        # 系统消息日志
    │   ├── TemperatureChart.tsx      # 温度曲线图（recharts）
    │   ├── TemperatureDisplay.tsx    # LED 风格温度数显
    │   ├── TestCreator.tsx           # 新建试验弹窗
    │   ├── TestHistory.tsx           # 历史记录查询
    │   └── TestRecorder.tsx          # 试验现象记录弹窗
    ├── lib/                          # 工具库
    │   ├── auth.ts                   # 登录验证逻辑
    │   ├── constants.ts              # 仿真参数与常量
    │   ├── prisma.ts                 # Prisma 客户端单例
    │   ├── simulation-engine.ts      # 仿真引擎核心
    │   └── types.ts                  # TypeScript 类型定义
    ├── store/
    │   └── useSimulationStore.ts     # Zustand 全局状态
    └── types/
        └── css.d.ts                  # CSS 模块类型声明
```

---

## 快速开始

### 环境要求

| 工具 | 最低版本 | 说明 |
|------|---------|------|
| **Node.js** | 18.17+ | JavaScript 运行时 |
| **npm** | 9.x+ | 包管理器 |
| **PostgreSQL** | 14.x+ | 数据库 |

### 安装与配置

#### 1. 克隆项目并安装依赖

```bash
cd FireTest
npm install
```

#### 2. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# 数据库连接字符串
DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/iso11820?schema=public"

# 应用名称（用于页面标题）
NEXT_PUBLIC_APP_NAME="ISO 11820 建材不燃性试验仿真系统"

# 数据文件基础目录（可选）
BASE_DIR="./data"
```

#### 3. 创建 PostgreSQL 数据库

```sql
-- 连接到 PostgreSQL 后执行
CREATE DATABASE iso11820;
```

### 数据库初始化

```bash
# 推送 Schema 到数据库（创建表结构）
npm run db:push

# 生成 Prisma Client
npm run db:generate

# 运行种子脚本（插入默认数据）
npm run db:seed
```

种子数据包含：
- **操作员账号**：admin（密码 123456）、experimenter（密码 123456）
- **设备信息**：默认试验装置
- **传感器配置**：5 个温度传感器
- **样品模板**：3 种常用建筑材料样品

### 启动项目

```bash
# 开发模式（支持热重载）
npm run dev
```

浏览器访问 `http://localhost:3000` 即可进入系统。

生产环境部署：

```bash
npm run build
npm start
```

---

## 可用脚本

| 命令 | 用途 |
|------|------|
| `npm run dev` | 启动 Next.js 开发服务器（Turbo 模式） |
| `npm run build` | 构建生产版本 |
| `npm start` | 启动生产服务器 |
| `npm run db:generate` | 根据 schema.prisma 生成 Prisma Client |
| `npm run db:push` | 将 schema 推送到数据库（不生成迁移文件） |
| `npm run db:migrate` | 创建数据库迁移 |
| `npm run db:seed` | 运行种子数据脚本 |
| `npm run db:studio` | 打开 Prisma Studio（可视化数据库管理） |

---

## 系统架构

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      浏览器 (Browser)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ 登录页面  │  │ 仪表盘   │  │  温度图表 + LED 数显   │   │
│  │ page.tsx  │  │ dashboard│  │  TemperatureChart/   │   │
│  │          │  │ page.tsx │  │  TemperatureDisplay   │   │
│  └──────────┘  └──────────┘  └──────────────────────┘   │
│        │              │                   ▲              │
│        │    HTTP API  │    SSE (实时推送)  │              │
└────────┼──────────────┼───────────────────┼──────────────┘
         │              │                   │
         ▼              ▼                   │
┌─────────────────────────────────────────────────────────┐
│                 Next.js 服务端 (Node.js)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ API 路由  │  │ 仿真引擎  │  │  SSE 推送            │   │
│  │ /api/*   │  │ engine   │  │  /api/simulation/sse │   │
│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘   │
│       │              │                   │               │
│       ▼              ▼                   │               │
│  ┌───────────────────────────────────────┴───────────┐   │
│  │              Prisma Client (ORM)                   │   │
│  └───────────────────────┬───────────────────────────┘   │
└──────────────────────────┼───────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │     PostgreSQL 数据库    │
              └─────────────────────────┘
```

### 仿真引擎

仿真引擎（`src/lib/simulation-engine.ts`）是系统的核心模块，负责：

1. **温度计算**：根据当前状态和时间，计算 5 个通道的实时温度值
2. **状态转换**：管理 6 个试验状态之间的自动/手动转换
3. **定时循环**：每 800ms 执行一个 tick，推进仿真时间
4. **数据发布**：将计算出的温度数据通过回调函数发送给 SSE 推送端点
5. **批量存储**：Recording 状态下每 5 秒批量写入温度数据到数据库

**温度计算算法**：
- **TF1/TF2**（炉温）：升温阶段按 40°C/s 线性升温至 750°C，稳定后在 745-755°C 范围内波动（叠加 Perlin 风格噪声）
- **TS**（表面温）：记录阶段以指数方式逼近 `炉温 × 0.95`
- **TC**（中心温）：记录阶段以更慢的指数方式逼近 `炉温 × 0.85`
- **TCal**（校准温）：= `TF1 + 随机噪声 × 2`

**全局单例**：使用 `globalThis` 缓存引擎实例，避免 Next.js 开发模式下的热重载导致重复实例化。

### 实时数据流

```
仿真引擎 tick
      │
      ▼
计算 5 通道温度
      │
      ├──→ 回调函数 → EventEmitter → SSE 端点
      │                                       │
      │                    ┌───────────────────┘
      │                    ▼
      │         res.write("data: ...\n\n")
      │                    │
      │                    ▼
      │         浏览器 EventSource.onmessage
      │                    │
      │                    ▼
      │         Zustand store 更新
      │                    │
      │                    ├──→ TemperatureChart 图表重绘
      │                    └──→ TemperatureDisplay LED 更新
      │
      └──→ (每 5 秒) Prisma.createMany → PostgreSQL temperature_data 表
```

### 试验状态机

```
        ┌─────────────────────────────────────────────┐
        │                                             │
        ▼                                             │
   ┌─────────┐   开始升温    ┌───────────┐            │
   │  Idle   │──────────────▶│ Preparing │            │
   │ (空闲)  │               │  (升温中)  │            │
   └─────────┘               └─────┬─────┘            │
        ▲                          │ 温度达 745-755°C   │
        │                          ▼                  │
        │                    ┌───────────┐            │
        │         停止升温    │   Ready   │            │
        │◄───────────────────│  (已就绪)  │            │
        │                    └─────┬─────┘            │
        │                          │ 开始记录          │
        │                          ▼                  │
        │                    ┌───────────┐            │
        │                    │ Recording │            │
        │                    │  (记录中)  │            │
        │                    └─────┬─────┘            │
        │                          │ 停止记录          │
        │                          ▼                  │
        │                    ┌───────────┐            │
        │                    │ Complete  │            │
        │                    │  (已完成)  │            │
        │                    └─────┬─────┘            │
        │                          │ 确认保存          │
        │                          ▼                  │
        │                    ┌───────────┐            │
        └──── 温度 < 80°C ───│  Cooling  │            │
                             │  (降温中)  │            │
                             └───────────┘            │
```

**状态转换说明**：

| 状态 | 含义 | 进入条件 | 温度行为 |
|------|------|---------|---------|
| **Idle** | 系统空闲，等待开始 | 初始状态 / 降温完成 | 炉温 = 720°C |
| **Preparing** | 炉子升温中 | 点击"开始升温" | 炉温从 720°C 升至 750°C（40°C/s） |
| **Ready** | 温度稳定，可以记录 | 炉温进入 745-755°C 范围 | 炉温在 745-755°C 范围内波动 |
| **Recording** | 正在记录试验数据 | 点击"开始记录" | 所有通道正常仿真，温度数据写入数据库 |
| **Complete** | 试验记录完成 | 点击"停止记录" | 温度保持，等待用户确认 |
| **Cooling** | 炉子降温中 | 确认完成 | 炉温以 2°C/s 下降至 80°C 以下 |

### 按钮控制逻辑

| 按钮 | Idle | Preparing | Ready | Recording | Complete |
|------|:----:|:---------:|:-----:|:---------:|:--------:|
| **新建试验** | ✅ * | ✅ * | ❌ | ❌ | ❌ * |
| **开始升温** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **停止升温** | ❌ | ✅ | ✅ | ❌ | ✅ |
| **开始记录** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **停止记录** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **试验记录** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **查看历史** | ✅ | ✅ | ✅ | ❌ | ✅ |

> \* 标记表示受"未保存试验保护规则"限制：如果存在 `flag ≠ '10000000'` 的未保存试验，则**新建试验**按钮被禁用，用户必须先保存或放弃当前试验。

---

## 数据库设计

### ER 模型

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  operators   │       │   testmaster     │       │  productmaster   │
│  (操作员)     │       │   (试验记录)      │       │  (样品信息)       │
├──────────────┤       ├──────────────────┤       ├──────────────────┤
│ userid (PK)  │──┐    │ productid (PK)   │    ┌──│ productid (PK)   │
│ username     │  │    │ testid (PK)      │    │  │ productname      │
│ pwd          │  │    │ operatorid (FK)──┼────┘  │ specific         │
│ usertype     │  │    │ productid (FK)───┼───────│ diameter         │
└──────────────┘  │    │ testdate         │       │ height           │
                  │    │ testrname        │       └──────────────────┘
                  │    │ beforemass       │
                  │    │ aftermass        │       ┌──────────────────┐
                  │    │ starttime        │       │    apparatus     │
                  │    │ endtime          │       │    (设备信息)     │
                  │    │ deltatf          │       ├──────────────────┤
                  │    │ lostweightPer    │       │ apparatusid (PK) │
                  │    │ flameduration    │       │ apparatusname    │
                  │    │ result           │       │ innernumber      │
                  │    │ flag             │       │ checkdatef/t     │
                  │    │ phenomenon       │       │ pidport           │
                  │    └──────────────────┘       │ powerport         │
                  │             │                 │ constpower        │
                  │             │                 └──────────────────┘
                  │             │
                  │    ┌────────┴──────────┐
                  │    │ temperature_data  │       ┌──────────────────┐
                  │    │ (温度时序数据)     │       │     sensors      │
                  │    ├──────────────────┤       │   (传感器配置)    │
                  │    │ productid (FK)   │       ├──────────────────┤
                  │    │ testid (FK)      │       │ sensorid (PK)    │
                  │    │ timestamp        │       │ sensorname       │
                  │    │ temp1            │       │ dispname         │
                  │    │ temp2            │       │ sensorgroup      │
                  │    │ tempSurface      │       │ unit             │
                  │    │ tempCenter       │       │ minrange         │
                  │    │ tempCalibration  │       │ maxrange         │
                  │    └──────────────────┘       └──────────────────┘
                  │
                  │    ┌──────────────────────────┐
                  └───▶│   CalibrationRecords     │
                       │   (校准记录)              │
                       ├──────────────────────────┤
                       │ guid (PK)                │
                       │ calibrationDate          │
                       │ calibrationType          │
                       │ t1 - t9 (9点测温)        │
                       │ avgTemp, stdDev          │
                       └──────────────────────────┘
```

### 表结构详解

#### operators（操作员表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `userid` | String (PK) | 用户 ID |
| `username` | String | 用户姓名 |
| `pwd` | String | 登录密码 |
| `usertype` | String | 用户类型：admin / operator |

#### apparatus（设备信息表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `apparatusid` | String (PK) | 设备编号 |
| `apparatusname` | String | 设备名称 |
| `innernumber` | String | 内部编号 |
| `checkdatef` | String | 上次检定日期 |
| `checkdatet` | String | 检定到期日期 |
| `pidport` | String | PID 端口号 |
| `powerport` | String | 电源端口号 |
| `constpower` | String | 额定功率 |

#### productmaster（样品信息表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `productid` | String (PK) | 样品编号 |
| `productname` | String | 样品名称 |
| `specific` | String | 规格 |
| `diameter` | Int | 直径（mm） |
| `height` | Int | 高度（mm） |

#### testmaster（试验记录表）- 核心表

| 字段 | 类型 | 说明 |
|------|------|------|
| `productid` | String (PK) | 样品编号 |
| `testid` | String (PK) | 试验编号 |
| `testdate` | DateTime | 试验日期 |
| `testrname` | String | 试验人姓名 |
| `operatorid` | String (FK) | 操作员 ID |
| `beforemass` | Float | 试验前质量（g）|
| `aftermass` | Float | 试验后质量（g）|
| `starttime` | DateTime | 开始时间 |
| `endtime` | DateTime | 结束时间 |
| `tf1max` | Float | 炉温1 最大值 |
| `tf2max` | Float | 炉温2 最大值 |
| `tsurfacemax` | Float | 表面温最大值 |
| `tcentermax` | Float | 中心温最大值 |
| `deltatf` | Float | 样品温升 |
| `lostweight` | Float | 失重量（g）|
| `lostweightPer` | Float | 失重率（%）|
| `flameduration` | Float | 火焰持续时间（s）|
| `result` | String | 试验结果：通过 / 不通过 |
| `flag` | String | 状态标记：`10000000` = 已保存 |
| `phenomenon` | String | 试验现象备注 |

#### sensors（传感器配置表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `sensorid` | String (PK) | 传感器编号 |
| `sensorname` | String | 传感器名称（如：TF1） |
| `dispname` | String | 显示名称（如：炉温1） |
| `sensorgroup` | String | 传感器分组 |
| `unit` | String | 单位（°C）|
| `minrange` | Float | 最小量程 |
| `maxrange` | Float | 最大量程 |
| `checkdate` | DateTime | 校准日期 |
| `checkcyc` | Int | 校准周期（天）|

#### CalibrationRecords（校准记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `guid` | String (PK) | 主键 |
| `calibrationDate` | DateTime | 校准日期 |
| `calibrationType` | String | 校准类型：表面 / 中心 |
| `operator` | String | 操作员 |
| `t1` - `t9` | Float | 炉壁 9 个测温点 |
| `avgTemp` | Float | 平均温度 |
| `stdDev` | Float | 标准差 |
| `referenceTemp` | Float | 参考温度 |

#### temperature_data（温度时序数据表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `productid` | String (FK) | 样品编号 |
| `testid` | String (FK) | 试验编号 |
| `timestamp` | String | 时间戳（秒）|
| `temp1` | Float | TF1 炉温1 |
| `temp2` | Float | TF2 炉温2 |
| `tempSurface` | Float | TS 表面温 |
| `tempCenter` | Float | TC 中心温 |
| `tempCalibration` | Float | TCal 校准温 |

---

## API 接口文档

### 认证

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| **POST** | `/api/auth/login` | 用户登录 | `{ username, password, usertype }` |

### 设备管理

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| **GET** | `/api/apparatus` | 获取设备信息 | - |
| **PUT** | `/api/apparatus` | 更新设备信息 | `{ apparatusid, ...fields }` |

### 样品管理

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| **GET** | `/api/products` | 获取样品列表 | `?search=关键词`（可选） |

### 操作员

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| **GET** | `/api/operators` | 获取操作员列表 | - |

### 试验管理

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| **GET** | `/api/tests` | 查询试验列表 | `?startDate=&endDate=&productid=&operatorid=&page=&pageSize=` |
| **POST** | `/api/tests` | 创建新试验 | `{ productid, beforemass, ...fields }` |
| **GET** | `/api/tests/[ids]` | 获取试验详情 | `[ids]` 格式：`{productid}_{testid}` |
| **PUT** | `/api/tests/[ids]` | 更新试验记录 | `{ aftermass, lostweight, ...fields }` |

### 温度数据

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| **GET** | `/api/tests/[ids]/temperature` | 获取温度时序数据 | `[ids]` 格式：`{productid}_{testid}` |
| **POST** | `/api/tests/[ids]/temperature` | 批量写入温度数据 | `{ records: [...] }` |

### 校准管理

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| **GET** | `/api/calibration` | 获取校准记录 | - |
| **POST** | `/api/calibration` | 保存校准记录 | `{ calibrationType, ...data }` |

### 仿真控制

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| **POST** | `/api/simulation/command` | 发送控制命令 | `{ command: "start_heat" \| "stop_heat" \| "start_record" \| "stop_record" \| "save" }` |
| **GET** | `/api/simulation/sse` | 建立 SSE 连接 | -（返回 `text/event-stream`） |

### 数据导出

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| **GET** | `/api/export/csv` | 导出 CSV | `?productid=&testid=` |
| **GET** | `/api/export/excel` | 导出 Excel | `?productid=&testid=` |
| **GET** | `/api/export/pdf` | 导出 PDF | `?productid=&testid=` |

---

## 核心模块说明

### 前端页面

#### 1. 登录页面 (`src/app/page.tsx`)

- 角色选择按钮：管理员 / 试验员
- 密码输入（默认密码 123456）
- 根据角色自动确定用户名，无需手动输入
- 登录成功后跳转到 `/dashboard`

#### 2. 仪表盘页面 (`src/app/dashboard/page.tsx`)

主操作界面，包含以下区域：

```
┌─────────────────────────────────────────────────────┐
│  导航栏: [试验] [历史查询] [设备校准]     [操作员] [退出]  │
├──────────────┬──────────────────────────────────────┤
│  状态指示灯   │       试验控制面板                      │
│  (Idle/Ready)│  [新建试验][开始升温][开始记录][...]      │
├──────────────┼──────────────────────────────────────┤
│  温度 LED    │       温度曲线图                        │
│  TF1: 745°C │  ┌──────────────────────────────┐    │
│  TF2: 746°C │  │  ╱╲    ╱╲                     │    │
│  TS:  708°C │  │ ╱  ╲──╱  ╲────                │    │
│  TC:  635°C │  │/                            │    │
│  温漂: +0.1 │  └──────────────────────────────┘    │
├──────────────┴──────────────────────────────────────┤
│              系统消息日志                              │
│  [14:30:01] 开始升温...                              │
│  [14:32:15] 温度达到稳定，可以开始记录                   │
│  [14:33:00] 开始记录试验数据...                        │
└─────────────────────────────────────────────────────┘
```

### React 组件

| 组件 | 文件 | 功能描述 |
|------|------|---------|
| **CalibrationPanel** | `CalibrationPanel.tsx` | 设备校准面板，支持表面/中心两种校准类型，记录当前温度点并保存，查看历史校准记录 |
| **ControlPanel** | `ControlPanel.tsx` | 试验操作按钮组，根据当前状态自动启用/禁用按钮，处理所有控制命令 |
| **NavTabs** | `NavTabs.tsx` | 顶部 Tab 导航，切换"试验"、"历史查询"、"设备校准"三个功能区域 |
| **StatusIndicator** | `StatusIndicator.tsx` | 试验状态指示灯，6 种状态对应不同颜色（空闲-灰、升温-橙、就绪-绿等） |
| **SystemMessages** | `SystemMessages.tsx` | 系统消息日志面板，显示带时间戳的操作记录和状态变更通知 |
| **TemperatureChart** | `TemperatureChart.tsx` | 基于 recharts 的实时温度曲线，显示最近 10 分钟的 TF1/TF2/TS/TC 四条折线 |
| **TemperatureDisplay** | `TemperatureDisplay.tsx` | LED 风格数字温度显示面板，等宽字体 + 文字发光效果（text-shadow） |
| **TestCreator** | `TestCreator.tsx` | 新建试验弹窗，选择样品、输入试验前质量，自动生成试验编号 |
| **TestHistory** | `TestHistory.tsx` | 历史记录查询面板，支持多条件筛选和分页，查看详情弹窗含温度曲线 |
| **TestRecorder** | `TestRecorder.tsx` | 试验记录弹窗，输入试验后质量、火焰持续时间、现象备注，自动计算和判定 |

### 状态管理

使用 **Zustand** 管理全局状态（`src/store/useSimulationStore.ts`）：

```typescript
interface SimulationStore {
  // 用户信息
  user: { userId, userName, userType } | null;
  
  // 当前试验信息
  currentTest: TestMaster | null;
  
  // 实时温度数据
  temperatures: TemperatureData;
  
  // 温度历史（用于图表）
  temperatureHistory: TemperaturePoint[];
  
  // 仿真状态
  simStatus: SimulationStatus;  // 'idle' | 'preparing' | 'ready' | 'recording' | 'complete' | 'cooling'
  
  // 系统消息
  messages: SystemMessage[];
  
  // 温漂计算
  temperatureDrift: number;
  
  // UI 状态
  activeTab: 'test' | 'history' | 'calibration';
}
```

### 工具库

| 文件 | 功能 |
|------|------|
| `lib/auth.ts` | 用户登录验证，检查用户名、密码与角色匹配 |
| `lib/constants.ts` | 仿真参数常量（温度阈值、速率等）、状态颜色映射、状态标签文本 |
| `lib/prisma.ts` | Prisma Client 单例（开发环境下通过 globalThis 缓存避免热重载重复创建） |
| `lib/simulation-engine.ts` | 仿真引擎核心（详见[仿真引擎](#仿真引擎)章节） |
| `lib/types.ts` | 全局 TypeScript 类型定义 |

---

## 仿真参数配置

所有仿真参数集中在 `src/lib/constants.ts` 中，可根据需要调整：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `TICK_INTERVAL_MS` | 800ms | 仿真引擎更新间隔 |
| `TARGET_TEMP` | 750°C | 目标稳定温度 |
| `STABLE_TEMP_MIN` | 745°C | 稳定温度下限 |
| `STABLE_TEMP_MAX` | 755°C | 稳定温度上限 |
| `HEATING_RATE_PER_SECOND` | 40°C/s | 升温速率 |
| `INITIAL_FURNACE_TEMP` | 720°C | 初始炉温（设置为接近目标温度以方便演示） |
| `STANDARD_DURATION_SECONDS` | 3600s | 标准试验时长（1 小时） |
| `TEMP_FLUCTUATION` | 0.5°C | 温度随机噪声幅度 |
| `COOLING_RATE_PER_SECOND` | 2°C/s | 降温速率 |
| `SURFACE_TEMP_RATIO` | 0.95 | 表面温相对炉温的比例 |
| `CENTER_TEMP_RATIO` | 0.85 | 中心温相对炉温的比例 |
| `BATCH_WRITE_INTERVAL_SECONDS` | 5s | 温度数据批量写入间隔 |
| `CHART_WINDOW_SECONDS` | 600s | 温度曲线图显示窗口（10 分钟） |

---

## 判定标准

试验结果判定基于 ISO 11820 标准，需**同时满足**以下三项条件方为"**通过**"：

| 判定项 | 字段 | 不通过条件 | 说明 |
|--------|------|-----------|------|
| **样品温升** | `deltatf` | > 50°C | 试验前后样品温度升高超过 50°C |
| **失重率** | `lostweightPer` | > 50% | 试验后质量损失超过 50% |
| **火焰持续时间** | `flameduration` | ≥ 5 秒 | 样品出现火焰且持续时间达到 5 秒或以上 |

> 三项中任意一项不满足，结果即为"**不通过**"。

---

## 数据导出

系统支持三种导出格式，均通过 API 端点实现：

### CSV 导出 (`/api/export/csv`)

- 内容：每秒温度数据明细
- 编码：UTF-8 with BOM（兼容 Excel 中文显示）
- 格式：`Time,Temp1,Temp2,TempSurface,TempCenter,TempCalibration`

### Excel 导出 (`/api/export/excel`)

- 库：exceljs（支持图表嵌入）
- 包含 3 个工作表：
  1. **试验信息**：样品信息、操作员、时间、质量变化等
  2. **温度数据**：每秒 5 通道温度明细
  3. **判定结论**：三项指标 + 最终结果
- 内嵌温度曲线图表

### PDF 导出 (`/api/export/pdf`)

- 库：jspdf + jspdf-autotable
- A4 纸格式
- 包含内容：
  - 试验概要信息
  - 关键温度数据
  - 判定结论
- **注意**：中文显示需要系统安装中文字体（如黑体 SimHei）

---

## 用户角色

| 角色 | 用户名 | 默认密码 | 权限说明 |
|------|--------|---------|---------|
| **管理员** | admin | 123456 | 全部功能权限，可管理设备信息和用户 |
| **试验员** | experimenter | 123456 | 执行试验流程，查看历史，导出数据 |

> 登录时选择角色后，系统自动确定用户名，只需输入密码即可。

---

## UI 设计说明

系统 UI 采用**暗色实验室主题**，模仿专业试验设备的操作面板风格：

- **配色方案**：
  - 主背景：`#1a1a2e`（深蓝黑）
  - 面板背景：`#16213e`（深蓝）
  - 强调色：`#0f3460`（中蓝）
  - 高亮色：`#e94560`（红色强调）、`#00ff88`（绿色通过）
  - 文字色：`#e0e0e0`（浅灰白）

- **LED 数字显示效果**：
  ```css
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 10px currentColor;
  background: #0a0a0a;
  border-radius: 4px;
  ```

- **状态指示灯**：圆形 LED 风格，不同状态不同颜色和闪烁效果
- **响应式布局**：使用 Tailwind CSS Grid，在 1280px+ 分辨率下呈两栏布局

---

## 环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 数据库连接字符串 | `postgresql://postgres:password@localhost:5432/iso11820?schema=public` |
| `NEXT_PUBLIC_APP_NAME` | 应用名称（页面标题） | `ISO 11820 建材不燃性试验仿真系统` |
| `BASE_DIR` | 数据文件基础目录 | `./data` |

---

## 开发指南

### 添加新的传感器通道

1. 在 `src/lib/types.ts` 的 `TemperatureData` 接口中添加新字段
2. 在 `prisma/schema.prisma` 的 `temperature_data` 模型中添加对应列
3. 在 `src/lib/simulation-engine.ts` 的 `calculateTemperatures()` 中添加计算逻辑
4. 在 `TemperatureDisplay.tsx` 中添加显示组件
5. 在 `TemperatureChart.tsx` 中添加图表线

### 修改仿真算法

仿真核心逻辑位于 `src/lib/simulation-engine.ts`，主要方法：
- `startHeating()` — 开始升温
- `stopHeating()` — 停止升温
- `startRecording()` — 开始记录
- `stopRecording()` — 停止记录
- `tick()` — 每次定时循环的核心方法
- `calculateTemperatures()` — 温度计算

### 添加新的 API 端点

在 `src/app/api/` 下创建新目录和 `route.ts` 文件：

```typescript
// src/app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 处理逻辑
  return NextResponse.json({ data: '...' });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // 处理逻辑
  return NextResponse.json({ success: true });
}
```

### 数据库迁移

修改 `prisma/schema.prisma` 后：

```bash
# 创建迁移并生成 Client
npx prisma migrate dev --name describe_your_change

# 或在开发阶段直接推送（不保留迁移历史）
npm run db:push
npm run db:generate
```

### 代码规范建议

- 所有 API 返回统一使用 `NextResponse.json()`
- 仿真引擎通过 `globalThis` 单例访问，不要重复实例化
- 温度数据写入使用批量 `createMany`，避免逐条写入
- SSE 连接通过 `EventSource` 建立，注意浏览器的连接限制

---

## 许可证

本项目为内部使用项目，仅供学习和参考。

---

