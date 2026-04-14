import request from '@/utils/request'

// 获取提现列表
export function getWithdrawals(params) {
  return request({
    url: '/api/admin/v1/withdrawal-audit/withdrawals',
    method: 'get',
    params
  })
}

// 审核提现申请
export function auditWithdrawal(data) {
  return request({
    url: '/api/admin/v1/withdrawal-audit/audit',
    method: 'post',
    data
  })
}

// 获取统计数据
export function getStatistics() {
  return request({
    url: '/api/admin/v1/withdrawal-audit/statistics',
    method: 'get'
  })
}

// 检查新订单
export function checkNewWithdrawals() {
  return request({
    url: '/api/admin/v1/withdrawal-audit/check-new',
    method: 'get'
  })
}

// 获取可提现余额
export function getWithdrawableBalance(institutionId) {
  return request({
    url: `/api/admin/v1/withdrawal-audit/balance/${institutionId}`,
    method: 'get'
  })
} 