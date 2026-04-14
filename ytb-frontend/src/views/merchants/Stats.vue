<template>
  <div class="merchant-stats">
    <el-card shadow="never" class="control-card">
      <div class="controls">
        <div class="label">
          <span>时间范围</span>
        </div>
        <el-radio-group v-model="days" size="small" @change="handleDaysChange">
          <el-radio-button v-for="option in daysOptions" :key="option" :label="option">
            {{ option }} 日
          </el-radio-button>
        </el-radio-group>
        <div class="refresh">
          <el-button :loading="loading" size="small" @click="fetchTrend">刷新</el-button>
        </div>
      </div>
      <div class="summary">
        <div class="summary-item">
          <div class="summary-label">今日进件</div>
          <div class="summary-value">{{ todaySubmitted }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">今日审核通过</div>
          <div class="summary-value success">{{ todayApproved }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">最近 {{ days }} 日累计进件</div>
          <div class="summary-value">{{ totalSubmitted }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">最近 {{ days }} 日累计通过</div>
          <div class="summary-value success">{{ totalApproved }}</div>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="chart-card" :body-style="{ padding: 0 }">
      <div ref="chartRef" class="trend-chart"></div>
      <el-empty v-if="!loading && trendData.labels.length === 0" description="暂无数据" />
      <div v-if="loading" class="chart-loading">
        <el-skeleton animated :rows="6" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import merchantApi from '@/api/v1/merchant'

const chartRef = ref(null)
let chartInstance = null

const loading = ref(false)
const daysOptions = [7, 30]
const days = ref(30)

const trendData = ref({
  labels: [],
  submitted: [],
  approved: []
})

const todaySubmitted = computed(() => trendData.value.submitted.at(-1) ?? 0)
const todayApproved = computed(() => trendData.value.approved.at(-1) ?? 0)
const totalSubmitted = computed(() => trendData.value.submitted.reduce((sum, value) => sum + value, 0))
const totalApproved = computed(() => trendData.value.approved.reduce((sum, value) => sum + value, 0))

const initChart = () => {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
}

const setChartOption = () => {
  if (!chartInstance) return
  const submittedColor = '#6366F1'
  const approvedColor = '#22C55E'

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['进件量', '审核通过量'],
      icon: 'circle'
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '3%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.value.labels
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: '进件量',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 3, color: submittedColor },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(99, 102, 241, 0.25)' },
            { offset: 1, color: 'rgba(99, 102, 241, 0)' }
          ])
        },
        data: trendData.value.submitted
      },
      {
        name: '审核通过量',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 3, color: approvedColor },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(34, 197, 94, 0.25)' },
            { offset: 1, color: 'rgba(34, 197, 94, 0)' }
          ])
        },
        data: trendData.value.approved
      }
    ]
  }

  chartInstance.setOption(option)
}

const fetchTrend = async () => {
  loading.value = true
  try {
    const response = await merchantApi.getStatsTrend({ days: days.value })
    if (response.code !== 0) {
      throw new Error(response.message || '获取数据失败')
    }
    trendData.value = {
      labels: response.data?.labels ?? [],
      submitted: response.data?.submitted ?? [],
      approved: response.data?.approved ?? []
    }
  } catch (error) {
    console.error('加载商户统计趋势失败:', error)
    ElMessage.error(error?.message || '加载商户统计趋势失败')
  } finally {
    loading.value = false
  }
}

const handleDaysChange = () => {
  fetchTrend()
}

const resizeChart = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  initChart()
  fetchTrend()
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

watch(
  () => trendData.value,
  () => {
    initChart()
    setChartOption()
  },
  { deep: true }
)
</script>

<style scoped>
.merchant-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.control-card {
  padding-bottom: 10px;
}

.controls {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.controls .label {
  color: #6b7280;
  font-size: 14px;
}

.controls .refresh {
  margin-left: auto;
}

.summary {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  margin-top: 16px;
}

.summary-item {
  background: #f9fafb;
  border-radius: 10px;
  padding: 12px;
  text-align: center;
}

.summary-label {
  color: #6b7280;
  font-size: 13px;
  margin-bottom: 6px;
}

.summary-value {
  color: #111827;
  font-size: 22px;
  font-weight: 600;
}

.summary-value.success {
  color: #16a34a;
}

.chart-card {
  min-height: 420px;
  position: relative;
}

.trend-chart {
  height: 420px;
  width: 100%;
}

.chart-loading {
  left: 0;
  padding: 16px;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}
</style>
