import request from '../../utils/request'

/**
 * API接口管理相关API
 */

// 获取所有API接口列表
export function getApiList(params = {}) {
    return request({
        url: '/api/admin/v1/api-management',
        method: 'get',
        params
    })
}

// 测试API接口
export function testApi(data) {
    return request({
        url: '/api/admin/v1/api-management/test',
        method: 'post',
        data
    })
}

// 获取API接口详情
export function getApiDetail(params) {
    return request({
        url: '/api/admin/v1/api-management/detail',
        method: 'get',
        params
    })
}

// 获取API接口统计信息
export function getApiStats() {
    return request({
        url: '/api/admin/v1/api-management/stats',
        method: 'get'
    })
} 