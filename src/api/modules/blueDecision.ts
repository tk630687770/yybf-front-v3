import { request } from '../request';

export interface BlueDecisionManualAdjust {
  sources?: BlueDecisionScoreSource[];
  ballAdjust?: Record<string, number>;
  forcedNumbers?: string[];
  excludedNumbers?: string[];
}

export type BlueDecisionMode = 'SYSTEM' | 'MANUAL' | 'LEGACY';

export interface BlueDecisionScoreSource {
  sourceType: 'WINDOW_LEVEL' | 'PREVIOUS_BLUE' | 'PREVIOUS_NEIGHBOR' | 'PREVIOUS_TAIL' | 'WILL_DOWN';
  windowCode?: string | null;
  level?: number | null;
  decisionType: '选择' | '观察' | '排除';
  score: number;
}

export interface BlueDecisionLevel {
  level: number;
  numbers: string[];
  willDownNumbers: string[];
  hitNumbers: string[];
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
  fixedSources: Record<string, string[]>;
}

export interface BlueBallScore {
  number: string;
  score: number;
  grade: string;
  supportCount: number;
  reasons: string[];
  reasonDetails?: Array<{
    decisionType: string;
    text: string;
    score: number;
  }>;
}

export interface BlueDecisionScore {
  decisionMode: BlueDecisionMode;
  prepare: BlueDecisionPrepare;
  systemWeights: Record<string, number>;
  manualAdjust: BlueDecisionManualAdjust | null;
  scores: BlueBallScore[];
  tailScores: BlueBallScore[];
  candidateBlue: string[];
}

export interface BlueDecisionSnapshot {
  id: number;
  predictQiHao: string;
  sampleName: string;
  decisionMode: BlueDecisionMode;
  selectedBlue: string[];
  candidateBlue: string[];
  actualBlue: string | null;
  actualTail: string | null;
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
  decisionMode: Exclude<BlueDecisionMode, 'LEGACY'>,
  manualAdjust: BlueDecisionManualAdjust | null
): Promise<BlueDecisionScore> {
  const response = await request.post('/ssq/window/decision/blue/score', {
    predictQiHao,
    decisionMode,
    manualAdjust
  });
  return unwrapResponse<BlueDecisionScore>(response);
}

export async function saveBlueDecision(payload: {
  id?: number | null;
  predictQiHao: string;
  sampleName: string;
  decisionMode: Exclude<BlueDecisionMode, 'LEGACY'>;
  manualAdjust: BlueDecisionManualAdjust | null;
  selectedBlue: string[];
}): Promise<BlueDecisionSnapshot> {
  const response = await request.post('/ssq/window/decision/blue/snapshot/save', payload);
  return unwrapResponse<BlueDecisionSnapshot>(response);
}

export async function updateBlueDecision(
  id: number,
  payload: {
    predictQiHao: string;
    sampleName: string;
    decisionMode: Exclude<BlueDecisionMode, 'LEGACY'>;
    manualAdjust: BlueDecisionManualAdjust | null;
    selectedBlue: string[];
  }
): Promise<BlueDecisionSnapshot> {
  const response = await request.post(`/ssq/window/decision/blue/snapshot/${id}/update`, payload);
  return unwrapResponse<BlueDecisionSnapshot>(response);
}

export async function renameBlueDecision(id: number, sampleName: string): Promise<BlueDecisionSnapshot> {
  const response = await request.post(`/ssq/window/decision/blue/snapshot/${id}/rename`, { sampleName });
  return unwrapResponse<BlueDecisionSnapshot>(response);
}

export async function listBlueDecision(predictQiHao: string): Promise<BlueDecisionSnapshot[]> {
  const response = await request.get('/ssq/window/decision/blue/snapshot/list', {
    params: { predictQiHao }
  });
  return unwrapResponse<BlueDecisionSnapshot[]>(response);
}

export async function getBlueDecision(id: number): Promise<BlueDecisionSnapshot> {
  const response = await request.get(`/ssq/window/decision/blue/snapshot/${id}`);
  return unwrapResponse<BlueDecisionSnapshot>(response);
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

export async function deleteBlueDecisionSnapshots(ids: number[]): Promise<{ deletedCount: number }> {
  const response = await request.post('/ssq/window/decision/blue/snapshot/delete-batch', { ids });
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
