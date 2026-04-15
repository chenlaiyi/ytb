import request from '@/utils/request'

export const wechatMenuApi = {
  // 获取菜单列表
  getMenuList: (params) => {
    return request({
      url: '/branch/wechat-menu',
      method: 'get',
      params
    })
  },

  // 获取菜单详情
  getMenuDetail: (id) => {
    return request({
      url: `/branch/wechat-menu/${id}`,
      method: 'get'
    })
  },

  // 保存菜单
  saveMenu: (data) => {
    if (data.id) {
      return request({
        url: `/branch/wechat-menu/${data.id}`,
        method: 'put',
        data
      })
    } else {
      return request({
        url: '/branch/wechat-menu',
        method: 'post',
        data
      })
    }
  },

  // 删除菜单
  deleteMenu: (id) => {
    return request({
      url: `/branch/wechat-menu/${id}`,
      method: 'delete'
    })
  },

  // 复制菜单
  copyMenu: (id) => {
    return request({
      url: `/branch/wechat-menu/${id}/copy`,
      method: 'post'
    })
  },

  // 发布菜单到微信
  publishMenu: (id) => {
    return request({
      url: `/branch/wechat-menu/${id}/publish`,
      method: 'post'
    })
  },

  // 从微信同步菜单
  syncMenu: (params) => {
    return request({
      url: '/branch/wechat-menu/sync',
      method: 'post',
      data: params
    })
  },

  // 切换菜单状态
  toggleStatus: (id) => {
    return request({
      url: `/branch/wechat-menu/${id}/toggle-status`,
      method: 'post'
    })
  },

  // 获取全局菜单模板
  getGlobalTemplate: () => {
    return request({
      url: '/branch/wechat-menu/global-template',
      method: 'get'
    })
  },

  // 应用全局菜单模板
  applyGlobalTemplate: (branchId) => {
    return request({
      url: '/branch/wechat-menu/apply-global-template',
      method: 'post',
      data: { branch_id: branchId }
    })
  },

  // 验证菜单结构
  validateMenu: (data) => {
    return request({
      url: '/branch/wechat-menu/validate',
      method: 'post',
      data
    })
  },

  // 获取菜单发布历史
  getPublishHistory: (params) => {
    return request({
      url: '/branch/wechat-menu/publish-history',
      method: 'get',
      params
    })
  }
} 