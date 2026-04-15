import request from '@/utils/request'

/**
 * VIP分红相关API
 */

// 计算指定月份的VIP分红
export function calculateDividends(period) {
  return request({
    url: '/api/vip-dividends/calculate',
    method: 'post',
    data: { period }
  })
}

// 获取用户分红记录 - 使用Laravel API
export function getUserDividends(params) {
  return request({
    url: '/api/mobile/v1/vip/dividends',
    method: 'get',
    params
  })
}

// 获取分红统计数据
export function getDividendStatistics(period) {
  return request({
    url: '/api/vip-dividends/statistics',
    method: 'get',
    params: { period }
  })
}

// 获取用户分红预估
export function getUserDividendPreview(userId) {
  return request({
    url: '/api/vip-dividends/user-preview',
    method: 'get',
    params: { user_id: userId }
  })
}

// 获取分红配置
export function getDividendConfig() {
  return request({
    url: '/api/vip-dividends/config',
    method: 'get'
  })
}

// 更新分红配置
export function updateDividendConfig(configs) {
  return request({
    url: '/api/vip-dividends/config',
    method: 'put',
    data: { configs }
  })
}

// 发放分红
export function distributeDividends(data) {
  return request({
    url: '/api/vip-dividends/distribute',
    method: 'post',
    data
  })
}

// 获取分红排行榜
export function getDividendRanking(params) {
  return request({
    url: '/api/vip-dividends/ranking',
    method: 'get',
    params
  })
} 