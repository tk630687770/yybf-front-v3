<template>
  <!-- 开奖上下文信息：用于判断预测是否已经落后于最新开奖 -->
  <section class="bg-bg-card rounded-lg p-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-base font-bold text-text-primary">开奖信息</h2>
        <p class="mt-1 text-xs text-text-secondary">
          如果最新开奖期号和当前预测期号相同，通常表示窗口、坐标或结构族数据还没同步到下一期。
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          :disabled="drawLoading"
          class="action-button"
          @click="$emit('refreshDrawContext')"
        >
          {{ drawLoading ? '同步中...' : '同步开奖/窗口' }}
        </button>
        <button
          :disabled="axisSyncLoading"
          class="action-button"
          @click="$emit('syncAxisChains')"
        >
          {{ axisSyncLoading ? '同步中...' : '同步坐标结构链' }}
        </button>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
      <div class="summary-block">
        <div class="summary-label">最新开奖</div>
        <div class="summary-value">
          {{ latestQiHao ? `第${latestQiHao}期` : '--' }}
          <span class="text-text-secondary">{{ latestDateAndWeek || '' }}</span>
        </div>
      </div>
      <div class="summary-block">
        <div class="summary-label">开奖号</div>
        <div class="summary-value">{{ latestTicketText }}</div>
      </div>
      <div class="summary-block">
        <div class="summary-label">当前预测期号</div>
        <div class="summary-value text-accent">{{ currentPredictQiHao || '--' }}</div>
      </div>
      <div class="summary-block">
        <div class="summary-label">复盘状态</div>
        <div :class="['summary-value', selectedSnapshotCanReview ? 'text-green-400' : 'text-yellow-400']">
          {{ reviewAvailabilityText }}
        </div>
      </div>
    </div>

    <div v-if="predictionNeedsWindowSync" class="mt-3 warning-box">
      当前预测期号已经追平最新开奖期号。请先同步开奖/窗口，再同步坐标结构链；
      完成后点击“刷新预测”，再生成下一期快照。
    </div>

    <div v-if="axisSyncResults.length > 0" class="mt-3 info-box">
      <div class="font-bold text-text-primary">最近一次坐标结构链同步结果</div>
      <div class="mt-1">红10专用增量链已执行；下方为通用多窗口重建结果。</div>
      <div class="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
        <div
          v-for="item in axisSyncResults"
          :key="item.windowCode"
          class="sync-result-item"
        >
          <div class="font-bold text-text-primary">{{ item.windowName }}</div>
          <div>坐标{{ item.axisCount }} / 模板{{ item.templateCount }} / 结构族{{ item.groupCount }}</div>
          <div>模板迁移{{ item.templateTargetCount }} / 结构族迁移{{ item.groupTargetCount }}</div>
        </div>
      </div>
    </div>

    <div class="mt-3 workflow-panel">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div class="font-bold text-text-primary">开奖后执行链</div>
          <p class="mt-1 text-xs text-text-secondary">
            用于检查复盘证据链是否闭合；这里只提示状态，不会自动改写预测或诊断数据。
          </p>
        </div>
        <span class="text-xs text-text-secondary">{{ workflowSummaryText }}</span>
      </div>
      <div class="mt-3 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-2">
        <div
          v-for="step in workflowSteps"
          :key="step.key"
          :class="['workflow-step', `workflow-step-${step.status}`]"
        >
          <div class="workflow-step-title">{{ step.title }}</div>
          <div class="workflow-step-status">{{ step.statusText }}</div>
          <div class="workflow-step-desc">{{ step.description }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { WindowAxisChainResult } from '@/api/modules/modelPrediction';

type WorkflowStepStatus = 'done' | 'pending' | 'waiting' | 'unknown';

interface WorkflowStep {
  key: string;
  title: string;
  status: WorkflowStepStatus;
  statusText: string;
  description: string;
}

/**
 * 开奖上下文和开奖后执行链组件。
 * @description 只负责展示开奖、同步提示和执行链状态；实际同步动作仍由页面容器统一处理。
 */
defineProps<{
  latestQiHao?: string | null;
  latestDateAndWeek?: string | null;
  latestTicketText: string;
  currentPredictQiHao: string;
  reviewAvailabilityText: string;
  selectedSnapshotCanReview: boolean;
  predictionNeedsWindowSync: boolean;
  axisSyncResults: WindowAxisChainResult[];
  workflowSummaryText: string;
  workflowSteps: WorkflowStep[];
  drawLoading: boolean;
  axisSyncLoading: boolean;
}>();

defineEmits<{
  refreshDrawContext: [];
  syncAxisChains: [];
}>();
</script>

<style scoped>
.summary-block {
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.12);
}

.summary-label {
  margin-bottom: 6px;
  color: #a0aec0;
  font-size: 12px;
}

.summary-value {
  color: #f7fafc;
  font-size: 14px;
  font-weight: 700;
}

.warning-box {
  padding: 10px 12px;
  border: 1px solid rgba(234, 179, 8, 0.8);
  border-radius: 6px;
  color: #facc15;
  font-size: 12px;
  background: rgba(234, 179, 8, 0.12);
}

.info-box {
  padding: 10px 12px;
  border: 1px solid rgba(96, 165, 250, 0.35);
  border-radius: 6px;
  color: #bfdbfe;
  font-size: 12px;
  background: rgba(37, 99, 235, 0.12);
}

.sync-result-item {
  padding: 8px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.45);
}

.workflow-panel {
  padding: 12px;
  border: 1px solid rgba(96, 165, 250, 0.22);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.28);
}

.workflow-step {
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.35);
}

.workflow-step-done {
  border-color: rgba(34, 197, 94, 0.45);
}

.workflow-step-pending {
  border-color: rgba(234, 179, 8, 0.6);
}

.workflow-step-waiting,
.workflow-step-unknown {
  border-color: rgba(148, 163, 184, 0.25);
}

.workflow-step-title {
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 700;
}

.workflow-step-status {
  margin-top: 4px;
  color: #f8fafc;
  font-size: 14px;
  font-weight: 800;
}

.workflow-step-desc {
  margin-top: 4px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5;
}
</style>
