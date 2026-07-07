<template>
  <div class="p-4 space-y-4">
    <LatestDrawInfo :data="lotteryStore.latestDraw" />

    <section class="card">
      <div class="toolbar">
        <div>
          <div class="title-row">
            <h1>红球窗口决策台</h1>
            <div class="segmented">
              <button :class="{ active: targetType === 'RED' }" @click="switchTarget('RED')">红球</button>
              <button :class="{ active: targetType === 'RED_TAIL' }" @click="switchTarget('RED_TAIL')">红尾</button>
            </div>
          </div>
          <p>窗口等级观察、候选池、多来源组合筛选与快照复盘相互独立。</p>
        </div>
        <div class="actions">
          <input v-model="predictQiHao" class="field period" placeholder="预测期号" />
          <button class="btn primary" :disabled="loading" @click="loadPrepare">读取窗口</button>
          <button class="btn" :disabled="!prepare" @click="runScore">生成候选池</button>
        </div>
      </div>
      <div v-if="message" class="message" :class="error ? 'error' : 'ok'">{{ message }}</div>
    </section>

    <section v-if="prepare" class="window-grid">
      <article v-for="window in prepare.windows" :key="window.windowCode" class="card window-card">
        <div class="window-head">
          <strong>{{ window.windowName }}</strong><small>{{ window.stateText }}</small>
        </div>
        <div v-for="level in window.levels" :key="level.level" class="level-row" :class="decisionClass(window.windowCode, level.level)">
          <div class="level-title">lv{{ level.level }}</div>
          <div class="balls">
            <span v-for="number in level.numbers" :key="number" class="ball" :class="{ mapped: isMapped(number), down: level.willDownNumbers.includes(number) }">
              {{ formatWindowNumber(number) }}{{ level.willDownNumbers.includes(number) ? '↓' : '' }}
            </span>
          </div>
          <div class="source-controls">
            <input v-model="conditionDraft[key(window.windowCode, level.level)].enabled" type="checkbox" @change="refreshScoreIfReady" />
            <select
              v-model="conditionDraft[key(window.windowCode, level.level)].decisionType"
              class="mini-field"
              :class="decisionTextClass(conditionDraft[key(window.windowCode, level.level)].decisionType)"
              @change="changeDecisionType(window.windowCode, level.level)"
            >
              <option class="source-text-select">选择</option><option class="source-text-watch">观察</option><option class="source-text-exclude">排除</option>
            </select>
            <input v-model.number="conditionDraft[key(window.windowCode, level.level)].score" class="mini-field score" type="number" step="0.5" @change="refreshScoreIfReady" />
          </div>
        </div>
      </article>
    </section>

    <section v-if="prepare" class="card">
      <div class="section-head">
        <div><h2>候选池与跨窗口落点</h2><p>交集要求号码同时满足全部已勾选等级；并集保留任一等级命中。</p></div>
        <div class="actions">
          <div class="segmented"><button :class="{ active: mergeMode === 'UNION' }" @click="changeMergeMode('UNION')">并集</button><button :class="{ active: mergeMode === 'INTERSECTION' }" @click="changeMergeMode('INTERSECTION')">交集</button></div>
          <button class="btn" @click="selectAllCandidates">候选池作为来源</button>
        </div>
      </div>
      <div class="candidate-grid">
        <label v-for="row in candidateRows" :key="row.number" class="candidate" :class="{ selected: candidateRed.includes(row.number) }">
          <input type="checkbox" :checked="candidateRed.includes(row.number)" @change="toggleCandidate(row.number)" />
          <strong>{{ row.number }}</strong><small>{{ formatScore(row.score) }}</small>
        </label>
      </div>
      <div class="score-table-wrap">
        <table><thead><tr><th>排名</th><th>红球</th><th>分</th><th>窗口等级</th><th>依据</th></tr></thead>
          <tbody><tr v-for="(item, index) in score?.scores || []" :key="item.number">
            <td>{{ index + 1 }}</td><td class="red-text">{{ item.number }}</td><td>{{ item.score }}</td>
            <td>{{ levelText(item.windowLevels) }}</td><td>{{ item.reasons.join('；') }}</td>
          </tr></tbody>
        </table>
      </div>
    </section>

    <section v-if="prepare" class="card">
      <div class="section-head history-head">
        <div>
          <div class="title-row">
            <h2>同状态历史统计</h2>
            <button class="history-tab" :class="{ active: selectedHistoryWindow === 'ALL' }" @click="selectedHistoryWindow = 'ALL'">全部</button>
            <button v-for="window in prepare.windows" :key="window.windowCode" class="history-tab window-history-tab" :class="{ active: selectedHistoryWindow === window.windowCode }" @click="selectedHistoryWindow = window.windowCode">
              <span>{{ window.windowName }}</span><small>{{ window.stateText }}</small>
            </button>
          </div>
          <p>严格排除目标期及未来；在蓝球同款视图上增加完成状态和命中数量两种口径。</p>
        </div>
        <div class="actions">
          <div class="segmented"><button :class="{ active: historyResultMode === 'COMPLETION' }" @click="switchHistoryResultMode('COMPLETION')">完成状态</button><button :class="{ active: historyResultMode === 'HIT_COUNT' }" @click="switchHistoryResultMode('HIT_COUNT')">命中数量</button></div>
          <button class="btn" @click="historyCollapsed = !historyCollapsed">{{ historyCollapsed ? '展开' : '收起' }}</button>
        </div>
      </div>

      <div v-if="!historyCollapsed && selectedHistoryWindow === 'ALL'" class="history-window-grid">
        <article v-for="window in prepare.windows" :key="window.windowCode" class="history-card">
          <div class="history-card-head"><strong>{{ window.windowName }}</strong><div class="segmented"><button :class="{ active: historyViewMode[window.windowCode] === 'year' }" @click="historyViewMode[window.windowCode] = 'year'">年度</button><button :class="{ active: historyViewMode[window.windowCode] === 'all' }" @click="historyViewMode[window.windowCode] = 'all'">全期</button></div></div>
          <template v-if="historyViewMode[window.windowCode] === 'year'">
            <div class="state-tabs"><button v-for="item in historyItems(window.windowCode)" :key="item.state" class="history-tab" :class="{ active: activeHistoryState[window.windowCode] === item.state }" @click="activeHistoryState[window.windowCode] = item.state">{{ item.state }}：{{ item.count }}<small>今{{ item.currentYearCount }}</small></button></div>
            <div class="history-summary">{{ distributionText(window.windowCode, activeHistoryState[window.windowCode]) }}</div>
            <table><thead><tr><th>年份({{ yearRows(window.windowCode, activeHistoryState[window.windowCode]).length }}年)</th><th>次数</th></tr></thead><tbody><tr v-for="row in yearRows(window.windowCode, activeHistoryState[window.windowCode])" :key="row.year" :class="{ current: row.year === currentHistoryYear }"><td>{{ row.year }}</td><td>{{ row.count }}</td></tr></tbody></table>
          </template>
          <table v-else><thead><tr><th>状态</th><th>次数</th><th>今年</th></tr></thead><tbody><tr v-for="item in historyItems(window.windowCode)" :key="item.state"><td>{{ item.state }}</td><td>{{ item.count }}</td><td :class="{ current: item.currentYearCount > 0 }">{{ item.currentYearCount }}</td></tr></tbody></table>
          <div v-if="historyItems(window.windowCode).length === 0" class="empty">暂无相同状态记录</div>
        </article>
      </div>

      <div v-if="!historyCollapsed && selectedHistoryWindow !== 'ALL'" class="history-state-grid">
        <article v-for="item in selectedHistoryItems" :key="item.state" class="history-card">
          <div class="history-card-head"><strong>{{ item.state }}</strong><span class="history-meta">全{{ item.count }}/今{{ item.currentYearCount }}</span></div>
          <div class="history-summary">{{ distributionText(selectedHistoryWindow, item.state) }}</div>
          <table><thead><tr><th>年份({{ yearRows(selectedHistoryWindow, item.state).length }}年)</th><th>次数</th></tr></thead><tbody><tr v-for="row in yearRows(selectedHistoryWindow, item.state)" :key="row.year" :class="{ current: row.year === currentHistoryYear }"><td>{{ row.year }}</td><td>{{ row.count }}</td></tr></tbody></table>
        </article>
        <div v-if="selectedHistoryItems.length === 0" class="empty">暂无相同状态记录</div>
      </div>
    </section>

    <section class="card">
      <div class="section-head">
        <div><h2>复式、胆拖与单式来源</h2><p>单式可来自候选池、任意复式或胆拖；相同组合自动去重并保留来源数。</p></div>
        <div class="actions"><button class="btn" @click="addCompound">新增复式</button><button class="btn" @click="addDantuo">新增胆拖</button></div>
      </div>
      <div class="source-grid">
        <article v-for="(source, index) in sources" :key="source.id" class="source-card">
          <div class="source-head"><strong>{{ source.name }}</strong><button class="plain" @click="sources.splice(index, 1)">删除</button></div>
          <template v-if="source.type === 'COMPOUND'">
            <label>红球池<input v-model="source.redPoolText" class="field" placeholder="01,02,03,04,05,06" /></label>
          </template>
          <template v-else>
            <label>胆码<input v-model="source.bankersText" class="field" placeholder="01" /></label>
            <label>拖码<input v-model="source.dragsText" class="field" placeholder="02,03,04,05,06,07" /></label>
          </template>
        </article>
      </div>

      <details class="filters" open>
        <summary>组合硬筛选</summary>
        <div class="filter-grid">
          <label>和值<input v-model.number="filter.minSum" class="field small" type="number" placeholder="最小" /><input v-model.number="filter.maxSum" class="field small" type="number" placeholder="最大" /></label>
          <label>跨度<input v-model.number="filter.minSpan" class="field small" type="number" placeholder="最小" /><input v-model.number="filter.maxSpan" class="field small" type="number" placeholder="最大" /></label>
          <label>AC<input v-model.number="filter.minAc" class="field small" type="number" placeholder="最小" /><input v-model.number="filter.maxAc" class="field small" type="number" placeholder="最大" /></label>
          <label>奇数个数<input v-model="filter.oddCounts" class="field" placeholder="2,3,4" /></label>
          <label>质数个数<input v-model="filter.primeCounts" class="field" placeholder="2,3" /></label>
          <label>大号个数<input v-model="filter.bigCounts" class="field" placeholder="2,3,4" /></label>
          <label>不同尾数<input v-model="filter.distinctTailCounts" class="field" placeholder="4,5,6" /></label>
          <label>二连组数<input v-model.number="filter.twoRunCount" class="field" type="number" /></label>
          <label>三连组数<input v-model.number="filter.threeRunCount" class="field" type="number" /></label>
          <label>最大连号<input v-model.number="filter.maxRunLength" class="field" type="number" /></label>
          <label>必含<input v-model="filter.requiredNumbers" class="field" placeholder="01,02" /></label>
          <label>排除<input v-model="filter.excludedNumbers" class="field" placeholder="32,33" /></label>
          <label>最少来源数<input v-model.number="filter.minSourceSupport" class="field" type="number" min="1" /></label>
        </div>
      </details>
      <div class="actions mt"><button class="btn primary" :disabled="filtering" @click="runFilter(1)">筛选组合</button><span v-if="combinations">来源 {{ combinations.sourceCombinationCount }} 注 → 剩余 {{ combinations.filteredCount }} 注</span></div>
      <div v-if="combinations" class="score-table-wrap">
        <table><thead><tr><th>保留</th><th>组合</th><th>来源</th><th>和值</th><th>跨度</th><th>AC</th><th>奇/质/大</th><th>三区</th><th>尾数</th><th>连号</th></tr></thead>
          <tbody><tr v-for="item in combinations.items" :key="item.combinationId">
            <td><input v-model="selectedCombinationIds" type="checkbox" :value="item.combinationId" /></td>
            <td class="red-text">{{ item.reds.join(',') }}</td><td>{{ item.supportCount }} / {{ item.sourceIds.join(',') }}</td>
            <td>{{ item.sum }}</td><td>{{ item.span }}</td><td>{{ item.ac }}</td><td>{{ item.oddCount }}/{{ item.primeCount }}/{{ item.bigCount }}</td>
            <td>{{ item.areaRatio }}</td><td>{{ item.distinctTailCount }}</td><td>最长{{ item.maxRunLength }}；2连{{ item.twoRunCount }}；3连{{ item.threeRunCount }}</td>
          </tr></tbody>
        </table>
        <div class="pager"><button class="btn" :disabled="combinations.page <= 1" @click="runFilter(combinations.page - 1)">上一页</button><span>第 {{ combinations.page }} 页</span><button class="btn" :disabled="combinations.page * combinations.size >= combinations.filteredCount" @click="runFilter(combinations.page + 1)">下一页</button></div>
      </div>
    </section>

    <section class="card">
      <div class="section-head"><div><h2>决策快照</h2><p>保存完整条件、来源、筛选器和人工保留单式；复盘只读取开奖前快照。</p></div>
        <div class="actions"><input v-model="sampleName" class="field" placeholder="样本名称" /><label><input v-model="testData" type="checkbox" /> 测试数据</label><button class="btn primary" @click="saveSnapshot(false)">新增样本</button><button class="btn" :disabled="!editingSnapshotId" @click="saveSnapshot(true)">修改样本</button><button class="btn" @click="loadSnapshots">读取样本</button></div>
      </div>
      <div class="score-table-wrap"><table><thead><tr><th>ID</th><th>期号</th><th>名称</th><th>候选池</th><th>保留单式</th><th>状态</th><th>操作</th></tr></thead>
        <tbody><tr v-for="item in snapshots" :key="item.id"><td>{{ item.id }}</td><td>{{ item.predictQiHao }}</td><td>{{ item.sampleName }}</td><td>{{ arrayCount(item.decisionData.candidateRed) }}</td><td>{{ arrayCount(item.decisionData.singleTickets) }}</td><td>{{ item.reviewStatus }}</td><td><button class="plain" @click="restoreSnapshot(item)">回显</button><button class="plain" @click="reviewSnapshot(item.id)">复盘</button></td></tr></tbody>
      </table></div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import LatestDrawInfo from '@/components/lottery/LatestDrawInfo.vue';
import { useLotteryStore } from '@/stores/lottery';
import {
  filterRedCombinations, getRedSnapshot, historyRedDecision, listRedSnapshots, prepareRedDecision,
  reviewRedSnapshot, saveRedSnapshot, scoreRedDecision, updateRedSnapshot,
  type CombinationResult, type HistoryResult, type MergeMode,
  type RedPrepare, type RedScore, type RedSnapshot, type RedTargetType, type SchemeSource
} from '@/api/modules/redDecision';

interface ConditionDraft { enabled: boolean; decisionType: string; score: number }
interface SourceDraft extends SchemeSource { redPoolText: string; bankersText: string; dragsText: string }
interface FilterDraft { [key: string]: string | number | null }

const lotteryStore = useLotteryStore();
const allReds = Array.from({ length: 33 }, (_, index) => String(index + 1).padStart(2, '0'));
const predictQiHao = ref('');
const targetType = ref<RedTargetType>('RED');
const mergeMode = ref<MergeMode>('UNION');
const prepare = ref<RedPrepare | null>(null);
const score = ref<RedScore | null>(null);
const candidateRed = ref<string[]>([]);
const conditionDraft = reactive<Record<string, ConditionDraft>>({});
const loading = ref(false);
const filtering = ref(false);
const message = ref('');
const error = ref(false);
const historyResultMode = ref<'COMPLETION' | 'HIT_COUNT'>('COMPLETION');
const historyByWindow = reactive<Record<string, HistoryResult>>({});
const historyViewMode = reactive<Record<string, 'year' | 'all'>>({});
const activeHistoryState = reactive<Record<string, string>>({});
const selectedHistoryWindow = ref('ALL');
const historyCollapsed = ref(false);
const sources = reactive<SourceDraft[]>([]);
const combinations = ref<CombinationResult | null>(null);
const selectedCombinationIds = ref<number[]>([]);
const snapshots = ref<RedSnapshot[]>([]);
const editingSnapshotId = ref<number | null>(null);
const sampleName = ref('');
const testData = ref(false);
const filter = reactive<FilterDraft>({ minSum: null, maxSum: null, minSpan: null, maxSpan: null, minAc: null, maxAc: null, oddCounts: '', primeCounts: '', bigCounts: '', distinctTailCounts: '', twoRunCount: null, threeRunCount: null, maxRunLength: null, requiredNumbers: '', excludedNumbers: '', minSourceSupport: 1 });

const activeRedNumbers = computed(() => {
  const result = new Set<string>();
  if (!prepare.value) return result;
  for (const window of prepare.value.windows) for (const level of window.levels) {
    if (!conditionDraft[key(window.windowCode, level.level)]?.enabled) continue;
    for (const number of level.numbers) {
      if (targetType.value === 'RED') result.add(number);
      else for (const red of allReds) if (Number(red) % 10 === Number(number)) result.add(red);
    }
  }
  return result;
});
const currentHistoryYear = computed(() => Number(predictQiHao.value.slice(0, 4)) || new Date().getFullYear());
const selectedHistoryItems = computed(() => historyItems(selectedHistoryWindow.value));
const candidateRows = computed(() => {
  const byNumber = new Map((score.value?.scores || []).map(item => [item.number, item.score]));
  return allReds.map(number => ({ number, score: byNumber.get(number) }))
    .sort((left, right) => (right.score ?? -Infinity) - (left.score ?? -Infinity) || Number(left.number) - Number(right.number));
});

function key(windowCode: string, level: number) { return `${windowCode}:${level}`; }
function switchTarget(type: RedTargetType) { targetType.value = type; prepare.value = null; score.value = null; clearHistory(); candidateRed.value = []; }
function formatWindowNumber(number: string) { return targetType.value === 'RED' ? number : `尾${number}`; }
function decisionClass(windowCode: string, level: number) { const item = conditionDraft[key(windowCode, level)]; return item?.enabled ? `decision-${item.decisionType}` : ''; }
function isMapped(number: string) { return targetType.value === 'RED' ? activeRedNumbers.value.has(number) : [...activeRedNumbers.value].some(red => Number(red) % 10 === Number(number)); }
function decisionTextClass(type: string) { return type === '选择' ? 'source-text-select' : type === '排除' ? 'source-text-exclude' : 'source-text-watch'; }
function defaultScore(type: string) { return type === '选择' ? 1 : type === '排除' ? -0.5 : 0.5; }
function formatScore(value?: number) { return value == null ? '-' : Number(value.toFixed(2)); }
function levelText(levels: Record<string, number>) { return Object.entries(levels).map(([code, level]) => `${code.replaceAll('_', '')}:lv${level}`).join(' / '); }
function arrayCount(value: unknown) { return Array.isArray(value) ? value.length : 0; }

async function changeDecisionType(windowCode: string, level: number) {
  const item = conditionDraft[key(windowCode, level)];
  item.score = defaultScore(item.decisionType);
  await refreshScoreIfReady();
}

async function refreshScoreIfReady() {
  if (!prepare.value || loading.value) return;
  await runScore();
}

async function changeMergeMode(mode: MergeMode) {
  mergeMode.value = mode;
  await refreshScoreIfReady();
}

async function loadPrepare() {
  await run(async () => {
    prepare.value = await prepareRedDecision(predictQiHao.value, targetType.value);
    Object.keys(conditionDraft).forEach(item => delete conditionDraft[item]);
    for (const window of prepare.value.windows) for (const level of window.levels) conditionDraft[key(window.windowCode, level.level)] = { enabled: false, decisionType: '观察', score: 0.5 };
    selectedHistoryWindow.value = 'ALL';
    await loadAllHistory();
    message.value = `已读取${prepare.value.windows.length}个窗口`;
  });
}

async function runScore() {
  await run(async () => {
    const conditions = Object.entries(conditionDraft).filter(([, item]) => item.enabled).map(([sourceKey, item]) => {
      const [windowCode, level] = sourceKey.split(':');
      return { name: `${windowCode} lv${level}`, decisionType: item.decisionType, score: item.score, windowCode, level: Number(level) };
    });
    score.value = await scoreRedDecision({ predictQiHao: predictQiHao.value, targetType: targetType.value, mergeMode: mergeMode.value, conditions, ballAdjust: {}, forcedNumbers: candidateRed.value, excludedNumbers: [] });
    candidateRed.value = [...score.value.candidateRed];
  });
}

function toggleCandidate(number: string) { candidateRed.value = candidateRed.value.includes(number) ? candidateRed.value.filter(item => item !== number) : [...candidateRed.value, number].sort(); }
function selectAllCandidates() {
  if (candidateRed.value.length < 6) return showError('候选池至少需要6个红球');
  sources.push(sourceDraft('COMPOUND', candidateRed.value.join(',')));
}
function addCompound() { sources.push(sourceDraft('COMPOUND', '')); }
function addDantuo() { sources.push(sourceDraft('DANTUO', '')); }
function sourceDraft(type: 'COMPOUND' | 'DANTUO', pool: string): SourceDraft {
  const id = `S${Date.now()}${sources.length}`;
  return { id, name: type === 'DANTUO' ? `胆拖${sources.length + 1}` : `复式${sources.length + 1}`, type, redPool: [], bankers: [], drags: [], redPoolText: pool, bankersText: '', dragsText: '' };
}

async function loadAllHistory() {
  if (!prepare.value) return;
  clearHistory();
  const results = await Promise.all(prepare.value.windows.map(window => historyRedDecision({ predictQiHao: predictQiHao.value, windowCode: window.windowCode, mode: historyResultMode.value })));
  for (const result of results) {
    historyByWindow[result.windowCode] = result;
    historyViewMode[result.windowCode] = 'year';
    activeHistoryState[result.windowCode] = result.items[0]?.state || '';
  }
}

async function switchHistoryResultMode(mode: 'COMPLETION' | 'HIT_COUNT') {
  if (historyResultMode.value === mode) return;
  historyResultMode.value = mode;
  await run(loadAllHistory);
}

function clearHistory() {
  Object.keys(historyByWindow).forEach(key => delete historyByWindow[key]);
  Object.keys(historyViewMode).forEach(key => delete historyViewMode[key]);
  Object.keys(activeHistoryState).forEach(key => delete activeHistoryState[key]);
}

function historyItems(windowCode: string) {
  return historyByWindow[windowCode]?.items || [];
}

function yearRows(windowCode: string, state: string) {
  const item = historyItems(windowCode).find(row => row.state === state);
  return Object.entries(item?.yearlyCounts || {}).map(([year, count]) => ({ year: Number(year), count })).sort((a, b) => a.year - b.year);
}

function distributionText(windowCode: string, state: string) {
  const counts = yearRows(windowCode, state).map(row => row.count);
  if (counts.length === 0) return '暂无年度分布';
  const distinct = [...new Set(counts)].sort((a, b) => a - b);
  const average = counts.reduce((sum, value) => sum + value, 0) / counts.length;
  return `${distinct.join(' · ')}　均值 ${average.toFixed(2)}`;
}

async function runFilter(page: number) {
  filtering.value = true;
  await run(async () => {
    combinations.value = await filterRedCombinations({ sources: sourcePayload(), filter: filterPayload(), page, size: 20 });
  });
  filtering.value = false;
}

function sourcePayload() {
  return sources.map(source => ({ id: source.id, name: source.name, type: source.type, redPool: numbers(source.redPoolText), bankers: numbers(source.bankersText), drags: numbers(source.dragsText) }));
}
function filterPayload() {
  return { minSum: numeric(filter.minSum), maxSum: numeric(filter.maxSum), minSpan: numeric(filter.minSpan), maxSpan: numeric(filter.maxSpan), minAc: numeric(filter.minAc), maxAc: numeric(filter.maxAc), oddCounts: numbers(String(filter.oddCounts || '')), primeCounts: numbers(String(filter.primeCounts || '')), bigCounts: numbers(String(filter.bigCounts || '')), distinctTailCounts: numbers(String(filter.distinctTailCounts || '')), twoRunCount: numeric(filter.twoRunCount), threeRunCount: numeric(filter.threeRunCount), maxRunLength: numeric(filter.maxRunLength), requiredNumbers: numbers(String(filter.requiredNumbers || '')), excludedNumbers: numbers(String(filter.excludedNumbers || '')), minSourceSupport: numeric(filter.minSourceSupport) };
}
function numbers(text: string) { return [...new Set(text.split(/[，,\s]+/).map(Number).filter(value => Number.isInteger(value) && value > 0))].sort((a, b) => a - b); }
function numeric(value: unknown) { return value === '' || value == null || Number.isNaN(Number(value)) ? null : Number(value); }

function decisionData() {
  const retained = (combinations.value?.items || []).filter(item => selectedCombinationIds.value.includes(item.combinationId));
  return { targetType: targetType.value, mergeMode: mergeMode.value, conditions: JSON.parse(JSON.stringify(conditionDraft)), candidateRed: candidateRed.value, sources: sourcePayload(), filter: filterPayload(), selectedCombinationIds: selectedCombinationIds.value, singleTickets: retained.map(item => item.reds), combinationItems: retained };
}

async function saveSnapshot(update: boolean) {
  await run(async () => {
    const payload = { predictQiHao: predictQiHao.value, sampleName: sampleName.value, decisionData: decisionData(), testData: testData.value };
    const saved = update && editingSnapshotId.value ? await updateRedSnapshot(editingSnapshotId.value, payload) : await saveRedSnapshot(payload);
    editingSnapshotId.value = saved.id;
    await loadSnapshots();
  });
}
async function loadSnapshots() { snapshots.value = await listRedSnapshots(predictQiHao.value); }
async function restoreSnapshot(item: RedSnapshot) {
  const detail = await getRedSnapshot(item.id); editingSnapshotId.value = detail.id; sampleName.value = detail.sampleName; testData.value = detail.testData;
  const data = detail.decisionData as Record<string, unknown>;
  candidateRed.value = Array.isArray(data.candidateRed) ? data.candidateRed.map(String) : [];
  selectedCombinationIds.value = Array.isArray(data.selectedCombinationIds) ? data.selectedCombinationIds.map(Number) : [];
  if (Array.isArray(data.sources)) { sources.splice(0); for (const raw of data.sources as SchemeSource[]) sources.push({ ...raw, redPoolText: raw.redPool.join(','), bankersText: raw.bankers.join(','), dragsText: raw.drags.join(',') }); }
}
async function reviewSnapshot(id: number) { await run(async () => { await reviewRedSnapshot(id); await loadSnapshots(); }); }

async function run(task: () => Promise<void>) { loading.value = true; error.value = false; try { await task(); } catch (reason) { showError(reason instanceof Error ? reason.message : String(reason)); } finally { loading.value = false; } }
function showError(text: string) { error.value = true; message.value = text; }

onMounted(async () => {
  await lotteryStore.loadLatestFromDB();
  predictQiHao.value = lotteryStore.latestDraw?.nextQiHao || lotteryStore.latestDraw?.qiHao || '';
  if (predictQiHao.value) await loadPrepare();
});
</script>

<style scoped>
.card{border:1px solid rgba(234,234,234,.11);border-radius:8px;background:var(--color-bg-card);padding:14px}.toolbar,.section-head,.window-head,.source-head,.actions,.title-row,.history-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}h1{font-size:18px;font-weight:700}h2{font-weight:700}p,small{color:var(--color-text-secondary);font-size:12px}.segmented{display:inline-flex;overflow:hidden;border:1px solid rgba(234,234,234,.15);border-radius:6px}.segmented button{padding:5px 9px;color:var(--color-text-secondary)}.segmented button.active{background:var(--color-accent);color:#fff}.btn{border-radius:5px;background:rgba(15,27,56,.85);padding:7px 10px;font-size:12px}.btn.primary{background:var(--color-accent);color:#fff}.btn:disabled{opacity:.45}.field,.mini-field{border:1px solid rgba(234,234,234,.15);border-radius:5px;background:rgba(15,27,56,.75);padding:6px 8px;color:var(--color-text-primary);font-size:12px}.period{width:110px}.mini-field{padding:3px 4px}.mini-field.score{width:52px}.source-text-select{border-color:rgba(245,196,76,.65);color:#f5c451}.source-text-watch{border-color:rgba(71,151,255,.6);color:#7db7ff}.source-text-exclude{border-color:rgba(160,160,160,.5);color:#9ca3af}.message{margin-top:8px;font-size:12px}.message.ok{color:#34d399}.message.error{color:#fb7185}.window-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.window-card{min-width:0}.level-row{display:grid;grid-template-columns:38px minmax(0,1fr) auto;align-items:start;gap:8px;margin-top:8px;border-left:3px solid transparent;padding:6px 0 6px 7px}.level-title{padding-top:4px;color:var(--color-text-secondary);font-size:12px}.source-controls{display:flex;align-items:center;gap:5px}.decision-选择{border-color:#f5c451}.decision-观察{border-color:#4f8cff}.decision-排除{border-color:#8992a3}.balls{display:flex;flex-wrap:wrap;gap:4px}.ball{border-radius:999px;background:rgba(55,66,250,.28);padding:3px 7px;font-size:11px}.ball.mapped{outline:1px solid #f5c451;color:#fff}.ball.down{border:1px solid #8992a3}.candidate-grid{display:grid;grid-template-columns:repeat(11,minmax(44px,1fr));gap:5px;margin-top:10px}.candidate{display:flex;align-items:center;justify-content:center;gap:4px;border:1px solid rgba(234,234,234,.1);border-radius:5px;padding:6px;font-size:12px}.candidate.selected{border-color:var(--color-accent);background:rgba(233,69,96,.15)}.candidate small{font-size:9px}.score-table-wrap{overflow-x:auto;margin-top:12px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:rgba(15,27,56,.88);padding:7px;text-align:left;white-space:nowrap}td{border-bottom:1px solid rgba(234,234,234,.08);padding:7px;vertical-align:top}.red-text{color:#ff6b7d;font-weight:700}.history-head{align-items:flex-start}.history-tab{border-radius:999px;background:rgba(55,66,250,.22);padding:5px 9px;color:var(--color-text-secondary);font-size:12px}.history-tab.active{background:var(--color-accent);color:#fff}.window-history-tab{display:inline-flex;min-width:80px;flex-direction:column;align-items:center;gap:1px}.window-history-tab small{font-size:10px}.history-window-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.history-state-grid,.source-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:8px;margin-top:10px}.history-card,.source-card{min-width:0;border:1px solid rgba(234,234,234,.1);border-radius:6px;background:rgba(15,27,56,.45);padding:10px}.state-tabs{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.state-tabs small{margin-left:4px}.history-summary{margin:8px 0;border:1px solid rgba(234,234,234,.1);border-radius:5px;padding:6px;color:var(--color-text-secondary);font-size:11px}.history-meta{border-radius:999px;background:rgba(255,255,255,.08);padding:2px 7px;font-size:11px}.current{background:rgba(233,69,96,.2);color:#fff;font-weight:700}.source-card label{display:grid;gap:4px;margin-top:7px;color:var(--color-text-secondary);font-size:11px}.plain{margin-left:8px;color:#8fb2ff;font-size:12px}.filters{margin-top:12px}.filters summary{cursor:pointer;font-weight:700}.filter-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;margin-top:8px}.filter-grid label{display:flex;align-items:center;gap:5px;color:var(--color-text-secondary);font-size:11px}.filter-grid .field{min-width:0;flex:1}.field.small{width:55px}.mt{margin-top:12px}.pager{display:flex;justify-content:center;align-items:center;gap:10px;margin-top:10px}.empty{text-align:center;color:var(--color-text-secondary);padding:15px}@media(max-width:900px){.window-grid,.history-window-grid{grid-template-columns:1fr}.candidate-grid{grid-template-columns:repeat(7,1fr)}}@media(max-width:640px){.level-row{grid-template-columns:32px 1fr}.source-controls{grid-column:2}.candidate-grid{grid-template-columns:repeat(4,1fr)}}
</style>
