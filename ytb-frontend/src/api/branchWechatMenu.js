import request from '@/utils/request'

/**
 * 分支机构微信菜单管理API
 * 完整对接Platform\\MenuController的所有功能
 */

// 获取菜单列表
export function getMenuList(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/menu`,
    method: 'get'
  })
}

// 获取菜单编辑数据
export function getMenuDetail(branchId, id = null, params = {}) {
  let url = `/api/admin/v1/branches/${branchId}/wechat/menu/post`
  if (id) {
    url += `?id=${id}`
  }
  return request({
    url,
    method: 'get',
    params
  })
}

// 保存菜单
export function saveMenuData(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/menu`,
    method: 'post',
    data
  })
}

// 发布菜单
export function publishMenu(branchId, id) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/menu/push`,
    method: 'post',
    data: { id }
  })
}

// 删除菜单
export function deleteMenu(branchId, id) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/menu/delete`,
    method: 'post',
    data: { id }
  })
}

// 复制菜单
export function copyMenu(branchId, id, newName) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/menu/copy`,
    method: 'post',
    data: { 
      id,
      name: newName
    }
  })
}

// 获取当前菜单
export function getCurrentMenu(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/menu/current`,
    method: 'get'
  })
}

// 设置菜单状态
export function setMenuStatus(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/menu/set`,
    method: 'post',
    data
  })
}

// 获取微信设置
export function getWechatSettings(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/settings`,
    method: 'get'
  })
}

// 更新微信设置
export function updateWechatSettings(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/settings`,
    method: 'post',
    data
  })
}

// 同步微信菜单
export function syncWechatMenu(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/menu/sync`,
    method: 'post'
  })
}

// 清除微信菜单
export function clearWechatMenu(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/menu/clear`,
    method: 'post'
  })
}

// ==================== 素材管理相关 API ====================

// 获取微信素材列表
export function getWechatMaterials(branchId, type = 'news', params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/materials/${type}`,
    method: 'get',
    params
  })
}

// 上传素材
export function uploadMaterial(branchId, type, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/materials/${type}/upload`,
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 删除素材
export function deleteMaterial(branchId, type, mediaId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/materials/${type}/${mediaId}`,
    method: 'delete'
  })
}

// 获取素材详情
export function getMaterialDetail(branchId, type, mediaId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/materials/${type}/${mediaId}`,
    method: 'get'
  })
}

// ==================== 关键字回复相关 API ====================

// 获取关键字回复列表
export function getKeywordReplies(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/keywords`,
    method: 'get',
    params
  })
}

// 创建关键字回复
export function createKeywordReply(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/keywords`,
    method: 'post',
    data
  })
}

// 更新关键字回复
export function updateKeywordReply(branchId, id, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/keywords/${id}`,
    method: 'put',
    data
  })
}

// 删除关键字回复
export function deleteKeywordReply(branchId, id) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/keywords/${id}`,
    method: 'delete'
  })
}

// 获取关键字回复详情
export function getKeywordReplyDetail(branchId, id) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/keywords/${id}`,
    method: 'get'
  })
}

// 批量更新关键字状态
export function batchUpdateKeywordStatus(branchId, ids, status) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/keywords/batch-status`,
    method: 'post',
    data: {
      ids,
      status
    }
  })
}

// ==================== 微信账号相关 API ====================

// 获取微信账号信息
export function getWechatAccountInfo(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/account`,
    method: 'get'
  })
}

// 更新微信账号信息
export function updateWechatAccount(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/account`,
    method: 'post',
    data
  })
}

// 获取微信二维码
export function getWechatQrcode(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/qrcode`,
    method: 'get',
    params
  })
}

// 刷新微信Token
export function refreshWechatToken(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/token/refresh`,
    method: 'post'
  })
}

// ==================== 粉丝管理相关 API ====================

// 获取粉丝列表
export function getWechatFans(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fans`,
    method: 'get',
    params
  })
}

// 获取粉丝详情
export function getFanDetail(branchId, openid) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fans/${openid}`,
    method: 'get'
  })
}

// 同步粉丝数据
export function syncWechatFans(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/fans/sync`,
    method: 'post'
  })
}

// ==================== 消息群发相关 API ====================

// 获取群发消息列表
export function getMassMessages(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/mass-messages`,
    method: 'get',
    params
  })
}

// 创建群发消息
export function createMassMessage(branchId, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/mass-messages`,
    method: 'post',
    data
  })
}

// 发送群发消息
export function sendMassMessage(branchId, id) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/mass-messages/${id}/send`,
    method: 'post'
  })
}

// 删除群发消息
export function deleteMassMessage(branchId, id) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/mass-messages/${id}`,
    method: 'delete'
  })
}

// 获取群发消息统计
export function getMassMessageStats(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/mass-messages/stats`,
    method: 'get'
  })
}

// 获取群发消息详情
export function getMassMessageDetail(branchId, id) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/mass-messages/${id}`,
    method: 'get'
  })
}

// 更新群发消息
export function updateMassMessage(branchId, id, data) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/mass-messages/${id}`,
    method: 'put',
    data
  })
}

// ==================== 微信统计相关 API ====================

// 获取微信统计数据
export function getWechatStats(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/stats`,
    method: 'get',
    params
  })
}

// 获取菜单点击统计
export function getMenuClickStats(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/stats/menu-clicks`,
    method: 'get',
    params
  })
}

// 获取消息统计
export function getMessageStats(branchId, params = {}) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/stats/messages`,
    method: 'get',
    params
  })
}

// ==================== 辅助功能 API ====================

// 检查微信配置
export function checkWechatConfig(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/check-config`,
    method: 'get'
  })
}

// 测试微信连接
export function testWechatConnection(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/test-connection`,
    method: 'post'
  })
}

// 获取微信JS SDK签名
export function getWechatJSSDKSignature(branchId, url) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/jssdk-signature`,
    method: 'get',
    params: { url }
  })
}

// 预览菜单
export function previewMenu(branchId, menuData) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/menu/preview`,
    method: 'post',
    data: {
      menu_data: menuData
    }
  })
}

// 导出菜单配置
export function exportMenuConfig(branchId, id) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/menu/${id}/export`,
    method: 'get',
    responseType: 'blob'
  })
}

// 导入菜单配置
export function importMenuConfig(branchId, file) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/menu/import`,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取菜单显示状态
export function getDisplayStatus(branchId) {
  return request({
    url: `/api/admin/v1/branches/${branchId}/wechat/menu/display-status`,
    method: 'get'
  })
}

// 设置菜单显示状态
export function setDisplayStatus(data) {
  return request({
    url: `/api/admin/v1/branches/1/wechat/menu/display-status`,
    method: 'post',
    data
  })
}

// 保存菜单配置
export function saveMenu(data) {
  return request({
    url: `/api/admin/v1/branches/1/wechat/menu`,
    method: 'post',
    data
  })
}

// 发布菜单到微信
export function publishMenuToWechat(data) {
  return request({
    url: `/api/admin/v1/branches/1/wechat/menu/publish`,
    method: 'post',
    data
  })
}

// 获取关键字列表（兼容性函数）
export function getKeywordList(branchId, params = {}) {
  return getKeywordReplies(branchId, params)
}

// 获取素材列表（兼容性函数）
export function getMaterialList(branchId, type = 'news', params = {}) {
  return getWechatMaterials(branchId, type, params)
}

// ==================== 组件兼容性方法别名 ====================

// 为了与Menu.vue组件兼容，添加方法别名
export const branchWechatMenuApi = {
  // 获取菜单数据
  getMenus: (branchId) => getMenuList(branchId),
  
  // 保存菜单数据
  saveMenus: (branchId, data) => saveMenuData(branchId, data),
  
  // 同步微信菜单
  syncFromWechat: (branchId) => syncWechatMenu(branchId),
  
  // 发布到微信
  publishToWechat: (branchId, id = null) => {
    if (id) {
      return publishMenu(branchId, id)
    } else {
      // 如果没有指定ID，发布当前菜单
      return publishMenuToWechat({ branchId })
    }
  },
  
  // 获取模板列表
  getTemplates: (branchId) => getMenuList(branchId), // 暂时使用菜单列表作为模板
  
  // 应用模板
  applyTemplate: (branchId, data) => saveMenuData(branchId, data),
  
  // 获取微信配置
  getWechatConfig: (branchId) => getWechatAccountInfo(branchId),
  
  // 获取分支机构信息
  getBranchInfo: (branchId) => getWechatAccountInfo(branchId)
}

// 导出默认对象以支持解构导入
export default {
  getMenuList,
  getMenuDetail,
  saveMenuData,
  publishMenu,
  deleteMenu,
  copyMenu,
  getCurrentMenu,
  setMenuStatus,
  getWechatSettings,
  updateWechatSettings,
  syncWechatMenu,
  clearWechatMenu,
  getWechatMaterials,
  uploadMaterial,
  deleteMaterial,
  getMaterialDetail,
  getKeywordReplies,
  createKeywordReply,
  updateKeywordReply,
  deleteKeywordReply,
  getKeywordReplyDetail,
  getWechatAccountInfo,
  updateWechatAccount,
  getWechatQrcode,
  refreshWechatToken,
  getWechatFans,
  getFanDetail,
  syncWechatFans,
  getMassMessages,
  createMassMessage,
  sendMassMessage,
  deleteMassMessage,
  getMassMessageStats,
  getMassMessageDetail,
  updateMassMessage,
  getWechatStats,
  getMenuClickStats,
  getMessageStats,
  checkWechatConfig,
  testWechatConnection,
  getWechatJSSDKSignature,
  previewMenu,
  exportMenuConfig,
  importMenuConfig,
  getDisplayStatus,
  setDisplayStatus,
  saveMenu,
  publishMenuToWechat,
  getKeywordList,
  getMaterialList,
  branchWechatMenuApi
} 