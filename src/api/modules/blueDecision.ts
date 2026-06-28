import { request } from '../request';

export interface BlueDecisionManualAdjust {
  windowWeights?: Record<string, number>;
  levelAdjust?: Record<string, number>;
  ballAdjust?: Record<string, number>;
  forcedNumbers?: string[];
  excludedNumbers?: string[];
}

export interface BlueDecisionLevel {
  level: number;
  numbers: string[];
  willDownNumbers: string[];
}

export interface BlueDecisionWindow {
  windowCode: string;
  windowName: string;
  stateText: string;
  levels: BlueDecisionLevel[];
}

export interface BlueDecisionHistoryStat {
  currentState: string;
  finalStateCount: Record<string, number>;
  finalStateYearCount: Record<string, Record<string, number>>;
}

export interface BlueDecisionPrepare {
  predictQiHao: string;
  sourceQiHao: string;
  windows: BlueDecisionWindow[];
  historyStats: Record<string, BlueDecisionHistoryStat>;
}

export interface BlueBallScore {
  number: string;
  score: number;
  grade: string;
  supportCount: number;
  reasons: string[];
}

export interface BlueDecisionScore {
  prepare: BlueDecisionPrepare;
  systemWeights: Record<string, number>;
  manualAdjust: BlueDecisionManualAdjust | null;
  scores: BlueBallScore[];
  candidateBlue: string[];
}

export interface BlueDecisionSnapshot {
  id: number;
  predictQiHao: string;
  sampleName: string;
  selectedBlue: string[];
  candidateBlue: string[];
  actualBlue: string | null;
  hitResult: number | null;
  reviewStatus: string;
  testData: boolean;
  createdAt: string;
  reviewedAt: string | null;
  scoreResult: BlueDecisionScore | null;
}

export async function prepareBlueDecision(predictQiHao: string): Promise<BlueDecisionPrepare> {
  const response = await request.get('/ssq/window/decision/blue/prepare', {
    params: { predictQiHao }
  });
  return unwrapResponse<BlueDecisionPrepare>(response);
}

export async function scoreBlueDecision(
  predictQiHao: string,
  manualAdjust: BlueDecisionManualAdjust
): Promise<BlueDecisionScore> {
  const response = await request.post('/ssq/window/decision/blue/score', {
    predictQiHao,
    manualAdjust
  });
  return unwrapResponse<BlueDecisionScore>(response);
}

export async function saveBlueDecision(payload: {
  predictQiHao: string;
  sampleName: string;
  manualAdjust: BlueDecisionManualAdjust;
  selectedBlue: string[];
  testData: boolean;
}): Promise<BlueDecisionSnapshot> {
  const response = await request.post('/ssq/window/decision/blue/snapshot/save', payload);
  return unwrapResponse<BlueDecisionSnapshot>(response);
}

export async function listBlueDecision(predictQiHao: string): Promise<BlueDecisionSnapshot[]> {
  const response = await request.get('/ssq/window/decision/blue/snapshot/list', {
    params: { predictQiHao }
  });
  return unwrapResponse<BlueDecisionSnapshot[]>(response);
}

export async function reviewBlueDecision(id: number): Promise<BlueDecisionSnapshot> {
  const response = await request.post(`/ssq/window/decision/blue/snapshot/${id}/review`);
  return unwrapResponse<BlueDecisionSnapshot>(response);
}

export async function reviewBlueDecisionBatch(
  predictQiHao: string,
  ids: number[] = []
): Promise<BlueDecisionSnapshot[]> {
  const response = await request.post('/ssq/window/decision/blue/snapshot/review-batch', {
    predictQiHao,
    ids
  });
  return unwrapResponse<BlueDecisionSnapshot[]>(response);
}

export async function deleteBlueDecisionTestData(): Promise<{ deletedCount: number }> {
  const response = await request.delete('/ssq/window/decision/blue/snapshot/test-data');
  return unwrapResponse<{ deletedCount: number }>(response);
}

function unwrapResponse<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'code' in response) {
    const wrapped = response as { code?: number; msg?: string; data?: unknown };
    if (wrapped.code !== 200 && wrapped.code !== 0) {
      throw new Error(wrapped.msg || `接口返回异常：${wrapped.code}`);
    }
    return wrapped.data as T;
  }
  return response as T;
}
