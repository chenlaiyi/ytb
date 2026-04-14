import request from '@/utils/axios'

// 获取工程师列表
export function getEngineers(params) {
  return request({
    url: '/api/admin/v1/installation-engineers',
    method: 'get',
    params
  })
}

// 获取工程师详情
export function getEngineerDetail(id) {
  return request({
    url: `/api/admin/v1/installation-engineers/${id}`,
    method: 'get'
  })
}

// 创建工程师
export function createEngineer(data) {
  return request({
    url: '/api/admin/v1/installation-engineers',
    method: 'post',
    data
  })
}

// 更新工程师
export function updateEngineer(id, data) {
  return request({
    url: `/api/admin/v1/installation-engineers/${id}`,
    method: 'put',
    data
  })
}

// 删除工程师
export function deleteEngineer(id) {
  return request({
    url: `/api/admin/v1/installation-engineers/${id}`,
    method: 'delete'
  })
}

// 更新工程师状态
export function updateEngineerStatus(id, status) {
  return request({
    url: `/api/admin/v1/installation-engineers/${id}/status`,
    method: 'put',
    data: { status }
  })
}

// 获取工程师统计
export function getEngineerStats(id) {
  return request({
    url: `/api/admin/v1/installation-engineers/${id}/stats`,
    method: 'get'
  })
}

// 获取工程师工作记录
export function getEngineerWorkLogs(id, params) {
  return request({
    url: `/api/admin/v1/installation-engineers/${id}/installations`,
    method: 'get',
    params
  })
}

// 分配工作给工程师
export function assignWork(engineerId, workData) {
  return request({
    url: `/api/admin/v1/installation-engineers/${engineerId}/assign-work`,
    method: 'post',
    data: workData
  })
}

// 获取可用工程师列表
export function getAvailableEngineers(params) {
  return request({
    url: '/api/admin/v1/installation-engineers/available',
    method: 'get',
    params
  })
}

// 批量操作工程师
export function batchOperateEngineers(ids, action, data = {}) {
  return request({
    url: '/api/admin/v1/installation-engineers/batch-operate',
    method: 'post',
    data: { ids, action, ...data }
  })
}

// 导出工程师数据
export function exportEngineers(params) {
  return request({
    url: '/api/admin/v1/installation-engineers/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取工程师区域列表
export function getEngineerRegions() {
  return request({
    url: '/api/admin/v1/installation-engineers/regions',
    method: 'get'
  })
}

// 同步净水器数据库工程师
export function syncFromWaterDb() {
  return request({
    url: '/api/admin/v1/installation-engineers/sync-from-water-db',
    method: 'post'
  })
}

// 更新所有工程师安装数量
export function updateInstallationCount() {
  return request({
    url: '/api/admin/v1/installation-engineers/update-installation-count',
    method: 'post'
  })
}

// 更新所有工程师安装数量（别名）
export function updateAllEngineersInstallationCount() {
  return request({
    url: '/api/admin/v1/installation-engineers/update-installation-count',
    method: 'post'
  })
}



// 默认导出所有API函数
export default {
  getEngineers,
  getEngineerDetail,
  createEngineer,
  updateEngineer,
  deleteEngineer,
  updateEngineerStatus,
  getEngineerStats,
  getEngineerWorkLogs,
  assignWork,
  getAvailableEngineers,
  batchOperateEngineers,
  exportEngineers,
  getEngineerRegions,
  syncFromWaterDb,
  updateInstallationCount,
  updateAllEngineersInstallationCount
}
