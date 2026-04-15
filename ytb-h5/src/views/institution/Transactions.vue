<template>
  <div class="institution-transactions">
    <van-nav-bar
      title="交易查询"
      left-arrow
      fixed
      placeholder
      safe-area-inset-top
      @click-left="handleBack"
    />

    <section class="summary-section" v-if="summaryLoaded">
      <div class="summary-grid">
        <div
          class="summary-card summary-card--team"
          :class="{ 'summary-card--active': activeScope === 'team' }"
        >
          <header>
            <div class="summary-label">
              <van-icon name="friends-o" />
              团队交易
            </div>
            <span class="summary-amount">
              合计 {{ formatAmount(summary.team.totalSales) }}
            </span>
          </header>
          <div class="summary-values">
            <div>
              <span class="summary-caption">交易笔数</span>
              <strong>{{ formatInteger(summary.team.transactions) }}</strong>
            </div>
            <div>
              <span class="summary-caption">净入账</span>
              <strong>{{ formatAmount(summary.team.netSales) }}</strong>
            </div>
          </div>
          <footer>
            <span>记录数 {{ formatInteger(summary.team.records) }}</span>
            <span>客单价 {{ formatAmount(summary.team.averageTicket) }}</span>
          </footer>
        </div>

        <div
          class="summary-card summary-card--personal"
          :class="{ 'summary-card--active': activeScope === 'personal' }"
        >
          <header>
            <div class="summary-label">
              <van-icon name="user-o" />
              直属交易
            </div>
            <span class="summary-amount">
              合计 {{ formatAmount(summary.personal.totalSales) }}
            </span>
          </header>
          <div class="summary-values">
            <div>
              <span class="summary-caption">交易笔数</span>
              <strong>{{ formatInteger(summary.personal.transactions) }}</strong>
            </div>
            <div>
              <span class="summary-caption">净入账</span>
              <strong>{{ formatAmount(summary.personal.netSales) }}</strong>
            </div>
          </div>
          <footer>
            <span>记录数 {{ formatInteger(summary.personal.records) }}</span>
            <span>客单价 {{ formatAmount(summary.personal.averageTicket) }}</span>
          </footer>
        </div>
      </div>
      <p class="summary-hint">统计范围包含当前机构及其团队成员的美团交易。</p>
    </section>

    <van-tabs
      v-model:active="activeScope"
      sticky
      :offset-top="navOffsetTop"
      color="#1a68ff"
      title-active-color="#1a68ff"
      background="#f7f8fc"
    >
      <van-tab name="team" title="团队交易">
        <FilterPanel
          :status-options="statusOptions"
          :range-options="rangeOptions"
          :state="listState.team"
          :search-keyword="searchKeyword"
          @update:keyword="handleKeywordUpdate"
          @status-change="changeStatus"
          @range-change="changeRange"
          @search="handleSearch"
          @clear="handleClearSearch"
        />
        <TransactionList
          scope="team"
          :state="listState.team"
          @load="handleListLoad"
          @refresh="handleRefresh"
          @retry="retryFetch"
        />
      </van-tab>

      <van-tab name="personal" title="直属交易">
        <FilterPanel
          :status-options="statusOptions"
          :range-options="rangeOptions"
          :state="listState.personal"
          :search-keyword="searchKeyword"
          @update:keyword="handleKeywordUpdate"
          @status-change="changeStatus"
          @range-change="changeRange"
          @search="handleSearch"
          @clear="handleClearSearch"
        />
        <TransactionList
          scope="personal"
          :state="listState.personal"
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
import dayjs from 'dayjs'
import { showToast } from 'vant'
import { formatAmount as formatCurrency } from '@/utils/format'
import { getInstitutionMeituanTransactions } from '@/api/institution'
import TransactionList from './components/TransactionList.vue'
import FilterPanel from './components/FilterPanel.vue'

const navOffsetTop = 46
const activeScope = ref('team')
const pageSize = 20

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '近30日活跃' },
  { value: 'pending', label: '待激活' },
  { value: 'inactive', label: '已沉默' }
]

const rangeOptions = [
  { value: 7, label: '近7天' },
  { value: 30, label: '近30天' },
  { value: 90, label: '近90天' }
]

const summary = reactive({
  team: createSummaryState(),
  personal: createSummaryState()
})

const listState = reactive({
  team: createListState('team'),
  personal: createListState('personal')
})

const searchKeyword = ref('')
const summaryLoaded = computed(() => summary.team.loaded || summary.personal.loaded)

watch(
  () => activeScope.value,
  scope => {
    searchKeyword.value = listState[scope].keyword || ''
    const state = listState[scope]
    if (!state.items.length && !state.loading) {
      fetchTransactions(scope, true)
    }
  }
)

watch(
  () => searchKeyword.value,
  value => {
    listState[activeScope.value].keyword = value
  }
)

function createSummaryState() {
  return {
    records: 0,
    transactions: 0,
    totalSales: 0,
    netSales: 0,
    averageTicket: 0,
    loaded: false
  }
}

function createListState(scope) {
  return {
    items: [],
    page: 1,
    total: 0,
    loading: false,
    finished: false,
    refreshing: false,
    error: '',
    status: 'all',
    keyword: '',
    range: 30,
    scope
  }
}

function handleBack() {
  if (window.history.length > 1) {
    window.history.back()
    return
  }
  showToast('没有可以返回的页面')
}

function formatAmount(value) {
  return formatCurrency(value ?? 0)
}

function formatInteger(value) {
  const numeric = Number(value ?? 0)
  if (!Number.isFinite(numeric)) {
    return '0'
  }
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(Math.max(0, numeric))
}

function setSummary(target, source) {
  target.records = Number(source.records ?? 0)
  target.transactions = Number(source.transactions ?? 0)
  target.totalSales = Number(source.total_sales ?? source.totalSales ?? 0)
  target.netSales = Number(source.net_sales ?? source.netSales ?? 0)
  target.averageTicket = Number(source.average_ticket ?? source.averageTicket ?? 0)
  target.loaded = true
}

function resolveDateRange(range) {
  const days = Math.max(1, Number(range) || 7)
  const end = dayjs().format('YYYY-MM-DD')
  const start = dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD')
  return { start, end }
}

async function fetchTransactions(scope, reset = false) {
  const state = listState[scope]
  if (state.loading) {
    return
  }

  if (reset) {
    state.page = 1
    state.finished = false
    state.items = []
    state.error = ''
  }

  if (state.finished && !reset) {
    return
  }

  state.loading = true
  state.error = ''

  const params = {
    scope,
    page: state.page,
    limit: pageSize
  }

  if (state.status && state.status !== 'all') {
    params.status = state.status
  }

  if (state.keyword) {
    params.keyword = state.keyword
  }

  const { start, end } = resolveDateRange(state.range)
  params.start_date = start
  params.end_date = end

  try {
    const response = await getInstitutionMeituanTransactions(params)
    const payload = response?.data ?? {}

    if (payload.summary) {
      const { team = {}, personal = {} } = payload.summary
      setSummary(summary.team, team)
      setSummary(summary.personal, personal)
    }

    const filters = payload.filters ?? {}
    if (filters.status) {
      state.status = filters.status
    }
    if (Object.prototype.hasOwnProperty.call(filters, 'keyword') && reset) {
      state.keyword = filters.keyword || ''
      if (scope === activeScope.value) {
        searchKeyword.value = state.keyword
      }
    }

    const list = Array.isArray(payload.list) ? payload.list : []
    if (reset) {
      state.items = []
    }
    state.items.push(...list)

    const pagination = payload.pagination ?? {}
    state.total = Number(pagination.total ?? state.items.length)
    state.page = state.page + 1
    state.finished = state.items.length >= state.total || list.length < pageSize
  } catch (error) {
    state.error = error?.message ?? '交易数据加载失败，请稍后重试'
  } finally {
    state.loading = false
    state.refreshing = false
  }
}

function handleListLoad(scope) {
  fetchTransactions(scope)
}

function handleRefresh(scope) {
  const state = listState[scope]
  state.refreshing = true
  fetchTransactions(scope, true)
}

function retryFetch(scope) {
  fetchTransactions(scope, true)
}

function changeStatus(scope, status) {
  const state = listState[scope]
  if (state.status === status) {
    return
  }
  state.status = status
  fetchTransactions(scope, true)
}

function changeRange(scope, range) {
  const state = listState[scope]
  if (state.range === range) {
    return
  }
  state.range = range
  fetchTransactions(scope, true)
}

function handleKeywordUpdate(value) {
  searchKeyword.value = value
}

function handleSearch() {
  const scope = activeScope.value
  listState[scope].keyword = searchKeyword.value
  fetchTransactions(scope, true)
}

function handleClearSearch() {
  searchKeyword.value = ''
  handleSearch()
}

onMounted(() => {
  fetchTransactions('team', true)
})
</script>

<style scoped>
.institution-transactions {
  min-height: 100vh;
  background: #f7f8fc;
}

.summary-section {
  padding: 12px 16px 8px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(164px, 1fr));
  gap: 12px;
}

.summary-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 4px 16px rgba(20, 55, 90, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.summary-card--active {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(26, 104, 255, 0.15);
}

.summary-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.summary-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #1f2333;
}

.summary-amount {
  font-size: 12px;
  color: #6c7487;
}

.summary-values {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.summary-caption {
  display: block;
  font-size: 12px;
  color: #6c7487;
}

.summary-values strong {
  display: block;
  margin-top: 4px;
  font-size: 16px;
  color: #1a2330;
}

.summary-card footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #8b94a7;
}

.summary-hint {
  margin-top: 10px;
  font-size: 12px;
  color: #8b94a7;
}
</style>
