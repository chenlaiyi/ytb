import request from '@/utils/request'

export const merchantMallApi = {
  // 获取商户商品列表
  getProducts(params = {}) {
    return request({
      url: '/api/admin/v1/mall/merchant/products',
      method: 'get',
      params
    })
  },

  // 获取商户商品详情
  getProductDetail(id) {
    return request({
      url: `/api/admin/v1/mall/merchant/products/${id}`,
      method: 'get'
    })
  },

  // 更新商户商品（含积分配置）
  updateProduct(id, data) {
    return request({
      url: `/api/admin/v1/mall/merchant/products/${id}`,
      method: 'put',
      data
    })
  },

  // 获取商户商品状态统计
  getProductStatusCounts() {
    return request({
      url: '/api/admin/v1/mall/merchant/products/status-counts',
      method: 'get'
    })
  },

  // 审核商户商品
  auditProduct(id, data) {
    return request({
      url: `/api/admin/v1/mall/merchant/products/${id}/audit`,
      method: 'post',
      data
    })
  },

  // 批量审核商户商品
  batchAuditProducts(data) {
    return request({
      url: '/api/admin/v1/mall/merchant/products/batch-audit',
      method: 'post',
      data
    })
  },

  // 获取商户订单列表
  getOrders(params = {}) {
    return request({
      url: '/api/admin/v1/mall/merchant/orders',
      method: 'get',
      params
    })
  },

  // 获取商户订单详情
  getOrderDetail(id) {
    return request({
      url: `/api/admin/v1/mall/merchant/orders/${id}`,
      method: 'get'
    })
  },

  // 更新商户订单状态
  updateOrderStatus(id, data) {
    return request({
      url: `/api/admin/v1/mall/merchant/orders/${id}/status`,
      method: 'put',
      data
    })
  }
}

export default merchantMallApi 