<template>
  <!-- 已保存入口召回实验库与横向对比 -->
  <section class="research-card">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="section-title">已保存入口召回实验</h2>
        <p class="section-subtitle">正式实验不可覆盖；横向对比只读取已保存证据，不重新运行历史数据。</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="action-button" :disabled="loading" @click="$emit('refresh')">
          {{ loading ? '读取中...' : '刷新实验库' }}
        </button>
        <button class="action-button action-button-primary" :disabled="selectedIds.length < 2 || comparing" @click="emitCompare">
          {{ comparing ? '对比读取中...' : `对比已选 ${selectedIds.length} 项` }}
        </button>
        <button class="action-button" :disabled="!selectedIds.length" @click="selectedIds = []">清空选择</button>
      </div>
    </div>

    <div class="mt-4 overflow-x-auto list-table-wrap">
      <table class="result-table">
        <thead>
        <tr>
          <th>对比</th>
          <th>ID</th>
          <th>实验名称</th>
          <th>策略 / 版本</th>
          <th>范围</th>
          <th>有效期</th>
          <th>入口规模</th>
          <th>组件</th>
          <th>耗时</th>
          <th>操作</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="experiment in experiments" :key="experiment.id">
          <td>
            <input
              type="checkbox"
              :checked="selectedIds.includes(experiment.id)"
              :disabled="!selectedIds.includes(experiment.id) && selectedIds.length >= 10"
              @change="toggleExperiment(experiment.id)"
            />
          </td>
          <td class="font-bold text-text-primary">{{ experiment.id }}</td>
          <td class="name-cell">
            <div class="experiment-title">{{ experimentDisplayName(experiment) }}</div>
            <div v-if="experiment.experimentDescriptionCn" class="experiment-description">
              {{ experiment.experimentDescriptionCn }}
            </div>
            <div v-if="shouldShowRawName(experiment)" class="experiment-raw-name">
              原始名：{{ experiment.experimentName }}
            </div>
          </td>
          <td>{{ experiment.strategyCode }} / {{ experiment.strategyVersion }}</td>
          <td>{{ experiment.startQiHao }} ~ {{ experiment.endQiHao }}</td>
          <td>{{ experiment.effectivePeriodCount }}</td>
          <td>{{ entrySizesText(experiment) }}</td>
          <td class="config-cell">{{ componentText(experiment) }}</td>
          <td>{{ formatMs(experiment.elapsedMs) }}</td>
          <td>
            <button class="table-button" @click="$emit('detail', experiment.id)">详情</button>
            <button class="table-button table-button-secondary" @click="$emit('stability', experiment.id)">稳定性</button>
          </td>
        </tr>
        <tr v-if="!experiments.length">
          <td colspan="10" class="text-center py-4">暂无已保存入口召回实验。</td>
        </tr>
        </tbody>
      </table>
    </div>

    <div v-if="comparisonBundles.length" class="mt-4 comparison-panel">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="comparison-title">已选实验横向对比</h3>
          <p class="section-subtitle">范围不一致时只能观察，不能据此认定策略更优。</p>
        </div>
        <div class="text-xs text-text-secondary">{{ comparisonBundles.length }} 个正式实验</div>
      </div>
      <div class="mt-3 overflow-x-auto">
        <table class="result-table">
          <thead>
          <tr>
            <th>ID</th>
            <th>实验</th>
            <th>范围 / 期数</th>
            <th>Top15 平均 / 低命中 / 5红 / 6红</th>
            <th>Top18 平均 / 低命中 / 5红 / 6红</th>
            <th>配置摘要</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="bundle in comparisonBundles" :key="bundle.experiment.id">
            <td class="font-bold text-text-primary">{{ bundle.experiment.id }}</td>
            <td class="name-cell">
              <div class="experiment-title">{{ experimentDisplayName(bundle.experiment) }}</div>
              <div v-if="bundle.experiment.experimentDescriptionCn" class="experiment-description">
                {{ bundle.experiment.experimentDescriptionCn }}
              </div>
            </td>
            <td>
              {{ bundle.experiment.startQiHao }} ~ {{ bundle.experiment.endQiHao }}
              / {{ bundle.experiment.effectivePeriodCount }}期
            </td>
            <td>{{ metricText(bundle.experiment, 15) }}</td>
            <td>{{ metricText(bundle.experiment, 18) }}</td>
            <td class="config-cell">{{ componentText(bundle.experiment) }}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="mt-3 boundary-note">
      <strong>使用边界：</strong>至少选择2个、最多10个实验进行对比。实验期号范围、入口规模或组件版本不同，
      必须先说明差异，不能只凭单个高指标升级策略。
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 已保存入口召回实验列表与横向对比组件。
 */
import { ref, watch } from 'vue';
import type {
  EntryRecallEntrySizeMetric,
  EntryRecallExperimentBundle,
  EntryRecallExperimentEntity
} from '../../../api/modules/entryRecall';

const props = defineProps<{
  experiments: EntryRecallExperimentEntity[];
  comparisonBundles: EntryRecallExperimentBundle[];
  loading: boolean;
  comparing: boolean;
}>();

const emit = defineEmits<{
  refresh: [];
  detail: [experimentId: number];
  stability: [experimentId: number];
  compare: [experimentIds: number[]];
}>();

// 当前准备横向对比的正式实验ID。
const selectedIds = ref<number[]>([]);

/**
 * 实验列表刷新后移除已经不存在的选择项。
 */
watch(
  () => props.experiments,
  (experiments) => {
    const available = new Set(experiments.map((item) => item.id));
    selectedIds.value = selectedIds.value.filter((id) => available.has(id));
  }
);

/**
 * 切换横向对比实验，最多允许同时选择10个。
 */
function toggleExperiment(experimentId: number) {
  if (selectedIds.value.includes(experimentId)) {
    selectedIds.value = selectedIds.value.filter((id) => id !== experimentId);
    return;
  }
  if (selectedIds.value.length < 10) {
    selectedIds.value = [...selectedIds.value, experimentId];
  }
}

/**
 * 发出已排序的实验对比请求。
 */
function emitCompare() {
  emit('compare', [...selectedIds.value].sort((left, right) => left - right));
}

/**
 * 获取实验的页面展示名，优先使用后端生成的中文展示名。
 */
function experimentDisplayName(experiment: EntryRecallExperimentEntity) {
  return experiment.experimentLabelCn?.trim()
    || experiment.experimentName?.trim()
    || `入口召回实验 ${experiment.id}`;
}

/**
 * 原始名与中文展示名不同时保留辅助展示，方便追溯早期实验输入。
 */
function shouldShowRawName(experiment: EntryRecallExperimentEntity) {
  const rawName = experiment.experimentName?.trim();
  return Boolean(rawName && rawName !== experimentDisplayName(experiment));
}

/**
 * 格式化实验入口规模。
 */
function entrySizesText(experiment: EntryRecallExperimentEntity) {
  const parsed = safeJsonValue(experiment.entrySizesJson);
  const entrySizes = Array.isArray(parsed) ? parsed.filter((size): size is number => typeof size === 'number') : [];
  return entrySizes.map((size) => `Top${size}`).join(', ') || '-';
}

/**
 * 将组件配置JSON转为可快速阅读的摘要。
 */
function componentText(experiment: EntryRecallExperimentEntity) {
  const parsed = safeJsonValue(experiment.componentConfigJson);
  const components = Array.isArray(parsed)
    ? parsed as Record<string, unknown>[]
    : parsed && typeof parsed === 'object'
      ? [parsed as Record<string, unknown>]
      : [];
  return components.map((component) => {
    const code = String(component.componentCode ?? component.code ?? '-');
    const weight = component.weight == null ? '' : `×${component.weight}`;
    return `${code}${weight}`;
  }).join(' + ') || '-';
}

/**
 * 读取指定入口规模的核心对比指标。
 */
function metricText(experiment: EntryRecallExperimentEntity, entrySize: number) {
  const summary = safeJsonObject(experiment.metricSummaryJson);
  const metric = (summary[String(entrySize)] ?? summary[entrySize]) as EntryRecallEntrySizeMetric | undefined;
  if (!metric) {
    return '未评价';
  }
  return `${numberText(metric.averageHitCount)} / ${percent(metric.lowHitRate)} / ${percent(metric.atLeastFiveRate)} / ${percent(metric.allSixRate)}`;
}

/**
 * 安全解析任意JSON值。
 */
function safeJsonValue(value: string): unknown {
  try {
    return JSON.parse(value || 'null');
  } catch {
    return null;
  }
}

/**
 * 安全解析JSON对象。
 */
function safeJsonObject(value: string): Record<string | number, unknown> {
  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string | number, unknown>
      : {};
  } catch {
    return {};
  }
}

/**
 * 格式化比例。
 */
function percent(value: number | null | undefined) {
  return value == null ? '-' : `${(value * 100).toFixed(2)}%`;
}

/**
 * 格式化普通数字。
 */
function numberText(value: number | null | undefined) {
  return value == null ? '-' : value.toFixed(2);
}

/**
 * 格式化服务端耗时。
 */
function formatMs(value: number | null | undefined) {
  if (value == null) {
    return '-';
  }
  return value >= 1000 ? `${(value / 1000).toFixed(2)}秒` : `${value}ms`;
}
</script>

<style scoped>
.research-card {
  border-radius: 8px;
  padding: 16px;
  background: var(--color-bg-card);
}

.section-title,
.comparison-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.comparison-title {
  font-size: 14px;
}

.section-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.list-table-wrap {
  max-height: 520px;
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
  position: sticky;
  top: 0;
  z-index: 1;
  color: var(--color-text-primary);
  background: rgba(22, 33, 62, 0.96);
}

.result-table td {
  color: var(--color-text-secondary);
}

.config-cell {
  max-width: 360px;
  white-space: normal !important;
  line-height: 1.5;
}

.name-cell {
  min-width: 260px;
  max-width: 380px;
  white-space: normal !important;
  line-height: 1.5;
}

.experiment-title {
  font-weight: 700;
  color: var(--color-text-primary);
}

.experiment-description,
.experiment-raw-name {
  margin-top: 3px;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.experiment-raw-name {
  color: rgba(234, 234, 234, 0.45);
}

.action-button,
.table-button {
  border: 1px solid rgba(234, 234, 234, 0.12);
  border-radius: 6px;
  padding: 7px 11px;
  color: var(--color-text-primary);
  background: rgba(22, 33, 62, 0.85);
}

.table-button {
  padding: 5px 8px;
}

.table-button + .table-button {
  margin-left: 5px;
}

.action-button-primary {
  background: var(--color-accent);
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.table-button-secondary {
  background: rgba(15, 23, 42, 0.7);
}

.comparison-panel,
.boundary-note {
  border: 1px solid rgba(234, 234, 234, 0.18);
  border-radius: 6px;
  padding: 12px;
  background: rgba(22, 33, 62, 0.45);
}

.boundary-note {
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>
