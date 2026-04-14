<template>
  <div class="institution-page">
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model.trim="filters.keyword"
            clearable
            placeholder="机构名称 / 编号 / 手机号 / 账号"
            @keyup.enter.native="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部" style="width: 160px">
            <el-option
              v-for="item in STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="机构类型">
          <el-select v-model="filters.core_type" clearable placeholder="全部" style="width: 180px">
            <el-option
              v-for="item in CORE_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="16" class="summary-row">
      <el-col :xs="24" :sm="12" :md="6" v-for="item in summaryCards" :key="item.label">
        <el-card shadow="never" class="summary-card">
          <div class="summary-label">{{ item.label }}</div>
          <div class="summary-value">{{ item.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>
        <div class="table-header">
          <div>
            共 <strong>{{ pagination.total }}</strong> 个机构
          </div>
          <div class="header-actions">
            <el-button type="primary" @click="openQuickDialog()">
              快速新增机构
            </el-button>
            <el-button type="primary" text @click="loadData">
              <el-icon><RefreshRight /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="list"
        border
        stripe
        empty-text="暂无机构数据"
        @cell-click="handleCellClick"
        @sort-change="handleSortChange"
        :row-class-name="getRowClassName"
      >
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column label="机构信息" min-width="220">
          <template #default="{ row }">
            <div class="institution-info">
              <div class="name-line">
                <span class="institution-name">{{ row.nickname || row.name || '—' }}</span>
                <el-tag size="small" :type="getStatusTagType(row.status)" class="status-tag">
                  {{ row.status_text }}
                </el-tag>
                <el-tag
                  v-if="row.core_type_text"
                  size="small"
                  :type="row.core_type === 2 ? 'warning' : 'info'"
                >
                  {{ row.core_type_text }}
                </el-tag>
              </div>
              <div class="meta-line">
                机构编号：{{ row.number || '—' }}
                <span v-if="row.xs_number" class="meta-split">|</span>
                <span v-if="row.xs_number">新生编号：{{ row.xs_number }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="负责人" min-width="160">
          <template #default="{ row }">
            <div class="contact-info">
              <el-avatar
                :size="36"
                class="contact-avatar"
                :src="formatAvatar(row.responsible_avatar)"
              >
                {{ (row.name || row.nickname || '—').charAt(0) }}
              </el-avatar>
              <div class="contact-meta">
                <span class="contact-name">{{ row.name || '—' }}</span>
                <span class="contact-phone">{{ row.phone || '—' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="电子邮箱" min-width="220">
          <template #default="{ row }">
            <div class="email-text">{{ formatEmail(row) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ row.status_text || '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="机构等级" min-width="140">
          <template #default="{ row }">
            <div>{{ row.level ?? '—' }}</div>
            <div v-if="row.level_text" class="level-text">{{ row.level_text }}</div>
          </template>
        </el-table-column>
        <el-table-column label="上下级" min-width="200">
          <template #default="{ row }">
            <div class="hierarchy-info">
              <div>上级：{{ formatParent(row) }}</div>
              <div>子机构数：{{ row.children_count ?? 0 }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="地区" min-width="200">
          <template #default="{ row }">
            <div class="address-info">
              <span>{{ formatLocation(row) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="美团业务" min-width="140" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="!!row.is_meituan"
              :loading="!!meituanLoading[row.id]"
              @change="value => handleMeituanToggle(row, value)"
            />
          </template>
        </el-table-column>
        <el-table-column label="业务员权限" min-width="140" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.salesman_enabled"
              :loading="!!salesmanLoading[row.id]"
              @change="value => handleSalesmanToggle(row, value)"
            />
            <div v-if="row.salesman_enabled && row.invitation_code" class="invite-code">
              邀请码：{{ row.invitation_code }}
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="salesman_count"
          label="业务员数量"
          width="120"
          align="center"
          sortable="custom"
        >
          <template #default="{ row }">
            <span class="salesman-count-link" @click.stop="handleSalesmanCountClick(row)">
              {{ row.salesman_count ?? 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="余额情况" min-width="180">
          <template #default="{ row }">
            <div v-if="row.balance">
              <div>可提现：{{ formatAmount(row.balance.withdrawable) }}</div>
              <div>不可提现：{{ formatAmount(row.balance.non_withdrawable) }}</div>
              <div>更新时间：{{ formatDate(row.balance.updated_at) || '—' }}</div>
            </div>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="商户统计" min-width="180">
          <template #default="{ row }">
            <div v-if="row.merchant_stats">
              <div>直接：{{ row.merchant_stats.direct }}</div>
              <div>团队：{{ row.merchant_stats.team }}</div>
              <div>总计：{{ row.merchant_stats.total }}</div>
            </div>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="160" />
        <el-table-column prop="updated_at" label="更新时间" min-width="160" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="goDetail(row)">
              查看详情
            </el-button>
            <el-button type="primary" text size="small" @click="openQuickDialog(row)">
              快速编辑
            </el-button>
            <el-button
              v-if="canOpenAudit(row)"
              :type="row.status === 1 ? 'danger' : 'primary'"
              text
              size="small"
              @click="openAuditDialog(row)"
            >
              {{ row.status === 1 ? '驳回' : '审核' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-pagination
          v-if="pagination.total > 0"
          background
          layout="prev, pager, next, jumper, ->, total"
          :total="pagination.total"
          :page-size="pagination.perPage"
          :current-page="pagination.page"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>

  <el-drawer
    v-model="detailDrawer.visible"
    :title="detailDrawer.title || '机构详情'"
    size="70%"
    direction="rtl"
    destroy-on-close
    :close-on-click-modal="false"
    :append-to-body="true"
    @close="closeDetailDrawer"
  >
    <InstitutionDetail
      v-if="detailDrawer.visible && detailDrawer.id"
      :id="detailDrawer.id"
      :embedded="true"
      @close="closeDetailDrawer"
      @updated="handleDetailUpdated"
    />
  </el-drawer>

  <el-drawer
    v-model="salesmanDrawer.visible"
    :title="`${salesmanDrawer.title || '机构'} - 业务员列表`"
    size="50%"
    direction="rtl"
    destroy-on-close
    :close-on-click-modal="false"
    :append-to-body="true"
    @close="closeSalesmanDrawer"
  >
    <el-form :inline="true" class="drawer-search" @submit.prevent>
      <el-form-item label="搜索">
        <el-input
          v-model.trim="salesmanDrawer.keyword"
          placeholder="手机号 / 邀请码 / 姓名"
          clearable
          @keyup.enter.native="handleSalesmanSearch"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSalesmanSearch">查询</el-button>
        <el-button @click="() => { salesmanDrawer.keyword = ''; handleSalesmanSearch() }">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row v-if="salesmanDrawer.stat" :gutter="12" class="drawer-stat-row">
      <el-col :xs="12" :sm="8" v-for="item in salesmanStats" :key="item.key">
        <div class="stat-block">
          <div class="stat-label">{{ item.label }}</div>
          <div class="stat-value">{{ item.value }}</div>
        </div>
      </el-col>
    </el-row>

    <el-table
      v-loading="salesmanDrawer.loading"
      :data="salesmanDrawer.list"
      border
      stripe
      empty-text="暂无业务员"
    >
      <el-table-column prop="salesman_name" label="姓名" min-width="140" />
      <el-table-column prop="salesman_phone" label="联系电话" min-width="150" />
      <el-table-column prop="salesman_code" label="业务员编号" min-width="150" />
      <el-table-column
        prop="invite_code"
        label="邀请码"
        min-width="140"
      >
        <template #default="{ row }">
          {{ row.invite_code || row.Invitation_code || '—' }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag size="small" :type="row.status === 1 ? 'success' : row.status === 2 ? 'warning' : 'info'">
            {{ formatSalesmanStatus(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <div class="drawer-table-footer" v-if="salesmanDrawer.pagination.total > 0">
      <el-pagination
        background
        layout="prev, pager, next, jumper, ->, total"
        :total="salesmanDrawer.pagination.total"
        :page-size="salesmanDrawer.pagination.perPage"
        :current-page="salesmanDrawer.pagination.page"
        @current-change="handleSalesmanPageChange"
      />
    </div>
  </el-drawer>

  <el-dialog
    v-model="auditDialog.visible"
    title="机构审核"
    width="480px"
    destroy-on-close
  >
    <div v-if="auditDialog.target" class="audit-summary">
      <div class="summary-name">{{ getDisplayName(auditDialog.target) }}</div>
      <div class="summary-meta">当前状态：{{ auditDialog.target.status_text || '待审核' }}</div>
    </div>
    <el-form :model="auditDialog.form" label-width="100px">
      <el-form-item label="审核结果">
        <el-radio-group v-model="auditDialog.form.status">
          <el-radio
            v-for="option in AUDIT_STATUS_OPTIONS"
            :key="option.value"
            :label="option.value"
          >
            {{ option.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="机构编号">
        <el-input
          v-model.trim="auditDialog.form.number"
          maxlength="100"
          placeholder="请输入机构编号（选填）"
        />
      </el-form-item>
      <el-form-item label="新生编号">
        <el-input
          v-model.trim="auditDialog.form.xs_number"
          maxlength="50"
          placeholder="请输入新生编号（选填）"
        />
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model.trim="auditDialog.form.note"
          type="textarea"
          :rows="3"
          maxlength="255"
          placeholder="备注信息（选填）"
          show-word-limit
        />
      </el-form-item>
      <el-form-item v-if="isAuditReject" label="驳回原因" required>
        <el-input
          v-model.trim="auditDialog.form.reason"
          type="textarea"
          :rows="3"
          maxlength="255"
          placeholder="请填写驳回原因"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="auditDialog.visible = false" :disabled="auditDialog.loading">取消</el-button>
      <el-button type="primary" :loading="auditDialog.loading" @click="submitAudit">
        确认
      </el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="quickDialog.visible"
    :title="quickDialog.isEdit ? '快速编辑机构' : '快速新增机构'"
    width="560px"
    destroy-on-close
  >
    <el-form ref="quickFormRef" :model="quickDialog.form" :rules="quickFormRules" label-width="110px">
      <el-form-item label="机构名称" prop="nickname">
        <el-input v-model.trim="quickDialog.form.nickname" maxlength="100" />
      </el-form-item>
      <el-form-item label="负责人姓名" prop="name">
        <el-input v-model.trim="quickDialog.form.name" maxlength="50" />
      </el-form-item>
      <el-form-item label="负责人手机" prop="phone">
        <el-input v-model.trim="quickDialog.form.phone" maxlength="20" />
      </el-form-item>
      <el-form-item label="电子邮箱" prop="email">
        <el-input
          v-model.trim="quickDialog.form.email"
          maxlength="100"
          placeholder="name@example.com"
        />
      </el-form-item>
      <el-form-item label="机构编号">
        <el-input v-model.trim="quickDialog.form.number" maxlength="100" />
      </el-form-item>
      <el-form-item label="新生编号">
        <el-input v-model.trim="quickDialog.form.xs_number" maxlength="50" />
      </el-form-item>
      <el-form-item label="上级机构">
        <el-select
          v-model="quickDialog.form.parent_id"
          filterable
          clearable
          remote
          reserve-keyword
          placeholder="搜索机构名称/编号"
          :remote-method="loadParentOptions"
          :loading="parentLoading"
          style="width: 100%"
        >
          <el-option
            v-for="item in parentOptions"
            :key="item.id"
            :label="`${item.id} - ${item.name || '未命名'}`"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="所属省份">
        <el-select
          v-model="quickDialog.form.province_id"
          placeholder="请选择省份"
          filterable
          clearable
          @change="handleProvinceChange"
          style="width: 100%"
        >
          <el-option
            v-for="item in provinceOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="所属城市">
        <el-select
          v-model="quickDialog.form.city_id"
          placeholder="请选择城市"
          filterable
          clearable
          :loading="cityLoading"
          :disabled="!quickDialog.form.province_id"
          @change="handleCityChange"
          style="width: 100%"
        >
          <el-option
            v-for="item in cityOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="所属区县">
        <el-select
          v-model="quickDialog.form.district_id"
          placeholder="请选择区县"
          filterable
          clearable
          :loading="districtLoading"
          :disabled="!quickDialog.form.city_id"
          style="width: 100%"
        >
          <el-option
            v-for="item in districtOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="详细地址">
        <el-input v-model.trim="quickDialog.form.address" maxlength="255" />
      </el-form-item>
      <el-form-item label="等级">
        <el-select v-model="quickDialog.form.level" placeholder="请选择等级" style="width: 100%">
          <el-option
            v-for="item in LEVEL_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="审核状态">
        <el-select v-model="quickDialog.form.status" style="width: 100%">
          <el-option label="已认证" :value="1" />
          <el-option label="待审核" :value="0" />
          <el-option label="审核未通过" :value="2" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="quickDialog.visible = false">取消</el-button>
      <el-button type="primary" :loading="submitQuickLoading" @click="submitQuickForm">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { RefreshRight } from '@element-plus/icons-vue'
import InstitutionDetail from './Detail.vue'
import { fetchInstitutionSalesmen } from '@/api/v1/institutionSalesman'
import {
  fetchInstitutions,
  createInstitution,
  updateInstitution,
  fetchInstitutionParentOptions,
  toggleInstitutionSalesman,
  toggleInstitutionMeituan,
  fetchInstitutionProvinces,
  fetchInstitutionCities,
  fetchInstitutionDistricts,
  updateInstitutionStatus
} from '@/api/v1/institution'

const STATUS_OPTIONS = [
  { label: '已认证', value: 1 },
  { label: '待审核', value: 0 },
  { label: '审核未通过', value: 2 }
]

const CORE_TYPE_OPTIONS = [
  { label: '普通机构', value: 1 },
  { label: '核心机构', value: 2 }
]

const AUDIT_STATUS_OPTIONS = [
  { label: '审核通过', value: 1 },
  { label: '驳回', value: 2 }
]

const loading = ref(false)
const detailDrawer = reactive({
  visible: false,
  id: null,
  title: ''
})
const salesmanDrawer = reactive({
  visible: false,
  id: null,
  title: '',
  list: [],
  loading: false,
  stat: null,
  pagination: {
    page: 1,
    perPage: 15,
    total: 0
  },
  keyword: ''
})
const list = ref([])
const summary = ref({ status_counts: {}, core_counts: {} })

const pagination = reactive({
  page: 1,
  perPage: 15,
  total: 0
})

const sortState = reactive({
  field: '',
  order: ''
})

const filters = reactive({
  keyword: '',
  status: '',
  core_type: '',
  dateRange: []
})

const quickDialog = reactive({
  visible: false,
  isEdit: false,
  id: null,
  form: {
    nickname: '',
    name: '',
    phone: '',
    email: '',
    number: '',
    xs_number: '',
    parent_id: null,
    province_id: '',
    city_id: '',
    district_id: '',
    address: '',
    level: 1,
    status: 1
  }
})

const auditDialog = reactive({
  visible: false,
  loading: false,
  id: null,
  target: null,
  form: {
    status: 1,
    note: '',
    reason: '',
    number: '',
    xs_number: ''
  }
})

const quickFormRef = ref()
const submitQuickLoading = ref(false)
const parentOptions = ref([])
const parentLoading = ref(false)
const salesmanLoading = reactive({})
const meituanLoading = reactive({})
const provinceOptions = ref([])
const cityOptions = ref([])
const districtOptions = ref([])
const cityLoading = ref(false)
const districtLoading = ref(false)

const quickFormRules = {
  nickname: [{ required: true, message: '请输入机构名称', trigger: 'blur' }],
  name: [{ required: true, message: '请输入负责人姓名', trigger: 'blur' }],
  phone: [{ max: 20, message: '手机号长度不能超过20', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }]
}

const isAuditReject = computed(() => Number(auditDialog.form.status) === 2)

const LEVEL_OPTIONS = [
  { label: 'L0 未审核', value: 0 },
  { label: 'L1', value: 1 },
  { label: 'L2', value: 2 },
  { label: 'L3', value: 3 },
  { label: 'L4', value: 4 },
  { label: 'L5', value: 5 },
  { label: 'L6', value: 6 }
]

const summaryCards = computed(() => {
  const statusCounts = summary.value.status_counts || {}
  const coreCounts = summary.value.core_counts || {}
  return [
    { label: '已认证', value: statusCounts['1'] ?? 0 },
    { label: '待审核', value: statusCounts['0'] ?? 0 },
    { label: '审核失败', value: statusCounts['2'] ?? 0 },
    { label: '核心机构', value: coreCounts['核心机构'] ?? 0 }
  ]
})

const getStatusTagType = (status) => {
  if (status === 1) return 'success'
  if (status === 2) return 'danger'
  return 'warning'
}

const formatAmount = (value) => {
  if (value === null || value === undefined) return '—'
  const number = Number(value)
  if (Number.isNaN(number)) return '—'
  return `¥${number.toFixed(2)}`
}

const formatSalesmanStatus = (status) => {
  if (status === 1) return '已审核'
  if (status === 2) return '待审核'
  if (status === 3) return '禁用'
  return '未知'
}

const formatDate = (value) => value || ''

const formatLocation = (row) => {
  const segments = [row.province_name, row.city_name, row.district_name].filter(Boolean)
  if (segments.length === 0) {
    return '—'
  }
  return segments.join(' / ')
}

const formatEmail = (row) => {
  if (!row) return '—'
  const value = row.email || (row.account && row.account.email) || ''
  return value || '—'
}

const formatParent = (row) => {
  if (row.parent && row.parent.id) {
    const name = row.parent.name || '未命名'
    return `${row.parent.id} - ${name}`
  }
  if (row.parent_id) {
    return `${row.parent_id} - 未知`
  }
  return '—'
}

const getDisplayName = (row) => {
  if (!row) return '—'
  return row.nickname || row.name || `机构 #${row.id ?? ''}`
}

const formatAvatar = (value) => {
  if (!value) return ''
  const normalized = String(value).trim()
  if (!normalized) return ''
  if (/^data:/i.test(normalized)) {
    return normalized
  }
  if (/^https?:\/\//i.test(normalized)) {
    return normalized
  }
  if (normalized.startsWith('//')) {
    return `https:${normalized}`
  }
  if (normalized.startsWith('/')) {
    return normalized
  }
  return `/${normalized}`
}

const ensureProvincesLoaded = async () => {
  if (provinceOptions.value.length > 0) return
  try {
    const { code, data, message } = await fetchInstitutionProvinces()
    if (code === 0 && Array.isArray(data)) {
      provinceOptions.value = data.map(item => ({ ...item, id: String(item.id) }))
    } else {
      ElMessage.error(message || '获取省份列表失败')
    }
  } catch (error) {
    console.error('获取省份列表失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取省份列表失败')
  }
}

const loadCityOptions = async (provinceId, preset = null) => {
  if (!provinceId) {
    cityOptions.value = []
    districtOptions.value = []
    quickDialog.form.city_id = ''
    quickDialog.form.district_id = ''
    return
  }
  cityLoading.value = true
  try {
    const { code, data, message } = await fetchInstitutionCities(provinceId)
    if (code === 0 && Array.isArray(data)) {
      cityOptions.value = data.map(item => ({ ...item, id: String(item.id) }))
      const presetStr = preset != null ? String(preset) : null
      if (presetStr && cityOptions.value.some(item => item.id === presetStr)) {
        quickDialog.form.city_id = presetStr
      } else {
        quickDialog.form.city_id = ''
        preset = null
      }
      if (quickDialog.form.city_id) {
        await loadDistrictOptions(quickDialog.form.city_id, quickDialog.form.district_id)
      } else {
        districtOptions.value = []
        quickDialog.form.district_id = ''
      }
    } else {
      ElMessage.error(message || '获取城市列表失败')
    }
  } catch (error) {
    console.error('获取城市列表失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取城市列表失败')
  } finally {
    cityLoading.value = false
  }
}

const loadDistrictOptions = async (cityId, preset = null) => {
  if (!cityId) {
    districtOptions.value = []
    quickDialog.form.district_id = ''
    return
  }
  districtLoading.value = true
  try {
    const { code, data, message } = await fetchInstitutionDistricts(cityId)
    if (code === 0 && Array.isArray(data)) {
      districtOptions.value = data.map(item => ({ ...item, id: String(item.id) }))
      const presetStr = preset != null ? String(preset) : null
      if (presetStr && districtOptions.value.some(item => item.id === presetStr)) {
        quickDialog.form.district_id = presetStr
      } else {
        quickDialog.form.district_id = ''
      }
    } else {
      ElMessage.error(message || '获取区县列表失败')
    }
  } catch (error) {
    console.error('获取区县列表失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取区县列表失败')
  } finally {
    districtLoading.value = false
  }
}

const handleSalesmanToggle = async (row, value) => {
  if (!row?.id) return

  salesmanLoading[row.id] = true
  const previous = row.salesman_enabled
  row.salesman_enabled = value

  try {
    const { code, data, message } = await toggleInstitutionSalesman(row.id, value)
    if (code === 0 && data) {
      row.salesman_enabled = data.salesman_enabled
      row.invitation_code = data.invitation_code
    } else {
      row.salesman_enabled = previous
      ElMessage.error(message || '更新业务员权限失败')
    }
  } catch (error) {
    console.error('更新业务员权限失败:', error)
    row.salesman_enabled = previous
    ElMessage.error(error.response?.data?.message || error.message || '更新业务员权限失败')
  } finally {
    salesmanLoading[row.id] = false
  }
}

const buildQueryParams = () => {
  const params = {
    page: pagination.page,
    per_page: pagination.perPage
  }
  if (filters.keyword) params.keyword = filters.keyword
  if (filters.status !== '' && filters.status !== null) params.status = filters.status
  if (filters.core_type !== '' && filters.core_type !== null) params.core_type = filters.core_type
  if (Array.isArray(filters.dateRange) && filters.dateRange.length === 2) {
    params.start_date = filters.dateRange[0]
    params.end_date = filters.dateRange[1]
  }
  if (sortState.field && sortState.order) {
    params.sort_field = sortState.field
    params.sort_order = sortState.order
  }
  return params
}

const loadData = async () => {
  loading.value = true
  try {
    const { code, data, message } = await fetchInstitutions(buildQueryParams())
    if (code === 0 && data) {
      list.value = (data.items || []).map(item => ({
        ...item,
        is_meituan: !!item.is_meituan
      }))
      pagination.total = data.pagination?.total || 0
      pagination.page = data.pagination?.page || pagination.page
      pagination.perPage = data.pagination?.per_page || pagination.perPage
      summary.value = data.summary || {}
    } else {
      ElMessage.error(message || '获取机构列表失败')
    }
  } catch (error) {
    console.error('获取机构列表失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取机构列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  filters.keyword = ''
  filters.status = ''
  filters.core_type = ''
  filters.dateRange = []
  sortState.field = ''
  sortState.order = ''
  pagination.page = 1
  loadData()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadData()
}

const canOpenAudit = (row) => !!row?.id

const openAuditDialog = (row) => {
  if (!row?.id) return
  auditDialog.id = row.id
  auditDialog.target = row
  auditDialog.form.status = row.status === 2 ? 2 : 1
  auditDialog.form.note = ''
  auditDialog.form.reason = ''
  auditDialog.form.number = row.number || ''
  auditDialog.form.xs_number = row.xs_number || ''
  auditDialog.visible = true
}

const submitAudit = async () => {
  if (!auditDialog.id) return
  const payload = {
    status: Number(auditDialog.form.status),
    note: auditDialog.form.note?.trim() || '',
    number: auditDialog.form.number?.trim() || '',
    xs_number: auditDialog.form.xs_number?.trim() || ''
  }
  if (payload.status === 2) {
    payload.reason = auditDialog.form.reason?.trim() || ''
    if (!payload.reason) {
      ElMessage.warning('驳回请填写原因')
      return
    }
  }

  auditDialog.loading = true
  try {
    const { code, message } = await updateInstitutionStatus(auditDialog.id, payload)
    if (code === 0) {
      ElMessage.success('审核结果已更新')
      auditDialog.visible = false
      await loadData()
    } else {
      ElMessage.error(message || '更新审核状态失败')
    }
  } catch (error) {
    console.error('update institution status failed', error)
    ElMessage.error(error.response?.data?.message || error.message || '更新审核状态失败')
  } finally {
    auditDialog.loading = false
  }
}

const getRowClassName = ({ row }) => {
  if (row?.status === 0) {
    return 'institution-row--pending'
  }
  if (row?.status === 2) {
    return 'institution-row--rejected'
  }
  return ''
}

const handleMeituanToggle = async (row, value) => {
  if (!row?.id) return

  meituanLoading[row.id] = true
  const previous = !!row.is_meituan
  row.is_meituan = value

  try {
    const { code, message } = await toggleInstitutionMeituan(row.id, value)
    if (code === 0) {
      await loadData()
      ElMessage.success(value ? '已开启美团业务' : '已关闭美团业务')
    } else {
      row.is_meituan = previous
      ElMessage.error(message || '更新美团业务标记失败')
    }
  } catch (error) {
    console.error('更新美团业务标记失败:', error)
    row.is_meituan = previous
    ElMessage.error(error.response?.data?.message || error.message || '更新美团业务标记失败')
  } finally {
    meituanLoading[row.id] = false
  }
}

const handleSortChange = ({ prop, order }) => {
  if (prop !== 'salesman_count' || !order) {
    sortState.field = ''
    sortState.order = ''
  } else {
    sortState.field = 'salesman_count'
    sortState.order = order === 'ascending' ? 'asc' : 'desc'
  }
  pagination.page = 1
  loadData()
}

const handleCellClick = (row, column) => {
  if (column?.property === 'salesman_count') {
    openSalesmanDrawer(row)
  }
}

const handleSalesmanCountClick = (row) => {
  openSalesmanDrawer(row)
}

const salesmanStats = computed(() => {
  if (!salesmanDrawer.stat) return []
  return [
    { key: 'total', label: '业务员总数', value: salesmanDrawer.stat.salesman_total ?? 0 },
    { key: 'approved', label: '已审核数', value: salesmanDrawer.stat.salesman_approved ?? 0 },
    { key: 'invite', label: '邀请码', value: salesmanDrawer.stat.invite_total ?? 0 },
    { key: 'profit', label: '累计收益', value: formatAmount(salesmanDrawer.stat.profit_total ?? 0) },
    { key: 'merchant', label: '关联商户', value: salesmanDrawer.stat.merchant_total ?? 0 }
  ]
})

const goDetail = (row) => {
  if (!row?.id) return
  detailDrawer.visible = true
  detailDrawer.id = row.id
  detailDrawer.title = row.nickname || row.name || `机构 #${row.id}`
}

const closeDetailDrawer = () => {
  detailDrawer.visible = false
  detailDrawer.id = null
  detailDrawer.title = ''
}

const handleDetailUpdated = async () => {
  await loadData()
}

const loadSalesmen = async () => {
  if (!salesmanDrawer.id) return
  salesmanDrawer.loading = true
  try {
    const { code, data, message } = await fetchInstitutionSalesmen({
      institution_id: salesmanDrawer.id,
      page: salesmanDrawer.pagination.page,
      per_page: salesmanDrawer.pagination.perPage,
      with_stat: 1,
      keyword: salesmanDrawer.keyword.trim() || undefined
    })
    if (code === 0 && data) {
      salesmanDrawer.list = data.items || []
      salesmanDrawer.pagination.total = data.pagination?.total || 0
      salesmanDrawer.pagination.page = data.pagination?.page || salesmanDrawer.pagination.page
      salesmanDrawer.pagination.perPage = data.pagination?.per_page || salesmanDrawer.pagination.perPage
      salesmanDrawer.stat = data.stat || null
    } else {
      ElMessage.error(message || '获取业务员列表失败')
    }
  } catch (error) {
    console.error('获取业务员列表失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取业务员列表失败')
  } finally {
    salesmanDrawer.loading = false
  }
}

const openSalesmanDrawer = (row) => {
  if (!row?.id) return
  salesmanDrawer.visible = true
  salesmanDrawer.id = row.id
  salesmanDrawer.title = row.nickname || row.name || `机构 #${row.id}`
  salesmanDrawer.pagination.page = 1
  salesmanDrawer.keyword = ''
  loadSalesmen()
}

const closeSalesmanDrawer = () => {
  salesmanDrawer.visible = false
  salesmanDrawer.id = null
  salesmanDrawer.title = ''
  salesmanDrawer.list = []
  salesmanDrawer.stat = null
}

const handleSalesmanPageChange = (page) => {
  salesmanDrawer.pagination.page = page
  loadSalesmen()
}

const handleSalesmanSearch = () => {
  salesmanDrawer.pagination.page = 1
  loadSalesmen()
}

const resetQuickForm = () => {
  Object.assign(quickDialog.form, {
    nickname: '',
    name: '',
    phone: '',
    email: '',
    number: '',
    xs_number: '',
    parent_id: null,
    province_id: '',
    city_id: '',
    district_id: '',
    address: '',
    level: 1,
    status: 1
  })
  cityOptions.value = []
  districtOptions.value = []
}

const handleProvinceChange = async (value) => {
  quickDialog.form.city_id = ''
  quickDialog.form.district_id = ''
  if (!value) {
    cityOptions.value = []
    districtOptions.value = []
    return
  }
  await loadCityOptions(value)
}

watch(
  () => auditDialog.form.status,
  (value) => {
    if (Number(value) !== 2) {
      auditDialog.form.reason = ''
    }
  }
)

watch(
  () => auditDialog.visible,
  (visible) => {
    if (!visible) {
      auditDialog.id = null
      auditDialog.target = null
      auditDialog.loading = false
      auditDialog.form.note = ''
      auditDialog.form.reason = ''
    }
  }
)

watch(
  () => detailDrawer.visible,
  (visible) => {
    if (!visible) {
      detailDrawer.id = null
      detailDrawer.title = ''
    }
  }
)

watch(
  () => salesmanDrawer.visible,
  (visible) => {
    if (!visible) {
      salesmanDrawer.id = null
      salesmanDrawer.title = ''
      salesmanDrawer.pagination.page = 1
      salesmanDrawer.pagination.total = 0
      salesmanDrawer.list = []
      salesmanDrawer.stat = null
    }
  }
)

const handleCityChange = async (value) => {
  quickDialog.form.district_id = ''
  if (!value) {
    districtOptions.value = []
    return
  }
  await loadDistrictOptions(value)
}

const openQuickDialog = async (row = null) => {
  resetQuickForm()
  quickDialog.isEdit = !!row
  quickDialog.id = row?.id || null

  await ensureProvincesLoaded()

  if (row) {
    quickDialog.form.nickname = row.nickname || row.name || ''
    quickDialog.form.name = row.name || ''
    quickDialog.form.phone = row.phone || ''
    quickDialog.form.email = row.email || (row.account && row.account.email) || ''
    quickDialog.form.number = row.number || ''
    quickDialog.form.xs_number = row.xs_number || ''
    quickDialog.form.parent_id = row.parent?.id ?? row.parent_id ?? null
    quickDialog.form.province_id = row.province != null ? String(row.province) : ''
    quickDialog.form.address = row.address || ''
    quickDialog.form.level = row.level ?? 1
    quickDialog.form.status = row.status ?? 1

    if (row.parent?.id) {
      parentOptions.value = [
        {
          id: row.parent.id,
          name: row.parent.name || '未命名',
          number: row.parent.number,
          phone: row.parent.phone
        }
      ]
    } else {
      parentOptions.value = []
    }

    if (quickDialog.form.province_id) {
      await loadCityOptions(quickDialog.form.province_id, row.city ?? '')
      if (row.city) {
        await loadDistrictOptions(String(row.city), row.district ?? '')
      }
    }
  } else {
    parentOptions.value = []
  }

  quickDialog.visible = true
}

const loadParentOptions = async (query) => {
  if (!query) {
    parentOptions.value = []
    return
  }

  parentLoading.value = true
  try {
    const { code, data, message } = await fetchInstitutionParentOptions({ keyword: query })
    if (code === 0 && Array.isArray(data)) {
      parentOptions.value = data
    } else {
      ElMessage.error(message || '获取上级机构失败')
    }
  } catch (error) {
    console.error('获取上级机构失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取上级机构失败')
  } finally {
    parentLoading.value = false
  }
}

const submitQuickForm = async () => {
  if (!quickFormRef.value) return

  try {
    await quickFormRef.value.validate()
  } catch (error) {
    return
  }

  submitQuickLoading.value = true

  const payload = {
    nickname: quickDialog.form.nickname,
    name: quickDialog.form.name,
    phone: quickDialog.form.phone,
    email: quickDialog.form.email,
    number: quickDialog.form.number,
    xs_number: quickDialog.form.xs_number,
    parent_id: quickDialog.form.parent_id,
    province_id: quickDialog.form.province_id,
    city_id: quickDialog.form.city_id,
    district_id: quickDialog.form.district_id,
    address: quickDialog.form.address,
    level: quickDialog.form.level,
    status: quickDialog.form.status,
  }

  try {
    const response = quickDialog.isEdit
      ? await updateInstitution(quickDialog.id, payload)
      : await createInstitution(payload)

    if (response.code === 0) {
      ElMessage.success(quickDialog.isEdit ? '机构更新成功' : '机构创建成功')
      quickDialog.visible = false
      await loadData()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('快速保存机构失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '操作失败')
  } finally {
    submitQuickLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.institution-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card {
  .el-form-item {
    margin-bottom: 12px;
  }
}

.summary-row {
  margin: 0 !important;
}

.summary-card {
  text-align: left;
  .summary-label {
    color: #909399;
    font-size: 14px;
    margin-bottom: 6px;
  }
  .summary-value {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
  }
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.institution-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  .name-line {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .institution-name {
    font-weight: 600;
  }
  .meta-line {
    color: #909399;
    font-size: 12px;
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .meta-split {
    color: #dcdfe6;
  }
}

.contact-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .contact-avatar {
    flex-shrink: 0;
    border: 1px solid #ebeef5;
  }

  .contact-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .contact-name {
    font-weight: 500;
  }

  .contact-phone {
    color: #909399;
    font-size: 12px;
  }
}

.hierarchy-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.address-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.level-text {
  color: #909399;
  font-size: 12px;
}

.table-footer {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.clickable-row {
  cursor: pointer;
}

.institution-row--pending > td {
  background-color: #fff7e6 !important;
}

.institution-row--rejected > td {
  background-color: #fde2e2 !important;
}

.audit-summary {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.audit-summary .summary-name {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.audit-summary .summary-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.salesman-count-link {
  color: #409eff;
  cursor: pointer;
  user-select: none;
}

.salesman-count-link.is-disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.drawer-table-footer {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.drawer-search {
  margin-bottom: 12px;
}

.drawer-stat-row {
  margin-bottom: 16px;
}

.stat-block {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 12px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
</style>
