/**
 * IndexedDB 数据库封装
 * 使用 Dexie.js 简化 IndexedDB 操作
 * 数据库名称：ssqDB
 */
import Dexie, { type Table } from 'dexie';
import type { DrawRecord, MyNumber, QiHaoListRecord, WindowLevelEnum, WindowRecord, WindowLevelStatistics } from '../types';

/**
 * 窗口数据存储记录
 * 包含枚举类型、期号和具体数据
 */
interface WindowDataRecord {
  id: string;              // 主键：enumKey_qiHao_red
  enumKey: WindowLevelEnum; // 枚举类型
  qiHao: string;           // 期号
  data: WindowRecord;       // 窗口数据
}

/**
 * 窗口统计数据存储记录
 */
interface WindowStatisticsRecord {
  id: string;                        // 主键：enumKey
  enumKey: WindowLevelEnum;          // 枚举类型
  latestQiHao: string | null;        // 最新期号
  data: WindowLevelStatistics[];      // 统计数据
}

/**
 * 窗口数据元信息
 * 记录每个枚举的最新期号和中文名称
 */
interface WindowDataMeta {
  enumKey: WindowLevelEnum;     // 枚举类型
  label: string;                // 中文名称
  latestQiHao: string | null;   // 最新期号
}

/**
 * 彩票数据库类
 * 继承自 Dexie，封装所有数据库操作
 */
class LotteryDatabase extends Dexie {
  // 表声明：TypeScript 用于类型检查
  drawRecords!: Table<DrawRecord, string>;      // 开奖记录表，主键为 qiHao
  myNumbers!: Table<MyNumber, number>;          // 用户方案表，主键为自增 id
  windowData!: Table<WindowDataRecord, string>; // 窗口数据表，主键为 id
  windowStatistics!: Table<WindowStatisticsRecord, string>; // 窗口统计数据表
  windowDataMeta!: Table<WindowDataMeta, string>; // 窗口数据元信息表
  allQihaoList!: Table<QiHaoListRecord, string>; // 期号列表表，主键为 qiHao

  constructor() {
    // 调用父类构造函数，指定数据库名称
    super('ssqDB');
    // 定义数据库表结构和索引
    this.version(5).stores({
      drawRecords: 'qiHao',
      myNumbers: '++id, createdAt',
      windowData: 'id, enumKey, qiHao',
      windowStatistics: 'id, enumKey',
      windowDataMeta: 'enumKey',
      allQihaoList: 'qiHao'
    });
  }

  /**
   * 获取最新一期的开奖记录
   */
  async getLatestDrawRecord(): Promise<DrawRecord | undefined> {
    return this.drawRecords.orderBy('qiHao').last();
  }

  /**
   * 根据期号获取开奖记录
   */
  async getDrawRecordByQiHao(qiHao: string): Promise<DrawRecord | undefined> {
    return this.drawRecords.get(qiHao);
  }

  /**
   * 批量添加开奖记录
   */
  async addDrawRecords(records: DrawRecord[]): Promise<void> {
    await this.drawRecords.bulkAdd(records);
  }

  /**
   * 获取所有开奖记录
   */
  async getAllDrawRecords(): Promise<DrawRecord[]> {
    return this.drawRecords.orderBy('qiHao').toArray();
  }

  /**
   * 清空所有开奖记录
   */
  async clearAllDrawRecords(): Promise<void> {
    await this.drawRecords.clear();
  }

  /**
   * 添加用户选号方案
   */
  async addMyNumber(item: MyNumber): Promise<number> {
    return this.myNumbers.add(item);
  }

  /**
   * 更新用户选号方案
   */
  async updateMyNumber(id: number, item: Partial<MyNumber>): Promise<number> {
    return this.myNumbers.update(id, item);
  }

  /**
   * 删除用户选号方案
   */
  async deleteMyNumber(id: number): Promise<void> {
    await this.myNumbers.delete(id);
  }

  /**
   * 获取所有用户方案
   */
  async getAllMyNumbers(): Promise<MyNumber[]> {
    return this.myNumbers.orderBy('createdAt').reverse().toArray();
  }

  /**
   * 获取窗口数据的最新期号
   */
  async getWindowDataLatestQiHao(enumKey: WindowLevelEnum): Promise<string | null> {
    const meta = await this.windowDataMeta.get(enumKey);
    return meta?.latestQiHao ?? null;
  }

  /**
   * 批量保存窗口数据
   * @param enumKey 枚举类型
   * @param data 以期号为key的窗口数据映射
   * @param label 中文名称
   */
  async saveWindowData(enumKey: WindowLevelEnum, data: Record<string, WindowRecord[]>, label: string): Promise<void> {
    const records: WindowDataRecord[] = [];
    let latestQiHao: string | null = null;

    for (const [qiHao, items] of Object.entries(data)) {
      if (!latestQiHao || qiHao > latestQiHao) {
        latestQiHao = qiHao;
      }
      for (const item of items) {
        records.push({
          id: `${enumKey}_${qiHao}_${item.number}`,
          enumKey,
          qiHao,
          data: item
        });
      }
    }

    if (records.length > 0) {
      await this.windowData.bulkPut(records);
      await this.windowDataMeta.put({ enumKey, label, latestQiHao });
    }
  }

  /**
   * 清空指定枚举的窗口数据
   */
  async clearWindowData(enumKey: WindowLevelEnum): Promise<void> {
    const existing = await this.windowDataMeta.get(enumKey);
    await this.windowData.where('enumKey').equals(enumKey).delete();
    await this.windowDataMeta.put({ enumKey, label: existing?.label ?? '', latestQiHao: null });
  }

  /**
   * 清空所有窗口数据
   */
  async clearAllWindowData(): Promise<void> {
    await this.windowData.clear();
    await this.windowDataMeta.clear();
  }

  /**
   * 保存窗口统计数据
   */
  async saveWindowStatistics(enumKey: WindowLevelEnum, data: WindowLevelStatistics[], latestQiHao: string): Promise<void> {
    await this.windowStatistics.put({
      id: enumKey,
      enumKey,
      latestQiHao,
      data
    });
  }

  /**
   * 获取窗口统计数据的最新期号
   */
  async getWindowStatisticsLatestQiHao(enumKey: WindowLevelEnum): Promise<string | null> {
    const record = await this.windowStatistics.get(enumKey);
    return record?.latestQiHao ?? null;
  }

  /**
   * 获取窗口统计数据
   */
  async getWindowStatistics(enumKey: WindowLevelEnum): Promise<WindowLevelStatistics[]> {
    const record = await this.windowStatistics.get(enumKey);
    return record?.data ?? [];
  }

  /**
   * 清空所有窗口统计数据
   */
  async clearAllWindowStatistics(): Promise<void> {
    await this.windowStatistics.clear();
  }

  /**
   * 获取所有窗口数据元信息
   */
  async getAllWindowDataMeta(): Promise<WindowDataMeta[]> {
    return this.windowDataMeta.toArray();
  }

  /**
   * 获取指定枚举和期号的窗口数据
   */
  async getWindowDataByQiHao(enumKey: WindowLevelEnum, qiHao: string): Promise<WindowRecord[]> {
    const records = await this.windowData
      .where('enumKey').equals(enumKey)
      .filter(record => record.qiHao === qiHao)
      .toArray();
    return records.map(r => r.data);
  }

  /**
   * 获取所有期号列表
   * 按期号升序排列（字符串排序=时间排序）
   */
  async getAllQiHaoList(): Promise<string[]> {
    return this.allQihaoList.orderBy('qiHao').toArray().then(list => list.map(item => item.qiHao));
  }

  /**
   * 清空所有期号列表
   */
  async clearAllQiHaoList(): Promise<void> {
    await this.allQihaoList.clear();
  }

  /**
   * 批量添加期号到列表
   * 用于初始化（全量）和刷新（增量）
   * @param qiHaoList 期号数组
   */
  async bulkAddQiHaoList(qiHaoList: string[]): Promise<void> {
    if (qiHaoList.length === 0) return;
    const records: QiHaoListRecord[] = qiHaoList.map(qiHao => ({ qiHao }));
    await this.allQihaoList.bulkAdd(records);
  }
}

// 导出数据库单例
export const db = new LotteryDatabase();
