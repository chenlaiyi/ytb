<template>
  <div class="starpay-dashboard">
    <div class="dashboard-header">
      <h1 class="dashboard-title">星驿付数据驾驶舱</h1>
      <div class="header-actions">
        <el-button type="primary" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="handleDateChange"
          style="margin-left: 12px;"
        />
      </div>
    </div>

    <!-- 数据概览卡片 -->
    <div class="overview-cards">
      <div class="overview-card upload-card">
        <div class="card-icon upload-icon">
          <el-icon size="32"><Upload /></el-icon>
        </div>
        <div class="card-content">
          <h3>数据上传</h3>
          <div class="stat-value">
            <span v-if="overview.uploads.total_uploads > 0">{{ overview.uploads.total_uploads }}</span>
            <span v-else class="empty-value">-</span>
          </div>
          <div class="stat-detail">
            <span class="success">成功: <span v-if="overview.uploads.success_uploads > 0">{{ overview.uploads.success_uploads }}</span><span v-else class="empty-value">0</span></span>
            <span class="failed">失败: <span v-if="overview.uploads.failed_uploads > 0">{{ overview.uploads.failed_uploads }}</span><span v-else class="empty-value">0</span></span>
          </div>
        </div>
      </div>

      <div class="overview-card merchant-card">
        <div class="card-icon merchant-icon">
          <el-icon size="32"><User /></el-icon>
        </div>
        <div class="card-content">
          <h3>商户数据</h3>
          <div class="stat-value">
            <span v-if="overview.merchants.total_count > 0">{{ formatNumber(overview.merchants.total_count) }}</span>
            <span v-else class="empty-value">-</span>
          </div>
          <div class="stat-detail">
            <span>交易额: <span v-if="overview.merchants.total_amount > 0">¥{{ formatNumber(overview.merchants.total_amount) }}</span><span v-else class="empty-value">¥0</span></span>
            <span>总笔数: <span v-if="overview.merchants.total_volume > 0">{{ formatNumber(overview.merchants.total_volume) }}</span><span v-else class="empty-value">0</span></span>
          </div>
        </div>
      </div>

      <div class="overview-card partner-card">
        <div class="card-icon partner-icon">
          <el-icon size="32"><OfficeBuilding /></el-icon>
        </div>
        <div class="card-content">
          <h3>服务商数据</h3>
          <div class="stat-value">
            <span v-if="overview.partners.total_count > 0">{{ formatNumber(overview.partners.total_count) }}</span>
            <span v-else class="empty-value">-</span>
          </div>
          <div class="stat-detail">
            <span>交易额: <span v-if="overview.partners.total_amount > 0">¥{{ formatNumber(overview.partners.total_amount) }}</span><span v-else class="empty-value">¥0</span></span>
            <span>总笔数: <span v-if="overview.partners.total_volume > 0">{{ formatNumber(overview.partners.total_volume) }}</span><span v-else class="empty-value">0</span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <!-- 上传统计图表 -->
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card">
            <template #header>
              <span>数据上传统计</span>
            </template>
            <div class="chart-content">
              <div class="upload-chart">
                <div class="chart-item">
                  <span class="chart-label">总上传数</span>
                  <div class="chart-bar">
                    <div 
                      class="chart-bar-fill" 
                      :style="{ width: uploadProgress.total + '%' }"
                    ></div>
                  </div>
                  <span class="chart-value">{{ overview.uploads.total_uploads || 0 }}</span>
                </div>
                <div class="chart-item">
                  <span class="chart-label">成功上传</span>
                  <div class="chart-bar">
                    <div 
                      class="chart-bar-fill success" 
                      :style="{ width: uploadProgress.success + '%' }"
                    ></div>
                  </div>
                  <span class="chart-value">{{ overview.uploads.success_uploads || 0 }}</span>
                </div>
                <div class="chart-item">
                  <span class="chart-label">失败上传</span>
                  <div class="chart-bar">
                    <div 
                      class="chart-bar-fill failed" 
                      :style="{ width: uploadProgress.failed + '%' }"
                    ></div>
                  </div>
                  <span class="chart-value">{{ overview.uploads.failed_uploads || 0 }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 商户统计图表 -->
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card">
            <template #header>
              <span>商户交易分析</span>
            </template>
            <div class="chart-content">
              <div class="merchant-chart">
                <div class="chart-stat">
                  <div class="stat-label">平均交易额</div>
                  <div class="stat-value-large">¥{{ formatNumber(overview.merchants.average_amount || 0) }}</div>
                </div>
                <div class="chart-stat">
                  <div class="stat-label">总交易笔数</div>
                  <div class="stat-value-large">{{ formatNumber(overview.merchants.total_volume || 0) }}</div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="trend-row">
        <el-col :span="24">
          <el-card class="chart-card trend-card" v-loading="loading">
            <template #header>
              <div class="trend-card-header">
                <div class="trend-title">
                  <span>交易走势</span>
                  <p class="trend-date">{{ trendDateSpan }}</p>
                </div>
                <div class="trend-range-toggle">
                  <el-radio-group
                    v-model="trendRange"
                    size="small"
                    @change="handleTrendRangeChange"
                  >
                    <el-radio-button
                      v-for="option in trendRangeOptions"
                      :key="option.value"
                      :label="option.value"
                    >
                      {{ option.label }}
                    </el-radio-button>
                  </el-radio-group>
                </div>
              </div>
            </template>
            <div class="trend-stats">
              <div class="trend-stat">
                <p class="label">累计交易额</p>
                <p class="value">¥{{ formatNumber(trendTotals.amount) }}</p>
              </div>
              <div class="trend-stat">
                <p class="label">累计笔数</p>
                <p class="value">{{ formatNumber(trendTotals.volume) }}</p>
              </div>
            </div>
            <div 
              v-if="hasTrendData"
              ref="trendChartRef"
              class="trend-chart"
            ></div>
            <el-empty v-else class="trend-empty" :image-size="120">
              <template #description>
                <div class="empty-description">
                  <p>暂无趋势数据</p>
                  <p class="empty-hint">请上传星驿付交易文件后查看趋势</p>
                </div>
              </template>
            </el-empty>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 最近上传记录 -->
    <div class="recent-uploads">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>最近上传记录</span>
            <el-button 
              link 
              type="primary" 
              @click="$router.push('/starpay/upload')"
            >
              查看全部
            </el-button>
          </div>
        </template>
        
        <div v-if="recentUploads.length > 0" class="uploads-list">
          <div 
            v-for="upload in recentUploads" 
            :key="upload.id" 
            class="upload-item"
            :class="upload.status"
          >
            <div class="upload-info">
              <div class="upload-title">{{ upload.original_filename }}</div>
              <div class="upload-meta">
                <span class="file-type">{{ upload.file_type === 'merchants' ? '商户数据' : '服务商数据' }}</span>
                <span class="upload-time">{{ formatDateTime(upload.created_at) }}</span>
              </div>
            </div>
            <div class="upload-status">
              <el-tag 
                :type="upload.status === 'success' ? 'success' : 'danger'"
                size="small"
              >
                {{ upload.status === 'success' ? '成功' : '失败' }}
              </el-tag>
              <div class="upload-count">
                记录数: {{ upload.record_count || 0 }}
              </div>
            </div>
          </div>
        </div>
        
        <el-empty v-else>
          <template #description>
            <div class="empty-description">
              <p>暂无上传记录</p>
              <p class="empty-hint">请先上传星驿付Excel文件开始使用</p>
              <el-button 
                type="primary" 
                @click="$router.push('/starpay/upload')"
                style="margin-top: 12px;"
              >
                立即上传
              </el-button>
            </div>
          </template>
        </el-empty>
      </el-card>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <el-card>
        <template #header>
          <span>快捷操作</span>
        </template>
        <div class="action-buttons">
          <el-button 
            type="primary" 
            @click="$router.push('/starpay/upload')"
            class="action-btn"
          >
            <el-icon><Upload /></el-icon>
            上传数据
          </el-button>
          <el-button 
            @click="$router.push('/starpay/merchants')"
            class="action-btn"
          >
            <el-icon><User /></el-icon>
            管理商户
          </el-button>
          <el-button 
            @click="$router.push('/starpay/partners')"
            class="action-btn"
          >
            <el-icon><OfficeBuilding /></el-icon>
            管理服务商
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Refresh, 
  Upload, 
  User, 
  OfficeBuilding 
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { fetchStarpayDashboard, fetchStarpayUploadRecords } from '@/api/v1/starpayUpload'

const loading = ref(false)
const dateRange = ref([])
const trendRange = ref('30d')
const trendRangeOptions = [
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' },
  { label: '近180天', value: '180d' }
]
const trendChartRef = ref(null)
let trendChartInstance = null

const overview = reactive({
  uploads: {
    total_uploads: 0,
    success_uploads: 0,
    failed_uploads: 0
  },
  merchants: {
    total_count: 0,
    total_amount: 0,
    total_volume: 0,
    average_amount: 0
  },
  partners: {
    total_count: 0,
    total_amount: 0,
    total_volume: 0
  }
})

const recentUploads = ref([])

const parseTrendRangeDays = (value) => {
  if (!value) return 30
  const match = String(value).match(/(\d+)/)
  return match ? Number(match[1]) : 30
}

const trendRangeDays = computed(() => parseTrendRangeDays(trendRange.value))

const createEmptyTrend = () => ({
  start_date: null,
  end_date: null,
  last_date: null,
  range_days: trendRangeDays.value,
  points: []
})

const merchantTrend = ref(createEmptyTrend())

const uploadProgress = computed(() => {
  const total = overview.uploads.total_uploads || 0
  if (total === 0) {
    return { total: 0, success: 0, failed: 0 }
  }
  return {
    total: 100,
    success: Math.round((overview.uploads.success_uploads / total) * 100),
    failed: Math.round((overview.uploads.failed_uploads / total) * 100)
  }
})

const trendTotals = computed(() => {
  const points = merchantTrend.value?.points || []
  return points.reduce(
    (acc, point) => {
      acc.amount += Number(point.total_amount || 0)
      acc.volume += Number(point.total_volume || 0)
      return acc
    },
    { amount: 0, volume: 0 }
  )
})

const hasTrendData = computed(() => (merchantTrend.value?.points || []).length > 0)

const trendDateSpan = computed(() => {
  const trend = merchantTrend.value || {}
  if (trend.start_date && trend.end_date) {
    return `${trend.start_date} ~ ${trend.end_date}`
  }
  if (trend.last_date) {
    return `最近交易日：${trend.last_date}`
  }
  return '暂无日期范围'
})

const formatNumber = (value) => {
  if (!value || Number.isNaN(+value)) return '0'
  return Number(value).toLocaleString('zh-CN')
}

const formatCompactCurrency = (value) => {
  const number = Number(value) || 0
  if (Math.abs(number) >= 100000000) {
    return `${(number / 100000000).toFixed(1).replace(/\.0$/, '')}亿`
  }
  if (Math.abs(number) >= 10000) {
    return `${(number / 10000).toFixed(1).replace(/\.0$/, '')}万`
  }
  return formatNumber(number)
}

const formatDateTime = (datetime) => {
  if (!datetime) return ''
  return new Date(datetime).toLocaleString('zh-CN')
}

const normalizeTrendPayload = (payload) => {
  if (!payload) {
    return createEmptyTrend()
  }
  return {
    start_date: payload.start_date || null,
    end_date: payload.end_date || null,
    last_date: payload.last_date || null,
    range_days: payload.range_days || trendRangeDays.value,
    points: Array.isArray(payload.points) ? payload.points : []
  }
}

const destroyTrendChart = () => {
  if (trendChartInstance) {
    trendChartInstance.dispose()
    trendChartInstance = null
  }
}

const renderTrendChart = () => {
  const points = merchantTrend.value?.points || []
  if (!points.length) {
    destroyTrendChart()
    return
  }
  const sourcePoints = [...points]
  nextTick(() => {
    const container = trendChartRef.value
    if (!container) return
    if (!trendChartInstance) {
      trendChartInstance = echarts.init(container)
    }
    const dates = sourcePoints.map(point => point.date)
    const amounts = sourcePoints.map(point => Number(point.total_amount || 0))
    trendChartInstance.setOption({
      grid: { top: 48, left: 48, right: 24, bottom: 32 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { lineStyle: { color: '#5c7cfa' } },
        backgroundColor: '#1f2d3d',
        borderWidth: 0,
        textStyle: { color: '#fff' },
        formatter(params = []) {
          if (!params.length) return ''
          const item = params[0]
          const rawPoint = sourcePoints[item.dataIndex] || {}
          return [
            item.axisValue,
            `交易额：¥${formatNumber(item.data || 0)}`,
            `交易笔数：${formatNumber(rawPoint.total_volume || 0)}`
          ].join('<br/>')
        }
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: { lineStyle: { color: '#dcdfe6' } },
        axisTick: { show: false },
        axisLabel: { color: '#909399' }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#ebeef5' } },
        axisLabel: {
          color: '#909399',
          formatter: (value) => formatCompactCurrency(value)
        }
      },
      series: [
        {
          name: '交易额',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: amounts,
          lineStyle: { width: 3, color: '#5c7cfa' },
          areaStyle: {
            opacity: 0.2,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(92, 124, 250, 0.6)' },
              { offset: 1, color: 'rgba(92, 124, 250, 0.05)' }
            ])
          }
        }
      ]
    })
  })
}

const handleResize = () => {
  if (trendChartInstance) {
    trendChartInstance.resize()
  }
}

const loadDashboardData = async () => {
  loading.value = true
  const requestedTrendRange = trendRange.value
  try {
    const params = {
      trend_days: trendRangeDays.value,
      trend_range: trendRange.value
    }
    if (dateRange.value.length === 2) {
      params.date_start = dateRange.value[0]
      params.date_end = dateRange.value[1]
    }
    
    // 并行加载概览数据和最近上传记录
    const [overviewResponse, uploadResponse] = await Promise.all([
      fetchStarpayDashboard(params),
      fetchStarpayUploadRecords({ per_page: 5 })
    ])
    
    if (overviewResponse?.code === 0) {
      const data = overviewResponse.data || {}
      Object.assign(overview.uploads, data.uploads || {
        total_uploads: 0,
        success_uploads: 0,
        failed_uploads: 0
      })
      Object.assign(overview.merchants, data.merchants || {
        total_count: 0,
        total_amount: 0,
        total_volume: 0,
        average_amount: 0
      })
      Object.assign(overview.partners, data.partners || {
        total_count: 0,
        total_amount: 0,
        total_volume: 0
      })

      if (requestedTrendRange === trendRange.value) {
        merchantTrend.value = normalizeTrendPayload(data.merchant_trend)
        renderTrendChart()
      }
    } else if (overviewResponse?.code !== undefined) {
      // API调用成功但返回错误码，记录日志但不显示错误
      console.warn('星驿付摘要API返回错误:', overviewResponse.message)
    }
    
    if (uploadResponse?.code === 0) {
      recentUploads.value = (uploadResponse.data?.data || []).slice(0, 5)
    } else if (uploadResponse?.code !== undefined) {
      // API调用成功但返回错误码，记录日志但不显示错误
      console.warn('星驿付上传记录API返回错误:', uploadResponse.message)
    }
  } catch (error) {
    console.error('获取驾驶舱数据失败:', error)
    // 只有在真正的网络错误或异常时才显示错误信息
    if (error.message && !error.message.includes('Network Error')) {
      ElMessage.error('获取数据失败: ' + error.message)
    } else {
      ElMessage.warning('网络连接失败，请检查网络后重试')
    }
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadDashboardData()
}

const handleDateChange = (value) => {
  dateRange.value = value || []
  loadDashboardData()
}

const handleTrendRangeChange = () => {
  loadDashboardData()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  loadDashboardData()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  destroyTrendChart()
})
</script>

<style scoped>
.starpay-dashboard {
  padding: 24px;
  background: #f4f6fb;
  min-height: 100%;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.dashboard-title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  align-items: center;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.overview-card {
  border: none;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
}

.upload-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.merchant-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.partner-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.card-content h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #606266;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.stat-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.stat-detail .success {
  color: #67c23a;
}

.stat-detail .failed {
  color: #f56c6c;
}

.charts-section {
  margin-bottom: 24px;
}

.chart-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.chart-content {
  padding: 16px 0;
}

.upload-chart {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chart-label {
  min-width: 80px;
  font-size: 14px;
  color: #606266;
}

.chart-bar {
  flex: 1;
  height: 20px;
  background: #f5f5f5;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.chart-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #66b1ff);
  border-radius: 10px;
  transition: width 0.6s ease;
}

.chart-bar-fill.success {
  background: linear-gradient(90deg, #67c23a, #85ce61);
}

.chart-bar-fill.failed {
  background: linear-gradient(90deg, #f56c6c, #f78989);
}

.chart-value {
  min-width: 60px;
  text-align: right;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.trend-row {
  margin-top: 20px;
}

.trend-card {
  min-height: 420px;
}

.trend-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.trend-title span {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.trend-date {
  margin: 4px 0 0;
  font-size: 12px;
  color: #909399;
}

.trend-range-toggle {
  flex-shrink: 0;
}

.trend-range-toggle :deep(.el-radio-group) {
  display: flex;
  gap: 8px;
}

.trend-range-toggle :deep(.el-radio-button) {
  flex: 1;
}

.trend-range-toggle :deep(.el-radio-button__inner) {
  padding: 6px 14px;
}

.trend-stats {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.trend-stat .label {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.trend-stat .value {
  margin: 2px 0 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.trend-chart {
  width: 100%;
  height: 320px;
}

.trend-empty {
  padding: 40px 0;
}

.merchant-chart {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.chart-stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.stat-value-large {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.recent-uploads {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.uploads-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
  transition: background-color 0.2s ease;
}

.upload-item:hover {
  background: #f0f9ff;
}

.upload-item.success {
  border-color: #e1f3d8;
  background: #f0f9ff;
}

.upload-item.failed {
  border-color: #fde2e2;
  background: #fef0f0;
}

.upload-info {
  flex: 1;
}

.upload-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.upload-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.upload-status {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.upload-count {
  font-size: 12px;
  color: #909399;
}

.empty-description {
  text-align: center;
  padding: 20px 0;
}

.empty-description p {
  margin: 8px 0;
  color: #606266;
}

.empty-hint {
  color: #909399;
  font-size: 14px;
}

.empty-value {
  color: #c0c4cc;
  font-weight: normal;
}

.quick-actions {
  margin-bottom: 24px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
}

@media (max-width: 768px) {
  .starpay-dashboard {
    padding: 16px;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .overview-cards {
    grid-template-columns: 1fr;
  }
  
  .overview-card {
    padding: 20px;
  }
  
  .card-icon {
    width: 50px;
    height: 50px;
    margin-right: 16px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
    justify-content: center;
  }

  .trend-card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .trend-range-toggle {
    width: 100%;
  }

  .trend-range-toggle :deep(.el-radio-group) {
    width: 100%;
  }
}
</style>
