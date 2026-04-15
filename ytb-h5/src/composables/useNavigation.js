import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

/**
 * 统一的导航管理组合式函数
 * 提供统一的返回按钮逻辑和页面导航管理
 */
export function useNavigation() {
  const router = useRouter()
  const route = useRoute()

  // 主页面路径，这些页面不显示返回按钮
  const mainPages = [
    '/', 
    '/device', 
    '/water-point', 
    '/merchant', 
    '/user', 
    '/dashboard',
    '/home'
  ]

  // 分支机构主页面
  const branchMainPages = [
    '/branch/home',
    '/branch/water-point', 
    '/branch/profile'
  ]

  // 判断当前页面是否应该显示返回按钮
  const shouldShowBackButton = computed(() => {
    const currentPath = route.path
    
    // 主页面不显示返回按钮
    if (mainPages.includes(currentPath)) {
      return false
    }
    
    // 分支机构主页面不显示返回按钮
    if (branchMainPages.includes(currentPath)) {
      return false
    }
    
    return true
  })

  // 统一的返回处理函数
  const handleBack = (customHandler = null) => {
    if (customHandler && typeof customHandler === 'function') {
      return customHandler()
    }

    // 智能返回逻辑
    const canGoBack = window.history.length > 1

    if (canGoBack) {
      router.back()
    } else {
      // 没有历史记录时的回退策略
      const currentPath = route.path
      
      // 根据当前路径决定返回到哪里
      if (currentPath.startsWith('/branch/')) {
        router.push('/branch/home')
      } else if (currentPath.startsWith('/user/')) {
        router.push('/user')
      } else if (currentPath.startsWith('/device/')) {
        router.push('/device')
      } else if (currentPath.startsWith('/merchant/')) {
        router.push('/merchant')
      } else if (currentPath.startsWith('/water-point/')) {
        router.push('/water-point')
      } else {
        // 默认返回首页
        router.push('/')
      }
    }
  }

  // 跳转到指定页面
  const navigateTo = (path, replace = false) => {
    if (replace) {
      router.replace(path)
    } else {
      router.push(path)
    }
  }

  // 获取页面标题
  const getPageTitle = (fallback = '页面') => {
    return route.meta?.title || fallback
  }

  // 检查是否为移动端
  const isMobile = computed(() => {
    return window.innerWidth <= 768
  })

  // 安全区域适配
  const getSafeAreaInsets = () => {
    const style = getComputedStyle(document.documentElement)
    return {
      top: style.getPropertyValue('--van-safe-area-inset-top') || '0px',
      bottom: style.getPropertyValue('--van-safe-area-inset-bottom') || '0px'
    }
  }

  return {
    router,
    route,
    shouldShowBackButton,
    handleBack,
    navigateTo,
    getPageTitle,
    isMobile,
    getSafeAreaInsets,
    mainPages,
    branchMainPages
  }
}

/**
 * 导航配置工具函数
 */
export const navigationUtils = {
  // 判断是否为主页面
  isMainPage(path) {
    const mainPages = ['/', '/device', '/water-point', '/merchant', '/user', '/dashboard']
    return mainPages.includes(path)
  },

  // 判断是否为分支机构页面
  isBranchPage(path) {
    return path.startsWith('/branch/')
  },

  // 获取页面层级
  getPageLevel(path) {
    if (this.isMainPage(path)) return 0
    const segments = path.split('/').filter(Boolean)
    return segments.length
  },

  // 生成面包屑导航
  generateBreadcrumb(route) {
    const segments = route.path.split('/').filter(Boolean)
    const breadcrumb = []
    
    let currentPath = ''
    segments.forEach(segment => {
      currentPath += `/${segment}`
      breadcrumb.push({
        path: currentPath,
        name: segment,
        title: route.meta?.title || segment
      })
    })
    
    return breadcrumb
  }
}

/**
 * 页面导航配置常量
 */
export const PAGE_CONFIG = {
  // 主页面配置
  MAIN_PAGES: {
    HOME: { path: '/', title: '首页', icon: 'home-o' },
    DEVICE: { path: '/device', title: '设备', icon: 'cluster-o' },
    WATER_POINT: { path: '/water-point', title: '取水点', icon: 'location-o' },
    MERCHANT: { path: '/merchant', title: '商家', icon: 'shop-o' },
    USER: { path: '/user', title: '我的', icon: 'user-o' }
  },
  
  // 导航主题
  THEMES: {
    DEFAULT: 'default',
    GRADIENT: 'gradient', 
    DARK: 'dark',
    LIGHT: 'light',
    TRANSPARENT: 'transparent'
  },
  
  // Z-Index 层级
  Z_INDEX: {
    NAV_BAR: 100,
    MODAL: 1000,
    TOAST: 2000
  }
}