<template>
  <div class="p-4 space-y-4">
    <LatestDrawInfo :data="lotteryStore.latestDraw" />

    <section class="card">
      <div class="toolbar">
        <div><h1>重红决策台</h1><p>按真实开奖顺序观察重红3期、6期源位置窗口。</p></div>
        <div class="actions">
          <div class="period-picker">
            <input v-model="predictQiHao" class="field period" placeholder="预测期号"
                   @keydown.up.prevent="moveQiHao(-1)" @keydown.down.prevent="moveQiHao(1)"
                   @keydown.enter.prevent="loadPage" @focus="showQiHaoDropdown = predictQiHao.length >= 4"
                   @blur="hideQiHaoDropdown" />
            <div class="period-arrows"><button @mousedown.prevent="moveQiHao(-1)">▲</button><button @mousedown.prevent="moveQiHao(1)">▼</button></div>
            <div v-if="showQiHaoDropdown && qiHaoSuggestions.length" class="period-dropdown">
              <button v-for="item in qiHaoSuggestions" :key="item" @mousedown.prevent="selectQiHao(item)">{{ item }}</button>
            </div>
          </div>
          <button class="btn" :class="{ primary: showActual }" @click="showActual = !showActual">{{ showActual ? '隐藏开奖' : '显示开奖' }}</button>
          <button class="btn primary" @click="loadPage">读取窗口</button>
          <button class="btn" @click="syncWindow">同步窗口</button>
        </div>
      </div>
      <div v-if="message" :class="['message', error ? 'error' : 'ok']">{{ message }}</div>
    </section>

    <section v-if="prepare" class="window-grid">
      <article v-for="window in prepare.windows" :key="window.windowCode" class="card window-card">
        <div class="window-head"><h2>{{ window.windowName }}</h2><small>状态：{{ window.stateText }}</small></div>
        <div v-for="level in displayLevels(window)" :key="level.level" class="level-row">
          <span class="level-title">lv{{ level.level }}</span>
          <div class="balls">
            <button v-for="position in level.positions" :key="position" class="position-pill"
                    :class="{ down: level.willDownPositions.includes(position), hit: showActual && prepare.actualHitPositions.includes(position) }"
                    @click="togglePosition(position)">
              {{ position }}号位{{ level.willDownPositions.includes(position) ? '↓' : '' }}{{ showActual && prepare.actualHitPositions.includes(position) ? '★' : '' }}
              <small>{{ signedScore(scoreFor(position).score) }}</small>
            </button>
          </div>
        </div>
      </article>
    </section>

    <section v-if="prepare" class="card">
      <div class="section-head history-head">
        <div>
          <div class="title-row">
            <h2>同状态历史统计</h2>
            <button class="history-tab" :class="{ active: selectedHistoryWindow === 'ALL' }" @click="selectedHistoryWindow = 'ALL'">全部</button>
            <button v-for="window in prepare.windows" :key="window.windowCode" class="history-tab window-history-tab"
                    :class="{ active: selectedHistoryWindow === window.windowCode }" @click="selectedHistoryWindow = window.windowCode">
              <span>{{ window.windowName }}</span><small>{{ window.stateText }}</small>
            </button>
          </div>
          <p>严格排除目标期及未来；完成状态和命中数量来自同一窗口明细。</p>
        </div>
        <div class="actions">
          <div class="segmented"><button :class="{ active: historyResultMode === 'COMPLETION' }" @click="historyResultMode = 'COMPLETION'">完成状态</button><button :class="{ active: historyResultMode === 'HIT_COUNT' }" @click="historyResultMode = 'HIT_COUNT'">命中数量</button></div>
          <button class="btn" @click="historyCollapsed = !historyCollapsed">{{ historyCollapsed ? '展开' : '收起' }}</button>
        </div>
      </div>

      <div v-if="!historyCollapsed && selectedHistoryWindow === 'ALL'" class="history-window-grid">
        <article v-for="window in prepare.windows" :key="window.windowCode" class="history-card">
          <div class="history-card-head"><strong>{{ window.windowName }}</strong><div class="segmented"><button :class="{ active: historyViewMode[window.windowCode] === 'year' }" @click="historyViewMode[window.windowCode] = 'year'">年度</button><button :class="{ active: historyViewMode[window.windowCode] === 'all' }" @click="historyViewMode[window.windowCode] = 'all'">全期</button></div></div>
          <template v-if="historyViewMode[window.windowCode] === 'year'">
            <div class="state-tabs">
              <button v-for="item in historyItems(window.windowCode)" :key="item.completedState" class="history-tab"
                      :class="{ active: activeHistoryState[window.windowCode] === item.completedState }"
                      @click="activeHistoryState[window.windowCode] = item.completedState">
                <span v-for="(part,index) in stateParts(item.completedState)" :key="index" :class="{ 'hit-badge': part.badge }">{{ part.text }}</span>
                ：{{ item.totalCount }}<small>今{{ item.currentYearCount }}</small>
              </button>
            </div>
            <div class="history-summary">{{ distributionText(window.windowCode, activeHistoryState[window.windowCode]) }}</div>
            <table><thead><tr><th class="sortable" @click="sortHistory(window.windowCode,'year')">年份({{ yearRows(window.windowCode, activeHistoryState[window.windowCode]).length }}年)<span class="sort-mark">{{ sortMark(window.windowCode,'year') }}</span></th><th class="sortable" @click="sortHistory(window.windowCode,'count')">次数<span class="sort-mark">{{ sortMark(window.windowCode,'count') }}</span></th></tr></thead><tbody><tr v-for="row in yearRows(window.windowCode, activeHistoryState[window.windowCode])" :key="row.year" :class="{ current: row.year === currentYear }"><td>{{ row.year }}</td><td>{{ row.count }}</td></tr></tbody></table>
          </template>
          <template v-else>
            <table><thead><tr><th class="sortable" @click="sortHistory(window.windowCode,'state')">状态<span class="sort-mark">{{ sortMark(window.windowCode,'state') }}</span></th><th class="sortable" @click="sortHistory(window.windowCode,'count')">次数<span class="sort-mark">{{ sortMark(window.windowCode,'count') }}</span></th><th class="sortable" @click="sortHistory(window.windowCode,'currentYearCount')">今年<span class="sort-mark">{{ sortMark(window.windowCode,'currentYearCount') }}</span></th></tr></thead><tbody><tr v-for="item in historyItems(window.windowCode)" :key="item.completedState"><td><span v-for="(part,index) in stateParts(item.completedState)" :key="index" :class="{ 'hit-badge': part.badge }">{{ part.text }}</span><small v-if="historyResultMode === 'HIT_COUNT'" class="hit-info"> 命中{{ item.hitCount }}</small></td><td>{{ item.totalCount }}</td><td :class="{ current: item.currentYearCount > 0 }">{{ item.currentYearCount }}</td></tr></tbody></table>
          </template>
          <div v-if="!historyItems(window.windowCode).length" class="empty">暂无相同状态记录</div>
        </article>
      </div>

      <div v-if="!historyCollapsed && selectedHistoryWindow !== 'ALL'" class="history-state-grid">
        <article v-for="item in historyItems(selectedHistoryWindow)" :key="item.completedState" class="history-card">
          <div class="history-card-head">
            <strong><span v-for="(part,index) in stateParts(item.completedState)" :key="index" :class="{ 'hit-badge': part.badge }">{{ part.text }}</span><small v-if="historyResultMode === 'HIT_COUNT'" class="hit-info"> 命中{{ item.hitCount }}</small></strong>
            <span class="history-meta">全{{ item.totalCount }}/今{{ item.currentYearCount }}</span>
          </div>
          <div class="history-summary">{{ distributionText(selectedHistoryWindow, item.completedState) }}</div>
          <table><thead><tr><th class="sortable" @click="sortStateHistory(selectedHistoryWindow,item.completedState,'year')">年份({{ yearRows(selectedHistoryWindow,item.completedState,stateSortKey(selectedHistoryWindow,item.completedState)).length }}年)<span class="sort-mark">{{ stateSortMark(selectedHistoryWindow,item.completedState,'year') }}</span></th><th class="sortable" @click="sortStateHistory(selectedHistoryWindow,item.completedState,'count')">次数<span class="sort-mark">{{ stateSortMark(selectedHistoryWindow,item.completedState,'count') }}</span></th></tr></thead><tbody><tr v-for="row in yearRows(selectedHistoryWindow,item.completedState,stateSortKey(selectedHistoryWindow,item.completedState))" :key="row.year" :class="{ current: row.year === currentYear }"><td>{{ row.year }}</td><td>{{ row.count }}</td></tr></tbody></table>
        </article>
      </div>
    </section>

    <section v-if="prepare" class="card">
      <div class="section-head"><div><h2>源位置评分与人工决策</h2><p>不设置未经验证的系统权重；每项依据随样本保存。</p></div><div class="actions"><input v-model.trim="sampleName" class="field" placeholder="样本名称" /><button class="btn primary" @click="saveSnapshot">新增样本</button><button class="btn" :disabled="!editingId" @click="updateSnapshot">修改样本</button><button v-if="editingId" class="btn" @click="clearEditing">退出回显</button></div></div>
      <table class="score-table"><thead><tr><th>排名</th><th>源位置</th><th>决策</th><th>分值</th><th>依据</th></tr></thead><tbody><tr v-for="(row,index) in sortedScores" :key="row.position"><td>{{ index+1 }}</td><td :class="{ hit: showActual && prepare.actualHitPositions.includes(row.position) }">{{ row.position }}号位</td><td><select v-model="row.decisionType" class="field compact" @change="applyDecisionScore(row)"><option value="SELECT">选择</option><option value="OBSERVE">观察</option><option value="EXCLUDE">排除</option></select></td><td><input v-model.number="row.score" class="field score" type="number" step="0.5" /></td><td><input v-model.trim="row.reason" class="field reason" placeholder="记录判断依据" /></td></tr></tbody></table>
      <div class="selection">当前选择：{{ selectedPositions.join(', ') || '未选择' }}</div>
    </section>

    <section class="card">
      <div class="section-head"><div><h2>已保存样本</h2><p>同一期可保存多个方案并批量复盘。</p></div><button class="btn" @click="reviewAll">批量复盘本期</button></div>
      <table class="score-table"><thead><tr><th>ID</th><th>期号</th><th>名称</th><th>选择位置</th><th>真实命中</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="snapshot in snapshots" :key="snapshot.id"><td>{{ snapshot.id }}</td><td>{{ snapshot.predictQiHao }}</td><td>{{ snapshot.sampleName }}</td><td>{{ snapshot.selectedPositions.join(', ') || '--' }}</td><td class="hit">{{ snapshot.actualHitPositions.join(', ') || '--' }}</td><td>{{ snapshot.reviewStatus === 'REVIEWED' ? '已复盘' : '待开奖' }}</td><td class="actions"><button class="btn" @click="showSnapshot(snapshot.id)">回显</button><button class="btn" @click="reviewSnapshot(snapshot.id)">复盘</button></td></tr><tr v-if="!snapshots.length"><td colspan="7" class="empty">暂无样本</td></tr></tbody></table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import LatestDrawInfo from '@/components/lottery/LatestDrawInfo.vue';
import { useLotteryStore } from '@/stores/lottery';
import { db } from '@/composables/useDatabase';
import {
  getRepeatPositionSnapshot, listRepeatPositionSnapshots, prepareRepeatPosition,
  reviewRepeatPositionSnapshot, reviewRepeatPositionSnapshots, saveRepeatPositionSnapshot,
  syncRepeatPositionWindow, updateRepeatPositionSnapshot,
  type PositionScore, type PrepareResult, type RepeatPositionWindow, type SnapshotResult
} from '@/api/modules/repeatPositionDecision';

type SortField = 'year'|'state'|'count'|'currentYearCount';
type StateSortField = 'year'|'count';
const lotteryStore = useLotteryStore();
const predictQiHao = ref('');
const qiHaoList = ref<string[]>([]);
const showQiHaoDropdown = ref(false);
const prepare = ref<PrepareResult|null>(null);
const snapshots = ref<SnapshotResult[]>([]);
const showActual = ref(false);
const message = ref('');
const error = ref(false);
const sampleName = ref('');
const editingId = ref<number|null>(null);
const historyCollapsed = ref(false);
const selectedHistoryWindow = ref('ALL');
const historyResultMode = ref<'COMPLETION'|'HIT_COUNT'>('COMPLETION');
const historyViewMode = reactive<Record<string,'year'|'all'>>({});
const activeHistoryState = reactive<Record<string,string>>({});
const historySortField = reactive<Record<string,SortField>>({});
const historySortAsc = reactive<Record<string,boolean>>({});
const stateSortField = reactive<Record<string,StateSortField>>({});
const stateSortAsc = reactive<Record<string,boolean>>({});
const scores = reactive<PositionScore[]>(Array.from({length:6},(_,index)=>({ position:String(index+1),score:.5,decisionType:'OBSERVE',reason:'' })));

const qiHaoSuggestions = computed(()=>predictQiHao.value.length < 4 ? [] : qiHaoList.value.filter(item=>item.startsWith(predictQiHao.value)).slice(0,20));
const sortedScores = computed(()=>[...scores].sort((a,b)=>b.score-a.score||Number(a.position)-Number(b.position)));
const selectedPositions = computed(()=>scores.filter(row=>row.decisionType==='SELECT').map(row=>row.position).sort());
const currentYear = computed(()=>predictQiHao.value.slice(0,4));

function displayLevels(window:RepeatPositionWindow){ return [...window.levels].filter(level=>level.positions.length).sort((a,b)=>b.level-a.level); }
function scoreFor(position:string){ return scores.find(row=>row.position===position)!; }
function signedScore(value:number){ return `${value>=0?'+':''}${value}`; }
function historyItems(code:string){
  const rows=[...(prepare.value?.historyStats[code]||[])];
  const field=historySortField[code]||'count', asc=historySortAsc[code]??false, direction=asc?1:-1;
  return rows.sort((a,b)=>{
    if(field==='state') return a.completedState.localeCompare(b.completedState)*direction;
    if(field==='currentYearCount') return (a.currentYearCount-b.currentYearCount||a.completedState.localeCompare(b.completedState))*direction;
    return (a.totalCount-b.totalCount||a.completedState.localeCompare(b.completedState))*direction;
  });
}
function findState(code:string,state:string){ return (prepare.value?.historyStats[code]||[]).find(item=>item.completedState===state); }
function yearRows(code:string,state:string,sortKey=code){
  const rows=Object.entries(findState(code,state)?.yearlyCounts||{}).map(([year,count])=>({year,count:Number(count)}));
  const nested=sortKey.includes('::'), field=nested?(stateSortField[sortKey]||'year'):(historySortField[sortKey]||'year'), asc=nested?(stateSortAsc[sortKey]??true):(historySortAsc[sortKey]??true), direction=asc?1:-1;
  return rows.sort((a,b)=>(field==='count'?(a.count-b.count||a.year.localeCompare(b.year)):a.year.localeCompare(b.year))*direction);
}
function distributionText(code:string,state:string){ const counts=yearRows(code,state).map(row=>row.count); if(!counts.length)return '暂无年度分布'; const sorted=[...counts].sort((a,b)=>a-b), distinct=[...new Set(sorted)], middle=sorted[Math.floor((sorted.length-1)/2)], average=(sorted.reduce((a,b)=>a+b,0)/sorted.length).toFixed(2); return `${distinct.join(' · ')}　中${middle} / 均${average}`; }
function stateParts(state:string){ return state.split(/(\*\d+)/).filter(Boolean).map(text=>({text,badge:/^\*\d+$/.test(text)})); }
function sortHistory(code:string,field:SortField){ if(historySortField[code]===field)historySortAsc[code]=!historySortAsc[code]; else{historySortField[code]=field;historySortAsc[code]=field==='year'||field==='state';} }
function sortMark(code:string,field:SortField){ return historySortField[code]===field?(historySortAsc[code]?'▲':'▼'):''; }
function stateSortKey(code:string,state:string){return `${code}::${state}`;}
function sortStateHistory(code:string,state:string,field:StateSortField){const key=stateSortKey(code,state);if(stateSortField[key]===field)stateSortAsc[key]=!stateSortAsc[key];else{stateSortField[key]=field;stateSortAsc[key]=true;}}
function stateSortMark(code:string,state:string,field:StateSortField){const key=stateSortKey(code,state);return stateSortField[key]===field?(stateSortAsc[key]?'▲':'▼'):'';}

async function run(action:()=>Promise<void>){error.value=false;message.value='';try{await action();}catch(reason:any){error.value=true;message.value=reason?.message||String(reason);}}
async function loadPage(){await run(async()=>{if(!predictQiHao.value)throw new Error('请输入预测期号');prepare.value=await prepareRepeatPosition(predictQiHao.value);snapshots.value=await listRepeatPositionSnapshots(predictQiHao.value);for(const window of prepare.value.windows){historyViewMode[window.windowCode]||='year';activeHistoryState[window.windowCode]=historyItems(window.windowCode)[0]?.completedState||'';}sampleName.value||=`${predictQiHao.value}-${snapshots.value.length+1}`;message.value='窗口读取完成';});}
async function syncWindow(){await run(async()=>{const count=await syncRepeatPositionWindow();message.value=`同步完成，新增${count}期事件`;await loadPage();});}
function moveQiHao(direction:-1|1){if(!qiHaoList.value.length)return;const index=qiHaoList.value.indexOf(predictQiHao.value);predictQiHao.value=qiHaoList.value[index<0?(direction>0?0:qiHaoList.value.length-1):(index+direction+qiHaoList.value.length)%qiHaoList.value.length];}
function selectQiHao(qiHao:string){predictQiHao.value=qiHao;showQiHaoDropdown.value=false;void loadPage();}
function hideQiHaoDropdown(){window.setTimeout(()=>showQiHaoDropdown.value=false,200);}
function applyDecisionScore(row:PositionScore){row.score=row.decisionType==='SELECT'?1:row.decisionType==='EXCLUDE'?-.5:.5;}
function togglePosition(position:string){const row=scoreFor(position);row.decisionType=row.decisionType==='SELECT'?'OBSERVE':'SELECT';applyDecisionScore(row);}
async function saveSnapshot(){await run(async()=>{if(!prepare.value)throw new Error('请先读取窗口');await saveRepeatPositionSnapshot({predictQiHao:predictQiHao.value,sampleName:sampleName.value,scores,selectedPositions:selectedPositions.value});snapshots.value=await listRepeatPositionSnapshots(predictQiHao.value);sampleName.value=`${predictQiHao.value}-${snapshots.value.length+1}`;message.value='样本保存完成';});}
async function showSnapshot(id:number){await run(async()=>{const snapshot=await getRepeatPositionSnapshot(id);editingId.value=id;sampleName.value=snapshot.sampleName;scores.splice(0,scores.length,...snapshot.scores.map(row=>({...row})));message.value=`已回显样本${id}`;});}
async function updateSnapshot(){await run(async()=>{if(!editingId.value)throw new Error('请先回显样本');await updateRepeatPositionSnapshot(editingId.value,{predictQiHao:predictQiHao.value,sampleName:sampleName.value,scores,selectedPositions:selectedPositions.value});snapshots.value=await listRepeatPositionSnapshots(predictQiHao.value);message.value='样本修改完成';});}
function clearEditing(){editingId.value=null;sampleName.value=`${predictQiHao.value}-${snapshots.value.length+1}`;}
async function reviewSnapshot(id:number){await run(async()=>{await reviewRepeatPositionSnapshot(id);snapshots.value=await listRepeatPositionSnapshots(predictQiHao.value);message.value='样本复盘完成';});}
async function reviewAll(){await run(async()=>{snapshots.value=await reviewRepeatPositionSnapshots(predictQiHao.value);message.value='本期样本批量复盘完成';});}

onMounted(async()=>{await lotteryStore.loadLatestFromDB();qiHaoList.value=await db.getAllQiHaoList();predictQiHao.value=lotteryStore.latestDraw?.nextQiHao||lotteryStore.latestDraw?.qiHao||'';if(predictQiHao.value)await loadPage();});
</script>

<style scoped>
.card{border:1px solid rgba(234,234,234,.11);border-radius:8px;background:var(--color-bg-card);padding:14px}.toolbar,.section-head,.window-head,.actions,.title-row,.history-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}h1{font-size:18px;font-weight:700}h2{font-weight:700}p,small{color:var(--color-text-secondary);font-size:12px}.btn,.field{border:1px solid rgba(234,234,234,.15);border-radius:5px;background:rgba(15,27,56,.8);padding:6px 9px;color:var(--color-text-primary);font-size:12px}.btn.primary,.segmented button.active,.history-tab.active{background:var(--color-accent);color:#fff}.message{margin-top:8px;font-size:12px}.message.ok{color:#34d399}.message.error{color:#fb7185}.period-picker{position:relative;display:flex}.period{width:110px;padding-right:24px}.period-arrows{position:absolute;right:4px;top:3px;display:flex;flex-direction:column}.period-arrows button{height:10px;font-size:8px;color:var(--color-text-secondary)}.period-dropdown{position:absolute;top:100%;left:0;z-index:60;margin-top:3px;max-height:190px;width:100%;overflow:auto;border:1px solid #475569;border-radius:5px;background:var(--color-bg-secondary)}.period-dropdown button{display:block;width:100%;padding:5px 8px;text-align:left;font-size:12px}.period-dropdown button:hover{background:var(--color-accent)}.window-grid,.history-window-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.window-card{min-width:0}.level-row{display:grid;grid-template-columns:42px 1fr;align-items:start;gap:8px;margin-top:8px}.level-title{padding-top:5px;color:var(--color-text-secondary);font-size:12px}.balls{display:flex;flex-wrap:wrap;gap:5px}.position-pill{border-radius:999px;background:rgba(55,66,250,.28);padding:5px 8px;font-size:11px}.position-pill small{margin-left:3px}.position-pill.down{border:1px solid #8992a3}.position-pill.hit,.hit{color:#ff6b7d;font-weight:700}.history-head{align-items:flex-start}.segmented{display:inline-flex;overflow:hidden;border:1px solid rgba(234,234,234,.15);border-radius:6px}.segmented button{padding:5px 9px;color:var(--color-text-secondary);font-size:12px}.history-tab{border-radius:999px;background:rgba(55,66,250,.22);padding:5px 9px;color:var(--color-text-secondary);font-size:12px}.window-history-tab{display:inline-flex;min-width:90px;flex-direction:column;align-items:center}.state-tabs{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.state-tabs small{margin-left:4px}.history-card{min-width:0;border:1px solid rgba(234,234,234,.1);border-radius:6px;background:rgba(15,27,56,.45);padding:10px}.history-state-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:8px;margin-top:10px}.history-summary{margin:8px 0;border:1px solid rgba(234,234,234,.1);border-radius:5px;padding:6px;color:var(--color-text-secondary);font-size:11px}.history-meta{border-radius:999px;background:rgba(255,255,255,.08);padding:2px 7px;font-size:11px}.hit-badge{display:inline-block;border-radius:999px;background:#ef476f;padding:0 3px;color:#fff}.hit-info{color:#7db7ff}.score-table,table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px}th{height:34px;background:rgba(15,27,56,.88);padding:7px;text-align:left;white-space:nowrap}td{border-bottom:1px solid rgba(234,234,234,.08);padding:7px;vertical-align:top}.sortable{cursor:pointer;user-select:none}.sort-mark{display:inline-block;width:14px;text-align:center}.current{background:rgba(233,69,96,.2);color:#fff;font-weight:700}.compact{padding:4px}.score{width:65px}.reason{width:100%}.selection{margin-top:10px;color:#f5c451}.empty{text-align:center;color:var(--color-text-secondary);padding:15px}@media(max-width:900px){.window-grid,.history-window-grid{grid-template-columns:1fr}}
</style>
