<template>
  <!-- 已保存入口实验相对随机基线的评价结果 -->
  <section v-if="result" class="research-card">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="section-title">随机基线评价</h2>
        <p class="section-subtitle">
          对比同入口规模下随机选球的理论表现，用来判断当前实验是否真的优于随机海选。
        </p>
      </div>
      <div class="text-xs text-text-secondary">
        实验ID：{{ result.experimentId }}
      </div>
    </div>

    <div class="mt-3 summary-line">
      <strong>{{ displayName }}</strong>
      <span class="ml-2 text-text-secondary">{{ result.strategyCode }} / {{ result.strategyVersion }}</span>
    </div>

    <div class="mt-4 overflow-x-auto">
      <table class="result-table">
        <thead>
        <tr>
          <th>入口规模</th>
          <th>平均命中</th>
          <th>低命中风险</th>
          <th>至少4红</th>
          <th>至少5红</th>
          <th>完整6红</th>
          <th>结论</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="metric in sortedMetrics" :key="metric.entrySize">
          <td class="font-bold text-text-primary">Top{{ metric.entrySize }}</td>
          <td>
            实际 {{ numberText(metric.actualAverageHit) }}
            <span class="text-text-secondary">/ 随机 {{ numberText(metric.randomAverageHit) }}</span>
            <div :class="deltaClass(metric.averageHitDelta)">差值 {{ signedNumber(metric.averageHitDelta) }}</div>
          </td>
          <td>
            实际 {{ percent(metric.actualZeroToTwoRate) }}
            <span class="text-text-secondary">/ 随机 {{ percent(metric.randomZeroToTwoRate) }}</span>
            <div :class="deltaClass(metric.zeroToTwoReduction)">下降 {{ signedPercent(metric.zeroToTwoReduction) }}</div>
          </td>
          <td>
            实际 {{ percent(metric.actualAtLeastFourRate) }}
            <span class="text-text-secondary">/ 随机 {{ percent(metric.randomAtLeastFourRate) }}</span>
            <div :class="liftClass(metric.atLeastFourLift)">lift {{ numberText(metric.atLeastFourLift) }}</div>
          </td>
          <td>
            实际 {{ percent(metric.actualAtLeastFiveRate) }}
            <span class="text-text-secondary">/ 随机 {{ percent(metric.randomAtLeastFiveRate) }}</span>
            <div :class="liftClass(metric.atLeastFiveLift)">lift {{ numberText(metric.atLeastFiveLift) }}</div>
          </td>
          <td>
            实际 {{ percent(metric.actualAllSixRate) }}
            <span class="text-text-secondary">/ 随机 {{ percent(metric.randomAllSixRate) }}</span>
            <div :class="liftClass(metric.allSixLift)">lift {{ numberText(metric.allSixLift) }}</div>
          </td>
          <td class="conclusion-cell">{{ metric.conclusion }}</td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-3 boundary-note">
      <strong>阅读方式：</strong>lift大于1表示优于随机；低命中风险的“下降”为正，表示0至2红的极差结果少于随机。
      如果平均命中提升但6红lift低于1，说明策略更偏向中段覆盖，还不能证明可以稳定完整召回6红。
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 入口召回实验随机基线评价展示组件。
 * 该组件只展示已保存实验的只读评价，不触发历史回放，也不改变正式预测。
 */
import { computed } from 'vue';
import type {
  EntryRecallRandomEvaluationMetric,
  EntryRecallRandomEvaluationResult
} from '../../../api/modules/entryRecall';

const props = defineProps<{
  result: EntryRecallRandomEvaluationResult | null;
}>();

/**
 * 实验展示名，优先使用中文名称。
 */
const displayName = computed(() => {
  return props.result?.experimentLabelCn?.trim()
    || props.result?.experimentName?.trim()
    || '未命名入口实验';
});

/**
 * 按入口规模从小到大展示。
 */
const sortedMetrics = computed<EntryRecallRandomEvaluationMetric[]>(() => {
  return [...(props.result?.metrics ?? [])].sort((left, right) => left.entrySize - right.entrySize);
});

/**
 * 格式化普通数字。
 */
function numberText(value: number | null | undefined) {
  return value == null ? '-' : value.toFixed(3);
}

/**
 * 格式化带正负号的普通数字。
 */
function signedNumber(value: number | null | undefined) {
  if (value == null) {
    return '-';
  }
  return `${value >= 0 ? '+' : ''}${value.toFixed(3)}`;
}

/**
 * 格式化比例。
 */
function percent(value: number | null | undefined) {
  return value == null ? '-' : `${(value * 100).toFixed(2)}%`;
}

/**
 * 格式化带正负号的比例。
 */
function signedPercent(value: number | null | undefined) {
  if (value == null) {
    return '-';
  }
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
}

/**
 * 差值类名，正向改善显示为绿色。
 */
function deltaClass(value: number | null | undefined) {
  return (value ?? 0) >= 0 ? 'metric-good' : 'metric-bad';
}

/**
 * lift类名，大于等于1显示为绿色。
 */
function liftClass(value: number | null | undefined) {
  return (value ?? 0) >= 1 ? 'metric-good' : 'metric-bad';
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

.summary-line,
.boundary-note {
  border: 1px solid rgba(234, 234, 234, 0.18);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--color-text-primary);
  background: rgba(22, 33, 62, 0.45);
}

.boundary-note {
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
  vertical-align: top;
  white-space: nowrap;
}

.result-table th {
  color: var(--color-text-primary);
  background: rgba(22, 33, 62, 0.96);
}

.result-table td {
  color: var(--color-text-secondary);
}

.conclusion-cell {
  max-width: 260px;
  white-space: normal !important;
  line-height: 1.5;
}

.metric-good {
  margin-top: 3px;
  color: #6ee7b7;
}

.metric-bad {
  margin-top: 3px;
  color: var(--color-ball-red);
}
</style>
