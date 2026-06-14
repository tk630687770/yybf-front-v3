<template>
  <!-- 入口实验拟正式预测弹窗 -->
  <Teleport to="body">
    <Transition name="entry-parallel-modal">
      <div v-if="visible" class="modal-mask" @click.self="$emit('close')">
        <div class="modal-panel">
          <header class="modal-header">
            <div>
              <h2 class="section-title">入口实验拟正式预测</h2>
              <p class="section-subtitle">
                该弹窗独立观察已保存入口实验的拟正式输出；当前已生成入口池、压缩池、9+1、10注和蓝球候选，不替代正式预测模型。
              </p>
            </div>
            <button class="icon-button" @click="$emit('close')">关闭</button>
          </header>

          <section class="control-panel">
            <label class="field">
              <span>预测期号</span>
              <input v-model.trim="localQiHao" class="form-input" placeholder="例如 2026066" />
            </label>
            <label class="field">
              <span>入口规模</span>
              <select v-model.number="localEntrySize" class="form-input">
                <option :value="15">Top15</option>
                <option :value="18">Top18</option>
                <option :value="20">Top20</option>
                <option :value="22">Top22</option>
                <option :value="24">Top24</option>
              </select>
            </label>
            <label class="field field-wide">
              <span>实验ID</span>
              <input v-model.trim="localExperimentIdsText" class="form-input" placeholder="留空表示使用覆盖该期的实验" />
            </label>
            <div class="button-row">
              <button class="action-button" :disabled="loading" @click="emitPreview">刷新预测</button>
              <button class="action-button action-button-primary" :disabled="loading" @click="emitSave">保存预测快照</button>
              <button class="action-button" :disabled="loading" @click="emitRefreshSaved">读取已保存</button>
              <button class="action-button" :disabled="loading || !savedSnapshots.length" @click="emitReview">
                复盘并保存诊断包
              </button>
            </div>
          </section>

          <div class="boundary-note">
            <strong>操作边界：</strong>刷新预测只预览不落库；保存预测快照会写入独立实验快照表且不可覆盖；
            复盘并保存诊断包只对已保存快照执行，未开奖时后端会拒绝复盘。
          </div>

          <div v-if="message" class="message" :class="messageClass">{{ message }}</div>

          <section class="result-section">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 class="comparison-title">当前展示结果</h3>
                <p class="section-subtitle">
                  {{ displaySnapshots.length }} 条；点击“保存预测快照”后可在开奖后复盘并染色。
                </p>
              </div>
              <div class="text-xs text-text-secondary">
                已保存：{{ savedSnapshots.length }} 条 / 预览：{{ previewSnapshots.length }} 条
              </div>
            </div>

            <div class="mt-3 overflow-x-auto table-wrap">
              <table class="result-table">
                <thead>
                <tr>
                  <th>ID</th>
                  <th>期号</th>
                  <th>实验</th>
                  <th>策略<br />版本</th>
                  <th>入口池</th>
                  <th>压缩池</th>
                  <th>9+1</th>
                  <th>10注6+1</th>
                  <th>蓝球</th>
                  <th>状态</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="snapshot in displaySnapshots" :key="snapshotKey(snapshot)">
                  <td class="font-bold text-text-primary">{{ snapshot.id ?? '预览' }}</td>
                  <td>{{ snapshot.predictQiHao }}</td>
                  <td class="name-cell">
                    <div class="experiment-title">{{ snapshot.experimentLabelCn || snapshot.experimentName || `实验 ${snapshot.experimentId}` }}</div>
                    <div class="experiment-description">实验ID：{{ snapshot.experimentId }} / Top{{ snapshot.entrySize }}</div>
                    <div v-if="snapshot.experimentDescriptionCn" class="experiment-description">
                      {{ snapshot.experimentDescriptionCn }}
                    </div>
                  </td>
                  <td>
                    <div>{{ snapshot.strategyCode }}</div>
                    <div class="text-text-secondary">{{ snapshot.strategyVersion }}</div>
                  </td>
                  <td class="pool-cell">
                    <NumberPoolText :numbers="snapshot.redEntryPool" :actual-red-numbers="snapshot.actualRedNumbers" />
                    <div class="hit-line">命中：{{ countText(snapshot.entryHitCount) }}</div>
                  </td>
                  <td class="pool-cell">
                    <NumberPoolText :numbers="snapshot.compressedRedPool" :actual-red-numbers="snapshot.actualRedNumbers" empty-text="未生成" />
                    <div class="hit-line">命中：{{ countText(snapshot.compressedHitCount) }}</div>
                  </td>
                  <td class="pool-cell">
                    <NumberPoolText :numbers="snapshot.nineRedPool" :actual-red-numbers="snapshot.actualRedNumbers" empty-text="未生成" />
                    <div class="hit-line">
                      蓝球：
                      <span :class="snapshot.nineBlueNumber && snapshot.nineBlueNumber === snapshot.actualBlueNumber ? 'hit-blue' : ''">
                        {{ snapshot.nineBlueNumber || '未生成' }}
                      </span>
                    </div>
                    <div class="hit-line">命中：{{ countText(snapshot.nineHitCount) }}</div>
                  </td>
                  <td class="ticket-cell">
                    <div v-if="snapshot.singleTickets?.length" class="ticket-list">
                      <div v-for="(ticket, index) in snapshot.singleTickets" :key="index">
                        {{ index + 1 }}.
                        <NumberPoolText :numbers="ticket.redNumbers" :actual-red-numbers="snapshot.actualRedNumbers" />
                        <span> + </span>
                        <span :class="ticket.blueNumber && ticket.blueNumber === snapshot.actualBlueNumber ? 'hit-blue' : ''">
                          {{ ticket.blueNumber || '--' }}
                        </span>
                      </div>
                    </div>
                    <span v-else class="text-text-secondary">未生成</span>
                    <div class="hit-line">最高：{{ countText(snapshot.singleTicketMaxHitCount) }}</div>
                  </td>
                  <td class="pool-cell">
                    <NumberPoolText
                      :numbers="snapshot.blueCandidates"
                      :actual-blue-number="snapshot.actualBlueNumber ?? undefined"
                      blue
                      empty-text="未生成"
                    />
                  </td>
                  <td>
                    <span :class="statusClass(snapshot)">
                      {{ statusText(snapshot) }}
                    </span>
                    <div v-if="snapshot.alreadySaved" class="hit-line">已存在，未覆盖</div>
                    <div v-if="snapshot.note" class="hit-line">{{ snapshot.note }}</div>
                  </td>
                </tr>
                <tr v-if="!displaySnapshots.length">
                  <td colspan="10" class="text-center py-5">暂无拟正式预测数据，请先刷新预测或读取已保存快照。</td>
                </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * 已保存入口实验拟正式预测弹窗。
 * @description 独立展示入口实验的入口池、压缩池、9+1、10注和复盘命中状态。
 */
import { computed, defineComponent, h, ref, watch } from 'vue';
import type {
  EntryParallelPredictionRequest,
  EntryParallelPredictionSnapshot,
  EntryRecallExperimentEntity
} from '../../../api/modules/entryRecall';

const props = defineProps<{
  visible: boolean;
  experiments: EntryRecallExperimentEntity[];
  previewSnapshots: EntryParallelPredictionSnapshot[];
  savedSnapshots: EntryParallelPredictionSnapshot[];
  loading: boolean;
  message: string;
  messageType: 'success' | 'error' | 'info';
}>();

const emit = defineEmits<{
  close: [];
  preview: [request: EntryParallelPredictionRequest];
  save: [request: EntryParallelPredictionRequest];
  refreshSaved: [predictQiHao: string];
  review: [predictQiHao: string, snapshotIds: number[]];
}>();

// 当前弹窗选择的预测期号，默认取实验库最新结束期号。
const localQiHao = ref('');
// 当前弹窗选择的入口规模。
const localEntrySize = ref(18);
// 当前弹窗指定实验ID文本，留空时使用页面实验库前30个实验。
const localExperimentIdsText = ref('');

/**
 * 弹窗打开或实验列表变化时，为期号输入框提供一个可用默认值。
 */
watch(
  () => [props.visible, props.experiments] as const,
  () => {
    if (!props.visible || localQiHao.value) {
      return;
    }
    localQiHao.value = props.experiments
      .map((experiment) => experiment.endQiHao)
      .filter(Boolean)
      .sort()
      .at(-1) || '';
  },
  { immediate: true }
);

/**
 * 当前用于展示的结果，优先展示已保存快照，其次展示本次预览。
 */
const displaySnapshots = computed(() => {
  return props.savedSnapshots.length ? props.savedSnapshots : props.previewSnapshots;
});

/**
 * 页面提示样式。
 */
const messageClass = computed(() => {
  if (props.messageType === 'success') {
    return 'text-green-300';
  }
  if (props.messageType === 'error') {
    return 'text-ball-red';
  }
  return 'text-text-secondary';
});

/**
 * 发出预览请求。
 */
function emitPreview() {
  emit('preview', buildRequest());
}

/**
 * 发出保存请求。
 */
function emitSave() {
  emit('save', buildRequest());
}

/**
 * 发出读取已保存快照请求。
 */
function emitRefreshSaved() {
  emit('refreshSaved', localQiHao.value);
}

/**
 * 发出复盘并保存诊断请求。
 */
function emitReview() {
  const snapshotIds = props.savedSnapshots
    .map((snapshot) => snapshot.id)
    .filter((id): id is number => typeof id === 'number');
  emit('review', localQiHao.value, snapshotIds);
}

/**
 * 组装后端请求参数。
 */
function buildRequest(): EntryParallelPredictionRequest {
  return {
    predictQiHao: localQiHao.value,
    experimentIds: selectedExperimentIds(),
    entrySize: localEntrySize.value
  };
}

/**
 * 解析实验ID；未填写时使用当前实验列表前30项。
 */
function selectedExperimentIds() {
  const typedIds = localExperimentIdsText.value
    .split(/[,\s，]+/)
    .map((text) => Number(text.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
  if (typedIds.length) {
    return Array.from(new Set(typedIds));
  }
  const coveredExperiments = props.experiments
    .filter((experiment) => isQiHaoCovered(experiment, localQiHao.value))
    .slice(0, 30)
    .map((experiment) => experiment.id);
  if (coveredExperiments.length) {
    return coveredExperiments;
  }
  return props.experiments
    .slice(0, 30)
    .map((experiment) => experiment.id);
}

/**
 * 判断实验保存的逐期证据是否覆盖当前预测期号。
 */
function isQiHaoCovered(experiment: EntryRecallExperimentEntity, qiHao: string) {
  return Boolean(qiHao && experiment.startQiHao <= qiHao && experiment.endQiHao >= qiHao);
}

/**
 * 快照行key，兼容未落库预览数据。
 */
function snapshotKey(snapshot: EntryParallelPredictionSnapshot) {
  return snapshot.id ?? `${snapshot.predictQiHao}-${snapshot.experimentId}-${snapshot.entrySize}`;
}

/**
 * 命中数量展示。
 */
function countText(value: number | null | undefined) {
  return value == null ? '未复盘' : `${value}红`;
}

/**
 * 快照状态文本。
 */
function statusText(snapshot: EntryParallelPredictionSnapshot) {
  if (snapshot.reviewStatus === 1) {
    return snapshot.diagnosticSaved === 1 ? '已复盘/已诊断' : '已复盘';
  }
  return snapshot.id == null ? '预览未保存' : '待复盘';
}

/**
 * 快照状态样式。
 */
function statusClass(snapshot: EntryParallelPredictionSnapshot) {
  if (snapshot.reviewStatus === 1) {
    return 'status-badge status-done';
  }
  return snapshot.id == null ? 'status-badge status-preview' : 'status-badge status-waiting';
}

/**
 * 简易号码池染色组件。
 */
const NumberPoolText = defineComponent({
  name: 'NumberPoolText',
  props: {
    numbers: { type: Array<string>, required: true },
    actualRedNumbers: { type: Array<string>, default: () => [] },
    actualBlueNumber: { type: String, default: '' },
    emptyText: { type: String, default: '暂无' },
    blue: { type: Boolean, default: false }
  },
  setup(poolProps) {
    return () => {
      if (!poolProps.numbers.length) {
        return h('span', { class: 'text-text-secondary' }, poolProps.emptyText);
      }
      return h('span', { class: 'number-pool' }, poolProps.numbers.flatMap((number, index) => {
        const hit = poolProps.blue
          ? number === poolProps.actualBlueNumber
          : poolProps.actualRedNumbers.includes(number);
        return [
          h('span', { class: [poolProps.blue ? 'blue-number' : 'red-number', hit ? (poolProps.blue ? 'hit-blue' : 'hit-red') : ''] }, number),
          index < poolProps.numbers.length - 1 ? h('span', { class: 'separator' }, ',') : null
        ];
      }));
    };
  }
});
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background: rgba(0, 0, 0, 0.68);
}

.modal-panel {
  width: min(1320px, 100%);
  max-height: calc(100vh - 56px);
  overflow: hidden auto;
  border: 1px solid rgba(234, 234, 234, 0.16);
  border-radius: 8px;
  padding: 16px;
  background: var(--color-bg-card);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
}

.modal-header,
.control-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
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

.section-subtitle,
.hit-line {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.control-panel {
  margin-top: 14px;
  border: 1px solid rgba(234, 234, 234, 0.12);
  border-radius: 6px;
  padding: 12px;
  background: rgba(22, 33, 62, 0.42);
}

.field {
  display: flex;
  min-width: 150px;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.field-wide {
  flex: 1;
  min-width: 280px;
}

.form-input {
  border: 1px solid rgba(234, 234, 234, 0.14);
  border-radius: 6px;
  padding: 8px 10px;
  color: var(--color-text-primary);
  background: rgba(15, 23, 42, 0.82);
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-self: end;
}

.action-button,
.icon-button {
  border: 1px solid rgba(234, 234, 234, 0.12);
  border-radius: 6px;
  padding: 8px 11px;
  color: var(--color-text-primary);
  background: rgba(22, 33, 62, 0.85);
}

.action-button-primary {
  background: var(--color-accent);
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.boundary-note,
.message,
.result-section {
  margin-top: 12px;
  border: 1px solid rgba(234, 234, 234, 0.16);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: rgba(22, 33, 62, 0.42);
}

.result-section {
  padding: 12px;
}

.table-wrap {
  max-height: 560px;
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
}

.result-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  white-space: nowrap;
  color: var(--color-text-primary);
  background: rgba(22, 33, 62, 0.96);
}

.result-table td {
  color: var(--color-text-secondary);
}

.name-cell {
  min-width: 220px;
  max-width: 320px;
}

.pool-cell {
  min-width: 220px;
  white-space: normal;
  line-height: 1.55;
}

.ticket-cell {
  min-width: 260px;
  white-space: normal;
  line-height: 1.55;
}

.experiment-title {
  font-weight: 700;
  color: var(--color-text-primary);
}

.experiment-description {
  margin-top: 3px;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.number-pool {
  font-weight: 700;
  color: var(--color-text-primary);
}

.separator {
  margin-right: 2px;
  color: var(--color-text-secondary);
}

.hit-red {
  color: var(--color-ball-red);
}

.hit-blue {
  color: var(--color-ball-blue);
}

.status-badge {
  display: inline-block;
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 700;
}

.status-done {
  color: #34d399;
  background: rgba(52, 211, 153, 0.14);
}

.status-preview {
  color: var(--color-text-secondary);
  background: rgba(234, 234, 234, 0.08);
}

.status-waiting {
  color: #facc15;
  background: rgba(250, 204, 21, 0.12);
}

.entry-parallel-modal-enter-active,
.entry-parallel-modal-leave-active {
  transition: opacity 0.18s ease;
}

.entry-parallel-modal-enter-from,
.entry-parallel-modal-leave-to {
  opacity: 0;
}
</style>
