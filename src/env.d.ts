/**
 * Vite 环境变量类型定义
 * 用于 TypeScript 类型检查
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
