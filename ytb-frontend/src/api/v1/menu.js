import request from '@/utils/request'

// 获取菜单列表（别名）
export function getMenus(params) {
  return getMenuList(params);
}

// 获取菜单详情（别名）
export function getMenu(id) {
  return getMenuDetail(id);
}

/**
 * 获取菜单列表
 * @param {Object} params 查询参数
 * @returns {Promise} 菜单列表
 */
export function getMenuList(params) {
  return request({
    url: '/api/admin/v1/menus',
    method: 'get',
    params
  })
}

/**
 * 获取菜单树形结构
 * @returns {Promise} 菜单树
 */
export function getMenuTree() {
  return request({
    url: '/api/admin/v1/menus',
    method: 'get',
    params: { tree: true }
  })
}

/**
 * 获取菜单详情
 * @param {number} id 菜单ID
 * @returns {Promise} 菜单详情
 */
export function getMenuDetail(id) {
  return request({
    url: `/api/admin/v1/menus/${id}`,
    method: 'get'
  })
}

/**
 * 创建菜单
 * @param {Object} data 菜单数据
 * @returns {Promise} 创建结果
 */
export function createMenu(data) {
  return request({
    url: '/api/admin/v1/menus',
    method: 'post',
    data
  })
}

/**
 * 更新菜单
 * @param {number} id 菜单ID
 * @param {Object} data 菜单数据
 * @returns {Promise} 更新结果
 */
export function updateMenu(id, data) {
  return request({
    url: `/api/admin/v1/menus/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除菜单
 * @param {number} id 菜单ID
 * @returns {Promise} 删除结果
 */
export function deleteMenu(id) {
  return request({
    url: `/api/admin/v1/menus/${id}`,
    method: 'delete'
  })
}

/**
 * 批量删除菜单
 * @param {Array} ids 菜单ID数组
 * @returns {Promise} 删除结果
 */
export function batchDeleteMenus(ids) {
  return request({
    url: '/api/admin/v1/menus/batch-delete',
    method: 'delete',
    data: { ids }
  })
}

/**
 * 更新菜单状态
 * @param {number} id 菜单ID
 * @param {number} status 状态
 * @returns {Promise} 更新结果
 */
export function updateMenuStatus(id, status) {
  return request({
    url: `/api/admin/v1/menus/${id}/status`,
    method: 'put',
    data: { status }
  })
}

/**
 * 批量更新菜单排序
 * @param {Array} menus 菜单排序数据
 * @returns {Promise} 更新结果
 */
export function updateMenuSort(menus) {
  return request({
    url: '/api/admin/v1/menus/sort',
    method: 'put',
    data: { menus }
  })
}

/**
 * 初始化默认菜单
 * @returns {Promise} 初始化结果
 */
export function initializeDefaultMenus() {
  return request({
    url: '/api/admin/v1/menus/initialize-default',
    method: 'post'
  })
}

// 初始化默认菜单（别名）
export function initDefaultMenusApi() {
  return initializeDefaultMenus()
}

// 获取用户菜单权限
export function getUserMenus(userId) {
  return request({
    url: `/api/admin/v1/users/${userId}/menus`,
    method: 'get'
  })
}

// 设置用户菜单权限
export function setUserMenus(userId, menuIds) {
  return request({
    url: `/api/admin/v1/users/${userId}/menus`,
    method: 'put',
    data: { menu_ids: menuIds }
  })
}

// 获取角色菜单权限
export function getRoleMenus(roleId) {
  return request({
    url: `/api/admin/v1/system/roles/${roleId}/menus`,
    method: 'get'
  })
}

// 设置角色菜单权限
export function setRoleMenus(roleId, menuIds) {
  return request({
    url: `/api/admin/v1/system/roles/${roleId}/menus`,
    method: 'put',
    data: { menu_ids: menuIds }
  })
}
