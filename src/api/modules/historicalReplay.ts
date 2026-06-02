/**
 * 历史开奖前视角回放接口封装
 * 用于运行、查询和查看历史回放实验结果。
 */
import { request } from '../request';
import type { ApiResponse } from '../request';

/**
 * 历史回放运行参数
 */
export interface HistoricalReplayRunParams {
  strategyCode?: string;     // 策略编码，例如 OFFICIAL_V1
  experimentName?: string;   // 实验名称
  startQiHao?: string;       // 起始期号
  endQiHao?: string;         // 结束期号
  recentLimit?: number;      // 最近回放期数
  ticketLimit?: number;      // 10注6+1票面数量
  saveResult?: boolean;      // 是否保存实验结果
}

/**
 * 历史回放逐期明细
 */
export interface HistoricalReplayPeriodResult {
  predictQiHao: string;             // 预测期号
  actualRedNumbers: string[];       // 实际红球
  actualBlueNumber: string;         // 实际蓝球
  mainTicketText: string;           // 主推荐票面
  ninePlusOneRedNumbers: string[];  // 9+1反推红池
  reverseDanNumber: string | null;  // 胆候选
  bestSingleTicketText: string;     // 10注中最佳票面
  mainRedHitCount: number;          // 主推荐红球命中数
  bestTicketRedHitCount: number;    // 10注最高红球命中数
  blueHit: boolean;                 // 10注是否有蓝球命中
  prizeAmount: number;              // 奖金
  costAmount: number;               // 成本
  netAmount: number;                // 净收益
  prizeLevel: string;               // 最佳奖级
  redHitNumbers: string[];          // 最佳票命中红球
  redMissNumbers: string[];         // 最佳票漏掉红球
  blueCandidateHitRank: number | null; // 蓝球候选命中排名
  originalEntryPool?: string[];     // 观察策略原始入口池
  fusedEntryPool?: string[];        // 观察策略融合入口池
  fusedEntryAddedNumbers?: string[]; // 观察策略融合新增号码
  originalEntryHitNumbers?: string[]; // 原始入口池命中红球
  fusedEntryHitNumbers?: string[];  // 融合入口池命中红球
}

/**
 * 历史回放完整结果
 */
export interface HistoricalReplayResult {
  experimentId: number | null;                    // 实验ID
  saved: boolean;                                 // 是否已保存
  experimentName: string;                         // 实验名称
  strategyCode: string;                           // 策略编码
  strategyVersion: string;                        // 策略版本
  startQiHao: string;                             // 起始期号
  endQiHao: string;                               // 结束期号
  recentLimit: number;                            // 最近期数
  periodCount: number;                            // 有效期数
  skippedCount: number;                           // 跳过期数
  ticketLimit: number;                            // 单期票面数量
  totalCost: number;                              // 总成本
  totalPrize: number;                             // 总奖金
  totalNet: number;                               // 总净收益
  returnRate: number;                             // 回收率
  mainRedAvgHit: number;                          // 主推荐平均红球命中
  bestTicketRedAvgHit: number;                    // 10注最高平均红球命中
  blueHitRate: number;                            // 蓝球命中率
  prizeHitRate: number;                           // 中奖率
  atLeast3RedRate: number;                        // 至少3红比例
  atLeast4RedRate: number;                        // 至少4红比例
  maxRedHit: number;                              // 最高红球命中数
  bestRedHitDistribution: Record<string, number>; // 最高红球命中分布
  bestPrizeDistribution: Record<string, number>;  // 最佳奖级分布
  strategyParams: Record<string, unknown>;        // 策略参数
  dataBoundaryNote: string;                       // 数据边界说明
  elapsedMs: number;                              // 服务端耗时
  periods: HistoricalReplayPeriodResult[];        // 逐期明细
  conclusion: string;                             // 结论
}

/**
 * 历史回放实验摘要
 */
export interface HistoricalReplayExperimentSummary {
  experimentId: number;          // 实验ID
  experimentName: string;        // 实验名称
  strategyCode: string;          // 策略编码
  strategyVersion: string;       // 策略版本
  startQiHao: string;            // 起始期号
  endQiHao: string;              // 结束期号
  recentLimit: number;           // 最近期数
  periodCount: number;           // 有效期数
  totalCost: number;             // 总成本
  totalPrize: number;            // 总奖金
  totalNet: number;              // 总净收益
  returnRate: number;            // 回收率
  bestTicketRedAvgHit: number;   // 10注最高平均红球命中
  blueHitRate: number;           // 蓝球命中率
  elapsedMs: number;             // 服务端耗时
  createdAt: string;             // 创建时间
}

/**
 * 运行历史回放实验
 * @param params 回放参数
 * @returns 历史回放结果
 */
export async function runHistoricalReplay(
  params: HistoricalReplayRunParams
): Promise<ApiResponse<HistoricalReplayResult>> {
  // 100期回放可能超过默认60秒，因此单独拉长超时时间。
  return request.get('/ssq/window/axis/replay/historical/run', {
    params,
    timeout: 300000
  });
}

/**
 * 查询已保存历史回放实验列表
 * @param limit 返回数量
 * @returns 实验摘要列表
 */
export async function listHistoricalReplayExperiments(
  limit = 20
): Promise<ApiResponse<HistoricalReplayExperimentSummary[]>> {
  return request.get('/ssq/window/axis/replay/historical/list', {
    params: { limit }
  });
}

/**
 * 查询历史回放实验详情
 * @param experimentId 实验ID
 * @returns 实验详情
 */
export async function getHistoricalReplayDetail(
  experimentId: number
): Promise<ApiResponse<HistoricalReplayResult>> {
  return request.get('/ssq/window/axis/replay/historical/detail', {
    params: { experimentId }
  });
}
