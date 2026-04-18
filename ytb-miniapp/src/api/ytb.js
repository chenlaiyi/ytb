/**
 * YTB 核心业务 API
 */
import { get, post } from './request'

// 小程序登录（code 换 token）
export const miniappLogin = (code) => post('/api/ytb/miniapp-login', { code })

// 获取用户信息
export const getUserInfo = () => get('/api/ytb/user/me')

// 获取设备列表
export const getDevices = (params) => get('/api/ytb/devices', params)
export const getDeviceDetail = (id) => get(`/api/ytb/devices/${id}`)

// 获取佣金列表
export const getCommissions = (params) => get('/api/ytb/user/commissions', params)

// 获取提现列表
export const getWithdrawals = (params) => get('/api/ytb/withdraw/list', params)
export const applyWithdraw = (data) => post('/api/ytb/withdraw/apply', data)

// 获取团队列表
export const getTeam = (params) => get('/api/ytb/user/team', params)

// 获取装机记录
export const getInstallations = (params) => get('/api/ytb/installations', params)

// 获取邀请码
export const getInviteCode = () => get('/api/ytb/user/invite-code')

// 获取海报
export const getPosters = (params) => get('/api/ytb/posters', params)

// 更新用户资料
export const updateProfile = (data) => post('/api/ytb/user/update', data)

// 获取套餐列表
export const getPackages = (params) => get('/api/ytb/packages', params)

export default {
  miniappLogin,
  getUserInfo,
  updateProfile,
  getDevices,
  getDeviceDetail,
  getCommissions,
  getWithdrawals,
  applyWithdraw,
  getTeam,
  getInstallations,
  getInviteCode,
  getPosters,
  getPackages,
}
