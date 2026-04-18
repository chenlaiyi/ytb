/**
 * YTB 小程序 - 网络请求封装
 * 替代 H5 中的 axios，使用 uni.request
 */

const BASE_URL = 'https://ytb.ddg.org.cn'

// 请求拦截 - 不需要认证的路径
const PUBLIC_PATHS = [
  '/api/ytb/miniapp-login',
  '/api/ytb/miniapp-phone-login',
  '/api/ytb/auth/wechat',
]

/**
 * 统一请求封装
 */
export const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    const isPublic = PUBLIC_PATHS.some(p => options.url.includes(p))

    const header = {
      'Content-Type': 'application/json',
      ...(options.header || {}),
    }

    if (token && !isPublic) {
      header['Authorization'] = `Bearer ${token}`
    }

    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      timeout: 15000,
      success: (res) => {
        if (res.statusCode === 401) {
          // Token 过期，跳转登录
          uni.removeStorageSync('token')
          uni.removeStorageSync('userInfo')
          uni.reLaunch({ url: '/pages/login/index' })
          reject(new Error('登录已过期'))
          return
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(res.data?.message || `请求失败: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络异常', icon: 'none' })
        reject(err)
      }
    })
  })
}

// 便捷方法
export const get = (url, data) => request({ url, method: 'GET', data })
export const post = (url, data) => request({ url, method: 'POST', data })
export const put = (url, data) => request({ url, method: 'PUT', data })
export const del = (url, data) => request({ url, method: 'DELETE', data })

export default { request, get, post, put, del }
