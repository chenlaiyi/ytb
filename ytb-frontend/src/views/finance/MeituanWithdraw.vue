<template>
  <div class="meituan-withdraw-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div>
            <span class="card-title">美团提现管理</span>
            <p class="card-desc">查看并审核美团钱包提现申请</p>
          </div>
          <el-button type="primary" link @click="refreshAll" :loading="loading || statLoading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <div class="stats-grid">
        <div class="stat-card pending">
          <p class="label">待审核金额</p>
          <p class="value">¥{{ formatAmount(stats.pending_amount) }}</p>
        </div>
        <div class="stat-card completed">
          <p class="label">已打款金额</p>
          <p class="value">¥{{ formatAmount(stats.completed_amount) }}</p>
        </div>
        <div class="stat-card rejected">
          <p class="label">已驳回金额</p>
          <p class="value">¥{{ formatAmount(stats.rejected_amount) }}</p>
        </div>
        <div class="stat-card today">
          <p class="label">今日提现</p>
          <p class="value">¥{{ formatAmount(stats.today_amount) }}</p>
        </div>
        <div class="stat-card balance">
          <p class="label">支付宝企业账户余额</p>
          <p class="value">¥{{ formatAmount(alipayBalance) }}</p>
        </div>
      </div>

      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索机构/用户/参考号"
          class="filter-item"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="filters.status"
          placeholder="状态筛选"
          class="filter-item"
          clearable
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option label="待审核" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已完成" value="completed" />
          <el-option label="已驳回" value="rejected" />
          <el-option label="失败" value="failed" />
        </el-select>
        <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          class="filter-item"
          unlink-panels
          @change="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="resetFilters">重置</el-button>
        <el-button type="success" plain @click="handleExport">
          <el-icon><Download /></el-icon>
          导出记录
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="withdrawList"
        border
        style="width: 100%"
      >
        <el-table-column prop="reference_no" label="参考号" width="160" fixed="left" />
        <el-table-column label="机构/用户" min-width="200">
          <template #default="{ row }">
            <div class="cell-main">{{ row.institution_name || row.user_institution_name || '-' }}</div>
            <div class="cell-sub">{{ row.account_name }} / {{ row.user_phone }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="提现金额" width="120">
          <template #default="{ row }">¥{{ formatAmount(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="net_amount" label="到账金额" width="120">
          <template #default="{ row }">¥{{ formatAmount(row.net_amount) }}</template>
        </el-table-column>
        <el-table-column prop="business_date" label="业务日期" width="130" />
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">
              {{ statusMap[row.status]?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="160" />
        <el-table-column prop="processed_at" label="处理时间" width="160" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="openDetail(row)">详情</el-button>
            <el-button
              v-if="['pending', 'processing'].includes(row.status)"
              text
              type="success"
              size="small"
              @click="openAudit(row, 'completed')"
            >
              通过
            </el-button>
            <el-button
              v-if="['pending', 'processing'].includes(row.status)"
              text
              type="danger"
              size="small"
              @click="openAudit(row, 'rejected')"
            >
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-pagination
          background
          layout="prev, pager, next, jumper"
          :total="pagination.total"
          :page-size="pagination.per_page"
          :current-page="pagination.page"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="auditDialog.visible"
      :title="auditDialog.action === 'completed' ? '确认通过' : '驳回申请'"
      width="460px"
      destroy-on-close
    >
      <el-form label-width="100px" :model="auditDialog.form">
        <el-form-item label="参考号">
          <span>{{ auditDialog.form.reference }}</span>
        </el-form-item>
        <template v-if="auditDialog.action === 'completed'">
          <el-form-item label="打款渠道">
            <el-select v-model="auditDialog.form.payout_channel" placeholder="选择渠道">
              <el-option label="人工打款" value="manual" />
              <el-option label="支付宝转账" value="alipay" />
            </el-select>
          </el-form-item>
          <el-form-item label="批次号">
            <el-input v-model="auditDialog.form.payout_batch_no" placeholder="可选" clearable />
          </el-form-item>
          <el-form-item label="凭证编号">
            <el-input v-model="auditDialog.form.payout_reference" placeholder="可选" clearable />
          </el-form-item>
          <el-form-item
            v-if="auditDialog.form.payout_channel === 'alipay'"
            label="管理密码"
            required
          >
            <el-input
              v-model="auditDialog.form.manage_password"
              type="password"
              show-password
              autocomplete="new-password"
              placeholder="审批自动打款需输入管理密码"
            />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="驳回原因" required>
            <el-input
              v-model="auditDialog.form.reason"
              type="textarea"
              :rows="3"
              maxlength="200"
              show-word-limit
              placeholder="填写驳回说明"
            />
          </el-form-item>
        </template>
        <el-form-item label="备注">
          <el-input
            v-model="auditDialog.form.remark"
            type="textarea"
            :rows="2"
            maxlength="200"
            show-word-limit
            placeholder="可填写处理备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="auditDialog.loading" @click="submitAudit">
          确认
        </el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailDrawer.visible" size="520px" title="提现详情" destroy-on-close>
      <el-descriptions v-if="detailDrawer.data" :column="1" border>
        <el-descriptions-item label="参考号">{{ detailDrawer.data.reference_no }}</el-descriptions-item>
        <el-descriptions-item label="机构名称">{{ detailDrawer.data.institution_name || detailDrawer.data.user_institution_name }}</el-descriptions-item>
        <el-descriptions-item label="提现用户">{{ detailDrawer.data.account_name }} ({{ detailDrawer.data.user_phone }})</el-descriptions-item>
        <el-descriptions-item label="提现金额">¥{{ formatAmount(detailDrawer.data.amount) }}</el-descriptions-item>
        <el-descriptions-item label="到账金额">¥{{ formatAmount(detailDrawer.data.net_amount) }}</el-descriptions-item>
        <el-descriptions-item label="手续费">¥{{ formatAmount(detailDrawer.data.fee_amount) }}</el-descriptions-item>
        <el-descriptions-item label="业务日期">{{ detailDrawer.data.business_date }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusMap[detailDrawer.data.status]?.type || 'info'">
            {{ statusMap[detailDrawer.data.status]?.label || detailDrawer.data.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付宝账号">{{ detailDrawer.data.account_identifier || '-' }}</el-descriptions-item>
        <el-descriptions-item label="提交IP">{{ detailDrawer.data.submitted_ip || '-' }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ detailDrawer.data.created_at }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ detailDrawer.data.processed_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detailDrawer.data.audit_remark || detailDrawer.data.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="驳回原因" v-if="detailDrawer.data.rejection_reason">
          {{ detailDrawer.data.rejection_reason }}
        </el-descriptions-item>
      </el-descriptions>
      <div v-else class="drawer-empty">
        <el-empty description="暂无数据" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { Refresh, Search, Download } from '@element-plus/icons-vue'
import {
  fetchMeituanWithdrawList,
  fetchMeituanWithdrawStats,
  fetchMeituanWithdrawDetail,
  auditMeituanWithdraw,
  exportMeituanWithdraw
} from '@/api/financeMeituanWithdraw'
import { getAlipayBalance } from '@/api/shengfutong'

const loading = ref(false)
const statLoading = ref(false)
const withdrawList = ref([])
const stats = reactive({
  pending_amount: 0,
  completed_amount: 0,
  rejected_amount: 0,
  today_amount: 0
})

const alipayBalance = ref(0)

const filters = reactive({
  keyword: '',
  status: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  per_page: 20,
  total: 0
})

const statusMap = {
  pending: { label: '待审核', type: 'warning' },
  processing: { label: '处理中', type: 'warning' },
  completed: { label: '已打款', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
  failed: { label: '失败', type: 'danger' }
}

const detailDrawer = reactive({
  visible: false,
  data: null
})

const auditDialog = reactive({
  visible: false,
  action: 'completed',
  loading: false,
  form: {
    id: null,
    reference: '',
    payout_channel: 'alipay',
    payout_batch_no: '',
    payout_reference: '',
    reason: '',
    remark: '',
    manage_password: ''
  }
})

const buildQuery = () => {
  const params = {
    page: pagination.page,
    per_page: pagination.per_page,
    status: filters.status || undefined,
    keyword: filters.keyword || undefined
  }

  if (filters.dateRange?.length === 2) {
    params.date_start = filters.dateRange[0]
    params.date_end = filters.dateRange[1]
  }

  return params
}

const fetchStats = async () => {
  statLoading.value = true
  try {
    const response = await fetchMeituanWithdrawStats(buildQuery())
    if (response?.data) {
      Object.assign(stats, response.data)
    }
    await fetchAlipayBalance()
  } finally {
    statLoading.value = false
  }
}

const fetchAlipayBalance = async () => {
  try {
    const response = await getAlipayBalance()
    if (response?.data?.balance !== undefined) {
      alipayBalance.value = Number(response.data.balance) || 0
    }
  } catch (error) {
    console.error('获取支付宝余额失败', error)
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = buildQuery()
    const response = await fetchMeituanWithdrawList(params)
    if (response?.data) {
      withdrawList.value = response.data.list || []
      pagination.total = response.data.pagination?.total || 0
      pagination.page = response.data.pagination?.page || 1
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchStats()
  fetchList()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchList()
}

const resetFilters = () => {
  filters.keyword = ''
  filters.status = ''
  filters.dateRange = []
  handleSearch()
}

const refreshAll = () => {
  fetchStats()
  fetchList()
}

const handleExport = () => {
  const url = exportMeituanWithdraw(buildQuery())
  window.open(url, '_blank')
}

const openDetail = async (row) => {
  detailDrawer.visible = true
  detailDrawer.data = null
  const response = await fetchMeituanWithdrawDetail(row.id)
  if (response?.data) {
    detailDrawer.data = response.data
  }
}

const openAudit = (row, action) => {
  auditDialog.visible = true
  auditDialog.action = action
  auditDialog.form = {
    id: row.id,
    reference: row.reference_no,
    payout_channel: 'alipay',
    payout_batch_no: '',
    payout_reference: '',
    reason: '',
    remark: '',
    manage_password: ''
  }
}

const submitAudit = async () => {
  if (!auditDialog.form.id) return
  auditDialog.loading = true
  try {
    const payload = {
      status: auditDialog.action,
      payout_channel: auditDialog.form.payout_channel,
      payout_batch_no: auditDialog.form.payout_batch_no,
      payout_reference: auditDialog.form.payout_reference,
      reason: auditDialog.action === 'rejected' ? auditDialog.form.reason : undefined,
      remark: auditDialog.form.remark
    }
    if (
      auditDialog.action === 'completed' &&
      auditDialog.form.payout_channel === 'alipay'
    ) {
      if (!auditDialog.form.manage_password) {
        ElMessage.warning('请输入管理密码以完成自动打款')
        auditDialog.loading = false
        return
      }
      payload.manage_password = auditDialog.form.manage_password
    }
    await auditMeituanWithdraw(auditDialog.form.id, payload)
    ElMessage.success('操作成功')
    auditDialog.visible = false
    fetchStats()
    fetchList()
  } catch (error) {
    console.error(error)
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.msg ||
      error?.message ||
      '操作失败，请稍后再试'
    ElMessage.error(message)
  } finally {
    auditDialog.loading = false
  }
}

const formatAmount = (value) => {
  if (value === null || value === undefined) return '0.00'
  return Number(value).toFixed(2)
}

onMounted(() => {
  fetchStats()
  fetchList()
})
</script>

<style scoped>
.meituan-withdraw-page {
  padding-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
}

.card-desc {
  font-size: 13px;
  color: #909399;
  margin: 4px 0 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  padding: 16px;
  border-radius: 12px;
  background: #f5f7ff;
}

.stat-card.pending {
  background: #fff6e6;
}

.stat-card.completed {
  background: #e8f8f0;
}

.stat-card.rejected {
  background: #ffecec;
}

.stat-card.today {
  background: #f0f5ff;
}

.stat-card.balance {
  background: #fff3e8;
}

.stat-card .label {
  font-size: 13px;
  color: #7a7f8c;
}

.stat-card .value {
  font-size: 20px;
  font-weight: 600;
  margin-top: 6px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.filter-item {
  width: 220px;
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

.cell-main {
  font-weight: 600;
}

.cell-sub {
  font-size: 12px;
  color: #909399;
}

.drawer-empty {
  padding: 40px 0;
}
</style>
