<template>
  <van-nav-bar
    :title="title"
    :left-arrow="shouldShowBackButton"
    :left-text="leftText"
    :fixed="fixed"
    :placeholder="placeholder"
    :safe-area-inset-top="safeAreaInsetTop"
    :z-index="zIndex"
    :border="border"
    class="nav-header"
    @click-left="handleBack"
  >
    <!-- 右侧插槽 -->
    <template #right v-if="$slots.right">
      <slot name="right"></slot>
    </template>
    
    <!-- 左侧插槽 -->
    <template #left v-if="$slots.left">
      <slot name="left"></slot>
    </template>
    
    <!-- 标题插槽 -->
    <template #title v-if="$slots.title">
      <slot name="title"></slot>
    </template>
  </van-nav-bar>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  showBackButton: {
    type: Boolean,
    default: true
  },
  leftText: {
    type: String,
    default: ''
  },
  fixed: {
    type: Boolean,
    default: true
  },
  placeholder: {
    type: Boolean,
    default: true
  },
  safeAreaInsetTop: {
    type: Boolean,
    default: true
  },
  zIndex: {
    type: [Number, String],
    default: 100
  },
  border: {
    type: Boolean,
    default: true
  },
  customBack: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['back'])

const router = useRouter()
const route = useRoute()

// 根据当前路由判断是否显示返回按钮
const shouldShowBackButton = computed(() => {
  // 如果明确设置不显示返回按钮，则不显示
  if (props.showBackButton === false) return false
  
  // 主页面不显示返回按钮
  const mainPages = ['/', '/home', '/device', '/water-point', '/merchant', '/user', '/dashboard']
  const currentPath = route.path
  
  // 检查是否为主页面
  if (mainPages.includes(currentPath)) {
    return false
  }
  
  // 其他页面默认显示返回按钮
  return true
})

const handleBack = () => {
  if (props.customBack) {
    props.customBack()
  } else {
    emit('back')
    // 如果没有自定义返回逻辑，使用默认的返回操作
    if (window.history.length > 1) {
      router.back()
    } else {
      // 如果没有历史记录，跳转到首页
      router.push('/')
    }
  }
}
</script>

<style scoped>
.nav-header {
  /* 确保导航栏样式一致 */
  --van-nav-bar-background-color: var(--primary-color, #1989fa);
  --van-nav-bar-title-text-color: #fff;
  --van-nav-bar-icon-color: #fff;
  --van-nav-bar-text-color: #fff;
  --van-nav-bar-height: 46px;
}

/* 自定义导航栏样式 */
:deep(.van-nav-bar) {
  background: var(--van-nav-bar-background-color);
}

:deep(.van-nav-bar__title) {
  color: var(--van-nav-bar-title-text-color);
  font-weight: 500;
  font-size: 17px;
}

:deep(.van-nav-bar__left) {
  color: var(--van-nav-bar-text-color);
}

:deep(.van-nav-bar__right) {
  color: var(--van-nav-bar-text-color);
}

:deep(.van-nav-bar__arrow) {
  color: var(--van-nav-bar-icon-color);
}

/* 确保图标可见性 */
:deep(.van-icon) {
  display: inline-block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

/* 返回按钮样式增强 */
:deep(.van-nav-bar__left) {
  display: flex !important;
  align-items: center !important;
  padding-left: 16px;
}

:deep(.van-nav-bar__arrow) {
  font-size: 16px !important;
  margin-right: 4px;
}

/* 针对不同主题的导航栏样式 */
.nav-header.theme-gradient {
  --van-nav-bar-background-color: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.nav-header.theme-dark {
  --van-nav-bar-background-color: #2c3e50;
}

.nav-header.theme-light {
  --van-nav-bar-background-color: #fff;
  --van-nav-bar-title-text-color: #323233;
  --van-nav-bar-icon-color: #323233;
  --van-nav-bar-text-color: #323233;
}

.nav-header.theme-transparent {
  --van-nav-bar-background-color: transparent;
}
</style>