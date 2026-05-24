<template>
  <div class="overflow-x-auto">
    <div class="flex justify-center">
      <table class="text-xs border-collapse">
        <thead>
          <tr class="border border-bg-secondary">
            <th class="py-1 px-2 text-text-secondary bg-bg-secondary w-[50px] text-center border-r border-bg-secondary">
            </th>
            <th class="py-0 px-1 border-r border-bg-secondary">
              <div class="flex">
                <template v-for="(col, colIdx) in processedCols" :key="colIdx">
                  <div
                    v-if="col.type === 'normal'"
                    :class="[
                      'flex flex-col items-center min-w-[40px] px-1 border-r border-bg-secondary last:border-r-0 cursor-pointer',
                      selectedColIndexes.includes(col.index) ? 'bg-accent/30 ring-2 ring-accent' : 'hover:bg-bg-secondary/50'
                    ]"
                    :style="{ width: '40px' }"
                    @click="handleColClick(col.index)"
                    @contextmenu.prevent="showColContextMenu($event, col.index)"
                  >
                    <span class="py-0 text-text-secondary">{{ col.index }}</span>
                  </div>
                  <div
                    v-else
                    class="flex items-center justify-center min-w-[40px] px-1 border-r border-bg-secondary cursor-pointer hover:bg-bg-secondary/50"
                    :style="{ width: '40px' }"
                    @click.right.prevent="showColContextMenu($event, col.range.start)"
                  >
                    <span class="py-0 text-text-secondary">{{ Math.min(col.range.start, col.range.end) }}~{{ Math.max(col.range.start, col.range.end) }}</span>
                  </div>
                </template>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(row, index) in processedRows" :key="index">
            <template v-if="row.type === 'folded'">
              <tr class="border border-bg-secondary">
                <td
                  class="py-1 px-2 text-text-secondary bg-bg-secondary w-[50px] text-center border-r border-bg-secondary cursor-pointer hover:bg-bg-secondary/50"
                  :colspan="processedCols.length + 1"
                  @click.right.prevent="showContextMenu($event, row.range.start)"
                >
                  <div class="flex items-center justify-center h-full min-h-[60px]">
                    lv{{ row.range.start }}~{{ row.range.end }}
                  </div>
                </td>
              </tr>
            </template>
            <template v-else>
              <tr class="border border-bg-secondary">
                <td
                  :class="[
                    'py-1 px-2 text-text-secondary bg-bg-secondary w-[50px] text-center border-r border-bg-secondary cursor-pointer',
                    selectedLevels.includes(row.stat.level) ? 'bg-accent/30 ring-2 ring-accent' : 'hover:bg-bg-secondary/50'
                  ]"
                  rowspan="4"
                  @click="handleLevelClick(row.stat.level)"
                  @contextmenu.prevent="showContextMenu($event, row.stat.level)"
                >
                  <div class="flex items-center justify-center h-full min-h-[60px]">
                    lv{{ row.stat.level }}
                  </div>
                </td>
                <td class="py-0 px-1 border-r border-bg-secondary">
                  <div class="flex">
                    <template v-for="(col, colIdx) in processedCols" :key="colIdx">
                      <div
                        v-if="col.type === 'normal'"
                        class="flex flex-col items-center min-w-[40px] px-1 border-r border-bg-secondary last:border-r-0"
                        :style="{ width: '40px' }"
                      >
                        <span :class="getHeatClass(row.stat.list[col.index]?.proportion ?? 0, row.stat)" class="py-0">{{ row.stat.list[col.index]?.count }}</span>
                      </div>
                      <div
                        v-else
                        class="flex items-center justify-center min-w-[40px] px-1 border-r border-bg-secondary"
                        :style="{ width: '40px' }"
                      >
                      </div>
                    </template>
                  </div>
                </td>
              </tr>
              <tr class="border border-bg-secondary">
                <td class="py-0 px-1 border-r border-bg-secondary">
                  <div class="flex">
                    <template v-for="(col, colIdx) in processedCols" :key="colIdx">
                      <div
                        v-if="col.type === 'normal'"
                        class="flex flex-col items-center min-w-[40px] px-1 border-r border-bg-secondary last:border-r-0"
                        :style="{ width: '40px' }"
                      >
                        <span :class="getHeatClass(row.stat.list[col.index]?.proportion ?? 0, row.stat)" class="py-0">{{ row.stat.list[col.index]?.proportion }}</span>
                      </div>
                      <div
                        v-else
                        class="flex items-center justify-center min-w-[40px] px-1 border-r border-bg-secondary"
                        :style="{ width: '40px' }"
                      >
                      </div>
                    </template>
                  </div>
                </td>
              </tr>
              <tr class="border border-bg-secondary">
                <td class="py-0 px-1 border-r border-bg-secondary">
                  <div class="flex">
                    <template v-for="(col, colIdx) in processedCols" :key="colIdx">
                      <div
                        v-if="col.type === 'normal'"
                        class="flex flex-col items-center min-w-[40px] px-1 border-r border-bg-secondary last:border-r-0"
                        :style="{ width: '40px' }"
                      >
                        <span :class="getHeatClass(0, row.stat)" class="py-0 text-text-secondary">{{ col.index }}</span>
                      </div>
                      <div
                        v-else
                        class="flex items-center justify-center min-w-[40px] px-1 border-r border-bg-secondary"
                        :style="{ width: '40px' }"
                      >
                      </div>
                    </template>
                  </div>
                </td>
              </tr>
              <tr class="border border-bg-secondary">
                <td class="py-1 px-1 border-r border-bg-secondary">
                  <div class="flex">
                    <template v-for="(col, colIdx) in processedCols" :key="colIdx">
                      <div
                        v-if="col.type === 'normal'"
                        class="flex flex-col items-center justify-center min-h-[24px] min-w-[40px] px-1 border-r border-bg-secondary last:border-r-0"
                        :style="{ width: '40px' }"
                      >
                        <template v-if="col.index === 0">
                          <span class="w-4 h-4 rounded-full border-2 border-black bg-black"></span>
                        </template>
                        <template v-else-if="getBallAtSlot(row.stat.level, col.index)">
                          <div class="flex items-center gap-1">
                            <span
                              :class="getBallClass(getBallAtSlot(row.stat.level, col.index)!)"
                              @click.left="handleBallClick(getBallAtSlot(row.stat.level, col.index)!)"
                              @contextmenu.prevent="handleBallRightClick(getBallAtSlot(row.stat.level, col.index)!)"
                            >
                              {{ getBallAtSlot(row.stat.level, col.index)!.number }}
                            </span>
                            <span
                              v-if="getBallAtSlot(row.stat.level, col.index)!.willDown === 1"
                              :class="getWillDownClass(getBallAtSlot(row.stat.level, col.index)!)"
                            >
                              ↓
                            </span>
                          </div>
                        </template>
                        <template v-else>
                          <span class="py-0">&nbsp;</span>
                        </template>
                      </div>
                      <div
                        v-else
                        class="flex items-center justify-center min-h-[24px] min-w-[40px] px-1 border-r border-bg-secondary"
                        :style="{ width: '40px' }"
                      >
                      </div>
                    </template>
                  </div>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>
    <div v-if="noDataMessage" class="text-center text-text-secondary py-2">
      {{ noDataMessage }}
    </div>
    <Teleport to="body">
      <div
        v-if="contextMenu.show"
        class="fixed z-50 bg-bg-card border border-gray-600 rounded shadow-lg py-1 min-w-[120px]"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        @contextmenu.prevent
      >
        <template v-if="!contextMenu.isFolded">
          <template v-if="selectedLevels.length >= 2">
            <div
              class="px-3 py-1 text-xs text-text-primary hover:bg-accent cursor-pointer"
              @click="handleContextMenuAction('fold')"
            >
              折叠
            </div>
          </template>
          <template v-else>
            <div
              v-if="canJoinFoldRange(contextMenu.level)"
              class="px-3 py-1 text-xs text-text-primary hover:bg-accent cursor-pointer"
              @click="handleContextMenuAction('joinFold')"
            >
              加入折叠
            </div>
            <div
              v-else
              class="px-3 py-1 text-xs text-text-secondary cursor-not-allowed"
            >
              折叠（需选2个以上）
            </div>
          </template>
        </template>
        <template v-else-if="contextMenu.foldedRange">
          <div class="px-3 py-1 text-xs text-text-secondary border-b border-gray-600">
            已折叠: lv{{ contextMenu.foldedRange.start }}~{{ contextMenu.foldedRange.end }}
          </div>
          <div
            v-for="lv in getLevelsInRange(contextMenu.foldedRange)"
            :key="lv"
            class="px-3 py-1 text-xs text-text-primary hover:bg-accent cursor-pointer"
            @click="handleContextMenuAction('unfold', lv)"
          >
            lv{{ lv }}
          </div>
          <div
            class="px-3 py-1 text-xs text-text-primary hover:bg-accent cursor-pointer border-t border-gray-600"
            @click="handleContextMenuAction('unfoldRange')"
          >
            展开全部
          </div>
        </template>
      </div>
    </Teleport>
    <Teleport to="body">
      <div
        v-if="colContextMenu.show"
        class="fixed z-50 bg-bg-card border border-gray-600 rounded shadow-lg py-1 min-w-[120px]"
        :style="{ left: colContextMenu.x + 'px', top: colContextMenu.y + 'px' }"
        @contextmenu.prevent
      >
        <template v-if="!colContextMenu.isFolded">
          <template v-if="selectedColIndexes.length >= 2">
            <div
              class="px-3 py-1 text-xs text-text-primary hover:bg-accent cursor-pointer"
              @click="handleColContextMenuAction('fold')"
            >
              折叠
            </div>
          </template>
          <template v-else>
            <div
              v-if="canJoinColFoldRange(colContextMenu.index)"
              class="px-3 py-1 text-xs text-text-primary hover:bg-accent cursor-pointer"
              @click="handleColContextMenuAction('joinFold')"
            >
              加入折叠
            </div>
            <div
              v-else
              class="px-3 py-1 text-xs text-text-secondary cursor-not-allowed"
            >
              折叠（需选2个以上）
            </div>
          </template>
        </template>
        <template v-else-if="colContextMenu.foldedRange">
          <div class="px-3 py-1 text-xs text-text-secondary border-b border-gray-600">
            已折叠: {{ colContextMenu.foldedRange.start }}~{{ colContextMenu.foldedRange.end }}
          </div>
          <div
            v-for="idx in getColIndexesInRange(colContextMenu.foldedRange)"
            :key="idx"
            class="px-3 py-1 text-xs text-text-primary hover:bg-accent cursor-pointer"
            @click="handleColContextMenuAction('unfold', idx)"
          >
            {{ idx }}
          </div>
          <div
            class="px-3 py-1 text-xs text-text-primary hover:bg-accent cursor-pointer border-t border-gray-600"
            @click="handleColContextMenuAction('unfoldRange')"
          >
            展开全部
          </div>
        </template>
      </div>
    </Teleport>
    <div
      v-if="contextMenu.show || colContextMenu.show"
      class="fixed inset-0 z-40"
      @click="hideContextMenu(); hideColContextMenu();"
      @contextmenu.prevent="hideContextMenu(); hideColContextMenu();"
    ></div>
  </div>
</template>

<script setup lang="ts">
/**
 * 窗口等级表格组件
 * 展示窗口等级的统计数据，以热力色渲染比例
 * 第四行填充窗口数据的 number，支持红球点击交互和模拟模式
 */
import { computed, ref, watch } from 'vue';
import type { WindowLevelStatistics, WindowRecord } from '@/types';

interface Props {
  data: WindowLevelStatistics[];
  windowData: WindowRecord[];
  nextQiHao: string | null;
  statisticsQiHao: string;
  simulationMode: boolean;
  guessingMode?: boolean;
  modelValue: Map<string, -1 | 0 | 1>;
  enumKey: string;
  ballCategory: string;
  isWindowDataQiHaoMismatch?: boolean;
  rowFoldState?: { foldedRanges: { start: number; end: number }[] };
  selectedLevels?: number[];
  colFoldState?: { foldedRanges: { start: number; end: number }[] };
  selectedColIndexes?: number[];
}

const props = withDefaults(defineProps<Props>(), {
  rowFoldState: () => ({ foldedRanges: [] }),
  selectedLevels: () => [],
  colFoldState: () => ({ foldedRanges: [] }),
  selectedColIndexes: () => []
});

const emit = defineEmits<{
  (e: 'update:simulationMode', value: boolean): void;
  (e: 'update:modelValue', value: Map<string, -1 | 0 | 1>): void;
  (e: 'ballStateChange', payload: {category: string; number: string; newState: -1|0|1; enumKey: string; targetLevel: number; targetColIndex: number|null}): void;
  (e: 'ballStateUpdate', payload: {category: string; number: string; newState: -1|0|1}): void;
  (e: 'refreshWindowData'): void;
  (e: 'levelClick', level: number): void;
  (e: 'levelRightClick', level: number): void;
  (e: 'foldSelected'): void;
  (e: 'unfoldLevel', level: number): void;
  (e: 'unfoldRange', start: number, end: number): void;
  (e: 'joinFoldRange', level: number): void;
  (e: 'colClick', index: number): void;
  (e: 'colRightClick', index: number): void;
  (e: 'foldSelectedCols'): void;
  (e: 'unfoldColIndex', index: number): void;
  (e: 'unfoldColRange', start: number, end: number): void;
  (e: 'joinColFoldRange', index: number): void;
  (e: 'autoUnfoldRow', level: number): void;
  (e: 'autoUnfoldCol', index: number): void;
}>();

interface RedBallState {
  number: string;
  state: -1 | 0 | 1;
  baseLevel: number;
  willDown: number;
  previousRec: number;
  currentRec: number;
}

const statisticsData = computed(() => [...props.data].sort((a, b) => b.level - a.level));

const processedRows = computed(() => {
  const result: Array<{ type: 'normal'; stat: WindowLevelStatistics } | { type: 'folded'; range: { start: number; end: number } }> = [];
  let i = 0;
  const stats = statisticsData.value;

  while (i < stats.length) {
    const stat = stats[i];
    const foldedRange = props.rowFoldState.foldedRanges.find(range =>
      stat.level >= Math.min(range.start, range.end) && stat.level <= Math.max(range.start, range.end)
    );

    if (foldedRange) {
      result.push({ type: 'folded', range: foldedRange });
      const maxLevel = Math.max(foldedRange.start, foldedRange.end);
      while (i < stats.length && stats[i].level >= Math.min(foldedRange.start, foldedRange.end) && stats[i].level <= maxLevel) {
        i++;
      }
    } else {
      result.push({ type: 'normal', stat });
      i++;
    }
  }

  return result;
});

const maxColCount = computed(() => {
  if (props.data.length === 0) return 0;
  return Math.max(...props.data.map(stat => stat.list.length));
});

function getLevelsInRange(range: { start: number; end: number }): number[] {
  const levels: number[] = [];
  const min = Math.min(range.start, range.end);
  const max = Math.max(range.start, range.end);
  for (let lv = max; lv >= min; lv--) {
    levels.push(lv);
  }
  return levels;
}

const processedCols = computed(() => {
  const result: Array<{ type: 'normal'; index: number } | { type: 'folded'; range: { start: number; end: number } }> = [];
  let i = 0;
  const maxIdx = maxColCount.value;

  while (i < maxIdx) {
    const foldedRange = props.colFoldState.foldedRanges.find(range =>
      i >= Math.min(range.start, range.end) && i <= Math.max(range.start, range.end)
    );

    if (foldedRange) {
      result.push({ type: 'folded', range: foldedRange });
      const maxFoldedIdx = Math.max(foldedRange.start, foldedRange.end);
      while (i <= maxFoldedIdx && i < maxIdx) {
        i++;
      }
    } else {
      result.push({ type: 'normal', index: i });
      i++;
    }
  }

  return result;
});

function isColFolded(index: number): boolean {
  return props.colFoldState.foldedRanges.some(range =>
    index >= Math.min(range.start, range.end) && index <= Math.max(range.start, range.end)
  );
}

function getColIndexesInRange(range: { start: number; end: number }): number[] {
  const indexes: number[] = [];
  const min = Math.min(range.start, range.end);
  const max = Math.max(range.start, range.end);
  for (let idx = max; idx >= min; idx--) {
    indexes.push(idx);
  }
  return indexes;
}

const colContextMenu = ref<{ show: boolean; x: number; y: number; index: number; isFolded: boolean; foldedRange?: { start: number; end: number } }>({
  show: false,
  x: 0,
  y: 0,
  index: -1,
  isFolded: false
});

function showColContextMenu(event: MouseEvent, index: number) {
  const isFolded = isColFolded(index);
  const range = props.colFoldState.foldedRanges.find(r =>
    index >= Math.min(r.start, r.end) && index <= Math.max(r.start, r.end)
  );
  colContextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    index,
    isFolded,
    foldedRange: range
  };
}

function hideColContextMenu() {
  colContextMenu.value.show = false;
}

function handleColContextMenuAction(action: 'fold' | 'unfold' | 'unfoldRange' | 'joinFold', index?: number) {
  if (action === 'fold') {
    emit('foldSelectedCols');
  } else if (action === 'unfold' && index !== undefined) {
    emit('unfoldColIndex', index);
  } else if (action === 'unfoldRange' && colContextMenu.value.foldedRange) {
    const range = colContextMenu.value.foldedRange;
    emit('unfoldColRange', range.start, range.end);
  } else if (action === 'joinFold') {
    emit('joinColFoldRange', colContextMenu.value.index);
  }
  hideColContextMenu();
}

function canJoinColFoldRange(index: number): boolean {
  for (const range of props.colFoldState.foldedRanges) {
    const minR = Math.min(range.start, range.end);
    const maxR = Math.max(range.start, range.end);
    if (index === minR - 1 || index === maxR + 1) {
      return true;
    }
  }
  return false;
}

function handleColClick(index: number) {
  if (isColFolded(index)) return;
  emit('colClick', index);
}

const noDataMessage = computed(() => {
  if (props.nextQiHao && props.windowData.length === 0) {
    return `${props.nextQiHao}期暂无窗口数据`;
  }
  return '';
});

const redBallMap = ref<Map<string, RedBallState>>(new Map());

function initRedBalls() {
  const newMap = new Map<string, RedBallState>();
  for (const item of props.windowData) {
    const savedState = props.modelValue.get(item.number);
    newMap.set(item.number, {
      number: item.number,
      state: savedState !== undefined ? savedState : 0,
      baseLevel: item.count,
      willDown: item.willDown,
      previousRec: item.previousRec,
      currentRec: item.currentRec
    });
  }
  redBallMap.value = newMap;
}

watch(() => props.windowData, () => {
  initRedBalls();
}, { immediate: true, deep: true });

watch(() => props.modelValue, (newVal) => {
  for (const ball of redBallMap.value.values()) {
    if (newVal.has(ball.number)) {
      ball.state = newVal.get(ball.number)!;
    }
  }
}, { deep: true });

/**
 * 检查等级是否折叠
 * @param level 等级
 * @returns 是否折叠
 */
function isLevelFolded(level: number): boolean {
  return props.rowFoldState.foldedRanges.some(range =>
    level >= Math.min(range.start, range.end) && level <= Math.max(range.start, range.end)
  );
}

/**
 * 处理等级点击
 * @param level 等级
 * @description 折叠的等级不可点击
 */
function handleLevelClick(level: number) {
  if (isLevelFolded(level)) return;
  emit('levelClick', level);
}

const contextMenu = ref<{ show: boolean; x: number; y: number; level: number; isFolded: boolean; foldedRange?: { start: number; end: number } }>({
  show: false,
  x: 0,
  y: 0,
  level: -1,
  isFolded: false
});

function showContextMenu(event: MouseEvent, level: number) {
  const isFolded = isLevelFolded(level);
  const range = props.rowFoldState.foldedRanges.find(r =>
    level >= Math.min(r.start, r.end) && level <= Math.max(r.start, r.end)
  );
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    level,
    isFolded,
    foldedRange: range
  };
}

function hideContextMenu() {
  contextMenu.value.show = false;
}

function canJoinFoldRange(level: number): boolean {
  for (const range of props.rowFoldState.foldedRanges) {
    const minR = Math.min(range.start, range.end);
    const maxR = Math.max(range.start, range.end);
    if (level === minR - 1 || level === maxR + 1) {
      return true;
    }
  }
  return false;
}

function handleContextMenuAction(action: 'fold' | 'unfold' | 'unfoldRange' | 'joinFold', level?: number) {
  if (action === 'fold') {
    emit('foldSelected');
  } else if (action === 'unfold' && level !== undefined) {
    emit('unfoldLevel', level);
  } else if (action === 'unfoldRange' && contextMenu.value.foldedRange) {
    const range = contextMenu.value.foldedRange;
    emit('unfoldRange', range.start, range.end);
  } else if (action === 'joinFold') {
    emit('joinFoldRange', contextMenu.value.level);
  }
  hideContextMenu();
}

watch(() => props.windowData, (newData) => {
  for (const item of newData) {
    const ball = redBallMap.value.get(item.number);
    if (ball) {
      ball.baseLevel = item.count;
      ball.willDown = item.willDown;
      ball.previousRec = item.previousRec;
      ball.currentRec = item.currentRec;
    }
  }
}, { deep: true });

/**
 * 获取球的模拟位置
 * @param ball 球状态
 * @returns 球应该显示的等级位置
 * @description 模拟模式下根据state和willDown计算球的实际位置
 */
function getBallPosition(ball: RedBallState): number {
  if (props.simulationMode) {
    const realLevel = ball.baseLevel - ball.willDown;
    const upLimit = realLevel + 1;
    if (ball.state === 1) {
      return upLimit;
    }
    return realLevel;
  }
  return ball.baseLevel;
}

function getBallAtLevel(level: number): RedBallState[] {
  const balls: RedBallState[] = [];
  for (const ball of redBallMap.value.values()) {
    if (getBallPosition(ball) === level) {
      balls.push(ball);
    }
  }
  return balls.sort((a, b) => parseInt(a.number) - parseInt(b.number));
}

function getBallAtSlot(level: number, index: number): RedBallState | null {
  const levelBalls = getBallAtLevel(level);
  const slotIndex = index - 1;
  if (slotIndex < 0 || slotIndex >= levelBalls.length) {
    return null;
  }
  return levelBalls[slotIndex];
}

function handleBallClick(ball: RedBallState) {
  if (ball.state === 1) {
    return;
  }
  const newState = (ball.state + 1) as -1 | 0 | 1;
  ball.state = newState;
  emitStateChange();
  if (props.simulationMode) {
    checkAndAutoUnfold(ball);
    const tl = getBallPosition(ball);
    const tc = getBallColIndex(ball);
    emit('ballStateChange', {category: props.ballCategory, number: ball.number, newState, enumKey: props.enumKey, targetLevel: tl, targetColIndex: tc});
  } else {
    emit('ballStateChange', {category: props.ballCategory, number: ball.number, newState, enumKey: props.enumKey, targetLevel: ball.baseLevel, targetColIndex: null});
  }
}

function handleBallRightClick(ball: RedBallState) {
  if (ball.state === -1) {
    return;
  }
  const newState = (ball.state - 1) as -1 | 0 | 1;
  ball.state = newState;
  emitStateChange();
  if (props.simulationMode) {
    checkAndAutoUnfold(ball);
    const tl = getBallPosition(ball);
    const tc = getBallColIndex(ball);
    emit('ballStateChange', {category: props.ballCategory, number: ball.number, newState, enumKey: props.enumKey, targetLevel: tl, targetColIndex: tc});
  } else {
    emit('ballStateChange', {category: props.ballCategory, number: ball.number, newState, enumKey: props.enumKey, targetLevel: ball.baseLevel, targetColIndex: null});
  }
}

/**
 * 检查并自动展开
 * @param ball 球状态
 * @description 检查球当前位置是否在折叠区域内，自动触发展开
 */
function checkAndAutoUnfold(ball: RedBallState) {
  const newPosition = getBallPosition(ball);
  if (isLevelFolded(newPosition)) {
    emit('autoUnfoldRow', newPosition);
  }
  const ballColIndex = getBallColIndex(ball);
  if (ballColIndex !== null) {
    emit('autoUnfoldCol', ballColIndex);
  }
}

/**
 * 获取球在当前等级中的列索引
 * @param ball 球状态
 * @returns 列索引（从1开始），未找到返回null
 */
function getBallColIndex(ball: RedBallState): number | null {
  const level = getBallPosition(ball);
  const levelBalls = getBallAtLevel(level);
  const sortedBalls = [...levelBalls].sort((a, b) => parseInt(a.number) - parseInt(b.number));
  const ballIndex = sortedBalls.findIndex(b => b.number === ball.number);
  if (ballIndex === -1) return null;
  return ballIndex + 1;
}

/**
 * 发送状态变更事件
 */
function emitStateChange() {
  const stateMap = new Map<string, -1 | 0 | 1>();
  for (const ball of redBallMap.value.values()) {
    stateMap.set(ball.number, ball.state);
  }
  emit('update:modelValue', stateMap);
}

/**
 * 获取球的CSS类名
 * @param ball 球状态
 * @returns CSS类名字符串
 */
function getBallClass(ball: RedBallState): string {
  let borderColor = 'border-white';
  if (ball.previousRec === 1) {
    borderColor = 'border-yellow-400';
  } else if (ball.previousRec === 2) {
    borderColor = 'border-purple-400';
  }

  const textColor = (ball.currentRec === 1 && !props.guessingMode) ? 'text-yellow-400' : 'text-white';

  if (ball.state === -1) {
    return `w-5 h-5 rounded-full border-2 border-gray-400 bg-gray-500 ${textColor} flex items-center justify-center cursor-pointer`;
  }
  if (ball.state === 0) {
    return `w-5 h-5 rounded-full border-2 ${borderColor} bg-transparent ${textColor} flex items-center justify-center cursor-pointer`;
  }
  return `w-5 h-5 rounded-full border-2 ${borderColor} bg-red-500 ${textColor} flex items-center justify-center cursor-pointer`;
}

function getWillDownClass(ball: RedBallState): string {
  if (ball.willDown !== 1) {
    return 'w-2 h-4 bg-blue-500 text-white text-[8px] flex items-center justify-center';
  }

  if (props.simulationMode) {
    const realLevel = ball.baseLevel - ball.willDown;
    const upLimit = realLevel + 1;
    const currentPosition = getBallPosition(ball);
    if (currentPosition === upLimit) {
      return 'w-2 h-4 bg-blue-500 text-white text-[8px] flex items-center justify-center';
    }
    return 'w-2 h-4 bg-gray-400 text-white text-[8px] flex items-center justify-center';
  }

  return 'w-2 h-4 bg-blue-500 text-white text-[8px] flex items-center justify-center';
}

function getHeatClass(proportion: number, stat: WindowLevelStatistics): string {
  if (proportion === 0) {
    return 'text-gray-500';
  }

  const list = stat.list.filter(item => item.proportion > 0);
  if (list.length === 0) return 'text-text-secondary';

  if (list.length === 1) return 'text-red-500 font-bold';

  const maxProp = Math.max(...list.map(item => item.proportion));
  const minProp = Math.min(...list.map(item => item.proportion));

  if (maxProp === minProp) return 'text-orange-400';

  const ratio = (proportion - minProp) / (maxProp - minProp);

  if (ratio > 0.66) return 'text-red-500 font-bold';
  if (ratio > 0.33) return 'text-orange-400';
  return 'text-yellow-400';
}
</script>
