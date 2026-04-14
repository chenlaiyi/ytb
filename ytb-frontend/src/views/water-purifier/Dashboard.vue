<template>
  <div class="water-purifier-dashboard">
    <!-- 页面头部 -->
    <section class="panel panel-header">
      <div class="header-left">
        <div class="title-row">
          <h2>净水器数据驾驶舱</h2>
          <el-tag size="small" type="success" effect="light" v-if="loaded">实时</el-tag>
          <el-tag size="small" type="info" effect="light" v-if="!loaded">加载中</el-tag>
        </div>
        <p class="subtitle">
          实时监控所有净水器设备的运行状态、充值数据、安装订单与预警信息
        </p>
      </div>
      <div class="header-actions">
        <el-button size="small" :loading="loading" type="primary" @click="refreshAll">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </section>

    <!-- 核心指标卡片 -->
    <section class="panel panel-metrics">
      <el-skeleton :rows="3" animated v-if="loading && !loaded" />
      <div class="metrics-grid" v-else>
        <!-- 设备总数 -->
        <div class="metric-card device-card">
          <div class="metric-icon">
            <el-icon size="28"><Monitor /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ overview.devices?.total || 0 }}</div>
            <div class="metric-label">设备总数</div>
          </div>
          <div class="metric-footer">
            <span class="online">在线 {{ overview.devices?.online || 0 }}</span>
            <span class="offline">离线 {{ overview.devices?.offline || 0 }}</span>
          </div>
        </div>

        <!-- 在线率 -->
        <div class="metric-card online-card">
          <div class="metric-icon">
            <el-icon size="28"><Connection /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ overview.devices?.online_rate || 0 }}%</div>
            <div class="metric-label">在线率</div>
          </div>
          <div class="metric-footer">
            <el-progress :percentage="overview.devices?.online_rate || 0" :stroke-width="6" :show-text="false" />
          </div>
        </div>

        <!-- 激活设备 -->
        <div class="metric-card active-card">
          <div class="metric-icon">
            <el-icon size="28"><CircleCheck /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ overview.devices?.activated || 0 }}</div>
            <div class="metric-label">激活设备</div>
          </div>
          <div class="metric-footer">
            <span>待分配 {{ overview.devices?.pending || 0 }}</span>
          </div>
        </div>

        <!-- 今日充值 -->
        <div class="metric-card recharge-card">
          <div class="metric-icon">
            <el-icon size="28"><Wallet /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">¥{{ formatMoney(overview.recharge?.today?.amount) }}</div>
            <div class="metric-label">今日充值</div>
          </div>
          <div class="metric-footer">
            <span>{{ overview.recharge?.today?.count || 0 }} 笔</span>
          </div>
        </div>

        <!-- 本月充值 -->
        <div class="metric-card month-card">
          <div class="metric-icon">
            <el-icon size="28"><Calendar /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">¥{{ formatMoney(overview.recharge?.month?.amount) }}</div>
            <div class="metric-label">本月充值</div>
          </div>
          <div class="metric-footer">
            <span>{{ overview.recharge?.month?.count || 0 }} 笔</span>
          </div>
        </div>

        <!-- 预警数量 -->
        <div class="metric-card alert-card" @click="goToFilterAlerts">
          <div class="metric-icon">
            <el-icon size="28"><Warning /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ totalAlerts }}</div>
            <div class="metric-label">预警设备</div>
          </div>
          <div class="metric-footer">
            <span class="danger">滤芯 {{ overview.alerts?.filter_alert || 0 }}</span>
            <span class="warning">到期 {{ overview.alerts?.expire_soon || 0 }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 图表区域 -->
    <section class="charts-section">
      <el-row :gutter="20">
        <!-- 趋势图 -->
        <el-col :xs="24" :lg="16">
          <div class="panel chart-panel">
            <div class="chart-header">
              <span class="chart-title">运营趋势</span>
              <el-radio-group v-model="trendDays" size="small" @change="loadTrend">
                <el-radio-button :value="7">近7天</el-radio-button>
                <el-radio-button :value="30">近30天</el-radio-button>
                <el-radio-button :value="90">近90天</el-radio-button>
              </el-radio-group>
            </div>
            <div class="chart-content" v-loading="trendLoading">
              <div ref="trendChartRef" class="trend-chart"></div>
            </div>
          </div>
        </el-col>

        <!-- 状态分布 -->
        <el-col :xs="24" :lg="8">
          <div class="panel chart-panel">
            <div class="chart-header">
              <span class="chart-title">设备状态分布</span>
            </div>
            <div class="chart-content" v-loading="distributionLoading">
              <div ref="statusChartRef" class="status-chart"></div>
            </div>
          </div>
        </el-col>
      </el-row>
    </section>

    <!-- 下半部分：告警列表 + 渠道商排行 -->
    <section class="bottom-section">
      <el-row :gutter="20">
        <!-- 实时告警 -->
        <el-col :xs="24" :lg="14">
          <div class="panel alerts-panel">
            <div class="panel-header">
              <span class="panel-title">
                <el-icon><Bell /></el-icon>
                实时告警
              </span>
              <el-button size="small" text type="primary" @click="loadAlerts">刷新</el-button>
            </div>
            <el-table :data="alerts" size="small" v-loading="alertsLoading" max-height="320">
              <el-table-column label="告警" min-width="200">
                <template #default="{ row }">
                  <div class="alert-item">
                    <el-tag :type="alertTagType(row.level)" size="small" effect="dark">
                      {{ alertLevelText(row.level) }}
                    </el-tag>
                    <div class="alert-info">
                      <div class="alert-title">{{ row.title }}</div>
                      <div class="alert-device">{{ row.board_code }} · {{ row.user_name }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="message" label="详情" min-width="160" show-overflow-tooltip />
              <el-table-column label="操作" width="80" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" type="primary" text @click="goToDevice(row.device_id)">
                    查看
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>

        <!-- 渠道商排行 -->
        <el-col :xs="24" :lg="10">
          <div class="panel ranking-panel">
            <div class="panel-header">
              <span class="panel-title">
                <el-icon><Trophy /></el-icon>
                渠道商排行
              </span>
            </div>
            <div class="ranking-list" v-loading="rankingLoading">
              <div 
                v-for="item in dealerRanking" 
                :key="item.dealer_id" 
                class="ranking-item"
                :class="{ 'top-three': item.rank <= 3 }"
              >
                <div class="rank-badge" :class="'rank-' + item.rank">
                  {{ item.rank }}
                </div>
                <div class="dealer-info">
                  <div class="dealer-name">{{ item.dealer_name }}</div>
                  <div class="dealer-stats">
                    设备 {{ item.device_count }} · 激活 {{ item.activated_count }} · 在线 {{ item.online_count }}
                  </div>
                </div>
                <div class="device-count">{{ item.device_count }}</div>
              </div>
              <el-empty v-if="!dealerRanking.length && !rankingLoading" description="暂无数据" :image-size="60" />
            </div>
          </div>
        </el-col>
      </el-row>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import {
  Monitor,
  Connection,
  CircleCheck,
  Wallet,
  Calendar,
  Warning,
  Bell,
  Trophy,
  Refresh
} from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()

// 状态
const loading = ref(false)
const loaded = ref(false)
const trendLoading = ref(false)
const distributionLoading = ref(false)
const alertsLoading = ref(false)
const rankingLoading = ref(false)

// 数据
const overview = ref({})
const trendDays = ref(30)
const alerts = ref([])
const dealerRanking = ref([])

// 图表引用
const trendChartRef = ref(null)
const statusChartRef = ref(null)
let trendChart = null
let statusChart = null

// 计算属性
const totalAlerts = computed(() => {
  const a = overview.value.alerts || {}
  return (a.filter_alert || 0) + (a.expire_soon || 0) + (a.expired || 0)
})

// 格式化金额
const formatMoney = (value) => {
  if (!value) return '0.00'
  return Number(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 告警级别
const alertTagType = (level) => {
  return level === 'danger' ? 'danger' : level === 'warning' ? 'warning' : 'info'
}

const alertLevelText = (level) => {
  return level === 'danger' ? '严重' : level === 'warning' ? '警告' : '提示'
}

// 加载概览数据
const loadOverview = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/api/admin/water-purifier/dashboard/overview',
      method: 'get'
    })
    if (res.code === 0) {
      overview.value = res.data
      loaded.value = true
    }
  } catch (error) {
    console.error('加载概览失败', error)
  } finally {
    loading.value = false
  }
}

// 加载趋势数据
const loadTrend = async () => {
  trendLoading.value = true
  try {
    const res = await request({
      url: '/api/admin/water-purifier/dashboard/trend',
      method: 'get',
      params: { days: trendDays.value }
    })
    if (res.code === 0) {
      renderTrendChart(res.data)
    }
  } catch (error) {
    console.error('加载趋势失败', error)
  } finally {
    trendLoading.value = false
  }
}

// 加载状态分布
const loadDistribution = async () => {
  distributionLoading.value = true
  try {
    const res = await request({
      url: '/api/admin/water-purifier/dashboard/status-distribution',
      method: 'get'
    })
    if (res.code === 0) {
      renderStatusChart(res.data)
    }
  } catch (error) {
    console.error('加载分布失败', error)
  } finally {
    distributionLoading.value = false
  }
}

// 加载告警
const loadAlerts = async () => {
  alertsLoading.value = true
  try {
    const res = await request({
      url: '/api/admin/water-purifier/dashboard/alerts',
      method: 'get'
    })
    if (res.code === 0) {
      alerts.value = res.data.items || []
    }
  } catch (error) {
    console.error('加载告警失败', error)
  } finally {
    alertsLoading.value = false
  }
}

// 加载渠道商排行
const loadRanking = async () => {
  rankingLoading.value = true
  try {
    const res = await request({
      url: '/api/admin/water-purifier/dashboard/dealer-ranking',
      method: 'get',
      params: { limit: 10 }
    })
    if (res.code === 0) {
      dealerRanking.value = res.data || []
    }
  } catch (error) {
    console.error('加载排行失败', error)
  } finally {
    rankingLoading.value = false
  }
}

// 渲染趋势图
const renderTrendChart = (data) => {
  if (!trendChart && trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    window.addEventListener('resize', resizeCharts)
  }
  if (!trendChart) return

  const dates = data.dates || []
  const series = data.series || {}

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['设备激活', '充值笔数', '安装订单'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates.map(d => d.substring(5)) // 只显示月-日
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '设备激活',
        type: 'line',
        smooth: true,
        data: (series.device_activations || []).map(i => i.value),
        itemStyle: { color: '#409eff' },
        areaStyle: { opacity: 0.1, color: '#409eff' }
      },
      {
        name: '充值笔数',
        type: 'line',
        smooth: true,
        data: (series.recharge_count || []).map(i => i.value),
        itemStyle: { color: '#67c23a' },
        areaStyle: { opacity: 0.1, color: '#67c23a' }
      },
      {
        name: '安装订单',
        type: 'line',
        smooth: true,
        data: (series.install_orders || []).map(i => i.value),
        itemStyle: { color: '#e6a23c' },
        areaStyle: { opacity: 0.1, color: '#e6a23c' }
      }
    ]
  }

  trendChart.setOption(option)
}

// 渲染状态分布图
const renderStatusChart = (data) => {
  if (!statusChart && statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value)
  }
  if (!statusChart) return

  const statusData = data.status || []
  const onlineData = data.online || []

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      data: statusData.map(i => i.name)
    },
    series: [
      {
        name: '设备状态',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: { show: false },
        data: statusData.map((item, index) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399'][index % 5]
          }
        }))
      }
    ]
  }

  statusChart.setOption(option)
}

// 调整图表大小
const resizeCharts = () => {
  trendChart?.resize()
  statusChart?.resize()
}

// 刷新所有数据
const refreshAll = () => {
  loadOverview()
  loadTrend()
  loadDistribution()
  loadAlerts()
  loadRanking()
}

// 跳转
const goToDevice = (id) => {
  router.push(`/water-purifier/devices?id=${id}`)
}

const goToFilterAlerts = () => {
  router.push('/water-purifier/filter-alerts')
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    refreshAll()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)
  trendChart?.dispose()
  statusChart?.dispose()
})
</script>

<style scoped>
.water-purifier-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(180deg, #f0f5ff 0%, #f5f7fa 100%);
  min-height: 100%;
}

.panel {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

/* 头部 */
.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.header-left {
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.title-row h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  background: linear-gradient(135deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

/* 核心指标 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.metric-card {
  background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid rgba(64, 158, 255, 0.1);
  transition: all 0.3s ease;
  cursor: default;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.12);
}

.metric-card.alert-card {
  cursor: pointer;
  background: linear-gradient(135deg, #fff8f0 0%, #ffffff 100%);
  border-color: rgba(230, 162, 60, 0.2);
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: white;
}

.device-card .metric-icon { background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%); }
.online-card .metric-icon { background: linear-gradient(135deg, #67c23a 0%, #95d475 100%); }
.active-card .metric-icon { background: linear-gradient(135deg, #0fc6c2 0%, #3ed8d5 100%); }
.recharge-card .metric-icon { background: linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%); }
.month-card .metric-icon { background: linear-gradient(135deg, #909399 0%, #b1b3b8 100%); }
.alert-card .metric-icon { background: linear-gradient(135deg, #f56c6c 0%, #f89898 100%); }

.metric-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2d3d;
  line-height: 1.2;
}

.metric-label {
  font-size: 13px;
  color: #909399;
}

.metric-footer {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #606266;
  padding-top: 8px;
  border-top: 1px dashed rgba(0, 0, 0, 0.06);
}

.metric-footer .online { color: #67c23a; }
.metric-footer .offline { color: #909399; }
.metric-footer .danger { color: #f56c6c; }
.metric-footer .warning { color: #e6a23c; }

/* 图表区域 */
.charts-section {
  margin-top: 0;
}

.chart-panel {
  height: 380px;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-content {
  flex: 1;
  min-height: 280px;
}

.trend-chart,
.status-chart {
  width: 100%;
  height: 100%;
  min-height: 260px;
}

/* 底部区域 */
.bottom-section {
  margin-top: 0;
}

.alerts-panel,
.ranking-panel {
  height: 400px;
  display: flex;
  flex-direction: column;
}

.alerts-panel .panel-header,
.ranking-panel .panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.alert-info {
  flex: 1;
}

.alert-title {
  font-weight: 500;
  color: #303133;
}

.alert-device {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

/* 排行列表 */
.ranking-list {
  flex: 1;
  overflow-y: auto;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #fafafa;
  transition: all 0.2s ease;
}

.ranking-item:hover {
  background: #f0f5ff;
}

.ranking-item.top-three {
  background: linear-gradient(135deg, #fff8e6 0%, #fff 100%);
}

.rank-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  background: #e4e7ed;
  color: #909399;
}

.rank-badge.rank-1 {
  background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);
  color: white;
}

.rank-badge.rank-2 {
  background: linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%);
  color: white;
}

.rank-badge.rank-3 {
  background: linear-gradient(135deg, #cd7f32 0%, #d4a574 100%);
  color: white;
}

.dealer-info {
  flex: 1;
}

.dealer-name {
  font-weight: 500;
  color: #303133;
}

.dealer-stats {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.device-count {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
}

/* 响应式 */
@media (max-width: 768px) {
  .water-purifier-dashboard {
    padding: 12px;
    gap: 12px;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .metric-value {
    font-size: 22px;
  }

  .chart-panel {
    height: auto;
    min-height: 320px;
    margin-bottom: 12px;
  }

  .alerts-panel,
  .ranking-panel {
    height: auto;
    min-height: 300px;
    margin-bottom: 12px;
  }
}
</style>
