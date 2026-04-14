import request from '@/utils/request'

/**
 * 订单管理API
 */
export const mallOrderApi = {
  /**
   * 获取订单列表
   */
  getList(params = {}) {
    return request({
      url: '/api/admin/v1/mall/orders',
      method: 'get',
      params
    })
  },

  /**
   * 获取订单详情
   */
  getDetail(id) {
    return request({
      url: `/api/admin/v1/mall/orders/${id}`,
      method: 'get'
    })
  },

  /**
   * 更新订单状态
   */
  updateStatus(id, status) {
    return request({
      url: `/api/admin/v1/mall/orders/${id}/status`,
      method: 'put',
      data: { status }
    })
  },

  /**
   * 更新收货地址
   */
  updateAddress(id, data) {
    return request({
      url: `/api/admin/v1/mall/orders/${id}/address`,
      method: 'put',
      data
    })
  },

  /**
   * 订单发货
   */
  ship(id, data) {
    return request({
      url: `/api/admin/v1/mall/orders/${id}/ship`,
      method: 'put',
      data
    })
  },

  /**
   * 确认收货
   */
  confirm(id) {
    return request({
      url: `/api/admin/v1/mall/orders/${id}/confirm`,
      method: 'put'
    })
  },

  /**
   * 取消订单
   */
  cancel(id, reason = '') {
    return request({
      url: `/api/admin/v1/mall/orders/${id}/cancel`,
      method: 'put',
      data: { reason }
    })
  },

  /**
   * 获取退款列表
   */
  getRefunds(params = {}) {
    return request({
      url: '/api/admin/v1/mall/refunds',
      method: 'get',
      params
    })
  },

  /**
   * 获取退款详情
   */
  getRefundDetail(id) {
    return request({
      url: `/api/admin/v1/mall/refunds/${id}`,
      method: 'get'
    })
  },

  /**
   * 审核退款
   */
  auditRefund(id, data) {
    return request({
      url: `/api/admin/v1/mall/refunds/${id}/audit`,
      method: 'put',
      data
    })
  },

  /**
   * 处理退款
   */
  processRefund(id, data) {
    return request({
      url: `/api/admin/v1/mall/refunds/${id}/process`,
      method: 'put',
      data
    })
  },

  /**
   * 获取订单统计信息
   */
  getStatistics() {
    return request({
      url: '/api/admin/v1/mall/orders/statistics',
      method: 'get'
    })
  }
} 