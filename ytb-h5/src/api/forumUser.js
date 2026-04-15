import request from '@/utils/request'

export function getForumUserProfile() {
  return request({
    url: '/api/mobile/v1/forum/user/profile',
    method: 'get'
  })
}

export function activateForumUser() {
  return request({
    url: '/api/mobile/v1/forum/user/activate',
    method: 'post'
  })
}
