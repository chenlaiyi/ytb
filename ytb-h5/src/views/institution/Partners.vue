<template>
  <div class="institution-partners">
    <van-nav-bar
      title="伙伴管理"
      left-arrow
      fixed
      placeholder
      safe-area-inset-top
      @click-left="handleBack"
    />

    <section class="partner-summary" v-if="currentSummary.loaded">
      <div class="summary-grid">
        <div class="summary-card summary-card--primary">
          <header>
            <div class="summary-label">
              <van-icon name="friends-o" />
              团队伙伴
            </div>
            <span class="summary-total">{{ currentSummary.total }}</span>
          </header>
          <footer>
            <span>直属伙伴 {{ currentSummary.direct_total }}</span>
            <span>可用筛选 {{ currentSummary.available_levels.length - 1 }}</span>
          </footer>
        </div>
        <div class="summary-card">
          <header>
            <div class="summary-label">
              <van-icon name="bar-chart-o" />
              团队成交额
            </div>
            <span class="summary-amount">
              {{ formatAmount(currentSummary.overview.sales_total_amount) }}
            </span>
          </header>
          <footer>
            <span>本月 {{ formatAmount(currentSummary.overview.sales_month_amount) }}</span>
            <span>净入账 {{ formatAmount(currentSummary.overview.net_total_amount) }}</span>
          </footer>
        </div>
        <div class="summary-card">
          <header>
            <div class="summary-label">
              <van-icon name="gold-coin-o" />
              团队分润
            </div>
            <span class="summary-amount">
              {{ formatAmount(currentSummary.overview.commission_total_amount) }}
            </span>
          </header>
          <footer>
            <span>本月 {{ formatAmount(currentSummary.overview.commission_month_amount) }}</span>
            <span>团队商户 {{ currentSummary.overview.merchant_total }}</span>
          </footer>
        </div>
      </div>
      <p class="summary-hint">数据统计包含当前机构及其团队成员，更新时间 {{ formatGeneratedAt(currentSummary.generated_at) }}</p>
    </section>

    <van-tabs
      v-model:active="activeScope"
      sticky
      :offset-top="navOffsetTop"
      color="#1a68ff"
      title-active-color="#1a68ff"
      background="#f7f8fc"
    >
      <van-tab name="team" title="团队伙伴">
        <PartnerFilters
          scope="team"
          v-model:searchKeyword="searchKeyword"
          :state="listState.team"
          :level-options="levelOptions('team')"
          @search="handleSearch"
          @change-level="changeLevel"
        />
        <PartnerList
          scope="team"
          :state="listState.team"
          @load="handleListLoad"
          @refresh="handleRefresh"
          @retry="retryFetch"
        />
      </van-tab>

      <van-tab name="direct" title="直属伙伴">
        <PartnerFilters
          scope="direct"
          v-model:searchKeyword="searchKeyword"
          :state="listState.direct"
          :level-options="levelOptions('direct')"
          @search="handleSearch"
          @change-level="changeLevel"
        />
        <PartnerList
          scope="direct"
          :state="listState.direct"
          @load="handleListLoad"
          @refresh="handleRefresh"
          @retry="retryFetch"
        />
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showFailToast } from 'vant'
import { getInstitutionMeituanPartners } from '@/api/institution'
import { formatAmount as formatCurrency } from '@/utils/format'
import PartnerList from './components/PartnerList.vue'
import PartnerFilters from './components/PartnerFilters.vue'

const router = useRouter()
const route = useRoute()

const navOffsetTop = 46
const pageSize = 20

const activeScope = ref('team')
const searchKeyword = ref('')

const listState = reactive({
  team: createPartnerState(),
  direct: createPartnerState()
})

const currentState = computed(() => listState[activeScope.value])
const currentSummary = computed(() => currentState.value.summary)

function createPartnerState() {
  return {
    items: [],
    page: 1,
    loading: false,
    refreshing: false,
    finished: false,
    error: '',
    level: '',
    levelOptions: [],
    keywordSnapshot: '',
    summary: createSummaryState()
  }
}

function createSummaryState() {
  return {
    loaded: false,
    total: 0,
    direct_total: 0,
    level_counts: {},
    available_levels: [],
    overview: {
      sales_total_amount: 0,
      sales_month_amount: 0,
      net_total_amount: 0,
      net_month_amount: 0,
      commission_total_amount: 0,
      commission_month_amount: 0,
      merchant_total: 0,
      merchant_active_total: 0
    },
    generated_at: ''
  }
}

function handleBack() {
  router.back()
}

watch(
  () => activeScope.value,
  scope => {
    const state = listState[scope]
    if (!state.items.length && !state.loading) {
      fetchPartners(scope, true)
    }
  }
)

function handleSearch(scope) {
  const targetScope = scope || activeScope.value
  const state = listState[targetScope]
  state.keywordSnapshot = searchKeyword.value.trim()
  fetchPartners(targetScope, true)
}

function changeLevel(scope, value) {
  const state = listState[scope]
  if (state.level === value) {
    return
  }
  state.level = value
  fetchPartners(scope, true)
}

function handleListLoad(scope) {
  fetchPartners(scope, false)
}

function handleRefresh(scope) {
  const state = listState[scope]
  state.refreshing = true
  fetchPartners(scope, true)
}

function retryFetch(scope) {
  fetchPartners(scope, true)
}

async function fetchPartners(scope, reset) {
  const state = listState[scope]
  if (state.loading) {
    return
  }

  if (reset) {
    state.page = 1
    state.finished = false
    state.error = ''
  }

  state.loading = true

  const params = {
    scope,
    page: state.page,
    limit: pageSize,
    sort_field: 'meituan_sales_amount',
    sort_order: 'desc',
    keyword: state.keywordSnapshot || searchKeyword.value.trim()
  }

  if (state.level) {
    params.level = state.level
  }

  try {
    const res = await getInstitutionMeituanPartners(params)
    if (res.code !== 0) {
      throw new Error(res.message || '获取伙伴数据失败')
    }

    const data = res.data || {}
    const items = Array.isArray(data.list) ? data.list : []

    if (reset) {
      state.items = items
    } else {
      state.items = state.items.concat(items)
    }

    const pagination = data.pagination || {}
    const currentPage = pagination.page ?? state.page
    const lastPage = pagination.last_page ?? currentPage

    state.page = currentPage >= lastPage ? currentPage : currentPage + 1
    state.finished = currentPage >= lastPage
    state.error = ''

    updateSummary(scope, data.summary || {})
  } catch (error) {
    state.error = error?.message || '加载失败'
    showFailToast(state.error)
  } finally {
    state.loading = false
    state.refreshing = false
  }
}

function updateSummary(scope, summary) {
  const state = listState[scope]
  const target = state.summary

  target.loaded = true
  target.total = summary.total ?? target.total
  target.direct_total = summary.direct_total ?? target.direct_total
  target.level_counts = summary.level_counts ?? {}
  target.available_levels = Array.isArray(summary.available_levels) ? summary.available_levels : []
  target.overview = {
    ...target.overview,
    ...(summary.overview ?? {})
  }
  target.generated_at = summary.generated_at ?? target.generated_at

  state.levelOptions = target.available_levels
}

function levelOptions(scope) {
  const options = listState[scope].levelOptions
  if (options && options.length) {
    return options
  }
  return [
    {
      value: '',
      label: '全部',
      count: 0
    }
  ]
}

function formatAmount(value) {
  return formatCurrency(value ?? 0)
}

function formatGeneratedAt(value) {
  if (!value) {
    return '刚刚'
  }
  try {
    return new Date(value).toLocaleString('zh-CN', { hour12: false })
  } catch (error) {
    return value
  }
}

onMounted(() => {
  const scopeQuery = String(route.query.scope ?? '').toLowerCase()
  if (scopeQuery === 'direct') {
    activeScope.value = 'direct'
  }

  fetchPartners(activeScope.value, true)
})
</script>

<style scoped>
.institution-partners {
  min-height: 100vh;
  background: #f7f8fc;
}

.partner-summary {
  padding: 16px 16px 8px;
}

.summary-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.summary-card {
  border-radius: 16px;
  padding: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 247, 251, 0.98));
  box-shadow: 0 6px 18px rgba(31, 56, 88, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-card--primary {
  background: linear-gradient(135deg, #1a68ff, #5c8dff);
  color: #fff;
  box-shadow: 0 12px 28px rgba(26, 104, 255, 0.28);
}

.summary-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: inherit;
}

.summary-total {
  font-size: 28px;
  font-weight: 700;
}

.summary-amount {
  font-size: 20px;
  font-weight: 600;
  color: #1f2d3d;
}

.summary-card--primary .summary-amount {
  color: #fff;
}

.summary-card footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.78);
}

.summary-card:not(.summary-card--primary) footer {
  color: #6e7487;
}

.summary-hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: #8b94a7;
}
</style>
