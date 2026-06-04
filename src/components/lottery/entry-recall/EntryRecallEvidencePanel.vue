<template>
  <!-- 逐期与逐球证据阅读区 -->
  <section v-if="bundle" class="research-card">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="section-title">逐期与逐球证据</h2>
        <p class="section-subtitle">先选择一期，再查看该期真实红球在33球最终排名中的位置和组件证据。</p>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <label class="field-inline">
          <span>期号筛选</span>
          <input v-model="qiHaoFilter" class="field-input" placeholder="输入期号" />
        </label>
        <button class="action-button" @click="showAllPeriods = !showAllPeriods">
          {{ showAllPeriods ? '只看最近50行' : '展开全部逐期行' }}
        </button>
      </div>
    </div>

    <div class="mt-4 overflow-x-auto period-table-wrap">
      <table class="result-table">
        <thead>
        <tr>
          <th>期号</th>
          <th>入口规模</th>
          <th>入口池</th>
          <th>实际红球</th>
          <th>命中</th>
          <th>遗漏</th>
          <th>边界</th>
          <th>最近遗漏</th>
        </tr>
        </thead>
        <tbody>
        <tr
          v-for="period in visiblePeriods"
          :key="`${period.predictQiHao}-${period.entrySize}`"
          :class="{ 'selected-row': period.predictQiHao === selectedQiHao && period.entrySize === selectedEntrySize }"
          @click="selectPeriod(period.predictQiHao, period.entrySize)"
        >
          <td class="font-bold text-text-primary">{{ period.predictQiHao }}</td>
          <td>Top{{ period.entrySize }}</td>
          <td>{{ period.entryPoolText }}</td>
          <td><NumberList :text="period.actualRedText" tone="actual" /></td>
          <td><NumberList :text="period.hitRedText" tone="hit" /></td>
          <td><NumberList :text="period.missRedText" tone="miss" /></td>
          <td>{{ period.boundaryNumber }} / {{ numberText(period.boundaryScore) }}</td>
          <td>
            {{ period.nearestMissNumber || '-' }}
            <span v-if="period.nearestMissRank"> / 第{{ period.nearestMissRank }}名</span>
          </td>
        </tr>
        <tr v-if="!visiblePeriods.length">
          <td colspan="8" class="text-center py-4">没有匹配的逐期证据。</td>
        </tr>
        </tbody>
      </table>
    </div>

    <div v-if="selectedPeriod" class="mt-4 boundary-note">
      <strong>{{ selectedPeriod.predictQiHao }} / Top{{ selectedPeriod.entrySize }}：</strong>
      命中 {{ selectedPeriod.hitCount }} 红；
      遗漏 {{ selectedPeriod.missRedText || '无' }}；
      入口边界为 {{ selectedPeriod.boundaryNumber }}，最近遗漏号码为 {{ selectedPeriod.nearestMissNumber || '无' }}。
    </div>

    <div class="mt-4 overflow-x-auto ball-table-wrap">
      <table class="result-table">
        <thead>
        <tr>
          <th>排名</th>
          <th>号码</th>
          <th>最终分</th>
          <th>实际开奖</th>
          <th>进入入口规模</th>
          <th>组件标准分 / 排名</th>
          <th>证据结论</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="ball in selectedBallScores" :key="ball.number" :class="ballRowClass(ball)">
          <td>{{ ball.finalRank }}</td>
          <td class="font-bold" :class="ball.actualHit === 1 ? 'text-ball-red' : 'text-text-primary'">
            {{ ball.number }}
          </td>
          <td>{{ numberText(ball.finalScore) }}</td>
          <td :class="ball.actualHit === 1 ? 'text-ball-red font-bold' : 'text-text-secondary'">
            {{ ball.actualHit === 1 ? '是' : '否' }}
          </td>
          <td>{{ ball.selectedSizesText || '未进入' }}</td>
          <td class="evidence-cell">{{ componentEvidence(ball) }}</td>
          <td>{{ ball.eliminationReason || '-' }}</td>
        </tr>
        <tr v-if="!selectedBallScores.length">
          <td colspan="7" class="text-center py-4">请先选择一期查看33球证据。</td>
        </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 入口召回逐期和逐球证据组件。
 */
import { computed, defineComponent, h, ref, watch } from 'vue';
import type {
  EntryRecallBallScoreEntity,
  EntryRecallExperimentBundle
} from '../../../api/modules/entryRecall';

const props = defineProps<{
  bundle: EntryRecallExperimentBundle | null;
}>();

// 当前选中的期号。
const selectedQiHao = ref('');
// 当前选中的入口规模。
const selectedEntrySize = ref<number | null>(null);
// 期号筛选文本。
const qiHaoFilter = ref('');
// 是否展开全部逐期行。
const showAllPeriods = ref(false);

/**
 * 简单号码列表组件，避免使用v-html。
 */
const NumberList = defineComponent({
  props: {
    text: { type: String, default: '' },
    tone: { type: String, default: 'actual' }
  },
  setup(childProps) {
    return () => h('div', { class: 'number-list' }, splitNumbers(childProps.text).map((number) => h(
      'span',
      { class: `number-token number-token-${childProps.tone}` },
      number
    )));
  }
});

/**
 * 当前可见逐期行。
 */
const visiblePeriods = computed(() => {
  const rows = [...(props.bundle?.periods ?? [])]
    .filter((period) => !qiHaoFilter.value || period.predictQiHao.includes(qiHaoFilter.value.trim()))
    .sort((left, right) => right.predictQiHao.localeCompare(left.predictQiHao)
      || left.entrySize - right.entrySize);
  return showAllPeriods.value ? rows : rows.slice(0, 50);
});

/**
 * 当前选中逐期证据。
 */
const selectedPeriod = computed(() => props.bundle?.periods.find((period) =>
  period.predictQiHao === selectedQiHao.value && period.entrySize === selectedEntrySize.value
) ?? null);

/**
 * 当前选中期号的33球证据。
 */
const selectedBallScores = computed(() => [...(props.bundle?.ballScores ?? [])]
  .filter((ball) => ball.predictQiHao === selectedQiHao.value)
  .sort((left, right) => left.finalRank - right.finalRank));

/**
 * 证据包改变时默认选择最新一期的最小入口规模。
 */
watch(
  () => props.bundle,
  (bundle) => {
    const first = [...(bundle?.periods ?? [])]
      .sort((left, right) => right.predictQiHao.localeCompare(left.predictQiHao)
        || left.entrySize - right.entrySize)
      .at(0);
    selectedQiHao.value = first?.predictQiHao ?? '';
    selectedEntrySize.value = first?.entrySize ?? null;
  },
  { immediate: true }
);

/**
 * 选择逐期证据。
 */
function selectPeriod(qiHao: string, entrySize: number) {
  selectedQiHao.value = qiHao;
  selectedEntrySize.value = entrySize;
}

/**
 * 将组件标准分和排名JSON转为紧凑文本。
 */
function componentEvidence(ball: EntryRecallBallScoreEntity) {
  const scores = parseJsonRecord<number>(ball.componentScoreJson);
  const ranks = parseJsonRecord<number>(ball.componentRankJson);
  return Object.keys(scores)
    .sort()
    .map((code) => `${code}:${numberText(scores[code])}/#${ranks[code] ?? '-'}`)
    .join('；');
}

/**
 * 根据是否真实开奖和是否进入当前入口规模设置行样式。
 */
function ballRowClass(ball: EntryRecallBallScoreEntity) {
  if (ball.actualHit === 1 && selectedEntrySize.value && ball.finalRank > selectedEntrySize.value) {
    return 'missed-actual-row';
  }
  if (ball.actualHit === 1) {
    return 'hit-actual-row';
  }
  return '';
}

/**
 * 安全解析JSON对象。
 */
function parseJsonRecord<T>(value: string): Record<string, T> {
  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed === 'object' ? parsed as Record<string, T> : {};
  } catch {
    return {};
  }
}

/**
 * 分割号码文本。
 */
function splitNumbers(value: string) {
  return (value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

/**
 * 格式化分数。
 */
function numberText(value: number | null | undefined) {
  return value == null ? '-' : value.toFixed(4);
}
</script>

<style scoped>
.research-card {
  border-radius: 8px;
  padding: 16px;
  background: var(--color-bg-card);
}

.section-title {
  font-size: 16px;
  font-weight: 700;
}

.section-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.field-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-secondary);
}

.field-input,
.action-button {
  border: 1px solid rgba(234, 234, 234, 0.14);
  border-radius: 6px;
  padding: 6px 9px;
  color: var(--color-text-primary);
  background: rgba(15, 23, 42, 0.62);
}

.period-table-wrap,
.ball-table-wrap {
  max-height: 440px;
}

.result-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.result-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 9px 8px;
  text-align: left;
  color: var(--color-text-primary);
  background: rgba(22, 33, 62, 0.96);
}

.result-table td {
  padding: 9px 8px;
  color: var(--color-text-secondary);
  border-bottom: 1px solid rgba(234, 234, 234, 0.08);
  white-space: nowrap;
}

.result-table tbody tr {
  cursor: pointer;
}

.result-table tbody tr:hover,
.selected-row {
  background: rgba(56, 189, 248, 0.12);
}

.hit-actual-row {
  background: rgba(255, 71, 87, 0.08);
}

.missed-actual-row {
  background: rgba(255, 71, 87, 0.22);
}

.evidence-cell {
  max-width: 580px;
  white-space: normal !important;
  line-height: 1.5;
}

.boundary-note {
  border: 1px solid rgba(234, 234, 234, 0.18);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: rgba(22, 33, 62, 0.45);
}

:deep(.number-list) {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

:deep(.number-token) {
  border-radius: 4px;
  padding: 2px 4px;
  background: rgba(15, 23, 42, 0.6);
}

:deep(.number-token-hit) {
  color: #fda4af;
}

:deep(.number-token-miss) {
  color: #facc15;
}

:deep(.number-token-actual) {
  color: var(--color-text-primary);
}
</style>
