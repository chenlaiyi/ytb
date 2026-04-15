import request from '@/utils/request'

/**
 * 分支机构用户相关API
 */

// 获取分支机构用户信息
export function getBranchUserInfo(params = {}) {
  return request({
    url: '/api/branch/user/info',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 更新分支机构用户信息
export function updateBranchUserInfo(data) {
  return request({
    url: '/api/branch/user/update',
    method: 'post',
    data,
    skipAuthToken: true
  })
}

// 获取分支机构用户资产信息
export function getBranchUserAssets(params = {}) {
  return request({
    url: '/api/branch/user/assets',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构用户订单列表
export function getBranchUserOrders(params = {}) {
  return request({
    url: '/api/branch/user/orders',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构用户设备列表
export function getBranchUserDevices(params = {}) {
  return request({
    url: '/api/branch/user/devices',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构用户积分记录
export function getBranchUserPoints(params = {}) {
  return request({
    url: '/api/branch/user/points',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构用户地址列表
export function getBranchUserAddresses(params = {}) {
  return request({
    url: '/api/branch/user/addresses',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 添加分支机构用户地址
export function addBranchUserAddress(data) {
  return request({
    url: '/api/branch/user/address/add',
    method: 'post',
    data,
    skipAuthToken: true
  })
}

// 更新分支机构用户地址
export function updateBranchUserAddress(data) {
  return request({
    url: '/api/branch/user/address/update',
    method: 'post',
    data,
    skipAuthToken: true
  })
}

// 删除分支机构用户地址
export function deleteBranchUserAddress(id) {
  return request({
    url: `/api/branch/user/address/delete/${id}`,
    method: 'post',
    skipAuthToken: true
  })
}

// 获取分支机构用户钱包信息
export function getBranchUserWallet(params = {}) {
  return request({
    url: '/api/branch/user/wallet',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构用户钱包交易记录
export function getBranchUserWalletRecords(params = {}) {
  return request({
    url: '/api/branch/user/wallet/records',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 分支机构用户钱包充值
export function branchUserWalletRecharge(data) {
  return request({
    url: '/api/branch/user/wallet/recharge',
    method: 'post',
    data,
    skipAuthToken: true
  })
}

// 分支机构用户钱包提现
export function branchUserWalletWithdraw(data) {
  return request({
    url: '/api/branch/user/wallet/withdraw',
    method: 'post',
    data,
    skipAuthToken: true
  })
}

// 提交分支机构用户反馈
export function submitBranchUserFeedback(data) {
  return request({
    url: '/api/branch/user/feedback',
    method: 'post',
    data,
    skipAuthToken: true
  })
}

// 获取分支机构帮助文档
export function getBranchHelpDocs(params = {}) {
  return request({
    url: '/api/branch/help/docs',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构用户设置
export function getBranchUserSettings(params = {}) {
  return request({
    url: '/api/branch/user/settings',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 更新分支机构用户设置
export function updateBranchUserSettings(data) {
  return request({
    url: '/api/branch/user/settings/update',
    method: 'post',
    data,
    skipAuthToken: true
  })
}

// 获取分支机构通知列表
export function getBranchNotifications(params = {}) {
  return request({
    url: '/api/branch/notifications',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 标记分支机构通知为已读
export function markBranchNotificationRead(id) {
  return request({
    url: `/api/branch/notification/read/${id}`,
    method: 'post',
    skipAuthToken: true
  })
}

// 获取分支机构新闻资讯
export function getBranchNews(params = {}) {
  return request({
    url: '/api/branch/news',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构社区动态
export function getBranchCommunity(params = {}) {
  return request({
    url: '/api/branch/community',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构活动列表
export function getBranchEvents(params = {}) {
  return request({
    url: '/api/branch/events',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 参与分支机构活动
export function joinBranchEvent(eventId) {
  return request({
    url: `/api/branch/event/join/${eventId}`,
    method: 'post',
    skipAuthToken: true
  })
}

// 获取分支机构产品列表
export function getBranchProducts(params = {}) {
  return request({
    url: '/api/branch/products',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

// 获取分支机构产品详情
export function getBranchProductDetail(productId) {
  return request({
    url: `/api/branch/product/${productId}`,
    method: 'get',
    skipAuthToken: true
  })
}

// 分支机构用户退出登录
export function branchUserLogout() {
  return request({
    url: '/api/branch/user/logout',
    method: 'post',
    skipAuthToken: true
  })
}

// 钱包相关API别名（兼容新页面）
export const getBranchWalletInfo = getBranchUserWallet
export const getBranchTransactions = getBranchUserWalletRecords
export const recharge = branchUserWalletRecharge
export const withdraw = branchUserWalletWithdraw

// 帮助中心API
export function getBranchHelpData() {
  return request({
    url: '/api/branch/help/data',
    method: 'get',
    skipAuthToken: true
  })
}

export function searchHelpContent(params) {
  return request({
    url: '/api/branch/help/search',
    method: 'get',
    params,
    skipAuthToken: true
  })
}

export function likeHelpQuestion(data) {
  return request({
    url: '/api/branch/help/like',
    method: 'post',
    data,
    skipAuthToken: true
  })
}

// 反馈相关API
export const submitFeedback = submitBranchUserFeedback

export function getFeedbackHistory() {
  return request({
    url: '/api/branch/feedback/history',
    method: 'get',
    skipAuthToken: true
  })
}

export function uploadFeedbackImage(data) {
  return request({
    url: '/api/branch/feedback/upload',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    skipAuthToken: true
  })
}

// 退出登录别名
export const logout = branchUserLogout 