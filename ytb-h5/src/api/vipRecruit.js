/**
 * VIP招募相关API - 统一V1版本
 * 
 * 重要说明：本文件已迁移到统一V1 API架构
 * 创建时间：2025年7月29日
 * 迁移说明：所有API调用已从原生PHP迁移到Laravel V1 RESTful API
 * 
 * 禁止使用原生PHP API路径，必须使用 /api/v1/mobile/vip/ 路径
 */

import { mobileApi } from '@/api/v1/index'
import request from '@/utils/request'

// VIP招募相关API - 使用统一V1架构
export default {
  // 获取VIP基本信息
  getVipInfo() {
    return mobileApi.vip.getInfo()
  },

  // 获取VIP招募信息
  getRecruitInfo() {
    return mobileApi.vip.getRecruitInfo()
  },

  // VIP招募申请
  recruitApply(data) {
    return mobileApi.vip.recruit(data)
  },

  // 获取招募团队信息
  getTeamInfo() {
    return mobileApi.vip.team()
  },

  // 获取分红信息
  getDividendInfo() {
    return mobileApi.vip.getDividendInfo()
  },

  // 获取公开分红统计
  getDividendsPublic() {
    return mobileApi.vip.getDividendsPublic()
  },

  // 获取VIP统计数据
  getVipStats() {
    return mobileApi.vip.stats()
  }
}

// 兼容性导出（逐步废弃）
export const vipRecruitApi = {
  getRecruitInfo: () => mobileApi.vip.getRecruitInfo(),
  recruitApply: (data) => mobileApi.vip.recruit(data),
  getTeamInfo: () => mobileApi.vip.team(),
  getDividendInfo: () => mobileApi.vip.getDividendInfo(),
  getDividendsPublic: () => mobileApi.vip.getDividendsPublic(),
  getVipStats: () => mobileApi.vip.stats()
}

// 向后兼容的具名导出
export const getVipRecruitInfo = () => mobileApi.vip.getRecruitInfo()
export const getRecruitInfo = () => mobileApi.vip.getRecruitInfo()
export const recruitApply = (data) => mobileApi.vip.recruit(data)
export const getTeamInfo = () => mobileApi.vip.team()
export const getDividendInfo = () => mobileApi.vip.getDividendInfo()
export const getDividendsPublic = () => mobileApi.vip.getDividendsPublic()
export const getVipStats = () => mobileApi.vip.stats()

/**
 * 获取推荐人信息
 * @param {number} referrerId - 推荐人ID
 * @returns {Promise<Object>} 推荐人信息
 */
export function getReferrerInfo(referrerId) {
  return request({
    url: '/api/mobile/v1/user/referrer-info',
    method: 'post',
    data: {
      referrer_id: referrerId
    }
  })
}

/**
 * 检查VIP招募状态（统一状态检测API）
 * @param {number} referrerId - 推荐人ID
 * @param {boolean} checkLogin - 是否检查登录状态
 * @returns {Promise<Object>} 用户在招募流程中的完整状态
 */
export function checkRecruitStatus(referrerId, checkLogin = true) {
  return request({
    url: '/api/mobile/v1/vip/recruit-status',
    method: 'post',
    data: {
      referrer_id: referrerId,
      check_login: checkLogin
    }
  })
}

/**
 * 创建VIP升级订单（新生易支付）
 * @param {Object} data - 订单参数
 * @param {string} data.openid - 用户微信openid
 * @param {number} data.referrer_id - 推荐人ID（可选）
 * @returns {Promise<Object>} 订单和支付参数
 */
export function createVipOrder(data) {
  return request({
    url: '/api/mobile/v1/orders/vip-order',
    method: 'post',
    data
  })
}

/**
 * 绑定推荐关系
 * @param {Object} data - 绑定参数
 * @param {number} data.referrer_id - 推荐人ID
 * @returns {Promise<Object>} 绑定结果
 */
export function bindReferrer(data) {
  return request({
    url: '/api/mobile/v1/user/bind-referrer',
    method: 'post',
    data
  })
} 