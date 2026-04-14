import request from '@/utils/request'

/**
 * 获取取水点列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getWaterPointList(params) {
  return request({
    url: '/api/admin/v1/water-points',
    method: 'get',
    params
  })
}

/**
 * 创建取水点
 * @param {Object} data 取水点数据
 * @returns {Promise}
 */
export function createWaterPoint(data) {
  return request({
    url: '/api/admin/v1/water-points',
    method: 'post',
    data
  })
}

/**
 * 获取取水点详情
 * @param {number} id 取水点ID
 * @returns {Promise}
 */
export function getWaterPointDetail(id) {
  return request({
    url: `/api/admin/v1/water-points/${id}`,
    method: 'get'
  })
}

/**
 * 更新取水点
 * @param {number} id 取水点ID
 * @param {Object} data 更新数据
 * @returns {Promise}
 */
export function updateWaterPoint(id, data) {
  return request({
    url: `/api/admin/v1/water-points/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除取水点
 * @param {number} id 取水点ID
 * @returns {Promise}
 */
export function deleteWaterPoint(id) {
  return request({
    url: `/api/admin/v1/water-points/${id}`,
    method: 'delete'
  })
}

/**
 * 批量删除取水点
 * @param {Object} data 包含ids数组的对象
 * @returns {Promise}
 */
export function batchDeleteWaterPoints(ids) {
  return request({
    url: '/api/admin/v1/water-points/batch-delete',
    method: 'post',
    data: { ids }
  })
}

/**
 * 更新取水点状态
 * @param {number} id 取水点ID
 * @param {string} status 状态值
 * @returns {Promise}
 */
export function updateWaterPointStatus(id, status) {
  return request({
    url: `/api/admin/v1/water-points/${id}/status`,
    method: 'put',
    data: { status }
  })
}

/**
 * 更新取水点营业状态
 * @param {number} id 取水点ID
 * @param {boolean} is_open 营业状态
 * @returns {Promise}
 */
export function updateWaterPointOpenStatus(id, is_open) {
  return request({
    url: `/api/admin/v1/water-points/${id}/open-status`,
    method: 'put',
    data: { is_open }
  })
}

/**
 * 获取取水点统计信息
 * @returns {Promise}
 */
export function getWaterPointStatistics() {
  return request({
    url: '/api/admin/v1/water-points/statistics',
    method: 'get'
  })
}

/**
 * 获取附近取水点
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getNearbyWaterPoints(params) {
  return request({
    url: '/api/admin/v1/water-points/nearby',
    method: 'get',
    params
  })
}
