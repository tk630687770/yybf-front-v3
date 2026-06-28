/**
 * Vue Router 路由配置
 * 配置页面路由和导航守卫
 */
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import WindowConsole from '../views/WindowConsole.vue';
import ModelDashboard from '../views/ModelDashboard.vue';
import HistoricalReplayLab from '../views/HistoricalReplayLab.vue';
import EntryRecallLab from '../views/EntryRecallLab.vue';
import BlueDecisionConsole from '../views/BlueDecisionConsole.vue';

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
    path: '/prediction-console',       // 实时预测台路径
    name: 'PredictionConsole',         // 实时预测台路由名称
    component: ModelDashboard,         // 复用模型页面组件，通过路由名称切换页面模式
    meta: { title: '实时预测台' }        // 页面标题
  },
  {
    path: '/snapshot-review',          // 快照复盘台路径
    name: 'SnapshotReview',            // 快照复盘台路由名称
    component: ModelDashboard,         // 复用模型页面组件，通过路由名称切换页面模式
    meta: { title: '快照复盘台' }       // 页面标题
  },
  {
    path: '/diagnostic-lab',           // 诊断研究台路径
    name: 'DiagnosticLab',             // 诊断研究台路由名称
    component: ModelDashboard,         // 复用模型页面组件，通过路由名称切换页面模式
    meta: { title: '诊断研究台' }       // 页面标题
  },
  {
    path: '/historical-replay-lab',        // 历史回放实验台路径
    name: 'HistoricalReplayLab',           // 历史回放实验台路由名称
    component: HistoricalReplayLab,        // 历史回放实验台组件
    meta: { title: '历史回放实验台' }       // 页面标题
  },
  {
    path: '/entry-recall-lab',             // 红球入口召回研究台路径
    name: 'EntryRecallLab',                 // 红球入口召回研究台路由名称
    component: EntryRecallLab,              // 红球入口召回专项独立页面
    meta: { title: '红球入口召回研究台' }    // 页面标题
  },
  {
    path: '/blue-decision-console',          // 蓝球决策台路径
    name: 'BlueDecisionConsole',             // 蓝球决策台路由名称
    component: BlueDecisionConsole,          // 蓝球窗口人工决策组件
    meta: { title: '蓝球决策台' }            // 页面标题
  },
  {
    path: '/model-dashboard',          // 旧模型结果台路径
    redirect: '/prediction-console'    // 兼容旧入口，默认进入实时预测台
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
