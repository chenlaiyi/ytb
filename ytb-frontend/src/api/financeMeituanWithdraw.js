import request from '@/utils/request'

export function fetchMeituanWithdrawStats(params = {}) {
  return request({
    url: '/api/admin/v1/finance/meituan-withdrawals/stats',
    method: 'get',
    params
  })
}

export function fetchMeituanWithdrawList(params = {}) {
  return request({
    url: '/api/admin/v1/finance/meituan-withdrawals',
    method: 'get',
    params
  })
}

export function fetchMeituanWithdrawDetail(id) {
  return request({
    url: `/api/admin/v1/finance/meituan-withdrawals/${id}`,
    method: 'get'
  })
}

export function auditMeituanWithdraw(id, data) {
  return request({
    url: `/api/admin/v1/finance/meituan-withdrawals/${id}/audit`,
    method: 'post',
    data
  })
}

export function exportMeituanWithdraw(params = {}) {
  const query = new URLSearchParams(params).toString()
  return `/api/admin/v1/finance/meituan-withdrawals/export${query ? `?${query}` : ''}`
}
