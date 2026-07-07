import { request } from '../request';

export type RedTargetType = 'RED' | 'RED_TAIL';
export type MergeMode = 'UNION' | 'INTERSECTION';

export interface RedLevel { level: number; numbers: string[]; willDownNumbers: string[]; hitNumbers: string[] }
export interface RedWindow { windowCode: string; windowName: string; stateText: string; levels: RedLevel[] }
export interface RedPrepare { predictQiHao: string; targetType: RedTargetType; windows: RedWindow[] }
export interface LevelCondition { name: string; decisionType: string; score: number; windowCode: string; level: number }
export interface RedBallScore { number: string; score: number; reasons: string[]; windowLevels: Record<string, number> }
export interface RedScore { prepare: RedPrepare; mergeMode: MergeMode; scores: RedBallScore[]; candidateRed: string[] }
export interface HistoryItem { state: string; count: number; currentYearCount: number; yearlyCounts: Record<string, number> }
export interface HistoryResult { windowCode: string; mode: string; initialState: string; items: HistoryItem[] }
export interface SchemeSource { id: string; name: string; type: 'COMPOUND' | 'DANTUO'; redPool: number[]; bankers: number[]; drags: number[] }
export interface CombinationFilter {
  minSum?: number | null; maxSum?: number | null; minSpan?: number | null; maxSpan?: number | null;
  minAc?: number | null; maxAc?: number | null; oddCounts?: number[]; primeCounts?: number[];
  bigCounts?: number[]; distinctTailCounts?: number[]; twoRunCount?: number | null;
  threeRunCount?: number | null; maxRunLength?: number | null; requiredNumbers?: number[];
  excludedNumbers?: number[]; minSourceSupport?: number | null;
}
export interface CombinationItem {
  combinationId: number; reds: string[]; supportCount: number; sourceIds: string[]; sum: number;
  span: number; ac: number; oddCount: number; primeCount: number; bigCount: number;
  areaRatio: string; distinctTailCount: number; maxRunLength: number; twoRunCount: number; threeRunCount: number;
}
export interface CombinationResult { sourceCombinationCount: number; filteredCount: number; page: number; size: number; items: CombinationItem[] }
export interface RedSnapshot {
  id: number; predictQiHao: string; sampleName: string; decisionData: Record<string, unknown>;
  actualRed: string[]; reviewDetail: Record<string, unknown>; reviewStatus: string;
  testData: boolean; createdAt: string; reviewedAt: string | null;
}

export const prepareRedDecision = (predictQiHao: string, targetType: RedTargetType) =>
  unwrap<RedPrepare>(request.get('/ssq/window/decision/red/prepare', { params: { predictQiHao, targetType } }));
export const scoreRedDecision = (payload: unknown) => unwrap<RedScore>(request.post('/ssq/window/decision/red/score', payload));
export const historyRedDecision = (payload: unknown) => unwrap<HistoryResult>(request.post('/ssq/window/decision/red/history', payload));
export const filterRedCombinations = (payload: unknown) => unwrap<CombinationResult>(request.post('/ssq/window/decision/red/combination/filter', payload));
export const saveRedSnapshot = (payload: unknown) => unwrap<RedSnapshot>(request.post('/ssq/window/decision/red/snapshot/save', payload));
export const updateRedSnapshot = (id: number, payload: unknown) => unwrap<RedSnapshot>(request.post(`/ssq/window/decision/red/snapshot/${id}/update`, payload));
export const listRedSnapshots = (predictQiHao: string) => unwrap<RedSnapshot[]>(request.get('/ssq/window/decision/red/snapshot/list', { params: { predictQiHao } }));
export const getRedSnapshot = (id: number) => unwrap<RedSnapshot>(request.get(`/ssq/window/decision/red/snapshot/${id}`));
export const reviewRedSnapshot = (id: number) => unwrap<RedSnapshot>(request.post(`/ssq/window/decision/red/snapshot/${id}/review`));

async function unwrap<T>(promise: Promise<unknown>): Promise<T> {
  const response = await promise;
  if (response && typeof response === 'object' && 'code' in response) {
    const wrapped = response as { code?: number; msg?: string; data?: unknown };
    if (wrapped.code !== 0 && wrapped.code !== 200) throw new Error(wrapped.msg || '接口返回异常');
    return wrapped.data as T;
  }
  return response as T;
}
