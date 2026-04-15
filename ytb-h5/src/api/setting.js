import request from '@/utils/request';

/**
 * 获取系统设置列表
 * @param {Object} params 查询参数
 * @param {string} params.group 设置分组
 * @param {string} params.keyword 搜索关键词
 * @returns {Promise<Object>} 系统设置列表
 */
export function getSettings(params) {
  return request({
    url: '/api/admin/v1/settings',
    method: 'get',
    params
  });
}

/**
 * 获取单个系统设置
 * @param {number} id 设置ID
 * @returns {Promise<Object>} 系统设置详情
 */
export function getSetting(id) {
  return request({
    url: `/api/admin/v1/settings/${id}`,
    method: 'get'
  });
}

/**
 * 创建系统设置
 * @param {Object} data 设置数据
 * @returns {Promise<Object>} 创建结果
 */
export function createSetting(data) {
  return request({
    url: '/api/admin/v1/settings',
    method: 'post',
    data
  });
}

/**
 * 更新系统设置
 * @param {number} id 设置ID
 * @param {Object} data 设置数据
 * @returns {Promise<Object>} 更新结果
 */
export function updateSetting(id, data) {
  return request({
    url: `/api/admin/v1/settings/${id}`,
    method: 'put',
    data
  });
}

/**
 * 删除系统设置
 * @param {number} id 设置ID
 * @returns {Promise<Object>} 删除结果
 */
export function deleteSetting(id) {
  return request({
    url: `/api/admin/v1/settings/${id}`,
    method: 'delete'
  });
}

/**
 * 批量更新系统设置
 * @param {Array} settings 设置数组
 * @returns {Promise<Object>} 更新结果
 */
export function batchUpdateSettings(settings) {
  return request({
    url: '/api/admin/v1/settings/batch-update',
    method: 'post',
    data: { settings }
  });
}

/**
 * 获取系统设置分组
 * @returns {Promise<Object>} 设置分组列表
 */
export function getSettingGroups() {
  return request({
    url: '/api/admin/v1/settings/groups',
    method: 'get'
  });
}

/**
 * 根据键名获取设置值
 * @param {string} key 设置键名
 * @returns {Promise<Object>} 设置值
 */
export function getSettingByKey(key) {
  return request({
    url: '/api/admin/v1/settings/by-key',
    method: 'get',
    params: { key }
  });
}

/**
 * 根据分组获取设置
 * @param {string} group 设置分组
 * @returns {Promise<Object>} 分组设置列表
 */
export function getSettingsByGroup(group) {
  return request({
    url: `/api/admin/v1/settings/by-group/${group}`,
    method: 'get'
  });
}
