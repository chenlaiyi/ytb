<template>
  <div class="meituan-staff-page">
    <div class="content-container">
      <el-card class="overview-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="card-title">
              <span>销售人员概览</span>
              <el-tag v-if="summary.first_date" type="info" size="small" effect="plain">
                数据范围：{{ summary.first_date }} ~ {{ summary.last_date }}
              </el-tag>
              <el-tag v-else type="warning" size="small" effect="plain">
                暂无数据区间
              </el-tag>
            </div>
            <el-button link type="primary" @click="refreshSummary" :loading="loading.summary">
              刷新
            </el-button>
          </div>
          <p class="card-subtitle">
            观察销售团队规模、商户拓展、交易贡献、终端绑定与团队绩效情况。
          </p>
        </template>

        <div class="summary-grid">
          <div v-for="item in summaryCards" :key="item.title" class="summary-card">
            <div class="summary-title">{{ item.title }}</div>
            <div class="summary-value">{{ item.value }}</div>
            <div class="summary-extra">{{ item.extra }}</div>
          </div>
        </div>

        <div class="overview-row">
          <div class="device-card">
            <div class="device-header">
              <span>终端绑定总览</span>
            </div>
            <div class="device-content">
              <div class="device-item">
                <span class="name">POS</span>
                <span class="value">{{ formatInteger(summary.device_binding.pos) }}</span>
              </div>
              <div class="device-item">
                <span class="name">扫码王</span>
                <span class="value">{{ formatInteger(summary.device_binding.scanner) }}</span>
              </div>
              <div class="device-item">
                <span class="name">音箱</span>
                <span class="value">{{ formatInteger(summary.device_binding.speaker) }}</span>
              </div>
              <div class="device-item">
                <span class="name">码牌</span>
                <span class="value">{{ formatInteger(summary.device_binding.code) }}</span>
              </div>
              <div class="device-item">
                <span class="name">码贴</span>
                <span class="value">{{ formatInteger(summary.device_binding.sticker) }}</span>
              </div>
            </div>
          </div>

          <div class="leader-card">
            <div class="leader-header">
              <span>主管榜 Top5</span>
            </div>
            <div v-if="leaderPerformance.length" class="leader-list">
              <div v-for="(item, index) in leaderPerformance" :key="item.leader_account" class="leader-item">
                <div class="leader-rank">#{{ index + 1 }}</div>
                <div class="leader-info">
                  <div class="leader-name">
                    {{ item.leader_name || '未命名主管' }}
                    <span class="leader-account">({{ item.leader_account || '--' }})</span>
                  </div>
                  <div class="leader-meta">
                    <span>团队人数：{{ formatInteger(item.team_size) }}</span>
                    <span>当日净入：¥{{ formatCurrency(item.team_daily_net_amount) }}</span>
                  </div>
                </div>
                <div class="leader-extra">
                  <span>累计净入</span>
                  <span>¥{{ formatCurrency(item.team_total_net_amount) }}</span>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂未统计主管数据" />
          </div>
        </div>

        <div class="insight-grid">
          <div class="insight-card">
            <div class="insight-header">
              <span>销售业绩 Top5</span>
            </div>
            <div v-if="topPerformers.length" class="performer-list">
              <div v-for="(item, index) in topPerformers" :key="item.salesperson_account" class="performer-item">
                <div class="performer-rank">{{ index + 1 }}</div>
                <div class="performer-main">
                  <div class="performer-name">{{ item.salesperson_name || '未命名销售' }}</div>
                  <div class="performer-meta">
                    <span>账号：{{ item.salesperson_account }}</span>
                    <span>日净入：¥{{ formatCurrency(item.daily_net_amount) }}</span>
                  </div>
                </div>
                <div class="performer-extra">
                  <div>累计净入</div>
                  <div class="performer-amount">¥{{ formatCurrency(item.total_net_amount) }}</div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无销售数据" />
          </div>

          <div class="insight-card">
            <div class="insight-header">
              <span>终端绑定 & 新签趋势（近 7 日）</span>
            </div>
            <div v-if="activationStats.length" class="activation-list">
              <div v-for="item in activationStats" :key="item.date" class="activation-item">
                <div class="activation-date">{{ item.date }}</div>
                <div class="activation-meta">
                  <span>终端绑定 {{ formatInteger(item.total_bindings) }}</span>
                  <span>新签商户 {{ formatInteger(item.new_merchants) }}</span>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无终端绑定趋势" />
          </div>

          <div class="insight-card trend-card">
            <div class="insight-header">
              <span>近 30 日净入趋势</span>
            </div>
            <div v-if="trendPreview.length" class="trend-list">
              <div v-for="item in trendPreview" :key="item.date" class="trend-item">
                <div class="trend-date">{{ item.date }}</div>
                <div class="trend-meta">
                  <span>净入 ¥{{ formatCurrency(item.daily_net_amount) }}</span>
                  <span>新签 {{ formatInteger(item.daily_new_merchants) }} 家</span>
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
                  placeholder="销售姓名 / 账号 / 主管 / 组织"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="所属组织">
                <el-select
                  v-model="filters.organization"
                  filterable
                  clearable
                  allow-create
                  default-first-option
                  placeholder="选择组织"
                >
                  <el-option
                    v-for="item in availableFilters.organizations"
                    :key="item"
                    :label="item"
                    :value="item"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="直属上级">
                <el-select
                  v-model="filters.leader_account"
                  filterable
                  clearable
                  allow-create
                  default-first-option
                  placeholder="选择直属上级"
                >
                  <el-option
                    v-for="item in availableFilters.leaders"
                    :key="item"
                    :label="item"
                    :value="item"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="销售账号">
                <el-select
                  v-model="filters.salesperson_account"
                  filterable
                  clearable
                  allow-create
                  default-first-option
                  placeholder="选择销售账号"
                >
                  <el-option
                    v-for="item in availableFilters.salespersons"
                    :key="item"
                    :label="item"
                    :value="item"
                  />
                </el-select>
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
              <el-form-item label="净收入">
                <div class="range-box">
                  <el-input-number
                    v-model="filters.min_net_amount"
                    :min="0"
                    :precision="2"
                    placeholder="最小净入"
                    controls-position="right"
                  />
                  <span class="range-split">~</span>
                  <el-input-number
                    v-model="filters.max_net_amount"
                    :min="0"
                    :precision="2"
                    placeholder="最大净入"
                    controls-position="right"
                  />
                </div>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12" :lg="8">
              <el-form-item label="商户总量">
                <div class="range-box">
                  <el-input-number
                    v-model="filters.min_merchants"
                    :min="0"
                    placeholder="最小商户数"
                    controls-position="right"
                  />
                  <span class="range-split">~</span>
                  <el-input-number
                    v-model="filters.max_merchants"
                    :min="0"
                    placeholder="最大商户数"
                    controls-position="right"
                  />
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <el-card class="table-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="card-title">
              <span>销售人员列表</span>
            </div>
            <div class="table-tools">
              <el-select v-model="sort.field" size="small" class="sort-select" @change="handleSortChange">
                <el-option label="按累计净入" value="total_net_amount" />
                <el-option label="按当日净入" value="daily_net_amount" />
                <el-option label="按累计收款" value="total_receipt_amount" />
                <el-option label="按商户总量" value="total_merchants" />
                <el-option label="按当日新签" value="daily_new_merchants" />
                <el-option label="按转化率" value="conversion_rate" />
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
          <el-table-column label="销售人员" min-width="220">
            <template #default="scope">
              <div class="staff-cell">
                <div class="staff-name">{{ scope.row.salesperson_name || '未命名销售' }}</div>
                <div class="muted-text">账号：{{ scope.row.salesperson_account }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="所属组织" width="160" prop="organization" show-overflow-tooltip />
          <el-table-column label="直属上级" min-width="200">
            <template #default="scope">
              <div class="leader-cell">
                <div>{{ scope.row.leader_name || '—' }}</div>
                <div class="muted-text">{{ scope.row.leader_account || '--' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="total_merchants" label="累计商户" width="120" />
          <el-table-column prop="daily_new_merchants" label="当日新签" width="120" />
          <el-table-column label="净入金额(元)" min-width="200">
            <template #default="scope">
              <div class="amount-cell">
                <div>当日：¥{{ formatCurrency(scope.row.daily_net_amount) }}</div>
                <div>累计：¥{{ formatCurrency(scope.row.total_net_amount) }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="收退款(元)" min-width="200">
            <template #default="scope">
              <div class="amount-cell">
                <div>收款：¥{{ formatCurrency(scope.row.total_receipt_amount) }}</div>
                <div>退款：¥{{ formatCurrency(scope.row.total_refund_amount) }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="终端绑定" min-width="220">
            <template #default="scope">
              <div class="device-row">
                POS：{{ formatInteger(scope.row.pos_binding_count) }} /
                扫码王：{{ formatInteger(scope.row.scanner_binding_count) }} /
                音箱：{{ formatInteger(scope.row.speaker_binding_count) }}
              </div>
              <div class="device-row">
                码牌：{{ formatInteger(scope.row.code_binding_count) }} /
                码贴：{{ formatInteger(scope.row.sticker_binding_count) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="active_days" label="活跃天数" width="110" />
          <el-table-column label="转化率" width="110">
            <template #default="scope">
              {{ formatPercent(scope.row.conversion_rate * 100) }}
            </template>
          </el-table-column>
          <el-table-column prop="last_date" label="最近日期" width="130" />
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
  fetchMeituanSalesStaffSummary,
  fetchMeituanSalesStaffList
} from '@/api/v1/meituan'

const loading = reactive({
  summary: false,
  table: false
})

const baseSummary = () => ({
  salesperson_count: 0,
  leader_count: 0,
  organization_count: 0,
  daily_new_merchants: 0,
  total_merchants: 0,
  daily_receipt_amount: 0,
  daily_refund_amount: 0,
  daily_net_amount: 0,
  total_receipt_amount: 0,
  total_refund_amount: 0,
  total_net_amount: 0,
  device_binding: {
    pos: 0,
    scanner: 0,
    speaker: 0,
    code: 0,
    sticker: 0
  },
  top_performers: [],
  leader_performance: [],
  activation_stats: [],
  daily_trend: [],
  available_filters: {
    organizations: [],
    leaders: [],
    salespersons: []
  },
  first_date: null,
  last_date: null,
  date_span_days: null
})

const summary = reactive(baseSummary())
const availableFilters = reactive({
  organizations: [],
  leaders: [],
  salespersons: []
})

const defaultDateRange = [
  dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD')
]

const filters = reactive({
  keyword: '',
  organization: '',
  leader_account: '',
  salesperson_account: '',
  min_net_amount: null,
  max_net_amount: null,
  min_merchants: null,
  max_merchants: null,
  dateRange: [...defaultDateRange]
})

const sort = reactive({
  field: 'total_net_amount',
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
    title: '销售人数',
    value: formatInteger(summary.salesperson_count),
    extra: `主管 ${formatInteger(summary.leader_count)} 位 / 组织 ${formatInteger(summary.organization_count)} 个`
  },
  {
    title: '商户拓展',
    value: `${formatInteger(summary.daily_new_merchants)} 家`,
    extra: `累计商户 ${formatInteger(summary.total_merchants)} 家`
  },
  {
    title: '净入金额 (元)',
    value: `¥${formatCurrency(summary.daily_net_amount)}`,
    extra: `累计净入 ¥${formatCurrency(summary.total_net_amount)}`
  },
  {
    title: '收退款 (元)',
    value: `¥${formatCurrency(summary.daily_receipt_amount)}`,
    extra: `退款 ¥${formatCurrency(summary.daily_refund_amount)}`
  }
])

const topPerformers = computed(() => summary.top_performers || [])
const leaderPerformance = computed(() => summary.leader_performance || [])
const activationStats = computed(() => summary.activation_stats || [])
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
  availableFilters.organizations = filters.organizations || []
  availableFilters.leaders = filters.leaders || []
  availableFilters.salespersons = filters.salespersons || []
}

const loadSummary = async () => {
  loading.summary = true
  try {
    const params = buildQueryParams()
    delete params.page
    delete params.per_page
    delete params.sort_field
    delete params.sort_order

    const response = await fetchMeituanSalesStaffSummary(params)
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
    const response = await fetchMeituanSalesStaffList(params)
    if (!response || response.code !== 0) {
      throw new Error(response?.message || '获取销售列表失败')
    }
    const data = response.data || {}
    tableData.value = data.data || []
    pagination.total = data.total || 0
    pagination.pageSize = data.per_page || pagination.pageSize
  } catch (error) {
    tableData.value = []
    ElMessage.error(error?.message || '获取销售列表失败')
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
  filters.organization = ''
  filters.leader_account = ''
  filters.salesperson_account = ''
  filters.min_net_amount = null
  filters.max_net_amount = null
  filters.min_merchants = null
  filters.max_merchants = null
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
.meituan-staff-page {
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
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
  margin-top: 8px;
}

.summary-card {
  padding: 20px 22px;
  border-radius: 16px;
  background: linear-gradient(135deg, #fbfcff, #eff5ff);
  border: 1px solid rgba(64, 158, 255, 0.08);
  box-shadow: 0 8px 24px rgba(94, 132, 255, 0.12);
  min-height: 132px;
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

.overview-row {
  margin-top: 22px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.device-card {
  flex: 1;
  min-width: 240px;
  background: #f6ffed;
  border: 1px solid rgba(82, 196, 26, 0.2);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.device-header {
  font-weight: 600;
  color: #40916c;
}

.device-content {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.device-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #5a6270;
}

.device-item .value {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}

.leader-card {
  flex: 2;
  min-width: 320px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  padding: 18px 20px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.leader-header {
  font-weight: 600;
  color: #303133;
}

.leader-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.leader-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f7fafc;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.leader-rank {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: #fff;
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
}

.leader-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.leader-name {
  font-weight: 600;
  color: #1f2d3d;
}

.leader-account {
  font-size: 12px;
  color: #909399;
  margin-left: 6px;
}

.leader-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #5f6c7b;
}

.leader-extra {
  text-align: right;
  font-size: 12px;
  color: #909399;
}

.leader-extra .performer-amount {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
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
  min-height: 260px;
}

.insight-header {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.performer-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.performer-item {
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8f9fb;
  border: 1px solid rgba(148, 163, 184, 0.18);
  align-items: center;
}

.performer-rank {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
}

.performer-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.performer-name {
  font-weight: 600;
  color: #1f2d3d;
}

.performer-meta {
  font-size: 12px;
  color: #707c8a;
  display: flex;
  gap: 12px;
}

.performer-extra {
  text-align: right;
  font-size: 12px;
  color: #909399;
}

.performer-amount {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
}

.activation-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.activation-item {
  padding: 10px 12px;
  border-radius: 10px;
  background: #fef7f3;
  border: 1px solid rgba(255, 171, 102, 0.24);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.activation-date {
  font-weight: 600;
  color: #1f2d3d;
}

.activation-meta {
  display: flex;
  gap: 16px;
  color: #5f6c7b;
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
  background: #f0f7ff;
  border: 1px solid rgba(100, 181, 246, 0.3);
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
  width: 150px;
}

.sort-order {
  margin-left: 12px;
}

.staff-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.staff-name {
  font-weight: 600;
  color: #303133;
}

.muted-text {
  font-size: 12px;
  color: #a0aec0;
}

.leader-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.amount-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.device-row {
  font-size: 12px;
  color: #606c7a;
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

  .overview-row {
    flex-direction: column;
  }
}
</style>
