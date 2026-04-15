请你执行<template>
  <div class="filter-alert-detail">
    <NavBar title="滤芯预警工单详情" left-arrow @click-left="$router.go(-1)" />
    
    <div class="content" v-if="!loading">
      <!-- 设备头部信息 -->
      <div class="device-header">
        <div class="device-main">
          <div class="device-number">{{ getDeviceNumber(orderDetail) }}</div>
          <div class="device-meta">
            <span class="activation-date">激活时间：{{ getActivatedAt(orderDetail) }}</span>
          </div>
        </div>
        <div class="alert-status">
          <van-icon name="warning" />
          <span>滤芯预警</span>
        </div>
      </div>

      <!-- TDS 数据卡片（位于激活时间之后） -->
      <div class="info-card tds-card">
        <div class="card-header">
          <van-icon name="balance-list" />
          <span>TDS数据</span>
        </div>
        <div class="customer-info">
          <div class="customer-main">
            <div class="customer-name">原水TDS</div>
            <div class="customer-phone" style="background:#f5f7fa;color:#333;">
              {{ isNumber(orderDetail?.tds?.raw) ? orderDetail.tds.raw + ' ppm' : '—' }}
            </div>
          </div>
          <div class="customer-address" style="justify-content: space-between;">
            <span>净水TDS</span>
            <span>{{ isNumber(orderDetail?.tds?.pure) ? orderDetail.tds.pure + ' ppm' : '—' }}</span>
          </div>
        </div>
      </div>

      <!-- 套餐使用情况卡片（位于激活时间之后） -->
      <div class="info-card plan-card">
        <div class="card-header">
          <van-icon name="gift" />
          <span>套餐使用情况</span>
        </div>
        <div class="customer-info">
          <div class="customer-main">
            <div class="customer-name">套餐名称</div>
            <div class="customer-phone" style="background:#f5f7fa;color:#333;">
              {{ plan.name || '—' }}
            </div>
          </div>
          <div class="customer-address" style="justify-content: space-between;">
            <span>有效期</span>
            <span>{{ planPeriod }}</span>
          </div>
          <div class="customer-address" style="justify-content: space-between;">
            <span>使用进度</span>
            <span>{{ isNumber(plan.usage_percent) ? (plan.usage_percent + '%') : '—' }}</span>
          </div>
          <div class="customer-address" style="justify-content: space-between;">
            <span>剩余流量</span>
            <span>{{ isNumber(plan.remaining_flow) ? plan.remaining_flow : '—' }}</span>
          </div>
          <div class="customer-address" style="justify-content: space-between;">
            <span>剩余天数</span>
            <span>{{ isNumber(plan.remaining_days) ? (plan.remaining_days + ' 天') : '—' }}</span>
          </div>
          <div class="customer-address" style="justify-content: space-between;">
            <span>状态</span>
            <span :class="['badge', planStatusClass]">{{ planStatusText }}</span>
          </div>
        </div>
      </div>

      <!-- 客户信息卡片 -->
      <div class="info-card customer-card">
        <div class="card-header">
          <van-icon name="contact" />
          <span>客户信息</span>
        </div>
        <div class="customer-info">
          <div class="customer-main">
            <div class="customer-name">{{ orderDetail.client_name || '—' }}</div>
            <div class="customer-phone" @click="callPhone">
              <van-icon name="phone" />
              {{ orderDetail.client_phone || '—' }}
            </div>
          </div>
          <div class="customer-address">
            <van-icon name="location" />
            {{ orderDetail.address || '—' }}
          </div>
        </div>
      </div>

      <!-- 套餐信息卡片 -->
      <div class="info-card package-card" v-if="orderDetail.package_info">
        <div class="card-header">
          <van-icon name="gift" />
          <span>套餐信息</span>
        </div>
        <div class="package-info">
          <div class="package-name">{{ orderDetail.package_info.name }}</div>
          <div class="package-usage">
            <div class="usage-item" v-if="orderDetail.package_info.type === 1">
              <span class="usage-label">剩余天数</span>
              <span class="usage-value" :class="getDaysColorClass(orderDetail.package_info.remaining_days)">
                {{ orderDetail.package_info.remaining_days }}天
              </span>
            </div>
            <div class="usage-item" v-if="orderDetail.package_info.type === 2">
              <span class="usage-label">剩余流量</span>
              <span class="usage-value">
                {{ formatFlow(orderDetail.package_info.remaining_flow) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 滤芯状态卡片 -->
      <div class="info-card filter-card">
        <div class="card-header">
          <div class="header-icon">
            <van-icon name="filter" />
          </div>
          <span>滤芯信息</span>
          <div class="filter-status-badge">
            {{ getFilterAlertCount() }}个需要关注
          </div>
        </div>
        <div class="filter-list">
          <!-- 动态显示滤芯 -->
          <div 
            v-for="filter in orderDetail.filters" 
            :key="filter.id"
            :class="['filter-item', `filter-item-${filter.status}`]">
            <div class="filter-header">
              <div :class="['filter-icon', getFilterIconClass(filter.code)]">
                <van-icon :name="getFilterIcon(filter.code)" />
              </div>
              <div class="filter-details">
                <div class="filter-name">{{ filter.name }}</div>
                <div class="filter-flow-info">
                  剩余：{{ filter.remaining_flow }}L / {{ filter.total_flow }}L
                </div>
              </div>
              <div :class="['filter-percentage', `filter-${filter.status}`]">
                {{ filter.remaining_percentage }}%
              </div>
            </div>
            <div class="filter-footer">
              <van-button 
                v-if="filter.status === 'critical'"
                size="small" 
                type="danger"
                plain
                round
                class="replace-btn"
                @click="replaceFilter(filter)">
                立即更换
              </van-button>
              <van-button 
                size="small" 
                type="default"
                plain
                round
                class="reset-btn"
                :loading="resetLoading[filter.id]"
                @click="resetFilter(filter, filter.id)">
                复位
              </van-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 设备控制卡片 -->
      <div class="info-card controls-card">
        <div class="card-header">
          <van-icon name="setting" />
          <span>设备控制</span>
        </div>
        <div class="controls-grid">
          <van-button 
            class="control-button power-on" 
            :loading="controlLoading.power_on"
            @click="controlDevice('power_on')">
            <van-icon name="play-circle" />
            <span>开机</span>
          </van-button>
          <van-button 
            class="control-button power-off" 
            :loading="controlLoading.power_off"
            @click="controlDevice('power_off')">
            <van-icon name="pause-circle" />
            <span>关机</span>
          </van-button>
          <van-button 
            class="control-button flush" 
            :loading="controlLoading.flush"
            @click="controlDevice('flush')">
            <van-icon name="fire" />
            <span>强冲</span>
          </van-button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div class="loading-container" v-if="loading">
      <van-loading type="spinner" color="#1989fa" />
      <div class="loading-text">加载中...</div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="bottom-actions" v-if="!loading">
      <van-button 
        type="primary" 
        size="large" 
        block
        :loading="completeLoading"
        @click="completeOrder">
        完成工单
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NavBar, Icon, Button, Loading, Dialog, showConfirmDialog } from 'vant'
/* 安全 Toast 封装（完全不依赖 Toast.fail/success），仅用自定义实现 */
const safeToast = (() => {
  let loadingTimer = null
  const showBase = (msg) => {
    // 简易提示：使用原生 alert 作为兜底，避免第三方 API 兼容问题
    if (!msg) return
    try {
      // 如全局存在 window.vantToast 则调用
      if (window && typeof window.vantToast === 'function') return window.vantToast(msg)
    } catch {}
    try {
      // 微信开发者工具中 console 提示
      console.log('[Toast]', msg)
    } catch {}
  }
  return {
    success(msg) { showBase(msg) },
    fail(msg) { showBase(msg) },
    loading(msg = '加载中...') {
      showBase(msg)
      // 8 秒后自动清除提示标记（仅用于视觉提示）
      clearTimeout(loadingTimer); loadingTimer = setTimeout(() => { /* noop */ }, 8000)
    },
    clear() { clearTimeout(loadingTimer) }
  }
})()

const route = useRoute()
const router = useRouter()

// 读取 Token 辅助：兼容多键名与 Cookie
const getAuthToken = () => {
  try {
    const keyCandidates = [
      'token', 'auth_token', 'access_token',
      'Authorization', 'authorization', 'BearerToken'
    ]
    for (const k of keyCandidates) {
      const v = localStorage.getItem(k)
      if (v) return v.startsWith('Bearer ') ? v : `Bearer ${v}`
    }
  } catch {}
  // Cookie 兜底
  try {
    const m = document.cookie.match(/(?:^|;\s*)(token|auth_token|access_token)=([^;]+)/i)
    if (m) {
      const raw = decodeURIComponent(m[2])
      return raw.startsWith('Bearer ') ? raw : `Bearer ${raw}`
    }
  } catch {}
  return null
}

// 统一获取设备号：params > query > hash提取8位数字
const resolveDeviceNumber = () => {
  const p = route.params || {}
  const q = route.query || {}
  const fromParams = p.deviceNumber || p.device_number || p.id
  const fromQuery = q.deviceNumber || q.device_number
  if (fromParams && /^\d{8}$/.test(String(fromParams))) return String(fromParams)
  if (fromQuery && /^\d{8}$/.test(String(fromQuery))) return String(fromQuery)
  try {
    const h = window.location.hash || ''
    const m = h.match(/(\d{8})(?!\d)/)
    if (m) return m[1]
  } catch {}
  return null
}

const orderDetail = ref({
  device_number: '',
  activate_date: '',
  activation_date: '',
  client_name: '',
  client_phone: '',
  address: '',
  id: null,
  filters: []
})
const loading = ref(true)
const completeLoading = ref(false)
const resetLoading = ref({})
const controlLoading = reactive({
  power_on: false,
  power_off: false,
  flush: false
})

// 获取工单详情
const fetchOrderDetail = async () => {
  try {
    const bearer = getAuthToken()
    if (!bearer) {
      console.error('未找到登录token')
      // 跳登录并带回当前页面
      const ret = encodeURIComponent(location.hash || '/')
      router.push(`/login?redirect=${ret}`)
      return
    }

    const deviceNumber = resolveDeviceNumber()
    const orderId = route.params.id

    // 基本参数校验（设备编号优先，校验8位数字）
    let apiUrl = ''
    if (deviceNumber && /^\d{8}$/.test(String(deviceNumber))) {
      apiUrl = `/api/mobile/v1/engineer/filter-alert-device/${deviceNumber}`
    } else if (orderId) {
      apiUrl = `/api/mobile/v1/engineer/water-work-order/${orderId}`
    } else {
      safeToast.fail('参数错误：缺少设备编号或工单ID')
      loading.value = false
      return
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        // 同时携带多种头以兼容不同网关要求
        'Authorization': bearer,
        'X-Token': bearer.replace(/^Bearer\s+/i, ''),
        'token': bearer.replace(/^Bearer\s+/i, ''),
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        safeToast.fail('未登录，请先登录')
        const ret = encodeURIComponent(location.hash || '/')
        setTimeout(() => router.push(`/login?redirect=${ret}`), 500)
      }
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()
    // 兼容两种返回结构：{code:0,data} 或 直接 data 对象
    let data = null
    if (result && typeof result === 'object') {
      if (typeof result.code !== 'undefined') {
        if (result.code === 0) {
          data = result.data || null
        } else {
          throw new Error(result.message || '接口返回错误')
        }
      } else {
        // 扁平对象直接返回详情
        data = result
      }
    }

    if (!data) {
      safeToast.fail('获取详情失败')
      return
    }

    // 赋值与安全处理（扩展字段兼容）
    const activatedAt =
      data.activate_date ||
      data.activation_date ||
      data.activated_at ||
      data.activatedAt ||
      data.activationAt ||
      data.install_date ||
      ''
    // 地址优先使用现成字段，否则用省市区街道拼接
    const addrCandidate =
      data.address ||
      data.full_address ||
      data.install_address ||
      data.detail_address ||
      data.location ||
      data.client_address ||
      ''
    const addrComposed = [
      data.province,
      data.city,
      data.district || data.area,
      data.street,
      data.address_detail
    ].filter(Boolean).join('')
    const finalAddress = addrCandidate || addrComposed

    // 先合并后端 data 的一层键，确保 created_at 等可用；再覆盖我们需要的显示与兜底字段
    orderDetail.value = {
      ...data,
      // 设备编号（渲染时仍通过 getDeviceNumber，保证优先 client_device_name）
      device_number: data.device_number || data.deviceNo || data.sn || data.client_device_name || '',
      // 激活时间仍交由 getActivatedAt 动态解析
      activate_date: data.activate_date || data.activation_date || '',
      activation_date: data.activation_date || data.activate_date || '',
      // 透传常见嵌套对象，便于命中 wb_client.create_date
      clientEntity: data.clientEntity || data.client || null,
      client: data.client || null,
      clientInfo: data.clientInfo || data.client_info || null,
      wb_client: data.wb_client || data.wbClient || null,
      deviceEntity: data.deviceEntity || data.device || null,
      device: data.device || null,
      // 显式兜底：将可能的 create_date 透传
      raw_create_date: (data.client?.create_date) || (data.clientEntity?.create_date) || (data.clientInfo?.create_date) || (data.client_info?.create_date) || (data.wb_client?.create_date) || (data.wbClient?.create_date) || data.create_date || data.createDate || '',
      // 其它显示字段
      client_name: data.client_name || data.customer_name || data.name || '',
      client_phone: data.client_phone || data.phone || data.mobile || '',
      address: finalAddress,
      id: data.id || data.order_id || null,
      filters: Array.isArray(data.filters) ? data.filters : []
    }

    // 初始化每个滤芯的复位loading
    orderDetail.value.filters.forEach((f) => {
      const key = f.id ?? `${f.code || f.name || 'filter'}`
      resetLoading.value[key] = false
    })

  } catch (error) {
    console.error('获取详情失败:', error)
    safeToast.fail(error?.message || '网络错误，请重试')
  } finally {
    loading.value = false
  }
}

// 滤芯复位
const resetFilter = async (filter, filterId) => {
  try {
    await showConfirmDialog({
      title: '确认复位',
      message: `确定要复位${filter.name || filter.code || ''}吗？复位后滤芯寿命将重置为100%。`,
    })

    const key = filterId ?? (filter.id ?? `${filter.code || filter.name || 'filter'}`)
    resetLoading.value[key] = true
    const bearer = getAuthToken()
    if (!bearer) {
      safeToast.fail('未登录，请先登录')
      const ret = encodeURIComponent(location.hash || '/')
      setTimeout(() => router.push(`/login?redirect=${ret}`), 300)
      return
    }

    // 推断 max_key（增强识别逻辑）
    const codeLower = String(filter.code || filter.name || '').toLowerCase()
    let maxKey = ''
    
    // 优先按照滤芯编号识别
    if (codeLower.includes('f1') || codeLower.includes('pp')) {
      maxKey = 'F1FluxMax'
    } else if (codeLower.includes('f2') || codeLower.includes('cto')) {
      maxKey = 'F2FluxMax'
    } else if (codeLower.includes('f3') || codeLower.includes('ro')) {
      maxKey = 'F3FluxMax'
    } else if (codeLower.includes('f4')) {
      maxKey = 'F4FluxMax'
    } else if (codeLower.includes('f5')) {
      maxKey = 'F5FluxMax'
    }
    
    // 如果还是无法识别，尝试通过滤芯名称识别
    if (!maxKey) {
      if (codeLower.includes('pp棉') || codeLower.includes('聚丙烯')) {
        maxKey = 'F1FluxMax'
      } else if (codeLower.includes('活性炭') || codeLower.includes('炭棒')) {
        maxKey = 'F2FluxMax'
      } else if (codeLower.includes('反渗透') || codeLower.includes('ro膜')) {
        maxKey = 'F3FluxMax'
      }
    }

    const payload = {
      // 后端若需要设备编号，请读 device_number；若需要内部ID，后端做适配
      device_number: orderDetail.value.device_number || resolveDeviceNumber(),
      max_key: maxKey, // 确保 maxKey 总是有效
      filter_type: filter.code || filter.name || null,
      filter_id: filter.id || filterId || null // 确保 filter_id 优先使用 filter.id
    }

    const response = await fetch('/api/mobile/v1/engineer/reset-filter', {
      method: 'POST',
      headers: {
        'Authorization': bearer,
        'X-Token': bearer.replace(/^Bearer\s+/i, ''),
        'token': bearer.replace(/^Bearer\s+/i, ''),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (response.status === 401) {
      safeToast.fail('未登录，请先登录')
      const ret = encodeURIComponent(location.hash || '/')
      setTimeout(() => router.push(`/login?redirect=${ret}`), 300)
      return
    }
    const result = await response.json().catch(() => ({}))
    const ok = (result && (result.code === 0 || result.code === 200 || result.success === true))
    if (ok) {
      safeToast.success('滤芯复位成功')
      // 更新滤芯信息（前端就地更新，随后也可考虑重新拉取详情）
      const idx = orderDetail.value.filters.findIndex(f => (f.id ?? key) === (filter.id ?? key))
      if (idx !== -1) {
        const f = orderDetail.value.filters[idx]
        f.remaining_percentage = 100
        if (typeof f.total_flow === 'number') f.remaining_flow = f.total_flow
        f.status = 'normal'
      }
      // 重新拉取，确保预警计数与后端一致
      await fetchOrderDetail()
    } else {
      console.warn('reset_filter 响应异常:', result)
      safeToast.fail(result?.message || result?.msg || '滤芯复位失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('滤芯复位失败:', error)
      safeToast.fail('操作失败，请重试')
    }
  } finally {
    const key2 = filterId ?? (filter.id ?? `${filter.code || filter.name || 'filter'}`)
    resetLoading.value[key2] = false
  }
}

// 设备控制
const controlDevice = async (action) => {
  try {
    controlLoading[action] = true
    const token = localStorage.getItem('token')

    const actionNames = {
      power_on: '开机',
      power_off: '关机',
      flush: '强冲'
    }

    const response = await fetch('/api/mobile/v1/device/control', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_id: orderDetail.value.device_number, // 使用设备编号
        action,
        params: {}
      })
    })

    const result = await response.json()
    
    if ((result.code ?? 0) === 0) {
      safeToast.success(`设备${actionNames[action]}成功`)
    } else {
      safeToast.fail(result.message || `设备${actionNames[action]}失败`)
    }
  } catch (error) {
    console.error('设备控制失败:', error)
    safeToast.fail('操作失败，请重试')
  } finally {
    controlLoading[action] = false
  }
}

// 完成工单
const completeOrder = async () => {
  try {
    await Dialog.confirm({
      title: '确认完成',
      message: '确定要完成此滤芯预警工单吗？',
    })

    completeLoading.value = true
    const token = localStorage.getItem('token')
    
    const response = await fetch(`/api/mobile/v1/engineer/water-work-order/${orderDetail.value.id}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    const result2 = await response.json()
    
    if (result2.code === 0) {
      safeToast.success('工单完成成功')
      setTimeout(() => {
        router.go(-1)
      }, 1500)
    } else {
      safeToast.fail(result2.message || '完成工单失败')
    }
  } catch (error) {
    console.error('完成工单失败:', error)
    safeToast.fail('操作失败，请重试')
  } finally {
    completeLoading.value = false
  }
}

// 获取需要关注的滤芯数量
const getFilterAlertCount = () => {
  if (!orderDetail.value.filters) return 0
  return orderDetail.value.filters.filter(filter => 
    filter.status === 'critical' || filter.status === 'warning'
  ).length
}

// 根据滤芯代码获取图标
const getFilterIcon = (code) => {
  const codeStr = (code || '').toLowerCase()
  if (codeStr.includes('pp')) return 'filter-o'
  if (codeStr.includes('cto')) return 'fire-o'
  if (codeStr.includes('ro')) return 'diamond-o'
  return 'filter-o'
}

// 根据滤芯代码获取图标样式类
const getFilterIconClass = (code) => {
  const codeStr = (code || '').toLowerCase()
  if (codeStr.includes('pp')) return 'filter-icon-pp'
  if (codeStr.includes('cto')) return 'filter-icon-cto'
  if (codeStr.includes('ro')) return 'filter-icon-ro'
  return 'filter-icon-pp'
}


// 更换滤芯
const replaceFilter = async (filter) => {
  try {
    await Dialog.confirm({
      title: '确认更换',
      message: `确定要更换${filter.name}吗？`
    })
    
    // 这里可以添加更换滤芯的API调用
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用
    
    safeToast.success(`${filter.name}已更换`)
    // 重新获取工单详情以更新数据
    await fetchOrderDetail()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更换滤芯失败:', error)
      safeToast.fail('更换滤芯失败')
    }
  }
}

// 获取滤芯寿命颜色样式类
const getFilterLifeColorClass = (percentage) => {
  if (percentage >= 50) {
    return 'filter-life-good'  // 绿色
  } else if (percentage >= 20) {
    return 'filter-life-warning'  // 橙色
  } else {
    return 'filter-life-critical'  // 红色
  }
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 将多种时间输入（字符串/时间戳）规范化为 Date
 */
const normalizeDate = (val) => {
  if (!val && val !== 0) return null

  // 数字或数字字符串：可能是秒或毫秒
  if (typeof val === 'number' || (/^\d+$/.test(String(val)))) {
    const num = Number(val)
    if (num <= 0) return null
    const ms = num < 1e12 ? num * 1000 : num // 小于 10^12 视为秒
    const d = new Date(ms)
    return isNaN(d.getTime()) ? null : d
  }

  // 字符串：优先手动按本地时间解析，避免时区偏移
  if (typeof val === 'string') {
    const s0 = val.trim().replace('T', ' ').replace('Z', '')
    // 匹配 YYYY-MM-DD HH:mm:ss
    let m = s0.match(/^(\d{4})-(\d{2})-(\d{2})[ \u3000](\d{2}):(\d{2})(?::(\d{2}))?$/)
    if (m) {
      const [_, y, mo, d, h, mi, se] = m
      const date = new Date(
        Number(y),
        Number(mo) - 1,
        Number(d),
        Number(h),
        Number(mi),
        se ? Number(se) : 0,
        0
      )
      return isNaN(date.getTime()) ? null : date
    }
    // 匹配 YYYY-MM-DD（仅日期，按本地零点）
    m = s0.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (m) {
      const [_, y, mo, d] = m
      const date = new Date(Number(y), Number(mo) - 1, Number(d), 0, 0, 0, 0)
      return isNaN(date.getTime()) ? null : date
    }
    // 其他：尝试直接 new Date
    const d2 = new Date(s0)
    if (!isNaN(d2.getTime())) return d2
    const d3 = new Date(val)
    return isNaN(d3.getTime()) ? null : d3
  }

  // 已是 Date
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val
  }
  return null
}

// 格式化日期（仅到日）
const formatDate = (dateInput) => {
  const d = normalizeDate(dateInput)
  if (!d) return ''
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * 获取激活时间：遍历多个候选字段，取到即格式化
 */
/**
 * 设备编号：优先 wb_client 的 client_device_name
 */
function getDeviceNumber(detail) {
  if (!detail || typeof detail !== 'object') return '—'
  const candidates = [
    detail.clientEntity?.client_device_name,
    detail.client?.client_device_name,
    detail.client_device_name,
    detail.device_number,
    detail.deviceNo,
    detail.sn
  ]
  for (const v of candidates) {
    if (v && String(v).length >= 6) return String(v)
  }
  return '—'
}

/**
 * 激活时间：优先 wb_client.create_date
 */
const getActivatedAt = (detail) => {
  if (!detail || typeof detail !== 'object') return '—'
  // 只读取净水器库 wb_client 的 create_date（含常见等价路径），不再回退到 created_at/activateDate 等其它时间
  const candidates = [
    detail.wb_client?.create_date,
    detail.wbClient?.create_date,
    detail.client?.create_date,
    detail.clientEntity?.create_date,
    detail.clientInfo?.create_date,
    detail.client_info?.create_date,
    detail.create_date
  ]
  for (const v of candidates) {
    const s = formatDate(v)
    if (s) return s
  }
  return '—'
}


// 格式化流量
const formatFlow = (flow) => {
  if (!flow) return '0L'
  if (flow >= 1000) {
    return (flow / 1000).toFixed(1) + 'kL'
  }
  return flow + 'L'
}

// 获取天数颜色类
const getDaysColorClass = (days) => {
  if (days <= 7) return 'danger'
  if (days <= 30) return 'warning'
  return 'normal'
}

// 获取滤芯状态颜色类
const getFilterStatusClass = (percentage) => {
  if (percentage >= 50) {
    return 'filter-good'  // 绿色
  } else if (percentage >= 20) {
    return 'filter-warning'  // 橙色
  } else {
    return 'filter-critical'  // 红色
  }
}

// 拨打电话
const callPhone = () => {
  if (orderDetail.value && orderDetail.value.client_phone) {
    window.location.href = `tel:${orderDetail.value.client_phone}`
  }
}


// 获取滤芯进度条样式类
const getFilterProgressClass = (percentage) => {
  if (percentage >= 50) {
    return 'progress-good'
  } else if (percentage >= 20) {
    return 'progress-warning'
  } else {
    return 'progress-critical'
  }
}

// 获取滤芯项目样式类
const getFilterItemClass = (percentage) => {
  if (percentage <= 10) {
    return 'filter-item-critical'
  } else if (percentage <= 30) {
    return 'filter-item-warning'
  } else {
    return 'filter-item-normal'
  }
}

// 获取滤芯状态文本
const getFilterStatusText = (percentage) => {
  if (percentage >= 50) {
    return '状态良好'
  } else if (percentage >= 20) {
    return '需要关注'
  } else if (percentage > 0) {
    return '需要更换'
  } else {
    return '立即更换'
  }
}


/* 新增：套餐与TDS相关的计算与工具函数 */
const isNumber = (v) => typeof v === 'number' && !Number.isNaN(v)
const plan = computed(() => (orderDetail.value && orderDetail.value.plan) ? orderDetail.value.plan : {})
const planPeriod = computed(() => {
  const s = plan.value?.start_date || null
  const e = plan.value?.end_date || null
  if (!s && !e) return '—'
  if (s && e) return `${s} ~ ${e}`
  return s || e || '—'
})
const planStatusText = computed(() => {
  const map = { active: '生效中', expired: '已到期', upcoming: '待生效', unknown: '—' }
  return map[plan.value?.status] || '—'
})
const planStatusClass = computed(() => {
  switch (plan.value?.status) {
    case 'active': return 'badge-success'
    case 'expired': return 'badge-danger'
    case 'upcoming': return 'badge-warning'
    default: return 'badge-default'
  }
})

onMounted(() => {
  console.log('[FilterAlertDetail] loaded v2-safeToast') // 标记版本，便于确认是否使用到最新代码
  fetchOrderDetail()
})
</script>

<style scoped>
.filter-alert-detail {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
}

.content {
  padding: 56px 16px 80px;
}

/* 设备头部信息 */
.device-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.device-main {
  flex: 1;
}

.device-number {
  font-size: 24px;
  font-weight: 700;
  font-family: 'SF Pro Display', -apple-system, sans-serif;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.device-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  opacity: 0.9;
}

.activation-date {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.alert-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.2);
  padding: 12px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.alert-status .van-icon {
  font-size: 24px;
  color: #ffd700;
}

/* 信息卡片通用样式 */
.info-card {
  background: white;
  border-radius: 16px;
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 16px;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 1px solid #f8f9fa;
}

.card-header .van-icon {
  font-size: 20px;
  color: #667eea;
}

/* 客户信息卡片 */
.customer-info {
  padding: 20px;
}

.customer-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.customer-name {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.customer-phone {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1890ff;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 16px;
  background: #f0f8ff;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.customer-phone:hover {
  background: #e6f3ff;
  transform: translateY(-1px);
}

.customer-address {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

/* 套餐信息卡片 */
.package-info {
  padding: 20px;
}

.package-name {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 16px;
}

.package-usage {
  display: flex;
  gap: 16px;
}

.usage-item {
  flex: 1;
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}

.usage-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.usage-value {
  font-size: 20px;
  font-weight: 700;
}

/* 滤芯状态卡片 */

/* 滤芯卡片美化样式 */
.filter-card .card-header {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin: -1px -1px 0 -1px;
  border-radius: 16px 16px 0 0;
}

.header-icon {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.filter-status-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  backdrop-filter: blur(10px);
  margin-left: auto;
}

.filter-list {
  padding: 0;
}

.filter-item {
  padding: 20px;
  border-bottom: 1px solid #f8f9fa;
  transition: all 0.3s ease;
  position: relative;
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid #f0f0f0;
}

.filter-item:last-child {
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 0;
}

.filter-item-normal {
  background: linear-gradient(135deg, #f8fff9 0%, #ffffff 100%);
}

.filter-item-warning {
  background: linear-gradient(135deg, #fff8f0 0%, #ffffff 100%);
  border-left: 4px solid #ff976a;
  border-color: #fff3e0;
}

.filter-item-critical {
  background: linear-gradient(135deg, #fff0f0 0%, #ffffff 100%);
  border-left: 4px solid #ee0a24;
  border-color: #ffebee;
}

@keyframes pulse-critical {
  0%, 100% { box-shadow: 0 0 0 0 rgba(238, 10, 36, 0.3); }
  50% { box-shadow: 0 0 0 8px rgba(238, 10, 36, 0); }
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.filter-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.filter-icon-pp {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.filter-icon-ro {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.filter-icon-cto {
  background: linear-gradient(135deg, #96fbc4 0%, #f9f047 100%);
}

.filter-icon-other {
  background: linear-gradient(135deg, #fa8c16, #ffa940);
}

.filter-details {
  flex: 1;
}

.filter-name {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
  font-family: 'SF Pro Display', -apple-system, sans-serif;
}

.filter-flow-info {
  font-size: 13px;
  color: #8c8c8c;
  font-weight: 500;
}

.filter-percentage {
  font-size: 24px;
  font-weight: 800;
  font-family: 'SF Pro Display', -apple-system, sans-serif;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.filter-progress-container {
  margin-bottom: 16px;
}

.progress-track {
  height: 12px;
  background: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  border-radius: 6px;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.progress-good {
  background: linear-gradient(90deg, #52c41a, #73d13d);
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);
}

.progress-warning {
  background: linear-gradient(90deg, #fa8c16, #ffa940);
  box-shadow: 0 2px 8px rgba(250, 140, 22, 0.3);
}

.progress-critical {
  background: linear-gradient(90deg, #ee0a24, #ff4d4f);
  box-shadow: 0 2px 8px rgba(238, 10, 36, 0.3);
}

.progress-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shine 2s infinite;
}

@keyframes shine {
  0% { left: -100%; }
  100% { left: 100%; }
}

.filter-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.filter-status-tag {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-status-tag.filter-good {
  background: rgba(82, 196, 26, 0.1);
  color: #52c41a;
  border: 1px solid rgba(82, 196, 26, 0.2);
}

.reset-btn {
  background: rgba(0, 0, 0, 0.05) !important;
  color: #666 !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  font-size: 12px;
  padding: 6px 16px;
}

.replace-btn {
  background: rgba(238, 10, 36, 0.1) !important;
  color: #ee0a24 !important;
  border: 1px solid rgba(238, 10, 36, 0.2) !important;
  font-size: 12px;
  padding: 6px 16px;
}

.filter-status-tag.filter-warning {
  background: rgba(250, 140, 22, 0.1);
  color: #fa8c16;
  border: 1px solid rgba(250, 140, 22, 0.2);
}

.filter-status-tag.filter-critical {
  background: rgba(238, 10, 36, 0.1);
  color: #ee0a24;
  border: 1px solid rgba(238, 10, 36, 0.2);
}

/* 空状态优化 */
.no-filter-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #bfbfbf;
  font-size: 14px;
  gap: 16px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f0f0f0, #e6e6e6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #bfbfbf;
}

/* 设备控制卡片 */
.controls-grid {
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.control-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  border: none;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  min-height: 80px;
}

.control-button .van-icon {
  font-size: 24px;
}

.control-button.power-on {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
}

.control-button.power-off {
  background: linear-gradient(135deg, #ff7875, #ff9c6e);
  color: white;
}

.control-button.flush {
  background: linear-gradient(135deg, #40a9ff, #1890ff);
  color: white;
}

.control-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
  gap: 12px;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  gap: 16px;
}

.loading-text {
  color: #666;
  font-size: 14px;
}

/* 底部操作按钮 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: white;
  border-top: 1px solid #f0f0f0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

/* 颜色工具类 */
.danger {
  color: #ee0a24 !important;
  font-weight: 700;
}

.warning {
  color: #ff976a !important;
  font-weight: 700;
}

.normal {
  color: #07c160 !important;
  font-weight: 700;
}

/* 滤芯状态颜色类 */
.filter-good {
  color: #07c160 !important;
  font-weight: 700;
}

.filter-warning {
  color: #ff976a !important;
  font-weight: 700;
}

.filter-critical {
  color: #ee0a24 !important;
  font-weight: 700;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .device-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .customer-main {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .controls-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .control-button {
    flex-direction: row;
    justify-content: center;
    min-height: 60px;
  }
}
.badge { padding: 2px 8px; border-radius: 999px; font-size: 12px; }
.badge-success { background:#e6fffb; color:#08979c; }
.badge-danger { background:#fff1f0; color:#cf1322; }
.badge-warning { background:#fff7e6; color:#d48806; }
.badge-default { background:#f5f5f5; color:#666; }
</style>
