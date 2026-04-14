<template>
  <div class="institution-quota">
    <el-card class="quota-packages" shadow="never" v-loading="state.loading.packages">
      <template #header>
        <div class="quota-packages__header">
          <span>额度权益包</span>
          <small>了解各权益包的默认配置与权益明细，新增购买记录时会自动带出建议参数</small>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col
          v-for="pkg in packages"
          :key="pkg.code"
          :xs="24"
          :sm="12"
          :md="8"
        >
          <el-card shadow="hover" class="package-card">
            <div class="package-card__header">
              <div class="package-card__title">{{ pkg.name }}</div>
              <div class="package-card__price">
                <span v-if="pkg.default_price > 0">¥{{ pkg.default_price.toFixed(2) }}</span>
                <span v-else>按实际结算</span>
              </div>
            </div>
            <ul class="package-card__benefits">
              <li v-if="pkg.profit_share_rate">
                <strong>分润档位：</strong>{{ pkg.profit_share_rate }}
              </li>
              <li v-if="pkg.guarantee_amount">
                <strong>保证金：</strong>¥{{ pkg.guarantee_amount.toFixed(2) }}
              </li>
              <li v-for="benefit in pkg.benefits" :key="benefit.label">
                <strong>{{ benefit.label }}：</strong>{{ benefit.value }}
              </li>
            </ul>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="quota-filters" shadow="never">
      <el-form :inline="true" :model="filters">
        <el-form-item label="所属机构">
          <el-select
            v-model="filters.institutionId"
            filterable
            remote
            clearable
            placeholder="输入机构名称/编号搜索"
            :remote-method="remoteSearchInstitutions"
            :loading="state.loading.institutionSearch"
            @clear="handleInstitutionClear"
            @change="handleInstitutionChange"
            style="width: 260px"
          >
            <el-option
              v-for="item in institutionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="权益包">
          <el-select
            v-model="filters.packageCode"
            clearable
            placeholder="全部权益包"
            style="width: 200px"
            @change="handleFilterChange"
          >
            <el-option
              v-for="pkg in packages"
              :key="pkg.code"
              :label="pkg.name"
              :value="pkg.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="购买日期">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            unlink-panels
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleFilterChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilterChange">
            查询
          </el-button>
          <el-button @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card
      v-if="summary"
      class="quota-summary"
      shadow="never"
      v-loading="state.loading.summary"
    >
      <template #header>
        <div class="quota-summary__header">
          <div class="quota-summary__title">
            <span>{{ summary.institution.name }}</span>
            <small>机构编号：{{ summary.institution.number || '未设置' }}</small>
          </div>
          <div class="quota-summary__meta">
            <el-tag type="success" v-if="summary.institution.meituan_role_text">
              {{ summary.institution.meituan_role_text }}
            </el-tag>
            <el-tag v-if="summary.institution.meituan_commission_rate" type="info" class="quota-summary__tag">
              分润：{{ summary.institution.meituan_commission_rate }}
            </el-tag>
          </div>
        </div>
      </template>

      <el-row :gutter="16" class="quota-summary__row">
        <el-col :xs="24" :md="12">
          <div class="quota-summary__card">
            <div class="quota-summary__card-title">销售经理额度</div>
            <div class="quota-summary__card-body">
              <div class="quota-summary__metric">
                <span class="label">已购额度</span>
                <span class="value">{{ summary.totals.purchased.salesman_quota }}</span>
              </div>
              <div class="quota-summary__metric">
                <span class="label">系统额度</span>
                <span class="value">{{ summary.totals.system.salesman_quota }}</span>
              </div>
              <div class="quota-summary__metric">
                <span class="label">已使用</span>
                <span class="value">{{ summary.totals.usage.salesman_quota_used }}</span>
              </div>
              <div class="quota-summary__metric value-highlight">
                <span class="label">剩余额度</span>
                <span class="value">{{ summary.totals.usage.salesman_quota_remaining }}</span>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :md="12">
          <div class="quota-summary__card">
            <div class="quota-summary__card-title">合伙人额度</div>
            <div class="quota-summary__card-body">
              <div class="quota-summary__metric">
                <span class="label">已购额度</span>
                <span class="value">{{ summary.totals.purchased.partner_quota }}</span>
              </div>
              <div class="quota-summary__metric">
                <span class="label">系统额度</span>
                <span class="value">{{ summary.totals.system.partner_quota }}</span>
              </div>
              <div class="quota-summary__metric">
                <span class="label">已发展</span>
                <span class="value">{{ summary.totals.usage.partner_quota_used }}</span>
              </div>
              <div class="quota-summary__metric value-highlight">
                <span class="label">剩余额度</span>
                <span class="value">{{ summary.totals.usage.partner_quota_remaining }}</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="quota-summary__row">
        <el-col :xs="24" :md="12">
          <div class="quota-summary__card quota-summary__items">
            <div class="quota-summary__card-title">物料汇总</div>
            <ul>
              <li>
                <span>美团展业账号</span>
                <span>{{ summary.totals.items.meituan_accounts }}</span>
              </li>
              <li>
                <span>播报器</span>
                <span>{{ summary.totals.items.broadcast_devices }}</span>
              </li>
            </ul>
          </div>
        </el-col>
        <el-col :xs="24" :md="12">
          <div class="quota-summary__card quota-summary__items">
            <div class="quota-summary__card-title">财务概览</div>
            <ul>
              <li>
                <span>累计采购金额</span>
                <span>{{ formatCurrency(summary.totals.financial.total_spent) }}</span>
              </li>
              <li>
                <span>累计保证金</span>
                <span>{{ formatCurrency(summary.totals.financial.total_guarantee) }}</span>
              </li>
            </ul>
          </div>
        </el-col>
      </el-row>

      <el-card
        v-if="summary.packages && summary.packages.length"
        class="quota-summary__packages"
        shadow="never"
      >
        <template #header>
          <div class="quota-summary__packages-header">
            <span>权益包采购统计</span>
          </div>
        </template>
        <el-table :data="packageSummaryRows" size="small" border>
          <el-table-column prop="packageName" label="权益包" />
          <el-table-column prop="quantity" label="数量" width="100" />
          <el-table-column prop="totalAmount" label="采购金额" width="140">
            <template #default="{ row }">
              {{ formatCurrency(row.totalAmount) }}
            </template>
          </el-table-column>
          <el-table-column prop="totalGuarantee" label="保证金" width="140">
            <template #default="{ row }">
              {{ formatCurrency(row.totalGuarantee) }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-card>

    <el-card
      v-if="filters.institutionId"
      class="quota-invites"
      shadow="never"
      v-loading="state.loading.invites"
    >
      <template #header>
        <div class="quota-invites__header">
          <span>邀请码管理</span>
          <small>每个额度对应一个唯一邀请码，扫码注册后自动失效</small>
        </div>
      </template>

      <div class="quota-invites__stats">
        <div class="quota-invites__stat-card">
          <div class="title">合伙人邀请码</div>
          <div class="values">
            <span>待使用：{{ inviteStats.partner.available }}</span>
            <span>已使用：{{ inviteStats.partner.used }}</span>
            <span>已失效：{{ inviteStats.partner.revoked }}</span>
          </div>
        </div>
        <div class="quota-invites__stat-card">
          <div class="title">销售经理邀请码</div>
          <div class="values">
            <span>待使用：{{ inviteStats.salesman.available }}</span>
            <span>已使用：{{ inviteStats.salesman.used }}</span>
            <span>已失效：{{ inviteStats.salesman.revoked }}</span>
          </div>
        </div>
      </div>

      <el-form :inline="true" :model="inviteFilters" class="quota-invites__filters">
        <el-form-item label="邀请码类型">
          <el-select
            v-model="inviteFilters.type"
            placeholder="全部类型"
            style="width: 160px"
            @change="handleInviteFilterChange"
          >
            <el-option
              v-for="option in inviteTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="inviteFilters.status"
            placeholder="全部状态"
            style="width: 160px"
            @change="handleInviteFilterChange"
          >
            <el-option
              v-for="option in inviteStatusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="inviteFilters.keyword"
            placeholder="输入邀请码搜索"
            clearable
            @clear="handleInviteFilterChange"
            @keyup.enter="handleInviteFilterChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleInviteFilterChange">查询</el-button>
          <el-button @click="handleInviteReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="invites" border size="small" empty-text="暂无邀请码">
        <el-table-column label="邀请码" width="200">
          <template #default="{ row }">
            <div class="quota-invite__code">
              <span>{{ row.code }}</span>
              <el-button type="primary" link size="small" @click="copyInviteCode(row.code)">
                复制
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="160">
          <template #default="{ row }">
            {{ formatInviteType(row.invite_type) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="140">
          <template #default="{ row }">
            <el-tag :type="formatInviteStatus(row.status).type" effect="light">
              {{ formatInviteStatus(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="来源" width="160">
          <template #default="{ row }">
            {{ formatInviteSource(row.source_type) }}
          </template>
        </el-table-column>
        <el-table-column label="使用机构" min-width="200">
          <template #default="{ row }">
            <span v-if="row.used_by_institution">
              {{ row.used_by_institution.name || '—' }}
              <span v-if="row.used_by_institution.number">
                （{{ row.used_by_institution.number }}）
              </span>
            </span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="使用时间" width="180">
          <template #default="{ row }">
            {{ row.used_at || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="生成时间" width="180">
          <template #default="{ row }">
            {{ row.created_at || '—' }}
          </template>
        </el-table-column>
      </el-table>

      <div class="quota-invites__pagination">
        <el-pagination
          background
          layout="total, prev, pager, next, sizes"
          :current-page="invitePagination.page"
          :page-size="invitePagination.perPage"
          :page-sizes="[10, 15, 20, 30, 50]"
          :total="invitePagination.total"
          @current-change="handleInvitePageChange"
          @size-change="handleInviteSizeChange"
        />
      </div>
    </el-card>

    <el-card class="quota-table" shadow="never">
      <template #header>
        <div class="quota-table__header">
          <span>机构购买记录</span>
          <div class="quota-table__actions">
            <el-button
              type="primary"
              :disabled="!filters.institutionId"
              @click="openCreateDialog"
            >
              新增购买记录
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="tableData"
        v-loading="state.loading.table"
        border
        size="small"
        empty-text="暂无购买记录"
      >
        <el-table-column prop="purchased_at" label="购买时间" width="180" />
        <el-table-column prop="institution_name" label="机构" width="200">
          <template #default="{ row }">
            <div class="quota-table__institution">
              <div class="name">{{ row.institution_name || '未命名机构' }}</div>
              <div class="number" v-if="row.institution_number">编号：{{ row.institution_number }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="package_name" label="权益包" width="150" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="total_amount" label="采购金额" width="140">
          <template #default="{ row }">
            {{ formatCurrency(row.total_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="guarantee_amount" label="保证金" width="140">
          <template #default="{ row }">
            {{ formatCurrency(row.guarantee_amount) }}
          </template>
        </el-table-column>
        <el-table-column label="额度增量" width="200">
          <template #default="{ row }">
            <div class="quota-table__quota">
              <span v-if="row.salesman_quota">销售经理 +{{ row.salesman_quota }}</span>
              <span v-if="row.partner_quota">合伙人 +{{ row.partner_quota }}</span>
              <span v-if="!row.salesman_quota && !row.partner_quota">—</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="物料增量" width="220">
          <template #default="{ row }">
            <div class="quota-table__items">
              <span v-if="row.meituan_account_count">展业账号 ×{{ row.meituan_account_count }}</span>
              <span v-if="row.broadcast_device_count">播报器 ×{{ row.broadcast_device_count }}</span>
              <span v-if="!row.meituan_account_count && !row.broadcast_device_count">—</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="admin_user_name" label="录入人" width="120" />
        <el-table-column prop="notes" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-popconfirm
              width="220"
              confirm-button-text="删除"
              cancel-button-text="取消"
              icon="el-icon-warning-outline"
              title="确认删除该购买记录？"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button type="danger" link size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="quota-table__pagination">
        <el-pagination
          background
          layout="total, prev, pager, next, sizes"
          :current-page="pagination.page"
          :page-size="pagination.perPage"
          :page-sizes="[10, 15, 20, 30, 50]"
          :total="pagination.total"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialog.visible"
      title="新增额度购买记录"
      width="560px"
      destroy-on-close
    >
      <el-form :model="dialog.form" label-width="110px" :rules="dialog.rules" ref="dialogFormRef">
        <el-form-item label="所属机构">
          <el-input :value="selectedInstitutionLabel" disabled />
        </el-form-item>
        <el-form-item label="权益包" prop="packageCode">
          <el-select v-model="dialog.form.packageCode" placeholder="请选择权益包">
            <el-option
              v-for="pkg in packages"
              :key="pkg.code"
              :label="pkg.name"
              :value="pkg.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="dialog.form.quantity" :min="1" :max="999" />
        </el-form-item>
        <el-form-item label="分润档位">
          <el-input v-model="dialog.form.profitShareRate" placeholder="可选，默认随权益包" />
        </el-form-item>
        <el-form-item label="单价(元)">
          <el-input-number
            v-model="dialog.form.unitPrice"
            :min="0"
            :step="100"
            :precision="2"
          />
        </el-form-item>
        <el-form-item label="总金额(元)">
          <el-input-number
            v-model="dialog.form.totalAmount"
            :min="0"
            :step="100"
            :precision="2"
          />
        </el-form-item>
        <el-form-item label="保证金(元)">
          <el-input-number
            v-model="dialog.form.guaranteeAmount"
            :min="0"
            :step="100"
            :precision="2"
          />
        </el-form-item>
        <el-form-item label="购买时间" prop="purchasedAt">
          <el-date-picker
            v-model="dialog.form.purchasedAt"
            type="datetime"
            placeholder="选择购买时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            type="textarea"
            :rows="3"
            v-model="dialog.form.notes"
            placeholder="可填写线下凭证、付款方式等说明"
          />
        </el-form-item>
      </el-form>

      <div class="dialog-package-preview" v-if="activeDialogPackage">
        <div class="dialog-package-preview__title">权益包权益概览</div>
        <ul>
          <li v-for="benefit in activeDialogPackage.benefits" :key="benefit.label">
            <strong>{{ benefit.label }}：</strong>{{ benefit.value }}
          </li>
        </ul>
      </div>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.submitting" @click="handleDialogSubmit">
          确认保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  fetchQuotaPackages,
  fetchInstitutionQuotaSummary,
  fetchQuotaPurchases,
  createQuotaPurchase,
  deleteQuotaPurchase,
  fetchQuotaInvites
} from '@/api/v1/institutionQuota'
import {
  fetchInstitutions,
  fetchInstitutionDetail
} from '@/api/v1/institution'

const route = useRoute()
const router = useRouter()

const packages = ref([])
const packageMap = computed(() => {
  const map = new Map()
  packages.value.forEach((pkg) => map.set(pkg.code, pkg))
  return map
})

const inviteTypeOptions = [
  { label: '全部类型', value: '' },
  { label: '合伙人邀请码', value: 'partner' },
  { label: '销售经理邀请码', value: 'salesman' }
]

const inviteStatusOptions = [
  { label: '全部状态', value: '' },
  { label: '待使用', value: 'available' },
  { label: '已使用', value: 'used' },
  { label: '已失效', value: 'revoked' }
]

const inviteTypeLabels = {
  partner: '合伙人邀请码',
  salesman: '销售经理邀请码'
}

const inviteStatusMeta = {
  available: { label: '待使用', type: 'success' },
  used: { label: '已使用', type: 'info' },
  revoked: { label: '已失效', type: 'danger' }
}

const inviteSourceLabels = {
  role_assignment: '角色配置',
  purchase: '权益包采购',
  manual: '手动发放'
}

const summary = ref(null)
const tableData = ref([])
const pagination = reactive({
  page: 1,
  perPage: 15,
  total: 0
})

const invites = ref([])
const inviteStats = reactive({
  partner: { available: 0, used: 0, revoked: 0 },
  salesman: { available: 0, used: 0, revoked: 0 }
})
const invitePagination = reactive({
  page: 1,
  perPage: 15,
  total: 0
})
const inviteFilters = reactive({
  type: '',
  status: '',
  keyword: ''
})

const filters = reactive({
  institutionId: null,
  packageCode: '',
  dateRange: []
})

const state = reactive({
  loading: {
    packages: false,
    summary: false,
    table: false,
    institutionSearch: false,
    invites: false
  }
})

function applyInviteStats(stats = {}) {
  const partner = stats.partner || {}
  const salesman = stats.salesman || {}

  inviteStats.partner.available = partner.available ?? 0
  inviteStats.partner.used = partner.used ?? 0
  inviteStats.partner.revoked = partner.revoked ?? 0

  inviteStats.salesman.available = salesman.available ?? 0
  inviteStats.salesman.used = salesman.used ?? 0
  inviteStats.salesman.revoked = salesman.revoked ?? 0
}

function resetInviteData() {
  invites.value = []
  invitePagination.total = 0
  invitePagination.page = 1
  applyInviteStats()
}

const institutionOptions = ref([])
const selectedInstitution = ref(null)

const dialog = reactive({
  visible: false,
  submitting: false,
  form: {
    packageCode: '',
    quantity: 1,
    unitPrice: 0,
    totalAmount: 0,
    guaranteeAmount: 0,
    profitShareRate: '',
    purchasedAt: '',
    notes: ''
  },
  rules: {
    packageCode: [{ required: true, message: '请选择权益包', trigger: 'change' }],
    quantity: [{ required: true, type: 'number', message: '请输入数量', trigger: 'blur' }],
    purchasedAt: [{ required: true, message: '请选择购买时间', trigger: 'change' }]
  }
})

const dialogFormRef = ref()

const selectedInstitutionLabel = computed(() => {
  if (!selectedInstitution.value) return ''
  const { label } = selectedInstitution.value
  return label
})

const activeDialogPackage = computed(() => {
  if (!dialog.form.packageCode) return null
  return packageMap.value.get(dialog.form.packageCode) || null
})

const packageSummaryRows = computed(() => {
  if (!summary?.value?.packages?.length) {
    return []
  }

  return summary.value.packages.map((item) => {
    const pkg = packageMap.value.get(item.code)
    return {
      code: item.code,
      packageName: pkg ? pkg.name : item.code,
      quantity: item.quantity,
      totalAmount: item.total_amount ?? item.totalAmount ?? 0,
      totalGuarantee: item.total_guarantee ?? item.totalGuarantee ?? 0
    }
  })
})

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount)
}

onMounted(async () => {
  await loadPackages()

  const initialInstitutionId = route.query.institution_id
  if (initialInstitutionId) {
    const numericId = Number(initialInstitutionId)
    if (!Number.isNaN(numericId)) {
      filters.institutionId = numericId
      await ensureInstitutionOption(numericId)
      await loadSummary()
      invitePagination.page = 1
      await loadInvites()
    }
  }

  await loadPurchases()
  if (!initialInstitutionId) {
    resetInviteData()
  }
})

watch(
  () => filters.institutionId,
  async (newVal) => {
    updateRouteQuery()
    if (newVal) {
      await ensureInstitutionOption(newVal)
      await loadSummary()
    } else {
      summary.value = null
    }
    await loadPurchases()
    if (newVal) {
      invitePagination.page = 1
      await loadInvites()
    } else {
      resetInviteData()
    }
  }
)

watch(
  () => dialog.form.packageCode,
  (newCode) => {
    if (!newCode) return
    const pkg = packageMap.value.get(newCode)
    if (!pkg) return
    dialog.form.unitPrice = pkg.default_price || 0
    dialog.form.guaranteeAmount =
      Number(pkg.guarantee_amount || 0) * Number(dialog.form.quantity || 1)
    dialog.form.profitShareRate = pkg.profit_share_rate || ''
    dialog.form.totalAmount = Number(dialog.form.unitPrice || 0) * Number(dialog.form.quantity || 0)
  }
)

watch(
  () => dialog.form.quantity,
  (qty) => {
    const numeric = Number(qty || 0)
    dialog.form.totalAmount = Number(dialog.form.unitPrice || 0) * numeric
    const pkg = packageMap.value.get(dialog.form.packageCode)
    if (pkg && Number(pkg.guarantee_amount || 0) > 0) {
      dialog.form.guaranteeAmount = Number(pkg.guarantee_amount || 0) * numeric
    }
  }
)

async function loadPackages() {
  state.loading.packages = true
  try {
    const { code, data, message } = await fetchQuotaPackages()
    if (code !== 0) {
      ElMessage.error(message || '获取权益包失败')
      return
    }
    packages.value = Array.isArray(data) ? data : []
  } catch (error) {
    ElMessage.error(error.message || '获取权益包失败')
  } finally {
    state.loading.packages = false
  }
}

async function loadSummary() {
  if (!filters.institutionId) return
  state.loading.summary = true
  try {
    const { code, data, message } = await fetchInstitutionQuotaSummary(filters.institutionId)
    if (code !== 0) {
      ElMessage.error(message || '获取额度概览失败')
      summary.value = null
      return
    }
    summary.value = data
    applyInviteStats(data.invites || {})
  } catch (error) {
    ElMessage.error(error.message || '获取额度概览失败')
    summary.value = null
  } finally {
    state.loading.summary = false
  }
}

async function loadPurchases() {
  state.loading.table = true
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.perPage
    }

    if (filters.institutionId) {
      params.institution_id = filters.institutionId
    }

    if (filters.packageCode) {
      params.package_code = filters.packageCode
    }

    if (Array.isArray(filters.dateRange) && filters.dateRange.length === 2) {
      params.date_start = filters.dateRange[0]
      params.date_end = filters.dateRange[1]
    }

    const { code, data, message } = await fetchQuotaPurchases(params)
    if (code !== 0) {
      ElMessage.error(message || '获取购买记录失败')
      return
    }

    tableData.value = data.items || []
    pagination.total = data.pagination?.total || 0
    pagination.page = data.pagination?.page || params.page
    pagination.perPage = data.pagination?.per_page || params.per_page
  } catch (error) {
    ElMessage.error(error.message || '获取购买记录失败')
  } finally {
    state.loading.table = false
  }
}

async function loadInvites() {
  if (!filters.institutionId) {
    resetInviteData()
    return
  }

  state.loading.invites = true
  try {
    const params = {
      page: invitePagination.page,
      per_page: invitePagination.perPage
    }

    if (inviteFilters.type) {
      params.type = inviteFilters.type
    }

    if (inviteFilters.status) {
      params.status = inviteFilters.status
    }

    if (inviteFilters.keyword) {
      params.keyword = inviteFilters.keyword.trim()
    }

    const { code, data, message } = await fetchQuotaInvites(filters.institutionId, params)
    if (code !== 0) {
      ElMessage.error(message || '获取邀请码失败')
      return
    }

    invites.value = data.items || []
    invitePagination.total = data.pagination?.total || 0
    invitePagination.page = data.pagination?.page || invitePagination.page
    invitePagination.perPage = data.pagination?.per_page || invitePagination.perPage
    applyInviteStats(data.stats || {})
  } catch (error) {
    ElMessage.error(error.message || '获取邀请码失败')
  } finally {
    state.loading.invites = false
  }
}

function handleInviteFilterChange() {
  invitePagination.page = 1
  loadInvites()
}

function handleInviteReset() {
  inviteFilters.type = ''
  inviteFilters.status = ''
  inviteFilters.keyword = ''
  invitePagination.page = 1
  loadInvites()
}

function handleInvitePageChange(page) {
  invitePagination.page = page
  loadInvites()
}

function handleInviteSizeChange(size) {
  invitePagination.perPage = size
  invitePagination.page = 1
  loadInvites()
}

function formatInviteType(type) {
  return inviteTypeLabels[type] || '未知类型'
}

function formatInviteStatus(status) {
  return inviteStatusMeta[status] || { label: status, type: 'info' }
}

function formatInviteSource(source) {
  return inviteSourceLabels[source] || '其他'
}

async function copyInviteCode(code) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(code)
    } else {
      const input = document.createElement('input')
      input.value = code
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    ElMessage.success('邀请码已复制')
  } catch (error) {
    ElMessage.error(error.message || '复制失败，请手动复制')
  }
}

async function remoteSearchInstitutions(query) {
  if (!query) {
    institutionOptions.value = selectedInstitution.value ? [selectedInstitution.value] : []
    return
  }

  state.loading.institutionSearch = true
  try {
    const { code, data, message } = await fetchInstitutions({
      keyword: query,
      per_page: 10,
      page: 1
    })

    if (code !== 0) {
      ElMessage.error(message || '查询机构失败')
      return
    }

    const items = data?.items || []
    institutionOptions.value = items.map((item) => ({
      value: Number(item.id),
      label: `${item.nickname || item.name || '未命名机构'}（编号：${item.number || '未知'}）`,
      number: item.number
    }))
  } catch (error) {
    ElMessage.error(error.message || '查询机构失败')
  } finally {
    state.loading.institutionSearch = false
  }
}

async function ensureInstitutionOption(id) {
  const existing = institutionOptions.value.find((opt) => opt.value === id)
  if (existing) {
    selectedInstitution.value = existing
    return
  }

  try {
    const { code, data, message } = await fetchInstitutionDetail(id)
    if (code !== 0) {
      ElMessage.error(message || '获取机构信息失败')
      return
    }
    const option = {
      value: Number(data.id),
      label: `${data.nickname || data.name || '未命名机构'}（编号：${data.number || '未知'}）`,
      number: data.number
    }
    institutionOptions.value = [option]
    selectedInstitution.value = option
  } catch (error) {
    ElMessage.error(error.message || '获取机构信息失败')
  }
}

function handleInstitutionChange(value) {
  const option = institutionOptions.value.find((opt) => opt.value === value) || null
  selectedInstitution.value = option
}

function handleInstitutionClear() {
  selectedInstitution.value = null
  filters.institutionId = null
}

function handleFilterChange() {
  pagination.page = 1
  loadPurchases()
  if (filters.institutionId) {
    loadSummary()
  }
}

function handleReset() {
  filters.packageCode = ''
  filters.dateRange = []
  pagination.page = 1
  loadPurchases()
  if (filters.institutionId) {
    loadSummary()
  }
}

function handlePageChange(page) {
  pagination.page = page
  loadPurchases()
}

function handleSizeChange(size) {
  pagination.perPage = size
  pagination.page = 1
  loadPurchases()
}

function openCreateDialog() {
  if (!filters.institutionId) {
    ElMessage.warning('请先选择机构')
    return
  }

  dialog.visible = true
  dialog.submitting = false
  dialog.form.packageCode = packages.value.length ? packages.value[0].code : ''
  dialog.form.quantity = 1
  dialog.form.unitPrice = packages.value.length ? packages.value[0].default_price || 0 : 0
  dialog.form.totalAmount = dialog.form.unitPrice
  dialog.form.guaranteeAmount = packages.value.length ? packages.value[0].guarantee_amount || 0 : 0
  dialog.form.profitShareRate = packages.value.length ? packages.value[0].profit_share_rate || '' : ''
  dialog.form.purchasedAt = new Date().toISOString().replace('T', ' ').slice(0, 19)
  dialog.form.notes = ''
  nextTickResetForm()
}

async function nextTickResetForm() {
  await new Promise((resolve) => setTimeout(resolve, 0))
  dialogFormRef.value?.clearValidate?.()
}

async function handleDialogSubmit() {
  if (!filters.institutionId) {
    ElMessage.warning('请先选择机构')
    return
  }

  await dialogFormRef.value?.validate?.()

  dialog.submitting = true
  try {
    const payload = {
      institution_id: filters.institutionId,
      package_code: dialog.form.packageCode,
      quantity: Number(dialog.form.quantity || 1),
      unit_price: Number(dialog.form.unitPrice || 0),
      total_amount: Number(dialog.form.totalAmount || 0),
      guarantee_amount: Number(dialog.form.guaranteeAmount || 0),
      profit_share_rate: dialog.form.profitShareRate || undefined,
      purchased_at: dialog.form.purchasedAt,
      notes: dialog.form.notes
    }

    const { code, message } = await createQuotaPurchase(payload)
    if (code !== 0) {
      ElMessage.error(message || '新增购买记录失败')
      return
    }

    ElMessage.success('新增购买记录成功')
    dialog.visible = false
    dialog.submitting = false

    await loadPurchases()
    if (filters.institutionId) {
      await loadSummary()
    }
  } catch (error) {
    ElMessage.error(error.message || '新增购买记录失败')
  } finally {
    dialog.submitting = false
  }
}

async function handleDelete(row) {
  try {
    const { code, message } = await deleteQuotaPurchase(row.id)
    if (code !== 0) {
      ElMessage.error(message || '删除记录失败')
      return
    }
    ElMessage.success('删除成功')
    await loadPurchases()
    if (filters.institutionId) {
      await loadSummary()
    }
  } catch (error) {
    ElMessage.error(error.message || '删除记录失败')
  }
}

function updateRouteQuery() {
  const query = { ...route.query }
  if (filters.institutionId) {
    query.institution_id = filters.institutionId
  } else {
    delete query.institution_id
  }
  router.replace({ query }).catch(() => {})
}
</script>

<style scoped>
.institution-quota {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quota-packages__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quota-packages__header small {
  color: #909399;
  font-size: 12px;
}

.package-card {
  min-height: 180px;
}

.package-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.package-card__title {
  font-weight: 600;
  font-size: 16px;
}

.package-card__price {
  color: #f56c6c;
  font-weight: 600;
}

.package-card__benefits {
  padding-left: 0;
  list-style: none;
  color: #606266;
  line-height: 1.6;
}

.quota-summary__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.quota-summary__title span {
  font-size: 16px;
  font-weight: 600;
}

.quota-summary__title small {
  display: block;
  color: #909399;
  margin-top: 2px;
}

.quota-summary__meta {
  display: flex;
  gap: 8px;
}

.quota-summary__tag {
  margin-left: 8px;
}

.quota-summary__row {
  margin-bottom: 16px;
}

.quota-summary__card {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 16px;
  height: 100%;
}

.quota-summary__card-title {
  font-weight: 600;
  margin-bottom: 12px;
}

.quota-summary__card-body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 16px;
}

.quota-summary__metric {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}

.quota-summary__metric .label {
  color: #909399;
  font-size: 12px;
}

.quota-summary__metric .value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.quota-summary__metric.value-highlight .value {
  color: #67c23a;
}

.quota-summary__items ul {
  padding-left: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

.quota-summary__items li {
  display: flex;
  justify-content: space-between;
  color: #606266;
}

.quota-summary__packages {
  margin-top: 16px;
}

.quota-summary__packages-header span {
  font-weight: 600;
}

.quota-table__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quota-table__institution .number {
  font-size: 12px;
  color: #909399;
}

.quota-table__quota,
.quota-table__items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: #606266;
}

.quota-table__pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.dialog-package-preview {
  margin-top: 16px;
  padding: 12px;
  border-radius: 6px;
  background: #f5f7fa;
  color: #606266;
}

.dialog-package-preview__title {
  font-weight: 600;
  margin-bottom: 8px;
}

.dialog-package-preview ul {
  padding-left: 18px;
  margin: 0;
}

.quota-filters {
  margin-top: 4px;
}

.quota-invites__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quota-invites__header small {
  color: #909399;
  font-size: 12px;
}

.quota-invites__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.quota-invites__stat-card {
  flex: 1 1 260px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px 16px;
  background: #fafcff;
}

.quota-invites__stat-card .title {
  font-weight: 600;
  margin-bottom: 8px;
}

.quota-invites__stat-card .values {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: #606266;
  font-size: 13px;
}

.quota-invites__filters {
  margin-bottom: 16px;
}

.quota-invite__code {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Roboto Mono', monospace;
}

.quota-invites__pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
