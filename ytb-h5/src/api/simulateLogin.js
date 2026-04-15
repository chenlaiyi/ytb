import request from '@/utils/request'

const VERIFY_ENDPOINT = '/api/admin/v1/simulate-login/verify'

/**
 * 验证模拟登录token并获取用户信息
 * @param {string} simulateToken 模拟登录token
 * @returns {Promise}
 */
export function verifySimulateLogin(simulateToken) {
  return request({
    url: VERIFY_ENDPOINT,
    method: 'get',
    params: {
      simulate_token: simulateToken
    }
  })
}

/**
 * 退出模拟登录模式
 * @returns {Promise}
 */
export function exitSimulateLogin() {
  return new Promise((resolve) => {
    // 清除模拟登录相关的sessionStorage
    sessionStorage.removeItem('simulate_mode')
    sessionStorage.removeItem('simulate_token')
    resolve({ success: true })
  })
} 
