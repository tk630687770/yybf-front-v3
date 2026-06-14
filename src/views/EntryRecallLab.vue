<template>
  <!-- 红球入口池召回专项研究台 -->
  <div class="p-4 space-y-4">
    <section class="page-header">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-lg font-bold text-text-primary">红球入口池召回研究台</h1>
          <p class="mt-1 text-xs text-text-secondary">
            只研究第一层入口海选能否保住真实6红；入口策略稳定前，不进入9红压缩和正式出票。
          </p>
        </div>
        <div class="text-xs text-text-secondary">
          当前正式实验：{{ activeBundle?.experiment.id ?? '未选择' }}
        </div>
      </div>
      <div class="mt-3 boundary-note">
        严格前视边界：每个目标期只允许读取该期之前的数据；实际开奖号仅用于入口排名生成后的评价。
        临时预览不落库，正式保存不可覆盖。
      </div>
      <div v-if="message" class="mt-3 text-xs" :class="messageClass">{{ message }}</div>
    </section>

    <EntryRecallExperimentForm :running="running" @run="runExperiment" />
    <EntryRecallMetricTable :baseline="activeBaseline" />
    <EntryRecallEvidencePanel :bundle="activeBundle" />
    <EntryRecallExperimentList
      :experiments="experiments"
      :comparison-bundles="comparisonBundles"
      :loading="listLoading"
      :comparing="comparisonLoading"
      @refresh="loadExperiments"
      @detail="loadDetail"
      @stability="loadStability"
      @compare="loadComparison"
      @parallel-prediction="openEntryParallelPrediction"
    />
    <EntryParallelPredictionModal
      :visible="entryParallelVisible"
      :experiments="experiments"
      :preview-snapshots="entryParallelPreviewSnapshots"
      :saved-snapshots="entryParallelSavedSnapshots"
      :loading="entryParallelLoading"
      :message="entryParallelMessage"
      :message-type="entryParallelMessageType"
      @close="entryParallelVisible = false"
      @preview="previewEntryParallel"
      @save="saveEntryParallel"
      @refresh-saved="loadEntryParallelSaved"
      @review="reviewEntryParallel"
    />
    <EntryRecallStabilityPanel :result="stabilityResult" />
    <EntryRecallGridPanel :running="gridLoading" :result="gridResult" @preview="runGridPreview" />
  </div>
</template>

<script setup lang="ts">
/**
 * 红球入口池召回专项研究台。
 * 页面只负责编排状态和接口调用，参数、指标、证据、实验库、稳定性和网格由独立组件展示。
 */
import { computed, onMounted, ref } from 'vue';
import EntryRecallEvidencePanel from '../components/lottery/entry-recall/EntryRecallEvidencePanel.vue';
import EntryRecallExperimentForm from '../components/lottery/entry-recall/EntryRecallExperimentForm.vue';
import EntryRecallExperimentList from '../components/lottery/entry-recall/EntryRecallExperimentList.vue';
import EntryRecallGridPanel from '../components/lottery/entry-recall/EntryRecallGridPanel.vue';
import EntryRecallMetricTable from '../components/lottery/entry-recall/EntryRecallMetricTable.vue';
import EntryParallelPredictionModal from '../components/lottery/entry-recall/EntryParallelPredictionModal.vue';
import EntryRecallStabilityPanel from '../components/lottery/entry-recall/EntryRecallStabilityPanel.vue';
import {
  compareEntryRecallExperiments,
  getEntryRecallExperimentDetail,
  getEntryRecallStability,
  listEntryParallelPredictions,
  listEntryRecallExperiments,
  previewEntryParallelPrediction,
  previewEntryRecallGrid,
  reviewEntryParallelPredictions,
  saveEntryParallelPrediction,
  runEntryRecallExperiment
} from '../api/modules/entryRecall';
import type {
  EntryParallelPredictionRequest,
  EntryParallelPredictionSnapshot,
  EntryRecallBaselineResult,
  EntryRecallEntrySizeMetric,
  EntryRecallExperimentBundle,
  EntryRecallExperimentEntity,
  EntryRecallExperimentRequest,
  EntryRecallGridPreviewRequest,
  EntryRecallGridPreviewResult,
  EntryRecallStabilityResult
} from '../api/modules/entryRecall';

// 当前统一指标结果。
const activeBaseline = ref<EntryRecallBaselineResult | null>(null);
// 当前正式或刚运行实验的完整证据包。
const activeBundle = ref<EntryRecallExperimentBundle | null>(null);
// 最近正式实验列表。
const experiments = ref<EntryRecallExperimentEntity[]>([]);
// 当前横向对比证据包。
const comparisonBundles = ref<EntryRecallExperimentBundle[]>([]);
// 当前稳定性结果。
const stabilityResult = ref<EntryRecallStabilityResult | null>(null);
// 当前网格预览结果。
const gridResult = ref<EntryRecallGridPreviewResult | null>(null);
// 入口实验拟正式预测弹窗开关。
const entryParallelVisible = ref(false);
// 入口实验拟正式预测临时预览结果。
const entryParallelPreviewSnapshots = ref<EntryParallelPredictionSnapshot[]>([]);
// 入口实验拟正式预测已保存快照结果。
const entryParallelSavedSnapshots = ref<EntryParallelPredictionSnapshot[]>([]);
// 各接口加载状态。
const running = ref(false);
const listLoading = ref(false);
const comparisonLoading = ref(false);
const gridLoading = ref(false);
const entryParallelLoading = ref(false);
// 页面提示。
const message = ref('');
const messageType = ref<'success' | 'error' | 'info'>('info');
// 入口实验拟正式预测弹窗提示。
const entryParallelMessage = ref('');
const entryParallelMessageType = ref<'success' | 'error' | 'info'>('info');

/**
 * 页面提示样式。
 */
const messageClass = computed(() => {
  if (messageType.value === 'success') {
    return 'text-green-300';
  }
  if (messageType.value === 'error') {
    return 'text-ball-red';
  }
  return 'text-text-secondary';
});

/**
 * 运行临时预览或正式保存实验。
 */
async function runExperiment(request: EntryRecallExperimentRequest) {
  running.value = true;
  setMessage(request.saveResult ? '正在运行并保存入口召回实验...' : '正在运行入口召回预览...', 'info');
  try {
    const response = await runEntryRecallExperiment(request);
    activeBaseline.value = response.data.baseline;
    activeBundle.value = response.data.bundle;
    const duplicateText = response.data.duplicate ? '；命中已有实验指纹，未重复保存' : '';
    setMessage(`入口召回实验完成：${response.data.baseline.periodCount}期${duplicateText}。`, 'success');
    if (request.saveResult) {
      await loadExperiments();
    }
  } catch (error) {
    setMessage(`入口召回实验失败：${errorText(error)}`, 'error');
  } finally {
    running.value = false;
  }
}

/**
 * 读取最近正式实验列表。
 */
async function loadExperiments() {
  listLoading.value = true;
  try {
    const response = await listEntryRecallExperiments(30);
    experiments.value = response.data ?? [];
  } catch (error) {
    setMessage(`读取入口召回实验库失败：${errorText(error)}`, 'error');
  } finally {
    listLoading.value = false;
  }
}

/**
 * 读取正式实验完整证据。
 */
async function loadDetail(experimentId: number) {
  setMessage(`正在读取入口实验 ${experimentId} 的完整证据...`, 'info');
  try {
    const response = await getEntryRecallExperimentDetail(experimentId);
    activeBundle.value = response.data;
    activeBaseline.value = baselineFromBundle(response.data);
    setMessage(`已读取入口实验 ${experimentId}。`, 'success');
  } catch (error) {
    setMessage(`读取入口实验详情失败：${errorText(error)}`, 'error');
  }
}

/**
 * 读取多个正式实验进行横向对比。
 */
async function loadComparison(experimentIds: number[]) {
  comparisonLoading.value = true;
  setMessage(`正在读取 ${experimentIds.length} 个入口实验进行横向对比...`, 'info');
  try {
    const response = await compareEntryRecallExperiments(experimentIds);
    comparisonBundles.value = response.data ?? [];
    setMessage(`已加载 ${comparisonBundles.value.length} 个入口实验的横向对比。`, 'success');
  } catch (error) {
    setMessage(`读取入口实验对比失败：${errorText(error)}`, 'error');
  } finally {
    comparisonLoading.value = false;
  }
}

/**
 * 读取已保存实验的连续时间切片稳定性。
 */
async function loadStability(experimentId: number) {
  setMessage(`正在读取入口实验 ${experimentId} 的时间切片稳定性...`, 'info');
  try {
    const response = await getEntryRecallStability(experimentId, 4);
    stabilityResult.value = response.data;
    setMessage(`已读取入口实验 ${experimentId} 的时间切片稳定性。`, 'success');
  } catch (error) {
    setMessage(`读取时间切片稳定性失败：${errorText(error)}`, 'error');
  }
}

/**
 * 运行两两组件与权重网格预览。
 */
async function runGridPreview(request: EntryRecallGridPreviewRequest) {
  gridLoading.value = true;
  setMessage('正在运行入口召回权重网格预览...', 'info');
  try {
    const response = await previewEntryRecallGrid(request);
    gridResult.value = response.data;
    setMessage(`权重网格完成：得到 ${response.data.candidates.length} 个候选。`, 'success');
  } catch (error) {
    setMessage(`入口召回网格预览失败：${errorText(error)}`, 'error');
  } finally {
    gridLoading.value = false;
  }
}

/**
 * 打开入口实验拟正式预测弹窗。
 */
function openEntryParallelPrediction() {
  entryParallelVisible.value = true;
  setEntryParallelMessage('请选择期号后刷新预测；第一版只保存入口池快照。', 'info');
}

/**
 * 预览入口实验拟正式预测，不落库。
 */
async function previewEntryParallel(request: EntryParallelPredictionRequest) {
  if (!validateEntryParallelRequest(request)) {
    return;
  }
  entryParallelLoading.value = true;
  setEntryParallelMessage('正在刷新入口实验拟正式预测...', 'info');
  try {
    const response = await previewEntryParallelPrediction(request);
    entryParallelPreviewSnapshots.value = response ?? [];
    setEntryParallelMessage(`预览完成：${entryParallelPreviewSnapshots.value.length} 条，未落库。`, 'success');
  } catch (error) {
    setEntryParallelMessage(`刷新拟正式预测失败：${errorText(error)}`, 'error');
  } finally {
    entryParallelLoading.value = false;
  }
}

/**
 * 保存入口实验拟正式预测快照，保存后重新读取该期已保存数据。
 */
async function saveEntryParallel(request: EntryParallelPredictionRequest) {
  if (!validateEntryParallelRequest(request)) {
    return;
  }
  entryParallelLoading.value = true;
  setEntryParallelMessage('正在保存入口实验拟正式预测快照...', 'info');
  try {
    const response = await saveEntryParallelPrediction(request);
    entryParallelSavedSnapshots.value = response ?? [];
    const duplicateCount = entryParallelSavedSnapshots.value.filter((snapshot) => snapshot.alreadySaved).length;
    const duplicateText = duplicateCount ? `，其中 ${duplicateCount} 条命中已有快照未覆盖` : '';
    setEntryParallelMessage(`保存完成：${entryParallelSavedSnapshots.value.length} 条${duplicateText}。`, 'success');
    await loadEntryParallelSaved(request.predictQiHao);
  } catch (error) {
    setEntryParallelMessage(`保存拟正式快照失败：${errorText(error)}`, 'error');
  } finally {
    entryParallelLoading.value = false;
  }
}

/**
 * 读取指定期号的已保存入口拟正式快照。
 */
async function loadEntryParallelSaved(predictQiHao: string) {
  if (!predictQiHao) {
    setEntryParallelMessage('请先填写预测期号。', 'error');
    return;
  }
  entryParallelLoading.value = true;
  setEntryParallelMessage(`正在读取 ${predictQiHao} 已保存拟正式快照...`, 'info');
  try {
    const response = await listEntryParallelPredictions(predictQiHao);
    entryParallelSavedSnapshots.value = response ?? [];
    setEntryParallelMessage(`已读取 ${entryParallelSavedSnapshots.value.length} 条已保存拟正式快照。`, 'success');
  } catch (error) {
    setEntryParallelMessage(`读取已保存拟正式快照失败：${errorText(error)}`, 'error');
  } finally {
    entryParallelLoading.value = false;
  }
}

/**
 * 对已保存入口拟正式快照执行复盘并保存诊断包。
 */
async function reviewEntryParallel(predictQiHao: string, snapshotIds: number[]) {
  if (!predictQiHao) {
    setEntryParallelMessage('请先填写预测期号。', 'error');
    return;
  }
  if (!snapshotIds.length) {
    setEntryParallelMessage('当前期号没有可复盘的已保存快照。', 'error');
    return;
  }
  entryParallelLoading.value = true;
  setEntryParallelMessage(`正在复盘 ${predictQiHao} 的入口拟正式快照...`, 'info');
  try {
    const response = await reviewEntryParallelPredictions({ predictQiHao, snapshotIds });
    entryParallelSavedSnapshots.value = response ?? [];
    setEntryParallelMessage(`复盘完成：${entryParallelSavedSnapshots.value.length} 条，已保存诊断包。`, 'success');
  } catch (error) {
    setEntryParallelMessage(`复盘拟正式快照失败：${errorText(error)}`, 'error');
  } finally {
    entryParallelLoading.value = false;
  }
}

/**
 * 校验入口拟正式预测请求。
 */
function validateEntryParallelRequest(request: EntryParallelPredictionRequest) {
  if (!request.predictQiHao) {
    setEntryParallelMessage('请先填写预测期号。', 'error');
    return false;
  }
  if (!request.experimentIds.length) {
    setEntryParallelMessage('当前没有可用于拟正式预测的已保存入口实验。', 'error');
    return false;
  }
  return true;
}

/**
 * 从已保存实验摘要恢复统一指标展示。
 */
function baselineFromBundle(bundle: EntryRecallExperimentBundle): EntryRecallBaselineResult {
  const entrySizes = safeJsonArray<number>(bundle.experiment.entrySizesJson);
  const metricByEntrySize = safeJsonObject(bundle.experiment.metricSummaryJson) as Record<string, EntryRecallEntrySizeMetric>;
  return {
    componentCode: bundle.experiment.strategyCode,
    componentVersion: bundle.experiment.strategyVersion,
    normalizationMethod: null,
    periodCount: bundle.experiment.effectivePeriodCount,
    entrySizes,
    metricByEntrySize,
    periods: []
  };
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
 * 安全解析JSON对象。
 */
function safeJsonObject(value: string) {
  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * 设置页面提示。
 */
function setMessage(text: string, type: 'success' | 'error' | 'info') {
  message.value = text;
  messageType.value = type;
}

/**
 * 设置入口拟正式预测弹窗提示。
 */
function setEntryParallelMessage(text: string, type: 'success' | 'error' | 'info') {
  entryParallelMessage.value = text;
  entryParallelMessageType.value = type;
}

/**
 * 获取错误文本。
 */
function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

// 页面加载时只读取实验库，不自动触发昂贵的历史计算。
onMounted(() => {
  void loadExperiments();
});
</script>

<style scoped>
.page-header {
  border-radius: 8px;
  padding: 16px;
  background: var(--color-bg-card);
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
