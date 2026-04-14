import service from '@/utils/axios';

export function getDeviceList(params) {
  return service({
    url: '/api/admin/v1/devices',
    method: 'get',
    params
  });
}

export function getDeviceDetail(id) {
  return service({
    url: `/api/admin/v1/devices/${id}`,
    method: 'get'
  });
}

export function createDevice(data) {
  return service({
    url: '/api/admin/v1/devices',
    method: 'post',
    data
  });
}

export function updateDevice(id, data) {
  return service({
    url: `/api/admin/v1/devices/${id}`,
    method: 'put',
    data
  });
}

export function deleteDevice(id) {
  return service({
    url: `/api/admin/v1/devices/${id}`,
    method: 'delete'
  });
}

export function updateDeviceStatus(id, status) {
  return service({
    url: `/api/admin/v1/devices/${id}/status`,
    method: 'put',
    data: { status }
  });
}

export function getDeviceClients(params) {
  return service({
    url: '/admin/api/admin/devices/clients/list.php',
    method: 'get',
    params
  });
}

export function getDealers(params) {
  return service({
    url: '/api/admin/v1/dealers',
    method: 'get',
    params
  });
}

export function getDeviceWaterTrend(id, params) {
  return service({
    url: `/api/admin/v1/devices/${id}/water-trend`,
    method: 'get',
    params
  });
}

/**
 * 设置设备状态 (V1 API)
 * @param {string} id 设备ID
 * @param {string} status 设备状态
 */
export function setDeviceStatus(id, status) {
  return service({
    url: `/api/admin/v1/devices/${id}/status`,
    method: 'put',
    data: { status }
  });
}

/**
 * 绑定用户到设备 (V1 API)
 * @param {string} id 设备ID
 * @param {object} data 用户数据
 */
export function bindDeviceUser(id, data) {
  return service({
    url: `/api/admin/v1/devices/${id}/bind-user`,
    method: 'post',
    data
  });
}

/**
 * 解绑设备用户 (V1 API)
 * @param {string} id 设备ID
 * @param {object} data 解绑数据
 */
export function unbindDeviceUser(id, data) {
  return service({
    url: `/api/admin/v1/devices/${id}/unbind-user`,
    method: 'post',
    data
  });
}

/**
 * 控制设备 (V1 API)
 * @param {string} id 设备ID
 * @param {object} data 控制命令数据
 */
export function controlDevice(id, data) {
  return service({
    url: `/api/admin/v1/devices/${id}/control`,
    method: 'post',
    data
  });
}

/**
 * 获取设备日志 (V1 API)
 * @param {string} id 设备ID
 * @param {object} params 查询参数
 */
export function getDeviceLogs(id, params) {
  return service({
    url: `/api/admin/v1/devices/${id}/logs`,
    method: 'get',
    params
  });
}

/**
 * 获取设备类型列表 (V1 API)
 */
export function getDeviceTypes() {
  return service({
    url: '/api/admin/v1/device-types',
    method: 'get'
  });
}
