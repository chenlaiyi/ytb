import request from '@/utils/request'

/**
 * 分支机构管理API
 */

// 获取分支机构统计数据
export function getBranchStatistics(branchId, params = {}) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/statistics`,
        method: 'get',
        params
    })
}

// 获取分支机构活动日志
export function getBranchActivities(branchId, params = {}) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/activities`,
        method: 'get',
        params
    })
}

// 获取分支机构管理员列表
export function getBranchAdmins(branchId, params = {}) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/admins`,
        method: 'get',
        params
    })
}

// 创建分支机构管理员
export function createBranchAdmin(branchId, data) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/admins`,
        method: 'post',
        data
    })
}

// 更新分支机构管理员
export function updateBranchAdmin(branchId, adminId, data) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/admins/${adminId}`,
        method: 'put',
        data
    })
}

// 切换管理员状态
export function toggleBranchAdminStatus(branchId, adminId, data) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/admins/${adminId}/status`,
        method: 'put',
        data
    })
}

// 重置管理员密码
export function resetBranchAdminPassword(branchId, adminId) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/admins/${adminId}/reset-password`,
        method: 'post'
    })
}

// 获取分支机构APP用户列表
export function getBranchAppUsers(branchId, params = {}) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/app-users`,
        method: 'get',
        params
    })
}

// 更新分支机构APP用户
export function updateBranchAppUser(branchId, userId, data) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/app-users/${userId}`,
        method: 'put',
        data
    })
}

// ========== 角色管理相关 ==========

// 获取分支机构角色列表
export function getBranchRoles(branchId, params = {}) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/roles`,
        method: 'get',
        params
    })
}

// 获取分支机构角色详情
export function getBranchRole(branchId, roleId) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/roles/${roleId}`,
        method: 'get'
    })
}

// 创建分支机构角色
export function createBranchRole(branchId, data) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/roles`,
        method: 'post',
        data
    })
}

// 更新分支机构角色
export function updateBranchRole(branchId, roleId, data) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/roles/${roleId}`,
        method: 'put',
        data
    })
}

// 删除分支机构角色
export function deleteBranchRole(branchId, roleId) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/roles/${roleId}`,
        method: 'delete'
    })
}

// 获取分支机构权限列表
export function getBranchPermissions(branchId) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/permissions`,
        method: 'get'
    })
}

// ========== 用户管理相关 ==========

// 获取分支机构用户列表
export function getBranchUsers(branchId, params = {}) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/users`,
        method: 'get',
        params
    })
}

// 获取分支机构用户统计
export function getBranchUserStats(branchId) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/users/stats`,
        method: 'get'
    })
}

// 获取分支机构用户详情
export function getBranchUser(branchId, userId) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/users/${userId}`,
        method: 'get'
    })
}

// 更新分支机构用户
export function updateBranchUser(branchId, userId, data) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/users/${userId}`,
        method: 'put',
        data
    })
}

// 切换分支机构用户状态
export function toggleBranchUserStatus(branchId, userId) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/users/${userId}/toggle-status`,
        method: 'post'
    })
}

// 重置分支机构用户密码
export function resetBranchUserPassword(branchId, userId) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/users/${userId}/reset-password`,
        method: 'post'
    })
}

// ========== 设备管理相关 ==========

// 获取分支机构设备列表
export function getBranchDevices(branchId, params = {}) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/devices`,
        method: 'get',
        params
    })
}

// 获取分支机构设备统计
export function getBranchDeviceStats(branchId) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/devices/stats`,
        method: 'get'
    })
}

// 获取分支机构设备详情
export function getBranchDevice(branchId, deviceId) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/devices/${deviceId}`,
        method: 'get'
    })
}

// 更新分支机构设备
export function updateBranchDevice(branchId, deviceId, data) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/devices/${deviceId}`,
        method: 'put',
        data
    })
}

// 设备远程控制
export function remoteBranchDeviceControl(branchId, deviceId, action) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/devices/${deviceId}/remote-control`,
        method: 'post',
        data: { action }
    })
}

// 解绑设备用户
export function unbindBranchDevice(branchId, deviceId) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/devices/${deviceId}/unbind`,
        method: 'post'
    })
}

// ========== VIP管理相关 ==========

// 获取分支机构VIP用户列表 - 使用Laravel V1 API
export function getBranchVipUsers(branchId, params = {}) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/vip-users`,
        method: 'get',
        params
    })
}

// 获取分支机构VIP团队成员（关系树） - 使用Laravel V1 API
export function getBranchVipTeamMembers(branchId, params = {}) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/vip-team-members`,
        method: 'get',
        params
    })
}

// 获取分支机构VIP统计
export function getBranchVipStats(branchId) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/vip-stats`,
        method: 'get'
    })
}

// ========== 分红配置相关 ==========

// 获取分支机构分红配置
export function getBranchDividendConfig(branchId) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/dividend-config`,
        method: 'get'
    })
}

// 更新分支机构分红配置
export function updateBranchDividendConfig(branchId, data) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/dividend-config`,
        method: 'put',
        data
    })
}

// ========== 系统配置相关 ==========

// 获取分支机构系统配置
export function getBranchSystemConfig(branchId) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/system-config`,
        method: 'get'
    })
}

// 保存分支机构系统配置
export function saveBranchSystemConfig(branchId, data) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/system-config`,
        method: 'put',
        data
    })
}

// ========== 统计分析相关 ==========

// 注意：getBranchStatistics 函数已在文件开头定义，避免重复定义

/**
 * 获取VIP用户列表
 */
export function getVipUsers(branchId, params = {}) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/vip-users`,
        method: 'get',
        params
    });
}

/**
 * 获取业务员列表
 */
export function getSalesman(branchId, params = {}) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/salesman`,
        method: 'get',
        params
    });
}

/**
 * 创建业务员
 */
export function createSalesman(branchId, data) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/salesman`,
        method: 'post',
        data
    });
}

/**
 * 更新业务员
 */
export function updateSalesman(branchId, salesmanId, data) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/salesman/${salesmanId}`,
        method: 'put',
        data
    });
}

/**
 * 删除业务员
 */
export function deleteSalesman(branchId, salesmanId) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/salesman/${salesmanId}`,
        method: 'delete'
    });
}

/**
 * 切换业务员状态
 */
export function toggleSalesmanStatus(branchId, salesmanId, data) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/salesman/${salesmanId}/status`,
        method: 'put',
        data
    });
}

/**
 * 获取APP用户列表
 */
export function getAppUsers(branchId, params = {}) {
    return request({
        url: `/api/admin/v1/branch-organizations/${branchId}/app-users`,
        method: 'get',
        params
    });
}

// 获取分支机构用户列表（用于业务员管理）
export function getAllAppUsers(params = {}) {
  return request({
    url: '/api/admin/v1/app-users',
    method: 'get',
    params
  });
}

