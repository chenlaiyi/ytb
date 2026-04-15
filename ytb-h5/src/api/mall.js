import request from '@/utils/request'

// 商品相关API
export const goodsApi = {
  // 获取商品列表
  getList(params) {
    return request({
      url: '/mobile/v1/mall/goods',
      method: 'get',
      params
    })
  },

  // 获取商品详情
  getDetail(id) {
    return request({
      url: `/mobile/v1/mall/goods/${id}`,
      method: 'get'
    })
  },

  // 根据分类获取商品
  getByCategory(categoryId, params) {
    return request({
      url: `/mobile/v1/mall/goods/category/${categoryId}`,
      method: 'get',
      params
    })
  },

  // 获取热门商品
  getHotGoods(params) {
    return request({
      url: '/mobile/v1/mall/goods/hot',
      method: 'get',
      params
    })
  },

  // 获取推荐商品
  getRecommendGoods(params) {
    return request({
      url: '/mobile/v1/mall/goods/recommend',
      method: 'get',
      params
    })
  }
}

// 分类相关API
export const categoryApi = {
  // 获取分类列表
  getList(params) {
    return request({
      url: '/mobile/v1/mall/categories',
      method: 'get',
      params
    })
  },

  // 获取树形分类结构
  getTree() {
    return request({
      url: '/mobile/v1/mall/categories/tree',
      method: 'get'
    })
  },

  // 获取分类详情
  getDetail(id, params) {
    return request({
      url: `/mobile/v1/mall/categories/${id}`,
      method: 'get',
      params
    })
  }
}

// 订单相关API
export const orderApi = {
  // 创建订单
  create(data) {
    return request({
      url: '/mobile/v1/mall/orders',
      method: 'post',
      data
    })
  },

  // 获取订单列表
  getList(params) {
    return request({
      url: '/mobile/v1/mall/orders',
      method: 'get',
      params
    })
  },

  // 获取订单详情
  getDetail(id) {
    return request({
      url: `/mobile/v1/mall/orders/${id}`,
      method: 'get'
    })
  },

  // 支付订单
  pay(id, data) {
    return request({
      url: `/mobile/v1/mall/orders/${id}/pay`,
      method: 'post',
      data
    })
  },

  // 取消订单
  cancel(id) {
    return request({
      url: `/mobile/v1/mall/orders/${id}/cancel`,
      method: 'post'
    })
  },

  // 确认收货
  confirm(id) {
    return request({
      url: `/mobile/v1/mall/orders/${id}/confirm`,
      method: 'post'
    })
  }
}

// 管理后台商品API
const ADMIN_V1_PREFIX = '/api/admin/v1'

export const adminGoodsApi = {
  // 获取商品列表
  getList(params) {
    return request({
      url: `${ADMIN_V1_PREFIX}/mall/goods`,
      method: 'get',
      params
    })
  },

  // 获取商品详情
  getDetail(id) {
    return request({
      url: `${ADMIN_V1_PREFIX}/mall/goods/${id}`,
      method: 'get'
    })
  },

  // 创建商品
  create(data) {
    return request({
      url: `${ADMIN_V1_PREFIX}/mall/goods`,
      method: 'post',
      data
    })
  },

  // 更新商品
  update(id, data) {
    return request({
      url: `${ADMIN_V1_PREFIX}/mall/goods/${id}`,
      method: 'put',
      data
    })
  },

  // 删除商品
  delete(id) {
    return request({
      url: `${ADMIN_V1_PREFIX}/mall/goods/${id}`,
      method: 'delete'
    })
  },

  // 更新商品状态
  updateStatus(id, status) {
    return request({
      url: `${ADMIN_V1_PREFIX}/mall/goods/${id}/status`,
      method: 'put',
      data: { status }
    })
  }
}

// 管理后台分类API
export const adminCategoryApi = {
  // 获取分类列表
  getList(params) {
    return request({
      url: `${ADMIN_V1_PREFIX}/mall/categories`,
      method: 'get',
      params
    })
  },

  // 获取分类详情
  getDetail(id) {
    return request({
      url: `${ADMIN_V1_PREFIX}/mall/categories/${id}`,
      method: 'get'
    })
  },

  // 创建分类
  create(data) {
    return request({
      url: `${ADMIN_V1_PREFIX}/mall/categories`,
      method: 'post',
      data
    })
  },

  // 更新分类
  update(id, data) {
    return request({
      url: `${ADMIN_V1_PREFIX}/mall/categories/${id}`,
      method: 'put',
      data
    })
  },

  // 删除分类
  delete(id) {
    return request({
      url: `${ADMIN_V1_PREFIX}/mall/categories/${id}`,
      method: 'delete'
    })
  },

  // 更新分类状态
  updateStatus(id, is_show) {
    return request({
      url: `${ADMIN_V1_PREFIX}/mall/categories/${id}/status`,
      method: 'put',
      data: { is_show }
    })
  }
}

// 管理后台订单API
export const adminOrderApi = {
  // 获取订单列表
  getList(params) {
    return request({
      url: `${ADMIN_V1_PREFIX}/mall/orders`,
      method: 'get',
      params
    })
  },

  // 获取订单详情
  getDetail(id) {
    return request({
      url: `${ADMIN_V1_PREFIX}/mall/orders/${id}`,
      method: 'get'
    })
  },

  // 更新订单状态
  updateStatus(id, data) {
    return request({
      url: `${ADMIN_V1_PREFIX}/mall/orders/${id}/status`,
      method: 'put',
      data
    })
  },

  // 订单发货
  ship(id, data) {
    return request({
      url: `${ADMIN_V1_PREFIX}/mall/orders/${id}/ship`,
      method: 'post',
      data
    })
  },

  // 订单退款
  refund(id, data) {
    return request({
      url: `${ADMIN_V1_PREFIX}/mall/orders/${id}/refund`,
      method: 'post',
      data
    })
  },

  // 获取订单统计
  getStatistics(params) {
    return request({
      url: `${ADMIN_V1_PREFIX}/mall/orders/statistics`,
      method: 'get',
      params
    })
  }
}

// 测试API
export const mallTestApi = {
  // 测试数据库连接
  testConnection() {
    return request({
      url: '/Tapp/admin/public/api/test-mall/connection.php',
      method: 'get'
    })
  },

  // 测试商品数据
  testGoods() {
    return request({
      url: '/Tapp/admin/public/api/test-mall/goods.php',
      method: 'get'
    })
  },

  // 测试分类数据
  testCategories(params) {
    return request({
      url: '/Tapp/admin/public/api/test-mall/categories.php',
      method: 'get',
      params
    })
  },

  // 测试分类统计
  testCategoriesStats() {
    return request({
      url: '/Tapp/admin/public/api/test-mall/stats.php',
      method: 'get'
    })
  },

  // 测试订单数据
  testOrders() {
    return request({
      url: '/Tapp/admin/public/api/test-mall/orders.php',
      method: 'get'
    })
  },

  // 完整测试
  testAll() {
    return request({
      url: '/Tapp/admin/public/api/test-mall/all.php',
      method: 'get'
    })
  }
}

export default {
  goods: goodsApi,
  category: categoryApi,
  order: orderApi,
  adminGoods: adminGoodsApi,
  adminCategory: adminCategoryApi,
  adminOrder: adminOrderApi,
  test: mallTestApi
} 
