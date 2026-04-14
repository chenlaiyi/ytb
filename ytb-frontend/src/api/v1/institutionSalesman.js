import request from '@/utils/request';

// 业务员列表
export function fetchInstitutionSalesmen(params) {
  return request({
    url: '/api/admin/v1/institution-salesmen',
    method: 'get',
    params
  });
}

export function fetchInstitutionSalesmanStats(params = {}) {
  return fetchInstitutionSalesmen({
    ...params,
    with_stat: 1,
    page: 1,
    per_page: params.per_page || 20,
  });
}

// 新增业务员
export function createInstitutionSalesman(data) {
  return request({
    url: '/api/admin/v1/institution-salesmen',
    method: 'post',
    data
  });
}

// 更新业务员
export function updateInstitutionSalesman(id, data) {
  return request({
    url: `/api/admin/v1/institution-salesmen/${id}`,
    method: 'put',
    data
  });
}

// 审核 / 状态更新
export function updateInstitutionSalesmanStatus(id, data) {
  return request({
    url: `/api/admin/v1/institution-salesmen/${id}/status`,
    method: 'post',
    data
  });
}

// 获取/更新配置
export function getSalesmanSettings() {
  return request({
    url: '/api/admin/v1/institution-salesmen/settings',
    method: 'get'
  });
}

export function saveSalesmanSettings(data) {
  return request({
    url: '/api/admin/v1/institution-salesmen/settings',
    method: 'post',
    data
  });
}

// 入账流水
export function fetchSalesmanPriceLogs(params) {
  return request({
    url: '/api/admin/v1/institution-salesmen/price-logs',
    method: 'get',
    params
  });
}

// 提现列表
export function fetchSalesmanWithdrawals(params) {
  return request({
    url: '/api/admin/v1/institution-salesmen/withdrawals',
    method: 'get',
    params
  });
}

// 审核提现
export function reviewSalesmanWithdrawal(id, data) {
  return request({
    url: `/api/admin/v1/institution-salesmen/withdrawals/${id}/review`,
    method: 'post',
    data
  });
}
