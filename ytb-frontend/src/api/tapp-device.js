import service from '@/utils/axios';

/**
 * 获取点点够设备列表 (使用完整的Laravel路径)
 * @param {object} params 查询参数
 */
export function getTappDeviceList(params) {
  return service({
    url: '/api/admin/v1/tapp-devices',
    method: 'get',
    params
  });
}

/**
 * 获取点点够设备详情
 * @param {string} id 设备ID
 */
export function getTappDeviceDetail(id) {
  return service({
    url: `/api/admin/v1/tapp-devices/${id}`,
    method: 'get'
  });
}

/**
 * 更新点点够设备
 * @param {string} id 设备ID
 * @param {object} data 设备数据
 */
export function updateTappDevice(id, data) {
  return service({
    url: `/Tapp/admin/public/api/tapp-devices/${id}`,
    method: 'put',
    data
  });
}

/**
 * 删除点点够设备
 * @param {string} id 设备ID
 */
export function deleteTappDevice(id) {
  return service({
    url: `/Tapp/admin/public/api/tapp-devices/${id}`,
    method: 'delete'
  });
}

/**
 * 同步点点够设备数据
 * @param {object} data 同步参数
 */
export function syncTappDevices(data) {
  return service({
    url: '/api/admin/v1/tapp-devices/sync',
    method: 'post',
    data
  });
}

/**
 * 获取设备统计数据
 */
export function getTappDeviceStats() {
  return service({
    url: '/Tapp/admin/public/api/tapp-devices/stats',
    method: 'get'
  });
}

/**
 * 批量操作设备
 * @param {object} data 批量操作数据
 */
export function batchOperateTappDevices(data) {
  return service({
    url: '/Tapp/admin/public/api/tapp-devices/batch',
    method: 'post',
    data
  });
}

/**
 * 导出设备数据
 * @param {object} params 导出参数
 */
export function exportTappDevices(params) {
  return service({
    url: '/Tapp/admin/public/api/tapp-devices/export',
    method: 'get',
    params,
    responseType: 'blob'
  });
}

/**
 * 获取设备制水日志
 * @param {string} id 设备ID
 * @param {object} params 查询参数
 */
export function getTappDeviceWaterLogs(id, params) {
  return service({
    url: `/Tapp/admin/public/api/tapp-devices/${id}/water-logs`,
    method: 'get',
    params
  });
}

/**
 * 获取设备滤芯信息
 * @param {string} id 设备ID
 */
export function getTappDeviceFilters(id) {
  return service({
    url: `/Tapp/admin/public/api/tapp-devices/${id}/filters`,
    method: 'get'
  });
}

/**
 * 更新设备滤芯信息
 * @param {string} id 设备ID
 * @param {object} data 滤芯数据
 */
export function updateTappDeviceFilters(id, data) {
  return service({
    url: `/api/admin/v1/tapp-devices/${id}/filters`,
    method: 'put',
    data
  });
}

/**
 * 重置设备滤芯
 * @param {string} id 设备ID
 * @param {object} data 重置参数
 */
export function resetTappDeviceFilter(id, data) {
  return service({
    url: `/api/admin/v1/tapp-devices/${id}/reset-filter`,
    method: 'post',
    data
  });
}

/**
 * 获取设备在线状态
 * @param {string} id 设备ID
 */
export function getTappDeviceOnlineStatus(id) {
  return service({
    url: `/api/admin/v1/tapp-devices/${id}/online-status`,
    method: 'get'
  });
}

/**
 * 控制设备
 * @param {string} id 设备ID
 * @param {object} data 控制参数
 */
export function controlTappDevice(id, data) {
  return service({
    url: `/api/admin/v1/tapp-devices/${id}/control`,
    method: 'post',
    data
  });
}

/**
 * 获取设备告警信息
 * @param {string} id 设备ID
 * @param {object} params 查询参数
 */
export function getTappDeviceAlerts(id, params) {
  return service({
    url: `/api/admin/v1/tapp-devices/${id}/alerts`,
    method: 'get',
    params
  });
}

/**
 * 获取App用户列表
 * @param {object} params 查询参数
 */
export function getAppUsersList(params) {
  return service({
    url: '/api/admin/v1/tapp-devices/app-users/list',
    method: 'get',
    params
  });
} 
