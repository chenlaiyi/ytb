import request from '@/utils/request'

// 获取故障预警设备列表
export function getFaultDevices(params) {
    return request({
        url: '/api/admin/water-purifier/faults',
        method: 'get',
        params
    })
}

// 远程控制设备
export function controlDevice(id, data) {
    return request({
        url: `/api/admin/water-purifier/${id}/control`,
        method: 'post',
        data
    })
}

// 重置滤芯
export function resetFilters(id, data) {
    return request({
        url: `/api/admin/water-purifier/${id}/reset-filters`,
        method: 'post',
        data
    })
}
