<template>
  <span v-if="ticket.redNumbers.length === 0">{{ ticketText || '--' }}</span>
  <TicketNumberText
    v-else
    :red-numbers="ticket.redNumbers"
    :blue-number="ticket.blueNumber"
    :actual-red-numbers="actualTicket.redNumbers"
    :actual-blue-number="actualTicket.blueNumber"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import TicketNumberText from './TicketNumberText.vue';

/**
 * 文本票面命中渲染组件。
 * @description 用于复盘趋势等只拿到票面文本的表格列，将命中的红球渲染为红色、命中的蓝球渲染为蓝色。
 */
const props = defineProps<{
  ticketText: string;
  actualTicketText: string;
}>();

/**
 * 从票面文本中解析红球和蓝球。
 * @description 兼容“01,02,03,04,05,06 + 07”和中文全角加号，避免表格只拿到文本时无法标色。
 * @param ticketText 票面文本
 * @returns 解析后的红球数组和蓝球
 */
function parseTicketText(ticketText?: string | null) {
  // 空文本返回空票面，调用处会展示原始占位。
  if (!ticketText) {
    return { redNumbers: [] as string[], blueNumber: '' };
  }

  // 按加号拆分红球区和蓝球区，同时兼容中文全角加号。
  const [redPart = '', bluePart = ''] = ticketText.split(/[+＋]/);
  // 只提取两位数字，避免逗号、空格和中文说明影响解析。
  const redNumbers = (redPart.match(/\d{2}/g) ?? []).slice(0, 6);
  // 蓝球优先取加号右侧；如果没有加号，则退回整段文本中的第七个两位数。
  const blueNumber = (bluePart.match(/\d{2}/g) ?? [])[0]
    ?? (ticketText.match(/\d{2}/g) ?? [])[6]
    ?? '';

  return { redNumbers, blueNumber };
}

// 解析预测票面和实际开奖票面，模板层只负责渲染。
const ticket = computed(() => parseTicketText(props.ticketText));
const actualTicket = computed(() => parseTicketText(props.actualTicketText));
</script>
