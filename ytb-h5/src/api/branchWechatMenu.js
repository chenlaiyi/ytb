import request from '@/utils/request'

const API_BASE_URL = '/admin/api/admin/v1/branches'

export const branchWechatMenuApi = {
  /**
   * 获取分支机构微信菜单列表
   * @param {number} branchId 分支机构ID
   * @returns {Promise}
   */
  getMenuGroups(branchId) {
    return request.get(`${API_BASE_URL}/${branchId}/wechat/menu`)
  },

  /**
   * 获取菜单组详情
   * @param {number} branchId 分支机构ID
   * @param {number} groupId 菜单组ID
   * @returns {Promise}
   */
  getMenuGroup(branchId, groupId) {
    return request.get(`${API_BASE_URL}/${branchId}/wechat/menu/${groupId}`)
  },

  /**
   * 创建菜单组
   * @param {number} branchId 分支机构ID
   * @param {object} data 菜单组数据
   * @returns {Promise}
   */
  createMenuGroup(branchId, data) {
    return request.post(`${API_BASE_URL}/${branchId}/wechat/menu`, data)
  },

  /**
   * 更新菜单组
   * @param {number} branchId 分支机构ID
   * @param {number} groupId 菜单组ID
   * @param {object} data 菜单组数据
   * @returns {Promise}
   */
  updateMenuGroup(branchId, groupId, data) {
    return request.put(`${API_BASE_URL}/${branchId}/wechat/menu/${groupId}`, data)
  },

  /**
   * 删除菜单组
   * @param {number} branchId 分支机构ID
   * @param {number} groupId 菜单组ID
   * @returns {Promise}
   */
  deleteGroup(branchId, groupId) {
    return request.delete(`${API_BASE_URL}/${branchId}/wechat/menu/${groupId}`)
  },

  /**
   * 发布菜单组到微信
   * @param {number} branchId 分支机构ID
   * @param {number} groupId 菜单组ID
   * @returns {Promise}
   */
  publishGroup(branchId, groupId) {
    return request.post(`${API_BASE_URL}/${branchId}/wechat/menu/${groupId}/publish`)
  },

  /**
   * 删除微信菜单（取消发布）
   * @param {number} branchId 分支机构ID
   * @param {number} groupId 菜单组ID
   * @returns {Promise}
   */
  deleteWechatMenu(branchId, groupId) {
    return request.delete(`${API_BASE_URL}/${branchId}/wechat/menu/${groupId}/wechat`)
  },

  /**
   * 从微信同步菜单
   * @param {number} branchId 分支机构ID
   * @returns {Promise}
   */
  syncFromWechat(branchId) {
    return request.post(`${API_BASE_URL}/${branchId}/wechat/menu/sync`)
  },

  /**
   * 复制菜单组
   * @param {number} branchId 分支机构ID
   * @param {number} groupId 菜单组ID
   * @param {object} data 复制数据（包含新标题等）
   * @returns {Promise}
   */
  duplicateGroup(branchId, groupId, data) {
    return request.post(`${API_BASE_URL}/${branchId}/wechat/menu/${groupId}/duplicate`, data)
  },

  /**
   * 获取菜单模板列表
   * @returns {Promise}
   */
  getTemplates() {
    return request.get(`${API_BASE_URL}/1/wechat/menu/templates/list`)
  },

  /**
   * 应用菜单模板
   * @param {number} branchId 分支机构ID
   * @param {object} data 模板应用数据
   * @returns {Promise}
   */
  applyTemplate(branchId, data) {
    return request.post(`${API_BASE_URL}/${branchId}/wechat/menu/templates/apply`, data)
  },

  /**
   * 获取发布日志
   * @param {number} branchId 分支机构ID
   * @param {number} limit 限制数量
   * @returns {Promise}
   */
  getPublishLogs(branchId, limit = 20) {
    return request.get(`${API_BASE_URL}/${branchId}/wechat/menu/publish-logs`, {
      params: { limit }
    })
  },

  /**
   * 验证菜单结构
   * @param {object} menuData 菜单数据
   * @returns {Promise}
   */
  validateMenu(menuData) {
    return request.post('/admin/api/wechat-menu/validate', menuData)
  },

  /**
   * 预览菜单效果
   * @param {object} menuData 菜单数据
   * @returns {Promise}
   */
  previewMenu(menuData) {
    return request.post('/admin/api/wechat-menu/preview', menuData)
  }
}

// 菜单类型常量
export const MENU_TYPES = {
  DEFAULT: 1,        // 默认菜单
  PERSONALIZED: 3    // 个性化菜单
}

// 菜单状态常量
export const MENU_STATUS = {
  UNPUBLISHED: 0,    // 未发布
  PUBLISHED: 1       // 已发布
}

// 菜单项类型常量
export const MENU_ITEM_TYPES = {
  CLICK: 'click',                    // 点击推事件
  VIEW: 'view',                      // 跳转URL
  MINIPROGRAM: 'miniprogram',        // 小程序
  SCANCODE_PUSH: 'scancode_push',    // 扫码推事件
  SCANCODE_WAITMSG: 'scancode_waitmsg', // 扫码推事件且弹出"消息接收中"提示框
  PIC_SYSPHOTO: 'pic_sysphoto',      // 弹出系统拍照发图
  PIC_PHOTO_OR_ALBUM: 'pic_photo_or_album', // 弹出拍照或者相册发图
  PIC_WEIXIN: 'pic_weixin',          // 弹出微信相册发图器
  LOCATION_SELECT: 'location_select', // 弹出地理位置选择器
  MEDIA_ID: 'media_id',              // 下发消息（除文本消息）
  VIEW_LIMITED: 'view_limited'        // 跳转图文消息URL
}

// 菜单项类型文本映射
export const MENU_ITEM_TYPE_TEXTS = {
  [MENU_ITEM_TYPES.CLICK]: '点击事件',
  [MENU_ITEM_TYPES.VIEW]: '跳转链接',
  [MENU_ITEM_TYPES.MINIPROGRAM]: '小程序',
  [MENU_ITEM_TYPES.SCANCODE_PUSH]: '扫码推送',
  [MENU_ITEM_TYPES.SCANCODE_WAITMSG]: '扫码等待',
  [MENU_ITEM_TYPES.PIC_SYSPHOTO]: '系统拍照',
  [MENU_ITEM_TYPES.PIC_PHOTO_OR_ALBUM]: '拍照或相册',
  [MENU_ITEM_TYPES.PIC_WEIXIN]: '微信相册',
  [MENU_ITEM_TYPES.LOCATION_SELECT]: '发送位置',
  [MENU_ITEM_TYPES.MEDIA_ID]: '多媒体消息',
  [MENU_ITEM_TYPES.VIEW_LIMITED]: '限制跳转'
}

// 个性化菜单匹配规则
export const PERSONALIZED_MENU_RULES = {
  // 性别
  SEX: {
    MALE: '1',    // 男性
    FEMALE: '2'   // 女性
  },
  
  // 客户端类型
  CLIENT_PLATFORM_TYPE: {
    IOS: '1',      // iOS
    ANDROID: '2',  // Android
    OTHERS: '3'    // 其他
  },
  
  // 语言
  LANGUAGE: {
    ZH_CN: 'zh_CN',  // 简体中文
    ZH_TW: 'zh_TW',  // 繁体中文
    EN: 'en'         // 英文
  }
}

// 工具函数
export const menuUtils = {
  /**
   * 获取菜单项类型文本
   * @param {string} type 菜单项类型
   * @returns {string}
   */
  getMenuItemTypeText(type) {
    return MENU_ITEM_TYPE_TEXTS[type] || type
  },

  /**
   * 验证菜单项数据
   * @param {object} item 菜单项数据
   * @returns {object} 验证结果
   */
  validateMenuItem(item) {
    const errors = []

    // 验证名称
    if (!item.name || item.name.trim() === '') {
      errors.push('菜单名称不能为空')
    } else if (item.name.length > 16) {
      errors.push('菜单名称不能超过16个字符')
    }

    // 验证类型
    if (!item.type) {
      errors.push('菜单类型不能为空')
    }

    // 根据类型验证特定字段
    switch (item.type) {
      case MENU_ITEM_TYPES.VIEW:
      case MENU_ITEM_TYPES.VIEW_LIMITED:
        if (!item.url) {
          errors.push('跳转链接不能为空')
        } else if (!/^https?:\/\/.+/.test(item.url)) {
          errors.push('跳转链接格式不正确')
        }
        break
      
      case MENU_ITEM_TYPES.CLICK:
        if (!item.key) {
          errors.push('点击事件KEY不能为空')
        } else if (item.key.length > 128) {
          errors.push('点击事件KEY不能超过128个字符')
        }
        break
      
      case MENU_ITEM_TYPES.MINIPROGRAM:
        if (!item.appid) {
          errors.push('小程序APPID不能为空')
        }
        if (!item.pagepath) {
          errors.push('小程序页面路径不能为空')
        }
        if (!item.url) {
          errors.push('小程序备用链接不能为空')
        }
        break
      
      case MENU_ITEM_TYPES.MEDIA_ID:
        if (!item.media_id) {
          errors.push('多媒体文件ID不能为空')
        }
        break
    }

    return {
      valid: errors.length === 0,
      errors
    }
  },

  /**
   * 验证菜单结构
   * @param {array} menuItems 菜单项数组
   * @returns {object} 验证结果
   */
  validateMenuStructure(menuItems) {
    const errors = []
    
    // 获取一级菜单
    const firstLevelItems = menuItems.filter(item => item.level === 1)
    
    // 验证一级菜单数量
    if (firstLevelItems.length === 0) {
      errors.push('至少需要一个一级菜单')
    } else if (firstLevelItems.length > 3) {
      errors.push('一级菜单最多只能有3个')
    }

    // 验证每个一级菜单
    firstLevelItems.forEach((item, index) => {
      const itemValidation = this.validateMenuItem(item)
      if (!itemValidation.valid) {
        errors.push(`一级菜单${index + 1}：${itemValidation.errors.join('，')}`)
      }

      // 获取子菜单
      const subItems = menuItems.filter(subItem => subItem.parent_id === item.id)
      
      // 验证子菜单数量
      if (subItems.length > 5) {
        errors.push(`一级菜单"${item.name}"的子菜单最多只能有5个`)
      }

      // 如果有子菜单，验证每个子菜单
      subItems.forEach((subItem, subIndex) => {
        const subItemValidation = this.validateMenuItem(subItem)
        if (!subItemValidation.valid) {
          errors.push(`子菜单"${item.name}-${subItem.name}"：${subItemValidation.errors.join('，')}`)
        }
      })

      // 如果有子菜单，一级菜单不能有动作
      if (subItems.length > 0) {
        if (item.type !== 'parent') {
          errors.push(`一级菜单"${item.name}"有子菜单时不能设置动作`)
        }
      } else {
        // 没有子菜单时必须有动作
        if (!item.type || item.type === 'parent') {
          errors.push(`一级菜单"${item.name}"没有子菜单时必须设置动作`)
        }
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  },

  /**
   * 构建微信API格式的菜单数据
   * @param {array} menuItems 菜单项数组
   * @param {object} matchRule 个性化菜单匹配规则（可选）
   * @returns {object} 微信API格式的菜单数据
   */
  buildWechatMenuData(menuItems, matchRule = null) {
    const firstLevelItems = menuItems
      .filter(item => item.level === 1)
      .sort((a, b) => a.sort_order - b.sort_order)

    const buttons = firstLevelItems.map(item => {
      const subItems = menuItems
        .filter(subItem => subItem.parent_id === item.id)
        .sort((a, b) => a.sort_order - b.sort_order)

      const button = {
        name: item.name
      }

      if (subItems.length > 0) {
        // 有子菜单
        button.sub_button = subItems.map(subItem => ({
          name: subItem.name,
          type: subItem.type,
          ...(subItem.key && { key: subItem.key }),
          ...(subItem.url && { url: subItem.url }),
          ...(subItem.media_id && { media_id: subItem.media_id }),
          ...(subItem.appid && { appid: subItem.appid }),
          ...(subItem.pagepath && { pagepath: subItem.pagepath })
        }))
      } else {
        // 无子菜单
        button.type = item.type
        if (item.key) button.key = item.key
        if (item.url) button.url = item.url
        if (item.media_id) button.media_id = item.media_id
        if (item.appid) button.appid = item.appid
        if (item.pagepath) button.pagepath = item.pagepath
      }

      return button
    })

    const result = { button: buttons }

    // 如果有匹配规则，添加个性化菜单匹配规则
    if (matchRule) {
      result.matchrule = {}
      
      if (matchRule.sex) result.matchrule.sex = matchRule.sex
      if (matchRule.group_id) result.matchrule.group_id = matchRule.group_id
      if (matchRule.client_platform_type) result.matchrule.client_platform_type = matchRule.client_platform_type
      if (matchRule.language) result.matchrule.language = matchRule.language
      if (matchRule.area && matchRule.area.length > 0) result.matchrule.area = matchRule.area
    }

    return result
  }
}

export default branchWechatMenuApi 