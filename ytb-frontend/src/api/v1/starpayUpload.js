import request from '@/utils/request'

/**
 * 上传星驿付Excel文件
 * @param {FormData} formData 包含type和file的表单数据
 * @returns {Promise}
 */
export function uploadStarpayData(formData) {
  return request({
    url: '/api/admin/v1/starpay/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 300000 // 5分钟超时
  })
}

/**
 * 获取星驿付上传记录
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.per_page 每页数量
 * @param {string} params.type 数据类型
 * @param {string} params.status 状态
 * @param {string} params.date_start 开始日期
 * @param {string} params.date_end 结束日期
 * @returns {Promise}
 */
export function fetchStarpayUploadRecords(params = {}) {
  return request({
    url: '/api/admin/v1/starpay/upload/logs',
    method: 'get',
    params
  })
}

/**
 * 获取星驿付商户数据
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.per_page 每页数量
 * @param {string} params.keyword 搜索关键词
 * @param {string} params.date_start 开始日期
 * @param {string} params.date_end 结束日期
 * @returns {Promise}
 */
export function fetchStarpayMerchants(params = {}) {
  return request({
    url: '/api/admin/v1/starpay/merchants',
    method: 'get',
    params
  })
}

/**
 * 获取星驿付服务商数据
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.per_page 每页数量
 * @param {string} params.keyword 搜索关键词
 * @returns {Promise}
 */
export function fetchStarpayPartners(params = {}) {
  return request({
    url: '/api/admin/v1/starpay/partners',
    method: 'get',
    params
  })
}

/**
 * 获取星驿付数据统计
 * @param {Object} params 查询参数
 * @param {string} params.date_start 开始日期
 * @param {string} params.date_end 结束日期
 * @returns {Promise}
 */
export function fetchStarpayStats(params = {}) {
  return request({
    url: '/api/admin/v1/starpay/summary',
    method: 'get',
    params
  })
}

/**
 * 导出星驿付商户数据
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function exportStarpayMerchants(params = {}) {
  return request({
    url: '/api/admin/v1/starpay/merchants/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

/**
 * 导出星驿付服务商数据
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function exportStarpayPartners(params = {}) {
  return request({
    url: '/api/admin/v1/starpay/partners/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

/**
 * 获取星驿付驾驶舱数据
 * @param {Object} params 查询参数
 * @param {string} params.date_start 开始日期
 * @param {string} params.date_end 结束日期
 * @returns {Promise}
 */
export function fetchStarpayDashboard(params = {}) {
  return request({
    url: '/api/admin/v1/starpay/summary',
    method: 'get',
    params
  })
}