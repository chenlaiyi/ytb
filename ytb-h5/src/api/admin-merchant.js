import request from '@/utils/request';

/**
 * 获取商户列表
 * @param {Object} params 查询参数
 * @param {string} params.keyword 搜索关键词
 * @param {string} params.status 商户状态
 * @param {string} params.type 商户类型
 * @param {string} params.region 商户区域
 * @param {number} params.salesman_id 业务员ID
 * @param {string} params.order_by 排序字段
 * @param {string} params.order_dir 排序方向
 * @param {number} params.per_page 每页数量
 * @param {number} params.page 页码
 * @returns {Promise<Object>} 商户列表数据
 */
export function getMerchants(params) {
  return request({
    url: '/api/admin/v1/merchants',
    method: 'get',
    params
  });
}

/**
 * 获取管理员工作台所需的商户列表（含审核状态筛选）
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 商户列表数据
 */
export function getMerchantList(params) {
  return request({
    url: '/api/admin/v1/merchant/list',
    method: 'get',
    params
  });
}

/**
 * 获取商户中心详情（兼容草稿与正式）
 * @param {number|string} id 记录ID
 * @param {Object} params 额外查询参数
 * @returns {Promise<Object>} 商户详情数据
 */
export function getMerchantCenterDetail(id, params = {}) {
  return request({
    url: `/api/admin/v1/merchant/${id}`,
    method: 'get',
    params
  });
}

/**
 * 获取商户详情
 * @param {number} id 商户ID
 * @returns {Promise<Object>} 商户详情数据
 */
export function getMerchant(id) {
  return request({
    url: `/api/admin/v1/merchants/${id}`,
    method: 'get'
  });
}

/**
 * 创建商户
 * @param {Object} data 商户数据
 * @returns {Promise<Object>} 创建结果
 */
export function createMerchant(data) {
  return request({
    url: '/api/admin/v1/merchants',
    method: 'post',
    data
  });
}

/**
 * 更新商户
 * @param {number} id 商户ID
 * @param {Object} data 商户数据
 * @returns {Promise<Object>} 更新结果
 */
export function updateMerchant(id, data) {
  return request({
    url: `/api/admin/v1/merchants/${id}`,
    method: 'put',
    data
  });
}

/**
 * 删除商户
 * @param {number} id 商户ID
 * @returns {Promise<Object>} 删除结果
 */
export function deleteMerchant(id) {
  return request({
    url: `/api/admin/v1/merchants/${id}`,
    method: 'delete'
  });
}

/**
 * 获取商户统计数据
 * @param {number} id 商户ID
 * @returns {Promise<Object>} 统计数据
 */
export function getMerchantStats(id) {
  return request({
    url: `/api/admin/v1/merchants/${id}/stats`,
    method: 'get'
  });
}

/**
 * 获取支付机构进件统计
 * @returns {Promise<Object>} 统计数据
 */
export function getMerchantOnboardingStats() {
  return request({
    url: '/api/admin/v1/merchant/onboarding/stats',
    method: 'get'
  });
}

/**
 * 获取商户设备列表
 * @param {number} id 商户ID
 * @param {Object} params 查询参数
 * @param {string} params.device_type 设备类型
 * @param {string} params.status 设备状态
 * @param {string} params.order_by 排序字段
 * @param {string} params.order_dir 排序方向
 * @param {number} params.per_page 每页数量
 * @param {number} params.page 页码
 * @returns {Promise<Object>} 设备列表数据
 */
export function getMerchantDevices(id, params) {
  return request({
    url: `/api/admin/v1/merchants/${id}/devices`,
    method: 'get',
    params
  });
}

/**
 * 获取商户订单列表
 * @param {number} id 商户ID
 * @param {Object} params 查询参数
 * @param {string} params.status 订单状态
 * @param {string} params.pay_status 支付状态
 * @param {string} params.start_time 开始时间
 * @param {string} params.end_time 结束时间
 * @param {string} params.order_by 排序字段
 * @param {string} params.order_dir 排序方向
 * @param {number} params.per_page 每页数量
 * @param {number} params.page 页码
 * @returns {Promise<Object>} 订单列表数据
 */
export function getMerchantOrders(id, params) {
  return request({
    url: `/api/admin/v1/merchants/${id}/orders`,
    method: 'get',
    params
  });
}

/**
 * 获取商户类型列表
 * @returns {Promise<Object>} 类型列表
 */
export function getMerchantTypes() {
  return request({
    url: '/api/admin/v1/merchants/types',
    method: 'get'
  });
}

/**
 * 获取商户区域列表
 * @returns {Promise<Object>} 区域列表
 */
export function getMerchantRegions() {
  return request({
    url: '/api/admin/v1/merchants/regions',
    method: 'get'
  });
}
