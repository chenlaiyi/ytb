import axios from 'axios'
import { getAdminToken, clearAdminToken } from '@/utils/admin-token-bridge'

// 创建axios实例
const request = axios.create({
  baseURL: 'https://ytb.ddg.org.cn/',
  timeout: 120000, // 增加到120秒，适应企微同步的长时间操作
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 添加token - 支持分支机构管理员token
    let token = getAdminToken()
    
    // 如果是分支机构相关的请求，优先使用分支机构token，但如果没有分支机构token则使用总管理员token
    const isBranchRequest = config.url && (
      config.url.includes('/branch/') || 
      config.url.includes('branch-') ||
      config.url.includes('branch-organizations') ||
      window.location.hash.includes('/branch/')
    )
    
    if (isBranchRequest) {
      const branchToken = localStorage.getItem('branch_admin_token')
      if (branchToken) {
        token = branchToken
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 处理文件上传请求
    if (config.data instanceof FormData) {
      // 对于FormData，删除Content-Type让浏览器自动设置
      delete config.headers['Content-Type']
      delete config.headers['content-type']
    }
    
    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      }
    }
    
    return config
  },
  error => {
    console.error('请求配置错误:', error.message || error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    // 只记录重要的错误信息
    if (error.response) {
      const { status, data } = error.response
      
      // 401错误特殊处理
      if (status === 401) {
        console.warn('认证失败，请重新登录')
        
        // 检查是否处于模拟登录模式
        const isSimulateMode = sessionStorage.getItem('simulate_token')
        
        if (isSimulateMode) {
          console.log('🔐 管理后台检测到模拟登录模式，401错误不清理管理员token')
          // 在模拟登录模式下，不清理管理员token，不跳转登录页
          return Promise.reject(new Error('模拟登录认证失败'))
        }
        
        // 非模拟登录模式下才清除token并跳转到登录页
        clearAdminToken()
        localStorage.removeItem('branch_admin_token')
        
        // 判断是否为分支机构页面
        if (window.location.hash.includes('/branch/')) {
          window.location.href = '#/branch-login'
        } else {
          window.location.href = '#/login'
        }
        return Promise.reject(new Error('认证失败'))
      }
      
      // 403错误
      if (status === 403) {
        console.warn('权限不足')
        return Promise.reject(new Error('权限不足'))
      }
      
      // 500错误
      if (status >= 500) {
        console.error('服务器错误:', data?.message || '服务器内部错误')
        return Promise.reject(new Error(data?.message || '服务器错误'))
      }
      
      // 其他HTTP错误
      if (status >= 400) {
        const errorMsg = data?.message || `请求失败 (${status})`
        return Promise.reject(new Error(errorMsg))
      }
    } else if (error.request) {
      // 网络错误
      console.error('网络连接失败')
      return Promise.reject(new Error('网络连接失败'))
    } else {
      // 其他错误
      console.error('请求错误:', error.message || error)
      return Promise.reject(error)
    }
  }
)

export default request
