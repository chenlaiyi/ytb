/**
 * 优化的认证工具类
 * 统一处理登录状态存储和验证
 */

class AuthManager {
  constructor() {
    this.STORAGE_KEY = 'authState'
    this.TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000 // 30天
  }

  /**
   * 保存登录状态
   * @param {string} token 访问令牌
   * @param {Object} userInfo 用户信息
   */
  saveAuthState(token, userInfo) {
    try {
      const authState = {
        token,
        userInfo,
        loginTime: Date.now(),
        isLoggedIn: true
      }
      
      // 统一存储到localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authState))
      
      // 设置cookie作为备份（30天）
      const expires = new Date(Date.now() + this.TOKEN_EXPIRY)
      document.cookie = `token=${encodeURIComponent(token)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`
      document.cookie = `user_id=${encodeURIComponent(userInfo.id)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`
      
      return true
    } catch (error) {
      console.error('保存登录状态失败:', error)
      return false
    }
  }

  /**
   * 获取登录状态
   * @returns {Object|null} 登录状态信息
   */
  getAuthState() {
    try {
      // 优先从localStorage获取
      const authData = localStorage.getItem(this.STORAGE_KEY)
      if (authData) {
        const authState = JSON.parse(authData)
        if (authState.token && authState.userInfo) {
          return authState
        }
      }
      
      // 备用方案：从cookie获取
      const token = this.getCookie('token')
      if (token) {
        return {
          token,
          userInfo: null,
          loginTime: Date.now(),
          isLoggedIn: true
        }
      }
      
      return null
    } catch (error) {
      console.error('获取登录状态失败:', error)
      return null
    }
  }

  /**
   * 获取token
   * @returns {string|null} 访问令牌
   */
  getToken() {
    const authState = this.getAuthState()
    return authState?.token || null
  }

  /**
   * 获取用户信息
   * @returns {Object|null} 用户信息
   */
  getUserInfo() {
    const authState = this.getAuthState()
    return authState?.userInfo || null
  }

  /**
   * 检查是否已登录
   * @returns {boolean} 登录状态
   */
  isLoggedIn() {
    const authState = this.getAuthState()
    return !!(authState?.token && authState?.isLoggedIn)
  }

  /**
   * 清除登录状态
   */
  clearAuthState() {
    try {
      // 清除localStorage
      localStorage.removeItem(this.STORAGE_KEY)
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('login_time')
      localStorage.removeItem('isLoggedIn')
      
      // 清除sessionStorage
      sessionStorage.clear()
      
      // 清除cookie
      this.expireCookie('token')
      this.expireCookie('user_id')
      this.expireCookie('login_time')
      
      // 清除全局变量
      if (window.TAPGO_AUTH) {
        delete window.TAPGO_AUTH
      }
      
      return true
    } catch (error) {
      console.error('清除登录状态失败:', error)
      return false
    }
  }

  /**
   * 检查token是否即将过期
   * @param {number} bufferTime 缓冲时间（毫秒）
   * @returns {boolean} 是否即将过期
   */
  isTokenExpiringSoon(bufferTime = 5 * 60 * 1000) { // 5分钟缓冲
    const authState = this.getAuthState()
    if (!authState?.loginTime) return true
    
    const tokenAge = Date.now() - authState.loginTime
    return tokenAge > (this.TOKEN_EXPIRY - bufferTime)
  }

  /**
   * 刷新登录状态
   * @param {Object} newUserInfo 新的用户信息
   */
  refreshAuthState(newUserInfo) {
    const authState = this.getAuthState()
    if (authState?.token) {
      this.saveAuthState(authState.token, newUserInfo || authState.userInfo)
    }
  }

  /**
   * 获取cookie值
   * @param {string} name cookie名称
   * @returns {string|null} cookie值
   */
  getCookie(name) {
    try {
      const cookies = document.cookie.split(';')
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim()
        if (cookie.startsWith(name + '=')) {
          return decodeURIComponent(cookie.substring(name.length + 1))
        }
      }
      return null
    } catch (error) {
      console.error('获取cookie失败:', error)
      return null
    }
  }

  /**
   * 设置cookie过期
   * @param {string} name cookie名称
   */
  expireCookie(name) {
    try {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
    } catch (error) {
      console.error('清除cookie失败:', error)
    }
  }

  /**
   * 预检查登录状态
   * @returns {Object} 检查结果
   */
  preLoginCheck() {
    // 检查网络状态
    if (!navigator.onLine) {
      return {
        success: false,
        message: '网络连接异常，请检查网络设置'
      }
    }
    
    // 检查是否已登录
    if (this.isLoggedIn()) {
      return {
        success: false,
        message: '您已登录，即将跳转到个人中心',
        redirect: '/user'
      }
    }
    
    return {
      success: true,
      message: '可以开始登录'
    }
  }
}

// 创建单例实例
const authManager = new AuthManager()

export default authManager

// 导出常用方法
export const {
  saveAuthState,
  getAuthState,
  getToken,
  getUserInfo,
  isLoggedIn,
  clearAuthState,
  isTokenExpiringSoon,
  refreshAuthState,
  preLoginCheck
} = authManager