import request from '@/utils/request'

/**
 * 分支机构基础API
 */

// 获取分支机构列表
export function getBranchList(params = {}) {
    return request({
        url: '/api/admin/v1/branch-organizations',
        method: 'get',
        params
    })
}

// 获取分支机构详情
export function getBranchDetail(id) {
    return request({
        url: `/api/admin/v1/branch-organizations/${id}`,
        method: 'get'
    })
}
