import request from '@/utils/request'

const LEGACY_INSTALLATION_BASE = '/Tapp/admin/api/admin/installation'
const V1_INSTALLATION_BASE = '/api/admin/v1/installation'
const V1_FLAG = (import.meta.env?.VITE_USE_V1_INSTALLATION_API ?? 'true') !== 'false'

async function callInstallationApi(v1Config, legacyConfig) {
  if (V1_FLAG && v1Config) {
    try {
      return await request({
        skipErrorToast: true,
        ...v1Config
      })
    } catch (error) {
      console.warn('[installation-api] V1 API 调用失败，尝试降级至 legacy：', error?.message || error)
      if (!legacyConfig) throw error
    }
  }

  if (!legacyConfig) {
    throw new Error('Legacy 安装预约 API 未配置')
  }

  return request(legacyConfig)
}

export function getAdminInstallStats(params) {
  return callInstallationApi(
    {
      url: `${V1_INSTALLATION_BASE}/statistics`,
      method: 'get',
      params
    },
    {
      url: `${LEGACY_INSTALLATION_BASE}/statistics.php`,
      method: 'get',
      params
    }
  )
}

export function getAdminInstallBookings(params) {
  return callInstallationApi(
    {
      url: `${V1_INSTALLATION_BASE}/bookings`,
      method: 'get',
      params
    },
    {
      url: `${LEGACY_INSTALLATION_BASE}/list_bookings.php`,
      method: 'get',
      params
    }
  )
}

export function getAdminInstallBookingDetail(params = {}) {
  const id = params?.id
  if (!id) {
    return Promise.reject(new Error('缺少预约ID'))
  }

  return callInstallationApi(
    {
      url: `${V1_INSTALLATION_BASE}/bookings/${id}`,
      method: 'get'
    },
    {
      url: `${LEGACY_INSTALLATION_BASE}/get_booking_details.php`,
      method: 'get',
      params
    }
  )
}

export function updateAdminInstallBookingStatus(data = {}) {
  const id = data?.id
  if (!id) {
    return Promise.reject(new Error('缺少预约ID'))
  }

  const payload = { ...data }
  delete payload.id

  return callInstallationApi(
    {
      url: `${V1_INSTALLATION_BASE}/bookings/${id}/status`,
      method: 'put',
      data: payload
    },
    {
      url: `${LEGACY_INSTALLATION_BASE}/update_booking_status.php`,
      method: 'post',
      data
    }
  )
}
