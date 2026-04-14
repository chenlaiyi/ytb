<template>
  <div class="ytb-dashboard">
    <!-- 综合统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.users?.total || 0 }}</div>
            <div class="stat-label">总用户数</div>
            <div class="stat-sub">今日新增: {{ stats.users?.today_new || 0 }}</div>
          </div>
          <el-icon class="stat-icon"><User /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-scp">
          <div class="stat-content">
            <div class="stat-value">{{ stats.users?.scp || 0 }}</div>
            <div class="stat-label">CP伙伴</div>
            <div class="stat-sub">VIPCP伙伴: {{ stats.users?.team_cp || 0 }} / BossCP: {{ stats.users?.boss_cp || 0 }}</div>
          </div>
          <el-icon class="stat-icon"><UserFilled /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-revenue">
          <div class="stat-content">
            <div class="stat-value">¥{{ formatMoney(stats.revenue?.total) }}</div>
            <div class="stat-label">总收入</div>
            <div class="stat-sub">本月: ¥{{ formatMoney(stats.revenue?.this_month) }}</div>
          </div>
          <el-icon class="stat-icon"><Money /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-commission">
          <div class="stat-content">
            <div class="stat-value">¥{{ formatMoney(stats.commissions?.pending) }}</div>
            <div class="stat-label">待结算分佣</div>
            <div class="stat-sub">已结算: ¥{{ formatMoney(stats.commissions?.settled) }}</div>
          </div>
          <el-icon class="stat-icon"><Wallet /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第二行统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-withdraw">
          <div class="stat-content">
            <div class="stat-value">{{ withdrawStats.pending_withdrawals || 0 }}</div>
            <div class="stat-label">待处理提现</div>
            <div class="stat-sub">金额: ¥{{ formatMoney(withdrawStats.pending_amount) }}</div>
          </div>
          <el-icon class="stat-icon"><CreditCard /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-upgrade">
          <div class="stat-content">
            <div class="stat-value">{{ stats.upgrades?.pending || 0 }}</div>
            <div class="stat-label">待审批升级</div>
            <div class="stat-sub">本月通过: {{ stats.upgrades?.this_month_approved || 0 }}</div>
          </div>
          <el-icon class="stat-icon"><DocumentChecked /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-install">
          <div class="stat-content">
            <div class="stat-value">{{ stats.installations?.total || 0 }}</div>
            <div class="stat-label">安装总数</div>
            <div class="stat-sub">本月: {{ stats.installations?.this_month || 0 }}</div>
          </div>
          <el-icon class="stat-icon"><Box /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-invest">
          <div class="stat-content">
            <div class="stat-value">¥{{ formatMoney(stats.investments?.total_amount) }}</div>
            <div class="stat-label">BossCP投资</div>
            <div class="stat-sub">投资人数: {{ stats.investments?.total_users || 0 }}</div>
          </div>
          <el-icon class="stat-icon"><TrendCharts /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <!-- 用户增长趋势 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>用户增长趋势</span>
              <el-radio-group v-model="userTrendDays" size="small" @change="loadUserTrend">
                <el-radio-button :label="7">7天</el-radio-button>
                <el-radio-button :label="30">30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="userTrendChart" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 收入趋势 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>收入趋势</span>
              <el-radio-group v-model="revenueTrendDays" size="small" @change="loadRevenueTrend">
                <el-radio-button :label="7">7天</el-radio-button>
                <el-radio-button :label="30">30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="revenueTrendChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- VIPCP伙伴排行榜 -->
      <el-col :span="12">
        <el-card class="ranking-card">
          <template #header>
            <div class="card-header">
              <span>VIPCP伙伴排行</span>
            </div>
          </template>
          <el-table :data="teamCpRanking" stripe size="small">
            <el-table-column type="index" label="排名" width="60" />
            <el-table-column label="用户" min-width="150">
              <template #default="{ row }">
                <div class="user-info-small">
                  <el-avatar :size="28" :src="row.avatar">{{ row.nickname?.charAt(0) || 'Y' }}</el-avatar>
                  <span>{{ row.nickname || row.phone }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="direct_scp_count" label="直推CP伙伴" width="90" />
            <el-table-column label="总分佣" width="100">
              <template #default="{ row }">
                ¥{{ formatMoney(row.total_commission) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- CP伙伴排行榜 -->
      <el-col :span="12">
        <el-card class="ranking-card">
          <template #header>
            <div class="card-header">
              <span>CP伙伴排行</span>
            </div>
          </template>
          <el-table :data="scpRanking" stripe size="small">
            <el-table-column type="index" label="排名" width="60" />
            <el-table-column label="用户" min-width="150">
              <template #default="{ row }">
                <div class="user-info-small">
                  <el-avatar :size="28" :src="row.avatar">{{ row.nickname?.charAt(0) || 'Y' }}</el-avatar>
                  <span>{{ row.nickname || row.phone }}</span>
                  <el-tag size="small" :type="row.role === 'team_cp' ? 'danger' : 'warning'">
                    {{ row.role_name }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="direct_user_count" label="直推用户" width="90" />
            <el-table-column label="总分佣" width="100">
              <template #default="{ row }">
                ¥{{ formatMoney(row.total_commission) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { User, UserFilled, Money, Wallet, CreditCard, DocumentChecked, Box, TrendCharts } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import {
  getStatistics,
  getUserTrend,
  getRevenueTrend,
  getTeamCpRanking,
  getScpRanking,
  getWithdrawalStatistics
} from '@/api/v1/ytb'

// 状态
const stats = ref({})
const withdrawStats = ref({})
const teamCpRanking = ref([])
const scpRanking = ref([])

// 图表
const userTrendChart = ref(null)
const revenueTrendChart = ref(null)
const userTrendDays = ref(30)
const revenueTrendDays = ref(30)
let userChart = null
let revenueChart = null

// 初始化
onMounted(async () => {
  await loadStatistics()
  await loadWithdrawStats()
  await loadRankings()
  
  nextTick(() => {
    initCharts()
    loadUserTrend()
    loadRevenueTrend()
  })
})

onUnmounted(() => {
  if (userChart) userChart.dispose()
  if (revenueChart) revenueChart.dispose()
})

// 加载综合统计
const loadStatistics = async () => {
  try {
    const res = await getStatistics()
    if (res.code === 0) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

// 加载提现统计
const loadWithdrawStats = async () => {
  try {
    const res = await getWithdrawalStatistics()
    if (res.code === 0) {
      withdrawStats.value = res.data
    }
  } catch (error) {
    console.error('加载提现统计失败:', error)
  }
}

// 加载排行榜
const loadRankings = async () => {
  try {
    const [teamCpRes, scpRes] = await Promise.all([
      getTeamCpRanking(10),
      getScpRanking(10)
    ])
    
    if (teamCpRes.code === 0) {
      teamCpRanking.value = teamCpRes.data || []
    }
    if (scpRes.code === 0) {
      scpRanking.value = scpRes.data || []
    }
  } catch (error) {
    console.error('加载排行榜失败:', error)
  }
}

// 初始化图表
const initCharts = () => {
  if (userTrendChart.value) {
    userChart = echarts.init(userTrendChart.value)
  }
  if (revenueTrendChart.value) {
    revenueChart = echarts.init(revenueTrendChart.value)
  }
}

// 加载用户趋势
const loadUserTrend = async () => {
  try {
    const res = await getUserTrend(userTrendDays.value)
    if (res.code === 0 && userChart) {
      const data = res.data || []
      userChart.setOption({
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['总计', 'CP伙伴', 'VIPCP伙伴']
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
          data: data.map(item => item.date.substring(5))
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '总计',
            type: 'line',
            data: data.map(item => item.total),
            smooth: true
          },
          {
            name: 'CP伙伴',
            type: 'line',
            data: data.map(item => item.scp),
            smooth: true
          },
          {
            name: 'VIPCP伙伴',
            type: 'line',
            data: data.map(item => item.team_cp),
            smooth: true
          }
        ]
      })
    }
  } catch (error) {
    console.error('加载用户趋势失败:', error)
  }
}

// 加载收入趋势
const loadRevenueTrend = async () => {
  try {
    const res = await getRevenueTrend(revenueTrendDays.value)
    if (res.code === 0 && revenueChart) {
      const data = res.data || []
      revenueChart.setOption({
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            const item = params[0]
            return `${item.name}<br/>收入: ¥${item.value.toFixed(2)}`
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
          data: data.map(item => item.date.substring(5))
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
            type: 'bar',
            data: data.map(item => item.revenue),
            itemStyle: {
              color: '#67c23a'
            }
          }
        ]
      })
    }
  } catch (error) {
    console.error('加载收入趋势失败:', error)
  }
}

// 工具函数
const formatMoney = (value) => {
  return parseFloat(value || 0).toFixed(2)
}
</script>

<style scoped>
.ytb-dashboard {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card .stat-content {
  position: relative;
  z-index: 1;
}

.stat-card .stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}

.stat-card.stat-scp .stat-value {
  color: #e6a23c;
}

.stat-card.stat-revenue .stat-value {
  color: #67c23a;
}

.stat-card.stat-commission .stat-value {
  color: #f56c6c;
}

.stat-card.stat-withdraw .stat-value {
  color: #909399;
}

.stat-card.stat-upgrade .stat-value {
  color: #409eff;
}

.stat-card.stat-install .stat-value {
  color: #67c23a;
}

.stat-card.stat-invest .stat-value {
  color: #e6a23c;
}

.stat-card .stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.stat-card .stat-sub {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}

.stat-card .stat-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 48px;
  color: #f0f0f0;
}

.chart-card,
.ranking-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
}

.user-info-small {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
