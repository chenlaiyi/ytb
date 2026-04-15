<template>
  <div class="institution-merchants">
    <van-nav-bar
      title="商户管理"
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
              团队商户
            </div>
            <span class="summary-amount">
              累计交易额 {{ formatAmount(summary.team.salesAmount) }}
            </span>
          </header>
          <div class="summary-values">
            <div>
              <span class="summary-caption">商户总数</span>
              <strong>{{ summary.team.total }}</strong>
            </div>
            <div>
              <span class="summary-caption">已激活</span>
              <strong>{{ summary.team.active }}</strong>
            </div>
          </div>
          <footer>
            <span>待审核 {{ summary.team.pending }}</span>
            <span>已停用 {{ summary.team.inactive }}</span>
          </footer>
        </div>

        <div
          class="summary-card summary-card--personal"
          :class="{ 'summary-card--active': activeScope === 'personal' }"
        >
          <header>
            <div class="summary-label">
              <van-icon name="user-o" />
              直属商户
            </div>
            <span class="summary-amount">
              累计交易额 {{ formatAmount(summary.personal.salesAmount) }}
            </span>
          </header>
          <div class="summary-values">
            <div>
              <span class="summary-caption">商户总数</span>
              <strong>{{ summary.personal.total }}</strong>
            </div>
            <div>
              <span class="summary-caption">已激活</span>
              <strong>{{ summary.personal.active }}</strong>
            </div>
          </div>
          <footer>
            <span>待审核 {{ summary.personal.pending }}</span>
            <span>已停用 {{ summary.personal.inactive }}</span>
          </footer>
        </div>
      </div>
      <p class="summary-hint">统计数据包含当前机构及其全部团队成员的商户。</p>
    </section>

    <van-tabs
      v-model:active="activeScope"
      sticky
      :offset-top="navOffsetTop"
      color="#1a68ff"
      title-active-color="#1a68ff"
      background="#f7f8fc"
    >
      <van-tab name="team" title="团队商户">
        <section class="filter-section">
          <van-search
            v-model="searchKeyword"
            shape="round"
            placeholder="搜索商户名称 / 编号 / 联系人"
            :clearable="true"
            show-action
            @search="handleSearch"
            @clear="handleClearSearch"
            @cancel="handleCancelSearch"
          >
            <template #action>
              <span class="search-action" @click="handleSearch">搜索</span>
            </template>
          </van-search>

          <div class="status-filters">
            <button
              v-for="option in statusOptions"
              :key="option.value"
              type="button"
              class="status-chip"
              :class="{ 'status-chip--active': listState.team.status === option.value }"
              @click="changeStatus('team', option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </section>

        <MerchantList
          scope="team"
          :state="listState.team"
          @load="handleListLoad"
          @refresh="handleRefresh"
          @retry="retryFetch"
        />
      </van-tab>

      <van-tab name="personal" title="直属商户">
        <section class="filter-section">
          <van-search
            v-model="searchKeyword"
            shape="round"
            placeholder="搜索商户名称 / 编号 / 联系人"
            :clearable="true"
            show-action
            @search="handleSearch"
            @clear="handleClearSearch"
            @cancel="handleCancelSearch"
          >
            <template #action>
              <span class="search-action" @click="handleSearch">搜索</span>
            </template>
          </van-search>

          <div class="status-filters">
            <button
              v-for="option in statusOptions"
              :key="option.value"
              type="button"
              class="status-chip"
              :class="{ 'status-chip--active': listState.personal.status === option.value }"
              @click="changeStatus('personal', option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </section>

        <MerchantList
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
import { showToast } from 'vant'
import { getInstitutionMeituanMerchants } from '@/api/institution'
import { formatAmount as formatCurrency } from '@/utils/format'
import MerchantList from './components/MerchantList.vue'

const activeScope = ref('team')
const navOffsetTop = 46
const pageSize = 20

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '近30日活跃' },
  { value: 'pending', label: '待激活' },
  { value: 'inactive', label: '已沉默' }
]

const summary = reactive({
  team: createSummaryState(),
  personal: createSummaryState()
})

const listState = reactive({
  team: createListState(),
  personal: createListState()
})

const searchKeyword = ref('')

const summaryLoaded = computed(() => summary.team.loaded || summary.personal.loaded)

watch(
  () => activeScope.value,
  scope => {
    searchKeyword.value = listState[scope].keyword || ''
    const state = listState[scope]
    if (!state.items.length && !state.loading) {
      fetchMerchants(scope, true)
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
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
    salesAmount: 0,
    loaded: false
  }
}

function createListState() {
  return {
    items: [],
    page: 1,
    total: 0,
    loading: false,
    finished: false,
    refreshing: false,
    error: '',
    status: 'all',
    keyword: ''
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

function setSummary(target, source) {
  target.total = Number(source.total ?? 0)
  target.active = Number(source.active ?? 0)
  target.pending = Number(source.pending ?? 0)
  target.inactive = Number(source.inactive ?? 0)
  target.salesAmount = Number(source.sales_amount ?? source.salesAmount ?? 0)
  target.loaded = true
}

async function fetchMerchants(scope, reset = false) {
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

  try {
    const response = await getInstitutionMeituanMerchants(params)
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
    state.error = error?.message ?? '商户数据加载失败，请稍后重试'
  } finally {
    state.loading = false
    state.refreshing = false
  }
}

function handleListLoad(scope) {
  fetchMerchants(scope)
}

function handleRefresh(scope) {
  const state = listState[scope]
  state.refreshing = true
  fetchMerchants(scope, true)
}

function retryFetch(scope) {
  fetchMerchants(scope, true)
}

function changeStatus(scope, status) {
  const state = listState[scope]
  if (state.status === status) {
    return
  }
  state.status = status
  fetchMerchants(scope, true)
}

function handleSearch() {
  const scope = activeScope.value
  listState[scope].keyword = searchKeyword.value
  fetchMerchants(scope, true)
}

function handleClearSearch() {
  searchKeyword.value = ''
  handleSearch()
}

function handleCancelSearch() {
  searchKeyword.value = ''
  handleSearch()
}

onMounted(() => {
  fetchMerchants('team', true)
})
</script>

<style scoped>
.institution-merchants {
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

.filter-section {
  padding: 12px 16px 0;
  background: #f7f8fc;
}

.search-action {
  color: #1a68ff;
  font-size: 14px;
}

.status-filters {
  display: flex;
  gap: 8px;
  margin: 10px 0 2px;
  overflow-x: auto;
  padding-bottom: 6px;
}

.status-chip {
  flex: 0 0 auto;
  padding: 6px 14px;
  border-radius: 999px;
  background: #fff;
  color: #4d5460;
  border: 1px solid transparent;
  font-size: 13px;
}

.status-chip--active {
  background: rgba(26, 104, 255, 0.1);
  color: #1a68ff;
  border-color: rgba(26, 104, 255, 0.3);
}

@media (max-width: 360px) {
  .summary-values {
    grid-template-columns: 1fr;
  }
}
</style>
