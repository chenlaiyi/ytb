<template>
  <div class="ytb-commissions-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">¥{{ formatMoney(stats.total_amount) }}</div>
            <div class="stat-label">总分佣金额</div>
          </div>
          <el-icon class="stat-icon"><Money /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-pending">
          <div class="stat-content">
            <div class="stat-value">¥{{ formatMoney(stats.pending_amount) }}</div>
            <div class="stat-label">待结算</div>
          </div>
          <el-icon class="stat-icon"><Clock /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-settled">
          <div class="stat-content">
            <div class="stat-value">¥{{ formatMoney(stats.settled_amount) }}</div>
            <div class="stat-label">已结算</div>
          </div>
          <el-icon class="stat-icon"><CircleCheck /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-count">
          <div class="stat-content">
            <div class="stat-value">{{ stats.pending_commissions || 0 }}</div>
            <div class="stat-label">待结算笔数</div>
          </div>
          <el-icon class="stat-icon"><Document /></el-icon>
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
            <el-option label="待结算" value="pending" />
            <el-option label="已结算" value="settled" />
            <el-option label="已取消" value="cancelled" />
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
            @click="handleBatchSettle"
            :disabled="selectedIds.length === 0"
          >
            批量结算 ({{ selectedIds.length }})
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 分佣列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="commissions"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" :selectable="canSelect" />
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="获得者" min-width="180">
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
        <el-table-column label="来源用户" min-width="160">
          <template #default="{ row }">
            <div v-if="row.from_user">
              <div>{{ row.from_user.nickname || '未知' }}</div>
              <div class="text-muted">{{ row.from_user.phone || '-' }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="分佣金额" width="120">
          <template #default="{ row }">
            <span class="amount">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ row.status_name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" width="150">
          <template #default="{ row }">
            {{ row.remark || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="settled_at" label="结算时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.settled_at) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              详情
            </el-button>
            <template v-if="row.status === 'pending'">
              <el-button type="success" link size="small" @click="handleSettle(row)">
                结算
              </el-button>
              <el-button type="danger" link size="small" @click="handleCancel(row)">
                取消
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
    <el-dialog v-model="detailVisible" title="分佣详情" width="600px">
      <div v-if="currentCommission" class="detail-dialog">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ currentCommission.id }}</el-descriptions-item>
          <el-descriptions-item label="金额">
            <span class="amount">¥{{ currentCommission.amount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="获得者">
            {{ currentCommission.user?.nickname || '-' }} ({{ currentCommission.user?.phone || '-' }})
          </el-descriptions-item>
          <el-descriptions-item label="来源用户">
            {{ currentCommission.from_user?.nickname || '-' }} ({{ currentCommission.from_user?.phone || '-' }})
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentCommission.status)" size="small">
              {{ currentCommission.status_name }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="关联申请ID">
            {{ currentCommission.application_id || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">
            {{ currentCommission.remark || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(currentCommission.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="结算时间">
            {{ formatDate(currentCommission.settled_at) || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Money, Clock, CircleCheck, Document, Search, Refresh } from '@element-plus/icons-vue'
import {
  getCommissions,
  getCommissionDetail,
  getCommissionStatistics,
  settleCommission,
  cancelCommission,
  batchSettleCommissions
} from '@/api/v1/ytb'

// 状态
const loading = ref(false)
const commissions = ref([])
const stats = ref({})
const currentCommission = ref(null)
const detailVisible = ref(false)
const selectedIds = ref([])
const dateRange = ref([])

// 筛选条件
const filters = reactive({
  keyword: '',
  status: '',
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
  loadCommissions()
})

// 加载统计数据
const loadStats = async () => {
  try {
    const res = await getCommissionStatistics()
    if (res.code === 0) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

// 加载分佣列表
const loadCommissions = async () => {
  loading.value = true
  try {
    const res = await getCommissions({
      page: pagination.page,
      per_page: pagination.perPage,
      ...filters
    })
    if (res.code === 0) {
      commissions.value = res.data.items || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载分佣失败:', error)
    ElMessage.error('加载分佣列表失败')
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
  loadCommissions()
}

// 重置
const handleReset = () => {
  filters.keyword = ''
  filters.status = ''
  filters.start_date = ''
  filters.end_date = ''
  dateRange.value = []
  pagination.page = 1
  loadCommissions()
}

// 分页
const handleSizeChange = (size) => {
  pagination.perPage = size
  pagination.page = 1
  loadCommissions()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadCommissions()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedIds.value = selection.filter(item => item.status === 'pending').map(item => item.id)
}

// 是否可选
const canSelect = (row) => {
  return row.status === 'pending'
}

// 查看详情
const handleView = async (row) => {
  try {
    const res = await getCommissionDetail(row.id)
    if (res.code === 0) {
      currentCommission.value = res.data
      detailVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

// 结算
const handleSettle = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要结算这笔 ¥${row.amount} 的分佣吗？`,
      '确认结算',
      { type: 'warning' }
    )

    const res = await settleCommission(row.id)
    if (res.code === 0) {
      ElMessage.success('结算成功')
      loadCommissions()
      loadStats()
    } else {
      ElMessage.error(res.message || '结算失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('结算失败')
    }
  }
}

// 取消
const handleCancel = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消这笔 ¥${row.amount} 的分佣吗？`,
      '确认取消',
      { type: 'warning' }
    )

    const res = await cancelCommission(row.id, '管理员取消')
    if (res.code === 0) {
      ElMessage.success('取消成功')
      loadCommissions()
      loadStats()
    } else {
      ElMessage.error(res.message || '取消失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

// 批量结算
const handleBatchSettle = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要结算的记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要批量结算选中的 ${selectedIds.value.length} 条记录吗？`,
      '批量结算',
      { type: 'warning' }
    )

    const res = await batchSettleCommissions(selectedIds.value)
    if (res.code === 0) {
      ElMessage.success(res.message || '批量结算成功')
      selectedIds.value = []
      loadCommissions()
      loadStats()
    } else {
      ElMessage.error(res.message || '批量结算失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量结算失败')
    }
  }
}

// 工具函数
const getStatusType = (status) => {
  switch (status) {
    case 'settled': return 'success'
    case 'cancelled': return 'info'
    default: return 'warning'
  }
}

const getRoleTagType = (role) => {
  switch (role) {
    case 'scp': return 'warning'
    case 'team_cp': return 'danger'
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
</script>

<style scoped>
.ytb-commissions-page {
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

.stat-card.stat-pending .stat-value {
  color: #e6a23c;
}

.stat-card.stat-settled .stat-value {
  color: #67c23a;
}

.stat-card.stat-count .stat-value {
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

.text-muted {
  font-size: 12px;
  color: #909399;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
