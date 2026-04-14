import request from '@/utils/request'

// 获取机构汇总列表
export function getInstitutionList(params) {
  return request({
    url: '/api/admin/v1/institution-summary',
    method: 'get',
    params
  })
}

// 同步机构数据
export function syncInstitutionData() {
  return request({
    url: '/api/admin/v1/institution-summary/sync',
    method: 'post'
  })
}

// 获取同步状态
export function getSyncStatus() {
  return request({
    url: '/api/admin/v1/institution-summary/sync-status',
    method: 'get'
  })
} 