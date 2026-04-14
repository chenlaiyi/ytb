import request from '@/utils/request'

/**
 * 商品管理API
 */
export const mallProductApi = {
  /**
   * 获取商品列表
   */
  getList(params = {}) {
    return request({
      url: '/api/admin/v1/mall/products',
      method: 'get',
      params
    })
  },

  /**
   * 获取商品详情
   */
  getDetail(id) {
    return request({
      url: `/api/admin/v1/mall/products/${id}`,
      method: 'get'
    })
  },

  /**
   * 创建商品
   */
  create(data) {
    return request({
      url: '/api/admin/v1/mall/products',
      method: 'post',
      data
    })
  },

  /**
   * 更新商品
   */
  update(id, data) {
    return request({
      url: `/api/admin/v1/mall/products/${id}`,
      method: 'put',
      data
    })
  },

  /**
   * 删除商品
   */
  delete(id) {
    return request({
      url: `/api/admin/v1/mall/products/${id}`,
      method: 'delete'
    })
  },

  /**
   * 更新商品状态
   */
  updateStatus(id, status) {
    return request({
      url: `/api/admin/v1/mall/products/${id}/status`,
      method: 'put',
      data: { status }
    })
  },

  /**
   * 批量更新商品状态
   */
  batchUpdateStatus(ids, status) {
    return request({
      url: '/api/admin/v1/mall/products/batch-status',
      method: 'put',
      data: { ids, status }
    })
  },

  /**
   * 更新商品排序
   */
  updateSort(id, sort) {
    return request({
      url: `/api/admin/v1/mall/products/${id}/sort`,
      method: 'put',
      data: { sort }
    })
  },

  /**
   * 获取商品统计信息
   */
  getStatistics() {
    return request({
      url: '/api/admin/v1/mall/products/statistics',
      method: 'get'
    })
  }
} 