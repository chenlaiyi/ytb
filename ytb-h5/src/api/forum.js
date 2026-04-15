import request from '@/utils/request'

/**
 * 获取讨论区列表
 * @param {Object} params
 * @returns {Promise}
 */
export function fetchForumSections(params = {}) {
  return request({
    url: '/api/mobile/v1/forum/sections',
    method: 'get',
    params
  })
}

/**
 * 创建新的讨论区
 * @param {Object} data
 * @returns {Promise}
 */
export function createForumSection(data) {
  return request({
    url: '/api/mobile/v1/forum/sections',
    method: 'post',
    data
  })
}

/**
 * 获取讨论区的帖子列表
 * @param {number} sectionId
 * @param {Object} params
 * @returns {Promise}
 */
export function fetchThreads(sectionId, params = {}) {
  return request({
    url: `/api/mobile/v1/forum/sections/${sectionId}/threads`,
    method: 'get',
    params
  })
}

/**
 * 在讨论区内创建帖子
 * @param {number} sectionId
 * @param {Object} data
 * @returns {Promise}
 */
export function createThread(sectionId, data) {
  return request({
    url: `/api/mobile/v1/forum/sections/${sectionId}/threads`,
    method: 'post',
    data
  })
}

/**
 * 获取帖子详情
 * @param {number} threadId
 * @returns {Promise}
 */
export function fetchThreadDetail(threadId) {
  return request({
    url: `/api/mobile/v1/forum/threads/${threadId}`,
    method: 'get'
  })
}

/**
 * 回复帖子
 * @param {number} threadId
 * @param {Object} data
 * @returns {Promise}
 */
export function replyThread(threadId, data) {
  return request({
    url: `/api/mobile/v1/forum/threads/${threadId}/replies`,
    method: 'post',
    data
  })
}

export function uploadForumImage(formData) {
  return request({
    url: '/api/mobile/v1/forum/uploads/image',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
