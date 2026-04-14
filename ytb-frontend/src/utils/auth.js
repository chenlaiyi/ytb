import { getAdminToken, setAdminToken, clearAdminToken } from '@/utils/admin-token-bridge'

/**
 * 认证工具函数
 */

/**
 * 获取用户token
 * @returns {string|null}
 */
export function getToken() {
  return getAdminToken()
}

/**
 * 设置用户token
 * @param {string} token
 */
export function setToken(token) {
  setAdminToken(token)
}

/**
 * 移除用户token
 */
export function removeToken() {
  clearAdminToken()
}

/**
 * 检查是否已登录
 * @returns {boolean}
 */
export function isLoggedIn() {
  return !!getToken()
} 
