const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '')

export function getYtbSiteOrigin() {
  if (import.meta.env.VITE_YTB_SITE_URL) {
    return trimTrailingSlash(import.meta.env.VITE_YTB_SITE_URL)
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return trimTrailingSlash(window.location.origin)
  }

  return 'https://pay.itapgo.com'
}

export function getYtbApiBaseUrl() {
  return import.meta.env.VITE_YTB_API_BASE_URL || `${getYtbSiteOrigin()}/api/ytb`
}

export function getYtbHashRoute(path = '/ytb') {
  const appBase = import.meta.env.VITE_APP_BASE || import.meta.env.BASE_URL || '/app/'
  const normalizedBase = appBase === '/' ? '' : trimTrailingSlash(appBase)
  return `${normalizedBase}/#${path.startsWith('/') ? path : `/${path}`}`
}

export function getYtbLoginUrl(inviteCode = '') {
  const base = import.meta.env.VITE_YTB_LOGIN_URL || `${getYtbSiteOrigin()}${getYtbHashRoute('/ytb/login')}`
  return inviteCode ? `${base}?invite_code=${encodeURIComponent(inviteCode)}` : base
}

export function getYtbRegisterUrl(inviteCode = '') {
  const base = import.meta.env.VITE_YTB_REGISTER_URL || `${getYtbSiteOrigin()}${getYtbHashRoute('/ytb/register')}`
  return inviteCode ? `${base}?invite_code=${encodeURIComponent(inviteCode)}` : base
}
