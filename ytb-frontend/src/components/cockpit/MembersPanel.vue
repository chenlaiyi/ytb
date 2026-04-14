<template>
  <div class="members-panel">
    <el-row :gutter="20" v-loading="loading">
      <!-- 会员核心指标 -->
      <el-col :xs="24" :sm="12" :md="6" v-for="metric in memberMetrics" :key="metric.key">
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

    <!-- 会员分析图表 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :md="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <span>会员增长趋势</span>
          </template>
          <div ref="memberGrowthChart" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :md="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <span>VIP分红统计</span>
          </template>
          <div ref="dividendChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 会员详细统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :md="8">
        <el-card class="stats-card" shadow="never">
          <template #header>
            <span>会员等级分布</span>
          </template>
          <div ref="memberLevelChart" class="chart-container small"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :md="8">
        <el-card class="stats-card" shadow="never">
          <template #header>
            <span>活跃度统计</span>
          </template>
          <div class="activity-stats">
            <div class="activity-item" v-for="item in activityStats" :key="item.type">
              <div class="activity-label">{{ item.name }}</div>
              <div class="activity-value">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: item.percentage + '%', backgroundColor: item.color }"></div>
                </div>
                <span class="percentage">{{ item.percentage }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :md="8">
        <el-card class="stats-card" shadow="never">
          <template #header>
            <span>VIP招募排行</span>
          </template>
          <div class="ranking-list">
            <div class="ranking-item" v-for="(item, index) in topRecruiters" :key="item.id">
              <div class="ranking-number" :class="`rank-${index + 1}`">{{ index + 1 }}</div>
              <div class="recruiter-info">
                <div class="recruiter-name">{{ item.name }}</div>
                <div class="recruiter-stats">招募 {{ item.recruits }} 人</div>
              </div>
              <div class="recruiter-reward">¥{{ item.reward.toLocaleString() }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- VIP分红详情 -->
    <el-row :gutter="20" class="dividend-row">
      <el-col :xs="24">
        <el-card class="dividend-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>VIP分红详情</span>
              <el-tag type="success" size="small">本月分红池: ¥{{ (data.dividend_pool || 0).toLocaleString() }}</el-tag>
            </div>
          </template>
          <div class="dividend-content">
            <el-row :gutter="20">
              <el-col :xs="24" :md="8">
                <div class="dividend-summary">
                  <h4>分红等级统计</h4>
                  <div class="level-stats">
                    <div class="level-item" v-for="level in dividendLevels" :key="level.name">
                      <div class="level-info">
                        <span class="level-name">{{ level.name }}</span>
                        <span class="level-count">{{ level.count }}人</span>
                      </div>
                      <div class="level-amount">¥{{ level.amount.toLocaleString() }}</div>
                    </div>
                  </div>
                </div>
              </el-col>
              <el-col :xs="24" :md="16">
                <div ref="dividendTrendChart" class="chart-container"></div>
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
import { User, Avatar, TrendCharts, Coin } from '@element-plus/icons-vue'
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
const memberGrowthChart = ref(null)
const dividendChart = ref(null)
const memberLevelChart = ref(null)
const dividendTrendChart = ref(null)

// 图表实例
let memberGrowthChartInstance = null
let dividendChartInstance = null
let memberLevelChartInstance = null
let dividendTrendChartInstance = null

// 会员核心指标
const memberMetrics = computed(() => [
  {
    key: 'totalMembers',
    title: '总会员数',
    subtitle: `今日新增 ${props.data.today_new_members || 0}`,
    value: props.data.total_members || 0,
    type: 'number',
    icon: User,
    iconClass: 'member-icon'
  },
  {
    key: 'vipMembers',
    title: 'VIP会员数',
    subtitle: `VIP率 ${props.data.vip_rate || 0}%`,
    value: props.data.vip_members || 0,
    type: 'number',
    icon: Avatar,
    iconClass: 'vip-icon'
  },
  {
    key: 'activeMembers',
    title: '活跃会员',
    subtitle: `活跃率 ${props.data.active_rate || 0}%`,
    value: props.data.active_members || 0,
    type: 'number',
    icon: TrendCharts,
    iconClass: 'active-icon'
  },
  {
    key: 'dividendPool',
    title: '本月分红池',
    subtitle: `已发放 ¥${(props.data.distributed_dividend || 0).toLocaleString()}`,
    value: props.data.dividend_pool || 0,
    type: 'currency',
    icon: Coin,
    iconClass: 'dividend-icon'
  }
])

// 活跃度统计
const activityStats = computed(() => props.data.activity_stats || [])

// VIP招募排行
const topRecruiters = computed(() => props.data.top_recruiters || [])

// 分红等级统计
const dividendLevels = computed(() => props.data.dividend_levels || [])

// 格式化数值
const formatValue = (value, type) => {
  if (type === 'currency') {
    return `¥${(value || 0).toLocaleString()}`
  }
  return (value || 0).toLocaleString()
}

// 初始化会员增长趋势图表
const initMemberGrowthChart = () => {
  if (!memberGrowthChart.value) return
  
  memberGrowthChartInstance = echarts.init(memberGrowthChart.value)
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['普通会员', 'VIP会员']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.data.member_trend?.dates || []
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '普通会员',
        type: 'line',
        smooth: true,
        data: props.data.member_trend?.regular || [],
        itemStyle: { color: '#409EFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        }
      },
      {
        name: 'VIP会员',
        type: 'line',
        smooth: true,
        data: props.data.member_trend?.vip || [],
        itemStyle: { color: '#F56C6C' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
            { offset: 1, color: 'rgba(245, 108, 108, 0.1)' }
          ])
        }
      }
    ]
  }
  memberGrowthChartInstance.setOption(option)
}

// 初始化VIP分红统计图表
const initDividendChart = () => {
  if (!dividendChart.value) return
  
  dividendChartInstance = echarts.init(dividendChart.value)
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        return `${params[0].name}<br/>分红金额: ¥${params[0].value.toLocaleString()}`
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
      data: props.data.dividend_trend?.dates || []
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [{
      name: '分红金额',
      type: 'bar',
      data: props.data.dividend_trend?.amounts || [],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#FFD700' },
          { offset: 1, color: '#FFA500' }
        ])
      }
    }]
  }
  dividendChartInstance.setOption(option)
}

// 初始化会员等级分布图表
const initMemberLevelChart = () => {
  if (!memberLevelChart.value) return
  
  memberLevelChartInstance = echarts.init(memberLevelChart.value)
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: '会员等级',
      type: 'pie',
      radius: ['40%', '70%'],
      data: props.data.member_levels || [],
      itemStyle: {
        borderRadius: 5,
        borderColor: '#fff',
        borderWidth: 2
      }
    }]
  }
  memberLevelChartInstance.setOption(option)
}

// 初始化分红趋势图表
const initDividendTrendChart = () => {
  if (!dividendTrendChart.value) return
  
  dividendTrendChartInstance = echarts.init(dividendTrendChart.value)
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['招募分红', '充值分红']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.data.dividend_detail?.dates || []
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
        data: props.data.dividend_detail?.recruit || [],
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '充值分红',
        type: 'bar',
        stack: 'dividend',
        data: props.data.dividend_detail?.recharge || [],
        itemStyle: { color: '#E6A23C' }
      }
    ]
  }
  dividendTrendChartInstance.setOption(option)
}

// 初始化所有图表
const initAllCharts = () => {
  nextTick(() => {
    initMemberGrowthChart()
    initDividendChart()
    initMemberLevelChart()
    initDividendTrendChart()
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
  memberGrowthChartInstance?.resize()
  dividendChartInstance?.resize()
  memberLevelChartInstance?.resize()
  dividendTrendChartInstance?.resize()
})
</script>

<style lang="scss" scoped>
.members-panel {
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

        &.member-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        &.vip-icon {
          background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
          color: white;
        }

        &.active-icon {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
        }

        &.dividend-icon {
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

  .activity-stats {
    .activity-item {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .activity-label {
        font-size: 14px;
        color: #374151;
        margin-bottom: 8px;
      }

      .activity-value {
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
          min-width: 35px;
          text-align: right;
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

      .recruiter-info {
        flex: 1;

        .recruiter-name {
          font-size: 14px;
          color: #374151;
          margin-bottom: 2px;
        }

        .recruiter-stats {
          font-size: 12px;
          color: #6b7280;
        }
      }

      .recruiter-reward {
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
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

      .level-stats {
        .level-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          .level-info {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .level-name {
              font-size: 14px;
              color: #374151;
            }

            .level-count {
              font-size: 12px;
              color: #6b7280;
            }
          }

          .level-amount {
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
          }
        }
      }
    }
  }
}
</style>
