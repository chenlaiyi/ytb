<template>
  <component 
    :is="iconComponent" 
    v-if="iconComponent" 
    :size="size" 
    :color="color"
    class="el-icon-component"
  />
  <i v-else :class="iconClass" :style="iconStyle"></i>
</template>

<script setup>
import { computed } from 'vue';
import { getElementIcon } from '../utils/iconHelper';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

const props = defineProps({
  // 图标名称
  name: {
    type: String,
    required: true
  },
  // 图标大小
  size: {
    type: [Number, String],
    default: ''
  },
  // 图标颜色
  color: {
    type: String,
    default: ''
  }
});

// 计算图标组件
const iconComponent = computed(() => {
  // 如果是直接的组件名称
  if (ElementPlusIconsVue[props.name]) {
    return ElementPlusIconsVue[props.name];
  }
  
  // 尝试使用帮助工具获取图标
  return getElementIcon(props.name);
});

// 计算图标类名（用于回退）
const iconClass = computed(() => {
  if (props.name.startsWith('el-icon-')) {
    return props.name;
  }
  return `el-icon-${props.name}`;
});

// 计算图标样式
const iconStyle = computed(() => {
  const style = {};
  
  if (props.size) {
    style.fontSize = isNaN(props.size) ? props.size : `${props.size}px`;
  }
  
  if (props.color) {
    style.color = props.color;
  }
  
  return style;
});
</script>

<style scoped>
.el-icon-component {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}

i {
  font-style: normal;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
