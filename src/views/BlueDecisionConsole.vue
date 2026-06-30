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
          <div
            v-for="level in displayLevels(window)"
            :key="level.level"
            class="level-row"
            :class="{ 'active-source-row': decisionMode === 'MANUAL' && sourceEnabled('WINDOW_LEVEL', window.windowCode, level.level) }"
          >
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
                <small v-if="decisionMode === 'MANUAL' && manualDraft" class="ball-score">{{ signedScore(activeScore(number)) }}</small>
              </span>
            </div>
            <div v-if="decisionMode === 'MANUAL' && manualDraft" class="source-controls">
              <input type="checkbox" :checked="sourceEnabled('WINDOW_LEVEL', window.windowCode, level.level)" @change="toggleSource('WINDOW_LEVEL', window.windowCode, level.level, $event)" />
              <select class="field compact-field" :value="sourceDecision('WINDOW_LEVEL', window.windowCode, level.level)" @change="updateSource('WINDOW_LEVEL', window.windowCode, level.level, 'decisionType', $event)">
                <option>选择</option><option>观察</option><option>排除</option>
              </select>
              <input class="field score-field" type="number" step="0.5" :value="sourceScore('WINDOW_LEVEL', window.windowCode, level.level)" @change="updateSource('WINDOW_LEVEL', window.windowCode, level.level, 'score', $event)" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="prepare" class="decision-card">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="font-bold">同状态历史完成统计</h2>
            <button
              class="state-tab"
              :class="{ active: selectedHistoryWindow === 'ALL' }"
              @click="selectedHistoryWindow = 'ALL'"
            >
              全部
            </button>
            <button
              v-for="window in prepare.windows"
              :key="window.windowCode"
              class="state-tab window-history-tab"
              :class="{ active: selectedHistoryWindow === window.windowCode }"
              @click="selectedHistoryWindow = window.windowCode"
            >
              <span>{{ window.windowName }}</span>
              <span class="window-tab-state">{{ historyStat(window.windowCode)?.currentState || '--' }}</span>
            </button>
          </div>
          <p class="text-xs text-text-secondary">模糊匹配当前初始状态，切换标签查看不同最终升级状态的年度分布。</p>
        </div>
        <button class="btn" @click="historyCollapsed = !historyCollapsed">
          {{ historyCollapsed ? '展开' : '收起' }}
        </button>
      </div>
      <div v-if="!historyCollapsed && selectedHistoryWindow === 'ALL'" class="mt-3 grid grid-cols-1 xl:grid-cols-3 gap-3">
        <div v-for="window in prepare.windows" :key="window.windowCode" class="history-card">
          <div class="flex items-center justify-between gap-2">
            <h3 class="font-bold">{{ window.windowName }}</h3>
            <div class="segmented">
              <button
                class="state-tab compact"
                :class="{ active: historyMode[window.windowCode] !== 'all' }"
                @click="setHistoryMode(window.windowCode, 'year')"
              >
                年度
              </button>
              <button
                class="state-tab compact"
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
            <template v-if="summaryValues(window.windowCode, activeHistoryState[window.windowCode]).length > 0">
              <span
                v-for="value in summaryValues(window.windowCode, activeHistoryState[window.windowCode])"
                :key="value"
                class="summary-chip"
                :class="summaryChipClass(window.windowCode, activeHistoryState[window.windowCode], value)"
              >
                {{ value }}
              </span>
              <span class="summary-average">{{ summaryAverage(window.windowCode, activeHistoryState[window.windowCode]) }}</span>
            </template>
            <span v-else>暂无</span>
          </div>
          <div class="table-wrap mt-3">
            <table class="decision-table">
              <thead>
                <tr v-if="historyMode[window.windowCode] === 'all'">
                  <th class="sortable" @click="sortHistory(window.windowCode, 'state')">
                    状态<span class="sort-mark">{{ sortMark(window.windowCode, 'state') }}</span>
                  </th>
                  <th class="sortable" @click="sortHistory(window.windowCode, 'count')">
                    次数<span class="sort-mark">{{ sortMark(window.windowCode, 'count') }}</span>
                  </th>
                  <th class="sortable" @click="sortHistory(window.windowCode, 'currentYearCount')">
                    今年次数<span class="sort-mark">{{ sortMark(window.windowCode, 'currentYearCount') }}</span>
                  </th>
                </tr>
                <tr v-else>
                  <th class="sortable" @click="sortHistory(window.windowCode, 'year')">
                    年份({{ historyYearRows(window.windowCode).length }}年)<span class="sort-mark">{{ sortMark(window.windowCode, 'year') }}</span>
                  </th>
                  <th class="sortable" @click="sortHistory(window.windowCode, 'count')">
                    次数<span class="sort-mark">{{ sortMark(window.windowCode, 'count') }}</span>
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
      <div v-if="!historyCollapsed && selectedHistoryWindow !== 'ALL'" class="mt-3 history-state-grid">
        <div v-for="item in selectedWindowStateRows" :key="item.state" class="history-card compact-card">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <h3 class="font-bold">{{ item.state }}</h3>
              <span v-if="stateLevelLabel(item.state)" class="history-level">{{ stateLevelLabel(item.state) }}</span>
            </div>
            <span class="history-meta" :class="{ 'actual-blue-hit': item.currentYearCount > 0 }">全{{ item.count }}/今{{ item.currentYearCount }}</span>
          </div>
          <div class="history-summary">
            <template v-if="summaryValues(selectedHistoryWindow, item.state).length > 0">
              <span
                v-for="value in summaryValues(selectedHistoryWindow, item.state)"
                :key="value"
                class="summary-chip"
                :class="summaryChipClass(selectedHistoryWindow, item.state, value)"
              >
                {{ value }}
              </span>
              <span class="summary-average">{{ summaryAverage(selectedHistoryWindow, item.state) }}</span>
            </template>
            <span v-else>暂无</span>
          </div>
          <div class="table-wrap mt-3">
            <table class="decision-table">
              <thead>
                <tr>
                  <th class="sortable" @click="sortStateHistory(selectedHistoryWindow, item.state, 'year')">
                    年份({{ historyYearRowsForState(selectedHistoryWindow, item.state).length }}年)<span class="sort-mark">{{ stateSortMark(selectedHistoryWindow, item.state, 'year') }}</span>
                  </th>
                  <th class="sortable" @click="sortStateHistory(selectedHistoryWindow, item.state, 'count')">
                    次数<span class="sort-mark">{{ stateSortMark(selectedHistoryWindow, item.state, 'count') }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in historyYearRowsForState(selectedHistoryWindow, item.state)"
                  :key="row.year"
                  :class="{ 'current-year-row': row.year === currentHistoryYear }"
                >
                  <td>{{ row.year }}</td>
                  <td>{{ row.count }}</td>
                </tr>
                <tr v-if="historyYearRowsForState(selectedHistoryWindow, item.state).length === 0">
                  <td colspan="2" class="text-center text-text-secondary">暂无年度统计</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <section v-if="prepare" class="decision-card">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-bold">蓝球评分方案</h2>
          <p class="text-xs text-text-secondary">系统默认只读；人工方案从空白分源开始，两套结果互不影响。</p>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <div class="segmented">
            <button class="state-tab compact" :class="{ active: decisionMode === 'SYSTEM' }" @click="switchDecisionMode('SYSTEM')">系统默认</button>
            <button class="state-tab compact" :class="{ active: decisionMode === 'MANUAL' }" @click="switchDecisionMode('MANUAL')">人工方案</button>
          </div>
          <button class="btn" :disabled="loading" @click="newManualSample">新建样本</button>
          <input v-model="sampleName" class="field w-40" :disabled="decisionMode === 'SYSTEM'" placeholder="样本名称" />
          <button class="btn primary" :disabled="loading" @click="saveSnapshot">保存样本</button>
          <button class="btn" :disabled="loading" @click="loadSnapshots">读取样本</button>
          <button class="btn" :disabled="loading" @click="reviewBatch">批量复盘</button>
        </div>
      </div>

      <div v-if="decisionMode === 'MANUAL' && !manualDraft" class="empty-manual mt-3">
        当前没有人工方案，请点击“新建样本”后再选择窗口等级或其他分数来源。
      </div>

      <div v-if="decisionMode === 'MANUAL' && manualDraft" class="mt-3 fixed-source-grid">
        <label v-for="source in fixedSourceOptions" :key="source.key" class="fixed-source-card">
          <span><input type="checkbox" :checked="sourceEnabled(source.type, source.windowCode)" @change="toggleSource(source.type, source.windowCode, null, $event)" /> {{ source.label }}</span>
          <small>{{ source.numbers.join(',') || '无号码' }}</small>
          <select class="field compact-field" :value="sourceDecision(source.type, source.windowCode)" @change="updateSource(source.type, source.windowCode, null, 'decisionType', $event)">
            <option>选择</option><option>观察</option><option>排除</option>
          </select>
          <input class="field score-field" type="number" step="0.5" :value="sourceScore(source.type, source.windowCode)" @change="updateSource(source.type, source.windowCode, null, 'score', $event)" />
        </label>
      </div>

      <div v-if="scoreResult" class="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div class="table-wrap">
          <table class="decision-table">
            <thead>
              <tr>
                <th>序号</th>
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
              <tr v-for="(row, index) in scoreResult.scores" :key="row.number">
                <td>{{ index + 1 }}</td>
                <td class="font-bold">
                  <span :class="{ 'actual-blue-hit': isActualBlue(row.number) }">{{ row.number }}</span>
                </td>
                <td>{{ row.score }}</td>
                <td>{{ row.grade }}</td>
                <td><input v-model="selectedBlue" type="checkbox" :disabled="decisionMode === 'SYSTEM'" :value="row.number" /></td>
                <td><input :checked="forcedNumbers.includes(row.number)" type="checkbox" :disabled="decisionMode === 'SYSTEM'" @change="toggleConstraint('forced', row.number, $event)" /></td>
                <td><input :checked="excludedNumbers.includes(row.number)" type="checkbox" :disabled="decisionMode === 'SYSTEM'" @change="toggleConstraint('excluded', row.number, $event)" /></td>
                <td class="text-xs text-text-secondary">{{ row.reasons.join('；') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="space-y-3">
          <div v-if="decisionMode === 'MANUAL' && manualDraft" class="summary-box">
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
                <input :value="ballAdjustValue(n)" class="field mt-1 w-full" type="number" step="0.5" @change="updateBallAdjust(n, $event)" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="decision-card">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="font-bold">已保存样本</h2>
        <div class="flex items-center gap-2 text-xs">
          <span class="text-text-secondary">{{ snapshots.length }} 条 / 已选 {{ selectedSnapshotIds.length }} 条</span>
          <button class="btn danger" :disabled="loading || selectedSnapshotIds.length === 0" @click="deleteSelectedSnapshots">删除选中</button>
        </div>
      </div>
      <div class="table-wrap mt-3">
        <table class="decision-table">
          <thead>
            <tr>
              <th>
                <input v-model="allSnapshotsSelected" type="checkbox" :disabled="snapshots.length === 0" />
              </th>
              <th>ID</th>
              <th>期号</th>
              <th>样本</th>
              <th>类型</th>
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
              <td><input v-model="selectedSnapshotIds" type="checkbox" :value="snapshot.id" /></td>
              <td>{{ snapshot.id }}</td>
              <td>{{ snapshot.predictQiHao }}</td>
              <td>{{ snapshot.sampleName }}</td>
              <td>{{ modeLabel(snapshot.decisionMode) }}</td>
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
                <button class="btn danger" :disabled="loading" @click="deleteSnapshots([snapshot.id])">删除</button>
              </td>
            </tr>
            <tr v-if="snapshots.length === 0">
              <td colspan="11" class="text-center text-text-secondary">暂无样本</td>
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
  deleteBlueDecisionSnapshots,
  getBlueDecision,
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
  type BlueDecisionManualAdjust,
  type BlueDecisionMode,
  type BlueDecisionScoreSource,
  type BlueDecisionScore,
  type BlueDecisionSnapshot
} from '@/api/modules/blueDecision';

const lotteryStore = useLotteryStore();
const predictQiHao = ref('');
const sampleName = ref('蓝球窗口样本');
const loading = ref(false);
const message = ref('');
const messageType = ref<'ok' | 'error'>('ok');
const showDrawBlue = ref(false);
const prepare = ref<BlueDecisionPrepare | null>(null);
const scoreResult = ref<BlueDecisionScore | null>(null);
const systemScore = ref<BlueDecisionScore | null>(null);
const manualScore = ref<BlueDecisionScore | null>(null);
const decisionMode = ref<'SYSTEM' | 'MANUAL'>('SYSTEM');
const manualDraft = ref<BlueDecisionManualAdjust | null>(null);
const manualDirty = ref(false);
const selectedBlue = ref<string[]>([]);
const forcedNumbers = ref<string[]>([]);
const excludedNumbers = ref<string[]>([]);
const snapshots = ref<BlueDecisionSnapshot[]>([]);
const selectedSnapshotIds = ref<number[]>([]);
const pendingSourceDrafts = reactive<Record<string, { decisionType: BlueDecisionScoreSource['decisionType']; score: number }>>({});
const activeHistoryState = reactive<Record<string, string>>({});
const historyMode = reactive<Record<string, 'year' | 'all'>>({});
const historySortField = reactive<Record<string, HistorySortField>>({});
const historySortAsc = reactive<Record<string, boolean>>({});
const stateHistorySortField = reactive<Record<string, StateHistorySortField>>({});
const stateHistorySortAsc = reactive<Record<string, boolean>>({});
const historyCollapsed = ref(false);
const selectedHistoryWindow = ref('ALL');

type HistorySortField = 'year' | 'state' | 'count' | 'currentYearCount';
type StateHistorySortField = 'year' | 'count';
const qiHaoList = ref<string[]>([]);
const showQiHaoDropdown = ref(false);
const allBlueNumbers = Array.from({ length: 16 }, (_, index) => String(index + 1).padStart(2, '0'));

const messageClass = computed(() => messageType.value === 'ok' ? 'text-green-300' : 'text-ball-red');
const selectedWindowStateRows = computed(() => historyStateRows(selectedHistoryWindow.value));
const allSnapshotsSelected = computed({
  get: () => snapshots.value.length > 0 && snapshots.value.every(snapshot => selectedSnapshotIds.value.includes(snapshot.id)),
  set: checked => {
    selectedSnapshotIds.value = checked ? snapshots.value.map(snapshot => snapshot.id) : [];
  }
});
const qiHaoSuggestions = computed(() => {
  if (predictQiHao.value.length < 4) {
    return [];
  }
  return qiHaoList.value
    .filter(qiHao => qiHao.startsWith(predictQiHao.value))
    .slice(0, 20);
});

const fixedSourceOptions = computed<Array<{
  key: string;
  type: BlueDecisionScoreSource['sourceType'];
  windowCode: string | null;
  label: string;
  numbers: string[];
}>>(() => {
  if (!prepare.value) return [];
  const base: Array<{ key: string; type: BlueDecisionScoreSource['sourceType']; windowCode: string | null; label: string; numbers: string[] }> = [
    { key: 'PREVIOUS_BLUE', type: 'PREVIOUS_BLUE' as const, windowCode: null, label: '上期蓝球', numbers: prepare.value.fixedSources?.PREVIOUS_BLUE || [] },
    { key: 'PREVIOUS_NEIGHBOR', type: 'PREVIOUS_NEIGHBOR' as const, windowCode: null, label: '上期邻号', numbers: prepare.value.fixedSources?.PREVIOUS_NEIGHBOR || [] }
  ];
  return [...base, ...prepare.value.windows.map(window => ({
    key: `WILL_DOWN:${window.windowCode}`,
    type: 'WILL_DOWN' as const,
    windowCode: window.windowCode,
    label: `${window.windowName}即将降级`,
    numbers: window.levels.flatMap(level => level.willDownNumbers || [])
  }))];
});

function currentManualAdjust(): BlueDecisionManualAdjust | null {
  if (!manualDraft.value) return null;
  return {
    sources: manualDraft.value.sources || [],
    ballAdjust: Object.fromEntries(Object.entries(manualDraft.value.ballAdjust || {}).filter(([, value]) => Number(value) !== 0)),
    forcedNumbers: forcedNumbers.value,
    excludedNumbers: excludedNumbers.value
  };
}

async function loadPrepare() {
  if (manualDirty.value && prepare.value?.predictQiHao !== predictQiHao.value && !window.confirm('当前人工方案尚未保存，确认切换期号？')) {
    predictQiHao.value = prepare.value?.predictQiHao || predictQiHao.value;
    return;
  }
  await run(async () => {
    prepare.value = await prepareBlueDecision(predictQiHao.value);
    resetHistoryTabs();
    manualDraft.value = null;
    manualScore.value = null;
    manualDirty.value = false;
    decisionMode.value = 'SYSTEM';
    await runSystemScore();
    await loadSnapshots();
    setMessage('窗口读取完成');
  });
}

async function runScore() {
  if (decisionMode.value === 'MANUAL') {
    if (!manualDraft.value) {
      setMessage('请先新建人工样本', 'error');
      return;
    }
    await runManualScore();
    return;
  }
  await run(async () => runSystemScore());
}

async function runSystemScore() {
  systemScore.value = await scoreBlueDecision(predictQiHao.value, 'SYSTEM', null);
  scoreResult.value = systemScore.value;
  sampleName.value = '系统默认';
  selectedBlue.value = [...systemScore.value.candidateBlue.slice(0, 2)];
  forcedNumbers.value = [];
  excludedNumbers.value = [];
}

async function runManualScore() {
  if (!manualDraft.value) return;
  manualScore.value = await scoreBlueDecision(predictQiHao.value, 'MANUAL', currentManualAdjust());
  scoreResult.value = manualScore.value;
  manualDirty.value = true;
}

async function saveSnapshot() {
  if (decisionMode.value === 'MANUAL' && !manualDraft.value) {
    setMessage('请先新建人工样本', 'error');
    return;
  }
  await run(async () => {
    await saveBlueDecision({
      predictQiHao: predictQiHao.value,
      sampleName: sampleName.value,
      decisionMode: decisionMode.value,
      manualAdjust: decisionMode.value === 'MANUAL' ? currentManualAdjust() : null,
      selectedBlue: selectedBlue.value
    });
    manualDirty.value = false;
    await loadSnapshots();
    setMessage('样本已保存');
  });
}

async function loadSnapshots() {
  snapshots.value = await listBlueDecision(predictQiHao.value);
  selectedSnapshotIds.value = selectedSnapshotIds.value.filter(id => snapshots.value.some(snapshot => snapshot.id === id));
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

async function deleteSelectedSnapshots() {
  await deleteSnapshots(selectedSnapshotIds.value);
}

async function deleteSnapshots(ids: number[]) {
  if (ids.length === 0 || !window.confirm(`确认删除 ${ids.length} 条蓝球决策样本？`)) {
    return;
  }
  await run(async () => {
    const result = await deleteBlueDecisionSnapshots(ids);
    selectedSnapshotIds.value = selectedSnapshotIds.value.filter(id => !ids.includes(id));
    await loadSnapshots();
    setMessage(`已删除样本 ${result.deletedCount} 条`);
  });
}

async function echoSnapshot(snapshot: BlueDecisionSnapshot) {
  await run(async () => {
    const detail = await getBlueDecision(snapshot.id);
    Object.keys(pendingSourceDrafts).forEach(key => delete pendingSourceDrafts[key]);
    sampleName.value = detail.sampleName;
    selectedBlue.value = [...detail.selectedBlue];
    if (detail.decisionMode === 'MANUAL' && detail.scoreResult?.manualAdjust) {
      decisionMode.value = 'MANUAL';
      manualDraft.value = detail.scoreResult.manualAdjust;
      forcedNumbers.value = [...(manualDraft.value.forcedNumbers || [])];
      excludedNumbers.value = [...(manualDraft.value.excludedNumbers || [])];
      manualScore.value = detail.scoreResult;
      scoreResult.value = manualScore.value;
    } else {
      decisionMode.value = 'SYSTEM';
      scoreResult.value = detail.scoreResult || systemScore.value;
    }
    manualDirty.value = false;
    setMessage(`已回显样本 ${snapshot.id}`);
  });
}

function switchDecisionMode(mode: 'SYSTEM' | 'MANUAL') {
  decisionMode.value = mode;
  if (mode === 'SYSTEM') {
    scoreResult.value = systemScore.value;
    sampleName.value = '系统默认';
    selectedBlue.value = [...(systemScore.value?.candidateBlue.slice(0, 2) || [])];
    return;
  }
  scoreResult.value = manualScore.value;
  if (!manualDraft.value) {
    setMessage('请先新建人工样本', 'error');
  }
}

async function newManualSample() {
  if (manualDirty.value && !window.confirm('当前人工方案尚未保存，确认新建空白样本？')) return;
  decisionMode.value = 'MANUAL';
  manualDraft.value = { sources: [], ballAdjust: {}, forcedNumbers: [], excludedNumbers: [] };
  forcedNumbers.value = [];
  excludedNumbers.value = [];
  selectedBlue.value = [];
  Object.keys(pendingSourceDrafts).forEach(key => delete pendingSourceDrafts[key]);
  sampleName.value = nextManualSampleName();
  manualDirty.value = false;
  await run(async () => runManualScore());
}

function nextManualSampleName() {
  const count = snapshots.value.filter(snapshot => snapshot.decisionMode === 'MANUAL').length;
  return `${predictQiHao.value}-${count + 1}`;
}

function sourceKey(type: string, windowCode?: string | null, level?: number | null) {
  return `${type}:${windowCode || ''}:${level ?? ''}`;
}

function findSource(type: string, windowCode?: string | null, level?: number | null) {
  return manualDraft.value?.sources?.find(source => sourceKey(source.sourceType, source.windowCode, source.level) === sourceKey(type, windowCode, level));
}

function sourceEnabled(type: string, windowCode?: string | null, level?: number | null) {
  return Boolean(findSource(type, windowCode, level));
}

function sourceDecision(type: string, windowCode?: string | null, level?: number | null) {
  const key = sourceKey(type, windowCode, level);
  return findSource(type, windowCode, level)?.decisionType || pendingSourceDrafts[key]?.decisionType || defaultDecisionType(type);
}

function sourceScore(type: string, windowCode?: string | null, level?: number | null) {
  const key = sourceKey(type, windowCode, level);
  const source = findSource(type, windowCode, level);
  return source?.score ?? pendingSourceDrafts[key]?.score ?? defaultSourceScore(defaultDecisionType(type));
}

async function toggleSource(type: BlueDecisionScoreSource['sourceType'], windowCode: string | null, level: number | null, event: Event) {
  if (!manualDraft.value) {
    setMessage('请先新建人工样本', 'error');
    return;
  }
  const checked = (event.target as HTMLInputElement).checked;
  const key = sourceKey(type, windowCode, level);
  const sources = manualDraft.value.sources || [];
  const source = findSource(type, windowCode, level);
  if (!checked && source) {
    pendingSourceDrafts[key] = { decisionType: source.decisionType, score: source.score };
  }
  manualDraft.value.sources = checked
    ? [...sources, { sourceType: type, windowCode, level, decisionType: sourceDecision(type, windowCode, level), score: sourceScore(type, windowCode, level) }]
    : sources.filter(source => sourceKey(source.sourceType, source.windowCode, source.level) !== key);
  await run(async () => runManualScore());
}

async function updateSource(type: BlueDecisionScoreSource['sourceType'], windowCode: string | null, level: number | null, field: 'decisionType' | 'score', event: Event) {
  const key = sourceKey(type, windowCode, level);
  const source = findSource(type, windowCode, level);
  if (!source) {
    const current = pendingSourceDrafts[key] || { decisionType: defaultDecisionType(type), score: defaultSourceScore(defaultDecisionType(type)) };
    pendingSourceDrafts[key] = field === 'score'
      ? { ...current, score: Number((event.target as HTMLInputElement).value || 0) }
      : { decisionType: (event.target as HTMLSelectElement).value as BlueDecisionScoreSource['decisionType'], score: defaultSourceScore((event.target as HTMLSelectElement).value) };
    return;
  }
  if (field === 'score') source.score = Number((event.target as HTMLInputElement).value || 0);
  else {
    source.decisionType = (event.target as HTMLSelectElement).value as BlueDecisionScoreSource['decisionType'];
    source.score = defaultSourceScore(source.decisionType);
  }
  await run(async () => runManualScore());
}

function defaultSourceScore(decisionType?: string | null) {
  if (decisionType === '选择') return 1;
  if (decisionType === '观察') return 0.5;
  return -0.5;
}

function defaultDecisionType(type: string) {
  return type === 'WINDOW_LEVEL' ? '观察' : '排除';
}

async function updateBallAdjust(number: string, event: Event) {
  if (!manualDraft.value) return;
  manualDraft.value.ballAdjust = { ...(manualDraft.value.ballAdjust || {}), [number]: Number((event.target as HTMLInputElement).value || 0) };
  await run(async () => runManualScore());
}

async function toggleConstraint(kind: 'forced' | 'excluded', number: string, event: Event) {
  if (!manualDraft.value) {
    setMessage('请先新建人工样本', 'error');
    return;
  }
  const checked = (event.target as HTMLInputElement).checked;
  const target = kind === 'forced' ? forcedNumbers : excludedNumbers;
  const opposite = kind === 'forced' ? excludedNumbers : forcedNumbers;
  target.value = checked ? [...new Set([...target.value, number])] : target.value.filter(item => item !== number);
  if (checked) opposite.value = opposite.value.filter(item => item !== number);
  await run(async () => runManualScore());
}

function activeScore(number: string) {
  return scoreResult.value?.scores.find(score => score.number === number)?.score || 0;
}

function ballAdjustValue(number: string) {
  return manualDraft.value?.ballAdjust?.[number] || 0;
}

function signedScore(score: number) {
  return `${score > 0 ? '+' : ''}${trimNumber(score)}`;
}

function modeLabel(mode: BlueDecisionMode) {
  return mode === 'SYSTEM' ? '系统默认' : mode === 'MANUAL' ? '人工方案' : '旧版样本';
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
    delete historySortField[window.windowCode];
    delete historySortAsc[window.windowCode];
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
  return possibleHistoryStates(windowCode)
    .map(state => ({
      state,
      count: Number(stats.finalStateCount?.[state] || 0),
      currentYearCount: currentYearCount(stats, state)
    }))
    .sort(compareStateLevel);
}

const currentHistoryYear = computed(() => String(prepare.value?.predictQiHao || predictQiHao.value).slice(0, 4));

function allHistoryRows(windowCode: string) {
  const stats = historyStat(windowCode);
  if (!stats) {
    return [];
  }
  return possibleHistoryStates(windowCode)
    .map(state => ({
      state,
      count: Number(stats.finalStateCount?.[state] || 0),
      currentYearCount: currentYearCount(stats, state)
    }))
    .sort((a, b) => compareHistoryRows(windowCode, a, b));
}

function possibleHistoryStates(windowCode: string) {
  const stats = historyStat(windowCode);
  const states = new Set(Object.keys(stats?.finalStateCount || {}).filter(state => state !== stats?.currentState));
  const window = prepare.value?.windows?.find(item => item.windowCode === windowCode);
  (window?.levels || [])
    .filter(level => (level.numbers || []).length > 0)
    .map(level => stateWithHit(window?.stateText || stats?.currentState || '', level.level))
    .filter(Boolean)
    .forEach(state => states.add(state));
  return Array.from(states);
}

function stateWithHit(currentState: string, level: number) {
  const parts = currentState.split('_');
  if (!parts[level]) {
    return '';
  }
  parts[level] = parts[level].replace('*', '').replace('-', '*-');
  if (!parts[level].includes('*')) {
    parts[level] += '*';
  }
  return parts.join('_');
}

function historyYearRows(windowCode: string) {
  return historyYearRowsForState(windowCode, activeHistoryState[windowCode], windowCode);
}

function historyYearRowsForState(windowCode: string, state: string, sortKey = stateSortKey(windowCode, state)) {
  const stats = historyStat(windowCode);
  if (!stats || !state) {
    return [];
  }
  return Object.entries(stats.finalStateYearCount?.[state] || {})
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => compareYearRows(sortKey, a, b));
}

function currentYearCount(stats: BlueDecisionHistoryStat, state: string) {
  return Number(stats.finalStateYearCount?.[state]?.[currentHistoryYear.value] || 0);
}

function historySummaryStats(windowCode: string, selectedState: string) {
  const stats = historyStat(windowCode);
  const counts = Object.values(stats?.finalStateYearCount?.[selectedState] || {}).map(Number).sort((a, b) => a - b);
  if (!stats || !selectedState || counts.length === 0) {
    return { values: [] as number[], median: 0, average: '', current: 0 };
  }
  const median = counts[Math.floor((counts.length - 1) / 2)];
  const average = counts.reduce((sum, count) => sum + count, 0) / counts.length;
  return {
    values: Array.from(new Set(counts)),
    median,
    average: trimNumber(average),
    current: currentYearCount(stats, selectedState)
  };
}

function summaryValues(windowCode: string, selectedState: string) {
  return historySummaryStats(windowCode, selectedState).values;
}

function summaryAverage(windowCode: string, selectedState: string) {
  return historySummaryStats(windowCode, selectedState).average;
}

function summaryChipClass(windowCode: string, selectedState: string, value: number) {
  const stats = historySummaryStats(windowCode, selectedState);
  return {
    median: value === stats.median,
    current: stats.current > 0 && value === stats.current
  };
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

function sortStateHistory(windowCode: string, state: string, field: StateHistorySortField) {
  const key = stateSortKey(windowCode, state);
  if (stateHistorySortField[key] === field) {
    stateHistorySortAsc[key] = !stateHistorySortAsc[key];
  } else {
    stateHistorySortField[key] = field;
    stateHistorySortAsc[key] = true;
  }
}

function setHistoryMode(windowCode: string, mode: 'year' | 'all') {
  historyMode[windowCode] = mode;
  delete historySortField[windowCode];
  delete historySortAsc[windowCode];
}

function sortMark(windowCode: string, field: HistorySortField) {
  return historySortField[windowCode] === field ? (historySortAsc[windowCode] ? '▲' : '▼') : '';
}

function stateSortMark(windowCode: string, state: string, field: StateHistorySortField) {
  const key = stateSortKey(windowCode, state);
  return stateHistorySortField[key] === field ? (stateHistorySortAsc[key] ? '▲' : '▼') : '';
}

function stateSortKey(windowCode: string, state: string) {
  return `${windowCode}:${state}`;
}

function stateLevelLabel(state: string) {
  const index = state.split('_').findIndex(part => part.includes('*'));
  return index >= 0 ? `LV${index}` : '';
}

function stateLevelIndex(state: string) {
  const index = state.split('_').findIndex(part => part.includes('*'));
  return index >= 0 ? index : 999;
}

function compareStateLevel(a: { state: string; count: number }, b: { state: string; count: number }) {
  return stateLevelIndex(a.state) - stateLevelIndex(b.state) || b.count - a.count || a.state.localeCompare(b.state);
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

function compareYearRows(sortKey: string, a: { year: string; count: number }, b: { year: string; count: number }) {
  const field = sortKey.includes(':') ? (stateHistorySortField[sortKey] || 'year') : (historySortField[sortKey] || 'year');
  const asc = sortKey.includes(':') ? (stateHistorySortAsc[sortKey] ?? true) : (historySortAsc[sortKey] ?? true);
  const direction = asc ? 1 : -1;
  if (field === 'count') {
    return (a.count - b.count || Number(a.year) - Number(b.year)) * direction;
  }
  return (Number(a.year) - Number(b.year) || a.count - b.count) * direction;
}

function historyTableEmpty(windowCode: string) {
  return historyMode[windowCode] === 'all'
    ? allHistoryRows(windowCode).length === 0
    : historyYearRows(windowCode).length === 0;
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
  grid-template-columns: 48px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: start;
}

.active-source-row {
  border-radius: 6px;
  background: rgba(255, 71, 87, 0.12);
  padding: 4px;
}

.source-controls {
  display: flex;
  align-items: center;
  gap: 5px;
}

.compact-field {
  width: 64px;
  padding: 4px 5px;
}

.score-field {
  width: 58px;
  padding: 4px 5px;
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

.ball-score {
  margin-left: 3px;
  color: #ffffff;
  font-size: 9px;
}

.fixed-source-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 8px;
}

.fixed-source-card {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(234, 234, 234, 0.1);
  border-radius: 6px;
  padding: 8px;
}

.fixed-source-card small {
  grid-column: 1 / -1;
  color: var(--color-text-secondary);
}

.empty-manual {
  border: 1px dashed rgba(234, 234, 234, 0.2);
  border-radius: 6px;
  padding: 16px;
  color: var(--color-text-secondary);
  text-align: center;
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

.sort-mark {
  display: inline-block;
  width: 14px;
  text-align: center;
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

.compact-card {
  padding: 10px;
}

.history-state-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 10px;
}

.state-tab {
  border-radius: 999px;
  background: rgba(55, 66, 250, 0.22);
  padding: 5px 9px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.state-tab.compact {
  border-radius: 0;
  padding: 4px 8px;
}

.state-tab.active {
  background: var(--color-accent);
  color: #ffffff;
}

.window-history-tab {
  display: inline-flex;
  min-width: 76px;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  line-height: 1.1;
}

.window-tab-state {
  color: rgba(255, 255, 255, 0.68);
  font-size: 10px;
}

.segmented {
  display: inline-flex;
  overflow: hidden;
  border: 1px solid rgba(234, 234, 234, 0.12);
  border-radius: 999px;
}

.segmented .state-tab:first-child {
  border-bottom-left-radius: 999px;
  border-top-left-radius: 999px;
}

.segmented .state-tab:last-child {
  border-bottom-right-radius: 999px;
  border-top-right-radius: 999px;
}

.state-badge {
  margin-left: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  padding: 1px 5px;
  font-size: 10px;
}

.history-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  border: 1px solid rgba(234, 234, 234, 0.1);
  border-radius: 6px;
  background: rgba(15, 27, 56, 0.55);
  padding: 7px 9px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.summary-chip {
  min-width: 22px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 6px;
  text-align: center;
}

.summary-chip.median {
  background: rgba(255, 71, 87, 0.32);
  color: #ffffff;
}

.summary-chip.current {
  color: var(--color-accent);
  font-weight: 800;
}

.summary-average {
  margin-left: auto;
  color: var(--color-text-primary);
  font-weight: 700;
}

.history-meta {
  flex-shrink: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 7px;
  color: var(--color-text-secondary);
  font-size: 11px;
}

.history-level {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  padding: 1px 6px;
  color: var(--color-text-secondary);
  font-size: 11px;
}

.current-year-row td,
.current-year-cell {
  color: #ffffff;
  font-weight: 700;
  background: rgba(255, 71, 87, 0.22);
}
</style>
