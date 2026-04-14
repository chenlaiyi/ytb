import request from '@/utils/request'

/**
 * 积分增减操作
 * @param {Object} data - 操作数据
 * @returns {Promise}
 */
export function pointsOperation(data) {
  return request({
    url: '/api/admin/v1/points/operation',
    method: 'post',
    data
  })
}

/**
 * 手动分配积分
 * @param {Object} data - 分配数据
 * @returns {Promise}
 */
export function manualAssignPoints(data) {
  return request({
    url: '/api/admin/v1/points/manual-assign',
    method: 'post',
    data
  })
}

/**
 * 获取积分配置
 * @returns {Promise}
 */
export function getPointConfig() {
  return request({
    url: '/api/admin/v1/points/config',
    method: 'get'
  })
}

/**
 * 更新积分配置
 * @param {Object} data - 配置数据
 * @returns {Promise}
 */
export function updatePointConfig(data) {
  return request({
    url: '/api/admin/v1/points/config',
    method: 'post',
    data
  })
} 