/**
 * 红球入口池召回专项接口封装。
 * 该模块只负责严格前视入口实验，不影响实时预测、快照复盘和普通诊断接口。
 */
import { request } from '../request';
import type { ApiResponse } from '../request';

/**
 * 入口评分标准化方式。
 */
export type EntryRecallNormalizationMethod = 'RAW' | 'MIN_MAX' | 'RANK_PERCENTILE';

/**
 * 入口组件配置。
 */
export interface EntryRecallComponentConfig {
  componentCode: string;                              // 独立组件编码
  weight: number;                                     // 组合权重
  normalizationMethod: EntryRecallNormalizationMethod; // 标准化方式
}

/**
 * 入口实验运行请求。
 */
export interface EntryRecallExperimentRequest {
  experimentName?: string;                            // 实验名称
  researchType?: string;                              // 研究类型
  strategyCode?: string;                              // 策略编码
  strategyVersion?: string;                           // 策略版本
  components: EntryRecallComponentConfig[];           // 参与实验的独立组件
  combineConfig: Record<string, unknown>;              // 组合算法和算法参数
  entrySizes: number[];                               // 同时评价的入口规模
  startQiHao?: string;                                // 起始期号
  endQiHao?: string;                                  // 结束期号
  recentLimit?: number;                               // 最近期数
  saveResult: boolean;                                // 是否正式保存
}

/**
 * 单个入口规模统一评价指标。
 */
export interface EntryRecallEntrySizeMetric {
  entrySize: number;                                  // 入口规模
  averageHitCount: number;                            // 平均命中数
  minimumHitCount: number;                            // 最低命中数
  maximumHitCount: number;                            // 最高命中数
  lowHitRate: number;                                 // 0至2红比例
  atLeastFourRate: number;                            // 至少4红比例
  atLeastFiveRate: number;                            // 至少5红比例
  allSixRate: number;                                 // 完整6红比例
  randomAllSixRate: number;                           // 同规模随机完整6红概率
  allSixLift: number;                                 // 相对随机完整6红提升
  hitDistribution: Record<string, number>;            // 0至6红期数分布
}

/**
 * 已归一化红球排名。
 */
export interface EntryRecallRankedBallScore {
  number: string;                                     // 红球号码
  rawScore: number;                                   // 原始分
  normalizedScore: number;                            // 标准分
  rank: number;                                       // 最终排名
  evidence: Record<string, unknown>;                  // 组件证据
}

/**
 * 内存实验的单期评价结果。
 */
export interface EntryRecallBaselinePeriod {
  qiHao: string;                                      // 目标期号
  actualRedNumbers: string[];                         // 实际红球
  poolByEntrySize: Record<string, string[]>;           // 各入口规模候选池
  hitNumbersByEntrySize: Record<string, string[]>;     // 各入口规模命中号码
  missNumbersByEntrySize: Record<string, string[]>;    // 各入口规模遗漏号码
  hitCountByEntrySize: Record<string, number>;         // 各入口规模命中数量
  rankedScores: EntryRecallRankedBallScore[];          // 33球完整排名
}

/**
 * 统一入口召回评价结果。
 */
export interface EntryRecallBaselineResult {
  componentCode: string;                              // 组件或组合算法编码
  componentVersion: string;                           // 组件或组合算法版本
  normalizationMethod: EntryRecallNormalizationMethod | null; // 标准化方式
  periodCount: number;                                // 有效期数
  entrySizes: number[];                               // 入口规模
  metricByEntrySize: Record<string, EntryRecallEntrySizeMetric>; // 各入口规模指标
  periods: EntryRecallBaselinePeriod[];               // 逐期结果
}

/**
 * 已保存入口实验主记录。
 */
export interface EntryRecallExperimentEntity {
  id: number;                                         // 实验ID
  experimentName: string;                             // 实验名称
  experimentLabelCn: string | null;                   // 实验中文展示名
  experimentDescriptionCn: string | null;             // 实验中文说明
  experimentFingerprint: string;                      // 唯一实验指纹
  researchType: string;                               // 研究类型
  strategyCode: string;                               // 策略编码
  strategyVersion: string;                            // 策略版本
  status: string;                                     // 实验状态
  startQiHao: string;                                 // 起始期号
  endQiHao: string;                                   // 结束期号
  requestedPeriodCount: number;                       // 请求期数
  effectivePeriodCount: number;                       // 有效期数
  skippedPeriodCount: number;                         // 跳过期数
  entrySizesJson: string;                             // 入口规模JSON
  componentConfigJson: string;                        // 组件配置JSON
  combineConfigJson: string;                          // 组合配置JSON
  hitDistributionJson: string;                       // 命中分布JSON
  metricSummaryJson: string;                          // 指标摘要JSON
  componentMetricJson: string;                        // 组件指标JSON
  dataBoundaryVersion: string;                        // 数据边界版本
  dataBoundaryNote: string;                           // 数据边界说明
  conclusion: string;                                 // 实验结论
  elapsedMs: number;                                  // 服务端耗时
  createdAt: string;                                  // 创建时间
}

/**
 * 已保存实验的逐期、逐入口规模证据。
 */
export interface EntryRecallPeriodEntity {
  id: number;                                         // 记录ID
  experimentId: number;                               // 实验ID
  predictQiHao: string;                               // 目标期号
  entrySize: number;                                  // 入口规模
  entryPoolText: string;                              // 入口池号码
  actualRedText: string;                              // 实际红球
  hitRedText: string;                                 // 命中红球
  missRedText: string;                                // 遗漏红球
  hitCount: number;                                   // 命中数
  boundaryNumber: string;                             // 边界号码
  boundaryScore: number;                              // 边界分
  nearestMissNumber: string | null;                   // 最接近入口边界的遗漏号码
  nearestMissRank: number | null;                     // 最近遗漏号码排名
  nearestMissScore: number | null;                    // 最近遗漏号码分数
  nearestMissGap: number | null;                      // 与入口边界分差
  periodConclusion: string;                           // 单期结论
  createdAt: string;                                  // 创建时间
}

/**
 * 已保存实验的逐球证据。
 */
export interface EntryRecallBallScoreEntity {
  id: number;                                         // 记录ID
  experimentId: number;                               // 实验ID
  predictQiHao: string;                               // 目标期号
  number: string;                                     // 红球号码
  actualHit: number;                                  // 是否实际开奖
  finalRank: number;                                  // 最终排名
  finalScore: number;                                 // 最终分
  selectedSizesText: string;                          // 进入的入口规模
  componentScoreJson: string;                         // 各组件标准分JSON
  componentRankJson: string;                          // 各组件排名JSON
  evidenceJson: string;                               // 完整证据JSON
  eliminationReason: string;                          // 淘汰或占位说明
  createdAt: string;                                  // 创建时间
}

/**
 * 已保存实验组件指标。
 */
export interface EntryRecallComponentMetricEntity {
  id: number;                                         // 记录ID
  experimentId: number;                               // 实验ID
  componentCode: string;                              // 组件或组合编码
  componentVersion: string;                           // 版本
  componentWeight: number;                            // 权重
  entrySize: number;                                  // 入口规模
  averageHitCount: number;                            // 平均命中
  minimumHitCount: number;                            // 最低命中
  maximumHitCount: number;                            // 最高命中
  zeroToTwoRate: number;                              // 0至2红比例
  atLeastFourRate: number;                            // 至少4红比例
  atLeastFiveRate: number;                            // 至少5红比例
  allSixRate: number;                                 // 完整6红比例
  randomBaselineAllSixRate: number;                   // 随机完整6红比例
  allSixLift: number;                                 // 完整6红提升
  metricJson: string;                                 // 完整指标JSON
  createdAt: string;                                  // 创建时间
}

/**
 * 正式实验完整证据包。
 */
export interface EntryRecallExperimentBundle {
  experiment: EntryRecallExperimentEntity;            // 实验主记录
  periods: EntryRecallPeriodEntity[];                  // 逐期证据
  ballScores: EntryRecallBallScoreEntity[];            // 逐球证据
  componentMetrics: EntryRecallComponentMetricEntity[]; // 组件指标
}

/**
 * 实验运行结果。
 */
export interface EntryRecallExperimentRunResult {
  baseline: EntryRecallBaselineResult;                 // 当前运行统一评价
  saved: boolean;                                      // 是否执行保存
  duplicate: boolean;                                  // 是否命中已有指纹
  experimentId: number | null;                         // 正式实验ID
  bundle: EntryRecallExperimentBundle;                 // 当前完整证据包
}

/**
 * 时间切片指标。
 */
export interface EntryRecallTimeSliceMetric {
  sliceIndex: number;                                  // 切片序号
  startQiHao: string;                                  // 起始期号
  endQiHao: string;                                    // 结束期号
  periodCount: number;                                 // 切片期数
  metricByEntrySize: Record<string, EntryRecallEntrySizeMetric>; // 切片指标
}

/**
 * 跨时间切片波动。
 */
export interface EntryRecallStabilitySpread {
  entrySize: number;                                   // 入口规模
  minimumAverageHitCount: number;                      // 最低切片平均命中
  maximumAverageHitCount: number;                      // 最高切片平均命中
  averageHitCountSpread: number;                       // 平均命中波动
  lowHitRateSpread: number;                            // 低命中比例波动
  atLeastFourRateSpread: number;                       // 至少4红波动
  atLeastFiveRateSpread: number;                       // 至少5红波动
  allSixRateSpread: number;                            // 完整6红波动
  firstToLastAverageHitDelta: number;                  // 末段相对首段平均命中变化
  firstToLastLowHitRateDelta: number;                  // 末段相对首段低命中变化
  firstToLastAtLeastFourRateDelta: number;             // 末段相对首段至少4红变化
  firstToLastAtLeastFiveRateDelta: number;             // 末段相对首段至少5红变化
  firstToLastAllSixRateDelta: number;                  // 末段相对首段完整6红变化
}

/**
 * 已保存实验时间切片稳定性结果。
 */
export interface EntryRecallStabilityResult {
  resultCode: string;                                  // 策略编码
  resultVersion: string;                               // 策略版本
  periodCount: number;                                 // 总期数
  requestedSliceCount: number;                         // 请求切片数
  actualSliceCount: number;                            // 实际切片数
  slices: EntryRecallTimeSliceMetric[];                // 连续时间切片
  spreadByEntrySize: Record<string, EntryRecallStabilitySpread>; // 跨切片波动
}

/**
 * 两两组合网格请求。
 */
export interface EntryRecallGridPreviewRequest {
  componentCodes: string[];                            // 参与矩阵的组件
  algorithms: string[];                               // 组合算法
  weightVectors: number[][];                          // 两组件权重向量
  entrySizes: number[];                               // 入口规模
  startQiHao?: string;                                // 起始期号
  endQiHao?: string;                                  // 结束期号
  recentLimit?: number;                               // 最近期数
}

/**
 * 两两组合网格候选。
 */
export interface EntryRecallGridCandidate {
  candidateCode: string;                              // 候选稳定描述
  algorithm: string;                                  // 组合算法
  componentCodes: string[];                           // 两个组件
  weights: number[];                                  // 两个权重
  baseline: EntryRecallBaselineResult;                 // 候选统一评价
}

/**
 * 两两组合网格结果。
 */
export interface EntryRecallGridPreviewResult {
  periodCount: number;                                // 评价期数
  preparedComponentCount: number;                     // 仅准备一次的组件数
  candidates: EntryRecallGridCandidate[];             // 网格候选
  elapsedMs: number;                                  // 总耗时
}

/**
 * 入口实验拟正式预测快照请求。
 */
export interface EntryParallelPredictionRequest {
  predictQiHao: string;                                // 预测期号
  experimentIds: number[];                             // 参与拟正式预测的实验ID
  entrySize: number;                                   // 读取的入口规模
}

/**
 * 入口实验拟正式预测复盘请求。
 */
export interface EntryParallelPredictionReviewRequest {
  predictQiHao: string;                                // 需要复盘的预测期号
  snapshotIds?: number[];                              // 指定快照ID；为空时复盘该期全部快照
}

/**
 * 入口实验拟正式预测快照结果。
 */
export interface EntryParallelPredictionSnapshot {
  id: number | null;                                   // 快照ID，预览时为空
  experimentId: number;                                // 来源入口实验ID
  experimentName: string;                              // 冗余实验名称
  experimentLabelCn?: string | null;                   // 实验中文名称
  experimentDescriptionCn?: string | null;             // 实验中文说明
  strategyCode: string;                                // 策略编码
  strategyVersion: string;                             // 策略版本
  modelVersion: string;                                // 拟正式预测模型版本
  predictQiHao: string;                                // 预测期号
  entrySize: number;                                   // 入口规模
  redEntryPool: string[];                              // 红球入口池
  compressedRedPool: string[];                         // 压缩红球池，第一版可能为空
  nineRedPool: string[];                               // 9+1红球池，第一版可能为空
  nineBlueNumber?: string | null;                      // 9+1蓝球，第一版可能为空
  singleTickets: Array<{ redNumbers: string[]; blueNumber?: string }>; // 10注6+1票面，第一版可能为空
  blueCandidates: string[];                            // 蓝球候选，第一版可能为空
  actualRedNumbers?: string[];                         // 已复盘实际红球
  actualBlueNumber?: string | null;                    // 已复盘实际蓝球
  entryHitCount?: number | null;                       // 入口池命中红球数量
  compressedHitCount?: number | null;                  // 压缩池命中红球数量
  nineHitCount?: number | null;                        // 9+1命中红球数量
  singleTicketMaxHitCount?: number | null;             // 10注最高红球命中
  reviewStatus?: number | null;                        // 0未复盘，1已复盘
  diagnosticSaved?: number | null;                     // 0未保存诊断，1已保存诊断
  diagnosticJson?: string | null;                      // 诊断JSON
  createdAt?: string | null;                           // 保存时间
  reviewTime?: string | null;                          // 复盘时间
  alreadySaved?: boolean;                              // 保存时是否命中已有快照
  note?: string | null;                                // 服务端说明
}

/**
 * 运行入口召回预览或正式实验。
 */
export async function runEntryRecallExperiment(
  params: EntryRecallExperimentRequest
): Promise<ApiResponse<EntryRecallExperimentRunResult>> {
  return request.post('/ssq/window/axis/replay/entry-recall/run', params, {
    timeout: 300000
  });
}

/**
 * 查询最近正式入口实验。
 */
export async function listEntryRecallExperiments(
  limit = 30
): Promise<ApiResponse<EntryRecallExperimentEntity[]>> {
  return request.get('/ssq/window/axis/replay/entry-recall/list', {
    params: { limit }
  });
}

/**
 * 查询正式入口实验完整证据。
 */
export async function getEntryRecallExperimentDetail(
  experimentId: number
): Promise<ApiResponse<EntryRecallExperimentBundle>> {
  return request.get('/ssq/window/axis/replay/entry-recall/detail', {
    params: { experimentId }
  });
}

/**
 * 横向读取多个正式入口实验。
 */
export async function compareEntryRecallExperiments(
  experimentIds: number[]
): Promise<ApiResponse<EntryRecallExperimentBundle[]>> {
  return request.get('/ssq/window/axis/replay/entry-recall/compare', {
    params: { experimentIds }
  });
}

/**
 * 读取已保存实验的连续时间切片稳定性。
 */
export async function getEntryRecallStability(
  experimentId: number,
  sliceCount = 4
): Promise<ApiResponse<EntryRecallStabilityResult>> {
  return request.get('/ssq/window/axis/replay/entry-recall/stability', {
    params: { experimentId, sliceCount }
  });
}

/**
 * 运行两两组件与权重网格预览。
 */
export async function previewEntryRecallGrid(
  params: EntryRecallGridPreviewRequest
): Promise<ApiResponse<EntryRecallGridPreviewResult>> {
  return request.post('/ssq/window/axis/replay/entry-recall/grid-preview', params, {
    timeout: 300000
  });
}

/**
 * 预览入口实验拟正式预测快照，不落库。
 */
export async function previewEntryParallelPrediction(
  params: EntryParallelPredictionRequest
): Promise<EntryParallelPredictionSnapshot[]> {
  const response = await request.post('/ssq/window/axis/replay/entry-recall/parallel-prediction/preview', params, {
    timeout: 300000
  });
  return normalizeParallelSnapshots(response);
}

/**
 * 保存入口实验拟正式预测快照；同指纹命中已有记录时不覆盖。
 */
export async function saveEntryParallelPrediction(
  params: EntryParallelPredictionRequest
): Promise<EntryParallelPredictionSnapshot[]> {
  const response = await request.post('/ssq/window/axis/replay/entry-recall/parallel-prediction/save', params, {
    timeout: 300000
  });
  return normalizeParallelSnapshots(response);
}

/**
 * 查询指定期号的入口实验拟正式预测快照。
 */
export async function listEntryParallelPredictions(
  predictQiHao: string
): Promise<EntryParallelPredictionSnapshot[]> {
  const response = await request.get('/ssq/window/axis/replay/entry-recall/parallel-prediction/list', {
    params: { predictQiHao }
  });
  return normalizeParallelSnapshots(response);
}

/**
 * 对已保存入口实验拟正式预测快照执行复盘并保存诊断。
 */
export async function reviewEntryParallelPredictions(
  params: EntryParallelPredictionReviewRequest
): Promise<EntryParallelPredictionSnapshot[]> {
  const response = await request.post('/ssq/window/axis/replay/entry-recall/parallel-prediction/review-and-save-diagnostic', params, {
    timeout: 300000
  });
  return normalizeParallelSnapshots(response);
}

/**
 * 兼容后端原始数组返回和通用包装返回。
 */
function normalizeParallelSnapshots(response: unknown): EntryParallelPredictionSnapshot[] {
  const payload = unwrapParallelResponse(response);
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload.map(normalizeParallelSnapshot);
}

/**
 * 兼容通用响应包装，并在后端返回业务错误时抛出可读错误。
 */
function unwrapParallelResponse(response: unknown): unknown {
  if (Array.isArray(response)) {
    return response;
  }
  if (response && typeof response === 'object' && Array.isArray((response as { data?: unknown }).data)) {
    return (response as { data: unknown[] }).data;
  }
  if (response && typeof response === 'object' && 'code' in response) {
    const wrapped = response as { code?: number; msg?: string; data?: unknown };
    if (wrapped.code !== 200 && wrapped.code !== 0) {
      throw new Error(wrapped.msg || `接口返回异常：${wrapped.code}`);
    }
    return wrapped.data;
  }
  return response;
}

/**
 * 将后端别名字段统一为页面展示字段。
 */
function normalizeParallelSnapshot(raw: unknown): EntryParallelPredictionSnapshot {
  const item = raw as Record<string, unknown>;
  return {
    ...(item as unknown as EntryParallelPredictionSnapshot),
    experimentId: numberValue(item.experimentId ?? item.sourceExperimentId),
    redEntryPool: stringArray(item.redEntryPool),
    compressedRedPool: stringArray(item.compressedRedPool ?? item.redCompressedPool),
    nineRedPool: stringArray(item.nineRedPool ?? item.ninePlusOneRed),
    nineBlueNumber: stringValue(item.nineBlueNumber ?? item.ninePlusOneBlue),
    singleTickets: Array.isArray(item.singleTickets)
      ? item.singleTickets as Array<{ redNumbers: string[]; blueNumber?: string }>
      : [],
    blueCandidates: stringArray(item.blueCandidates),
    actualRedNumbers: stringArray(item.actualRedNumbers),
    actualBlueNumber: stringValue(item.actualBlueNumber),
    singleTicketMaxHitCount: numberValue(item.singleTicketMaxHitCount ?? item.singleBestRedHitCount)
  };
}

/**
 * 安全转换字符串数组。
 */
function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

/**
 * 安全转换数字。
 */
function numberValue(value: unknown): number {
  return typeof value === 'number' ? value : Number(value || 0);
}

/**
 * 安全转换可空字符串。
 */
function stringValue(value: unknown): string | null {
  return value == null ? null : String(value);
}
