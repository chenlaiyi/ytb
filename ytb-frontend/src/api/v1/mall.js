import request from '@/utils/request'

// ==================== 商品分类管理 ====================

/**
 * 获取商品分类列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getCategoryList(params) {
  return request({
    url: '/api/admin/v1/mall/categories',
    method: 'get',
    params
  })
}

/**
 * 获取所有分类（下拉选择用）
 * @returns {Promise}
 */
export function getAllCategories() {
  return request({
    url: '/api/admin/v1/mall/categories/all',
    method: 'get'
  })
}

/**
 * 获取商品分类详情
 * @param {number} id - 分类ID
 * @returns {Promise}
 */
export function getCategoryDetail(id) {
  return request({
    url: `/api/admin/v1/mall/categories/${id}`,
    method: 'get'
  })
}

/**
 * 创建商品分类
 * @param {Object} data - 分类数据
 * @returns {Promise}
 */
export function createCategory(data) {
  return request({
    url: '/api/admin/v1/mall/categories',
    method: 'post',
    data
  })
}

/**
 * 更新商品分类
 * @param {number} id - 分类ID
 * @param {Object} data - 分类数据
 * @returns {Promise}
 */
export function updateCategory(id, data) {
  return request({
    url: `/api/admin/v1/mall/categories/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除商品分类
 * @param {number} id - 分类ID
 * @returns {Promise}
 */
export function deleteCategory(id) {
  return request({
    url: `/api/admin/v1/mall/categories/${id}`,
    method: 'delete'
  })
}

/**
 * 批量删除商品分类
 * @param {Array} ids - 分类ID数组
 * @returns {Promise}
 */
export function batchDeleteCategories(ids) {
  return request({
    url: '/api/admin/v1/mall/categories/batch-destroy',
    method: 'post',
    data: { ids }
  })
}

/**
 * 更新分类状态
 * @param {number} id - 分类ID
 * @param {number} status - 状态
 * @returns {Promise}
 */
export function updateCategoryStatus(id, status) {
  return request({
    url: `/api/admin/v1/mall/categories/${id}/status`,
    method: 'put',
    data: { status }
  })
}

/**
 * 更新分类排序
 * @param {Array} sorts - 排序数据
 * @returns {Promise}
 */
export function updateCategorySort(sorts) {
  return request({
    url: '/api/admin/v1/mall/categories/update-sort',
    method: 'post',
    data: { sorts }
  })
}

// ==================== 商品管理 ====================

/**
 * 获取商品列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getProductList(params) {
  return request({
    url: '/api/admin/v1/mall/products',
    method: 'get',
    params
  })
}

/**
 * 获取商品详情
 * @param {number} id - 商品ID
 * @returns {Promise}
 */
export function getProductDetail(id) {
  return request({
    url: `/api/admin/v1/mall/products/${id}`,
    method: 'get'
  })
}

/**
 * 创建商品
 * @param {Object} data - 商品数据
 * @returns {Promise}
 */
export function createProduct(data) {
  return request({
    url: '/api/admin/v1/mall/products',
    method: 'post',
    data
  })
}

/**
 * 更新商品
 * @param {number} id - 商品ID
 * @param {Object} data - 商品数据
 * @returns {Promise}
 */
export function updateProduct(id, data) {
  return request({
    url: `/api/admin/v1/mall/products/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除商品
 * @param {number} id - 商品ID
 * @returns {Promise}
 */
export function deleteProduct(id) {
  return request({
    url: `/api/admin/v1/mall/products/${id}`,
    method: 'delete'
  })
}

/**
 * 批量删除商品
 * @param {Array} ids - 商品ID数组
 * @returns {Promise}
 */
export function batchDeleteProducts(ids) {
  return request({
    url: '/api/admin/v1/mall/products/batch-destroy',
    method: 'post',
    data: { ids }
  })
}

/**
 * 批量操作商品
 * @param {Array} ids - 商品ID数组
 * @param {string} operation - 操作类型
 * @returns {Promise}
 */
export function batchOperateProducts(ids, operation) {
  return request({
    url: '/api/admin/v1/mall/products/batch-operate',
    method: 'post',
    data: { ids, operation }
  })
}

/**
 * 更新商品状态
 * @param {number} id - 商品ID
 * @param {number} status - 状态
 * @returns {Promise}
 */
export function updateProductStatus(id, status) {
  return request({
    url: `/api/admin/v1/mall/products/${id}/status`,
    method: 'put',
    data: { status }
  })
}

/**
 * 更新商品上架状态
 * @param {number} id - 商品ID
 * @param {number} is_on_sale - 上架状态
 * @returns {Promise}
 */
export function updateProductOnSale(id, is_on_sale) {
  return request({
    url: `/api/admin/v1/mall/products/${id}/on-sale`,
    method: 'put',
    data: { is_on_sale }
  })
}

/**
 * 获取商品统计
 * @returns {Promise}
 */
export function getProductStatistics() {
  return request({
    url: '/api/admin/v1/mall/products/statistics',
    method: 'get'
  })
}

/**
 * 获取商品分类（下拉选择用）
 * @returns {Promise}
 */
export function getProductCategories() {
  return request({
    url: '/api/admin/v1/mall/products/categories',
    method: 'get'
  })
}

/**
 * 获取商品标签统计
 * @returns {Promise}
 */
export function getProductTagsStatistics() {
  return request({
    url: '/api/admin/v1/mall/products/tags/statistics',
    method: 'get'
  })
}

/**
 * 批量设置商品标签
 * @param {Object} data - 标签数据
 * @returns {Promise}
 */
export function batchSetProductTags(data) {
  return request({
    url: '/api/admin/v1/mall/products/tags/batch-set',
    method: 'post',
    data
  })
}

// ==================== 订单管理 ====================

/**
 * 获取订单列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getOrderList(params) {
  return request({
    url: '/api/admin/v1/mall/orders',
    method: 'get',
    params
  })
}

/**
 * 获取订单详情
 * @param {number} id - 订单ID
 * @returns {Promise}
 */
export function getOrderDetail(id) {
  return request({
    url: `/api/admin/v1/mall/orders/${id}`,
    method: 'get'
  })
}

/**
 * 更新订单状态
 * @param {number} id - 订单ID
 * @param {number} status - 状态
 * @param {string} admin_remark - 管理员备注
 * @returns {Promise}
 */
export function updateOrderStatus(id, status, admin_remark = '') {
  return request({
    url: `/api/admin/v1/mall/orders/${id}/status`,
    method: 'put',
    data: { status, admin_remark }
  })
}

/**
 * 订单发货
 * @param {number} id - 订单ID
 * @param {Object} data - 发货数据
 * @returns {Promise}
 */
export function shipOrder(id, data) {
  return request({
    url: `/api/admin/v1/mall/orders/${id}/ship`,
    method: 'post',
    data
  })
}

/**
 * 批量发货
 * @param {Array} orders - 订单数据
 * @returns {Promise}
 */
export function batchShipOrders(orders) {
  return request({
    url: '/api/admin/v1/mall/orders/batch-ship',
    method: 'post',
    data: { orders }
  })
}

/**
 * 确认订单
 * @param {number} id - 订单ID
 * @param {string} admin_remark - 管理员备注
 * @returns {Promise}
 */
export function confirmOrder(id, admin_remark = '') {
  return request({
    url: `/api/admin/v1/mall/orders/${id}/confirm`,
    method: 'post',
    data: { admin_remark }
  })
}

/**
 * 取消订单
 * @param {number} id - 订单ID
 * @param {string} cancel_reason - 取消原因
 * @param {string} admin_remark - 管理员备注
 * @returns {Promise}
 */
export function cancelOrder(id, cancel_reason, admin_remark = '') {
  return request({
    url: `/api/admin/v1/mall/orders/${id}/cancel`,
    method: 'post',
    data: { cancel_reason, admin_remark }
  })
}

/**
 * 更新订单地址
 * @param {number} id - 订单ID
 * @param {Object} data - 地址数据
 * @returns {Promise}
 */
export function updateOrderAddress(id, data) {
  return request({
    url: `/api/admin/v1/mall/orders/${id}/address`,
    method: 'put',
    data
  })
}

/**
 * 获取订单统计
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getOrderStatistics(params) {
  return request({
    url: '/api/admin/v1/mall/orders/statistics',
    method: 'get',
    params
  })
}

/**
 * 导出订单
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function exportOrders(params) {
  return request({
    url: '/api/admin/v1/mall/orders/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// ==================== 文件上传 ====================

/**
 * 上传商品图片
 * @param {File} file - 图片文件
 * @returns {Promise}
 */
export function uploadProductImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', 'product')
  
  return request({
    url: '/api/admin/v1/mall/upload/image',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 上传分类图标
 * @param {File} file - 图标文件
 * @returns {Promise}
 */
export function uploadCategoryIcon(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', 'category')
  
  return request({
    url: '/api/admin/v1/mall/upload/icon',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// ==================== 官方商城管理 API ====================

/**
 * 官方商城管理API
 */
export const mallOfficialApi = {
  // 获取概览数据
  getDashboard() {
    return request({
      url: '/api/admin/v1/mall/official/dashboard',
      method: 'get'
    })
  },

  // 获取商品列表
  getProducts(params) {
    return request({
      url: '/api/admin/v1/mall/official/products',
      method: 'get',
      params
    })
  },

  // 获取分类列表
  getCategories(params) {
    return request({
      url: '/api/admin/v1/mall/official/categories',
      method: 'get',
      params
    })
  },

  // 创建分类
  createCategory(data) {
    return request({
      url: '/api/admin/v1/mall/official/categories',
      method: 'post',
      data
    })
  },

  // 更新分类
  updateCategory(id, data) {
    return request({
      url: `/api/admin/v1/mall/official/categories/${id}`,
      method: 'put',
      data
    })
  },

  // 删除分类
  deleteCategory(id) {
    return request({
      url: `/api/admin/v1/mall/official/categories/${id}`,
      method: 'delete'
    })
  },

  // 更新分类状态
  updateCategoryStatus(id, data) {
    return request({
      url: `/api/admin/v1/mall/official/categories/${id}/status`,
      method: 'put',
      data
    })
  },

  // 获取订单列表
  getOrders(params) {
    return request({
      url: '/api/admin/v1/mall/official/orders',
      method: 'get',
      params
    })
  },

  // 获取订单详情
  getOrderDetail(id) {
    return request({
      url: `/api/admin/v1/mall/official/orders/${id}`,
      method: 'get'
    })
  },

  // 订单发货
  shipOrder(id, data) {
    return request({
      url: `/api/admin/v1/mall/official/orders/${id}/ship`,
      method: 'post',
      data
    })
  },

  // 确认订单
  confirmOrder(id) {
    return request({
      url: `/api/admin/v1/mall/official/orders/${id}/confirm`,
      method: 'post'
    })
  },

  // 取消订单
  cancelOrder(id, cancelReason) {
    return request({
      url: `/api/admin/v1/mall/official/orders/${id}/cancel`,
      method: 'post',
      data: { cancel_reason: cancelReason }
    })
  },

  // 同意退款
  approveRefund(id) {
    return request({
      url: `/api/admin/v1/mall/official/orders/${id}/approve-refund`,
      method: 'post'
    })
  },

  // 拒绝退款
  rejectRefund(id, reason) {
    return request({
      url: `/api/admin/v1/mall/official/orders/${id}/reject-refund`,
      method: 'post',
      data: { reason }
    })
  },

  // 获取物流列表
  getLogistics(params) {
    return request({
      url: '/api/admin/v1/mall/official/logistics',
      method: 'get',
      params
    })
  },

  // 获取用户列表
  getUsers(params) {
    return request({
      url: '/api/admin/v1/mall/official/users',
      method: 'get',
      params
    })
  },

  // 更新商品状态
  updateProductStatus(id, data) {
    return request({
      url: `/api/admin/v1/mall/official/products/${id}/status`,
      method: 'put',
      data
    })
  },

  // 更新订单状态
  updateOrderStatus(id, data) {
    return request({
      url: `/api/admin/v1/mall/official/orders/${id}/status`,
      method: 'put',
      data
    })
  },

  // 标记为自提订单
  selfPickupOrder(id) {
    return request({
      url: `/api/admin/v1/mall/official/orders/${id}/self-pickup`,
      method: 'post'
    })
  }
}

// ==================== 商户商城管理 API ====================

/**
 * 商户商城管理API
 */
export const mallMerchantApi = {
  // 获取概览数据
  getDashboard() {
    return request({
      url: '/api/admin/v1/mall/merchant/dashboard',
      method: 'get'
    })
  },

  // 获取商户列表
  getMerchants(params) {
    return request({
      url: '/api/admin/v1/mall/merchant/merchants',
      method: 'get',
      params
    })
  },

  // 获取分类列表
  getCategories(params) {
    return request({
      url: '/api/admin/v1/mall/merchant/categories',
      method: 'get',
      params
    })
  },

  // 创建分类
  createCategory(data) {
    return request({
      url: '/api/admin/v1/mall/merchant/categories',
      method: 'post',
      data
    })
  },

  // 更新分类
  updateCategory(id, data) {
    return request({
      url: `/api/admin/v1/mall/merchant/categories/${id}`,
      method: 'put',
      data
    })
  },

  // 删除分类
  deleteCategory(id) {
    return request({
      url: `/api/admin/v1/mall/merchant/categories/${id}`,
      method: 'delete'
    })
  },

  // 更新分类状态
  updateCategoryStatus(id, data) {
    return request({
      url: `/api/admin/v1/mall/merchant/categories/${id}/status`,
      method: 'put',
      data
    })
  },

  // 获取商品列表
  getProducts(params) {
    return request({
      url: '/api/admin/v1/mall/merchant/products',
      method: 'get',
      params
    })
  },

  // 获取商品详情
  getProductDetail(id) {
    return request({
      url: `/api/admin/v1/mall/merchant/products/${id}`,
      method: 'get'
    })
  },

  // 获取订单列表
  getOrders(params) {
    return request({
      url: '/api/admin/v1/mall/merchant/orders',
      method: 'get',
      params
    })
  },

  // 获取物流列表
  getLogistics(params) {
    return request({
      url: '/api/admin/v1/mall/merchant/logistics',
      method: 'get',
      params
    })
  },

  // 获取商城用户
  getUsers(params) {
    return request({
      url: '/api/admin/v1/mall/merchant/users',
      method: 'get',
      params
    })
  },

  // 获取商户积分
  getPoints(params) {
    return request({
      url: '/api/admin/v1/mall/merchant/points',
      method: 'get',
      params
    })
  },

  // 审核商户
  auditMerchant(id, data) {
    return request({
      url: `/api/admin/v1/mall/merchant/merchants/${id}/audit`,
      method: 'put',
      data
    })
  },

  // 更新商户状态
  updateMerchantStatus(id, data) {
    return request({
      url: `/api/admin/v1/mall/merchant/merchants/${id}/status`,
      method: 'put',
      data
    })
  },

  // 审核商品
  auditProduct(id, data) {
    return request({
      url: `/api/admin/v1/mall/merchant/products/${id}/audit`,
      method: 'put',
      data
    })
  },

  // 更新商品状态
  updateProductStatus(id, data) {
    return request({
      url: `/api/admin/v1/mall/merchant/products/${id}/status`,
      method: 'put',
      data
    })
  },

  // 批量审核商品
  batchAuditProducts(data) {
    return request({
      url: '/api/admin/v1/mall/merchant/products/batch-audit',
      method: 'post',
      data
    })
  }
}

// ==================== 通用商城管理 API ====================

/**
 * 通用商城管理API（保留原有功能）
 */
export const mallCommonApi = {
  // 获取分类列表（保留原有功能）
  getCategories(params) {
    return request({
      url: '/api/admin/v1/mall/categories',
      method: 'get',
      params
    })
  },

  // 创建分类
  createCategory(data) {
    return request({
      url: '/api/admin/v1/mall/categories',
      method: 'post',
      data
    })
  },

  // 更新分类
  updateCategory(id, data) {
    return request({
      url: `/api/admin/v1/mall/categories/${id}`,
      method: 'put',
      data
    })
  },

  // 删除分类
  deleteCategory(id) {
    return request({
      url: `/api/admin/v1/mall/categories/${id}`,
      method: 'delete'
    })
  },

  // 更新分类状态
  updateCategoryStatus(id, data) {
    return request({
      url: `/api/admin/v1/mall/categories/${id}/status`,
      method: 'put',
      data
    })
  },

  // 获取商品列表（保留原有功能）
  getProducts(params) {
    return request({
      url: '/api/admin/v1/mall/products',
      method: 'get',
      params
    })
  },

  // 创建商品
  createProduct(data) {
    return request({
      url: '/api/v1/mall/products',
      method: 'post',
      data
    })
  },

  // 更新商品
  updateProduct(id, data) {
    return request({
      url: `/api/v1/mall/products/${id}`,
      method: 'put',
      data
    })
  },

  // 删除商品
  deleteProduct(id) {
    return request({
      url: `/api/v1/mall/products/${id}`,
      method: 'delete'
    })
  },

  // 获取订单列表（保留原有功能）
  getOrders(params) {
    return request({
      url: '/api/v1/mall/orders',
      method: 'get',
      params
    })
  },

  // 更新订单状态
  updateOrderStatus(id, data) {
    return request({
      url: `/api/v1/mall/orders/${id}/status`,
      method: 'put',
      data
    })
  },

  // 发货
  shipOrder(id, data) {
    return request({
      url: `/api/v1/mall/orders/${id}/ship`,
      method: 'post',
      data
    })
  },

  // 确认订单
  confirmOrder(id) {
    return request({
      url: `/api/v1/mall/orders/${id}/confirm`,
      method: 'post'
    })
  },

  // 取消订单
  cancelOrder(id, data) {
    return request({
      url: `/api/v1/mall/orders/${id}/cancel`,
      method: 'post',
      data
    })
  }
}

// ==================== 综合分类管理 API ====================

/**
 * 综合分类管理API
 * 整合官方和商户分类的统一管理接口
 */
export const mallCategoriesApi = {
  /**
   * 获取所有分类（官方+商户）
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  async getAllCategories(params = {}) {
    try {
      const { page = 1, size = 20, type, status, keyword } = params
      const query = {
        page,
        per_page: size
      }

      if (type) {
        query.type = type
      }

      if (status !== '' && status !== undefined && status !== null) {
        query.status = status
      }

      if (keyword) {
        query.keyword = keyword
      }

      return await request({
        url: '/api/admin/v1/mall/categories/combined',
        method: 'get',
        params: query
      })
    } catch (error) {
      console.error('获取综合分类失败:', error)
      return {
        code: 1,
        message: error.message || '获取分类失败',
        data: { list: [], total: 0 }
      }
    }
  },

  /**
   * 创建分类（根据类型调用对应API）
   * @param {Object} data - 分类数据
   * @returns {Promise}
   */
  createCategory(data) {
    const api = data.mch_id === 0 ? mallOfficialApi : mallMerchantApi
    return api.createCategory(data)
  },

  /**
   * 更新分类（根据类型调用对应API）
   * @param {number} id - 分类ID
   * @param {Object} data - 分类数据
   * @returns {Promise}
   */
  updateCategory(id, data) {
    const api = data.mch_id === 0 ? mallOfficialApi : mallMerchantApi
    return api.updateCategory(id, data)
  },

  /**
   * 删除分类（根据类型调用对应API）
   * @param {number} id - 分类ID
   * @param {number} mchId - 商户ID
   * @returns {Promise}
   */
  deleteCategory(id, mchId) {
    const api = mchId === 0 ? mallOfficialApi : mallMerchantApi
    return api.deleteCategory(id)
  },

  /**
   * 更新分类状态（根据类型调用对应API）
   * @param {number} id - 分类ID
   * @param {number} mchId - 商户ID
   * @param {Object} data - 状态数据
   * @returns {Promise}
   */
  updateCategoryStatus(id, mchId, data) {
    const api = mchId === 0 ? mallOfficialApi : mallMerchantApi
    return api.updateCategoryStatus(id, data)
  },

  /**
   * 获取分类统计信息
   * @returns {Promise}
   */
  async getCategoryStats() {
    try {
      const response = await request({
        url: '/api/admin/v1/mall/categories/combined/stats',
        method: 'get'
      })

      return {
        code: 0,
        data: response.data
      }
    } catch (error) {
      return {
        code: 1,
        message: error.message || '获取统计失败',
        data: {
          official: { total: 0, active: 0, inactive: 0 },
          merchant: { total: 0, active: 0, inactive: 0 },
          total: { all: 0, active: 0, inactive: 0 }
        }
      }
    }
  }
}

// 导出所有API
export default {
  official: mallOfficialApi,
  merchant: mallMerchantApi,
  common: mallCommonApi,
  categories: mallCategoriesApi
} 
