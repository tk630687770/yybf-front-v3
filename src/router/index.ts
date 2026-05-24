/**
 * Vue Router 路由配置
 * 配置页面路由和导航守卫
 */
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import WindowConsole from '../views/WindowConsole.vue';
import ModelDashboard from '../views/ModelDashboard.vue';

/**
 * 路由配置数组
 * 定义所有页面的路由规则
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',                 // 默认入口路径
    redirect: '/window-console' // 默认进入基础窗口操作台
  },
  {
    path: '/window-console',       // 基础窗口操作台路径
    name: 'WindowConsole',         // 基础窗口操作台路由名称
    component: WindowConsole,      // 基础窗口操作台组件
    meta: { title: '基础窗口操作台' } // 页面标题
  },
  {
    path: '/model-dashboard',          // 模型预测/诊断结果台路径
    name: 'ModelDashboard',            // 模型预测/诊断结果台路由名称
    component: ModelDashboard,         // 模型预测/诊断结果台组件
    meta: { title: '模型预测/诊断结果台' } // 页面标题
  }
];

/**
 * 创建路由实例
 * 使用 HTML5 History 模式
 */
const router = createRouter({
  history: createWebHistory(),
  routes
});

/**
 * 路由前置守卫
 * 每次路由切换前执行，用于设置页面标题等
 */
router.beforeEach((to) => {
  // 如果路由有自定义标题，则设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }
  // 返回 true 表示继续执行路由切换，避免使用已废弃的 next 回调写法。
  return true;
});

// 导出路由实例
export default router;
