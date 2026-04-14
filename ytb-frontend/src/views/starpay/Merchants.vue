<template>
  <div class="starpay-merchant-page">
    <div class="content-container">
      <el-card shadow="hover" class="overview-card">
        <template #header>
          <div class="card-header card-header--with-subtitle">
            <div class="card-title-group">
              <span>商户概览</span>
              <span v-if="summaryRange.start && summaryRange.end" class="card-subtitle">
                统计区间：{{ summaryRange.start }} ~ {{ summaryRange.end }}
              </span>
            </div>
            <el-button link type="primary" @click="loadSummary" :loading="loading.summary">
              刷新
            </el-button>
          </div>
        </template>
        <div class="summary-grid">
          <div
            v-for="item in summaryCards"
            :key="item.title"
            class="stat-card"
          >
            <div class="stat-title">{{ item.title }}</div>
            <div class="stat-value">{{ item.value }}</div>
            <div class="stat-extra">{{ item.extra }}</div>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="trend-card">
        <template #header>
          <div class="card-header trend-header">
            <div class="trend-title">
              <span>近30天交易趋势</span>
              <span class="trend-subtitle">截至 {{ trendMeta.lastDate || '—' }}</span>
            </div>
            <div class="trend-meta" v-if="trendMeta.start && trendMeta.end">
              统计区间：{{ trendMeta.start }} ~ {{ trendMeta.end }}
            </div>
          </div>
        </template>
        <div class="trend-chart-wrapper">
          <div v-show="trendSeries.length" ref="trendChartRef" class="trend-chart"></div>
          <el-skeleton v-if="loading.summary" :rows="4" animated class="trend-skeleton" />
          <el-empty v-else-if="!trendSeries.length" description="暂无交易数据" />
        </div>
      </el-card>

      <el-card shadow="hover" class="filter-card">
        <template #header>
          <div class="card-header">
            <span>筛选条件</span>
            <div class="card-actions">
              <el-button @click="resetFilters">重置</el-button>
              <el-button type="primary" @click="handleFilter" :loading="loading.table">查询</el-button>
            </div>
          </div>
        </template>
        <el-form :model="filters" label-width="96px" label-position="left" class="filter-form">
          <el-row :gutter="16">
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="关键字">
                <el-input v-model.trim="filters.keyword" placeholder="商户名 / 编号" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="4">
              <el-form-item label="服务商">
                <el-input v-model.trim="filters.serviceProvider" placeholder="所属服务商" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="4">
              <el-form-item label="交易方式">
                <el-select v-model="filters.transactionMethod" placeholder="全部" clearable>
                  <el-option
                    v-for="method in transactionMethods"
                    :key="method"
                    :label="method"
                    :value="method"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="4">
              <el-form-item label="日期">
                <el-date-picker
                  v-model="filters.dateRange"
                  type="daterange"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <el-card shadow="hover" class="table-card">
        <template #header>
          <div class="card-header">
            <span>商户列表</span>
            <div class="card-actions">
              <el-button type="primary" @click="handleExport" :loading="loading.export">
                导出
              </el-button>
              <el-button @click="loadMerchants" :loading="loading.table">
                刷新
              </el-button>
            </div>
          </div>
        </template>
        <el-table
          v-loading="loading.table"
          :data="merchants"
          border
          size="small"
          @sort-change="handleSortChange"
        >
          <el-table-column prop="merchant_no" label="商户编号" width="140" />
          <el-table-column prop="merchant_name" label="商户名称" min-width="200" show-overflow-tooltip />
          <el-table-column prop="service_provider" label="所属服务商" width="160" show-overflow-tooltip />
          <el-table-column prop="transaction_count" label="交易笔数" width="120" sortable="custom">
            <template #default="scope">
              {{ formatInteger(scope.row.transaction_count) }}
            </template>
          </el-table-column>
          <el-table-column prop="total_amount" label="交易总额" width="160" sortable="custom">
            <template #default="scope">
              ¥{{ formatAmount(scope.row.total_amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="total_fee" label="累计手续费" width="140" sortable="custom">
            <template #default="scope">
              ¥{{ formatAmount(scope.row.total_fee) }}
            </template>
          </el-table-column>
          <el-table-column prop="avg_amount" label="单笔均值" width="140" sortable="custom">
            <template #default="scope">
              ¥{{ formatAmount(scope.row.avg_amount) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button type="primary" link @click="viewDetail(scope.row)">
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-bar">
          <el-pagination
            v-model:current-page="pagination.current"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            layout="prev, pager, next, ->, total"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 商户详情对话框 -->
    <el-dialog
      v-model="detailDialog.visible"
      title="商户详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="detailDialog.data" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="商户编号">{{ detailDialog.data.merchant_no }}</el-descriptions-item>
          <el-descriptions-item label="商户名称">{{ detailDialog.data.merchant_name }}</el-descriptions-item>
          <el-descriptions-item label="所属服务商">{{ detailDialog.data.service_provider }}</el-descriptions-item>
          <el-descriptions-item label="累计交易笔数">{{ formatInteger(detailDialog.data.transaction_count) }}</el-descriptions-item>
          <el-descriptions-item label="交易总额">¥{{ formatAmount(detailDialog.data.total_amount) }}</el-descriptions-item>
          <el-descriptions-item label="累计手续费">¥{{ formatAmount(detailDialog.data.total_fee) }}</el-descriptions-item>
          <el-descriptions-item label="平均单笔">¥{{ formatAmount(detailDialog.data.avg_amount) }}</el-descriptions-item>
          <el-descriptions-item label="服务商编号">{{ detailDialog.data.service_provider_no || '--' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { 
  fetchStarpayMerchants, 
  exportStarpayMerchants,
  fetchStarpayStats 
} from '@/api/v1/starpayUpload'

const loading = reactive({
  table: false,
  summary: false,
  export: false
})

const filters = reactive({
  keyword: '',
  serviceProvider: '',
  transactionMethod: '',
  dateRange: []
})

const merchants = ref([])
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0
})

const sortConfig = reactive({
  prop: '',
  order: ''
})

const detailDialog = reactive({
  visible: false,
  data: null
})

const summaryRange = reactive({
  start: '',
  end: ''
})

const summaryCards = ref([
  { title: '商户数量', value: '0', extra: '去重统计' },
  { title: '交易总额', value: '¥0.00', extra: '实际金额合计' },
  { title: '交易笔数', value: '0', extra: '交易次数' },
  { title: '人均交易额', value: '¥0.00', extra: '总额 ÷ 商户数' }
])

const transactionMethods = ['微信', '支付宝', '银行卡', '云闪付', '银联', 'POS机'].sort()

const trendSeries = ref([])
const trendMeta = reactive({
  start: '',
  end: '',
  lastDate: ''
})
const trendChartRef = ref(null)
let trendChartInstance = null

const trendChartData = computed(() => ({
  dates: trendSeries.value.map(item => item.date),
  amount: trendSeries.value.map(item => Number(item.total_amount || 0)),
  volume: trendSeries.value.map(item => Number(item.total_volume || 0)),
  fee: trendSeries.value.map(item => Number(item.total_fee || 0))
}))

const formatDateTime = value => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--'
const formatInteger = value => Number(value || 0).toLocaleString('zh-CN')

const formatAmount = amount => {
  return Number(amount || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const getTrendChartOption = () => {
  const data = trendChartData.value
  const amountColor = '#5B8FF9'
  const volumeColor = '#34D399'
  const feeColor = '#F97316'

  return {
    tooltip: {
      trigger: 'axis',
      formatter: params => {
        if (!params?.length) {
          return ''
        }
        const [first] = params
        const lines = [first.axisValue]
        params.forEach(item => {
          const value =
            item.seriesName === '交易笔数'
              ? `${item.value} 笔`
              : `¥${formatAmount(item.value)}`
          lines.push(`${item.marker}${item.seriesName}：${value}`)
        })
        return lines.join('<br/>')
      }
    },
    legend: {
      data: ['交易金额', '交易笔数', '手续费'],
      icon: 'circle'
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '6%',
      top: '18%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.dates
    },
    yAxis: [
      {
        type: 'value',
        name: '交易金额 (元)',
        axisLabel: {
          formatter: value => `¥${Number(value || 0).toLocaleString('zh-CN')}`
        }
      },
      {
        type: 'value',
        name: '交易笔数',
        minInterval: 1
      }
    ],
    series: [
      {
        name: '交易金额',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 3, color: amountColor },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(91, 143, 249, 0.25)' },
            { offset: 1, color: 'rgba(91, 143, 249, 0)' }
          ])
        },
        data: data.amount
      },
      {
        name: '交易笔数',
        type: 'line',
        smooth: true,
        showSymbol: false,
        yAxisIndex: 1,
        lineStyle: { width: 3, color: volumeColor },
        data: data.volume
      },
      {
        name: '手续费',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, type: 'dashed', color: feeColor },
        data: data.fee
      }
    ]
  }
}

const updateTrendChart = () => {
  nextTick(() => {
    if (!trendChartRef.value) {
      return
    }

    if (!trendSeries.value.length) {
      trendChartInstance?.clear()
      return
    }

    if (!trendChartInstance) {
      trendChartInstance = echarts.init(trendChartRef.value)
    }

    trendChartInstance.setOption(getTrendChartOption(), true)
    trendChartInstance.resize()
  })
}

const handleTrendResize = () => {
  if (trendChartInstance) {
    trendChartInstance.resize()
  }
}

const destroyTrendChart = () => {
  if (trendChartInstance) {
    trendChartInstance.dispose()
    trendChartInstance = null
  }
}

const setTrendMeta = trend => {
  trendMeta.start = trend?.start_date || ''
  trendMeta.end = trend?.end_date || ''
  trendMeta.lastDate = trend?.last_date || ''
}

watch(
  trendSeries,
  () => {
    updateTrendChart()
  },
  { deep: true }
)

const loadSummary = async () => {
  loading.summary = true
  try {
    const response = await fetchStarpayStats()
    if (response?.code === 0 && response.data) {
      const stats = response.data?.merchants || {}
      const merchantCount = Number(stats.merchant_count || stats.total_count || 0)
      const totalAmount = Number(stats.total_amount || 0)
      const totalTransactions = Number(stats.total_volume || stats.total_count || 0)
      const avgPerMerchant = merchantCount > 0 ? totalAmount / merchantCount : 0
      summaryCards.value = [
        { title: '商户数量', value: formatInteger(merchantCount), extra: '去重统计' },
        { title: '交易总额', value: `¥${formatAmount(totalAmount)}`, extra: '实际金额合计' },
        { title: '交易笔数', value: formatInteger(totalTransactions), extra: '交易次数' },
        { title: '人均交易额', value: `¥${formatAmount(avgPerMerchant)}`, extra: '总额 ÷ 商户数' }
      ]
      const trend = response.data?.merchant_trend
      trendSeries.value = Array.isArray(trend?.points) ? trend.points : []
      setTrendMeta(trend)
      if (trend?.start_date && trend?.end_date) {
        summaryRange.start = trend.start_date
        summaryRange.end = trend.end_date
      } else {
        summaryRange.start = ''
        summaryRange.end = ''
      }
    }
  } catch (error) {
    ElMessage.error('获取概览数据失败')
  } finally {
    loading.summary = false
  }
}

const loadMerchants = async () => {
  loading.table = true
  try {
    const params = {
      page: pagination.current,
      per_page: pagination.pageSize,
      keyword: filters.keyword || undefined,
      service_provider: filters.serviceProvider || undefined,
      transaction_method: filters.transactionMethod || undefined,
      date_start: filters.dateRange?.[0] || undefined,
      date_end: filters.dateRange?.[1] || undefined,
      sort: sortConfig.prop,
      order: sortConfig.order
    }
    const response = await fetchStarpayMerchants(params)
    if (response?.code === 0 && response.data) {
      merchants.value = response.data.data || []
      pagination.total = response.data.total || 0
    }
  } catch (error) {
    ElMessage.error('获取商户列表失败')
  } finally {
    loading.table = false
  }
}

const handleFilter = () => {
  pagination.current = 1
  loadMerchants()
}

const resetFilters = () => {
  Object.assign(filters, {
    keyword: '',
    serviceProvider: '',
    transactionMethod: '',
    dateRange: []
  })
  pagination.current = 1
  loadMerchants()
}

const handlePageChange = page => {
  pagination.current = page
  loadMerchants()
}

const handleSortChange = ({ prop, order }) => {
  sortConfig.prop = prop
  sortConfig.order = order
  pagination.current = 1
  loadMerchants()
}

const handleExport = async () => {
  loading.export = true
  try {
    const params = {
      keyword: filters.keyword || undefined,
      service_provider: filters.serviceProvider || undefined,
      transaction_method: filters.transactionMethod || undefined,
      date_start: filters.dateRange?.[0] || undefined,
      date_end: filters.dateRange?.[1] || undefined
    }
    const response = await exportStarpayMerchants(params)
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `星驿付商户数据_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    loading.export = false
  }
}

const viewDetail = row => {
  detailDialog.data = row
  detailDialog.visible = true
}

onMounted(() => {
  loadSummary()
  loadMerchants()
  window.addEventListener('resize', handleTrendResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleTrendResize)
  destroyTrendChart()
})
</script>

<style scoped>
.starpay-merchant-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100%;
}

.content-container {
  max-width: 1400px;
  margin: 0 auto;
}

.overview-card {
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.trend-card {
  margin-bottom: 20px;
}

.trend-chart-wrapper {
  position: relative;
  min-height: 320px;
}

.trend-chart {
  width: 100%;
  height: 320px;
}

.trend-skeleton {
  padding: 20px 0;
}

.trend-header {
  flex-wrap: wrap;
  gap: 8px;
}

.trend-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.trend-subtitle {
  font-size: 12px;
  color: #909399;
  font-weight: 400;
}

.trend-meta {
  font-size: 13px;
  color: #606266;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  border: 1px solid #e9ecef;
}

.stat-title {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 4px;
}

.stat-extra {
  font-size: 12px;
  color: #adb5bd;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 600;
}

.card-header--with-subtitle {
  flex-wrap: wrap;
  gap: 8px;
}

.card-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-subtitle {
  font-size: 12px;
  font-weight: 400;
  color: #909399;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-form {
  margin-top: 10px;
}

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.detail-content {
  max-height: 60vh;
  overflow-y: auto;
}
</style>
