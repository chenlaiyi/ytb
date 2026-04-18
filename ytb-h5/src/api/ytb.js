/**
 * 亿拓宝 API 接口
 */
import axios from 'axios'
import request from '@/utils/request'
import { getYtbApiBaseUrl, getYtbLoginUrl } from '@/utils/ytb'

const BASE_URL = getYtbApiBaseUrl()
let ytbAuthRedirecting = false

// 创建 axios 实例
const ytbApi = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加 token
ytbApi.interceptors.request.use(
  config => {
    const token = localStorage.getItem('ytb_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
ytbApi.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      // 清除登录信息
      localStorage.removeItem('ytb_token')
      localStorage.removeItem('ytb_user')
      // 跳转到登录页
      if (!ytbAuthRedirecting) {
        ytbAuthRedirecting = true
        window.location.replace(getYtbLoginUrl())
      }
    }
    return Promise.reject(error)
  }
)

// ==================== 公开接口 ====================

/**
 * 获取系统配置
 */
export function getConfig() {
  return ytbApi.get('/config')
}

/**
 * 获取微信登录URL
 */
export function getWechatLoginUrl(redirectUrl = '/home') {
  const clearStaleAuthArtifacts = () => {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('login_time')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('userInfo')
      sessionStorage.removeItem('login_time')

      const expireCookie = (name) => {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
      }
      expireCookie('token')
      expireCookie('tapgo_token')
      expireCookie('user_id')
      expireCookie('login_time')
    } catch (error) {
      console.warn('[ytb-wechat-login-url] 清理旧认证态失败:', error)
    }
  }

  const requestWechatLoginUrl = (targetRedirectUrl) => request({
    url: '/api/ytb/auth/login-url',
    method: 'get',
    params: {
      redirect_url: targetRedirectUrl || '/home',
      _t: Date.now()
    },
    timeout: 10000,
    skipCache: true,
    skipAuth: true,
    skipAuthError: true,
    skipAuthErrorToast: true
  })

  const target = typeof redirectUrl === 'string' ? decodeURIComponent(redirectUrl) : '/home'
  return requestWechatLoginUrl(target).catch((error) => {
    const httpStatus = error?.response?.status
    const apiCode = Number(error?.code)
    if (httpStatus === 401 || apiCode === 401 || apiCode === 1001 || apiCode === 1002) {
      clearStaleAuthArtifacts()
      return requestWechatLoginUrl(target)
    }
    return Promise.reject(error)
  })
}

/**
 * 验证邀请码
 */
export function validateInviteCode(inviteCode) {
  return ytbApi.post('/invite-code/validate', {
    invite_code: inviteCode
  })
}

// ==================== 需要登录的接口 ====================

/**
 * 获取当前用户信息
 */
export function getUserInfo() {
  return ytbApi.get('/user/me')
}

/**
 * 更新用户信息
 */
export function updateUserInfo(data) {
  return ytbApi.post('/user/update', data)
}

/**
 * 绑定上级
 */
export function bindParent(inviteCode) {
  return ytbApi.post('/user/bind-parent', {
    invite_code: inviteCode
  })
}

/**
 * 获取我的邀请码
 */
export function getInviteCode() {
  return ytbApi.get('/user/invite-code')
}

/**
 * 获取团队成员列表
 */
export function getTeamMembers(params = {}) {
  return ytbApi.get('/user/team', { params })
}

/**
 * 获取分佣记录
 */
export function getCommissions(params = {}) {
  return ytbApi.get('/user/commissions', { params })
}

/**
 * 退出登录
 */
export function logout() {
  return ytbApi.post('/auth/logout')
}

// ==================== 升级相关接口 ====================

/**
 * 获取升级信息
 */
export function getUpgradeInfo() {
  return ytbApi.get('/upgrade/info')
}

/**
 * 通过邀请码申请升级SCP
 */
export function applyScpByInviteCode(data) {
  return ytbApi.post('/upgrade/scp/invite-code', data)
}

/**
 * 付费申请升级SCP
 */
export function applyScpByPayment(paymentMethod) {
  return ytbApi.post('/upgrade/scp/payment', {
    payment_method: paymentMethod
  })
}

/**
 * 申请升级VIPCP（仅业绩达标可申请）
 */
export function applyTeamCp() {
  return ytbApi.post('/upgrade/team-cp')
}

/**
 * 获取升级申请列表
 */
export function getApplications(params = {}) {
  return ytbApi.get('/upgrade/applications', { params })
}

/**
 * 取消升级申请
 */
export function cancelApplication(id) {
  return ytbApi.post(`/upgrade/applications/${id}/cancel`)
}

// ==================== 提现相关接口 ====================

/**
 * 获取提现信息
 */
export function getWithdrawInfo() {
  return ytbApi.get('/withdraw/info')
}

/**
 * 计算提现费用
 */
export function calculateWithdrawFees(amount) {
  return ytbApi.post('/withdraw/calculate', { amount })
}

/**
 * 申请提现
 */
export function applyWithdraw(data) {
  return ytbApi.post('/withdraw/apply', data)
}

/**
 * 获取提现记录列表
 */
export function getWithdrawals(params = {}) {
  return ytbApi.get('/withdraw/list', { params })
}

/**
 * 取消提现申请
 */
export function cancelWithdraw(id) {
  return ytbApi.post(`/withdraw/${id}/cancel`)
}

// ==================== 设备相关接口 ====================

/**
 * 获取我的设备列表
 */
export function getMyDevices(params = {}) {
  return ytbApi.get('/devices', { params })
}

/**
 * 获取设备详情
 */
export function getDeviceDetail(deviceId) {
  return ytbApi.get(`/devices/${deviceId}`)
}

// ==================== BossCP 相关接口 ====================

/**
 * 申请升级BossCP
 */
export function applyBossCp(paymentMethod) {
  return ytbApi.post('/upgrade/boss-cp', {
    payment_method: paymentMethod
  })
}

/**
 * 获取投资列表
 */
export function getInvestments(params = {}) {
  return ytbApi.get('/investments', { params })
}

/**
 * 获取投资统计
 */
export function getInvestmentStats() {
  return ytbApi.get('/investments/stats')
}

/**
 * 获取投资详情
 */
export function getInvestmentDetail(id) {
  return ytbApi.get(`/investments/${id}`)
}

// ==================== 安装推广相关接口 ====================

/**
 * 获取安装记录
 */
export function getInstallations(params = {}) {
  return ytbApi.get('/installations', { params })
}

/**
 * 获取安装推广统计
 */
export function getInstallationStats() {
  return ytbApi.get('/installations/stats')
}

/**
 * 获取推广海报
 */
export function getPosters(params = {}) {
  return ytbApi.get('/posters', { params })
}

// ==================== 工具函数 ====================

/**
 * 检查是否已登录
 */
export function isLoggedIn() {
  return !!localStorage.getItem('ytb_token')
}

/**
 * 获取本地存储的用户信息
 */
export function getLocalUser() {
  const userStr = localStorage.getItem('ytb_user')
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch (e) {
      return null
    }
  }
  return null
}

/**
 * 清除登录信息
 */
export function clearAuth() {
  localStorage.removeItem('ytb_token')
  localStorage.removeItem('ytb_user')
}

export default ytbApi
