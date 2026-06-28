<template>
  <div class="p-4 space-y-4">
    <LatestDrawInfo :data="lotteryStore.latestDraw" />

    <section class="decision-card">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-lg font-bold">蓝球窗口决策台</h1>
          <p class="text-xs text-text-secondary">按蓝10/16/32窗口逐步观察、调权、保存样本并复盘。</p>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <input v-model="predictQiHao" class="field w-28" placeholder="预测期号" />
          <button class="btn primary" :disabled="loading" @click="loadPrepare">读取窗口</button>
          <button class="btn" :disabled="loading || !prepare" @click="runScore">重新评分</button>
          <button class="btn danger" :disabled="loading" @click="clearTestData">删除测试数据</button>
        </div>
      </div>
      <div v-if="message" class="mt-3 text-xs" :class="messageClass">{{ message }}</div>
    </section>

    <section v-if="prepare" class="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div v-for="window in prepare.windows" :key="window.windowCode" class="decision-card">
        <div class="flex items-center justify-between gap-2">
          <h2 class="font-bold">{{ window.windowName }}</h2>
          <span class="text-xs text-text-secondary">状态：{{ window.stateText }}</span>
        </div>
        <div class="mt-3 space-y-2">
          <div v-for="level in window.levels" :key="level.level" class="level-row">
            <div class="level-title">lv{{ level.level }}</div>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="number in level.numbers"
                :key="number"
                class="blue-pill"
                :class="{ down: level.willDownNumbers.includes(number) }"
              >
                {{ number }}{{ level.willDownNumbers.includes(number) ? '↓' : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="scoreResult" class="decision-card">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-bold">蓝球评分与人工调整</h2>
          <p class="text-xs text-text-secondary">勾选“保留/排除”后重新评分；最终选择用于保存样本。</p>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <input v-model="sampleName" class="field w-40" placeholder="样本名称" />
          <label class="inline-flex items-center gap-1">
            <input v-model="testData" type="checkbox" />
            测试数据
          </label>
          <button class="btn primary" :disabled="loading" @click="saveSnapshot">保存样本</button>
          <button class="btn" :disabled="loading" @click="loadSnapshots">读取样本</button>
          <button class="btn" :disabled="loading" @click="reviewBatch">批量复盘</button>
        </div>
      </div>

      <div class="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div class="table-wrap">
          <table class="decision-table">
            <thead>
              <tr>
                <th>蓝球</th>
                <th>分</th>
                <th>等级</th>
                <th>选择</th>
                <th>保留</th>
                <th>排除</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in scoreResult.scores" :key="row.number">
                <td class="font-bold text-ball-blue">{{ row.number }}</td>
                <td>{{ row.score }}</td>
                <td>{{ row.grade }}</td>
                <td><input v-model="selectedBlue" type="checkbox" :value="row.number" /></td>
                <td><input v-model="forcedNumbers" type="checkbox" :value="row.number" /></td>
                <td><input v-model="excludedNumbers" type="checkbox" :value="row.number" /></td>
                <td class="text-xs text-text-secondary">{{ row.reasons.join('；') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="space-y-3">
          <div class="summary-box">
            <div class="summary-label">系统候选</div>
            <div class="summary-value text-ball-blue">{{ scoreResult.candidateBlue.join(',') }}</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">最终选择</div>
            <div class="summary-value">{{ selectedBlue.join(',') || '未选择' }}</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">人工分数微调（可选）</div>
            <div class="grid grid-cols-4 gap-2">
              <label v-for="n in allBlueNumbers" :key="n" class="text-xs">
                {{ n }}
                <input v-model.number="ballAdjust[n]" class="field mt-1 w-full" type="number" step="0.5" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="decision-card">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="font-bold">已保存样本</h2>
        <span class="text-xs text-text-secondary">{{ snapshots.length }} 条</span>
      </div>
      <div class="table-wrap mt-3">
        <table class="decision-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>期号</th>
              <th>样本</th>
              <th>选择</th>
              <th>候选</th>
              <th>开奖</th>
              <th>结果</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="snapshot in snapshots" :key="snapshot.id">
              <td>{{ snapshot.id }}</td>
              <td>{{ snapshot.predictQiHao }}</td>
              <td>{{ snapshot.sampleName }}</td>
              <td class="font-bold">{{ snapshot.selectedBlue.join(',') }}</td>
              <td class="text-ball-blue">{{ snapshot.candidateBlue.join(',') }}</td>
              <td>{{ snapshot.actualBlue || '--' }}</td>
              <td :class="snapshot.hitResult === 1 ? 'text-green-300' : 'text-text-secondary'">
                {{ snapshot.hitResult === null ? '--' : snapshot.hitResult === 1 ? '命中' : '未中' }}
              </td>
              <td>{{ snapshot.reviewStatus }}</td>
              <td>
                <button class="btn" :disabled="loading" @click="echoSnapshot(snapshot)">回显</button>
                <button class="btn" :disabled="loading" @click="reviewOne(snapshot.id)">复盘</button>
              </td>
            </tr>
            <tr v-if="snapshots.length === 0">
              <td colspan="9" class="text-center text-text-secondary">暂无样本</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 蓝球窗口决策台。
 * 第一版先让窗口地图、系统评分、人工调整、样本保存和复盘形成闭环。
 */
import { computed, onMounted, reactive, ref } from 'vue';
import LatestDrawInfo from '@/components/lottery/LatestDrawInfo.vue';
import { useLotteryStore } from '@/stores/lottery';
import {
  deleteBlueDecisionTestData,
  listBlueDecision,
  prepareBlueDecision,
  reviewBlueDecision,
  reviewBlueDecisionBatch,
  saveBlueDecision,
  scoreBlueDecision,
  type BlueDecisionPrepare,
  type BlueDecisionScore,
  type BlueDecisionSnapshot
} from '@/api/modules/blueDecision';

const lotteryStore = useLotteryStore();
const predictQiHao = ref('');
const sampleName = ref('蓝球窗口样本');
const testData = ref(false);
const loading = ref(false);
const message = ref('');
const messageType = ref<'ok' | 'error'>('ok');
const prepare = ref<BlueDecisionPrepare | null>(null);
const scoreResult = ref<BlueDecisionScore | null>(null);
const selectedBlue = ref<string[]>([]);
const forcedNumbers = ref<string[]>([]);
const excludedNumbers = ref<string[]>([]);
const snapshots = ref<BlueDecisionSnapshot[]>([]);
const ballAdjust = reactive<Record<string, number>>({});
const allBlueNumbers = Array.from({ length: 16 }, (_, index) => String(index + 1).padStart(2, '0'));

const messageClass = computed(() => messageType.value === 'ok' ? 'text-green-300' : 'text-ball-red');

function manualAdjust() {
  return {
    windowWeights: {},
    levelAdjust: {},
    ballAdjust: Object.fromEntries(Object.entries(ballAdjust).filter(([, value]) => Number(value) !== 0)),
    forcedNumbers: forcedNumbers.value,
    excludedNumbers: excludedNumbers.value
  };
}

async function loadPrepare() {
  await run(async () => {
    prepare.value = await prepareBlueDecision(predictQiHao.value);
    await runScore();
    await loadSnapshots();
    setMessage('窗口读取完成');
  });
}

async function runScore() {
  await run(async () => {
    scoreResult.value = await scoreBlueDecision(predictQiHao.value, manualAdjust());
    selectedBlue.value = [...scoreResult.value.candidateBlue.slice(0, 2)];
    setMessage('评分完成');
  });
}

async function saveSnapshot() {
  await run(async () => {
    await saveBlueDecision({
      predictQiHao: predictQiHao.value,
      sampleName: sampleName.value,
      manualAdjust: manualAdjust(),
      selectedBlue: selectedBlue.value,
      testData: testData.value
    });
    await loadSnapshots();
    setMessage('样本已保存');
  });
}

async function loadSnapshots() {
  snapshots.value = await listBlueDecision(predictQiHao.value);
}

async function reviewOne(id: number) {
  await run(async () => {
    await reviewBlueDecision(id);
    await loadSnapshots();
    setMessage('复盘完成');
  });
}

async function reviewBatch() {
  await run(async () => {
    await reviewBlueDecisionBatch(predictQiHao.value);
    await loadSnapshots();
    setMessage('批量复盘完成');
  });
}

function echoSnapshot(snapshot: BlueDecisionSnapshot) {
  sampleName.value = snapshot.sampleName;
  selectedBlue.value = [...snapshot.selectedBlue];
  setMessage(`已回显样本 ${snapshot.id}`);
}

async function clearTestData() {
  await run(async () => {
    const result = await deleteBlueDecisionTestData();
    await loadSnapshots();
    setMessage(`已删除测试数据 ${result.deletedCount} 条`);
  });
}

async function run(task: () => Promise<void>) {
  loading.value = true;
  try {
    await task();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    setMessage(reason, 'error');
  } finally {
    loading.value = false;
  }
}

function setMessage(text: string, type: 'ok' | 'error' = 'ok') {
  message.value = text;
  messageType.value = type;
}

onMounted(async () => {
  await lotteryStore.loadLatestFromDB();
  predictQiHao.value = lotteryStore.latestDraw?.nextQiHao || lotteryStore.latestDraw?.qiHao || '';
  if (predictQiHao.value) {
    await loadPrepare();
  }
});
</script>

<style scoped>
.decision-card {
  border: 1px solid rgba(234, 234, 234, 0.12);
  border-radius: 8px;
  background: var(--color-bg-card);
  padding: 14px;
}

.btn {
  border-radius: 6px;
  background: rgba(22, 33, 62, 0.9);
  padding: 7px 10px;
  color: var(--color-text-primary);
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.btn.primary {
  background: var(--color-accent);
}

.btn.danger {
  background: rgba(255, 71, 87, 0.35);
}

.field {
  border-radius: 6px;
  border: 1px solid rgba(234, 234, 234, 0.16);
  background: rgba(15, 52, 96, 0.9);
  padding: 7px 8px;
  color: var(--color-text-primary);
}

.level-row {
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 8px;
  align-items: start;
}

.level-title {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.blue-pill {
  border-radius: 999px;
  background: rgba(55, 66, 250, 0.35);
  padding: 3px 7px;
  color: #dfe5ff;
  font-size: 12px;
}

.blue-pill.down {
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.table-wrap {
  overflow-x: auto;
}

.decision-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.decision-table th {
  background: rgba(22, 33, 62, 0.95);
  padding: 8px;
  text-align: left;
}

.decision-table td {
  border-bottom: 1px solid rgba(234, 234, 234, 0.08);
  padding: 8px;
  vertical-align: top;
}

.summary-box {
  border: 1px solid rgba(234, 234, 234, 0.1);
  border-radius: 8px;
  background: rgba(22, 33, 62, 0.55);
  padding: 10px;
}

.summary-label {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.summary-value {
  margin-top: 4px;
  font-weight: 700;
}
</style>
