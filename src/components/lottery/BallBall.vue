<template>
  <!-- 单个球体展示组件 -->
  <!-- type: red-红球, blue-蓝球 -->
  <!-- number: 球号 -->
  <!-- size: sm-小, md-中, lg-大 -->
  <div
    :class="[
      'flex items-center justify-center rounded-full font-bold text-white',
      ballClass,
      sizeClass
    ]"
  >
    {{ displayNumber }}
  </div>
</template>

<script setup lang="ts">
/**
 * 球体展示组件
 * 用于展示双色球的红球或蓝球
 */
import { computed } from 'vue';

interface Props {
  number: string | number;  // 球号
  type: 'red' | 'blue';    // 球类型
  size?: 'sm' | 'md' | 'lg';  // 尺寸
}

const props = withDefaults(defineProps<Props>(), {
  type: 'red',
  size: 'md'
});

// 球号显示格式：小于10的补零
const displayNumber = computed(() => {
  const num = typeof props.number === 'string' ? parseInt(props.number) : props.number;
  if (isNaN(num)) return props.number;
  return num < 10 ? num.toString().padStart(2, '0') : num.toString();
});

// 根据类型选择样式
const ballClass = computed(() => {
  return props.type === 'red' ? 'bg-ball-red' : 'bg-ball-blue';
});

// 根据尺寸选择大小
const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-6 h-6 text-xs';
    case 'lg':
      return 'w-12 h-12 text-lg';
    default:
      return 'w-9 h-9 text-sm';
  }
});
</script>
