const ADMIN_TOKEN_KEY = 'admin_token'
const ADMIN_USER_KEY = 'admin_user_info'
const ADMIN_LOGIN_TIME_KEY = 'admin_login_time'
const LEGACY_TOKEN_KEY = 'token'
const LEGACY_USER_KEY = 'userInfo'
const LEGACY_LOGIN_TIME_KEY = 'login_time'

const stores = [
  typeof window !== 'undefined' ? window.localStorage : null,
  typeof window !== 'undefined' ? window.sessionStorage : null
].filter(Boolean)

const safeOps = {
  get(storage, key) {
    try {
      return storage.getItem(key)
    } catch (error) {
      console.warn('[admin-auth] 读取Storage失败', key, error)
      return null
    }
  },
  set(storage, key, value) {
    try {
      if (value === null || value === undefined) {
        storage.removeItem(key)
      } else {
        storage.setItem(key, value)
      }
    } catch (error) {
      console.warn('[admin-auth] 写入Storage失败', key, error)
    }
  },
  remove(storage, key) {
    try {
      storage.removeItem(key)
    } catch (error) {
      console.warn('[admin-auth] 删除Storage失败', key, error)
    }
  }
}

const readFromStores = (key) => {
  for (const store of stores) {
    const value = safeOps.get(store, key)
    if (value) {
      return value
    }
  }
  return null
}

const writeToStores = (key, value) => {
  for (const store of stores) {
    safeOps.set(store, key, value)
  }
}

const removeFromStores = (key) => {
  for (const store of stores) {
    safeOps.remove(store, key)
  }
}

export function getAdminToken() {
  const current = readFromStores(ADMIN_TOKEN_KEY)
  if (current) {
    return current
  }
  const legacy = readFromStores(LEGACY_TOKEN_KEY)
  if (legacy) {
    setAdminToken(legacy)
    return legacy
  }
  return null
}

export function setAdminToken(token, { mirrorLegacy = false } = {}) {
  if (!token) {
    clearAdminToken({ clearLegacy: mirrorLegacy })
    return
  }
  writeToStores(ADMIN_TOKEN_KEY, token)
  if (mirrorLegacy) {
    writeToStores(LEGACY_TOKEN_KEY, token)
  }
}

export function clearAdminToken({ clearLegacy = true } = {}) {
  removeFromStores(ADMIN_TOKEN_KEY)
  if (clearLegacy) {
    removeFromStores(LEGACY_TOKEN_KEY)
  }
}

export function getAdminUserInfo() {
  const current = readFromStores(ADMIN_USER_KEY)
  if (current) {
    try {
      return JSON.parse(current)
    } catch (error) {
      console.warn('[admin-auth] 解析admin userInfo失败', error)
    }
  }
  const legacy = readFromStores(LEGACY_USER_KEY)
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy)
      setAdminUserInfo(parsed)
      return parsed
    } catch (error) {
      console.warn('[admin-auth] 解析legacy userInfo失败', error)
    }
  }
  return {}
}

export function setAdminUserInfo(userInfo = {}, { mirrorLegacy = false } = {}) {
  const payload = JSON.stringify(userInfo || {})
  writeToStores(ADMIN_USER_KEY, payload)
  if (mirrorLegacy) {
    writeToStores(LEGACY_USER_KEY, payload)
  }
}

export function clearAdminUserInfo({ clearLegacy = true } = {}) {
  removeFromStores(ADMIN_USER_KEY)
  if (clearLegacy) {
    removeFromStores(LEGACY_USER_KEY)
  }
}

export function getAdminLoginTime() {
  return readFromStores(ADMIN_LOGIN_TIME_KEY) || readFromStores(LEGACY_LOGIN_TIME_KEY)
}

export function setAdminLoginTime(value, { mirrorLegacy = false } = {}) {
  writeToStores(ADMIN_LOGIN_TIME_KEY, value)
  if (mirrorLegacy) {
    writeToStores(LEGACY_LOGIN_TIME_KEY, value)
  }
}

export function clearAdminLoginTime({ clearLegacy = true } = {}) {
  removeFromStores(ADMIN_LOGIN_TIME_KEY)
  if (clearLegacy) {
    removeFromStores(LEGACY_LOGIN_TIME_KEY)
  }
}

export function clearAdminAuthState() {
  clearAdminToken()
  clearAdminUserInfo()
  clearAdminLoginTime()
}

export function ensureAdminAuthState() {
  const token = readFromStores(ADMIN_TOKEN_KEY)
  const userInfo = readFromStores(ADMIN_USER_KEY)
  const loginTime = readFromStores(ADMIN_LOGIN_TIME_KEY)

  if (!token) {
    const legacyToken = readFromStores(LEGACY_TOKEN_KEY)
    if (legacyToken) {
      setAdminToken(legacyToken)
    }
  }

  if (!userInfo) {
    const legacyInfo = readFromStores(LEGACY_USER_KEY)
    if (legacyInfo) {
      try {
        setAdminUserInfo(JSON.parse(legacyInfo))
      } catch (error) {
        console.warn('[admin-auth] 初始化legacy userInfo失败', error)
      }
    }
  }

  if (!loginTime) {
    const legacyLoginTime = readFromStores(LEGACY_LOGIN_TIME_KEY)
    if (legacyLoginTime) {
      setAdminLoginTime(legacyLoginTime)
    }
  }
}
