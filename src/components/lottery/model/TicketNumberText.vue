<template>
  <span class="ticket-number-text">
    <template v-for="(number, index) in redNumbers" :key="`${number}-${index}`">
      <span
        :class="[
          'ticket-number',
          'ticket-red-number',
          actualRedNumbers?.includes(number) ? 'ticket-hit-red' : ''
        ]"
      >
        {{ number }}
      </span>
      <span v-if="index < redNumbers.length - 1" class="ticket-separator">,</span>
    </template>
    <span class="ticket-plus"> + </span>
    <span
      :class="[
        'ticket-number',
        'ticket-blue-number',
        actualBlueNumber && blueNumber === actualBlueNumber ? 'ticket-hit-blue' : ''
      ]"
    >
      {{ blueNumber || '--' }}
    </span>
  </span>
</template>

<script setup lang="ts">
/**
 * 完整票面号码渲染组件。
 * @description 开奖后直接在原票面上标色：命中红球显示红色，命中蓝球显示蓝色。
 */
defineProps<{
  redNumbers: string[];
  blueNumber: string;
  actualRedNumbers?: string[];
  actualBlueNumber?: string;
}>();
</script>
