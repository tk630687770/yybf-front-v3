/**
 * 模型预测相关接口封装
 * 用于获取后端多窗口预测、6+1单式票面等模型输出
 */
import { request } from '../request';
import type { ApiResponse } from '../request';

/**
 * 红球三窗口组合评分结果
 */
export interface RedCombinationPredictResult {
  predictQiHao: string;             // 预测期号
  rank: number;                     // 组合排名
  numbers: string[];                // 红球号码列表
  numberText: string;               // 红球号码文本
  candidateLimit: number;           // 参与枚举的候选池大小
  numberScore: number;              // 红10原始平均分
  red10StructureScore: number;      // 红10结构分
  red20StructureScore: number;      // 红20结构分
  red33StructureScore: number;      // 红33结构分
  weightedStructureScore: number;   // 三窗口加权结构分
  finalScore: number;               // 最终综合分
  memberSummary: string;            // 组合成员摘要
}

/**
 * 蓝球三窗口候选评分结果
 */
export interface BlueCandidatePredictResult {
  predictQiHao: string;             // 预测期号
  rank: number;                     // 蓝球排名
  number: string;                   // 蓝球号码
  blue10Level: number;              // 蓝10等级
  blue16Level: number;              // 蓝16等级
  blue32Level: number;              // 蓝32等级
  finalScore: number;               // 三窗口综合分
  explanation: string;              // 评分解释
}

/**
 * 红蓝合并票面结果
 */
export interface MultiWindowFinalTicket {
  rank: number;                     // 票面排名
  redRank: number;                  // 红球组合排名
  blueRank: number;                 // 蓝球排名
  redNumbers: string[];             // 红球列表
  redNumberText: string;            // 红球文本
  blueNumber: string;               // 蓝球号码
  ticketText: string;               // 票面文本
  redScore: number;                 // 红球原始分
  blueScore: number;                // 蓝球原始分
  redNormalizedScore: number;       // 红球归一化分
  blueNormalizedScore: number;      // 蓝球归一化分
  finalScore: number;               // 合并分
  explanation: string;              // 合并说明
}

/**
 * 多窗口最终预测结果
 */
export interface MultiWindowFinalPredictResult {
  predictQiHao: string;                             // 预测期号
  redCandidateLimit: number;                        // 红球候选池大小
  redCombinationTopLimit: number;                   // 红球组合返回数量
  blueTopLimit: number;                             // 蓝球候选返回数量
  ticketTopLimit: number;                           // 合并票面返回数量
  redWeight: number;                                // 红球权重
  blueWeight: number;                               // 蓝球权重
  recommendedRedNumbers: string[];                  // 推荐红球号码
  recommendedBlueNumber: string;                    // 推荐蓝球号码
  recommendedTicketText: string;                    // 推荐票面文本
  redCombinations: RedCombinationPredictResult[];   // 红球组合榜
  blueCandidates: BlueCandidatePredictResult[];     // 蓝球候选榜
  tickets: MultiWindowFinalTicket[];                // 红蓝合并票面榜
  explanation: string;                              // 输出说明
}

/**
 * 红球Top组合反推后的单号码评分
 */
export interface RedTopCombinationReverseNumberResult {
  number: string;                 // 红球号码
  rank: number;                   // 反推排名
  role: string;                   // 建议角色
  appearTimes: number;            // 在Top组合中出现次数
  appearRate: number;             // 出现比例
  rankWeightScore: number;        // 排名加权出现分
  rankWeightRate: number;         // 排名加权比例
  combinationScoreSum: number;    // 所在组合分累计值
  contributionRate: number;       // 组合分贡献比例
  bestCombinationRank: number;    // 出现过的最高组合排名
  bestCombinationScore: number;   // 出现过的最高组合分
  reverseScore: number;           // 反推综合分
}

/**
 * 9+1复式红球反推结果
 */
export interface RedTopCombinationReversePredictResult {
  predictQiHao: string;                                      // 预测期号
  candidateLimit: number;                                    // 红球组合候选池大小
  sourceTopLimit: number;                                    // 参与反推的Top组合数量
  recommendedLimit: number;                                  // 推荐红球数量
  minSample: number;                                         // 最小样本数
  structureWeight: number;                                   // 结构分权重
  red10Weight: number;                                       // 红10权重
  red20Weight: number;                                       // 红20权重
  red33Weight: number;                                       // 红33权重
  danNumber: string;                                         // 胆候选
  recommendedNumbers: string[];                              // 推荐9红
  numberResults: RedTopCombinationReverseNumberResult[];     // 单号码评分明细
  sourceCombinations: RedCombinationPredictResult[];         // 反推来源组合榜
  formulaDescription: string;                                // 公式说明
  conclusion: string;                                        // 简短结论
}

/**
 * 6+1单式票面建议
 */
export interface SingleTicketPlanItem {
  rank: number;                     // 票面排名
  strategyType: string;             // 策略类型
  redNumbers: string[];             // 红球列表
  redNumberText: string;            // 红球文本
  blueNumber: string;               // 蓝球号码
  ticketText: string;               // 票面文本
  redRank: number;                  // 红球组合排名
  blueRank: number;                 // 蓝球排名
  redScore: number;                 // 红球分
  blueScore: number;                // 蓝球分
  reverseAverageScore: number;      // 反推评分均值
  reverseCoreCount: number;         // 命中反推9红数量
  shapeScore: number;               // 形态分
  repeatCount: number;              // 与上期重复红球数量
  neighborCount: number;            // 上期邻号数量
  primeCount: number;               // 质数数量
  threeAreas: string;               // 三区分布
  acValue: number;                  // AC值
  acScore: number;                  // AC值形态分
  breakArea: boolean;               // 是否断区
  historyRepeated: boolean;         // 历史是否完全重复
  shapeExplanation: string;         // 形态说明
  maxOverlapWithPrevious: number;   // 与已选票面最大重叠
  finalScore: number;               // 综合分
  explanation: string;              // 票面说明
}

/**
 * 红球贝叶斯冷热诊断窗口明细
 */
export interface RedBayesWindowDetail {
  windowSize: number;           // 窗口期数
  actualTimes: number;          // 实际出现次数
  expectedTimes: number;        // 理论期望次数
  likelihoodRatio: number;      // 似然比
  zscore?: number;              // 近似Z值，后端JavaBean可能序列化为zscore
  zScore?: number;              // 近似Z值
  pvalue?: number;              // p值，后端JavaBean可能序列化为pvalue
  pValue?: number;              // p值
}

/**
 * 红球贝叶斯冷热诊断单号结果
 */
export interface RedBayesNumberResult {
  rank: number;                                     // 排名
  number: string;                                   // 红球号码
  totalActualTimes: number;                         // 全历史实际次数
  totalExpectedTimes: number;                       // 全历史理论期望
  priorRatio: number;                               // 长期先验比
  weightedLikelihoodRatio: number;                  // 多窗口加权近期似然比
  bayesRawScore: number;                            // 贝叶斯原始分
  bayesNormalizedScore: number;                     // 贝叶斯归一化分
  minPValue: number;                                // 最小p值
  minPValueWindow: number;                          // 最小p值来源窗口
  bonferroniSignificant: boolean;                   // Bonferroni是否显著
  fdrSignificant: boolean;                          // FDR是否显著
  signalType: string;                               // 信号类型
  reliabilityLevel: string;                         // 可靠性等级
  explanation: string;                              // 诊断说明
  windowDetails: RedBayesWindowDetail[];            // 窗口明细
}

/**
 * 红球贝叶斯冷热诊断结果
 */
export interface RedBayesDiagnosisResult {
  predictQiHao: string;                             // 预测期号
  lastQiHao: string;                                // 最新开奖期号
  historyPeriodCount: number;                       // 历史期数
  windowSizes: number[];                            // 窗口列表
  alpha: number;                                    // 显著性水平
  bonferroniThreshold: number;                      // Bonferroni阈值
  formulaDescription: string;                       // 公式说明
  conclusion: string;                               // 结论
  numbers: RedBayesNumberResult[];                  // 单号结果
}

/**
 * 6+1单式票面预测结果
 */
export interface SingleTicketPlanPredictResult {
  predictQiHao: string;                 // 预测期号
  ticketLimit: number;                  // 单式票面数量
  redCandidateLimit: number;            // 红球候选池大小
  redSourceTopLimit: number;            // 红球组合来源数量
  blueTopLimit: number;                 // 蓝球候选数量
  unitCost: number;                     // 单注成本
  totalCost: number;                    // 总成本
  reverseNineRedNumbers: string[];      // 反推9红参考池
  reverseDanNumber: string;             // 反推胆候选
  blueCandidateNumbers: string[];       // 蓝球候选列表
  tickets: SingleTicketPlanItem[];      // 推荐单式票面
  formulaDescription: string;           // 公式说明
  strategyDescription: string;          // 策略说明
  riskDescription: string;              // 风险说明
}

/**
 * 预测快照保存请求
 */
export interface PredictionSnapshotSaveRequest {
  modelName: string;                                    // 模型名称
  modelVersion: string;                                 // 模型版本
  finalPredict: MultiWindowFinalPredictResult | null;   // 当前红蓝合并预测结果
  singleTicketPlan: SingleTicketPlanPredictResult | null; // 当前10注6+1单式方案
  parameters: Record<string, unknown>;                  // 当前模型参数
}

/**
 * 预测快照保存结果
 */
export interface PredictionSnapshotEntity {
  id: number;                             // 快照ID
  predictQiHao: string;                   // 预测期号
  modelName: string;                      // 模型名称
  modelVersion: string;                   // 模型版本
  createTime: string;                     // 创建时间
  finalRecommendedTicketText: string;     // 红蓝合并推荐票面
  singleTicketTextSummary: string;        // 10注6+1摘要
  finalPredictJson?: string;              // 红蓝合并预测完整JSON
  singleTicketPlanJson?: string;          // 10注6+1单式方案完整JSON
  parameterJson?: string;                 // 参数JSON
  reviewStatus: number;                   // 复盘状态
  reviewSummaryJson?: string;             // 复盘摘要JSON
}

/**
 * 快照单张票面复盘结果
 */
export interface PredictionSnapshotTicketReview {
  sourceType: string;               // 票面来源
  rank: number;                     // 票面排名
  strategyType: string;             // 策略类型
  redNumbers: string[];             // 红球号码
  blueNumber: string;               // 蓝球号码
  ticketText: string;               // 票面文本
  hitRedNumbers: string[];          // 命中的红球
  redHitCount: number;              // 红球命中数量
  blueHit: boolean;                 // 是否命中蓝球
  prizeLevel: string;               // 奖级
  prizeAmount: number;              // 奖金
  variablePrize: boolean;           // 是否浮动奖
}

/**
 * 预测快照复盘结果
 */
export interface PredictionSnapshotReviewResult {
  snapshotId: number;                                           // 快照ID
  predictQiHao: string;                                         // 预测期号
  actualRedNumbers: string[];                                   // 实际红球
  actualBlueNumber: string;                                     // 实际蓝球
  finalRecommendedReview: PredictionSnapshotTicketReview | null; // 推荐票面复盘
  finalTicketReviews: PredictionSnapshotTicketReview[];          // 红蓝合并票面榜复盘
  singleTicketReviews: PredictionSnapshotTicketReview[];         // 10注6+1复盘
  redCombinationBestHitCount: number;                           // 红球组合榜最高命中
  redCombinationFullHit: boolean;                               // 红球组合榜是否完整命中
  blueCandidateHit: boolean;                                    // 蓝球候选是否命中
  blueCandidateHitRank: number | null;                          // 蓝球命中排名
  finalTicketBestRedHitCount: number;                           // 红蓝合并票面最高红球命中
  finalTicketAnyBlueHit: boolean;                               // 红蓝合并票面是否命中蓝球
  singleTicketBestRedHitCount: number;                          // 10注最高红球命中
  singleTicketAnyBlueHit: boolean;                              // 10注是否命中蓝球
  singleTicketPrizeAmount: number;                              // 10注奖金
  singleTicketCostAmount: number;                               // 10注成本
  singleTicketNetAmount: number;                                // 10注净收益
  conclusion: string;                                           // 结论
}

/**
 * 预测快照复盘失败归因项
 */
export interface PredictionSnapshotFailureItem {
  type: string;       // 失败类型编码
  label: string;      // 失败类型名称
  times: number;      // 次数
  ratio: number;      // 占比
}

/**
 * 单期预测快照复盘趋势明细
 */
export interface PredictionSnapshotTrendPeriod {
  snapshotId: number;                       // 快照ID
  predictQiHao: string;                     // 预测期号
  actualTicketText: string;                 // 实际开奖票面
  recommendedTicketText: string;            // 主推荐票面
  recommendedRedHitCount: number;           // 主推荐红球命中数
  recommendedBlueHit: boolean;              // 主推荐蓝球是否命中
  recommendedPrizeLevel: string;            // 主推荐奖级
  redCombinationBestHitCount: number;       // 红球组合榜最高命中
  redCombinationFullHit: boolean;           // 红球组合榜是否完整覆盖
  blueCandidateHit: boolean;                // 蓝球候选是否命中
  blueCandidateHitRank: number | null;      // 蓝球命中排名
  finalTicketBestRedHitCount: number;       // 红蓝合并票面榜最高命中
  finalTicketAnyBlueHit: boolean;           // 红蓝合并票面榜是否命中蓝球
  singleTicketBestRedHitCount: number;      // 10注最高命中
  singleTicketAnyBlueHit: boolean;          // 10注是否命中蓝球
  singleTicketPrizeAmount: number;          // 10注奖金
  singleTicketCostAmount: number;           // 10注成本
  singleTicketNetAmount: number;            // 10注净收益
  failureType: string;                      // 主失败类型
  failureReason: string;                    // 主失败说明
}

/**
 * 多期预测快照复盘趋势
 */
export interface PredictionSnapshotTrendResult {
  periodCount: number;                                             // 纳入统计期数
  reviewedSnapshotCount: number;                                   // 原始已复盘快照数
  recommendedAverageRedHit: number;                                // 主推荐平均红球命中
  recommendedBlueHitRate: number;                                  // 主推荐蓝球命中率
  redCombinationAverageBestHit: number;                            // 红球组合榜平均最高命中
  redCombinationFullHitTimes: number;                              // 红球组合榜完整覆盖次数
  blueCandidateHitRate: number;                                    // 蓝球候选命中率
  blueCandidateTop1HitRate: number;                                // 蓝球候选Top1命中率
  finalTicketAverageBestRedHit: number;                            // 红蓝合并榜平均最高命中
  finalTicketAnyBlueHitRate: number;                               // 红蓝合并榜任意蓝球命中率
  singleTicketAverageBestRedHit: number;                           // 10注平均最高命中
  singleTicketAnyBlueHitRate: number;                              // 10注任意蓝球命中率
  singleTicketTotalPrizeAmount: number;                            // 10注总奖金
  singleTicketTotalCostAmount: number;                             // 10注总成本
  singleTicketTotalNetAmount: number;                              // 10注总净收益
  recommendedRedHitDistribution: Record<number, number>;           // 主推荐红球命中分布
  redCombinationBestHitDistribution: Record<number, number>;       // 红球组合榜最高命中分布
  singleTicketBestRedHitDistribution: Record<number, number>;      // 10注最高命中分布
  failureItems: PredictionSnapshotFailureItem[];                   // 失败归因分布
  periods: PredictionSnapshotTrendPeriod[];                        // 单期明细
  conclusion: string;                                              // 结论
  suggestions: string[];                                           // 建议
}

/**
 * 预测诊断快照记录
 */
export interface PredictionDiagnosticSnapshotEntity {
  id: number;                       // 诊断快照ID
  predictQiHao: string;             // 预测期号
  snapshotId: number | null;        // 关联的预测快照ID；当前态诊断可以为空
  diagnosticType: string;           // 诊断类型
  diagnosticName: string;           // 诊断名称
  modelVersion: string;             // 预测模型版本
  diagnosticVersion: string;        // 诊断口径版本
  createTime: string;               // 保存时间
  parameterJson?: string;           // 诊断参数JSON
  dataJson?: string;                // 诊断结果JSON
  summaryJson?: string;             // 诊断摘要JSON
  inputHash?: string;               // 输入哈希
  remark?: string;                  // 备注
}

/**
 * 红球漏号诊断中的单窗口状态
 */
export interface RedCandidateMissWindowState {
  windowCode: string;         // 窗口编码
  windowName: string;         // 窗口名称
  level: number;              // 当前等级
  previousRec: number;        // 上上期关联状态
  currentRec: number;         // 上期关联状态
  willDown: number;           // 是否自然降级
  willOut: number;            // 是否即将跌出窗口
}

/**
 * 红球漏号诊断中的单号明细
 */
export interface RedCandidateMissNumberDetail {
  number: string;                                      // 红球号码
  inCombinationCandidatePool: boolean;                 // 是否进入红球组合候选池
  inSingleTicketPool: boolean;                         // 是否进入10注6+1红球池
  inRecommendedTicket: boolean;                        // 是否进入最终推荐票面
  bestCombinationRank: number | null;                  // 红球组合榜最佳排名
  bestSingleTicketRank: number | null;                 // 10注票面最佳排名
  sourceType: string;                                  // 来源类型
  reason: string;                                      // 原因说明
  windowStates: RedCandidateMissWindowState[];         // 三窗口状态
}

/**
 * 红球候选池漏号诊断结果
 */
export interface RedCandidateMissDiagnosisResult {
  snapshotId: number;                                  // 快照ID
  predictQiHao: string;                                // 预测期号
  actualRedNumbers: string[];                          // 实际红球
  actualBlueNumber: string;                            // 实际蓝球
  recommendedTicketText: string;                       // 推荐票面
  combinationCandidatePool: string[];                  // 红球组合候选池
  combinationCandidateHits: string[];                  // 红球组合候选池命中
  combinationCandidateMisses: string[];                // 红球组合候选池漏号
  singleTicketRedPool: string[];                       // 10注6+1红球池
  singleTicketHits: string[];                          // 10注6+1命中红球
  singleTicketMisses: string[];                        // 10注6+1漏号
  actualThreeArea: string;                             // 实际三区
  actualPrimeCount: number;                            // 实际质数数量
  repeatLastCount: number;                             // 与上期重复数量
  neighborLastCount: number;                           // 上期邻号数量
  actualNumberDetails: RedCandidateMissNumberDetail[]; // 每个实际红球明细
  conclusion: string;                                  // 诊断结论
  suggestions: string[];                               // 建议
}

/**
 * 红球漏号分布统计项
 */
export interface RedCandidateMissDistributionItem {
  key: string;        // 统计键
  label: string;      // 展示名称
  times: number;      // 次数
  ratio: number;      // 占比
}

/**
 * 红球漏号分布统计结果
 */
export interface RedCandidateMissDistributionResult {
  snapshotCount: number;                                      // 快照数量
  actualRedCount: number;                                     // 真实红球数量
  combinationHitCount: number;                                // 主候选池命中数量
  combinationMissCount: number;                               // 主候选池漏号数量
  singleTicketHitCount: number;                               // 10注票面池命中数量
  singleTicketMissCount: number;                              // 10注票面池漏号数量
  rescuedBySingleTicketCount: number;                         // 10注补回数量
  fullMissCount: number;                                      // 完全漏号数量
  combinationCoverageRate: number;                            // 主候选池覆盖率
  singleTicketCoverageRate: number;                           // 10注票面池覆盖率
  fullMissRate: number;                                       // 完全漏号率
  fullMissNumberItems: RedCandidateMissDistributionItem[];     // 完全漏号号码分布
  fullMissAreaItems: RedCandidateMissDistributionItem[];       // 完全漏号三区分布
  red10LevelItems: RedCandidateMissDistributionItem[];         // 红10 level分布
  red20LevelItems: RedCandidateMissDistributionItem[];         // 红20 level分布
  red33LevelItems: RedCandidateMissDistributionItem[];         // 红33 level分布
  red10WillDownItems: RedCandidateMissDistributionItem[];      // 红10 willDown分布
  currentRecItems: RedCandidateMissDistributionItem[];         // 上期关联状态分布
  conclusion: string;                                         // 结论
  suggestions: string[];                                      // 建议
}

/**
 * 红球候选池保底扩展来源明细
 */
export interface RedCandidateGuardSourceItem {
  number: string;                         // 红球号码
  sourceType: string;                     // 来源类型
  sourceName: string;                     // 来源名称
  score?: number | null;                  // 来源内部评分
  alreadyInBasePool: boolean;             // 是否原本已在主候选池
  addedToExpandedPool: boolean;           // 是否实际加入扩展池
  actualHit: boolean;                     // 是否命中真实开奖号
  reason: string;                         // 来源说明
}

/**
 * 红球候选池保底扩展来源统计
 */
export interface RedCandidateGuardSourceStat {
  sourceType: string;                     // 来源类型
  sourceName: string;                     // 来源名称
  candidateTimes: number;                 // 候选次数
  addedTimes: number;                     // 新增次数
  candidateHitTimes: number;              // 候选自身命中次数
  candidateHitRate: number;               // 候选自身命中率
  hitTimes: number;                       // 新增命中次数
  hitRate: number;                        // 新增命中率
}

/**
 * 红球候选池保底来源贡献统计
 */
export interface RedCandidateGuardSourceContribution {
  sourceType: string;                     // 来源类型
  sourceName: string;                     // 来源名称
  candidateTimes: number;                 // 候选次数
  addedTimes: number;                     // 新增次数
  candidateHitTimes: number;              // 来源候选命中次数
  addedHitTimes: number;                  // 新增并命中次数
  rescuedHitTimes: number;                // 实际救回次数
  blockedHitTimes: number;                // 命中但未进入扩展池次数
  alreadyInBaseHitTimes: number;          // 命中但原池已包含次数
  candidateHitRate: number;               // 候选命中率
  addedHitRate: number;                   // 新增命中率
  rescuedHitRate: number;                 // 救回命中率
  rescuedNumbers: string[];               // 救回号码
  blockedHitNumbers: string[];            // 命中但被挡号码
  alreadyInBaseHitNumbers: string[];      // 命中但原池已含号码
}

/**
 * 单期红球候选池保底扩展回测明细
 */
export interface RedCandidateGuardBacktestPeriod {
  snapshotId: number;                                 // 快照ID
  predictQiHao: string;                               // 预测期号
  actualRedNumbers: string[];                         // 实际红球
  basePool: string[];                                 // 原主候选池
  expandedPool: string[];                             // 扩展后候选池
  addedNumbers: string[];                             // 新增号码
  baseHitNumbers: string[];                           // 原主候选池命中
  expandedHitNumbers: string[];                       // 扩展后命中
  rescuedNumbers: string[];                           // 保底救回号码
  sourceItems: RedCandidateGuardSourceItem[];         // 来源明细
  baseHitCount: number;                               // 原命中数量
  expandedHitCount: number;                           // 扩展命中数量
  addedCount: number;                                 // 新增数量
  conclusion: string;                                 // 单期结论
}

/**
 * 红球候选池保底扩展回测结果
 */
export interface RedCandidateGuardBacktestResult {
  periodCount: number;                                // 纳入统计期数
  reviewedSnapshotCount: number;                      // 原始已复盘快照数量
  actualRedCount: number;                             // 实际红球总数
  baseHitCount: number;                               // 原命中总数
  expandedHitCount: number;                           // 扩展命中总数
  rescuedHitCount: number;                            // 救回红球总数
  baseCoverageRate: number;                           // 原覆盖率
  expandedCoverageRate: number;                       // 扩展覆盖率
  coverageLift: number;                               // 覆盖率提升值
  improvedPeriodCount: number;                        // 有救回的期数
  averageAddedCount: number;                          // 平均每期新增数量
  maxExpandedSize: number;                            // 最大扩展池大小
  sourceStats: RedCandidateGuardSourceStat[];         // 来源统计
  sourceContributionStats: RedCandidateGuardSourceContribution[]; // 来源贡献统计
  periods: RedCandidateGuardBacktestPeriod[];         // 单期明细
  conclusion: string;                                 // 回测结论
  suggestions: string[];                              // 下一步建议
}

/**
 * 红球候选池保底来源配额网格单项
 */
export interface RedCandidateGuardQuotaGridOption {
  rank: number;                                       // 排名
  repeatQuota: number;                                // 上期重号配额
  neighborQuota: number;                              // 上期邻号配额
  bayesQuota: number;                                 // 贝叶斯Top配额
  lowLevelQuota: number;                              // 低位冷补配额
  thirdAreaQuota: number;                             // 三区后段配额
  periodCount: number;                                // 纳入统计期数
  actualRedCount: number;                             // 实际红球总数
  baseHitCount: number;                               // 原候选池命中总数
  expandedHitCount: number;                           // 扩展后命中总数
  rescuedHitCount: number;                            // 救回红球总数
  baseCoverageRate: number;                           // 原候选池覆盖率
  expandedCoverageRate: number;                       // 扩展后覆盖率
  coverageLift: number;                               // 覆盖率提升
  improvedPeriodCount: number;                        // 有救回效果的期数
  reachFourHitPeriodCount: number;                    // 达到4红覆盖的期数
  reachFourHitRate: number;                           // 达到4红覆盖的比例
  averageAddedCount: number;                          // 平均新增号码数
  score: number;                                      // 网格排序观察分
  quotaText: string;                                  // 配额描述
  conclusion: string;                                 // 组合结论
}

/**
 * 红球候选池保底来源配额网格回测结果
 */
export interface RedCandidateGuardQuotaGridBacktestResult {
  reviewedSnapshotCount: number;                      // 原始已复盘快照数量
  periodCount: number;                                // 纳入统计期数
  maxExpandedSize: number;                            // 最大扩展池大小
  optionCount: number;                                // 实际测试组合数量
  topLimit: number;                                   // 返回Top数量
  baseCoverageRate: number;                           // 原候选池覆盖率
  bestExpandedCoverageRate: number;                   // 最佳组合扩展覆盖率
  bestCoverageLift: number;                           // 最佳组合覆盖提升
  bestReachFourHitRate: number;                       // 最佳组合达到4红比例
  bestOption?: RedCandidateGuardQuotaGridOption | null; // 最佳配额组合
  topOptions: RedCandidateGuardQuotaGridOption[];     // 排名前列的配额组合
  bestPeriods: RedCandidateGuardBacktestPeriod[];     // 最佳组合单期明细
  bestSourceContributionStats: RedCandidateGuardSourceContribution[]; // 最佳组合来源贡献
  conclusion: string;                                 // 回测结论
  suggestions: string[];                              // 下一步建议
}

/**
 * 扩展池压缩后生成的6红票面诊断明细
 */
export interface RedCandidateGuardCompressionTicket {
  rank: number;                                       // 票面排名
  redNumbers: string[];                               // 6个红球号码
  redText: string;                                    // 票面红球文本
  hitNumbers: string[];                               // 命中的真实红球
  hitCount: number;                                   // 命中红球数量
  score: number;                                      // 票面压缩评分
  shapeText: string;                                  // 票面形态说明
  reason: string;                                     // 选择原因
}

/**
 * 单期扩展池压缩回测明细
 */
export interface RedCandidateGuardCompressionPeriod {
  snapshotId: number;                                 // 快照ID
  predictQiHao: string;                               // 预测期号
  actualRedNumbers: string[];                         // 实际红球
  basePool: string[];                                 // 原主候选池
  expandedPool: string[];                             // 保底扩展池
  compressedNinePool: string[];                       // 压缩后的9红观察池
  baseHitNumbers: string[];                           // 原候选池命中
  expandedHitNumbers: string[];                       // 扩展池命中
  compressedHitNumbers: string[];                     // 9红观察池命中
  originalSingleBestRedHitCount: number;              // 原正式10注最高命中
  compressedTicketBestRedHitCount: number;            // 压缩10注最高命中
  tickets: RedCandidateGuardCompressionTicket[];      // 压缩生成票面
  conclusion: string;                                 // 单期结论
}

/**
 * 红球保底扩展池压缩回测结果
 */
export interface RedCandidateGuardCompressionBacktestResult {
  periodCount: number;                                // 纳入统计期数
  reviewedSnapshotCount: number;                      // 原始已复盘快照数量
  actualRedCount: number;                             // 实际红球总数
  quotaText: string;                                  // 使用的保底配额
  maxExpandedSize: number;                            // 扩展池最大大小
  compressedRedSize: number;                          // 压缩后的红球数量
  ticketLimit: number;                                // 生成票面数量
  baseCoverageRate: number;                           // 原候选池覆盖率
  expandedCoverageRate: number;                       // 扩展池覆盖率
  compressedPoolCoverageRate: number;                 // 9红观察池覆盖率
  compressedTicketCoverageRate: number;               // 压缩10注折算覆盖率
  originalSingleTicketCoverageRate: number;           // 原正式10注折算覆盖率
  compressedPoolReachFourCount: number;               // 9红达到4红期数
  compressedTicketReachThreeCount: number;            // 10注达到3红期数
  betterThanOriginalSingleCount: number;              // 优于原正式10注期数
  periods: RedCandidateGuardCompressionPeriod[];      // 单期明细
  sourceContributionStats: RedCandidateGuardSourceContribution[]; // 压缩输入池来源贡献
  conclusion: string;                                 // 回测结论
  suggestions: string[];                              // 下一步建议
}

/**
 * 红球保底扩展池压缩策略网格中的单个策略结果
 */
export interface RedCandidateGuardCompressionGridOption {
  rank: number;                                       // 排名
  strategyCode: string;                               // 策略编码
  strategyName: string;                               // 策略名称
  strategyDescription: string;                        // 策略说明
  score: number;                                      // 观察评分
  baseCoverageRate: number;                           // 原候选池覆盖率
  expandedCoverageRate: number;                       // 扩展池覆盖率
  compressedPoolCoverageRate: number;                 // 压缩9红覆盖率
  compressedTicketCoverageRate: number;               // 压缩10注折算覆盖率
  originalSingleTicketCoverageRate: number;           // 原正式10注折算覆盖率
  compressedPoolReachFourCount: number;               // 9红达到4红期数
  compressedTicketReachThreeCount: number;            // 10注达到3红期数
  betterThanOriginalSingleCount: number;              // 优于原正式10注期数
  compressedRedSize: number;                          // 压缩红球数量
  ticketLimit: number;                                // 生成票面数量
}

/**
 * 红球保底扩展池压缩策略网格回测结果
 */
export interface RedCandidateGuardCompressionGridBacktestResult {
  periodCount: number;                                // 纳入统计期数
  reviewedSnapshotCount: number;                      // 原始已复盘快照数量
  optionCount: number;                                // 测试策略数量
  topLimit: number;                                   // 返回Top数量
  quotaText: string;                                  // 使用的保底配额
  bestOption?: RedCandidateGuardCompressionGridOption | null; // 最佳策略
  topOptions: RedCandidateGuardCompressionGridOption[]; // 排名前列策略
  bestPeriods: RedCandidateGuardCompressionPeriod[];  // 最佳策略单期明细
  bestSourceContributionStats: RedCandidateGuardSourceContribution[]; // 最佳策略输入池来源贡献
  conclusion: string;                                 // 回测结论
  suggestions: string[];                              // 下一步建议
}

/**
 * 红球保底扩展池压缩来源最低保留位网格中的单个策略结果
 */
export interface RedCandidateGuardCompressionRetentionGridOption {
  rank: number;                                       // 排名
  strategyCode: string;                               // 策略编码
  strategyName: string;                               // 策略名称
  strategyDescription: string;                        // 策略说明
  retainText: string;                                 // 来源最低保留位描述
  score: number;                                      // 观察评分
  baseCoverageRate: number;                           // 原候选池覆盖率
  expandedCoverageRate: number;                       // 扩展池覆盖率
  compressedPoolCoverageRate: number;                 // 压缩9红覆盖率
  compressedTicketCoverageRate: number;               // 压缩10注折算覆盖率
  originalSingleTicketCoverageRate: number;           // 原正式10注折算覆盖率
  compressedPoolReachFourCount: number;               // 9红达到4红期数
  compressedTicketReachThreeCount: number;            // 10注达到3红期数
  betterThanOriginalSingleCount: number;              // 优于原正式10注期数
}

/**
 * 红球保底扩展池压缩来源最低保留位网格回测结果
 */
export interface RedCandidateGuardCompressionRetentionGridBacktestResult {
  periodCount: number;                                // 纳入统计期数
  reviewedSnapshotCount: number;                      // 原始已复盘快照数量
  optionCount: number;                                // 测试策略数量
  topLimit: number;                                   // 返回Top数量
  quotaText: string;                                  // 使用的保底来源配额
  bestOption?: RedCandidateGuardCompressionRetentionGridOption | null; // 最佳最低保留位策略
  topOptions: RedCandidateGuardCompressionRetentionGridOption[]; // 排名前列策略
  bestPeriods: RedCandidateGuardCompressionPeriod[];  // 最佳策略单期明细
  bestSourceContributionStats: RedCandidateGuardSourceContribution[]; // 最佳策略输入池来源贡献
  conclusion: string;                                 // 回测结论
  suggestions: string[];                              // 下一步建议
}

/**
 * 通用窗口坐标结构链同步结果
 */
export interface WindowAxisChainResult {
  windowCode: string;                // 窗口编码
  windowName: string;                // 窗口名称
  baseTableName: string;             // 基础窗口表名
  axisTableName: string;             // 坐标表名
  templateTableName: string;         // 模板表名
  groupTableName: string;            // 结构族表名
  baseWindowSynced: boolean;         // 是否同步基础窗口
  axisCount: number;                 // 坐标数量
  templateCount: number;             // 模板数量
  templateTargetCount: number;       // 模板迁移数量
  groupCount: number;                // 结构族数量
  groupTargetCount: number;          // 结构族迁移数量
  message: string;                   // 执行说明
}

/**
 * 获取红球三窗口、蓝球三窗口合并后的最终预测结果
 */
export async function getMultiWindowFinalPredict(): Promise<ApiResponse<MultiWindowFinalPredictResult>> {
  return request.get('/ssq/window/axis/score/final/multi-window/predict');
}

/**
 * 获取真正的9+1复式红球反推结果
 */
export async function getNinePlusOnePredict(): Promise<ApiResponse<RedTopCombinationReversePredictResult>> {
  return request.get('/ssq/window/axis/score/red/top-combination-reverse/predict', {
    params: {
      recommendedLimit: 9
    }
  });
}

/**
 * 获取10注6+1单式票面预测结果
 */
export async function getSingleTicketPlanPredict(): Promise<ApiResponse<SingleTicketPlanPredictResult>> {
  return request.get('/ssq/window/axis/score/final/single-ticket-plan/predict');
}

/**
 * 获取红球贝叶斯冷热诊断结果
 * @returns 红球贝叶斯冷热诊断
 */
export async function getRedBayesColdHotDiagnosis(): Promise<ApiResponse<RedBayesDiagnosisResult>> {
  return request.get('/ssq/window/axis/score/red/bayes-cold-hot/diagnose', {
    params: { windows: '10,20,33' }
  });
}

/**
 * 同步红10专用坐标、模板、结构族和迁移链
 */
export async function syncRed10AxisChain(): Promise<ApiResponse<boolean>> {
  return request.get('/ssq/last/red10/axis/sync');
}

/**
 * 同步红20、红33、蓝10、蓝16、蓝32通用坐标结构链
 */
export async function syncDefaultAxisChains(): Promise<ApiResponse<WindowAxisChainResult[]>> {
  return request.get('/ssq/window/axis/chain/sync-all');
}

/**
 * 保存当前页面展示的预测快照
 * @param payload 快照保存请求
 * @returns 已保存的快照记录
 */
export async function savePredictionSnapshot(
  payload: PredictionSnapshotSaveRequest
): Promise<ApiResponse<PredictionSnapshotEntity>> {
  return request.post('/ssq/window/axis/prediction/snapshot/save', payload);
}

/**
 * 查询最近保存的预测快照
 * @param limit 查询数量
 * @returns 最近预测快照列表
 */
export async function getLatestPredictionSnapshots(
  limit = 10
): Promise<ApiResponse<PredictionSnapshotEntity[]>> {
  return request.get('/ssq/window/axis/prediction/snapshot/latest', {
    params: { limit }
  });
}

/**
 * 查询指定预测期号的快照
 * @param predictQiHao 预测期号
 * @returns 该期号下保存过的快照列表
 */
export async function getPredictionSnapshotsByQiHao(
  predictQiHao: string
): Promise<ApiResponse<PredictionSnapshotEntity[]>> {
  return request.get('/ssq/window/axis/prediction/snapshot/list', {
    params: { predictQiHao }
  });
}

/**
 * 复盘指定预测快照
 * @param id 快照ID
 * @returns 快照复盘结果
 */
export async function reviewPredictionSnapshot(
  id: number
): Promise<ApiResponse<PredictionSnapshotReviewResult>> {
  return request.post('/ssq/window/axis/prediction/snapshot/review', null, {
    params: { id, includeFuYunPrize: true }
  });
}

/**
 * 获取多期已复盘快照趋势
 * @param recentLimit 最近统计期数
 * @returns 多期复盘趋势
 */
export async function getPredictionReviewTrend(
  recentLimit = 20
): Promise<ApiResponse<PredictionSnapshotTrendResult>> {
  return request.get('/ssq/window/axis/prediction/snapshot/review/trend', {
    params: { recentLimit }
  });
}

/**
 * 保存复盘诊断包
 * @param snapshotId 需要沉淀诊断证据的预测快照ID
 * @param recentLimit 多期统计使用的最近期数
 * @returns 本次保存的诊断快照记录
 */
export async function savePredictionDiagnosticReviewPack(
  snapshotId: number,
  recentLimit = 20
): Promise<ApiResponse<PredictionDiagnosticSnapshotEntity[]>> {
  return request.post('/ssq/window/axis/prediction/diagnostic-snapshot/save-review-pack', null, {
    params: {
      snapshotId,
      recentLimit,
      replaceSameType: true
    }
  });
}

/**
 * 诊断指定快照的红球候选池漏号情况
 * @param snapshotId 快照ID
 * @returns 红球候选池漏号诊断结果
 */
export async function diagnoseRedCandidateMiss(
  snapshotId: number
): Promise<ApiResponse<RedCandidateMissDiagnosisResult>> {
  return request.get('/ssq/window/axis/score/diagnosis/red-candidate-miss/snapshot', {
    params: { snapshotId }
  });
}

/**
 * 统计多期快照的红球漏号分布
 * @param recentLimit 最近快照数量
 * @returns 红球漏号分布统计结果
 */
export async function getRedCandidateMissDistribution(
  recentLimit = 50
): Promise<ApiResponse<RedCandidateMissDistributionResult>> {
  return request.get('/ssq/window/axis/score/diagnosis/red-candidate-miss/distribution', {
    params: { recentLimit }
  });
}

/**
 * 回测红球候选池保底扩展效果
 * @param recentLimit 最近预测期数量
 * @returns 保底扩展回测结果
 */
export async function getRedCandidateGuardBacktest(
  recentLimit = 20
): Promise<ApiResponse<RedCandidateGuardBacktestResult>> {
  return request.get('/ssq/window/axis/score/diagnosis/red-candidate-miss/guard-backtest', {
    params: {
      recentLimit,
      maxExpandedSize: 20,
      bayesTopLimit: 5,
      lowLevelLimit: 4
    }
  });
}

/**
 * 回测红球候选池保底来源配额效果
 * @param recentLimit 最近预测期数量
 * @returns 带来源配额的保底扩展回测结果
 */
export async function getRedCandidateGuardQuotaBacktest(
  recentLimit = 20
): Promise<ApiResponse<RedCandidateGuardBacktestResult>> {
  return request.get('/ssq/window/axis/score/diagnosis/red-candidate-miss/guard-quota-backtest', {
    params: {
      recentLimit,
      maxExpandedSize: 20,
      repeatQuota: 3,
      neighborQuota: 3,
      bayesQuota: 3,
      lowLevelQuota: 2,
      thirdAreaQuota: 2
    }
  });
}

/**
 * 回测红球候选池保底来源配额网格
 * @param recentLimit 最近预测期数量
 * @returns 配额网格回测结果
 */
export async function getRedCandidateGuardQuotaGridBacktest(
  recentLimit = 20
): Promise<ApiResponse<RedCandidateGuardQuotaGridBacktestResult>> {
  return request.get('/ssq/window/axis/score/diagnosis/red-candidate-miss/guard-quota-grid-backtest', {
    params: {
      recentLimit,
      maxExpandedSize: 20,
      topLimit: 20
    }
  });
}

/**
 * 回测红球保底扩展池压缩效果
 * @param recentLimit 最近预测期数量
 * @returns 扩展池压缩回测结果
 */
export async function getRedCandidateGuardCompressionBacktest(
  recentLimit = 20
): Promise<ApiResponse<RedCandidateGuardCompressionBacktestResult>> {
  return request.get('/ssq/window/axis/score/diagnosis/red-candidate-miss/guard-compression-backtest', {
    params: {
      recentLimit,
      maxExpandedSize: 20,
      repeatQuota: 3,
      neighborQuota: 3,
      bayesQuota: 3,
      lowLevelQuota: 0,
      thirdAreaQuota: 0,
      compressedRedSize: 9,
      ticketLimit: 10
    }
  });
}

/**
 * 回测红球保底扩展池压缩策略网格
 * @param recentLimit 最近预测期数量
 * @returns 压缩策略网格回测结果
 */
export async function getRedCandidateGuardCompressionGridBacktest(
  recentLimit = 20
): Promise<ApiResponse<RedCandidateGuardCompressionGridBacktestResult>> {
  return request.get('/ssq/window/axis/score/diagnosis/red-candidate-miss/guard-compression-grid-backtest', {
    params: {
      recentLimit,
      maxExpandedSize: 20,
      repeatQuota: 3,
      neighborQuota: 3,
      bayesQuota: 3,
      lowLevelQuota: 0,
      thirdAreaQuota: 0,
      compressedRedSize: 9,
      ticketLimit: 10,
      topLimit: 10
    }
  });
}

/**
 * 回测红球保底扩展池压缩来源最低保留位网格
 * @param recentLimit 最近预测期数量
 * @returns 压缩来源最低保留位网格回测结果
 */
export async function getRedCandidateGuardCompressionRetentionGridBacktest(
  recentLimit = 20
): Promise<ApiResponse<RedCandidateGuardCompressionRetentionGridBacktestResult>> {
  return request.get('/ssq/window/axis/score/diagnosis/red-candidate-miss/guard-compression-retention-grid-backtest', {
    params: {
      recentLimit,
      maxExpandedSize: 20,
      repeatQuota: 3,
      neighborQuota: 3,
      bayesQuota: 3,
      lowLevelQuota: 0,
      thirdAreaQuota: 0,
      compressedRedSize: 9,
      ticketLimit: 10,
      topLimit: 10
    }
  });
}
