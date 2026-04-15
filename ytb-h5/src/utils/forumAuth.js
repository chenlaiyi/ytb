import { showToast } from 'vant'
import { getWechatLoginUrl } from '@/api/user'
import { isWechatBrowser } from '@/utils/wechat'

let loginInFlight = false
const REDIRECT_CACHE_PREFIX = 'forum_redirect:'

const buildCallbackUrl = () => {
  const { protocol, host } = window.location
  return `${protocol}//${host}/app/#/wechat-callback`
}

const normalizeRedirectPath = (path) => {
  if (!path) return '/forum'
  let target = path

  try {
    target = decodeURIComponent(target)
  } catch (error) {
    // ignore decode failures
  }

  if (target.startsWith('#/')) {
    target = target.slice(1)
  }

  if (!target.startsWith('/')) {
    target = `/${target.replace(/^#?/, '')}`
  }

  return target || '/forum'
}

/**
 * 启动论坛登录流程（微信授权）
 * @param {string} redirectPath 登录后需要跳转的路径
 * @returns {Promise<boolean>}
 */
export const startForumLogin = async (redirectPath = '/forum') => {
  if (!isWechatBrowser()) {
    showToast('请在微信中打开后参与讨论')
    return false
  }

  if (loginInFlight) {
    return false
  }

  loginInFlight = true

  try {
    const normalizedPath = normalizeRedirectPath(redirectPath)
    const timestamp = Date.now()
    const randomParam = Math.floor(Math.random() * 1000)
    const encodedPath = encodeURIComponent(normalizedPath)
    const directState = `FORUM2|d|${encodedPath}|${timestamp}|${randomParam}`
    let statePayload = directState

    if (directState.length > 110) {
      const key = `${timestamp.toString(36)}${Math.random().toString(36).slice(2, 10)}`
      try {
        localStorage.setItem(`${REDIRECT_CACHE_PREFIX}${key}`, normalizedPath)
      } catch (error) {
        console.warn('[ForumAuth] 缓存重定向路径失败，将使用精简路径', error)
      }
      statePayload = `FORUM2|k|${key}|${timestamp}|${randomParam}`
    }

    const response = await getWechatLoginUrl({
      redirect_uri: buildCallbackUrl(),
      state: statePayload
    })

    if (response?.code === 0 && response.data?.url) {
      window.location.href = response.data.url
      return true
    }

    showToast(response?.message || '获取登录链接失败，请稍后重试')
    return false
  } catch (error) {
    console.error('[ForumAuth] 获取论坛登录链接失败', error)
    showToast('网络异常，请稍后再试')
    return false
  } finally {
    loginInFlight = false
  }
}

export default {
  startForumLogin
}
