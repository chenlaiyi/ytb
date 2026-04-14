import request from '@/utils/request'

// 获取余额列表
export function getBalanceList(params) {
  return request({
    url: '/api/admin/v1/balance-management/list',
    method: 'get',
    params
  })
}

// 同步分润到待结算余额
export function addBalance(data) {
  return request({
    url: '/api/admin/v1/balance-management/add',
    method: 'post',
    data
  })
}

// 批量转入不可提现余额
export function batchToNonWithdrawable() {
  return request({
    url: '/api/admin/v1/balance-management/batch-to-non-withdrawable',
    method: 'post'
  })
}

// 批量转入可提现余额
export function batchToWithdrawable() {
  return request({
    url: '/api/admin/v1/balance-management/batch-to-withdrawable',
    method: 'post'
  })
}

// 调整余额
export function updateBalance(data) {
  return request({
    url: '/api/admin/v1/balance-management/update',
    method: 'post',
    data
  })
} 