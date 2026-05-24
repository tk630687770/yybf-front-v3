<template>
  <!-- 基础窗口操作台页面容器 -->
  <div class="p-4 space-y-4">
    <!-- 最新开奖信息展示区域 -->
    <LatestDrawInfo
      :data="lotteryStore.latestDraw"
      @display-draw-change="handleDisplayDrawChange"
    />

    <!-- 窗口等级面板 -->
    <WindowLevelPanel
      :display-draw="displayDraw"
      @open-window-status="showWindowStatus = true"
      @display-draw-change="handleDisplayDrawChange"
    />

    <!-- 窗口状态弹窗 -->
    <WindowStatusModal
      v-model:visible="showWindowStatus"
      :current-qi-hao="lotteryStore.latestDraw?.qiHao ?? null"
      :next-qi-hao="lotteryStore.latestDraw?.nextQiHao ?? null"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 基础窗口操作台页面
 * 保留原有窗口矩阵、号码选择、模拟位移、窗口状态同步等人工分析能力
 */
import { ref, onMounted } from 'vue';
import LatestDrawInfo from '@/components/lottery/LatestDrawInfo.vue';
import WindowLevelPanel from '@/components/lottery/WindowLevelPanel.vue';
import WindowStatusModal from '@/components/lottery/WindowStatusModal.vue';
import { useLotteryStore } from '@/stores/lottery';
import type { DrawRecord } from '@/types';

const lotteryStore = useLotteryStore();
const showWindowStatus = ref(false);
const displayDraw = ref<DrawRecord | null>(null);

/**
 * 切换当前页面用于展示和推演的开奖期
 * @param record 被选中的开奖数据
 */
function handleDisplayDrawChange(record: DrawRecord) {
  displayDraw.value = record;
}

onMounted(async () => {
  // 页面进入时优先读取本地缓存的最新开奖数据，避免每次进入都请求后端。
  await lotteryStore.loadLatestFromDB();
});
</script>
