<template>
  <div class="merchant-management">
    <div class="page-header">
      <div class="header-text">
        <h1>{{ pageTitle }}</h1>
        <p :class="{ 'onboarding-description': context === 'onboarding' }">{{ pageDescription }}</p>
      </div>
      <el-space>
        <el-badge
          v-if="showPendingShortcut"
          :value="stats.approval.pending"
          class="pending-badge"
          type="warning"
        >
          <el-button text type="primary" @click="quickAuditFilter">
            待审核 {{ stats.approval.pending }}
          </el-button>
        </el-badge>
        <el-button :loading="loading" plain type="primary" @click="fetchMerchants">
          刷新
        </el-button>
      </el-space>
    </div>

    <el-row :gutter="16" class="overview-row">
      <el-col v-for="card in overviewCards" :key="card.label" :md="6" :sm="12" :xs="24">
        <div
          class="overview-card"
          :class="[card.type, card.action ? 'clickable' : '']"
          @click="card.action && handleCardClick(card.action)"
        >
          <div class="card-label">{{ card.label }}</div>
          <div class="card-value">{{ card.value }}</div>
          <div class="card-caption">{{ card.caption }}</div>
        </div>
      </el-col>
    </el-row>

    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters" label-width="90px" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model.trim="filters.keyword"
            clearable
            :placeholder="keywordPlaceholder"
            @keyup.enter.native="handleSearch"
          />
        </el-form-item>
        <el-form-item v-if="context === 'mall'" label="启用状态">
          <el-select
            v-model="filters.status"
            clearable
            placeholder="全部"
            style="width: 180px"
          >
            <el-option label="启用" value="1" />
            <el-option label="禁用" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select
            v-model="filters.audit_status"
            clearable
            placeholder="全部"
            style="width: 180px"
          >
            <el-option
              v-for="option in auditStatusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
          <el-date-picker
            v-model="filters.dateRange"
            end-placeholder="结束日期"
            range-separator="至"
            start-placeholder="开始日期"
            type="daterange"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div class="table-header">
        <div class="table-meta">
          共 <strong>{{ pagination.total }}</strong> 个商户，当前第 {{ pagination.page }} / {{ totalPages }} 页
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="merchants"
        border
        empty-text="暂无商户数据"
        @sort-change="handleSortChange"
      >
        <el-table-column label="ID" prop="id" sortable="custom" width="90" />
        <el-table-column label="商户信息" min-width="220">
          <template #default="{ row }">
            <div class="merchant-info">
              <div class="merchant-name">
                <span>{{ row.mch_name || '—' }}</span>
              </div>
              <div v-if="row.mch_short_name" class="merchant-short">{{ row.mch_short_name }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="200">
          <template #default="{ row }">
            <el-space wrap>
              <el-tag v-if="context === 'mall'" :type="row.status_tag_type">{{ row.status_text }}</el-tag>
              <el-tag :type="row.audit_tag_type">{{ row.audit_status_text }}</el-tag>
            </el-space>
            <div v-if="row.audit_reason" class="status-reason">
              原因：{{ row.audit_reason }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="邀约信息" min-width="240">
          <template #default="{ row }">
            <div class="invite-info">
              <div class="invite-info-line">
                <span>邀请码：{{ getInviteCodeDisplay(row) }}</span>
                <el-tag
                  v-if="getInviteOwnerLabel(row)"
                  class="invite-source-tag"
                  size="small"
                  :type="getInviteOwnerTagType(row)"
                >
                  {{ getInviteOwnerLabel(row) }}
                </el-tag>
              </div>
              <span>业务员：{{ getInviteSalesmanDisplay(row) }}</span>
              <span>机构：{{ getInviteInstitutionDisplay(row) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="联系人" min-width="180">
          <template #default="{ row }">
            <div class="contact-info">
              <span>{{ row.contact_name || '—' }}</span>
              <span>{{ row.contact_phone || '—' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="所属地区" min-width="200">
          <template #default="{ row }">
            <div class="address-info">
              <span>{{ formatRegion(row) || '—' }}</span>
              <div class="address-detail">{{ row.address || row.full_address || '—' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="context === 'mall'" label="统计" min-width="210">
          <template #default="{ row }">
            <div class="stats-inline">
              <div>商品：{{ row.goods_stats?.total ?? 0 }}（待审 {{ row.goods_stats?.pending ?? 0 }}）</div>
              <div>订单：{{ row.order_stats?.total ?? 0 }}（待发 {{ row.order_stats?.pending_ship ?? 0 }}）</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="时间" min-width="200" sortable="custom" prop="create_time">
          <template #default="{ row }">
            <div class="time-info">
              <div>提交：{{ formatDateTime(row.submitted_at) }}</div>
              <div v-if="!row.is_draft">注册：{{ formatDateTime(row.create_time) }}</div>
              <div v-if="row.last_login_time">登录：{{ formatDateTime(row.last_login_time) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column align="right" fixed="right" label="操作" min-width="210">
          <template #default="{ row }">
            <el-space wrap>
              <el-button link size="small" type="primary" @click="openDetail(row)">详情</el-button>
              <el-button
                v-if="context === 'onboarding' && row.audit_status !== 1"
                link
                size="small"
                type="success"
                @click="openAuditDialog(row, 1)"
              >
                通过
              </el-button>
              <el-button
                v-if="context === 'onboarding' && row.audit_status !== 2"
                link
                size="small"
                type="danger"
                @click="openAuditDialog(row, 2)"
              >
                拒绝
              </el-button>
              <el-button
                v-if="context === 'onboarding' && row.audit_status !== 3"
                link
                size="small"
                type="warning"
                @click="openAuditDialog(row, 3)"
              >
                补件
              </el-button>
              <el-button
                v-if="row.is_draft === false"
                link
                size="small"
                :type="row.status === 1 ? 'danger' : 'success'"
                @click="toggleStatus(row)"
              >
                {{ row.status === 1 ? '禁用' : '启用' }}
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-pagination
          v-if="pagination.total > 0"
          :current-page="pagination.page"
          :page-size="pagination.per_page"
          :page-sizes="[15, 30, 50, 80]"
          :total="pagination.total"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-drawer
      v-model="detailDrawer.visible"
      :title="detailDrawer.merchant?.mch_name || '商户详情'"
      destroy-on-close
      size="520px"
    >
      <div v-if="detailDrawer.merchant" class="drawer-body">
        <el-descriptions :column="1" border size="small" title="基础信息">
          <el-descriptions-item label="商户编号">
            {{ detailDrawer.merchant.merchant_id || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="商户简称">
            {{ detailDrawer.merchant.mch_short_name || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="来源">
            {{ detailDrawer.merchant.is_draft ? '自动提交（草稿）' : '商城商户' }}
          </el-descriptions-item>
          <el-descriptions-item label="营业执照">
            {{ detailDrawer.merchant.business_license || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="法人代表">
            {{ detailDrawer.merchant.legal_person || '—' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-descriptions :column="1" border class="drawer-section" size="small" title="联系方式">
          <el-descriptions-item label="联系人">
            {{ detailDrawer.merchant.contact_name || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ detailDrawer.merchant.contact_phone || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="联系邮箱">
            {{ detailDrawer.merchant.contact_email || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="地址">
            {{ detailDrawer.merchant.full_address || '—' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-descriptions :column="1" border class="drawer-section" size="small" title="邀约信息">
          <el-descriptions-item label="邀请码">
            <div class="invite-code-cell">
              <span>{{ getInviteCodeDisplay(detailDrawer.merchant) }}</span>
              <el-tag
                v-if="getInviteOwnerLabel(detailDrawer.merchant)"
                class="invite-source-tag"
                size="small"
                :type="getInviteOwnerTagType(detailDrawer.merchant)"
              >
                {{ getInviteOwnerLabel(detailDrawer.merchant) }}
              </el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="业务员">
            {{ getInviteSalesmanDisplay(detailDrawer.merchant) }}
          </el-descriptions-item>
          <el-descriptions-item label="所属机构">
            {{ getInviteInstitutionDisplay(detailDrawer.merchant) }}
          </el-descriptions-item>
        </el-descriptions>

        <el-descriptions :column="1" border class="drawer-section" size="small" title="时间信息">
          <el-descriptions-item label="提交时间">
            {{ formatDateTime(detailDrawer.merchant.submitted_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">
            {{ formatDateTime(detailDrawer.merchant.create_time) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDateTime(detailDrawer.merchant.update_time) }}
          </el-descriptions-item>
          <el-descriptions-item label="最后登录">
            {{ formatDateTime(detailDrawer.merchant.last_login_time) }}
          </el-descriptions-item>
        </el-descriptions>

        <el-descriptions :column="1" border class="drawer-section" size="small" title="状态信息">
          <el-descriptions-item label="启用状态">
            {{ detailDrawer.merchant.status_text }}
          </el-descriptions-item>
          <el-descriptions-item label="审核状态">
            {{ detailDrawer.merchant.audit_status_text }}
          </el-descriptions-item>
          <el-descriptions-item v-if="detailDrawer.merchant.audit_reason" label="审核备注">
            {{ detailDrawer.merchant.audit_reason }}
          </el-descriptions-item>
        </el-descriptions>

        <el-descriptions :column="1" border class="drawer-section" size="small" title="运行统计">
          <el-descriptions-item label="商品总数">
            {{ detailDrawer.merchant.goods_stats?.total ?? 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="待审核商品">
            {{ detailDrawer.merchant.goods_stats?.pending ?? 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="订单总数">
            {{ detailDrawer.merchant.order_stats?.total ?? 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="待发货订单">
            {{ detailDrawer.merchant.order_stats?.pending_ship ?? 0 }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="mediaSections.length" class="drawer-section media-section">
          <h3>附件资料</h3>
          <div
            v-for="section in mediaSections"
            :key="section.key"
            class="media-group"
          >
            <div class="media-title">{{ section.label }}</div>
            <div class="media-images">
              <el-image
                v-for="(url, index) in section.images"
                :key="index"
                :src="url"
                fit="cover"
                :preview-src-list="section.images"
              />
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <el-dialog
      v-model="auditDialog.visible"
      :title="auditDialogTitle"
      destroy-on-close
      width="480px"
    >
      <div v-if="auditDialog.merchant">
        <el-form :model="auditDialog.form" label-position="top">
          <el-form-item label="目标审核状态">
            <el-radio-group v-model="auditDialog.form.audit_status">
              <el-radio :label="1">通过</el-radio>
              <el-radio :label="2">拒绝</el-radio>
              <el-radio :label="3">补件待完善</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item
            :label="auditDialog.form.audit_status === 1 ? '备注（可选）' : '处理说明'"
            :required="isReasonRequired"
          >
            <el-input
              v-model.trim="auditDialog.form.audit_reason"
              :autosize="{ minRows: 3, maxRows: 5 }"
              maxlength="200"
              placeholder="请输入审批说明，拒绝或补件时必填"
              show-word-limit
              type="textarea"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="auditDialog.visible = false">取消</el-button>
        <el-button :loading="auditDialog.loading" type="primary" @click="submitAudit">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { mallMerchantApi } from '@/api/v1/mall'
import merchantApi from '@/api/v1/merchant'
import { useRoute } from 'vue-router'

const route = useRoute()
const context = computed(() => route.meta?.merchantContext || 'mall')

const loading = ref(false)
const merchants = ref([])

const filters = reactive({
  keyword: '',
  status: '',
  audit_status: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  per_page: 15,
  total: 0
})

const sortState = reactive({
  field: 'id',
  order: 'desc'
})

const stats = reactive({
  status: {
    enabled: 0,
    disabled: 0
  },
  approval: {
    pending: 0,
    pendingAuto: 0,
    reviewing: 0,
    approved: 0,
    rejected: 0,
    disabled: 0
  }
})

const summary = reactive({
  today_new: 0,
  today_auto: 0,
  yesterday_new: 0,
  yesterday_auto: 0
})

const onboardingStats = reactive({
  today: { pending: 0, approved: 0, rejected: 0 },
  yesterday: { pending: 0, approved: 0, rejected: 0 }
})

const detailDrawer = reactive({
  visible: false,
  merchant: null,
  loading: false
})

const mediaSections = computed(() => {
  const assets = detailDrawer.merchant?.media_assets
  if (!assets) return []
  const map = [
    { key: 'identity', label: '身份证件' },
    { key: 'license', label: '营业执照' },
    { key: 'storefront', label: '门店照片' },
    { key: 'protocol', label: '协议材料' },
    { key: 'other', label: '其他附件' }
  ]

  return map
    .map(item => ({
      ...item,
      images: Array.isArray(assets[item.key]) ? assets[item.key] : []
    }))
    .filter(item => item.images.length > 0)
})

const auditDialog = reactive({
  visible: false,
  loading: false,
  merchant: null,
  form: {
    audit_status: 1,
    audit_reason: ''
  }
})

const assignContextDefaults = () => {
  filters.keyword = ''
  filters.status = ''
  filters.audit_status = ''
  filters.dateRange = []
}

const auditStatusOptions = computed(() => {
  if (context.value === 'onboarding') {
    return [
      { label: '全部', value: '' },
      { label: '待审核（自动提交）', value: '0' },
      { label: '已通过', value: '1' },
      { label: '已拒绝', value: '2' },
      { label: '审核中', value: '3' }
    ]
  }
  return [
    { label: '全部', value: '' },
    { label: '已通过', value: '1' },
    { label: '已拒绝', value: '2' },
    { label: '审核中', value: '3' }
  ]
})

const pageTitle = computed(() => (context.value === 'onboarding' ? '商户进件管理' : '商户商城管理'))
const pageDescription = computed(() => (context.value === 'onboarding'
  ? '统一审核小程序/旧系统自动提交的商户进件，快速处理审批与启用'
  : '查看并维护已入驻商城的商户和销售情况'))
const keywordPlaceholder = computed(() => (context.value === 'onboarding'
  ? '商户名称 / 法人 / 联系电话 / 邀请码 / 机构'
  : '商户名称 / 法人 / 联系电话'))
const showPendingShortcut = computed(() => context.value === 'onboarding')

const overviewCards = computed(() => {
  if (context.value === 'onboarding') {
    return [
      {
        label: '今日自动提交',
        value: summary.today_auto,
        caption: '今日小程序自动提交的进件',
        type: 'warning',
        action: 'today_auto'
      },
      {
        label: '今日审核通过',
        value: summary.today_new,
        caption: '今日审核通过的进件',
        type: 'info',
        action: 'today_new'
      },
      {
        label: '昨日自动提交',
        value: summary.yesterday_auto,
        caption: '昨日小程序自动提交的进件',
        type: 'warning',
        action: 'yesterday_auto'
      },
      {
        label: '昨日审核通过',
        value: summary.yesterday_new,
        caption: '昨日审核通过的进件',
        type: 'info',
        action: 'yesterday_new'
      }
    ]
  }

  return [
    {
      label: '商城商户',
      value: stats.approval.approved,
      caption: '已入驻并启用的商户',
      type: 'success'
    },
    {
      label: '停用商户',
      value: stats.approval.disabled ?? stats.status.disabled,
      caption: '因风控或违规被停用',
      type: 'danger'
    },
    {
      label: '审核中',
      value: stats.approval.reviewing,
      caption: '待人工审核确认',
      type: 'info'
    },
    {
      label: '已拒绝',
      value: stats.approval.rejected,
      caption: '审核未通过记录',
      type: 'warning'
    }
  ]
})

const totalPages = computed(() => {
  if (pagination.per_page === 0) return 0
  return Math.ceil(pagination.total / pagination.per_page)
})

const auditDialogTitle = computed(() => {
  if (!auditDialog.merchant) {
    return '审核商户'
  }
  return `审核商户 - ${auditDialog.merchant.mch_name || auditDialog.merchant.merchant_id}`
})

const isReasonRequired = computed(() => {
  return auditDialog.form.audit_status === 2 || auditDialog.form.audit_status === 3
})

const padTwo = (num) => num.toString().padStart(2, '0')

const coerceDate = (value) => {
  if (!value) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'number') {
    const timestamp = value.toString().length === 10 ? value * 1000 : value
    const date = new Date(timestamp)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null

    if (/^\d+$/.test(trimmed)) {
      const numeric = Number(trimmed)
      const timestamp = trimmed.length === 10 ? numeric * 1000 : numeric
      const date = new Date(timestamp)
      return Number.isNaN(date.getTime()) ? null : date
    }

    const meridiemMatch = trimmed.match(/\b(am|pm)\b/i)
    if (meridiemMatch) {
      const meridiem = meridiemMatch[1].toLowerCase()
      const withoutMeridiem = trimmed.replace(/\s*(am|pm)\b/i, '').trim()
      const [datePart, timePart] = withoutMeridiem.split(/\s+/)
      if (datePart && timePart) {
        const [hourPart, minutePart = '0', secondPart = '0'] = timePart.split(':')
        let hour = Number.parseInt(hourPart, 10)
        if (!Number.isNaN(hour)) {
          if (meridiem === 'pm' && hour < 12) hour += 12
          if (meridiem === 'am' && hour === 12) hour = 0
          const normalizedTime = [
            padTwo(hour),
            padTwo(Number.parseInt(minutePart, 10) || 0),
            padTwo(Number.parseInt(secondPart, 10) || 0)
          ].join(':')
          const normalized = `${datePart}T${normalizedTime}`
          const meridiemDate = new Date(normalized)
          if (!Number.isNaN(meridiemDate.getTime())) return meridiemDate
        }
      }
    }

    const isoLike = trimmed.replace(' ', 'T')
    const directParsed = new Date(trimmed)
    if (!Number.isNaN(directParsed.getTime())) return directParsed

    const isoParsed = new Date(isoLike)
    if (!Number.isNaN(isoParsed.getTime())) return isoParsed

    const slashParsed = new Date(trimmed.replace(/-/g, '/'))
    if (!Number.isNaN(slashParsed.getTime())) return slashParsed
  }

  return null
}

// Ensure timestamps render with 24-hour precision regardless of input shape.
const formatDateTime = (value) => {
  const date = coerceDate(value)
  if (!date) return value || '—'

  return [
    `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(date.getDate())}`,
    `${padTwo(date.getHours())}:${padTwo(date.getMinutes())}:${padTwo(date.getSeconds())}`
  ].join(' ')
}

const formatRegion = (row) => {
  if (!row) return ''

  const parts = [row.province, row.city, row.district]
    .map(part => (part ?? '').toString().trim())
    .filter(Boolean)

  return parts.join(' ')
}

const INVITE_FALLBACK = '—'

const getInviteCodeDisplay = (row) => {
  if (!row) return INVITE_FALLBACK
  return row.Invitation_code || row.invitation_code || row.invite_code || INVITE_FALLBACK
}

const getInviteOwnerLabel = (row) => {
  if (!row) return ''
  if (row.invite_owner_label) return row.invite_owner_label
  if (row.invite_owner_type === 'institution') return '机构邀请码'
  if (row.invite_owner_type === 'salesman') return '业务员邀请码'
  return ''
}

const getInviteOwnerTagType = (row) => {
  if (!row || !row.invite_owner_type) return 'info'
  return row.invite_owner_type === 'institution' ? 'success' : 'info'
}

const getInviteSalesmanDisplay = (row) => {
  if (!row) return INVITE_FALLBACK
  const ownerType = row.invite_owner_type || ''
  const displayName = row.salesman_display_name || ''
  const ownerName = row.invite_owner_name || ''
  const salesmanName = row.salesman_name || ''
  const salesmanSerial = row.salesman_serial || ''
  const displaySerial = row.salesman_display_serial || ''
  const channelName = row.channel_name || ''
  const channelId = row.channel_id || ''
  const institutionName = row.invite_institution_name || ''

  if (ownerType === 'institution') {
    return displayName
      || institutionName
      || ownerName
      || channelName
      || channelId
      || displaySerial
      || INVITE_FALLBACK
  }

  return displayName
    || ownerName
    || salesmanName
    || displaySerial
    || salesmanSerial
    || channelName
    || channelId
    || institutionName
    || INVITE_FALLBACK
}

const getInviteInstitutionDisplay = (row) => {
  if (!row) return INVITE_FALLBACK
  const institutionName = row.invite_institution_name || ''
  const channelName = row.channel_name || ''
  const ownerName = row.invite_owner_name || ''
  const channelId = row.channel_id || ''
  const salesmanName = row.salesman_name || ''
  const salesmanSerial = row.salesman_serial || ''

  return institutionName
    || channelName
    || ownerName
    || channelId
    || salesmanName
    || salesmanSerial
    || INVITE_FALLBACK
}

const resetOnboardingSummary = () => {
  summary.today_auto = 0
  summary.today_new = 0
  summary.yesterday_auto = 0
  summary.yesterday_new = 0

  onboardingStats.today.pending = 0
  onboardingStats.today.approved = 0
  onboardingStats.today.rejected = 0

  onboardingStats.yesterday.pending = 0
  onboardingStats.yesterday.approved = 0
  onboardingStats.yesterday.rejected = 0
}

const fetchOnboardingStats = async () => {
  if (context.value !== 'onboarding') {
    resetOnboardingSummary()
    return
  }

  try {
    const response = await merchantApi.getOnboardingStats()
    if (response.code !== 0) {
      throw new Error(response.message || '获取进件统计失败')
    }

    const data = response.data || {}
    const summaryData = data.summary || {}

    summary.today_auto = summaryData.today_auto ?? 0
    summary.today_new = summaryData.today_new ?? 0
    summary.yesterday_auto = summaryData.yesterday_auto ?? 0
    summary.yesterday_new = summaryData.yesterday_new ?? 0

    const todayStats = data.today || data.breakdown?.today || {}
    onboardingStats.today.pending = todayStats.pending ?? 0
    onboardingStats.today.approved = todayStats.approved ?? 0
    onboardingStats.today.rejected = todayStats.rejected ?? 0

    const yesterdayStats = data.yesterday || data.breakdown?.yesterday || {}
    onboardingStats.yesterday.pending = yesterdayStats.pending ?? 0
    onboardingStats.yesterday.approved = yesterdayStats.approved ?? 0
    onboardingStats.yesterday.rejected = yesterdayStats.rejected ?? 0
  } catch (error) {
    console.error('加载进件统计失败:', error)
    resetOnboardingSummary()
  }
}

const toDateString = (date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const buildQueryParams = () => {
  const params = {
    page: pagination.page,
    per_page: pagination.per_page,
    sort_field: sortState.field,
    sort_order: sortState.order
  }

  if (filters.keyword) params.keyword = filters.keyword
  if (context.value === 'mall' && filters.status !== '' && filters.status !== null) params.status = filters.status
  if (filters.audit_status !== '' && filters.audit_status !== null) params.audit_status = filters.audit_status
  if (context.value === 'onboarding') {
    const auditStatus = filters.audit_status
    if (auditStatus === '0' || auditStatus === '' || auditStatus === null) {
      params.include_drafts = true
    }
  }

  if (Array.isArray(filters.dateRange) && filters.dateRange.length === 2) {
    params.start_date = filters.dateRange[0]
    params.end_date = filters.dateRange[1]
  }

  return params
}

const applyListSideEffects = (list = [], meta = {}) => {
  merchants.value = Array.isArray(list) ? list : []
  stats.status.enabled = meta.status_counts?.enabled ?? 0
  stats.status.disabled = meta.status_counts?.disabled ?? 0
  stats.approval.pending = meta.approval_counts?.pending ?? 0
  stats.approval.pendingAuto = meta.approval_counts?.pending_auto ?? 0
  stats.approval.approved = meta.approval_counts?.approved ?? 0
  stats.approval.rejected = meta.approval_counts?.rejected ?? 0
  stats.approval.reviewing = meta.approval_counts?.reviewing ?? 0
  stats.approval.disabled = meta.approval_counts?.disabled ?? 0

  if (detailDrawer.visible && detailDrawer.merchant) {
    const updated = merchants.value.find(item => item.id === detailDrawer.merchant.id)
    if (updated) {
      detailDrawer.merchant = updated
    }
  }
}

const fetchMerchants = async () => {
  loading.value = true
  try {
    const response = await mallMerchantApi.getMerchants(buildQueryParams())
    if (response.code !== 0) {
      ElMessage.error(response.message || '获取商户数据失败')
      return
    }

    const pageData = response.data || {}
    const meta = response.meta || {}

    pagination.total = pageData.total ?? 0
    pagination.per_page = pageData.per_page ?? pagination.per_page
    pagination.page = pageData.current_page ?? pagination.page

    applyListSideEffects(pageData.data, meta)

    if (context.value === 'onboarding') {
      fetchOnboardingStats()
    } else {
      resetOnboardingSummary()
    }
  } catch (error) {
    console.error('加载商户列表失败:', error)
    ElMessage.error(error?.response?.data?.message || error.message || '获取商户数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchMerchants()
}

const resetFilters = () => {
  assignContextDefaults()
  pagination.page = 1
  fetchMerchants()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchMerchants()
}

const handleSizeChange = (size) => {
  pagination.per_page = size
  pagination.page = 1
  fetchMerchants()
}

const handleCardClick = (action) => {
  if (context.value !== 'onboarding') return

  const todayDate = new Date()
  const todayStr = toDateString(todayDate)
  const yesterdayDate = new Date(todayDate)
  yesterdayDate.setDate(todayDate.getDate() - 1)
  const yesterdayStr = toDateString(yesterdayDate)

  filters.keyword = ''

  switch (action) {
    case 'today_auto':
      filters.audit_status = '0'
      filters.dateRange = [todayStr, todayStr]
      break
    case 'today_new':
      filters.audit_status = '1'
      filters.dateRange = [todayStr, todayStr]
      break
    case 'yesterday_auto':
      filters.audit_status = '0'
      filters.dateRange = [yesterdayStr, yesterdayStr]
      break
    case 'yesterday_new':
      filters.audit_status = '1'
      filters.dateRange = [yesterdayStr, yesterdayStr]
      break
    default:
      return
  }

  pagination.page = 1
  fetchMerchants()
}

const handleSortChange = ({ prop, order }) => {
  if (!prop || !order) {
    sortState.field = 'id'
    sortState.order = 'desc'
  } else {
    sortState.field = prop
    sortState.order = order === 'ascending' ? 'asc' : 'desc'
  }
  fetchMerchants()
}

const openDetail = async (merchant) => {
  detailDrawer.visible = true
  detailDrawer.loading = true
  detailDrawer.merchant = null

  try {
    const isDraftSource = merchant?.record_source === 'draft' || merchant?.is_draft
    const response = await merchantApi.getDetail(merchant.id, {
      source: isDraftSource ? 'draft' : 'final'
    })

    if (response.code === 0 && response.data) {
      detailDrawer.merchant = response.data
    } else {
      detailDrawer.merchant = merchant
      if (response.code !== 0) {
        ElMessage.error(response.message || '获取商户详情失败')
      }
    }
  } catch (error) {
    console.error('获取商户详情失败:', error)
    detailDrawer.merchant = merchant
    ElMessage.error(error?.response?.data?.message || error.message || '获取商户详情失败')
  } finally {
    detailDrawer.loading = false
  }
}

const openAuditDialog = (merchant, presetStatus = 1) => {
  auditDialog.merchant = merchant
  auditDialog.form.audit_status = presetStatus
  auditDialog.form.audit_reason = ''
  auditDialog.visible = true
}

const submitAudit = async () => {
  if (!auditDialog.merchant) return

  if (isReasonRequired.value && !auditDialog.form.audit_reason) {
    ElMessage.warning('请输入审批说明')
    return
  }

  auditDialog.loading = true
  try {
    const payload = {
      audit_status: auditDialog.form.audit_status,
      audit_reason: auditDialog.form.audit_reason || ''
    }
    const response = context.value === 'onboarding'
      ? await merchantApi.auditOnboarding(auditDialog.merchant.id, payload)
      : await mallMerchantApi.auditMerchant(auditDialog.merchant.id, payload)
    if (response.code === 0) {
      ElMessage.success('审核状态已更新')
      auditDialog.visible = false
      await fetchMerchants()
    } else {
      ElMessage.error(response.message || '审核失败')
    }
  } catch (error) {
    console.error('审核商户失败:', error)
    ElMessage.error(error?.response?.data?.message || error.message || '审核失败')
  } finally {
    auditDialog.loading = false
  }
}

const toggleStatus = async (merchant) => {
  const targetStatus = merchant.status === 1 ? 0 : 1
  const actionLabel = targetStatus === 1 ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(
      `确认要${actionLabel}商户「${merchant.mch_name || merchant.merchant_id || merchant.id}」吗？`,
      '确认操作',
      {
        confirmButtonText: `确认${actionLabel}`,
        cancelButtonText: '取消',
        type: targetStatus === 1 ? 'success' : 'warning'
      }
    )
  } catch (cancelled) {
    return
  }

  try {
    const response = await mallMerchantApi.updateMerchantStatus(merchant.id, { status: targetStatus })
    if (response.code === 0) {
      ElMessage.success(`${actionLabel}成功`)
      await fetchMerchants()
    } else {
      ElMessage.error(response.message || `${actionLabel}失败`)
    }
  } catch (error) {
    console.error('更新商户状态失败:', error)
    ElMessage.error(error?.response?.data?.message || error.message || `${actionLabel}失败`)
  }
}

const quickAuditFilter = () => {
  pagination.page = 1
  filters.audit_status = context.value === 'onboarding' ? '0' : ''
  fetchMerchants()
}

assignContextDefaults()

watch(
  () => context.value,
  () => {
    assignContextDefaults()
    pagination.page = 1
    fetchMerchants()
  },
  { immediate: true }
)
</script>

<style scoped>
.merchant-management {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.page-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.header-text h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px;
}

.header-text p {
  color: #6b7280;
  margin: 0;
}

.onboarding-description {
  color: #ffffff;
}

.overview-row {
  margin: -4px 0 0;
}

.overview-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 18px;
}

.overview-card.success {
  border: 1px solid rgba(56, 189, 248, 0.35);
}

.overview-card.danger {
  border: 1px solid rgba(248, 113, 113, 0.35);
}

.overview-card.warning {
  border: 1px solid rgba(251, 191, 36, 0.45);
}

.overview-card.info {
  border: 1px solid rgba(129, 140, 248, 0.35);
}

.card-label {
  color: #6b7280;
  font-size: 14px;
}

.card-value {
  font-size: 28px;
  font-weight: 600;
  margin: 8px 0 4px;
}

.card-caption {
  color: #9ca3af;
  font-size: 12px;
}

.filter-card,
.table-card {
  padding: 20px;
}

.table-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.table-meta {
  color: #6b7280;
}

.merchant-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.merchant-name {
  align-items: center;
  display: flex;
  gap: 8px;
}

.merchant-name span {
  font-weight: 600;
}

.merchant-short {
  color: #6b7280;
  font-size: 13px;
}

.status-reason {
  color: #f97316;
  font-size: 12px;
  margin-top: 4px;
  word-break: break-all;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.invite-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.invite-info-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.invite-info-line span {
  color: #1f2937;
  font-weight: 600;
}

.invite-source-tag {
  font-size: 11px;
}

.invite-code-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.invite-code-cell span {
  font-weight: 600;
  color: #1f2937;
}

.address-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.address-detail {
  color: #6b7280;
  font-size: 12px;
}

.stats-inline {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.drawer-section {
  margin-top: 16px;
}

.pending-badge :deep(.el-badge__content) {
  right: 18px;
}

.media-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
}

.media-group {
  margin-bottom: 16px;
}

.media-title {
  color: #4b5563;
  font-size: 14px;
  margin-bottom: 8px;
}

.media-images {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.media-images :deep(.el-image) {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
}
</style>
