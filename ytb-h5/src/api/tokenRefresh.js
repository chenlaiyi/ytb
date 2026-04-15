import request from '@/utils/request'

/**
 * 延长令牌有效期
 * 用于解决微信登录后5秒提示令牌过期的问题
 */
export function extendToken() {
  return request({
    url: '/Tapp/admin/api/user/extend_token.php',
    method: 'post',
    skipAuthToken: false // 需要带令牌
  })
}
