import { request } from '../request';

export interface LevelInfo {
  level: number;
  positions: string[];
  hitPositions: string[];
  willDownPositions: string[];
}

export interface RepeatPositionWindow {
  windowCode: string;
  windowName: string;
  windowSize: number;
  stateText: string;
  levels: LevelInfo[];
}

export interface HistoryState {
  completedState: string;
  totalCount: number;
  currentYearCount: number;
  hitCount: number;
  levelHitCounts: Record<string, number>;
  yearlyCounts: Record<string, number>;
}

export interface PrepareResult {
  predictQiHao: string;
  sourceQiHao: string | null;
  windows: RepeatPositionWindow[];
  historyStats: Record<string, HistoryState[]>;
  actualHitPositions: string[];
}

export interface PositionScore {
  position: string;
  score: number;
  decisionType: 'SELECT' | 'OBSERVE' | 'EXCLUDE';
  reason: string;
}

export interface SnapshotResult {
  id: number;
  predictQiHao: string;
  sampleName: string;
  scores: PositionScore[];
  selectedPositions: string[];
  actualHitPositions: string[];
  reviewStatus: string;
  createdAt: string;
  reviewedAt: string | null;
}

export async function initRepeatPositionSchema(): Promise<number> {
  return unwrap<{ count: number }>(await request.post('/ssq/window/decision/repeat-position/schema/init')).count;
}

export async function importRepeatPositionOrders(payload: {
  url: string;
  username: string;
  password: string;
}): Promise<number> {
  return unwrap<{ count: number }>(await request.post('/ssq/window/decision/repeat-position/draw-order/import', payload)).count;
}

export async function initRepeatPositionWindow(): Promise<number> {
  return unwrap<{ count: number }>(await request.post('/ssq/window/decision/repeat-position/window/init')).count;
}

export async function syncRepeatPositionWindow(): Promise<number> {
  return unwrap<{ count: number }>(await request.post('/ssq/window/decision/repeat-position/window/sync')).count;
}

export async function prepareRepeatPosition(predictQiHao: string): Promise<PrepareResult> {
  return unwrap<PrepareResult>(await request.get('/ssq/window/decision/repeat-position/prepare', { params: { predictQiHao } }));
}

export async function scoreRepeatPositions(predictQiHao: string, scores: PositionScore[]) {
  return unwrap(await request.post('/ssq/window/decision/repeat-position/score', { predictQiHao, scores }));
}

export async function saveRepeatPositionSnapshot(payload: {
  predictQiHao: string;
  sampleName: string;
  scores: PositionScore[];
  selectedPositions: string[];
}): Promise<SnapshotResult> {
  return unwrap<SnapshotResult>(await request.post('/ssq/window/decision/repeat-position/snapshot/save', payload));
}

export async function updateRepeatPositionSnapshot(id: number, payload: {
  predictQiHao: string;
  sampleName: string;
  scores: PositionScore[];
  selectedPositions: string[];
}): Promise<SnapshotResult> {
  return unwrap<SnapshotResult>(await request.post(`/ssq/window/decision/repeat-position/snapshot/${id}/update`, payload));
}

export async function getRepeatPositionSnapshot(id: number): Promise<SnapshotResult> {
  return unwrap<SnapshotResult>(await request.get(`/ssq/window/decision/repeat-position/snapshot/${id}`));
}

export async function listRepeatPositionSnapshots(predictQiHao: string): Promise<SnapshotResult[]> {
  return unwrap<SnapshotResult[]>(await request.get('/ssq/window/decision/repeat-position/snapshot/list', { params: { predictQiHao } }));
}

export async function reviewRepeatPositionSnapshot(id: number): Promise<SnapshotResult> {
  return unwrap<SnapshotResult>(await request.post(`/ssq/window/decision/repeat-position/snapshot/${id}/review`));
}

export async function reviewRepeatPositionSnapshots(predictQiHao: string): Promise<SnapshotResult[]> {
  return unwrap<SnapshotResult[]>(await request.post('/ssq/window/decision/repeat-position/snapshot/review-batch', {
    predictQiHao, ids: []
  }));
}

function unwrap<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'code' in response) {
    const wrapped = response as { code?: number; msg?: string; data?: unknown };
    if (wrapped.code !== 200 && wrapped.code !== 0) throw new Error(wrapped.msg || `接口返回异常：${wrapped.code}`);
    return wrapped.data as T;
  }
  return response as T;
}
