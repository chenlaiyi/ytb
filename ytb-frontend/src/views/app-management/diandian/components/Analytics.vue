<template>
  <div class="analytics">
    <div class="management-header">
      <h3>统计分析</h3>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="handleDateChange"
        />
        <el-button icon="Download" @click="exportReport">导出报告</el-button>
        <el-button icon="Refresh" @click="refreshData" :loading="refreshing">刷新</el-button>
      </div>
    </div>

    <!-- 核心指标 -->
    <el-row :gutter="20" class="mb-6">
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-item">
            <div class="metric-icon users">
              <el-icon><User /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ metrics.totalUsers.toLocaleString() }}</div>
              <div class="metric-label">总用户数</div>
              <div class="metric-change" :class="{ positive: metrics.userGrowth > 0, negative: metrics.userGrowth < 0 }">
                <el-icon v-if="metrics.userGrowth > 0"><TrendCharts /></el-icon>
                <el-icon v-else><Bottom /></el-icon>
                {{ Math.abs(metrics.userGrowth) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-item">
            <div class="metric-icon active">
              <el-icon><Connection /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ metrics.activeUsers.toLocaleString() }}</div>
              <div class="metric-label">活跃用户</div>
              <div class="metric-change" :class="{ positive: metrics.activeGrowth > 0, negative: metrics.activeGrowth < 0 }">
                <el-icon v-if="metrics.activeGrowth > 0"><TrendCharts /></el-icon>
                <el-icon v-else><Bottom /></el-icon>
                {{ Math.abs(metrics.activeGrowth) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-item">
            <div class="metric-icon revenue">
              <el-icon><Money /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">¥{{ metrics.revenue.toLocaleString() }}</div>
              <div class="metric-label">总收入</div>
              <div class="metric-change" :class="{ positive: metrics.revenueGrowth > 0, negative: metrics.revenueGrowth < 0 }">
                <el-icon v-if="metrics.revenueGrowth > 0"><TrendCharts /></el-icon>
                <el-icon v-else><Bottom /></el-icon>
                {{ Math.abs(metrics.revenueGrowth) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-item">
            <div class="metric-icon orders">
              <el-icon><ShoppingCart /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ metrics.orders.toLocaleString() }}</div>
              <div class="metric-label">订单数量</div>
              <div class="metric-change" :class="{ positive: metrics.orderGrowth > 0, negative: metrics.orderGrowth < 0 }">
                <el-icon v-if="metrics.orderGrowth > 0"><TrendCharts /></el-icon>
                <el-icon v-else><Bottom /></el-icon>
                {{ Math.abs(metrics.orderGrowth) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="mb-6">
      <!-- 用户趋势图 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>用户增长趋势</span>
              <el-radio-group v-model="userChartType" size="small">
                <el-radio-button label="daily">日</el-radio-button>
                <el-radio-button label="weekly">周</el-radio-button>
                <el-radio-button label="monthly">月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container" id="userTrendChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      
      <!-- 收入趋势图 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>收入趋势</span>
              <el-radio-group v-model="revenueChartType" size="small">
                <el-radio-button label="daily">日</el-radio-button>
                <el-radio-button label="weekly">周</el-radio-button>
                <el-radio-button label="monthly">月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container" id="revenueTrendChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-6">
      <!-- 平台分布 -->
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span>平台分布</span>
          </template>
          <div class="chart-container" id="platformChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      
      <!-- 版本分布 -->
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span>版本分布</span>
          </template>
          <div class="chart-container" id="versionChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      
      <!-- 地区分布 -->
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span>地区分布</span>
          </template>
          <div class="chart-container" id="regionChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据表格 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="data-table-card">
          <template #header>
            <span>热门功能</span>
          </template>
          <el-table :data="popularFeatures" style="width: 100%">
            <el-table-column prop="name" label="功能名称" />
            <el-table-column prop="usage" label="使用次数" align="right">
              <template #default="{ row }">
                {{ row.usage.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="percentage" label="占比" align="right">
              <template #default="{ row }">
                <div class="percentage-bar">
                  <div class="percentage-fill" :style="{ width: row.percentage + '%' }"></div>
                  <span class="percentage-text">{{ row.percentage }}%</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="data-table-card">
          <template #header>
            <span>用户留存</span>
          </template>
          <el-table :data="retentionData" style="width: 100%">
            <el-table-column prop="period" label="时间段" />
            <el-table-column prop="newUsers" label="新增用户" align="right">
              <template #default="{ row }">
                {{ row.newUsers.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="retention" label="留存率" align="right">
              <template #default="{ row }">
                <el-tag :type="getRetentionTagType(row.retention)">{{ row.retention }}%</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实时数据 -->
    <el-card class="realtime-card mt-6">
      <template #header>
        <div class="realtime-header">
          <span>实时数据</span>
          <el-tag type="success" size="small">
            <el-icon><CircleCheck /></el-icon>
            实时更新
          </el-tag>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="realtime-item">
            <div class="realtime-label">在线用户</div>
            <div class="realtime-value">{{ realtimeData.onlineUsers }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="realtime-item">
            <div class="realtime-label">今日新增</div>
            <div class="realtime-value">{{ realtimeData.todayNew }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="realtime-item">
            <div class="realtime-label">今日订单</div>
            <div class="realtime-value">{{ realtimeData.todayOrders }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="realtime-item">
            <div class="realtime-label">今日收入</div>
            <div class="realtime-value">¥{{ realtimeData.todayRevenue.toLocaleString() }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Connection, Money, ShoppingCart, TrendCharts, Bottom, CircleCheck } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

export default {
  name: 'Analytics',
  components: {
    User,
    Connection,
    Money,
    ShoppingCart,
    TrendCharts,
    Bottom,
    CircleCheck
  },
  setup() {
    const refreshing = ref(false)
    const dateRange = ref([])
    const userChartType = ref('daily')
    const revenueChartType = ref('daily')
    
    let userChart = null
    let revenueChart = null
    let platformChart = null
    let versionChart = null
    let regionChart = null
    let realtimeTimer = null

    // 核心指标
    const metrics = reactive({
      totalUsers: 125680,
      userGrowth: 12.5,
      activeUsers: 89456,
      activeGrowth: 8.3,
      revenue: 2456789,
      revenueGrowth: 15.2,
      orders: 34567,
      orderGrowth: -2.1
    })

    // 热门功能数据
    const popularFeatures = ref([
      { name: '商品浏览', usage: 156789, percentage: 85 },
      { name: '购物车', usage: 98456, percentage: 53 },
      { name: '订单查询', usage: 87654, percentage: 47 },
      { name: '用户中心', usage: 76543, percentage: 41 },
      { name: '客服咨询', usage: 45678, percentage: 25 }
    ])

    // 用户留存数据
    const retentionData = ref([
      { period: '1日留存', newUsers: 1234, retention: 78 },
      { period: '3日留存', newUsers: 1234, retention: 65 },
      { period: '7日留存', newUsers: 1234, retention: 52 },
      { period: '30日留存', newUsers: 1234, retention: 35 }
    ])

    // 实时数据
    const realtimeData = reactive({
      onlineUsers: 2456,
      todayNew: 189,
      todayOrders: 456,
      todayRevenue: 78945
    })

    // 方法
    const refreshData = async () => {
      refreshing.value = true
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        // 模拟数据更新
        metrics.totalUsers += Math.floor(Math.random() * 100)
        metrics.activeUsers += Math.floor(Math.random() * 50)
        updateCharts()
        ElMessage.success('数据刷新成功')
      } catch (error) {
        ElMessage.error('数据刷新失败')
      } finally {
        refreshing.value = false
      }
    }

    const handleDateChange = (dates) => {
      console.log('日期范围变更:', dates)
      updateCharts()
    }

    const exportReport = () => {
      ElMessage.success('报告导出中...')
    }

    const getRetentionTagType = (retention) => {
      if (retention >= 70) return 'success'
      if (retention >= 50) return 'warning'
      return 'danger'
    }

    const initCharts = async () => {
      await nextTick()
      
      // 用户趋势图
      const userChartDom = document.getElementById('userTrendChart')
      if (userChartDom) {
        userChart = echarts.init(userChartDom)
        const userOption = {
          tooltip: { trigger: 'axis' },
          xAxis: {
            type: 'category',
            data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月']
          },
          yAxis: { type: 'value' },
          series: [{
            name: '新增用户',
            type: 'line',
            smooth: true,
            data: [1200, 1350, 1100, 1400, 1600, 1800, 2000],
            itemStyle: { color: '#409eff' }
          }, {
            name: '活跃用户',
            type: 'line',
            smooth: true,
            data: [800, 950, 750, 1050, 1200, 1350, 1500],
            itemStyle: { color: '#67c23a' }
          }],
          legend: { data: ['新增用户', '活跃用户'] }
        }
        userChart.setOption(userOption)
      }

      // 收入趋势图
      const revenueChartDom = document.getElementById('revenueTrendChart')
      if (revenueChartDom) {
        revenueChart = echarts.init(revenueChartDom)
        const revenueOption = {
          tooltip: { trigger: 'axis' },
          xAxis: {
            type: 'category',
            data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月']
          },
          yAxis: { type: 'value' },
          series: [{
            name: '收入',
            type: 'bar',
            data: [120000, 135000, 110000, 140000, 160000, 180000, 200000],
            itemStyle: { color: '#e6a23c' }
          }]
        }
        revenueChart.setOption(revenueOption)
      }

      // 平台分布饼图
      const platformChartDom = document.getElementById('platformChart')
      if (platformChartDom) {
        platformChart = echarts.init(platformChartDom)
        const platformOption = {
          tooltip: { trigger: 'item' },
          series: [{
            name: '平台分布',
            type: 'pie',
            radius: '60%',
            data: [
              { value: 45, name: 'iOS' },
              { value: 35, name: 'Android' },
              { value: 15, name: 'H5' },
              { value: 5, name: 'HarmonyOS' }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }]
        }
        platformChart.setOption(platformOption)
      }

      // 版本分布
      const versionChartDom = document.getElementById('versionChart')
      if (versionChartDom) {
        versionChart = echarts.init(versionChartDom)
        const versionOption = {
          tooltip: { trigger: 'item' },
          series: [{
            name: '版本分布',
            type: 'pie',
            radius: ['40%', '70%'],
            data: [
              { value: 60, name: 'v2.1.0' },
              { value: 25, name: 'v2.0.5' },
              { value: 10, name: 'v1.9.8' },
              { value: 5, name: '其他版本' }
            ]
          }]
        }
        versionChart.setOption(versionOption)
      }

      // 地区分布
      const regionChartDom = document.getElementById('regionChart')
      if (regionChartDom) {
        regionChart = echarts.init(regionChartDom)
        const regionOption = {
          tooltip: { trigger: 'axis' },
          xAxis: {
            type: 'category',
            data: ['北京', '上海', '广州', '深圳', '杭州', '成都']
          },
          yAxis: { type: 'value' },
          series: [{
            name: '用户数',
            type: 'bar',
            data: [12000, 15000, 8000, 10000, 6000, 7000],
            itemStyle: { color: '#f56c6c' }
          }]
        }
        regionChart.setOption(regionOption)
      }
    }

    const updateCharts = () => {
      // 根据图表类型和日期范围更新图表数据
      console.log('更新图表数据')
    }

    const startRealtimeUpdate = () => {
      realtimeTimer = setInterval(() => {
        // 模拟实时数据更新
        realtimeData.onlineUsers += Math.floor(Math.random() * 20 - 10)
        realtimeData.todayNew += Math.floor(Math.random() * 5)
        realtimeData.todayOrders += Math.floor(Math.random() * 10)
        realtimeData.todayRevenue += Math.floor(Math.random() * 1000)
        
        // 确保数据不为负数
        if (realtimeData.onlineUsers < 0) realtimeData.onlineUsers = 0
        if (realtimeData.todayNew < 0) realtimeData.todayNew = 0
        if (realtimeData.todayOrders < 0) realtimeData.todayOrders = 0
        if (realtimeData.todayRevenue < 0) realtimeData.todayRevenue = 0
      }, 5000) // 每5秒更新一次
    }

    const handleResize = () => {
      if (userChart) userChart.resize()
      if (revenueChart) revenueChart.resize()
      if (platformChart) platformChart.resize()
      if (versionChart) versionChart.resize()
      if (regionChart) regionChart.resize()
    }

    onMounted(() => {
      // 设置默认日期范围为最近30天
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      dateRange.value = [
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      ]
      
      initCharts()
      startRealtimeUpdate()
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      if (realtimeTimer) {
        clearInterval(realtimeTimer)
      }
      if (userChart) userChart.dispose()
      if (revenueChart) revenueChart.dispose()
      if (platformChart) platformChart.dispose()
      if (versionChart) versionChart.dispose()
      if (regionChart) regionChart.dispose()
      window.removeEventListener('resize', handleResize)
    })

    return {
      refreshing,
      dateRange,
      userChartType,
      revenueChartType,
      metrics,
      popularFeatures,
      retentionData,
      realtimeData,
      refreshData,
      handleDateChange,
      exportReport,
      getRetentionTagType
    }
  }
}
</script>

<style scoped>
.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.management-header h3 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.metric-card {
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
}

.metric-item {
  display: flex;
  align-items: center;
  padding: 20px;
}

.metric-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.metric-icon.users {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.metric-icon.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.metric-icon.revenue {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.metric-icon.orders {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.metric-label {
  font-size: 14px;
  color: #909399;
  line-height: 1;
  margin-bottom: 8px;
}

.metric-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.metric-change.positive {
  color: #67c23a;
}

.metric-change.negative {
  color: #f56c6c;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  width: 100%;
}

.data-table-card {
  margin-bottom: 20px;
}

.percentage-bar {
  position: relative;
  width: 100%;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.percentage-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  transition: width 0.3s;
}

.percentage-text {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  font-size: 12px;
  color: #303133;
  font-weight: 500;
}

.realtime-card {
  border: 2px solid #67c23a;
}

.realtime-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.realtime-item {
  text-align: center;
  padding: 20px;
}

.realtime-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.realtime-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.mb-6 {
  margin-bottom: 24px;
}

.mt-6 {
  margin-top: 24px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .metric-value {
    font-size: 24px;
  }
  
  .metric-icon {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .management-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .realtime-item {
    padding: 10px;
  }
  
  .realtime-value {
    font-size: 20px;
  }
}
</style>
