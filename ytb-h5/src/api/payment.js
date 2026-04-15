/**
 * 支付相关API封装
 * 此模块封装所有与支付相关的API调用
 */

import request from '@/utils/request'

// 支付API基础路径
const API_BASE = '/payment'

/**
 * 创建支付订单
 * @param {Object} data - 订单数据 
 * @returns {Promise}
 */
export function createPayment(data) {
  return request({
    url: `${API_BASE}/create_order.php`,
    method: 'post',
    data
  })
}

/**
 * 查询支付结果
 * @param {String} orderNo - 订单号
 * @returns {Promise}
 */
export function queryPaymentResult(orderNo) {
  return request({
    url: `${API_BASE}/query_order.php`,
    method: 'get',
    params: { order_no: orderNo }
  })
}

/**
 * 获取微信支付参数
 * @param {Object} data - 支付参数
 * @returns {Promise}
 */
export function getWechatPayParams(data) {
  return request({
    url: `${API_BASE}/wechat_pay_params.php`,
    method: 'post',
    data
  })
}

/**
 * 获取支付宝支付表单
 * @param {Object} data - 支付参数
 * @returns {Promise}
 */
export function getAlipayForm(data) {
  return request({
    url: `${API_BASE}/alipay_form.php`,
    method: 'post',
    data
  })
}

/**
 * 取消订单
 * @param {String} orderNo - 订单号
 * @returns {Promise}
 */
export function cancelOrder(orderNo) {
  return request({
    url: `${API_BASE}/cancel_order.php`,
    method: 'post',
    data: { order_no: orderNo }
  })
}

/**
 * 获取订单列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getOrderList(params) {
  return request({
    url: `${API_BASE}/order_list.php`,
    method: 'get',
    params
  })
}

/**
 * 获取订单详情
 * @param {String} orderNo - 订单号
 * @returns {Promise}
 */
export function getOrderDetail(orderNo) {
  return request({
    url: `${API_BASE}/order_detail.php`,
    method: 'get',
    params: { order_no: orderNo }
  })
}

/**
 * 申请退款
 * @param {Object} data - 退款数据
 * @returns {Promise}
 */
export function applyRefund(data) {
  return request({
    url: `${API_BASE}/apply_refund.php`,
    method: 'post',
    data
  })
}

/**
 * 获取退款记录
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getRefundList(params) {
  return request({
    url: `${API_BASE}/refund_list.php`,
    method: 'get',
    params
  })
}

/**
 * 获取可用支付方式
 * @returns {Promise}
 */
export function getPaymentMethods() {
  return request({
    url: `${API_BASE}/payment_methods.php`,
    method: 'get'
  })
}

/**
 * 验证支付密码
 * @param {Object} data - 验证数据
 * @returns {Promise}
 */
export function verifyPaymentPassword(data) {
  return request({
    url: `${API_BASE}/verify_payment_password.php`,
    method: 'post',
    data
  })
}

/**
 * 模拟支付成功(仅开发环境使用)
 * @param {String} orderNo - 订单号
 * @returns {Promise}
 */
export function mockPaymentSuccess(orderNo) {
  return request({
    url: `${API_BASE}/mock_payment_success.php`,
    method: 'post',
    data: { order_no: orderNo }
  })
} 