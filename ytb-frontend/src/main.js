import {
  ensureAdminAuthState,
  getAdminToken,
  setAdminToken,
  clearAdminToken,
  getAdminUserInfo,
  setAdminUserInfo,
  clearAdminUserInfo,
  setAdminLoginTime,
  clearAdminLoginTime
} from '@/utils/admin-token-bridge'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { createStore } from 'vuex'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// 移除vant图标样式引用，使用Element Plus图标
// import 'vant/lib/icon/style'
import '../css/app.css'
// 导入认证测试工具
import './utils/auth-test.js'
// 导入token修复工具
import './utils/token-fix.js'

ensureAdminAuthState()

// 安全获取localStorage中的userInfo
function getSafeUserInfo() {
  const info = getAdminUserInfo()
  if (info && typeof info === 'object') {
    return info
  }
  return {}
}

// 创建基本的Vuex store
const store = createStore({
  state: {
    user: {
      token: getAdminToken() || '',
      userInfo: getSafeUserInfo(),
      isLoggedIn: !!getAdminToken()
    },
    app: {
      loading: false,
      title: '点点够管理后台'
    }
  },
  
  getters: {
    isLoggedIn: state => state.user.isLoggedIn,
    userInfo: state => state.user.userInfo,
    currentUser: state => state.user.userInfo,
    token: state => state.user.token,
    loading: state => state.app.loading
  },
  
  mutations: {
    SET_TOKEN(state, token) {
      state.user.token = token
      state.user.isLoggedIn = !!token
      if (token) {
        setAdminToken(token)
        setAdminLoginTime(Date.now().toString())
      } else {
        clearAdminToken()
        clearAdminLoginTime()
      }
    },
    
    SET_USER_INFO(state, userInfo) {
      state.user.userInfo = userInfo || {}
      try {
        setAdminUserInfo(userInfo || {})
      } catch (error) {
        console.error('保存userInfo失败:', error)
      }
    },
    
    SET_LOADING(state, loading) {
      state.app.loading = loading
    },
    
    LOGOUT(state) {
      state.user.token = ''
      state.user.userInfo = {}
      state.user.isLoggedIn = false
      clearAdminToken()
      clearAdminUserInfo()
      clearAdminLoginTime()
    }
  },
  
  actions: {
    login({ commit }, { token, userInfo }) {
      commit('SET_TOKEN', token)
      commit('SET_USER_INFO', userInfo)
    },
    
    logout({ commit }) {
      commit('LOGOUT')
    },
    
    setLoading({ commit }, loading) {
      commit('SET_LOADING', loading)
    }
  }
})

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(store)  // 添加Vuex store
app.use(router)
app.use(ElementPlus)

app.mount('#app') 
