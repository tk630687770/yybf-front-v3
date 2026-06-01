<template>
  <!-- 最近预测快照列表 -->
  <section class="bg-bg-card rounded-lg p-4">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-base font-bold text-text-primary">最近预测快照</h2>
      <span class="text-xs text-text-secondary">点击快照可切换到历史快照模式</span>
    </div>
    <div v-if="snapshots.length > 0" class="mt-3 overflow-auto">
      <table class="result-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>预测期号</th>
            <th>保存时间</th>
            <th>推荐票面</th>
            <th>模型版本</th>
            <th>复盘</th>
            <th>可复盘</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in snapshots" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.predictQiHao }}</td>
            <td>{{ item.createTime }}</td>
            <td class="font-bold text-text-primary">
              <TicketTextByText
                v-if="item.finalRecommendedTicketText"
                :ticket-text="item.finalRecommendedTicketText"
                :actual-ticket-text="actualTicketText(item)"
              />
              <span v-else>--</span>
            </td>
            <td>{{ item.modelVersion }}</td>
            <td>
              <span :class="reviewBadgeClass(item)">
                {{ reviewText(item) }}
              </span>
            </td>
            <td>
              <span :class="drawBadgeClass(item)">
                {{ drawText(item) }}
              </span>
            </td>
            <td>
              <div class="flex gap-2">
                <button
                  class="px-2 py-1 rounded bg-bg-secondary text-text-primary hover:bg-accent"
                  :disabled="reviewingSnapshotId === item.id"
                  @click="$emit('selectSnapshot', item)"
                >
                  {{ reviewingSnapshotId === item.id ? '处理中' : actionText(item) }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty-text">暂无已读取的快照，点击“读取快照”查看最近记录。</div>
  </section>
</template>

<script setup lang="ts">
import type { PredictionSnapshotEntity } from '@/api/modules/modelPrediction';
import TicketTextByText from './TicketTextByText.vue';

/**
 * 快照列表组件。
 * @description 只负责展示快照、状态和操作入口；复盘、查看和状态判断仍由页面容器提供。
 */
defineProps<{
  snapshots: PredictionSnapshotEntity[];
  reviewingSnapshotId: number | null;
  actualTicketText: (snapshot: PredictionSnapshotEntity) => string;
  reviewText: (snapshot: PredictionSnapshotEntity) => string;
  reviewBadgeClass: (snapshot: PredictionSnapshotEntity) => string;
  drawText: (snapshot: PredictionSnapshotEntity) => string;
  drawBadgeClass: (snapshot: PredictionSnapshotEntity) => string;
  actionText: (snapshot: PredictionSnapshotEntity) => string;
}>();

defineEmits<{
  selectSnapshot: [snapshot: PredictionSnapshotEntity];
}>();
</script>

<style scoped>
.result-table {
  width: 100%;
  border-collapse: collapse;
  color: #cbd5e1;
  font-size: 12px;
}

.result-table th,
.result-table td {
  padding: 9px 10px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.85);
  text-align: left;
  white-space: nowrap;
}

.result-table th {
  color: #f8fafc;
  background: rgba(15, 23, 42, 0.75);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-done {
  border: 1px solid rgba(34, 197, 94, 0.45);
  color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
}

.status-text-muted {
  color: #a0aec0;
}

.empty-text {
  margin-top: 12px;
  color: #94a3b8;
  font-size: 12px;
}

:deep(.ticket-number-text) {
  display: inline-flex;
  align-items: center;
  gap: 0;
}

:deep(.ticket-number) {
  font-weight: 800;
}

:deep(.ticket-hit-red) {
  color: #ff4d4f;
}

:deep(.ticket-hit-blue) {
  color: #38bdf8;
}
</style>
