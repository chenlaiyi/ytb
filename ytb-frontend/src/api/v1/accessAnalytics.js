import request from '@/utils/request'

/**
 * 获取权限分析统计数据
 * @returns {Promise} 统计数据
 */
export function getAnalyticsStats() {
  return request({
    url: '/api/admin/v1/system/access-analytics/stats',
    method: 'get'
  })
}

/**
 * 获取角色权限分析
 * @returns {Promise} 角色分析数据
 */
export function getRoleAnalysis() {
  return request({
    url: '/api/admin/v1/system/access-analytics/role-analysis',
    method: 'get'
  })
}

/**
 * 获取权限使用统计
 * @returns {Promise} 权限分析数据
 */
export function getPermissionAnalysis() {
  return request({
    url: '/api/admin/v1/system/access-analytics/permission-analysis',
    method: 'get'
  })
}

/**
 * 获取角色权限分布图表数据
 * @returns {Promise} 图表数据
 */
export function getRoleChartData() {
  return request({
    url: '/api/admin/v1/system/access-analytics/role-chart',
    method: 'get'
  })
}

/**
 * 获取权限模块使用情况图表数据
 * @returns {Promise} 图表数据
 */
export function getModuleChartData() {
  return request({
    url: '/api/admin/v1/system/access-analytics/module-chart',
    method: 'get'
  })
}

/**
 * 获取管理员权限分析
 * @returns {Promise} 管理员分析数据
 */
export function getAdminAnalysis() {
  return request({
    url: '/api/admin/v1/system/access-analytics/admin-analysis',
    method: 'get'
  })
}

/**
 * 获取权限使用趋势
 * @param {Object} params 查询参数
 * @returns {Promise} 趋势数据
 */
export function getUsageTrend(params) {
  return request({
    url: '/api/admin/v1/system/access-analytics/usage-trend',
    method: 'get',
    params
  })
}

/**
 * 导出权限分析报告
 * @returns {Promise} 导出结果
 */
export function exportAnalyticsReport() {
  return request({
    url: '/api/admin/v1/system/access-analytics/export',
    method: 'get'
  })
}
