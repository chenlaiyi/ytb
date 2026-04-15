<template>
  <div class="meituan-dashboard">
    <van-pull-refresh v-model="refreshing" @refresh="handleRefresh">
      <section class="profile-section">
        <van-skeleton v-if="loading" title avatar :row="3" animated />
        <template v-else>
          <div class="profile-card">
            <van-image
              round
              width="64"
              height="64"
              fit="cover"
              :src="profile.avatar"
              :error-icon="'manager-o'"
            />
            <div class="profile-info">
              <div class="profile-name">
                {{ profile.name }}
                <van-tag
                  v-if="profile.roleText"
                  class="profile-role"
                  size="mini"
                  plain
                  :type="profile.roleTagType"
                >
                  {{ profile.roleText }}
                </van-tag>
              </div>
              <div class="profile-meta" v-if="profile.parentText">
                美团上级：{{ profile.parentText }}
              </div>
              <div class="profile-meta" v-if="profile.commissionRate">
                分润档位：{{ profile.commissionRate }}
              </div>
            </div>
            <div class="profile-cta">
              <van-button
                class="recruit-button"
                type="primary"
                size="small"
                round
                plain
                @click="openRecruitPolicy"
              >
                我要招商
              </van-button>
            </div>
          </div>
        </template>
      </section>

        <template v-if="!loading">
          <section class="quick-entry-section">
            <div class="quick-entry-grid">
              <div
                v-for="entry in quickEntries"
              :key="entry.key"
              class="quick-entry-card"
              @click="openShortcut(entry)"
            >
              <div class="quick-entry-icon" :class="entry.key">
                <van-icon :name="entry.icon" />
              </div>
              <div class="quick-entry-title">{{ entry.title }}</div>
            </div>
          </div>
        </section>

        <template v-if="meituanEnabled">
          <section class="summary-section">
            <div class="section-header">
              <span>数据概览</span>
            </div>
            <div class="summary-pill-row">
              <div
                v-for="metric in summaryBasicMetrics"
                :key="metric.key"
                class="summary-pill"
                :class="{ 'summary-pill--link': metric.clickable }"
                @click="handleSummaryMetricClick(metric)"
              >
                <span class="pill-label">{{ metric.label }}</span>
                <span class="pill-value">{{ metric.value }}</span>
                <span v-if="metric.sublabel" class="pill-sublabel">{{ metric.sublabel }}</span>
              </div>
            </div>
            <div class="summary-lines">
              <div class="summary-line">
                <span class="summary-line-label">
                  <van-icon name="bar-chart-o" />
                  销售额
                </span>
                <div class="summary-line-values">
                  <span>累计 <strong>{{ salesLine.total }}</strong></span>
                  <span class="summary-line-split">|</span>
                  <span>本月 <strong>{{ salesLine.month }}</strong></span>
                </div>
              </div>
              <div class="summary-line">
                <span class="summary-line-label">
                  <van-icon name="gold-coin-o" />
                  团队分润
                </span>
                <div class="summary-line-values">
                  <span>累计 <strong>{{ profitLine.total }}</strong></span>
                  <span class="summary-line-split">|</span>
                  <span>本月 <strong>{{ profitLine.month }}</strong></span>
                  <span v-if="profitLine.lastMonth" class="summary-line-note">上月 {{ profitLine.lastMonth }}</span>
                </div>
              </div>
              <div class="summary-line">
                <span class="summary-line-label">
                  <van-icon name="user-o" />
                  个人分润
                </span>
                <div class="summary-line-values">
                  <span>累计 <strong>{{ directProfitLine.total }}</strong></span>
                  <span class="summary-line-split">|</span>
                  <span>本月 <strong>{{ directProfitLine.month }}</strong></span>
                  <span v-if="directProfitLine.lastMonth" class="summary-line-note">上月 {{ directProfitLine.lastMonth }}</span>
                </div>
              </div>
            </div>
          </section>

          <section class="quota-section">
            <div class="institution-quota-card">
              <template v-if="meituanCapacity.loading">
                <van-skeleton :row="2" animated round />
              </template>
              <template v-else-if="meituanCapacity.error">
                <div class="quota-state quota-state--error">
                  <van-icon name="warning-o" />
                  <span>{{ meituanCapacity.error }}</span>
                  <button type="button" class="quota-retry" @click="fetchMeituanCapacity">重试</button>
                </div>
              </template>
              <template v-else-if="!meituanCapacity.enabled">
                <div class="quota-state quota-state--disabled">
                  <van-icon name="info-o" />
                  <div class="quota-state-text">
                    <span>美团渠道未开通，暂无法获取展业名额</span>
                    <span class="quota-state-tip">完成开通后可实时查看合伙人与销售额度</span>
                  </div>
                  <van-button
                    size="mini"
                    type="primary"
                    plain
                    round
                    @click="goToSettings"
                  >
                    去开通
                  </van-button>
                </div>
              </template>
              <template v-else>
                <div class="quota-header">
                  <div class="quota-title">
                    <span class="quota-dot" />
                    <span>展业名额</span>
                  </div>
                  <div class="quota-meta">
                    <span>运营中心服务包 {{ formatInteger(meituanCapacity.servicePackages) }} 份</span>
                    <span v-if="meituanCapacity.partnerPackages > 0">
                      合伙人服务包 {{ formatInteger(meituanCapacity.partnerPackages) }} 份
                    </span>
                  </div>
                </div>
                <div class="quota-summary">
                  <div class="quota-summary-item">
                    <div class="quota-summary-label">合伙人剩余名额</div>
                    <div class="quota-summary-value">
                      {{ formatInteger(meituanCapacity.partnerQuota.remaining) }}<span>名</span>
                    </div>
                    <div class="quota-summary-progress" v-if="meituanCapacity.partnerQuota.total > 0">
                      <div class="quota-summary-track">
                        <div class="quota-summary-fill" :style="{ width: `${partnerQuotaUsage}%` }" />
                      </div>
                      <span class="quota-summary-percent">{{ partnerQuotaUsage }}%</span>
                    </div>
                    <div class="quota-summary-footer">
                      已用 {{ formatInteger(meituanCapacity.partnerQuota.used) }}/{{ formatInteger(meituanCapacity.partnerQuota.total) }}
                    </div>
                    <div class="quota-summary-actions">
                      <van-button
                        size="mini"
                        type="primary"
                        plain
                        round
                        @click="openPurchaseDrawer('operation_center')"
                      >
                        了解套餐
                      </van-button>
                    </div>
                  </div>
                  <div class="quota-summary-item quota-summary-item--accent">
                    <div class="quota-summary-label">销售经理剩余名额</div>
                    <div class="quota-summary-value">
                      {{ formatInteger(meituanCapacity.salesQuota.remaining) }}<span>名</span>
                    </div>
                    <div class="quota-summary-progress" v-if="meituanCapacity.salesQuota.total > 0">
                      <div class="quota-summary-track quota-summary-track--accent">
                        <div
                          class="quota-summary-fill quota-summary-fill--accent"
                          :style="{ width: `${salesQuotaUsage}%` }"
                        />
                      </div>
                      <span class="quota-summary-percent">{{ salesQuotaUsage }}%</span>
                    </div>
                    <div class="quota-summary-footer">
                      已用 {{ formatInteger(meituanCapacity.salesQuota.used) }}/{{ formatInteger(meituanCapacity.salesQuota.total) }}
                    </div>
                    <div class="quota-summary-actions">
                      <van-button
                        size="mini"
                        type="warning"
                        plain
                        round
                        @click="openPurchaseDrawer('partner')"
                      >
                        了解套餐
                      </van-button>
                    </div>
                  </div>
                </div>
                <div class="quota-footnotes">
                  <span>运营中心服务包 {{ formatPriceWan(OPERATION_CENTER_PACKAGE_PRICE) }} · {{ formatInteger(partnerSlotsPerPackage) }} 名合伙人</span>
                  <span>合伙人服务包 {{ formatCurrency(PARTNER_PACKAGE_PRICE) }} · {{ formatInteger(salesSlotsPerPackage) }} 名销售经理</span>
                </div>
              </template>
            </div>
          </section>

          <section class="trend-section">
            <div class="section-header">
              <span>经营趋势</span>
              <div class="trend-actions">
                <van-tag v-if="trendMeta.isMock" size="mini" plain type="warning">
                  模拟数据
                </van-tag>
                <div class="range-switch">
                  <span
                    v-for="option in trendRangeOptions"
                    :key="option.value"
                    class="range-chip"
                    :class="{ active: option.value === selectedRange }"
                    @click="handleRangeChange(option.value)"
                  >
                    {{ option.label }}
                  </span>
                </div>
              </div>
            </div>
            <div class="trend-card">
              <div v-if="trendLoading" class="trend-loading">
                <van-loading size="24px" type="spinner" />
                <span>正在加载趋势数据...</span>
              </div>
              <div
                v-show="!trendLoading && hasTrendData"
                ref="trendChartRef"
                class="trend-chart"
              />
              <van-empty v-if="!trendLoading && !hasTrendData" description="暂无趋势数据" />
            </div>
          </section>
        </template>
        <template v-else>
          <section class="meituan-disabled-section">
            <van-empty
              class="meituan-disabled-empty"
              image="network"
              description="尚未开通美团渠道"
            >
              <template #bottom>
                <van-button type="primary" size="small" round @click="goToSettings">
                  前往开通
                </van-button>
              </template>
            </van-empty>
          </section>
        </template>
      </template>
    </van-pull-refresh>

    <van-popup
      v-model:show="purchaseDrawer.show"
      position="bottom"
      class="purchase-drawer"
      round
      :style="{ height: '70vh', maxHeight: '520px' }"
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

    <div class="institution-bottom-nav-spacer" aria-hidden="true" />
    <div class="institution-bottom-nav-wrapper">
      <div class="institution-bottom-nav">
        <div class="institution-bottom-nav__blur" />
        <div class="institution-bottom-nav__border" />
        <div class="institution-bottom-nav__track">
          <div class="institution-bottom-nav__highlight" :style="bottomNavHighlightStyle" />
          <button
            v-for="(item, index) in bottomNavItems"
            :key="item.key"
            type="button"
            class="institution-bottom-nav__item"
            :class="{ 'institution-bottom-nav__item--active': activeBottomNavIndex === index }"
            @click="handleBottomNavClick(index)"
          >
            <span>{{ item.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast, showToast } from 'vant'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent as EChartsGridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  getInstitutionMeituanDashboard,
  getInstitutionMeituanTrend,
  getInstitutionMeituanCommissions
} from '@/api/institution'
import { useUserStore } from '@/stores/user'

echarts.use([LineChart, EChartsGridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const userStore = useUserStore()
const router = useRouter()

const OPERATION_CENTER_PACKAGE_PRICE = 19800
const PARTNER_PACKAGE_PRICE = 3980

const loading = ref(true)
const refreshing = ref(false)
const trendLoading = ref(false)
const meituanEnabled = ref(true)

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

const profile = reactive({
  avatar: '',
  name: '—',
  roleText: '',
  roleTagType: 'primary',
  parentText: '',
  commissionRate: '',
  meituanEnabled: true
})

const summary = reactive({
  partnerTotal: 0,
  merchantTotal: 0,
  merchantTotalAllTime: 0,
  merchantTotalActive: 0,
  merchantScopeLabel: '',
  merchantScopeCaption: '',
  merchantScopeKey: '',
  merchantRange: null,
  totalSales: 0,
  totalProfit: 0,
  monthSales: 0,
  monthEstimatedProfit: 0,
  lastMonthProfit: 0,
  directTotalProfit: 0,
  directMonthProfit: 0,
  directLastMonthProfit: 0
})

function resetSummary() {
  summary.partnerTotal = 0
  summary.merchantTotal = 0
  summary.merchantTotalAllTime = 0
  summary.merchantTotalActive = 0
  summary.merchantScopeLabel = ''
  summary.merchantScopeCaption = ''
  summary.merchantScopeKey = ''
  summary.merchantRange = null
  summary.totalSales = 0
  summary.totalProfit = 0
  summary.monthSales = 0
  summary.monthEstimatedProfit = 0
  summary.lastMonthProfit = 0
  summary.directTotalProfit = 0
  summary.directMonthProfit = 0
  summary.directLastMonthProfit = 0
}

const trendPoints = ref([])
const selectedRange = ref(7)
const trendMeta = reactive({
  isMock: false
})
const trendChartRef = ref(null)
const trendChartInstance = ref(null)
const trendChartColors = ['#4C6EF5', '#FF7A45', '#13C2C2']

const trendRangeOptions = [
  { label: '近7天', value: 7 },
  { label: '近30天', value: 30 }
]

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
  meituanCapacity.servicePackages = Number(payload.service_package_count ?? payload.servicePackages ?? 0) || 0
  meituanCapacity.partnerPackages = Number(payload.partner_package_count ?? payload.partnerPackages ?? 0) || 0

  const partner = payload.partner_quota && typeof payload.partner_quota === 'object' ? payload.partner_quota : {}
  const partnerTotal = Number(partner.total ?? 0) || 0
  const partnerUsed = Math.min(partnerTotal, Number(partner.used ?? 0) || 0)
  const partnerPerPackage = Math.max(1, Number(partner.per_package ?? 20) || 20)
  Object.assign(meituanCapacity.partnerQuota, {
    total: partnerTotal,
    used: partnerUsed,
    remaining: Math.max(0, partnerTotal - partnerUsed),
    perPackage: partnerPerPackage
  })

  const sales = payload.sales_quota && typeof payload.sales_quota === 'object' ? payload.sales_quota : {}
  const salesTotal = Number(sales.total ?? 0) || 0
  const salesUsed = Math.min(salesTotal, Number(sales.used ?? 0) || 0)
  const salesPerPackage = Math.max(1, Number(sales.per_package ?? 30) || 30)
  const operationCenterLimit = sales.operation_center_limit ?? null
  const partnerBase = Math.max(1, Number(sales.partner_base ?? 30) || 30)
  Object.assign(meituanCapacity.salesQuota, {
    scope: sales.scope ? String(sales.scope) : null,
    total: salesTotal,
    used: salesUsed,
    remaining: Math.max(0, salesTotal - salesUsed),
    perPackage: salesPerPackage,
    operationCenterLimit,
    partnerBase
  })
}

async function fetchMeituanCapacity() {
  meituanCapacity.loading = true
  meituanCapacity.error = ''
  try {
    const res = await getInstitutionMeituanDashboard({ range: selectedRange.value })
    if (res?.code === 0) {
      applyMeituanCapacity(res.data?.meituan || res.data || {}, true)
    } else if (res?.code === 4605) {
      applyMeituanCapacity(res.data?.meituan || res.data || {}, false)
    } else if (res) {
      meituanCapacity.error = res.message || '获取美团额度失败'
    }
  } catch (error) {
    meituanCapacity.error = error?.message || '获取美团额度失败'
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
  router.push({
    name: 'InstitutionPolicy',
    query: { focus: packageType }
  })
}

const quickEntries = [
  {
    key: 'partners',
    title: '伙伴管理',
    icon: 'friends-o',
    target: { name: 'InstitutionPartners' }
  },
  {
    key: 'merchants',
    title: '商户管理',
    icon: 'shop-o',
    target: { name: 'InstitutionMerchants' }
  },
  {
    key: 'commissions',
    title: '分润明细',
    icon: 'gold-coin-o',
    target: { name: 'InstitutionCommissions' }
  },
  {
    key: 'orders',
    title: '交易查询',
    icon: 'orders-o',
    target: { name: 'InstitutionOrders' }
  }
]

const numberFormatter = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 })
const currencyFormatter = new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const hasTrendData = computed(() => trendPoints.value.length > 0)

const summaryBasicMetrics = computed(() => [
  {
    key: 'partners',
    label: '伙伴人数',
    value: formatInteger(summary.partnerTotal),
    clickable: true
  },
  {
    key: 'merchants',
    label: '商户总数',
    value: formatInteger(summary.merchantTotal),
    sublabel: merchantMetricSublabel.value
  }
])

const salesLine = computed(() => ({
  total: `¥ ${formatAmount(summary.totalSales)}`,
  month: `¥ ${formatAmount(summary.monthSales)}`
}))

const profitLine = computed(() => ({
  total: `¥ ${formatAmount(summary.totalProfit)}`,
  month: `¥ ${formatAmount(summary.monthEstimatedProfit)}`,
  lastMonth: summary.lastMonthProfit > 0 ? `¥ ${formatAmount(summary.lastMonthProfit)}` : ''
}))

const directProfitLine = computed(() => ({
  total: `¥ ${formatAmount(summary.directTotalProfit)}`,
  month: `¥ ${formatAmount(summary.directMonthProfit)}`,
  lastMonth: summary.directLastMonthProfit > 0 ? `¥ ${formatAmount(summary.directLastMonthProfit)}` : ''
}))

const purchaseDrawer = reactive({
  show: false,
  type: 'operation_center'
})

const currentPurchaseOption = computed(() => PURCHASE_OPTIONS[purchaseDrawer.type] ?? PURCHASE_OPTIONS.operation_center)
const purchaseDrawerTitle = computed(() => currentPurchaseOption.value.title)
const purchaseDrawerSubtitle = computed(() => currentPurchaseOption.value.subtitle)
const purchaseDrawerBenefits = computed(() => currentPurchaseOption.value.benefits)
const purchaseDrawerPrice = computed(() => formatPriceWan(currentPurchaseOption.value.price))
const purchaseDrawerHint = computed(() => currentPurchaseOption.value.hint)

const bottomNavItems = [
  { key: 'home', label: '首页', type: 'route', target: { name: 'InstitutionIndex' } },
  { key: 'promotion', label: '推广', type: 'route', target: { name: 'InstitutionPromotion' } },
  { key: 'business', label: '展业', type: 'route', target: { name: 'InstitutionBusiness' } },
  { key: 'invite', label: '邀请', type: 'route', target: { name: 'InstitutionInviteRegister' } }
]

const activeBottomNavIndex = ref(2) // 当前页面是“展业”
const bottomNavHighlightStyle = computed(() => {
  const share = bottomNavItems.length ? 1 / bottomNavItems.length : 1
  const unit = activeBottomNavIndex.value
  return {
    width: `${share * 100}%`,
    transform: `translate3d(${unit * 100}%, 0, 0)`
  }
})

const partnerQuotaUsage = computed(() => {
  const total = meituanCapacity.partnerQuota.total || 0
  if (total <= 0) return 0
  const used = Math.min(meituanCapacity.partnerQuota.used || 0, total)
  return Math.min(100, Math.round((used / total) * 100))
})

const salesQuotaUsage = computed(() => {
  const total = meituanCapacity.salesQuota.total || 0
  if (total <= 0) return 0
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

const merchantMetricSublabel = computed(() => {
  const parts = []
  if (summary.merchantScopeCaption) {
    parts.push(summary.merchantScopeCaption)
  } else if (summary.merchantScopeLabel) {
    parts.push(summary.merchantScopeLabel)
  }

  if (summary.merchantTotalAllTime > summary.merchantTotal) {
    parts.push(`累计 ${formatInteger(summary.merchantTotalAllTime)}`)
  }

  return parts.join(' ｜ ')
})

const trendSeries = computed(() => {
  const dates = []
  const sales = []
  const profits = []
  const merchants = []

  trendPoints.value.forEach(point => {
    dates.push(point.dateLabel)
    sales.push(point.sales)
    profits.push(point.profit)
    merchants.push(point.merchants)
  })

  return { dates, sales, profits, merchants }
})

function formatInteger(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return '0'
  }
  return numberFormatter.format(Math.max(0, numeric))
}

function formatCurrency(value) {
  const numeric = Number(value) || 0
  return `¥${numeric.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function formatPriceWan(value) {
  const numeric = Number(value) || 0
  if (numeric <= 0) {
    return formatCurrency(0)
  }
  if (Math.abs(numeric) >= 10000) {
    return `¥${(numeric / 10000).toFixed(2)}万`
  }
  return formatCurrency(numeric)
}

function formatAmount(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return '0.00'
  }
  if (Math.abs(numeric) >= 100000000) {
    return `${(numeric / 100000000).toFixed(2)}亿`
  }
  if (Math.abs(numeric) >= 10000) {
    return `${(numeric / 10000).toFixed(2)}万`
  }
  return currencyFormatter.format(numeric)
}

function formatChartShortAmount(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return '0'
  }

  const abs = Math.abs(numeric)
  const sign = numeric < 0 ? '-' : ''

  if (abs >= 100000000) {
    const digits = abs >= 1000000000 ? 0 : 1
    return `${sign}${(abs / 100000000).toFixed(digits)}亿`
  }

  if (abs >= 10000) {
    const digits = abs >= 100000 ? 0 : 1
    return `${sign}${(abs / 10000).toFixed(digits)}w`
  }

  if (abs >= 1) {
    const rounded = Math.round(abs)
    return `${sign}${rounded}`
  }

  return `${sign}${abs.toFixed(2)}`
}

const personalCommissionFallbackState = reactive({
  loading: false
})

const formatDateInput = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function requestPersonalCommissionSummary(range = {}) {
  const params = {
    scope: 'personal',
    limit: 1
  }
  if (range.start) {
    params.start_date = range.start
  }
  if (range.end) {
    params.end_date = range.end
  }
  const response = await getInstitutionMeituanCommissions(params)
  if (!response || response.code !== 0) {
    throw new Error(response?.message || '获取个人分润失败')
  }
  const commission = Number(response?.data?.summary?.personal?.commission ?? 0)
  return Number.isFinite(commission) ? commission : 0
}

async function fetchCommissionSummariesFallback(force = false) {
  const needsFallback = force || (
    summary.directTotalProfit === 0 &&
    summary.directMonthProfit === 0 &&
    summary.directLastMonthProfit === 0
  )

  if (!needsFallback || personalCommissionFallbackState.loading) {
    return
  }

  personalCommissionFallbackState.loading = true
  try {
    const now = new Date()
    const monthStart = formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1))
    const today = formatDateInput(now)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const [total, month, lastMonth] = await Promise.all([
      requestPersonalCommissionSummary(),
      requestPersonalCommissionSummary({ start: monthStart, end: today }),
      requestPersonalCommissionSummary({
        start: formatDateInput(lastMonthStart),
        end: formatDateInput(lastMonthEnd)
      })
    ])

    summary.directTotalProfit = total
    summary.directMonthProfit = month
    summary.directLastMonthProfit = lastMonth
  } catch (error) {
    console.warn('Fallback personal commission summary failed', error)
  } finally {
    personalCommissionFallbackState.loading = false
  }
}

function normalizeProfile(data = {}) {
  const enabled = data.enabled !== undefined ? !!data.enabled : true
  const avatar = data.avatar || userStore.userAvatar || 'https://img.itapgo.com/profile/default-institution.png'
  const name =
    data.name ||
    data.nickname ||
    userStore.userInfo?.name ||
    userStore.userInfo?.institution_name ||
    '支付机构'
  const baseRoleSource = data.role_text ?? data.role ?? ''
  const baseRoleText =
    typeof baseRoleSource === 'string' ? baseRoleSource : String(baseRoleSource ?? '')
  const roleText = baseRoleText || (enabled ? '' : '未开通')
  const parent = data.parent || null
  const parentText = parent ? buildParentText(parent) : ''

  profile.avatar = avatar
  profile.name = name
  profile.roleText = roleText
  profile.roleTagType = enabled ? resolveRoleTagType(roleText) : 'danger'
  profile.parentText = parentText
  profile.commissionRate = data.commission_rate || ''
  profile.meituanEnabled = enabled
}

function resolveRoleTagType(roleText) {
  const text =
    typeof roleText === 'string' ? roleText : String(roleText ?? '').trim()
  if (!text) return 'primary'
  if (text.includes('运营')) return 'primary'
  if (text.includes('合伙')) return 'success'
  if (text.includes('销售')) return 'warning'
  return 'primary'
}

function buildParentText(parent) {
  const name = parent.name || '未命名'
  const role = resolveParentRoleText(parent)
  if (!role) {
    return name
  }
  return `${name}（${role}）`
}

function resolveParentRoleText(parent) {
  const candidate =
    parent.role_text ||
    parent.roleText ||
    parent.role ||
    parent.level_text ||
    parent.level ||
    ''
  if (!candidate) {
    return ''
  }
  const normalized = String(candidate).trim()
  if (!normalized) {
    return ''
  }
  const ALLOWED_ROLES = ['运营总部', '运营中心', '合伙人', '销售经理']
  const matched = ALLOWED_ROLES.find(role => normalized.includes(role))
  return matched || normalized
}

function normalizeSummary(data = {}) {
  summary.partnerTotal = toNumber(data.partner_total ?? data.partners)
  const merchantDisplay = toNumber(data.merchant_total ?? data.merchants)
  const merchantActive = toNumber(data.merchant_total_active ?? data.merchantTotalActive ?? merchantDisplay)
  const merchantAllTime = Math.max(
    merchantDisplay,
    merchantActive,
    toNumber(data.merchant_total_all_time ?? data.merchantTotalAllTime ?? merchantDisplay)
  )

  summary.merchantTotal = merchantDisplay
  summary.merchantTotalActive = merchantActive
  summary.merchantTotalAllTime = merchantAllTime
  summary.merchantScopeLabel = data.merchant_total_scope_label ?? data.merchantTotalScopeLabel ?? ''
  summary.merchantScopeCaption = data.merchant_total_scope_caption ?? data.merchantTotalScopeCaption ?? ''
  summary.merchantScopeKey = data.merchant_total_scope ?? data.merchantTotalScope ?? ''
  summary.merchantRange = data.merchant_total_range ?? data.merchantTotalRange ?? null
  summary.totalSales = toNumber(data.total_sales)
  summary.totalProfit = toNumber(data.total_profit ?? data.total_commission ?? data.team_total_profit)
  summary.monthSales = toNumber(data.month_sales)
  summary.monthEstimatedProfit = toNumber(data.month_estimated_profit ?? data.month_commission_estimated ?? data.team_month_profit)
  summary.lastMonthProfit = toNumber(data.last_month_profit ?? data.prev_month_profit ?? data.team_last_month_profit)
  // 前端展示的「个人分润」取值优先顺序：
  // 1) 美团工作台 summary 中 direct_* 字段
  // 2) summary.personal 对象中的 commission 字段（后端可能只在该节点返回）
  // 3) 其他历史命名兼容
  const personalSummary = data.personal || data.personal_summary || data.personalSummary || data.self || {}

  const directTotal = toNumber(
    data.direct_total_profit ??
    data.direct_total_commission ??
    data.directCommissionTotal ??
    data.direct_profit_total ??
    data.direct_commission_total ??
    data.self_total_profit ??
    data.personal_total_profit ??
    data.personal_profit_total ??
    data.my_total_profit ??
    data.direct_profit ??
    data.direct_commission ??
    data.directTotalProfit ??
    personalSummary.commission ??
    personalSummary.total_commission ??
    personalSummary.total_profit ??
    personalSummary.totalProfit
  )

  const directMonth = toNumber(
    data.direct_month_profit ??
    data.direct_month_commission ??
    data.personal_month_profit ??
    data.self_month_profit ??
    data.direct_profit_month ??
    data.direct_commission_month ??
    data.my_month_profit ??
    data.directMonthProfit ??
    personalSummary.month_commission ??
    personalSummary.month_profit ??
    personalSummary.monthProfit
  )

const directLastMonth = toNumber(
    data.direct_last_month_profit ??
    data.direct_last_month_commission ??
    data.personal_last_month_profit ??
    data.self_last_month_profit ??
    data.direct_profit_last_month ??
    data.direct_commission_last_month ??
    data.my_last_month_profit ??
    data.directLastMonthProfit ??
    personalSummary.last_month_commission ??
    personalSummary.last_month_profit ??
    personalSummary.prev_month_commission ??
    personalSummary.prev_month_profit ??
    personalSummary.previous_month_commission ??
    personalSummary.previous_month_profit ??
    personalSummary.lastMonthProfit
  )

  summary.directTotalProfit = directTotal
  summary.directMonthProfit = directMonth
  summary.directLastMonthProfit = directLastMonth

  if (!summary.merchantScopeCaption) {
    summary.merchantScopeCaption = summary.merchantScopeKey === 'recent_active' ? '近30日活跃' : '累计'
  }
  if (!summary.merchantScopeLabel) {
    summary.merchantScopeLabel = summary.merchantScopeCaption
  }
}

function normalizeTrend(points = []) {
  return points
    .map(item => {
      const dateText = item.date || item.day || item.label || ''
      return {
        dateLabel: dateText,
        sales: toNumber(item.sales ?? item.amount ?? item.total_sales),
        profit: toNumber(item.profit ?? item.commission ?? item.total_profit),
        merchants: toNumber(item.merchant_total ?? item.merchants ?? item.merchant_count)
      }
    })
    .filter(point => point.dateLabel)
}

function ensureTrendPoints(rawPoints, options = {}) {
  const { range = selectedRange.value, allowMock = true } = options
  const normalized = normalizeTrend(rawPoints)
  if (normalized.length) {
    trendMeta.isMock = false
    trendPoints.value = normalized
    return
  }
  if (!allowMock) {
    trendMeta.isMock = false
    trendPoints.value = []
    return
  }
  trendMeta.isMock = true
  trendPoints.value = buildMockTrend(range)
}

function buildMockTrend(range) {
  const days = Math.max(7, Math.min(Math.floor(Number(range) || 7), 365))
  const today = new Date()
  const items = []
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - offset)
    const normalized = (days - offset - 1) / Math.max(days - 1, 1)
    const wave = Math.sin(normalized * Math.PI * 1.6)
    const sales = Math.round(15000 + normalized * 10000 + wave * 2500)
    const profit = Math.round(sales * (0.12 + wave * 0.015))
    const merchants = Math.max(1, Math.round(18 + normalized * 20 + wave * 4))
    items.push({
      dateLabel: formatMockDateLabel(date, days),
      sales,
      profit,
      merchants
    })
  }
  return items
}

function formatMockDateLabel(date, days) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  if (days > 92) {
    return `${date.getFullYear()}-${month}-${day}`
  }
  return `${month}-${day}`
}

function toNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

async function fetchDashboard(options = {}) {
  const { silent = false } = options
  if (!silent) {
    loading.value = true
  }
  try {
    const params = { range: selectedRange.value }
    const response = await getInstitutionMeituanDashboard(params)
    const data = response.data || {}

    if (response.code === 4605) {
      normalizeProfile(data.profile || {})
      meituanEnabled.value = profile.meituanEnabled
      resetSummary()
      normalizeSummary(data.summary || {})
      applyMeituanCapacity(data.meituan || {}, false)
      const disabledRange = Number(data.trend?.range)
      if (Number.isFinite(disabledRange) && trendRangeOptions.some(option => option.value === disabledRange)) {
        selectedRange.value = disabledRange
      }
      ensureTrendPoints(data.trend?.points || [], { range: selectedRange.value, allowMock: false })
      await nextTick()
      updateTrendChart()
      return
    }

    if (response.code !== 0) {
      throw new Error(response.message || '获取美团数据失败')
    }

    normalizeProfile(data.profile || data.user || {})
    meituanEnabled.value = profile.meituanEnabled !== undefined ? profile.meituanEnabled : true
    normalizeSummary(data.summary || {})
    applyMeituanCapacity(data.meituan || {}, meituanEnabled.value)
    await fetchCommissionSummariesFallback(true)

    const dashboardTrendPoints = Array.isArray(data.trend?.points) ? data.trend.points : null
    if (dashboardTrendPoints && dashboardTrendPoints.length > 0) {
      const rangeValue = Number(data.trend.range)
      if (Number.isFinite(rangeValue) && trendRangeOptions.some(option => option.value === rangeValue)) {
        selectedRange.value = rangeValue
      }
      ensureTrendPoints(dashboardTrendPoints, { range: selectedRange.value })
    } else {
      ensureTrendPoints([], { range: selectedRange.value, allowMock: false })
      try {
        await fetchTrend(selectedRange.value)
      } catch (trendError) {
        console.warn('fetchTrend fallback failed', trendError)
      }
    }

    if (!silent && loading.value) {
      loading.value = false
    }
    await nextTick()
    updateTrendChart()
  } catch (error) {
    console.error('fetchDashboard failed', error)
    showFailToast(error.message || '获取美团数据失败')
    throw error
  } finally {
    if (!silent) {
      loading.value = false
    }
  }
}

async function fetchTrend(range) {
  trendLoading.value = true
  try {
    const response = await getInstitutionMeituanTrend({ range })
    const data = response.data || {}

    if (response.code === 4605) {
      meituanEnabled.value = false
      profile.meituanEnabled = false
      applyMeituanCapacity(data.meituan || {}, false)
      ensureTrendPoints(data.points || [], { range, allowMock: false })
      await nextTick()
      updateTrendChart()
      return
    }

    if (response.code !== 0) {
      throw new Error(response.message || '获取趋势数据失败')
    }
    ensureTrendPoints(data.points || [], { range, allowMock: false })
    await nextTick()
    updateTrendChart()
  } catch (error) {
    console.error('fetchTrend failed', error)
    showFailToast(error.message || '获取趋势数据失败')
    throw error
  } finally {
    trendLoading.value = false
  }
}

async function handleRangeChange(range) {
  if (range === selectedRange.value || trendLoading.value) {
    return
  }
  const previousRange = selectedRange.value
  selectedRange.value = range
  if (!meituanEnabled.value) {
    return
  }
  trendLoading.value = true
  try {
    await fetchDashboard({ silent: true })
  } catch (error) {
    selectedRange.value = previousRange
  } finally {
    trendLoading.value = false
  }
}

function openShortcut(entry) {
  if (!entry || !entry.target) {
    showToast('功能开发中，敬请期待')
    return
  }
  router.push(entry.target)
}

function handleSummaryMetricClick(metric) {
  if (!metric || !metric.key) {
    return
  }
  if (metric.key === 'partners') {
    router.push({ name: 'InstitutionPartners', query: { scope: 'team' } })
  }
}

async function handleRefresh() {
  try {
    await Promise.all([
      fetchDashboard({ silent: true }),
      fetchMeituanCapacity(),
      fetchCommissionSummariesFallback()
    ])
    showToast(meituanEnabled.value ? '已更新美团数据' : '美团渠道尚未开通')
  } catch (error) {
    console.warn('refresh failed', error)
  } finally {
    refreshing.value = false
  }
}

function initTrendChart() {
  if (!trendChartRef.value) {
    return
  }
  if (!trendChartInstance.value) {
    trendChartInstance.value = echarts.init(trendChartRef.value)
  }
}

function updateTrendChart() {
  if (!trendChartRef.value) {
    return
  }
  initTrendChart()
  if (!trendChartInstance.value) {
    return
  }

  if (!meituanEnabled.value || !hasTrendData.value) {
    trendChartInstance.value.clear()
    return
  }

  const series = trendSeries.value
  const option = {
    color: trendChartColors,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      valueFormatter(value, seriesItem) {
        if (seriesItem?.seriesName === '商户数') {
          return formatInteger(value)
        }
        return formatChartShortAmount(value)
      }
    },
    legend: {
      data: ['销售额', '分润', '商户数'],
      icon: 'circle',
      textStyle: {
        color: '#606266'
      }
    },
    grid: {
      left: '6%',
      right: '4%',
      bottom: '12%',
      top: '14%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: series.dates,
      axisLabel: {
        color: '#606266'
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(31, 45, 61, 0.18)'
        }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '金额 (元)',
        axisLabel: {
          formatter: value => formatChartShortAmount(value),
          color: '#606266',
          margin: 12
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(31, 45, 61, 0.18)'
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(31, 45, 61, 0.08)'
          }
        }
      },
      {
        type: 'value',
        name: '商户数',
        position: 'right',
        axisLabel: {
          formatter: value => formatInteger(value),
          color: '#606266'
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(31, 45, 61, 0.18)'
          }
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        data: series.sales,
        lineStyle: {
          width: 3
        },
        areaStyle: {
          opacity: 0.08
        }
      },
      {
        name: '分润',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        data: series.profits,
        lineStyle: {
          width: 2
        },
        areaStyle: {
          opacity: 0.05
        }
      },
      {
        name: '商户数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        yAxisIndex: 1,
        data: series.merchants,
        lineStyle: {
          width: 2,
          type: 'dashed'
        },
        areaStyle: {
          opacity: 0
        }
      }
    ]
  }

  trendChartInstance.value.setOption(option)
}

function formatAxisAmount(value) {
  return formatChartShortAmount(value)
}

function handleResize() {
  if (trendChartInstance.value) {
    trendChartInstance.value.resize()
  }
}

function goToSettings() {
  router.push({ name: 'InstitutionSettings' })
}

function openRecruitPolicy() {
  router.push({ name: 'RecruitManual' })
}

function handleBottomNavClick(index) {
  const normalized = Math.max(0, Math.min(index, bottomNavItems.length - 1))
  activeBottomNavIndex.value = normalized
  const item = bottomNavItems[normalized]
  if (item?.target) {
    router.push(item.target)
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      fetchDashboard(),
      fetchMeituanCapacity()
    ])
  } catch (error) {
    console.warn('initial meituan dashboard load failed', error)
  }
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (trendChartInstance.value) {
    trendChartInstance.value.dispose()
    trendChartInstance.value = null
  }
})
</script>

<style scoped>
.meituan-dashboard {
  min-height: 100vh;
  background: #f5f7fb;
  padding: 16px;
  box-sizing: border-box;
}

.profile-section,
.summary-section,
.trend-section {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(31, 45, 61, 0.04);
  margin-bottom: 12px;
}

.summary-section {
  padding: 10px 12px 12px;
}

.quick-entry-section {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(31, 45, 61, 0.04);
  margin-bottom: 12px;
}

.quick-entry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(94px, 1fr));
  gap: 12px;
}

.quick-entry-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: #f7f8fa;
  border-radius: 12px;
  padding: 12px 10px;
  transition: background 0.2s ease;
}

.quick-entry-card:active {
  background: #eef3ff;
}

.quota-section {
  background: none;
  margin-bottom: 12px;
}

.institution-quota-card {
  background: #fff;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 12px 30px rgba(31, 45, 61, 0.08);
  border: 1px solid rgba(25, 137, 250, 0.06);
}

.quota-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.quota-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
}

.quota-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(120deg, #4facfe, #00f2fe);
}

.quota-meta {
  font-size: 12px;
  color: #8c8f94;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.quota-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.quota-summary-item {
  background: #f8fbff;
  border-radius: 14px;
  padding: 14px;
  border: 1px solid rgba(79, 172, 254, 0.12);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quota-summary-item--accent {
  background: #fff8f1;
  border-color: rgba(255, 151, 2, 0.18);
}

.quota-summary-label {
  font-size: 13px;
  color: #606266;
}

.quota-summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2d3d;
  line-height: 1.2;
}

.quota-summary-value span {
  font-size: 14px;
  margin-left: 4px;
  color: #7b8190;
}

.quota-summary-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.quota-summary-track {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: rgba(79, 172, 254, 0.16);
  overflow: hidden;
}

.quota-summary-track--accent {
  background: rgba(255, 151, 2, 0.18);
}

.quota-summary-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(120deg, #4facfe, #00f2fe);
  transition: width 0.3s ease;
}

.quota-summary-fill--accent {
  background: linear-gradient(120deg, #ffac3e, #ff6f00);
}

.quota-summary-footer {
  font-size: 12px;
  color: #8c8f94;
}

.quota-summary-actions {
  display: flex;
  justify-content: flex-end;
}

.quota-footnotes {
  margin-top: 12px;
  font-size: 11px;
  color: #a0a4ab;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.quota-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: #f8f9fb;
  font-size: 13px;
  color: #5f626a;
}

.quota-state--error {
  color: #d93026;
  background: #fff1f0;
}

.quota-state--disabled {
  flex-direction: column;
  align-items: flex-start;
}

.quota-state-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quota-state-tip {
  font-size: 12px;
  color: #a0a4ab;
}

.quota-retry {
  border: none;
  background: #f0f5ff;
  color: #2f54eb;
  border-radius: 999px;
  padding: 4px 12px;
  cursor: pointer;
}

.purchase-drawer {
  padding: 16px;
  box-sizing: border-box;
}

.purchase-drawer__handle {
  width: 40px;
  height: 4px;
  border-radius: 999px;
  background: #e0e3ee;
  margin: 0 auto 16px;
}

.purchase-drawer__header {
  text-align: center;
  margin-bottom: 12px;
}

.purchase-drawer__title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}

.purchase-drawer__subtitle {
  font-size: 13px;
  color: #7b8190;
  margin-top: 4px;
}

.purchase-benefits {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.purchase-benefits li {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4e5969;
  font-size: 14px;
}

.purchase-price-block {
  margin-top: 16px;
  text-align: center;
}

.purchase-price-label {
  font-size: 13px;
  color: #8c8f94;
}

.purchase-price-value {
  font-size: 26px;
  font-weight: 700;
  color: #1f2d3d;
  margin: 6px 0;
}

.purchase-price-hint {
  font-size: 12px;
  color: #909399;
}

.purchase-drawer__footer {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.institution-bottom-nav-spacer {
  height: calc(110px + env(safe-area-inset-bottom, 0px));
}

.institution-bottom-nav-wrapper {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 18px 18px;
  pointer-events: none;
}

.institution-bottom-nav {
  position: relative;
  width: 100%;
  border-radius: 28px;
  overflow: hidden;
  pointer-events: auto;
}

.institution-bottom-nav__blur,
.institution-bottom-nav__border {
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.institution-bottom-nav__blur {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.9);
}

.institution-bottom-nav__border {
  border: 1px solid rgba(14, 122, 255, 0.08);
}

.institution-bottom-nav__track {
  position: relative;
  display: flex;
  align-items: center;
  padding: 4px;
}

.institution-bottom-nav__highlight {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  border-radius: 24px;
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  transition: transform 0.25s ease;
}

.institution-bottom-nav__item {
  position: relative;
  flex: 1;
  border: none;
  background: transparent;
  z-index: 1;
  height: 44px;
  border-radius: 24px;
  color: #4e5969;
  font-weight: 600;
}

.institution-bottom-nav__item span {
  opacity: 0.8;
}

.institution-bottom-nav__item--active span {
  color: #fff;
  opacity: 1;
}

.institution-bottom-nav__item:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px rgba(79, 172, 254, 0.35);
}

.quick-entry-icon {
  width: 34px;
  height: 34px;
  border-radius: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(25, 137, 250, 0.12);
  color: #1989fa;
  font-size: 18px;
}

.quick-entry-icon.commissions {
  background: rgba(250, 173, 20, 0.16);
  color: #faad14;
}

.quick-entry-icon.orders {
  background: rgba(82, 196, 26, 0.14);
  color: #52c41a;
}

.quick-entry-title {
  font-size: 12px;
  font-weight: 600;
  color: #1f2d3d;
  text-align: center;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.profile-cta {
  margin-left: auto;
}

.recruit-button {
  font-size: 12px;
  padding: 0 16px;
  line-height: 28px;
  height: 30px;
}

.profile-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}

.profile-role {
  font-size: 11px;
  line-height: 1;
}

.profile-meta {
  font-size: 13px;
  color: #606266;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
  margin-bottom: 12px;
}


.summary-section {
  padding: 10px 12px;
  border-radius: 12px;
}

.summary-pill-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}

.summary-pill {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(31, 45, 61, 0.04);
  border: 1px solid rgba(31, 45, 61, 0.06);
}

.summary-pill--link {
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.summary-pill--link:active {
  transform: translateY(1px);
  box-shadow: 0 8px 16px rgba(26, 104, 255, 0.18);
  border-color: rgba(26, 104, 255, 0.25);
}

.pill-label {
  font-size: 11px;
  font-weight: 500;
  color: rgba(31, 45, 61, 0.68);
}

.pill-value {
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
  font-variant-numeric: tabular-nums;
}

.pill-sublabel {
  font-size: 11px;
  color: #909399;
}

.summary-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(31, 45, 61, 0.02);
  border: 1px dashed rgba(31, 45, 61, 0.08);
  font-size: 12px;
}

.summary-line-label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(31, 45, 61, 0.75);
}

.summary-line-label .van-icon {
  font-size: 14px;
  color: inherit;
}

.summary-line-values {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #1f2d3d;
  font-size: 12px;
}

.summary-line-values strong {
  font-size: 13px;
  font-weight: 600;
  color: #1f2d3d;
}

.summary-line-split {
  color: rgba(31, 45, 61, 0.3);
  font-size: 11px;
}

.summary-line-note {
  margin-left: 4px;
  color: #909399;
  font-size: 11px;
}

@media (max-width: 360px) {
  .summary-pill {
    min-width: 100%;
  }

  .profile-card {
    gap: 10px;
  }

  .profile-cta {
    width: 100%;
    margin-left: 0;
  }

  .recruit-button {
    width: 100%;
  }
}

.trend-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.range-chip {
  padding: 4px 10px;
  border-radius: 16px;
  background: #f2f3f5;
  font-size: 12px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s ease;
}

.range-chip.active {
  background: rgba(25, 137, 250, 0.12);
  color: #1989fa;
  font-weight: 600;
}

.trend-card {
  position: relative;
  min-height: 260px;
  margin: 0 -12px;
  padding: 0 12px;
}

.trend-chart {
  width: 100%;
  height: 260px;
}

.trend-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.85);
  z-index: 1;
  border-radius: 16px;
  font-size: 13px;
  color: #606266;
}

.meituan-disabled-section {
  background: #fff;
  border-radius: 16px;
  padding: 32px 16px;
  box-shadow: 0 4px 12px rgba(31, 45, 61, 0.04);
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 220px;
}

.meituan-disabled-empty :deep(.van-empty__description) {
  font-size: 14px;
  color: #606266;
}

.meituan-disabled-empty :deep(.van-button) {
  padding: 0 16px;
}

.van-empty {
  padding-top: 40px;
}
</style>
