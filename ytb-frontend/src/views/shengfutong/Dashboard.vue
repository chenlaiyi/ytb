<template>
  <div class="dashboard">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="card in statisticsCards" :key="card.title">
        <el-card shadow="hover" class="statistics-card">
          <template #header>
            <div class="card-header">
              <span>{{ card.title }}</span>
              <el-icon><component :is="card.icon" /></el-icon>
            </div>
          </template>
          <div class="card-content">
            <div class="value">{{ card.value }}</div>
            <div class="change" :class="{ 'up': card.change > 0, 'down': card.change < 0 }">
              {{ card.change > 0 ? '+' : '' }}{{ card.change }}%
              <span class="compared">较上月</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <!-- 交易趋势图 -->
      <el-col :span="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span class="title">交易趋势</span>
              <div class="actions">
                <el-radio-group v-model="trendTimeRange" size="small" @change="updateTrendChart">
                  <el-radio-button value="week">本周</el-radio-button>
                  <el-radio-button value="month">本月</el-radio-button>
                  <el-radio-button value="year">全年</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>
          <div class="chart-content">
            <div ref="trendChartRef" style="width: 100%; height: 300px;"></div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 分布饼图 -->
      <el-col :span="8">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span class="title">交易占比</span>
              <el-dropdown>
                <span class="el-dropdown-link">
                  {{ distributionType }}
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="changeDistribution('商户分布')">商户分布</el-dropdown-item>
                    <el-dropdown-item @click="changeDistribution('渠道分布')">渠道分布</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
          <div class="chart-content">
            <div ref="pieChartRef" style="width: 100%; height: 300px;"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 排行榜 -->
    <el-row :gutter="20" class="rank-row">
      <el-col :span="12">
        <el-card shadow="hover" class="rank-card">
          <template #header>
            <div class="rank-header">
              <span class="title">商户排行</span>
              <el-tag size="small" type="success">TOP 10</el-tag>
            </div>
          </template>
          <div class="rank-content">
            <el-table :data="merchantRanking" :show-header="true" size="small">
              <el-table-column width="60">
                <template #header>
                  <span>排名</span>
                </template>
                <template #default="scope">
                  <div class="rank-number" :class="{ 'top3': scope.$index < 3 }">
                    {{ scope.$index + 1 }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="商户" min-width="180">
                <template #default="scope">
                  <div class="merchant-info">
                    <div class="name">{{ scope.row.name }}</div>
                    <div class="number">{{ scope.row.merchant_no }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="reseller" label="所属渠道商" min-width="120" />
              <el-table-column label="交易数据" min-width="180" align="right">
                <template #default="scope">
                  <div class="transaction-info">
                    <div class="amount">¥{{ formatNumber(scope.row.amount) }}</div>
                    <div class="count">{{ scope.row.count }}笔</div>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card shadow="hover" class="rank-card">
          <template #header>
            <div class="rank-header">
              <span class="title">渠道排行</span>
              <el-tag size="small" type="warning">TOP 10</el-tag>
            </div>
          </template>
          <div class="rank-content">
            <el-table :data="channelRanking" :show-header="true" size="small">
              <el-table-column width="60">
                <template #header>
                  <span>排名</span>
                </template>
                <template #default="scope">
                  <div class="rank-number" :class="{ 'top3': scope.$index < 3 }">
                    {{ scope.$index + 1 }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="渠道商" min-width="120">
                <template #default="scope">
                  <div class="channel-info">
                    <div class="name">{{ scope.row.name }}</div>
                    <div class="code">{{ scope.row.code }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column 
                prop="parent" 
                label="上级机构" 
                min-width="120"
                :show-overflow-tooltip="true"
              />
              <el-table-column label="交易数据" min-width="180" align="right">
                <template #default="scope">
                  <div class="transaction-info">
                    <div class="amount">¥{{ formatNumber(scope.row.transaction) }}</div>
                    <div class="commission">分润: ¥{{ formatNumber(scope.row.commission) }}</div>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实时数据 -->
    <el-row :gutter="20" class="realtime-row">
      <el-col :span="24">
        <el-card shadow="hover" class="realtime-card">
          <template #header>
            <div class="realtime-header">
              <span class="title">实时交易</span>
              <el-tag type="info" size="small">最近100笔</el-tag>
            </div>
          </template>
          <div class="realtime-content">
            <el-table :data="realtimeTransactions" size="small" height="300">
              <el-table-column prop="time" label="时间" width="150" />
              <el-table-column prop="orderNo" label="订单号" width="180" />
              <el-table-column prop="merchant" label="商户" />
              <el-table-column prop="channel" label="渠道" />
              <el-table-column prop="amount" label="金额" align="right" width="120">
                <template #default="scope">
                  <span class="amount">¥{{ scope.row.amount }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.status === '成功' ? 'success' : 'danger'" size="small">
                    {{ scope.row.status }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, markRaw, nextTick } from 'vue'
import { Money, ShoppingCart, User, DataLine, ArrowDown } from '@element-plus/icons-vue'
import { getDashboardStats, getTrendData, getPaymentStats, getMerchantRanking, getChannelRanking } from '@/api/shengfutong'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

// 使用 markRaw 包装图标组件
const icons = {
  Money: markRaw(Money),
  ShoppingCart: markRaw(ShoppingCart),
  User: markRaw(User),
  DataLine: markRaw(DataLine)
}

// 统计卡片数据
const statisticsCards = ref([
  { 
    title: '本月总交易', 
    value: '¥0', 
    change: 0, 
    icon: icons.Money,
    key: 'total_transaction',
    changeKey: 'transaction_change'
  },
  { 
    title: '渠道总直营分润', 
    value: '¥0', 
    change: 0, 
    icon: icons.ShoppingCart,
    key: 'total_commission',
    changeKey: 'commission_change'
  },
  { 
    title: '渠道商总笔数', 
    value: '0', 
    change: 0, 
    icon: icons.User,
    key: 'total_count',
    changeKey: 'count_change'
  },
  { 
    title: '月动销商户总数', 
    value: '0', 
    change: 0, 
    icon: icons.DataLine,
    key: 'total_active_merchants',
    changeKey: 'merchants_change'
  }
])

// 趋势图相关
const trendTimeRange = ref('month')
const trendChartRef = ref(null)
let trendChart = null

// 分布图相关
const distributionType = ref('商户分布')
const pieChartRef = ref(null)
let pieChart = null

// 排行榜数据
const merchantRanking = ref([])
const channelRanking = ref([])

// 实时交易数据
const realtimeTransactions = ref([])

// 添加支付方式的颜色映射
const paymentColors = {
  '微信': '#67C23A',  // 绿色
  '支付宝': '#409EFF',  // 蓝色
  '银联': '#F56C6C'   // 红色
}

// 初始化趋势图
const initTrendChart = () => {
  if (!trendChartRef.value) return
  
  trendChart = echarts.init(trendChartRef.value)
  updateTrendChart()
}

// 更新趋势图数据
const updateTrendChart = async () => {
  try {
    const response = await getTrendData({ range: trendTimeRange.value })
    if (response.code === 200) {
      const { dates, transaction_amounts, commission_amounts } = response.data
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          formatter: function(params) {
            let result = params[0].axisValue + '<br/>'
            // 交易金额显示为"万元"
            result += `${params[0].seriesName}: ¥${(params[0].value / 10000).toFixed(2)}w<br/>`
            // 分润金额保持原值
            result += `${params[1].seriesName}: ¥${params[1].value.toFixed(2)}`
            return result
          }
        },
        legend: {
          data: ['交易金额', '分润金额']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates,
          axisLabel: {
            formatter: (value) => {
              if (trendTimeRange.value === 'year') {
                return value.substring(5)  // 只显示月份
              }
              return value.substring(5)  // 只显示月-日
            }
          }
        },
        yAxis: [
          {
            type: 'value',
            name: '交易金额',
            position: 'left',
            axisLabel: {
              formatter: (value) => {
                return '¥' + (value / 10000).toFixed(1) + 'w'
              }
            }
          },
          {
            type: 'value',
            name: '分润金额',
            position: 'right',
            axisLabel: {
              formatter: (value) => {
                return '¥' + value.toFixed(1)
              }
            }
          }
        ],
        series: [
          {
            name: '交易金额',
            type: 'line',
            smooth: true,
            data: transaction_amounts,
            yAxisIndex: 0,  // 使用左侧Y轴
            itemStyle: {
              color: '#409EFF'
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(64,158,255,0.3)' },
                { offset: 1, color: 'rgba(64,158,255,0.1)' }
              ])
            }
          },
          {
            name: '分润金额',
            type: 'line',
            smooth: true,
            data: commission_amounts,
            yAxisIndex: 1,  // 使用右侧Y轴
            itemStyle: {
              color: '#67C23A'
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(103,194,58,0.3)' },
                { offset: 1, color: 'rgba(103,194,58,0.1)' }
              ])
            }
          }
        ]
      }
      
      trendChart.setOption(option)
    }
  } catch (error) {
    console.error('获取趋势数据失败:', error)
    ElMessage.error('获取趋势数据失败')
  }
}

// 初始化饼图
const initPieChart = () => {
  if (!pieChartRef.value) return
  
  pieChart = echarts.init(pieChartRef.value)
  updatePieChart()
}

// 更新饼图数据
const updatePieChart = async () => {
  try {
    const response = await getPaymentStats()
    if (response.code === 200) {
      const data = response.data.map(item => ({
        name: item.name,
        value: item.value,
        itemStyle: {
          color: paymentColors[item.name] || '#909399'
        }
      }))
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          data: data.map(item => item.name)
        },
        series: [
          {
            name: distributionType.value,
            type: 'pie',
            radius: '50%',
            data: data,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
      
      pieChart.setOption(option)
    }
  } catch (error) {
    console.error('获取支付统计失败:', error)
    ElMessage.error('获取支付统计失败')
  }
}

// 改变分布类型
const changeDistribution = (type) => {
  distributionType.value = type
  updatePieChart()
}

// 获取统计数据
const fetchDashboardStats = async () => {
  try {
    const response = await getDashboardStats()
    if (response.code === 200) {
      const data = response.data
      
      // 更新统计卡片
      statisticsCards.value.forEach(card => {
        if (card.key === 'total_transaction') {
          card.value = `¥${formatNumber(data.total_transaction)}`
          card.change = data.transaction_change || 0
        } else if (card.key === 'total_commission') {
          card.value = `¥${formatNumber(data.total_commission)}`
          card.change = data.commission_change || 0
        } else if (card.key === 'total_count') {
          card.value = formatNumber(data.total_count)
          card.change = data.count_change || 0
        } else if (card.key === 'total_active_merchants') {
          card.value = formatNumber(data.total_active_merchants)
          card.change = data.merchants_change || 0
        }
      })
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  }
}

// 获取商户排行
const fetchMerchantRanking = async () => {
  try {
    const response = await getMerchantRanking({ limit: 10 })
    if (response.code === 200) {
      merchantRanking.value = response.data
    }
  } catch (error) {
    console.error('获取商户排行失败:', error)
    ElMessage.error('获取商户排行失败')
  }
}

// 获取渠道排行
const fetchChannelRanking = async () => {
  try {
    const response = await getChannelRanking({ limit: 10 })
    if (response.code === 200) {
      channelRanking.value = response.data
    }
  } catch (error) {
    console.error('获取渠道排行失败:', error)
    ElMessage.error('获取渠道排行失败')
  }
}

// 格式化数字
const formatNumber = (num) => {
  if (!num) return '0'
  return parseFloat(num).toLocaleString()
}

// 窗口大小变化时重新调整图表
const handleResize = () => {
  if (trendChart) {
    trendChart.resize()
  }
  if (pieChart) {
    pieChart.resize()
  }
}

onMounted(async () => {
  // 获取数据
  await fetchDashboardStats()
  await fetchMerchantRanking()
  await fetchChannelRanking()
  
  // 初始化图表
  await nextTick()
  initTrendChart()
  initPieChart()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // 销毁图表实例
  if (trendChart) {
    trendChart.dispose()
  }
  if (pieChart) {
    pieChart.dispose()
  }
  
  // 移除事件监听
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.statistics-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.card-content {
  padding: 10px 0;
}

.value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.change {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.change.up {
  color: #67C23A;
}

.change.down {
  color: #F56C6C;
}

.compared {
  color: #909399;
  font-size: 12px;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-weight: 600;
  font-size: 16px;
}

.rank-row {
  margin-bottom: 20px;
}

.rank-card {
  margin-bottom: 20px;
}

.rank-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rank-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
}

.rank-number.top3 {
  background: linear-gradient(45deg, #FFD700, #FFA500);
  color: white;
}

.merchant-info .name {
  font-weight: 600;
  margin-bottom: 2px;
}

.merchant-info .number {
  font-size: 12px;
  color: #909399;
}

.channel-info .name {
  font-weight: 600;
  margin-bottom: 2px;
}

.channel-info .code {
  font-size: 12px;
  color: #909399;
}

.transaction-info .amount {
  font-weight: 600;
  color: #67C23A;
  margin-bottom: 2px;
}

.transaction-info .count {
  font-size: 12px;
  color: #909399;
}

.transaction-info .commission {
  font-size: 12px;
  color: #E6A23C;
}

.realtime-row {
  margin-bottom: 20px;
}

.realtime-card {
  margin-bottom: 20px;
}

.realtime-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount {
  font-weight: 600;
  color: #67C23A;
}

.el-dropdown-link {
  cursor: pointer;
  color: #409EFF;
  display: flex;
  align-items: center;
}
</style> 