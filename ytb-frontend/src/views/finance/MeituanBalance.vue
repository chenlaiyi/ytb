<template>
  <div class="meituan-balance-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div>
            <p class="card-title">美团余额管理</p>
            <p class="card-desc">查看各美团机构的分润钱包余额、提现占用与近期待收</p>
          </div>
          <el-button type="primary" link :loading="loading" @click="refreshAll">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索机构/编号/账号"
          class="filter-item"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="filters.role"
          placeholder="角色"
          clearable
          class="filter-item"
          @change="handleSearch"
        >
          <el-option label="全部角色" value="" />
          <el-option v-for="option in roleOptions" :key="option.value" :label="option.label" :value="option.value" />
        </el-select>
        <el-select
          v-model="filters.status"
          placeholder="状态"
          clearable
          class="filter-item"
          @change="handleSearch"
        >
          <el-option label="全部状态" value="" />
          <el-option v-for="option in statusOptions" :key="option.value" :label="option.label" :value="option.value" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <p class="label">可用余额总额</p>
          <p class="value">¥{{ formatAmount(summary.withdrawable_sum) }}</p>
        </div>
        <div class="stat-card">
          <p class="label">账户总余额</p>
          <p class="value">¥{{ formatAmount(summary.balance_sum) }}</p>
        </div>
        <div class="stat-card">
          <p class="label">待审核提现</p>
          <p class="value">¥{{ formatAmount(summary.pending_sum) }}</p>
        </div>
        <div class="stat-card">
          <p class="label">累计已提现</p>
          <p class="value">¥{{ formatAmount(summary.withdrawn_sum) }}</p>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="balances"
        border
        style="width: 100%"
        :default-sort="defaultSort"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="name" label="机构" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="cell-main">{{ row.name }}</div>
            <div class="cell-sub">编号：{{ row.number || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="role_text" label="角色" width="120" />
        <el-table-column prop="status_text" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ row.status_text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="account_alipay_openid" label="钱包账号" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="wallet-account">
              <el-avatar
                class="wallet-avatar"
                :size="40"
                :src="row.account_alipay_avatar || row.account_avatar || row.account_wechat_avatar"
              >
                {{ (row.account_name || '支').slice(0, 1) }}
              </el-avatar>
              <div class="wallet-account-text">
                <div class="cell-main">
                  {{ row.account_alipay_openid || '未绑定支付宝账号' }}
                </div>
                <div class="cell-sub">
                  实名：{{ row.account_name || '-' }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="wallet_balance" label="总余额" width="130" sortable="custom">
          <template #default="{ row }">¥{{ formatAmount(row.wallet_balance) }}</template>
        </el-table-column>
        <el-table-column prop="wallet_available" label="可用余额" width="130" sortable="custom">
          <template #default="{ row }">¥{{ formatAmount(row.wallet_available) }}</template>
        </el-table-column>
        <el-table-column prop="wallet_frozen" label="冻结金额" width="130" sortable="custom">
          <template #default="{ row }">¥{{ formatAmount(row.wallet_frozen) }}</template>
        </el-table-column>
        <el-table-column prop="today_income" label="今日分润" width="130" sortable="custom">
          <template #default="{ row }">¥{{ formatAmount(row.today_income) }}</template>
        </el-table-column>
        <el-table-column prop="pending_withdraw_amount" label="待提现金额" width="150" sortable="custom">
          <template #default="{ row }">
            <div>¥{{ formatAmount(row.pending_withdraw_amount) }}</div>
            <div class="cell-sub">{{ row.pending_withdraw_count }} 笔待审核</div>
          </template>
        </el-table-column>
        <el-table-column prop="completed_withdraw_amount" label="累计提现" width="140" sortable="custom">
          <template #default="{ row }">¥{{ formatAmount(row.completed_withdraw_amount) }}</template>
        </el-table-column>
        <el-table-column prop="wallet_last_transaction_at" label="最近流水" width="180" sortable="custom">
          <template #default="{ row }">{{ row.wallet_last_transaction_at || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="openTransactionDrawer(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.per_page"
          :current-page="pagination.page"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
    <el-drawer
      v-model="detailDrawer.visible"
      size="520px"
      title="收支记录"
      destroy-on-close
      @close="detailDrawer.institution = null"
    >
      <div class="drawer-meta" v-if="detailDrawer.institution">
        <div class="drawer-title">
          {{ detailDrawer.institution.name }}
          <span class="drawer-sub">编号：{{ detailDrawer.institution.number || '-' }}</span>
        </div>
        <div class="drawer-sub">
          钱包账号：{{ detailDrawer.account?.alipay_openid || '未绑定支付宝账号' }}
          <span class="drawer-sub-note">实名：{{ detailDrawer.account?.name || '-' }}</span>
        </div>
      </div>
      <el-table
        v-loading="detailDrawer.loading"
        :data="detailDrawer.transactions"
        border
        empty-text="暂无流水"
      >
        <el-table-column label="类型" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="row.type === 'expense' ? 'danger' : 'success'">
              {{ row.type === 'expense' ? '支出' : '收入' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="140">
          <template #default="{ row }">
            <span :class="transactionAmountClass(row.type)">{{ formatSignedAmount(row.amount, row.type) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="余额" width="150">
          <template #default="{ row }">
            ¥{{ formatAmount(row.balance_after) }}
          </template>
        </el-table-column>
        <el-table-column label="描述" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="cell-main">{{ row.description || '-' }}</div>
            <div class="cell-sub">{{ row.business_date || row.created_at }}</div>
          </template>
        </el-table-column>
      </el-table>

      <div class="drawer-footer">
        <el-pagination
          background
          layout="prev, pager, next"
          :current-page="detailDrawer.pagination.page"
          :page-size="detailDrawer.pagination.per_page"
          :total="detailDrawer.pagination.total"
          @current-change="handleDrawerPageChange"
        />
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { fetchMeituanBalanceList, fetchMeituanBalanceTransactions } from '@/api/financeMeituanBalance'

const loading = ref(false)
const balances = ref([])
const summary = reactive({
  withdrawable_sum: 0,
  balance_sum: 0,
  pending_sum: 0,
  withdrawn_sum: 0,
  total_institutions: 0
})

const filters = reactive({
  keyword: '',
  role: '',
  status: '',
  sort: 'withdrawable_desc'
})

const pagination = reactive({
  page: 1,
  per_page: 20,
  total: 0
})

const defaultSort = Object.freeze({ prop: 'wallet_available', order: 'descending' })

const roleOptions = [
  { label: '运营总部', value: 1 },
  { label: '运营中心', value: 2 },
  { label: '合伙人', value: 3 },
  { label: '销售经理', value: 4 }
]

const statusOptions = [
  { label: '待审核', value: 0 },
  { label: '已认证', value: 1 },
  { label: '已驳回', value: 2 }
]

const detailDrawer = reactive({
  visible: false,
  loading: false,
  institution: null,
  account: null,
  transactions: [],
  pagination: {
    page: 1,
    per_page: 10,
    total: 0
  }
})

const sortPropMap = {
  wallet_available: 'withdrawable',
  wallet_balance: 'balance',
  pending_withdraw_amount: 'pending',
  completed_withdraw_amount: 'withdrawn',
  wallet_last_transaction_at: 'updated',
  today_income: 'balance' // fallback
}

const statusTagType = (status) => {
  switch (status) {
    case 1:
      return 'success'
    case 2:
      return 'danger'
    default:
      return 'warning'
  }
}

const formatAmount = (value) => {
  if (value === null || value === undefined) return '0.00'
  const number = Number(value)
  if (Number.isNaN(number)) return '0.00'
  return number.toFixed(2)
}

const formatSignedAmount = (value, type) => {
  const number = Number(value) || 0
  const abs = Math.abs(number).toFixed(2)
  return `${type === 'expense' ? '-' : '+'}¥${abs}`
}

const transactionAmountClass = (type) => {
  return type === 'expense' ? 'amount-negative' : 'amount-positive'
}

const buildQuery = () => ({
  keyword: filters.keyword || undefined,
  role: filters.role || undefined,
  status: filters.status || undefined,
  sort: filters.sort,
  page: pagination.page,
  per_page: pagination.per_page
})

const loadData = async () => {
  loading.value = true
  try {
    const response = await fetchMeituanBalanceList(buildQuery())
    if (response?.code === 20000) {
      balances.value = response.data?.list || []
      summary.withdrawable_sum = response.data?.summary?.withdrawable_sum || 0
      summary.balance_sum = response.data?.summary?.balance_sum || 0
      summary.pending_sum = response.data?.summary?.pending_sum || 0
      summary.withdrawn_sum = response.data?.summary?.withdrawn_sum || 0
      summary.total_institutions = response.data?.summary?.total_institutions || 0
      pagination.total = response.data?.pagination?.total || 0
      pagination.page = response.data?.pagination?.page || 1
      pagination.per_page = response.data?.pagination?.per_page || pagination.per_page
    } else {
      ElMessage.error(response?.message || '获取数据失败')
    }
  } catch (error) {
    ElMessage.error(error?.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const resetFilters = () => {
  filters.keyword = ''
  filters.role = ''
  filters.status = ''
  filters.sort = 'withdrawable_desc'
  pagination.page = 1
  loadData()
}

const refreshAll = () => {
  loadData()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadData()
}

const handleSizeChange = (size) => {
  pagination.per_page = size
  pagination.page = 1
  loadData()
}

const openTransactionDrawer = (row) => {
  detailDrawer.visible = true
  detailDrawer.institution = row
  detailDrawer.transactions = []
  detailDrawer.account = null
  detailDrawer.pagination.page = 1
  loadTransactions()
}

const loadTransactions = async () => {
  if (!detailDrawer.institution?.id) return
  detailDrawer.loading = true
  try {
    const response = await fetchMeituanBalanceTransactions(detailDrawer.institution.id, {
      page: detailDrawer.pagination.page,
      per_page: detailDrawer.pagination.per_page
    })
    if (response?.data) {
      detailDrawer.transactions = response.data.list || []
      detailDrawer.account = response.data.account || null
      detailDrawer.pagination.total = response.data.pagination?.total || 0
      detailDrawer.pagination.page = response.data.pagination?.page || detailDrawer.pagination.page
      detailDrawer.pagination.per_page = response.data.pagination?.per_page || detailDrawer.pagination.per_page
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('加载交易记录失败，请稍后重试')
  } finally {
    detailDrawer.loading = false
  }
}

const handleDrawerPageChange = (page) => {
  detailDrawer.pagination.page = page
  loadTransactions()
}

const handleSortChange = ({ prop, order }) => {
  if (!order || !prop || !sortPropMap[prop]) {
    filters.sort = 'withdrawable_desc'
  } else {
    filters.sort = `${sortPropMap[prop]}_${order === 'ascending' ? 'asc' : 'desc'}`
  }
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.meituan-balance-page {
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

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  background: #f6f8ff;
  border-radius: 12px;
  padding: 16px;
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

.wallet-account {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wallet-avatar {
  flex-shrink: 0;
  background: #f2f3f5;
}

.wallet-account-text {
  min-width: 0;
}

.drawer-sub-note {
  margin-left: 8px;
  color: #909399;
}

.drawer-title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-meta {
  margin-bottom: 16px;
}

.drawer-sub {
  font-size: 12px;
  color: #909399;
}

.drawer-footer {
  margin-top: 12px;
  text-align: right;
}

.amount-positive {
  color: #18a058;
  font-weight: 600;
}

.amount-negative {
  color: #f56c6c;
  font-weight: 600;
}
</style>
