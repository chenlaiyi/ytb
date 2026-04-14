<template>
  <div class="meituan-sales-page">
    <div class="content-container">
      <el-card class="overview-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="card-title">
              <span>美团销售概览</span>
              <el-tag type="success" size="small" effect="light">
                {{ summary.first_sales_date && summary.last_sales_date
                  ? `覆盖 ${summary.first_sales_date} ~ ${summary.last_sales_date}`
                  : '近30日汇总' }}
              </el-tag>
            </div>
            <el-button link type="primary" @click="refreshSummary" :loading="loading.summary">
              刷新
            </el-button>
          </div>
          <p class="card-subtitle">
            基于上传的美团订单交易明细，支持订单查询、渠道分析与状态监控。
          </p>
        </template>
        <div class="summary-grid">
          <div
            v-for="item in summaryCards"
            :key="item.title"
            class="summary-card"
          >
            <div class="summary-title">{{ item.title }}</div>
            <div class="summary-value">{{ item.value }}</div>
            <div class="summary-extra">{{ item.extra }}</div>
          </div>
        </div>
        <div class="success-panel">
          <div class="success-metrics">
            <div class="metric">
              <span class="metric-label">成功订单</span>
              <span class="metric-value">{{ formatInteger(summary.success_orders) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">成功金额</span>
              <span class="metric-value">¥{{ formatCurrency(summary.success_amount) }}</span>
            </div>
          </div>
          <div class="success-progress">
            <div class="progress-header">
              <span>成功率</span>
              <span class="progress-value">{{ formatPercent(summary.success_rate) }}</span>
            </div>
            <el-progress
              :percentage="Math.min(100, Math.round(summary.success_rate || 0))"
              :stroke-width="10"
              status="success"
            />
          </div>
        </div>
        <div class="overview-meta">
          <span>渠道：{{ formatInteger(summary.channel_count) }} 个</span>
          <span>终端：{{ formatInteger(summary.terminal_count) }} 台</span>
          <span>城市：{{ formatInteger(summary.city_count) }} 个</span>
          <span v-if="summary.date_span_days">统计天数：{{ summary.date_span_days }} 天</span>
        </div>
      </el-card>

      <el-card class="insight-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="card-title">
              <span>洞察分析</span>
            </div>
          </div>
        </template>
        <div class="insight-grid">
          <div class="insight-block">
            <div class="block-header">
              <span>订单状态分布</span>
            </div>
            <div v-if="statusBreakdown.length" class="breakdown-list">
              <div v-for="item in statusBreakdown" :key="item.status" class="breakdown-item">
                <div class="breakdown-main">
                  <span class="breakdown-label">{{ item.status }}</span>
                  <span class="breakdown-amount">¥{{ formatCurrency(item.total_amount) }}</span>
                </div>
                <div class="breakdown-meta">
                  <span>{{ formatInteger(item.order_count) }} 笔</span>
                  <span>{{ formatPercent(item.order_ratio * 100) }}</span>
                </div>
                <el-progress
                  :percentage="Math.min(100, Math.round(item.order_ratio * 100))"
                  :stroke-width="8"
                  color="#5c7cfa"
                  :show-text="false"
                />
              </div>
            </div>
            <el-empty v-else description="暂无状态分布数据" />
          </div>

          <div class="insight-block">
            <div class="block-header">
              <span>支付渠道贡献 Top6</span>
            </div>
            <div v-if="channelBreakdown.length" class="breakdown-list">
              <div v-for="item in channelBreakdown" :key="item.channel" class="breakdown-item">
                <div class="breakdown-main">
                  <span class="breakdown-label">{{ item.channel }}</span>
                  <span class="breakdown-amount">¥{{ formatCurrency(item.total_amount) }}</span>
                </div>
                <div class="breakdown-meta">
                  <span>{{ formatInteger(item.order_count) }} 笔</span>
                  <span>{{ formatPercent(item.amount_ratio * 100) }}</span>
                </div>
                <el-progress
                  :percentage="Math.min(100, Math.round(item.amount_ratio * 100))"
                  :stroke-width="8"
                  color="#2ac39b"
                  :show-text="false"
                />
              </div>
            </div>
            <el-empty v-else description="暂无渠道数据" />
          </div>

          <div class="insight-block trend-block">
            <div class="block-header">
              <span>近 30 日订单趋势</span>
            </div>
            <div v-if="trendPreview.length" class="trend-list">
              <div v-for="item in trendPreview" :key="item.date" class="trend-item">
                <div class="trend-date">{{ item.date }}</div>
                <div class="trend-info">
                  <span>{{ formatInteger(item.order_count) }} 笔</span>
                  <span>¥{{ formatCurrency(item.total_amount) }}</span>
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
              <el-button type="primary" @click="handleFilter" :loading="loading.summary || loading.table">
                查询
              </el-button>
            </div>
          </div>
        </template>
        <el-form :model="filters" label-width="96px" label-position="left" class="filter-form">
          <el-row :gutter="16">
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="关键字">
                <el-input
                  v-model.trim="filters.keyword"
                  placeholder="订单号 / 商户 / 门店 / 终端"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="合作城市">
                <el-input v-model.trim="filters.city" placeholder="城市名称" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="支付渠道">
                <el-select
                  v-model="filters.payment_channel"
                  placeholder="选择或输入渠道"
                  clearable
                  filterable
                  allow-create
                  default-first-option
                >
                  <el-option
                    v-for="channel in availableFilters.payment_channels"
                    :key="channel"
                    :label="channel"
                    :value="channel"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="订单状态">
                <el-select
                  v-model="filters.payment_status"
                  placeholder="选择或输入状态"
                  clearable
                  filterable
                  allow-create
                  default-first-option
                >
                  <el-option
                    v-for="status in availableFilters.payment_statuses"
                    :key="status"
                    :label="status"
                    :value="status"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="销售账号">
                <el-input v-model.trim="filters.salesperson_account" placeholder="销售人员账号" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="直属上级">
                <el-input v-model.trim="filters.leader_account" placeholder="直属上级账号" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="商户编号">
                <el-input v-model.trim="filters.merchant_code" placeholder="商户编号" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="所属组织">
                <el-input v-model.trim="filters.organization" placeholder="组织名称" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="经营品类">
                <el-input v-model.trim="filters.business_category" placeholder="经营品类" clearable />
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
              <el-form-item label="销售日期">
                <el-date-picker
                  v-model="filters.dateRange"
                  type="daterange"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  unlink-panels
                  range-separator="至"
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
              <span>订单明细</span>
            </div>
            <div class="table-tools">
              <el-select v-model="sort.field" size="small" class="sort-select" @change="handleSortChange">
                <el-option label="按销售日期" value="sales_date" />
                <el-option label="按订单金额" value="order_amount" />
                <el-option label="按支付渠道" value="payment_channel" />
                <el-option label="按订单状态" value="payment_status" />
                <el-option label="按商户名称" value="merchant_name" />
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
          <el-table-column prop="sales_date" label="销售日期" width="120" />
          <el-table-column label="订单号" min-width="220">
            <template #default="scope">
              <div class="order-cell">
                <div class="order-no">交易：{{ scope.row.transaction_order_no }}</div>
                <div v-if="scope.row.payment_order_no" class="order-no secondary">
                  支付：{{ scope.row.payment_order_no }}
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="商户信息" min-width="220">
            <template #default="scope">
              <div class="merchant-cell">
                <div class="merchant-name">{{ scope.row.merchant_name || '—' }}</div>
                <div class="merchant-meta">
                  <span>编号：{{ scope.row.merchant_code || '--' }}</span>
                  <span>门店：{{ scope.row.store_name || '--' }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="支付渠道" width="120">
            <template #default="scope">
              <el-tag size="small" type="info">{{ scope.row.payment_channel || '未标注' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="订单状态" width="120">
            <template #default="scope">
              <el-tag
                size="small"
                :type="isSuccessStatus(scope.row.payment_status) ? 'success' : 'warning'"
              >
                {{ scope.row.payment_status || '未知' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="订单金额(元)" width="140" align="right">
            <template #default="scope">
              ¥{{ formatCurrency(scope.row.order_amount) }}
            </template>
          </el-table-column>
          <el-table-column label="费率" width="160">
            <template #default="scope">
              实际 {{ formatPercent(scope.row.actual_rate * 100, 2) }} /
              签约 {{ formatPercent(scope.row.contract_rate * 100, 2) }}
            </template>
          </el-table-column>
          <el-table-column label="销售人员" min-width="180">
            <template #default="scope">
              <div class="user-cell">
                <div>{{ scope.row.salesperson_name || '—' }}</div>
                <div class="muted-text">{{ scope.row.salesperson_account || '--' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="直属上级" min-width="180">
            <template #default="scope">
              <div class="user-cell">
                <div>{{ scope.row.leader_name || '—' }}</div>
                <div class="muted-text">{{ scope.row.leader_account || '--' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="终端信息" min-width="200">
            <template #default="scope">
              <div class="terminal-cell">
                <div>SN：{{ scope.row.terminal_sn || '--' }}</div>
                <div class="muted-text">{{ scope.row.terminal_name || '未命名终端' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="city" label="合作城市" width="140" />
          <el-table-column prop="business_category" label="经营品类" min-width="160" show-overflow-tooltip />
          <el-table-column prop="organization" label="所属组织" min-width="160" show-overflow-tooltip />
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
import { fetchMeituanSalesSummary, fetchMeituanSalesList } from '@/api/v1/meituan'

const loading = reactive({
  summary: false,
  table: false
})

const createEmptySummary = () => ({
  total_orders: 0,
  total_amount: 0,
  average_amount: 0,
  merchant_count: 0,
  salesperson_count: 0,
  channel_count: 0,
  terminal_count: 0,
  city_count: 0,
  success_orders: 0,
  success_amount: 0,
  success_rate: 0,
  success_amount_ratio: 0,
  first_sales_date: null,
  last_sales_date: null,
  date_span_days: null,
  status_breakdown: [],
  channel_breakdown: [],
  daily_trend: []
})

const summary = reactive(createEmptySummary())
const availableFilters = reactive({
  payment_statuses: [],
  payment_channels: []
})

const defaultDateRange = [
  dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD')
]

const filters = reactive({
  keyword: '',
  city: '',
  payment_channel: '',
  payment_status: '',
  salesperson_account: '',
  leader_account: '',
  merchant_code: '',
  organization: '',
  business_category: '',
  min_amount: null,
  max_amount: null,
  dateRange: [...defaultDateRange]
})

const sort = reactive({
  field: 'sales_date',
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
    title: '订单总额 (元)',
    value: `¥${formatCurrency(summary.total_amount)}`,
    extra: `平均 ¥${formatCurrency(summary.average_amount)} / 成功金额 ¥${formatCurrency(summary.success_amount)}`
  },
  {
    title: '订单数 (笔)',
    value: formatInteger(summary.total_orders),
    extra: `成功率 ${formatPercent(summary.success_rate)}`
  },
  {
    title: '覆盖商户',
    value: formatInteger(summary.merchant_count),
    extra: `销售人员 ${formatInteger(summary.salesperson_count)}`
  },
  {
    title: '渠道与终端',
    value: `${formatInteger(summary.channel_count)} 渠道`,
    extra: `终端 ${formatInteger(summary.terminal_count)} / 城市 ${formatInteger(summary.city_count)}`
  }
])

const statusBreakdown = computed(() => summary.status_breakdown || [])
const channelBreakdown = computed(() => summary.channel_breakdown || [])
const trendPreview = computed(() => {
  const trend = summary.daily_trend || []
  if (!trend.length) return []
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

    if (value !== null && value !== undefined && value !== '') {
      params[key] = value
    }
  })

  return params
}

const applySummary = data => {
  const merged = {
    ...createEmptySummary(),
    ...(data || {})
  }
  Object.assign(summary, merged)
  availableFilters.payment_statuses = merged.available_filters?.payment_statuses || []
  availableFilters.payment_channels = merged.available_filters?.payment_channels || []
}

const loadSummary = async () => {
  loading.summary = true
  try {
    const params = buildQueryParams()
    delete params.page
    delete params.per_page
    delete params.sort_field
    delete params.sort_order

    const response = await fetchMeituanSalesSummary(params)
    if (!response || response.code !== 0) {
      throw new Error(response?.message || '获取销售概览失败')
    }
    applySummary(response.data)
  } catch (error) {
    applySummary(null)
    ElMessage.error(error?.message || '获取销售概览失败')
  } finally {
    loading.summary = false
  }
}

const loadTable = async () => {
  loading.table = true
  try {
    const params = buildQueryParams()
    const response = await fetchMeituanSalesList(params)
    if (!response || response.code !== 0) {
      throw new Error(response?.message || '获取订单列表失败')
    }

    const data = response.data || {}
    tableData.value = data.data || []
    pagination.total = data.total || 0
    pagination.pageSize = data.per_page || pagination.pageSize
  } catch (error) {
    tableData.value = []
    ElMessage.error(error?.message || '获取订单列表失败')
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
  filters.payment_channel = ''
  filters.payment_status = ''
  filters.salesperson_account = ''
  filters.leader_account = ''
  filters.merchant_code = ''
  filters.organization = ''
  filters.business_category = ''
  filters.min_amount = null
  filters.max_amount = null
  filters.dateRange = [...defaultDateRange]
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
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '0.00'
  }
  return Number(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatInteger = value => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '0'
  }
  return Number(value).toLocaleString('zh-CN', {
    maximumFractionDigits: 0
  })
}

const formatPercent = (value, fraction = 2) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return `0.${'0'.repeat(fraction)}%`
  }
  return `${Number(value).toFixed(fraction)}%`
}

const isSuccessStatus = status => {
  if (!status) return false
  const normalized = String(status).toLowerCase()
  return ['success', '成功', '已支付', '交易成功', '支付成功', '结算成功'].some(keyword =>
    normalized.includes(keyword.toLowerCase())
  )
}

onMounted(async () => {
  await Promise.all([loadSummary(), loadTable()])
})
</script>

<style scoped>
.meituan-sales-page {
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
  padding-bottom: 12px;
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
  background: linear-gradient(135deg, #fdfbff, #f4f9ff);
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

.success-panel {
  margin-top: 20px;
  padding: 18px 22px;
  border-radius: 14px;
  background: rgba(82, 196, 26, 0.06);
  border: 1px solid rgba(82, 196, 26, 0.18);
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: center;
}

.success-metrics {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 13px;
  color: #5b6b7f;
}

.metric-value {
  font-size: 20px;
  font-weight: 600;
  color: #1f2d3d;
}

.success-progress {
  flex: 1;
  min-width: 220px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
  color: #5b6b7f;
}

.progress-value {
  font-weight: 600;
  color: #1f2d3d;
}

.overview-meta {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: #636e7b;
}

.insight-card {
  border-radius: 16px;
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
}

.insight-block {
  padding: 12px 4px;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.block-header {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.breakdown-item {
  padding: 10px 12px;
  border-radius: 10px;
  background: #f7f9fc;
  border: 1px solid rgba(148, 163, 184, 0.15);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.breakdown-main {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.breakdown-label {
  font-weight: 600;
  color: #1f2d3d;
}

.breakdown-amount {
  color: #1f2d3d;
  font-weight: 500;
}

.breakdown-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #8492a6;
}

.trend-block {
  min-height: 240px;
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
  background: #fdfdff;
  border: 1px solid rgba(164, 174, 255, 0.24);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.trend-date {
  font-weight: 600;
  color: #1f2d3d;
}

.trend-info {
  display: flex;
  gap: 12px;
  color: #53627c;
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
  width: 140px;
}

.sort-order {
  margin-left: 12px;
}

.order-cell .order-no {
  font-size: 13px;
  color: #1f2d3d;
}

.order-cell .order-no.secondary {
  color: #909399;
}

.merchant-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.merchant-name {
  font-weight: 600;
  color: #303133;
}

.merchant-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.muted-text {
  font-size: 12px;
  color: #a0aec0;
}

.terminal-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #606c7a;
}

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1024px) {
  .summary-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  .content-container {
    padding: 0 16px;
  }
}
</style>
