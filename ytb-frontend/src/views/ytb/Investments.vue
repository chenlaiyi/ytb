<template>
  <div class="ytb-investments-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.total_investments || 0 }}</div>
            <div class="stat-label">投资总数</div>
          </div>
          <el-icon class="stat-icon"><Wallet /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-amount">
          <div class="stat-content">
            <div class="stat-value">¥{{ formatMoney(stats.total_amount) }}</div>
            <div class="stat-label">投资总额</div>
          </div>
          <el-icon class="stat-icon"><Money /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-refund">
          <div class="stat-content">
            <div class="stat-value">¥{{ formatMoney(stats.total_refunded) }}</div>
            <div class="stat-label">已回款总额</div>
          </div>
          <el-icon class="stat-icon"><CreditCard /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-quota">
          <div class="stat-content">
            <div class="stat-value">{{ stats.total_quota || 0 }}</div>
            <div class="stat-label">总额度(台)</div>
          </div>
          <el-icon class="stat-icon"><Box /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索和筛选 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="用户昵称/手机号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option label="待支付" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="进行中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 投资列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="investments"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户信息" min-width="180">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="36" :src="row.user?.avatar">
                {{ row.user?.nickname?.charAt(0) || 'B' }}
              </el-avatar>
              <div class="user-detail">
                <div class="nickname">{{ row.user?.nickname || '未知' }}</div>
                <div class="phone">{{ row.user?.phone || '-' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="投资金额" width="120">
          <template #default="{ row }">
            <span class="amount">¥{{ formatMoney(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="额度(台)" width="100">
          <template #default="{ row }">
            {{ row.quota }}
          </template>
        </el-table-column>
        <el-table-column label="回款进度" min-width="200">
          <template #default="{ row }">
            <div class="progress-info">
              <el-progress 
                :percentage="row.refund_progress" 
                :color="getProgressColor(row.refund_progress)"
                :stroke-width="12"
              />
              <div class="progress-text">
                ¥{{ formatMoney(row.refunded_amount) }} / ¥{{ formatMoney(row.target_amount) }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="已分配" width="100">
          <template #default="{ row }">
            {{ row.allocated_count }} / {{ row.quota }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ row.status_name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" width="100">
          <template #default="{ row }">
            {{ getPaymentMethodName(row.payment_method) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              详情
            </el-button>
            <el-button 
              v-if="row.status === 'pending'"
              type="success" 
              link 
              size="small" 
              @click="handleConfirmPayment(row)"
            >
              确认支付
            </el-button>
            <el-button 
              v-if="['pending', 'paid'].includes(row.status)"
              type="danger" 
              link 
              size="small" 
              @click="handleCancel(row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.perPage"
          :page-sizes="[15, 30, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="投资详情" width="700px">
      <div v-if="currentInvestment" class="investment-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="投资ID">{{ currentInvestment.id }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ currentInvestment.user?.nickname }}</el-descriptions-item>
          <el-descriptions-item label="投资金额">¥{{ formatMoney(currentInvestment.amount) }}</el-descriptions-item>
          <el-descriptions-item label="获得额度">{{ currentInvestment.quota }} 台</el-descriptions-item>
          <el-descriptions-item label="目标回款">¥{{ formatMoney(currentInvestment.target_amount) }}</el-descriptions-item>
          <el-descriptions-item label="已回款">¥{{ formatMoney(currentInvestment.refunded_amount) }}</el-descriptions-item>
          <el-descriptions-item label="回款进度">{{ currentInvestment.refund_progress }}%</el-descriptions-item>
          <el-descriptions-item label="已分配">{{ currentInvestment.allocated_count }} 台</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(currentInvestment.status)">
              {{ currentInvestment.status_name }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ getPaymentMethodName(currentInvestment.payment_method) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(currentInvestment.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ formatDate(currentInvestment.paid_at) || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 回款记录 -->
        <div class="section-title">回款记录</div>
        <el-table :data="currentInvestment.refund_records || []" size="small" border>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="amount" label="回款金额" width="100">
            <template #default="{ row }">¥{{ row.amount }}</template>
          </el-table-column>
          <el-table-column prop="device_number" label="设备编号" min-width="150" />
          <el-table-column prop="created_at" label="时间" width="160" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Wallet, Money, CreditCard, Box, Search, Refresh } from '@element-plus/icons-vue'
import {
  getInvestments,
  getInvestmentDetail,
  getInvestmentStatistics,
  confirmInvestmentPayment,
  cancelInvestment
} from '@/api/v1/ytb'

// 状态
const loading = ref(false)
const investments = ref([])
const stats = ref({})
const currentInvestment = ref(null)
const detailVisible = ref(false)

// 筛选条件
const filters = reactive({
  keyword: '',
  status: '',
  dateRange: null
})

// 分页
const pagination = reactive({
  page: 1,
  perPage: 15,
  total: 0
})

// 初始化
onMounted(() => {
  loadStats()
  loadInvestments()
})

// 加载统计数据
const loadStats = async () => {
  try {
    const res = await getInvestmentStatistics()
    if (res.code === 0) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

// 加载投资列表
const loadInvestments = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.perPage,
      keyword: filters.keyword,
      status: filters.status
    }
    if (filters.dateRange) {
      params.start_date = filters.dateRange[0]
      params.end_date = filters.dateRange[1]
    }
    
    const res = await getInvestments(params)
    if (res.code === 0) {
      investments.value = res.data.items || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载投资列表失败:', error)
    ElMessage.error('加载投资列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadInvestments()
}

// 重置
const handleReset = () => {
  filters.keyword = ''
  filters.status = ''
  filters.dateRange = null
  pagination.page = 1
  loadInvestments()
}

// 分页
const handleSizeChange = (size) => {
  pagination.perPage = size
  pagination.page = 1
  loadInvestments()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadInvestments()
}

// 查看详情
const handleView = async (row) => {
  try {
    const res = await getInvestmentDetail(row.id)
    if (res.code === 0) {
      currentInvestment.value = res.data
      detailVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

// 确认支付
const handleConfirmPayment = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定确认投资 #${row.id} 的支付已完成吗？`,
      '确认支付',
      { type: 'warning' }
    )
    
    const res = await confirmInvestmentPayment(row.id)
    if (res.code === 0) {
      ElMessage.success('确认成功')
      loadInvestments()
      loadStats()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 取消投资
const handleCancel = async (row) => {
  try {
    const { value: remark } = await ElMessageBox.prompt(
      '请输入取消原因',
      '取消投资',
      {
        confirmButtonText: '确认取消',
        cancelButtonText: '返回',
        inputPlaceholder: '取消原因（可选）'
      }
    )
    
    const res = await cancelInvestment(row.id, remark)
    if (res.code === 0) {
      ElMessage.success('取消成功')
      loadInvestments()
      loadStats()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 工具函数
const formatMoney = (value) => {
  return parseFloat(value || 0).toFixed(2)
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').substring(0, 19)
}

const getStatusTagType = (status) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'paid': return 'primary'
    case 'active': return 'success'
    case 'completed': return ''
    case 'cancelled': return 'danger'
    default: return 'info'
  }
}

const getPaymentMethodName = (method) => {
  switch (method) {
    case 'wechat': return '微信支付'
    case 'offline': return '线下支付'
    default: return method || '-'
  }
}

const getProgressColor = (percentage) => {
  if (percentage >= 100) return '#67c23a'
  if (percentage >= 50) return '#409eff'
  return '#e6a23c'
}
</script>

<style scoped>
.ytb-investments-page {
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

.stat-card.stat-amount .stat-value {
  color: #67c23a;
}

.stat-card.stat-refund .stat-value {
  color: #e6a23c;
}

.stat-card.stat-quota .stat-value {
  color: #909399;
}

.stat-card .stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.stat-card .stat-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 48px;
  color: #f0f0f0;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.table-card {
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-detail .nickname {
  font-weight: 500;
}

.user-detail .phone {
  font-size: 12px;
  color: #909399;
}

.amount {
  font-weight: bold;
  color: #67c23a;
}

.progress-info {
  width: 100%;
}

.progress-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.investment-detail .section-title {
  margin: 20px 0 10px;
  font-weight: bold;
  color: #303133;
}
</style>
