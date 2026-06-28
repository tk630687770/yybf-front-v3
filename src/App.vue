<template>
  <!-- 根容器，设置全屏背景色和文字颜色 -->
  <div class="min-h-screen bg-bg-primary text-text-primary">
    <!-- 顶部模块导航，用于区分基础窗口、预测、复盘和诊断研究台 -->
    <header class="sticky top-0 z-50 bg-bg-card border-b border-bg-secondary">
      <div class="px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-sm font-bold text-text-primary">双色球窗口动力系统</div>
          <div class="text-[11px] text-text-secondary">窗口观察与模型预测分离展示</div>
        </div>
        <nav class="flex items-center gap-2 text-xs">
          <RouterLink
            to="/window-console"
            class="nav-link"
            active-class="nav-link-active"
          >
            基础窗口操作台
          </RouterLink>
          <RouterLink
            to="/prediction-console"
            class="nav-link"
            active-class="nav-link-active"
          >
            实时预测台
          </RouterLink>
          <RouterLink
            to="/snapshot-review"
            class="nav-link"
            active-class="nav-link-active"
          >
            快照复盘台
          </RouterLink>
          <RouterLink
            to="/diagnostic-lab"
            class="nav-link"
            active-class="nav-link-active"
          >
            诊断研究台
          </RouterLink>
          <RouterLink
            to="/historical-replay-lab"
            class="nav-link"
            active-class="nav-link-active"
          >
            历史回放实验台
          </RouterLink>
          <RouterLink
            to="/entry-recall-lab"
            class="nav-link"
            active-class="nav-link-active"
          >
            入口召回研究台
          </RouterLink>
          <RouterLink
            to="/blue-decision-console"
            class="nav-link"
            active-class="nav-link-active"
          >
            蓝球决策台
          </RouterLink>
        </nav>
      </div>
    </header>

    <!-- 路由视图，使用 KeepAlive 缓存组件状态 -->
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script setup lang="ts">
/**
 * 根组件
 * 作为所有页面的顶层容器
 * 配置了 KeepAlive 实现页面状态缓存
 */
</script>

<style scoped>
.nav-link {
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--color-text-secondary);
  background: rgba(22, 33, 62, 0.5);
  transition: color 0.2s, background 0.2s;
}

.nav-link:hover {
  color: var(--color-text-primary);
  background: rgba(233, 69, 96, 0.35);
}

.nav-link-active {
  color: #ffffff;
  background: var(--color-accent);
}
</style>
