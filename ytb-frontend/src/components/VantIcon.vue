<template>
  <span class="vant-icon-wrapper">
    <i class="van-icon" :class="`van-icon-${name}`" :style="style"></i>
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  name: {
    type: String,
    required: true,
    default: 'question-o'
  },
  size: {
    type: [Number, String],
    default: ''
  },
  color: {
    type: String,
    default: ''
  }
});

const style = computed(() => {
  const styles = {};
  if (props.size) {
    styles.fontSize = isNaN(props.size) ? props.size : `${props.size}px`;
  }
  if (props.color) {
    styles.color = props.color;
  }
  return styles;
});
</script>

<style scoped>
.vant-icon-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.van-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: inherit;
  width: 1em;
  height: 1em;
  vertical-align: middle;
  color: currentColor;
}

/* 确保组件级样式优先级高于全局样式 */
:deep(.van-icon) {
  background-color: currentColor !important;
  mask-size: cover !important;
  -webkit-mask-size: cover !important;
}
</style> 