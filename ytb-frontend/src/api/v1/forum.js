import request from '@/utils/request'

export function getForumSections(params) {
  return request({
    url: '/api/admin/v1/forum/sections',
    method: 'get',
    params
  })
}

export function createForumSection(data) {
  return request({
    url: '/api/admin/v1/forum/sections',
    method: 'post',
    data
  })
}

export function updateForumSection(id, data) {
  return request({
    url: `/api/admin/v1/forum/sections/${id}`,
    method: 'put',
    data
  })
}

export function updateForumSectionStatus(id, status) {
  return request({
    url: `/api/admin/v1/forum/sections/${id}/status`,
    method: 'put',
    data: { status }
  })
}

export function archiveForumSection(id) {
  return request({
    url: `/api/admin/v1/forum/sections/${id}`,
    method: 'delete'
  })
}

export function getForumThreads(params) {
  return request({
    url: '/api/admin/v1/forum/threads',
    method: 'get',
    params
  })
}

export function getForumThreadDetail(id) {
  return request({
    url: `/api/admin/v1/forum/threads/${id}`,
    method: 'get'
  })
}

export function updateForumThread(id, data) {
  return request({
    url: `/api/admin/v1/forum/threads/${id}`,
    method: 'put',
    data
  })
}

export function getForumReplies(threadId, params) {
  return request({
    url: `/api/admin/v1/forum/threads/${threadId}/replies`,
    method: 'get',
    params
  })
}

export function updateForumReplyStatus(id, status) {
  return request({
    url: `/api/admin/v1/forum/replies/${id}/status`,
    method: 'put',
    data: { status }
  })
}

export function getForumUsers(params) {
  return request({
    url: '/api/admin/v1/forum/users',
    method: 'get',
    params
  })
}
