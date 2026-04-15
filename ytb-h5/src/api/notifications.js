import request from '@/utils/request'

// 获取通知列表
export function getNotifications(params) {
  return request({
    url: '/admin/api/merchant/notifications.php',
    method: 'get',
    params
  })
}

// 标记通知为已读
export function markNotificationAsRead(id) {
  return request({
    url: `/admin/api/merchant/notifications.php?action=read&id=${id}`,
    method: 'post'
  })
}

// 标记所有通知为已读
export function markAllNotificationsAsRead() {
  return request({
    url: '/admin/api/merchant/notifications.php?action=read-all',
    method: 'post'
  })
}

// 清空所有通知
export function clearNotifications() {
  return request({
    url: '/admin/api/merchant/notifications.php?action=clear',
    method: 'delete'
  })
}

// 获取未读通知数量
export function getUnreadNotificationCount() {
  return request({
    url: '/admin/api/merchant/notifications.php?action=unread-count',
    method: 'get'
  })
}

// 获取通知设置
export function getNotificationSettings() {
  return request({
    url: '/admin/api/merchant/notifications.php?action=settings',
    method: 'get'
  })
}

// 更新通知设置
export function updateNotificationSettings(data) {
  return request({
    url: '/admin/api/merchant/notifications.php?action=settings',
    method: 'post',
    data
  })
} 