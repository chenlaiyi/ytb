import request from '@/utils/request'

/**
 * 分支机构菜单管理API
 */

// 获取分支机构菜单列表
export function getBranchMenus(params) {
    return request({
        url: '/api/admin/v1/branch-menus',
        method: 'get',
        params
    })
}

// 获取指定分支机构的菜单树（用于前端显示）
export function getBranchMenusByBranchId(branchId) {
    return request({
        url: `/api/admin/v1/branch-menus/tree/${branchId}`,
        method: 'get'
    })
}

// 获取菜单树（不指定分支机构时获取默认模板）
export function getBranchMenuTree(branchId = null) {
    const url = branchId 
        ? `/api/admin/v1/branch-menus/tree/${branchId}`
        : '/api/admin/v1/branch-menus/tree'
    return request({
        url,
        method: 'get'
    })
}

// 创建分支机构菜单
export function createBranchMenu(data) {
    return request({
        url: '/api/admin/v1/branch-menus',
        method: 'post',
        data
    })
}

// 获取分支机构菜单详情
export function getBranchMenu(id) {
    return request({
        url: `/api/admin/v1/branch-menus/${id}`,
        method: 'get'
    })
}

// 更新分支机构菜单
export function updateBranchMenu(id, data) {
    return request({
        url: `/api/admin/v1/branch-menus/${id}`,
        method: 'put',
        data
    })
}

// 删除分支机构菜单
export function deleteBranchMenu(id) {
    return request({
        url: `/api/admin/v1/branch-menus/${id}`,
        method: 'delete'
    })
}

// 更新分支机构菜单状态
export function updateBranchMenuStatus(id, isEnabled) {
    return request({
        url: `/api/admin/v1/branch-menus/${id}/status`,
        method: 'put',
        data: { is_enabled: isEnabled }
    })
}

// 初始化分支机构菜单
export function initializeBranchMenus(branchId) {
    return request({
        url: '/api/admin/v1/branch-menus/initialize',
        method: 'post',
        data: { branch_id: branchId }
    })
}

// 获取父菜单选项
export function getParentMenuOptions(branchId, excludeId = null) {
    return request({
        url: '/api/admin/v1/branch-menus/parent-options',
        method: 'get',
        params: { 
            branch_id: branchId,
            exclude_id: excludeId
        }
    })
}

// 批量更新菜单状态
export function batchUpdateMenuStatus(ids, isEnabled) {
    return request({
        url: '/api/admin/v1/branch-menus/batch-status',
        method: 'post',
        data: { 
            ids,
            is_enabled: isEnabled
        }
    })
}

// 复制默认菜单
export function copyDefaultMenus(branchId, templateMenuIds) {
    return request({
        url: '/api/admin/v1/branch-menus/copy-default',
        method: 'post',
        data: { 
            branch_id: branchId,
            template_menu_ids: templateMenuIds
        }
    })
} 