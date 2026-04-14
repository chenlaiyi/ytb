<template>
  <div class="branch-statistics-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">业务统计</h1>
        <p class="page-description">分支机构业务数据统计与分析</p>
      </div>
      <div class="header-actions">
        <el-button @click="refreshData" :icon="Refresh">
          刷新
        </el-button>
        <el-button type="primary" @click="exportReport" :icon="Download">
          导出报表
        </el-button>
      </div>
    </div>

    <!-- 时间选择器 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" inline>
        <el-form-item label="统计周期:">
          <el-select v-model="filterForm.period" @change="handlePeriodChange" style="width: 120px">
            <el-option label="今日" value="today" />
            <el-option label="本周" value="week" />
            <el-option label="本月" value="month" />
            <el-option label="本年" value="year" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="filterForm.period === 'custom'" label="时间范围:">
          <el-date-picker
            v-model="filterForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
            @change="loadStatistics"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadStatistics" :icon="Search">
            查询
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 核心指标卡片 -->
    <div class="metrics-cards">
      <div class="metric-card">
        <div class="metric-icon">
          <el-icon color="#409eff"><User /></el-icon>
        </div>
        <div class="metric-content">
          <div class="metric-number">{{ statistics.total_users || 0 }}</div>
          <div class="metric-label">总用户数</div>
          <div class="metric-change" :class="{ positive: statistics.user_growth > 0 }">
            <el-icon><TrendCharts /></el-icon>
            {{ statistics.user_growth > 0 ? '+' : '' }}{{ statistics.user_growth || 0 }}%
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">
          <el-icon color="#f56c6c"><Trophy /></el-icon>
        </div>
        <div class="metric-content">
          <div class="metric-number">{{ statistics.vip_users || 0 }}</div>
          <div class="metric-label">VIP用户</div>
          <div class="metric-change" :class="{ positive: statistics.vip_growth > 0 }">
            <el-icon><TrendCharts /></el-icon>
            {{ statistics.vip_growth > 0 ? '+' : '' }}{{ statistics.vip_growth || 0 }}%
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">
          <el-icon color="#67c23a"><Monitor /></el-icon>
        </div>
        <div class="metric-content">
          <div class="metric-number">{{ statistics.active_devices || 0 }}</div>
          <div class="metric-label">活跃设备</div>
          <div class="metric-change" :class="{ positive: statistics.device_growth > 0 }">
            <el-icon><TrendCharts /></el-icon>
            {{ statistics.device_growth > 0 ? '+' : '' }}{{ statistics.device_growth || 0 }}%
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">
          <el-icon color="#e6a23c"><Wallet /></el-icon>
        </div>
        <div class="metric-content">
          <div class="metric-number">¥{{ formatCurrency(statistics.total_revenue) }}</div>
          <div class="metric-label">总收入</div>
          <div class="metric-change" :class="{ positive: statistics.revenue_growth > 0 }">
            <el-icon><TrendCharts /></el-icon>
            {{ statistics.revenue_growth > 0 ? '+' : '' }}{{ statistics.revenue_growth || 0 }}%
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <!-- 用户增长趋势 -->
        <el-col :span="12">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="chart-header">
                <h3>用户增长趋势</h3>
                <el-button size="small" text @click="refreshUserChart">
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </template>
            <div ref="userTrendChart" class="chart-container"></div>
          </el-card>
        </el-col>

        <!-- 设备状态分布 -->
        <el-col :span="12">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="chart-header">
                <h3>设备状态分布</h3>
                <el-button size="small" text @click="refreshDeviceChart">
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </template>
            <div ref="deviceStatusChart" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px;">
        <!-- 收入趋势 -->
        <el-col :span="24">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="chart-header">
                <h3>收入趋势</h3>
                <div class="chart-controls">
                  <el-radio-group v-model="revenueChartType" size="small" @change="refreshRevenueChart">
                    <el-radio-button label="daily">日收入</el-radio-button>
                    <el-radio-button label="monthly">月收入</el-radio-button>
                  </el-radio-group>
                </div>
              </div>
            </template>
            <div ref="revenueTrendChart" class="chart-container large"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 详细数据表格 -->
    <div class="data-tables">
      <el-row :gutter="20">
        <!-- VIP用户排行 -->
        <el-col :span="12">
          <el-card class="table-card" shadow="never">
            <template #header>
              <h3>VIP用户排行</h3>
            </template>
            <el-table :data="vipRanking" size="small" max-height="300">
              <el-table-column type="index" label="排名" width="60" />
              <el-table-column label="用户" min-width="120">
                <template #default="{ row }">
                  <div class="user-info">
                    <div class="user-name">{{ row.nickname || '未设置' }}</div>
                    <div class="user-phone">{{ row.phone }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="分红金额" width="100">
                <template #default="{ row }">
                  <span class="amount">¥{{ (row.dividend_amount || 0).toFixed(2) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <!-- 设备收入排行 -->
        <el-col :span="12">
          <el-card class="table-card" shadow="never">
            <template #header>
              <h3>设备收入排行</h3>
            </template>
            <el-table :data="deviceRanking" size="small" max-height="300">
              <el-table-column type="index" label="排名" width="60" />
              <el-table-column prop="device_code" label="设备编号" width="120" />
              <el-table-column label="收入金额" width="100">
                <template #default="{ row }">
                  <span class="amount">¥{{ (row.income_amount || 0).toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="使用次数" width="80">
                <template #default="{ row }">
                  <el-tag size="small">{{ row.usage_count || 0 }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Search, 
  Refresh, 
  Download, 
  User, 
  Trophy, 
  Monitor, 
  Wallet,
  TrendCharts
} from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import { getBranchStatistics } from '@/api/v1/branchManagement'
import * as echarts from 'echarts'

const route = useRoute()
const branchId = computed(() => route.params.branchId)

// 响应式数据
const loading = ref(false)
const statistics = ref({})
const vipRanking = ref([])
const deviceRanking = ref([])
const revenueChartType = ref('daily')

// 图表实例
const userTrendChart = ref(null)
const deviceStatusChart = ref(null)
const revenueTrendChart = ref(null)
let userChartInstance = null
let deviceChartInstance = null
let revenueChartInstance = null

// 搜索表单
const filterForm = reactive({
  period: 'month',
  date_range: null
})

// 加载统计数据
const loadStatistics = async () => {
  try {
    loading.value = true
    
    const params = {
      period: filterForm.period
    }
    
    // 处理自定义时间范围
    if (filterForm.period === 'custom' && filterForm.date_range && filterForm.date_range.length === 2) {
      params.start_date = filterForm.date_range[0]
      params.end_date = filterForm.date_range[1]
    }
    
    const response = await getBranchStatistics(branchId.value, params)
    
    if (response.code === 200) {
      statistics.value = response.data.statistics || {}
      vipRanking.value = response.data.vip_ranking || []
      deviceRanking.value = response.data.device_ranking || []
      
      // 刷新图表
      nextTick(() => {
        initCharts()
      })
    } else {
      ElMessage.error(response.message || '获取统计数据失败')
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

// 处理周期变化
const handlePeriodChange = (period) => {
  if (period !== 'custom') {
    filterForm.date_range = null
    loadStatistics()
  }
}

// 初始化图表
const initCharts = () => {
  initUserTrendChart()
  initDeviceStatusChart()
  initRevenueTrendChart()
}

// 初始化用户增长趋势图
const initUserTrendChart = () => {
  if (userChartInstance) {
    userChartInstance.dispose()
  }
  
  userChartInstance = echarts.init(userTrendChart.value)
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: statistics.value.user_trend?.dates || []
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: '新增用户',
      type: 'line',
      data: statistics.value.user_trend?.values || [],
      smooth: true,
      itemStyle: {
        color: '#409eff'
      }
    }]
  }
  
  userChartInstance.setOption(option)
}

// 初始化设备状态分布图
const initDeviceStatusChart = () => {
  if (deviceChartInstance) {
    deviceChartInstance.dispose()
  }
  
  deviceChartInstance = echarts.init(deviceStatusChart.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [{
      name: '设备状态',
      type: 'pie',
      radius: '50%',
      data: [
        { value: statistics.value.device_status?.online || 0, name: '在线' },
        { value: statistics.value.device_status?.offline || 0, name: '离线' },
        { value: statistics.value.device_status?.error || 0, name: '故障' },
        { value: statistics.value.device_status?.maintenance || 0, name: '维护中' }
      ],
      itemStyle: {
        color: function(params) {
          const colors = ['#67c23a', '#909399', '#f56c6c', '#e6a23c']
          return colors[params.dataIndex]
        }
      }
    }]
  }
  
  deviceChartInstance.setOption(option)
}

// 初始化收入趋势图
const initRevenueTrendChart = () => {
  if (revenueChartInstance) {
    revenueChartInstance.dispose()
  }
  
  revenueChartInstance = echarts.init(revenueTrendChart.value)
  
  const trendData = revenueChartType.value === 'daily' 
    ? statistics.value.revenue_trend_daily 
    : statistics.value.revenue_trend_monthly
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        return `${params[0].axisValue}<br/>收入: ¥${params[0].value}`
      }
    },
    xAxis: {
      type: 'category',
      data: trendData?.dates || []
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [{
      name: '收入',
      type: 'bar',
      data: trendData?.values || [],
      itemStyle: {
        color: '#e6a23c'
      }
    }]
  }
  
  revenueChartInstance.setOption(option)
}

// 刷新图表
const refreshUserChart = () => {
  initUserTrendChart()
}

const refreshDeviceChart = () => {
  initDeviceStatusChart()
}

const refreshRevenueChart = () => {
  initRevenueTrendChart()
}

// 刷新数据
const refreshData = () => {
  loadStatistics()
}

// 导出报表
const exportReport = () => {
  ElMessage.info('导出功能开发中...')
}

// 格式化货币
const formatCurrency = (amount) => {
  if (!amount) return '0'
  return Number(amount).toLocaleString()
}

// 窗口大小变化时重新调整图表
const handleResize = () => {
  if (userChartInstance) userChartInstance.resize()
  if (deviceChartInstance) deviceChartInstance.resize()
  if (revenueChartInstance) revenueChartInstance.resize()
}

// 初始化
onMounted(() => {
  loadStatistics()
  window.addEventListener('resize', handleResize)
})

// 清理
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (userChartInstance) userChartInstance.dispose()
  if (deviceChartInstance) deviceChartInstance.dispose()
  if (revenueChartInstance) revenueChartInstance.dispose()
})
</script>

<style scoped>
.branch-statistics-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #303133;
}

.page-description {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-card {
  margin-bottom: 20px;
}

.metrics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.metric-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  background: #f5f7fa;
}

.metric-content {
  flex: 1;
}

.metric-number {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-change {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #f56c6c;
}

.metric-change.positive {
  color: #67c23a;
}

.metric-change .el-icon {
  margin-right: 4px;
}

.charts-section {
  margin-bottom: 30px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.chart-container.large {
  height: 400px;
}

.data-tables {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.table-card .el-card__header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.user-phone {
  font-size: 12px;
  color: #909399;
}

.amount {
  font-weight: 600;
  color: #67c23a;
}
</style> 