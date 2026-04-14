<template>
  <div class="ytb-statistics-page">
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
            <div class="stat-value">{{ (stats.users?.scp || 0) + (stats.users?.team_cp || 0) }}</div>
            <div class="stat-label">CP伙伴/VIPCP伙伴</div>
            <div class="stat-sub">CP伙伴: {{ stats.users?.scp || 0 }} / VIPCP伙伴: {{ stats.users?.team_cp || 0 }}</div>
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

    <!-- 配置管理 -->
    <el-card class="config-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>系统配置</span>
          <el-button type="primary" size="small" @click="handleSaveConfigs" :loading="savingConfigs">
            保存配置
          </el-button>
        </div>
      </template>
      <el-tabs v-model="configTab">
        <el-tab-pane label="基础配置" name="basic">
          <el-form :model="configs" label-width="180px" class="config-form">
            <el-row :gutter="40">
              <el-col :span="12">
                <el-form-item label="CP伙伴升级费用(元)">
                  <el-input-number v-model="configs.scp_upgrade_fee" :min="0" :precision="0" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="VIPCP伙伴升级费用(元)">
                  <el-input-number v-model="configs.team_cp_upgrade_fee" :min="0" :precision="0" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="CP伙伴升级分佣(元)">
                  <el-input-number v-model="configs.scp_commission" :min="0" :precision="0" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="VIPCP伙伴业绩要求(人)">
                  <el-input-number v-model="configs.team_cp_requirement" :min="1" :precision="0" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="微信支付">
                  <el-switch
                    v-model="configs.wechat_pay_enabled"
                    :active-value="1"
                    :inactive-value="0"
                    active-text="已开通"
                    inactive-text="未开通"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="BossCP配置" name="boss">
          <el-form :model="configs" label-width="180px" class="config-form">
            <el-row :gutter="40">
              <el-col :span="12">
                <el-form-item label="BossCP投资金额(元)">
                  <el-input-number v-model="configs.boss_cp_investment" :min="0" :precision="0" :step="1000" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="每笔投资设备额度(台)">
                  <el-input-number v-model="configs.boss_cp_device_quota" :min="1" :precision="0" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="上级拓展奖励比例(%)">
                  <el-input-number v-model="configs.boss_cp_referral_rate" :min="0" :max="100" :precision="1" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="每台设备回款(元)">
                  <el-input-number v-model="configs.boss_cp_refund_per_device" :min="0" :precision="0" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="安装分佣配置" name="install">
          <el-form :model="configs" label-width="180px" class="config-form">
            <el-row :gutter="40">
              <el-col :span="12">
                <el-form-item label="推广人分佣(元)">
                  <el-input-number v-model="configs.install_promoter_commission" :min="0" :precision="0" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="一级上级分佣(元)">
                  <el-input-number v-model="configs.install_level1_commission" :min="0" :precision="0" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="二级上级分佣(元)">
                  <el-input-number v-model="configs.install_level2_commission" :min="0" :precision="0" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="BossCP回款分佣(元)">
                  <el-input-number v-model="configs.install_boss_commission" :min="0" :precision="0" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="提现配置" name="withdraw">
          <el-form :model="configs" label-width="180px" class="config-form">
            <el-row :gutter="40">
              <el-col :span="12">
                <el-form-item label="最低提现金额(元)">
                  <el-input-number v-model="configs.min_withdraw_amount" :min="0" :precision="0" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="税费比例(%)">
                  <el-input-number v-model="configs.withdraw_tax_rate" :min="0" :max="100" :precision="1" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="手续费(元/笔)">
                  <el-input-number v-model="configs.withdraw_service_fee" :min="0" :precision="0" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { User, UserFilled, Money, Wallet } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import {
  getStatistics,
  getUserTrend,
  getRevenueTrend,
  getTeamCpRanking,
  getScpRanking,
  getConfigs,
  updateConfigs
} from '@/api/v1/ytb'

// 状态
const stats = ref({})
const teamCpRanking = ref([])
const scpRanking = ref([])
const configTab = ref('basic')
const configs = ref({
  scp_upgrade_fee: 980,
  team_cp_upgrade_fee: 980,
  scp_commission: 360,
  team_cp_requirement: 9,
  wechat_pay_enabled: 0,
  // BossCP配置
  boss_cp_investment: 29800,
  boss_cp_device_quota: 300,
  boss_cp_referral_rate: 6,
  boss_cp_refund_per_device: 100,
  // 安装分佣配置
  install_promoter_commission: 50,
  install_level1_commission: 30,
  install_level2_commission: 20,
  install_boss_commission: 100,
  // 提现配置
  min_withdraw_amount: 300,
  withdraw_tax_rate: 8,
  withdraw_service_fee: 3
})
const savingConfigs = ref(false)

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
  await loadConfigs()
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

// 加载配置
const loadConfigs = async () => {
  try {
    const res = await getConfigs()
    if (res.code === 0) {
      configs.value = { ...configs.value, ...res.data }
    }
  } catch (error) {
    console.error('加载配置失败:', error)
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

// 保存配置
const handleSaveConfigs = async () => {
  savingConfigs.value = true
  try {
    const res = await updateConfigs(configs.value)
    if (res.code === 0) {
      ElMessage.success('配置保存成功')
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    savingConfigs.value = false
  }
}

// 工具函数
const formatMoney = (value) => {
  return parseFloat(value || 0).toFixed(2)
}
</script>

<style scoped>
.ytb-statistics-page {
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
.ranking-card,
.config-card {
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

.config-form {
  max-width: 800px;
}
</style>
