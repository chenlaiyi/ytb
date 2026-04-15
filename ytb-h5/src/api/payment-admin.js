import request from '@/utils/request';

/**
 * 获取支付方式列表
 * @param {Object} params 查询参数
 * @param {string} params.keyword 搜索关键词
 * @param {string} params.status 状态筛选
 * @param {string} params.type 类型筛选
 * @param {string} params.order_by 排序字段
 * @param {string} params.order_dir 排序方向
 * @param {number} params.per_page 每页数量
 * @param {number} params.page 页码
 * @returns {Promise<Object>} 支付方式列表数据
 */
export function getPaymentMethods(params) {
  return request({
    url: '/api/admin/v1/payment-methods',
    method: 'get',
    params
  });
}

/**
 * 获取支付方式详情
 * @param {number} id 支付方式ID
 * @returns {Promise<Object>} 支付方式详情数据
 */
export function getPaymentMethod(id) {
  return request({
    url: `/api/admin/v1/payment-methods/${id}`,
    method: 'get'
  });
}

/**
 * 创建支付方式
 * @param {Object} data 支付方式数据
 * @returns {Promise<Object>} 创建结果
 */
export function createPaymentMethod(data) {
  return request({
    url: '/api/admin/v1/payment-methods',
    method: 'post',
    data
  });
}

/**
 * 更新支付方式
 * @param {number} id 支付方式ID
 * @param {Object} data 支付方式数据
 * @returns {Promise<Object>} 更新结果
 */
export function updatePaymentMethod(id, data) {
  return request({
    url: `/api/admin/v1/payment-methods/${id}`,
    method: 'put',
    data
  });
}

/**
 * 删除支付方式
 * @param {number} id 支付方式ID
 * @returns {Promise<Object>} 删除结果
 */
export function deletePaymentMethod(id) {
  return request({
    url: `/api/admin/v1/payment-methods/${id}`,
    method: 'delete'
  });
}

/**
 * 更新支付方式状态
 * @param {number} id 支付方式ID
 * @param {number} status 状态值
 * @returns {Promise<Object>} 更新结果
 */
export function updatePaymentMethodStatus(id, status) {
  return request({
    url: `/api/admin/v1/payment-methods/${id}/status`,
    method: 'put',
    data: { status }
  });
}

/**
 * 更新支付方式排序
 * @param {Array} items 排序项数组
 * @returns {Promise<Object>} 更新结果
 */
export function updatePaymentMethodSort(items) {
  return request({
    url: '/api/admin/v1/payment-methods/sort',
    method: 'post',
    data: { items }
  });
}

/**
 * 设置默认支付方式
 * @param {number} id 支付方式ID
 * @returns {Promise<Object>} 设置结果
 */
export function setDefaultPaymentMethod(id) {
  return request({
    url: `/api/admin/v1/payment-methods/${id}/set-default`,
    method: 'post'
  });
}

/**
 * 获取支付订单列表
 * @param {Object} params 查询参数
 * @param {string} params.keyword 搜索关键词
 * @param {string} params.status 状态筛选
 * @param {string} params.payment_method 支付方式筛选
 * @param {number} params.merchant_id 商户ID筛选
 * @param {number} params.user_id 用户ID筛选
 * @param {number} params.min_amount 最小金额筛选
 * @param {number} params.max_amount 最大金额筛选
 * @param {string} params.start_date 开始日期
 * @param {string} params.end_date 结束日期
 * @param {string} params.order_by 排序字段
 * @param {string} params.order_dir 排序方向
 * @param {number} params.per_page 每页数量
 * @param {number} params.page 页码
 * @returns {Promise<Object>} 支付订单列表数据
 */
export function getPaymentOrders(params) {
  return request({
    url: '/api/admin/v1/payment-orders',
    method: 'get',
    params
  });
}

/**
 * 获取支付订单详情
 * @param {string} orderNo 订单号
 * @returns {Promise<Object>} 支付订单详情数据
 */
export function getPaymentOrder(orderNo) {
  return request({
    url: `/api/admin/v1/payment-orders/${orderNo}`,
    method: 'get'
  });
}

/**
 * 更新支付订单状态
 * @param {string} orderNo 订单号
 * @param {number} status 状态值
 * @param {string} remark 备注
 * @returns {Promise<Object>} 更新结果
 */
export function updatePaymentOrderStatus(orderNo, status, remark) {
  return request({
    url: `/api/admin/v1/payment-orders/${orderNo}/status`,
    method: 'put',
    data: { status, remark }
  });
}

/**
 * 关闭支付订单
 * @param {string} orderNo 订单号
 * @returns {Promise<Object>} 关闭结果
 */
export function closePaymentOrder(orderNo) {
  return request({
    url: `/api/admin/v1/payment-orders/${orderNo}/close`,
    method: 'post'
  });
}

/**
 * 退款
 * @param {string} orderNo 订单号
 * @param {number} refundAmount 退款金额
 * @param {string} refundReason 退款原因
 * @returns {Promise<Object>} 退款结果
 */
export function refundPaymentOrder(orderNo, refundAmount, refundReason) {
  return request({
    url: `/api/admin/v1/payment-orders/${orderNo}/refund`,
    method: 'post',
    data: { refund_amount: refundAmount, refund_reason: refundReason }
  });
}

/**
 * 获取支付订单统计数据
 * @param {Object} params 查询参数
 * @param {string} params.start_date 开始日期
 * @param {string} params.end_date 结束日期
 * @param {number} params.merchant_id 商户ID筛选
 * @returns {Promise<Object>} 统计数据
 */
export function getPaymentOrderStatistics(params) {
  return request({
    url: '/api/admin/v1/payment-orders/statistics',
    method: 'get',
    params
  });
}

/**
 * 获取支付交易记录列表
 * @param {Object} params 查询参数
 * @param {string} params.keyword 搜索关键词
 * @param {string} params.order_no 订单号筛选
 * @param {string} params.status 状态筛选
 * @param {string} params.transaction_type 交易类型筛选
 * @param {string} params.payment_method 支付方式筛选
 * @param {number} params.min_amount 最小金额筛选
 * @param {number} params.max_amount 最大金额筛选
 * @param {string} params.start_date 开始日期
 * @param {string} params.end_date 结束日期
 * @param {string} params.order_by 排序字段
 * @param {string} params.order_dir 排序方向
 * @param {number} params.per_page 每页数量
 * @param {number} params.page 页码
 * @returns {Promise<Object>} 交易记录列表数据
 */
export function getPaymentTransactions(params) {
  return request({
    url: '/api/admin/v1/payment-transactions',
    method: 'get',
    params
  });
}

/**
 * 获取交易记录详情
 * @param {string} transactionNo 交易号
 * @returns {Promise<Object>} 交易记录详情数据
 */
export function getPaymentTransaction(transactionNo) {
  return request({
    url: `/api/admin/v1/payment-transactions/${transactionNo}`,
    method: 'get'
  });
}

/**
 * 获取交易记录统计数据
 * @param {Object} params 查询参数
 * @param {string} params.start_date 开始日期
 * @param {string} params.end_date 结束日期
 * @param {string} params.payment_method 支付方式筛选
 * @returns {Promise<Object>} 统计数据
 */
export function getPaymentTransactionStatistics(params) {
  return request({
    url: '/api/admin/v1/payment-transactions/statistics',
    method: 'get',
    params
  });
}

/**
 * 导出交易记录
 * @param {Object} params 查询参数
 * @param {string} params.start_date 开始日期
 * @param {string} params.end_date 结束日期
 * @param {string} params.order_no 订单号筛选
 * @param {string} params.status 状态筛选
 * @param {string} params.transaction_type 交易类型筛选
 * @param {string} params.payment_method 支付方式筛选
 * @returns {Promise<Object>} 导出数据
 */
export function exportPaymentTransactions(params) {
  return request({
    url: '/api/admin/v1/payment-transactions/export',
    method: 'post',
    data: params
  });
}
