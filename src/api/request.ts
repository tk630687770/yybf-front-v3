/**
 * Axios 请求封装
 * 提供统一的请求拦截、响应拦截和错误处理
 */
import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * 通用 API 响应结构
 * 后端返回的数据结构应遵循此格式
 */
interface ApiResponse<T> {
  code: number;      // 状态码，0表示成功
  data: T;          // 响应数据
  msg: string;      // 响应消息
}

/**
 * 创建 Axios 实例
 * 配置默认的 baseURL 和超时时间
 */
function createRequest() {
  // 创建 Axios 实例，配置基础 URL 和超时时间
  const instance: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',  // 从环境变量读取 API 基础地址
    timeout: 60000,  // 请求超时时间 60 秒
    headers: {
      'Content-Type': 'application/json'  // 默认 JSON 格式
    }
  });

  // 请求拦截器：在请求发送前处理
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // 可以在这里添加 token、loading 等
      return config;
    },
    (error) => {
      // 请求错误处理
      return Promise.reject(error);
    }
  );

  // 响应拦截器：在响应返回后处理
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // 返回 response.data，即后端的业务数据
      return response.data;
    },
    (error) => {
      // 响应错误处理
      return Promise.reject(error);
    }
  );

  return instance;
}

// 导出创建好的请求实例
export const request = createRequest();

// 导出 ApiResponse 类型供其他模块使用
export type { ApiResponse };
