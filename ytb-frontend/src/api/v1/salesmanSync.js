import request from '@/utils/axios'

// 同步APP用户到业务员系统
export function syncAppUsersToSalesmen(data) {
  return request({
    url: '/api/admin/v1/salesman-sync/sync-app-users',
    method: 'post',
    data
  })
}

// 同步业务员数据
export function syncSalesmanData(data) {
  return request({
    url: '/api/admin/v1/salesmen/sync',
    method: 'post',
    data
  })
}

// 批量同步业务员
export function batchSyncSalesmen(data) {
  return request({
    url: '/api/admin/v1/salesmen/batch-sync',
    method: 'post',
    data
  })
}

// 获取同步状态
export function getSyncStatus(id) {
  return request({
    url: `/api/admin/v1/salesmen/sync-status/${id}`,
    method: 'get'
  })
}

// 获取同步日志
export function getSyncLogs(params) {
  return request({
    url: '/api/admin/v1/salesmen/sync-logs',
    method: 'get',
    params
  })
}

// 重新同步业务员
export function resyncSalesman(id) {
  return request({
    url: `/api/admin/v1/salesmen/${id}/resync`,
    method: 'post'
  })
}

// 检查数据一致性
export function checkDataConsistency(id) {
  return request({
    url: `/api/admin/v1/salesmen/${id}/check-consistency`,
    method: 'get'
  })
}

// 修复数据不一致
export function fixDataInconsistency(id, data) {
  return request({
    url: `/api/admin/v1/salesmen/${id}/fix-inconsistency`,
    method: 'post',
    data
  })
} 