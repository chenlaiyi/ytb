<template>
  <div class="orders-panel">
    <el-row :gutter="20" v-loading="loading">
      <!-- 订单核心指标 -->
      <el-col :xs="24" :sm="12" :md="6" v-for="metric in orderMetrics" :key="metric.key">
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

    <!-- 订单趋势和分析 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :md="16">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>订单趋势分析</span>
              <div class="header-actions">
                <el-radio-group v-model="trendPeriod" size="small" @change="updateTrendChart">
                  <el-radio-button label="7d">近7天</el-radio-button>
                  <el-radio-button label="30d">近30天</el-radio-button>
                  <el-radio-button label="90d">近90天</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>
          <div ref="orderTrendChart" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :md="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <span>订单状态分布</span>
          </template>
          <div ref="orderStatusChart" class="chart-container small"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 订单详细统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :md="12">
        <el-card class="stats-card" shadow="never">
          <template #header>
            <span>订单类型统计</span>
          </template>
          <div class="stats-list">
            <div class="stats-item" v-for="item in orderTypeStats" :key="item.type">
              <div class="stats-label">{{ item.name }}</div>
              <div class="stats-value">
                <span class="count">{{ item.count }}</span>
                <span class="amount">¥{{ item.amount.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :md="12">
        <el-card class="stats-card" shadow="never">
          <template #header>
            <span>热门商品排行</span>
          </template>
          <div class="ranking-list">
            <div class="ranking-item" v-for="(item, index) in topProducts" :key="item.id">
              <div class="ranking-number" :class="`rank-${index + 1}`">{{ index + 1 }}</div>
              <div class="product-info">
                <div class="product-name">{{ item.name }}</div>
                <div class="product-sales">销量: {{ item.sales }}</div>
              </div>
              <div class="product-amount">¥{{ item.amount.toLocaleString() }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { ShoppingCart, CreditCard, TrendCharts, Timer } from '@element-plus/icons-vue'
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
const orderTrendChart = ref(null)
const orderStatusChart = ref(null)

// 图表实例
let orderTrendChartInstance = null
let orderStatusChartInstance = null

// 趋势周期
const trendPeriod = ref('30d')

// 订单核心指标
const orderMetrics = computed(() => [
  {
    key: 'totalOrders',
    title: '总订单数',
    subtitle: `今日新增 ${props.data.today_orders || 0}`,
    value: props.data.total_orders || 0,
    type: 'number',
    icon: ShoppingCart,
    iconClass: 'order-icon'
  },
  {
    key: 'paidOrders',
    title: '已支付订单',
    subtitle: `支付率 ${props.data.payment_rate || 0}%`,
    value: props.data.paid_orders || 0,
    type: 'number',
    icon: CreditCard,
    iconClass: 'paid-icon'
  },
  {
    key: 'totalAmount',
    title: '订单总金额',
    subtitle: `今日收入 ¥${(props.data.today_amount || 0).toLocaleString()}`,
    value: props.data.total_amount || 0,
    type: 'currency',
    icon: TrendCharts,
    iconClass: 'amount-icon'
  },
  {
    key: 'avgOrderValue',
    title: '平均订单价值',
    subtitle: `较昨日 ${props.data.aov_change > 0 ? '+' : ''}${props.data.aov_change || 0}%`,
    value: props.data.avg_order_value || 0,
    type: 'currency',
    icon: Timer,
    iconClass: 'avg-icon'
  }
])

// 订单类型统计
const orderTypeStats = computed(() => props.data.order_types || [])

// 热门商品排行
const topProducts = computed(() => props.data.top_products || [])

// 格式化数值
const formatValue = (value, type) => {
  if (type === 'currency') {
    return `¥${(value || 0).toLocaleString()}`
  }
  return (value || 0).toLocaleString()
}

// 初始化订单趋势图表
const initOrderTrendChart = () => {
  if (!orderTrendChart.value) return
  
  orderTrendChartInstance = echarts.init(orderTrendChart.value)
  updateTrendChart()
}

// 更新趋势图表
const updateTrendChart = () => {
  if (!orderTrendChartInstance) return
  
  const trendData = props.data.order_trend?.[trendPeriod.value] || {}
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['订单数量', '订单金额']
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
    },
    yAxis: [
      {
        type: 'value',
        name: '订单数量',
        position: 'left'
      },
      {
        type: 'value',
        name: '订单金额',
        position: 'right',
        axisLabel: {
          formatter: '¥{value}'
        }
      }
    ],
    series: [
      {
        name: '订单数量',
        type: 'bar',
        data: trendData.orders || [],
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '订单金额',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: trendData.amounts || [],
        itemStyle: {
          color: '#67C23A'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
          ])
        }
      }
    ]
  }
  orderTrendChartInstance.setOption(option)
}

// 初始化订单状态分布图表
const initOrderStatusChart = () => {
  if (!orderStatusChart.value) return
  
  orderStatusChartInstance = echarts.init(orderStatusChart.value)
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: '订单状态',
      type: 'pie',
      radius: ['40%', '70%'],
      data: props.data.order_status || [],
      itemStyle: {
        borderRadius: 5,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}\n{d}%'
      }
    }]
  }
  orderStatusChartInstance.setOption(option)
}

// 初始化所有图表
const initAllCharts = () => {
  nextTick(() => {
    initOrderTrendChart()
    initOrderStatusChart()
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
  orderTrendChartInstance?.resize()
  orderStatusChartInstance?.resize()
})
</script>

<style lang="scss" scoped>
.orders-panel {
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

        &.order-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        &.paid-icon {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }

        &.amount-icon {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
        }

        &.avg-icon {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
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

  .charts-row {
    margin-top: 20px;
  }

  .stats-row {
    margin-top: 20px;
  }

  .chart-card, .stats-card {
    border-radius: 8px;
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 500;
    }

    .chart-container {
      height: 350px;

      &.small {
        height: 300px;
      }
    }
  }

  .stats-list {
    .stats-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .stats-label {
        font-size: 14px;
        color: #374151;
      }

      .stats-value {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;

        .count {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .amount {
          font-size: 12px;
          color: #6b7280;
        }
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

      .product-info {
        flex: 1;

        .product-name {
          font-size: 14px;
          color: #374151;
          margin-bottom: 2px;
        }

        .product-sales {
          font-size: 12px;
          color: #6b7280;
        }
      }

      .product-amount {
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
      }
    }
  }
}
</style>
