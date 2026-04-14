import request from '@/utils/request'

/**
 * 微信菜单管理API
 */

// 获取分支机构微信菜单
export function getWechatMenu(branchId) {
    return request({
        url: `/api/branches/${branchId}/wechat/menu`,
        method: 'get'
    })
}

// 保存分支机构微信菜单
export function saveWechatMenu(branchId, data) {
    return request({
        url: `/api/branches/${branchId}/wechat/menu`,
        method: 'post',
        data
    })
}

// 发布微信菜单
export function publishWechatMenu(branchId) {
    return request({
        url: `/api/branches/${branchId}/wechat/menu/sync`,
        method: 'post'
    })
}

// 删除微信菜单
export function deleteWechatMenu(branchId) {
    return request({
        url: `/api/branches/${branchId}/wechat/menu`,
        method: 'delete'
    })
}

// 同步微信菜单
export function syncWechatMenu(branchId) {
    return request({
        url: `/api/branches/${branchId}/wechat/menu/sync`,
        method: 'post'
    })
}

// 获取微信当前菜单
export function getCurrentWechatMenu(branchId) {
    return request({
        url: `/api/branches/${branchId}/wechat/menu`,
        method: 'get'
    })
}

// 获取菜单模板列表
export function getMenuTemplates(branchId) {
    return request({
        url: `/api/branches/${branchId}/wechat/menu/templates`,
        method: 'get'
    })
}

// 应用菜单模板
export function applyMenuTemplate(branchId, templateId) {
    return request({
        url: `/api/branches/${branchId}/wechat/menu/apply-template`,
        method: 'post',
        data: { template_id: templateId }
    })
} 