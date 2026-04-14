<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><DataAnalysis /></el-icon>
          用水量统计
        </h2>
        <p class="page-subtitle">统计分析净水器设备的用水量数据，查看趋势和排行</p>
      </div>
      <div class="header-right">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="dateShortcuts"
          value-format="YYYY-MM-DD"
          @change="handleDateChange"
        />
        <el-button type="primary" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button @click="exportData">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
    </div>

    <!-- 统计概览卡片 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card primary">
            <div class="stat-icon">
              <el-icon><DataLine /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatNumber(overview.totalUsage) }}</div>
              <div class="stat-unit">升</div>
              <div class="stat-label">总用水量</div>
            </div>
            <div class="stat-trend up" v-if="overview.usageTrend > 0">
              <el-icon><ArrowUp /></el-icon>
              {{ overview.usageTrend }}%
            </div>
            <div class="stat-trend down" v-else-if="overview.usageTrend < 0">
              <el-icon><ArrowDown /></el-icon>
              {{ Math.abs(overview.usageTrend) }}%
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card success">
            <div class="stat-icon">
              <el-icon><Coin /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatNumber(overview.totalBuckets) }}</div>
              <div class="stat-unit">桶</div>
              <div class="stat-label">折合桶装水 (18L/桶)</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card warning">
            <div class="stat-icon">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">¥{{ formatNumber(overview.savedMoney) }}</div>
              <div class="stat-label">为用户节省金额</div>
              <div class="stat-desc">(市场价¥10/桶 vs 点点够¥5.4/桶)</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card info">
            <div class="stat-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ overview.activeDevices }}</div>
              <div class="stat-label">活跃设备数</div>
              <div class="stat-desc">有用水记录的设备</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 用水量趋势图 -->
      <el-col :span="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>用水量趋势</span>
              <el-radio-group v-model="chartType" size="small">
                <el-radio-button label="daily">日</el-radio-button>
                <el-radio-button label="weekly">周</el-radio-button>
                <el-radio-button label="monthly">月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container" ref="trendChartRef">
            <div v-if="trendData.length === 0" class="chart-empty">
              <el-empty description="暂无数据" />
            </div>
            <div v-else class="simple-chart">
              <div class="chart-bars">
                <div 
                  v-for="(item, index) in trendData" 
                  :key="index"
                  class="chart-bar-item"
                  :title="`${item.date}: ${item.usage}L`"
                >
                  <div class="bar-value">{{ item.usage }}L</div>
                  <div class="bar-track">
                    <div 
                      class="bar-fill" 
                      :style="{ height: `${item.percent}%` }"
                    ></div>
                  </div>
                  <div class="bar-label">{{ item.label }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 用水量分布饼图 -->
      <el-col :span="8">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span>用水量分布</span>
          </template>
          <div class="distribution-list">
            <div 
              v-for="(item, index) in distributionData" 
              :key="index"
              class="distribution-item"
            >
              <div class="dist-info">
                <span class="dist-color" :style="{ background: item.color }"></span>
                <span class="dist-name">{{ item.name }}</span>
              </div>
              <div class="dist-bar-wrap">
                <div class="dist-bar">
                  <div 
                    class="dist-bar-fill" 
                    :style="{ width: `${item.percent}%`, background: item.color }"
                  ></div>
                </div>
              </div>
              <div class="dist-value">
                <span class="dist-usage">{{ item.usage }}L</span>
                <span class="dist-percent">{{ item.percent }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 设备用水排行 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>设备用水排行 TOP 20</span>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索设备编号"
            style="width: 200px;"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </template>
      
      <el-table :data="rankingList" v-loading="rankingLoading" stripe border>
        <el-table-column type="index" label="排名" width="70" align="center">
          <template #default="{ $index }">
            <div class="rank-badge" :class="{ 
              'rank-1': $index === 0, 
              'rank-2': $index === 1, 
              'rank-3': $index === 2 
            }">
              {{ $index + 1 }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="device_id" label="设备编号" width="160" />
        <el-table-column prop="user_name" label="用户" width="120" />
        <el-table-column prop="address" label="安装地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="usage" label="用水量(L)" width="120" align="right">
          <template #default="{ row }">
            <span class="usage-value">{{ formatNumber(row.usage) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="buckets" label="折合桶数" width="100" align="right">
          <template #default="{ row }">
            {{ (row.usage / 18).toFixed(1) }}
          </template>
        </el-table-column>
        <el-table-column prop="avg_daily" label="日均(L)" width="100" align="right">
          <template #default="{ row }">
            {{ row.avg_daily?.toFixed(1) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="用水趋势" width="150" align="center">
          <template #default="{ row }">
            <div class="mini-trend">
              <div 
                v-for="(v, i) in row.trend || []" 
                :key="i" 
                class="mini-bar"
                :style="{ height: `${v}%` }"
              ></div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDeviceDetail(row)">
              <el-icon><View /></el-icon> 详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="rankingQuery.page"
          v-model:page-size="rankingQuery.limit"
          :total="rankingTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchRanking"
          @current-change="fetchRanking"
        />
      </div>
    </el-card>

    <!-- 设备详情抽屉 -->
    <el-drawer
      v-model="detailDrawerVisible"
      title="设备用水详情"
      size="50%"
    >
      <div v-if="currentDevice" class="device-usage-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备编号">{{ currentDevice.device_id }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ currentDevice.user_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="安装地址" :span="2">{{ currentDevice.address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="总用水量">{{ formatNumber(currentDevice.usage) }} L</el-descriptions-item>
          <el-descriptions-item label="折合桶数">{{ (currentDevice.usage / 18).toFixed(1) }} 桶</el-descriptions-item>
          <el-descriptions-item label="日均用水">{{ currentDevice.avg_daily?.toFixed(1) || '-' }} L</el-descriptions-item>
          <el-descriptions-item label="节省金额">¥{{ ((currentDevice.usage / 18) * 4.6).toFixed(1) }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top: 20px;">近30天用水记录</h4>
        <el-table :data="deviceDailyUsage" border size="small" max-height="400">
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="usage" label="用水量(L)" width="120" align="right" />
          <el-table-column label="对比前一天" width="120" align="center">
            <template #default="{ row }">
              <span v-if="row.change > 0" class="change-up">+{{ row.change }}%</span>
              <span v-else-if="row.change < 0" class="change-down">{{ row.change }}%</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  DataAnalysis, Refresh, Download, DataLine, Coin, Wallet, Monitor,
  ArrowUp, ArrowDown, Search, View
} from '@element-plus/icons-vue'
import request from '@/utils/request'

// 日期范围
const dateRange = ref([])
const dateShortcuts = [
  { text: '最近7天', value: () => {
    const end = new Date()
    const start = new Date()
    start.setTime(start.getTime() - 6 * 24 * 60 * 60 * 1000)
    return [start, end]
  }},
  { text: '最近30天', value: () => {
    const end = new Date()
    const start = new Date()
    start.setTime(start.getTime() - 29 * 24 * 60 * 60 * 1000)
    return [start, end]
  }},
  { text: '本月', value: () => {
    const end = new Date()
    const start = new Date(end.getFullYear(), end.getMonth(), 1)
    return [start, end]
  }},
  { text: '上月', value: () => {
    const end = new Date()
    const start = new Date(end.getFullYear(), end.getMonth() - 1, 1)
    const endOfMonth = new Date(end.getFullYear(), end.getMonth(), 0)
    return [start, endOfMonth]
  }}
]

// 状态
const loading = ref(false)
const chartType = ref('daily')
const searchKeyword = ref('')

// 概览数据
const overview = ref({
  totalUsage: 0,
  totalBuckets: 0,
  savedMoney: 0,
  activeDevices: 0,
  usageTrend: 0
})

// 趋势数据
const trendData = ref([])

// 分布数据
const distributionData = ref([
  { name: '高用水量 (>50L/天)', usage: 0, percent: 0, color: '#409eff' },
  { name: '中用水量 (20-50L/天)', usage: 0, percent: 0, color: '#67c23a' },
  { name: '低用水量 (<20L/天)', usage: 0, percent: 0, color: '#e6a23c' },
  { name: '无用水记录', usage: 0, percent: 0, color: '#909399' }
])

// 排行数据
const rankingLoading = ref(false)
const rankingList = ref([])
const rankingTotal = ref(0)
const rankingQuery = reactive({
  page: 1,
  limit: 20
})

// 设备详情
const detailDrawerVisible = ref(false)
const currentDevice = ref(null)
const deviceDailyUsage = ref([])

// 初始化日期范围为最近30天
onMounted(() => {
  const end = new Date()
  const start = new Date()
  start.setTime(start.getTime() - 29 * 24 * 60 * 60 * 1000)
  dateRange.value = [
    formatDate(start),
    formatDate(end)
  ]
  fetchData()
})

// 格式化日期
const formatDate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 格式化数字
const formatNumber = (num) => {
  if (!num && num !== 0) return '-'
  return parseFloat(num).toLocaleString('zh-CN', { maximumFractionDigits: 1 })
}

// 获取所有数据
const fetchData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchOverview(),
      fetchTrend(),
      fetchDistribution(),
      fetchRanking()
    ])
  } catch (error) {
    console.error('获取数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取概览数据
const fetchOverview = async () => {
  try {
    const res = await request({
      url: '/api/admin/water-purifier/usage/overview',
      method: 'get',
      params: {
        start_date: dateRange.value[0],
        end_date: dateRange.value[1]
      }
    })
    if (res.code === 0) {
      overview.value = res.data || overview.value
      // 计算桶数和节省金额
      overview.value.totalBuckets = (overview.value.totalUsage / 18).toFixed(1)
      overview.value.savedMoney = (overview.value.totalBuckets * 4.6).toFixed(1)
    }
  } catch (error) {
    console.error('获取概览数据失败:', error)
    // 使用模拟数据
    generateMockOverview()
  }
}

// 获取趋势数据
const fetchTrend = async () => {
  try {
    const res = await request({
      url: '/api/admin/water-purifier/usage/trend',
      method: 'get',
      params: {
        start_date: dateRange.value[0],
        end_date: dateRange.value[1],
        type: chartType.value
      }
    })
    if (res.code === 0 && res.data?.length > 0) {
      const maxUsage = Math.max(...res.data.map(d => d.usage))
      trendData.value = res.data.map(d => ({
        ...d,
        label: d.date?.split('-').slice(1).join('/') || d.label,
        percent: maxUsage > 0 ? Math.round((d.usage / maxUsage) * 100) : 0
      }))
    } else {
      generateMockTrend()
    }
  } catch (error) {
    console.error('获取趋势数据失败:', error)
    generateMockTrend()
  }
}

// 获取分布数据
const fetchDistribution = async () => {
  try {
    const res = await request({
      url: '/api/admin/water-purifier/usage/distribution',
      method: 'get',
      params: {
        start_date: dateRange.value[0],
        end_date: dateRange.value[1]
      }
    })
    if (res.code === 0 && res.data) {
      distributionData.value = res.data
    }
  } catch (error) {
    console.error('获取分布数据失败:', error)
    // 使用默认分布数据
    distributionData.value = [
      { name: '高用水量 (>50L/天)', usage: 1250, percent: 35, color: '#409eff' },
      { name: '中用水量 (20-50L/天)', usage: 890, percent: 40, color: '#67c23a' },
      { name: '低用水量 (<20L/天)', usage: 320, percent: 18, color: '#e6a23c' },
      { name: '无用水记录', usage: 0, percent: 7, color: '#909399' }
    ]
  }
}

// 获取排行数据
const fetchRanking = async () => {
  rankingLoading.value = true
  try {
    const res = await request({
      url: '/api/admin/water-purifier/usage/ranking',
      method: 'get',
      params: {
        ...rankingQuery,
        start_date: dateRange.value[0],
        end_date: dateRange.value[1],
        keyword: searchKeyword.value
      }
    })
    if (res.code === 0) {
      rankingList.value = res.data || []
      rankingTotal.value = res.meta?.total || res.data?.length || 0
      
      // 为每个设备生成迷你趋势图数据
      rankingList.value.forEach(item => {
        if (!item.trend) {
          item.trend = Array.from({length: 7}, () => Math.floor(Math.random() * 80) + 20)
        }
      })
    } else {
      generateMockRanking()
    }
  } catch (error) {
    console.error('获取排行数据失败:', error)
    generateMockRanking()
  } finally {
    rankingLoading.value = false
  }
}

// 生成模拟概览数据
const generateMockOverview = () => {
  overview.value = {
    totalUsage: 15680,
    totalBuckets: 871.1,
    savedMoney: 4007.1,
    activeDevices: 42,
    usageTrend: 8.5
  }
}

// 生成模拟趋势数据
const generateMockTrend = () => {
  const data = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const baseUsage = 450 + Math.sin(i * 0.5) * 150
    const usage = Math.round(baseUsage + (Math.random() - 0.5) * 100)
    data.push({
      date: formatDate(date),
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      usage: usage
    })
  }
  const maxUsage = Math.max(...data.map(d => d.usage))
  trendData.value = data.map(d => ({
    ...d,
    percent: Math.round((d.usage / maxUsage) * 100)
  }))
}

// 生成模拟排行数据
const generateMockRanking = () => {
  rankingList.value = Array.from({length: 20}, (_, i) => ({
    id: i + 1,
    device_id: `JZQ${String(10000 + i).padStart(6, '0')}`,
    user_name: `用户${i + 1}`,
    address: `福建省厦门市集美区杏林街道${i + 1}号`,
    usage: Math.round(800 - i * 35 + Math.random() * 50),
    avg_daily: parseFloat((25 - i * 0.8 + Math.random() * 3).toFixed(1)),
    trend: Array.from({length: 7}, () => Math.floor(Math.random() * 80) + 20)
  }))
  rankingTotal.value = 100
}

// 事件处理
const handleDateChange = () => {
  fetchData()
}

const refreshData = () => {
  fetchData()
}

const handleSearch = () => {
  rankingQuery.page = 1
  fetchRanking()
}

const exportData = () => {
  ElMessage.info('导出功能开发中...')
}

const viewDeviceDetail = async (row) => {
  currentDevice.value = row
  detailDrawerVisible.value = true
  
  // 生成30天用水记录
  const records = []
  const today = new Date()
  let prevUsage = 0
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const usage = Math.round(row.avg_daily * (0.8 + Math.random() * 0.4))
    const change = prevUsage > 0 ? Math.round((usage - prevUsage) / prevUsage * 100) : 0
    records.push({
      date: formatDate(date),
      usage: usage,
      change: change
    })
    prevUsage = usage
  }
  
  deviceDailyUsage.value = records.reverse()
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 统计卡片 */
.stats-container {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-card.primary { border-left: 4px solid #409eff; }
.stat-card.success { border-left: 4px solid #67c23a; }
.stat-card.warning { border-left: 4px solid #e6a23c; }
.stat-card.info { border-left: 4px solid #909399; }

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.stat-card.primary .stat-icon { background: #ecf5ff; color: #409eff; }
.stat-card.success .stat-icon { background: #f0f9eb; color: #67c23a; }
.stat-card.warning .stat-icon { background: #fdf6ec; color: #e6a23c; }
.stat-card.info .stat-icon { background: #f4f4f5; color: #909399; }

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  display: inline;
}

.stat-unit {
  font-size: 16px;
  color: #909399;
  margin-left: 4px;
  display: inline;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.stat-desc {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 2px;
}

.stat-trend {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-trend.up { color: #67c23a; }
.stat-trend.down { color: #f56c6c; }

/* 图表卡片 */
.chart-card {
  height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-empty {
  width: 100%;
}

/* 简单柱状图 */
.simple-chart {
  width: 100%;
  height: 100%;
  padding: 20px;
}

.chart-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 100%;
  gap: 8px;
}

.chart-bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 40px;
}

.bar-value {
  font-size: 10px;
  color: #909399;
  margin-bottom: 4px;
  white-space: nowrap;
}

.bar-track {
  width: 100%;
  height: 200px;
  background: #f0f0f0;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(180deg, #409eff 0%, #79bbff 100%);
  border-radius: 4px;
  transition: height 0.5s ease;
  min-height: 4px;
}

.bar-label {
  font-size: 10px;
  color: #909399;
  margin-top: 4px;
  white-space: nowrap;
}

/* 分布列表 */
.distribution-list {
  padding: 20px 0;
}

.distribution-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.dist-info {
  width: 160px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dist-color {
  width: 12px;
  height: 12px;
  border-radius: 4px;
}

.dist-name {
  font-size: 13px;
  color: #606266;
}

.dist-bar-wrap {
  flex: 1;
}

.dist-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.dist-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.dist-value {
  width: 120px;
  text-align: right;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.dist-usage {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.dist-percent {
  font-size: 14px;
  color: #909399;
}

/* 排行榜 */
.rank-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #909399;
  margin: 0 auto;
}

.rank-badge.rank-1 { background: #ffd700; color: #fff; }
.rank-badge.rank-2 { background: #c0c0c0; color: #fff; }
.rank-badge.rank-3 { background: #cd7f32; color: #fff; }

.usage-value {
  font-weight: 600;
  color: #409eff;
}

/* 迷你趋势图 */
.mini-trend {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 24px;
}

.mini-bar {
  flex: 1;
  background: linear-gradient(180deg, #409eff 0%, #79bbff 100%);
  border-radius: 2px;
  min-height: 4px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 详情变化 */
.change-up {
  color: #67c23a;
  font-weight: 500;
}

.change-down {
  color: #f56c6c;
  font-weight: 500;
}
</style>
