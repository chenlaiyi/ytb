<template>
  <div class="institution-commissions">
    <van-nav-bar
      fixed
      placeholder
      safe-area-inset-top
      title="分润明细"
      left-arrow
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
              <van-icon name="cluster-o" />
              团队分润
            </div>
            <span class="summary-rate">{{ formatPercent(summary.team.ratePercent) }}</span>
          </header>
          <div class="summary-values">
            <div>
              <span class="summary-caption">累计分润</span>
              <strong>{{ formatAmount(summary.team.commission) }}</strong>
            </div>
            <div>
              <span class="summary-caption">团队交易额</span>
              <strong>{{ formatAmount(summary.team.totalSales) }}</strong>
            </div>
          </div>
          <footer>
            <span>商户数 {{ summary.team.merchants }}</span>
            <span>交易笔数 {{ summary.team.transactions }}</span>
          </footer>
        </div>

        <div
          class="summary-card summary-card--personal"
          :class="{ 'summary-card--active': activeScope === 'personal' }"
        >
          <header>
            <div class="summary-label">
              <van-icon name="user-o" />
              个人分润
            </div>
            <span class="summary-rate">{{ formatPercent(summary.personal.ratePercent) }}</span>
          </header>
          <div class="summary-values">
            <div>
              <span class="summary-caption">累计分润</span>
              <strong>{{ formatAmount(summary.personal.commission) }}</strong>
            </div>
            <div>
              <span class="summary-caption">直属交易额</span>
              <strong>{{ formatAmount(summary.personal.totalSales) }}</strong>
            </div>
          </div>
          <footer>
            <span>商户数 {{ summary.personal.merchants }}</span>
            <span>交易笔数 {{ summary.personal.transactions }}</span>
          </footer>
        </div>
      </div>
      <p class="summary-hint">分润明细仅展示已汇总入账的交易，数值按上传数据实时刷新。</p>
    </section>

    <van-tabs
      v-model:active="activeScope"
      sticky
      :offset-top="navOffsetTop"
      color="#1a68ff"
      title-active-color="#1a68ff"
      background="#f7f8fc"
    >
      <van-tab name="team" title="团队分润">
        <CommissionList
          scope="team"
          :state="listState.team"
          @load="handleListLoad"
          @refresh="handleRefresh"
          @retry="retryFetch"
        />
      </van-tab>
      <van-tab name="personal" title="个人分润">
        <CommissionList
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
import { getInstitutionMeituanCommissions } from '@/api/institution'
import { formatAmount as formatCurrency } from '@/utils/format'
import CommissionList from './components/CommissionList.vue'

const activeScope = ref('team')
const pageSize = 20
const navOffsetTop = 46

const summary = reactive({
  team: createSummaryState(),
  personal: createSummaryState()
})

const listState = reactive({
  team: createListState(),
  personal: createListState()
})

const summaryLoaded = computed(() => summary.team.loaded || summary.personal.loaded)

function createSummaryState() {
  return {
    totalSales: 0,
    netSales: 0,
    commission: 0,
    transactions: 0,
    merchants: 0,
    ratePercent: 0,
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
    error: ''
  }
}

function formatAmount(value) {
  return formatCurrency(value ?? 0)
}

function formatPercent(value) {
  const numeric = Number(value ?? 0)
  return `${numeric.toFixed(2)}%`
}

function handleBack() {
  if (window.history.length > 1) {
    window.history.back()
    return
  }
  showToast('没有可以返回的页面')
}

async function fetchCommissions(scope, reset = false) {
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

  if (state.finished) {
    return
  }

  state.loading = true
  state.error = ''

  const params = {
    scope,
    page: state.page,
    limit: pageSize
  }

  try {
    const response = await getInstitutionMeituanCommissions(params)
    const payload = response?.data ?? {}

    if (payload.summary) {
      const { team = {}, personal = {} } = payload.summary
      Object.assign(summary.team, {
        totalSales: Number(team.total_sales ?? team.totalSales ?? 0),
        netSales: Number(team.net_sales ?? team.netSales ?? 0),
        commission: Number(team.commission ?? 0),
        transactions: Number(team.transactions ?? 0),
        merchants: Number(team.merchants ?? 0),
        ratePercent: Number(team.rate_percent ?? team.ratePercent ?? summary.team.ratePercent),
        loaded: true
      })

      Object.assign(summary.personal, {
        totalSales: Number(personal.total_sales ?? personal.totalSales ?? 0),
        netSales: Number(personal.net_sales ?? personal.netSales ?? 0),
        commission: Number(personal.commission ?? 0),
        transactions: Number(personal.transactions ?? 0),
        merchants: Number(personal.merchants ?? 0),
        ratePercent: Number(personal.rate_percent ?? personal.ratePercent ?? summary.personal.ratePercent),
        loaded: true
      })
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
    state.error = error?.message ?? '分润明细加载失败'
  } finally {
    state.loading = false
    state.refreshing = false
  }
}

function handleListLoad(scope) {
  fetchCommissions(scope)
}

function handleRefresh(scope) {
  const state = listState[scope]
  state.refreshing = true
  fetchCommissions(scope, true)
}

function retryFetch(scope) {
  fetchCommissions(scope, true)
}

watch(
  () => activeScope.value,
  (nextScope) => {
    const state = listState[nextScope]
    if (!state.items.length && !state.loading) {
      fetchCommissions(nextScope, true)
    }
  }
)

onMounted(() => {
  fetchCommissions('team', true)
})
</script>

<style scoped>
.institution-commissions {
  min-height: 100vh;
  background: #f7f8fc;
}

.summary-section {
  padding: 12px 16px 8px;
  background: #f7f8fc;
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

.summary-rate {
  font-size: 13px;
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

.summary-values {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 360px) {
  .summary-values {
    grid-template-columns: 1fr;
  }
}
</style>
