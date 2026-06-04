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

    <!-- 实验横向对比 -->
    <section class="bg-bg-card rounded-lg p-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="section-title">实验横向对比</h2>
          <p class="section-subtitle">
            用两个已保存实验做同范围比较，重点看观察策略是否真的优于正式基线；该区域只做阅读，不改变正式预测。
          </p>
        </div>
        <div class="flex flex-wrap gap-2 text-xs">
          <button class="action-button" :disabled="comparisonLoading || !canLoadComparison" @click="loadComparison">
            {{ comparisonLoading ? '对比读取中...' : '加载对比' }}
          </button>
          <button class="action-button" :disabled="comparisonLoading" @click="clearComparison">
            清空对比
          </button>
        </div>
      </div>
      <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <label class="field-block">
          <span class="field-label">对比A实验ID</span>
          <input v-model.number="comparisonForm.leftExperimentId" class="field-input" type="number" min="1" />
        </label>
        <label class="field-block">
          <span class="field-label">对比B实验ID</span>
          <input v-model.number="comparisonForm.rightExperimentId" class="field-input" type="number" min="1" />
        </label>
      </div>
      <div v-if="comparisonResult" class="mt-4 space-y-4">
        <div class="boundary-note">
          当前对比：A 为 {{ comparisonResult.left.strategyCode }}（实验ID {{ comparisonResult.left.experimentId }}），
          B 为 {{ comparisonResult.right.strategyCode }}（实验ID {{ comparisonResult.right.experimentId }}）。
          若两者期号范围不同，只能作为粗略参考，不能作为策略升级证据。
        </div>
        <div class="overflow-x-auto">
          <table class="result-table">
            <thead>
            <tr>
              <th>指标</th>
              <th>A：{{ comparisonResult.left.strategyCode }}</th>
              <th>B：{{ comparisonResult.right.strategyCode }}</th>
              <th>B-A差值</th>
              <th>阅读提示</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="row in comparisonRows" :key="row.label">
              <td>{{ row.label }}</td>
              <td>{{ row.leftText }}</td>
              <td>{{ row.rightText }}</td>
              <td :class="row.deltaClass">{{ row.deltaText }}</td>
              <td>{{ row.hint }}</td>
            </tr>
            </tbody>
          </table>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="metric-card">
            <div class="metric-label">A范围</div>
            <div class="metric-value comparison-small">
              {{ comparisonResult.left.startQiHao }} ~ {{ comparisonResult.left.endQiHao }}
            </div>
            <div class="metric-hint">{{ comparisonResult.left.periodCount }}期 / {{ comparisonResult.left.experimentName }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">B范围</div>
            <div class="metric-value comparison-small">
              {{ comparisonResult.right.startQiHao }} ~ {{ comparisonResult.right.endQiHao }}
            </div>
            <div class="metric-hint">{{ comparisonResult.right.periodCount }}期 / {{ comparisonResult.right.experimentName }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">入口融合提示</div>
            <div class="metric-value comparison-small">{{ comparisonEntrySummary }}</div>
            <div class="metric-hint">仅观察B策略存在入口融合字段时显示。</div>
          </div>
        </div>
      </div>
      <div v-else class="mt-4 boundary-note">
        操作方式：在下方实验列表中点击“设为A/设为B”，或直接输入两个实验ID，再点击“加载对比”。
        建议先比较 OFFICIAL_V1 基线实验与观察策略实验。
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
      <div v-if="activeResult.stageMetrics" class="mt-4 stage-conversion-panel">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="distribution-title">阶段转化诊断</div>
            <div class="mt-1 text-xs text-text-secondary">
              观察入口池命中的真实红球，经过9红压缩和10注出票后被保留或丢失的程度。
            </div>
          </div>
          <div class="text-xs text-text-secondary">
            入口证据：{{ activeResult.stageMetrics.entryEvidencePeriodCount }} /
            {{ activeResult.stageMetrics.periodCount }} 期
          </div>
        </div>
        <div class="mt-3 metric-grid">
          <div class="metric-card">
            <div class="metric-label">原始 / 融合入口均值</div>
            <div class="metric-value comparison-small">
              {{ nullableNumberText(activeResult.stageMetrics.originalEntryAvgHit) }}
              /
              {{ nullableNumberText(activeResult.stageMetrics.fusedEntryAvgHit) }}
            </div>
            <div class="metric-hint">融合平均救回 {{ nullableNumberText(activeResult.stageMetrics.fusionRescuedAvgHit) }} 红</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">入口 → 9红</div>
            <div class="metric-value">{{ nullablePercent(activeResult.stageMetrics.entryToNineRetentionRate) }}</div>
            <div class="metric-hint">平均流失 {{ nullableNumberText(activeResult.stageMetrics.entryToNineLostAvgHit) }} 红</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">9红 → 10注最佳单式</div>
            <div class="metric-value">{{ nullablePercent(activeResult.stageMetrics.nineToBestTicketRetentionRate) }}</div>
            <div class="metric-hint">平均流失 {{ nullableNumberText(activeResult.stageMetrics.nineToBestTicketLostAvgHit) }} 红</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">入口 / 9红至少4红</div>
            <div class="metric-value comparison-small">
              {{ nullablePercent(activeResult.stageMetrics.entryAtLeast4RedRate) }}
              /
              {{ nullablePercent(activeResult.stageMetrics.ninePlusOneAtLeast4RedRate) }}
            </div>
            <div class="metric-hint">判断覆盖优势能否通过压缩保留下来</div>
          </div>
        </div>
        <div class="mt-3 boundary-note">
          {{ activeResult.stageMetrics.conclusion }}
          “10注最佳单式”是开奖后从10注中选择命中最多的一注，只用于观察压缩上限。
        </div>
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
              <button class="table-button table-button-secondary" @click="setCompareExperiment('left', item.experimentId)">
                设为A
              </button>
              <button class="table-button table-button-secondary" @click="setCompareExperiment('right', item.experimentId)">
                设为B
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
// 对比详情加载状态。
const comparisonLoading = ref(false);
// 页面提示文本。
const message = ref('');
// 页面提示类型。
const messageType = ref<'success' | 'error' | 'info'>('info');
// 是否展示完整逐期明细。
const showAllPeriods = ref(false);
// 实验对比表单。
const comparisonForm = reactive({
  leftExperimentId: null as number | null,
  rightExperimentId: null as number | null
});
// 实验对比结果。
const comparisonResult = ref<{ left: HistoricalReplayResult; right: HistoricalReplayResult } | null>(null);

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
 * 是否可以加载实验对比
 */
const canLoadComparison = computed(() => {
  // 两个实验ID都存在且不相同才允许对比。
  return Boolean(comparisonForm.leftExperimentId && comparisonForm.rightExperimentId
    && comparisonForm.leftExperimentId !== comparisonForm.rightExperimentId);
});

/**
 * 对比指标行
 */
const comparisonRows = computed(() => {
  // 没有对比结果时返回空数组。
  if (!comparisonResult.value) {
    return [];
  }
  // 读取左右实验。
  const { left, right } = comparisonResult.value;
  // 返回核心指标比较。
  return [
    buildComparisonRow('净收益', left.totalNet, right.totalNet, 'money', '收益越高越好，但不能只看单一收益。'),
    buildComparisonRow('回收率', left.returnRate, right.returnRate, 'percent', '回收率用于观察整体成本回补能力。'),
    buildComparisonRow('10注最高红均值', left.bestTicketRedAvgHit, right.bestTicketRedAvgHit, 'number', '判断出票层是否留住红球优势。'),
    buildComparisonRow('蓝球命中率', left.blueHitRate, right.blueHitRate, 'percent', '蓝球不变时该项通常不会改善。'),
    buildComparisonRow('至少3红比例', left.atLeast3RedRate, right.atLeast3RedRate, 'percent', '衡量10注方案是否更常达到小奖门槛。'),
    buildComparisonRow('至少4红比例', left.atLeast4RedRate, right.atLeast4RedRate, 'percent', '用于观察是否更接近高价值命中。'),
    buildComparisonRow('服务耗时', left.elapsedMs, right.elapsedMs, 'ms-negative', '耗时越低越好，观察策略通常会更慢。')
  ];
});

/**
 * 入口融合摘要
 */
const comparisonEntrySummary = computed(() => {
  // 没有对比结果时兜底。
  if (!comparisonResult.value) {
    return '暂无对比';
  }
  // 优先读取右侧观察策略的融合入口命中均值。
  const average = averageFusedEntryHit(comparisonResult.value.right);
  // 右侧无入口字段时说明不适用。
  if (average == null) {
    return 'B无入口字段';
  }
  // 返回均值文本。
  return `B入口均值 ${average.toFixed(2)}红`;
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
    // 默认将最近两条实验填入对比框，方便进入页面后快速比较最新观察策略和基线。
    if (!comparisonForm.leftExperimentId && experiments.value[1]) {
      comparisonForm.leftExperimentId = experiments.value[1].experimentId;
    }
    if (!comparisonForm.rightExperimentId && experiments.value[0]) {
      comparisonForm.rightExperimentId = experiments.value[0].experimentId;
    }
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
 * 设置对比实验ID
 * @param side 对比位置
 * @param experimentId 实验ID
 */
function setCompareExperiment(side: 'left' | 'right', experimentId: number) {
  // 设置左侧实验。
  if (side === 'left') {
    comparisonForm.leftExperimentId = experimentId;
  }
  // 设置右侧实验。
  if (side === 'right') {
    comparisonForm.rightExperimentId = experimentId;
  }
}

/**
 * 加载两个实验详情用于横向对比
 */
async function loadComparison() {
  // 参数不完整时提示。
  if (!canLoadComparison.value || !comparisonForm.leftExperimentId || !comparisonForm.rightExperimentId) {
    setMessage('请先选择两个不同的实验ID。', 'error');
    return;
  }
  // 进入对比加载状态。
  comparisonLoading.value = true;
  // 设置提示。
  setMessage(`正在读取实验 ${comparisonForm.leftExperimentId} 与 ${comparisonForm.rightExperimentId} 的对比数据...`, 'info');
  try {
    // 并行读取两个实验详情。
    const [leftResponse, rightResponse] = await Promise.all([
      getHistoricalReplayDetail(comparisonForm.leftExperimentId),
      getHistoricalReplayDetail(comparisonForm.rightExperimentId)
    ]);
    // 写入对比结果。
    comparisonResult.value = {
      left: leftResponse.data,
      right: rightResponse.data
    };
    // 成功提示。
    setMessage('实验对比已加载。', 'success');
  } catch (error) {
    // 展示错误信息。
    setMessage(`读取实验对比失败：${errorText(error)}`, 'error');
  } finally {
    // 退出对比加载状态。
    comparisonLoading.value = false;
  }
}

/**
 * 清空实验对比
 */
function clearComparison() {
  // 清空对比表单。
  comparisonForm.leftExperimentId = null;
  comparisonForm.rightExperimentId = null;
  // 清空对比结果。
  comparisonResult.value = null;
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
 * 格式化允许为空的阶段命中数字
 * @param value 阶段指标
 * @returns 可读数字或不适用
 */
function nullableNumberText(value: number | null | undefined) {
  // 空值表示当前实验没有对应阶段证据。
  return value == null ? '不适用' : value.toFixed(2);
}

/**
 * 格式化允许为空的阶段比例
 * @param value 阶段比例
 * @returns 百分比或不适用
 */
function nullablePercent(value: number | null | undefined) {
  // 空值表示当前实验没有对应阶段证据。
  return value == null ? '不适用' : percent(value);
}

/**
 * 构建对比指标行
 * @param label 指标名称
 * @param left 左侧值
 * @param right 右侧值
 * @param type 展示类型
 * @param hint 阅读提示
 * @returns 对比行
 */
function buildComparisonRow(
  label: string,
  left: number | null | undefined,
  right: number | null | undefined,
  type: 'money' | 'percent' | 'number' | 'ms-negative',
  hint: string
) {
  // 空值按0参与差值，展示仍走格式化函数。
  const leftNumber = left ?? 0;
  const rightNumber = right ?? 0;
  // 计算右侧减左侧。
  const delta = rightNumber - leftNumber;
  // 耗时类指标越小越好，其余指标越大越好。
  const positive = type === 'ms-negative' ? delta < 0 : delta > 0;
  // 返回页面行对象。
  return {
    label,
    leftText: comparisonValueText(left, type),
    rightText: comparisonValueText(right, type),
    deltaText: comparisonDeltaText(delta, type),
    deltaClass: positive ? 'text-green-300 font-bold' : delta === 0 ? 'text-text-secondary' : 'text-ball-red font-bold',
    hint
  };
}

/**
 * 格式化对比值
 * @param value 指标值
 * @param type 展示类型
 * @returns 指标文本
 */
function comparisonValueText(value: number | null | undefined, type: 'money' | 'percent' | 'number' | 'ms-negative') {
  // 百分比用百分比格式。
  if (type === 'percent') {
    return percent(value);
  }
  // 耗时用毫秒格式。
  if (type === 'ms-negative') {
    return formatMs(value);
  }
  // 金额直接展示整数。
  if (type === 'money') {
    return value == null ? '-' : String(value);
  }
  // 普通数字保留两位。
  return numberText(value);
}

/**
 * 格式化对比差值
 * @param delta 差值
 * @param type 展示类型
 * @returns 差值文本
 */
function comparisonDeltaText(delta: number, type: 'money' | 'percent' | 'number' | 'ms-negative') {
  // 差值前缀。
  const sign = delta > 0 ? '+' : '';
  // 百分比差值。
  if (type === 'percent') {
    return `${sign}${(delta * 100).toFixed(2)}%`;
  }
  // 耗时差值。
  if (type === 'ms-negative') {
    return `${sign}${formatSignedMs(delta)}`;
  }
  // 金额差值。
  if (type === 'money') {
    return `${sign}${delta}`;
  }
  // 普通数字差值。
  return `${sign}${delta.toFixed(2)}`;
}

/**
 * 格式化带正负号的毫秒差值
 * @param value 毫秒差值
 * @returns 可读耗时差值
 */
function formatSignedMs(value: number) {
  // 取绝对值决定单位。
  const absValue = Math.abs(value);
  // 超过1秒时按秒显示。
  if (absValue >= 1000) {
    return `${value < 0 ? '-' : ''}${(absValue / 1000).toFixed(2)}秒`;
  }
  // 否则按毫秒显示。
  return `${value < 0 ? '-' : ''}${absValue}ms`;
}

/**
 * 计算融合入口命中均值
 * @param result 历史回放结果
 * @returns 融合入口命中均值
 */
function averageFusedEntryHit(result: HistoricalReplayResult) {
  // 提取存在融合入口字段的逐期明细。
  const values = result.periods
    .map((period) => period.fusedEntryHitNumbers?.length)
    .filter((value): value is number => value != null);
  // 没有字段时返回空。
  if (!values.length) {
    return null;
  }
  // 求平均。
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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

.stage-conversion-panel {
  padding: 12px;
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 6px;
  background: rgba(8, 47, 73, 0.22);
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

.table-button + .table-button {
  margin-left: 6px;
}

.table-button-secondary {
  background: rgba(22, 33, 62, 0.85);
  border: 1px solid rgba(234, 234, 234, 0.10);
}

.comparison-small {
  font-size: 14px;
  line-height: 1.4;
}
</style>
