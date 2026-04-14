/**
 * 认证系统快速测试工具
 * 用于快速诊断token和API访问问题
 */

import axios from 'axios'
import { getAdminToken, clearAdminToken } from '@/utils/admin-token-bridge'

// 获取当前存储的认证信息
export function getCurrentAuthInfo() {
  const token = getAdminToken()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const admin = JSON.parse(localStorage.getItem('admin') || '{}')
  
  return {
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    tokenPrefix: token ? token.substring(0, 20) + '...' : null,
    hasUser: Object.keys(user).length > 0,
    hasAdmin: Object.keys(admin).length > 0,
    user,
    admin
  }
}

// 测试token有效性
export async function testTokenValidity() {
  const token = getAdminToken()
  
  if (!token) {
    return {
      valid: false,
      error: '没有找到token'
    }
  }

  try {
    // 调用token验证接口
    const response = await axios.get('/api/admin/auth/check-token', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
    
    return {
      valid: true,
      response: response.data
    }
  } catch (error) {
    return {
      valid: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
      data: error.response?.data
    }
  }
}

// 测试业务员列表API
export async function testSalesmenAPI() {
  const token = getAdminToken()
  
  if (!token) {
    return {
      success: false,
      error: '没有找到token'
    }
  }

  try {
    const response = await axios.get('/api/admin/v1/salesmen', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      params: {
        page: 1,
        per_page: 5
      }
    })
    
    return {
      success: true,
      data: response.data,
      status: response.status
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
      data: error.response?.data
    }
  }
}

// 一键运行所有测试
export async function runAllTests() {
  console.log('=== 开始认证系统测试 ===')
  
  // 1. 检查基础认证信息
  const authInfo = getCurrentAuthInfo()
  console.log('1. 基础认证信息:', authInfo)
  
  // 2. 测试token有效性
  console.log('2. 测试token有效性...')
  const tokenTest = await testTokenValidity()
  console.log('Token测试结果:', tokenTest)
  
  // 3. 测试业务员API
  console.log('3. 测试业务员API...')
  const salesmenTest = await testSalesmenAPI()
  console.log('业务员API测试结果:', salesmenTest)
  
  // 4. 生成诊断报告
  const report = {
    timestamp: new Date().toISOString(),
    authInfo,
    tokenTest,
    salesmenTest,
    summary: {
      hasBasicAuth: authInfo.hasToken && authInfo.hasUser,
      tokenValid: tokenTest.valid,
      apiAccessible: salesmenTest.success,
      overallStatus: authInfo.hasToken && tokenTest.valid && salesmenTest.success ? 'healthy' : 'problematic'
    }
  }
  
  console.log('=== 诊断报告 ===', report)
  return report
}

// 清除认证信息并重新登录
export function clearAuthAndRelogin() {
  clearAdminToken()
  localStorage.removeItem('user')
  localStorage.removeItem('admin')
  
  // 跳转到登录页
  window.location.href = '/admin/#/login'
}

// 在浏览器控制台中暴露测试函数
if (typeof window !== 'undefined') {
  window.authTest = {
    getCurrentAuthInfo,
    testTokenValidity,
    testSalesmenAPI,
    runAllTests,
    clearAuthAndRelogin
  }
  
  console.log('认证测试工具已加载，可在控制台使用 authTest.runAllTests() 进行测试')
} 
