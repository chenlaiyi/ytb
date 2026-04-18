import './polyfills/globalThis'
import './polyfills/vant-browser'  // Must be before Vant import
import './utils/axios-fix'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { Icon } from 'vant' // 引入Vant图标组件
// 引入分享工具
import { setShareMetadata, isWechatBrowser } from './utils/share'
import { useUserStore } from './stores/user'
// 引入Bug修复工具
import { initBugFix } from './utils/bug-fix'
// 引入错误监控工具
import { initErrorMonitor } from './utils/error-monitor'
// 引入分支机构工具
import { initBranchEnvironment } from './utils/branch'
// 引入CSRF令牌工具
import { initCsrfToken } from './utils/csrf'
import { setupPhoneBindingWatcher } from './utils/phone-binding'

// 引入Vant组件库
import Vant from 'vant'
import 'vant/lib/index.css'

// 定义全局微信分享状态变量
window.wechatShareState = {
  initialized: false,
  configuring: false,
  ready: false,
  lastError: null,
  lastConfig: null
};

// 引入样式
import './assets/css/main.css'
// 引入备用SVG图标方案
import './assets/css/svg-icons.css'
// 引入CSS图标方案
import './assets/css/simple-icons.css'

const ensureWechatCallbackRoute = () => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const host = window.location.host || ''
    const isYtbHost = host.includes('ytb.ddg.org.cn')
    const isYtbStandaloneMode =
      import.meta.env.MODE === 'ytb-standalone' ||
      String(import.meta.env.VITE_YTB_STANDALONE || '').toLowerCase() === 'true'

    // YTB 登录链路使用独立后端回调，不应被通用 wechat-callback 劫持
    if (isYtbHost || isYtbStandaloneMode) {
      return
    }

    if (!isWechatBrowser()) {
      return
    }

    const searchParams = new URLSearchParams(window.location.search || '')
    const code = searchParams.get('code')

    if (!code) {
      return
    }

    const state = searchParams.get('state') || ''
    if (!state) {
      return
    }

    const hash = window.location.hash || '#/'
    const isOnWechatCallback = hash.startsWith('#/wechat-callback')
    if (isOnWechatCallback) {
      return
    }

    const redirectKey = `${code}::${state}`
    const lastHandled = sessionStorage.getItem('wechat_oauth_last_key')
    if (lastHandled === redirectKey) {
      return
    }

    const desiredPath = hash ? hash.replace(/^#/, '') || '/' : '/'
    sessionStorage.setItem('wechat_post_login_redirect', desiredPath)
    sessionStorage.setItem('wechat_oauth_last_key', redirectKey)

    const pathname = window.location.pathname || '/'
    let appBase = ''
    if (pathname.includes('/app/')) {
      appBase = pathname.substring(0, pathname.indexOf('/app/') + 4)
    } else if (pathname.endsWith('/app')) {
      appBase = pathname
    } else if (pathname.endsWith('/app/')) {
      appBase = pathname.slice(0, -1)
    }

    const baseUrl = appBase ? `${window.location.origin}${appBase}` : window.location.origin
    const separator = baseUrl.endsWith('/') ? '' : '/'
    const callbackUrl = `${baseUrl}${separator}#/wechat-callback?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ''}`

    window.location.replace(callbackUrl)
  } catch (error) {
    console.error('自动处理微信OAuth参数失败:', error)
  }
}

ensureWechatCallbackRoute()

if (import.meta.env.PROD && !window.APP_DEBUG) {
  const noop = () => undefined
  console.log = noop
  console.info = noop
  console.debug = noop
}

// 全局jQuery兼容处理 - 修复$.fail is not a function错误
if (typeof window !== 'undefined') {
  // 创建完整的jQuery兼容对象
  const createJQueryCompat = () => {
    const jQueryCompat = function (selector) {
      if (typeof selector === 'function') {
        // 处理$(document).ready()
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', selector);
        } else {
          selector();
        }
        return jQueryCompat;
      }
      // 返回链式调用对象
      return jQueryCompat;
    };

    // 添加所有jQuery Promise方法
    const promiseMethods = {
      fail: function (callback) {
        if (typeof callback === 'function') {
          setTimeout(() => callback(), 0);
        }
        return jQueryCompat;
      },
      done: function (callback) {
        if (typeof callback === 'function') {
          setTimeout(() => callback(), 0);
        }
        return jQueryCompat;
      },
      always: function (callback) {
        if (typeof callback === 'function') {
          setTimeout(() => callback(), 0);
        }
        return jQueryCompat;
      },
      then: function (callback) {
        if (typeof callback === 'function') {
          setTimeout(() => callback(), 0);
        }
        return jQueryCompat;
      },
      catch: function (callback) {
        if (typeof callback === 'function') {
          setTimeout(() => callback(), 0);
        }
        return jQueryCompat;
      },
      ready: function (callback) {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', callback);
        } else {
          callback();
        }
        return jQueryCompat;
      },
      on: function () { return jQueryCompat; },
      off: function () { return jQueryCompat; },
      click: function () { return jQueryCompat; },
      hide: function () { return jQueryCompat; },
      show: function () { return jQueryCompat; },
      ajax: function () { return jQueryCompat; },
      get: function () { return jQueryCompat; },
      post: function () { return jQueryCompat; },
      load: function () { return jQueryCompat; }
    };

    // 将所有方法添加到jQueryCompat对象
    Object.assign(jQueryCompat, promiseMethods);

    return jQueryCompat;
  };

  // 创建兼容对象
  const jQueryCompat = createJQueryCompat();

  // 强制设置全局$和jQuery，覆盖任何现有的
  window.$ = jQueryCompat;
  window.jQuery = jQueryCompat;

  // 定期检查并修复$对象
  const fixJQuery = () => {
    if (!window.$ || typeof window.$.fail !== 'function') {
      window.$ = jQueryCompat;
    }
    if (!window.jQuery || typeof window.jQuery.fail !== 'function') {
      window.jQuery = jQueryCompat;
    }
  };

  // 立即修复
  fixJQuery();

  // 定期检查修复
  setInterval(fixJQuery, 1000);

  // 监听模块加载事件
  const originalDefine = window.define;
  if (typeof originalDefine === 'function') {
    window.define = function (...args) {
      const result = originalDefine.apply(this, args);
      // 模块加载后立即修复jQuery
      setTimeout(fixJQuery, 0);
      return result;
    };
  }
}

// 全局错误处理
window.onerror = function (message, source, lineno, colno, error) {
  // 生产环境关闭日志

  // 特别处理模块加载错误
  if (message.includes('Failed to resolve module specifier')) {
    // 生产环境关闭日志

    // 如果是微信回调且路径不正确，尝试重定向
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')

    // 处理在开发目录下的访问
    if (code && state) {
      if (window.location.pathname.includes('/Tapp/app-vue/')) {
        const redirectUrl = `/app/#/wechat-callback?code=${code}&state=${state}`
        // 生产环境关闭日志
        window.location.href = redirectUrl
        return true // 阻止默认错误处理
      } else if (!window.location.pathname.includes('/app/')) {
        // 其他错误路径访问
        const redirectUrl = `/app/#/wechat-callback?code=${code}&state=${state}`
        // 生产环境关闭日志
        window.location.href = redirectUrl
        return true
      }
    }
  }

  return false
}

// 添加一个关闭微信调试弹窗的功能
function closeWechatDebugDialogs() {
  // 定期检查并关闭弹窗
  setTimeout(function checkAndCloseDialogs() {
    try {
      // 尝试关闭调试弹窗
      const debugDialogs = document.querySelectorAll('.wx_profile_dialog_primary, .weui-dialog, .wx_profile_dialog_wrp');
      let closed = 0;
      debugDialogs.forEach(dialog => {
        if (dialog && dialog.style && dialog.style.display !== 'none') {
          dialog.style.display = 'none';
          closed++;
        }
      });

      // 点击所有确认按钮
      const okButtons = document.querySelectorAll('.wx_desktop_btn.primary, .weui-dialog__btn.weui-dialog__btn_primary');
      okButtons.forEach(btn => {
        if (btn && typeof btn.click === 'function') {
          btn.click();
          closed++;
        }
      });

      if (closed > 0) {
        // 已关闭微信调试弹窗
      }
    } catch (e) {
      // 生产环境关闭日志
    }

    // 每秒检查一次
    setTimeout(checkAndCloseDialogs, 1000);
  }, 1000);
}

// 在DOM加载完成后运行
window.addEventListener('DOMContentLoaded', closeWechatDebugDialogs);

// 处理未捕获的Promise错误
window.addEventListener('unhandledrejection', function (event) {
  // 生产环境关闭日志
})

// 检查当前页面是否为登录页面，如果是则跳过初始化工具
const currentPagePath = window.location.hash || window.location.pathname
const isCurrentLoginPage = currentPagePath.includes('/login') || currentPagePath.includes('/wechat-callback')

if (!isCurrentLoginPage) {
  // 初始化Bug修复工具
  initBugFix()

  // 初始化错误监控
  const errorMonitor = initErrorMonitor()
}

// 创建应用实例
const app = createApp(App)

// 应用级错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue错误:', err, info)

  // 报告Vue错误到错误监控系统
  if (typeof errorMonitor !== 'undefined' && errorMonitor.reportError) {
    errorMonitor.reportError({
      type: 'vue',
      level: 'high',
      message: err.message,
      stack: err.stack,
      context: {
        componentInfo: info,
        vue: true
      }
    })
  }

  // 生产环境关闭日志
}

// 注册全局组件
app.component('VanIcon', Icon) // 全局注册Icon组件
app.component('Icon', Icon) // 同时注册为Icon组件名，与模板中使用的名称保持一致

// 创建并使用Pinia
const pinia = createPinia()
app.use(pinia)

// 创建userStore实例并设置为全局可访问
const userStore = useUserStore()
window.$userStore = userStore // 使userStore在全局可访问，方便request.js等文件使用

setupPhoneBindingWatcher(userStore, router)

// 使用路由
app.use(router)
app.use(Vant)

// 注册一个全局方法来刷新TabBar的显示状态
app.config.globalProperties.$refreshTabBar = () => {
  // 获取当前路由路径
  const currentPath = router.currentRoute.value.path

  // 检查当前页面是否需要隐藏TabBar
  if (
    currentPath.includes('/settings') ||
    currentPath === '/bind-phone' ||
    currentPath === '/wechat-callback' ||
    router.currentRoute.value.meta.hideTabBar
  ) {
    // 等待DOM更新
    setTimeout(() => {
      // 强制隐藏TabBar
      const elements = document.querySelectorAll('.tab-bar-container, .van-tabbar, .tabbar-placeholder, .van-tabbar--fixed')
      elements.forEach(el => {
        if (el) {
          el.style.display = 'none'
        }
      })
    }, 50)
  }
}

// 设置默认的分享元数据
setShareMetadata({
  title: document.title || '亿拓宝',
  subtitle: '每天进步一点点，实现富而喜悦人生。',
  logo: 'https://pay.itapgo.com/images/logo.png'
})

// 如果在微信环境中，初始化微信分享
if (isWechatBrowser()) {
  // 检测到微信环境，配置微信分享
  try {
    // 确保微信菜单可见，以启用分享功能
    document.addEventListener('WeixinJSBridgeReady', function () {
      if (window.WeixinJSBridge && window.WeixinJSBridge.invoke) {
        try {
          // 修改：显示微信菜单选项，而不是隐藏它
          window.WeixinJSBridge.invoke('showOptionMenu');
          // 已显示微信菜单选项，启用分享功能
        } catch (e) {
          // 生产环境关闭日志
        }

        // 关闭微信调试窗口
        try {
          const allDialogs = document.querySelectorAll('.wx_profile_dialog_primary, .weui-dialog, .wx_profile_dialog_wrp');
          allDialogs.forEach(dialog => {
            if (dialog && dialog.style) {
              dialog.style.display = 'none';
            }
          });
          // 关闭微信调试窗口
        } catch (e) {
          // 生产环境关闭日志
        }
      }
    });

    // 默认分享配置
    const defaultShareConfig = {
      title: document.title || '亿拓宝',
      desc: '每天进步一点点，实现富而喜悦人生。',
      imgUrl: 'https://pay.itapgo.com/images/logo.png'
    };

    // 统一配置微信分享，减少重复API调用
    setShareMetadata({
      title: defaultShareConfig.title,
      subtitle: defaultShareConfig.desc,
      logo: defaultShareConfig.imgUrl
    });

    // 仅在DOM完全加载后重新配置一次
    window.addEventListener('load', () => {
      // 页面完全加载，确保微信分享配置正确
      setShareMetadata({
        title: defaultShareConfig.title,
        subtitle: defaultShareConfig.desc,
        logo: defaultShareConfig.imgUrl
      });
    });

  } catch (error) {
    // 生产环境关闭日志
    // 记录详细错误信息
    if (error instanceof Error) {
      // 生产环境关闭日志
    }
  }
}

// 添加一个方法在需要时恢复userStore到localStorage
app.config.globalProperties.$syncUserStore = () => {
  try {
    // 检查userStore中是否有有效token
    if (userStore.token && userStore.isLoggedIn) {
      // 确保localStorage有token
      if (!localStorage.getItem('token')) {
        localStorage.setItem('token', userStore.token)
        // 已将userStore中的token同步到localStorage
      }

      // 确保sessionStorage有token
      if (!sessionStorage.getItem('token')) {
        sessionStorage.setItem('token', userStore.token)
        // 已将userStore中的token同步到sessionStorage
      }

      // 确保cookie中有token
      try {
        let hasCookie = false
        document.cookie.split(';').forEach(cookie => {
          if (cookie.trim().startsWith('tapgo_token=')) {
            hasCookie = true
          }
        })

        if (!hasCookie) {
          document.cookie = `tapgo_token=${encodeURIComponent(userStore.token)}; path=/; max-age=86400; SameSite=Lax`
          // 已将userStore中的token同步到cookie
        }
      } catch (e) {
        // 生产环境关闭日志
      }

      // 确保localStorage有用户信息
      if (userStore.userInfo && (userStore.userInfo.userId || userStore.userInfo.id)) {
        const storedUserInfo = localStorage.getItem('userInfo')
        if (!storedUserInfo) {
          localStorage.setItem('userInfo', JSON.stringify(userStore.userInfo))
          // 已将userStore中的用户信息同步到localStorage
        }

        // 确保sessionStorage有用户信息
        const sessionUserInfo = sessionStorage.getItem('userInfo')
        if (!sessionUserInfo) {
          sessionStorage.setItem('userInfo', JSON.stringify(userStore.userInfo))
          // 已将userStore中的用户信息同步到sessionStorage
        }

        // 确保全局变量有用户信息
        window.TAPGO_USER_INFO = userStore.userInfo
        window.TAPGO_TOKEN = userStore.token
        window.TAPGO_LOGIN_TIME = Date.now()
      }
    }

    // 反向同步：如果localStorage有token但userStore没有
    const localToken = localStorage.getItem('token') || sessionStorage.getItem('token')

    if (localToken && !userStore.token) {
      userStore.setToken(localToken)
      // 已将localStorage/sessionStorage中的token同步到userStore

      // 同时同步用户信息
      const localUserInfo = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
      if (localUserInfo) {
        try {
          const userData = JSON.parse(localUserInfo)
          userStore.setUserInfo(userData)
          // 已将localStorage/sessionStorage中的用户信息同步到userStore

          // 同步到全局变量
          window.TAPGO_USER_INFO = userData
          window.TAPGO_TOKEN = localToken
          window.TAPGO_LOGIN_TIME = Date.now()
        } catch (e) {
          // 生产环境关闭日志
        }
      }
    }

    // 创建登录状态备份
    if (userStore.token && userStore.userInfo) {
      const loginBackup = {
        token: userStore.token,
        userInfo: userStore.userInfo,
        timestamp: Date.now()
      }

      localStorage.setItem('login_backup', JSON.stringify(loginBackup))
      // 已创建登录状态备份
    }

    return {
      success: true,
      storeToken: !!userStore.token,
      localToken: !!localStorage.getItem('token'),
      sessionToken: !!sessionStorage.getItem('token'),
      storeUserInfo: !!(userStore.userInfo && userStore.userInfo.userId),
      localUserInfo: !!localStorage.getItem('userInfo'),
      sessionUserInfo: !!sessionStorage.getItem('userInfo')
    }
  } catch (error) {
    // 生产环境关闭日志
    return { success: false, error: error.message }
  }
}

// 检查当前页面是否为登录页面，如果是则跳过同步
const currentPath = window.location.hash || window.location.pathname
const isLoginPage = currentPath.includes('/login') || currentPath.includes('/wechat-callback')

if (!isLoginPage) {
  // 立即进行一次同步
  app.config.globalProperties.$syncUserStore()
}

// 在应用启动时恢复登录状态
const initAuth = async () => {
  try {
    // 检查当前页面是否为登录页面或微信回调页面
    const currentPath = window.location.hash || window.location.pathname
    const isLoginPage = currentPath.includes('/login') || currentPath.includes('/wechat-callback')

    if (isLoginPage) {
      console.log('🚫 当前为登录页面，跳过登录状态检查')
      return
    }

    console.log('🚀 应用启动 - 开始检查和恢复登录状态')
    const authModule = await import('./utils/auth')

    // 先检查当前登录状态
    const isCurrentlyLoggedIn = authModule.isLoggedIn()
    console.log('📊 当前登录状态检查:', isCurrentlyLoggedIn)

    // 尝试恢复登录状态
    const restored = authModule.restoreAuthState()
    if (restored) {
      console.log('✅ 应用启动时已恢复登录状态')

      // 启动自动token检查
      authModule.startAutoTokenCheck()

      // 刷新登录时间，延长有效期
      authModule.refreshLoginTime()

      console.log('🔄 已启动自动token维护机制')
    } else {
      console.log('ℹ️ 应用启动时无需恢复登录状态或恢复失败')
    }

    // 再次检查恢复后的登录状态
    const finalLoginState = authModule.isLoggedIn()
    console.log('🔍 最终登录状态:', finalLoginState)

  } catch (error) {
    console.error('❌ 恢复登录状态失败:', error)
  }
}

// 延迟执行登录状态恢复，确保路由已初始化
setTimeout(initAuth, 100)

// 启动登录状态监控
const startMonitoring = async () => {
  try {
    // 检查当前页面是否为登录页面或微信回调页面
    const currentPath = window.location.hash || window.location.pathname
    const isLoginPage = currentPath.includes('/login') || currentPath.includes('/wechat-callback')

    if (isLoginPage) {
      console.log('🚫 当前为登录页面，跳过登录状态监控')
      return
    }

    // 检查是否为分支机构用户
    const isBranch = localStorage.getItem('isBranch') === '1'
    const branchCode = localStorage.getItem('branch_code')

    if (isBranch && branchCode) {
      console.log('🏢 检测到分支机构用户，跳过官方登录状态监控')
      return
    }

    const { isLoggedIn } = await import('./utils/auth')
    if (isLoggedIn()) {
      const { startAuthMonitor } = await import('./utils/auth-monitor')
      startAuthMonitor()
      console.log('已启动登录状态监控')
    }
  } catch (error) {
    console.error('启动登录状态监控失败:', error)
  }
}

// 延迟启动监控，确保应用完全初始化
setTimeout(startMonitoring, 2000)

// 每当页面加载完成时同步一次登录状态
window.addEventListener('load', () => {
  // 页面加载完成，同步登录状态
  setTimeout(() => app.config.globalProperties.$syncUserStore(), 500)
})

// 页面可见性变化时同步状态，确保从后台恢复时状态一致
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    // 页面变为可见，同步登录状态
    setTimeout(() => app.config.globalProperties.$syncUserStore(), 100)

    // 检查并刷新token状态
    try {
      const authModule = await import('./utils/auth')
      if (authModule.isLoggedIn()) {
        authModule.refreshLoginTime()
        await authModule.refreshTokenIfNeeded()
        console.log('🔄 页面恢复时已刷新登录状态')
      }
    } catch (error) {
      console.error('页面恢复时刷新登录状态失败:', error)
    }
  }
})

// 全局初始化应用
async function initializeApp() {
  try {
    // 检查当前页面是否为登录页面
    const currentPath = window.location.hash || window.location.pathname
    const isLoginPage = currentPath.includes('/login') || currentPath.includes('/wechat-callback')

    if (!isLoginPage) {
      // 初始化CSRF令牌
      await initCsrfToken()

      // 初始化分支机构环境
      initBranchEnvironment()

      // 检查是否在微信环境
      if (isWechatBrowser()) {
        // 微信环境，微信SDK将在需要时自动初始化

        // 设置默认分享配置
        setShareMetadata({
          title: document.title || '亿拓宝',
          subtitle: '每天进步一点点，实现富而喜悦人生。',
          logo: 'https://pay.itapgo.com/images/logo.png'
        });
      } else {
        // 非微信环境，跳过微信相关初始化
      }

      // 初始化认证系统（在应用挂载前）
      try {
        // 动态导入认证工具以避免循环依赖
        import('./utils/auth.js').then(authModule => {
          // 初始化认证系统
          authModule.initAuth()
          console.log('🚀 认证系统初始化完成')
        }).catch(error => {
          console.error('❌ 认证系统初始化失败:', error)
        })
      } catch (error) {
        console.error('❌ 认证系统初始化失败:', error)
      }
    }
  } catch (error) {
    // 生产环境关闭日志
    // 不阻断应用启动
  }

  // 挂载应用
  app.mount('#app')
}

// 加载微信JSSDK脚本
function loadWeChatScript() {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载
    if (window.wx) {
      resolve(window.wx)
      return
    }

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js'
    script.onload = () => {
      // 微信JSSDK脚本加载成功
      resolve(window.wx)
    }
    script.onerror = () => {
      const error = new Error('微信JSSDK脚本加载失败')
      // 生产环境关闭日志
      reject(error)
    }
    document.head.appendChild(script)
  })
}

// 启动应用
initializeApp()
