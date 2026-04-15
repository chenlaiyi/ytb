import request from '@/utils/request';

/**
 * 获取仪表盘统计数据
 * @param {Object} params 查询参数
 * @param {string} params.start_time 开始时间
 * @param {string} params.end_time 结束时间
 * @returns {Promise<Object>} 仪表盘统计数据
 */
export function getDashboardStats(params) {
  return request({
    url: '/api/admin/v1/dashboard/stats',
    method: 'get',
    params
  });
}

/**
 * 获取仪表盘图表数据
 * @param {Object} params 查询参数
 * @param {string} params.start_time 开始时间
 * @param {string} params.end_time 结束时间
 * @returns {Promise<Object>} 仪表盘图表数据
 */
export function getDashboardCharts(params) {
  return request({
    url: '/api/admin/v1/dashboard/charts',
    method: 'get',
    params
  });
}
