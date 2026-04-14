import request from '@/utils/request'

const SIMULATE_LOGIN_API = '/api/admin/v1/simulate-login'

/**
 * 生成模拟登录token
 * @param {number} userId 用户ID
 * @returns {Promise}
 */
export function generateSimulateToken(userId) {
  return request({
    url: SIMULATE_LOGIN_API,
    method: 'post',
    data: {
      user_id: userId
    }
  })
}

/**
 * 验证模拟登录token
 * @param {string} token 模拟登录token
 * @returns {Promise}
 */
export function verifySimulateToken(token) {
  return request({
    url: `${SIMULATE_LOGIN_API}/verify`,
    method: 'get',
    params: {
      simulate_token: token
    }
  })
}

/**
 * 获取模拟登录日志 - 暂时禁用
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getSimulateLoginLogs(params = {}) {
  // 简化版本暂时不支持日志功能
  return Promise.resolve({
    code: 0,
    data: [],
    message: '简化版本暂不支持日志功能'
  })
} 
