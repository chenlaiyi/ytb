import request from '@/utils/request'

/**
 * 分支机构管理API
 */

// 获取分支机构列表
export function getBranchOrganizations(params = {}) {
    return request({
        url: '/api/admin/v1/branch-organizations',
        method: 'get',
        params
    })
}

// 获取分支机构详情
export function getBranchOrganization(id) {
    return request({
        url: `/api/admin/v1/branch-organizations/${id}`,
        method: 'get'
    })
}

// 创建分支机构
export function createBranchOrganization(data) {
    return request({
        url: '/api/admin/v1/branch-organizations',
        method: 'post',
        data
    })
}

// 更新分支机构
export function updateBranchOrganization(id, data) {
    return request({
        url: `/api/admin/v1/branch-organizations/${id}`,
        method: 'put',
        data
    })
}

// 删除分支机构
export function deleteBranchOrganization(id) {
    return request({
        url: `/api/admin/v1/branch-organizations/${id}`,
        method: 'delete'
    })
}

// 更新分支机构状态
export function updateBranchOrganizationStatus(id, status) {
    return request({
        url: `/api/admin/v1/branch-organizations/${id}/status`,
        method: 'put',
        data: { status }
    })
}

// 获取分支机构选项（用于下拉选择）
export function getBranchOrganizationOptions() {
    return request({
        url: '/api/admin/v1/branch-organizations/options',
        method: 'get'
    })
} 