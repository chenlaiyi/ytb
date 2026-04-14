import service from '@/utils/request'

const BASE_URL = '/api/admin/v1/wechat'

// ========================================
// 粉丝管理
// ========================================

// 获取粉丝列表
export function getFansList(params) {
  return service({
    url: `${BASE_URL}/fans`,
    method: 'get',
    params
  })
}

// 获取粉丝统计
export function getFansStatistics() {
  return service({
    url: `${BASE_URL}/fans/statistics`,
    method: 'get'
  })
}

// 获取粉丝详情
export function getFanDetail(id) {
  return service({
    url: `${BASE_URL}/fans/${id}`,
    method: 'get'
  })
}

// 更新粉丝备注
export function updateFanRemark(id, remark) {
  return service({
    url: `${BASE_URL}/fans/${id}/remark`,
    method: 'put',
    data: { remark }
  })
}

// 同步粉丝数据
export function syncFans() {
  return service({
    url: `${BASE_URL}/fans/sync`,
    method: 'post'
  })
}

// ========================================
// 自定义菜单
// ========================================

// 获取菜单列表
export function getMenuList() {
  return service({
    url: `${BASE_URL}/menus`,
    method: 'get'
  })
}

// 获取菜单类型选项
export function getMenuTypeOptions() {
  return service({
    url: `${BASE_URL}/menus/type-options`,
    method: 'get'
  })
}

// 创建菜单
export function createMenu(data) {
  return service({
    url: `${BASE_URL}/menus`,
    method: 'post',
    data
  })
}

// 更新菜单
export function updateMenu(id, data) {
  return service({
    url: `${BASE_URL}/menus/${id}`,
    method: 'put',
    data
  })
}

// 删除菜单
export function deleteMenu(id) {
  return service({
    url: `${BASE_URL}/menus/${id}`,
    method: 'delete'
  })
}

// 批量保存菜单
export function batchSaveMenus(menus) {
  return service({
    url: `${BASE_URL}/menus/batch-save`,
    method: 'post',
    data: { menus }
  })
}

// 发布菜单
export function publishMenus() {
  return service({
    url: `${BASE_URL}/menus/publish`,
    method: 'post'
  })
}

// ========================================
// 自动回复
// ========================================

// 获取自动回复列表
export function getReplyList(params) {
  return service({
    url: `${BASE_URL}/replies`,
    method: 'get',
    params
  })
}

// 获取回复类型选项
export function getReplyTypeOptions() {
  return service({
    url: `${BASE_URL}/replies/type-options`,
    method: 'get'
  })
}

// 创建自动回复
export function createReply(data) {
  return service({
    url: `${BASE_URL}/replies`,
    method: 'post',
    data
  })
}

// 获取自动回复详情
export function getReplyDetail(id) {
  return service({
    url: `${BASE_URL}/replies/${id}`,
    method: 'get'
  })
}

// 更新自动回复
export function updateReply(id, data) {
  return service({
    url: `${BASE_URL}/replies/${id}`,
    method: 'put',
    data
  })
}

// 删除自动回复
export function deleteReply(id) {
  return service({
    url: `${BASE_URL}/replies/${id}`,
    method: 'delete'
  })
}

// 切换自动回复状态
export function toggleReplyStatus(id) {
  return service({
    url: `${BASE_URL}/replies/${id}/toggle-status`,
    method: 'post'
  })
}

// ========================================
// 二维码管理
// ========================================

// 获取二维码列表
export function getQrcodeList(params) {
  return service({
    url: `${BASE_URL}/qrcodes`,
    method: 'get',
    params
  })
}

// 获取二维码统计
export function getQrcodeStatistics() {
  return service({
    url: `${BASE_URL}/qrcodes/statistics`,
    method: 'get'
  })
}

// 创建二维码
export function createQrcode(data) {
  return service({
    url: `${BASE_URL}/qrcodes`,
    method: 'post',
    data
  })
}

// 获取二维码详情
export function getQrcodeDetail(id) {
  return service({
    url: `${BASE_URL}/qrcodes/${id}`,
    method: 'get'
  })
}

// 更新二维码
export function updateQrcode(id, data) {
  return service({
    url: `${BASE_URL}/qrcodes/${id}`,
    method: 'put',
    data
  })
}

// 删除二维码
export function deleteQrcode(id) {
  return service({
    url: `${BASE_URL}/qrcodes/${id}`,
    method: 'delete'
  })
}

// 切换二维码状态
export function toggleQrcodeStatus(id) {
  return service({
    url: `${BASE_URL}/qrcodes/${id}/toggle-status`,
    method: 'post'
  })
}

// 重新生成二维码
export function regenerateQrcode(id) {
  return service({
    url: `${BASE_URL}/qrcodes/${id}/regenerate`,
    method: 'post'
  })
}
