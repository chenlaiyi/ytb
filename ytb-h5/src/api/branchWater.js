import request from '@/utils/request'

/**
 * 获取分支机构净水器工作台数据 - 使用Laravel API
 * @returns {Promise<Object>} 工作台数据
 */
export function getBranchPurifierWorkspace() {
  return request({
    url: '/api/mobile/v1/water-points/workspace',
    method: 'get'
  })
}

/**
 * 获取分支机构净水器设备列表 - 使用Laravel API
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 设备列表
 */
export function getBranchPurifierDevices(params) {
  return request({
    url: '/api/mobile/v1/water-points',
    method: 'get',
    params
  })
}

/**
 * 获取分支机构净水器设备详情 - 使用Laravel API
 * @param {string} deviceId 设备ID
 * @returns {Promise<Object>} 设备详情
 */
export function getBranchPurifierDeviceDetail(deviceId) {
  return request({
    url: `/api/mobile/v1/water-points/${deviceId}`,
    method: 'get'
  })
}

/**
 * 绑定分支机构净水器设备
 * @param {Object} data 设备信息
 * @returns {Promise<Object>} 绑定结果
 */
export function bindBranchPurifierDevice(data) {
  return request({
    url: '/purifier/bind_device.php',
    method: 'post',
    data
  })
}

/**
 * 解绑分支机构净水器设备
 * @param {string} deviceId 设备ID
 * @returns {Promise<Object>} 解绑结果
 */
export function unbindBranchPurifierDevice(deviceId) {
  return request({
    url: `/purifier/unbind_device.php?device_id=${deviceId}`,
    method: 'post'
  })
}

/**
 * 获取分支机构净水器用水数据
 * @param {string} deviceId 设备ID
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 用水数据
 */
export function getBranchWaterUsageData(deviceId, params) {
  return request({
    url: `/purifier/water_usage.php?device_id=${deviceId}`,
    method: 'get',
    params
  })
}

/**
 * 获取分支机构净水器滤芯状态
 * @param {string} deviceId 设备ID
 * @returns {Promise<Object>} 滤芯状态
 */
export function getBranchFilterStatus(deviceId) {
  return request({
    url: `/purifier/filter_status.php?device_id=${deviceId}`,
    method: 'get'
  })
}

/**
 * 更换分支机构净水器滤芯
 * @param {string} deviceId 设备ID
 * @param {Object} data 滤芯信息
 * @returns {Promise<Object>} 更换结果
 */
export function replaceBranchFilter(deviceId, data) {
  return request({
    url: `/purifier/replace_filter.php?device_id=${deviceId}`,
    method: 'post',
    data
  })
}

/**
 * 获取分支机构滤芯商城商品
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 商品列表
 */
export function getBranchFilterProducts(params) {
  return request({
    url: '/purifier/filter_products.php',
    method: 'get',
    params
  })
}

/**
 * 购买分支机构滤芯
 * @param {Object} data 购买信息
 * @returns {Promise<Object>} 购买结果
 */
export function buyBranchFilter(data) {
  return request({
    url: '/purifier/buy_filter.php',
    method: 'post',
    data
  })
}

/**
 * 获取分支机构净水器维修记录
 * @param {string} deviceId 设备ID
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 维修记录
 */
export function getBranchMaintenanceRecords(deviceId, params) {
  return request({
    url: `/purifier/maintenance_records.php?device_id=${deviceId}`,
    method: 'get',
    params
  })
}

/**
 * 申请分支机构净水器维修
 * @param {Object} data 维修申请信息
 * @returns {Promise<Object>} 申请结果
 */
export function applyBranchMaintenance(data) {
  return request({
    url: '/purifier/apply_maintenance.php',
    method: 'post',
    data
  })
}

/**
 * 获取分支机构净水器监控数据 - 使用Laravel API
 * @param {string} deviceId 设备ID
 * @returns {Promise<Object>} 监控数据
 */
export function getBranchDeviceMonitor(deviceId) {
  return request({
    url: `/api/mobile/v1/water-points/${deviceId}/monitor`,
    method: 'get'
  })
}

/**
 * 远程控制分支机构净水器设备 - 使用Laravel API
 * @param {string} deviceId 设备ID
 * @param {Object} data 控制指令
 * @returns {Promise<Object>} 控制结果
 */
export function controlBranchDevice(deviceId, data) {
  return request({
    url: `/api/mobile/v1/water-points/${deviceId}/control`,
    method: 'post',
    data
  })
}

/**
 * 获取分支机构净水器用水统计 - 使用Laravel API
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 用水统计
 */
export function getBranchWaterStats(params) {
  return request({
    url: '/api/mobile/v1/water-points/stats',
    method: 'get',
    params
  })
}

/**
 * 获取分支机构净水器设备告警
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 告警列表
 */
export function getBranchDeviceAlerts(params) {
  return request({
    url: '/purifier/device_alerts.php',
    method: 'get',
    params
  })
}

/**
 * 处理分支机构净水器设备告警
 * @param {string} alertId 告警ID
 * @param {Object} data 处理信息
 * @returns {Promise<Object>} 处理结果
 */
export function handleBranchDeviceAlert(alertId, data) {
  return request({
    url: `/purifier/handle_alert.php?alert_id=${alertId}`,
    method: 'post',
    data
  })
}

/**
 * 获取分支机构净水器保养提醒
 * @returns {Promise<Object>} 保养提醒列表
 */
export function getBranchMaintenanceReminders() {
  return request({
    url: '/purifier/maintenance_reminders.php',
    method: 'get'
  })
}

/**
 * 设置分支机构净水器保养提醒
 * @param {Object} data 提醒设置
 * @returns {Promise<Object>} 设置结果
 */
export function setBranchMaintenanceReminder(data) {
  return request({
    url: '/purifier/set_maintenance_reminder.php',
    method: 'post',
    data
  })
}

/**
 * 获取分支机构净水器水质报告
 * @param {string} deviceId 设备ID
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 水质报告
 */
export function getBranchWaterQualityReport(deviceId, params) {
  return request({
    url: `/purifier/water_quality_report.php?device_id=${deviceId}`,
    method: 'get',
    params
  })
} 