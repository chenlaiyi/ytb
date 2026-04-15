import request from '@/utils/request'

/**
 * 获取取水点列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @param {string} params.keyword 关键词搜索
 * @param {number} params.distance 距离范围（米）
 * @param {number} params.lat 纬度
 * @param {number} params.lng 经度
 * @param {string} params.sortBy 排序方式 (distance|rating|created_at)
 * @returns {Promise<Object>} 取水点列表及分页信息
 */
export function getWaterPoints(params) {
  return request({
    url: '/api/mobile/v1/water-points',
    method: 'get',
    params
  })
}

/**
 * 获取取水点详情
 * @param {number} id 取水点ID
 * @returns {Promise<Object>} 取水点详情
 */
export function getWaterPointDetail(id) {
  return request({
    url: `/api/mobile/v1/water-points/${id}`,
    method: 'get'
  })
}

/**
 * 获取附近取水点
 * @param {Object} params 查询参数
 * @param {number} params.lat 纬度
 * @param {number} params.lng 经度
 * @param {number} params.radius 半径（米），默认5000
 * @param {number} params.limit 获取数量限制，默认10
 * @returns {Promise<Array>} 附近取水点列表
 */
export function getNearbyWaterPoints(params) {
  return request({
    url: '/api/mobile/v1/water-points/nearby/search',
    method: 'get',
    params
  })
}

/**
 * 收藏/取消收藏取水点
 * @param {Object} data 收藏数据
 * @param {number} data.id 取水点ID
 * @param {boolean} data.is_favorite 是否收藏
 * @returns {Promise<Object>} 操作结果
 */
export function toggleFavoriteWaterPoint(data) {
  return request({
    url: '/api/mobile/v1/water-points/favorite/toggle',
    method: 'post',
    data
  })
}

/**
 * 获取用户收藏的取水点列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @returns {Promise<Object>} 收藏的取水点列表及分页信息
 */
export function getFavoriteWaterPoints(params) {
  return request({
    url: '/api/mobile/v1/water-points/favorites',
    method: 'get',
    params
  })
}

/**
 * 提交取水点评价
 * @param {Object} data 评价数据
 * @param {number} data.water_point_id 取水点ID
 * @param {number} data.rating 评分（1-5）
 * @param {string} data.comment 评价内容
 * @param {Array} data.images 图片URL数组
 * @returns {Promise<Object>} 操作结果
 */
export function submitWaterPointReview(data) {
  return request({
    url: '/api/mobile/v1/water-points/reviews',
    method: 'post',
    data
  })
}

/**
 * 获取取水点评价列表
 * @param {Object} params 查询参数
 * @param {number} params.water_point_id 取水点ID
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @returns {Promise<Object>} 评价列表及分页信息
 */
export function getWaterPointReviews(params) {
  return request({
    url: '/api/mobile/v1/water-points/reviews',
    method: 'get',
    params
  })
} 