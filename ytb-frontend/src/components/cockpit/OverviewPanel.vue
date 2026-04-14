<template>
  <div class="overview-panel">
    <el-row :gutter="20" v-loading="loading">
      <!-- 核心指标卡片 -->
      <el-col :xs="24" :sm="12" :md="6" v-for="metric in coreMetrics" :key="metric.key">
        <el-card class="metric-card" shadow="hover">
          <div class="metric-content">
            <div class="metric-icon" :class="metric.iconClass">
              <el-icon :size="24">
                <component :is="metric.icon" />
              </el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ formatValue(metric.value, metric.type) }}</div>
              <div class="metric-title">{{ metric.title }}</div>
              <div class="metric-trend" :class="getTrendClass(metric.trend)">
                <el-icon><ArrowUp v-if="metric.trend > 0" /><ArrowDown v-else /></el-icon>
                {{ Math.abs(metric.trend) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 趋势图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :md="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>用户增长趋势</span>
              <el-tag size="small" type="success">近30天</el-tag>
            </div>
          </template>
          <div ref="userTrendChart" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :md="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>收入趋势</span>
              <el-tag size="small" type="warning">近30天</el-tag>
            </div>
          </template>
          <div ref="revenueTrendChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 业务分布图表 -->
    <el-row :gutter="20" class="distribution-row">
      <el-col :xs="24" :md="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <span>用户类型分布</span>
          </template>
          <div ref="userTypeChart" class="chart-container small"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :md="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <span>设备状态分布</span>
          </template>
          <div ref="deviceStatusChart" class="chart-container small"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :md="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <span>分支机构分布</span>
          </template>
          <div ref="branchChart" class="chart-container small"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { User, ShoppingCart, CreditCard, Monitor, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// 图表实例引用
const userTrendChart = ref(null)
const revenueTrendChart = ref(null)
const userTypeChart = ref(null)
const deviceStatusChart = ref(null)
const branchChart = ref(null)

// 图表实例
let userTrendChartInstance = null
let revenueTrendChartInstance = null
let userTypeChartInstance = null
let deviceStatusChartInstance = null
let branchChartInstance = null

// 核心指标计算
const coreMetrics = computed(() => [
  {
    key: 'totalUsers',
    title: '总用户数',
    value: props.data.total_users || 0,
    type: 'number',
    trend: props.data.user_growth_rate || 0,
    icon: User,
    iconClass: 'user-icon'
  },
  {
    key: 'totalRevenue',
    title: '总收入',
    value: props.data.total_revenue || 0,
    type: 'currency',
    trend: props.data.revenue_growth_rate || 0,
    icon: CreditCard,
    iconClass: 'revenue-icon'
  },
  {
    key: 'totalOrders',
    title: '总订单',
    value: props.data.total_orders || 0,
    type: 'number',
    trend: props.data.order_growth_rate || 0,
    icon: ShoppingCart,
    iconClass: 'order-icon'
  },
  {
    key: 'totalDevices',
    title: '总设备',
    value: props.data.total_devices || 0,
    type: 'number',
    trend: props.data.device_growth_rate || 0,
    icon: Monitor,
    iconClass: 'device-icon'
  }
])

// 格式化数值
const formatValue = (value, type) => {
  if (type === 'currency') {
    return `¥${(value || 0).toLocaleString()}`
  }
  return (value || 0).toLocaleString()
}

// 获取趋势样式类
const getTrendClass = (trend) => {
  return trend > 0 ? 'positive' : 'negative'
}

// 初始化用户趋势图表
const initUserTrendChart = () => {
  if (!userTrendChart.value) return
  
  userTrendChartInstance = echarts.init(userTrendChart.value)
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.data.user_trend?.dates || []
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: '新增用户',
      type: 'line',
      smooth: true,
      data: props.data.user_trend?.values || [],
      itemStyle: {
        color: '#409EFF'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
        ])
      }
    }]
  }
  userTrendChartInstance.setOption(option)
}

// 初始化收入趋势图表
const initRevenueTrendChart = () => {
  if (!revenueTrendChart.value) return
  
  revenueTrendChartInstance = echarts.init(revenueTrendChart.value)
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: function(params) {
        return `${params[0].name}<br/>收入: ¥${params[0].value.toLocaleString()}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.data.revenue_trend?.dates || []
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
      data: props.data.revenue_trend?.values || [],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#67C23A' },
          { offset: 1, color: '#85CE61' }
        ])
      }
    }]
  }
  revenueTrendChartInstance.setOption(option)
}

// 初始化用户类型分布图表
const initUserTypeChart = () => {
  if (!userTypeChart.value) return
  
  userTypeChartInstance = echarts.init(userTypeChart.value)
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: '用户类型',
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: props.data.vip_users || 0, name: 'CP用户' },
        { value: props.data.regular_users || 0, name: '普通用户' }
      ],
      itemStyle: {
        borderRadius: 5,
        borderColor: '#fff',
        borderWidth: 2
      }
    }]
  }
  userTypeChartInstance.setOption(option)
}

// 初始化设备状态分布图表
const initDeviceStatusChart = () => {
  if (!deviceStatusChart.value) return
  
  deviceStatusChartInstance = echarts.init(deviceStatusChart.value)
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: '设备状态',
      type: 'pie',
      radius: ['40%', '70%'],
      data: props.data.device_status || [],
      itemStyle: {
        borderRadius: 5,
        borderColor: '#fff',
        borderWidth: 2
      }
    }]
  }
  deviceStatusChartInstance.setOption(option)
}

// 初始化分支机构分布图表
const initBranchChart = () => {
  if (!branchChart.value) return
  
  branchChartInstance = echarts.init(branchChart.value)
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: '分支机构',
      type: 'pie',
      radius: ['40%', '70%'],
      data: props.data.branch_distribution || [],
      itemStyle: {
        borderRadius: 5,
        borderColor: '#fff',
        borderWidth: 2
      }
    }]
  }
  branchChartInstance.setOption(option)
}

// 初始化所有图表
const initAllCharts = () => {
  nextTick(() => {
    initUserTrendChart()
    initRevenueTrendChart()
    initUserTypeChart()
    initDeviceStatusChart()
    initBranchChart()
  })
}

// 监听数据变化
watch(() => props.data, () => {
  if (Object.keys(props.data).length > 0) {
    initAllCharts()
  }
}, { deep: true })

// 组件挂载
onMounted(() => {
  if (Object.keys(props.data).length > 0) {
    initAllCharts()
  }
})

// 窗口大小改变时重新调整图表
window.addEventListener('resize', () => {
  userTrendChartInstance?.resize()
  revenueTrendChartInstance?.resize()
  userTypeChartInstance?.resize()
  deviceStatusChartInstance?.resize()
  branchChartInstance?.resize()
})
</script>

<style lang="scss" scoped>
.overview-panel {
  .metric-card {
    margin-bottom: 20px;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
    }

    .metric-content {
      display: flex;
      align-items: center;
      gap: 16px;

      .metric-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;

        &.user-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        &.revenue-icon {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }

        &.order-icon {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
        }

        &.device-icon {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          color: white;
        }
      }

      .metric-info {
        flex: 1;

        .metric-value {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .metric-title {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .metric-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 500;

          &.positive {
            color: #67c23a;
          }

          &.negative {
            color: #f56c6c;
          }
        }
      }
    }
  }

  .charts-row {
    margin-top: 20px;
  }

  .distribution-row {
    margin-top: 20px;
  }

  .chart-card {
    border-radius: 8px;
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 500;
    }

    .chart-container {
      height: 300px;

      &.small {
        height: 250px;
      }
    }
  }
}
</style>
