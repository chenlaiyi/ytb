<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-title">
        <h2>VIP会员管理</h2>
        <p class="page-description">管理和查看所有VIP会员信息</p>
      </div>
      <div class="page-actions">
        <el-button type="primary" size="large" @click="showAdjustDialog">
          <el-icon><Plus /></el-icon>
          余额调整
        </el-button>
        <el-button type="primary" size="large" @click="refreshData">
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

    <!-- 统计卡片 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card balance-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">¥{{ formatCurrency(stats.totalBalance) }}</div>
                <div class="stat-label">总余额</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card users-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalVipUsers }}</div>
                <div class="stat-label">VIP用户数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card avg-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">¥{{ formatCurrency(stats.avgBalance) }}</div>
                <div class="stat-label">平均余额</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card today-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Calendar /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">¥{{ formatCurrency(stats.todayChanges) }}</div>
                <div class="stat-label">今日变动</div>
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
            v-model="searchForm.search"
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
          <label>余额范围：</label>
          <el-select v-model="searchForm.balance_range" @change="handleSearch" placeholder="选择余额范围">
            <el-option label="全部" value="" />
            <el-option label="0-100元" value="0-100" />
            <el-option label="100-500元" value="100-500" />
            <el-option label="500-1000元" value="500-1000" />
            <el-option label="1000-5000元" value="1000-5000" />
            <el-option label="5000元以上" value="5000+" />
          </el-select>
        </div>
        <div class="filter-item">
          <label>排序方式：</label>
          <el-select v-model="searchForm.sort" @change="handleSearch" placeholder="选择排序方式">
            <el-option label="余额从高到低" value="balance_desc" />
            <el-option label="余额从低到高" value="balance_asc" />
            <el-option label="最近更新" value="updated_desc" />
            <el-option label="姓名排序" value="name_asc" />
          </el-select>
        </div>
      </div>
    </el-card>

    <!-- 余额列表 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>VIP会员余额列表</h3>
          <span class="total-count">共 {{ total }} 名VIP会员</span>
        </div>
      </template>
      
      <el-table 
        :data="balanceList" 
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column label="VIP会员" min-width="200" fixed="left">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="40" :src="row.wechat_avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="user-details">
                <div class="user-name">{{ row.name || '未设置姓名' }}</div>
                <div v-if="row.wechat_nickname" class="user-nickname">{{ row.wechat_nickname }}</div>
                <div class="user-phone">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="当前余额" width="120" align="center" sortable="custom">
          <template #default="{ row }">
            <div class="balance-cell">
              <span class="balance-amount" :class="getBalanceClass(row.balance)">
                ¥{{ formatCurrency(row.balance) }}
              </span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="团队VIP" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="success" size="small">{{ row.team_vip_count }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="直推VIP" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ row.direct_vip_count }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="VIP完款时间" width="150" align="center">
          <template #default="{ row }">
            <span class="date-text">{{ formatDate(row.vip_at) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="最后更新" width="150" align="center">
          <template #default="{ row }">
            <span class="date-text">{{ formatDateTime(row.updated_at) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="adjustBalance(row)">
              <el-icon><Edit /></el-icon>
              调整余额
            </el-button>
            <el-button type="info" size="small" @click="viewBalanceLog(row)">
              <el-icon><Document /></el-icon>
              变动记录
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="searchForm.page"
          v-model:page-size="searchForm.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 余额调整弹窗 -->
    <el-dialog
      v-model="adjustDialogVisible"
      :title="adjustForm.user_id ? '调整余额' : '批量余额调整'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="adjustForm" :rules="adjustRules" ref="adjustFormRef" label-width="100px">
        <el-form-item v-if="!adjustForm.user_id" label="选择用户" prop="user_id">
          <el-select
            v-model="adjustForm.user_id"
            placeholder="请选择要调整余额的用户"
            filterable
            remote
            :remote-method="searchUsers"
            style="width: 100%"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="`${user.name || '未设置姓名'} (${user.phone})`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item v-else label="用户信息">
          <div class="selected-user">
            <el-avatar :size="30" :src="selectedUser?.wechat_avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span>{{ selectedUser?.name || '未设置姓名' }} ({{ selectedUser?.phone }})</span>
          </div>
        </el-form-item>
        
        <el-form-item label="当前余额">
          <span class="current-balance">¥{{ formatCurrency(selectedUser?.balance || 0) }}</span>
        </el-form-item>
        
        <el-form-item label="调整类型" prop="type">
          <el-radio-group v-model="adjustForm.type">
            <el-radio value="add">增加余额</el-radio>
            <el-radio value="subtract">减少余额</el-radio>
            <el-radio value="set">设置余额</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="调整金额" prop="amount">
          <el-input-number
            v-model="adjustForm.amount"
            :min="0"
            :max="999999"
            :precision="2"
            style="width: 100%"
            placeholder="请输入调整金额"
          />
        </el-form-item>
        
        <el-form-item label="调整原因" prop="reason">
          <el-input
            v-model="adjustForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入调整原因"
          />
        </el-form-item>
        
        <el-form-item label="预计余额">
          <span class="predicted-balance" :class="getPredictedBalanceClass()">
            ¥{{ formatCurrency(getPredictedBalance()) }}
          </span>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdjustment" :loading="adjusting">
          确认调整
        </el-button>
      </template>
    </el-dialog>

    <!-- 余额变动记录弹窗 -->
    <el-dialog
      v-model="logDialogVisible"
      :title="`${selectedUser?.name || '未设置姓名'}的余额变动记录`"
      width="80%"
      top="5vh"
    >
      <el-table :data="balanceLogs" v-loading="logLoading" stripe>
        <el-table-column label="变动时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="变动类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getLogTypeTag(row.type)" size="small">
              {{ getLogTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="变动金额" width="120" align="center">
          <template #default="{ row }">
            <span :class="getAmountClass(row.amount)">
              {{ row.amount > 0 ? '+' : '' }}¥{{ formatCurrency(Math.abs(row.amount)) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="变动前余额" width="120" align="center">
          <template #default="{ row }">
            ¥{{ formatCurrency(row.balance_before) }}
          </template>
        </el-table-column>
        
        <el-table-column label="变动后余额" width="120" align="center">
          <template #default="{ row }">
            ¥{{ formatCurrency(row.balance_after) }}
          </template>
        </el-table-column>
        
        <el-table-column label="变动原因" min-width="200">
          <template #default="{ row }">
            {{ row.reason || '-' }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作人" width="120">
          <template #default="{ row }">
            {{ row.operator_name || '系统' }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Wallet, Plus, Refresh, Money, User, TrendCharts, Calendar, 
  Search, Edit, Document, Loading, Trophy, Star, DataAnalysis 
} from '@element-plus/icons-vue'
import axios from '@/utils/axios'

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
const balanceList = ref([])
const total = ref(0)
const stats = reactive({
  totalBalance: '0.00',
  totalVipUsers: 0,
  avgBalance: '0.00',
  todayChanges: '0.00'
})

// VIP会员模块导航标签页
const activeTab = ref('balance')

// 搜索表单
const searchForm = reactive({
  page: 1,
  limit: 20,
  search: '',
  balance_range: '',
  sort: 'balance_desc'
})

// 余额调整相关
const adjustDialogVisible = ref(false)
const adjusting = ref(false)
const adjustFormRef = ref()
const selectedUser = ref(null)
const userOptions = ref([])
const adjustForm = reactive({
  user_id: null,
  type: 'add',
  amount: 0,
  reason: ''
})

const adjustRules = {
  user_id: [{ required: true, message: '请选择用户', trigger: 'change' }],
  type: [{ required: true, message: '请选择调整类型', trigger: 'change' }],
  amount: [
    { required: true, message: '请输入调整金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '调整金额必须大于0', trigger: 'blur' }
  ],
  reason: [{ required: true, message: '请输入调整原因', trigger: 'blur' }]
}

// 余额变动记录相关
const logDialogVisible = ref(false)
const logLoading = ref(false)
const balanceLogs = ref([])

// 计算属性
const getPredictedBalance = () => {
  if (!selectedUser.value) return 0
  const currentBalance = parseFloat(selectedUser.value.balance || 0)
  const amount = parseFloat(adjustForm.amount || 0)
  
  switch (adjustForm.type) {
    case 'add':
      return currentBalance + amount
    case 'subtract':
      return Math.max(0, currentBalance - amount)
    case 'set':
      return amount
    default:
      return currentBalance
  }
}

// 方法
const formatCurrency = (value) => {
  return parseFloat(value || 0).toFixed(2)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const getBalanceClass = (balance) => {
  const amount = parseFloat(balance || 0)
  if (amount >= 5000) return 'balance-high'
  if (amount >= 1000) return 'balance-medium'
  if (amount >= 100) return 'balance-low'
  return 'balance-zero'
}

const getPredictedBalanceClass = () => {
  const predicted = getPredictedBalance()
  if (predicted < 0) return 'balance-negative'
  return getBalanceClass(predicted)
}

const getLogTypeTag = (type) => {
  const tags = {
    'add': 'success',
    'subtract': 'warning',
    'set': 'info',
    'recharge': 'success',
    'consume': 'danger',
    'refund': 'info'
  }
  return tags[type] || 'info'
}

const getLogTypeText = (type) => {
  const texts = {
    'add': '增加',
    'subtract': '减少',
    'set': '设置',
    'recharge': '充值',
    'consume': '消费',
    'refund': '退款'
  }
  return texts[type] || type
}

const getAmountClass = (amount) => {
  return amount > 0 ? 'amount-positive' : 'amount-negative'
}

const loadBalanceList = async () => {
  try {
    loading.value = true
    const response = await axios.get('/api/admin/v1/vip-balance', {
      params: searchForm
    })
    
    if (response && response.code === 0) {
      balanceList.value = response.data.users || []
      total.value = response.data.pagination?.total || 0

      // 更新统计数据
      if (response.data.statistics) {
        Object.assign(stats, {
          totalBalance: response.data.statistics.total_balance,
          totalVipUsers: response.data.statistics.total_vip_users,
          avgBalance: response.data.statistics.avg_balance,
          todayChanges: response.data.statistics.today_changes
        })
      }
    } else {
      ElMessage.error('获取余额列表失败')
    }
  } catch (error) {
    console.error('获取余额列表失败:', error)
    ElMessage.error('获取余额列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  searchForm.page = 1
  loadBalanceList()
}

const handleSizeChange = (size) => {
  searchForm.limit = size
  loadBalanceList()
}

const handleCurrentChange = (page) => {
  searchForm.page = page
  loadBalanceList()
}

const refreshData = () => {
  loadBalanceList()
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
      router.push({ name: 'VipRankings' });
      break;
    case 'balance':
      // 当前页面，不需要跳转
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

const showAdjustDialog = () => {
  adjustForm.user_id = null
  adjustForm.type = 'add'
  adjustForm.amount = 0
  adjustForm.reason = ''
  selectedUser.value = null
  adjustDialogVisible.value = true
}

const adjustBalance = (user) => {
  selectedUser.value = user
  adjustForm.user_id = user.id
  adjustForm.type = 'add'
  adjustForm.amount = 0
  adjustForm.reason = ''
  adjustDialogVisible.value = true
}

const searchUsers = async (query) => {
  if (!query) return
  try {
    const response = await axios.get('/api/admin/v1/vip-balance', {
      params: { search: query, limit: 10 }
    })
    
    if (response && response.code === 0) {
      userOptions.value = response.data.users || []
    }
  } catch (error) {
    console.error('搜索用户失败:', error)
  }
}

const submitAdjustment = async () => {
  try {
    await adjustFormRef.value.validate()
    
    adjusting.value = true
    
    // 调用实际的余额调整API
    const response = await axios.post('/api/admin/v1/vip-balance/adjust', adjustForm)
    
    if (response.code === 0) {
      ElMessage.success(response.message || '余额调整成功')
      adjustDialogVisible.value = false
      loadBalanceList()
    } else {
      ElMessage.error(response.message || '余额调整失败')
    }
    
  } catch (error) {
    if (error !== false) { // 不是表单验证错误
      console.error('余额调整失败:', error)
      ElMessage.error(error.response?.data?.message || '余额调整失败')
    }
  } finally {
    adjusting.value = false
  }
}

const viewBalanceLog = async (user) => {
  try {
    selectedUser.value = user
    logDialogVisible.value = true
    logLoading.value = true
    
    // 调用实际的余额变动记录API
    const response = await axios.get('/api/admin/v1/vip-balance/logs', {
      params: { user_id: user.id }
    })
    
    if (response.code === 0) {
      balanceLogs.value = response.data.logs || []
    } else {
      ElMessage.error(response.message || '获取余额变动记录失败')
      balanceLogs.value = []
    }
    
  } catch (error) {
    console.error('获取余额变动记录失败:', error)
    ElMessage.error(error.response?.data?.message || '获取余额变动记录失败')
    balanceLogs.value = []
  } finally {
    logLoading.value = false
  }
}

// 生命周期
onMounted(() => {
  loadBalanceList()
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
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-description {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 400;
}

.page-actions {
  display: flex;
  gap: 12px;
}

.page-actions .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.page-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* VIP会员模块导航标签页 */
.navigation-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: none;
}

.vip-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vip-tabs .el-tab-pane {
  flex: 1;
}

.vip-tabs .el-tab-pane .tab-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 统计卡片 */
.stats-container {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.balance-card .stat-icon {
  background: linear-gradient(45deg, #e6a23c, #f7ba2a);
}

.users-card .stat-icon {
  background: linear-gradient(45deg, #409eff, #66b1ff);
}

.avg-card .stat-icon {
  background: linear-gradient(45deg, #67c23a, #85ce61);
}

.today-card .stat-icon {
  background: linear-gradient(45deg, #f56c6c, #f78989);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

/* 筛选卡片 */
.filter-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.filter-row {
  display: flex;
  gap: 20px;
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

/* 表格卡片 */
.table-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.total-count {
  color: #909399;
  font-size: 14px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details {
  flex: 1;
}

.user-details .user-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.user-details .user-nickname {
  font-size: 12px;
  color: #67c23a;
  margin-bottom: 2px;
}

.user-details .user-phone {
  font-size: 12px;
  color: #909399;
}

.balance-cell {
  text-align: center;
}

.balance-amount {
  font-weight: bold;
  font-size: 16px;
}

.balance-high {
  color: #67c23a;
}

.balance-medium {
  color: #e6a23c;
}

.balance-low {
  color: #409eff;
}

.balance-zero {
  color: #909399;
}

.balance-negative {
  color: #f56c6c;
}

.date-text {
  font-size: 12px;
  color: #606266;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}

/* 弹窗样式 */
.selected-user {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.current-balance {
  font-size: 16px;
  font-weight: bold;
  color: #e6a23c;
}

.predicted-balance {
  font-size: 16px;
  font-weight: bold;
}

.amount-positive {
  color: #67c23a;
  font-weight: 500;
}

.amount-negative {
  color: #f56c6c;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-container {
    padding: 15px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .header-right {
    width: 100%;
    justify-content: center;
  }
  
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-item {
    justify-content: space-between;
  }
}
</style> 