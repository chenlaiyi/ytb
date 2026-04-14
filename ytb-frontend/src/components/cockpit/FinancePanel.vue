<template>
  <div class="finance-panel">
    <el-row :gutter="20" v-loading="loading">
      <!-- 财务核心指标 -->
      <el-col :xs="24" :sm="12" :md="6" v-for="metric in financeMetrics" :key="metric.key">
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

    <!-- 收入分析图表 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :md="16">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>收入趋势分析</span>
              <div class="header-actions">
                <el-radio-group v-model="revenuePeriod" size="small" @change="updateRevenueChart">
                  <el-radio-button label="7d">近7天</el-radio-button>
                  <el-radio-button label="30d">近30天</el-radio-button>
                  <el-radio-button label="90d">近90天</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>
          <div ref="revenueTrendChart" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :md="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <span>收入来源分布</span>
          </template>
          <div ref="revenueSourceChart" class="chart-container small"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 财务详细统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :md="8">
        <el-card class="stats-card" shadow="never">
          <template #header>
            <span>收入构成</span>
          </template>
          <div class="revenue-breakdown">
            <div class="breakdown-item" v-for="item in revenueBreakdown" :key="item.type">
              <div class="breakdown-info">
                <div class="breakdown-label">{{ item.name }}</div>
                <div class="breakdown-amount">¥{{ item.amount.toLocaleString() }}</div>
              </div>
              <div class="breakdown-percentage">{{ item.percentage }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :md="8">
        <el-card class="stats-card" shadow="never">
          <template #header>
            <span>成本分析</span>
          </template>
          <div class="cost-analysis">
            <div class="cost-item" v-for="item in costAnalysis" :key="item.type">
              <div class="cost-label">{{ item.name }}</div>
              <div class="cost-value">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: item.percentage + '%', backgroundColor: item.color }"></div>
                </div>
                <span class="amount">¥{{ item.amount.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :md="8">
        <el-card class="stats-card" shadow="never">
          <template #header>
            <span>利润分析</span>
          </template>
          <div ref="profitChart" class="chart-container small"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- VIP分红财务统计 -->
    <el-row :gutter="20" class="dividend-row">
      <el-col :xs="24">
        <el-card class="dividend-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>VIP分红财务统计</span>
              <el-tag type="warning" size="small">本月分红池: ¥{{ (data.dividend_pool || 0).toLocaleString() }}</el-tag>
            </div>
          </template>
          <div class="dividend-content">
            <el-row :gutter="20">
              <el-col :xs="24" :md="6">
                <div class="dividend-summary">
                  <h4>分红概览</h4>
                  <div class="summary-stats">
                    <div class="summary-item">
                      <span class="label">总分红池</span>
                      <span class="value">¥{{ (data.total_dividend_pool || 0).toLocaleString() }}</span>
                    </div>
                    <div class="summary-item">
                      <span class="label">已发放</span>
                      <span class="value distributed">¥{{ (data.distributed_dividend || 0).toLocaleString() }}</span>
                    </div>
                    <div class="summary-item">
                      <span class="label">待发放</span>
                      <span class="value pending">¥{{ (data.pending_dividend || 0).toLocaleString() }}</span>
                    </div>
                    <div class="summary-item">
                      <span class="label">参与人数</span>
                      <span class="value">{{ data.dividend_participants || 0 }}人</span>
                    </div>
                  </div>
                </div>
              </el-col>
              <el-col :xs="24" :md="18">
                <div ref="dividendFinanceChart" class="chart-container"></div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { CreditCard, TrendCharts, Coin, PieChart } from '@element-plus/icons-vue'
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
const revenueTrendChart = ref(null)
const revenueSourceChart = ref(null)
const profitChart = ref(null)
const dividendFinanceChart = ref(null)

// 图表实例
let revenueTrendChartInstance = null
let revenueSourceChartInstance = null
let profitChartInstance = null
let dividendFinanceChartInstance = null

// 收入周期
const revenuePeriod = ref('30d')

// 财务核心指标
const financeMetrics = computed(() => [
  {
    key: 'totalRevenue',
    title: '总收入',
    subtitle: `今日收入 ¥${(props.data.today_revenue || 0).toLocaleString()}`,
    value: props.data.total_revenue || 0,
    type: 'currency',
    icon: CreditCard,
    iconClass: 'revenue-icon'
  },
  {
    key: 'totalProfit',
    title: '总利润',
    subtitle: `利润率 ${props.data.profit_margin || 0}%`,
    value: props.data.total_profit || 0,
    type: 'currency',
    icon: TrendCharts,
    iconClass: 'profit-icon'
  },
  {
    key: 'totalCost',
    title: '总成本',
    subtitle: `成本率 ${props.data.cost_ratio || 0}%`,
    value: props.data.total_cost || 0,
    type: 'currency',
    icon: PieChart,
    iconClass: 'cost-icon'
  },
  {
    key: 'dividendAmount',
    title: '分红总额',
    subtitle: `本月分红 ¥${(props.data.month_dividend || 0).toLocaleString()}`,
    value: props.data.total_dividend || 0,
    type: 'currency',
    icon: Coin,
    iconClass: 'dividend-icon'
  }
])

// 收入构成
const revenueBreakdown = computed(() => props.data.revenue_breakdown || [])

// 成本分析
const costAnalysis = computed(() => props.data.cost_analysis || [])

// 格式化数值
const formatValue = (value, type) => {
  if (type === 'currency') {
    return `¥${(value || 0).toLocaleString()}`
  }
  return (value || 0).toLocaleString()
}

// 初始化收入趋势图表
const initRevenueTrendChart = () => {
  if (!revenueTrendChart.value) return
  
  revenueTrendChartInstance = echarts.init(revenueTrendChart.value)
  updateRevenueChart()
}

// 更新收入趋势图表
const updateRevenueChart = () => {
  if (!revenueTrendChartInstance) return
  
  const trendData = props.data.revenue_trend?.[revenuePeriod.value] || {}
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['收入', '利润', '成本']
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
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [
      {
        name: '收入',
        type: 'line',
        smooth: true,
        data: trendData.revenue || [],
        itemStyle: { color: '#409EFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        }
      },
      {
        name: '利润',
        type: 'line',
        smooth: true,
        data: trendData.profit || [],
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '成本',
        type: 'line',
        smooth: true,
        data: trendData.cost || [],
        itemStyle: { color: '#F56C6C' }
      }
    ]
  }
  revenueTrendChartInstance.setOption(option)
}

// 初始化收入来源分布图表
const initRevenueSourceChart = () => {
  if (!revenueSourceChart.value) return
  
  revenueSourceChartInstance = echarts.init(revenueSourceChart.value)
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
    },
    series: [{
      name: '收入来源',
      type: 'pie',
      radius: ['40%', '70%'],
      data: props.data.revenue_sources || [],
      itemStyle: {
        borderRadius: 5,
        borderColor: '#fff',
        borderWidth: 2
      }
    }]
  }
  revenueSourceChartInstance.setOption(option)
}

// 初始化利润分析图表
const initProfitChart = () => {
  if (!profitChart.value) return
  
  profitChartInstance = echarts.init(profitChart.value)
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
    },
    series: [{
      name: '利润分析',
      type: 'pie',
      radius: ['30%', '60%'],
      data: props.data.profit_analysis || [],
      itemStyle: {
        borderRadius: 3,
        borderColor: '#fff',
        borderWidth: 1
      }
    }]
  }
  profitChartInstance.setOption(option)
}

// 初始化分红财务图表
const initDividendFinanceChart = () => {
  if (!dividendFinanceChart.value) return
  
  dividendFinanceChartInstance = echarts.init(dividendFinanceChart.value)
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['招募分红', '充值分红', '总分红池']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.data.dividend_finance_trend?.dates || []
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [
      {
        name: '招募分红',
        type: 'bar',
        stack: 'dividend',
        data: props.data.dividend_finance_trend?.recruit || [],
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '充值分红',
        type: 'bar',
        stack: 'dividend',
        data: props.data.dividend_finance_trend?.recharge || [],
        itemStyle: { color: '#E6A23C' }
      },
      {
        name: '总分红池',
        type: 'line',
        data: props.data.dividend_finance_trend?.total || [],
        itemStyle: { color: '#F56C6C' }
      }
    ]
  }
  dividendFinanceChartInstance.setOption(option)
}

// 初始化所有图表
const initAllCharts = () => {
  nextTick(() => {
    initRevenueTrendChart()
    initRevenueSourceChart()
    initProfitChart()
    initDividendFinanceChart()
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
  revenueTrendChartInstance?.resize()
  revenueSourceChartInstance?.resize()
  profitChartInstance?.resize()
  dividendFinanceChartInstance?.resize()
})
</script>

<style lang="scss" scoped>
.finance-panel {
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

        &.revenue-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        &.profit-icon {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
        }

        &.cost-icon {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }

        &.dividend-icon {
          background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
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

  .charts-row, .stats-row, .dividend-row {
    margin-top: 20px;
  }

  .chart-card, .stats-card, .dividend-card {
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

  .revenue-breakdown {
    .breakdown-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .breakdown-info {
        flex: 1;

        .breakdown-label {
          font-size: 14px;
          color: #374151;
          margin-bottom: 4px;
        }

        .breakdown-amount {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
      }

      .breakdown-percentage {
        font-size: 14px;
        color: #6b7280;
        background: #f3f4f6;
        padding: 4px 8px;
        border-radius: 4px;
      }
    }
  }

  .cost-analysis {
    .cost-item {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .cost-label {
        font-size: 14px;
        color: #374151;
        margin-bottom: 8px;
      }

      .cost-value {
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

        .amount {
          font-size: 12px;
          color: #6b7280;
          min-width: 80px;
          text-align: right;
        }
      }
    }
  }

  .dividend-content {
    .dividend-summary {
      h4 {
        margin: 0 0 16px 0;
        font-size: 16px;
        color: #374151;
      }

      .summary-stats {
        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          .label {
            font-size: 14px;
            color: #6b7280;
          }

          .value {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;

            &.distributed {
              color: #67c23a;
            }

            &.pending {
              color: #e6a23c;
            }
          }
        }
      }
    }
  }
}
</style>
