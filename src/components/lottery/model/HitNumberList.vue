<template>
  <span v-if="numbers.length === 0">--</span>
  <span v-else class="ticket-number-text">
    <template v-for="(number, index) in numbers" :key="`${number}-${index}`">
      <span
        :class="[
          'ticket-number',
          kind === 'red' ? 'ticket-red-number' : 'ticket-blue-number',
          hitClass(number)
        ]"
      >
        {{ number }}
      </span>
      <span v-if="index < numbers.length - 1" class="ticket-separator">,</span>
    </template>
  </span>
</template>

<script setup lang="ts">
/**
 * 单色号码列表渲染组件。
 * @description 用于红球观察池、胆候选、蓝球候选榜等非完整票面的号码标色。
 */
const props = defineProps<{
  numbers: string[];
  kind: 'red' | 'blue';
  actualRedNumbers?: string[];
  actualBlueNumber?: string;
}>();

/**
 * 根据实际开奖判断当前号码是否命中。
 * @param number 待渲染号码
 * @returns 命中标色 class
 */
function hitClass(number: string) {
  if (props.kind === 'red') {
    return props.actualRedNumbers?.includes(number) ? 'ticket-hit-red' : '';
  }
  return props.actualBlueNumber === number ? 'ticket-hit-blue' : '';
}
</script>
