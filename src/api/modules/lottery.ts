/**
 * 彩票相关接口封装
 * 包含期号、开奖记录、窗口数据等接口
 */
import { request } from '../request';
import type { ApiResponse } from '../request';
import type { DrawRecord, WindowRecord, WindowLevelEnum, WindowLevelStatistics } from '../../types';

/**
 * 获取所有期号列表
 * @returns 期号字符串数组，如 ["2003001","2003002",...]
 */
export async function getAllQiHao(): Promise<ApiResponse<string[]>> {
  return request.get('/ssq/lottery/get/qiHao');
}

/**
 * 获取指定期号之后的所有开奖信息
 * @param qiHao 期号，不传则返回所有期数据
 * @returns 开奖记录数组
 */
export async function getDrawDataAfter(qiHao?: string): Promise<ApiResponse<DrawRecord[]>> {
  return request.get('/vi/ssq/lottery/get/data/after/qiHao', {
    params: { qiHao: qiHao ?? '' }
  });
}

/**
 * 初始化每期指定窗口等级的数据
 * @param windowLevelEnum 窗口等级枚举
 * @returns 初始化是否成功
 */
export async function initWindowData(windowLevelEnum: WindowLevelEnum): Promise<ApiResponse<boolean>> {
  return request.get('/common/window/init', {
    params: { windowLevelEnum }
  });
}

/**
 * 获取所有每期指定窗口等级的数据
 * @param windowLevelEnum 窗口等级枚举
 * @param limit 最近期数，默认由后端限制为100期
 * @returns 以期号为key的窗口数据映射
 */
export async function getAllWindowData(windowLevelEnum: WindowLevelEnum, limit?: number): Promise<ApiResponse<Record<string, WindowRecord[]>>> {
  return request.get('/common/window/getAll', {
    params: { windowLevelEnum, limit }
  });
}

/**
 * 获取最新指定窗口等级的红球等级统计
 * @param windowLevelEnum 窗口等级枚举
 * @returns 窗口等级统计数据
 */
export async function getWindowLevelStatistics(windowLevelEnum: WindowLevelEnum): Promise<ApiResponse<WindowLevelStatistics[]>> {
  return request.get('/common/window/statistics/level', {
    params: { windowLevelEnum }
  });
}

/**
 * 同步未储存的指定窗口等级的红球数据
 * @param windowLevelEnum 窗口等级枚举
 * @param qiHao 期号，返回该期号的最新数据及之后未存储的数据
 * @returns 以期号为key的窗口数据映射
 */
export async function syncWindowData(windowLevelEnum: WindowLevelEnum, qiHao: string): Promise<ApiResponse<Record<string, WindowRecord[]>>> {
  return request.get('/common/window/sync', {
    params: { windowLevelEnum, qiHao }
  });
}
