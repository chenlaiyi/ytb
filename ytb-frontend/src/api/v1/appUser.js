import service from '@/utils/axios'

// 获取APP用户列表
export function getUsers(params) {
  return service({
    url: '/api/admin/v1/app-users',
    method: 'get',
    params
  })
}

// 获取APP用户详情
export function getUserDetail(id) {
  return service({
    url: `/api/admin/v1/app-users/${id}`,
    method: 'get'
  })
}

// 创建APP用户
export function createUser(data) {
  return service({
    url: '/api/admin/v1/app-users',
    method: 'post',
    data
  })
}

// 更新APP用户
export function updateUser(id, data) {
  return service({
    url: `/api/admin/v1/app-users/${id}`,
    method: 'put',
    data
  })
}

// 删除APP用户
export function deleteUser(id) {
  return service({
    url: `/api/admin/v1/app-users/${id}`,
    method: 'delete'
  })
}

// 更新用户状态
export function updateUserStatus(id, status) {
  return service({
    url: `/api/admin/v1/app-users/${id}/status`,
    method: 'patch',
    data: { status }
  })
}

// 重置用户密码
export function resetUserPassword(id) {
  return service({
    url: `/api/admin/v1/app-users/${id}/reset-password`,
    method: 'post'
  })
}

// 获取用户订单
export function getUserOrders(id, params) {
  return service({
    url: `/api/admin/v1/app-users/${id}/orders`,
    method: 'get',
    params
  })
}

// 获取用户设备
export function getUserDevices(id, params) {
  return service({
    url: `/api/admin/v1/app-users/${id}/devices`,
    method: 'get',
    params
  })
}

// 添加设备到用户
export function addUserDevice(userId, deviceId) {
  return service({
    url: `/api/admin/v1/app-users/${userId}/devices`,
    method: 'post',
    data: { device_id: deviceId }
  })
}

// 从用户移除设备
export function removeUserDevice(userId, deviceId) {
  return service({
    url: `/api/admin/v1/app-users/${userId}/devices/${deviceId}`,
    method: 'delete'
  })
}

// 获取用户统计信息
export function getUserStats(id) {
  return service({
    url: `/api/admin/v1/app-users/${id}/stats`,
    method: 'get'
  })
}

// 同步所有用户角色
export function syncAllUserRoles() {
  return service({
    url: '/api/admin/v1/app-users/sync-roles',
    method: 'post'
  })
}

// 同步单个用户角色
export function syncUserRoles(id) {
  return service({
    url: `/api/admin/v1/app-users/${id}/sync-roles`,
    method: 'post'
  })
}

// 同步到业务员系统
export function syncUsersToSalesmen() {
  return service({
    url: '/api/admin/v1/app-users/sync-to-salesmen',
    method: 'post'
  })
}

// 批量操作用户
export function batchOperateUsers(ids, action, data = {}) {
  return service({
    url: '/api/admin/v1/app-users/batch-operate',
    method: 'post',
    data: { ids, action, ...data }
  })
}

// 导出用户数据
export function exportUsers(params) {
  return service({
    url: '/api/admin/v1/app-users/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取用户VIP信息
export function getUserVipInfo(id) {
  return service({
    url: `/api/admin/v1/app-users/${id}/vip`,
    method: 'get'
  })
}

// 更新用户VIP状态
export function updateUserVip(id, data) {
  return service({
    url: `/api/admin/v1/app-users/${id}/vip`,
    method: 'put',
    data
  })
}

// 获取用户推荐关系
export function getUserReferrals(id, params) {
  return service({
    url: `/api/admin/v1/app-users/${id}/referrals`,
    method: 'get',
    params
  })
}

// 获取用户钱包信息
export function getUserWallet(id) {
  return service({
    url: `/api/admin/v1/app-users/${id}/wallet`,
    method: 'get'
  })
}

// 获取用户交易记录
export function getUserTrades(id, params) {
  return service({
    url: `/api/admin/v1/app-users/${id}/trades`,
    method: 'get',
    params
  })
}

// 获取APP用户统计数据
export function getUserStatistics(params) {
  return service({
    url: '/api/admin/v1/app-users/statistics',
    method: 'get',
    params
  })
}

export default {
  getUsers,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  resetUserPassword,
  getUserOrders,
  getUserDevices,
  addUserDevice,
  removeUserDevice,
  getUserStats,
  syncAllUserRoles,
  syncUserRoles,
  syncUsersToSalesmen,
  batchOperateUsers,
  exportUsers,
  getUserVipInfo,
  updateUserVip,
  getUserReferrals,
  getUserWallet,
  getUserTrades,
  getUserStatistics
}
