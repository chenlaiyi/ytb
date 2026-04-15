import request from '@/utils/request'

/**
 * 分支机构微信相关API
 */

/**
 * 获取分支机构微信登录URL
 * @param {string} branchCode - 分支机构代码
 * @param {string} redirectUri - 登录成功后的回调地址
 * @returns {Promise}
 */
export function getBranchWechatLoginUrl(branchCode, redirectUri = null) {
  return request({
    url: '/api/branch-wechat/login-url',
    method: 'get',
    params: {
      branch_code: branchCode,
      redirect_uri: redirectUri
    },
    skipAuthToken: true
  })
}

/**
 * 处理分支机构微信登录回调
 * @param {string} code - 微信授权码
 * @param {string} state - 状态参数
 * @returns {Promise}
 */
export function handleBranchWechatCallback(code, state) {
  return request({
    url: '/api/branch-wechat/callback',
    method: 'post',
    data: {
      code,
      state
    },
    skipAuthToken: true
  })
}

/**
 * 验证分支机构用户token
 * @param {string} token - 用户token
 * @returns {Promise}
 */
export function verifyBranchUserToken(token) {
  return request({
    url: '/api/branch-wechat/verify-token',
    method: 'post',
    data: {
      token
    }
  })
}

/**
 * 获取分支机构微信JSSDK配置
 * @param {string} url - 当前页面URL
 * @param {string} branchCode - 分支机构代码
 * @returns {Promise}
 */
export function getBranchWechatJssdkConfig(url, branchCode) {
  return request({
    url: '/api/branch/wechat/jsconfig',
    method: 'get',
    params: {
      url,
      branch_code: branchCode
    }
  })
}

/**
 * 获取分支机构信息
 * @param {string} branchCode - 分支机构代码
 * @returns {Promise}
 */
export function getBranchInfo(branchCode) {
  return request({
    url: '/api/branch/info',
    method: 'get',
    params: {
      code: branchCode
    }
  })
} 