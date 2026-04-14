<template>
  <div class="ytb-withdrawals-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.pending_withdrawals || 0 }}</div>
            <div class="stat-label">待处理</div>
          </div>
          <el-icon class="stat-icon"><Clock /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-processing">
          <div class="stat-content">
            <div class="stat-value">{{ stats.processing_withdrawals || 0 }}</div>
            <div class="stat-label">处理中</div>
          </div>
          <el-icon class="stat-icon"><Loading /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-completed">
          <div class="stat-content">
            <div class="stat-value">{{ formatMoney(stats.completed_amount) }}</div>
            <div class="stat-label">已完成金额</div>
          </div>
          <el-icon class="stat-icon"><CircleCheck /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-pending">
          <div class="stat-content">
            <div class="stat-value">{{ formatMoney(stats.pending_amount) }}</div>
            <div class="stat-label">待处理金额</div>
          </div>
          <el-icon class="stat-icon"><Money /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索和筛选 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="订单号/用户昵称/手机号/账户名"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="提现方式">
          <el-select v-model="filters.withdraw_type" placeholder="全部方式" clearable>
            <el-option label="银行卡" value="bank_card" />
            <el-option label="微信钱包" value="wechat" />
            <el-option label="支付宝" value="alipay" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
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
          <el-button
            type="success"
            @click="handleBatchComplete"
            :disabled="selectedIds.length === 0"
          >
            批量完成 ({{ selectedIds.length }})
          </el-button>
          <el-button type="warning" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 提现列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="withdrawals"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" :selectable="canSelect" />
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column label="用户信息" min-width="180">
          <template #default="{ row }">
            <div v-if="row.user" class="user-info">
              <el-avatar :size="36" :src="row.user.avatar">
                {{ row.user.nickname?.charAt(0) || 'Y' }}
              </el-avatar>
              <div class="user-detail">
                <div class="nickname">{{ row.user.nickname || '未设置' }}</div>
                <div class="phone">{{ row.user.phone || '-' }}</div>
                <el-tag size="small" :type="getRoleTagType(row.user.role)">
                  {{ row.user.role_name }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="提现金额" width="120">
          <template #default="{ row }">
            <span class="amount">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="实际到账" width="120">
          <template #default="{ row }">
            <span class="actual-amount">¥{{ row.actual_amount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="费用" width="100">
          <template #default="{ row }">
            <div class="fee-info">
              <div>税费: ¥{{ row.tax_fee }}</div>
              <div>手续费: ¥{{ row.service_fee }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="提现方式" width="100">
          <template #default="{ row }">
            <el-tag :type="getWithdrawTypeTag(row.withdraw_type)" size="small">
              {{ row.withdraw_type_name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="收款账户" min-width="160">
          <template #default="{ row }">
            <div>{{ row.account_name }}</div>
            <div class="text-muted">{{ maskAccountNo(row.account_no) }}</div>
            <div v-if="row.bank_name" class="text-muted">{{ row.bank_name }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ row.status_name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              详情
            </el-button>
            <template v-if="row.status === 'pending'">
              <el-button type="warning" link size="small" @click="handleProcess(row)">
                处理
              </el-button>
              <el-button type="success" link size="small" @click="handleComplete(row)">
                完成
              </el-button>
              <el-button type="danger" link size="small" @click="handleReject(row)">
                拒绝
              </el-button>
            </template>
            <template v-else-if="row.status === 'processing'">
              <el-button type="success" link size="small" @click="handleComplete(row)">
                完成
              </el-button>
              <el-button type="danger" link size="small" @click="handleReject(row)">
                拒绝
              </el-button>
            </template>
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
    <el-dialog v-model="detailVisible" title="提现详情" width="700px">
      <div v-if="currentWithdrawal" class="detail-dialog">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ currentWithdrawal.order_no }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentWithdrawal.status)" size="small">
              {{ currentWithdrawal.status_name }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="用户昵称">
            {{ currentWithdrawal.user?.nickname || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="用户手机">
            {{ currentWithdrawal.user?.phone || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="提现金额">
            <span class="amount">¥{{ currentWithdrawal.amount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="实际到账">
            <span class="actual-amount">¥{{ currentWithdrawal.actual_amount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="税费">¥{{ currentWithdrawal.tax_fee }}</el-descriptions-item>
          <el-descriptions-item label="手续费">¥{{ currentWithdrawal.service_fee }}</el-descriptions-item>
          <el-descriptions-item label="提现方式">
            <el-tag :type="getWithdrawTypeTag(currentWithdrawal.withdraw_type)" size="small">
              {{ currentWithdrawal.withdraw_type_name }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="收款账户">{{ currentWithdrawal.account_name }}</el-descriptions-item>
          <el-descriptions-item label="账号">{{ currentWithdrawal.account_no }}</el-descriptions-item>
          <el-descriptions-item label="开户行">{{ currentWithdrawal.bank_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="支行">{{ currentWithdrawal.bank_branch || '-' }}</el-descriptions-item>
          <el-descriptions-item label="交易流水号">{{ currentWithdrawal.transaction_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ formatDate(currentWithdrawal.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="处理时间">{{ formatDate(currentWithdrawal.processed_at) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ formatDate(currentWithdrawal.completed_at) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="处理人">{{ currentWithdrawal.admin?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentWithdrawal.admin_remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 完成提现弹窗 -->
    <el-dialog v-model="completeVisible" title="完成提现" width="500px">
      <el-form :model="completeForm" label-width="100px">
        <el-form-item label="交易流水号">
          <el-input v-model="completeForm.transaction_id" placeholder="请输入银行/支付平台交易流水号" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="completeForm.remark" type="textarea" :rows="3" placeholder="请输入备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmComplete" :loading="submitting">确认完成</el-button>
      </template>
    </el-dialog>

    <!-- 拒绝提现弹窗 -->
    <el-dialog v-model="rejectVisible" title="拒绝提现" width="500px">
      <el-form :model="rejectForm" label-width="100px">
        <el-form-item label="拒绝原因" required>
          <el-input v-model="rejectForm.remark" type="textarea" :rows="3" placeholder="请输入拒绝原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject" :loading="submitting">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Money, Clock, CircleCheck, Loading, Search, Refresh, Download } from '@element-plus/icons-vue'
import {
  getWithdrawals,
  getWithdrawalDetail,
  getWithdrawalStatistics,
  processWithdrawal,
  completeWithdrawal,
  rejectWithdrawal,
  batchCompleteWithdrawals,
  exportWithdrawals
} from '@/api/v1/ytb'

// 状态
const loading = ref(false)
const submitting = ref(false)
const withdrawals = ref([])
const stats = ref({})
const currentWithdrawal = ref(null)
const detailVisible = ref(false)
const completeVisible = ref(false)
const rejectVisible = ref(false)
const selectedIds = ref([])
const dateRange = ref([])

// 表单
const completeForm = reactive({
  id: null,
  transaction_id: '',
  remark: ''
})

const rejectForm = reactive({
  id: null,
  remark: ''
})

// 筛选条件
const filters = reactive({
  keyword: '',
  status: '',
  withdraw_type: '',
  start_date: '',
  end_date: ''
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
  loadWithdrawals()
})

// 加载统计数据
const loadStats = async () => {
  try {
    const res = await getWithdrawalStatistics()
    if (res.code === 0) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

// 加载提现列表
const loadWithdrawals = async () => {
  loading.value = true
  try {
    const res = await getWithdrawals({
      page: pagination.page,
      per_page: pagination.perPage,
      ...filters
    })
    if (res.code === 0) {
      withdrawals.value = res.data.items || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载提现列表失败:', error)
    ElMessage.error('加载提现列表失败')
  } finally {
    loading.value = false
  }
}

// 日期范围变化
const handleDateChange = (val) => {
  if (val) {
    filters.start_date = val[0]
    filters.end_date = val[1]
  } else {
    filters.start_date = ''
    filters.end_date = ''
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadWithdrawals()
}

// 重置
const handleReset = () => {
  filters.keyword = ''
  filters.status = ''
  filters.withdraw_type = ''
  filters.start_date = ''
  filters.end_date = ''
  dateRange.value = []
  pagination.page = 1
  loadWithdrawals()
}

// 分页
const handleSizeChange = (size) => {
  pagination.perPage = size
  pagination.page = 1
  loadWithdrawals()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadWithdrawals()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedIds.value = selection
    .filter(item => item.status === 'pending' || item.status === 'processing')
    .map(item => item.id)
}

// 是否可选
const canSelect = (row) => {
  return row.status === 'pending' || row.status === 'processing'
}

// 查看详情
const handleView = async (row) => {
  try {
    const res = await getWithdrawalDetail(row.id)
    if (res.code === 0) {
      currentWithdrawal.value = res.data
      detailVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

// 开始处理
const handleProcess = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要开始处理订单 ${row.order_no} 吗？`,
      '确认处理',
      { type: 'warning' }
    )

    const res = await processWithdrawal(row.id)
    if (res.code === 0) {
      ElMessage.success('已开始处理')
      loadWithdrawals()
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

// 完成提现
const handleComplete = (row) => {
  completeForm.id = row.id
  completeForm.transaction_id = ''
  completeForm.remark = ''
  completeVisible.value = true
}

const confirmComplete = async () => {
  submitting.value = true
  try {
    const res = await completeWithdrawal(completeForm.id, {
      transaction_id: completeForm.transaction_id,
      remark: completeForm.remark
    })
    if (res.code === 0) {
      ElMessage.success('提现已完成')
      completeVisible.value = false
      loadWithdrawals()
      loadStats()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 拒绝提现
const handleReject = (row) => {
  rejectForm.id = row.id
  rejectForm.remark = ''
  rejectVisible.value = true
}

const confirmReject = async () => {
  if (!rejectForm.remark) {
    ElMessage.warning('请输入拒绝原因')
    return
  }

  submitting.value = true
  try {
    const res = await rejectWithdrawal(rejectForm.id, rejectForm.remark)
    if (res.code === 0) {
      ElMessage.success('已拒绝提现')
      rejectVisible.value = false
      loadWithdrawals()
      loadStats()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 批量完成
const handleBatchComplete = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要处理的记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要批量完成选中的 ${selectedIds.value.length} 条提现记录吗？`,
      '批量完成',
      { type: 'warning' }
    )

    const res = await batchCompleteWithdrawals(selectedIds.value)
    if (res.code === 0) {
      ElMessage.success(res.message || '批量处理成功')
      selectedIds.value = []
      loadWithdrawals()
      loadStats()
    } else {
      ElMessage.error(res.message || '批量处理失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量处理失败')
    }
  }
}

// 导出
const handleExport = async () => {
  try {
    const res = await exportWithdrawals(filters)
    if (res.code === 0) {
      // 转换为CSV并下载
      const data = res.data
      if (data.length === 0) {
        ElMessage.warning('没有可导出的数据')
        return
      }

      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
      ].join('\n')

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `提现记录_${new Date().toISOString().slice(0, 10)}.csv`
      link.click()

      ElMessage.success('导出成功')
    } else {
      ElMessage.error(res.message || '导出失败')
    }
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 工具函数
const getStatusType = (status) => {
  switch (status) {
    case 'completed': return 'success'
    case 'rejected': return 'danger'
    case 'processing': return 'warning'
    default: return 'info'
  }
}

const getWithdrawTypeTag = (type) => {
  switch (type) {
    case 'bank_card': return ''
    case 'wechat': return 'success'
    case 'alipay': return 'primary'
    default: return 'info'
  }
}

const getRoleTagType = (role) => {
  switch (role) {
    case 'scp': return 'warning'
    case 'team_cp': return 'danger'
    case 'boss_cp': return 'success'
    default: return 'info'
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').substring(0, 19)
}

const formatMoney = (value) => {
  return parseFloat(value || 0).toFixed(2)
}

const maskAccountNo = (accountNo) => {
  if (!accountNo) return '-'
  if (accountNo.length <= 8) return accountNo
  return accountNo.substring(0, 4) + '****' + accountNo.substring(accountNo.length - 4)
}
</script>

<style scoped>
.ytb-withdrawals-page {
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
  color: #909399;
}

.stat-card.stat-processing .stat-value {
  color: #e6a23c;
}

.stat-card.stat-completed .stat-value {
  color: #67c23a;
}

.stat-card.stat-pending .stat-value {
  color: #f56c6c;
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
  color: #f56c6c;
  font-size: 15px;
}

.actual-amount {
  font-weight: bold;
  color: #67c23a;
  font-size: 15px;
}

.fee-info {
  font-size: 12px;
  color: #909399;
}

.text-muted {
  font-size: 12px;
  color: #909399;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.detail-dialog .amount {
  font-size: 18px;
}

.detail-dialog .actual-amount {
  font-size: 18px;
}
</style>
