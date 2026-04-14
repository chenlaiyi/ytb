/**
 * Token验证和管理工具
 */

import axios from 'axios'
import { getAdminToken, clearAdminToken } from '@/utils/admin-token-bridge'

/**
 * 检查token是否有效
 */
export async function checkTokenValidity() {
  const token = getAdminToken()
  
  if (!token) {
    console.log('Token不存在')
    return false
  }

  try {
    // 调用token验证接口
    const response = await axios.get('/api/admin/auth/check-token', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    if (response.data && (response.data.code === 0 || response.data.code === 200)) {
      console.log('Token验证成功')
      return true
    } else {
      console.log('Token验证失败:', response.data)
      return false
    }
  } catch (error) {
    console.error('Token验证出错:', error)
    return false
  }
}

/**
 * 清除token并跳转登录页
 */
export function clearTokenAndRedirect() {
  console.log('清除token并跳转登录页')
  clearAdminToken()
  localStorage.removeItem('user')
  localStorage.removeItem('admin')
  
  // 跳转到登录页
  const baseUrl = '/admin'
  const redirectUrl = baseUrl + '/#/login?redirect=' + encodeURIComponent(window.location.pathname)
  window.location.href = redirectUrl
}

/**
 * 格式化token用于调试
 */
export function formatTokenForDebug(token) {
  if (!token) return 'null'
  if (token.length > 20) {
    return token.substring(0, 10) + '...' + token.substring(token.length - 10)
  }
  return token
} 
