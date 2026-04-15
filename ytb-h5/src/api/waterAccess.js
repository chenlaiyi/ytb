import request from '@/utils/request'

/**
 * 配置用户取水天数（管理员操作）
 * @param {Object} data - 配置数据
 * @param {number} data.user_id - 用户ID
 * @param {number} data.days - 天数
 * @param {string} data.reason - 操作原因
 * @param {string} data.operation - 操作类型：add增加, subtract减少
 */
export function configureWaterAccess(data) {
  return request({
    url: '/api/water-access/admin/configure',
    method: 'post',
    data
  })
}

/**
 * 获取用户取水天数信息
 * @param {number} userId - 用户ID
 */
export function getUserWaterAccess(userId) {
  return request({
    url: '/api/water-access/info',
    method: 'get',
    params: { user_id: userId }
  })
}

/**
 * 用户取水操作
 * @param {Object} data - 取水数据
 */
export function waterAccess(data) {
  return request({
    url: '/api/water-access/access',
    method: 'post',
    data
  })
} 