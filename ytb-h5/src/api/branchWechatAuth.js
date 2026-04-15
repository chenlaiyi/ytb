import request from '@/utils/request'
import { logDebugInfo, isAndroidDevice } from '@/utils/androidDebug'

/**
 * 分支机构微信登录API
 */

/**
 * 获取分支机构微信登录URL
 * @param {string} branchCode - 分支机构代码
 * @param {string} redirectUri - 登录成功后的回调地址
 * @returns {Promise}
 */
export function getBranchWechatLoginUrl(branchCode, redirectUri = null) {
  // 安卓设备调试：记录登录URL请求
  if (isAndroidDevice()) {
    logDebugInfo('getBranchWechatLoginUrl', { branchCode, redirectUri });
  }
  
  return request({
    url: '/api/branch-wechat/login-url',
    method: 'get',
    params: {
      branch_code: branchCode,
      redirect_uri: redirectUri
    },
    skipAuthToken: true // 跳过token验证，因为这是登录接口
  }).then(response => {
    // 安卓设备调试：记录登录URL响应
    if (isAndroidDevice()) {
      logDebugInfo('getBranchWechatLoginUrlResponse', { 
        branchCode,
        success: !!response,
        hasData: !!response?.data,
        responseCode: response?.code
      });
    }
    return response;
  }).catch(error => {
    // 安卓设备调试：记录登录URL错误
    if (isAndroidDevice()) {
      logDebugInfo('getBranchWechatLoginUrlError', { 
        branchCode,
        error: error.message,
        status: error.response?.status
      });
    }
    throw error;
  });
}

/**
 * 处理分支机构微信登录回调
 * @param {string} code - 微信授权码
 * @param {string} state - 状态参数
 * @returns {Promise}
 */
export function handleBranchWechatCallback(code, state) {
  // 安卓设备调试：记录回调请求
  if (isAndroidDevice()) {
    logDebugInfo('handleBranchWechatCallback', { 
      hasCode: !!code, 
      codeLength: code?.length,
      state 
    });
  }
  
  return request({
    url: '/api/branch-wechat/callback',
    method: 'post',
    data: {
      code,
      state
    },
    skipAuthToken: true // 跳过token验证，因为这是登录回调接口
  }).then(response => {
    // 安卓设备调试：记录回调响应
    if (isAndroidDevice()) {
      logDebugInfo('handleBranchWechatCallbackResponse', { 
        success: !!response,
        responseCode: response?.code,
        hasToken: !!response?.data?.token,
        hasUser: !!response?.data?.user
      });
    }
    return response;
  }).catch(error => {
    // 安卓设备调试：记录回调错误
    if (isAndroidDevice()) {
      logDebugInfo('handleBranchWechatCallbackError', { 
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data
      });
    }
    throw error;
  });
}

/**
 * 验证分支机构用户token
 * @param {string} token - 用户token
 * @returns {Promise}
 */
export function verifyBranchUserToken(token) {
  return request({
    url: '/api/branch-wechat/verify-token',
    method: 'post',
    data: {
      token
    }
  })
}

/**
 * 根据分支机构代码跳转到微信登录
 * @param {string} branchCode - 分支机构代码
 * @param {string} redirectPath - 登录成功后跳转的前端路径
 */
export async function redirectToBranchWechatLogin(branchCode, redirectPath = '/') {
  try {
    // 构建回调地址 - 使用后端API处理回调
    const callbackUrl = null  // 让后端使用默认的API回调地址
    
    // 获取微信登录URL
    const response = await getBranchWechatLoginUrl(branchCode, callbackUrl)
    
    if (response.code === 0) {
      // 保存登录成功后的跳转路径
      localStorage.setItem('branch_login_redirect', redirectPath)
      localStorage.setItem('branch_code', branchCode)
      
      // 跳转到微信授权页面
      window.location.href = response.data.url
    } else {
      throw new Error(response.message || '获取微信登录URL失败')
    }
  } catch (error) {
    console.error('跳转微信登录失败:', error)
    throw error
  }
}

/**
 * 处理微信登录回调（在回调页面调用）
 * @param {string} code - 微信授权码
 * @param {string} state - 状态参数
 * @returns {Promise}
 */
export async function processBranchWechatCallback(code, state) {
  try {
    const response = await handleBranchWechatCallback(code, state)
    
    if (response.code === 0) {
      const { token, user, branch, needBindPhone } = response.data
      
      // 保存登录信息
      localStorage.setItem('branch_token', token)
      localStorage.setItem('branch_user_info', JSON.stringify(user))
      localStorage.setItem('branch_info', JSON.stringify(branch))
      localStorage.setItem('is_branch_logged_in', 'true')
      
      if (needBindPhone) {
        localStorage.setItem('need_bind_phone', 'true')
      }
      
      return {
        success: true,
        token,
        user,
        branch,
        needBindPhone
      }
    } else {
      throw new Error(response.message || '微信登录处理失败')
    }
  } catch (error) {
    console.error('处理微信登录回调失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 检查分支机构用户登录状态
 * @returns {Promise<boolean>}
 */
export async function checkBranchUserLoginStatus() {
  try {
    const token = localStorage.getItem('branch_token')
    if (!token) {
      return false
    }
    
    const response = await verifyBranchUserToken(token)
    
    if (response.code === 0) {
      // 更新用户信息
      localStorage.setItem('branch_user_info', JSON.stringify(response.data.user))
      if (response.data.branch) {
        localStorage.setItem('branch_info', JSON.stringify(response.data.branch))
      }
      return true
    } else {
      // token无效，清除登录信息
      clearBranchUserLoginInfo()
      return false
    }
  } catch (error) {
    console.error('检查登录状态失败:', error)
    clearBranchUserLoginInfo()
    return false
  }
}

/**
 * 清除分支机构用户登录信息
 */
export function clearBranchUserLoginInfo() {
  localStorage.removeItem('branch_token')
  localStorage.removeItem('branch_user_info')
  localStorage.removeItem('branch_info')
  localStorage.removeItem('is_branch_logged_in')
  localStorage.removeItem('need_bind_phone')
  localStorage.removeItem('branch_login_redirect')
  localStorage.removeItem('branch_code')
}

/**
 * 获取当前分支机构用户信息
 * @returns {Object|null}
 */
export function getCurrentBranchUser() {
  try {
    const userInfo = localStorage.getItem('branch_user_info')
    return userInfo ? JSON.parse(userInfo) : null
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}

/**
 * 获取当前分支机构信息
 * @returns {Object|null}
 */
export function getCurrentBranchInfo() {
  try {
    const branchInfo = localStorage.getItem('branch_info')
    return branchInfo ? JSON.parse(branchInfo) : null
  } catch (error) {
    console.error('获取分支机构信息失败:', error)
    return null
  }
}

/**
 * 获取分支机构用户token
 * @returns {string|null}
 */
export function getBranchUserToken() {
  return localStorage.getItem('branch_token')
}

/**
 * 检查是否需要绑定手机号
 * @returns {boolean}
 */
export function needBindPhone() {
  return localStorage.getItem('need_bind_phone') === 'true'
}

/**
 * 分支机构用户退出登录
 */
export function branchUserLogout() {
  clearBranchUserLoginInfo()
  // 可以在这里添加退出登录的API调用
}

export default {
  getBranchWechatLoginUrl,
  handleBranchWechatCallback,
  verifyBranchUserToken,
  redirectToBranchWechatLogin,
  processBranchWechatCallback,
  checkBranchUserLoginStatus,
  clearBranchUserLoginInfo,
  getCurrentBranchUser,
  getCurrentBranchInfo,
  getBranchUserToken,
  needBindPhone,
  branchUserLogout
} 