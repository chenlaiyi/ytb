import request from '@/utils/request';

/**
 * 获取用户统计数据
 * @param {Object} params 查询参数
 * @param {string} params.start_time 开始时间
 * @param {string} params.end_time 结束时间
 * @returns {Promise<Object>} 用户统计数据
 */
export function getUserStats(params) {
  return request({
    url: '/api/admin/v1/statistics/user',
    method: 'get',
    params
  });
}

/**
 * 获取订单统计数据
 * @param {Object} params 查询参数
 * @param {string} params.start_time 开始时间
 * @param {string} params.end_time 结束时间
 * @returns {Promise<Object>} 订单统计数据
 */
export function getOrderStats(params) {
  return request({
    url: '/api/admin/v1/statistics/order',
    method: 'get',
    params
  });
}

/**
 * 获取设备统计数据
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 设备统计数据
 */
export function getDeviceStats(params) {
  return request({
    url: '/api/admin/v1/statistics/device',
    method: 'get',
    params
  });
}

/**
 * 获取商户统计数据
 * @param {Object} params 查询参数
 * @param {string} params.start_time 开始时间
 * @param {string} params.end_time 结束时间
 * @returns {Promise<Object>} 商户统计数据
 */
export function getMerchantStats(params) {
  return request({
    url: '/api/admin/v1/statistics/merchant',
    method: 'get',
    params
  });
}

/**
 * 获取业务员统计数据
 * @param {Object} params 查询参数
 * @param {string} params.start_time 开始时间
 * @param {string} params.end_time 结束时间
 * @returns {Promise<Object>} 业务员统计数据
 */
export function getSalesmanStats(params) {
  return request({
    url: '/api/admin/v1/statistics/salesman',
    method: 'get',
    params
  });
}

/**
 * 获取产品统计数据
 * @param {Object} params 查询参数
 * @param {string} params.start_time 开始时间
 * @param {string} params.end_time 结束时间
 * @returns {Promise<Object>} 产品统计数据
 */
export function getProductStats(params) {
  return request({
    url: '/api/admin/v1/statistics/product',
    method: 'get',
    params
  });
}
