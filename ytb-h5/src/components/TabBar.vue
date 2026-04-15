<template>
  <div class="tab-bar-wrapper" v-if="navItems.length">
    <div
      class="tabbar-placeholder"
      :class="{ hidden: !shouldShowTabBar }"
      :style="placeholderStyle"
    ></div>
    <transition name="tabbar-fade">
      <nav
        v-if="shouldShowTabBar"
        class="glass-tabbar"
        :class="tabBarClassObject"
      >
        <div class="glass-indicator" :style="indicatorStyle"></div>
        <button
          v-for="(item, index) in navItems"
          :key="item.path || index"
          type="button"
          class="tabbar-item"
          :class="{ 'is-active': index === active }"
          :aria-current="index === active ? 'page' : undefined"
          @click="handleItemClick(index, $event)"
        >
          <span class="tabbar-icon">
            <template v-if="shouldRenderAvatar(item)">
              <span class="tabbar-avatar">
                <img :src="avatarSrc" alt="我的头像" />
              </span>
            </template>
            <template v-else>
              <van-icon :name="getIconName(item)" />
            </template>
          </span>
          <span class="tabbar-label">{{ item.title || item.nav_name }}</span>
        </button>
      </nav>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getNavItems } from '@/api/home'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const active = ref(0)
const DEFAULT_TABBAR_HEIGHT = 56
const tabbarHeight = ref(DEFAULT_TABBAR_HEIGHT)
const shouldReduceMotion = ref(false)
const userStore = useUserStore()
let motionMediaQuery = null

const isUserLoggedIn = computed(() => {
  if (userStore.isLoggedIn) {
    return true
  }
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  return !!token
})

const avatarSrc = computed(() => {
  let src = userStore.userAvatar || userStore.userInfo?.wechat_avatar || userStore.userInfo?.avatar || ''
  if (!src || typeof src !== 'string') {
    return ''
  }
  let normalized = src.trim()
  if (!normalized) return ''
  if (normalized.startsWith('//')) {
    normalized = `https:${normalized}`
  } else if (!normalized.startsWith('http') && !normalized.startsWith('/')) {
    normalized = `https://pay.itapgo.com/${normalized.replace(/^\/+/, '')}`
  }
  return normalized
})

const shouldRenderAvatar = (item) => {
  if (!item) return false
  return item.path === '/user' && isUserLoggedIn.value && !!avatarSrc.value
}

// 将图标名称转换为Vant Icons的名称
const getIconName = (item) => {
  // 优先使用vant_icon字段，如果存在
  if (item.vant_icon) {
    return item.vant_icon;
  }

  // 然后使用icon字段，如果它已经是vant格式
  if (item.icon && (item.icon.includes('-o') || !item.icon.includes('-'))) {
    return item.icon;
  }

  // 根据标题设置默认图标
  if (item.title) {
    if (item.title === '首页') return 'home-o';
    if (item.title === '分类') return 'gem-o';
    if (item.title === '设备') return 'cluster-o';
    if (item.title === '取水点') return 'location-o';
    if (item.title === '商家') return 'shop-o';
    if (item.title === '我的') return 'user-o';
  }

  // 最后使用映射关系
  const iconMap = {
    'home-o': 'home-o',
    'home': 'home',
    'apps-o': 'apps-o',
    'apps': 'apps',
    'location-o': 'location-o',
    'location': 'location',
    'shop-o': 'shop-o',
    'shop': 'shop',
    'user-o': 'user-o',
    'user': 'user',
    'gem-o': 'gem-o',
    'gem': 'gem-o',
    'cart-o': 'cart-o',
    'cart': 'cart-o',
    'filter-o': 'filter-o',
    'filter': 'filter-o',
    'cluster-o': 'cluster-o',
    'cluster': 'cluster-o',
    'el-icon-s-home': 'home-o',
    'el-icon-shopping-cart-full': 'cart-o',
    'el-icon-s-goods': 'shop-o',
    'el-icon-user': 'user-o',
    'el-icon-s-cooperation': 'friends-o',
    'el-icon-phone': 'phone-o',
    'el-icon-location': 'location-o',
    'el-icon-setting': 'setting-o',
    'el-icon-diamond': 'gem-o',
    '分类': 'gem-o',
    '设备': 'cluster-o',
    '取水点': 'location-o',
    '商家': 'shop-o',
    '我的': 'user-o'
  };

  const mappedIcon = iconMap[item.icon] || 'home-o';
  return mappedIcon;
}

// 先使用默认导航数据，确保组件始终能显示
const navItems = ref([
  { icon: 'home-o', title: '首页', path: '/' },
  { icon: 'filter-o', title: '设备', path: '/device' },
  { icon: 'location-o', title: '取水点', path: '/water-point' },
  { icon: 'shop-o', title: '商家', path: '/merchant' },
  { icon: 'user-o', title: '我的', path: '/user' }
])

const indicatorStyle = computed(() => {
  const count = navItems.value.length || 1
  const index = active.value >= 0 ? active.value : 0
  const segmentPercent = 100 / count
  const inset = 6
  return {
    width: `calc(${segmentPercent}% - ${inset * 2}px)`,
    left: `calc(${segmentPercent * index}% + ${inset}px)`,
    opacity: active.value >= 0 ? 1 : 0
  }
})

const tabBarClassObject = computed(() => ({
  'disable-motion': shouldReduceMotion.value
}))

// 处理点击事件
const handleItemClick = (index, event) => {
  console.log('点击导航项:', index, event)

  // 防止重复点击当前激活的导航项
  if (index === active.value) {
    console.log('已经在当前导航项，不进行跳转')
    return
  }

  // 获取目标路径
  const path = navItems.value[index].path
  active.value = index

  // 特殊处理个人中心页面的认证检查
  if (path === '/user') {
    // 检查是否已登录 - 增强登录状态检查
    const token = localStorage.getItem('token')
    const sessionToken = sessionStorage.getItem('token')
    const simulateMode = sessionStorage.getItem('simulate_mode')
    const simulateToken = sessionStorage.getItem('simulate_token')
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    const sessionLoggedIn = sessionStorage.getItem('isLoggedIn')
    const fromWechatLogin = localStorage.getItem('fromWechatLogin')
    
    console.log('检查登录状态:', {
      token: !!token,
      sessionToken: !!sessionToken,
      isLoggedIn,
      sessionLoggedIn,
      fromWechatLogin,
      simulateMode
    })
    
    // 如果未登录，跳转到登录页面
    if (!token && !sessionToken && !isLoggedIn && !sessionLoggedIn && !fromWechatLogin && !(simulateMode === 'true' && simulateToken)) {
      console.log('未登录，跳转到登录页面')
      router.push('/user/login')
      return
    }
    
    console.log('已登录，继续跳转到个人中心')
  }

  // 使用push进行导航
  router.push(path).catch(err => {
    console.error('路由跳转错误:', err)

    // 如果是NavigationDuplicated错误，不需要处理
    if (err.name !== 'NavigationDuplicated') {
      // 降级到普通跳转
      window.location.href = '/app/#' + path
    }
  })
}

const measureTabBar = () => {
  const navElement = document.querySelector('.glass-tabbar')
  if (!navElement) {
    tabbarHeight.value = DEFAULT_TABBAR_HEIGHT
    return
  }
  const measured = navElement.offsetHeight
  tabbarHeight.value = measured > 0 ? measured : DEFAULT_TABBAR_HEIGHT
}

const updateMotionPreference = (event) => {
  if (typeof window === 'undefined') {
    shouldReduceMotion.value = false
    return
  }
  const ua = navigator.userAgent || ''
  const isWechatWebview = /MicroMessenger|MiniProgramEnv/i.test(ua)
  const mediaMatches = typeof event?.matches === 'boolean'
    ? event.matches
    : !!motionMediaQuery?.matches
  shouldReduceMotion.value = isWechatWebview || mediaMatches
}

const handleResize = () => {
  measureTabBar()
  updateContentPadding()
}

// 获取导航菜单
const fetchNavItems = async () => {
  try {
    console.log('开始获取导航菜单...')

    // 使用默认导航作为初始值，确保组件始终能显示
    const defaultNav = [
      { icon: 'home-o', title: '首页', path: '/' },
      { icon: 'cluster-o', title: '设备', path: '/device' },
      { icon: 'location-o', title: '取水点', path: '/water-point' },
      { icon: 'shop-o', title: '商家', path: '/merchant' },
      { icon: 'user-o', title: '我的', path: '/user' }
    ];

    // 避免初始化时的空白
    if (navItems.value.length === 0) {
      navItems.value = defaultNav;
      setActiveItem();
    }

    // 从API获取导航配置
    const res = await getNavItems();
    console.log('API返回数据:', res);

    if (res.code === 0 && res.data && Array.isArray(res.data)) {
      // 过滤启用状态的导航项并按排序值排序
      const apiNavItems = res.data
        .filter(item => item.status == 1)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map(item => ({
          icon: item.icon || 'home-o',
          title: item.nav_name || item.title || '未命名',
          path: item.path || '/',
          nav_id: item.nav_id,
          highlight: item.highlight,
          badge_type: item.badge_type
        }));

      if (apiNavItems.length > 0) {
        console.log('使用API导航数据:', apiNavItems);
        navItems.value = apiNavItems;
      } else {
        console.log('API返回数据为空，使用默认导航');
        navItems.value = defaultNav;
      }
    } else {
      console.log('API返回格式错误，使用默认导航');
      navItems.value = defaultNav;
    }

    // 设置激活项
    setActiveItem();

    await nextTick();
    measureTabBar();
    updateContentPadding();
  } catch (error) {
    console.error('获取导航菜单失败:', error.message || error);
    // 使用默认导航
    const defaultNav = [
      { icon: 'home-o', title: '首页', path: '/' },
      { icon: 'cluster-o', title: '设备', path: '/device' },
      { icon: 'location-o', title: '取水点', path: '/water-point' },
      { icon: 'shop-o', title: '商家', path: '/merchant' },
      { icon: 'user-o', title: '我的', path: '/user' }
    ];
    navItems.value = defaultNav;
    setActiveItem();

    await nextTick();
    measureTabBar();
    updateContentPadding();
  }
}

// 设置当前激活的导航项
const setActiveItem = () => {
  const currentPath = route.path
  
  // 特殊处理不同页面的路径匹配
  let matchedIndex = -1
  
  // 遍历导航项，找到最佳匹配
  for (let i = 0; i < navItems.value.length; i++) {
    const item = navItems.value[i]
    
    // 精确匹配优先
    if (currentPath === item.path) {
      matchedIndex = i
      break
    }
    
    // 特殊处理设备相关页面
    if (item.path === '/device') {
      // 设备相关的所有页面都应该匹配到"设备"菜单
      if (currentPath.startsWith('/device') || 
          currentPath.startsWith('/purifier') ||
          currentPath === '/device') {
        matchedIndex = i
        continue // 继续查找是否有更精确的匹配
      }
    }
    
    // 特殊处理控制面板相关页面
    else if (item.path === '/dashboard') {
      // 控制面板相关的页面：商户工作台、管理员工作台、VIP工作台等
      if (currentPath.startsWith('/merchant/dashboard') || 
          currentPath.startsWith('/admin') ||
          currentPath.startsWith('/vip') ||
          currentPath.startsWith('/agent') ||
          currentPath.startsWith('/institution') ||
          currentPath.startsWith('/salesman') ||
          currentPath.startsWith('/engineer') ||
          currentPath === '/dashboard') {
        matchedIndex = i
        continue // 继续查找是否有更精确的匹配
      }
    }
    
    // 其他页面的前缀匹配
    else if (currentPath.startsWith(item.path) && item.path !== '/') {
      matchedIndex = i
      continue // 继续查找是否有更精确的匹配
    }
    
    // 首页特殊处理
    else if (item.path === '/' && currentPath === '/') {
      matchedIndex = i
    }
  }
  
  if (matchedIndex !== -1) {
    active.value = matchedIndex
  } else {
    // 如果没有匹配的路径，根据当前路径智能判断
    if (currentPath.startsWith('/purifier') || currentPath.startsWith('/device')) {
      // 净水器或设备相关页面，选中"设备"菜单
      const deviceIndex = navItems.value.findIndex(item => item.title === '设备')
      if (deviceIndex !== -1) {
        active.value = deviceIndex
      }
    } else if (currentPath.startsWith('/merchant/dashboard') || 
               currentPath.startsWith('/admin') ||
               currentPath.startsWith('/vip') ||
               currentPath.startsWith('/agent') ||
               currentPath.startsWith('/institution') ||
               currentPath.startsWith('/salesman') ||
               currentPath.startsWith('/engineer')) {
      // 工作台相关页面，选中"控制面板"菜单
      const dashboardIndex = navItems.value.findIndex(item => item.title === '控制面板')
      if (dashboardIndex !== -1) {
        active.value = dashboardIndex
      }
    } else if (currentPath === '/') {
      // 首页
      active.value = 0
    } else {
      // 默认不选中任何菜单
      active.value = -1
    }
  }
}

// 添加手动点击处理
const addClickHandlers = () => {
  // 移除手动点击处理，避免与Vue Router冲突
  console.log('不再添加手动点击处理器，使用Vue Router的标准导航')
}

// 计算当前是否应该显示TabBar
const shouldShowTabBar = computed(() => {
  // 检查路由meta中是否明确设置了hideTabBar
  if (route.meta && route.meta.hideTabBar) {
    return false
  }

  // 显示TabBar的路径列表 - 仅限底部导航页面
  const showTabBarPaths = [
    '/',
    '/dashboard',
    '/device',
    '/water-point',
    '/merchant',
    '/user'
  ]

  // 精确匹配 - 只有完全匹配的页面才显示底部导航
  return showTabBarPaths.some(path => {
    return route.path === path
  })
})

const tabbarPadding = computed(() => {
  if (!shouldShowTabBar.value) {
    return '0px'
  }
  return `calc(${tabbarHeight.value}px + env(safe-area-inset-bottom))`
})

const placeholderStyle = computed(() => ({
  height: shouldShowTabBar.value ? tabbarPadding.value : '0px'
}))

const updateContentPadding = () => {
  const contentElements = document.querySelectorAll('.app-container')
  contentElements.forEach(el => {
    if (el) {
      el.style.paddingBottom = tabbarPadding.value
    }
  })
}

// 监听路由变化，强制更新TabBar显示状态
watch(
  () => route.path,
  () => {
    // 更新当前活动项
    setActiveItem()

    // 基于shouldShowTabBar计算属性显示或隐藏TabBar
    nextTick(() => {
      measureTabBar()
      updateContentPadding()
    })
  },
  { immediate: true } // 立即执行一次，确保首次加载时也能正确显示/隐藏
)

watch(
  navItems,
  () => {
    nextTick(() => {
      measureTabBar()
      updateContentPadding()
    })
  },
  { deep: true }
)

onMounted(async () => {
  setActiveItem()

  await nextTick()
  measureTabBar()
  updateContentPadding()

  await fetchNavItems()

  if (typeof window !== 'undefined') {
    motionMediaQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null

    updateMotionPreference()

    if (motionMediaQuery?.addEventListener) {
      motionMediaQuery.addEventListener('change', updateMotionPreference)
    } else if (motionMediaQuery?.addListener) {
      motionMediaQuery.addListener(updateMotionPreference)
    }

    window.addEventListener('resize', handleResize)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }

  if (motionMediaQuery?.removeEventListener) {
    motionMediaQuery.removeEventListener('change', updateMotionPreference)
  } else if (motionMediaQuery?.removeListener) {
    motionMediaQuery.removeListener(updateMotionPreference)
  }
})
</script>

<style scoped>
.tab-bar-wrapper {
  position: relative;
  z-index: 900;
}

.tabbar-placeholder {
  width: 100%;
  transition: height 0.3s ease;
}

.tabbar-placeholder.hidden {
  height: 0;
}

/* Real iOS Glassmorphism Container */
.glass-tabbar {
  position: fixed;
  left: 50%;
  bottom: calc(12px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  width: min(calc(100% - 32px), 390px);
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 4px;
  padding: 6px;
  border-radius: 32px; /* More rounded like iOS pills */
  
  /* The Glass Effect */
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  
  /* Subtle border and shadow */
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 
    0 20px 40px -10px rgba(0, 0, 0, 0.15),
    0 10px 20px -5px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
    
  z-index: 999;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* Ambient light reflection */
.glass-tabbar::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    180deg, 
    rgba(255, 255, 255, 0.2) 0%, 
    rgba(255, 255, 255, 0) 100%
  );
  pointer-events: none;
}

/* The "Water" Indicator */
.glass-indicator {
  position: absolute;
  top: 6px;
  bottom: 6px;
  /* left and width are set by JS */
  border-radius: 24px;
  
  /* Liquid/Glassy look for the active highlight */
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.08),
    inset 0 0 0 0.5px rgba(255, 255, 255, 1);
    
  /* Fluid spring physics for movement */
  transition: 
    left 0.5s cubic-bezier(0.25, 0.8, 0.25, 1),
    width 0.5s cubic-bezier(0.25, 0.8, 0.25, 1),
    opacity 0.3s ease;
  pointer-events: none;
  z-index: 1;
}

/* Tab Item Styling */
.tabbar-item {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: rgba(60, 60, 67, 0.6); /* iOS secondary label color */
  font-size: 10px;
  font-weight: 500;
  border: none;
  background: transparent;
  border-radius: 24px;
  padding: 4px 0;
  z-index: 2;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy scale */
}

/* Press effect - Water dip */
.tabbar-item:active {
  transform: scale(0.92);
}

/* Active State */
.tabbar-item.is-active {
  color: #007AFF; /* iOS Blue or your brand color */
  font-weight: 600;
}

/* Icon Styling */
.tabbar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  width: 24px;
  position: relative;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tabbar-item.is-active .tabbar-icon {
  transform: translateY(-1px);
}

.tabbar-icon :deep(.van-icon) {
  font-size: 22px;
}

/* Avatar Styling */
.tabbar-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  border: 1.5px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
}

.tabbar-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tabbar-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: -0.1px;
}

/* Transitions */
.tabbar-fade-enter-active,
.tabbar-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.tabbar-fade-enter-from,
.tabbar-fade-leave-to {
  opacity: 0;
  transform: translateY(20px) translateX(-50%);
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .glass-tabbar {
    background: rgba(30, 30, 30, 0.65);
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 
      0 20px 40px -10px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  .glass-indicator {
    background: rgba(255, 255, 255, 0.15);
    box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.2);
  }
  
  .tabbar-item {
    color: rgba(235, 235, 245, 0.6);
  }
  
  .tabbar-item.is-active {
    color: #0A84FF; /* iOS Dark Mode Blue */
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .glass-indicator {
    transition: none;
  }
  .tabbar-item {
    transition: none;
  }
}
</style>
