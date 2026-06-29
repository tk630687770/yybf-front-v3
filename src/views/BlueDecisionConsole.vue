<template>
  <div class="p-4 space-y-4">
    <LatestDrawInfo :data="lotteryStore.latestDraw" />

    <section class="decision-card">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-lg font-bold">蓝球窗口决策台</h1>
          <p class="text-xs text-text-secondary">按蓝10/16/32窗口逐步观察、调权、保存样本并复盘。</p>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <div class="relative flex items-center">
            <input
              v-model="predictQiHao"
              class="w-24 h-8 px-2 pr-6 text-xs bg-bg-secondary text-text-primary rounded-l border border-r-0 border-gray-600 focus:outline-none focus:border-accent"
              placeholder="预测期号"
              @keydown.up.prevent="moveQiHao(-1)"
              @keydown.down.prevent="moveQiHao(1)"
              @keydown.enter.prevent="loadPrepare"
              @focus="showQiHaoDropdown = predictQiHao.length >= 4"
              @blur="hideQiHaoDropdown"
            />
            <div class="absolute right-1 flex flex-col">
              <button class="w-4 h-2 leading-none text-text-secondary hover:text-text-primary" @mousedown.prevent="moveQiHao(-1)">▲</button>
              <button class="w-4 h-2 leading-none text-text-secondary hover:text-text-primary" @mousedown.prevent="moveQiHao(1)">▼</button>
            </div>
            <div
              v-if="showQiHaoDropdown && qiHaoSuggestions.length > 0"
              class="absolute top-full left-0 mt-1 w-full bg-bg-secondary border border-gray-600 rounded shadow-lg z-50 max-h-48 overflow-y-auto"
            >
              <div
                v-for="item in qiHaoSuggestions"
                :key="item"
                class="px-2 py-1 text-xs cursor-pointer hover:bg-accent"
                @mousedown.prevent="selectQiHao(item)"
              >
                {{ item }}
              </div>
            </div>
          </div>
          <button class="btn" :class="{ primary: showDrawBlue }" @click="showDrawBlue = !showDrawBlue">
            {{ showDrawBlue ? '隐藏开奖' : '显示开奖' }}
          </button>
          <button class="btn primary" :disabled="loading" @click="loadPrepare">读取窗口</button>
          <button class="btn" :disabled="loading || !prepare" @click="runScore">重新评分</button>
          <button class="btn danger" :disabled="loading" @click="clearTestData">删除测试数据</button>
        </div>
      </div>
      <div v-if="message" class="mt-3 text-xs" :class="messageClass">{{ message }}</div>
    </section>

    <section v-if="prepare" class="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div v-for="window in prepare.windows" :key="window.windowCode" class="decision-card">
        <div class="flex items-center justify-between gap-2">
          <h2 class="font-bold">{{ window.windowName }}</h2>
          <span class="text-xs text-text-secondary">状态：{{ window.stateText }}</span>
        </div>
        <div class="mt-3 space-y-2">
          <div v-for="level in displayLevels(window)" :key="level.level" class="level-row">
            <div class="level-title">lv{{ level.level }}</div>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="number in level.numbers"
                :key="number"
                class="blue-pill"
                :class="{
                  down: level.willDownNumbers.includes(number),
                  hit: showDrawBlue && isHitBlue(level, number)
                }"
              >
                {{ number }}{{ level.willDownNumbers.includes(number) ? '↓' : '' }}{{ showDrawBlue && isHitBlue(level, number) ? '★' : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="prepare" class="decision-card">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="font-bold">同状态历史完成统计</h2>
          <p class="text-xs text-text-secondary">模糊匹配当前初始状态，切换标签查看不同最终升级状态的年度分布。</p>
        </div>
        <button class="btn" @click="historyCollapsed = !historyCollapsed">
          {{ historyCollapsed ? '展开' : '收起' }}
        </button>
      </div>
      <div v-if="!historyCollapsed" class="mt-3 grid grid-cols-1 xl:grid-cols-3 gap-3">
        <div v-for="window in prepare.windows" :key="window.windowCode" class="history-card">
          <div class="flex items-center justify-between gap-2">
            <h3 class="font-bold">{{ window.windowName }}</h3>
            <div class="flex items-center gap-2">
              <span class="text-xs text-text-secondary">当前：{{ historyStat(window.windowCode)?.currentState || '--' }}</span>
              <button
                class="state-tab"
                :class="{ active: historyMode[window.windowCode] !== 'all' }"
                @click="setHistoryMode(window.windowCode, 'year')"
              >
                年度
              </button>
              <button
                class="state-tab"
                :class="{ active: historyMode[window.windowCode] === 'all' }"
                @click="setHistoryMode(window.windowCode, 'all')"
              >
                全期
              </button>
            </div>
          </div>
          <div v-if="historyMode[window.windowCode] !== 'all'" class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="item in historyStateRows(window.windowCode)"
              :key="item.state"
              class="state-tab"
              :class="{ active: activeHistoryState[window.windowCode] === item.state }"
              @click="activeHistoryState[window.windowCode] = item.state"
            >
              {{ item.state }}：{{ item.count }}
              <span class="state-badge">今{{ item.currentYearCount }}</span>
            </button>
          </div>
          <div v-if="historyMode[window.windowCode] !== 'all'" class="history-summary">
            {{ activeHistorySummary(window.windowCode) }}
          </div>
          <div class="table-wrap mt-3">
            <table class="decision-table">
              <thead>
                <tr v-if="historyMode[window.windowCode] === 'all'">
                  <th class="sortable" @click="sortHistory(window.windowCode, 'state')">
                    状态{{ sortMark(window.windowCode, 'state') }}
                  </th>
                  <th class="sortable" @click="sortHistory(window.windowCode, 'count')">
                    次数{{ sortMark(window.windowCode, 'count') }}
                  </th>
                  <th class="sortable" @click="sortHistory(window.windowCode, 'currentYearCount')">
                    今年次数{{ sortMark(window.windowCode, 'currentYearCount') }}
                  </th>
                </tr>
                <tr v-else>
                  <th class="sortable" @click="sortHistory(window.windowCode, 'year')">
                    年份{{ sortMark(window.windowCode, 'year') }}
                  </th>
                  <th class="sortable" @click="sortHistory(window.windowCode, 'count')">
                    次数{{ sortMark(window.windowCode, 'count') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-if="historyMode[window.windowCode] === 'all'">
                  <tr v-for="row in allHistoryRows(window.windowCode)" :key="row.state">
                    <td>{{ row.state }}</td>
                    <td>{{ row.count }}</td>
                    <td :class="{ 'current-year-cell': row.currentYearCount > 0 }">{{ row.currentYearCount }}</td>
                  </tr>
                </template>
                <template v-else>
                  <tr
                    v-for="row in historyYearRows(window.windowCode)"
                    :key="row.year"
                    :class="{ 'current-year-row': row.year === currentHistoryYear }"
                  >
                    <td>{{ row.year }}</td>
                    <td>{{ row.count }}</td>
                  </tr>
                </template>
                <tr v-if="historyTableEmpty(window.windowCode)">
                  <td :colspan="historyMode[window.windowCode] === 'all' ? 3 : 2" class="text-center text-text-secondary">暂无年度统计</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <section v-if="scoreResult" class="decision-card">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-bold">蓝球评分与人工调整</h2>
          <p class="text-xs text-text-secondary">勾选“保留/排除”后重新评分；最终选择用于保存样本。</p>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <input v-model="sampleName" class="field w-40" placeholder="样本名称" />
          <label class="inline-flex items-center gap-1">
            <input v-model="testData" type="checkbox" />
            测试数据
          </label>
          <button class="btn primary" :disabled="loading" @click="saveSnapshot">保存样本</button>
          <button class="btn" :disabled="loading" @click="loadSnapshots">读取样本</button>
          <button class="btn" :disabled="loading" @click="reviewBatch">批量复盘</button>
        </div>
      </div>

      <div class="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div class="table-wrap">
          <table class="decision-table">
            <thead>
              <tr>
                <th>蓝球</th>
                <th>分</th>
                <th>等级</th>
                <th>选择</th>
                <th>保留</th>
                <th>排除</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in scoreResult.scores" :key="row.number">
                <td class="font-bold">
                  <span :class="{ 'actual-blue-hit': isActualBlue(row.number) }">{{ row.number }}</span>
                </td>
                <td>{{ row.score }}</td>
                <td>{{ row.grade }}</td>
                <td><input v-model="selectedBlue" type="checkbox" :value="row.number" /></td>
                <td><input v-model="forcedNumbers" type="checkbox" :value="row.number" /></td>
                <td><input v-model="excludedNumbers" type="checkbox" :value="row.number" /></td>
                <td class="text-xs text-text-secondary">{{ row.reasons.join('；') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="space-y-3">
          <div class="summary-box">
            <div class="summary-label">系统候选</div>
            <div class="summary-value">
              <template v-for="(number, index) in scoreResult.candidateBlue" :key="number">
                <span :class="{ 'actual-blue-hit': isActualBlue(number) }">{{ number }}</span>{{ index < scoreResult.candidateBlue.length - 1 ? ',' : '' }}
              </template>
            </div>
          </div>
          <div class="summary-box">
            <div class="summary-label">最终选择</div>
            <div class="summary-value">
              <template v-if="selectedBlue.length > 0">
                <template v-for="(number, index) in selectedBlue" :key="number">
                  <span :class="{ 'actual-blue-hit': isActualBlue(number) }">{{ number }}</span>{{ index < selectedBlue.length - 1 ? ',' : '' }}
                </template>
              </template>
              <template v-else>未选择</template>
            </div>
          </div>
          <div class="summary-box">
            <div class="summary-label">人工分数微调（可选）</div>
            <div class="grid grid-cols-4 gap-2">
              <label v-for="n in allBlueNumbers" :key="n" class="text-xs">
                {{ n }}
                <input v-model.number="ballAdjust[n]" class="field mt-1 w-full" type="number" step="0.5" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="decision-card">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="font-bold">已保存样本</h2>
        <span class="text-xs text-text-secondary">{{ snapshots.length }} 条</span>
      </div>
      <div class="table-wrap mt-3">
        <table class="decision-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>期号</th>
              <th>样本</th>
              <th>选择</th>
              <th>候选</th>
              <th>开奖</th>
              <th>结果</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="snapshot in snapshots" :key="snapshot.id">
              <td>{{ snapshot.id }}</td>
              <td>{{ snapshot.predictQiHao }}</td>
              <td>{{ snapshot.sampleName }}</td>
              <td class="font-bold">{{ snapshot.selectedBlue.join(',') }}</td>
              <td class="text-ball-blue">{{ snapshot.candidateBlue.join(',') }}</td>
              <td>{{ snapshot.actualBlue || '--' }}</td>
              <td :class="snapshot.hitResult === 1 ? 'text-green-300' : 'text-text-secondary'">
                {{ snapshot.hitResult === null ? '--' : snapshot.hitResult === 1 ? '命中' : '未中' }}
              </td>
              <td>{{ snapshot.reviewStatus }}</td>
              <td>
                <button class="btn" :disabled="loading" @click="echoSnapshot(snapshot)">回显</button>
                <button class="btn" :disabled="loading" @click="reviewOne(snapshot.id)">复盘</button>
              </td>
            </tr>
            <tr v-if="snapshots.length === 0">
              <td colspan="9" class="text-center text-text-secondary">暂无样本</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 蓝球窗口决策台。
 * 第一版先让窗口地图、系统评分、人工调整、样本保存和复盘形成闭环。
 */
import { computed, onMounted, reactive, ref } from 'vue';
import LatestDrawInfo from '@/components/lottery/LatestDrawInfo.vue';
import { useLotteryStore } from '@/stores/lottery';
import { db } from '@/composables/useDatabase';
import {
  deleteBlueDecisionTestData,
  listBlueDecision,
  prepareBlueDecision,
  reviewBlueDecision,
  reviewBlueDecisionBatch,
  saveBlueDecision,
  scoreBlueDecision,
  type BlueDecisionPrepare,
  type BlueDecisionWindow,
  type BlueDecisionLevel,
  type BlueDecisionHistoryStat,
  type BlueDecisionScore,
  type BlueDecisionSnapshot
} from '@/api/modules/blueDecision';

const lotteryStore = useLotteryStore();
const predictQiHao = ref('');
const sampleName = ref('蓝球窗口样本');
const testData = ref(false);
const loading = ref(false);
const message = ref('');
const messageType = ref<'ok' | 'error'>('ok');
const showDrawBlue = ref(false);
const prepare = ref<BlueDecisionPrepare | null>(null);
const scoreResult = ref<BlueDecisionScore | null>(null);
const selectedBlue = ref<string[]>([]);
const forcedNumbers = ref<string[]>([]);
const excludedNumbers = ref<string[]>([]);
const snapshots = ref<BlueDecisionSnapshot[]>([]);
const ballAdjust = reactive<Record<string, number>>({});
const activeHistoryState = reactive<Record<string, string>>({});
const historyMode = reactive<Record<string, 'year' | 'all'>>({});
const historySortField = reactive<Record<string, HistorySortField>>({});
const historySortAsc = reactive<Record<string, boolean>>({});
const historyCollapsed = ref(false);

type HistorySortField = 'year' | 'state' | 'count' | 'currentYearCount';
const qiHaoList = ref<string[]>([]);
const showQiHaoDropdown = ref(false);
const allBlueNumbers = Array.from({ length: 16 }, (_, index) => String(index + 1).padStart(2, '0'));

const messageClass = computed(() => messageType.value === 'ok' ? 'text-green-300' : 'text-ball-red');
const qiHaoSuggestions = computed(() => {
  if (predictQiHao.value.length < 4) {
    return [];
  }
  return qiHaoList.value
    .filter(qiHao => qiHao.startsWith(predictQiHao.value))
    .slice(0, 20);
});

function manualAdjust() {
  return {
    windowWeights: {},
    levelAdjust: {},
    ballAdjust: Object.fromEntries(Object.entries(ballAdjust).filter(([, value]) => Number(value) !== 0)),
    forcedNumbers: forcedNumbers.value,
    excludedNumbers: excludedNumbers.value
  };
}

async function loadPrepare() {
  await run(async () => {
    prepare.value = await prepareBlueDecision(predictQiHao.value);
    resetHistoryTabs();
    await runScore();
    await loadSnapshots();
    setMessage('窗口读取完成');
  });
}

async function runScore() {
  await run(async () => {
    scoreResult.value = await scoreBlueDecision(predictQiHao.value, manualAdjust());
    selectedBlue.value = [...scoreResult.value.candidateBlue.slice(0, 2)];
    setMessage('评分完成');
  });
}

async function saveSnapshot() {
  await run(async () => {
    await saveBlueDecision({
      predictQiHao: predictQiHao.value,
      sampleName: sampleName.value,
      manualAdjust: manualAdjust(),
      selectedBlue: selectedBlue.value,
      testData: testData.value
    });
    await loadSnapshots();
    setMessage('样本已保存');
  });
}

async function loadSnapshots() {
  snapshots.value = await listBlueDecision(predictQiHao.value);
}

async function reviewOne(id: number) {
  await run(async () => {
    await reviewBlueDecision(id);
    await loadSnapshots();
    setMessage('复盘完成');
  });
}

async function reviewBatch() {
  await run(async () => {
    await reviewBlueDecisionBatch(predictQiHao.value);
    await loadSnapshots();
    setMessage('批量复盘完成');
  });
}

function echoSnapshot(snapshot: BlueDecisionSnapshot) {
  sampleName.value = snapshot.sampleName;
  selectedBlue.value = [...snapshot.selectedBlue];
  setMessage(`已回显样本 ${snapshot.id}`);
}

function displayLevels(window: BlueDecisionWindow): BlueDecisionLevel[] {
  return [...window.levels].sort((a, b) => b.level - a.level);
}

function isHitBlue(level: BlueDecisionLevel, number: string) {
  return (level.hitNumbers || []).includes(number);
}

function isActualBlue(number: string) {
  return showDrawBlue.value && Boolean(prepare.value?.windows.some(window =>
    window.levels.some(level => (level.hitNumbers || []).includes(number))
  ));
}

function resetHistoryTabs() {
  if (!prepare.value) {
    return;
  }
  for (const window of prepare.value.windows) {
    activeHistoryState[window.windowCode] = historyStateRows(window.windowCode)[0]?.state || '';
    historyMode[window.windowCode] = historyMode[window.windowCode] || 'year';
    historySortField[window.windowCode] = historySortField[window.windowCode] || 'year';
    historySortAsc[window.windowCode] = historySortAsc[window.windowCode] ?? true;
  }
}

function historyStat(windowCode: string): BlueDecisionHistoryStat | null {
  return prepare.value?.historyStats?.[windowCode] || null;
}

function historyStateRows(windowCode: string) {
  const stats = historyStat(windowCode);
  if (!stats) {
    return [];
  }
  return Object.entries(stats.finalStateCount || {})
    .filter(([state]) => state !== stats.currentState)
    .map(([state, count]) => ({
      state,
      count,
      currentYearCount: currentYearCount(stats, state)
    }))
    .sort((a, b) => b.count - a.count || a.state.localeCompare(b.state));
}

const currentHistoryYear = computed(() => String(prepare.value?.predictQiHao || predictQiHao.value).slice(0, 4));

function allHistoryRows(windowCode: string) {
  const stats = historyStat(windowCode);
  if (!stats) {
    return [];
  }
  return Object.entries(stats.finalStateCount || {})
    .filter(([state]) => state !== stats.currentState)
    .map(([state, count]) => ({
      state,
      count,
      currentYearCount: currentYearCount(stats, state)
    }))
    .sort((a, b) => compareHistoryRows(windowCode, a, b));
}

function historyYearRows(windowCode: string) {
  const stats = historyStat(windowCode);
  const selectedState = activeHistoryState[windowCode];
  if (!stats || !selectedState) {
    return [];
  }
  return Object.entries(stats.finalStateYearCount?.[selectedState] || {})
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => compareHistoryRows(windowCode, a, b));
}

function currentYearCount(stats: BlueDecisionHistoryStat, state: string) {
  return Number(stats.finalStateYearCount?.[state]?.[currentHistoryYear.value] || 0);
}

function activeHistorySummary(windowCode: string) {
  const stats = historyStat(windowCode);
  const selectedState = activeHistoryState[windowCode];
  const counts = Object.values(stats?.finalStateYearCount?.[selectedState] || {}).map(Number).sort((a, b) => a - b);
  if (!stats || !selectedState || counts.length === 0) {
    return '年度摘要：暂无数据';
  }
  const middle = counts.length % 2 === 1
    ? counts[Math.floor(counts.length / 2)]
    : (counts[counts.length / 2 - 1] + counts[counts.length / 2]) / 2;
  const average = counts.reduce((sum, count) => sum + count, 0) / counts.length;
  return `年度摘要：最小 ${counts[0]} / 中位 ${trimNumber(middle)} / 均值 ${trimNumber(average)} / 最大 ${counts[counts.length - 1]} / 今年 ${currentYearCount(stats, selectedState)}`;
}

function trimNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function sortHistory(windowCode: string, field: HistorySortField) {
  if (historySortField[windowCode] === field) {
    historySortAsc[windowCode] = !historySortAsc[windowCode];
  } else {
    historySortField[windowCode] = field;
    historySortAsc[windowCode] = field !== 'count';
  }
}

function setHistoryMode(windowCode: string, mode: 'year' | 'all') {
  historyMode[windowCode] = mode;
  historySortField[windowCode] = mode === 'all' ? 'count' : 'year';
  historySortAsc[windowCode] = mode !== 'all';
}

function sortMark(windowCode: string, field: HistorySortField) {
  return historySortField[windowCode] === field ? (historySortAsc[windowCode] ? ' ▲' : ' ▼') : '';
}

function compareHistoryRows(
  windowCode: string,
  a: { year?: string; state?: string; count: number; currentYearCount?: number },
  b: { year?: string; state?: string; count: number; currentYearCount?: number }
) {
  const field = historySortField[windowCode] || (historyMode[windowCode] === 'all' ? 'count' : 'year');
  const asc = historySortAsc[windowCode] ?? (field !== 'count');
  const direction = asc ? 1 : -1;
  if (field === 'count') {
    return (a.count - b.count) * direction;
  }
  if (field === 'currentYearCount') {
    return ((a.currentYearCount || 0) - (b.currentYearCount || 0)) * direction;
  }
  if (field === 'state') {
    return String(a.state || '').localeCompare(String(b.state || '')) * direction;
  }
  return (Number(a.year || 0) - Number(b.year || 0)) * direction;
}

function historyTableEmpty(windowCode: string) {
  return historyMode[windowCode] === 'all'
    ? allHistoryRows(windowCode).length === 0
    : historyYearRows(windowCode).length === 0;
}

async function clearTestData() {
  await run(async () => {
    const result = await deleteBlueDecisionTestData();
    await loadSnapshots();
    setMessage(`已删除测试数据 ${result.deletedCount} 条`);
  });
}

async function run(task: () => Promise<void>) {
  loading.value = true;
  try {
    await task();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    setMessage(reason, 'error');
  } finally {
    loading.value = false;
  }
}

function setMessage(text: string, type: 'ok' | 'error' = 'ok') {
  message.value = text;
  messageType.value = type;
}

function moveQiHao(direction: -1 | 1) {
  if (qiHaoList.value.length === 0) {
    return;
  }
  const currentIndex = qiHaoList.value.indexOf(predictQiHao.value);
  const nextIndex = currentIndex === -1
    ? (direction > 0 ? 0 : qiHaoList.value.length - 1)
    : (currentIndex + direction + qiHaoList.value.length) % qiHaoList.value.length;
  predictQiHao.value = qiHaoList.value[nextIndex];
}

function selectQiHao(qiHao: string) {
  predictQiHao.value = qiHao;
  showQiHaoDropdown.value = false;
  void loadPrepare();
}

function hideQiHaoDropdown() {
  window.setTimeout(() => {
    showQiHaoDropdown.value = false;
  }, 200);
}

onMounted(async () => {
  await lotteryStore.loadLatestFromDB();
  qiHaoList.value = await db.getAllQiHaoList();
  predictQiHao.value = lotteryStore.latestDraw?.nextQiHao || lotteryStore.latestDraw?.qiHao || '';
  if (predictQiHao.value) {
    await loadPrepare();
  }
});
</script>

<style scoped>
.decision-card {
  border: 1px solid rgba(234, 234, 234, 0.12);
  border-radius: 8px;
  background: var(--color-bg-card);
  padding: 14px;
}

.btn {
  border-radius: 6px;
  background: rgba(22, 33, 62, 0.9);
  padding: 7px 10px;
  color: var(--color-text-primary);
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.btn.primary {
  background: var(--color-accent);
}

.btn.danger {
  background: rgba(255, 71, 87, 0.35);
}

.field {
  border-radius: 6px;
  border: 1px solid rgba(234, 234, 234, 0.16);
  background: rgba(15, 52, 96, 0.9);
  padding: 7px 8px;
  color: var(--color-text-primary);
}

.level-row {
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 8px;
  align-items: start;
}

.level-title {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.blue-pill {
  border-radius: 999px;
  background: rgba(55, 66, 250, 0.35);
  padding: 3px 7px;
  color: #dfe5ff;
  font-size: 12px;
}

.blue-pill.down {
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.blue-pill.hit {
  background: var(--color-accent);
  color: #ffffff;
  font-weight: 700;
}

.table-wrap {
  overflow-x: auto;
}

.decision-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.decision-table th {
  background: rgba(22, 33, 62, 0.95);
  padding: 8px;
  text-align: left;
}

.decision-table td {
  border-bottom: 1px solid rgba(234, 234, 234, 0.08);
  padding: 8px;
  vertical-align: top;
}

.decision-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.summary-box {
  border: 1px solid rgba(234, 234, 234, 0.1);
  border-radius: 8px;
  background: rgba(22, 33, 62, 0.55);
  padding: 10px;
}

.summary-label {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.summary-value {
  margin-top: 4px;
  font-weight: 700;
}

.actual-blue-hit {
  color: var(--color-accent);
  font-weight: 800;
}

.history-card {
  border: 1px solid rgba(234, 234, 234, 0.1);
  border-radius: 8px;
  background: rgba(22, 33, 62, 0.45);
  padding: 12px;
}

.state-tab {
  border-radius: 999px;
  background: rgba(55, 66, 250, 0.22);
  padding: 5px 9px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.state-tab.active {
  background: var(--color-accent);
  color: #ffffff;
}

.state-badge {
  margin-left: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  padding: 1px 5px;
  font-size: 10px;
}

.history-summary {
  margin-top: 8px;
  border: 1px solid rgba(234, 234, 234, 0.1);
  border-radius: 6px;
  background: rgba(15, 27, 56, 0.55);
  padding: 7px 9px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.current-year-row td,
.current-year-cell {
  color: #ffffff;
  font-weight: 700;
  background: rgba(255, 71, 87, 0.22);
}
</style>
