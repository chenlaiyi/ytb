import request from '@/utils/request'

/**
   * 获取用户积分信息
 * @returns {Promise}
 */
export function getUserPoints() {
  return request({
    url: '/api/mobile/v1/points/info',
    method: 'get'
  })
}

  /**
   * 获取积分记录
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getPointRecords(params = {}) {
  return request({
    url: '/api/mobile/v1/points/records',
    method: 'get',
    params
  })
}

  /**
 * 签到取水（消费积分）
 * @param {Object} data - 签到数据
 * @returns {Promise}
 */
export function checkinWater(data) {
  return request({
    url: '/user-points/checkin',
    method: 'post',
    data
  })
}

/**
 * 管理员手动分配积分
 * @param {Object} data - 分配数据
 * @returns {Promise}
 */
export function manualAssignPoints(data) {
  return request({
    url: '/admin/points/manual-assign',
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
    url: '/admin/points/config',
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
    url: '/admin/points/config',
    method: 'post',
    data
    })
  }

/**
 * 积分增减操作
 * @param {Object} data - 操作数据
 * @returns {Promise}
 */
export function pointsOperation(data) {
  return request({
    url: '/admin/points/operation',
    method: 'post',
    data
  })
} 
