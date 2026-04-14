import request from '@/utils/axios'

// 获取角色列表（别名）
export function getRoles(params) {
  return getRoleList(params);
}

// 获取角色详情（别名）
export function getRole(id) {
  return getRoleDetail(id);
}

// 获取角色列表
export function getRoleList(params) {
  return request({
    url: '/api/admin/v1/system/roles',
    method: 'get',
    params
  })
}

// 获取角色详情
export function getRoleDetail(id) {
  return request({
    url: `/api/admin/v1/system/roles/${id}`,
    method: 'get'
  })
}

// 创建角色
export function createRole(data) {
  return request({
    url: '/api/admin/v1/system/roles',
    method: 'post',
    data
  })
}

// 更新角色
export function updateRole(id, data) {
  return request({
    url: `/api/admin/v1/system/roles/${id}`,
    method: 'put',
    data
  })
}

// 删除角色
export function deleteRole(id) {
  return request({
    url: `/api/admin/v1/system/roles/${id}`,
    method: 'delete'
  })
}

// 更新角色状态
export function updateRoleStatus(id, status) {
  return request({
    url: `/api/admin/v1/system/roles/${id}/status`,
    method: 'put',
    data: { status }
  })
}

// 获取角色权限
export function getRolePermissions(id) {
  return request({
    url: `/api/admin/v1/system/roles/${id}/permissions`,
    method: 'get'
  })
}

// 设置角色权限
export function setRolePermissions(id, permissionIds) {
  return request({
    url: `/api/admin/v1/system/roles/${id}/permissions`,
    method: 'put',
    data: { permission_ids: permissionIds }
  })
}

// 获取角色用户列表
export function getRoleUsers(id, params) {
  return request({
    url: `/api/admin/v1/system/roles/${id}/users`,
    method: 'get',
    params
  })
}

// 分配用户到角色
export function assignUsersToRole(id, userIds) {
  return request({
    url: `/api/admin/v1/system/roles/${id}/users`,
    method: 'post',
    data: { user_ids: userIds }
  })
}

// 从角色移除用户
export function removeUsersFromRole(id, userIds) {
  return request({
    url: `/api/admin/v1/system/roles/${id}/users`,
    method: 'delete',
    data: { user_ids: userIds }
  })
}

// 复制角色
export function copyRole(id, data) {
  return request({
    url: `/api/admin/v1/system/roles/${id}/copy`,
    method: 'post',
    data
  })
} 
