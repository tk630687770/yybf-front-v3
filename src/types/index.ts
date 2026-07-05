/**
 * 开奖记录类型定义
 * 用于描述双色球每期开奖的基本信息
 */
export interface DrawRecord {
  id: number;                      // 数据ID
  qiHao: string;                   // 期号，如 "2026048"
  dateAndWeek: string;            // 开奖日期和星期，如 "2026-04-30(四)"
  red1: string;                    // 红球1
  red2: string;                    // 红球2
  red3: string;                    // 红球3
  red4: string;                    // 红球4
  red5: string;                    // 红球5
  red6: string;                    // 红球6
  blue: string;                    // 蓝球
  lastRepeatReds: string;          // 上期重复的红球
  lastRepeatRedsCount: number;     // 上期重复红球数量
  lastRepeatPrimes: string;        // 上期重复的质数
  lastRepeatPrimesCount: number;   // 上期重复质数数量
  lastNeighborReds: string;        // 上期邻码红球
  lastNeighborRedsCount: number;   // 上期邻码红球数量
  lastRepeatTails: string;         // 上期重复尾数
  lastRepeatTailsCount: number;    // 上期重复尾数数量
  year: string;                    // 年份
  reds: string;                    // 红球汇总字符串，如 "09,15,18,24,28,33"
  primeNumbers: string;           // 质数汇总
  primeCount: number;              // 质数数量
  tail1: string;                  // 尾数1
  tail2: string;                  // 尾数2
  tail3: string;                  // 尾数3
  tail4: string;                  // 尾数4
  tail5: string;                  // 尾数5
  tail6: string;                  // 尾数6
  tails: string;                  // 尾数汇总字符串
  nextQiHao: string;              // 下期期号
}

/**
 * 窗口数据单条记录
 * 用于描述某个窗口等级下每期每球的统计数据
 */
export interface WindowRecord {
  id: number;          // 数据ID
  qiHao: string;       // 期号
  number: string;      // 红球号码（或蓝球、尾数）
  count: number;       // 出现次数
  previousRec: number; // 上上期遗漏值
  currentRec: number;  // 上期遗漏值
  willDown: number;    // 预计下落次数
  willOut: number;     // 预计遗漏次数
}

/**
 * 窗口等级枚举
 * 用于指定不同粒度的窗口统计
 */
export const WindowLevelEnum = {
  RED_NUMBER_3: 'RED_NUMBER_3',
  RED_NUMBER_4: 'RED_NUMBER_4',
  RED_NUMBER_5: 'RED_NUMBER_5',
  RED_NUMBER_6: 'RED_NUMBER_6',
  RED_NUMBER_8: 'RED_NUMBER_8',
  RED_NUMBER_10: 'RED_NUMBER_10',
  RED_NUMBER_20: 'RED_NUMBER_20',
  RED_NUMBER_33: 'RED_NUMBER_33',
  BLUE_NUMBER_10: 'BLUE_NUMBER_10',
  BLUE_NUMBER_16: 'BLUE_NUMBER_16',
  BLUE_NUMBER_32: 'BLUE_NUMBER_32',
  RED_TAIL_3: 'RED_TAIL_3',
  RED_TAIL_4: 'RED_TAIL_4',
  RED_TAIL_5: 'RED_TAIL_5',
  RED_TAIL_6: 'RED_TAIL_6',
  RED_TAIL_8: 'RED_TAIL_8',
  RED_TAIL_10: 'RED_TAIL_10',
  RED_TAIL_20: 'RED_TAIL_20',
  RED_TAIL_33: 'RED_TAIL_33',
  BLUE_TAIL_10: 'BLUE_TAIL_10',
  BLUE_TAIL_16: 'BLUE_TAIL_16',
  BLUE_TAIL_32: 'BLUE_TAIL_32'
} as const;

export type WindowLevelEnum = typeof WindowLevelEnum[keyof typeof WindowLevelEnum];

/**
 * 窗口等级统计数据
 * 包含等级和对应的统计列表
 */
export interface WindowLevelStatistics {
  level: number;  // 等级
  list: Array<{   // 统计列表
    number: number;    // 号码
    count: number;     // 出现次数
    proportion: number; // 出现比例
  }>;
}

/**
 * 用户方案数据
 * 用于存储用户保存的选号方案
 */
export interface MyNumber {
  id?: number;              // 自增主键
  qiHao: string;            // 期号
  red1: string;             // 红球1
  red2: string;             // 红球2
  red3: string;             // 红球3
  red4: string;             // 红球4
  red5: string;             // 红球5
  red6: string;             // 红球6
  blue: string;             // 蓝球
  createTime: number;       // 创建时间戳
}

/**
 * 同步状态类型
 */
export const SyncStatus = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR: 'error'
} as const;

export type SyncStatus = typeof SyncStatus[keyof typeof SyncStatus];

/**
 * 同步状态信息
 */
export interface SyncState {
  lastSyncTime: number | null;  // 上次同步时间
  status: SyncStatus;          // 当前同步状态
}

/**
 * 窗口等级枚举项
 * 用于展示和操作
 */
export interface WindowLevelEnumItem {
  key: WindowLevelEnum;       // 枚举值
  label: string;              // 枚举说明
  category: string;           // 类别分组（RED_NUMBER/BLUE_NUMBER/RED_TAIL/BLUE_TAIL）
}

/**
 * 窗口数据状态信息
 * 用于记录每个枚举对应的窗口数据状态
 */
export interface WindowDataInfo {
  enumKey: WindowLevelEnum;   // 枚举值
  label: string;              // 中文名称
  latestQiHao: string | null; // 最新期号
}

/**
 * 窗口统计数据状态信息
 * 用于记录每个枚举对应的窗口统计数据状态
 */
export interface WindowStatisticsInfo {
  enumKey: WindowLevelEnum;   // 枚举值
  latestQiHao: string | null; // 最新期号
}

/**
 * 期号列表记录
 * 用于存储所有期号，期号本身按时间排序（字符串排序=时间排序）
 */
export interface QiHaoListRecord {
  qiHao: string;  // 主键，期号
}
