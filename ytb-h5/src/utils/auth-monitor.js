import { getToken, getUserInfo, refreshLoginTime, isTokenExpiring } from './auth'
import { getUserInfo as fetchUserInfo } from '@/api/user'

// 监控配置
const MONITOR_CONFIG = {
  CHECK_INTERVAL: 5 * 60 * 1000, // 5分钟检查一次
  REFRESH_INTERVAL: 30 * 60 * 1000, // 30分钟刷新一次登录时间
}

let checkTimer = null
let refreshTimer = null

/**
 * 启动登录状态监控
 */
export function startAuthMonitor() {
  // 如果已经在监控，先停止
  stopAuthMonitor()
  
  console.log('启动登录状态监控')
  
  // 定期检查登录状态
  checkTimer = setInterval(() => {
    checkAuthStatus()
  }, MONITOR_CONFIG.CHECK_INTERVAL)
  
  // 定期刷新登录时间
  refreshTimer = setInterval(() => {
    refreshAuthTime()
  }, MONITOR_CONFIG.REFRESH_INTERVAL)
  
  // 立即执行一次检查
  checkAuthStatus()
}

/**
 * 停止登录状态监控
 */
export function stopAuthMonitor() {
  if (checkTimer) {
    clearInterval(checkTimer)
    checkTimer = null
  }
  
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  
  console.log('停止登录状态监控')
}

/**
 * 检查登录状态
 */
async function checkAuthStatus() {
  try {
    // 检查是否为分支机构用户，如果是则跳过监控
    const isBranch = localStorage.getItem('isBranch') === '1'
    const branchCode = localStorage.getItem('branch_code')
    
    if (isBranch && branchCode) {
      console.log('🏢 检测到分支机构用户，停止官方登录状态监控')
      stopAuthMonitor()
      return
    }
    
    const token = getToken()
    const userInfo = getUserInfo()
    
    // 如果没有token或用户信息，停止监控
    if (!token || !userInfo) {
      console.log('检测到用户未登录，停止监控')
      stopAuthMonitor()
      return
    }
    
    // 检查token是否即将过期
    if (isTokenExpiring()) {
      console.log('Token即将过期，尝试刷新用户信息')
      await refreshUserInfo()
    }
    
    console.log('登录状态检查正常')
  } catch (error) {
    console.error('检查登录状态失败:', error)
  }
}

/**
 * 刷新用户信息
 */
async function refreshUserInfo() {
  try {
    const response = await fetchUserInfo()
    
    if (response.code === 0 && response.data) {
      // 如果服务器返回了新token，更新本地存储
      if (response.data.token) {
        const { setAuthData } = await import('./auth')
        setAuthData(response.data.token, response.data)
        console.log('已更新token和用户信息')
      } else {
        // 只刷新登录时间
        refreshLoginTime()
        console.log('已刷新登录时间')
      }
      
      return true
    } else {
      console.warn('刷新用户信息失败:', response.message)
      return false
    }
  } catch (error) {
    console.error('刷新用户信息出错:', error)
    return false
  }
}

/**
 * 刷新登录时间
 */
function refreshAuthTime() {
  const token = getToken()
  if (token) {
    refreshLoginTime()
    console.log('已刷新登录时间')
  }
}

/**
 * 页面可见性变化时的处理
 */
function handleVisibilityChange() {
  if (document.hidden) {
    // 页面隐藏时，停止监控以节省资源
    console.log('页面隐藏，暂停登录状态监控')
  } else {
    // 页面重新可见时，立即检查登录状态
    console.log('页面重新可见，检查登录状态')
    checkAuthStatus()
  }
}

// 监听页面可见性变化
document.addEventListener('visibilitychange', handleVisibilityChange)

// 监听页面卸载，清理定时器
window.addEventListener('beforeunload', () => {
  stopAuthMonitor()
})

export default {
  startAuthMonitor,
  stopAuthMonitor,
  checkAuthStatus,
  refreshUserInfo
} 