<template>
  <div class="institution-portal">
    <section class="institution-header">
      <div class="institution-basic">
        <van-image round width="56" height="56" :src="institutionAvatar" />
        <div class="institution-info">
          <div class="institution-name">
            {{ institutionName }}
            <van-tag
              v-if="institutionStatusText"
              class="institution-status-tag"
              size="mini"
              plain
              :type="institutionStatus"
            >
              {{ institutionStatusText }}
            </van-tag>
          </div>
          <div class="institution-phone">
            手机号 {{ userPhone }}
          </div>
          <div class="institution-meta">
            <div class="institution-parent">
              <span class="institution-parent-label">我的上级</span>
              <span class="institution-parent-value">{{ institutionParentLabel }}</span>
            </div>
            <div class="settings-entry" @click="openInstitutionSettings">
              <van-icon name="setting-o" />
            </div>
          </div>
        </div>

      </div>

      <!-- 展业名额卡片已移至美团模块 -->
    </section>

    <van-skeleton v-if="loading" title :row="4" animated />

    <template v-else>
      <section ref="promotionSectionRef" class="channel-shortcut-section">
        <div class="channel-shortcut-grid">
          <div
            v-for="channel in channelShortcuts"
            :key="channel.key"
              class="channel-shortcut-card"
              @click="openChannel(channel)"
            >
            <img :src="channel.icon" :alt="channel.title" class="channel-icon" />
            <span class="channel-title">{{ channel.title }}</span>
          </div>
        </div>
      </section>

      <section class="performance-section">
        <div class="performance-card performance-card--compact">
          <div class="performance-card__header performance-card__header--split">
            <div>
              <div class="performance-card__title">业绩趋势</div>
              <div class="performance-card__subtitle">
                最近更新时间：{{ performanceGeneratedLabel || '—' }}
              </div>
            </div>
            <div class="performance-range-switch" v-if="availablePerformanceRanges.length">
              <button
                v-for="range in availablePerformanceRanges"
                :key="range"
                type="button"
                class="range-chip"
                :class="{ 'range-chip--active': activePerformanceRange === range }"
                @click="activePerformanceRange = range"
              >
                近{{ range }}天
              </button>
            </div>
          </div>

          <div class="performance-chart-panel">
            <div v-if="performanceState.loading" class="performance-panel-state">
              <van-loading size="20px" />
              <span>正在加载业绩...</span>
            </div>
            <div
              v-else-if="!hasPerformanceData"
              class="performance-panel-state performance-panel-state--empty"
            >
              {{ performanceState.error || ('近' + activePerformanceRange + '天暂无交易数据') }}
            </div>
            <template v-else>
              <div ref="performanceChartWrapperRef" class="performance-chart-wrapper">
                <canvas
                  ref="performanceChartRef"
                  class="performance-chart-canvas"
                  role="img"
                  aria-label="机构业绩趋势折线图"
                />
              </div>
              <div v-if="performanceLegendItems.length" class="performance-legend">
                <div
                  v-for="item in performanceLegendItems"
                  :key="`${item.key}-legend`"
                  class="performance-legend__item"
                >
                  <span class="performance-legend__dot" :style="{ backgroundColor: item.color }" />
                  <div class="performance-legend__meta">
                    <span class="performance-legend__name">{{ item.name }}</span>
                    <span class="performance-legend__value">{{ formatShortCurrency(item.total) }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </section>

      <section ref="businessSectionRef" class="module-section">
        <div class="section-header">
          <span>工作台功能</span>
        </div>
        <div class="module-grid">
          <div
            v-for="module in coreModules"
            :key="module.key"
            class="module-card"
            :class="{ disabled: module.disabled }"
            @click="openModule(module)"
          >
            <div class="module-card-header">
              <div class="module-card-title">
                <van-icon :name="module.icon" />
                <span>{{ module.title }}</span>
              </div>
              <van-tag
                v-if="module.status"
                size="mini"
                :type="module.statusType || 'primary'"
                plain
              >
                {{ module.status }}
              </van-tag>
            </div>
            <div class="module-card-desc">
              {{ module.description }}
            </div>
          </div>
        </div>
      </section>

    </template>
    <van-popup
      v-model:show="purchaseDrawer.show"
      position="bottom"
      class="purchase-drawer"
      round
      :style="{ height: '72vh', maxHeight: '520px' }"
    >
      <div class="purchase-drawer__handle" />
      <div class="purchase-drawer__header">
        <div class="purchase-drawer__title">{{ purchaseDrawerTitle }}</div>
        <div class="purchase-drawer__subtitle">{{ purchaseDrawerSubtitle }}</div>
      </div>
      <div class="purchase-drawer__content">
        <ul class="purchase-benefits">
          <li v-for="(benefit, index) in purchaseDrawerBenefits" :key="index">
            <van-icon name="success" />
            <span>{{ benefit }}</span>
          </li>
        </ul>
        <div class="purchase-price-block">
          <div class="purchase-price-label">套餐价格</div>
          <div class="purchase-price-value">{{ purchaseDrawerPrice }}</div>
          <div class="purchase-price-hint">{{ purchaseDrawerHint }}</div>
        </div>
      </div>
      <div class="purchase-drawer__footer">
        <van-button plain type="default" round block @click="closePurchaseDrawer">暂不购买</van-button>
        <van-button type="primary" round block class="purchase-action" @click="goPolicyPage(purchaseDrawer.type)">
          查看具体政策
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Dialog, showFailToast, showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { getInstitutionMeituanDashboard, getInstitutionOnboardingStats, getInstitutionPerformanceTrend } from '@/api/institution'
import logoXingyifu from '@/assets/channel/logos_xingyifu.png'
import logoShengfutong from '@/assets/channel/logos_shengfutong.png'
import logoMeituan from '@/assets/channel/logos_meituan.png'

const router = useRouter()
const promotionSectionRef = ref(null)
const businessSectionRef = ref(null)
const bottomNavRef = ref(null)
const performanceChartWrapperRef = ref(null)
const performanceChartRef = ref(null)
const userStore = useUserStore()

const CHANNEL_THEME_PRESETS = [
  {
    key: 'xingyifu',
    label: '星驿付',
    color: '#9da3b4',
    aliasTokens: ['xingyifu', '星驿付', '星驛付', '星驛', '星驿']
  },
  {
    key: 'shengfutong',
    label: '盛付通',
    color: '#3d8bfd',
    aliasTokens: ['shengfutong', '盛付通', '盛付', 'sft']
  },
  {
    key: 'meituan',
    label: '美团',
    color: '#ff9702',
    aliasTokens: ['meituan', '美团', 'mt']
  }
]

const CHANNEL_PRIORITY_MAP = CHANNEL_THEME_PRESETS.reduce((acc, preset, index) => {
  acc[preset.key] = index
  return acc
}, {})

const DEFAULT_CHANNEL_COLOR = '#7c8db5'
const PERFORMANCE_CHART_PADDING = { top: 8, right: 10, bottom: 22, left: 6 }

const OPERATION_CENTER_PACKAGE_PRICE = 19800
const PARTNER_PACKAGE_PRICE = 3980
const MEITUAN_NOT_ENABLED_CODE = 4605

let performanceChartResizeObserver = null

const PURCHASE_OPTIONS = {
  operation_center: {
    title: '运营中心服务包',
    subtitle: '拓展合伙人，一次解锁更多名额',
    price: OPERATION_CENTER_PACKAGE_PRICE,
    benefits: [
      '含 20 位合伙人额度，可继续下发',
      '随包附赠 50 台播报器，线下拓展即可上手',
      '配套运营资料、招商物料与团队数据支持'
    ],
    hint: '每份可新增 20 名合伙人额度'
  },
  partner: {
    title: '合伙人服务包',
    subtitle: '扩充销售团队，快速覆盖市场',
    price: PARTNER_PACKAGE_PRICE,
    benefits: [
      '含 30 位销售经理额度，立即启用',
      '随包附赠 10 台播报器，团队同步开工',
      '提供销售培训、激励模板与顾问落地辅导'
    ],
    hint: '每份可新增 30 名销售经理额度'
  }
}

const INSTITUTION_STORAGE_KEY = 'institution/active-id'

const getStoredInstitutionId = () => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(INSTITUTION_STORAGE_KEY)
    if (!raw) return null
    const numeric = Number(raw)
    return Number.isFinite(numeric) ? numeric : null
  } catch (error) {
    console.info('读取机构选择缓存失败:', error)
    return null
  }
}

const availableInstitutions = ref([])
const currentInstitutionSnapshot = ref(null)
const selectedInstitutionId = ref(getStoredInstitutionId())
const loading = ref(true)
const isInitializing = ref(true)

const onboardingStats = reactive({
  summary: { today_auto: 0, today_new: 0, yesterday_auto: 0, yesterday_new: 0 },
  today: { pending: 0 },
  yesterday: { pending: 0 }
})

const performanceState = reactive({
  loading: true,
  error: '',
  generatedAt: '',
  rangeDates: {},
  channels: []
})
const activePerformanceRange = ref('7')

const meituanCapacity = reactive({
  loading: false,
  error: '',
  enabled: true,
  servicePackages: 0,
  partnerPackages: 0,
  partnerQuota: {
    total: 0,
    used: 0,
    remaining: 0,
    perPackage: 20
  },
  salesQuota: {
    scope: null,
    total: 0,
    used: 0,
    remaining: 0,
    perPackage: 30,
    operationCenterLimit: null,
    partnerBase: null
  }
})

const purchaseDrawer = reactive({
  show: false,
  type: 'operation_center'
})

const ACCESS_DENIED_MESSAGE = '您还不是支付机构，请联系点点够官方进行开通'
const ACCESS_DENIED_PATTERNS = [
  '手机号码没有匹配',
  '手机号没有匹配',
  '手机号码未匹配',
  '手机号未匹配',
  '未匹配到支付机构',
  '不是支付机构',
  '尚未开通支付机构'
]
const ACCESS_DENIED_CODES = new Set([403, 404, 4601, 4603, 4604])
let institutionAccessDeniedHandled = false

const selectedInstitution = computed(() => {
  const list = availableInstitutions.value
  if (list.length > 0) {
    if (typeof selectedInstitutionId.value === 'number') {
      const match = list.find(item => item.id === selectedInstitutionId.value)
      if (match) {
        return match
      }
    }
    return list[0]
  }
  return currentInstitutionSnapshot.value
})

const institutionName = computed(() => {
  if (selectedInstitution.value?.name) {
    return selectedInstitution.value.name
  }
  return userStore.userInfo?.institution_name || userStore.userName || '支付机构'
})

const institutionParentLabel = computed(() => {
  const target = selectedInstitution.value
  if (!target) return '隶属于总部'
  if (typeof target.parent_display === 'string' && target.parent_display.trim()) {
    return target.parent_display.trim()
  }
  const parent = target.parent
  if (parent && typeof parent === 'object') {
    if (parent.is_headquarter) {
      return '隶属于总部'
    }
    if (typeof parent.display === 'string' && parent.display.trim()) {
      return parent.display.trim()
    }
    if (typeof parent.name === 'string' && parent.name.trim()) {
      return parent.name.trim()
    }
  }
  return '隶属于总部'
})

const resolveStatusType = (status) => {
  if (status === 1) return 'success'
  if (status === 0) return 'warning'
  if (status === 2 || status === 3) return 'danger'
  return null
}

const resolveStatusText = (status) => {
  const statusMap = {
    0: '待认证',
    1: '已认证',
    2: '审核失败',
    3: '已禁用'
  }
  return statusMap[status] || null
}

const formatCurrency = (value) => {
  const numeric = Number(value) || 0
  if (Math.abs(numeric) >= 10000) {
    return `¥${(numeric / 10000).toFixed(1)}万`
  }
  return `¥${numeric.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

const formatPriceWan = (value) => {
  const numeric = Number(value) || 0
  if (numeric <= 0) {
    return formatCurrency(0)
  }
  if (numeric >= 10000) {
    return `¥${(numeric / 10000).toFixed(2)}万`
  }
  return formatCurrency(numeric)
}

const formatInteger = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return '0'
  }
  return numeric.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

const toNonNegativeNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') {
    return fallback
  }
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric < 0) {
    return fallback
  }
  return numeric
}

const formatDateLabel = (date) => {
  if (!date) return ''
  if (date.includes('-')) {
    return date.slice(5).replace('-', '/')
  }
  return date
}

const formatTimeLabel = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}/${day} ${hours}:${minutes}`
}

const buildDefaultRangeDates = (rangeKey) => {
  const days = Math.max(1, Number(rangeKey) || 7)
  const result = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const iso = date.toISOString().slice(0, 10)
    result.push(iso)
  }
  return result
}

const normalizeChannelToken = (value) => {
  if (!value && value !== 0) {
    return ''
  }
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '')
}

const resolveChannelPreset = (channel) => {
  if (!channel) return null
  const candidates = [normalizeChannelToken(channel.key), normalizeChannelToken(channel.name)]
  candidates.push(normalizeChannelToken(`${channel.key || ''}${channel.name || ''}`))
  return CHANNEL_THEME_PRESETS.find((preset) => {
    return preset.aliasTokens.some(aliasToken => {
      const normalizedAlias = normalizeChannelToken(aliasToken)
      if (!normalizedAlias) return false
      return candidates.some(token => token && (token.includes(normalizedAlias) || normalizedAlias.includes(token)))
    })
  }) || null
}

const computeChannelPriority = (channel) => {
  const preset = resolveChannelPreset(channel)
  if (preset && preset.key in CHANNEL_PRIORITY_MAP) {
    return CHANNEL_PRIORITY_MAP[preset.key]
  }
  return 999
}

const computeNiceCeiling = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 1
  }
  const magnitude = 10 ** Math.floor(Math.log10(numeric))
  const normalized = numeric / magnitude
  if (normalized <= 1) return magnitude
  if (normalized <= 2) return 2 * magnitude
  if (normalized <= 5) return 5 * magnitude
  return 10 * magnitude
}

const institutionStatus = computed(() => {
  const status = selectedInstitution.value?.status ?? currentInstitutionSnapshot.value?.status
  const resolved = resolveStatusType(status)
  if (resolved) {
    return resolved
  }
  return userStore.userInfo?.is_pay_institution === 1 ? 'success' : 'warning'
})

const institutionStatusText = computed(() => {
  const status = selectedInstitution.value?.status ?? currentInstitutionSnapshot.value?.status
  const resolved = resolveStatusText(status)
  if (resolved) {
    return resolved
  }
  return userStore.userInfo?.is_pay_institution === 1 ? '已认证' : '待认证'
})

const institutionAvatar = computed(() => userStore.userAvatar || 'https://img.itapgo.com/profile/default-institution.png')
const userPhone = computed(() => {
  return (
    selectedInstitution.value?.phone ||
    userStore.userInfo?.institution_phone ||
    userStore.userInfo?.phone ||
    '—'
  )
})

const availablePerformanceRanges = computed(() => {
  const ranges = performanceState.rangeDates ? Object.keys(performanceState.rangeDates) : []
  return ranges
    .map(range => String(range))
    .sort((a, b) => Number(a) - Number(b))
})

const performanceChartData = computed(() => {
  const rangeKey = activePerformanceRange.value
  let rangeDates = performanceState.rangeDates?.[rangeKey]
  if (!Array.isArray(rangeDates) || !rangeDates.length) {
    rangeDates = buildDefaultRangeDates(rangeKey)
  }

  const channels = performanceState.channels.map(channel => {
    const series = Array.isArray(channel.series?.[rangeKey]) ? channel.series[rangeKey] : []
    const valueMap = new Map(series.map(item => [item.date, Number(item.amount) || 0]))
    const values = rangeDates.map(date => valueMap.get(date) ?? 0)
    const preset = resolveChannelPreset(channel)
    const derivedKey = String(preset?.key || channel.key || channel.name || 'channel')
    const displayName = channel.name || preset?.label || derivedKey
    const color = preset?.color || channel.color || DEFAULT_CHANNEL_COLOR
    return {
      key: derivedKey,
      originalKey: channel.key,
      name: displayName,
      color,
      values,
      total: Number(channel.totals?.[rangeKey] ?? 0),
      average: Number(channel.averages?.[rangeKey] ?? 0),
      priority: computeChannelPriority(channel)
    }
  })

  const maxValue = channels.reduce((max, channel) => {
    const localMax = channel.values.reduce((m, value) => Math.max(m, value), 0)
    return Math.max(max, localMax)
  }, 0)

  return {
    dates: rangeDates,
    channels,
    maxValue
  }
})


const displayPerformanceChannels = computed(() => {
  const channels = Array.isArray(performanceChartData.value.channels)
    ? [...performanceChartData.value.channels]
    : []
  return channels.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority
    }
    const nameA = a.name || ''
    const nameB = b.name || ''
    return nameA.localeCompare(nameB)
  })
})

const hasPerformanceData = computed(() => {
  const channels = displayPerformanceChannels.value
  if (!channels.length) {
    return false
  }
  return channels.some(channel => channel.values.some(value => value > 0))
})

const performanceLegendItems = computed(() => {
  if (!hasPerformanceData.value) {
    return []
  }
  return displayPerformanceChannels.value.map(channel => ({
    key: channel.key,
    name: channel.name,
    color: channel.color,
    total: channel.total
  }))
})

const clearPerformanceChart = () => {
  const canvas = performanceChartRef.value
  if (!canvas) return
  const context = canvas.getContext('2d')
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height)
  }
}

const renderPerformanceChart = () => {
  const canvas = performanceChartRef.value
  const wrapper = performanceChartWrapperRef.value
  const chartData = performanceChartData.value
  const channels = displayPerformanceChannels.value

  if (!canvas || !wrapper) {
    return
  }

  const width = Math.floor(wrapper.clientWidth || wrapper.offsetWidth || 0)
  const height = Math.floor(wrapper.clientHeight || wrapper.offsetHeight || 220)
  if (!width || !height) {
    clearPerformanceChart()
    return
  }

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }
  if (ctx.resetTransform) {
    ctx.resetTransform()
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)

  if (!hasPerformanceData.value || !chartData?.dates?.length || !channels.length) {
    return
  }

  const padding = PERFORMANCE_CHART_PADDING
  const chartWidth = Math.max(0, width - padding.left - padding.right)
  const chartHeight = Math.max(0, height - padding.top - padding.bottom)
  if (!chartWidth || !chartHeight) {
    return
  }

  const totalPoints = chartData.dates.length
  const yMax = computeNiceCeiling(chartData.maxValue)
  const baselineY = height - padding.bottom
  const getX = (index) => {
    if (totalPoints <= 1) {
      return padding.left + chartWidth / 2
    }
    const step = chartWidth / (totalPoints - 1)
    return padding.left + step * index
  }
  const getY = (value) => {
    const clamped = Math.min(Math.max(value, 0), yMax)
    return baselineY - (clamped / yMax) * chartHeight
  }

  const drawGrid = () => {
    ctx.save()
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 6])
    const lines = 3
    for (let i = 0; i <= lines; i++) {
      const y = baselineY - (chartHeight / lines) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }
    ctx.restore()
  }

  const drawSeries = () => {
    const meaningfulChannels = channels.filter(channel => channel.values.some(value => value > 0))
    const targets = meaningfulChannels.length ? meaningfulChannels : channels
    targets.forEach(channel => {
      ctx.save()
      ctx.strokeStyle = channel.color
      ctx.lineWidth = 2.4
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()
      channel.values.forEach((value, index) => {
        const x = getX(index)
        const y = getY(value)
        if (index === 0) {
          ctx.moveTo(x, y)
          return
        }
        ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.restore()
    })
  }

  const drawAxisLabels = () => {
    if (!chartData.dates.length) {
      return
    }
    ctx.save()
    ctx.fillStyle = '#7b8aaa'
    ctx.font = '12px/1.2 "Microsoft YaHei", "PingFang SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const indices = []
    if (totalPoints === 1) {
      indices.push(0)
    } else if (totalPoints === 2) {
      indices.push(0, 1)
    } else {
      indices.push(0, Math.floor(totalPoints / 2), totalPoints - 1)
    }
    const unique = [...new Set(indices)]
    unique.forEach(index => {
      const x = getX(index)
      const label = formatDateLabel(chartData.dates[index])
      ctx.fillText(label, x, baselineY + 6)
    })
    ctx.restore()
  }

  drawGrid()
  drawSeries()
  drawAxisLabels()
}

const setupPerformanceChartObserver = () => {
  if (typeof ResizeObserver === 'undefined' || !performanceChartWrapperRef.value) {
    return
  }
  teardownPerformanceChartObserver()
  performanceChartResizeObserver = new ResizeObserver(() => {
    renderPerformanceChart()
  })
  performanceChartResizeObserver.observe(performanceChartWrapperRef.value)
}

const teardownPerformanceChartObserver = () => {
  if (performanceChartResizeObserver) {
    performanceChartResizeObserver.disconnect()
    performanceChartResizeObserver = null
  }
}

watch(
  () => [performanceChartData.value, hasPerformanceData.value],
  () => {
    nextTick(() => renderPerformanceChart())
  },
  { deep: true }
)

watch(hasPerformanceData, (value) => {
  if (value) {
    nextTick(() => {
      setupPerformanceChartObserver()
      renderPerformanceChart()
    })
  } else {
    teardownPerformanceChartObserver()
    clearPerformanceChart()
  }
})

const formatCompactCurrency = (value) => {
  const numeric = Number(value) || 0
  const abs = Math.abs(numeric)
  if (abs >= 100000000) {
    return `${(numeric / 100000000).toFixed(1)}亿`
  }
  if (abs >= 10000) {
    return `${(numeric / 10000).toFixed(1)}万`
  }
  return numeric.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

const formatShortCurrency = (value) => {
  const numeric = Number(value) || 0
  if (Math.abs(numeric) >= 10000) {
    return `${(numeric / 10000).toFixed(1)}万`
  }
  return `¥${numeric.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`
}

const performanceGeneratedLabel = computed(() => {
  return formatTimeLabel(performanceState.generatedAt)
})

const currentPurchaseOption = computed(() => {
  return PURCHASE_OPTIONS[purchaseDrawer.type] ?? PURCHASE_OPTIONS.operation_center
})

const purchaseDrawerTitle = computed(() => currentPurchaseOption.value.title)
const purchaseDrawerSubtitle = computed(() => currentPurchaseOption.value.subtitle)
const purchaseDrawerBenefits = computed(() => currentPurchaseOption.value.benefits)
const purchaseDrawerPrice = computed(() => formatPriceWan(currentPurchaseOption.value.price))
const purchaseDrawerHint = computed(() => currentPurchaseOption.value.hint)

const partnerQuotaUsage = computed(() => {
  const total = meituanCapacity.partnerQuota.total || 0
  if (total <= 0) {
    return 0
  }
  const used = Math.min(meituanCapacity.partnerQuota.used || 0, total)
  return Math.min(100, Math.round((used / total) * 100))
})

const salesQuotaUsage = computed(() => {
  const total = meituanCapacity.salesQuota.total || 0
  if (total <= 0) {
    return 0
  }
  const used = Math.min(meituanCapacity.salesQuota.used || 0, total)
  return Math.min(100, Math.round((used / total) * 100))
})

const partnerSlotsPerPackage = computed(() => {
  const slots = Number(meituanCapacity.partnerQuota.perPackage || 0)
  return slots > 0 ? slots : 20
})

const salesSlotsPerPackage = computed(() => {
  const slots = Number(meituanCapacity.salesQuota.perPackage || 0)
  return slots > 0 ? slots : 30
})

const coreModules = computed(() => [
  {
    key: 'onboarding',
    title: '进件管理',
    description: '统一管理商户资料，渠道可选星驿付 / 盛付通 / 美团',
    status: `${onboardingStats.summary.today_new || 0} 条今日通过`,
    statusType: 'primary',
    icon: 'todo-list-o'
  }
])

const channelShortcuts = [
  {
    key: 'xinyifu',
    title: '星驿付',
    icon: logoXingyifu,
    color: '#9da3b4'
  },
  {
    key: 'shengfutong',
    title: '盛付通',
    icon: logoShengfutong,
    color: '#3d8bfd'
  },
  {
    key: 'meituan',
    title: '美团',
    icon: logoMeituan,
    color: '#ff9702'
  }
]

const normalizeInstitutionError = (source) => {
  if (!source) {
    return { message: '', code: undefined }
  }
  if (typeof source === 'string') {
    return { message: source, code: undefined }
  }
  if (typeof source === 'number') {
    return { message: '', code: source }
  }
  if (source?.message !== undefined || source?.code !== undefined) {
    return {
      message: source.message ?? '',
      code: source.code
    }
  }
  const response = source?.response
  const data = response?.data ?? {}
  return {
    message: data.message ?? data.msg ?? source?.message ?? '',
    code: data.code ?? response?.status ?? source?.code
  }
}

const demoteInstitutionRole = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('userInfo') || '{}')
    if (stored && stored.is_pay_institution) {
      stored.is_pay_institution = 0
      if (Array.isArray(stored.roles)) {
        stored.roles = stored.roles.filter(role => role !== 'pay_institution')
      }
      localStorage.setItem('userInfo', JSON.stringify(stored))
    }
  } catch (error) {
    console.warn('清理支付机构角色缓存失败', error)
  }

  try {
    if (userStore?.userInfo) {
      userStore.userInfo.is_pay_institution = 0
      if (Array.isArray(userStore.userInfo.roles)) {
        userStore.userInfo.roles = userStore.userInfo.roles.filter(role => role !== 'pay_institution')
      }
    }
  } catch (error) {
    console.warn('同步用户store中的支付机构角色失败', error)
  }

  try {
    localStorage.removeItem('institutionWorkspace')
    sessionStorage.removeItem('institutionWorkspace')
  } catch (error) {
    console.warn('清理支付机构缓存失败', error)
  }

  try {
    window.dispatchEvent(new CustomEvent('user-role-updated', {
      detail: {
        role: 'is_pay_institution',
        enabled: false
      }
    }))
  } catch (error) {
    // ignore event dispatch failure
  }
}

const isInstitutionAccessDenied = (message, code) => {
  if (message) {
    const text = String(message)
    if (ACCESS_DENIED_PATTERNS.some(pattern => text.includes(pattern))) {
      return true
    }
  }
  if (code !== undefined && code !== null) {
    const numeric = Number(code)
    if (!Number.isNaN(numeric) && ACCESS_DENIED_CODES.has(numeric)) {
      return true
    }
  }
  return false
}

const handleInstitutionAccessDenied = async (source) => {
  const { message, code } = normalizeInstitutionError(source)
  if (!isInstitutionAccessDenied(message, code)) {
    return false
  }
  if (institutionAccessDeniedHandled) {
    return true
  }
  institutionAccessDeniedHandled = true
  demoteInstitutionRole()
  try {
    await Dialog.alert({
      title: '提示',
      message: ACCESS_DENIED_MESSAGE,
      confirmButtonText: '去开通'
    })
  } catch (error) {
    console.info('机构访问受限提示关闭:', error)
  }
  const currentPath = router.currentRoute?.value?.fullPath
  const query = { reason: 'no-match' }
  if (currentPath) {
    query.from = encodeURIComponent(currentPath)
  }
  router.replace({ name: 'InstitutionApply', query })
  return true
}

const buildInstitutionParams = (additional = {}) => {
  const params = { ...additional }
  if (typeof selectedInstitutionId.value === 'number' && !Number.isNaN(selectedInstitutionId.value)) {
    params.institution_id = selectedInstitutionId.value
  }
  return params
}

const syncAvailableInstitutionOptions = (payload) => {
  const rawList = Array.isArray(payload?.available_institutions) ? payload.available_institutions : []
  const normalize = (source) => {
    if (!source) return null
    const idCandidate = source.id ?? source.institution_id ?? source.institutionId ?? null
    const numericId = Number(idCandidate)
    if (!Number.isFinite(numericId)) {
      return null
    }
    const numberCandidate = source.number ?? source.institution_number ?? source.channel_id ?? source.channelId ?? ''
    const nameCandidate = source.name ?? source.nickname ?? source.institution_name ?? ''
    const inviteCodeCandidate = source.invite_code ?? source.invitation_code ?? source.code ?? ''
    const statusCandidate = source.status ?? source.status_code ?? source.state
    const parentPayload = source.parent && typeof source.parent === 'object' ? source.parent : null
    const parentDisplay = source.parent_display ?? parentPayload?.display ?? (parentPayload?.is_headquarter ? '隶属于总部' : parentPayload?.name ?? '')
    return {
      id: numericId,
      number: numberCandidate ? String(numberCandidate) : '',
      name: nameCandidate ? String(nameCandidate) : `机构 ${numericId}`,
      invite_code: inviteCodeCandidate ? String(inviteCodeCandidate) : '',
      status: Number.isFinite(Number(statusCandidate)) ? Number(statusCandidate) : undefined,
      parent: parentPayload,
      parent_display: parentDisplay
    }
  }

  const normalizedList = rawList.map(normalize).filter(Boolean)
  const currentInstitution = normalize(payload?.institution)

  if (currentInstitution) {
    const existingIndex = normalizedList.findIndex(item => item.id === currentInstitution.id)
    if (existingIndex >= 0) {
      normalizedList[existingIndex] = {
        ...normalizedList[existingIndex],
        ...currentInstitution,
        invite_code: currentInstitution.invite_code || normalizedList[existingIndex].invite_code,
        number: currentInstitution.number || normalizedList[existingIndex].number,
        name: currentInstitution.name || normalizedList[existingIndex].name,
        status: currentInstitution.status ?? normalizedList[existingIndex].status
      }
    } else {
      normalizedList.unshift(currentInstitution)
    }
  }

  availableInstitutions.value = normalizedList
  currentInstitutionSnapshot.value = currentInstitution || null

  if (normalizedList.length === 0) {
    if (currentInstitution && typeof currentInstitution.id === 'number') {
      selectedInstitutionId.value = currentInstitution.id
    } else if (selectedInstitutionId.value !== null) {
      selectedInstitutionId.value = null
    }
    return
  }

  const hasSelected = typeof selectedInstitutionId.value === 'number' && normalizedList.some(item => item.id === selectedInstitutionId.value)
  if (hasSelected) {
    return
  }

  const preferredId =
    (currentInstitution && normalizedList.some(item => item.id === currentInstitution.id) ? currentInstitution.id : null) ??
    normalizedList[0].id

  if (typeof preferredId === 'number' && preferredId !== selectedInstitutionId.value) {
    selectedInstitutionId.value = preferredId
  }
}

async function fetchStats() {
  try {
    const res = await getInstitutionOnboardingStats(buildInstitutionParams())
    if (res.code !== 0) {
      if (await handleInstitutionAccessDenied(res)) {
        return
      }
      throw new Error(res.message || '获取机构数据失败')
    }
    const data = res.data || {}
    onboardingStats.summary = data.summary || { today_auto: 0, today_new: 0, yesterday_auto: 0, yesterday_new: 0 }
    onboardingStats.today = data.today || { pending: 0 }
    onboardingStats.yesterday = data.yesterday || { pending: 0 }
    syncAvailableInstitutionOptions(data)
  } catch (error) {
    if (await handleInstitutionAccessDenied(error)) {
      return
    }
    showFailToast(error.message || '获取机构数据失败')
    console.error('fetch institution stats failed', error)
  } finally {
    loading.value = false
    nextTick(() => {
      updateBottomNavMetrics()
      setupSectionObserver()
    })
  }
}

async function fetchPerformanceTrend() {
  if (institutionAccessDeniedHandled) {
    performanceState.loading = false
    return
  }
  performanceState.loading = true
  performanceState.error = ''
  try {
    const res = await getInstitutionPerformanceTrend(buildInstitutionParams())
    if (res.code !== 0) {
      if (await handleInstitutionAccessDenied(res)) {
        return
      }
      throw new Error(res.message || '获取业绩趋势失败')
    }

    const data = res.data || {}
    performanceState.generatedAt = data.generated_at || ''

    const incomingRangeDates = data.range_dates && Object.keys(data.range_dates).length ? data.range_dates : { '7': [], '30': [] }
    performanceState.rangeDates = incomingRangeDates

    const ranges = availablePerformanceRanges.value.length
      ? availablePerformanceRanges.value
      : Object.keys(incomingRangeDates)

    const normalizeSeries = (series) => {
      if (!Array.isArray(series)) {
        return []
      }
      return series.map(item => ({
        date: item?.date || '',
        amount: Number(item?.amount) || 0
      }))
    }

    performanceState.channels = Array.isArray(data.channels)
      ? data.channels.map(channel => {
          const seriesPayload = channel.series || {}
          const totalsPayload = channel.totals || {}
          const averagesPayload = channel.averages || {}
          const normalizedSeries = {}
          const normalizedTotals = {}
          const normalizedAverages = {}

          ranges.forEach(range => {
            normalizedSeries[range] = normalizeSeries(seriesPayload?.[range])
            normalizedTotals[range] = Number(totalsPayload?.[range] ?? 0)
            normalizedAverages[range] = Number(averagesPayload?.[range] ?? 0)
          })

          return {
            key: channel.key || channel.name || 'channel',
            name: channel.name || channel.key || '渠道',
            color: channel.color || '#1989fa',
            series: normalizedSeries,
            totals: normalizedTotals,
            averages: normalizedAverages
          }
        })
      : []

    if (ranges.length && !ranges.includes(activePerformanceRange.value)) {
      activePerformanceRange.value = ranges[0]
    }
  } catch (error) {
    performanceState.error = error?.message || '获取业绩趋势失败'
    console.error('fetch institution performance trend failed', error)
  } finally {
    performanceState.loading = false
  }
}

const resetMeituanCapacity = (enabled = false) => {
  meituanCapacity.enabled = !!enabled
  meituanCapacity.error = ''
  meituanCapacity.loading = false
  meituanCapacity.servicePackages = 0
  meituanCapacity.partnerPackages = 0
  Object.assign(meituanCapacity.partnerQuota, {
    total: 0,
    used: 0,
    remaining: 0,
    perPackage: 20
  })
  Object.assign(meituanCapacity.salesQuota, {
    scope: null,
    total: 0,
    used: 0,
    remaining: 0,
    perPackage: 30,
    operationCenterLimit: null,
    partnerBase: 30
  })
}

const applyMeituanCapacity = (payload = {}, enabled = true) => {
  meituanCapacity.enabled = !!enabled
  meituanCapacity.error = ''
  meituanCapacity.servicePackages = toNonNegativeNumber(payload.service_package_count ?? payload.servicePackages, 0)
  meituanCapacity.partnerPackages = toNonNegativeNumber(payload.partner_package_count ?? payload.partnerPackages, 0)

  const partner = payload.partner_quota && typeof payload.partner_quota === 'object' ? payload.partner_quota : {}
  const partnerTotal = toNonNegativeNumber(partner.total, 0)
  const partnerUsed = Math.min(partnerTotal, toNonNegativeNumber(partner.used, 0))
  const partnerPerPackageRaw = toNonNegativeNumber(partner.per_package, 20)
  const partnerPerPackage = partnerPerPackageRaw > 0 ? partnerPerPackageRaw : 20
  Object.assign(meituanCapacity.partnerQuota, {
    total: partnerTotal,
    used: partnerUsed,
    remaining: Math.max(0, partnerTotal - partnerUsed),
    perPackage: partnerPerPackage
  })

  const sales = payload.sales_quota && typeof payload.sales_quota === 'object' ? payload.sales_quota : {}
  const salesTotal = toNonNegativeNumber(sales.total, 0)
  const salesUsed = Math.min(salesTotal, toNonNegativeNumber(sales.used, 0))
  const salesPerPackageRaw = toNonNegativeNumber(sales.per_package, 30)
  const salesPerPackage = salesPerPackageRaw > 0 ? salesPerPackageRaw : 30
  const operationCenterLimit = toNonNegativeNumber(sales.operation_center_limit, null)
  const partnerBase = toNonNegativeNumber(sales.partner_base, 30)
  Object.assign(meituanCapacity.salesQuota, {
    scope: sales.scope ? String(sales.scope) : null,
    total: salesTotal,
    used: salesUsed,
    remaining: Math.max(0, salesTotal - salesUsed),
    perPackage: salesPerPackage,
    operationCenterLimit,
    partnerBase: partnerBase > 0 ? partnerBase : 30
  })
}

async function fetchMeituanCapacity() {
  if (institutionAccessDeniedHandled) {
    resetMeituanCapacity(false)
    return
  }
  meituanCapacity.loading = true
  meituanCapacity.error = ''
  try {
    const res = await getInstitutionMeituanDashboard(buildInstitutionParams())
    if (res?.code === 0) {
      applyMeituanCapacity(res.data?.meituan || {}, true)
    } else if (res?.code === MEITUAN_NOT_ENABLED_CODE) {
      applyMeituanCapacity(res.data?.meituan || {}, false)
    } else if (res) {
      meituanCapacity.error = res.message || '获取美团额度失败'
    }
  } catch (error) {
    meituanCapacity.error = error?.message || '获取美团额度失败'
    console.error('fetch meituan capacity failed', error)
  } finally {
    meituanCapacity.loading = false
  }
}

const openPurchaseDrawer = (type) => {
  purchaseDrawer.type = type in PURCHASE_OPTIONS ? type : 'operation_center'
  purchaseDrawer.show = true
}

const closePurchaseDrawer = () => {
  purchaseDrawer.show = false
}

const goPolicyPage = (packageType) => {
  purchaseDrawer.show = false
  nextTick(() => {
    router.push({
      name: 'InstitutionPolicy',
      query: { focus: packageType }
    })
  })
}

function openInstitutionSettings() {
  const query = {}
  if (typeof selectedInstitutionId.value === 'number' && !Number.isNaN(selectedInstitutionId.value)) {
    query.institution_id = selectedInstitutionId.value
  }
  if (Object.keys(query).length) {
    router.push({ name: 'InstitutionSettings', query })
  } else {
    router.push({ name: 'InstitutionSettings' })
  }
}

function openModule(module) {
  if (module.disabled) {
    showToast('功能开发中，敬请期待')
    return
  }

  if (module.key === 'onboarding') {
    router.push({ name: 'InstitutionOnboarding' })
    return
  }

  if (module.route) {
    router.push(module.route)
    return
  }

  showToast('功能开发中，敬请期待')
}

function openChannel(channel) {
  if (!channel || !channel.key) {
    return
  }
  if (channel.key === 'meituan') {
    router.push({ name: 'InstitutionMeituan' })
    return
  }
  router.push({
    name: 'InstitutionOnboarding',
    query: { channel: channel.key }
  })
}

function openRecruitPolicy() {
  router.push({ name: 'RecruitManual' })
}

// Bottom navigation (glassmorphism slider)
const bottomNavItems = [
  { key: 'home', label: '首页', type: 'action', target: 'home' },
  { key: 'promotion', label: '推广', type: 'route', target: { name: 'InstitutionPromotion' } },
  { key: 'business', label: '展业', type: 'route', target: { name: 'InstitutionBusiness' } },
  { key: 'invite', label: '邀请', type: 'action' }
]

const bottomNavMetrics = reactive({ width: 0, left: 0 })
const activeBottomNavIndex = ref(0)
const bottomNavState = reactive({
  isDragging: false,
  progress: 0,
  activeCandidate: 0
})

const SCROLL_OFFSET = 108
const HOME_SCROLL_THRESHOLD = 60

const navSectionRefMap = {}

const clamp = (value, min, max) => {
  if (Number.isNaN(value)) {
    return min
  }
  return Math.min(Math.max(value, min), max)
}

const bottomNavShare = computed(() => (bottomNavItems.length ? 1 / bottomNavItems.length : 1))

const displayBottomNavIndex = computed(() => {
  return bottomNavState.isDragging ? bottomNavState.activeCandidate : activeBottomNavIndex.value
})

const bottomNavHighlightStyle = computed(() => {
  const share = bottomNavShare.value
  const translateShare = bottomNavState.isDragging ? bottomNavState.progress : activeBottomNavIndex.value * share
  const unit = share === 0 ? 0 : translateShare / share
  return {
    width: `${share * 100}%`,
    transform: `translate3d(${unit * 100}%, 0, 0)`
  }
})

const updateBottomNavMetrics = () => {
  if (!bottomNavRef.value) {
    bottomNavMetrics.width = 0
    bottomNavMetrics.left = 0
    return
  }
  const rect = bottomNavRef.value.getBoundingClientRect()
  bottomNavMetrics.width = rect.width
  bottomNavMetrics.left = rect.left
}

const syncBottomNavStateWithActive = () => {
  const share = bottomNavShare.value
  const maxProgress = Math.max(0, 1 - share)
  const targetProgress = clamp(activeBottomNavIndex.value * share, 0, maxProgress)
  bottomNavState.progress = targetProgress
  bottomNavState.activeCandidate = activeBottomNavIndex.value
}

const computeBottomNavProgress = (clientX) => {
  updateBottomNavMetrics()
  const width = bottomNavMetrics.width
  if (!width) {
    return { progress: bottomNavState.progress, index: activeBottomNavIndex.value }
  }
  const share = bottomNavShare.value
  const ratio = (clientX - bottomNavMetrics.left) / width
  const maxProgress = Math.max(0, 1 - share)
  const progress = clamp(ratio - share / 2, 0, maxProgress)
  const index = clamp(Math.round(progress / share), 0, bottomNavItems.length - 1)
  return { progress, index }
}

const setActiveBottomNavIndex = (index, { syncProgress = true } = {}) => {
  const normalized = clamp(index, 0, bottomNavItems.length - 1)
  activeBottomNavIndex.value = normalized
  if (syncProgress) {
    syncBottomNavStateWithActive()
  }
}

const scrollToSection = (targetKey) => {
  if (typeof window === 'undefined') {
    return
  }
  const refTarget = navSectionRefMap[targetKey]
  const element = refTarget?.value
  if (!element) {
    return
  }
  const rect = element.getBoundingClientRect()
  const currentScroll =
    window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
  const nextTop = currentScroll + rect.top - SCROLL_OFFSET
  window.scrollTo({
    top: nextTop < 0 ? 0 : nextTop,
    behavior: 'smooth'
  })
}

const handleBottomNavSelection = (index) => {
  const item = bottomNavItems[index]
  if (!item) return
  setActiveBottomNavIndex(index)
  if (item.key === 'home') {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    return
  }
  if (item.type === 'section' && item.target) {
    scrollToSection(item.target)
    return
  }
  if (item.type === 'route' && item.target) {
    const target = item.target
    if (typeof target === 'string') {
      router.push({ name: target })
    } else {
      router.push(target)
    }
    return
  }
  if (item.key === 'invite') {
    openRecruitPolicy()
  }
}

const handleBottomNavClick = (index) => {
  handleBottomNavSelection(index)
}

const handleBottomNavPointerDown = (event) => {
  if (!bottomNavItems.length) return
  event.preventDefault()
  const { progress, index } = computeBottomNavProgress(event.clientX)
  bottomNavState.isDragging = true
  bottomNavState.progress = progress
  bottomNavState.activeCandidate = index
  if (bottomNavRef.value?.setPointerCapture) {
    try {
      bottomNavRef.value.setPointerCapture(event.pointerId)
    } catch (error) {
      /* no-op */
    }
  }
}

const handleBottomNavPointerMove = (event) => {
  if (!bottomNavState.isDragging) return
  const { progress, index } = computeBottomNavProgress(event.clientX)
  bottomNavState.progress = progress
  bottomNavState.activeCandidate = index
}

const finalizeBottomNavInteraction = (clientX) => {
  const { index } = computeBottomNavProgress(clientX)
  bottomNavState.isDragging = false
  handleBottomNavSelection(index)
}

const handleBottomNavPointerUp = (event) => {
  if (!bottomNavState.isDragging) return
  if (bottomNavRef.value?.releasePointerCapture) {
    try {
      bottomNavRef.value.releasePointerCapture(event.pointerId)
    } catch (error) {
      /* no-op */
    }
  }
  finalizeBottomNavInteraction(event.clientX)
}

const handleBottomNavPointerCancel = (event) => {
  if (!bottomNavState.isDragging) return
  if (bottomNavRef.value?.releasePointerCapture) {
    try {
      bottomNavRef.value.releasePointerCapture(event.pointerId)
    } catch (error) {
      /* no-op */
    }
  }
  bottomNavState.isDragging = false
  syncBottomNavStateWithActive()
}

let sectionObserver = null

const teardownSectionObserver = () => {
  if (sectionObserver) {
    sectionObserver.disconnect()
    sectionObserver = null
  }
}

const setupSectionObserver = () => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return
  }
  teardownSectionObserver()
  const targets = Object.entries(navSectionRefMap)
    .map(([key, refObj]) => [key, refObj.value])
    .filter(([, el]) => el)

  if (!targets.length) {
    return
  }

  sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

      if (!visible.length || bottomNavState.isDragging) {
        return
      }

      if (typeof window !== 'undefined' && window.pageYOffset <= HOME_SCROLL_THRESHOLD) {
        setActiveBottomNavIndex(0)
        return
      }

      const sectionKey = visible[0].target.getAttribute('data-nav-key')
      if (!sectionKey) {
        return
      }
      const nextIndex = bottomNavItems.findIndex(item => item.key === sectionKey)
      if (nextIndex >= 0 && nextIndex !== activeBottomNavIndex.value) {
        setActiveBottomNavIndex(nextIndex)
      }
    },
    { threshold: [0.4, 0.6, 0.75] }
  )

  targets.forEach(([key, el]) => {
    el.setAttribute('data-nav-key', key)
    sectionObserver.observe(el)
  })
}

const handleViewportResize = () => {
  updateBottomNavMetrics()
  setupSectionObserver()
  renderPerformanceChart()
}

const handleScrollPosition = () => {
  if (typeof window === 'undefined') {
    return
  }
  if (window.pageYOffset <= HOME_SCROLL_THRESHOLD && !bottomNavState.isDragging) {
    setActiveBottomNavIndex(0)
  }
}

watch(selectedInstitutionId, async (newVal, oldVal) => {
  if (typeof window !== 'undefined') {
    try {
      if (typeof newVal === 'number' && !Number.isNaN(newVal)) {
        window.localStorage.setItem(INSTITUTION_STORAGE_KEY, String(newVal))
      } else {
        window.localStorage.removeItem(INSTITUTION_STORAGE_KEY)
      }
    } catch (error) {
      console.info('同步机构选择缓存失败:', error)
    }
  }

  if (isInitializing.value) {
    return
  }

  if (newVal === oldVal || typeof newVal !== 'number' || Number.isNaN(newVal)) {
    return
  }

  institutionAccessDeniedHandled = false
  await fetchStats()
  if (!institutionAccessDeniedHandled) {
    await fetchPerformanceTrend()
    await fetchMeituanCapacity()
  } else {
    resetMeituanCapacity(false)
  }
})

onMounted(async () => {
  await fetchStats()
  if (!institutionAccessDeniedHandled) {
    await fetchPerformanceTrend()
    await fetchMeituanCapacity()
  } else {
    resetMeituanCapacity(false)
  }
  isInitializing.value = false

  nextTick(() => {
    updateBottomNavMetrics()
    syncBottomNavStateWithActive()
    setupSectionObserver()
    setupPerformanceChartObserver()
    renderPerformanceChart()
  })

  window.addEventListener('resize', handleViewportResize)
  window.addEventListener('scroll', handleScrollPosition, { passive: true })
  handleScrollPosition()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleViewportResize)
  window.removeEventListener('scroll', handleScrollPosition)
  teardownSectionObserver()
  teardownPerformanceChartObserver()
  clearPerformanceChart()
})

watch(bottomNavShare, () => {
  syncBottomNavStateWithActive()
})
</script>

<style scoped>
.institution-portal {
  padding: 16px;
  background-color: #f5f7fb;
  min-height: 100vh;
  box-sizing: border-box;
  padding-bottom: calc(160px + env(safe-area-inset-bottom, 0px));
}

.institution-header {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  background: #fff;
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(31, 45, 61, 0.04);
  margin-bottom: 12px;
}

.institution-basic {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  flex-wrap: wrap;
  flex: 1 1 auto;
  min-width: 0;
}

.institution-quota-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(31, 45, 61, 0.08);
  background: linear-gradient(135deg, #ffffff 0%, #f7f9ff 100%);
  box-shadow: 0 10px 22px rgba(31, 45, 61, 0.06);
  min-width: 0;
}

.quota-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.quota-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
}

.quota-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3c8bff, #5bc0ff);
  box-shadow: 0 0 0 3px rgba(91, 192, 255, 0.18);
}

.quota-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  font-size: 11px;
  color: #60708f;
}

.quota-summary {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.quota-summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid rgba(60, 139, 255, 0.08);
  box-shadow: 0 6px 14px rgba(31, 60, 136, 0.06);
  min-width: 0;
}

.quota-summary-item--accent {
  border-color: rgba(255, 151, 74, 0.16);
  box-shadow: 0 6px 14px rgba(255, 151, 74, 0.12);
}

.quota-summary-label {
  font-size: 12px;
  font-weight: 500;
  color: #455164;
}

.quota-summary-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 20px;
  font-weight: 700;
  color: #1f2d3d;
}

.quota-summary-value span {
  font-size: 12px;
  font-weight: 400;
  color: #7a879d;
}

.quota-summary-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quota-summary-track {
  position: relative;
  flex: 1;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  background: rgba(60, 139, 255, 0.16);
}

.quota-summary-track--accent {
  background: rgba(255, 151, 74, 0.2);
}

.quota-summary-fill {
  position: absolute;
  inset: 0;
  width: 0;
  background: linear-gradient(90deg, #3c8bff 0%, #5bc0ff 100%);
  transition: width 0.3s ease;
}

.quota-summary-fill--accent {
  background: linear-gradient(90deg, #ff974a 0%, #ffc46b 100%);
}

.quota-summary-percent {
  font-size: 11px;
  color: #60708f;
  min-width: 28px;
  text-align: right;
}

.quota-summary-footer {
  font-size: 11px;
  color: #7a879d;
  display: flex;
  align-items: center;
  gap: 4px;
}

.quota-summary-actions {
  display: flex;
  justify-content: flex-end;
}

.quota-summary-actions .van-button {
  --van-button-mini-padding: 0 14px;
  font-size: 12px;
}

.quota-summary-actions + .quota-summary-footer {
  margin-top: 4px;
}

.quota-footnotes {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: #5a6780;
}

.quota-footnotes span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.purchase-drawer {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 20px 24px;
  box-sizing: border-box;
  background: #ffffff;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
}

.purchase-drawer__handle {
  width: 46px;
  height: 5px;
  border-radius: 999px;
  background: rgba(31, 45, 61, 0.18);
  margin: 0 auto 14px;
}

.purchase-drawer__header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  text-align: left;
}

.purchase-drawer__title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}

.purchase-drawer__subtitle {
  font-size: 13px;
  color: #5a6780;
}

.purchase-drawer__content {
  flex: 1;
  overflow-y: auto;
}

.purchase-benefits {
  list-style: none;
  padding: 0;
  margin: 0 0 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.purchase-benefits li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #455164;
}

.purchase-benefits .van-icon {
  color: #3c8bff;
  font-size: 16px;
  line-height: 1.4;
}

.purchase-price-block {
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(60, 139, 255, 0.12), rgba(60, 139, 255, 0.04));
  border: 1px solid rgba(60, 139, 255, 0.18);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.purchase-price-label {
  font-size: 13px;
  color: #4a5974;
}

.purchase-price-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2d3d;
}

.purchase-price-hint {
  font-size: 12px;
  color: #5a6780;
}

.purchase-drawer__footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
  padding-bottom: env(safe-area-inset-bottom, 12px);
}

.purchase-action {
  background: linear-gradient(135deg, #3c8bff, #5bc0ff);
  border: none;
}

.quota-state {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #60708f;
  background: rgba(31, 45, 61, 0.02);
  border-radius: 12px;
  padding: 12px;
}

.quota-state .van-icon {
  font-size: 18px;
  color: #1989fa;
}

.quota-state--error {
  color: #c62828;
  background: rgba(198, 40, 40, 0.08);
}

.quota-state--error .van-icon {
  color: #c62828;
}

.quota-state--disabled {
  color: #606266;
  background: rgba(144, 147, 153, 0.12);
}

.quota-state--disabled .van-icon {
  color: #909399;
}

.quota-state-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quota-state-tip {
  font-size: 11px;
  color: #909399;
}

.quota-retry {
  align-self: center;
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid rgba(198, 40, 40, 0.24);
  background: rgba(198, 40, 40, 0.08);
  color: #c62828;
  font-size: 11px;
  cursor: pointer;
}

.quota-retry:active {
  opacity: 0.84;
}
.institution-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

@media (max-width: 360px) {
  .institution-basic {
    gap: 10px;
  }

  .quota-summary {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 680px) {
  .institution-header {
    flex-direction: row;
    align-items: stretch;
  }

  .institution-basic {
    flex: 1 1 auto;
  }

  .institution-quota-card {
    flex: 0 0 320px;
  }
}

.institution-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}

.institution-status-tag {
  font-size: 11px;
  line-height: 1;
}

.institution-phone {
  font-size: 13px;
  color: #606266;
}

.institution-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.institution-parent {
  display: flex;
  align-items: center;
  gap: 6px;
}

.institution-parent-label {
  color: #909399;
}

.institution-parent-value {
  color: #1f2d3d;
  font-weight: 600;
}

.settings-entry {
  width: 30px;
  height: 30px;
  border-radius: 15px;
  background-color: #f2f3f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1989fa;
  margin-left: auto;
}

.performance-section,
.module-section {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(31, 45, 61, 0.04);
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
  margin-bottom: 12px;
}

.section-subtitle {
  font-size: 12px;
  color: #909399;
  font-weight: 400;
}

.performance-card {
  background: linear-gradient(180deg, #fdfefe 0%, #f7fbff 100%);
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 14px 40px rgba(17, 25, 40, 0.08);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.performance-card__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.performance-card__title {
  font-size: 20px;
  font-weight: 700;
  color: #1b2a41;
}

.performance-card__subtitle {
  font-size: 12px;
  color: #90a4c2;
  margin-top: 2px;
}

.performance-card__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  min-width: 200px;
}

.performance-refresh {
  align-self: flex-end;
}

.performance-range-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.performance-range-switch .range-chip {
  background: rgba(26, 115, 232, 0.08);
  color: #1a73e8;
  font-weight: 500;
}

.performance-range-switch .range-chip--active {
  background: linear-gradient(135deg, #1a73e8, #4f8bff);
  color: #fff;
  box-shadow: 0 8px 24px rgba(26, 115, 232, 0.35);
}

.range-chip {
  border: none;
  background: rgba(255, 140, 66, 0.12);
  color: #ff8c42;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.range-chip--active {
  background: linear-gradient(135deg, #ff8c42, #ff6a3d);
  color: #ffffff;
  box-shadow: 0 6px 18px rgba(255, 120, 60, 0.25);
}


.summary-change {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: #7b8aaa;
}

.summary-change--up {
  color: #22b07d;
}

.summary-change--down {
  color: #ee5a5a;
}

.summary-hint {
  color: #9aa6c0;
  font-size: 11px;
}

.performance-insight {
  margin-top: 12px;
  font-size: 12px;
  color: #6a7286;
}

.performance-layout {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
}

.performance-chart-panel {
  border-radius: 16px;
  padding: 12px 0 0;
  background: linear-gradient(180deg, rgba(31, 45, 61, 0.05), rgba(31, 45, 61, 0.01));
  position: relative;
  overflow: hidden;
  flex: 1 1 60%;
  min-width: 280px;
}

.performance-panel-state {
  min-height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: #7b8aaa;
}

.performance-panel-state--empty {
  color: #9aa6c0;
}
.performance-chart-wrapper {
  position: relative;
  width: 100%;
  min-height: 160px;
  padding-left: 2px;
}

.performance-chart-canvas {
  display: block;
  width: 100%;
  height: 160px;
}

.performance-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin-top: 16px;
  padding: 0 4px 12px;
}

.performance-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.04);
}

.performance-legend__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.performance-legend__meta {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.performance-legend__name {
  font-size: 12px;
  color: #1b2a41;
  font-weight: 600;
}

.performance-legend__value {
  font-size: 11px;
  color: #5f6b85;
  font-variant-numeric: tabular-nums;
}

.module-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.module-card {
  border-radius: 14px;
  padding: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 247, 251, 0.98));
  box-shadow: 0 4px 12px rgba(31, 45, 61, 0.06);
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.module-card:active {
  transform: translateY(2px);
  box-shadow: 0 2px 8px rgba(31, 45, 61, 0.1);
}

.module-card.disabled {
  cursor: default;
  opacity: 0.75;
}

.module-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.module-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
}

.module-card-title :deep(.van-icon) {
  font-size: 20px;
  color: #1989fa;
}

.module-card-desc {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
  min-height: 36px;
}

.channel-shortcut-section {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(31, 45, 61, 0.04);
  margin-bottom: 12px;
}

.channel-shortcut-grid {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.channel-shortcut-card {
  flex: 1;
  min-width: 0;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 247, 252, 0.98));
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.08);
  padding: 18px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.channel-shortcut-card:active {
  transform: translateY(2px);
  box-shadow: 0 2px 10px rgba(25, 137, 250, 0.16);
}

.channel-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.channel-title {
  font-size: 13px;
  color: #1f2d3d;
  font-weight: 600;
}

.institution-bottom-nav-spacer {
  height: calc(120px + env(safe-area-inset-bottom, 0px));
  width: 100%;
}

.institution-bottom-nav-wrapper {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
  display: flex;
  justify-content: center;
  padding: 0 24px;
  pointer-events: none;
  z-index: 2000;
}

.institution-bottom-nav {
  position: relative;
  width: min(360px, 100%);
  min-width: 260px;
  pointer-events: auto;
  padding: 12px;
  border-radius: 28px;
  isolation: isolate;
  touch-action: pan-x pinch-zoom;
  box-shadow:
    0 20px 40px rgba(255, 152, 86, 0.22),
    0 0 0 1px rgba(255, 198, 142, 0.32);
}

.institution-bottom-nav__blur,
.institution-bottom-nav__border {
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.institution-bottom-nav__blur {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(255, 235, 215, 0.42));
  opacity: 1;
  backdrop-filter: blur(22px) saturate(180%);
  -webkit-backdrop-filter: blur(22px) saturate(180%);
}

.institution-bottom-nav__border {
  border: 1px solid rgba(255, 200, 156, 0.55);
  background: linear-gradient(140deg, rgba(255, 248, 236, 0.5), rgba(255, 217, 174, 0.18));
  mix-blend-mode: screen;
  pointer-events: none;
  opacity: 0.85;
}

.institution-bottom-nav__track {
  position: relative;
  display: flex;
  align-items: stretch;
  width: 100%;
  border-radius: 22px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(255, 249, 240, 0.72), rgba(255, 232, 209, 0.44));
}

.institution-bottom-nav__highlight {
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 0;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(255, 173, 94, 0.85), rgba(255, 122, 48, 0.78));
  box-shadow:
    0 18px 28px rgba(255, 138, 52, 0.28),
    inset 0 0 0 1px rgba(255, 222, 188, 0.7);
  transition: transform 260ms cubic-bezier(0.18, 0.89, 0.32, 1.28);
  pointer-events: none;
  will-change: transform;
}

.institution-bottom-nav__highlight::before {
  content: '';
  position: absolute;
  inset: 10px 12px 14px;
  border-radius: inherit;
  background: radial-gradient(
    110% 110% at 26% 24%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.3) 55%,
    rgba(255, 255, 255, 0) 100%
  );
  opacity: 0.92;
  mix-blend-mode: screen;
}

.institution-bottom-nav__highlight::after {
  content: '';
  position: absolute;
  top: 12px;
  right: 18px;
  width: 42%;
  height: 44%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  filter: blur(12px);
  opacity: 0.7;
}

.institution-bottom-nav--dragging .institution-bottom-nav__highlight {
  transition: none;
}

.institution-bottom-nav__item {
  flex: 1;
  position: relative;
  z-index: 2;
  border: none;
  background: transparent;
  color: rgba(118, 64, 24, 0.65);
  font-size: 15px;
  font-weight: 600;
  padding: 18px 0 16px;
  cursor: pointer;
  transition: color 180ms ease, transform 180ms ease, text-shadow 180ms ease;
}

.institution-bottom-nav__item span {
  pointer-events: none;
}

.institution-bottom-nav__item--active {
  color: #3d220c;
  transform: translateY(-1px);
  text-shadow:
    0 1px 2px rgba(255, 236, 205, 0.8),
    0 0 6px rgba(255, 189, 120, 0.65);
}

.institution-bottom-nav__item:focus-visible {
  outline: none;
  color: #4d2c12;
}

@media (max-width: 420px) {
  .institution-bottom-nav-wrapper {
    padding: 0 16px;
  }

  .institution-bottom-nav {
    width: 100%;
    min-width: 0;
    padding: 10px;
    border-radius: 26px;
  }

  .institution-bottom-nav__item {
    font-size: 14px;
    padding: 16px 0 14px;
  }
}
</style>
