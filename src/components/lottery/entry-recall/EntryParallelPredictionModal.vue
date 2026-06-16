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
              <input
                v-model.trim="localQiHao"
                class="form-input"
                list="entry-parallel-qihao-list"
                placeholder="例如 2026066"
              />
              <datalist id="entry-parallel-qihao-list">
                <option
                  v-for="qiHao in qiHaoOptions"
                  :key="qiHao"
                  :value="qiHao"
                />
              </datalist>
            </label>
            <div class="draw-summary">
              <span class="draw-summary-label">开奖状态</span>
              <span v-if="selectedDraw" class="draw-ticket">
                {{ drawTicketText(selectedDraw) }}
              </span>
              <span v-else class="text-text-secondary">未开奖</span>
            </div>
            <label class="field multi-field">
              <span>入口规模</span>
              <select v-model="selectedEntrySizeTexts" class="form-input multi-select" multiple>
                <option
                  v-for="entrySize in entrySizeOptions"
                  :key="entrySize"
                  :value="String(entrySize)"
                  :disabled="entrySize > MAX_PARALLEL_ENTRY_SIZE"
                >
                  Top{{ entrySize }}{{ entrySize > MAX_PARALLEL_ENTRY_SIZE ? '（出票暂不支持）' : '' }}
                </option>
              </select>
              <div class="mini-button-row">
                <button class="mini-button" type="button" @click="selectAllEntrySizes">全部规模</button>
                <button class="mini-button" type="button" @click="clearEntrySizes">清空</button>
              </div>
            </label>
            <label class="field field-wide multi-field">
              <span>实验</span>
              <select v-model="selectedExperimentIdTexts" class="form-input experiment-select" multiple>
                <option
                  v-for="experiment in experimentOptions"
                  :key="experiment.id"
                  :value="String(experiment.id)"
                >
                  {{ experiment.id }} - {{ experimentDisplayName(experiment) }}
                </option>
              </select>
              <div class="mini-button-row">
                <button class="mini-button" type="button" @click="selectAllExperiments">全部实验</button>
                <button class="mini-button" type="button" @click="selectCoveredExperiments">覆盖当前期</button>
                <button class="mini-button" type="button" @click="clearExperiments">清空</button>
              </div>
            </label>
            <div class="button-row">
              <button class="action-button" :disabled="loading || requestCount === 0" @click="emitPreview">刷新预测</button>
              <button class="action-button action-button-primary" :disabled="loading || requestCount === 0" @click="emitSave">保存预测快照</button>
              <button class="action-button" :disabled="loading" @click="emitRefreshSaved">读取已保存</button>
              <button class="action-button" :disabled="loading || !savedSnapshots.length" @click="emitReview">
                复盘并保存诊断包
              </button>
            </div>
          </section>

          <div class="boundary-note">
            <strong>操作边界：</strong>刷新预测只预览不落库；保存预测快照会写入独立实验快照表且不可覆盖；
            复盘并保存诊断包只对已保存快照执行，未开奖时后端会拒绝复盘。当前将生成
            {{ requestCount }} 个实验/规模组合<span v-if="skippedRequestCount > 0">，已跳过 {{ skippedRequestCount }} 个实验未声明或当前出票链路暂不支持的入口规模</span>。
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
                  <th>
                    <button class="sortable-header" type="button" @click="toggleSort('entry')">
                      入口池 <span>{{ sortIndicator('entry') }}</span>
                    </button>
                  </th>
                  <th>
                    <button class="sortable-header" type="button" @click="toggleSort('compressed')">
                      压缩池 <span>{{ sortIndicator('compressed') }}</span>
                    </button>
                  </th>
                  <th>
                    <button class="sortable-header" type="button" @click="toggleSort('nine')">
                      9+1 <span>{{ sortIndicator('nine') }}</span>
                    </button>
                  </th>
                  <th>
                    <button class="sortable-header" type="button" @click="toggleSort('single')">
                      10注6+1 <span>{{ sortIndicator('single') }}</span>
                    </button>
                  </th>
                  <th>
                    <button class="sortable-header" type="button" @click="toggleSort('blue')">
                      蓝球 <span>{{ sortIndicator('blue') }}</span>
                    </button>
                  </th>
                  <th>状态</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="snapshot in sortedDisplaySnapshots" :key="snapshotKey(snapshot)">
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
                    <div v-if="snapshot.alreadySaved" class="hit-line">已存在</div>
                  </td>
                </tr>
                <tr v-if="!sortedDisplaySnapshots.length">
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
import type { DrawRecord } from '../../../types';

// 当前拟正式出票链路复用的组合评分服务最多支持22个红球入口池。
const MAX_PARALLEL_ENTRY_SIZE = 22;

const props = defineProps<{
  visible: boolean;
  experiments: EntryRecallExperimentEntity[];
  previewSnapshots: EntryParallelPredictionSnapshot[];
  savedSnapshots: EntryParallelPredictionSnapshot[];
  drawRecords: DrawRecord[];
  loading: boolean;
  message: string;
  messageType: 'success' | 'error' | 'info';
}>();

const emit = defineEmits<{
  close: [];
  preview: [requests: EntryParallelPredictionRequest[]];
  save: [requests: EntryParallelPredictionRequest[]];
  refreshSaved: [predictQiHao: string];
  review: [predictQiHao: string, snapshotIds: number[]];
}>();

// 当前弹窗选择的预测期号，默认取实验库最新结束期号。
const localQiHao = ref('');
// 当前弹窗选择的入口规模，多选后会拆成多次安全请求。
const selectedEntrySizeTexts = ref<string[]>(['18']);
// 当前弹窗选择的实验ID，多选后会和入口规模做笛卡尔组合。
const selectedExperimentIdTexts = ref<string[]>([]);
// 当前表格排序字段，默认保持接口返回顺序。
const sortKey = ref<SortKey>('none');
// 当前表格排序方向，命中数默认由高到低。
const sortDirection = ref<SortDirection>('desc');

/**
 * 弹窗打开或实验列表变化时，为期号、入口规模和实验列表提供可用默认值。
 */
watch(
  () => [props.visible, props.experiments, props.drawRecords] as const,
  () => {
    if (!props.visible) {
      return;
    }
    if (!localQiHao.value) {
      localQiHao.value = defaultQiHao();
    }
    if (!selectedEntrySizeTexts.value.length) {
      selectedEntrySizeTexts.value = entrySizeOptions.value.includes(18)
        ? ['18']
        : entrySizeOptions.value.slice(0, 1).map(String);
    }
    if (!selectedExperimentIdTexts.value.length) {
      selectedExperimentIdTexts.value = defaultExperimentIds().map(String);
    }
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
 * 根据表头点击状态排序展示结果。
 */
const sortedDisplaySnapshots = computed(() => {
  const snapshots = [...displaySnapshots.value];
  if (sortKey.value === 'none') {
    return snapshots;
  }
  return snapshots.sort((left, right) => {
    const delta = sortValue(right, sortKey.value) - sortValue(left, sortKey.value);
    if (delta !== 0) {
      return sortDirection.value === 'desc' ? delta : -delta;
    }
    return snapshotStableOrder(left).localeCompare(snapshotStableOrder(right));
  });
});

/**
 * 可选期号，来自基础窗口操作台同源的本地开奖缓存。
 */
const qiHaoOptions = computed(() => {
  return props.drawRecords
    .map((record) => record.qiHao)
    .filter(Boolean)
    .sort()
    .reverse();
});

/**
 * 当前期号对应的真实开奖；不存在时代表尚未开奖或本地缓存未同步。
 */
const selectedDraw = computed(() => {
  return props.drawRecords.find((record) => record.qiHao === localQiHao.value) ?? null;
});

/**
 * 已保存实验下所有出现过的入口规模。
 */
const entrySizeOptions = computed(() => {
  const values = new Set<number>([15, 18, 20, 22, 24]);
  props.experiments.forEach((experiment) => {
    safeJsonArray<number>(experiment.entrySizesJson).forEach((entrySize) => {
      if (Number.isInteger(entrySize) && entrySize > 0) {
        values.add(entrySize);
      }
    });
  });
  return Array.from(values).sort((left, right) => left - right);
});

/**
 * 实验下拉列表，直接使用当前已加载的实验库。
 */
const experimentOptions = computed(() => props.experiments);

/**
 * 本次刷新或保存会拆分出的请求数量。
 */
const requestCount = computed(() => buildValidRequestDescriptors().length);

/**
 * 用户选择中因实验未声明该入口规模而被跳过的组合数量。
 */
const skippedRequestCount = computed(() => {
  const totalCount = selectedEntrySizes().length * selectedExperimentIds().length;
  return Math.max(totalCount - requestCount.value, 0);
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
  emit('preview', buildRequests());
}

/**
 * 发出保存请求。
 */
function emitSave() {
  emit('save', buildRequests());
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
 * 每个请求只包含一个实验和一个入口规模，便于前端显示进度并降低单次接口压力。
 */
function buildRequests(): EntryParallelPredictionRequest[] {
  return buildValidRequestDescriptors().map(({ entrySize, experimentId }) => ({
      predictQiHao: localQiHao.value,
      experimentIds: [experimentId],
      entrySize
  }));
}

/**
 * 只保留实验声明过的入口规模，避免生成不属于该实验评价口径的快照。
 */
function buildValidRequestDescriptors() {
  const entrySizes = selectedEntrySizes();
  const experimentsById = new Map(props.experiments.map((experiment) => [experiment.id, experiment]));
  return selectedExperimentIds().flatMap((experimentId) => {
    const experiment = experimentsById.get(experimentId);
    if (!experiment) {
      return [];
    }
    const supportedEntrySizes = supportedEntrySizeSet(experiment);
    return entrySizes
      .filter((entrySize) => entrySize <= MAX_PARALLEL_ENTRY_SIZE && supportedEntrySizes.has(entrySize))
      .map((entrySize) => ({ experimentId, entrySize }));
  });
}

/**
 * 解析单个实验声明支持的入口规模。
 */
function supportedEntrySizeSet(experiment: EntryRecallExperimentEntity) {
  return new Set(
    safeJsonArray<number>(experiment.entrySizesJson)
      .map((entrySize) => Number(entrySize))
      .filter((entrySize) => Number.isInteger(entrySize) && entrySize > 0)
  );
}

/**
 * 解析已选入口规模；未选择时默认使用全部规模。
 */
function selectedEntrySizes() {
  const selected = selectedEntrySizeTexts.value
    .map((text) => Number(text))
    .filter((entrySize) => Number.isInteger(entrySize) && entrySize > 0);
  const values = selected.length ? selected : entrySizeOptions.value;
  return Array.from(new Set(values)).sort((left, right) => left - right);
}

/**
 * 解析已选实验ID；未选择时使用覆盖当前期的实验，若无覆盖则使用全部已加载实验。
 */
function selectedExperimentIds() {
  const selected = selectedExperimentIdTexts.value
    .map((text) => Number(text))
    .filter((id) => Number.isInteger(id) && id > 0);
  if (selected.length) {
    return Array.from(new Set(selected));
  }
  return defaultExperimentIds();
}

/**
 * 获取默认实验集合：优先选择覆盖当前期的实验，否则选择全部已加载实验。
 */
function defaultExperimentIds() {
  const coveredExperiments = props.experiments
    .filter((experiment) => isQiHaoCovered(experiment, localQiHao.value))
    .map((experiment) => experiment.id);
  if (coveredExperiments.length) {
    return coveredExperiments;
  }
  return props.experiments.map((experiment) => experiment.id);
}

/**
 * 选择全部入口规模。
 */
function selectAllEntrySizes() {
  selectedEntrySizeTexts.value = entrySizeOptions.value
    .filter((entrySize) => entrySize <= MAX_PARALLEL_ENTRY_SIZE)
    .map(String);
}

/**
 * 清空入口规模选择，后续请求会回退到全部规模。
 */
function clearEntrySizes() {
  selectedEntrySizeTexts.value = [];
}

/**
 * 选择全部已加载实验。
 */
function selectAllExperiments() {
  selectedExperimentIdTexts.value = props.experiments.map((experiment) => String(experiment.id));
}

/**
 * 选择证据范围覆盖当前预测期号的实验。
 */
function selectCoveredExperiments() {
  selectedExperimentIdTexts.value = defaultExperimentIds().map(String);
}

/**
 * 清空实验选择，后续请求会回退到默认实验集合。
 */
function clearExperiments() {
  selectedExperimentIdTexts.value = [];
}

/**
 * 判断实验保存的逐期证据是否覆盖当前预测期号。
 */
function isQiHaoCovered(experiment: EntryRecallExperimentEntity, qiHao: string) {
  return Boolean(qiHao && experiment.startQiHao <= qiHao && experiment.endQiHao >= qiHao);
}

/**
 * 获取弹窗默认期号：优先使用最新开奖的下期期号，其次退回实验库最新结束期。
 */
function defaultQiHao() {
  const latestDraw = [...props.drawRecords].sort((left, right) => left.qiHao.localeCompare(right.qiHao)).at(-1);
  if (latestDraw?.nextQiHao) {
    return latestDraw.nextQiHao;
  }
  if (latestDraw?.qiHao) {
    return latestDraw.qiHao;
  }
  return props.experiments
    .map((experiment) => experiment.endQiHao)
    .filter(Boolean)
    .sort()
    .at(-1) || '';
}

/**
 * 展示真实开奖票面。
 */
function drawTicketText(record: DrawRecord) {
  return `${record.red1},${record.red2},${record.red3},${record.red4},${record.red5},${record.red6} + ${record.blue}`;
}

/**
 * 实验下拉框优先展示中文名称，缺失时退回实验名称。
 */
function experimentDisplayName(experiment: EntryRecallExperimentEntity) {
  return experiment.experimentLabelCn || experiment.experimentName || `实验 ${experiment.id}`;
}

/**
 * 安全解析JSON数组。
 */
function safeJsonArray<T>(value: string): T[] {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
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

type SortKey = 'none' | 'entry' | 'compressed' | 'nine' | 'single' | 'blue';
type SortDirection = 'asc' | 'desc';

/**
 * 切换表格排序字段；重复点击同一字段会在升序和降序之间切换。
 */
function toggleSort(nextKey: SortKey) {
  if (sortKey.value === nextKey) {
    sortDirection.value = sortDirection.value === 'desc' ? 'asc' : 'desc';
    return;
  }
  sortKey.value = nextKey;
  sortDirection.value = 'desc';
}

/**
 * 表头排序提示。
 */
function sortIndicator(targetKey: SortKey) {
  if (sortKey.value !== targetKey) {
    return '↕';
  }
  return sortDirection.value === 'desc' ? '↓' : '↑';
}

/**
 * 将不同列转换为可排序数值；未复盘的空值按-1处理，避免排在命中结果前面。
 */
function sortValue(snapshot: EntryParallelPredictionSnapshot, key: SortKey) {
  if (key === 'entry') {
    return snapshot.entryHitCount ?? -1;
  }
  if (key === 'compressed') {
    return snapshot.compressedHitCount ?? -1;
  }
  if (key === 'nine') {
    return snapshot.nineHitCount ?? -1;
  }
  if (key === 'single') {
    return snapshot.singleTicketMaxHitCount ?? -1;
  }
  if (key === 'blue') {
    return blueHitValue(snapshot);
  }
  return 0;
}

/**
 * 蓝球排序：命中蓝球排在未命中前；未开奖或无蓝球时按-1处理。
 */
function blueHitValue(snapshot: EntryParallelPredictionSnapshot) {
  if (!snapshot.actualBlueNumber) {
    return -1;
  }
  const candidatesHit = snapshot.blueCandidates.includes(snapshot.actualBlueNumber) ? 1 : 0;
  const nineHit = snapshot.nineBlueNumber === snapshot.actualBlueNumber ? 1 : 0;
  const ticketHit = snapshot.singleTickets.some((ticket) => ticket.blueNumber === snapshot.actualBlueNumber) ? 1 : 0;
  return Math.max(candidatesHit, nineHit, ticketHit);
}

/**
 * 排序分数相同时使用稳定字段，避免表格跳动。
 */
function snapshotStableOrder(snapshot: EntryParallelPredictionSnapshot) {
  return `${snapshot.predictQiHao}-${snapshot.experimentId}-${snapshot.entrySize}-${snapshot.id ?? 0}`;
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

.multi-field {
  min-width: 220px;
}

.form-input {
  border: 1px solid rgba(234, 234, 234, 0.14);
  border-radius: 6px;
  padding: 8px 10px;
  color: var(--color-text-primary);
  background: rgba(15, 23, 42, 0.82);
}

.multi-select,
.experiment-select {
  min-height: 92px;
  padding: 6px 8px;
}

.draw-summary {
  min-width: 190px;
  border: 1px solid rgba(234, 234, 234, 0.14);
  border-radius: 6px;
  padding: 8px 10px;
  background: rgba(15, 23, 42, 0.62);
}

.draw-summary-label {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.draw-ticket {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.mini-button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mini-button {
  border: 1px solid rgba(234, 234, 234, 0.12);
  border-radius: 5px;
  padding: 5px 8px;
  color: var(--color-text-primary);
  background: rgba(22, 33, 62, 0.8);
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

.sortable-header {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  padding: 0;
  color: inherit;
  font: inherit;
  font-weight: 700;
  background: transparent;
  cursor: pointer;
}

.sortable-header:hover {
  color: var(--color-accent);
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
