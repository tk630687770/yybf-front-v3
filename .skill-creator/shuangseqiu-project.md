# 双色球选号工具项目上下文

## 项目信息

- 项目名称：yybf-front-v3
- 项目类型：前端单页应用
- 核心功能：双色球选号工具，后端数据本地缓存，离线展示，支持窗口等级统计、号码联动选择、模拟模式等功能

## 技术栈

| 技术 | 用途 |
|------|------|
| Vue 3 + Composition API | 框架，使用 `<script setup>` |
| Vite | 构建工具 |
| TypeScript | 语言 |
| Dexie.js | IndexedDB 封装 |
| Pinia | 状态管理 |
| Vue Router | 路由，启用 KeepAlive |
| Tailwind CSS | 样式（暗色主题） |

## 目录结构

```
src/
├── api/
│   ├── request.ts          # Axios 封装，含拦截器
│   └── modules/
│       └── lottery.ts     # 彩票业务接口
├── composables/
│   └── useDatabase.ts     # IndexedDB 数据库封装（Dexie.js）
├── stores/
│   └── lottery.ts         # Pinia Store
├── types/
│   └── index.ts            # 类型定义
├── router/
│   └── index.ts            # 路由配置
├── views/
│   └── Home.vue            # 首页
└── components/lottery/     # 业务组件
    ├── BallBall.vue
    ├── LatestDrawInfo.vue
    ├── WindowDataModal.vue
    ├── WindowLevelPanel.vue
    ├── WindowLevelTable.vue
    └── WindowStatusModal.vue
```

## 数据库（ssqDB）

### 表结构

| 表名 | 主键 | 说明 |
|------|------|------|
| `drawRecords` | qiHao | 开奖记录表 |
| `windowData` | id (enumKey_qiHao_number) | 窗口数据表 |
| `windowStatistics` | id (enumKey) | 窗口统计数据表 |
| `windowDataMeta` | enumKey | 窗口数据元信息表 |

### 窗口数据（windowData）

每枚举每期独立存储，主键格式：`${enumKey}_${qiHao}_${number}`

### 窗口统计数据（windowStatistics）

每枚举独立存储一条记录，包含 latestQiHao 和 data 数组。

## 类型定义

### WindowLevelEnum

```typescript
const WindowLevelEnum = {
  RED_NUMBER_10: 'RED_NUMBER_10',   // 红球10窗口
  RED_NUMBER_20: 'RED_NUMBER_20',   // 红球20窗口
  RED_NUMBER_33: 'RED_NUMBER_33',   // 红球33窗口
  BLUE_NUMBER_10: 'BLUE_NUMBER_10', // 蓝球10窗口
  BLUE_NUMBER_16: 'BLUE_NUMBER_16', // 蓝球16窗口
  RED_TAIL_10: 'RED_TAIL_10',       // 红尾10窗口
  RED_TAIL_20: 'RED_TAIL_20',       // 红尾20窗口
  RED_TAIL_33: 'RED_TAIL_33',       // 红尾33窗口
  BLUE_TAIL_10: 'BLUE_TAIL_10',     // 蓝尾10窗口
  BLUE_TAIL_16: 'BLUE_TAIL_16'      // 蓝尾16窗口
};
```

### WindowRecord（窗口数据单条记录）

```typescript
interface WindowRecord {
  number: string;      // 球号码
  count: number;       // 出现次数
  previousRec: number; // 上上期遗漏值（0未命中，1命中，2邻号）
  currentRec: number;  // 上期遗漏值
  willDown: number;    // 预计下落次数（=1时显示⬇️降级标识）
  willOut: number;     // 预计遗漏次数
}
```

### WindowLevelStatistics（窗口等级统计数据）

```typescript
interface WindowLevelStatistics {
  level: number;  // 等级
  list: Array<{
    number: number;    // 号码
    count: number;     // 出现次数
    proportion: number; // 出现比例
  }>;
}
```

### 球色球种分类

| 球种 | 枚举 | 说明 |
|------|------|------|
| 红球号码 | RED_NUMBER_10, RED_NUMBER_20, RED_NUMBER_33 | category: 'RED_NUMBER' |
| 蓝球号码 | BLUE_NUMBER_10, BLUE_NUMBER_16, BLUE_NUMBER_32 | category: 'BLUE_NUMBER' |
| 红球尾数 | RED_TAIL_10, RED_TAIL_20, RED_TAIL_33 | category: 'RED_TAIL' |
| 蓝球尾数 | BLUE_TAIL_10, BLUE_TAIL_16, BLUE_TAIL_32 | category: 'BLUE_TAIL' |

## 核心组件

### WindowLevelPanel.vue（窗口等级面板）

核心面板组件，包含：
- 标签切换区：12种窗口类型，点击切换显示对应内容
- 选择数据统计区：实时统计已选/排除的红球、蓝球、红尾、蓝尾
- 窗口等级表格区：显示窗口数据
- 模拟模式开关：控制模拟模式开启/关闭

### WindowLevelTable.vue（窗口等级表格）

核心表格组件，包含：
- 表头：等级、号码、次数、比例、索引
- index=0 占位圆圈：黑色边框透明背景圆形占位符
- 数据填充区：根据窗口数据填充号码
- 热力图颜色渲染：根据 proportion 值渲染背景色
- 球状态管理和交互

### LatestDrawInfo.vue（开奖信息组件）

显示最新一期开奖结果，包含红球、蓝球、尾数、质数等信息，以及初始化和刷新按钮。

### WindowStatusModal.vue（窗口状态弹窗）

显示各窗口数据的更新状态，按钮颜色指示数据是否过期。

## 号码状态与交互

### 球状态

| 状态值 | 含义 | 背景色 |
|--------|------|--------|
| -1 | 排除 | 灰色 |
| 0 | 未选 | 透明 |
| 1 | 已选 | 红色 |

### 边框颜色（根据 previousRec）

| 值 | 含义 | 边框色 |
|-----|------|--------|
| 0 | 未命中 | 白色/透明 |
| 1 | 命中 | 黄色 |
| 2 | 邻号 | 紫色 |

### 交互规则

- 左键点击：状态 +1（-1→0→1→循环结束，无法再增加）
- 右键点击：状态 -1（1→0→-1→循环结束，无法再减少）

### 联动规则

同球色球种的窗口之间号码状态同步变化。例如：
- 在 RED_NUMBER_10 窗口选择了号码 22
- 则 RED_NUMBER_20、RED_NUMBER_33 中的号码 22 也会同步变为相同状态

## 模拟模式

### 关闭状态
- 所有红球的位置是非模拟位置（初始位置 = count）
- 所有红球的状态正常变更
- 不会发生位移
- 所有 ⬇️ 降级标识都是蓝色

### 开启状态
- 记录每球的模拟位置 = 初始位置 - willDown
- 状态 0 和 -1 对应模拟位置的初始位置
- 状态 1 对应模拟位置的上移限位（初始位置 + 1）
- 号码移动受上移限位控制
- ⬇️ 降级标识颜色：初始位置时灰色，上移限位时蓝色

## API 接口

详见 `src/api/modules/lottery.ts`

### 主要接口

- `getDrawData`：获取开奖数据（GET，参数 qiHao）
- `initWindowData`：初始化窗口数据（GET）
- `getAllWindowData`：获取所有窗口数据（GET）
- `syncWindowData`：同步窗口数据（GET，参数 qiHao）
- `getWindowLevelStatistics`：获取窗口等级统计数据（GET，参数 type）

### 响应格式

```typescript
interface ApiResponse<T> {
  code: number;      // 200 表示成功
  msg: string;        // 消息
  data: T | null;    // 数据
}
```

## 数据流

```
后端 API → IndexedDB (ssqDB) → Pinia Store → 组件展示
```

## 开发规范

### 代码注释

**所有代码必须添加中文注释**，包括：
- 文件顶部的文件说明注释
- 每个函数/方法的功能说明
- 关键逻辑的中文解释
- 类型定义的注释

### 组件规范

- 组件使用 `<script setup lang="ts">`
- 组件命名：PascalCase
- 业务组件放在 `components/lottery/`
- 通用组件放在 `components/common/`

## 环境变量

- `VITE_API_BASE_URL`：后端 API 地址，默认 `http://localhost:8000`
