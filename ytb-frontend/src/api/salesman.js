import request from '@/utils/axios'

// 获取业务员列表
export function getSalesmanList(params) {
  return request({
    url: '/api/admin/v1/salesmen',
    method: 'get',
    params
  })
}

// 获取业务员列表（复数形式别名）
export function getSalesmenList(params) {
  return getSalesmanList(params);
}

// 获取业务员详情
export function getSalesmanDetail(id) {
  return request({
    url: `/api/admin/v1/salesmen/${id}`,
    method: 'get'
  })
}

// 创建业务员
export function createSalesman(data) {
  return request({
    url: '/api/admin/v1/salesmen',
    method: 'post',
    data
  })
}

// 更新业务员
export function updateSalesman(id, data) {
  return request({
    url: `/api/admin/v1/salesmen/${id}`,
    method: 'put',
    data
  })
}

// 删除业务员
export function deleteSalesman(id) {
  return request({
    url: `/api/admin/v1/salesmen/${id}`,
    method: 'delete'
  })
}

// 更新业务员状态
export function updateSalesmanStatus(id, status) {
  return request({
    url: `/api/admin/v1/salesmen/${id}/status`,
    method: 'put',
    data: { status }
  })
}

// 获取业务员销售记录
export function getSalesmanSales(id, params) {
  return request({
    url: `/api/admin/v1/salesmen/${id}/sales`,
    method: 'get',
    params
  })
}

// 获取业务员佣金记录
export function getSalesmanCommissions(id, params) {
  return request({
    url: `/api/admin/v1/salesmen/${id}/commissions`,
    method: 'get',
    params
  })
}

// 获取业务员目标设置
export function getSalesmanTargets(id, params) {
  return request({
    url: `/api/admin/v1/salesmen/${id}/targets`,
    method: 'get',
    params
  })
}

// 设置业务员目标
export function setSalesmanTarget(id, data) {
  return request({
    url: `/api/admin/v1/salesmen/${id}/targets`,
    method: 'post',
    data
  })
}

// 获取业务员客户列表
export function getSalesmanCustomers(id, params) {
  return request({
    url: `/api/admin/v1/salesmen/${id}/customers`,
    method: 'get',
    params
  })
}

// 获取业务员统计信息
export function getSalesmanStats(id) {
  return request({
    url: `/api/admin/v1/salesmen/${id}/stats`,
    method: 'get'
  })
}

// 获取所有业务员统计
export function getAllSalesmanStats(params) {
  return request({
    url: '/api/admin/v1/salesmen/stats',
    method: 'get',
    params
  })
}

// 重置业务员密码
export function resetSalesmanPassword(id) {
  return request({
    url: `/api/admin/v1/salesmen/${id}/reset-password`,
    method: 'post'
  })
}

// 获取可用用户列表
export function getAvailableUsers(params) {
  return request({
    url: '/admin/api/salesman/available_users.php',
    method: 'get',
    params
  })
}

// 获取管理员列表
export function getManagersList(params) {
  return request({
    url: '/admin/api/salesman/managers.php',
    method: 'get',
    params
  })
} 