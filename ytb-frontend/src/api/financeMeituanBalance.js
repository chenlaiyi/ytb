import request from '@/utils/request'

export function fetchMeituanBalanceList(params = {}) {
  return request({
    url: '/api/admin/v1/finance/meituan-balances',
    method: 'get',
    params
  })
}

export function adjustMeituanBalance(id, data) {
  return request({
    url: `/api/admin/v1/finance/meituan-balances/${id}/adjust`,
    method: 'post',
    data
  })
}

export function transferMeituanBalance(id, data) {
  return request({
    url: `/api/admin/v1/finance/meituan-balances/${id}/transfer`,
    method: 'post',
    data
  })
}

export function fetchMeituanBalanceTransactions(id, params = {}) {
  return request({
    url: `/api/admin/v1/finance/meituan-balances/${id}/transactions`,
    method: 'get',
    params
  })
}
