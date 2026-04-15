<script setup>
import { watch, onMounted, ref, provide, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from './stores/app'
import { useUserStore } from './stores/user'
import TabBar from './components/TabBar.vue'
import BranchTabBar from './components/BranchTabBar.vue'
import { setShareMetadata, isWechatBrowser, setupWechatShare } from './utils/share'

// 本地状态
const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()
const appLoading = ref(true)

// 设置适配移动设备视口
const setViewport = () => {
  // 根据设备宽度设置视口
  const htmlEl = document.documentElement
  const bodyEl = document.body
  
  // 禁止缩放
  const metaEl = document.querySelector('meta[name="viewport"]')
  if (metaEl) {
    metaEl.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
  }
  
  // 设置body样式
  bodyEl.style.minHeight = '100vh'
  bodyEl.style.margin = '0'
  bodyEl.style.padding = '0'
  bodyEl.style.background = '#f7f8fa'
  bodyEl.style.fontFamily = 'PingFang SC, Helvetica Neue, Helvetica, Arial, sans-serif'
  
  // 防止iOS Safari上下回弹
  document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) {
      e.preventDefault()
    }
  }, { passive: false })
}

// 延迟隐藏加载状态
const hideLoading = () => {
  setTimeout(() => {
    appLoading.value = false
  }, 300)
}

// 提供全局加载状态
provide('appLoading', appLoading)

// 更新分享元数据和微信分享配置
const updateShareMetadata = (title) => {
  const shareTitle = title || '点点够APP'
  const shareSubtitle = route.meta.shareSubtitle || '每天进步一点点，实现富而喜悦人生。'
      const shareLogo = route.meta.shareLogo || 'https://pay.itapgo.com/images/logo.png'
  
  // 设置通用的分享元数据
  setShareMetadata({
    title: shareTitle,
    subtitle: shareSubtitle,
    logo: shareLogo
  })
  
  // 如果在微信环境中，直接配置微信分享
  if (isWechatBrowser()) {
    try {
      setupWechatShare({
        title: shareTitle,
        desc: shareSubtitle,
        imgUrl: shareLogo
      })
    } catch (error) {
      // 静默处理权限验证中的错误
      if (error && (
        (error.message && (error.message.includes('offline verifying') || error.message.includes('permission'))) || 
        (error.errMsg && (error.errMsg.includes('offline verifying') || error.errMsg.includes('permission')))
      )) {
        // 生产环境关闭日志
      } else {
        // 生产环境关闭日志
      }
    }
  }
}

// 初始化页面设置
onMounted(() => {
  setViewport()
  hideLoading()
  // 设置标题
  const title = route.meta.title || '点点够App'
  document.title = title
  appStore.setTitle(title)
  // 设置初始分享元数据
  updateShareMetadata(title)
})

// 监听路由元数据变化（标题）
watch(
  () => route.meta.title,
  (title) => {
    if (title) {
      document.title = title
      appStore.setTitle(title)
      // 更新分享元数据
      updateShareMetadata(title)
    }
  }
)

// 监听整个路由对象变化
watch(
  () => route,
  (newRoute) => {
    // 更新分享元数据
    updateShareMetadata(newRoute.meta.title)
  },
  { deep: true }
)

// 检查当前路由是否需要显示TabBar
const showTabBar = computed(() => {
  // 路由元信息显式要求隐藏时，直接跳过显示
  if (route.meta && route.meta.hideTabBar) {
    return false
  }

  // 只在特定的主导航页面显示TabBar
  const showTabBarPaths = [
    '/',
    '/dashboard',
    '/device',
    '/water-point',
    '/user'
  ]

  // 精确匹配 - 只有完全匹配的页面才显示底部导航
  return showTabBarPaths.some(path => {
    return route.path === path
  })
});

// 检查当前路由是否需要显示分支机构TabBar
const showBranchTabBar = computed(() => {
  // 分支机构专用导航页面
  const showBranchTabBarPaths = [
    '/branch/home',
    '/branch/water-point',
    '/branch/profile'
  ]
  
  // 精确匹配或前缀匹配
  return showBranchTabBarPaths.some(path => {
    return route.path === path || route.path.startsWith(path + '/')
  })
});

// 监听TabBar显示状态变化，调整页面底部padding
watch(
  [showTabBar, showBranchTabBar],
  ([showTab, showBranchTab]) => {
    nextTick(() => {
      const appContainer = document.querySelector('.app-container')
      if (appContainer) {
        // 任何一个TabBar显示时都需要底部padding
        appContainer.style.paddingBottom = (showTab || showBranchTab) ? '50px' : '0'
      }
    })
  },
  { immediate: true }
)

// 退出模拟登录模式
const exitSimulateMode = () => {
  userStore.exitSimulateMode()
  // 刷新页面以确保状态完全重置
  window.location.reload()
}
</script>

<template>
  <div class="app-container">
    <!-- 模拟登录状态指示器 - 已隐藏，避免在预览中显示多余的提示条 -->
    <!-- <div v-if="userStore.isSimulateMode" class="simulate-mode-indicator">
      <div class="simulate-content">
        <span class="simulate-icon">👤</span>
        <span class="simulate-text">
          模拟登录: {{ userStore.userInfo.name || userStore.userInfo.phone || '未知用户' }}
        </span>
        <button class="exit-simulate-btn" @click="exitSimulateMode">
          退出
        </button>
      </div>
    </div> -->

    <router-view v-slot="{ Component }">
      <keep-alive v-if="$route.meta.keepAlive">
        <component :is="Component" />
      </keep-alive>
        <component v-else :is="Component" />
    </router-view>
    
    <!-- 底部导航 - 使用计算属性来控制显示 -->
    <TabBar v-if="showTabBar" />
    
    <!-- 分支机构底部导航 -->
    <BranchTabBar v-if="showBranchTabBar" />
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 模拟登录状态指示器 - 已隐藏相关样式 */
/*
.simulate-mode-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.simulate-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
}

.simulate-icon {
  font-size: 16px;
  margin-right: 8px;
}

.simulate-text {
  flex: 1;
  text-align: center;
}

.exit-simulate-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.exit-simulate-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.exit-simulate-btn:active {
  transform: scale(0.95);
}
*/

/* 主题颜色配置 */
:deep(.van-tabbar-item--active) {
  color: var(--primary-color);
}


</style>
