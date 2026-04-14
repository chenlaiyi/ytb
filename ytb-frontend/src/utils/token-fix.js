/**
 * Token问题快速修复工具
 * 用于修复常见的认证问题
 */

import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminToken, setAdminToken, clearAdminAuthState } from '@/utils/admin-token-bridge'

// 修复token格式问题
export function fixTokenFormat() {
  const token = getAdminToken()
  
  if (!token) {
    console.log('没有发现token')
    return false
  }
  
  // 检查token格式
  if (token.startsWith('Bearer ')) {
    // 移除Bearer前缀
    const cleanToken = token.replace('Bearer ', '')
    setAdminToken(cleanToken)
    console.log('已修复token格式，移除Bearer前缀')
    return true
  }
  
  return false
}

// 清理损坏的认证数据
export function cleanupCorruptedAuth() {
  try {
    // 检查user数据
    const userStr = localStorage.getItem('user')
    if (userStr) {
      JSON.parse(userStr)
    }
  } catch (error) {
    console.log('发现损坏的user数据，正在清理...')
    localStorage.removeItem('user')
  }
  
  try {
    // 检查admin数据
    const adminStr = localStorage.getItem('admin')
    if (adminStr) {
      JSON.parse(adminStr)
    }
  } catch (error) {
    console.log('发现损坏的admin数据，正在清理...')
    localStorage.removeItem('admin')
  }
  
  try {
    // 检查userInfo数据
    const userInfoStr = localStorage.getItem('userInfo')
    if (userInfoStr) {
      JSON.parse(userInfoStr)
    }
  } catch (error) {
    console.log('发现损坏的userInfo数据，正在清理...')
    localStorage.removeItem('userInfo')
  }
}

// 验证并修复axios配置
export function fixAxiosConfig() {
  // 检查是否有默认的Authorization头
  if (axios.defaults.headers.common['Authorization']) {
    const authHeader = axios.defaults.headers.common['Authorization']
    console.log('当前axios默认Authorization头:', authHeader)
    
    // 如果格式不正确，清除它
    if (!authHeader.startsWith('Bearer ')) {
      delete axios.defaults.headers.common['Authorization']
      console.log('已清除格式不正确的Authorization头')
    }
  }
  
  // 重新设置正确的Authorization头
  const token = getAdminToken()
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    console.log('已重新设置Authorization头')
  }
}

// 测试并修复API基础路径
export async function fixAPIBasePath() {
  const token = getAdminToken()
  if (!token) {
    console.log('没有token，跳过API路径测试')
    return false
  }
  
  // 测试不同的API路径
  const paths = [
    '/api/admin/auth/check-token',
    '/admin/api/admin/auth/check-token',
    '/Tapp/admin/api/admin/auth/check-token'
  ]
  
  for (const path of paths) {
    try {
      console.log(`测试API路径: ${path}`)
      const response = await axios.get(path, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        timeout: 5000
      })
      
      if (response.status === 200) {
        console.log(`API路径 ${path} 可用`)
        // 如果不是默认路径，可能需要更新axios baseURL
        if (!path.startsWith('/api/')) {
          console.log('发现非标准API路径，建议检查axios配置')
        }
        return true
      }
    } catch (error) {
      console.log(`API路径 ${path} 不可用:`, error.response?.status || error.message)
    }
  }
  
  return false
}

// 一键修复所有常见问题
export async function autoFixCommonIssues() {
  console.log('=== 开始自动修复常见认证问题 ===')
  
  const fixes = []
  
  // 1. 修复token格式
  if (fixTokenFormat()) {
    fixes.push('Token格式已修复')
  }
  
  // 2. 清理损坏数据
  cleanupCorruptedAuth()
  fixes.push('已清理损坏的认证数据')
  
  // 3. 修复axios配置
  fixAxiosConfig()
  fixes.push('Axios配置已修复')
  
  // 4. 测试API路径
  const apiWorking = await fixAPIBasePath()
  if (apiWorking) {
    fixes.push('API路径验证通过')
  } else {
    fixes.push('API路径验证失败，可能需要手动检查')
  }
  
  console.log('=== 修复完成 ===')
  console.log('应用的修复:', fixes)
  
  return {
    fixes,
    apiWorking,
    recommendation: apiWorking ? '建议刷新页面测试' : '建议检查网络连接和服务器状态'
  }
}

// 强制重新登录（清除所有认证数据）
export function forceRelogin() {
  return ElMessageBox.confirm(
    '这将清除所有认证信息并跳转到登录页面。确定继续吗？',
    '强制重新登录',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 清除所有认证相关的localStorage数据
    const authKeys = ['token', 'user', 'admin', 'userInfo']
    authKeys.forEach(key => {
      localStorage.removeItem(key)
    })
    clearAdminAuthState()
    
    // 清除axios默认头
    delete axios.defaults.headers.common['Authorization']
    
    // 跳转到登录页
    window.location.href = '/admin/#/login'
    
    ElMessage.success('认证信息已清除，正在跳转到登录页...')
  }).catch(() => {
    console.log('用户取消了强制重新登录')
  })
}

// 导出到全局对象，方便控制台调用
if (typeof window !== 'undefined') {
  window.tokenFix = {
    fixTokenFormat,
    cleanupCorruptedAuth,
    fixAxiosConfig,
    fixAPIBasePath,
    autoFixCommonIssues,
    forceRelogin
  }
  
  console.log('Token修复工具已加载，可在控制台使用 tokenFix.autoFixCommonIssues() 进行自动修复')
} 
