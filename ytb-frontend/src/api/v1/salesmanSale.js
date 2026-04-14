import request from '@/utils/request'

// 获取业务员销售统计
export function getSalesmanSalesStats(params) {
  return request({
    url: '/api/admin/v1/salesman-sales/stats',
    method: 'get',
    params
  })
}

// 获取业务员销售记录列表
export function getSalesmanSalesList(params) {
  return request({
    url: '/api/admin/v1/salesman-sales',
    method: 'get',
    params
  })
}

// 获取业务员销售记录详情
export function getSalesmanSaleDetail(id) {
  return request({
    url: `/api/admin/v1/salesman-sales/${id}`,
    method: 'get'
  })
}

// 创建业务员销售记录
export function createSalesmanSale(data) {
  return request({
    url: '/api/admin/v1/salesman-sales',
    method: 'post',
    data
  })
}

// 更新业务员销售记录
export function updateSalesmanSale(id, data) {
  return request({
    url: `/api/admin/v1/salesman-sales/${id}`,
    method: 'put',
    data
  })
}

// 删除业务员销售记录
export function deleteSalesmanSale(id) {
  return request({
    url: `/api/admin/v1/salesman-sales/${id}`,
    method: 'delete'
  })
} 