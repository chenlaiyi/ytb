import request from '@/utils/request'

// 获取业务员客户统计
export function getSalesmanCustomerStats(params) {
  return request({
    url: '/api/admin/v1/salesman-customers/stats',
    method: 'get',
    params
  })
}

// 获取业务员客户列表
export function getSalesmanCustomersList(params) {
  return request({
    url: '/api/admin/v1/salesman-customers',
    method: 'get',
    params
  })
}

// 获取业务员客户详情
export function getSalesmanCustomerDetail(id) {
  return request({
    url: `/api/admin/v1/salesman-customers/${id}`,
    method: 'get'
  })
}

// 创建业务员客户记录
export function createSalesmanCustomer(data) {
  return request({
    url: '/api/admin/v1/salesman-customers',
    method: 'post',
    data
  })
}

// 更新业务员客户记录
export function updateSalesmanCustomer(id, data) {
  return request({
    url: `/api/admin/v1/salesman-customers/${id}`,
    method: 'put',
    data
  })
}

// 删除业务员客户记录
export function deleteSalesmanCustomer(id) {
  return request({
    url: `/api/admin/v1/salesman-customers/${id}`,
    method: 'delete'
  })
} 