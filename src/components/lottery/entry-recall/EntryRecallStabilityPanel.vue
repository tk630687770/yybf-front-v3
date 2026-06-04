<template>
  <!-- 已保存入口实验时间切片稳定性 -->
  <section v-if="result" class="research-card">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="section-title">时间切片稳定性</h2>
        <p class="section-subtitle">
          {{ result.resultCode }} / {{ result.resultVersion }}，{{ result.periodCount }}期分为{{ result.actualSliceCount }}段连续区间。
        </p>
      </div>
      <div class="text-xs text-text-secondary">
        只读取已保存逐期证据，不重新运行组件。
      </div>
    </div>

    <div class="mt-4 overflow-x-auto">
      <table class="result-table">
        <thead>
        <tr>
          <th>切片</th>
          <th>范围</th>
          <th>期数</th>
          <th v-for="entrySize in entrySizes" :key="entrySize">Top{{ entrySize }}：平均 / 低命中 / 5红 / 6红</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="slice in result.slices" :key="slice.sliceIndex">
          <td class="font-bold text-text-primary">第{{ slice.sliceIndex }}段</td>
          <td>{{ slice.startQiHao }} ~ {{ slice.endQiHao }}</td>
          <td>{{ slice.periodCount }}</td>
          <td v-for="entrySize in entrySizes" :key="entrySize">
            {{ sliceMetricText(slice.metricByEntrySize[String(entrySize)]) }}
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 overflow-x-auto">
      <table class="result-table">
        <thead>
        <tr>
          <th>入口规模</th>
          <th>平均命中范围 / 波动</th>
          <th>低命中波动</th>
          <th>至少5红波动</th>
          <th>完整6红波动</th>
          <th>首末平均变化</th>
          <th>首末低命中变化</th>
          <th>首末5红变化</th>
          <th>首末6红变化</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="entrySize in entrySizes" :key="entrySize">
          <td class="font-bold text-text-primary">Top{{ entrySize }}</td>
          <td>
            {{ numberText(spread(entrySize).minimumAverageHitCount) }} ~
            {{ numberText(spread(entrySize).maximumAverageHitCount) }} /
            {{ numberText(spread(entrySize).averageHitCountSpread) }}
          </td>
          <td>{{ percent(spread(entrySize).lowHitRateSpread) }}</td>
          <td>{{ percent(spread(entrySize).atLeastFiveRateSpread) }}</td>
          <td>{{ percent(spread(entrySize).allSixRateSpread) }}</td>
          <td :class="deltaClass(spread(entrySize).firstToLastAverageHitDelta, true)">
            {{ signedNumber(spread(entrySize).firstToLastAverageHitDelta) }}
          </td>
          <td :class="deltaClass(spread(entrySize).firstToLastLowHitRateDelta, false)">
            {{ signedPercent(spread(entrySize).firstToLastLowHitRateDelta) }}
          </td>
          <td :class="deltaClass(spread(entrySize).firstToLastAtLeastFiveRateDelta, true)">
            {{ signedPercent(spread(entrySize).firstToLastAtLeastFiveRateDelta) }}
          </td>
          <td :class="deltaClass(spread(entrySize).firstToLastAllSixRateDelta, true)">
            {{ signedPercent(spread(entrySize).firstToLastAllSixRateDelta) }}
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-3 boundary-note">
      <strong>阅读方式：</strong>跨切片波动越小说明结果越稳定，但稳定地差同样不是有效策略；
      首末变化中，平均命中、至少5红和完整6红上升为正向，低命中比例下降为正向。
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 已保存入口召回实验的时间切片稳定性组件。
 */
import { computed } from 'vue';
import type {
  EntryRecallEntrySizeMetric,
  EntryRecallStabilityResult,
  EntryRecallStabilitySpread
} from '../../../api/modules/entryRecall';

const props = defineProps<{
  result: EntryRecallStabilityResult | null;
}>();

/**
 * 稳定性结果包含的入口规模。
 */
const entrySizes = computed(() => Object.keys(props.result?.spreadByEntrySize ?? {})
  .map(Number)
  .filter(Number.isFinite)
  .sort((left, right) => left - right));

/**
 * 读取指定入口规模波动。
 */
function spread(entrySize: number): EntryRecallStabilitySpread {
  return props.result!.spreadByEntrySize[String(entrySize)];
}

/**
 * 格式化单个切片的核心指标。
 */
function sliceMetricText(metric: EntryRecallEntrySizeMetric | undefined) {
  if (!metric) {
    return '无数据';
  }
  return `${numberText(metric.averageHitCount)} / ${percent(metric.lowHitRate)} / ${percent(metric.atLeastFiveRate)} / ${percent(metric.allSixRate)}`;
}

/**
 * 按指标含义设置首末变化颜色。
 */
function deltaClass(delta: number, higherIsBetter: boolean) {
  if (delta === 0) {
    return 'text-text-secondary';
  }
  const positive = higherIsBetter ? delta > 0 : delta < 0;
  return positive ? 'text-green-300 font-bold' : 'text-ball-red font-bold';
}

/**
 * 格式化普通数字。
 */
function numberText(value: number | null | undefined) {
  return value == null ? '-' : value.toFixed(2);
}

/**
 * 格式化比例。
 */
function percent(value: number | null | undefined) {
  return value == null ? '-' : `${(value * 100).toFixed(2)}%`;
}

/**
 * 格式化带正负号数字。
 */
function signedNumber(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}`;
}

/**
 * 格式化带正负号比例。
 */
function signedPercent(value: number) {
  return `${value > 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
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
  color: var(--color-text-primary);
}

.section-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.result-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.result-table th,
.result-table td {
  padding: 9px 8px;
  text-align: left;
  border-bottom: 1px solid rgba(234, 234, 234, 0.08);
  white-space: nowrap;
}

.result-table th {
  color: var(--color-text-primary);
  background: rgba(22, 33, 62, 0.8);
}

.result-table td {
  color: var(--color-text-secondary);
}

.boundary-note {
  border: 1px solid rgba(234, 234, 234, 0.18);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: rgba(22, 33, 62, 0.45);
}
</style>
