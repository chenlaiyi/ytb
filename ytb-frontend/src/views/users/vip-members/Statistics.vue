<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-title">
        <h2>VIP会员管理</h2>
        <p class="page-description">管理和查看所有VIP会员信息</p>
      </div>
      <div class="page-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="loadStatistics"
          size="default"
        />
        <el-button type="primary" size="large" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- VIP会员模块导航标签页 -->
    <el-card class="navigation-card" shadow="never">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="vip-tabs">
        <el-tab-pane label="VIP会员列表" name="list">
          <template #label>
            <span class="tab-label">
              <el-icon><User /></el-icon>
              VIP会员列表
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="VIP分红管理" name="dividends">
          <template #label>
            <span class="tab-label">
              <el-icon><Money /></el-icon>
              VIP分红管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="VIP排行榜" name="rankings">
          <template #label>
            <span class="tab-label">
              <el-icon><Trophy /></el-icon>
              VIP排行榜
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="VIP余额管理" name="balance">
          <template #label>
            <span class="tab-label">
              <el-icon><Wallet /></el-icon>
              VIP余额管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="VIP等级管理" name="levels">
          <template #label>
            <span class="tab-label">
              <el-icon><Star /></el-icon>
              VIP等级管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="VIP统计分析" name="statistics">
          <template #label>
            <span class="tab-label">
              <el-icon><DataAnalysis /></el-icon>
              VIP统计分析
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 核心指标卡片 -->
    <div class="metrics-container">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="metric-card total-card" shadow="hover">
            <div class="metric-content">
              <div class="metric-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ statistics.total_vips }}</div>
                <div class="metric-label">VIP总数</div>
                <div class="metric-change" :class="getChangeClass(statistics.vip_growth)">
                  <el-icon><TrendCharts /></el-icon>
                  {{ formatChange(statistics.vip_growth) }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="metric-card revenue-card" shadow="hover">
            <div class="metric-content">
              <div class="metric-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">¥{{ formatCurrency(statistics.total_revenue) }}</div>
                <div class="metric-label">总收入</div>
                <div class="metric-change" :class="getChangeClass(statistics.revenue_growth)">
                  <el-icon><TrendCharts /></el-icon>
                  {{ formatChange(statistics.revenue_growth) }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="metric-card active-card" shadow="hover">
            <div class="metric-content">
              <div class="metric-icon">
                <el-icon><Star /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ statistics.active_vips }}</div>
                <div class="metric-label">活跃VIP</div>
                <div class="metric-change" :class="getChangeClass(statistics.active_growth)">
                  <el-icon><TrendCharts /></el-icon>
                  {{ formatChange(statistics.active_growth) }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="metric-card conversion-card" shadow="hover">
            <div class="metric-content">
              <div class="metric-icon">
                <el-icon><Promotion /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ statistics.conversion_rate }}%</div>
                <div class="metric-label">转化率</div>
                <div class="metric-change" :class="getChangeClass(statistics.conversion_growth)">
                  <el-icon><TrendCharts /></el-icon>
                  {{ formatChange(statistics.conversion_growth) }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-container">
      <el-row :gutter="20">
        <!-- VIP增长趋势 -->
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <h3>VIP增长趋势</h3>
                <el-radio-group v-model="trendPeriod" @change="loadTrendData" size="small">
                  <el-radio-button value="7d">7天</el-radio-button>
                  <el-radio-button value="30d">30天</el-radio-button>
                  <el-radio-button value="90d">90天</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div ref="trendChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        
        <!-- VIP等级分布 -->
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <h3>VIP等级分布</h3>
            </template>
            <div ref="levelChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        
        <!-- 地区分布 -->
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <h3>地区分布</h3>
            </template>
            <div ref="regionChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        
        <!-- 团队规模分布 -->
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <h3>团队规模分布</h3>
            </template>
            <div ref="teamChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 详细数据表格 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>VIP详细统计</h3>
          <div class="header-actions">
            <el-select v-model="tableGroupBy" @change="loadTableData" size="small">
              <el-option label="按日期" value="date" />
              <el-option label="按等级" value="level" />
              <el-option label="按地区" value="region" />
              <el-option label="按来源" value="source" />
            </el-select>
            <el-button type="primary" size="small" @click="exportData">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="tableData" v-loading="tableLoading" stripe>
        <el-table-column :label="getTableColumnLabel()" min-width="150">
          <template #default="{ row }">
            {{ formatTableValue(row.key) }}
          </template>
        </el-table-column>
        
        <el-table-column label="VIP数量" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ row.vip_count }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="新增VIP" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="success" size="small">{{ row.new_vips }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="总收入" width="150" align="center">
          <template #default="{ row }">
            <span class="revenue-amount">¥{{ formatCurrency(row.revenue) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="平均余额" width="150" align="center">
          <template #default="{ row }">
            <span class="balance-amount">¥{{ formatCurrency(row.avg_balance) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="活跃度" width="120" align="center">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.activity_rate" 
              :color="getActivityColor(row.activity_rate)"
              :stroke-width="8"
              text-inside
            />
          </template>
        </el-table-column>
        
        <el-table-column label="增长率" width="120" align="center">
          <template #default="{ row }">
            <span :class="getChangeClass(row.growth_rate)">
              {{ formatChange(row.growth_rate) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="tablePage"
          v-model:page-size="tableLimit"
          :page-sizes="[10, 20, 50, 100]"
          :total="tableTotal"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadTableData"
          @current-change="loadTableData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  DataAnalysis, Refresh, User, Money, Star, Promotion, 
  TrendCharts, Download, Trophy, Wallet
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 路由
const router = useRouter()

// 响应式数据
const dateRange = ref([])
const trendPeriod = ref('30d')
const tableGroupBy = ref('date')
const tableLoading = ref(false)
const tablePage = ref(1)
const tableLimit = ref(20)
const tableTotal = ref(0)
const tableData = ref([])

// VIP会员模块导航标签页
const activeTab = ref('statistics')

// 统计数据
const statistics = reactive({
  total_vips: 0,
  total_revenue: 0,
  active_vips: 0,
  conversion_rate: 0,
  vip_growth: 0,
  revenue_growth: 0,
  active_growth: 0,
  conversion_growth: 0
})

// 图表引用
const trendChartRef = ref()
const levelChartRef = ref()
const regionChartRef = ref()
const teamChartRef = ref()

// 图表实例
let trendChart = null
let levelChart = null
let regionChart = null
let teamChart = null

// 方法
const formatCurrency = (value) => {
  return parseFloat(value || 0).toFixed(2)
}

const formatChange = (value) => {
  const num = parseFloat(value || 0)
  return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`
}

const getChangeClass = (value) => {
  const num = parseFloat(value || 0)
  if (num > 0) return 'change-positive'
  if (num < 0) return 'change-negative'
  return 'change-neutral'
}

const getActivityColor = (rate) => {
  if (rate >= 80) return '#67c23a'
  if (rate >= 60) return '#e6a23c'
  if (rate >= 40) return '#f56c6c'
  return '#909399'
}

const getTableColumnLabel = () => {
  const labels = {
    'date': '日期',
    'level': 'VIP等级',
    'region': '地区',
    'source': '来源渠道'
  }
  return labels[tableGroupBy.value] || '分类'
}

const formatTableValue = (value) => {
  if (tableGroupBy.value === 'date') {
    return new Date(value).toLocaleDateString('zh-CN')
  }
  return value
}

const loadStatistics = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    Object.assign(statistics, {
      total_vips: 1250,
      total_revenue: 2580000,
      active_vips: 980,
      conversion_rate: 15.8,
      vip_growth: 12.5,
      revenue_growth: 18.3,
      active_growth: 8.7,
      conversion_growth: -2.1
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  }
}

const loadTrendData = async () => {
  try {
    // 模拟数据
    const dates = []
    const vipCounts = []
    const revenues = []
    
    const days = trendPeriod.value === '7d' ? 7 : trendPeriod.value === '30d' ? 30 : 90
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date.toLocaleDateString('zh-CN'))
      vipCounts.push(Math.floor(Math.random() * 50) + 20)
      revenues.push(Math.floor(Math.random() * 50000) + 10000)
    }
    
    if (trendChart) {
      trendChart.setOption({
        title: {
          text: 'VIP增长趋势',
          left: 'center',
          textStyle: { fontSize: 16, color: '#303133' }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' }
        },
        legend: {
          data: ['新增VIP', '收入'],
          bottom: 10
        },
        xAxis: {
          type: 'category',
          data: dates,
          axisLabel: { rotate: 45 }
        },
        yAxis: [
          {
            type: 'value',
            name: 'VIP数量',
            position: 'left'
          },
          {
            type: 'value',
            name: '收入(元)',
            position: 'right'
          }
        ],
        series: [
          {
            name: '新增VIP',
            type: 'line',
            data: vipCounts,
            smooth: true,
            itemStyle: { color: '#409eff' },
            areaStyle: { opacity: 0.3 }
          },
          {
            name: '收入',
            type: 'bar',
            yAxisIndex: 1,
            data: revenues,
            itemStyle: { color: '#67c23a' }
          }
        ]
      })
    }
  } catch (error) {
    console.error('获取趋势数据失败:', error)
  }
}

const loadLevelData = async () => {
  try {
    const levelData = [
      { name: '钻石VIP', value: 50, color: '#f56c6c' },
      { name: '黄金VIP', value: 180, color: '#e6a23c' },
      { name: '白银VIP', value: 320, color: '#909399' },
      { name: '普通VIP', value: 700, color: '#409eff' }
    ]
    
    if (levelChart) {
      levelChart.setOption({
        title: {
          text: 'VIP等级分布',
          left: 'center',
          textStyle: { fontSize: 16, color: '#303133' }
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: 'VIP等级',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['60%', '50%'],
            data: levelData.map(item => ({
              name: item.name,
              value: item.value,
              itemStyle: { color: item.color }
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      })
    }
  } catch (error) {
    console.error('获取等级数据失败:', error)
  }
}

const loadRegionData = async () => {
  try {
    const regionData = [
      { name: '广东', value: 350 },
      { name: '江苏', value: 280 },
      { name: '浙江', value: 220 },
      { name: '山东', value: 180 },
      { name: '河南', value: 150 },
      { name: '四川', value: 120 },
      { name: '湖北', value: 100 },
      { name: '其他', value: 200 }
    ]
    
    if (regionChart) {
      regionChart.setOption({
        title: {
          text: '地区分布',
          left: 'center',
          textStyle: { fontSize: 16, color: '#303133' }
        },
        tooltip: {
          trigger: 'item'
        },
        xAxis: {
          type: 'category',
          data: regionData.map(item => item.name),
          axisLabel: { rotate: 45 }
        },
        yAxis: {
          type: 'value',
          name: 'VIP数量'
        },
        series: [
          {
            type: 'bar',
            data: regionData.map(item => ({
              value: item.value,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#409eff' },
                  { offset: 1, color: '#66b1ff' }
                ])
              }
            })),
            barWidth: '60%'
          }
        ]
      })
    }
  } catch (error) {
    console.error('获取地区数据失败:', error)
  }
}

const loadTeamData = async () => {
  try {
    const teamData = [
      { range: '1-10人', count: 450 },
      { range: '11-50人', count: 320 },
      { range: '51-100人', count: 180 },
      { range: '101-200人', count: 120 },
      { range: '200人以上', count: 80 }
    ]
    
    if (teamChart) {
      teamChart.setOption({
        title: {
          text: '团队规模分布',
          left: 'center',
          textStyle: { fontSize: 16, color: '#303133' }
        },
        tooltip: {
          trigger: 'item'
        },
        xAxis: {
          type: 'value'
        },
        yAxis: {
          type: 'category',
          data: teamData.map(item => item.range)
        },
        series: [
          {
            type: 'bar',
            data: teamData.map(item => ({
              value: item.count,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: '#67c23a' },
                  { offset: 1, color: '#85ce61' }
                ])
              }
            })),
            barWidth: '50%'
          }
        ]
      })
    }
  } catch (error) {
    console.error('获取团队数据失败:', error)
  }
}

const loadTableData = async () => {
  try {
    tableLoading.value = true
    
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockData = []
    for (let i = 0; i < tableLimit.value; i++) {
      mockData.push({
        key: tableGroupBy.value === 'date' 
          ? new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
          : `${tableGroupBy.value}_${i + 1}`,
        vip_count: Math.floor(Math.random() * 100) + 50,
        new_vips: Math.floor(Math.random() * 20) + 5,
        revenue: Math.floor(Math.random() * 100000) + 50000,
        avg_balance: Math.floor(Math.random() * 5000) + 1000,
        activity_rate: Math.floor(Math.random() * 40) + 60,
        growth_rate: (Math.random() - 0.5) * 20
      })
    }
    
    tableData.value = mockData
    tableTotal.value = 200
    
  } catch (error) {
    console.error('获取表格数据失败:', error)
    ElMessage.error('获取表格数据失败')
  } finally {
    tableLoading.value = false
  }
}

const initCharts = async () => {
  await nextTick()
  
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
  }
  if (levelChartRef.value) {
    levelChart = echarts.init(levelChartRef.value)
  }
  if (regionChartRef.value) {
    regionChart = echarts.init(regionChartRef.value)
  }
  if (teamChartRef.value) {
    teamChart = echarts.init(teamChartRef.value)
  }
  
  // 加载图表数据
  loadTrendData()
  loadLevelData()
  loadRegionData()
  loadTeamData()
  
  // 响应式调整
  window.addEventListener('resize', () => {
    trendChart?.resize()
    levelChart?.resize()
    regionChart?.resize()
    teamChart?.resize()
  })
}

const refreshData = () => {
  loadStatistics()
  loadTrendData()
  loadLevelData()
  loadRegionData()
  loadTeamData()
  loadTableData()
}

// 处理VIP会员模块导航标签页点击
const handleTabClick = (tab) => {
  const tabName = tab.props.name;
  
  // 根据标签页名称跳转到对应的路由
  switch (tabName) {
    case 'list':
      router.push({ name: 'VipList' });
      break;
    case 'dividends':
      router.push({ name: 'VipDividends' });
      break;
    case 'rankings':
      router.push({ name: 'VipRankings' });
      break;
    case 'balance':
      router.push({ name: 'VipBalance' });
      break;
    case 'levels':
      router.push({ name: 'VipLevels' });
      break;
    case 'statistics':
      // 当前页面，不需要跳转
      break;
    default:
      console.warn('未知的标签页:', tabName);
  }
};

const exportData = () => {
  ElMessage.success('数据导出功能开发中...')
}

// 生命周期
onMounted(() => {
  loadStatistics()
  loadTableData()
  initCharts()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

/* 页面头部样式 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 32px;
  margin: -20px -20px 24px -20px;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-description {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 400;
}

.page-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.page-actions .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.page-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* VIP会员模块导航标签页 */
.navigation-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: none;
}

.vip-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vip-tabs .el-tab-pane {
  flex: 1;
}

.vip-tabs .el-tab-pane .tab-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 指标卡片 */
.metrics-container {
  margin-bottom: 30px;
}

.metric-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.metric-content {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 25px;
}

.metric-icon {
  width: 70px;
  height: 70px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
}

.total-card .metric-icon {
  background: linear-gradient(45deg, #409eff, #66b1ff);
}

.revenue-card .metric-icon {
  background: linear-gradient(45deg, #67c23a, #85ce61);
}

.active-card .metric-icon {
  background: linear-gradient(45deg, #e6a23c, #f7ba2a);
}

.conversion-card .metric-icon {
  background: linear-gradient(45deg, #f56c6c, #f78989);
}

.metric-info {
  flex: 1;
}

.metric-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.metric-label {
  font-size: 16px;
  color: #606266;
  margin-bottom: 8px;
}

.metric-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
}

.change-positive {
  color: #67c23a;
}

.change-negative {
  color: #f56c6c;
}

.change-neutral {
  color: #909399;
}

/* 图表区域 */
.charts-container {
  margin-bottom: 30px;
}

.chart-card {
  border-radius: 12px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.chart-container {
  height: 350px;
  width: 100%;
}

/* 表格卡片 */
.table-card {
  border-radius: 12px;
}

.revenue-amount {
  font-weight: 500;
  color: #67c23a;
}

.balance-amount {
  font-weight: 500;
  color: #e6a23c;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-container {
    padding: 15px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .header-right {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .metric-content {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }
  
  .metric-value {
    font-size: 28px;
  }
  
  .chart-container {
    height: 300px;
  }
}

@media (max-width: 480px) {
  .metric-content {
    padding: 15px;
  }
  
  .metric-value {
    font-size: 24px;
  }
  
  .chart-container {
    height: 250px;
  }
}
</style> 