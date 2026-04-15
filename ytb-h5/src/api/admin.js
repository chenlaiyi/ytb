import request from '@/utils/request'

// 管理员工作台数据
export function getAdminWorkspace(params) {
  return request({
    url: '/api/mobile/v1/admin/workspace',
    method: 'get',
    params
  })
}

export function getAdminInstitutionRanking(params) {
  return request({
    url: '/api/mobile/v1/admin/institution-ranking',
    method: 'get',
    params
  })
}

export function refreshAdminToken() {
  return request({
    url: '/api/admin/v1/auth/refresh',
    method: 'post'
  })
}

export function oneClickAdminLogin(data = {}) {
  return request({
    url: '/api/mobile/v1/admin/login',
    method: 'post',
    data
  })
}

// 商品分类管理
export function getProductCategories(params) {
  return request({
    url: '/admin/api/v1/product-categories',
    method: 'get',
    params
  })
}

export function createProductCategory(data) {
  return request({
    url: '/admin/api/v1/product-categories',
    method: 'post',
    data
  })
}

export function updateProductCategory(id, data) {
  return request({
    url: `/admin/api/v1/product-categories/${id}`,
    method: 'post',
    data
  })
}

export function deleteProductCategory(id) {
  return request({
    url: `/admin/api/v1/product-categories/${id}`,
    method: 'delete'
  })
}

export function getProductCategory(id) {
  return request({
    url: `/admin/api/v1/product-categories/${id}`,
    method: 'get'
  })
}

// 上传分类图标
export function uploadCategoryIcon(file) {
  const formData = new FormData()
  formData.append('icon', file)
  
  return request({
    url: '/admin/api/v1/product-categories/upload-icon',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 用户管理
export function getUsers(params) {
  return request({
    url: '/admin/users',
    method: 'get',
    params
  })
}

export function getUserDetail(id) {
  return request({
    url: `/admin/users/${id}`,
    method: 'get'
  })
}

export function updateUser(id, data) {
  return request({
    url: `/admin/users/${id}`,
    method: 'put',
    data
  })
}

export function deleteUser(id) {
  return request({
    url: `/admin/users/${id}`,
    method: 'delete'
  })
}

// 商户管理
export function getMerchants(params) {
  return request({
    url: '/admin/merchants',
    method: 'get',
    params
  })
}

export function getMerchantDetail(id) {
  return request({
    url: `/admin/merchants/${id}`,
    method: 'get'
  })
}

export function updateMerchant(id, data) {
  return request({
    url: `/admin/merchants/${id}`,
    method: 'put',
    data
  })
}

export function deleteMerchant(id) {
  return request({
    url: `/admin/merchants/${id}`,
    method: 'delete'
  })
}

// 设备管理
export function getDevices(params) {
  return request({
    url: '/admin/devices',
    method: 'get',
    params
  })
}

export function getDeviceDetail(id) {
  return request({
    url: `/admin/devices/${id}`,
    method: 'get'
  })
}

export function updateDevice(id, data) {
  return request({
    url: `/admin/devices/${id}`,
    method: 'put',
    data
  })
}

export function deleteDevice(id) {
  return request({
    url: `/admin/devices/${id}`,
    method: 'delete'
  })
}

// 订单管理
export function getOrders(params) {
  return request({
    url: '/admin/orders',
    method: 'get',
    params
  })
}

export function getOrderDetail(id) {
  return request({
    url: `/admin/orders/${id}`,
    method: 'get'
  })
}

export function updateOrder(id, data) {
  return request({
    url: `/admin/orders/${id}`,
    method: 'put',
    data
  })
}

export function deleteOrder(id) {
  return request({
    url: `/admin/orders/${id}`,
    method: 'delete'
  })
}

// 导航管理
export function getNavigations(params) {
  return request({
    url: '/admin/navigations',
    method: 'get',
    params
  })
}

export function createNavigation(data) {
  return request({
    url: '/admin/navigations',
    method: 'post',
    data
  })
}

export function updateNavigation(id, data) {
  return request({
    url: `/admin/navigations/${id}`,
    method: 'put',
    data
  })
}

export function deleteNavigation(id) {
  return request({
    url: `/admin/navigations/${id}`,
    method: 'delete'
  })
}

// 系统设置
export function getSystemSettings() {
  return request({
    url: '/admin/settings',
    method: 'get'
  })
}

export function updateSystemSettings(data) {
  return request({
    url: '/admin/settings',
    method: 'put',
    data
  })
}

// 统计数据
export function getStatistics(params) {
  return request({
    url: '/admin/statistics',
    method: 'get',
    params
  })
}

// 日志管理
export function getLogs(params) {
  return request({
    url: '/admin/logs',
    method: 'get',
    params
  })
}

export function clearLogs() {
  return request({
    url: '/admin/logs/clear',
    method: 'delete'
  })
}
