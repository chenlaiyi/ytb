import { getToken, getUserInfo } from './auth'
import { request } from './request'
import router from '@/router'

/**
 * 分支机构个人中心配置
 * 根据数据库实际配置更新：
 * 1: 益辛友02 (YXY02)
 * 2: 益辛友01 (YXY01) 
 * 3: 点点够 (Tapgo)
 */
const BRANCH_PERSONAL_CENTER_CONFIG = {
  1: { // 益辛友02
    name: '益辛友02个人中心',
    code: 'YXY02',
    url: 'https://pay.itapgo.com/app/#/branch/profile?branch_code=YXY02'
  },
  2: { // 益辛友01
    name: '益辛友01个人中心', 
    code: 'YXY01',
    url: 'https://pay.itapgo.com/app/#/branch/profile?branch_code=YXY01'
  },
  3: { // 点点够 (总部)
    name: '点点够个人中心',
    code: 'Tapgo', 
    url: 'https://pay.itapgo.com/app/#/branch/profile?branch_code=Tapgo'
  }
}

/**
 * 检查用户实名认证状态
 * @param {Object} userInfo 用户信息
 * @returns {Object} 实名认证状态信息
 */
export function checkRealNameStatus(userInfo) {
  if (!userInfo) {
    return {
      isVerified: false,
      missingFields: ['name', 'phone', 'referrer_id'],
      needsVerification: true
    }
  }

  const missingFields = []
  
  // 检查必填字段
  if (!userInfo.name || userInfo.name.trim() === '') {
    missingFields.push('name')
  }
  
  if (!userInfo.phone || userInfo.phone.trim() === '') {
    missingFields.push('phone')
  }
  
  // referrer_id 可选，但如果未设置且用户从未绑定过，则需要提示
  if (!userInfo.referrer_id || userInfo.referrer_id.trim() === '') {
    // 检查用户是否曾经设置过referrer_id（通过referrer_id_modified_at字段）
    if (!userInfo.referrer_id_modified_at) {
      missingFields.push('referrer_id')
    }
  }

  return {
    isVerified: missingFields.length === 0,
    missingFields,
    needsVerification: missingFields.length > 0,
    canModifyReferrerId: !userInfo.referrer_id_modified_at // 只有从未修改过才能修改
  }
}

/**
 * 获取用户分支机构个人中心URL
 * @param {number} branchId 分支机构ID
 * @returns {string|null} 个人中心URL
 */
export function getPersonalCenterUrl(branchId) {
  const config = BRANCH_PERSONAL_CENTER_CONFIG[branchId]
  return config ? config.url : null
}

/**
 * 处理个人中心入口点击
 * 老用户直接进入，新用户跳转登录后回到个人中心
 * @param {number} branchId 分支机构ID
 */
export async function handlePersonalCenterEntry(branchId) {
  try {
    const token = getToken()
    const personalCenterUrl = getPersonalCenterUrl(branchId)
    
    if (!personalCenterUrl) {
      console.error('未找到分支机构个人中心配置:', branchId)
      return
    }

    // 检查用户是否已登录
    if (!token) {
      // 新用户，跳转到登录页面，登录成功后自动跳转回个人中心
      const returnUrl = encodeURIComponent(personalCenterUrl)
      router.push(`/login?redirect=${returnUrl}&branch_id=${branchId}`)
      return
    }

    // 已登录用户，获取用户信息检查实名状态
    const userInfo = getUserInfo()
    if (!userInfo) {
      // Token存在但用户信息缺失，重新登录
      const returnUrl = encodeURIComponent(personalCenterUrl)
      router.push(`/login?redirect=${returnUrl}&branch_id=${branchId}`)
      return
    }

    // 检查实名认证状态
    const realNameStatus = checkRealNameStatus(userInfo)
    
    if (realNameStatus.needsVerification) {
      // 需要实名认证，跳转到实名认证页面
      const returnUrl = encodeURIComponent(personalCenterUrl)
      router.push(`/user/verification?redirect=${returnUrl}&branch_id=${branchId}`)
      return
    }

    // 老用户且已实名，直接跳转到个人中心
    window.location.href = personalCenterUrl
    
  } catch (error) {
    console.error('处理个人中心入口失败:', error)
    // 出错时跳转到登录页面
    router.push(`/login?branch_id=${branchId}`)
  }
}

/**
 * 提交实名认证信息
 * @param {Object} data - 认证数据 {name, phone, referrer_id}
 * @returns {Promise} API响应
 */
export async function submitRealNameVerification(data) {
  try {
    const response = await request({
      url: '/api/mobile/v1/user/verification/submit',
      method: 'POST',
      data
    })
    return response
  } catch (error) {
    console.error('提交实名认证失败:', error)
    throw error
  }
}

/**
 * 创建个人中心入口链接
 * @param {number} branchId 分支机构ID
 * @returns {string} 入口链接HTML
 */
export function createPersonalCenterEntryLink(branchId) {
  const config = BRANCH_PERSONAL_CENTER_CONFIG[branchId]
  if (!config) {
    return ''
  }

  return `
    <a href="javascript:void(0)" 
       onclick="handlePersonalCenterEntry(${branchId})" 
       class="personal-center-entry">
      ${config.name}
    </a>
  `
}

// 全局暴露函数供HTML调用
window.handlePersonalCenterEntry = handlePersonalCenterEntry
