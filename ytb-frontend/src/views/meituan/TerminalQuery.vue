<template>
  <div class="meituan-terminal-page">
    <div class="content-container">
      <el-card class="overview-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="card-title">
              <span>终端概览</span>
              <el-tag v-if="summary.first_sales_date" type="info" size="small" effect="plain">
                销售区间：{{ summary.first_sales_date }} ~ {{ summary.last_sales_date }}
              </el-tag>
              <el-tag v-else type="warning" size="small" effect="plain">
                暂无销售区间
              </el-tag>
            </div>
            <el-button link type="primary" @click="refreshSummary" :loading="loading.summary">
              刷新
            </el-button>
          </div>
          <p class="card-subtitle">
            汇总终端活跃情况、支付渠道结构以及重点城市/组织表现。
          </p>
        </template>

        <div class="summary-grid">
          <div v-for="item in summaryCards" :key="item.title" class="summary-card">
            <div class="summary-title">{{ item.title }}</div>
            <div class="summary-value">{{ item.value }}</div>
            <div class="summary-extra">{{ item.extra }}</div>
          </div>
        </div>

        <div class="stats-section">
          <div class="binding-info">
            <div class="binding-title">绑定日期范围</div>
            <div class="binding-range">
              <span>最早：{{ summary.binding_range.earliest || '—' }}</span>
              <el-divider direction="vertical" />
              <span>最晚：{{ summary.binding_range.latest || '—' }}</span>
            </div>
          </div>
          <div class="mix-panel">
            <div class="mix-header">
              <span>支付渠道结构</span>
              <span class="mix-note">按交易金额/笔数占比</span>
            </div>
            <div v-if="channelMix.length" class="mix-list">
              <div v-for="item in channelMix" :key="item.channel" class="mix-item">
                <div class="mix-name">{{ item.channel }}</div>
                <div class="mix-values">
                  <span>金额 ¥{{ formatCurrency(item.amount) }}</span>
                  <span>笔数 {{ formatInteger(item.transaction_count) }}</span>
                </div>
                <el-progress
                  :percentage="Math.min(100, Math.round(item.amount_ratio * 100))"
                  :stroke-width="8"
                  status="success"
                  :show-text="false"
                />
                <div class="mix-ratio">
                  金额占比 {{ formatPercent(item.amount_ratio * 100) }} / 笔数 {{ formatPercent(item.count_ratio * 100) }}
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无渠道数据" />
          </div>
        </div>

        <div class="insight-grid">
          <div class="insight-card">
            <div class="insight-header">
              <span>城市 Top6</span>
            </div>
            <div v-if="cityBreakdown.length" class="insight-list">
              <div
                v-for="item in cityBreakdown"
                :key="item.city_code || item.city"
                class="insight-item"
              >
                <div class="insight-title">{{ item.city }}</div>
                <div class="insight-meta">
                  <span>终端 {{ formatInteger(item.terminal_count) }}</span>
                  <span>金额 ¥{{ formatCurrency(item.total_amount) }}</span>
                </div>
                <el-progress
                  :percentage="Math.min(100, Math.round(item.amount_ratio * 100))"
                  :stroke-width="8"
                  color="#409EFF"
                  :show-text="false"
                />
              </div>
            </div>
            <el-empty v-else description="暂无城市数据" />
          </div>
          <div class="insight-card">
            <div class="insight-header">
              <span>组织 Top6</span>
            </div>
            <div v-if="organizationBreakdown.length" class="insight-list">
              <div v-for="item in organizationBreakdown" :key="item.organization" class="insight-item">
                <div class="insight-title">{{ item.organization }}</div>
                <div class="insight-meta">
                  <span>终端 {{ formatInteger(item.terminal_count) }}</span>
                  <span>金额 ¥{{ formatCurrency(item.total_amount) }}</span>
                </div>
                <el-progress
                  :percentage="Math.min(100, Math.round(item.amount_ratio * 100))"
                  :stroke-width="8"
                  color="#36b37e"
                  :show-text="false"
                />
              </div>
            </div>
            <el-empty v-else description="暂无组织数据" />
          </div>
          <div class="insight-card trend-card">
            <div class="insight-header">
              <span>近 30 日活跃趋势</span>
            </div>
            <div v-if="trendPreview.length" class="trend-list">
              <div v-for="item in trendPreview" :key="item.date" class="trend-item">
                <div class="trend-date">{{ item.date }}</div>
                <div class="trend-meta">
                  <span>金额 ¥{{ formatCurrency(item.total_amount) }}</span>
                  <span>活跃 {{ formatInteger(item.active_terminals) }} 台</span>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无趋势数据" />
          </div>
        </div>
      </el-card>

      <el-card class="filter-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="card-title">
              <span>筛选条件</span>
            </div>
            <div class="card-actions">
              <el-button @click="resetFilters" :disabled="loading.summary || loading.table">重置</el-button>
              <el-button type="primary" @click="handleFilter" :loading="loading.summary || loading.table">查询</el-button>
            </div>
          </div>
        </template>
        <el-form :model="filters" label-width="96px" label-position="left" class="filter-form">
          <el-row :gutter="16">
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="关键字">
                <el-input
                  v-model.trim="filters.keyword"
                  placeholder="终端SN / 门店 / 商户"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="城市">
                <el-select
                  v-model="filters.city"
                  placeholder="选择城市"
                  filterable
                  clearable
                  allow-create
                  default-first-option
                >
                  <el-option
                    v-for="city in availableFilters.cities"
                    :key="optionValue(city)"
                    :label="optionLabel(city)"
                    :value="optionValue(city)"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="所属组织">
                <el-select
                  v-model="filters.organization"
                  placeholder="选择组织"
                  filterable
                  clearable
                  allow-create
                  default-first-option
                >
                  <el-option
                    v-for="org in availableFilters.organizations"
                    :key="org"
                    :label="org"
                    :value="org"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="直属上级">
                <el-select
                  v-model="filters.leader_account"
                  placeholder="直属上级账号"
                  filterable
                  clearable
                  allow-create
                  default-first-option
                >
                  <el-option
                    v-for="leader in availableFilters.leader_accounts"
                    :key="leader"
                    :label="leader"
                    :value="leader"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="销售账号">
                <el-select
                  v-model="filters.salesperson_account"
                  placeholder="销售人员账号"
                  filterable
                  clearable
                  allow-create
                  default-first-option
                >
                  <el-option
                    v-for="account in availableFilters.salesperson_accounts"
                    :key="account"
                    :label="account"
                    :value="account"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="经营品类">
                <el-select
                  v-model="filters.business_category"
                  placeholder="经营品类"
                  filterable
                  clearable
                  allow-create
                  default-first-option
                >
                  <el-option
                    v-for="category in availableFilters.business_categories"
                    :key="category"
                    :label="category"
                    :value="category"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="商户编号">
                <el-input v-model.trim="filters.merchant_code" placeholder="商户编号" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12" :lg="8">
              <el-form-item label="销售日期">
                <el-date-picker
                  v-model="filters.dateRange"
                  type="daterange"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  format="YYYY-MM-DD"
                  unlink-panels
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12" :lg="8">
              <el-form-item label="绑定日期">
                <el-date-picker
                  v-model="filters.bindingRange"
                  type="daterange"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  format="YYYY-MM-DD"
                  unlink-panels
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12" :lg="8">
              <el-form-item label="交易金额">
                <div class="range-box">
                  <el-input-number
                    v-model="filters.min_amount"
                    :min="0"
                    :precision="2"
                    placeholder="最小金额"
                    controls-position="right"
                  />
                  <span class="range-split">~</span>
                  <el-input-number
                    v-model="filters.max_amount"
                    :min="0"
                    :precision="2"
                    placeholder="最大金额"
                    controls-position="right"
                  />
                </div>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12" :lg="8">
              <el-form-item label="净收金额">
                <div class="range-box">
                  <el-input-number
                    v-model="filters.min_net_amount"
                    :min="0"
                    :precision="2"
                    placeholder="最小净收"
                    controls-position="right"
                  />
                  <span class="range-split">~</span>
                  <el-input-number
                    v-model="filters.max_net_amount"
                    :min="0"
                    :precision="2"
                    placeholder="最大净收"
                    controls-position="right"
                  />
                </div>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="是否有退款">
                <el-segmented
                  v-model="filters.has_refund"
                  size="small"
                  :options="[
                    { label: '全部', value: '' },
                    { label: '仅有退款', value: 'true' },
                    { label: '无退款', value: 'false' }
                  ]"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <el-card class="table-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="card-title">
              <span>终端列表</span>
            </div>
            <div class="table-tools">
              <el-select v-model="sort.field" size="small" class="sort-select" @change="handleSortChange">
                <el-option label="按总交易额" value="total_amount" />
                <el-option label="按净收金额" value="net_amount" />
                <el-option label="按交易笔数" value="transaction_count" />
                <el-option label="按退款金额" value="refund_amount" />
                <el-option label="按活跃天数" value="active_days" />
                <el-option label="按最近交易" value="last_transaction_at" />
              </el-select>
              <el-segmented
                v-model="sort.order"
                :options="[
                  { label: '降序', value: 'desc' },
                  { label: '升序', value: 'asc' }
                ]"
                size="small"
                class="sort-order"
                @change="handleSortChange"
              />
            </div>
          </div>
        </template>
        <el-table
          v-loading="loading.table"
          :data="tableData"
          border
          size="small"
          :default-sort="{ prop: sort.field, order: sort.order === 'desc' ? 'descending' : 'ascending' }"
        >
          <el-table-column prop="terminal_sn" label="终端SN" min-width="160">
            <template #default="scope">
              <div class="terminal-cell">
                <div class="terminal-sn">{{ scope.row.terminal_sn }}</div>
                <div class="terminal-name">{{ scope.row.terminal_name || '未命名终端' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="门店/商户" min-width="220">
            <template #default="scope">
              <div class="store-cell">
                <div>{{ scope.row.store_name || '—' }}</div>
                <div class="muted-text">商户：{{ scope.row.merchant_name || '—' }}</div>
                <div class="muted-text">编号：{{ scope.row.merchant_code || '--' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="city" label="城市" width="120" />
          <el-table-column prop="organization" label="所属组织" width="160" show-overflow-tooltip />
          <el-table-column label="团队" width="200">
            <template #default="scope">
              <div class="team-cell">
                <div>
                  <span class="label">直属上级：</span>{{ scope.row.leader_name || '—' }}
                  <span class="muted-text">（{{ scope.row.leader_account || '--' }}）</span>
                </div>
                <div>
                  <span class="label">销售人员：</span>{{ scope.row.salesperson_name || '—' }}
                  <span class="muted-text">（{{ scope.row.salesperson_account || '--' }}）</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="绑定/签约日期" width="180">
            <template #default="scope">
              <div class="date-cell">
                <div>绑定：{{ scope.row.binding_date || '—' }}</div>
                <div class="muted-text">签约：{{ scope.row.contract_date || '—' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="active_days" label="活跃天数" width="110" />
          <el-table-column prop="transaction_count" label="交易笔数" width="120" />
          <el-table-column label="渠道笔数" min-width="180">
            <template #default="scope">
              <div class="channel-count">
                <span>支付宝：{{ formatInteger(scope.row.alipay_transaction_count) }}</span>
                <span>微信：{{ formatInteger(scope.row.wechat_transaction_count) }}</span>
                <span>其他：{{ formatInteger(scope.row.other_transaction_count) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="金额(元)" min-width="240">
            <template #default="scope">
              <div class="amount-cell">
                <div>总额：¥{{ formatCurrency(scope.row.total_amount) }}</div>
                <div>净收：¥{{ formatCurrency(scope.row.net_amount) }}</div>
                <div>退款：¥{{ formatCurrency(scope.row.refund_amount) }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="渠道金额(元)" min-width="220">
            <template #default="scope">
              <div class="amount-cell">
                <div>支付宝：¥{{ formatCurrency(scope.row.alipay_amount) }}</div>
                <div>微信：¥{{ formatCurrency(scope.row.wechat_amount) }}</div>
                <div>其他：¥{{ formatCurrency(scope.row.other_amount) }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="last_transaction_at" label="最近交易" width="140" />
        </el-table>
        <div class="pagination-bar">
          <el-pagination
            v-model:current-page="pagination.current"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            layout="prev, pager, next, ->, total"
            @current-change="handlePageChange"
            @size-change="handlePageSizeChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import {
  fetchMeituanTerminalSummary,
  fetchMeituanTerminalList
} from '@/api/v1/meituan'

const loading = reactive({
  summary: false,
  table: false
})

const baseSummary = () => ({
  total_terminals: 0,
  total_amount: 0,
  net_amount: 0,
  refund_amount: 0,
  transaction_count: 0,
  merchant_count: 0,
  city_count: 0,
  organization_count: 0,
  average_amount_per_terminal: 0,
  average_transactions_per_terminal: 0,
  first_sales_date: null,
  last_sales_date: null,
  date_span_days: null,
  binding_range: { earliest: null, latest: null },
  channel_mix: [],
  city_breakdown: [],
  organization_breakdown: [],
  daily_trend: [],
  available_filters: {
    cities: [],
    organizations: [],
    leader_accounts: [],
    salesperson_accounts: [],
    business_categories: []
  }
})

const summary = reactive(baseSummary())
const availableFilters = reactive({
  cities: [],
  organizations: [],
  leader_accounts: [],
  salesperson_accounts: [],
  business_categories: []
})

const optionValue = option => {
  if (option && typeof option === 'object') {
    return option.value ?? option.label ?? ''
  }
  return option ?? ''
}

const optionLabel = option => {
  if (option && typeof option === 'object') {
    return option.label ?? option.value ?? ''
  }
  return option ?? ''
}

const defaultDateRange = [
  dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD')
]

const filters = reactive({
  keyword: '',
  city: '',
  organization: '',
  leader_account: '',
  salesperson_account: '',
  merchant_code: '',
  business_category: '',
  min_amount: null,
  max_amount: null,
  min_net_amount: null,
  max_net_amount: null,
  has_refund: '',
  dateRange: [...defaultDateRange],
  bindingRange: []
})

const sort = reactive({
  field: 'total_amount',
  order: 'desc'
})

const tableData = ref([])
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0
})

const summaryCards = computed(() => [
  {
    title: '活跃终端',
    value: formatInteger(summary.total_terminals),
    extra: `覆盖商户 ${formatInteger(summary.merchant_count)} 家`
  },
  {
    title: '交易金额 (元)',
    value: `¥${formatCurrency(summary.total_amount)}`,
    extra: `净收 ¥${formatCurrency(summary.net_amount)} / 退款 ¥${formatCurrency(summary.refund_amount)}`
  },
  {
    title: '交易笔数 (笔)',
    value: formatInteger(summary.transaction_count),
    extra: `平均每台 ${formatInteger(summary.average_transactions_per_terminal)} 笔`
  },
  {
    title: '地域覆盖',
    value: `${formatInteger(summary.city_count)} 城市`,
    extra: `组织 ${formatInteger(summary.organization_count)} 个`
  }
])

const channelMix = computed(() => summary.channel_mix || [])
const cityBreakdown = computed(() => summary.city_breakdown || [])
const organizationBreakdown = computed(() => summary.organization_breakdown || [])
const trendPreview = computed(() => {
  const trend = summary.daily_trend || []
  const startIndex = Math.max(trend.length - 10, 0)
  return trend.slice(startIndex)
})

const buildQueryParams = () => {
  const params = {
    page: pagination.current,
    per_page: pagination.pageSize,
    sort_field: sort.field,
    sort_order: sort.order
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (key === 'dateRange') {
      if (value?.length === 2) {
        params.date_start = value[0]
        params.date_end = value[1]
      }
      return
    }

    if (key === 'bindingRange') {
      if (value?.length === 2) {
        params.binding_start = value[0]
        params.binding_end = value[1]
      }
      return
    }

    if (value !== null && value !== undefined && value !== '') {
      params[key] = value
    }
  })

  return params
}

const applySummary = data => {
  const merged = {
    ...baseSummary(),
    ...(data || {})
  }

  Object.assign(summary, merged)

  const filters = merged.available_filters || {}
  availableFilters.cities = filters.cities || []
  availableFilters.organizations = filters.organizations || []
  availableFilters.leader_accounts = filters.leader_accounts || []
  availableFilters.salesperson_accounts = filters.salesperson_accounts || []
  availableFilters.business_categories = filters.business_categories || []
}

const loadSummary = async () => {
  loading.summary = true
  try {
    const params = buildQueryParams()
    delete params.page
    delete params.per_page
    delete params.sort_field
    delete params.sort_order

    const response = await fetchMeituanTerminalSummary(params)
    if (!response || response.code !== 0) {
      throw new Error(response?.message || '获取终端概览失败')
    }
    applySummary(response.data)
  } catch (error) {
    applySummary(null)
    ElMessage.error(error?.message || '获取终端概览失败')
  } finally {
    loading.summary = false
  }
}

const loadTable = async () => {
  loading.table = true
  try {
    const params = buildQueryParams()
    const response = await fetchMeituanTerminalList(params)
    if (!response || response.code !== 0) {
      throw new Error(response?.message || '获取终端列表失败')
    }
    const data = response.data || {}
    tableData.value = data.data || []
    pagination.total = data.total || 0
    pagination.pageSize = data.per_page || pagination.pageSize
  } catch (error) {
    tableData.value = []
    ElMessage.error(error?.message || '获取终端列表失败')
  } finally {
    loading.table = false
  }
}

const handleFilter = () => {
  pagination.current = 1
  Promise.all([loadSummary(), loadTable()])
}

const resetFilters = () => {
  filters.keyword = ''
  filters.city = ''
  filters.organization = ''
  filters.leader_account = ''
  filters.salesperson_account = ''
  filters.merchant_code = ''
  filters.business_category = ''
  filters.min_amount = null
  filters.max_amount = null
  filters.min_net_amount = null
  filters.max_net_amount = null
  filters.has_refund = ''
  filters.dateRange = [...defaultDateRange]
  filters.bindingRange = []
}

const handleSortChange = () => {
  pagination.current = 1
  loadTable()
}

const handlePageChange = page => {
  pagination.current = page
  loadTable()
}

const handlePageSizeChange = size => {
  pagination.pageSize = size
  pagination.current = 1
  loadTable()
}

const refreshSummary = () => {
  loadSummary()
}

const formatCurrency = value => {
  const number = Number(value)
  if (Number.isNaN(number)) return '0.00'
  return number.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatInteger = value => {
  const number = Number(value)
  if (Number.isNaN(number)) return '0'
  return number.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

const formatPercent = (value, fraction = 2) => {
  const number = Number(value)
  if (Number.isNaN(number)) return `0.${'0'.repeat(fraction)}%`
  return `${number.toFixed(fraction)}%`
}

onMounted(async () => {
  await Promise.all([loadSummary(), loadTable()])
})
</script>

<style scoped>
.meituan-terminal-page {
  padding: 24px 0 48px;
  background: #f4f6fb;
  min-height: 100%;
}

.content-container {
  max-width: 1320px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-subtitle {
  margin: 8px 0 0;
  color: #909399;
  font-size: 13px;
}

.card-actions,
.table-tools {
  margin-left: auto;
  display: flex;
  gap: 12px;
  align-items: center;
}

.overview-card {
  border: none;
  border-radius: 18px;
  padding-bottom: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
  margin-top: 8px;
}

.summary-card {
  padding: 20px 22px;
  border-radius: 16px;
  background: linear-gradient(135deg, #fdfcff, #f2f8ff);
  border: 1px solid rgba(64, 158, 255, 0.08);
  box-shadow: 0 8px 24px rgba(94, 132, 255, 0.12);
  min-height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.summary-title {
  font-size: 14px;
  color: #8492a6;
}

.summary-value {
  font-size: 28px;
  font-weight: 600;
  color: #1f2d3d;
  margin-top: 4px;
}

.summary-extra {
  margin-top: 12px;
  font-size: 13px;
  color: #636e7b;
}

.stats-section {
  margin-top: 22px;
  display: flex;
  gap: 22px;
  flex-wrap: wrap;
}

.binding-info {
  flex: 1;
  min-width: 220px;
  background: #f6faff;
  border: 1px solid rgba(64, 158, 255, 0.15);
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.binding-title {
  font-size: 14px;
  color: #409eff;
  font-weight: 600;
}

.binding-range {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #1f2d3d;
}

.mix-panel {
  flex: 2;
  min-width: 320px;
  background: #fff7f3;
  border: 1px solid rgba(255, 153, 102, 0.18);
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mix-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #ff7a45;
}

.mix-note {
  font-size: 12px;
  color: #ff9f7a;
}

.mix-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mix-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
}

.mix-name {
  font-weight: 600;
  color: #1f2d3d;
}

.mix-values {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #606c7a;
}

.mix-ratio {
  font-size: 12px;
  color: #ff814f;
}

.insight-grid {
  margin-top: 22px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.insight-card {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  background: #ffffff;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 240px;
}

.insight-header {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.insight-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.insight-item {
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8f9fb;
  border: 1px solid rgba(148, 163, 184, 0.18);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.insight-title {
  font-weight: 600;
  color: #1f2d3d;
}

.insight-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.trend-card {
  min-height: 260px;
}

.trend-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 6px;
}

.trend-item {
  padding: 10px 12px;
  border-radius: 10px;
  background: #fefaf7;
  border: 1px solid rgba(255, 171, 102, 0.24);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #5f6c7b;
}

.trend-date {
  font-weight: 600;
  color: #1f2d3d;
}

.trend-meta {
  display: flex;
  gap: 12px;
}

.filter-card {
  border-radius: 16px;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.range-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-split {
  font-size: 13px;
  color: #909399;
}

.table-card {
  border-radius: 16px;
}

.sort-select {
  width: 160px;
}

.sort-order {
  margin-left: 12px;
}

.terminal-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.terminal-sn {
  font-weight: 600;
  color: #303133;
}

.terminal-name {
  font-size: 12px;
  color: #909399;
}

.store-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.muted-text {
  font-size: 12px;
  color: #a0aec0;
}

.team-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.team-cell .label {
  color: #5a6270;
  font-weight: 500;
}

.date-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.channel-count {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #606c7a;
}

.amount-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1024px) {
  .content-container {
    padding: 0 16px;
  }

  .summary-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}
</style>
