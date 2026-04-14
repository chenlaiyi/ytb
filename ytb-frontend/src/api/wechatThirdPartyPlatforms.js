import request from '../utils/request'

/**
 * 获取第三方平台列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getWechatThirdPartyPlatforms(params = {}) {
  return request({
    url: '/api/admin/v1/wechat-third-party-platforms',
    method: 'get',
    params
  })
}

/**
 * 获取第三方平台详情
 * @param {number} id - 平台ID
 * @returns {Promise}
 */
export function getWechatThirdPartyPlatform(id) {
  return request({
    url: `/api/admin/v1/wechat-third-party-platforms/${id}`,
    method: 'get'
  })
}

/**
 * 创建第三方平台
 * @param {Object} data - 平台数据
 * @returns {Promise}
 */
export function createWechatThirdPartyPlatform(data) {
  return request({
    url: '/api/admin/v1/wechat-third-party-platforms',
    method: 'post',
    data
  })
}

/**
 * 更新第三方平台
 * @param {number} id - 平台ID
 * @param {Object} data - 平台数据
 * @returns {Promise}
 */
export function updateWechatThirdPartyPlatform(id, data) {
  return request({
    url: `/api/admin/v1/wechat-third-party-platforms/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除第三方平台
 * @param {number} id - 平台ID
 * @returns {Promise}
 */
export function deleteWechatThirdPartyPlatform(id) {
  return request({
    url: `/api/admin/v1/wechat-third-party-platforms/${id}`,
    method: 'delete'
  })
}

/**
 * 更新第三方平台状态
 * @param {number} id - 平台ID
 * @param {string} status - 状态值
 * @returns {Promise}
 */
export function updateWechatThirdPartyPlatformStatus(id, status) {
  return request({
    url: `/api/admin/v1/wechat-third-party-platforms/${id}/status`,
    method: 'put',
    data: { status }
  })
}

/**
 * 生成授权链接
 * @param {number} id - 平台ID
 * @param {Object} data - 授权参数
 * @returns {Promise}
 */
export function generateAuthUrl(id, data) {
  return request({
    url: `/api/admin/v1/wechat-third-party-platforms/${id}/generate-auth-url`,
    method: 'post',
    data
  })
}

/**
 * 处理授权回调
 * @param {number} id - 平台ID
 * @param {Object} data - 回调数据
 * @returns {Promise}
 */
export function handleAuthCallback(id, data) {
  return request({
    url: `/api/admin/v1/wechat-third-party-platforms/${id}/auth-callback`,
    method: 'post',
    data
  })
}

/**
 * 获取授权公众号列表
 * @param {number} id - 平台ID
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getAuthorizedAccounts(id, params = {}) {
  return request({
    url: `/api/admin/v1/wechat-third-party-platforms/${id}/authorized-accounts`,
    method: 'get',
    params
  })
}

/**
 * 刷新授权方access_token
 * @param {number} id - 平台ID
 * @param {number} accountId - 授权账号ID
 * @returns {Promise}
 */
export function refreshAuthorizerToken(id, accountId) {
  return request({
    url: `/api/admin/v1/wechat-third-party-platforms/${id}/refresh-token/${accountId}`,
    method: 'post'
  })
}

/**
 * 获取第三方平台选项（用于下拉选择）
 * @returns {Promise}
 */
export function getWechatThirdPartyPlatformOptions() {
  return request({
    url: '/api/admin/v1/wechat-third-party-platforms/options',
    method: 'get'
  })
}

/**
 * 获取第三方平台配置（单一配置）
 * @returns {Promise}
 */
export function getWechatThirdPartyPlatformConfig() {
  return request({
    url: '/api/admin/v1/wechat-third-party-platform/config',
    method: 'get'
  })
}

/**
 * 保存第三方平台配置（创建或更新）
 * @param {Object} data - 配置数据
 * @returns {Promise}
 */
export function saveWechatThirdPartyPlatformConfig(data) {
  return request({
    url: '/api/admin/v1/wechat-third-party-platform/config',
    method: 'post',
    data
  })
}

/**
 * 生成授权链接（单一配置版本）
 * @param {string} type - 授权类型 (pc/h5)
 * @returns {Promise}
 */
export function generateWechatAuthUrl(type = 'pc') {
  return request({
    url: '/api/admin/v1/wechat-third-party-platform/generate-auth-url',
    method: 'post',
    data: { type }
  })
}

/**
 * 获取已授权公众号列表（单一配置版本）
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getWechatAuthorizedAccounts(params = {}) {
  return request({
    url: '/api/admin/v1/wechat-third-party-platform/authorized-accounts',
    method: 'get',
    params
  })
}

/**
 * 刷新授权方Token（单一配置版本）
 * @param {string} authorizerAppid - 授权方AppID
 * @returns {Promise}
 */
export function refreshWechatAuthorizerToken(authorizerAppid) {
  return request({
    url: '/api/admin/v1/wechat-third-party-platform/refresh-token',
    method: 'post',
    data: { authorizer_appid: authorizerAppid }
  })
} 