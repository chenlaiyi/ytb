import request from '@/utils/axios'

// 获取权限列表（别名）
export function getPermissions(params) {
  return getPermissionList(params);
}

// 获取权限详情（别名）
export function getPermission(id) {
  return getPermissionDetail(id);
}

// 获取权限分组
export function getPermissionGroups(params) {
  return request({
    url: '/api/admin/v1/system/permissions/groups',
    method: 'get',
    params
  })
}

// 获取模块列表
export function getModules(params) {
  return request({
    url: '/api/admin/v1/system/permissions/modules',
    method: 'get',
    params
  })
}

// 获取权限列表
export function getPermissionList(params) {
  return request({
    url: '/api/admin/v1/system/permissions',
    method: 'get',
    params
  })
}

// 获取权限树
export function getPermissionTree(params) {
  return request({
    url: '/api/admin/v1/system/permissions/tree',
    method: 'get',
    params
  })
}

// 获取权限详情
export function getPermissionDetail(id) {
  return request({
    url: `/api/admin/v1/system/permissions/${id}`,
    method: 'get'
  })
}

// 创建权限
export function createPermission(data) {
  return request({
    url: '/api/admin/v1/system/permissions',
    method: 'post',
    data
  })
}

// 更新权限
export function updatePermission(id, data) {
  return request({
    url: `/api/admin/v1/system/permissions/${id}`,
    method: 'put',
    data
  })
}

// 删除权限
export function deletePermission(id) {
  return request({
    url: `/api/admin/v1/system/permissions/${id}`,
    method: 'delete'
  })
}

// 更新权限状态
export function updatePermissionStatus(id, status) {
  return request({
    url: `/api/admin/v1/system/permissions/${id}/status`,
    method: 'put',
    data: { status }
  })
}

// 获取用户权限
export function getUserPermissions(userId) {
  return request({
    url: `/api/admin/v1/users/${userId}/permissions`,
    method: 'get'
  })
}

// 设置用户权限
export function setUserPermissions(userId, permissionIds) {
  return request({
    url: `/api/admin/v1/users/${userId}/permissions`,
    method: 'put',
    data: { permission_ids: permissionIds }
  })
}

// 检查用户权限
export function checkUserPermission(userId, permission) {
  return request({
    url: `/api/admin/v1/users/${userId}/check-permission`,
    method: 'post',
    data: { permission }
  })
}

// 批量更新权限
export function batchUpdatePermissions(data) {
  return request({
    url: '/api/admin/v1/system/permissions/batch-update',
    method: 'put',
    data
  })
}

// 同步权限
export function syncPermissions() {
  return request({
    url: '/api/admin/v1/system/permissions/sync',
    method: 'post'
  })
} 
