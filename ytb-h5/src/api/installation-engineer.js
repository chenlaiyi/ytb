import request from '@/utils/request';

/**
 * 获取工程师列表
 * @param {Object} params 查询参数
 * @param {string} params.keyword 搜索关键词
 * @param {string} params.status 状态筛选
 * @param {string} params.region 区域筛选
 * @param {string} params.order_by 排序字段
 * @param {string} params.order_dir 排序方向
 * @param {number} params.per_page 每页数量
 * @param {number} params.page 页码
 * @returns {Promise<Object>} 工程师列表数据
 */
export function getEngineers(params) {
  return request({
    url: '/api/admin/v1/installation-engineers',
    method: 'get',
    params
  });
}

/**
 * 获取工程师详情
 * @param {number} id 工程师ID
 * @returns {Promise<Object>} 工程师详情数据
 */
export function getEngineer(id) {
  return request({
    url: `/api/admin/v1/installation-engineers/${id}`,
    method: 'get'
  });
}

/**
 * 创建工程师
 * @param {Object} data 工程师数据
 * @returns {Promise<Object>} 创建结果
 */
export function createEngineer(data) {
  return request({
    url: '/api/admin/v1/installation-engineers',
    method: 'post',
    data
  });
}

/**
 * 更新工程师
 * @param {number} id 工程师ID
 * @param {Object} data 工程师数据
 * @returns {Promise<Object>} 更新结果
 */
export function updateEngineer(id, data) {
  return request({
    url: `/api/admin/v1/installation-engineers/${id}`,
    method: 'put',
    data
  });
}

/**
 * 删除工程师
 * @param {number} id 工程师ID
 * @returns {Promise<Object>} 删除结果
 */
export function deleteEngineer(id) {
  return request({
    url: `/api/admin/v1/installation-engineers/${id}`,
    method: 'delete'
  });
}

/**
 * 更新工程师状态
 * @param {number} id 工程师ID
 * @param {number} status 状态值
 * @returns {Promise<Object>} 更新结果
 */
export function updateEngineerStatus(id, status) {
  return request({
    url: `/api/admin/v1/installation-engineers/${id}/status`,
    method: 'put',
    data: { status }
  });
}

/**
 * 获取工程师安装任务列表
 * @param {number} id 工程师ID
 * @param {Object} params 查询参数
 * @param {string} params.status 状态筛选
 * @param {string} params.start_date 开始日期
 * @param {string} params.end_date 结束日期
 * @param {string} params.order_by 排序字段
 * @param {string} params.order_dir 排序方向
 * @param {number} params.per_page 每页数量
 * @param {number} params.page 页码
 * @returns {Promise<Object>} 安装任务列表数据
 */
export function getEngineerInstallations(id, params) {
  return request({
    url: `/api/admin/v1/installation-engineers/${id}/installations`,
    method: 'get',
    params
  });
}

/**
 * 获取工程师统计数据
 * @param {number} id 工程师ID
 * @returns {Promise<Object>} 统计数据
 */
export function getEngineerStats(id) {
  return request({
    url: `/api/admin/v1/installation-engineers/${id}/stats`,
    method: 'get'
  });
}

/**
 * 获取工程师区域列表
 * @returns {Promise<Object>} 区域列表
 */
export function getEngineerRegions() {
  return request({
    url: '/api/admin/v1/installation-engineers/regions',
    method: 'get'
  });
}
