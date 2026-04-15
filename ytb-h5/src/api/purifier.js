/**
 * 净水器相关API - Laravel RESTful API
 */
import request from '@/utils/request'

// Laravel API基础URL配置
const LARAVEL_API_BASE = '/api/mobile/v1'

/**
 * 获取设备列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 页大小
 * @returns {Promise<Object>} 设备列表
 */
export function getDeviceList(params) {
  return request({
    url: `${LARAVEL_API_BASE}/devices`,
    method: 'GET',
    params: {
      page: params.pageNo || params.page || 1,
      pageSize: params.pageSize || 10,
      ...params
    }
  })
}

/**
 * 根据ID获取设备详情
 * @param {string|number} deviceId 设备ID
 * @returns {Promise<Object>} 设备详情
 */
export function getDeviceInfoById(deviceId) {
  return request({
    url: `${LARAVEL_API_BASE}/devices/${deviceId}`,
    method: 'GET'
  })
}

/**
 * 获取设备状态信息（包含滤芯信息）
 * @param {string|number} deviceId 设备ID
 * @returns {Promise<Object>} 设备状态信息
 */
export function getDeviceStatus(deviceId) {
  return request({
    url: `${LARAVEL_API_BASE}/devices/${deviceId}/status`,
    method: 'GET'
  })
}

/**
 * 设备开关机操作
 * @param {string|number} deviceId 设备ID
 * @param {string} command 操作命令 (power_on=开机, power_off=关机, flush=冲洗)
 * @param {string} deviceNumber 设备编号
 * @returns {Promise<Object>} 操作结果
 */
export function deviceAct(deviceId, command, deviceNumber) {
  return request({
    url: `${LARAVEL_API_BASE}/devices/${deviceId}/control`,
    method: 'POST',
    data: {
      command: command,
      device_number: deviceNumber
    }
  })
}

/**
 * 绑定设备
 * @param {string} deviceId 设备编号
 * @param {string} deviceName 设备名称
 * @returns {Promise<Object>} 绑定结果
 */
export function bindDevice(deviceId, deviceName) {
  return request({
    url: `${LARAVEL_API_BASE}/devices/bind`,
    method: 'POST',
    data: {
      device_id: deviceId,
      device_name: deviceName
    }
  })
}

/**
 * 解绑设备
 * @param {string|number} deviceId 设备ID
 * @returns {Promise<Object>} 解绑结果
 */
export function unbindDevice(deviceId) {
  return request({
    url: `${LARAVEL_API_BASE}/devices/${deviceId}/unbind`,
    method: 'POST'
  })
}

/**
 * 滤芯重置
 * @param {Object} params 重置参数
 * @param {string|number} params.deviceId 设备ID
 * @param {number} params.index 滤芯索引
 * @returns {Promise<Object>} 重置结果
 */
export function deviceFluxRest(params) {
  return request({
    url: '/app/clientDeviceController/deviceFluxRest',
    method: 'GET',
    params
  })
}

/**
 * 获取设备滤芯信息
 * @param {Object} params 查询参数
 * @param {string|number} params.id 设备ID
 * @returns {Promise<Object>} 滤芯信息
 */
export function getDeviceFluxInfo(params) {
  return request({
    url: '/app/clientDeviceController/deviceFluxInfo',
    method: 'GET',
    params
  })
}

/**
 * 获取用水量统计
 * @param {string|number} deviceId 设备ID
 * @returns {Promise<Object>} 用水量统计
 */
export function getWaterProduct(deviceId) {
  return request({
    url: `${BASE_URL}/app/clientDeviceController/waterProduct`,
    method: 'GET',
    params: { deviceId }
  })
}

/**
 * 获取报修记录
 * @param {Object} params 查询参数
 * @param {number} params.pageNo 页码
 * @param {number} params.pageSize 页大小
 * @returns {Promise<Object>} 报修记录
 */
export function getRepairList(params) {
  return request({
    url: `${BASE_URL}/app/clientDeviceController/repairList`,
    method: 'GET',
    params
  })
}

/**
 * 提交报修工单
 * @param {Object} data 报修数据
 * @returns {Promise<Object>} 提交结果
 */
export function addRepairWork(data) {
  return request({
    url: `${BASE_URL}/app/clientDeviceController/addWork`,
    method: 'POST',
    data
  })
}

/**
 * 获取视频列表
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 视频列表
 */
export function getVideoList(params) {
  return request({
    url: `${BASE_URL}/app/clientDeviceController/videoList`,
    method: 'GET',
    params
  })
}

/**
 * 获取充值套餐
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 充值套餐
 */
export function getRechargePackage(params) {
  return request({
    url: `${BASE_URL}/app/clientDeviceController/rechargePackage`,
    method: 'GET',
    params
  })
}

/**
 * 获取套餐详情
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 套餐详情
 */
export function getPackageDetail(params) {
  return request({
    url: `${BASE_URL}/app/clientDeviceController/getPackage`,
    method: 'GET',
    params
  })
}

/**
 * 设备激活检查
 * @param {Object} data 设备信息
 * @returns {Promise<Object>} 检查结果
 */
export function checkDevice(data) {
  return request({
    url: `${BASE_URL}/app/clientDeviceController/checkDevice`,
    method: 'POST',
    data
  })
}

/**
 * 设备激活绑定
 * @param {Object} data 绑定信息
 * @returns {Promise<Object>} 绑定结果
 */
export function bindingDevice(data) {
  return request({
    url: `${BASE_URL}/app/clientDeviceController/bundingDevice`,
    method: 'POST',
    data
  })
}

/**
 * 获取设备滤芯商城信息
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 滤芯商城信息
 */
export function getDeviceAttributeShop(params) {
  return request({
    url: `${BASE_URL}/app/clientDeviceController/deviceAttribute`,
    method: 'GET',
    params
  })
}

/**
 * 购买滤芯
 * @param {Object} data 购买信息
 * @returns {Promise<Object>} 购买结果
 */
export function payCompletedSurrogate(data) {
  return request({
    url: `${BASE_URL}/app/clientDeviceController/payCompletedSurrogate`,
    method: 'POST',
    data
  })
}

/**
 * 新增购买滤芯工单
 * @param {Object} data 工单信息
 * @returns {Promise<Object>} 工单结果
 */
export function addAttributeOrder(data) {
  return request({
    url: `${BASE_URL}/app/clientDeviceController/doAddAttribute`,
    method: 'POST',
    data
  })
}

/**
 * 获取安装工单列表
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 安装工单列表
 */
export function getInstallList(params) {
  return request({
    url: `${BASE_URL}/app/clientDeviceController/installList`,
    method: 'GET',
    params
  })
}

/**
 * 获取订单列表
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 订单列表
 */
export function getOrderList(params) {
  return request({
    url: `${BASE_URL}/app/clientDeviceController/orderList`,
    method: 'GET',
    params
  })
}

/**
 * 获取预警记录
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 预警记录
 */
export function getWarningList(params) {
  return request({
    url: `${BASE_URL}/app/clientDeviceController/wariningList`,
    method: 'GET',
    params
  })
}

/**
 * 微信支付
 * @param {Object} params 支付参数
 * @returns {Promise<Object>} 支付结果
 */
export function wxClientAppPay(params) {
  return request({
    url: `${BASE_URL}/pay/wxClientAppPay`,
    method: 'GET',
    params
  })
}

/**
 * 微信滤芯支付
 * @param {Object} params 支付参数
 * @returns {Promise<Object>} 支付结果
 */
export function wxClientAttributeAppPay(params) {
  return request({
    url: `${BASE_URL}/pay/wxClientAttributeAppPay`,
    method: 'GET',
    params
  })
}
