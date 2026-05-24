/**
 * 应用入口文件
 * 创建 Vue 应用并挂载到 DOM
 */
import { createApp } from 'vue';
// 引入 Pinia 状态管理
import { createPinia } from 'pinia';
// 引入路由配置
import router from './router';
// 引入根组件
import App from './App.vue';
// 引入全局样式（包含 Tailwind CSS）
import './style.css';

// 创建 Vue 应用实例
const app = createApp(App);

// 注册 Pinia 状态管理插件
app.use(createPinia());

// 注册路由插件
app.use(router);

// 将应用挂载到 #app 元素
app.mount('#app');
