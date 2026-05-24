<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="handleClose">
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="text-lg font-bold text-text-primary">窗口状态</h3>
            <button class="text-text-secondary hover:text-text-primary" @click="handleClose">
              ✕
            </button>
          </div>

          <div class="modal-body">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-left text-text-secondary border-b border-bg-secondary">
                  <th class="py-2 px-2 w-[140px]">枚举</th>
                  <th class="py-2 px-2 w-[120px]">说明</th>
                  <th class="py-2 px-2 w-[90px] text-center">
                    <button
                      :disabled="loading"
                      class="hover:text-accent disabled:opacity-50"
                      @click="handleBatchUpdateStatistics"
                    >
                      {{ loading ? '更新中...' : '全量更新' }}
                    </button>
                  </th>
                  <th class="py-2 px-2">
                    <div class="flex gap-2 justify-center">
                      <button
                        :disabled="loading"
                        class="hover:text-accent disabled:opacity-50 text-center w-[80px]"
                        @click="handleClearLocalWindowData"
                      >
                        清空本地
                      </button>
                      <button
                        :disabled="loading"
                        class="hover:text-accent disabled:opacity-50 text-center w-[80px]"
                        @click="handleBatchSync"
                      >
                        {{ loading ? '同步中...' : '同步' }}
                      </button>
                      <button
                        :disabled="loading"
                        class="hover:text-accent disabled:opacity-50 text-center w-[80px]"
                        @click="handleBatchInit"
                      >
                        {{ loading ? '初始化中...' : '初始化' }}
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="info in windowDataInfoList"
                  :key="info.enumKey"
                  class="border-b border-bg-secondary"
                >
                  <td class="py-2 px-2 text-text-primary w-[140px]">{{ info.enumKey }}</td>
                  <td class="py-2 px-2 text-text-secondary w-[120px]">{{ info.label }}</td>
                  <td class="py-2 px-2 w-[90px] text-center">
                    <button
                      :disabled="loading"
                      :class="[
                        'px-2 py-1 rounded transition-colors min-w-[80px]',
                        getStatisticsColor(info.enumKey) === 'red' ? 'text-red-400 hover:bg-bg-secondary' : '',
                        getStatisticsColor(info.enumKey) === 'gray' ? 'text-gray-500 hover:bg-bg-secondary' : '',
                        getStatisticsColor(info.enumKey) === 'normal' ? 'text-text-primary hover:bg-bg-secondary' : ''
                      ]"
                      @click="handleUpdateStatistics(info.enumKey)"
                    >
                      {{ getStatisticsDisplay(info.enumKey) }}
                    </button>
                  </td>
                  <td class="py-2 px-2">
                    <div class="flex gap-2 justify-center">
                      <button
                        :disabled="loading"
                        :class="[
                          'px-2 py-1 rounded transition-colors min-w-[80px]',
                          getWindowDataColor(info.enumKey) === 'red' ? 'text-red-400 hover:bg-bg-secondary' : '',
                          getWindowDataColor(info.enumKey) === 'gray' ? 'text-gray-500 hover:bg-bg-secondary' : '',
                          getWindowDataColor(info.enumKey) === 'normal' ? 'text-text-primary hover:bg-bg-secondary' : ''
                        ]"
                        @click="handleSync(info.enumKey)"
                      >
                        {{ getWindowDataDisplay(info.enumKey) }}
                      </button>
                      <button
                        :disabled="loading"
                        :class="[
                          'px-2 py-1 rounded transition-colors min-w-[80px]',
                          getWindowDataColor(info.enumKey) === 'red' ? 'text-red-400 hover:bg-bg-secondary' : '',
                          getWindowDataColor(info.enumKey) === 'gray' ? 'text-gray-500 hover:bg-bg-secondary' : '',
                          getWindowDataColor(info.enumKey) === 'normal' ? 'text-text-primary hover:bg-bg-secondary' : ''
                        ]"
                        @click="handleInit(info.enumKey)"
                      >
                        {{ getWindowDataDisplay(info.enumKey) }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="modal-footer">
            <div v-if="message" :class="['text-xs', messageType === 'success' ? 'text-green-400' : 'text-red-400']">
              {{ message }}
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * 窗口状态弹窗组件
 * 展示各窗口等级的状态和操作按钮
 */
import { ref, computed, watch } from 'vue';
import { useLotteryStore, windowLevelList } from '@/stores/lottery';
import type { WindowLevelEnum } from '@/types';

interface Props {
  visible: boolean;
  currentQiHao: string | null;
  nextQiHao: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits(['update:visible']);

const lotteryStore = useLotteryStore();

const loading = ref(false);
const message = ref('');
const messageType = ref<'success' | 'error'>('success');

const windowDataInfoList = computed(() => lotteryStore.windowDataInfoList);
const windowStatisticsInfoList = computed(() => lotteryStore.windowStatisticsInfoList);

function getWindowDataDisplay(enumKey: WindowLevelEnum): string {
  const info = windowDataInfoList.value.find(i => i.enumKey === enumKey);
  return info?.latestQiHao ?? '--';
}

function getStatisticsDisplay(enumKey: WindowLevelEnum): string {
  const info = windowStatisticsInfoList.value.find(i => i.enumKey === enumKey);
  return info?.latestQiHao ?? '--';
}

function getWindowDataColor(enumKey: WindowLevelEnum): 'red' | 'gray' | 'normal' {
  const display = getWindowDataDisplay(enumKey);
  if (display === '--') return 'gray';
  if (props.nextQiHao && display !== props.nextQiHao) return 'red';
  return 'normal';
}

function getStatisticsColor(enumKey: WindowLevelEnum): 'red' | 'gray' | 'normal' {
  const display = getStatisticsDisplay(enumKey);
  if (display === '--') return 'gray';
  if (props.currentQiHao && display !== props.currentQiHao) return 'red';
  return 'normal';
}

/**
 * 显示弹窗底部提示信息
 * @param msg 提示内容
 * @param type 提示类型
 */
function showMessage(msg: string, type: 'success' | 'error') {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 3000);
}

/**
 * 判断某个窗口是否需要更新统计数据
 * @param enumKey 窗口枚举类型
 * @returns true 表示统计数据为空或落后于当前开奖期号
 */
function needUpdateStatistics(enumKey: WindowLevelEnum): boolean {
  const display = getStatisticsDisplay(enumKey);
  if (display === '--') return true;
  return Boolean(props.currentQiHao && display !== props.currentQiHao);
}

/**
 * 判断某个窗口是否需要同步窗口数据
 * @param enumKey 窗口枚举类型
 * @returns true 表示窗口数据为空或落后于下一期期号
 */
function needUpdateWindowData(enumKey: WindowLevelEnum): boolean {
  const display = getWindowDataDisplay(enumKey);
  if (display === '--') return true;
  return Boolean(props.nextQiHao && display !== props.nextQiHao);
}

function getNeedUpdateStatistics(): WindowLevelEnum[] {
  return windowLevelList.map(item => item.key).filter(needUpdateStatistics);
}

function getNeedUpdateWindowData(): WindowLevelEnum[] {
  return windowLevelList.map(item => item.key).filter(needUpdateWindowData);
}

async function handleUpdateStatistics(enumKey: WindowLevelEnum) {
  loading.value = true;
  message.value = '';
  try {
    await lotteryStore.updateWindowStatistics(enumKey);
    showMessage(`${enumKey} 更新成功`, 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '更新失败', 'error');
  } finally {
    loading.value = false;
  }
}

async function handleBatchUpdateStatistics() {
  loading.value = true;
  message.value = '';

  let needUpdate = getNeedUpdateStatistics();
  if (needUpdate.length === 0) {
    needUpdate = windowLevelList.map(item => item.key);
  }

  try {
    for (const enumKey of needUpdate) {
      await lotteryStore.updateWindowStatistics(enumKey);
    }
    showMessage('全量更新成功', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '更新失败', 'error');
  } finally {
    loading.value = false;
  }
}

async function handleSync(enumKey: WindowLevelEnum) {
  const localQiHao = getWindowDataDisplay(enumKey);
  if (!localQiHao || localQiHao === '--') {
    showMessage('本地无窗口数据，请先初始化', 'error');
    return;
  }
  loading.value = true;
  message.value = '';
  try {
    const syncQiHaoCount = await lotteryStore.syncWindowDataByEnum(enumKey, localQiHao);
    const suffix = syncQiHaoCount > 0 ? `，新增/刷新${syncQiHaoCount}期` : '，无新增数据';
    showMessage(`${enumKey} 同步成功${suffix}`, 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '同步失败', 'error');
  } finally {
    loading.value = false;
  }
}

async function handleBatchSync() {
  loading.value = true;
  message.value = '';

  const needUpdate = getNeedUpdateWindowData();
  if (needUpdate.length === 0) {
    showMessage('所有窗口数据已是最新，无需同步', 'success');
    loading.value = false;
    return;
  }

  try {
    const skipped: string[] = [];
    const failed: string[] = [];
    let successCount = 0;
    let syncQiHaoTotal = 0;

    for (const enumKey of needUpdate) {
      const localQiHao = getWindowDataDisplay(enumKey);
      if (!localQiHao || localQiHao === '--') {
        skipped.push(enumKey);
        continue;
      }
      try {
        // 单个窗口同步失败不终止整批，避免一个窗口异常掩盖其他窗口的同步结果。
        syncQiHaoTotal += await lotteryStore.syncWindowDataByEnum(enumKey, localQiHao);
        successCount++;
      } catch {
        failed.push(enumKey);
      }
    }

    if (failed.length > 0) {
      showMessage(`同步完成：成功${successCount}个，跳过${skipped.length}个，失败${failed.length}个：${failed.join(',')}`, 'error');
      return;
    }

    if (skipped.length > 0) {
      showMessage(`同步完成：成功${successCount}个，跳过${skipped.length}个未初始化窗口，新增/刷新${syncQiHaoTotal}期`, 'success');
      return;
    }

    showMessage(`批量同步成功：窗口${successCount}个，新增/刷新${syncQiHaoTotal}期`, 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '批量同步失败', 'error');
  } finally {
    loading.value = false;
  }
}

async function handleInit(enumKey: WindowLevelEnum) {
  loading.value = true;
  message.value = '';
  try {
    await lotteryStore.initializeWindowData(enumKey);
    showMessage(`${enumKey} 初始化成功`, 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '初始化失败', 'error');
  } finally {
    loading.value = false;
  }
}

async function handleBatchInit() {
  loading.value = true;
  message.value = '';

  let needUpdate = getNeedUpdateWindowData();
  if (needUpdate.length === 0) {
    needUpdate = windowLevelList.map(item => item.key);
  }

  try {
    for (const enumKey of needUpdate) {
      await lotteryStore.initializeWindowData(enumKey);
    }
    showMessage('批量初始化成功', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '初始化失败', 'error');
  } finally {
    loading.value = false;
  }
}

async function handleClearLocalWindowData() {
  loading.value = true;
  message.value = '';
  try {
    await lotteryStore.clearLocalWindowData();
    showMessage('本地窗口数据已清空，可点击初始化重新拉取最近100期', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '清空本地窗口数据失败', 'error');
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  emit('update:visible', false);
}

watch(() => props.visible, async (val) => {
  if (val) {
    await lotteryStore.loadWindowDataInfoList();
    await lotteryStore.loadWindowStatisticsInfoList();
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: var(--bg-card);
  border-radius: 8px;
  width: 90%;
  max-width: 900px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--bg-secondary);
}

.modal-body {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid var(--bg-secondary);
  min-height: 40px;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
}
</style>
