<template>
  <!-- 最新开奖信息展示区域 -->
  <!-- 位于页面顶部，全局展示 -->
  <div class="bg-bg-card rounded-lg p-2">
    <div class="flex items-center justify-between gap-2">
      <!-- 右侧开奖信息 -->
      <div class="flex flex-wrap items-center justify-center gap-2 text-xs flex-1">
        <!-- 期号 -->
        <div class="text-text-primary font-bold">
          {{ displayQiHao ? `第 ${displayQiHao} 期` : '第 - 期' }}
        </div>

        <!-- 开奖日期 -->
        <div class="text-text-secondary">
          {{ displayDateAndWeek || '-' }}
        </div>

        <!-- 红球区域 -->
        <div class="flex items-center gap-2">
          <template v-if="displayQiHao">
            <BallBall
              v-for="(ball, index) in displayRedBalls"
              :key="'red-' + index"
              :number="ball"
              type="red"
              size="sm"
            />
          </template>
          <template v-else>
            <BallBall
              v-for="index in 6"
              :key="'red-' + index"
              number="--"
              type="red"
              size="sm"
            />
          </template>
        </div>

        <!-- 分隔符 -->
        <div class="text-text-secondary">|</div>

        <!-- 蓝球区域 -->
        <div class="flex items-center gap-2">
          <BallBall
            :number="displayQiHao ? displayBlueBall : '--'"
            type="blue"
            size="sm"
          />
        </div>

        <!-- 分隔符 -->
        <div class="text-text-secondary">|</div>

        <!-- 尾数 -->
        <div class="text-text-secondary">
          尾数: <span class="text-text-primary">{{ displayTailsDisplay || '-' }}</span>
        </div>

        <!-- 分隔符 -->
        <div class="text-text-secondary">|</div>

        <!-- 下期期号 -->
        <div class="text-text-secondary">
          下期期号: <span class="text-text-primary">{{ displayNextQiHao || '-' }}</span>
        </div>

        <!-- 分隔符 -->
        <div class="text-text-secondary">|</div>

        <!-- 期号选择器区域 -->
        <div class="flex items-center gap-0">
          <div class="relative flex items-center">
            <input
              v-model="inputValue"
              type="text"
              placeholder="请输入期号"
              class="w-24 h-7 px-2 pr-6 text-xs bg-bg-secondary text-text-primary rounded-l border border-r-0 border-gray-600 focus:outline-none focus:border-accent"
              @keydown.up.prevent="handleArrowUp"
              @keydown.down.prevent="handleArrowDown"
              @keydown.enter.prevent="handleConfirm"
              @focus="showDropdown = inputValue.length >= 4"
              @blur="handleBlur"
            />
            <div class="absolute right-1 flex flex-col">
              <button
                class="w-4 h-2 flex items-center justify-center text-text-secondary hover:text-text-primary leading-none"
                @mousedown.prevent="handleArrowUp"
              >
                ▲
              </button>
              <button
                class="w-4 h-2 flex items-center justify-center text-text-secondary hover:text-text-primary leading-none"
                @mousedown.prevent="handleArrowDown"
              >
                ▼
              </button>
            </div>
            <div
              v-if="showDropdown && suggestions.length > 0"
              class="absolute top-full left-0 mt-1 w-full bg-bg-secondary border border-gray-600 rounded shadow-lg z-50 max-h-48 overflow-y-auto"
            >
              <div
                v-for="(item, index) in suggestions"
                :key="item"
                :class="[
                  'px-2 py-1 text-xs cursor-pointer hover:bg-accent',
                  index === selectedIndex ? 'bg-accent' : ''
                ]"
                @mousedown.prevent="selectSuggestion(item)"
              >
                {{ item }}
              </div>
            </div>
          </div>
          <button
            class="h-7 px-3 text-xs bg-bg-secondary text-text-primary rounded-r border border-gray-600 hover:bg-accent transition-colors"
            @click="handleConfirm"
          >
            确认
          </button>
        </div>

        <!-- 分隔符 -->
        <div class="text-text-secondary">|</div>

        <!-- 右侧操作按钮 -->
        <div class="flex items-center gap-2">
          <button
            :disabled="loading"
            class="px-3 py-1 text-xs bg-bg-secondary text-text-primary rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleRefresh"
          >
            {{ loading ? '刷新中...' : '刷新' }}
          </button>
          <button
            :disabled="loading"
            class="px-3 py-1 text-xs bg-bg-secondary text-text-primary rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleInit"
          >
            {{ loading ? '初始化中...' : '初始化' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 消息提示 -->
    <Transition name="fade">
      <div
        v-if="message"
        :class="[
          'mt-2 text-xs text-center',
          messageType === 'success' ? 'text-green-400' : 'text-red-400'
        ]"
      >
        {{ message }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * 最新开奖信息组件
 * 展示最新一期的开奖数据，位于页面顶部
 */
import { computed, ref, watch, onMounted } from 'vue';
import BallBall from './BallBall.vue';
import { useLotteryStore } from '@/stores/lottery';
import { db } from '@/composables/useDatabase';
import type { DrawRecord } from '@/types';

interface Props {
  data?: DrawRecord | null;
}

const props = withDefaults(defineProps<Props>(), {
  data: null
});

const emit = defineEmits(['openWindowStatus', 'displayDrawChange']);

const lotteryStore = useLotteryStore();

// 加载状态
const loading = ref(false);
// 消息文本
const message = ref('');
// 消息类型
const messageType = ref<'success' | 'error'>('success');

// 当前显示的开奖数据
const currentDisplayDraw = ref<DrawRecord | null>(null);
// 输入框值
const inputValue = ref('');
// 期号列表
const qiHaoList = ref<string[]>([]);
// 是否显示下拉列表
const showDropdown = ref(false);
// 选中索引
const selectedIndex = ref(-1);

// 监听 props.data 变化，更新 currentDisplayDraw
watch(() => props.data, (newData) => {
  if (newData) {
    currentDisplayDraw.value = newData;
    inputValue.value = newData.qiHao;
  }
}, { immediate: true });

// 页面加载时获取期号列表
onMounted(async () => {
  qiHaoList.value = await db.getAllQiHaoList();
});

// 建议列表
const suggestions = computed(() => {
  if (inputValue.value.length < 4) return [];
  const search = inputValue.value.toLowerCase();
  return qiHaoList.value
    .filter(qiHao => qiHao.toLowerCase().startsWith(search))
    .slice(0, 20);
});

// 显示用的数据
const displayQiHao = computed(() => currentDisplayDraw.value?.qiHao || '');
const displayDateAndWeek = computed(() => currentDisplayDraw.value?.dateAndWeek || '');
const displayNextQiHao = computed(() => currentDisplayDraw.value?.nextQiHao || '');

const displayRedBalls = computed(() => {
  if (!currentDisplayDraw.value) return [];
  return [
    currentDisplayDraw.value.red1,
    currentDisplayDraw.value.red2,
    currentDisplayDraw.value.red3,
    currentDisplayDraw.value.red4,
    currentDisplayDraw.value.red5,
    currentDisplayDraw.value.red6
  ];
});

const displayBlueBall = computed(() => currentDisplayDraw.value?.blue || '');

const displayTailsDisplay = computed(() => {
  if (!currentDisplayDraw.value) return '';
  const tails = [
    currentDisplayDraw.value.tail1,
    currentDisplayDraw.value.tail2,
    currentDisplayDraw.value.tail3,
    currentDisplayDraw.value.tail4,
    currentDisplayDraw.value.tail5,
    currentDisplayDraw.value.tail6
  ];
  return tails.join(',');
});

// 显示消息并自动消失
function showMsg(msg: string, type: 'success' | 'error') {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 3000);
}

// 处理上箭头
function handleArrowUp() {
  const list = qiHaoList.value;
  if (list.length === 0) return;

  if (!inputValue.value) {
    inputValue.value = list[list.length - 1];
    return;
  }

  const currentIndex = list.indexOf(inputValue.value);
  if (currentIndex === -1) {
    inputValue.value = list[list.length - 1];
  } else if (currentIndex > 0) {
    inputValue.value = list[currentIndex - 1];
  } else {
    inputValue.value = list[list.length - 1];
  }
}

// 处理下箭头
function handleArrowDown() {
  const list = qiHaoList.value;
  if (list.length === 0) return;

  if (!inputValue.value) {
    inputValue.value = list[0];
    return;
  }

  const currentIndex = list.indexOf(inputValue.value);
  if (currentIndex === -1) {
    inputValue.value = list[0];
  } else if (currentIndex < list.length - 1) {
    inputValue.value = list[currentIndex + 1];
  } else {
    inputValue.value = list[0];
  }
}

// 选择建议项
function selectSuggestion(qiHao: string) {
  inputValue.value = qiHao;
  showDropdown.value = false;
}

// 处理确认
async function handleConfirm() {
  const qiHao = inputValue.value.trim();
  if (!qiHao) return;

  const record = await db.getDrawRecordByQiHao(qiHao);
  if (record) {
    currentDisplayDraw.value = record;
    showDropdown.value = false;
    emit('displayDrawChange', record);
  } else {
    showMsg('期号不存在', 'error');
  }
}

// 失焦处理
function handleBlur() {
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
}

// 刷新按钮点击处理
async function handleRefresh() {
  loading.value = true;
  message.value = '';
  try {
    await lotteryStore.refreshDrawData();
    qiHaoList.value = await db.getAllQiHaoList();
    const latestRecord = await db.getLatestDrawRecord();
    if (latestRecord) {
      currentDisplayDraw.value = latestRecord;
      inputValue.value = latestRecord.qiHao;
      emit('displayDrawChange', latestRecord);
    }
    showMsg('刷新成功', 'success');
  } catch {
    showMsg('刷新失败', 'error');
  } finally {
    loading.value = false;
  }
}

// 初始化按钮点击处理
async function handleInit() {
  loading.value = true;
  message.value = '';
  try {
    await lotteryStore.initializeDrawData();
    qiHaoList.value = await db.getAllQiHaoList();
    const latestRecord = await db.getLatestDrawRecord();
    if (latestRecord) {
      currentDisplayDraw.value = latestRecord;
      inputValue.value = latestRecord.qiHao;
      emit('displayDrawChange', latestRecord);
    }
    showMsg('初始化成功', 'success');
  } catch {
    showMsg('初始化失败', 'error');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
