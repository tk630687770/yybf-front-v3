<template>
  <!-- 入口召回统一指标表 -->
  <section v-if="baseline" class="research-card">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="section-title">当前实验召回摘要</h2>
        <p class="section-subtitle">
          {{ baseline.componentCode }} / {{ baseline.componentVersion }}，有效 {{ baseline.periodCount }} 期。
        </p>
      </div>
      <div class="text-xs text-text-secondary">
        入口阶段以保住真实红球为目标，不以票面收益评价。
      </div>
    </div>
    <div class="mt-4 overflow-x-auto">
      <table class="result-table">
        <thead>
        <tr>
          <th>入口规模</th>
          <th>平均命中</th>
          <th>最低 / 最高</th>
          <th>0至2红</th>
          <th>至少4红</th>
          <th>至少5红</th>
          <th>完整6红</th>
          <th>随机完整6红</th>
          <th>6红提升</th>
          <th>0至6红分布</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="entrySize in baseline.entrySizes" :key="entrySize">
          <td class="font-bold text-text-primary">Top{{ entrySize }}</td>
          <td>{{ metric(entrySize).averageHitCount.toFixed(2) }}</td>
          <td>{{ metric(entrySize).minimumHitCount }} / {{ metric(entrySize).maximumHitCount }}</td>
          <td :class="metric(entrySize).lowHitRate > 0.2 ? 'text-ball-red font-bold' : ''">
            {{ percent(metric(entrySize).lowHitRate) }}
          </td>
          <td>{{ percent(metric(entrySize).atLeastFourRate) }}</td>
          <td>{{ percent(metric(entrySize).atLeastFiveRate) }}</td>
          <td :class="metric(entrySize).allSixLift > 1 ? 'text-green-300 font-bold' : 'text-text-secondary'">
            {{ percent(metric(entrySize).allSixRate) }}
          </td>
          <td>{{ percent(metric(entrySize).randomAllSixRate) }}</td>
          <td :class="metric(entrySize).allSixLift > 1 ? 'text-green-300 font-bold' : 'text-ball-red'">
            {{ metric(entrySize).allSixLift.toFixed(2) }}
          </td>
          <td>
            <div class="distribution-list">
              <span v-for="hit in distribution(entrySize)" :key="hit.label" class="distribution-badge">
                {{ hit.label }}
              </span>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
    <div class="mt-3 boundary-note">
      <strong>阅读重点：</strong>先看最低命中和0至2红比例是否下降，再看至少5红与完整6红是否提高；
      完整6红提升倍数低于1，表示该规模下尚未超过随机完整覆盖概率。
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 入口召回统一指标表。
 */
import type {
  EntryRecallBaselineResult,
  EntryRecallEntrySizeMetric
} from '../../../api/modules/entryRecall';

const props = defineProps<{
  baseline: EntryRecallBaselineResult | null;
}>();

/**
 * 获取指定入口规模指标。
 */
function metric(entrySize: number): EntryRecallEntrySizeMetric {
  return props.baseline!.metricByEntrySize[String(entrySize)];
}

/**
 * 格式化比例。
 */
function percent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * 构建0至6红分布标签。
 */
function distribution(entrySize: number) {
  const source = metric(entrySize).hitDistribution;
  return Array.from({ length: 7 }, (_, hitCount) => ({
    label: `${hitCount}红:${source[String(hitCount)] ?? 0}`
  }));
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

.distribution-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.distribution-badge {
  border-radius: 4px;
  padding: 2px 5px;
  background: rgba(15, 23, 42, 0.65);
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
