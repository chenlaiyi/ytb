import request from '@/utils/request'

/**
 * 净水器管理API
 * 对接七云智联IOT平台
 */

// 获取设备列表
export function getWaterPurifiers(params) {
  return request({
    url: '/api/admin/v1/water-purifier',
    method: 'get',
    params
  })
}

// 获取设备详情
export function getWaterPurifierDetail(id, params = {}) {
  return request({
    url: `/api/admin/v1/water-purifier/${id}`,
    method: 'get',
    params
  })
}

// 更新设备信息
export function updateWaterPurifier(id, data) {
  return request({
    url: `/api/admin/v1/water-purifier/${id}`,
    method: 'put',
    data
  })
}

// 初始化设备（激活并设置滤芯初始值）
export function initializeDevice(id, data) {
  return request({
    url: `/api/admin/v1/water-purifier/${id}/initialize`,
    method: 'post',
    data
  })
}

// 重置滤芯
export function resetFilters(id, data) {
  return request({
    url: `/api/admin/v1/water-purifier/${id}/reset-filters`,
    method: 'post',
    data
  })
}

// 从本地数据同步滤芯
export function syncFiltersFromLocal(id) {
  return request({
    url: `/api/admin/v1/water-purifier/${id}/sync-filters-local`,
    method: 'post'
  })
}

// 远程控制设备
export function controlDevice(id, action) {
  return request({
    url: `/api/admin/v1/water-purifier/${id}/control`,
    method: 'post',
    data: { action }
  })
}

// 获取设备操作日志
export function getDeviceLogs(id, params = {}) {
  return request({
    url: `/api/admin/v1/water-purifier/${id}/logs`,
    method: 'get',
    params
  })
}

// 获取套餐列表
export function getPackages(params = {}) {
  return request({
    url: '/api/admin/v1/water-purifier/packages/list',
    method: 'get',
    params
  })
}

// 获取充值记录
export function getRechargeRecords(params = {}) {
  return request({
    url: '/api/admin/v1/water-purifier/recharge/records',
    method: 'get',
    params
  })
}

// 获取滤芯配置模板
export function getFilterTemplates() {
  return request({
    url: '/api/admin/v1/water-purifier/filter-templates',
    method: 'get'
  })
}

// 控制动作常量
export const CONTROL_ACTIONS = {
  POWER_ON: 'power_on',
  POWER_OFF: 'power_off',
  LOCK: 'lock',
  UNLOCK: 'unlock',
  FLUSH: 'flush',
  QUERY: 'query'
}

// 设备状态常量
export const DEVICE_STATUS = {
  PENDING: 'pending',
  INSTALLED: 'installed',
  ACTIVATED: 'activated',
  LOCKED: 'locked',
  FAULT: 'fault'
}

// 计费模式常量
export const BILLING_MODES = {
  TIME: '01',
  FLOW: '02',
  RETAIL: '03'
}

// 计费模式文本映射
export const BILLING_MODE_TEXT = {
  '01': '时长模式',
  '02': '流量模式',
  '03': '零售模式'
}
