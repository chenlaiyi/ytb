<template>
  <div class="devices-panel">
    <el-row :gutter="20" v-loading="loading">
      <!-- 设备核心指标 -->
      <el-col :xs="24" :sm="12" :md="6" v-for="metric in deviceMetrics" :key="metric.key">
        <el-card class="metric-card" shadow="hover">
          <div class="metric-content">
            <div class="metric-icon" :class="metric.iconClass">
              <el-icon :size="20">
                <component :is="metric.icon" />
              </el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ formatValue(metric.value, metric.type) }}</div>
              <div class="metric-title">{{ metric.title }}</div>
              <div class="metric-subtitle">{{ metric.subtitle }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 设备状态和分布 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :md="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <span>设备状态分布</span>
          </template>
          <div ref="deviceStatusChart" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :md="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <span>设备类型分布</span>
          </template>
          <div ref="deviceTypeChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 设备运营统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :md="8">
        <el-card class="stats-card" shadow="never">
          <template #header>
            <span>设备使用排行</span>
          </template>
          <div class="ranking-list">
            <div class="ranking-item" v-for="(item, index) in topDevices" :key="item.id">
              <div class="ranking-number" :class="`rank-${index + 1}`">{{ index + 1 }}</div>
              <div class="device-info">
                <div class="device-name">{{ item.name }}</div>
                <div class="device-location">{{ item.location }}</div>
              </div>
              <div class="device-usage">{{ item.usage }}L</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :md="8">
        <el-card class="stats-card" shadow="never">
          <template #header>
            <span>设备健康度</span>
          </template>
          <div class="health-stats">
            <div class="health-item" v-for="item in healthStats" :key="item.status">
              <div class="health-label">{{ item.name }}</div>
              <div class="health-value">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: item.percentage + '%', backgroundColor: item.color }"></div>
                </div>
                <span class="percentage">{{ item.count }}台</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :md="8">
        <el-card class="stats-card" shadow="never">
          <template #header>
            <span>地区分布</span>
          </template>
          <div ref="regionChart" class="chart-container small"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 设备趋势分析 -->
    <el-row :gutter="20" class="trend-row">
      <el-col :xs="24">
        <el-card class="trend-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>设备运营趋势</span>
              <div class="header-actions">
                <el-radio-group v-model="trendType" size="small" @change="updateTrendChart">
                  <el-radio-button label="usage">使用量</el-radio-button>
                  <el-radio-button label="revenue">收入</el-radio-button>
                  <el-radio-button label="maintenance">维护</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>
          <div ref="deviceTrendChart" class="chart-container large"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Monitor, Connection, Tools, Warning } from '@element-plus/icons-vue'
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
const deviceStatusChart = ref(null)
const deviceTypeChart = ref(null)
const regionChart = ref(null)
const deviceTrendChart = ref(null)

// 图表实例
let deviceStatusChartInstance = null
let deviceTypeChartInstance = null
let regionChartInstance = null
let deviceTrendChartInstance = null

// 趋势类型
const trendType = ref('usage')

// 设备核心指标
const deviceMetrics = computed(() => [
  {
    key: 'totalDevices',
    title: '设备总数',
    subtitle: `今日新增 ${props.data.today_new_devices || 0}`,
    value: props.data.total_devices || 0,
    type: 'number',
    icon: Monitor,
    iconClass: 'device-icon'
  },
  {
    key: 'onlineDevices',
    title: '在线设备',
    subtitle: `在线率 ${props.data.online_rate || 0}%`,
    value: props.data.online_devices || 0,
    type: 'number',
    icon: Connection,
    iconClass: 'online-icon'
  },
  {
    key: 'maintenanceDevices',
    title: '维护设备',
    subtitle: `维护率 ${props.data.maintenance_rate || 0}%`,
    value: props.data.maintenance_devices || 0,
    type: 'number',
    icon: Tools,
    iconClass: 'maintenance-icon'
  },
  {
    key: 'faultDevices',
    title: '故障设备',
    subtitle: `故障率 ${props.data.fault_rate || 0}%`,
    value: props.data.fault_devices || 0,
    type: 'number',
    icon: Warning,
    iconClass: 'fault-icon'
  }
])

// 设备使用排行
const topDevices = computed(() => props.data.top_devices || [])

// 设备健康度统计
const healthStats = computed(() => props.data.health_stats || [])

// 格式化数值
const formatValue = (value, type) => {
  if (type === 'currency') {
    return `¥${(value || 0).toLocaleString()}`
  }
  return (value || 0).toLocaleString()
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
      },
      label: {
        show: true,
        formatter: '{b}\n{c}台'
      }
    }]
  }
  deviceStatusChartInstance.setOption(option)
}

// 初始化设备类型分布图表
const initDeviceTypeChart = () => {
  if (!deviceTypeChart.value) return
  
  deviceTypeChartInstance = echarts.init(deviceTypeChart.value)
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: '设备类型',
      type: 'pie',
      radius: ['40%', '70%'],
      data: props.data.device_types || [],
      itemStyle: {
        borderRadius: 5,
        borderColor: '#fff',
        borderWidth: 2
      }
    }]
  }
  deviceTypeChartInstance.setOption(option)
}

// 初始化地区分布图表
const initRegionChart = () => {
  if (!regionChart.value) return
  
  regionChartInstance = echarts.init(regionChart.value)
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: '地区分布',
      type: 'pie',
      radius: ['30%', '60%'],
      data: props.data.region_distribution || [],
      itemStyle: {
        borderRadius: 3,
        borderColor: '#fff',
        borderWidth: 1
      }
    }]
  }
  regionChartInstance.setOption(option)
}

// 初始化设备趋势图表
const initDeviceTrendChart = () => {
  if (!deviceTrendChart.value) return
  
  deviceTrendChartInstance = echarts.init(deviceTrendChart.value)
  updateTrendChart()
}

// 更新趋势图表
const updateTrendChart = () => {
  if (!deviceTrendChartInstance) return
  
  const trendData = props.data.device_trend?.[trendType.value] || {}
  
  let option = {
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
      data: trendData.dates || []
    }
  }

  if (trendType.value === 'usage') {
    option.yAxis = {
      type: 'value',
      name: '使用量(L)'
    }
    option.series = [{
      name: '使用量',
      type: 'line',
      smooth: true,
      data: trendData.values || [],
      itemStyle: { color: '#409EFF' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
        ])
      }
    }]
  } else if (trendType.value === 'revenue') {
    option.yAxis = {
      type: 'value',
      name: '收入(元)',
      axisLabel: {
        formatter: '¥{value}'
      }
    }
    option.series = [{
      name: '收入',
      type: 'bar',
      data: trendData.values || [],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#67C23A' },
          { offset: 1, color: '#85CE61' }
        ])
      }
    }]
  } else {
    option.yAxis = {
      type: 'value',
      name: '维护次数'
    }
    option.series = [{
      name: '维护次数',
      type: 'line',
      smooth: true,
      data: trendData.values || [],
      itemStyle: { color: '#E6A23C' }
    }]
  }

  deviceTrendChartInstance.setOption(option)
}

// 初始化所有图表
const initAllCharts = () => {
  nextTick(() => {
    initDeviceStatusChart()
    initDeviceTypeChart()
    initRegionChart()
    initDeviceTrendChart()
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
  deviceStatusChartInstance?.resize()
  deviceTypeChartInstance?.resize()
  regionChartInstance?.resize()
  deviceTrendChartInstance?.resize()
})
</script>

<style lang="scss" scoped>
.devices-panel {
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
        width: 50px;
        height: 50px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;

        &.device-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        &.online-icon {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
        }

        &.maintenance-icon {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }

        &.fault-icon {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          color: white;
        }
      }

      .metric-info {
        flex: 1;

        .metric-value {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .metric-title {
          font-size: 14px;
          color: #374151;
          margin-bottom: 4px;
        }

        .metric-subtitle {
          font-size: 12px;
          color: #6b7280;
        }
      }
    }
  }

  .charts-row, .stats-row, .trend-row {
    margin-top: 20px;
  }

  .chart-card, .stats-card, .trend-card {
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

      &.large {
        height: 400px;
      }
    }
  }

  .ranking-list {
    .ranking-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .ranking-number {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: white;

        &.rank-1 {
          background: #ffd700;
        }

        &.rank-2 {
          background: #c0c0c0;
        }

        &.rank-3 {
          background: #cd7f32;
        }

        &:not(.rank-1):not(.rank-2):not(.rank-3) {
          background: #9ca3af;
        }
      }

      .device-info {
        flex: 1;

        .device-name {
          font-size: 14px;
          color: #374151;
          margin-bottom: 2px;
        }

        .device-location {
          font-size: 12px;
          color: #6b7280;
        }
      }

      .device-usage {
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
      }
    }
  }

  .health-stats {
    .health-item {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .health-label {
        font-size: 14px;
        color: #374151;
        margin-bottom: 8px;
      }

      .health-value {
        display: flex;
        align-items: center;
        gap: 12px;

        .progress-bar {
          flex: 1;
          height: 8px;
          background: #f3f4f6;
          border-radius: 4px;
          overflow: hidden;

          .progress-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
          }
        }

        .percentage {
          font-size: 12px;
          color: #6b7280;
          min-width: 40px;
          text-align: right;
        }
      }
    }
  }
}
</style>
