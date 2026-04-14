<template>
  <div class="ytb-upgrades-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.total_applications || 0 }}</div>
            <div class="stat-label">总申请数</div>
          </div>
          <el-icon class="stat-icon"><Document /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-pending">
          <div class="stat-content">
            <div class="stat-value">{{ stats.pending_applications || 0 }}</div>
            <div class="stat-label">待审批</div>
          </div>
          <el-icon class="stat-icon"><Clock /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-approved">
          <div class="stat-content">
            <div class="stat-value">{{ stats.approved_applications || 0 }}</div>
            <div class="stat-label">已通过</div>
          </div>
          <el-icon class="stat-icon"><CircleCheck /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-revenue">
          <div class="stat-content">
            <div class="stat-value">¥{{ formatMoney(stats.total_revenue) }}</div>
            <div class="stat-label">总收入</div>
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
            placeholder="用户昵称/手机号/姓名"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="目标角色">
          <el-select v-model="filters.to_role" placeholder="全部" clearable>
            <el-option label="CP伙伴" value="scp" />
            <el-option label="VIPCP伙伴" value="team_cp" />
          </el-select>
        </el-form-item>
        <el-form-item label="升级方式">
          <el-select v-model="filters.upgrade_type" placeholder="全部" clearable>
            <el-option label="邀请码升级" value="invite_code" />
            <el-option label="直接付费" value="direct_pay" />
            <el-option label="业绩达标" value="achievement" />
          </el-select>
        </el-form-item>
        <el-form-item label="审批状态">
          <el-select v-model="filters.admin_status" placeholder="全部" clearable>
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
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

    <!-- 申请列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="applications"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="申请用户" min-width="180">
          <template #default="{ row }">
            <div v-if="row.user" class="user-info">
              <el-avatar :size="36" :src="row.user.avatar">
                {{ row.user.nickname?.charAt(0) || 'Y' }}
              </el-avatar>
              <div class="user-detail">
                <div class="nickname">{{ row.user.nickname || '未设置' }}</div>
                <div class="phone">{{ row.user.phone || '-' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="升级类型" width="180">
          <template #default="{ row }">
            <div>
              <el-tag size="small" type="info">{{ row.from_role_name }}</el-tag>
              <span class="arrow">→</span>
              <el-tag size="small" :type="row.to_role === 'team_cp' ? 'danger' : 'warning'">
                {{ row.to_role_name }}
              </el-tag>
            </div>
            <div class="upgrade-type">{{ row.upgrade_type_name }}</div>
          </template>
        </el-table-column>
        <el-table-column label="邀请人" width="140">
          <template #default="{ row }">
            <div v-if="row.inviter">
              <div>{{ row.inviter.nickname || '未知' }}</div>
              <div class="text-muted">{{ row.inviter.phone }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="支付信息" width="140">
          <template #default="{ row }">
            <div v-if="row.amount > 0">
              <div class="amount">¥{{ row.amount }}</div>
              <div class="text-muted">{{ row.payment_method_name }}</div>
            </div>
            <span v-else>免费</span>
          </template>
        </el-table-column>
        <el-table-column label="支付状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getPaymentStatusType(row.payment_status)" size="small">
              {{ row.payment_status_name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审批状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getAdminStatusType(row.admin_status)" size="small">
              {{ row.admin_status_name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              详情
            </el-button>
            <template v-if="row.admin_status === 'pending'">
              <el-button
                v-if="row.payment_method === 'offline' && row.payment_status === 'pending'"
                type="warning"
                link
                size="small"
                @click="handleConfirmPayment(row)"
              >
                确认支付
              </el-button>
              <el-button type="success" link size="small" @click="handleApprove(row)">
                通过
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
    <el-dialog v-model="detailVisible" title="申请详情" width="700px">
      <div v-if="currentApp" class="detail-dialog">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申请ID">{{ currentApp.id }}</el-descriptions-item>
          <el-descriptions-item label="订单号">{{ currentApp.order_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申请用户">
            {{ currentApp.user?.nickname || '-' }} ({{ currentApp.user?.phone || '-' }})
          </el-descriptions-item>
          <el-descriptions-item label="真实姓名">{{ currentApp.user?.real_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="原角色">{{ currentApp.from_role_name }}</el-descriptions-item>
          <el-descriptions-item label="目标角色">{{ currentApp.to_role_name }}</el-descriptions-item>
          <el-descriptions-item label="升级方式">{{ currentApp.upgrade_type_name }}</el-descriptions-item>
          <el-descriptions-item label="邀请人">
            {{ currentApp.inviter?.nickname || '-' }} ({{ currentApp.inviter?.phone || '-' }})
          </el-descriptions-item>
          <el-descriptions-item label="支付金额">¥{{ currentApp.amount || '0.00' }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ currentApp.payment_method_name }}</el-descriptions-item>
          <el-descriptions-item label="支付状态">
            <el-tag :type="getPaymentStatusType(currentApp.payment_status)" size="small">
              {{ currentApp.payment_status_name }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审批状态">
            <el-tag :type="getAdminStatusType(currentApp.admin_status)" size="small">
              {{ currentApp.admin_status_name }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ formatDate(currentApp.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ formatDate(currentApp.paid_at) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审批时间">{{ formatDate(currentApp.approved_at) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审批备注">{{ currentApp.admin_remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 拒绝原因弹窗 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝申请" width="400px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝原因" required>
          <el-input
            v-model="rejectForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject" :loading="submitting">
          确认拒绝
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Clock, CircleCheck, Money, Search, Refresh } from '@element-plus/icons-vue'
import {
  getUpgrades,
  getUpgradeDetail,
  getUpgradeStatistics,
  approveUpgrade,
  rejectUpgrade,
  confirmPayment
} from '@/api/v1/ytb'

// 状态
const loading = ref(false)
const submitting = ref(false)
const applications = ref([])
const stats = ref({})
const currentApp = ref(null)
const detailVisible = ref(false)
const rejectDialogVisible = ref(false)

// 筛选条件
const filters = reactive({
  keyword: '',
  to_role: '',
  upgrade_type: '',
  admin_status: ''
})

// 分页
const pagination = reactive({
  page: 1,
  perPage: 15,
  total: 0
})

// 拒绝表单
const rejectForm = reactive({
  id: null,
  remark: ''
})

// 初始化
onMounted(() => {
  loadStats()
  loadApplications()
})

// 加载统计数据
const loadStats = async () => {
  try {
    const res = await getUpgradeStatistics()
    if (res.code === 0) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

// 加载申请列表
const loadApplications = async () => {
  loading.value = true
  try {
    const res = await getUpgrades({
      page: pagination.page,
      per_page: pagination.perPage,
      ...filters
    })
    if (res.code === 0) {
      applications.value = res.data.items || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载申请失败:', error)
    ElMessage.error('加载申请列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadApplications()
}

// 重置
const handleReset = () => {
  filters.keyword = ''
  filters.to_role = ''
  filters.upgrade_type = ''
  filters.admin_status = ''
  pagination.page = 1
  loadApplications()
}

// 分页
const handleSizeChange = (size) => {
  pagination.perPage = size
  pagination.page = 1
  loadApplications()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadApplications()
}

// 查看详情
const handleView = async (row) => {
  try {
    const res = await getUpgradeDetail(row.id)
    if (res.code === 0) {
      currentApp.value = res.data
      detailVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

// 确认线下支付
const handleConfirmPayment = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要确认用户 "${row.user?.nickname || row.user?.phone}" 的线下支付吗？`,
      '确认支付',
      { type: 'warning' }
    )

    const res = await confirmPayment(row.id)
    if (res.code === 0) {
      ElMessage.success('支付确认成功')
      loadApplications()
      loadStats()
    } else {
      ElMessage.error(res.message || '确认失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('确认失败')
    }
  }
}

// 审批通过
const handleApprove = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要通过用户 "${row.user?.nickname || row.user?.phone}" 的升级申请吗？`,
      '审批通过',
      { type: 'success' }
    )

    const res = await approveUpgrade(row.id)
    if (res.code === 0) {
      ElMessage.success('审批通过')
      loadApplications()
      loadStats()
    } else {
      ElMessage.error(res.message || '审批失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('审批失败')
    }
  }
}

// 拒绝申请
const handleReject = (row) => {
  rejectForm.id = row.id
  rejectForm.remark = ''
  rejectDialogVisible.value = true
}

// 确认拒绝
const confirmReject = async () => {
  if (!rejectForm.remark.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }

  submitting.value = true
  try {
    const res = await rejectUpgrade(rejectForm.id, rejectForm.remark)
    if (res.code === 0) {
      ElMessage.success('已拒绝该申请')
      rejectDialogVisible.value = false
      loadApplications()
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

// 工具函数
const getPaymentStatusType = (status) => {
  switch (status) {
    case 'paid': return 'success'
    case 'refunded': return 'info'
    default: return 'warning'
  }
}

const getAdminStatusType = (status) => {
  switch (status) {
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    default: return 'warning'
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
.ytb-upgrades-page {
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

.stat-card.stat-approved .stat-value {
  color: #67c23a;
}

.stat-card.stat-revenue .stat-value {
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

.arrow {
  margin: 0 8px;
  color: #909399;
}

.upgrade-type {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.amount {
  font-weight: bold;
  color: #f56c6c;
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
