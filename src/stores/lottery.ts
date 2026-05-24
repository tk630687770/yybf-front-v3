/**
 * Pinia 彩票状态管理
 * 管理全局的彩票相关状态
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { DrawRecord, SyncState, WindowLevelEnum, WindowDataInfo, WindowStatisticsInfo, WindowLevelEnumItem, WindowLevelStatistics, WindowRecord } from '../types';
import { getDrawDataAfter, getAllWindowData, syncWindowData, getWindowLevelStatistics } from '@/api/modules/lottery';
import { db } from '@/composables/useDatabase';

/**
 * 窗口等级枚举项列表
 */
export const windowLevelList: WindowLevelEnumItem[] = [
  { key: 'RED_NUMBER_10', label: '红球10窗口', category: 'RED_NUMBER' },
  { key: 'RED_NUMBER_20', label: '红球20窗口', category: 'RED_NUMBER' },
  { key: 'RED_NUMBER_33', label: '红球33窗口', category: 'RED_NUMBER' },
  { key: 'RED_TAIL_10', label: '红尾10窗口', category: 'RED_TAIL' },
  { key: 'RED_TAIL_20', label: '红尾20窗口', category: 'RED_TAIL' },
  { key: 'RED_TAIL_33', label: '红尾33窗口', category: 'RED_TAIL' },
  { key: 'BLUE_NUMBER_10', label: '蓝球10窗口', category: 'BLUE_NUMBER' },
  { key: 'BLUE_NUMBER_16', label: '蓝球16窗口', category: 'BLUE_NUMBER' },
  { key: 'BLUE_NUMBER_32', label: '蓝球32窗口', category: 'BLUE_NUMBER' },
  { key: 'BLUE_TAIL_10', label: '蓝尾10窗口', category: 'BLUE_TAIL' },
  { key: 'BLUE_TAIL_16', label: '蓝尾16窗口', category: 'BLUE_TAIL' },
  { key: 'BLUE_TAIL_32', label: '蓝尾32窗口', category: 'BLUE_TAIL' }
];

/**
 * 彩票 Store
 * 使用组合式 API 风格定义
 */
export const useLotteryStore = defineStore('lottery', () => {
  // 开奖记录列表
  const drawRecords = ref<DrawRecord[]>([]);
  // 最新一期开奖信息
  const latestDraw = ref<DrawRecord | null>(null);
  // 数据同步状态
  const syncStatus = ref<SyncState>({
    lastSyncTime: null,
    status: 'idle'
  });
  // 窗口数据状态列表
  const windowDataInfoList = ref<WindowDataInfo[]>([]);
  // 窗口统计数据状态列表
  const windowStatisticsInfoList = ref<WindowStatisticsInfo[]>([]);

  /**
   * 从本地数据库获取最新一期开奖记录
   */
  async function loadLatestFromDB(): Promise<void> {
    const record = await db.getLatestDrawRecord();
    if (record) {
      latestDraw.value = record;
    }
  }

  /**
   * 从本地数据库加载所有开奖记录到内存
   */
  async function loadAllFromDB(): Promise<void> {
    const records = await db.getAllDrawRecords();
    drawRecords.value = records;
    if (records.length > 0) {
      latestDraw.value = records[records.length - 1];
    }
  }

  /**
   * 加载窗口数据状态列表
   */
  async function loadWindowDataInfoList(): Promise<void> {
    const metas = await db.getAllWindowDataMeta();
    const list: WindowDataInfo[] = windowLevelList.map(item => {
      const meta = metas.find(m => m.enumKey === item.key);
      return {
        enumKey: item.key,
        label: meta?.label ?? item.label,
        latestQiHao: meta?.latestQiHao ?? null
      };
    });
    windowDataInfoList.value = list;
  }

  /**
   * 加载窗口统计数据状态列表
   */
  async function loadWindowStatisticsInfoList(): Promise<void> {
    const list: WindowStatisticsInfo[] = [];
    for (const item of windowLevelList) {
      const latestQiHao = await db.getWindowStatisticsLatestQiHao(item.key);
      list.push({
        enumKey: item.key,
        latestQiHao
      });
    }
    windowStatisticsInfoList.value = list;
  }

  /**
   * 获取窗口统计数据
   */
  async function getWindowStatistics(enumKey: WindowLevelEnum): Promise<WindowLevelStatistics[]> {
    return await db.getWindowStatistics(enumKey);
  }

  /**
   * 获取指定枚举和期号的窗口数据
   */
  async function getWindowDataByQiHao(enumKey: WindowLevelEnum, qiHao: string): Promise<WindowRecord[]> {
    return await db.getWindowDataByQiHao(enumKey, qiHao);
  }

  /**
   * 刷新数据
   * 从本地数据库获取最新一期期号，传入接口获取增量数据
   * 增量更新期号列表
   */
  async function refreshDrawData(): Promise<void> {
    syncStatus.value = { ...syncStatus.value, status: 'syncing' };
    try {
      const latestRecord = await db.getLatestDrawRecord();
      const qiHao = latestRecord?.qiHao;
      const res = await getDrawDataAfter(qiHao);
      if (res.code !== 200) {
        throw new Error(res.msg || '刷新失败');
      }
      if (res.data.length > 0) {
        await db.addDrawRecords(res.data);
        const qiHaoList = res.data.map(record => record.qiHao);
        await db.bulkAddQiHaoList(qiHaoList);
        await loadAllFromDB();
      }
      syncStatus.value = {
        lastSyncTime: Date.now(),
        status: 'success'
      };
    } catch (err) {
      syncStatus.value = { ...syncStatus.value, status: 'error' };
      throw err;
    }
  }

  /**
   * 初始化数据
   * 清空本地数据，从接口获取全量数据并保存
   * 全量更新期号列表
   */
  async function initializeDrawData(): Promise<void> {
    syncStatus.value = { ...syncStatus.value, status: 'syncing' };
    try {
      const res = await getDrawDataAfter();
      if (res.code !== 200) {
        throw new Error(res.msg || '初始化失败');
      }
      await db.clearAllDrawRecords();
      await db.clearAllQiHaoList();
      if (res.data.length > 0) {
        await db.addDrawRecords(res.data);
        const qiHaoList = res.data.map(record => record.qiHao);
        await db.bulkAddQiHaoList(qiHaoList);
      }
      await loadAllFromDB();
      syncStatus.value = {
        lastSyncTime: Date.now(),
        status: 'success'
      };
    } catch (err) {
      syncStatus.value = { ...syncStatus.value, status: 'error' };
      throw err;
    }
  }

  /**
   * 初始化窗口数据（全量）
   */
  async function initializeWindowData(enumKey: WindowLevelEnum): Promise<void> {
    // 本地初始化只读取后端已有窗口数据，不触发后端重建窗口表。
    await loadWindowData(enumKey);
  }

  /**
   * 加载窗口数据（从数据库）
   */
  async function loadWindowData(enumKey: WindowLevelEnum): Promise<void> {
    const res = await getAllWindowData(enumKey, 100);
    if (res.code !== 200) {
      throw new Error(res.msg || '获取窗口数据失败');
    }
    await db.clearWindowData(enumKey);
    if (Object.keys(res.data).length > 0) {
      const item = windowLevelList.find(w => w.key === enumKey);
      const label = item?.label ?? '';
      await db.saveWindowData(enumKey, res.data, label);
    }
    await loadWindowDataInfoList();
  }

  /**
   * 同步窗口数据
   * @param enumKey 窗口枚举类型
   * @param qiHao 本地已缓存的最新窗口期号
   * @returns 本次从后端返回并写入本地缓存的期号数量
   */
  async function syncWindowDataByEnum(enumKey: WindowLevelEnum, qiHao: string): Promise<number> {
    const res = await syncWindowData(enumKey, qiHao);
    if (res.code !== 200) {
      throw new Error(res.msg || '同步窗口数据失败');
    }
    // 后端在没有新增窗口数据时可能返回 null，这里统一当作“空增量”处理。
    const data = res.data ?? {};
    const syncQiHaoCount = Object.keys(data).length;
    if (syncQiHaoCount > 0) {
      const item = windowLevelList.find(w => w.key === enumKey);
      const label = item?.label ?? '';
      await db.saveWindowData(enumKey, data, label);
    }
    await loadWindowDataInfoList();
    return syncQiHaoCount;
  }

  /**
   * 清空本地窗口数据
   */
  async function clearLocalWindowData(): Promise<void> {
    await db.clearAllWindowData();
    await loadWindowDataInfoList();
  }

  /**
   * 更新窗口统计数据
   */
  async function updateWindowStatistics(enumKey: WindowLevelEnum): Promise<void> {
    const res = await getWindowLevelStatistics(enumKey);
    if (res.code !== 200) {
      throw new Error(res.msg || '获取窗口统计数据失败');
    }
    if (res.data.length > 0) {
      const latestRecord = await db.getLatestDrawRecord();
      const latestQiHao = latestRecord?.qiHao || '';
      await db.saveWindowStatistics(enumKey, res.data, latestQiHao);
    }
    await loadWindowStatisticsInfoList();
  }

  /**
   * 设置同步状态
   */
  function setSyncStatus(status: SyncState) {
    syncStatus.value = status;
  }

  return {
    drawRecords,
    latestDraw,
    syncStatus,
    windowDataInfoList,
    windowStatisticsInfoList,
    loadLatestFromDB,
    loadAllFromDB,
    loadWindowDataInfoList,
    loadWindowStatisticsInfoList,
    getWindowStatistics,
    getWindowDataByQiHao,
    refreshDrawData,
    initializeDrawData,
    initializeWindowData,
    loadWindowData,
    syncWindowDataByEnum,
    clearLocalWindowData,
    updateWindowStatistics,
    setSyncStatus
  };
});
