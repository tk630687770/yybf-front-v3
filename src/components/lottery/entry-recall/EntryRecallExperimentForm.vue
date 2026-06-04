<template>
  <!-- 入口实验参数编辑器 -->
  <section class="research-card">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="section-title">入口实验参数</h2>
        <p class="section-subtitle">每个组件先独立评分，再由组合算法形成33球最终排名。</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="action-button" :disabled="running" @click="addComponent">增加组件</button>
        <button class="action-button action-button-primary" :disabled="running" @click="submit(false)">
          {{ running ? '运行中...' : '运行预览' }}
        </button>
        <button class="action-button" :disabled="running" @click="submit(true)">
          {{ running ? '运行中...' : '运行并保存' }}
        </button>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      <label class="field-block">
        <span class="field-label">实验名称</span>
        <input v-model="form.experimentName" class="field-input" placeholder="例如：三组件加权100期" />
      </label>
      <label class="field-block">
        <span class="field-label">策略编码</span>
        <input v-model="form.strategyCode" class="field-input" />
      </label>
      <label class="field-block">
        <span class="field-label">策略版本</span>
        <input v-model="form.strategyVersion" class="field-input" />
      </label>
      <label class="field-block">
        <span class="field-label">组合算法</span>
        <select v-model="form.algorithm" class="field-input">
          <option value="WEIGHTED_SUM">标准分加权求和</option>
          <option value="RANK_VOTE">排名百分位投票</option>
          <option value="QUOTA_UNION">来源固定配额并集</option>
        </select>
      </label>
      <label class="field-block">
        <span class="field-label">入口规模</span>
        <input v-model="form.entrySizesText" class="field-input" placeholder="15,18,20,22,24" />
      </label>
      <label class="field-block">
        <span class="field-label">最近期数</span>
        <input v-model.number="form.recentLimit" class="field-input" type="number" min="1" max="1000" />
      </label>
      <label class="field-block">
        <span class="field-label">起始期号</span>
        <input v-model="form.startQiHao" class="field-input" placeholder="可为空" />
      </label>
      <label class="field-block">
        <span class="field-label">结束期号</span>
        <input v-model="form.endQiHao" class="field-input" placeholder="可为空" />
      </label>
      <label v-if="form.algorithm === 'QUOTA_UNION'" class="field-block">
        <span class="field-label">配额并集目标规模</span>
        <input v-model.number="form.quotaTargetSize" class="field-input" type="number" min="1" max="33" />
      </label>
    </div>

    <div class="mt-4 overflow-x-auto">
      <table class="result-table">
        <thead>
        <tr>
          <th>顺序</th>
          <th>独立组件</th>
          <th>权重</th>
          <th>标准化</th>
          <th v-if="form.algorithm === 'QUOTA_UNION'">最低配额</th>
          <th>操作</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(component, index) in form.components" :key="component.localId">
          <td>{{ index + 1 }}</td>
          <td>
            <select v-model="component.componentCode" class="table-input">
              <option v-for="option in componentOptions" :key="option.code" :value="option.code">
                {{ option.label }}
              </option>
            </select>
          </td>
          <td>
            <input v-model.number="component.weight" class="table-input compact-input" type="number" min="0" step="0.05" />
          </td>
          <td>
            <select v-model="component.normalizationMethod" class="table-input">
              <option value="RANK_PERCENTILE">排名百分位</option>
              <option value="MIN_MAX">Min-Max</option>
              <option value="RAW">原始分</option>
            </select>
          </td>
          <td v-if="form.algorithm === 'QUOTA_UNION'">
            <input v-model.number="component.quota" class="table-input compact-input" type="number" min="0" max="33" />
          </td>
          <td>
            <button class="table-button" :disabled="form.components.length <= 1" @click="removeComponent(index)">
              删除
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-3 boundary-note">
      <strong>当前组合：</strong>{{ componentSummary }}。
      配额并集会按组件行顺序依次保留来源名额；加权求和和排名投票不依赖行顺序。
    </div>
    <div v-if="validationMessage" class="mt-3 text-xs text-ball-red">
      {{ validationMessage }}
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 入口召回实验参数编辑器。
 * 组件内部完成参数校验并向页面发出可直接调用后端的实验请求。
 */
import { computed, reactive, ref } from 'vue';
import type {
  EntryRecallExperimentRequest,
  EntryRecallNormalizationMethod
} from '../../../api/modules/entryRecall';

/**
 * 页面可用独立组件。
 * 红20和红33尚无可靠单球评分，因此不在此处伪造入口。
 */
const componentOptions = [
  { code: 'RED10_AXIS', label: '红10坐标评分' },
  { code: 'BAYES_TOP', label: '贝叶斯冷热' },
  { code: 'REPEAT_LAST', label: '上期重号' },
  { code: 'NEIGHBOR_LAST', label: '上期邻号' },
  { code: 'LOW_LEVEL', label: '低等级冷补' },
  { code: 'THIRD_AREA_BACK', label: '三区后段' }
];

/**
 * 参数组件行的前端状态。
 */
interface EditableComponent {
  localId: number;
  componentCode: string;
  weight: number;
  normalizationMethod: EntryRecallNormalizationMethod;
  quota: number;
}

const props = defineProps<{
  running: boolean;
}>();

const emit = defineEmits<{
  run: [request: EntryRecallExperimentRequest];
}>();

let componentSequence = 3;

// 表单使用三个互补组件作为默认起点，不代表该组合已经有效。
const form = reactive({
  experimentName: '入口召回组合实验',
  strategyCode: 'ENTRY_RECALL_COMBINATION',
  strategyVersion: 'combination-v1',
  algorithm: 'WEIGHTED_SUM',
  entrySizesText: '15,18,20,22,24',
  recentLimit: 20,
  startQiHao: '',
  endQiHao: '',
  quotaTargetSize: 18,
  components: [
    editableComponent(1, 'RED10_AXIS', 0.6, 8),
    editableComponent(2, 'BAYES_TOP', 0.25, 4),
    editableComponent(3, 'REPEAT_LAST', 0.15, 3)
  ] as EditableComponent[]
});

// 参数校验提示。
const validationMessage = ref('');

/**
 * 当前组件摘要。
 */
const componentSummary = computed(() => form.components
  .map((item) => `${item.componentCode}×${item.weight}`)
  .join(' + '));

/**
 * 创建可编辑组件行。
 */
function editableComponent(localId: number, componentCode: string, weight: number, quota: number): EditableComponent {
  return {
    localId,
    componentCode,
    weight,
    normalizationMethod: 'RANK_PERCENTILE',
    quota
  };
}

/**
 * 增加一个尚未使用的组件；全部已使用时重复最后一个组件，允许用户自行调整。
 */
function addComponent() {
  const used = new Set(form.components.map((item) => item.componentCode));
  const next = componentOptions.find((item) => !used.has(item.code))?.code
    ?? form.components.at(-1)?.componentCode
    ?? 'RED10_AXIS';
  componentSequence += 1;
  form.components.push(editableComponent(componentSequence, next, 0.1, 1));
}

/**
 * 删除指定组件行。
 */
function removeComponent(index: number) {
  if (form.components.length <= 1) {
    return;
  }
  form.components.splice(index, 1);
}

/**
 * 校验表单并发出实验请求。
 */
function submit(saveResult: boolean) {
  validationMessage.value = '';
  try {
    emit('run', buildRequest(saveResult));
  } catch (error) {
    validationMessage.value = error instanceof Error ? error.message : String(error);
  }
}

/**
 * 构建后端实验请求。
 */
function buildRequest(saveResult: boolean): EntryRecallExperimentRequest {
  const entrySizes = parseEntrySizes(form.entrySizesText);
  if (!form.components.length) {
    throw new Error('至少需要1个入口组件。');
  }
  const componentCodes = form.components.map((item) => item.componentCode);
  if (new Set(componentCodes).size !== componentCodes.length) {
    throw new Error('同一次实验不能重复配置同一个组件。');
  }
  if (form.components.some((item) => item.weight < 0)) {
    throw new Error('组件权重不能小于0。');
  }
  if (form.recentLimit < 1 || form.recentLimit > 1000) {
    throw new Error('最近期数必须在1至1000之间。');
  }
  const combineConfig: Record<string, unknown> = { algorithm: form.algorithm };
  if (form.algorithm === 'QUOTA_UNION') {
    if (form.quotaTargetSize < 1 || form.quotaTargetSize > 33) {
      throw new Error('配额并集目标规模必须在1至33之间。');
    }
    combineConfig.targetSize = form.quotaTargetSize;
    combineConfig.quotas = Object.fromEntries(form.components.map((item) => [item.componentCode, item.quota]));
  }
  const request: EntryRecallExperimentRequest = {
    experimentName: form.experimentName.trim() || undefined,
    researchType: form.components.length === 1 ? 'SINGLE_COMPONENT_BASELINE' : 'COMBINATION',
    strategyCode: form.strategyCode.trim() || 'ENTRY_RECALL_COMBINATION',
    strategyVersion: form.strategyVersion.trim() || 'combination-v1',
    components: form.components.map((item) => ({
      componentCode: item.componentCode,
      weight: item.weight,
      normalizationMethod: item.normalizationMethod
    })),
    combineConfig,
    entrySizes,
    recentLimit: form.recentLimit,
    saveResult
  };
  if (form.startQiHao.trim()) {
    request.startQiHao = form.startQiHao.trim();
  }
  if (form.endQiHao.trim()) {
    request.endQiHao = form.endQiHao.trim();
  }
  return request;
}

/**
 * 解析并校验入口规模。
 */
function parseEntrySizes(value: string) {
  const result = [...new Set(value.split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item)))]
    .sort((left, right) => left - right);
  if (!result.length || result.some((item) => item < 6 || item > 33)) {
    throw new Error('入口规模必须是6至33之间的整数，例如15,18,20。');
  }
  return result;
}
</script>

<style scoped>
.research-card {
  border-radius: 8px;
  padding: 16px;
  background: var(--color-bg-card);
}

.section-title {
  font-size: 16px;
  font-weight: 700;
}

.section-subtitle,
.field-label {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-input,
.table-input {
  border: 1px solid rgba(234, 234, 234, 0.16);
  border-radius: 6px;
  padding: 8px 10px;
  color: var(--color-text-primary);
  background: rgba(15, 23, 42, 0.6);
  outline: none;
}

.table-input {
  min-width: 130px;
  padding: 6px 8px;
}

.compact-input {
  min-width: 82px;
  width: 92px;
}

.action-button,
.table-button {
  border: 1px solid rgba(234, 234, 234, 0.12);
  border-radius: 6px;
  padding: 7px 11px;
  color: var(--color-text-primary);
  background: rgba(22, 33, 62, 0.85);
}

.action-button-primary {
  background: var(--color-accent);
}

.action-button:disabled,
.table-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.boundary-note {
  border: 1px solid rgba(234, 234, 234, 0.18);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: rgba(22, 33, 62, 0.45);
}

.result-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.result-table th,
.result-table td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid rgba(234, 234, 234, 0.08);
}

.result-table th {
  color: var(--color-text-primary);
  background: rgba(22, 33, 62, 0.8);
}
</style>
