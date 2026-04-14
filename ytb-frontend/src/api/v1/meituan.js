import request from '@/utils/request'

export function fetchMeituanMerchantSummary(params = {}) {
  return request({
    url: '/api/admin/v1/meituan/merchants/summary',
    method: 'get',
    params
  })
}

export function fetchMeituanMerchantList(params = {}) {
  return request({
    url: '/api/admin/v1/meituan/merchants',
    method: 'get',
    params
  })
}

export function fetchMeituanMerchantDetail(merchantCode, params = {}) {
  return request({
    url: `/api/admin/v1/meituan/merchants/${merchantCode}`,
    method: 'get',
    params
  })
}

export function updateMeituanMerchantLocation(merchantCode, data = {}) {
  return request({
    url: `/api/admin/v1/meituan/merchants/${merchantCode}`,
    method: 'put',
    data
  })
}

export function fetchMeituanSalesSummary(params = {}) {
  return request({
    url: '/api/admin/v1/meituan/sales/summary',
    method: 'get',
    params
  })
}

export function fetchMeituanSalesList(params = {}) {
  return request({
    url: '/api/admin/v1/meituan/sales',
    method: 'get',
    params
  })
}

export function fetchMeituanTerminalSummary(params = {}) {
  return request({
    url: '/api/admin/v1/meituan/terminals/summary',
    method: 'get',
    params
  })
}

export function fetchMeituanTerminalList(params = {}) {
  return request({
    url: '/api/admin/v1/meituan/terminals',
    method: 'get',
    params
  })
}

export function fetchMeituanSalesStaffSummary(params = {}) {
  return request({
    url: '/api/admin/v1/meituan/sales-staff/summary',
    method: 'get',
    params
  })
}

export function fetchMeituanSalesStaffList(params = {}) {
  return request({
    url: '/api/admin/v1/meituan/sales-staff',
    method: 'get',
    params
  })
}

export function fetchMeituanDashboardSummary(params = {}) {
  return request({
    url: '/api/admin/v1/meituan/dashboard/summary',
    method: 'get',
    params
  })
}

export function fetchMeituanDashboardTrend(params = {}) {
  return request({
    url: '/api/admin/v1/meituan/dashboard/trend',
    method: 'get',
    params
  })
}

export function fetchMeituanDashboardDimensions(params = {}) {
  return request({
    url: '/api/admin/v1/meituan/dashboard/dimensions',
    method: 'get',
    params
  })
}

export function fetchMeituanDashboardAlerts(params = {}) {
  return request({
    url: '/api/admin/v1/meituan/dashboard/alerts',
    method: 'get',
    params
  })
}
