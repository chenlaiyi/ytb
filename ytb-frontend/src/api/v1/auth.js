import service from '@/utils/axios';

/**
 * 管理员登录
 * @param {Object} data 登录数据
 * @returns {Promise} 登录结果
 */
export function login(data) {
  return service({
    url: '/api/admin/v1/auth/login',
    method: 'post',
    data
  });
}

/**
 * 管理员登出
 * @returns {Promise} 登出结果
 */
export function logout() {
  return service({
    url: '/api/admin/v1/auth/logout',
    method: 'post'
  });
}

/**
 * 获取用户信息
 * @returns {Promise} 用户信息
 */
export function getUserInfo() {
  return service({
    url: '/api/admin/v1/auth/me',
    method: 'get'
  });
}

/**
 * 刷新Token
 * @returns {Promise} 新Token
 */
export function refreshToken() {
  return service({
    url: '/api/admin/v1/auth/refresh',
    method: 'post'
  });
}

/**
 * 修改密码
 * @param {Object} data 密码数据
 * @returns {Promise} 修改结果
 */
export function changePassword(data) {
  return service({
    url: '/api/admin/v1/auth/change-password',
    method: 'post',
    data
  });
}

/**
 * 获取验证码
 * @returns {Promise} 验证码
 */
export function getCaptcha() {
  return service({
    url: '/api/admin/v1/auth/captcha',
    method: 'get'
  });
}

/**
 * 验证Token
 * @param {string} token Token
 * @returns {Promise} 验证结果
 */
export function verifyToken(token) {
  return service({
    url: '/api/admin/v1/auth/verify-token',
    method: 'post',
    data: { token }
  });
}

/**
 * 重置密码
 * @param {Object} data 重置数据
 * @returns {Promise} 重置结果
 */
export function resetPassword(data) {
  return service({
    url: '/api/admin/v1/auth/reset-password',
    method: 'post',
    data
  });
}

/**
 * 获取用户权限
 * @returns {Promise} 权限列表
 */
export function getPermissions() {
  return service({
    url: '/api/admin/v1/auth/permissions',
    method: 'get'
  });
}

/**
 * 获取用户菜单
 * @returns {Promise} 菜单列表
 */
export function getMenus() {
  return service({
    url: '/api/admin/v1/auth/menus',
    method: 'get'
  });
}

/**
 * 更新个人资料
 * @param {Object} data 资料数据
 * @returns {Promise} 更新结果
 */
export function updateProfile(data) {
  return service({
    url: '/api/admin/v1/auth/profile',
    method: 'put',
    data
  });
}

/**
 * 上传头像
 * @param {FormData} data 头像文件
 * @returns {Promise} 上传结果
 */
export function uploadAvatar(data) {
  return service({
    url: '/api/admin/v1/auth/avatar',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 检查用户名是否可用
 * @param {string} username 用户名
 * @returns {Promise} 检查结果
 */
export function checkUsername(username) {
  return service({
    url: '/api/admin/v1/auth/check-username',
    method: 'post',
    data: { username }
  });
}

/**
 * 获取登录日志
 * @param {Object} params 查询参数
 * @returns {Promise} 登录日志
 */
export function getLoginLogs(params) {
  return service({
    url: '/api/admin/v1/auth/login-logs',
    method: 'get',
    params
  });
}

/**
 * 强制登出
 * @param {string} sessionId 会话ID
 * @returns {Promise} 登出结果
 */
export function forceLogout(sessionId) {
  return service({
    url: '/api/admin/v1/auth/force-logout',
    method: 'post',
    data: { session_id: sessionId }
  });
}

/**
 * 检查当前令牌类型
 * @returns {Promise} 令牌检查结果
 */
export function checkToken() {
  return service({
    url: '/api/admin/v1/auth/check-token',
    method: 'get'
  });
}

/**
 * 获取微信登录URL
 * @param {Object} params 参数
 * @returns {Promise} 微信登录URL
 */
export function getWechatLoginUrl(params = {}) {
  return service({
    url: '/api/admin/v1/auth/wechat/login-url',
    method: 'get',
    params
  });
}

/**
 * 微信登录回调处理
 * @param {Object} data 微信回调数据
 * @returns {Promise} 登录结果
 */
export function wechatLoginCallback(data) {
  return service({
    url: '/api/admin/v1/auth/wechat/callback',
    method: 'post',
    data
  });
}

/**
 * 检查微信登录状态
 * @param {string} state 状态值
 * @returns {Promise} 登录状态
 */
export function checkWechatLoginStatus(state) {
  return service({
    url: '/api/admin/v1/auth/wechat/login-status',
    method: 'get',
    params: { state }
  });
}

/**
 * 获取微信绑定URL
 * @returns {Promise} 微信绑定URL
 */
export function getWechatBindUrl() {
  return service({
    url: '/api/admin/v1/auth/wechat/bind-url',
    method: 'get'
  });
}

/**
 * 解除微信绑定
 * @returns {Promise} 解绑结果
 */
export function unbindWechat() {
  return service({
    url: '/api/admin/v1/auth/wechat/unbind',
    method: 'post'
  });
}

/**
 * 切换微信登录状态
 * @param {boolean} enabled 是否启用微信登录
 * @returns {Promise} 切换结果
 */
export function toggleWechatLogin(enabled) {
  return service({
    url: '/api/admin/v1/auth/wechat/toggle',
    method: 'post',
    data: { wechat_enabled: enabled }
  });
}

/**
 * 检查微信绑定状态
 * @param {string} state 状态值
 * @returns {Promise} 绑定状态
 */
export function checkWechatBindStatus(state) {
  return service({
    url: '/api/admin/v1/auth/wechat/bind-status',
    method: 'get',
    params: { state: state }
  });
}

/**
 * 微信绑定回调处理
 * @param {Object} data 微信回调数据
 * @returns {Promise} 绑定结果
 */
export function wechatBindCallback(data) {
  return service({
    url: '/api/admin/v1/auth/wechat/bind-callback',
    method: 'post',
    data
  });
}

/**
 * 登录后绑定微信
 * @param {string} state 状态值
 * @returns {Promise} 绑定结果
 */
export function bindWechatAfterLogin(state) {
  return service({
    url: '/api/admin/v1/auth/wechat/bind-after-login',
    method: 'post',
    data: { state }
  });
}

export default {
  login,
  logout,
  getUserInfo,
  refreshToken,
  changePassword,
  getCaptcha,
  verifyToken,
  resetPassword,
  getPermissions,
  getMenus,
  updateProfile,
  uploadAvatar,
  checkUsername,
  getLoginLogs,
  forceLogout,
  checkToken,
  getWechatLoginUrl,
  wechatLoginCallback,
  checkWechatLoginStatus,
  getWechatBindUrl,
  checkWechatBindStatus,
  unbindWechat,
  toggleWechatLogin,
  wechatBindCallback,
  bindWechatAfterLogin
}
