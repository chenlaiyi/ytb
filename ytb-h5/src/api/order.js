import request from '@/utils/request'

/**
 * 创建订单
 * @param {Object} data - 订单数据
 * @returns {Promise}
 */
export function createOrder(data) {
  return request({
    url: '/app/orders/create.php',
    method: 'post',
    data,
    // 添加重试配置，确保关键请求不轻易失败
    retry: 2,
    retryDelay: 1500,
    // 增加超时时间，支付请求可能需要更长时间
    timeout: 30000
  })
}

/**
 * 查询订单状态
 * @param {string} orderNo - 订单编号
 * @returns {Promise}
 */
export function queryOrderStatus(orderNo) {
  return request({
    url: '/app/orders/status.php',
    method: 'get',
    params: { order_no: orderNo }
  })
}

/**
 * 获取用户订单列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getUserOrders(params) {
  return request({
    url: '/app/orders/user.php',
    method: 'get',
    params
  })
}

/**
 * 取消订单
 * @param {string} orderNo - 订单编号
 * @returns {Promise}
 */
export function cancelOrder(orderNo) {
  return request({
    url: `/app/orders/cancel.php`,
    method: 'post',
    data: { order_no: orderNo }
  })
}

/**
 * 获取订单详情
 * @param {string} orderNo - 订单编号
 * @returns {Promise}
 */
export function getOrderDetail(orderNo) {
  return request({
    url: '/app/orders/detail.php',
    method: 'get',
    params: { order_no: orderNo }
  })
} 