import request from '@/utils/request'

// 获取业务员佣金统计
export function getSalesmanCommissionStats(params) {
  return request({
    url: '/api/admin/v1/salesman-commissions/stats',
    method: 'get',
    params
  })
}

// 获取业务员佣金记录列表
export function getSalesmanCommissionsList(params) {
  return request({
    url: '/api/admin/v1/salesman-commissions',
    method: 'get',
    params
  })
}

// 获取业务员佣金记录详情
export function getSalesmanCommissionDetail(id) {
  return request({
    url: `/api/admin/v1/salesman-commissions/${id}`,
    method: 'get'
  })
}

// 创建业务员佣金记录
export function createSalesmanCommission(data) {
  return request({
    url: '/api/admin/v1/salesman-commissions',
    method: 'post',
    data
  })
}

// 更新业务员佣金记录
export function updateSalesmanCommission(id, data) {
  return request({
    url: `/api/admin/v1/salesman-commissions/${id}`,
    method: 'put',
    data
  })
}

// 删除业务员佣金记录
export function deleteSalesmanCommission(id) {
  return request({
    url: `/api/admin/v1/salesman-commissions/${id}`,
    method: 'delete'
  })
} 