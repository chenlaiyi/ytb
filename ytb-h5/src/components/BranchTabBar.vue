<template>
  <div class="branch-tab-bar-wrapper" v-show="shouldShowBranchTabBar">
    <div class="tabbar-placeholder"></div>
    <van-tabbar
      v-model="active"
      route
      fixed
      safe-area-inset-bottom
      @change="handleChange"
    >
      <van-tabbar-item
        v-for="(item, index) in navItems"
        :key="index"
        :to="item.path"
        replace
        @click.native="handleItemClick(index, $event)"
      >
        <template #icon="props">
          <van-icon :name="item.icon" :class="{ active: props.active }" />
        </template>
        {{ item.title }}
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const active = ref(0)

// 分支机构专用导航菜单
const navItems = ref([
  { icon: 'home-o', title: '首页', path: '/branch/home' },
  { icon: 'location-o', title: '取水点', path: '/branch/water-point' },
  { icon: 'user-o', title: '我的', path: '/branch/profile' }
])

// 处理点击事件
const handleItemClick = (index, event) => {
  console.log('分支机构导航点击:', index, event)

  // 防止重复点击当前激活的导航项
  if (index === active.value) {
    console.log('已经在当前导航项，不进行跳转')
    return
  }

  // 使用标准的router导航
  const path = navItems.value[index].path
  active.value = index

  router.push(path).catch(err => {
    console.error('路由跳转错误:', err)

    // 如果是NavigationDuplicated错误，不需要处理
    if (err.name !== 'NavigationDuplicated') {
      // 降级到普通跳转
      window.location.href = '/#' + path
    }
  })
}

// 处理选项变化
const handleChange = (index) => {
  console.log('分支机构导航切换到:', index, navItems.value[index].path)

  // 防止重复点击当前激活的导航项
  if (index === active.value) {
    console.log('已经在当前导航项，不进行跳转')
    return
  }

  // 使用push代替replace
  const path = navItems.value[index].path
  router.push(path).catch(err => {
    console.error('路由跳转错误:', err)

    // 如果是NavigationDuplicated错误，不需要处理
    if (err.name !== 'NavigationDuplicated') {
      // 降级到普通跳转
      window.location.href = '/#' + path
    }
  })
}

// 设置当前激活的导航项
const setActiveItem = () => {
  const currentPath = route.path
  console.log('分支机构当前路径:', currentPath)
  
  // 遍历导航项，找到最佳匹配
  let matchedIndex = -1
  
  for (let i = 0; i < navItems.value.length; i++) {
    const item = navItems.value[i]
    
    // 精确匹配优先
    if (currentPath === item.path) {
      matchedIndex = i
      break
    }
    
    // 前缀匹配，但排除根路径
    if (currentPath.startsWith(item.path) && item.path !== '/') {
      matchedIndex = i
    }
  }
  
  console.log('分支机构匹配的导航索引:', matchedIndex)
  
  if (matchedIndex !== -1) {
    active.value = matchedIndex
  } else {
    // 没有匹配时不选中任何菜单
    active.value = -1
  }
}

// 计算当前是否应该显示分支机构TabBar
const shouldShowBranchTabBar = computed(() => {
  // 检查路由meta中是否明确设置了hideBranchTabBar
  if (route.meta && route.meta.hideBranchTabBar) {
    return false
  }

  // 显示分支机构TabBar的路径列表
  const showBranchTabBarPaths = [
    '/branch/home',
    '/branch/water-point', 
    '/branch/profile'
  ]

  // 精确匹配或前缀匹配
  return showBranchTabBarPaths.some(path => {
    return route.path === path || route.path.startsWith(path + '/')
  })
})

// 监听路由变化，更新TabBar显示状态
watch(
  () => route.path,
  (path) => {
    console.log('分支机构路由变化:', path)

    // 更新当前活动项
    setActiveItem()

    // 基于shouldShowBranchTabBar计算属性显示或隐藏TabBar
    nextTick(() => {
      // 查找所有可能的TabBar元素
      const elements = document.querySelectorAll('.branch-tab-bar-wrapper, .branch-tab-bar-wrapper .van-tabbar')

      if (shouldShowBranchTabBar.value) {
        // 显示TabBar
        elements.forEach(el => {
          if (el) {
            el.style.display = ''
          }
        })

        // 添加底部间距，避免内容被底部导航遮挡
        const contentElements = document.querySelectorAll('.app-container')
        contentElements.forEach(el => {
          if (el) {
            el.style.paddingBottom = '50px'
          }
        })
      } else {
        // 隐藏TabBar
        elements.forEach(el => {
          if (el) {
            el.style.display = 'none'
          }
        })
      }
    })
  },
  { immediate: true } // 立即执行一次，确保首次加载时也能正确显示/隐藏
)

onMounted(() => {
  // 立即设置激活项
  setActiveItem()
})
</script>

<style scoped>
.branch-tab-bar-wrapper {
  width: 100%;
  position: relative;
}

.tabbar-placeholder {
  height: 50px;
  width: 100%;
}

/* 确保导航栏显示在最上层 */
:deep(.van-tabbar) {
  z-index: 9999;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  height: 50px;
  background-color: #fff;
}

/* 增强点击区域 */
:deep(.van-tabbar-item) {
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation !important;
  position: relative;
  opacity: 1 !important;
  height: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

/* 底部导航图标和文字 */
:deep(.van-tabbar-item__icon) {
  margin-bottom: 4px;
  height: 24px;
  font-size: 22px;
  line-height: 1;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.van-tabbar-item__text) {
  font-size: 12px;
  line-height: 1;
  color: inherit;
}

/* 确保点击事件正常传递 */
:deep(.van-tabbar-item__text),
:deep(.van-tabbar-item__icon) {
  pointer-events: none;
}

/* 添加活跃状态颜色 */
:deep(.van-tabbar-item--active) {
  color: #1989fa;
}

/* 图标活跃状态 */
:deep(.van-icon.active) {
  color: #1989fa;
}
</style> 