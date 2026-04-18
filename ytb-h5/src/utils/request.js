import '../polyfills/globalThis'
import axios from 'axios'
import axiosUtils from 'axios/lib/utils.js'
import { showToast } from 'vant'

const SUPPRESS_MESSAGES = ['系统错误', '系统内部错误', '系统繁忙', '系统异常', 'System error', 'Internal Server Error']

const shouldSuppressMessage = (message) => {
  if (!message) return true
  const trimmed = String(message).trim()
  if (!trimmed) return true
  return SUPPRESS_MESSAGES.some(keyword => trimmed.includes(keyword))
}

const ADMIN_TOKEN_KEY = 'admin_token'
const ADMIN_USER_KEY = 'admin_user_info'
const ADMIN_LOGIN_TIME_KEY = 'admin_login_time'
const ADMIN_PREFIXES = ['/api/admin/', '/admin/api/', '/admin/v1/', '/api/v1/admin/', '/Tapp/admin/public/api/']
// 注意：不要在这里直接导入 Pinia store，避免出现循环依赖导致的初始化异常

const AUTH_ERROR_CODES = new Set([401, 1001, 1002])
const INSTITUTION_PERMISSION_PATTERNS = [
  /无权访问机构/,
  /无权限访问机构/,
  /无权限访问机构数据/,
  /无权限访问支付机构/,
  /无支付机构权限/,
  /缺少支付机构权限/,
  /机构权限不足/,
  /institution\s+permission/i
]

const PERMISSION_KEYWORDS = [
  '权限',
  '無權',
  '无权',
  '权限不足',
  '没有权限',
  '未开通',
  '未启用',
  '未加入',
  '未赋予',
  '禁止访问',
  '仅限',
  'forbidden',
  'permission',
  'not allowed',
  'not permitted',
  'access denied'
]

const LOGIN_ERROR_KEYWORDS = [
  '登录',
  '登入',
  'token',
  '令牌',
  'auth',
  '认证',
  'session',
  'expired',
  'unauthorized',
  '未授权访问',
  'login'
]

const PERMISSION_TOLERANT_URL_PATTERNS = [
  /\/api\/mobile\/v1\/institution\//i,
  /\/api\/mobile\/v1\/business\/merchant\//i,
  /\/api\/tea-farmer\//i,
  /\/api\/mobile\/v1\/salesman\//i,
  /\/api\/mobile\/v1\/vip\//i,
  /\/api\/mobile\/v1\/engineer\//i,
  /\/api\/mobile\/v1\/meituan\//i,
  /\/api\/mobile\/v1\/branch\//i,
  /\/api\/mobile\/v1\/installation\//i,
  /\/api\/mobile\/v1\/invite\//i
]

const isAdminRequest = (config) => {
  if (config?.forceAppAuth) {
    return false;
  }
  const url = (config?.url || '').toString()
  if (!url) return false
  return ADMIN_PREFIXES.some(prefix => url.startsWith(prefix) || url.includes(prefix))
}

const normalizeCode = (value) => {
  if (value === undefined || value === null || value === '') return undefined
  const num = Number(value)
  return Number.isNaN(num) ? undefined : num
}

const isInstitutionApiRequest = (config) => {
  if (!config) return false
  const url = (config.url || '').toString()
  if (!url) return false
  return url.includes('/api/mobile/v1/institution/')
}

const extractMessage = (payload) => {
  if (!payload) {
    return ''
  }
  if (typeof payload === 'string') {
    return payload
  }
  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message
  }
  if (typeof payload.msg === 'string' && payload.msg.trim()) {
    return payload.msg
  }
  if (payload.data) {
    return extractMessage(payload.data)
  }
  return ''
}

const includesKeyword = (message, keywords = []) => {
  if (!message) {
    return false
  }
  const normalized = message.toLowerCase()
  return keywords.some(keyword => normalized.includes(keyword.toLowerCase()))
}

const shouldPreserveAuthState = (config = {}, payload = {}, statusCode) => {
  if (isAdminRequest(config)) {
    return false
  }

  const normalizedCode = normalizeCode(payload?.code ?? statusCode)
  if (normalizedCode === 1001 || normalizedCode === 1002) {
    return false
  }

  if (config.preserveAuthOnAuthError || config.preserveAuthState || config.skipAuthError) {
    return true
  }

  if (isInstitutionPermissionDeniedResponse(config, payload, statusCode)) {
    return true
  }

  const message = extractMessage(payload)
  const looksLikePermission = includesKeyword(message, PERMISSION_KEYWORDS)
  const looksLikeLoginIssue = includesKeyword(message, LOGIN_ERROR_KEYWORDS)

  if (looksLikePermission && !looksLikeLoginIssue) {
    return true
  }

  if (!message && normalizedCode === 403 && config?.url) {
    return PERMISSION_TOLERANT_URL_PATTERNS.some(pattern => pattern.test(config.url))
  }

  if (config?.url && PERMISSION_TOLERANT_URL_PATTERNS.some(pattern => pattern.test(config.url))) {
    if (!message || looksLikePermission) {
      return true
    }
  }

  return false
}

const isInstitutionPermissionDeniedResponse = (config, payload, statusCode) => {
  if (!isInstitutionApiRequest(config)) {
    return false
  }
  const message = String(extractMessage(payload) || '').trim()
  if (!message) {
    const normalizedCode = normalizeCode(payload?.code ?? statusCode)
    if (normalizedCode === 401 || normalizedCode === 403) {
      return true
    }
    return false
  }
  if (INSTITUTION_PERMISSION_PATTERNS.some(pattern => pattern.test(message))) {
    return true
  }
  const normalizedCode = normalizeCode(payload?.code ?? statusCode)
  return normalizedCode === 401 || normalizedCode === 403
}

// 旧版微信 WebView 不支持 fetch/Request 对象，强制使用 XHR 适配器
if (axios && axios.defaults && typeof window !== 'undefined') {
  // 确保使用XHR适配器
  const originalCreate = axios.create
  axios.create = function(config) {
    const instance = originalCreate.call(this, config)
    instance.defaults.adapter = 'xhr'
    return instance
  }
}

const getCookieValue = (name) => {
  if (typeof document === 'undefined') {
    return ''
  }
  const cookies = document.cookie ? document.cookie.split(';') : []
  for (let i = 0; i < cookies.length; i += 1) {
    const cookie = cookies[i].trim()
    if (cookie.startsWith(`${name}=`)) {
      return decodeURIComponent(cookie.substring(name.length + 1))
    }
  }
  return ''
}

const globalRef = typeof globalThis !== 'undefined'
  ? globalThis
  : typeof window !== 'undefined'
    ? window
    : typeof self !== 'undefined'
      ? self
      : {}

if (axiosUtils && typeof axiosUtils === 'object') {
  axiosUtils.global = globalRef
}

if (typeof window !== 'undefined') {
  window.__APP_AXIOS__ = axios
  if (!window.axios) {
    window.axios = axios
  }
}

function resolveUserId(config) {
  try {
    const isAdmin = isAdminRequest(config)
    const cachedUser = isAdmin
      ? localStorage.getItem(ADMIN_USER_KEY) || sessionStorage.getItem(ADMIN_USER_KEY)
      : localStorage.getItem('userInfo') || sessionStorage.getItem('simulate_user_info')
    if (!cachedUser) {
      return null
    }

    const userInfo = JSON.parse(cachedUser)
    return userInfo?.userId || userInfo?.id || null
  } catch (error) {
    console.warn('[request] 解析用户信息失败，已忽略 X-User-ID 设置:', error)
    return null
  }
}

function clearAppAuthState() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('login_time')
    localStorage.removeItem('isLoggedIn')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('userInfo')
    sessionStorage.removeItem('login_time')
    sessionStorage.removeItem('simulate_token')
    sessionStorage.removeItem('simulate_user_info')
    sessionStorage.removeItem('simulate_mode')

    const expireCookie = (name) => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
    }
    expireCookie('token')
    expireCookie('user_id')
    expireCookie('login_time')

    if (window.TAPGO_AUTH) {
      delete window.TAPGO_AUTH.token
      delete window.TAPGO_AUTH.userInfo
      delete window.TAPGO_AUTH.loginTime
    }
  } catch (error) {
    console.warn('[request] 清理认证状态失败:', error)
  }
}

function clearAdminAuthState() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    localStorage.removeItem(ADMIN_USER_KEY)
    localStorage.removeItem(ADMIN_LOGIN_TIME_KEY)
    sessionStorage.removeItem(ADMIN_TOKEN_KEY)
    sessionStorage.removeItem(ADMIN_USER_KEY)
    sessionStorage.removeItem(ADMIN_LOGIN_TIME_KEY)
    localStorage.removeItem('branch_admin_token')
    localStorage.removeItem('admin_auth_token')
    sessionStorage.removeItem('admin_auth_token')
  } catch (error) {
    console.warn('[request] 清理管理员认证状态失败:', error)
  }
}

const getAppToken = () => {
  // ⚠️ 安全优化: 优先从Cookie获取token（而非localStorage）
  // Cookie比localStorage更安全，特别是设置了httpOnly时
  return (
    getCookieValue('token') ||
    getCookieValue('tapgo_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('branch_token') ||
    sessionStorage.getItem('token')
  )
}

const getAdminToken = () => {
  return (
    localStorage.getItem(ADMIN_TOKEN_KEY) ||
    sessionStorage.getItem(ADMIN_TOKEN_KEY) ||
    localStorage.getItem('admin_auth_token') ||
    sessionStorage.getItem('admin_auth_token') ||
    localStorage.getItem('branch_admin_token') ||
    getCookieValue('admin_token')
  )
}

function shouldSkipAuthToast(config) {
  return Boolean(config && config.skipAuthErrorToast)
}

function shouldSkipAuthHandling(config) {
  return Boolean(config && config.skipAuthError)
}

const clearAuthByConfig = (config) => {
  if (isAdminRequest(config)) {
    clearAdminAuthState()
  } else {
    clearAppAuthState()
  }
}

// 请求缓存
const requestCache = new Map()

// 清理过期缓存
const cleanExpiredCache = () => {
  const now = Date.now()
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > 60000) { // 1分钟过期
      requestCache.delete(key)
    }
  }
}

// 定期清理缓存
setInterval(cleanExpiredCache, 30000) // 每30秒清理一次

// 创建axios实例
const service = axios.create({
  baseURL: '',
  timeout: 10000, // 减少超时时间到10秒
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 确保method属性存在
    if (!config.method) {
      config.method = 'get'
    }

    const method = config.method.toString().toLowerCase()
    config.method = method

    // 检查缓存（仅对GET请求）
    if (method === 'get' && !config.skipCache) {
      const cacheKey = `${config.url}:${JSON.stringify(config.params || {})}`
      const cached = requestCache.get(cacheKey)

      if (cached && Date.now() - cached.timestamp < 60000) {
        config.adapter = async () => ({
          data: cached.data,
          status: 200,
          statusText: 'OK',
          headers: { 'X-Cache-Hit': 'true' },
          config,
          request: {}
        })
      } else {
        config.__cacheKey = cacheKey
      }
    }

    // 在发送请求之前做些什么
    // 可以在这里添加token等认证信息
    const isAdmin = isAdminRequest(config)
    const skipAuth = Boolean(config?.skipAuth)
    let token = null

    if (!skipAuth) {
      try {
        const simulateMode = sessionStorage.getItem('simulate_mode')
        const simulateToken = sessionStorage.getItem('simulate_token')

        if (!isAdmin && simulateMode === 'true' && simulateToken) {
          token = simulateToken
          config.headers['X-Simulate-Mode'] = 'true'
        } else {
          token = isAdmin ? getAdminToken() : getAppToken()
        }
      } catch (e) {
        console.warn('[request] 读取token失败，将继续尝试默认流程:', e)
        token = isAdmin ? getAdminToken() : getAppToken()
      }
    }

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    // 设置默认Content-Type
    if (config?.method?.toLowerCase() === 'post' && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json'
    }
    
    // 添加CSRF-Token支持
    const xsrfToken = getCookieValue('XSRF-TOKEN');
    if (xsrfToken) {
      config.headers['X-XSRF-TOKEN'] = xsrfToken;
    }

    // 尝试从meta标签获取CSRF令牌
    const metaToken = document.querySelector('meta[name="csrf-token"]');
    if (metaToken) {
      config.headers['X-CSRF-TOKEN'] = metaToken.getAttribute('content');
    }
    
    // 确保用户ID被正确传递
    if (!skipAuth) {
      const userId = resolveUserId(config);
      if (userId) {
        config.headers['X-User-ID'] = userId;
      }
    }
    
    return config
  },
  error => {
    // 对请求错误做些什么
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 对响应数据做点什么
    const res = response.data
    
    // 这里可以根据后端返回的状态码进行统一处理
    if (res.code !== undefined && res.code !== 0) {
      const responseCode = normalizeCode(res.code)
      const isAuthError = responseCode !== undefined && AUTH_ERROR_CODES.has(responseCode)
      let skipAuthHandling = isAuthError && shouldSkipAuthHandling(response.config)
      const institutionPermissionDenied = isAuthError && isInstitutionPermissionDeniedResponse(response.config, res, response.status)
      const preserveAuthState = isAuthError && shouldPreserveAuthState(response.config, res, response.status)
      if (institutionPermissionDenied || preserveAuthState) {
        skipAuthHandling = true
      }
      const skipAuthToast = isAuthError && (shouldSkipAuthToast(response.config) || institutionPermissionDenied || preserveAuthState)
      const skipErrorToast = response.config && response.config.skipErrorToast

      // 显示错误消息
      if (
        res.message &&
        !(isAuthError && (skipAuthToast || skipAuthHandling)) &&
        !shouldSuppressMessage(res.message) &&
        !skipErrorToast
      ) {
        showToast(res.message)
      }
      
      // 处理特定错误码
      if (isAuthError && !skipAuthHandling) {
        clearAuthByConfig(response.config)
      }

      const error = new Error(res.message || '请求失败')
      error.code = responseCode ?? res.code
      error.isAuthError = isAuthError
      error.isPermissionIssue = Boolean(preserveAuthState)
      error.response = {
        ...response,
        data: res
      }
      error.config = response.config
      return Promise.reject(error)
    }
    
    // 缓存GET请求的响应
    if (response.config?.method === 'get' && !response.config.skipCache) {
      const cacheKey = response.config.__cacheKey || `${response.config.url}:${JSON.stringify(response.config.params || {})}`
      requestCache.set(cacheKey, {
        data: res,
        timestamp: Date.now()
      })
      delete response.config.__cacheKey
    }
    
    return res
  },
  error => {
    // 对响应错误做点什么
    console.error('响应错误:', error)
    
    let message = '网络错误'
    const config = error.config || {}
    const skipAuthToast = shouldSkipAuthToast(config)
    let skipAuthHandling = shouldSkipAuthHandling(config)
    let isAuthErrorResponse = false
    let preserveAuthStateFlag = false
    
    if (error.response) {
      // 请求已发出，服务器响应状态码不在2xx范围内
      const status = error.response.status
      const data = error.response.data
      const responseCode = normalizeCode(data?.code)
      const isAuthError = status === 401 || (responseCode !== undefined && AUTH_ERROR_CODES.has(responseCode))
      const institutionPermissionDenied = isAuthError && isInstitutionPermissionDeniedResponse(config, data, status)
      const preserveAuthState = isAuthError && shouldPreserveAuthState(config, data, status)
      if (institutionPermissionDenied || preserveAuthState) {
        skipAuthHandling = true
      }
      if (preserveAuthState) {
        preserveAuthStateFlag = true
      }
      
      switch (status) {
        case 400:
          message = data.message || '请求参数错误'
          break
        case 401:
          message = data.message || '未授权访问'
          if (isAuthError) {
            isAuthErrorResponse = true
            if (!skipAuthHandling) {
              clearAuthByConfig(error.config)
            }
            if (skipAuthToast || skipAuthHandling || institutionPermissionDenied || preserveAuthState) {
              message = ''
            }
          }
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 405:
          message = '请求方法不允许'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        default:
          message = data.message || `连接错误${status}`
      }
      if (isAuthError && !isAuthErrorResponse) {
        isAuthErrorResponse = true
        if (skipAuthHandling || institutionPermissionDenied || preserveAuthState) {
          message = ''
        }
        if (!skipAuthHandling) {
          clearAuthByConfig(error.config)
        }
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      message = '网络连接超时'
    } else {
      // 发送请求时出了点问题
      message = error.message || '请求失败'
    }
    
    const skipErrorToast = config.skipErrorToast

    if (
      message &&
      !(skipAuthToast && isAuthErrorResponse) &&
      !shouldSuppressMessage(message) &&
      !skipErrorToast &&
      !(skipAuthHandling && isAuthErrorResponse)
    ) {
      showToast(message)
    }

    error.isAuthError = Boolean(isAuthErrorResponse)
    error.isPermissionIssue = Boolean(isAuthErrorResponse && (preserveAuthStateFlag || shouldPreserveAuthState(config, error?.response?.data, error?.response?.status)))

    return Promise.reject(error)
  }
)

export default service

// 为了兼容现有代码，同时导出request
export const request = service
