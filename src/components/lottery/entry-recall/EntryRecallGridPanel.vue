<template>
  <!-- 两两组件与权重网格预览 -->
  <section class="research-card">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="section-title">两两组件与权重网格</h2>
        <p class="section-subtitle">网格只做预览，不自动落库；人工确认有价值的候选后，再回到实验参数区正式保存。</p>
      </div>
      <button class="action-button action-button-primary" :disabled="running" @click="submit">
        {{ running ? '网格运行中...' : '运行网格预览' }}
      </button>
    </div>

    <div class="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="option-panel">
        <div class="option-title">参与矩阵的独立组件</div>
        <div class="mt-2 option-list">
          <label v-for="option in componentOptions" :key="option.code" class="option-item">
            <input v-model="form.componentCodes" type="checkbox" :value="option.code" />
            <span>{{ option.label }}</span>
          </label>
        </div>
      </div>
      <div class="option-panel">
        <div class="option-title">组合算法</div>
        <div class="mt-2 option-list">
          <label v-for="option in algorithmOptions" :key="option.code" class="option-item">
            <input v-model="form.algorithms" type="checkbox" :value="option.code" />
            <span>{{ option.label }}</span>
          </label>
        </div>
      </div>
    </div>

    <div class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
      <label class="field-block">
        <span class="field-label">权重向量</span>
        <input v-model="form.weightVectorsText" class="field-input" placeholder="1,1;0.7,0.3;0.3,0.7" />
      </label>
      <label class="field-block">
        <span class="field-label">入口规模</span>
        <input v-model="form.entrySizesText" class="field-input" placeholder="15,18,20" />
      </label>
      <label class="field-block">
        <span class="field-label">最近期数</span>
        <input v-model.number="form.recentLimit" class="field-input" type="number" min="1" max="1000" />
      </label>
    </div>
    <div v-if="validationMessage" class="mt-3 text-xs text-ball-red">{{ validationMessage }}</div>

    <div v-if="result" class="mt-4">
      <div class="boundary-note">
        共准备 {{ result.preparedComponentCount }} 个组件，评价 {{ result.periodCount }} 期，
        产生 {{ result.candidates.length }} 个候选，耗时 {{ formatMs(result.elapsedMs) }}。
      </div>
      <div class="mt-3 overflow-x-auto grid-result-wrap">
        <table class="result-table">
          <thead>
          <tr>
            <th>候选编码</th>
            <th>算法</th>
            <th>组件</th>
            <th>权重</th>
            <th>Top15：平均 / 低命中 / 5红 / 6红</th>
            <th>Top18：平均 / 低命中 / 5红 / 6红</th>
            <th>Top20：平均 / 低命中 / 5红 / 6红</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="candidate in result.candidates" :key="candidate.candidateCode">
            <td class="candidate-code">{{ candidate.candidateCode }}</td>
            <td>{{ candidate.algorithm }}</td>
            <td>{{ candidate.componentCodes.join(' + ') }}</td>
            <td>{{ candidate.weights.join(' / ') }}</td>
            <td>{{ metricText(candidate, 15) }}</td>
            <td>{{ metricText(candidate, 18) }}</td>
            <td>{{ metricText(candidate, 20) }}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 两两组件与权重网格参数及结果组件。
 */
import { reactive, ref } from 'vue';
import type {
  EntryRecallGridCandidate,
  EntryRecallGridPreviewRequest,
  EntryRecallGridPreviewResult
} from '../../../api/modules/entryRecall';

const componentOptions = [
  { code: 'RED10_AXIS', label: '红10坐标评分' },
  { code: 'BAYES_TOP', label: '贝叶斯冷热' },
  { code: 'REPEAT_LAST', label: '上期重号' },
  { code: 'NEIGHBOR_LAST', label: '上期邻号' },
  { code: 'LOW_LEVEL', label: '低等级冷补' },
  { code: 'THIRD_AREA_BACK', label: '三区后段' }
];

const algorithmOptions = [
  { code: 'WEIGHTED_SUM', label: '标准分加权求和' },
  { code: 'RANK_VOTE', label: '排名百分位投票' }
];

defineProps<{
  running: boolean;
  result: EntryRecallGridPreviewResult | null;
}>();

const emit = defineEmits<{
  preview: [request: EntryRecallGridPreviewRequest];
}>();

// 网格默认使用较快的来源组件，避免首次点击触发过重的红10批量计算。
const form = reactive({
  componentCodes: ['BAYES_TOP', 'REPEAT_LAST', 'NEIGHBOR_LAST'],
  algorithms: ['WEIGHTED_SUM', 'RANK_VOTE'],
  weightVectorsText: '1,1;0.7,0.3;0.3,0.7',
  entrySizesText: '15,18,20',
  recentLimit: 20
});

// 前端参数校验提示。
const validationMessage = ref('');

/**
 * 校验并发出网格预览请求。
 */
function submit() {
  validationMessage.value = '';
  try {
    if (form.componentCodes.length < 2) {
      throw new Error('至少选择2个独立组件。');
    }
    if (!form.algorithms.length) {
      throw new Error('至少选择1种组合算法。');
    }
    const weightVectors = parseWeightVectors(form.weightVectorsText);
    const entrySizes = parseIntegerList(form.entrySizesText, 6, 33, '入口规模');
    if (form.recentLimit < 1 || form.recentLimit > 1000) {
      throw new Error('最近期数必须在1至1000之间。');
    }
    emit('preview', {
      componentCodes: [...form.componentCodes],
      algorithms: [...form.algorithms],
      weightVectors,
      entrySizes,
      recentLimit: form.recentLimit
    });
  } catch (error) {
    validationMessage.value = error instanceof Error ? error.message : String(error);
  }
}

/**
 * 解析两个分量组成的权重向量。
 */
function parseWeightVectors(value: string) {
  const vectors = value.split(';')
    .map((vector) => vector.split(',').map((item) => Number(item.trim())))
    .filter((vector) => vector.length === 2 && vector.every((item) => Number.isFinite(item) && item >= 0));
  if (!vectors.length) {
    throw new Error('权重向量必须使用“1,1;0.7,0.3”的格式，且权重不能小于0。');
  }
  return vectors;
}

/**
 * 解析去重升序整数列表。
 */
function parseIntegerList(value: string, minimum: number, maximum: number, label: string) {
  const result = [...new Set(value.split(',').map((item) => Number(item.trim())).filter(Number.isInteger))]
    .sort((left, right) => left - right);
  if (!result.length || result.some((item) => item < minimum || item > maximum)) {
    throw new Error(`${label}必须是${minimum}至${maximum}之间的整数。`);
  }
  return result;
}

/**
 * 格式化候选指定入口规模指标。
 */
function metricText(candidate: EntryRecallGridCandidate, entrySize: number) {
  const metric = candidate.baseline.metricByEntrySize[String(entrySize)];
  if (!metric) {
    return '未评价';
  }
  return `${metric.averageHitCount.toFixed(2)} / ${percent(metric.lowHitRate)} / ${percent(metric.atLeastFiveRate)} / ${percent(metric.allSixRate)}`;
}

/**
 * 格式化比例。
 */
function percent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * 格式化耗时。
 */
function formatMs(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(2)}秒` : `${value}ms`;
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

.section-subtitle,
.field-label {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.option-panel,
.boundary-note {
  border: 1px solid rgba(234, 234, 234, 0.16);
  border-radius: 6px;
  padding: 10px 12px;
  background: rgba(22, 33, 62, 0.45);
}

.option-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.option-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-input,
.action-button {
  border: 1px solid rgba(234, 234, 234, 0.14);
  border-radius: 6px;
  padding: 8px 10px;
  color: var(--color-text-primary);
  background: rgba(15, 23, 42, 0.6);
}

.action-button {
  padding: 7px 11px;
}

.action-button-primary {
  background: var(--color-accent);
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.boundary-note {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.grid-result-wrap {
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

.candidate-code {
  max-width: 300px;
  white-space: normal !important;
  line-height: 1.45;
}
</style>
