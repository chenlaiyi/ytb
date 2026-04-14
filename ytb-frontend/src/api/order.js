import service from '@/utils/axios'

// 获取订单列表
export function getOrders(params) {
  return service({
    url: '/api/admin/v1/orders',
    method: 'get',
    params
  })
}

// 获取订单列表（别名）
export function getOrderList(params) {
  return getOrders(params);
}

// 获取订单详情
export function getOrderDetail(id) {
  return service({
    url: `/api/admin/v1/orders/${id}`,
    method: 'get'
  })
}

// 更新订单状态
export function updateOrderStatus(id, status) {
  return service({
    url: `/api/admin/v1/orders/${id}/status`,
    method: 'patch',
    data: { status }
  })
}

// 删除订单
export function deleteOrder(id) {
  return service({
    url: `/api/admin/v1/orders/${id}`,
    method: 'delete'
  })
}

// 发货
export function shipOrder(id, data) {
  return service({
    url: `/api/admin/v1/orders/${id}/ship`,
    method: 'post',
    data
  })
}

// 确认订单
export function confirmOrder(id) {
  return service({
    url: `/api/admin/v1/orders/${id}/confirm`,
    method: 'post'
  })
}

// 取消订单
export function cancelOrder(id, reason) {
  return service({
    url: `/api/admin/v1/orders/${id}/cancel`,
    method: 'post',
    data: { reason }
  })
}

// 更新订单地址
export function updateOrderAddress(id, data) {
  return service({
    url: `/api/admin/v1/orders/${id}/address`,
    method: 'put',
    data
  })
}

// 导出订单
export function exportOrders(params) {
  return service({
    url: '/api/admin/v1/orders/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取退款列表
export function getRefunds(params) {
  return service({
    url: '/api/admin/v1/refunds',
    method: 'get',
    params
  })
}

// 获取退款列表（别名）
export function getRefundList(params) {
  return getRefunds(params);
}

// 获取退款详情
export function getRefundDetail(id) {
  return service({
    url: `/api/admin/v1/refunds/${id}`,
    method: 'get'
  })
}

// 审核退款
export function auditRefund(id, data) {
  return service({
    url: `/api/admin/v1/refunds/${id}/audit`,
    method: 'post',
    data
  })
}

// 处理退款
export function processRefund(id, data) {
  return service({
    url: `/api/admin/v1/refunds/${id}/process`,
    method: 'post',
    data
  })
}

// 获取订单统计
export function getOrderStatistics(params) {
  return service({
    url: '/api/admin/v1/orders/statistics',
    method: 'get',
    params
  })
}

// 批量操作订单
export function batchOperateOrders(ids, action, data = {}) {
  return service({
    url: '/api/admin/v1/orders/batch-operate',
    method: 'post',
    data: { ids, action, ...data }
  })
}

// 默认导出所有API函数
export default {
  getOrders,
  getOrderList,
  getOrderDetail,
  updateOrderStatus,
  deleteOrder,
  shipOrder,
  confirmOrder,
  cancelOrder,
  updateOrderAddress,
  exportOrders,
  getRefunds,
  getRefundList,
  getRefundDetail,
  auditRefund,
  processRefund,
  getOrderStatistics,
  batchOperateOrders
} 