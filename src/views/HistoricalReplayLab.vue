<template>
  <!-- 历史回放实验台页面容器 -->
  <div class="p-4 space-y-4">
    <!-- 页面头部，说明历史回放与真实快照复盘的边界 -->
    <section class="bg-bg-card rounded-lg p-4">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-lg font-bold text-text-primary">历史回放实验台</h1>
          <p class="mt-1 text-xs text-text-secondary">
            用开奖前视角批量回放历史期号，验证策略版本表现；它是策略实验，不是开奖前真实快照复盘。
          </p>
        </div>
        <div class="flex flex-wrap gap-2 text-xs">
          <button class="action-button" :disabled="running" @click="loadExperimentList">
            {{ listLoading ? '读取中...' : '刷新实验列表' }}
          </button>
          <button class="action-button action-button-primary" :disabled="running" @click="runReplay(false)">
            {{ running && !form.saveResult ? '运行中...' : '运行不保存' }}
          </button>
          <button class="action-button" :disabled="running" @click="runReplay(true)">
            {{ running && form.saveResult ? '保存中...' : '运行并保存' }}
          </button>
        </div>
      </div>
      <div class="mt-3 boundary-note">
        数据边界：目标期预测只能读取目标期之前的数据；真实开奖只用于预测生成后的评估。若要复盘真实开奖前预测，请回到“快照复盘台”。
      </div>
      <div v-if="message" class="mt-3 text-xs" :class="messageClass">
        {{ message }}
      </div>
    </section>

    <!-- 参数区 -->
    <section class="bg-bg-card rounded-lg p-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="section-title">实验参数</h2>
          <p class="section-subtitle">默认先跑10期，100期建议使用“运行并保存”，便于后续直接读取详情。</p>
        </div>
        <div class="text-xs text-text-secondary">
          当前策略：{{ form.strategyCode }}
        </div>
      </div>
      <div class="mt-4 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <label class="field-block">
          <span class="field-label">策略编码</span>
          <input v-model="form.strategyCode" class="field-input" />
        </label>
        <label class="field-block">
          <span class="field-label">实验名称</span>
          <input v-model="form.experimentName" class="field-input" placeholder="可为空" />
        </label>
        <label class="field-block">
          <span class="field-label">最近期数</span>
          <input v-model.number="form.recentLimit" class="field-input" type="number" min="1" max="500" />
        </label>
        <label class="field-block">
          <span class="field-label">票面数量</span>
          <input v-model.number="form.ticketLimit" class="field-input" type="number" min="1" max="30" />
        </label>
        <label class="field-block">
          <span class="field-label">起始期号</span>
          <input v-model="form.startQiHao" class="field-input" placeholder="可为空" />
        </label>
        <label class="field-block">
          <span class="field-label">结束期号</span>
          <input v-model="form.endQiHao" class="field-input" placeholder="可为空" />
        </label>
      </div>
    </section>

    <!-- 当前结果摘要 -->
    <section v-if="activeResult" class="bg-bg-card rounded-lg p-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="section-title">当前实验结果</h2>
          <p class="section-subtitle">
            {{ activeResult.strategyCode }} / {{ activeResult.strategyVersion }}，
            {{ activeResult.startQiHao }} ~ {{ activeResult.endQiHao }}，
            共 {{ activeResult.periodCount }} 期。
          </p>
        </div>
        <div class="text-xs text-text-secondary">
          服务耗时：{{ formatMs(activeResult.elapsedMs) }}
          <span v-if="activeResult.experimentId"> / 实验ID：{{ activeResult.experimentId }}</span>
        </div>
      </div>
      <div class="mt-4 metric-grid">
        <div class="metric-card">
          <div class="metric-label">净收益</div>
          <div class="metric-value" :class="activeResult.totalNet >= 0 ? 'text-green-300' : 'text-ball-red'">
            {{ activeResult.totalNet }}
          </div>
          <div class="metric-hint">成本 {{ activeResult.totalCost }} / 奖金 {{ activeResult.totalPrize }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">回收率</div>
          <div class="metric-value">{{ percent(activeResult.returnRate) }}</div>
          <div class="metric-hint">奖金 ÷ 成本</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">10注最高红均值</div>
          <div class="metric-value">{{ numberText(activeResult.bestTicketRedAvgHit) }}</div>
          <div class="metric-hint">最高红命中：{{ activeResult.maxRedHit }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">蓝球命中率</div>
          <div class="metric-value text-ball-blue">{{ percent(activeResult.blueHitRate) }}</div>
          <div class="metric-hint">主链路10注蓝球覆盖</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">至少3红</div>
          <div class="metric-value">{{ percent(activeResult.atLeast3RedRate) }}</div>
          <div class="metric-hint">至少4红 {{ percent(activeResult.atLeast4RedRate) }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">跳过期数</div>
          <div class="metric-value">{{ activeResult.skippedCount }}</div>
          <div class="metric-hint">数据不足或结构异常</div>
        </div>
      </div>
      <div class="mt-4 boundary-note">
        {{ activeResult.conclusion }}
      </div>
      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="distribution-card">
          <div class="distribution-title">最高红球命中分布</div>
          <div class="distribution-items">
            <span
              v-for="item in distributionItems(activeResult.bestRedHitDistribution, '红')"
              :key="item"
              class="distribution-badge"
            >
              {{ item }}
            </span>
          </div>
        </div>
        <div class="distribution-card">
          <div class="distribution-title">最佳奖级分布</div>
          <div class="distribution-items">
            <span
              v-for="item in distributionItems(activeResult.bestPrizeDistribution, '')"
              :key="item"
              class="distribution-badge"
            >
              {{ item }}
            </span>
          </div>
        </div>
      </div>
      <div class="mt-4 overflow-x-auto">
        <table class="result-table">
          <thead>
          <tr>
            <th>期号</th>
            <th>实际开奖</th>
            <th>主推荐</th>
            <th>最佳单式</th>
            <th>红球</th>
            <th>蓝球</th>
            <th>收益</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="period in previewPeriods" :key="period.predictQiHao">
            <td>{{ period.predictQiHao }}</td>
            <td>{{ period.actualRedNumbers.join(',') }} + {{ period.actualBlueNumber }}</td>
            <td>{{ period.mainTicketText }}</td>
            <td>{{ period.bestSingleTicketText }}</td>
            <td>{{ period.bestTicketRedHitCount }}红</td>
            <td :class="period.blueHit ? 'text-ball-blue font-bold' : 'text-text-secondary'">
              {{ period.blueHit ? '命中' : '未中' }}
            </td>
            <td :class="period.netAmount >= 0 ? 'text-green-300' : 'text-ball-red'">
              {{ period.netAmount }}
            </td>
          </tr>
          </tbody>
        </table>
      </div>
      <div v-if="activeResult.periods.length > previewPeriods.length" class="mt-2 text-xs text-text-secondary">
        当前只展示前 {{ previewPeriods.length }} 期明细。
        <button class="inline-link" @click="showAllPeriods = true">展开全部</button>
      </div>
      <div v-else-if="activeResult.periods.length > 20" class="mt-2 text-xs text-text-secondary">
        当前已展示全部 {{ activeResult.periods.length }} 期明细。
        <button class="inline-link" @click="showAllPeriods = false">收起到前20期</button>
      </div>
    </section>

    <!-- 已保存实验列表 -->
    <section class="bg-bg-card rounded-lg p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="section-title">已保存实验</h2>
          <p class="section-subtitle">读取数据库中已保存的历史回放实验，不重新计算历史预测。</p>
        </div>
        <div class="text-xs text-text-secondary">
          {{ experiments.length }} 条
        </div>
      </div>
      <div class="mt-4 overflow-x-auto">
        <table class="result-table">
          <thead>
          <tr>
            <th>ID</th>
            <th>名称</th>
            <th>范围</th>
            <th>期数</th>
            <th>净收益</th>
            <th>红均值</th>
            <th>蓝命中</th>
            <th>耗时</th>
            <th>操作</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="item in experiments" :key="item.experimentId">
            <td>{{ item.experimentId }}</td>
            <td>{{ item.experimentName }}</td>
            <td>{{ item.startQiHao }} ~ {{ item.endQiHao }}</td>
            <td>{{ item.periodCount }}</td>
            <td :class="item.totalNet >= 0 ? 'text-green-300' : 'text-ball-red'">{{ item.totalNet }}</td>
            <td>{{ numberText(item.bestTicketRedAvgHit) }}</td>
            <td>{{ percent(item.blueHitRate) }}</td>
            <td>{{ formatMs(item.elapsedMs) }}</td>
            <td>
              <button class="table-button" :disabled="detailLoading" @click="loadDetail(item.experimentId)">
                查看详情
              </button>
            </td>
          </tr>
          <tr v-if="!experiments.length">
            <td colspan="9" class="text-center text-text-secondary py-4">暂无已保存实验。</td>
          </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 历史开奖前视角回放实验台
 * 负责运行、保存、读取和展示历史回放实验结果。
 */
import { computed, onMounted, reactive, ref } from 'vue';
import {
  getHistoricalReplayDetail,
  listHistoricalReplayExperiments,
  runHistoricalReplay
} from '../api/modules/historicalReplay';
import type {
  HistoricalReplayExperimentSummary,
  HistoricalReplayResult,
  HistoricalReplayRunParams
} from '../api/modules/historicalReplay';

/**
 * 历史回放表单状态
 */
const form = reactive<HistoricalReplayRunParams>({
  strategyCode: 'OFFICIAL_V1',
  experimentName: '',
  recentLimit: 10,
  ticketLimit: 10,
  startQiHao: '',
  endQiHao: '',
  saveResult: false
});

// 当前实验结果。
const activeResult = ref<HistoricalReplayResult | null>(null);
// 已保存实验列表。
const experiments = ref<HistoricalReplayExperimentSummary[]>([]);
// 运行加载状态。
const running = ref(false);
// 列表加载状态。
const listLoading = ref(false);
// 详情加载状态。
const detailLoading = ref(false);
// 页面提示文本。
const message = ref('');
// 页面提示类型。
const messageType = ref<'success' | 'error' | 'info'>('info');
// 是否展示完整逐期明细。
const showAllPeriods = ref(false);

/**
 * 当前结果预览明细
 */
const previewPeriods = computed(() => {
  // 没有结果时返回空数组。
  if (!activeResult.value) {
    return [];
  }
  // 展开后展示完整明细。
  if (showAllPeriods.value) {
    return activeResult.value.periods;
  }
  // 默认限制展示数量，避免100期明细把页面拉得过长。
  return activeResult.value.periods.slice(0, 20);
});

/**
 * 提示样式
 */
const messageClass = computed(() => {
  // 成功提示。
  if (messageType.value === 'success') {
    return 'text-green-300';
  }
  // 错误提示。
  if (messageType.value === 'error') {
    return 'text-ball-red';
  }
  // 普通提示。
  return 'text-text-secondary';
});

/**
 * 运行历史回放
 * @param saveResult 是否保存结果
 */
async function runReplay(saveResult: boolean) {
  // 记录保存标记。
  form.saveResult = saveResult;
  // 进入运行状态。
  running.value = true;
  // 设置提示。
  setMessage(saveResult ? '正在运行并保存历史回放实验...' : '正在运行历史回放实验...', 'info');
  try {
    // 调用后端回放接口。
    const response = await runHistoricalReplay(cleanParams({ ...form, saveResult }));
    // 保存当前结果。
    activeResult.value = response.data;
    // 新结果默认收起长明细。
    showAllPeriods.value = false;
    // 成功提示。
    setMessage(`历史回放完成：${response.data.periodCount}期，净收益${response.data.totalNet}。`, 'success');
    // 保存后刷新实验列表。
    if (saveResult) {
      await loadExperimentList();
    }
  } catch (error) {
    // 错误时展示后端或浏览器错误信息。
    setMessage(`历史回放失败：${errorText(error)}`, 'error');
  } finally {
    // 退出运行状态。
    running.value = false;
  }
}

/**
 * 查询实验列表
 */
async function loadExperimentList() {
  // 进入列表加载状态。
  listLoading.value = true;
  try {
    // 调用列表接口。
    const response = await listHistoricalReplayExperiments(20);
    // 写入列表。
    experiments.value = response.data ?? [];
  } catch (error) {
    // 展示错误信息。
    setMessage(`读取实验列表失败：${errorText(error)}`, 'error');
  } finally {
    // 退出列表加载状态。
    listLoading.value = false;
  }
}

/**
 * 查询实验详情
 * @param experimentId 实验ID
 */
async function loadDetail(experimentId: number) {
  // 进入详情加载状态。
  detailLoading.value = true;
  // 设置提示。
  setMessage(`正在读取实验 ${experimentId} 详情...`, 'info');
  try {
    // 调用详情接口。
    const response = await getHistoricalReplayDetail(experimentId);
    // 写入当前结果。
    activeResult.value = response.data;
    // 读取详情后默认收起长明细。
    showAllPeriods.value = false;
    // 成功提示。
    setMessage(`已读取实验 ${experimentId}：${response.data.periodCount}期。`, 'success');
  } catch (error) {
    // 展示错误信息。
    setMessage(`读取实验详情失败：${errorText(error)}`, 'error');
  } finally {
    // 退出详情加载状态。
    detailLoading.value = false;
  }
}

/**
 * 清理空参数，避免把空字符串传给后端当作有效期号
 * @param params 原始参数
 * @returns 清理后的参数
 */
function cleanParams(params: HistoricalReplayRunParams) {
  // 复制参数。
  const result: HistoricalReplayRunParams = { ...params };
  // 起始期号为空时移除。
  if (!result.startQiHao) {
    delete result.startQiHao;
  }
  // 结束期号为空时移除。
  if (!result.endQiHao) {
    delete result.endQiHao;
  }
  // 实验名称为空时移除。
  if (!result.experimentName) {
    delete result.experimentName;
  }
  // 返回清理结果。
  return result;
}

/**
 * 设置页面提示
 * @param text 提示文本
 * @param type 提示类型
 */
function setMessage(text: string, type: 'success' | 'error' | 'info') {
  // 写入提示文本。
  message.value = text;
  // 写入提示类型。
  messageType.value = type;
}

/**
 * 格式化毫秒耗时
 * @param value 毫秒
 * @returns 可读耗时
 */
function formatMs(value: number | null | undefined) {
  // 空值兜底。
  if (value == null) {
    return '-';
  }
  // 超过1秒时显示秒。
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}秒`;
  }
  // 否则显示毫秒。
  return `${value}ms`;
}

/**
 * 格式化百分比
 * @param value 比例
 * @returns 百分比文本
 */
function percent(value: number | null | undefined) {
  // 空值兜底。
  if (value == null) {
    return '-';
  }
  // 转为百分比。
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * 格式化数字
 * @param value 数字
 * @returns 数字文本
 */
function numberText(value: number | null | undefined) {
  // 空值兜底。
  if (value == null) {
    return '-';
  }
  // 保留两位。
  return value.toFixed(2);
}

/**
 * 将分布对象转为页面标签
 * @param distribution 分布对象
 * @param suffix 标签后缀
 * @returns 分布标签列表
 */
function distributionItems(distribution: Record<string, number> | null | undefined, suffix: string) {
  // 空分布兜底。
  if (!distribution) {
    return ['暂无数据'];
  }
  // 按命中数或奖级文本排序后输出。
  const items = Object.entries(distribution)
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([key, value]) => `${key}${suffix}：${value}期`);
  // 无有效项时兜底。
  return items.length ? items : ['暂无数据'];
}

/**
 * 获取错误文本
 * @param error 错误对象
 * @returns 错误文本
 */
function errorText(error: unknown) {
  // Axios错误通常带有message。
  if (error instanceof Error) {
    return error.message;
  }
  // 其他错误转为字符串。
  return String(error);
}

// 页面加载时读取已保存实验。
onMounted(() => {
  void loadExperimentList();
});
</script>

<style scoped>
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

.boundary-note {
  border: 1px solid rgba(234, 234, 234, 0.18);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: rgba(22, 33, 62, 0.45);
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.field-input {
  width: 100%;
  border: 1px solid rgba(234, 234, 234, 0.14);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 13px;
  color: var(--color-text-primary);
  background: rgba(15, 23, 42, 0.55);
  outline: none;
}

.field-input:focus {
  border-color: rgba(233, 69, 96, 0.8);
}

.action-button {
  border-radius: 6px;
  padding: 7px 11px;
  color: var(--color-text-primary);
  background: rgba(22, 33, 62, 0.85);
  border: 1px solid rgba(234, 234, 234, 0.10);
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.action-button-primary {
  background: var(--color-accent);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.metric-card {
  border: 1px solid rgba(234, 234, 234, 0.10);
  border-radius: 6px;
  padding: 12px;
  background: rgba(22, 33, 62, 0.55);
}

.metric-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.metric-value {
  margin-top: 6px;
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.metric-hint {
  margin-top: 4px;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.distribution-card {
  border: 1px solid rgba(234, 234, 234, 0.10);
  border-radius: 6px;
  padding: 12px;
  background: rgba(22, 33, 62, 0.45);
}

.distribution-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.distribution-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.distribution-badge {
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: rgba(15, 23, 42, 0.55);
}

.inline-link {
  margin-left: 6px;
  color: var(--color-accent);
  text-decoration: underline;
}

.result-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.result-table th {
  padding: 9px 8px;
  text-align: left;
  color: var(--color-text-primary);
  background: rgba(22, 33, 62, 0.8);
}

.result-table td {
  border-bottom: 1px solid rgba(234, 234, 234, 0.08);
  padding: 9px 8px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.table-button {
  border-radius: 5px;
  padding: 5px 8px;
  color: var(--color-text-primary);
  background: rgba(233, 69, 96, 0.8);
}
</style>
