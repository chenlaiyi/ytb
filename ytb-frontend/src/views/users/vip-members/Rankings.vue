<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-title">
        <h2>VIP排行榜</h2>
        <p>查看VIP会员在各个维度的排名情况</p>
      </div>
      <div class="page-actions">
        <el-button type="success" @click="exportRankings" :loading="exportLoading">
          <el-icon><Download /></el-icon>
          导出排行榜
        </el-button>
        <el-button type="primary" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- VIP会员模块导航标签页 -->
    <el-card class="navigation-card" shadow="never">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="vip-tabs">
        <el-tab-pane label="VIP会员列表" name="list">
          <template #label>
            <span class="tab-label">
              <el-icon><User /></el-icon>
              VIP会员列表
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="VIP分红管理" name="dividends">
          <template #label>
            <span class="tab-label">
              <el-icon><Money /></el-icon>
              VIP分红管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="VIP排行榜" name="rankings">
          <template #label>
            <span class="tab-label">
              <el-icon><Trophy /></el-icon>
              VIP排行榜
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="VIP余额管理" name="balance">
          <template #label>
            <span class="tab-label">
              <el-icon><Wallet /></el-icon>
              VIP余额管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="VIP等级管理" name="levels">
          <template #label>
            <span class="tab-label">
              <el-icon><Star /></el-icon>
              VIP等级管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="VIP统计分析" name="statistics">
          <template #label>
            <span class="tab-label">
              <el-icon><DataAnalysis /></el-icon>
              VIP统计分析
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 统计概览 -->
    <div class="stats-overview" v-if="rankingStats.total_vip_users">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon users-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ rankingStats.total_vip_users }}</div>
                <div class="stat-label">参与排名用户</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon team-icon">
                <el-icon><Trophy /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ Math.round(rankingStats.avg_team_vip || 0) }}</div>
                <div class="stat-label">平均团队VIP</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon balance-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">¥{{ formatCurrency(rankingStats.avg_balance || 0) }}</div>
                <div class="stat-label">平均余额</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon champion-icon">
                <el-icon><Star /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ rankingStats.top_performer?.name || '-' }}</div>
                <div class="stat-label">当前冠军</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <div class="filter-item">
          <label>搜索用户：</label>
          <el-input
            v-model="searchQuery"
            placeholder="输入姓名、微信昵称或手机号"
            clearable
            style="width: 250px"
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="filter-item">
          <label>排名维度：</label>
          <el-select v-model="rankBy" @change="changeRankBy" placeholder="选择排名维度">
            <el-option label="团队VIP数量" value="team_vip_count" />
            <el-option label="直推VIP数量" value="direct_vip_count" />
            <el-option label="账户余额" value="balance" />
            <el-option label="本月新增团队VIP" value="month_team_vip" />
            <el-option label="上月新增团队VIP" value="last_month_team_vip" />
            <el-option label="本月直推VIP" value="month_direct_vip" />
          </el-select>
        </div>
        <div class="filter-item">
          <label>统计周期：</label>
          <el-select v-model="period" @change="loadRankings" placeholder="选择统计周期">
            <el-option label="本月" value="month" />
            <el-option label="上月" value="last_month" />
            <el-option label="本季度" value="quarter" />
            <el-option label="本年度" value="year" />
            <el-option label="全部时间" value="all" />
          </el-select>
        </div>
        <div class="filter-item">
          <label>显示数量：</label>
          <el-select v-model="limit" @change="loadRankings" placeholder="显示数量">
            <el-option label="前10名" :value="10" />
            <el-option label="前20名" :value="20" />
            <el-option label="前50名" :value="50" />
            <el-option label="前100名" :value="100" />
          </el-select>
        </div>
      </div>
    </el-card>

    <!-- 排行榜表格 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h3>{{ getRankByText() }}</h3>
          <div class="header-info">
            <span class="total-count">共 {{ rankings.length }} 位用户</span>
            <span class="period-info" v-if="rankingStats.period_info">
              {{ getPeriodText() }}
            </span>
          </div>
        </div>
      </template>

      <el-table
        :data="rankings"
        v-loading="loading"
        :row-class-name="getRowClassName"
        stripe
        style="width: 100%"
      >
        <el-table-column label="排名" width="80" align="center" fixed="left">
          <template #default="{ $index }">
            <div class="rank-badge" :class="getRankBadgeClass($index + 1)">
              <el-icon v-if="$index === 0" class="crown-icon"><Crown /></el-icon>
              <span v-else>{{ $index + 1 }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="用户信息" width="200" fixed="left">
          <template #default="{ row }">
            <div class="user-info">
              <div class="user-name">{{ row.name }}</div>
              <div class="user-phone">{{ row.phone }}</div>
              <div class="user-wechat" v-if="row.wechat_nickname">{{ row.wechat_nickname }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="排名数值" width="120" align="center">
          <template #default="{ row }">
            <div class="rank-value">{{ formatRankValue(row) }}</div>
          </template>
        </el-table-column>

        <el-table-column label="团队VIP" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ row.team_vip_count }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="直推VIP" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="success" size="small">{{ row.direct_vip_count }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="账户余额" width="120" align="center">
          <template #default="{ row }">
            <span class="balance-amount">¥{{ formatCurrency(row.balance) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="本月新增团队" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="warning" size="small">{{ row.month_team_vip || 0 }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="本月直推" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.month_direct_vip || 0 }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="累计分红" width="120" align="center">
          <template #default="{ row }">
            <span class="dividend-amount">¥{{ formatCurrency(row.total_dividend || 0) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="本月分红" width="120" align="center">
          <template #default="{ row }">
            <span class="dividend-amount">¥{{ formatCurrency(row.month_dividend || 0) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="团队充值设备" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="danger" size="small">{{ row.team_recharge_count || 0 }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="排名变化" width="100" align="center">
          <template #default="{ row }">
            <div class="rank-change">
              <el-icon v-if="row.rank_change > 0" class="rank-up"><CaretTop /></el-icon>
              <el-icon v-else-if="row.rank_change < 0" class="rank-down"><CaretBottom /></el-icon>
              <span v-else class="rank-same">-</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="VIP完款时间" width="150" align="center">
          <template #default="{ row }">
            <span>{{ formatDate(row.vip_paid_at) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewTeamTree(row)">
              查看团队
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 团队关系树对话框 -->
    <el-dialog
      v-model="teamDialogVisible"
      :title="`${selectedUser?.name} 的团队关系`"
      width="80%"
      top="5vh"
    >
      <div v-if="teamData.user" class="team-dialog-content">
        <!-- 用户基本信息 -->
        <el-card class="user-summary" shadow="never">
          <div class="user-summary-content">
            <div class="user-basic">
              <h3>{{ teamData.user.name }}</h3>
              <p>手机：{{ teamData.user.phone }}</p>
              <p v-if="teamData.user.wechat_nickname">微信：{{ teamData.user.wechat_nickname }}</p>
            </div>
            <div class="team-stats">
              <div class="stat-item">
                <span class="stat-label">团队VIP总数：</span>
                <span class="stat-value">{{ teamData.team_stats.total_team_vip }}人</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">直推VIP数：</span>
                <span class="stat-value">{{ teamData.team_stats.direct_vip }}人</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">团队层级：</span>
                <span class="stat-value">{{ teamData.team_stats.max_level }}级</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 团队成员列表 -->
        <el-card class="team-members" shadow="never">
          <template #header>
            <h4>团队成员 ({{ teamData.team_members.length }}人)</h4>
          </template>
          <el-table :data="teamData.team_members" style="width: 100%">
            <el-table-column label="姓名" prop="name" width="120" />
            <el-table-column label="手机号" prop="phone" width="140" />
            <el-table-column label="层级" width="80" align="center">
              <template #default="{ row }">
                <el-tag size="small">L{{ row.level }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="VIP状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.is_vip_paid ? 'success' : 'info'" size="small">
                  {{ row.is_vip_paid ? '已完款' : '未完款' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="完款时间" width="150">
              <template #default="{ row }">
                {{ formatDate(row.vip_paid_at) }}
              </template>
            </el-table-column>
            <el-table-column label="推荐人" prop="referrer_name" width="120" />
          </el-table>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
const exportLoading = ref(false)
const rankings = ref([])
const rankBy = ref('team_vip_count')
const period = ref('all')
const limit = ref(20)
const searchQuery = ref('')
const rankingStats = ref({})
let searchTimer = null

// VIP会员模块导航标签页
const activeTab = ref('rankings')

// 团队关系树相关
const teamDialogVisible = ref(false)
const selectedUser = ref(null)
const teamData = reactive({
  user: null,
  team_members: [],
  team_stats: {}
})

// 方法
const getRankByText = () => {
  const texts = {
    'team_vip_count': '团队VIP数量',
    'direct_vip_count': '直推VIP数量',
    'balance': '账户余额',
    'month_team_vip': '本月新增团队VIP',
    'last_month_team_vip': '上月新增团队VIP',
    'month_direct_vip': '本月直推VIP',
    'total_dividend': '累计分红金额',
    'month_dividend': '本月分红金额',
    'team_recharge_count': '团队充值设备'
  }
  return texts[rankBy.value] || '排行榜'
}

const getPeriodText = () => {
  const periodTexts = {
    'month': '本月',
    'last_month': '上月',
    'quarter': '本季度',
    'year': '本年度',
    'all': '全部时间'
  }
  const periodText = periodTexts[period.value] || '全部时间'
  const periodInfo = rankingStats.value.period_info
  if (periodInfo && periodInfo.start_date && periodInfo.end_date) {
    return `${periodText} (${periodInfo.start_date} ~ ${periodInfo.end_date})`
  }
  return periodText
}

const formatRankValue = (user) => {
  switch (rankBy.value) {
    case 'team_vip_count':
      return `${user.team_vip_count}人`
    case 'direct_vip_count':
      return `${user.direct_vip_count}人`
    case 'balance':
      return `¥${formatCurrency(user.balance)}`
    case 'month_team_vip':
      return `${user.month_team_vip || 0}人`
    case 'last_month_team_vip':
      return `${user.last_month_team_vip || 0}人`
    case 'month_direct_vip':
      return `${user.month_direct_vip || 0}人`
    case 'total_dividend':
      return `¥${formatCurrency(user.total_dividend || 0)}`
    case 'month_dividend':
      return `¥${formatCurrency(user.month_dividend || 0)}`
    case 'team_recharge_count':
      return `${user.team_recharge_count || 0}台`
    default:
      return '-'
  }
}

const formatCurrency = (value) => {
  return parseFloat(value || 0).toFixed(2)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

const getRankBadgeClass = (rank) => {
  if (rank === 1) return 'rank-first'
  if (rank === 2) return 'rank-second'
  if (rank === 3) return 'rank-third'
  if (rank <= 10) return 'rank-top10'
  return 'rank-normal'
}

const getRowClassName = ({ rowIndex }) => {
  const rank = rowIndex + 1
  if (rank === 1) return 'champion-row'
  if (rank <= 3) return 'top-three-row'
  if (rank <= 10) return 'top-ten-row'
  return ''
}

const handleSearch = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    loadRankings()
  }, 500)
}

const loadRankings = async () => {
  try {
    loading.value = true
    
    const params = {
      rank_by: rankBy.value,
      period: period.value,
      limit: limit.value,
      search: searchQuery.value
    }
    
    const response = await axios.get('/admin/api/user/vip_rankings.php', { params })
    
    if (response.data && response.data.code === 0) {
      rankings.value = response.data.data.rankings || []
      rankingStats.value = response.data.data.stats || {}
    } else {
      ElMessage.error(response.data?.message || '获取排行榜数据失败')
      rankings.value = []
    }
  } catch (error) {
    console.error('获取排行榜数据失败:', error)
    ElMessage.error('获取排行榜数据失败')
    rankings.value = []
  } finally {
    loading.value = false
  }
}

const changeRankBy = () => {
  loadRankings()
}

const refreshData = () => {
  loadRankings()
}

// 导出排行榜
const exportRankings = async () => {
  try {
    exportLoading.value = true
    
    const params = {
      rank_by: rankBy.value,
      period: period.value,
      search: searchQuery.value
    }
    
    // 构建导出URL
    const exportUrl = '/admin/api/user/vip_rankings_export.php?' + new URLSearchParams(params).toString()
    
    // 创建隐藏的下载链接
    const link = document.createElement('a')
    link.href = exportUrl
    link.download = `VIP排行榜_${getRankByText()}_${new Date().toLocaleDateString()}.xls`
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

// 处理VIP会员模块导航标签页点击
const handleTabClick = (tab) => {
  const tabName = tab.props.name;
  
  // 根据标签页名称跳转到对应的路由
  switch (tabName) {
    case 'list':
      router.push({ name: 'VipList' });
      break;
    case 'dividends':
      router.push({ name: 'VipDividends' });
      break;
    case 'rankings':
      // 当前页面，不需要跳转
      break;
    case 'balance':
      router.push({ name: 'VipBalance' });
      break;
    case 'levels':
      router.push({ name: 'VipLevels' });
      break;
    case 'statistics':
      router.push({ name: 'VipStatistics' });
      break;
    default:
      console.warn('未知的标签页:', tabName);
  }
};

const viewTeamTree = async (user) => {
  try {
    selectedUser.value = user
    teamDialogVisible.value = true
    
    // 重置团队数据
    teamData.user = null
    teamData.team_members = []
    teamData.team_stats = {}
    
    // 获取团队关系树数据
    const response = await axios.get('/admin/api/user/vip_team.php', {
      params: { user_id: user.id }
    })
    
    if (response.data && response.data.code === 0) {
      teamData.user = response.data.data.user
      teamData.team_members = response.data.data.team_members || []
      teamData.team_stats = response.data.data.team_stats || {}
    } else {
      ElMessage.error('获取团队数据失败')
    }
  } catch (error) {
    console.error('获取团队数据失败:', error)
    ElMessage.error('获取团队数据失败')
  }
}

// 生命周期
onMounted(() => {
  loadRankings()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

/* 页面头部样式 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 32px;
  margin: -20px -20px 24px -20px;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
}

.page-title p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

/* 统计概览样式 */
.stats-overview {
  margin-bottom: 24px;
}

.stat-card {
  border: none;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 8px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.users-icon { background: linear-gradient(135deg, #667eea, #764ba2); }
.team-icon { background: linear-gradient(135deg, #f093fb, #f5576c); }
.balance-icon { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.champion-icon { background: linear-gradient(135deg, #43e97b, #38f9d7); }

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
}

/* 导航卡片样式 */
.navigation-card {
  margin-bottom: 24px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

/* VIP标签页样式 */
.vip-tabs {
  --el-tabs-header-height: 60px;
}

:deep(.vip-tabs .el-tabs__header) {
  margin: 0;
  border-bottom: 2px solid #f0f2f5;
}

:deep(.vip-tabs .el-tabs__nav-wrap) {
  padding: 0 20px;
}

:deep(.vip-tabs .el-tabs__item) {
  height: 60px;
  line-height: 60px;
  padding: 0 24px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  border: none;
  transition: all 0.3s ease;
}

:deep(.vip-tabs .el-tabs__item:hover) {
  color: #409eff;
  background: rgba(64, 158, 255, 0.05);
  border-radius: 8px 8px 0 0;
}

:deep(.vip-tabs .el-tabs__item.is-active) {
  color: #409eff;
  background: rgba(64, 158, 255, 0.08);
  border-radius: 8px 8px 0 0;
  font-weight: 600;
}

:deep(.vip-tabs .el-tabs__active-bar) {
  background: linear-gradient(90deg, #409eff, #67c23a);
  height: 3px;
  border-radius: 2px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.tab-label .el-icon {
  font-size: 16px;
}

/* 筛选条件样式 */
.filter-card {
  margin-bottom: 24px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.filter-row {
  display: flex;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item label {
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
}

/* 表格卡片样式 */
.table-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.header-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.total-count {
  color: #909399;
  font-size: 14px;
}

.period-info {
  color: #67c23a;
  font-size: 12px;
}

/* 排名徽章样式 */
.rank-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  margin: 0 auto;
}

.rank-first {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #8b4513;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
}

.rank-second {
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  color: #666;
  box-shadow: 0 4px 12px rgba(192, 192, 192, 0.4);
}

.rank-third {
  background: linear-gradient(135deg, #cd7f32, #daa520);
  color: white;
  box-shadow: 0 4px 12px rgba(205, 127, 50, 0.4);
}

.rank-top10 {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.rank-normal {
  background: #f5f7fa;
  color: #909399;
  border: 1px solid #e4e7ed;
}

.crown-icon {
  font-size: 18px;
  color: #8b4513;
}

/* 表格行样式 */
:deep(.champion-row) {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.1), rgba(255, 237, 78, 0.05));
}

:deep(.top-three-row) {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.04));
}

:deep(.top-ten-row) {
  background: rgba(102, 126, 234, 0.03);
}

/* 用户信息样式 */
.user-info {
  text-align: left;
}

.user-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.user-phone {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.user-wechat {
  font-size: 12px;
  color: #67c23a;
}

/* 排名数值样式 */
.rank-value {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

/* 余额样式 */
.balance-amount {
  font-weight: 600;
  color: #67c23a;
}

/* 分红金额样式 */
.dividend-amount {
  font-weight: 600;
  color: #e6a23c;
}

/* 分红金额样式 */
.dividend-amount {
  font-weight: 600;
  color: #e6a23c;
}

/* 分红金额样式 */
.dividend-amount {
  font-weight: 600;
  color: #e6a23c;
}

/* 排名变化样式 */
.rank-change {
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-up {
  color: #67c23a;
  font-size: 16px;
}

.rank-down {
  color: #f56c6c;
  font-size: 16px;
}

.rank-same {
  color: #909399;
  font-size: 14px;
}

/* 团队对话框样式 */
.team-dialog-content {
  max-height: 70vh;
  overflow-y: auto;
}

.user-summary {
  margin-bottom: 20px;
  border-radius: 8px;
}

.user-summary-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.user-basic h3 {
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.user-basic p {
  margin: 4px 0;
  color: #606266;
  font-size: 14px;
}

.team-stats {
  text-align: right;
}

.stat-item {
  margin-bottom: 8px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.stat-value {
  color: #409eff;
  font-weight: 600;
  margin-left: 8px;
}

.team-members {
  border-radius: 8px;
}

.team-members h4 {
  margin: 0;
  color: #2c3e50;
}
</style> 