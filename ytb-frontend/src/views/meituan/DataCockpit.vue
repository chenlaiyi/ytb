<template>
  <div class="meituan-dashboard">
    <section class="panel panel-header">
      <div class="header-left">
        <div class="title-row">
          <h2>美团数据驾驶舱</h2>
          <el-tag size="small" type="success" effect="light" v-if="loaded">实时</el-tag>
          <el-tag size="small" type="info" effect="light" v-if="!loaded">加载中</el-tag>
        </div>
        <p class="subtitle">
          聚合美团渠道的 GMV、净入账、商户、终端、销售团队与风险态势，一站式洞察。
        </p>
      </div>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          unlink-panels
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="small"
          :disabled="loading"
          @change="handleDateChange"
        />
        <el-select
          v-model="filters.granularity"
          size="small"
          :disabled="trendLoading || loading"
          @change="loadTrend"
        >
          <el-option label="按日" value="day" />
          <el-option label="按周" value="week" />
          <el-option label="按月" value="month" />
        </el-select>
        <el-button size="small" :loading="loading" type="primary" @click="reloadAll">刷新</el-button>
      </div>
    </section>

    <section class="panel panel-metrics">
      <div class="metrics-header">
        <div class="metrics-title">
          <span>关键指标</span>
          <small>最后更新：{{ generatedAtText }}</small>
        </div>
        <div class="range-chips">
          <span
            v-for="option in presetRanges"
            :key="option.value"
            class="range-chip"
            :class="{ active: option.value === activePreset }"
            @click="handleRangePreset(option)"
          >
            {{ option.label }}
          </span>
        </div>
      </div>
      <div class="metrics-grid">
        <el-skeleton :rows="4" animated v-if="loading" />
        <template v-else>
          <div v-for="card in summaryCards" :key="card.key" class="metric-card">
            <div class="metric-header">
              <span class="metric-label">{{ card.label }}</span>
              <el-tooltip effect="dark" placement="top" :content="deltaTips(card)">
                <span
                  class="metric-delta"
                  :class="{
                    up: card.delta?.trend === 'up',
                    down: card.delta?.trend === 'down'
                  }"
                >
                  {{ formatDelta(card.delta) }}
                </span>
              </el-tooltip>
            </div>
            <div class="metric-value">
              <span>{{ formatValue(card.value, card.unit) }}</span>
              <small>{{ card.unit }}</small>
            </div>
            <div class="metric-baseline">
              对比值：{{ formatValue(card.delta?.baseline ?? 0, card.unit) }}
            </div>
          </div>
        </template>
      </div>
      <div class="metrics-overview" v-if="!loading">
        <div class="overview-item" v-for="item in overviewMetrics" :key="item.key">
          <div class="label">{{ item.label }}</div>
          <div class="value">{{ item.value }}</div>
          <div class="desc">{{ item.desc }}</div>
        </div>
      </div>
    </section>

    <section class="panel panel-trend">
      <div class="section-title">
        <span>交易趋势</span>
        <el-checkbox-group v-model="selectedMetrics" @change="loadTrend">
          <el-checkbox label="gmv">GMV</el-checkbox>
          <el-checkbox label="net">净入账</el-checkbox>
          <el-checkbox label="refund">退款金额</el-checkbox>
          <el-checkbox label="orders">订单笔数</el-checkbox>
          <el-checkbox label="active_merchants">活跃商户</el-checkbox>
          <el-checkbox label="active_terminals">活跃终端</el-checkbox>
        </el-checkbox-group>
      </div>
      <div class="chart-wrapper">
        <div v-loading="trendLoading" class="chart-area" ref="trendChartRef"></div>
      </div>
    </section>

    <section class="panel panel-city" v-if="cityStats.top.length">
      <div class="city-header">
        <div>
          <div class="section-title"><span>城市统计</span></div>
          <p class="city-subtitle">按 GMV 排序的核心城市表现</p>
        </div>
        <div class="city-summary">
          <div class="summary-card">
            <div class="label">TOP 城市 GMV</div>
            <div class="value">¥{{ cityStats.total_amount }}</div>
          </div>
          <div class="summary-card">
            <div class="label">覆盖商户</div>
            <div class="value">{{ cityStats.total_merchants.toLocaleString() }}</div>
          </div>
        </div>
      </div>
      <div class="city-list">
        <div class="city-row" v-for="city in cityStats.top" :key="city.city + city.rank">
          <div class="city-rank">{{ city.rank }}</div>
          <div class="city-body">
            <div class="city-name">{{ city.city }}</div>
            <div class="city-meta">
              商户 {{ city.merchant_count }} · 净入账 ¥{{ city.net_amount }}
            </div>
            <div class="city-progress">
              <div class="city-progress-bar" :style="{ width: `${city.share * 100}%` }"></div>
            </div>
          </div>
          <div class="city-amount">
            ¥{{ city.total_amount }}
            <span class="city-share">{{ formatPercent(city.share) }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="panel panel-dimensions">
      <div class="dimension-grid" v-loading="dimensionLoading">
        <div class="dimension-card" v-for="block in dimensionBlocks" :key="block.key">
          <div class="dimension-header">
            <span>{{ block.title }}</span>
            <el-tag size="small" type="info" effect="plain">{{ block.unit }}</el-tag>
          </div>
          <el-table
            :data="block.data"
            height="260"
            stripe
            v-if="block.data.length"
            size="small"
          >
            <el-table-column
              v-for="col in block.columns"
              :key="col.prop"
              :prop="col.prop"
              :label="col.label"
              :width="col.width"
              :min-width="col.minWidth"
            />
          </el-table>
          <el-empty v-else description="暂无数据" :image-size="60" />
        </div>
      </div>
    </section>

    <section class="panel panel-alerts">
      <div class="section-title">
        <span>风险与告警</span>
        <el-button size="small" type="primary" text @click="loadAlerts">刷新</el-button>
      </div>
      <el-table :data="alerts" size="small" stripe v-loading="alertsLoading">
        <el-table-column prop="title" label="告警" min-width="200">
          <template #default="{ row }">
            <div class="alert-title">
              <el-tag :type="alertType(row.level)" size="small">{{ alertLevelText(row.level) }}</el-tag>
              <span>{{ row.title }}</span>
            </div>
            <p class="alert-message">{{ row.message }}</p>
          </template>
        </el-table-column>
        <el-table-column prop="recommendation" label="处置建议" min-width="240" show-overflow-tooltip />
        <el-table-column prop="created_at" label="生成时间" width="160" />
      </el-table>
    </section>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import * as echarts from 'echarts'
import {
  fetchMeituanDashboardSummary,
  fetchMeituanDashboardTrend,
  fetchMeituanDashboardDimensions,
  fetchMeituanDashboardAlerts
} from '@/api/v1/meituan'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const trendLoading = ref(false)
const dimensionLoading = ref(false)
const alertsLoading = ref(false)
const loaded = ref(false)

const filters = reactive({
  date_start: '',
  date_end: '',
  granularity: 'day'
})

const presetRanges = [
  { label: '近7天', value: 7 },
  { label: '近30天', value: 30 },
  { label: '近90天', value: 90 },
  { label: '近180天', value: 180 }
]
const activePreset = ref(30)

const dateRange = ref([])
const summaryCards = ref([])
const overviewMetrics = ref([])
const generatedAtText = ref('--')

const selectedMetrics = ref(['gmv', 'net', 'orders'])
const trendChartRef = ref(null)
let trendChartInstance = null

const dimensionBlocks = ref([
  {
    key: 'cities',
    title: '城市结构 TOP10',
    unit: '单位：元',
    columns: [
      { prop: 'city', label: '城市', minWidth: 120 },
      { prop: 'merchant_count', label: '商户数', width: 100 },
      { prop: 'total_amount', label: 'GMV', width: 120 }
    ],
    data: []
  },
  {
    key: 'merchants',
    title: '商户 TOP10',
    unit: '单位：元',
    columns: [
      { prop: 'merchant_name', label: '商户', minWidth: 140 },
      { prop: 'city', label: '城市', width: 100 },
      { prop: 'total_amount', label: 'GMV', width: 120 }
    ],
    data: []
  },
  {
    key: 'leaders',
    title: '机构/主管 TOP10',
    unit: '单位：元',
    columns: [
      { prop: 'leader_name', label: '主管/机构', minWidth: 140 },
      { prop: 'merchant_count', label: '商户', width: 80 },
      { prop: 'total_amount', label: 'GMV', width: 120 }
    ],
    data: []
  },
  {
    key: 'channels',
    title: '渠道结构',
    unit: '单位：元',
    columns: [
      { prop: 'channel', label: '渠道', minWidth: 120 },
      { prop: 'order_count', label: '订单', width: 100 },
      { prop: 'total_amount', label: 'GMV', width: 120 }
    ],
    data: []
  }
])

const alerts = ref([])
const cityStats = ref({
  top: [],
  total_amount: '--',
  total_merchants: 0
})

const overviewDefinitions = [
  { key: 'merchant_count', label: '覆盖商户', desc: '范围内去重商户数' },
  { key: 'active_merchants', label: '活跃商户', desc: '有交易发生的商户' },
  { key: 'terminal_count', label: '覆盖终端', desc: '范围内去重终端数' },
  { key: 'active_terminals', label: '活跃终端', desc: '有交易终端数' },
  { key: 'salesperson_count', label: '销售成员', desc: '范围内去重销售账号' },
  { key: 'active_salesperson_count', label: '活跃销售', desc: '有新增或交易的销售' },
  { key: 'order_total', label: '订单总数', desc: '订单明细条数' },
  { key: 'order_success_rate', label: '订单成功率', desc: '成功订单占比' }
]

function initChart() {
  if (trendChartInstance || !trendChartRef.value) {
    return
  }
  trendChartInstance = echarts.init(trendChartRef.value)
  window.addEventListener('resize', resizeChart)
}

function resizeChart() {
  trendChartInstance?.resize()
}

function setDateRangeByPreset(days) {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))
  dateRange.value = [start, end]
  filters.date_start = formatDate(start)
  filters.date_end = formatDate(end)
}

function formatDate(date) {
  if (!date) return ''
  const target = date instanceof Date ? date : new Date(date)
  const m = `${target.getMonth() + 1}`.padStart(2, '0')
  const d = `${target.getDate()}`.padStart(2, '0')
  return `${target.getFullYear()}-${m}-${d}`
}

function handleRangePreset(option) {
  activePreset.value = option.value
  setDateRangeByPreset(option.value)
  reloadAll()
}

function handleDateChange(value) {
  if (!value || !value.length) {
    return
  }
  filters.date_start = formatDate(value[0])
  filters.date_end = formatDate(value[1])
  activePreset.value = null
  reloadAll()
}

function reloadAll() {
  loadSummary()
  loadTrend()
  loadDimensions()
  loadAlerts()
}

async function loadSummary() {
  loading.value = true
  try {
    const { code, data, message } = await fetchMeituanDashboardSummary({
      date_start: filters.date_start,
      date_end: filters.date_end
    })

    if (code !== 0) {
      throw new Error(message || '获取概览失败')
    }

    summaryCards.value = data.cards || []
    overviewMetrics.value = overviewDefinitions.map(def => ({
      key: def.key,
      label: def.label,
      desc: def.desc,
      value: data.overview?.[def.key] ?? '--'
    }))
    generatedAtText.value = data.generated_at || '--'
    loaded.value = true
  } catch (error) {
    ElMessage.error(error.message || '加载概览失败')
  } finally {
    loading.value = false
  }
}

async function loadTrend() {
  if (!trendChartInstance) {
    initChart()
  }
  if (!selectedMetrics.value.length) {
    selectedMetrics.value = ['gmv']
  }
  trendLoading.value = true
  try {
    const { code, data, message } = await fetchMeituanDashboardTrend({
      date_start: filters.date_start,
      date_end: filters.date_end,
      metrics: selectedMetrics.value,
      granularity: filters.granularity
    })
    if (code !== 0) {
      throw new Error(message || '获取趋势失败')
    }
    renderTrendChart(data.series || [])
  } catch (error) {
    ElMessage.error(error.message || '加载趋势失败')
  } finally {
    trendLoading.value = false
  }
}

function renderTrendChart(seriesList) {
  if (!trendChartInstance) return
  const colors = ['#2c7be5', '#00c9a7', '#f6c343', '#e63757', '#6f42c1', '#22b8cf']
  const legend = seriesList.map(series => series.label)
  if (!seriesList.length) {
    trendChartInstance.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: [] },
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: []
    })
    return
  }
  const xAxis = (seriesList[0]?.data || []).map(item => item.period)
  const option = {
    color: colors,
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: legend
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxis
    },
    yAxis: {
      type: 'value'
    },
    series: seriesList.map((series, index) => ({
      name: series.label,
      type: 'line',
      smooth: true,
      data: series.data.map(item => item.value),
      areaStyle: {
        opacity: 0.08,
        color: colors[index % colors.length]
      }
    }))
  }
  trendChartInstance.setOption(option)
}

async function loadDimensions() {
  dimensionLoading.value = true
  try {
    const { code, data, message } = await fetchMeituanDashboardDimensions({
      date_start: filters.date_start,
      date_end: filters.date_end
    })
    if (code !== 0) {
      throw new Error(message || '获取结构数据失败')
    }

    const mapping = {
      cities: 'cities',
      merchants: 'merchants',
      leaders: 'leaders',
      channels: 'channels'
    }

    const citiesRaw = data.cities || []
    const totalCityAmount = citiesRaw.reduce((sum, item) => {
      const value = Number(item.total_amount ?? 0)
      return Number.isNaN(value) ? sum : sum + value
    }, 0)
    const totalCityMerchants = citiesRaw.reduce((sum, item) => sum + Number(item.merchant_count ?? 0), 0)
    const formattedCities = citiesRaw.map((item, index) => {
      const amount = Number(item.total_amount ?? 0)
      const share = totalCityAmount > 0 ? amount / totalCityAmount : 0
      return {
        ...item,
        rank: index + 1,
        total_amount_value: amount,
        total_amount: formatThousand(amount),
        net_amount: formatThousand(item.net_amount ?? 0),
        share
      }
    })

    cityStats.value = {
      top: formattedCities.slice(0, 8),
      total_amount: formatThousand(totalCityAmount),
      total_merchants: totalCityMerchants
    }

    dimensionBlocks.value = dimensionBlocks.value.map(block => ({
      ...block,
      data: (data[mapping[block.key]] || []).map(item => ({
        ...item,
        total_amount: item.total_amount ? formatThousand(item.total_amount) : item.total_amount
      }))
    }))
  } catch (error) {
    ElMessage.error(error.message || '加载结构数据失败')
  } finally {
    dimensionLoading.value = false
  }
}

async function loadAlerts() {
  alertsLoading.value = true
  try {
    const { code, data, message } = await fetchMeituanDashboardAlerts({
      date_start: filters.date_start,
      date_end: filters.date_end
    })
    if (code !== 0) {
      throw new Error(message || '获取告警数据失败')
    }
    alerts.value = data.items || []
  } catch (error) {
    ElMessage.error(error.message || '加载告警失败')
  } finally {
    alertsLoading.value = false
  }
}

function formatValue(value, unit) {
  if (value === null || value === undefined || value === '--') {
    return '--'
  }
  if (unit === '元') {
    return formatThousand(value)
  }
  return value
}

function formatDelta(delta) {
  if (!delta || delta.rate === null || delta.rate === undefined) {
    return '--'
  }
  const rate = (delta.rate * 100).toFixed(1)
  return `${rate}%`
}

function deltaTips(delta) {
  if (!delta || delta.rate === null || delta.rate === undefined) {
    return '暂无对比数据'
  }
  return `对比值: ${formatValue(delta.baseline ?? 0, '元')}，差值: ${formatValue(delta.difference ?? 0, '元')}`
}

function alertType(level) {
  if (level === 'critical') return 'danger'
  if (level === 'warning') return 'warning'
  return 'info'
}

function alertLevelText(level) {
  if (level === 'critical') return '严重'
  if (level === 'warning') return '警告'
  return '提示'
}

function formatThousand(value) {
  const number = Number(value)
  if (Number.isNaN(number)) {
    return value
  }
  return number.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function formatPercent(value) {
  if (value === null || value === undefined) {
    return '--'
  }
  const percent = Number(value) * 100
  if (Number.isNaN(percent)) {
    return '--'
  }
  return `${percent.toFixed(percent >= 10 ? 1 : 2)}%`
}

onMounted(() => {
  setDateRangeByPreset(activePreset.value)
  nextTick(() => {
    initChart()
    reloadAll()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
  if (trendChartInstance) {
    trendChartInstance.dispose()
    trendChartInstance = null
  }
})

</script>

<style scoped>
.meituan-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: #f5f7fa;
  min-height: 100%;
}

.panel {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(31, 45, 61, 0.05);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.header-left {
  max-width: 60%;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.title-row h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2d3d;
}

.subtitle {
  margin: 0;
  color: #909399;
  font-size: 13px;
  line-height: 18px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-metrics {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.metrics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metrics-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metrics-title small {
  color: #909399;
  font-size: 12px;
}

.range-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.range-chip {
  padding: 4px 12px;
  border-radius: 16px;
  background: #eef2ff;
  color: #606266;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.range-chip:hover {
  background: #d7e3ff;
}

.range-chip.active {
  background: #2c7be5;
  color: #fff;
}

.metrics-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.metric-card {
  background: #f9fafc;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid rgba(44, 123, 229, 0.08);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #606266;
  font-size: 13px;
}

.metric-value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 26px;
  font-weight: 600;
  color: #1f2d3d;
}

.metric-value small {
  font-size: 13px;
  color: #909399;
}

.metric-delta {
  font-size: 12px;
}

.metric-delta.up {
  color: #16c37b;
}

.metric-delta.down {
  color: #f56c6c;
}

.metric-baseline {
  font-size: 12px;
  color: #909399;
}

.metrics-overview {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.overview-item {
  background: #fff;
  border: 1px dashed rgba(144, 147, 153, 0.35);
  border-radius: 10px;
  padding: 12px;
}

.overview-item .label {
  font-size: 13px;
  color: #409eff;
  margin-bottom: 4px;
}

.overview-item .value {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}

.overview-item .desc {
  font-size: 12px;
  color: #909399;
}

.panel-trend .chart-wrapper {
  height: 360px;
}

.chart-area {
  width: 100%;
  height: 100%;
}

.panel-city {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.city-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.city-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #909399;
}

.city-summary {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.summary-card {
  padding: 12px 16px;
  border-radius: 10px;
  background: #f5f7ff;
  min-width: 160px;
}

.summary-card .label {
  font-size: 12px;
  color: #909399;
}

.summary-card .value {
  margin-top: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.city-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.city-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  background: #fafbfc;
  border: 1px solid #f0f2f5;
}

.city-rank {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eef2ff;
  color: #4c6ef5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.city-body {
  flex: 1;
}

.city-name {
  font-weight: 600;
  color: #1f2d3d;
}

.city-meta {
  font-size: 12px;
  color: #909399;
  margin: 4px 0 8px;
}

.city-progress {
  height: 6px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}

.city-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #5c7cfa, #4dabf7);
}

.city-amount {
  min-width: 160px;
  text-align: right;
  font-weight: 600;
  color: #1f2d3d;
}

.city-share {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.panel-dimensions .dimension-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.dimension-card {
  border: 1px solid rgba(228, 231, 237, 0.8);
  border-radius: 12px;
  padding: 16px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #1f2d3d;
}

.panel-alerts .alert-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #303133;
}

.panel-alerts .alert-message {
  margin: 4px 0 0;
  color: #909399;
  font-size: 12px;
  line-height: 18px;
}

@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
  }

  .header-left {
    max-width: 100%;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
