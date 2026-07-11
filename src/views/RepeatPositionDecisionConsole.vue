<template>
  <div class="p-4 space-y-4">
    <section class="panel">
      <div class="toolbar">
        <div>
          <h1>重红决策台</h1>
          <p>观察上一期真实开奖顺序的六个源位置，在下一期是否重现。</p>
        </div>
        <div class="actions">
          <input v-model.trim="predictQiHao" class="field period" placeholder="预测期号" />
          <button @click="loadPage">读取窗口</button>
          <button @click="syncWindow">同步窗口</button>
          <label class="switch"><input v-model="showActual" type="checkbox" />显示开奖</label>
        </div>
      </div>
      <div v-if="message" :class="['message', error ? 'error' : 'success']">{{ message }}</div>
      <details class="import-box">
        <summary>开奖顺序数据维护</summary>
        <div class="actions import-actions">
          <input v-model.trim="importForm.url" class="field wide" placeholder="PostgreSQL JDBC地址" />
          <input v-model.trim="importForm.username" class="field" placeholder="用户名" />
          <input v-model="importForm.password" class="field" type="password" placeholder="密码（不保存）" />
          <button @click="importOrders">导入并初始化</button>
        </div>
      </details>
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <h2>重红源位置10期窗口</h2>
          <p>基础状态：{{ prepare?.baseState || '--' }}　数据截至：{{ prepare?.sourceQiHao || '--' }}</p>
        </div>
      </div>
      <div class="level-grid">
        <article v-for="level in visibleLevels" :key="level.level" class="level-card">
          <strong>lv{{ level.level }}</strong>
          <div class="balls">
            <button
              v-for="position in level.positions"
              :key="position"
              :class="['position-ball', {
                down: level.willDownPositions.includes(position),
                hit: showActual && prepare?.actualHitPositions.includes(position)
              }]"
              @click="togglePosition(position)"
            >
              {{ position }}<span v-if="level.willDownPositions.includes(position)">↓</span>
            </button>
          </div>
        </article>
        <div v-if="!prepare" class="empty">请先读取窗口。</div>
      </div>
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <h2>同状态历史统计</h2>
          <p>严格只使用预测期号之前的数据；两种视图来自同一个完整状态。</p>
        </div>
        <div class="segmented">
          <button :class="{ active: historyMode === 'STATE' }" @click="historyMode = 'STATE'">完成状态</button>
          <button :class="{ active: historyMode === 'HIT' }" @click="historyMode = 'HIT'">命中数量</button>
        </div>
      </div>
      <div class="history-grid">
        <article v-for="state in prepare?.historyStates || []" :key="state.completedState" class="history-card">
          <div class="history-title">
            <strong v-if="historyMode === 'STATE'">{{ state.completedState }}</strong>
            <strong v-else>{{ state.completedState }}</strong>
            <span>全{{ state.totalCount }} / 今{{ state.currentYearCount }}</span>
          </div>
          <div v-if="historyMode === 'HIT'" class="hit-summary">
            总命中 {{ state.hitCount }}　
            <span v-for="(count, level) in state.levelHitCounts" :key="level">lv{{ level }}*{{ count }} </span>
          </div>
          <table>
            <thead><tr><th>年份</th><th>次数</th></tr></thead>
            <tbody>
              <tr v-for="(count, year) in state.yearlyCounts" :key="year">
                <td>{{ year }}</td><td>{{ count }}</td>
              </tr>
            </tbody>
          </table>
        </article>
        <div v-if="prepare && !prepare.historyStates.length" class="empty">历史中没有相同基础状态。</div>
      </div>
    </section>

    <section class="panel">
      <div class="section-head">
        <div><h2>源位置评分与人工决策</h2><p>第一版不设置自动权重，所有依据由样本明确保存。</p></div>
        <div class="actions">
          <input v-model.trim="sampleName" class="field" placeholder="样本名称" />
          <button class="primary" @click="saveSnapshot">新增样本</button>
          <button :disabled="!editingId" @click="updateSnapshot">修改样本</button>
          <button v-if="editingId" @click="clearEditing">退出回显</button>
        </div>
      </div>
      <table class="score-table">
        <thead><tr><th>排名</th><th>源位置</th><th>决策</th><th>分值</th><th>依据</th></tr></thead>
        <tbody>
          <tr v-for="(row, index) in sortedScores" :key="row.position">
            <td>{{ index + 1 }}</td>
            <td :class="{ actual: showActual && prepare?.actualHitPositions.includes(row.position) }">{{ row.position }}号位</td>
            <td>
              <select v-model="row.decisionType" class="field compact" @change="applyDecisionScore(row)">
                <option value="SELECT">选择</option><option value="OBSERVE">观察</option><option value="EXCLUDE">排除</option>
              </select>
            </td>
            <td><input v-model.number="row.score" class="field score" type="number" step="0.5" /></td>
            <td><input v-model.trim="row.reason" class="field reason" placeholder="记录判断依据" /></td>
          </tr>
        </tbody>
      </table>
      <div class="selection">当前选择：{{ selectedPositions.join(', ') || '未选择' }}</div>
    </section>

    <section class="panel">
      <div class="section-head">
        <div><h2>已保存样本</h2><p>同一期可保存多个方案，开奖后按真实源位置复盘。</p></div>
        <button @click="reviewAll">批量复盘本期</button>
      </div>
      <table class="score-table">
        <thead><tr><th>ID</th><th>期号</th><th>名称</th><th>选择位置</th><th>真实命中</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="snapshot in snapshots" :key="snapshot.id">
            <td>{{ snapshot.id }}</td><td>{{ snapshot.predictQiHao }}</td><td>{{ snapshot.sampleName }}</td>
            <td>{{ snapshot.selectedPositions.join(', ') || '--' }}</td>
            <td class="actual">{{ snapshot.actualHitPositions.join(', ') || '--' }}</td>
            <td>{{ snapshot.reviewStatus === 'REVIEWED' ? '已复盘' : '待开奖' }}</td>
            <td class="actions"><button @click="showSnapshot(snapshot.id)">回显</button><button @click="reviewSnapshot(snapshot.id)">复盘</button></td>
          </tr>
          <tr v-if="!snapshots.length"><td colspan="7" class="empty">暂无样本。</td></tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  importRepeatPositionOrders, initRepeatPositionSchema, initRepeatPositionWindow,
  getRepeatPositionSnapshot, listRepeatPositionSnapshots, prepareRepeatPosition,
  reviewRepeatPositionSnapshot, reviewRepeatPositionSnapshots, saveRepeatPositionSnapshot,
  syncRepeatPositionWindow, updateRepeatPositionSnapshot,
  type PositionScore, type PrepareResult, type SnapshotResult
} from '../api/modules/repeatPositionDecision';

const predictQiHao = ref('');
const prepare = ref<PrepareResult | null>(null);
const snapshots = ref<SnapshotResult[]>([]);
const scores = reactive<PositionScore[]>(Array.from({ length: 6 }, (_, index) => ({
  position: String(index + 1), score: 0.5, decisionType: 'OBSERVE', reason: ''
})));
const sampleName = ref('');
const editingId = ref<number | null>(null);
const showActual = ref(false);
const historyMode = ref<'STATE' | 'HIT'>('STATE');
const message = ref('');
const error = ref(false);
const importForm = reactive({ url: 'jdbc:postgresql://localhost:5432/ssq_v2', username: 'ssq', password: '' });

const visibleLevels = computed(() => (prepare.value?.levels || []).filter(level => level.positions.length).sort((a, b) => b.level - a.level));
const sortedScores = computed(() => [...scores].sort((a, b) => b.score - a.score || Number(a.position) - Number(b.position)));
const selectedPositions = computed(() => scores.filter(row => row.decisionType === 'SELECT').map(row => row.position).sort());

async function run(action: () => Promise<void>) {
  error.value = false;
  message.value = '';
  try { await action(); } catch (reason: any) { error.value = true; message.value = reason?.message || String(reason); }
}

async function loadPage() {
  await run(async () => {
    if (!predictQiHao.value) throw new Error('请输入预测期号');
    prepare.value = await prepareRepeatPosition(predictQiHao.value);
    snapshots.value = await listRepeatPositionSnapshots(predictQiHao.value);
    sampleName.value ||= `${predictQiHao.value}-${snapshots.value.length + 1}`;
    message.value = '窗口读取完成';
  });
}

async function importOrders() {
  await run(async () => {
    await initRepeatPositionSchema();
    const imported = await importRepeatPositionOrders(importForm);
    const events = await initRepeatPositionWindow();
    importForm.password = '';
    message.value = `已导入${imported}期开奖顺序，生成${events}期重红位置事件`;
  });
}

async function syncWindow() {
  await run(async () => { const count = await syncRepeatPositionWindow(); message.value = `同步完成，新增${count}期事件`; await loadPage(); });
}

function applyDecisionScore(row: PositionScore) {
  row.score = row.decisionType === 'SELECT' ? 1 : row.decisionType === 'EXCLUDE' ? -0.5 : 0.5;
}

function togglePosition(position: string) {
  const row = scores.find(item => item.position === position)!;
  row.decisionType = row.decisionType === 'SELECT' ? 'OBSERVE' : 'SELECT';
  applyDecisionScore(row);
}

async function saveSnapshot() {
  await run(async () => {
    if (!prepare.value) throw new Error('请先读取窗口');
    await saveRepeatPositionSnapshot({ predictQiHao: predictQiHao.value, sampleName: sampleName.value, scores, selectedPositions: selectedPositions.value });
    snapshots.value = await listRepeatPositionSnapshots(predictQiHao.value);
    sampleName.value = `${predictQiHao.value}-${snapshots.value.length + 1}`;
    message.value = '样本保存完成';
  });
}

async function showSnapshot(id: number) {
  await run(async () => {
    const snapshot = await getRepeatPositionSnapshot(id);
    editingId.value = snapshot.id;
    sampleName.value = snapshot.sampleName;
    scores.splice(0, scores.length, ...snapshot.scores.map(score => ({ ...score })));
    message.value = `已回显样本 ${snapshot.id}`;
  });
}

async function updateSnapshot() {
  await run(async () => {
    if (!editingId.value) throw new Error('请先回显要修改的样本');
    await updateRepeatPositionSnapshot(editingId.value, { predictQiHao: predictQiHao.value, sampleName: sampleName.value, scores, selectedPositions: selectedPositions.value });
    snapshots.value = await listRepeatPositionSnapshots(predictQiHao.value);
    message.value = '样本修改完成';
  });
}

function clearEditing() {
  editingId.value = null;
  sampleName.value = `${predictQiHao.value}-${snapshots.value.length + 1}`;
}

async function reviewSnapshot(id: number) {
  await run(async () => { await reviewRepeatPositionSnapshot(id); snapshots.value = await listRepeatPositionSnapshots(predictQiHao.value); message.value = '样本复盘完成'; });
}

async function reviewAll() {
  await run(async () => { snapshots.value = await reviewRepeatPositionSnapshots(predictQiHao.value); message.value = '本期样本批量复盘完成'; });
}
</script>

<style scoped>
.panel { background:#123b69; border:1px solid #24568a; border-radius:8px; padding:14px; }
h1,h2 { margin:0; font-weight:700; } h1{font-size:18px} h2{font-size:15px} p{margin:3px 0 0;color:#9fb4cb;font-size:12px}
.toolbar,.section-head,.actions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.actions{justify-content:flex-end}
button,.field{border:1px solid #285486;border-radius:6px;background:#0d2b50;color:#e8eef7;padding:7px 10px;font-size:12px}button{cursor:pointer}.primary,.segmented .active{background:#ef476f;color:white}.period{width:105px}.wide{width:280px}.compact{padding:4px 7px}.score{width:70px}.reason{width:100%}
.message{margin-top:8px;font-size:12px}.success{color:#36e29a}.error{color:#ff6b82}.import-box{margin-top:10px;color:#9fb4cb;font-size:12px}.import-actions{margin-top:8px;justify-content:flex-start}
.level-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:12px}.level-card,.history-card{background:#102f57;border:1px solid #285486;border-radius:7px;padding:10px}.balls{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.position-ball{width:38px;height:38px;border-radius:50%;padding:0;background:#244caa}.position-ball.down{border-color:#f5c451}.position-ball.hit,.actual{color:#ff5b75!important;font-weight:700}
.segmented{display:inline-flex}.segmented button{border-radius:0}.segmented button:first-child{border-radius:6px 0 0 6px}.segmented button:last-child{border-radius:0 6px 6px 0}.history-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:12px}.history-title{display:flex;justify-content:space-between;gap:8px}.history-title span,.hit-summary{color:#9fb4cb;font-size:11px}.hit-summary{margin-top:8px}table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px}th,td{padding:7px;border-bottom:1px solid #244b77;text-align:left}.score-table th{background:#0e2850}.selection{margin-top:10px;color:#f5c451}.switch,.empty{color:#9fb4cb;font-size:12px}.empty{text-align:center;padding:16px}
@media(max-width:700px){.toolbar,.section-head{align-items:flex-start}.wide{width:100%}.score-table{display:block;overflow-x:auto;white-space:nowrap}}
</style>
