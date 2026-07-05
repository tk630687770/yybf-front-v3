<template>
  <div class="space-y-4">
    <!-- 窗口等级标签区（中文名称：窗口等级标签区） -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="group in groupedWindowLevels"
        :key="group.prefix"
        :class="[
          'px-3 py-1 rounded text-xs transition-colors',
          activeGroupKey === group.prefix
            ? 'bg-accent text-white'
            : 'bg-bg-card text-text-secondary hover:text-text-primary'
        ]"
        @click="handleGroupClick(group)"
      >
        {{ group.label }}
      </button>
    </div>

    <!-- 选择数据统计区（中文名称：统计区） -->
    <div class="bg-bg-card rounded-lg p-3">
      <div class="flex items-center justify-between gap-4 text-xs">
        <button
          class="px-3 py-1 text-xs bg-bg-secondary text-text-primary rounded hover:bg-accent transition-colors whitespace-nowrap"
          @click="$emit('openWindowStatus')"
        >
          窗口状态
        </button>

        <div class="flex flex-wrap gap-4 justify-center flex-1">
          <div>
            <span class="text-text-secondary">已选红球</span>
            <span class="text-white ml-1">({{ selectedRedNumbers.length }})</span>
            <span v-if="selectedRedNumbers.length > 0" class="text-text-secondary ml-1">:{{ selectedRedNumbers.join(',') }}</span>
          </div>
          <div>
            <span class="text-text-secondary">排除红球</span>
            <span class="text-white ml-1">({{ excludedRedNumbers.length }})</span>
            <span v-if="excludedRedNumbers.length > 0" class="text-text-secondary ml-1">:{{ excludedRedNumbers.join(',') }}</span>
          </div>
          <div>
            <span class="text-text-secondary">已选红尾</span>
            <span class="text-white ml-1">({{ selectedRedTails.length }})</span>
            <span v-if="selectedRedTails.length > 0" class="text-text-secondary ml-1">:{{ selectedRedTails.join(',') }}</span>
          </div>
          <div>
            <span class="text-text-secondary">排除红尾</span>
            <span class="text-white ml-1">({{ excludedRedTails.length }})</span>
            <span v-if="excludedRedTails.length > 0" class="text-text-secondary ml-1">:{{ excludedRedTails.join(',') }}</span>
          </div>
          <div class="text-text-secondary">
            基<span class="text-white ml-1">{{ oddCount }}</span>
            : 偶<span class="text-white ml-1">{{ evenCount }}</span>
            : 质<span class="text-white ml-1">{{ primeCount }}</span>
          </div>
          <div>
            <span class="text-text-secondary">已选蓝球</span>
            <span class="text-white ml-1">({{ selectedBlueNumbers.length }})</span>
            <span v-if="selectedBlueNumbers.length > 0" class="text-text-secondary ml-1">:{{ selectedBlueNumbers.join(',') }}</span>
          </div>
          <div>
            <span class="text-text-secondary">排除蓝球</span>
            <span class="text-white ml-1">({{ excludedBlueNumbers.length }})</span>
            <span v-if="excludedBlueNumbers.length > 0" class="text-text-secondary ml-1">:{{ excludedBlueNumbers.join(',') }}</span>
          </div>
          <div>
            <span class="text-text-secondary">已选蓝尾</span>
            <span class="text-white ml-1">({{ selectedBlueTails.length }})</span>
            <span v-if="selectedBlueTails.length > 0" class="text-text-secondary ml-1">:{{ selectedBlueTails.join(',') }}</span>
          </div>
          <div>
            <span class="text-text-secondary">排除蓝尾</span>
            <span class="text-white ml-1">({{ excludedBlueTails.length }})</span>
            <span v-if="excludedBlueTails.length > 0" class="text-text-secondary ml-1">:{{ excludedBlueTails.join(',') }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 whitespace-nowrap">
          <span class="text-xs text-text-secondary">模拟模式</span>
          <button
            :class="[
              'relative w-10 h-5 rounded-full transition-colors',
              simulationMode ? 'bg-green-500' : 'bg-gray-600'
            ]"
            @click="simulationMode = !simulationMode"
          >
            <span
              :class="[
                'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                simulationMode ? 'left-5.5 translate-x-0' : 'left-0.5'
              ]"
            ></span>
          </button>
        </div>

        <div class="flex items-center gap-2 whitespace-nowrap">
          <span class="text-xs text-text-secondary">猜测模式</span>
          <button
            :class="[
              'relative w-10 h-5 rounded-full transition-colors',
              guessingMode ? 'bg-green-500' : 'bg-gray-600'
            ]"
            @click="guessingMode = !guessingMode"
          >
            <span
              :class="[
                'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                guessingMode ? 'left-5.5 translate-x-0' : 'left-0.5'
              ]"
            ></span>
          </button>
        </div>
      </div>
    </div>

    <!-- 窗口等级表格（中文名称：窗口等级表格） -->
    <div class="bg-bg-card rounded-lg p-4">
      <!-- 分栏模式：同组多个枚举值均分显示 -->
      <div
        v-if="currentGroup && currentGroup.keys.length > 1"
        :class="multiWindowGridClass"
      >
        <div
          v-for="key in currentGroup.keys"
          :key="key"
          :class="multiWindowCardClass"
        >
          <!-- 分栏内窗口期号信息区 -->
          <div class="sticky top-0 bg-bg-card z-10 border-b border-border px-2 py-1 text-xs">
            <span class="text-accent font-medium">【{{ getEnumLabel(key) }}】</span>
            <span class="text-text-secondary ml-2">
              窗口统计期号：{{ getStatisticsQiHao(key) || '-' }}
            </span>
            <span class="text-text-secondary ml-2">
              窗口数据期号：
              <span :class="checkMismatch(key) ? 'text-red-500' : 'text-white'">
                {{ getWindowDataQiHao(key) || '-' }}
              </span>
            </span>
            <button
              v-if="checkMismatch(key)"
              class="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              @click="handleRefreshWindowData(key)"
            >
              刷新
            </button>
          </div>
          <!-- 分栏内表格 -->
          <div class="p-2">
            <WindowLevelTable
              v-if="getCurrentStatistics(key).length > 0"
              :data="getCurrentStatistics(key)"
              :window-data="getCurrentWindowData(key)"
              :next-qi-hao="getWindowDataQiHao(key)"
              :statistics-qi-hao="getStatisticsQiHao(key)"
              :simulation-mode="simulationMode"
              :guessing-mode="guessingMode"
              :model-value="getRedBallStates(key)"
              :enum-key="key"
              :ball-category="getCategory(key)"
              :is-window-data-qi-hao-mismatch="checkMismatch(key)"
              :row-fold-state="getRowFoldState(key)"
              :selected-levels="getSelectedLevels(key)"
              :col-fold-state="getColFoldState(key)"
              :selected-col-indexes="getSelectedColIndexes(key)"
              @update:simulation-mode="simulationMode = $event"
              @update:model-value="(v) => setRedBallStates(key, v)"
              @ball-state-change="handleBallStateChange"
              @refresh-window-data="() => handleRefreshWindowData(key)"
              @level-click="(lvl) => toggleLevelSelection(key, lvl)"
              @level-right-click="(lvl) => handleLevelRightClick(key, lvl)"
              @fold-selected="() => foldSelectedLevels(key)"
              @unfold-level="(lvl) => unfoldLevel(key, lvl)"
              @unfold-range="(s, e) => unfoldRange(key, s, e)"
              @join-fold-range="(lvl) => joinFoldRange(key, lvl)"
              @col-click="(idx) => toggleColSelection(key, idx)"
              @col-right-click="(idx) => handleColRightClick(key, idx)"
              @fold-selected-cols="() => foldSelectedCols(key)"
              @unfold-col-index="(idx) => unfoldColIndex(key, idx)"
              @unfold-col-range="(s, e) => unfoldColRange(key, s, e)"
              @join-col-fold-range="(idx) => joinColFoldRange(key, idx)"
              @auto-unfold-row="(lvl) => handleAutoUnfoldRow(key, lvl)"
              @auto-unfold-col="(idx) => handleAutoUnfoldCol(key, idx)"
            />
            <div v-else class="text-text-secondary text-sm text-center py-4">
              {{ getEnumLabel(key) }} - 暂无数据
            </div>
          </div>
        </div>
      </div>
      <!-- 单列模式：只有一个枚举值 -->
      <div v-else-if="currentStatistics.length > 0">
        <!-- 窗口期号信息区 -->
        <div class="flex justify-center mb-2">
          <div class="text-xs text-text-secondary flex items-center gap-2">
            <span>
              窗口统计期号：<span class="text-white">{{ currentStatisticsQiHao || '--' }}</span>
              &nbsp;|&nbsp;
              窗口数据期号：
              <span :class="isWindowDataQiHaoMismatch ? 'text-red-500' : 'text-white'">
                {{ currentWindowDataQiHao || '--' }}
              </span>
            </span>
            <button
              v-if="isWindowDataQiHaoMismatch"
              class="px-2 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              @click="handleRefreshWindowData(currentKey)"
            >
              刷新
            </button>
          </div>
        </div>
        <WindowLevelTable
          :data="currentStatistics"
          :window-data="currentWindowData"
          :next-qi-hao="currentWindowDataQiHao"
          :statistics-qi-hao="currentStatisticsQiHao"
          :simulation-mode="simulationMode"
          :guessing-mode="guessingMode"
          :model-value="currentRedBallStates"
          :enum-key="currentKey"
          :ball-category="currentCategory"
          :is-window-data-qi-hao-mismatch="isWindowDataQiHaoMismatch"
          :row-fold-state="getCurrentRowFoldState()"
          :selected-levels="getSelectedLevels(currentKey)"
          :col-fold-state="getCurrentColFoldState()"
          :selected-col-indexes="getSelectedColIndexes(currentKey)"
          @update:simulation-mode="simulationMode = $event"
          @update:model-value="handleRedBallStateChange"
          @ball-state-change="handleBallStateChange"
          @refresh-window-data="handleRefreshWindowData"
          @level-click="(lvl) => toggleLevelSelection(currentKey, lvl)"
          @level-right-click="(lvl) => handleLevelRightClick(currentKey, lvl)"
          @fold-selected="foldSelectedLevels(currentKey)"
          @unfold-level="(lvl) => unfoldLevel(currentKey, lvl)"
          @unfold-range="(s, e) => unfoldRange(currentKey, s, e)"
          @join-fold-range="(lvl) => joinFoldRange(currentKey, lvl)"
          @col-click="(idx) => toggleColSelection(currentKey, idx)"
          @col-right-click="(idx) => handleColRightClick(currentKey, idx)"
          @fold-selected-cols="foldSelectedCols(currentKey)"
          @unfold-col-index="(idx) => unfoldColIndex(currentKey, idx)"
          @unfold-col-range="(s, e) => unfoldColRange(currentKey, s, e)"
          @join-col-fold-range="(idx) => joinColFoldRange(currentKey, idx)"
          @auto-unfold-row="(lvl) => handleAutoUnfoldRow(currentKey, lvl)"
          @auto-unfold-col="(idx) => handleAutoUnfoldCol(currentKey, idx)"
        />
      </div>
      <div v-else class="text-text-secondary text-sm">
        {{ currentLabel }} - 暂无数据
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 窗口等级面板组件
 * 展示窗口等级标签，点击切换显示对应内容
 */
import { ref, computed, onMounted, watch } from 'vue';
import { useLotteryStore, windowLevelList } from '@/stores/lottery';
import WindowLevelTable from './WindowLevelTable.vue';
import type { WindowLevelEnum, WindowLevelStatistics, WindowRecord } from '@/types';

const lotteryStore = useLotteryStore();

defineEmits(['openWindowStatus', 'displayDrawChange']);

const simulationMode = ref(false);
const guessingMode = ref(false);

watch(simulationMode, (newVal) => {
  if (newVal) {
    const keys = currentGroup.value?.keys || [currentKey.value];
    for (const key of keys) {
      autoUnfoldRowsForKey(key);
      autoUnfoldColsForKey(key);
    }
  }
});

const windowStatisticsMap = ref<Record<string, WindowLevelStatistics[]>>({});
const windowDataMap = ref<Record<string, WindowRecord[]>>({});
const redBallStateMap = ref<Record<string, Map<string, -1 | 0 | 1>>>({});
const statisticsQiHaoMap = ref<Record<string, string>>({});

const displayDraw = defineProps<{
  displayDraw?: { nextQiHao: string } | null;
}>();

interface FoldedRange {
  start: number;
  end: number;
}

interface RowFoldState {
  foldedRanges: FoldedRange[];
  manuallyModified?: boolean;
}

interface ColFoldRange {
  start: number;
  end: number;
}

interface ColFoldState {
  foldedRanges: ColFoldRange[];
  manuallyModified?: boolean;
}

interface WindowLevelGroup {
  prefix: string;
  label: string;
  keys: WindowLevelEnum[];
}

const rowFoldStateMap = ref<Record<string, RowFoldState>>({});
const colFoldStateMap = ref<Record<string, ColFoldState>>({});
const selectedLevelsMap = ref<Record<string, number[]>>({});
const selectedColIndexesMap = ref<Record<string, number[]>>({});

const groupedWindowLevels = computed<WindowLevelGroup[]>(() => {
  const groups = new Map<string, WindowLevelGroup>();
  for (const item of windowLevelList) {
    const prefix = item.category;
    if (!groups.has(prefix)) {
      groups.set(prefix, {
        prefix,
        label: `${item.label.replace(/\d+$/, '')}窗口`,
        keys: []
      });
    }
    groups.get(prefix)!.keys.push(item.key as WindowLevelEnum);
  }
  for (const group of groups.values()) {
    group.keys.sort((a, b) => {
      const numA = parseInt(a.match(/\d+$/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+$/)?.[0] || '0');
      return numA - numB;
    });
    const labelName = getCategoryDisplayName(group.prefix);
    const keyNums = group.keys.map(k => k.match(/\d+$/)?.[0]).join('/');
    group.label = `${labelName}${keyNums}窗口`;
  }
  return Array.from(groups.values());
});

function getCategoryDisplayName(category: string): string {
  const map: Record<string, string> = {
    'RED_NUMBER': '红球',
    'BLUE_NUMBER': '蓝球',
    'RED_TAIL': '红尾',
    'BLUE_TAIL': '蓝尾'
  };
  return map[category] || category;
}

const activeGroupKey = ref<string>('RED_NUMBER');

const currentGroup = computed(() => {
  return groupedWindowLevels.value.find(g => g.prefix === activeGroupKey.value);
});

const multiWindowGridClass = computed(() => {
  return activeGroupKey.value === 'RED_NUMBER'
    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'
    : 'grid grid-cols-1 md:grid-cols-3 gap-4';
});

const multiWindowCardClass = computed(() => {
  return 'min-w-0 overflow-auto border border-border rounded';
});

const currentKey = computed<WindowLevelEnum>(() => {
  if (currentGroup.value && currentGroup.value.keys.length > 0) {
    return currentGroup.value.keys[0];
  }
  return 'RED_NUMBER_10';
});

function handleGroupClick(group: WindowLevelGroup) {
  activeGroupKey.value = group.prefix;
}

function getEnumLabel(key: WindowLevelEnum): string {
  const item = windowLevelList.find(i => i.key === key);
  return item?.label.replace(/\d+$/, (m) => m) || key;
}

function getCategory(key: WindowLevelEnum): string {
  const item = windowLevelList.find(i => i.key === key);
  return item?.category || '';
}

function getStatisticsQiHao(key: WindowLevelEnum): string {
  return statisticsQiHaoMap.value[key] || '';
}

function getWindowDataQiHao(key: WindowLevelEnum): string | null {
  const windowData = windowDataMap.value[key];
  return windowData && windowData.length > 0 ? windowData[0].qiHao : null;
}

function getCurrentStatistics(key: WindowLevelEnum): WindowLevelStatistics[] {
  return windowStatisticsMap.value[key] || [];
}

function getCurrentWindowData(key: WindowLevelEnum): WindowRecord[] {
  return windowDataMap.value[key] || [];
}

function getRedBallStates(key: WindowLevelEnum): Map<string, -1 | 0 | 1> {
  if (!redBallStateMap.value[key]) {
    redBallStateMap.value[key] = new Map();
  }
  return redBallStateMap.value[key];
}

function setRedBallStates(key: WindowLevelEnum, states: Map<string, -1 | 0 | 1>) {
  redBallStateMap.value[key] = states;
}

function checkMismatch(key: WindowLevelEnum): boolean {
  if (!displayDraw.displayDraw) return false;
  const nextQiHao = displayDraw.displayDraw.nextQiHao;
  const windowData = windowDataMap.value[key];
  if (!windowData || windowData.length === 0) return false;
  return nextQiHao !== windowData[0].qiHao;
}

function getRowFoldState(key: WindowLevelEnum): RowFoldState {
  if (!rowFoldStateMap.value[key]) {
    rowFoldStateMap.value[key] = { foldedRanges: [] };
  }
  return rowFoldStateMap.value[key];
}

function getColFoldState(key: WindowLevelEnum): ColFoldState {
  if (!colFoldStateMap.value[key]) {
    colFoldStateMap.value[key] = { foldedRanges: [] };
  }
  return colFoldStateMap.value[key];
}

function getSelectedLevels(key: WindowLevelEnum): number[] {
  return selectedLevelsMap.value[key] || [];
}

function getSelectedColIndexes(key: WindowLevelEnum): number[] {
  return selectedColIndexesMap.value[key] || [];
}

const isWindowDataQiHaoMismatch = computed(() => {
  if (!displayDraw.displayDraw) return false;
  const nextQiHao = displayDraw.displayDraw.nextQiHao;
  const windowData = windowDataMap.value[currentKey.value];
  if (!windowData || windowData.length === 0) return false;
  return nextQiHao !== windowData[0].qiHao;
});

const currentWindowDataQiHao = computed(() => {
  const windowData = windowDataMap.value[currentKey.value];
  return windowData && windowData.length > 0 ? windowData[0].qiHao : null;
});

const currentLabel = computed(() => {
  const item = windowLevelList.find(i => i.key === currentKey.value);
  return item?.label || '';
});

const currentStatistics = computed(() => {
  return windowStatisticsMap.value[currentKey.value] || [];
});

const currentWindowData = computed(() => {
  return windowDataMap.value[currentKey.value] || [];
});

const currentRedBallStates = computed(() => {
  if (!redBallStateMap.value[currentKey.value]) {
    redBallStateMap.value[currentKey.value] = new Map();
  }
  return redBallStateMap.value[currentKey.value];
});

const currentStatisticsQiHao = computed(() => {
  return statisticsQiHaoMap.value[currentKey.value] || '';
});

const currentCategory = computed(() => {
  const item = windowLevelList.find(i => i.key === currentKey.value);
  return item?.category || '';
});

function isPrime(num: number): boolean {
  if (num < 2) return false;
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false;
  }
  return true;
}

function getCurrentRowFoldState(key?: WindowLevelEnum): RowFoldState {
  const k = key || currentKey.value;
  if (!rowFoldStateMap.value[k]) {
    rowFoldStateMap.value[k] = { foldedRanges: [] };
  }
  return rowFoldStateMap.value[k];
}

function isLevelFolded(level: number, key?: WindowLevelEnum): boolean {
  const state = getCurrentRowFoldState(key);
  return state.foldedRanges.some(range => level >= Math.min(range.start, range.end) && level <= Math.max(range.start, range.end));
}

function toggleLevelSelection(key: WindowLevelEnum, level: number) {
  if (isLevelFolded(level, key)) return;
  if (!selectedLevelsMap.value[key]) {
    selectedLevelsMap.value[key] = [];
  }
  const selected = selectedLevelsMap.value[key];
  const idx = selected.indexOf(level);
  if (idx >= 0) {
    selected.splice(idx, 1);
  } else {
    selected.push(level);
  }
}

/**
 * 折叠选中的等级范围
 * @param key 窗口枚举类型
 * @description 将用户选中的多个等级合并为一个折叠范围，支持与现有折叠范围合并
 */
function foldSelectedLevels(key: WindowLevelEnum) {
  const selected = selectedLevelsMap.value[key] || [];
  if (selected.length < 2) return;

  const state = getCurrentRowFoldState(key);
  const sorted = [...selected].sort((a, b) => b - a);
  let newStart = sorted[0];
  let newEnd = sorted[sorted.length - 1];

  const mergedRanges: FoldedRange[] = [];
  const maxNew = Math.max(newStart, newEnd);
  const minNew = Math.min(newStart, newEnd);

  for (const range of state.foldedRanges) {
    const minR = Math.min(range.start, range.end);
    const maxR = Math.max(range.start, range.end);

    const isCompletelyBelow = maxNew < minR - 1;
    const isCompletelyAbove = minNew > maxR + 1;

    if (isCompletelyBelow || isCompletelyAbove) {
      mergedRanges.push(range);
    } else {
      newStart = Math.max(maxNew, maxR);
      newEnd = Math.min(minNew, minR);
    }
  }

  mergedRanges.push({ start: newStart, end: newEnd });
  state.foldedRanges = mergedRanges;
  state.manuallyModified = true;
  selectedLevelsMap.value[key] = [];
}

/**
 * 展开指定等级
 * @param key 窗口枚举类型
 * @param level 要展开的等级
 * @description 展开折叠范围内的单个等级，如果剩余等级不足2个则全部展开
 */
function unfoldLevel(key: WindowLevelEnum, level: number) {
  const state = getCurrentRowFoldState(key);
  const newRanges: FoldedRange[] = [];

  for (const range of state.foldedRanges) {
    const minLevel = Math.min(range.start, range.end);
    const maxLevel = Math.max(range.start, range.end);

    if (level >= minLevel && level <= maxLevel) {
      const aboveLevels: number[] = [];
      const belowLevels: number[] = [];

      for (let lv = maxLevel; lv >= minLevel; lv--) {
        if (lv === level) continue;
        if (lv > level) {
          aboveLevels.push(lv);
        } else {
          belowLevels.push(lv);
        }
      }

      if (aboveLevels.length >= 2) {
        const top = Math.max(...aboveLevels);
        const bottom = Math.min(...aboveLevels);
        newRanges.push({ start: top, end: bottom });
      }

      if (belowLevels.length >= 2) {
        const top = Math.max(...belowLevels);
        const bottom = Math.min(...belowLevels);
        newRanges.push({ start: top, end: bottom });
      }
    } else {
      newRanges.push(range);
    }
  }

  state.foldedRanges = newRanges;
}

/**
 * 展开指定范围内的所有等级
 * @param key 窗口枚举类型
 * @param start 起始等级
 * @param end 结束等级
 * @description 完全删除完全包含在指定范围内的折叠范围
 */
function unfoldRange(key: WindowLevelEnum, start: number, end: number) {
  const state = getCurrentRowFoldState(key);
  const minLevel = Math.min(start, end);
  const maxLevel = Math.max(start, end);
  state.foldedRanges = state.foldedRanges.filter(range => {
    const rMin = Math.min(range.start, range.end);
    const rMax = Math.max(range.start, range.end);
    return !(minLevel >= rMin && maxLevel <= rMax);
  });
}

/**
 * 将单个等级加入相邻的折叠范围
 * @param key 窗口枚举类型
 * @param level 要加入的等级
 * @description 如果等级与某个折叠范围相邻（上方或下方），则扩展该范围包含此等级
 */
function joinFoldRange(key: WindowLevelEnum, level: number) {
  const state = getCurrentRowFoldState(key);
  for (const range of state.foldedRanges) {
    const minR = Math.min(range.start, range.end);
    const maxR = Math.max(range.start, range.end);
    if (level === minR - 1) {
      range.end = level;
      return;
    } else if (level === maxR + 1) {
      range.start = level;
      return;
    }
  }
}

function handleLevelRightClick(key: WindowLevelEnum, level: number) {
  const isFolded = isLevelFolded(level, key);
  if (isFolded) {
    return;
  }
  if (!selectedLevelsMap.value[key]?.includes(level)) {
    toggleLevelSelection(key, level);
  }
}

function getCurrentColFoldState(key?: WindowLevelEnum): ColFoldState {
  const k = key || currentKey.value;
  if (!colFoldStateMap.value[k]) {
    colFoldStateMap.value[k] = { foldedRanges: [] };
  }
  return colFoldStateMap.value[k];
}

function isColFolded(index: number, key?: WindowLevelEnum): boolean {
  const state = getCurrentColFoldState(key);
  return state.foldedRanges.some(range =>
    index >= Math.min(range.start, range.end) && index <= Math.max(range.start, range.end)
  );
}

/**
 * 切换列的选中状态
 * @param key 窗口枚举类型
 * @param index 列索引
 * @description 折叠的列不可选中，切换选中状态添加到列表或从列表移除
 */
function toggleColSelection(key: WindowLevelEnum, index: number) {
  if (isColFolded(index, key)) return;
  if (!selectedColIndexesMap.value[key]) {
    selectedColIndexesMap.value[key] = [];
  }
  const selected = selectedColIndexesMap.value[key];
  const idx = selected.indexOf(index);
  if (idx >= 0) {
    selected.splice(idx, 1);
  } else {
    selected.push(index);
  }
}

/**
 * 折叠选中的列范围
 * @param key 窗口枚举类型
 * @description 将用户选中的多个列索引合并为一个折叠范围，支持与现有折叠范围合并
 */
function foldSelectedCols(key: WindowLevelEnum) {
  const selected = selectedColIndexesMap.value[key] || [];
  if (selected.length < 2) return;

  const state = getCurrentColFoldState(key);
  const sorted = [...selected].sort((a, b) => b - a);
  let newStart = sorted[0];
  let newEnd = sorted[sorted.length - 1];

  const mergedRanges: ColFoldRange[] = [];
  const maxNew = Math.max(newStart, newEnd);
  const minNew = Math.min(newStart, newEnd);

  for (const range of state.foldedRanges) {
    const minR = Math.min(range.start, range.end);
    const maxR = Math.max(range.start, range.end);

    const isCompletelyBelow = maxNew < minR - 1;
    const isCompletelyAbove = minNew > maxR + 1;

    if (isCompletelyBelow || isCompletelyAbove) {
      mergedRanges.push(range);
    } else {
      newStart = Math.max(maxNew, maxR);
      newEnd = Math.min(minNew, minR);
    }
  }

  mergedRanges.push({ start: newStart, end: newEnd });
  state.foldedRanges = mergedRanges;
  state.manuallyModified = true;
  selectedColIndexesMap.value[key] = [];
}

/**
 * 展开指定列索引
 * @param key 窗口枚举类型
 * @param index 列索引
 * @description 展开折叠范围内的单个列，如果剩余列不足2个则全部展开
 */
function unfoldColIndex(key: WindowLevelEnum, index: number) {
  const state = getCurrentColFoldState(key);
  const newRanges: ColFoldRange[] = [];

  for (const range of state.foldedRanges) {
    const minIdx = Math.min(range.start, range.end);
    const maxIdx = Math.max(range.start, range.end);

    if (index >= minIdx && index <= maxIdx) {
      const aboveIdxs: number[] = [];
      const belowIdxs: number[] = [];

      for (let idx = maxIdx; idx >= minIdx; idx--) {
        if (idx === index) continue;
        if (idx > index) {
          aboveIdxs.push(idx);
        } else {
          belowIdxs.push(idx);
        }
      }

      if (aboveIdxs.length >= 2) {
        const top = Math.max(...aboveIdxs);
        const bottom = Math.min(...aboveIdxs);
        newRanges.push({ start: top, end: bottom });
      }

      if (belowIdxs.length >= 2) {
        const top = Math.max(...belowIdxs);
        const bottom = Math.min(...belowIdxs);
        newRanges.push({ start: top, end: bottom });
      }
    } else {
      newRanges.push(range);
    }
  }

  state.foldedRanges = newRanges;
}

/**
 * 展开指定列范围
 * @param key 窗口枚举类型
 * @param start 起始列索引
 * @param end 结束列索引
 * @description 从折叠范围中删除指定范围，如果折叠范围被部分展开则分割为两个范围
 */
function unfoldColRange(key: WindowLevelEnum, start: number, end: number) {
  const state = getCurrentColFoldState(key);
  const minIdx = Math.min(start, end);
  const maxIdx = Math.max(start, end);

  const newRanges: ColFoldRange[] = [];

  for (const range of state.foldedRanges) {
    const rMin = Math.min(range.start, range.end);
    const rMax = Math.max(range.start, range.end);

    if (maxIdx < rMin || minIdx > rMax) {
      newRanges.push(range);
    } else {
      if (rMin < minIdx) {
        newRanges.push({ start: rMin, end: minIdx - 1 });
      }
      if (rMax > maxIdx) {
        newRanges.push({ start: maxIdx + 1, end: rMax });
      }
    }
  }

  state.foldedRanges = newRanges;
}

/**
 * 将单个列加入相邻的折叠范围
 * @param key 窗口枚举类型
 * @param index 列索引
 * @description 如果列与某个折叠范围相邻（左侧或右侧），则扩展该范围包含此列
 */
function joinColFoldRange(key: WindowLevelEnum, index: number) {
  const state = getCurrentColFoldState(key);
  for (const range of state.foldedRanges) {
    const minR = Math.min(range.start, range.end);
    const maxR = Math.max(range.start, range.end);
    if (index === minR - 1) {
      range.end = index;
      return;
    } else if (index === maxR + 1) {
      range.start = index;
      return;
    }
  }
}

/**
 * 处理自动展开行事件
 * @param key 窗口枚举类型
 * @param level 等级
 * @description 当球移动到折叠行时触发，自动展开包含该等级的折叠范围
 */
function handleAutoUnfoldRow(key: WindowLevelEnum, level: number) {
  const state = getCurrentRowFoldState(key);
  for (const range of state.foldedRanges) {
    const min = Math.min(range.start, range.end);
    const max = Math.max(range.start, range.end);
    if (level >= min && level <= max) {
      unfoldLevel(key, level);
      return;
    }
  }
}

/**
 * 自动展开所有包含球的折叠行
 * @param key 窗口枚举类型
 * @description 根据模拟模式计算每个等级的球数，展开所有包含球的折叠范围
 */
function autoUnfoldRowsForKey(key: WindowLevelEnum) {
  const state = getCurrentRowFoldState(key);
  const ballsPerLevel = getBallsPerLevel(key);

  for (const levelStr of Object.keys(ballsPerLevel)) {
    const level = parseInt(levelStr);
    for (const range of state.foldedRanges) {
      const min = Math.min(range.start, range.end);
      const max = Math.max(range.start, range.end);
      if (level >= min && level <= max) {
        unfoldLevel(key, level);
        break;
      }
    }
  }
}

/**
 * 处理自动展开列事件
 * @param key 窗口枚举类型
 * @param _index 列索引（预留参数，当前未使用）
 * @description 触发自动列展开逻辑
 */
function handleAutoUnfoldCol(key: WindowLevelEnum, _index: number) {
  autoUnfoldColsForKey(key);
}

/**
 * 自动展开所有需要展开的列
 * @param key 窗口枚举类型
 * @description 根据球的列位置展开所有包含球的折叠列
 */
function autoUnfoldColsForKey(key: WindowLevelEnum) {
  const state = getCurrentColFoldState(key);
  const windowData = windowDataMap.value[key];
  if (!windowData || windowData.length === 0) return;

  const ballsPerLevel = getBallsPerLevel(key);

  const rightmostExpandedCol = getRightmostExpandedCol(state.foldedRanges);

  for (const [_level, ballCount] of Object.entries(ballsPerLevel)) {
    if (ballCount > rightmostExpandedCol) {
      unfoldColRange(key, rightmostExpandedCol + 1, ballCount);
    }
  }
}

/**
 * 获取每个等级的球数量
 * @param key 窗口枚举类型
 * @returns 等级到球数的映射
 * @description 考虑模拟模式计算每个等级实际应该显示的球数
 */
function getBallsPerLevel(key: WindowLevelEnum): Record<number, number> {
  const windowData = windowDataMap.value[key];
  const ballState = getRedBallStates(key);
  const result: Record<number, number> = {};

  for (const record of windowData) {
    let ball = ballState.get(record.number);
    if (ball === undefined) {
      ball = 0;
    }

    const baseLevel = record.count;
    const willDown = record.willDown;
    const realLevel = baseLevel - willDown;

    let targetLevel: number;
    if (simulationMode.value) {
      targetLevel = ball === 1 ? realLevel + 1 : realLevel;
    } else {
      if (ball === -1) continue;
      targetLevel = realLevel;
    }

    if (!result[targetLevel]) result[targetLevel] = 0;
    result[targetLevel]++;
  }

  return result;
}

function getRightmostExpandedCol(foldedRanges: ColFoldRange[]): number {
  if (foldedRanges.length === 0) return 33;

  let minFoldStart = Math.min(...foldedRanges.map(r => Math.min(r.start, r.end)));
  return minFoldStart - 1;
}

function handleColRightClick(key: WindowLevelEnum, index: number) {
  const isFolded = isColFolded(index, key);
  if (isFolded) {
    return;
  }
  if (!selectedColIndexesMap.value[key]?.includes(index)) {
    toggleColSelection(key, index);
  }
}

const selectedRedNumbers = computed(() => {
  const numbers = new Set<string>();
  for (const key of windowLevelList.filter(i => i.category === 'RED_NUMBER').map(i => i.key)) {
    const states = redBallStateMap.value[key];
    if (states) {
      for (const [num, state] of states) {
        if (state === 1) numbers.add(num);
      }
    }
  }
  return Array.from(numbers).sort((a, b) => parseInt(a) - parseInt(b));
});

const excludedRedNumbers = computed(() => {
  const numbers = new Set<string>();
  for (const key of windowLevelList.filter(i => i.category === 'RED_NUMBER').map(i => i.key)) {
    const states = redBallStateMap.value[key];
    if (states) {
      for (const [num, state] of states) {
        if (state === -1) numbers.add(num);
      }
    }
  }
  return Array.from(numbers).sort((a, b) => parseInt(a) - parseInt(b));
});

const selectedRedTails = computed(() => {
  const tails = new Set<string>();
  for (const key of windowLevelList.filter(i => i.category === 'RED_TAIL').map(i => i.key)) {
    const states = redBallStateMap.value[key];
    if (states) {
      for (const [num, state] of states) {
        if (state === 1) tails.add(num);
      }
    }
  }
  return Array.from(tails).sort((a, b) => parseInt(a) - parseInt(b));
});

const excludedRedTails = computed(() => {
  const tails = new Set<string>();
  for (const key of windowLevelList.filter(i => i.category === 'RED_TAIL').map(i => i.key)) {
    const states = redBallStateMap.value[key];
    if (states) {
      for (const [num, state] of states) {
        if (state === -1) tails.add(num);
      }
    }
  }
  return Array.from(tails).sort((a, b) => parseInt(a) - parseInt(b));
});

const selectedBlueNumbers = computed(() => {
  const numbers = new Set<string>();
  for (const key of windowLevelList.filter(i => i.category === 'BLUE_NUMBER').map(i => i.key)) {
    const states = redBallStateMap.value[key];
    if (states) {
      for (const [num, state] of states) {
        if (state === 1) numbers.add(num);
      }
    }
  }
  return Array.from(numbers).sort((a, b) => parseInt(a) - parseInt(b));
});

const excludedBlueNumbers = computed(() => {
  const numbers = new Set<string>();
  for (const key of windowLevelList.filter(i => i.category === 'BLUE_NUMBER').map(i => i.key)) {
    const states = redBallStateMap.value[key];
    if (states) {
      for (const [num, state] of states) {
        if (state === -1) numbers.add(num);
      }
    }
  }
  return Array.from(numbers).sort((a, b) => parseInt(a) - parseInt(b));
});

const selectedBlueTails = computed(() => {
  const tails = new Set<string>();
  for (const key of windowLevelList.filter(i => i.category === 'BLUE_TAIL').map(i => i.key)) {
    const states = redBallStateMap.value[key];
    if (states) {
      for (const [num, state] of states) {
        if (state === 1) tails.add(num);
      }
    }
  }
  return Array.from(tails).sort((a, b) => parseInt(a) - parseInt(b));
});

const excludedBlueTails = computed(() => {
  const tails = new Set<string>();
  for (const key of windowLevelList.filter(i => i.category === 'BLUE_TAIL').map(i => i.key)) {
    const states = redBallStateMap.value[key];
    if (states) {
      for (const [num, state] of states) {
        if (state === -1) tails.add(num);
      }
    }
  }
  return Array.from(tails).sort((a, b) => parseInt(a) - parseInt(b));
});

const oddCount = computed(() => {
  return selectedRedNumbers.value.filter(n => parseInt(n) % 2 === 1).length;
});

const evenCount = computed(() => {
  return selectedRedNumbers.value.filter(n => parseInt(n) % 2 === 0).length;
});

const primeCount = computed(() => {
  return selectedRedNumbers.value.filter(n => isPrime(parseInt(n))).length;
});

function handleRedBallStateChange(newStates: Map<string, -1 | 0 | 1>) {
  redBallStateMap.value[currentKey.value] = newStates;
}

/**
 * 处理球状态变更（联动）
 * @param payload 状态变更信息
 * @description 当球状态变更时，联动同category的所有窗口
 */
function handleBallStateChange(payload: { category: string; number: string; newState: -1 | 0 | 1; enumKey: string; targetLevel?: number; targetColIndex?: number|null }) {
  const { category, number, newState, enumKey, targetLevel } = payload;

  const sameCategoryKeys = windowLevelList
    .filter(item => item.category === category)
    .map(item => item.key);

  for (const key of sameCategoryKeys) {
    if (key === enumKey) continue;

    if (!redBallStateMap.value[key]) {
      redBallStateMap.value[key] = new Map();
    }
    redBallStateMap.value[key].set(number, newState);

    if (simulationMode.value && targetLevel !== undefined) {
      const windowData = windowDataMap.value[key];
      if (windowData && windowData.length > 0) {
        const record = windowData.find(w => w.number === number);
        if (record) {
          const baseLevel = record.count;
          const willDown = record.willDown;
          const realLevel = baseLevel - willDown;
          let linkedTargetLevel: number;
          if (newState === 1) {
            linkedTargetLevel = realLevel + 1;
          } else {
            linkedTargetLevel = realLevel;
          }
          handleAutoUnfoldRow(key, linkedTargetLevel);
          autoUnfoldColsForKey(key);
        }
      }
    }
  }
}

async function loadStatistics() {
  await lotteryStore.loadWindowStatisticsInfoList();
  const keys = currentGroup.value?.keys || [currentKey.value];
  for (const key of keys) {
    const stats = await lotteryStore.getWindowStatistics(key);
    windowStatisticsMap.value[key] = stats;
    const info = lotteryStore.windowStatisticsInfoList.find(i => i.enumKey === key);
    statisticsQiHaoMap.value[key] = info?.latestQiHao || '';
  }
}

async function loadWindowData(key: WindowLevelEnum) {
  const nextQiHao = displayDraw.displayDraw?.nextQiHao ?? lotteryStore.latestDraw?.nextQiHao;
  if (!nextQiHao) {
    windowDataMap.value[key] = [];
    return;
  }
  const data = await lotteryStore.getWindowDataByQiHao(key, nextQiHao);
  windowDataMap.value[key] = data;
  autoFoldEmptyRows(key);
  autoFoldEmptyCols(key);
}

async function loadAllWindowDataInGroup() {
  const keys = currentGroup.value?.keys || [currentKey.value];
  for (const key of keys) {
    await loadWindowData(key);
  }
}

/**
 * 自动折叠空行（没有球的等级）
 * @param key 窗口枚举类型
 * @description 在表格最大等级和最小占用等级之外的范围自动折叠
 */
function autoFoldEmptyRows(key: WindowLevelEnum) {
  const data = windowDataMap.value[key];
  const stats = windowStatisticsMap.value[key];
  if (!data || data.length === 0 || !stats || stats.length === 0) return;

  const state = getCurrentRowFoldState(key);
  if (state.manuallyModified) return;

  state.foldedRanges = [];

  const occupiedLevels = new Set<number>();
  for (const record of data) {
    occupiedLevels.add(record.count);
  }

  const maxTableLevel = Math.max(...stats.map(s => s.level));
  const maxOccupiedLevel = Math.max(...occupiedLevels);
  const minOccupiedLevel = Math.min(...occupiedLevels);

  if (maxOccupiedLevel < maxTableLevel) {
    state.foldedRanges.push({ start: maxTableLevel, end: maxOccupiedLevel + 1 });
  }

  if (minOccupiedLevel > 0) {
    state.foldedRanges.push({ start: minOccupiedLevel - 1, end: 0 });
  }
}

/**
 * 自动折叠空列（所有等级都没有球的列）
 * @param key 窗口枚举类型
 * @description 在最大占用列之后的所有列自动折叠
 */
function autoFoldEmptyCols(key: WindowLevelEnum) {
  const data = windowDataMap.value[key];
  const stats = windowStatisticsMap.value[key];
  if (!data || data.length === 0 || !stats || stats.length === 0) return;

  const state = getCurrentColFoldState(key);
  if (state.manuallyModified) return;

  state.foldedRanges = [];

  const maxTableColCount = Math.max(...stats.map(s => s.list.length)) - 1;

  const groupedByLevel = new Map<number, WindowRecord[]>();
  for (const record of data) {
    if (!groupedByLevel.has(record.count)) {
      groupedByLevel.set(record.count, []);
    }
    groupedByLevel.get(record.count)!.push(record);
  }

  let maxOccupiedCol = 0;
  for (const [, levelRecords] of groupedByLevel) {
    maxOccupiedCol = Math.max(maxOccupiedCol, levelRecords.length);
  }

  if (maxOccupiedCol < maxTableColCount) {
    state.foldedRanges.push({ start: maxOccupiedCol + 1, end: maxTableColCount });
  }
}

/**
 * 刷新窗口数据
 * @param key 窗口枚举类型（可选，默认当前选中）
 * @description 清除缓存的窗口数据并重新加载
 */
async function handleRefreshWindowData(key?: WindowLevelEnum) {
  const targetKey = key || currentKey.value;
  delete windowDataMap.value[targetKey];
  await loadWindowData(targetKey);
}

/**
 * 加载所有数据
 * @description 加载统计数据和窗口数据
 */
async function loadData() {
  await loadStatistics();
  await loadAllWindowDataInGroup();
}

watch(activeGroupKey, async () => {
  await loadStatistics();
  await loadAllWindowDataInGroup();
});

watch([() => lotteryStore.latestDraw?.nextQiHao, () => displayDraw.displayDraw?.nextQiHao], async () => {
  await loadAllWindowDataInGroup();
});

onMounted(async () => {
  await loadData();
});
</script>
