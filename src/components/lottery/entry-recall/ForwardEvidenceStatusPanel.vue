<template>
  <!-- 数据库前瞻证据链只读状态 -->
  <section class="research-card">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="section-title">前瞻证据链状态</h2>
        <p class="section-subtitle">
          直接读取数据库中的正式快照、诊断包和入口拟正式快照；这里只展示状态，不自动补造或执行复盘。
        </p>
      </div>
      <button class="action-button" :disabled="loading" @click="loadStatus">
        {{ loading ? '读取中...' : '刷新状态' }}
      </button>
    </div>

    <div v-if="status" class="mt-3 summary-line">
      <span>最新开奖：{{ status.latestDrawQiHao || '--' }}</span>
      <span>当前待开奖预测：{{ status.nextPredictQiHao || '未保存正式快照' }}</span>
    </div>
    <div v-if="errorMessage" class="mt-3 error-message">{{ errorMessage }}</div>

    <div class="mt-4 overflow-x-auto">
      <table class="result-table">
        <thead>
        <tr>
          <th>期号</th>
          <th>开奖</th>
          <th>总状态</th>
          <th>正式快照</th>
          <th>正式诊断</th>
          <th>入口拟正式</th>
          <th>入口实验 / 规模</th>
          <th>缺口与边界</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="period in status?.periods ?? []" :key="period.predictQiHao">
          <td class="font-bold text-text-primary">{{ period.predictQiHao }}</td>
          <td>{{ period.drawn ? '已开奖' : '待开奖' }}</td>
          <td>
            <span :class="['status-badge', statusTone(period.statusCode)]">
              {{ period.statusText }}
            </span>
          </td>
          <td>{{ period.formalReviewedCount }}/{{ period.formalSnapshotCount }} 已复盘</td>
          <td>{{ period.formalDiagnosticTypeCount }} 类</td>
          <td>
            {{ period.entryReviewedCount }}/{{ period.entrySnapshotCount }} 已复盘；
            {{ period.entryDiagnosticCount }} 条诊断
          </td>
          <td>
            {{ period.entryExperimentCount }} 个实验
            <span v-if="period.entrySizes.length"> / Top{{ period.entrySizes.join('/Top') }}</span>
          </td>
          <td class="warning-cell">
            {{ period.warnings.length ? period.warnings.join('；') : '无' }}
          </td>
        </tr>
        <tr v-if="!loading && !(status?.periods.length)">
          <td colspan="8" class="text-center py-4">暂无可展示的前瞻证据状态。</td>
        </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 前瞻证据链状态面板。
 * 页面只读取数据库状态，不调用任何写接口。
 */
import { onMounted, ref } from 'vue';
import {
  getForwardEvidenceStatus,
  type ForwardEvidenceStatusResult
} from '@/api/modules/entryRecall';

// 当前数据库证据状态。
const status = ref<ForwardEvidenceStatusResult | null>(null);
// 接口加载状态。
const loading = ref(false);
// 接口错误提示。
const errorMessage = ref('');

/**
 * 读取最近四个已开奖期和当前待开奖期。
 */
async function loadStatus() {
  loading.value = true;
  errorMessage.value = '';
  try {
    status.value = await getForwardEvidenceStatus(4);
  } catch (error) {
    errorMessage.value = `读取前瞻证据状态失败：${errorText(error)}`;
  } finally {
    loading.value = false;
  }
}

/**
 * 根据证据状态设置颜色。
 */
function statusTone(statusCode: string) {
  if (statusCode === 'COMPLETE' || statusCode === 'WAITING_DRAW_READY') {
    return 'status-good';
  }
  if (statusCode.includes('GAP') || statusCode.includes('MISSING')) {
    return 'status-danger';
  }
  return 'status-pending';
}

/**
 * 提取可读错误文本。
 */
function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

// 页面加载时只读刷新一次证据状态。
onMounted(() => {
  void loadStatus();
});
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

.action-button {
  border: 1px solid rgba(234, 234, 234, 0.14);
  border-radius: 6px;
  padding: 7px 10px;
  color: var(--color-text-primary);
  background: rgba(15, 23, 42, 0.62);
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.summary-line {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  border: 1px solid rgba(234, 234, 234, 0.12);
  border-radius: 6px;
  padding: 9px 11px;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: rgba(15, 23, 42, 0.34);
}

.error-message {
  font-size: 12px;
  color: var(--color-ball-red);
}

.result-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.result-table th {
  padding: 9px 8px;
  text-align: left;
  white-space: nowrap;
  color: var(--color-text-primary);
  background: rgba(22, 33, 62, 0.96);
}

.result-table td {
  padding: 9px 8px;
  color: var(--color-text-secondary);
  border-bottom: 1px solid rgba(234, 234, 234, 0.08);
  white-space: nowrap;
}

.status-badge {
  display: inline-block;
  border-radius: 5px;
  padding: 3px 6px;
  font-weight: 700;
}

.status-good {
  color: #86efac;
  background: rgba(34, 197, 94, 0.12);
}

.status-pending {
  color: #fde68a;
  background: rgba(234, 179, 8, 0.12);
}

.status-danger {
  color: #fda4af;
  background: rgba(244, 63, 94, 0.12);
}

.warning-cell {
  min-width: 280px;
  white-space: normal !important;
  line-height: 1.5;
}
</style>
