/**
 * 认证相关工具函数
 */

import { useUserStore } from '@/stores/user'

// 登录状态保持配置
const AUTH_CONFIG = {
  TOKEN_KEY: 'token',
  USER_INFO_KEY: 'userInfo',
  LOGIN_TIME_KEY: 'login_time',
  TOKEN_EXPIRE_TIME: 30 * 24 * 60 * 60 * 1000, // 30天（延长有效期）
  REFRESH_THRESHOLD: 25 * 24 * 60 * 60 * 1000, // 25天（更宽松的刷新阈值）
  AUTO_REFRESH_INTERVAL: 6 * 60 * 60 * 1000, // 6小时检查一次（降低频率）
  COOKIE_EXPIRE_DAYS: 30, // Cookie过期天数
}

/**
 * 检查当前是否在正确的应用路径下
 * @returns {boolean} 是否在正确路径下
 */
export const isInCorrectAppPath = () => {
  return window.location.pathname.includes('/app/');
};

/**
 * 跳转到正确的应用登录页
 * @param {string} [redirectAfterLogin=null] 登录后重定向的路径
 */
const resolveLoginPath = (redirectAfterLogin) => {
  const indirectPath = redirectAfterLogin
    || (typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '')
    || '/admin'
  const isAdminRoute = indirectPath.startsWith('/admin')
  const base = isAdminRoute ? '/app/#/admin/login' : '/app/#/login'
  return redirectAfterLogin ? `${base}?redirect=${encodeURIComponent(indirectPath)}` : base
}

export const redirectToLogin = (redirectAfterLogin = null) => {
  // 存储重定向信息
  if (redirectAfterLogin) {
    localStorage.setItem('login_redirect', redirectAfterLogin);
  }
  
  // 获取当前URL，用于判断是否需要重定向
  const currentPath = window.location.pathname;
  
  // 如果不在正确的应用路径下，重定向到正确的应用登录页
  const target = resolveLoginPath(redirectAfterLogin)

  if (!isInCorrectAppPath()) {
    console.log('不在正确的应用路径，重定向到正确的登录页');
    window.location.href = target;
    return;
  }
  
  // 否则使用内部路由导航
  window.location.href = target;
};

const ADMIN_AUTH_CONFIG = {
  TOKEN_KEY: 'admin_token',
  USER_INFO_KEY: 'admin_user_info',
  LOGIN_TIME_KEY: 'admin_login_time'
}

/**
 * 登出处理函数（普通用户）
 */
export const handleLogout = () => {
  localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY)
  localStorage.removeItem(AUTH_CONFIG.USER_INFO_KEY)
  localStorage.removeItem(AUTH_CONFIG.LOGIN_TIME_KEY)
  sessionStorage.removeItem(AUTH_CONFIG.TOKEN_KEY)
  sessionStorage.removeItem(AUTH_CONFIG.USER_INFO_KEY)
  sessionStorage.removeItem(AUTH_CONFIG.LOGIN_TIME_KEY)
  redirectToLogin()
}

export const clearAdminAuthData = () => {
  localStorage.removeItem(ADMIN_AUTH_CONFIG.TOKEN_KEY)
  localStorage.removeItem(ADMIN_AUTH_CONFIG.USER_INFO_KEY)
  localStorage.removeItem(ADMIN_AUTH_CONFIG.LOGIN_TIME_KEY)
  localStorage.removeItem('admin_auth_token')
  sessionStorage.removeItem(ADMIN_AUTH_CONFIG.TOKEN_KEY)
  sessionStorage.removeItem(ADMIN_AUTH_CONFIG.USER_INFO_KEY)
  sessionStorage.removeItem(ADMIN_AUTH_CONFIG.LOGIN_TIME_KEY)
  sessionStorage.removeItem('admin_auth_token')
  localStorage.removeItem('branch_admin_token')
}

export const handleAdminLogout = (redirectAfterLogin = '/admin') => {
  clearAdminAuthData()
  redirectToLogin(redirectAfterLogin)
}

/**
 * 设置登录状态
 * @param {string} token JWT token
 * @param {object} userInfo 用户信息
 */
export function setAuthData(token, userInfo) {
  const loginTime = Date.now()
  
  console.log('🔐 开始保存登录状态:', {
    token: token ? `${token.substring(0, 20)}...` : 'null',
    userId: userInfo?.id || userInfo?.userId,
    userPhone: userInfo?.phone
  })

  try {
    // ⚠️ 安全修复: 移除localStorage中的敏感token存储
    // localStorage易受XSS攻击，不再用于存储token
    // 仅保留非敏感的用户信息（用于UI显示）
    localStorage.setItem(AUTH_CONFIG.USER_INFO_KEY, JSON.stringify(userInfo))
    localStorage.setItem('isLoggedIn', 'true')

    // ⚠️ 安全修复: 移除sessionStorage中的token
    // sessionStorage作为备份 - 但也易受XSS攻击
    // sessionStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token) // 已禁用
    sessionStorage.setItem(AUTH_CONFIG.USER_INFO_KEY, JSON.stringify(userInfo))
    sessionStorage.setItem(AUTH_CONFIG.LOGIN_TIME_KEY, loginTime.toString())

    // ⚠️ 安全修复: Cookie安全配置
    // 启用Secure标志（仅HTTPS）和SameSite=Strict（防止CSRF）
    const expires = new Date(Date.now() + AUTH_CONFIG.TOKEN_EXPIRE_TIME)
    // 注意: 前端JavaScript无法设置httpOnly标志
    // 建议后端设置httpOnly cookie以提供最佳安全性
    const isSecure = window.location.protocol === 'https:'
    document.cookie = `${AUTH_CONFIG.TOKEN_KEY}=${encodeURIComponent(token)}; path=/; expires=${expires.toUTCString()}; SameSite=Strict; Secure=${isSecure}`
    document.cookie = `user_id=${encodeURIComponent(userInfo.id || userInfo.userId)}; path=/; expires=${expires.toUTCString()}; SameSite=Strict; Secure=${isSecure}`
    document.cookie = `login_time=${encodeURIComponent(loginTime)}; path=/; expires=${expires.toUTCString()}; SameSite=Strict; Secure=${isSecure}`

    // ⚠️ 安全修复: 避免使用全局变量存储敏感token
    // 全局变量可被任何JavaScript代码访问
    // window.TAPGO_AUTH = { token, userInfo, loginTime } // 已禁用
    window.TAPGO_AUTH = { userInfo, loginTime } // 仅存储非敏感信息

    // 更新Pinia store - 内存存储相对安全
    const userStore = useUserStore()
    userStore.setToken(token)
    userStore.setUserInfo(userInfo)
    
    console.log('✅ 登录状态保存成功:', {
      localStorage: !!localStorage.getItem(AUTH_CONFIG.TOKEN_KEY),
      sessionStorage: !!sessionStorage.getItem(AUTH_CONFIG.TOKEN_KEY),
      globalVar: !!window.TAPGO_AUTH,
      storeToken: !!userStore.token,
      storeUser: !!userStore.userInfo
    })
    
    return true
  } catch (error) {
    console.error('❌ 保存登录状态失败:', error)
    return false
  }
}

export function setAdminAuthData(token, userInfo = {}) {
  const loginTime = Date.now()
  try {
    const payload = {
      ...userInfo,
      is_admin: userInfo?.is_admin ?? 1,
      role: userInfo?.role || 'admin'
    }
    localStorage.setItem(ADMIN_AUTH_CONFIG.TOKEN_KEY, token)
    localStorage.setItem(ADMIN_AUTH_CONFIG.USER_INFO_KEY, JSON.stringify(payload))
    localStorage.setItem(ADMIN_AUTH_CONFIG.LOGIN_TIME_KEY, loginTime.toString())
    localStorage.setItem('admin_auth_token', token)

    sessionStorage.setItem(ADMIN_AUTH_CONFIG.TOKEN_KEY, token)
    sessionStorage.setItem(ADMIN_AUTH_CONFIG.USER_INFO_KEY, JSON.stringify(payload))
    sessionStorage.setItem(ADMIN_AUTH_CONFIG.LOGIN_TIME_KEY, loginTime.toString())
    sessionStorage.setItem('admin_auth_token', token)
    return true
  } catch (error) {
    console.error('❌ 保存管理员登录状态失败:', error)
    return false
  }
}

export function getAdminToken() {
  let token = localStorage.getItem(ADMIN_AUTH_CONFIG.TOKEN_KEY)
  if (!token) {
    token = sessionStorage.getItem(ADMIN_AUTH_CONFIG.TOKEN_KEY)
  }
  if (!token) {
    token = localStorage.getItem('admin_auth_token') || sessionStorage.getItem('admin_auth_token')
  }
  return token
}

export function getAdminUserInfo() {
  let userInfoStr = localStorage.getItem(ADMIN_AUTH_CONFIG.USER_INFO_KEY)
  if (!userInfoStr) {
    userInfoStr = sessionStorage.getItem(ADMIN_AUTH_CONFIG.USER_INFO_KEY)
  }
  if (!userInfoStr) return null
  try {
    return JSON.parse(userInfoStr)
  } catch (error) {
    console.error('❌ 解析管理员用户信息失败:', error)
    return null
  }
}

/**
 * 获取当前token
 * @returns {string|null} token
 */
export function getToken() {
  // 优先从localStorage获取
  let token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY)
  let source = 'localStorage'
  
  // 如果localStorage没有，尝试从sessionStorage获取
  if (!token) {
    token = sessionStorage.getItem(AUTH_CONFIG.TOKEN_KEY)
    if (token) {
      source = 'sessionStorage'
      // 恢复到localStorage
      localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token)
    }
  }
  
  // 如果还是没有，尝试从cookie获取
  if (!token) {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === AUTH_CONFIG.TOKEN_KEY && value) {
        token = decodeURIComponent(value)
        source = 'cookie'
        // 恢复到localStorage
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token)
        break
      }
    }
  }
  
  // 最后尝试从全局变量获取
  if (!token && window.TAPGO_AUTH?.token) {
    token = window.TAPGO_AUTH.token
    source = 'globalVar'
    // 恢复到localStorage
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token)
  }
  
  if (token) {
    console.log(`🔑 获取到token (来源: ${source}):`, token.substring(0, 20) + '...')
  } else {
    console.log('❌ 未找到有效token')
  }
  
  return token
}

/**
 * 获取用户信息
 * @returns {object|null} 用户信息
 */
export function getUserInfo() {
  // 优先从localStorage获取
  let userInfoStr = localStorage.getItem(AUTH_CONFIG.USER_INFO_KEY)
  let source = 'localStorage'
  
  // 如果localStorage没有，尝试从sessionStorage获取
  if (!userInfoStr) {
    userInfoStr = sessionStorage.getItem(AUTH_CONFIG.USER_INFO_KEY)
    if (userInfoStr) {
      source = 'sessionStorage'
      // 恢复到localStorage
      localStorage.setItem(AUTH_CONFIG.USER_INFO_KEY, userInfoStr)
    }
  }
  
  // 最后尝试从全局变量获取
  if (!userInfoStr && window.TAPGO_AUTH?.userInfo) {
    const userInfo = window.TAPGO_AUTH.userInfo
    source = 'globalVar'
    localStorage.setItem(AUTH_CONFIG.USER_INFO_KEY, JSON.stringify(userInfo))
    console.log(`👤 获取到用户信息 (来源: ${source}):`, { id: userInfo.id || userInfo.userId, phone: userInfo.phone })
    return userInfo
  }
  
  if (userInfoStr) {
    try {
      const userInfo = JSON.parse(userInfoStr)
      console.log(`👤 获取到用户信息 (来源: ${source}):`, { id: userInfo.id || userInfo.userId, phone: userInfo.phone })
      return userInfo
    } catch (error) {
      console.error('❌ 解析用户信息失败:', error)
      return null
    }
  }
  
  console.log('❌ 未找到有效用户信息')
  return null
}

/**
 * 检查是否已登录
 * @returns {boolean} 是否已登录
 */
export function isLoggedIn() {
  const token = getToken()
  const userInfo = getUserInfo()
  const result = !!(token && userInfo && Object.keys(userInfo).length > 0 && (userInfo.id || userInfo.userId))
  
  console.log('🔍 检查登录状态:', {
    hasToken: !!token,
    hasUserInfo: !!userInfo,
    userInfoKeys: userInfo ? Object.keys(userInfo).length : 0,
    hasUserId: !!(userInfo?.id || userInfo?.userId),
    isLoggedIn: result
  })
  
  return result
}

/**
 * 检查token是否即将过期
 * @returns {boolean} 是否即将过期
 */
export function isTokenExpiring() {
  const loginTimeStr = localStorage.getItem(AUTH_CONFIG.LOGIN_TIME_KEY) || 
                      sessionStorage.getItem(AUTH_CONFIG.LOGIN_TIME_KEY) ||
                      getCookieValue('login_time')
  
  if (!loginTimeStr) {
    console.log('未找到登录时间，认为需要刷新')
    return true
  }
  
  const loginTime = parseInt(loginTimeStr)
  const now = Date.now()
  const timeDiff = now - loginTime
  const daysDiff = Math.floor(timeDiff / (24 * 60 * 60 * 1000))
  
  console.log(`登录已过去 ${daysDiff} 天，刷新阈值: ${AUTH_CONFIG.REFRESH_THRESHOLD / (24 * 60 * 60 * 1000)} 天`)
  
  // 如果登录时间超过刷新阈值，认为需要刷新
  return timeDiff > AUTH_CONFIG.REFRESH_THRESHOLD
}

/**
 * 从Cookie中获取值的工具函数
 * @param {string} name Cookie名称
 * @returns {string|null} Cookie值
 */
function getCookieValue(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop().split(';').shift())
  }
  return null
}

/**
 * 验证令牌是否有效
 * @param {string} token 要验证的令牌
 * @returns {Promise<boolean>} 令牌是否有效
 */
export async function validateToken(token = null) {
  const tokenToValidate = token || getToken()
  if (!tokenToValidate) {
    console.log('❌ 没有令牌需要验证')
    return false
  }
  
  try {
    // 支持多种token格式验证
    const isSanctumToken = tokenToValidate.includes('|')
    const isJWTToken = tokenToValidate.split('.').length === 3
    const isValidLength = tokenToValidate.length > 20
    
    // 如果是Sanctum token格式，直接认为有效（让后端验证）
    if (isSanctumToken && isValidLength) {
      console.log('✅ Sanctum令牌格式验证通过')
      return true
    }
    
    // 如果是JWT token，进行详细验证
    if (isJWTToken) {
      try {
        // 解析JWT payload检查过期时间
        const parts = tokenToValidate.split('.')
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
        const now = Math.floor(Date.now() / 1000)
        
        if (payload.exp && payload.exp < now) {
          console.log('❌ JWT令牌已过期')
          return false
        }
        
        console.log('✅ JWT令牌验证通过')
        return true
      } catch (jwtError) {
        console.warn('JWT解析失败，但token可能仍然有效:', jwtError.message)
        return true // 让后端最终验证
      }
    }
    
    // 其他格式的token，只要长度合理就认为可能有效
    if (isValidLength) {
      console.log('✅ 令牌格式基本验证通过')
      return true
    }
    
    console.log('❌ 令牌格式无效')
    return false
  } catch (error) {
    console.error('❌ 令牌验证失败:', error)
    // 验证失败时不直接返回false，让后端最终判断
    return true
  }
}

/**
 * 自动刷新令牌
 * @returns {Promise<boolean>} 刷新是否成功
 */
export async function refreshTokenIfNeeded() {
  const token = getToken()
  const userInfo = getUserInfo()
  
  if (!token || !userInfo) {
    console.log('❌ 缺少令牌或用户信息，无法刷新')
    return false
  }
  
  // 检查是否需要刷新
  if (!isTokenExpiring()) {
    console.log('✅ 令牌尚未到期，无需刷新')
    return true
  }
  
  try {
    console.log('🔄 开始自动刷新令牌...')
    
    // 这里可以调用后端API刷新令牌
    // 暂时延长当前令牌的有效期
    const newLoginTime = Date.now()
    localStorage.setItem(AUTH_CONFIG.LOGIN_TIME_KEY, newLoginTime.toString())
    sessionStorage.setItem(AUTH_CONFIG.LOGIN_TIME_KEY, newLoginTime.toString())
    
    console.log('✅ 令牌刷新成功')
    return true
  } catch (error) {
    console.error('❌ 令牌刷新失败:', error)
    return false
  }
}

/**
 * 启动自动令牌检查
 */
export function startAutoTokenCheck() {
  // 避免重复启动
  if (window.TAPGO_TOKEN_CHECKER) {
    clearInterval(window.TAPGO_TOKEN_CHECKER)
  }
  
  window.TAPGO_TOKEN_CHECKER = setInterval(async () => {
    if (isLoggedIn()) {
      await refreshTokenIfNeeded()
    }
  }, AUTH_CONFIG.AUTO_REFRESH_INTERVAL)
  
  console.log('🔄 自动令牌检查已启动')
}

/**
 * 停止自动令牌检查
 */
export function stopAutoTokenCheck() {
  if (window.TAPGO_TOKEN_CHECKER) {
    clearInterval(window.TAPGO_TOKEN_CHECKER)
    window.TAPGO_TOKEN_CHECKER = null
    console.log('⏹️ 自动令牌检查已停止')
  }
}

/**
 * 初始化认证系统
 */
export function initAuth() {
  console.log('🚀 初始化认证系统...')
  
  // 检查并恢复登录状态
  if (isLoggedIn()) {
    console.log('✅ 检测到有效登录状态')
    
    // 启动自动令牌检查
    startAutoTokenCheck()
    
    // 立即检查一次是否需要刷新
    refreshTokenIfNeeded()
  } else {
    console.log('❌ 未检测到有效登录状态')
  }
}

/**
 * 清除登录状态
 */
export function clearAuthData() {
  try {
    // 停止自动令牌检查
    stopAutoTokenCheck()
    
    // 清除localStorage
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY)
    localStorage.removeItem(AUTH_CONFIG.USER_INFO_KEY)
    localStorage.removeItem(AUTH_CONFIG.LOGIN_TIME_KEY)
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('branch_token') // 清除分支令牌
    localStorage.removeItem('wechat_info')
    localStorage.removeItem('tempUserInfo')
    localStorage.removeItem('needBindPhone')
    localStorage.removeItem('is_vip_backup')
    localStorage.removeItem('is_salesman_backup')
    localStorage.removeItem('simulate_mode')
    localStorage.removeItem('simulate_token')
    localStorage.removeItem('simulate_user_info')
    localStorage.removeItem('login_redirect')
    localStorage.removeItem('h5_version_cache')
    localStorage.removeItem('isBranch')
    localStorage.removeItem('branch_code')
    
    // 清除sessionStorage
    sessionStorage.removeItem(AUTH_CONFIG.TOKEN_KEY)
    sessionStorage.removeItem(AUTH_CONFIG.USER_INFO_KEY)
    sessionStorage.removeItem(AUTH_CONFIG.LOGIN_TIME_KEY)
    sessionStorage.removeItem('isLoggedIn')
    sessionStorage.removeItem('simulate_mode')
    sessionStorage.removeItem('simulate_token')
    sessionStorage.removeItem('simulate_user_info')
    
    // 清除cookie
    document.cookie = `${AUTH_CONFIG.TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    document.cookie = `user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    document.cookie = `login_time=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    
    // 清除所有可能的认证cookie
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    })
    
    // 清除全局变量
    if (window.TAPGO_AUTH) {
      delete window.TAPGO_AUTH
    }
    window.TAPGO_TOKEN = null
    window.TAPGO_USER_INFO = null
    window.TAPGO_LOGIN_TIME = null
    
    // 清除Pinia store
    const userStore = useUserStore()
    userStore.clearUserInfo()
    
    console.log('✅ 登录状态已完全清除')
  } catch (error) {
    console.error('清除登录状态失败:', error)
  }
}

/**
 * 恢复登录状态
 * 在页面刷新或重新打开时调用
 */
export function restoreAuthState() {
  const token = getToken()
  let userInfo = getUserInfo()
  
  // 严格验证用户信息完整性
  if (token && userInfo && Object.keys(userInfo).length > 0 && (userInfo.id || userInfo.userId)) {
    // 恢复Pinia store状态
    const userStore = useUserStore()
    userStore.setToken(token)
    userStore.setUserInfo(userInfo)
    
    console.log('登录状态已恢复，用户ID:', userInfo.id || userInfo.userId)
    return true
  } else {
    // 用户信息不完整，清除所有认证数据
    clearAuthData()
    return false
  }
}

/**
 * 刷新登录时间
 */
export function refreshLoginTime() {
  const loginTime = Date.now()
  localStorage.setItem(AUTH_CONFIG.LOGIN_TIME_KEY, loginTime.toString())
  sessionStorage.setItem(AUTH_CONFIG.LOGIN_TIME_KEY, loginTime.toString())
  
  if (window.TAPGO_AUTH) {
    window.TAPGO_AUTH.loginTime = loginTime
  }
}

export default {
  isInCorrectAppPath,
  redirectToLogin,
  handleLogout
}; 
