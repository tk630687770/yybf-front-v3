# 项目结构

## 目录树

```
yybf-front-v3/
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   ├── api/                    # 接口层
│   │   ├── request.ts         # Axios 封装，含拦截器和错误处理
│   │   └── modules/            # 分模块接口
│   │       └── lottery.ts     # 彩票相关接口
│   │
│   ├── assets/                 # 静态资源
│   │   └── (默认文件)
│   │
│   ├── components/             # 组件
│   │   ├── common/             # 通用组件
│   │   └── lottery/            # 业务组件
│   │       ├── BallBall.vue        # 球展示组件
│   │       ├── LatestDrawInfo.vue  # 最新开奖信息组件
│   │       ├── WindowLevelPanel.vue # 窗口等级面板组件
│   │       ├── WindowLevelTable.vue  # 窗口等级表格组件
│   │       └── WindowStatusModal.vue # 窗口状态弹窗组件
│   │
│   ├── composables/            # 组合式函数
│   │   └── useDatabase.ts      # IndexedDB 数据库封装（Dexie.js）
│   │
│   ├── stores/                 # Pinia Store
│   │   └── lottery.ts         # 彩票业务状态管理
│   │
│   ├── types/                  # TypeScript 类型定义
│   │   └── index.ts           # 包含 DrawRecord、WindowRecord、WindowLevelEnum 等
│   │
│   ├── utils/                  # 工具函数
│   │   └── (按需添加)
│   │
│   ├── router/                 # 路由配置
│   │   └── index.ts           # Vue Router，启用 KeepAlive
│   │
│   ├── views/                  # 页面组件
│   │   ├── Home.vue           # 首页占位组件
│   │   ├── WindowConsole.vue  # 基础窗口操作台页面
│   │   └── ModelDashboard.vue # 模型预测/诊断结果台页面
│   │
│   ├── App.vue
│   ├── main.ts
│   ├── style.css
│   └── env.d.ts
│
├── docs/                       # 文档
│   ├── project-structure.md
│   └── frontend-module-plan.md # 前端模块拆分规划
│
├── .skill-creator/             # AI 上下文/SKILL
│   └── shuangseqiu-project.md  # 项目上下文文档
│
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
└── tsconfig.json
```

## 核心文件说明

| 文件 | 说明 |
|------|------|
| `src/api/request.ts` | Axios 封装，含请求/响应拦截器，环境变量配置 |
| `src/api/modules/lottery.ts` | 彩票业务接口封装 |
| `src/composables/useDatabase.ts` | Dexie.js 数据库封装，含所有表操作 |
| `src/stores/lottery.ts` | Pinia Store，含状态和 actions |
| `src/router/index.ts` | Vue Router 配置，启用 KeepAlive |
| `src/types/index.ts` | TypeScript 类型定义 |
| `src/views/Home.vue` | 首页占位组件，默认入口由路由重定向处理 |
| `src/views/WindowConsole.vue` | 基础窗口操作台页面，承载开奖、窗口矩阵、模拟选择、窗口同步 |
| `src/views/ModelDashboard.vue` | 模型预测/诊断结果台页面，承载红蓝合并预测和10注6+1单式方案 |
| `src/api/modules/modelPrediction.ts` | 模型预测接口封装 |
| `docs/frontend-module-plan.md` | 基础窗口操作台与模型预测/诊断结果台的拆分规划 |

## 数据库结构（ssqDB）

### 表清单

| 表名 | 主键 | 说明 |
|------|------|------|
| `drawRecords` | qiHao | 开奖记录表 |
| `myNumbers` | ++id | 用户方案表（已废弃） |
| `windowData` | id | 窗口数据表 |
| `windowStatistics` | id | 窗口统计数据表 |
| `windowDataMeta` | enumKey | 窗口数据元信息表 |
| `allQihaoList` | qiHao | 期号列表表 |

### 表结构详情

#### drawRecords（开奖记录表）
```typescript
interface DrawRecord {
  id: number;                      // 数据ID
  qiHao: string;                   // 期号
  dateAndWeek: string;            // 开奖日期和星期
  red1-red6: string;              // 红球1-6
  blue: string;                   // 蓝球
  lastRepeatReds: string;         // 上期重复红球
  lastRepeatPrimes: string;       // 上期重复质数
  lastNeighborReds: string;       // 上期邻码红球
  lastRepeatTails: string;        // 上期重复尾数
  tails: string;                   // 尾数汇总
  nextQiHao: string;              // 下期期号
  // ... 其他字段
}
```

#### windowData（窗口数据表）
```typescript
interface WindowDataRecord {
  id: string;                      // 主键：enumKey_qiHao_number
  enumKey: WindowLevelEnum;        // 枚举类型
  qiHao: string;                   // 期号
  data: WindowRecord;             // 窗口数据
}

interface WindowRecord {
  number: string;     // 球号码
  count: number;      // 出现次数
  previousRec: number; // 上上期遗漏值（0未命中，1命中，2邻号）
  currentRec: number; // 上期遗漏值
  willDown: number;   // 预计下落次数
  willOut: number;    // 预计遗漏次数
}
```

#### windowStatistics（窗口统计数据表）
```typescript
interface WindowStatisticsRecord {
  id: string;                       // 主键：enumKey
  enumKey: WindowLevelEnum;         // 枚举类型
  latestQiHao: string | null;      // 最新期号
  data: WindowLevelStatistics[];    // 统计数据
}

interface WindowLevelStatistics {
  level: number;      // 等级
  list: Array<{
    number: number;    // 号码
    count: number;     // 出现次数
    proportion: number; // 出现比例
  }>;
}
```

#### windowDataMeta（窗口数据元信息表）
```typescript
interface WindowDataMeta {
  enumKey: WindowLevelEnum;     // 枚举类型
  label: string;                // 中文名称
  latestQiHao: string | null;   // 最新期号
}
```

#### allQihaoList（期号列表表）
```typescript
interface QiHaoListRecord {
  qiHao: string;  // 主键，期号
}
```

期号本身按时间排序（字符串排序=时间排序）。

## 窗口等级枚举

```typescript
const WindowLevelEnum = {
  RED_NUMBER_10: 'RED_NUMBER_10',   // 红球10窗口
  RED_NUMBER_20: 'RED_NUMBER_20',   // 红球20窗口
  RED_NUMBER_33: 'RED_NUMBER_33',   // 红球33窗口
  BLUE_NUMBER_10: 'BLUE_NUMBER_10', // 蓝球10窗口
  BLUE_NUMBER_16: 'BLUE_NUMBER_16', // 蓝球16窗口
  BLUE_NUMBER_32: 'BLUE_NUMBER_32', // 蓝球32窗口
  RED_TAIL_10: 'RED_TAIL_10',       // 红尾10窗口
  RED_TAIL_20: 'RED_TAIL_20',       // 红尾20窗口
  RED_TAIL_33: 'RED_TAIL_33',       // 红尾33窗口
  BLUE_TAIL_10: 'BLUE_TAIL_10',     // 蓝尾10窗口
  BLUE_TAIL_16: 'BLUE_TAIL_16',     // 蓝尾16窗口
  BLUE_TAIL_32: 'BLUE_TAIL_32'      // 蓝尾32窗口
};
```

## 行列折叠功能

### 功能概述
- 支持以等级为单位的行折叠（4个子行作为一个折叠单元）
- 支持以列为单位的列折叠
- 模拟模式下自动展开包含球的折叠区域

### 数据结构

```typescript
// 折叠范围
interface FoldedRange {
  start: number;  // 起始等级/列索引
  end: number;    // 结束等级/列索引
}

// 行折叠状态
interface RowFoldState {
  foldedRanges: FoldedRange[];
  manuallyModified?: boolean;  // 是否用户手动修改过
}

// 列折叠状态
interface ColFoldState {
  foldedRanges: FoldedRange[];
  manuallyModified?: boolean;
}
```

### 核心函数

| 函数名 | 说明 |
|--------|------|
| `foldSelectedLevels` | 折叠选中的等级范围 |
| `unfoldLevel` | 展开指定等级 |
| `unfoldRange` | 展开范围内所有等级 |
| `joinFoldRange` | 将等级加入相邻折叠范围 |
| `foldSelectedCols` | 折叠选中的列范围 |
| `unfoldColIndex` | 展开指定列 |
| `unfoldColRange` | 展开列范围 |
| `joinColFoldRange` | 将列加入相邻折叠范围 |
| `autoFoldEmptyRows` | 自动折叠空行 |
| `autoFoldEmptyCols` | 自动折叠空列 |
| `autoUnfoldRowsForKey` | 自动展开所有包含球的折叠行 |
| `autoUnfoldColsForKey` | 自动展开所有包含球的折叠列 |

### 自动折叠规则
- 页面初始化时自动折叠空行（没有球的等级）
- 页面初始化时自动折叠空列（所有等级都没有球的列）
- 只折叠没有数据的区域，保留有球的区域
- 用户手动折叠后不会自动覆盖

### 模拟模式联动
- 开启模拟模式时，自动展开所有包含降级后球的折叠行和折叠列
- 升降级操作触发折叠区域自动展开
- 联动变化也会触发相关分栏的自动展开

## 开发规范

### 代码注释

**所有代码必须添加中文注释**，包括但不限于：

- 文件顶部的文件说明注释
- 每个函数/方法的功能说明
- 关键逻辑的中文解释
- 类型定义的注释

### 组件规范

- 使用 `<script setup lang="ts">` 语法
- 组件文件：PascalCase 命名
- 业务组件放在 `components/lottery/`
- 通用组件放在 `components/common/`

### 组件说明

#### BallBall.vue
球展示组件，用于显示开奖结果中的球。支持普通球和胆码球两种模式，显示球的颜色和可选状态。

#### LatestDrawInfo.vue
最新开奖信息组件，显示最新一期开奖结果，包含红球、蓝球、尾数、质数等信息，以及初始化和刷新按钮。

#### WindowLevelPanel.vue
窗口等级面板组件，核心组件，包含：
- 标签切换区（12种窗口类型，按红球、蓝球、红尾、蓝尾分组展示）
- 选择数据统计区（已选/排除红球、蓝球、红尾、蓝尾，奇偶质统计）
- 窗口等级表格区
- 模拟模式开关

#### WindowLevelTable.vue
窗口等级表格组件，核心表格组件，包含：
- 表格头部（等级、号码、次数、比例、索引）
- index=0 占位圆圈
- 数据填充区
- 热力图颜色渲染
- 球状态管理和交互

#### WindowStatusModal.vue
窗口状态弹窗组件，显示各窗口数据的更新状态，按钮颜色指示数据是否过期。

### 示例

```typescript
// 文件顶部注释：说明文件用途
import { ref } from 'vue';

/**
 * 获取用户信息
 * @param id 用户ID
 * @returns 用户信息对象
 */
function getUserInfo(id: number) {
  // 声明响应式变量
  const userInfo = ref(null);

  // 调用接口获取数据
  // TODO: 实际实现

  return userInfo;
}
```
