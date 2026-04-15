import request from '@/utils/request'

// ------- Tapp 设备管理多端点兜底 -------
const TAPP_DEVICE_ENDPOINTS = [
  '/api/admin/v1/tapp-devices',
  '/admin/api/admin/v1/tapp-devices',
  '/api/tapp-devices'
]

let activeTappDeviceBase = null

const buildPath = (path = '') => {
  if (!path) return ''
  return path.startsWith('/') ? path : `/${path}`
}

const tappDeviceRequest = async (path = '', config = {}) => {
  const candidates = activeTappDeviceBase
    ? [activeTappDeviceBase, ...TAPP_DEVICE_ENDPOINTS.filter(item => item !== activeTappDeviceBase)]
    : [...TAPP_DEVICE_ENDPOINTS]

  let lastError = null

  for (const base of candidates) {
    try {
      const response = await request({
        ...config,
        url: `${base}${buildPath(path)}`
      })
      activeTappDeviceBase = base
      return response
    } catch (error) {
      const status = error?.response?.status
      if (status && ![301, 302, 404, 405].includes(status)) {
        throw error
      }
      lastError = error
    }
  }

  if (lastError) {
    throw lastError
  }

  throw new Error('Tapp 设备接口不可用')
}

// 获取用户设备列表 - 使用Mobile V1 API
export function getUserDevices(params) {
  return request({
    url: '/api/mobile/v1/devices',
    method: 'get',
    params,
    skipAuthErrorToast: true
  })
}

/**
 * 获取设备详情 - 使用Mobile V1 API
 * @param {number} id 设备ID
 * @returns {Promise}
 */
export function getDeviceDetail(id) {
  return request({
    url: `/api/mobile/v1/devices/${id}`,
    method: 'get',
    skipAuthErrorToast: true
  })
}

// 绑定设备 - 使用Mobile V1 API
export function bindDevice(data) {
  return request({
    url: '/api/mobile/v1/devices/bind',
    method: 'post',
    data
  })
}

// 解绑设备 - 使用Mobile V1 API
export function unbindDevice(deviceId) {
  return request({
    url: `/api/mobile/v1/devices/${deviceId}/unbind`,
    method: 'post'
  })
}

// 查询设备状态 - 使用Mobile V1 API
export function getDeviceStatus(deviceId) {
  return request({
    url: `/api/mobile/v1/devices/${deviceId}/status`,
    method: 'get'
  })
}

// 控制设备 - 使用Mobile V1 API
export function controlDevice(deviceId, data) {
  return request({
    url: `/api/mobile/v1/devices/${deviceId}/control`,
    method: 'post',
    data
  })
}

// 设置主设备
export function setMainDevice(deviceId) {
  return request({
    url: `/device/${deviceId}/main`,
    method: 'post'
  })
}

// 更新设备信息
export function updateDevice(deviceId, data) {
  return request({
    url: `/device/${deviceId}`,
    method: 'put',
    data
  })
}

// 修改设备名称
export function updateDeviceName(deviceId, deviceName) {
  return request({
    url: `/device/${deviceId}/name`,
    method: 'post',
    data: { device_name: deviceName }
  })
}

// 更新设备自用状态
export function updateDeviceSelfUse(deviceId, isSelfUse) {
  return request({
    url: '/device/update_device_self_use.php',
    method: 'post',
    data: {
      device_id: deviceId,
      is_self_use: isSelfUse ? 1 : 0
    }
  })
}

/**
 * 获取设备用水趋势数据 - 使用Laravel API
 * @param {string} deviceId 设备ID
 * @param {Object} params 查询参数
 * @param {number} params.days 查询天数，默认7天
 * @returns {Promise}
 */
export function getDeviceWaterTrend(deviceId, params = {}) {
  return request({
    url: `/api/admin/v1/devices/${deviceId}/water-trend`,
    method: 'get',
    params,
    timeout: 15000, // 增加超时时间
    retry: 1 // 请求失败后重试一次
  })
}

// ===== Admin: Tapp 设备管理 =====

export function getAdminDevices(params) {
  return tappDeviceRequest('', {
    method: 'get',
    params
  })
}

export function getAdminDeviceDetail(id) {
  return tappDeviceRequest(`/${id}`, {
    method: 'get'
  })
}

export function updateAdminDevice(id, data) {
  return tappDeviceRequest(`/${id}`, {
    method: 'put',
    data
  })
}

export function setAdminDeviceStatus(id, status) {
  return tappDeviceRequest(`/${id}/status`, {
    method: 'put',
    data: { status }
  })
}

export function syncAdminDevices(data) {
  return tappDeviceRequest('/sync', {
    method: 'post',
    data
  })
}

export function getAdminDeviceUsers(params) {
  return tappDeviceRequest('/app-users/list', {
    method: 'get',
    params
  })
}
