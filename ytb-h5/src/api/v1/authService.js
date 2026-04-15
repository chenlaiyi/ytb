/**
 * V1 认证服务：统一走 Laravel RESTful API。
 * 旧的 PHP 接口已弃用，为避免 bundle 中继续混入 legacy 代码，
 * 这里直接将所有调用透传给 H5/src/api/v1/auth.js 导出的 V1 方法。
 */

import {
  getWechatLoginUrlV1,
  wechatLoginCallbackV1,
  getUserInfoV1,
  smsLoginV1,
  sendSmsCodeV1,
  logoutV1,
  refreshTokenV1
} from './auth'

class AuthServiceV1 {
  constructor() {
    this.mode = 'V1_API'
  }

  async getWechatLoginUrl(params = {}) {
    console.log('🔧 [V1] 获取微信登录URL')
    return getWechatLoginUrlV1(params)
  }

  async wechatLoginCallback(data) {
    console.log('🔧 [V1] 处理微信登录回调')
    return wechatLoginCallbackV1(data)
  }

  async getUserInfo() {
    console.log('🔧 [V1] 获取用户信息')
    return getUserInfoV1()
  }

  async smsLogin(data) {
    console.log('🔧 [V1] 短信验证码登录')
    return smsLoginV1(data)
  }

  async sendSmsCode(data) {
    console.log('🔧 [V1] 发送短信验证码')
    return sendSmsCodeV1(data)
  }

  async logout() {
    console.log('🔧 [V1] 退出登录')
    return logoutV1()
  }

  async refreshToken() {
    console.log('🔧 [V1] 刷新 Token')
    return refreshTokenV1()
  }

  getStatus() {
    return {
      useV1: true,
      fallbackEnabled: false,
      mode: this.mode
    }
  }
}

const authService = new AuthServiceV1()

export default authService
export { AuthServiceV1 }

export const {
  getWechatLoginUrl,
  wechatLoginCallback,
  getUserInfo,
  smsLogin,
  sendSmsCode,
  logout,
  refreshToken
} = authService
