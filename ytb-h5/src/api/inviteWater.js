import request from '@/utils/request'

/**
 * 生成邀请取水码
 * @param {Object} data - 邀请码生成参数
 * @returns {Promise}
 */
export function generateInviteCode(data = {}) {
  return request({
    url: '/api/invite-water/generate-code',
    method: 'post',
    data
  })
}

/**
 * 获取我的邀请记录
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getMyInvites(params = {}) {
  return request({
    url: '/api/invite-water/my-invites',
    method: 'get',
    params
  })
}

/**
 * 获取邀请统计
 * @param {Object} params - 查询参数 {user_id, branch_code}
 * @returns {Promise}
 */
export function getInviteStats(params = {}) {
  return request({
    url: '/api/invite-water/invite-stats',
    method: 'get',
    params
  })
}

/**
 * 验证邀请码
 * @param {string} code - 邀请码
 * @returns {Promise}
 */
export function verifyInviteCode(code) {
  return request({
    url: `/api/invite-water/verify-code/${code}`,
    method: 'get'
  })
}

/**
 * 通过邀请码注册
 * @param {Object} data - 注册数据
 * @returns {Promise}
 */
export function registerWithInvite(data) {
  return request({
    url: '/api/invite-water/register',
    method: 'post',
    data
  })
} 