<template>
  <div class="institution-onboarding">
    <section class="institution-header">
      <div class="institution-basic">
        <van-image round width="56" height="56" :src="institutionAvatar" />
        <div class="institution-info">
          <div class="institution-name">
            {{ institutionName }}
            <van-tag
              v-if="institutionStatusText"
              class="institution-status-tag"
              size="mini"
              plain
              :type="institutionStatus"
            >
              {{ institutionStatusText }}
            </van-tag>
          </div>
          <div class="institution-meta">
            <span class="institution-code">邀请码 {{ institutionInviteCode }}</span>
            <span class="institution-number">机构号 {{ institutionNumber }}</span>
            <div
              v-if="canSwitchInstitution"
              class="institution-switch"
              @click="showInstitutionSheet = true"
            >
              <van-icon name="exchange" />
              <span>切换</span>
            </div>
            <div class="settings-entry" @click="openInstitutionSettings">
              <van-icon name="setting-o" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="summary-section">
      <div class="summary-card">
        <div class="summary-header">
          <div class="summary-title">今日进件</div>
          <div class="summary-total">
            <span class="summary-total-label">存量进件</span>
            <span class="summary-total-value">{{ totalAll }}</span>
          </div>
        </div>
        <div class="summary-metrics">
          <div class="metric">
            <span class="metric-label">自动提交</span>
            <span class="metric-value warning">
              <span class="metric-current">{{ onboardingStats.summary.today_auto }}</span>
              <span class="metric-sub">/{{ onboardingStats.summary.yesterday_auto }}</span>
            </span>
          </div>
          <div class="metric">
            <span class="metric-label">审核通过</span>
            <span class="metric-value success">
              <span class="metric-current">{{ onboardingStats.summary.today_new }}</span>
              <span class="metric-sub">/{{ onboardingStats.summary.yesterday_new }}</span>
            </span>
          </div>
          <div class="metric">
            <span class="metric-label">待审核</span>
            <span class="metric-value">
              <span class="metric-current">{{ onboardingStats.today.pending }}</span>
              <span class="metric-sub">/{{ onboardingStats.yesterday.pending }}</span>
            </span>
          </div>
        </div>
      </div>
    </section>

    <section class="trend-section" v-if="trendSeries.length && !trendLoading">
      <div class="trend-card">
        <div class="trend-header">
          <div class="trend-title">近7日进件趋势</div>
          <div class="trend-range">
            {{ trendSeries[0].label }} ~ {{ trendSeries[trendSeries.length - 1].label }}
          </div>
        </div>
        <div class="trend-body">
          <div
            v-for="(item, index) in trendSeries"
            :key="item.label"
            class="trend-column"
          >
            <div class="candlestick">
              <div class="wick" :style="getWickStyle(item)"></div>
              <div
                class="body"
                :class="getBodyClass(index)"
                :style="getBodyStyle(item)"
              ></div>
            </div>
            <div class="label">{{ item.label.slice(5) }}</div>
          </div>
        </div>
        <div class="trend-legend">
          <span class="legend-item">
            <span class="dot submitted"></span> 上影线：自动提交
          </span>
          <span class="legend-item">
            <span class="dot approved"></span> 实体：审核通过
          </span>
        </div>
      </div>
    </section>

    <section class="filters-section">
      <van-search
        v-model="filters.keyword"
        placeholder="商户名称 / 手机号"
        shape="round"
        :show-action="!!filters.keyword"
        action-text="搜索"
        @search="handleSearch"
        @clear="handleClear"
        @cancel="handleSearch(filters.keyword)"
      />
      <div v-if="isSearching" class="search-tip">
        <van-loading size="14" />
        <span>搜索中...</span>
      </div>
      <div class="filter-actions">
        <div class="filter-chip" @click="showStatusSheet = true">
          <van-icon name="cluster-o" />
          <span>{{ statusLabel }}</span>
        </div>
        <div class="filter-chip" @click="showCalendar = true">
          <van-icon name="calendar-o" />
          <span>{{ dateRangeLabel }}</span>
        </div>
        <van-button size="small" type="primary" plain @click="resetFilters">重置</van-button>
      </div>
      <div class="meta-tags">
        <div class="meta-chip warning">待审核 {{ metaCounters.pending }}</div>
        <div class="meta-chip success">已通过 {{ metaCounters.approved }}</div>
        <div class="meta-chip danger">已拒绝 {{ metaCounters.rejected }}</div>
        <div class="meta-chip info">审核中 {{ metaCounters.reviewing }}</div>
      </div>
    </section>

    <van-pull-refresh v-model="refreshing" @refresh="handleRefresh">
      <template v-if="!merchants.length && !listState.loading && !listState.error">
        <van-empty description="暂无进件数据" image="search" />
      </template>
      <van-list
        v-else
        v-model:loading="listState.loading"
        :finished="listState.finished"
        :error="!!listState.error"
        :error-text="listState.error || '加载失败，点击重试'"
        finished-text="已加载全部进件"
        @load="loadMerchants"
      >
        <div
          v-for="merchant in merchants"
          :key="`${merchant.id}-${merchant.record_source}`"
          class="merchant-card"
          @click="openMerchant(merchant)"
        >
          <div class="card-header">
            <div class="title">{{ merchant.mch_name || merchant.merchant_name || merchant.merchantShortName || '未命名商户' }}</div>
            <van-tag size="small" :type="merchant.audit_tag_type || 'warning'">
              {{ merchant.audit_status_text || '待审核' }}
            </van-tag>
          </div>
          <div class="card-meta">
            <span>提交 {{ merchant.submitted_at || merchant.create_time || '—' }}</span>
          </div>
          <div class="card-footer">
            <span class="badge" v-if="merchant.record_source === 'draft'">自动提交</span>
            <van-icon name="arrow" />
          </div>
        </div>
      </van-list>
    </van-pull-refresh>

    <van-action-sheet
      v-model:show="showInstitutionSheet"
      :actions="institutionActions"
      cancel-text="取消"
      close-on-click-action
      teleport="body"
      @select="onSelectInstitution"
    />

    <van-action-sheet
      v-model:show="showStatusSheet"
      :actions="statusActions"
      cancel-text="取消"
      close-on-click-action
      @select="onSelectStatus"
    />

    <van-calendar
      v-model:show="showCalendar"
      type="range"
      color="#1989fa"
      :show-confirm="true"
      confirm-text="确定"
      @confirm="onConfirmDateRange"
    />

    <van-popup
      v-model:show="detailState.visible"
      position="bottom"
      round
      :style="{ height: '90vh' }"
      closeable
      @close="closeDetail"
    >
      <div class="detail-popup">
        <div class="detail-header">
          <div class="detail-title">
            {{ detailState.data?.mch_name || detailState.data?.merchant_name || '商户详情' }}
          </div>
          <van-tag size="small" :type="detailStatusTagType">
            {{ detailState.data?.audit_status_text || '待审核' }}
          </van-tag>
        </div>
        <van-loading size="24px" class="detail-loading" v-if="detailState.loading" />
        <div class="detail-content" v-else>
          <van-cell-group inset>
            <van-cell title="提交时间" :value="detailSubmittedAt" />
            <van-cell title="商户编号" :value="detailState.data?.merchant_id || detailState.data?.id || '—'" />
          </van-cell-group>
          <van-cell-group inset title="提交信息" v-if="detailState.data">
            <van-cell title="联系人" :value="detailState.data?.contact_name || '—'" />
            <van-cell title="联系电话" :value="detailState.data?.contact_phone || '—'" />
            <van-cell title="所在地区" :value="detailRegionText" />
            <van-cell title="详细地址" :value="detailState.data?.address || '—'" />
            <van-cell title="所属机构" :value="detailState.data?.invite_institution_name || detailState.data?.channel_name || '—'" />
            <van-cell title="业务员" :value="detailSalesman" />
            <van-cell title="邀请码" :value="detailState.data?.invite_code || detailState.data?.invitation_code || '—'" />
          </van-cell-group>
          <van-cell-group inset title="营业信息" v-if="detailState.data">
            <van-cell title="营业执照号" :value="detailState.data?.business_license || detailState.data?.license_no || '—'" />
            <van-cell title="法人姓名" :value="detailState.data?.legal_person || '—'" />
            <van-cell title="法人身份证" :value="detailState.data?.legal_id_card || '—'" />
            <van-cell title="开户银行" :value="detailState.data?.bank_name || '—'" />
            <van-cell title="开户账号" :value="detailState.data?.bank_account || '—'" />
            <van-cell title="经营范围" :value="detailState.data?.business_scope || '—'" />
            <van-cell title="备注" :value="detailState.data?.remark || '—'" />
          </van-cell-group>
          <div
            class="attachment-source-tip"
            v-if="detailAttachmentSource === 'draft-fallback' && detailAttachmentGroups.length"
          >
            图片资料来自商户草稿，供审核参考
          </div>
          <div class="detail-attachments" v-if="detailAttachmentGroups.length">
            <div
              v-for="group in detailAttachmentGroups"
              :key="group.label"
              class="attachment-group"
            >
              <div class="section-label">{{ group.label }}</div>
              <div class="attachment-grid">
                <div
                  v-for="item in group.items"
                  :key="item.id"
                  class="attachment-item"
                >
                  <van-image
                    width="100%"
                    height="120"
                    fit="cover"
                    radius="8"
                    :src="item.url"
                    @click="previewAttachment(item)"
                  />
                  <div class="attachment-meta">
                    <span>{{ item.label }}</span>
                    <van-button
                      size="mini"
                      type="primary"
                      round
                      @click.stop="saveAttachment(item)"
                    >保存到相册</van-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <van-empty
            v-else-if="!detailState.loading && detailState.data"
            class="detail-attachments-empty"
            description="未上传图片资料"
          />
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { Dialog, ImagePreview, showFailToast, showToast, showSuccessToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { normalizeImageUrl, resolveImageSource } from '@/utils/asset'
import {
  getInstitutionOnboardingDetail,
  getInstitutionOnboardingMerchants,
  getInstitutionOnboardingStats,
  getInstitutionOnboardingTrend
} from '@/api/institution'

// 搜索防抖定时器和状态
let searchDebounceTimer = null
const SEARCH_DEBOUNCE_DELAY = 800 // 增加到800ms，减少搜索请求频率
const isSearching = ref(false)

const userStore = useUserStore()
const router = useRouter()

const INSTITUTION_STORAGE_KEY = 'institution/active-id'

const getStoredInstitutionId = () => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(INSTITUTION_STORAGE_KEY)
    if (!raw) return null
    const numeric = Number(raw)
    return Number.isFinite(numeric) ? numeric : null
  } catch (error) {
    console.info('读取机构选择缓存失败:', error)
    return null
  }
}

const availableInstitutions = ref([])
const currentInstitutionSnapshot = ref(null)
const selectedInstitutionId = ref(getStoredInstitutionId())
const showInstitutionSheet = ref(false)
const isInstitutionInitializing = ref(true)

const selectedInstitution = computed(() => {
  const list = availableInstitutions.value
  if (list.length > 0) {
    if (typeof selectedInstitutionId.value === 'number') {
      const match = list.find(item => item.id === selectedInstitutionId.value)
      if (match) {
        return match
      }
    }
    return list[0]
  }
  return currentInstitutionSnapshot.value
})

const canSwitchInstitution = computed(() => availableInstitutions.value.length > 1)

const institutionActions = computed(() =>
  availableInstitutions.value.map(item => ({
    name: item.name || `机构 ${item.id}`,
    subname: item.number ? `机构号 ${item.number}` : '',
    value: item.id,
    color: item.id === selectedInstitutionId.value ? '#1989fa' : ''
  }))
)

const onboardingStats = reactive({
  all: { pending: 0, approved: 0, rejected: 0 },
  today: { pending: 0, approved: 0, rejected: 0 },
  yesterday: { pending: 0, approved: 0, rejected: 0 },
  summary: { today_auto: 0, today_new: 0, yesterday_auto: 0, yesterday_new: 0 }
})

const metaCounters = reactive({
  pending: 0,
  pendingAuto: 0,
  approved: 0,
  rejected: 0,
  reviewing: 0,
  disabled: 0
})

const filters = reactive({
  keyword: '',
  auditStatus: '',
  dateRange: []
})

const statusActions = [
  { name: '全部状态', value: '' },
  { name: '待审核（自动提交）', value: '0' },
  { name: '已通过', value: '1' },
  { name: '已拒绝', value: '2' },
  { name: '审核中', value: '3' }
]

const statusLabel = computed(() => {
  const found = statusActions.find(item => item.value === filters.auditStatus)
  return found ? found.name : '审核状态'
})

const showStatusSheet = ref(false)
const showCalendar = ref(false)
const refreshing = ref(false)

const listState = reactive({
  page: 1,
  perPage: 10,
  loading: false,
  finished: false,
  error: '',
  total: 0
})

const merchants = ref([])

const trendState = reactive({
  labels: [],
  submitted: [],
  approved: []
})
const trendLoading = ref(false)

const detailState = reactive({
  visible: false,
  loading: false,
  data: null
})

const ATTACHMENT_GROUP_ORDER = {
  法人身份证: 10,
  身份证正面: 11,
  身份证反面: 12,
  营业执照: 20,
  门店照片: 30,
  协议资料: 40,
  签约资料: 50,
  银行卡照片: 60,
  账户资料: 70,
  其他附件: 80,
  附件: 90
}

const detailAttachmentSource = ref('final')
const detailAttachments = ref([])
const detailAttachmentGroups = computed(() => {
  const groups = []
  const groupMap = new Map()
  detailAttachments.value.forEach((item, index) => {
    if (!item || !item.url) return
    const label = item.label && typeof item.label === 'string' && item.label.trim()
      ? item.label.trim()
      : '附件'
    let normalizedLabel = label
    const suffixMatch = label.match(/^(.+?)(?:\d+|（\d+）|\(\d+\))$/u)
    if (suffixMatch && suffixMatch[1]) {
      const candidate = suffixMatch[1].trim()
      if (candidate) {
        normalizedLabel = candidate
      }
    }
    const order = ATTACHMENT_GROUP_ORDER[normalizedLabel] ?? Number.POSITIVE_INFINITY
    let group = groupMap.get(normalizedLabel)
    if (!group) {
      group = { label: normalizedLabel, items: [], index, order }
      groupMap.set(normalizedLabel, group)
      groups.push(group)
    }
    group.items.push(item)
  })
  return groups.sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order
    }
    return a.index - b.index
  })
})

const detailAttachmentPreviewUrls = computed(() => {
  const urls = []
  detailAttachmentGroups.value.forEach(group => {
    group.items.forEach(item => {
      if (item && item.url) {
        urls.push(item.url)
      }
    })
  })
  return urls
})

const ACCESS_DENIED_MESSAGE = '您还不是支付机构，请联系点点够官方进行开通'
const ACCESS_DENIED_PATTERNS = [
  '手机号码没有匹配',
  '手机号没有匹配',
  '手机号码未匹配',
  '手机号未匹配',
  '未匹配到支付机构',
  '不是支付机构',
  '尚未开通支付机构'
]
const ACCESS_DENIED_CODES = new Set([403, 404, 4601, 4603, 4604])
let institutionAccessDeniedHandled = false

const normalizeInstitutionError = (source) => {
  if (!source) {
    return { message: '', code: undefined }
  }
  if (typeof source === 'string') {
    return { message: source, code: undefined }
  }
  if (typeof source === 'number') {
    return { message: '', code: source }
  }
  if (source?.message !== undefined || source?.code !== undefined) {
    return {
      message: source.message ?? '',
      code: source.code
    }
  }
  const response = source?.response
  const data = response?.data ?? {}
  return {
    message: data.message ?? data.msg ?? source?.message ?? '',
    code: data.code ?? response?.status ?? source?.code
  }
}

const isInstitutionAccessDenied = (message, code) => {
  if (message) {
    const text = String(message)
    if (ACCESS_DENIED_PATTERNS.some(pattern => text.includes(pattern))) {
      return true
    }
  }
  if (code !== undefined && code !== null) {
    const numeric = Number(code)
    if (!Number.isNaN(numeric) && ACCESS_DENIED_CODES.has(numeric)) {
      return true
    }
  }
  return false
}

const handleInstitutionAccessDenied = async (source) => {
  const { message, code } = normalizeInstitutionError(source)
  if (!isInstitutionAccessDenied(message, code)) {
    return false
  }
  if (institutionAccessDeniedHandled) {
    return true
  }
  institutionAccessDeniedHandled = true
  try {
    await Dialog.alert({
      title: '提示',
      message: ACCESS_DENIED_MESSAGE,
      confirmButtonText: '去开通'
    })
  } catch (error) {
    console.info('机构访问受限提示关闭:', error)
  }
  const currentPath = router.currentRoute?.value?.fullPath
  const query = { reason: 'no-match' }
  if (currentPath) {
    query.from = encodeURIComponent(currentPath)
  }
  const target = { name: 'InstitutionApply', query }
  router.replace(target)
  return true
}

const ATTACHMENT_LABEL_FIELDS = ['label', 'name', 'title', 'desc', 'description', 'remark', 'type', 'fieldName', 'field_name']
const ATTACHMENT_FILENAME_FIELDS = ['filename', 'fileName', 'name', 'title', 'originName', 'origin_name', 'originalName', 'original_name']
const ATTACHMENT_SERVER_ID_FIELDS = ['serverId', 'mediaId', 'media_id', 'id', 'file_id']

const trendSeries = computed(() =>
  trendState.labels.map((label, index) => ({
    label,
    submitted: trendState.submitted[index] ?? 0,
    approved: trendState.approved[index] ?? 0
  }))
)

const trendMax = computed(() => {
  const values = trendSeries.value.flatMap(item => [item.submitted, item.approved])
  const max = Math.max(0, ...values)
  return max > 0 ? max : 0
})

const initialInvite =
  userStore.userInfo?.institution_invite_code ||
  userStore.userInfo?.invite_code ||
  userStore.userInfo?.institution_number ||
  ''

const institutionName = computed(() => {
  if (selectedInstitution.value?.name) {
    return selectedInstitution.value.name
  }
  return userStore.userInfo?.institution_name || userStore.userName || '支付机构'
})

const institutionInviteCode = computed(() => {
  if (selectedInstitution.value?.invite_code) {
    return selectedInstitution.value.invite_code
  }
  if (currentInstitutionSnapshot.value?.invite_code) {
    return currentInstitutionSnapshot.value.invite_code
  }
  return initialInvite || '—'
})

const institutionNumber = computed(() => {
  if (selectedInstitution.value?.number) {
    return selectedInstitution.value.number
  }
  if (currentInstitutionSnapshot.value?.number) {
    return currentInstitutionSnapshot.value.number
  }
  return userStore.userInfo?.institution_number || '—'
})

const resolveStatusType = (status) => {
  if (status === 1) return 'success'
  if (status === 0) return 'warning'
  if (status === 2 || status === 3) return 'danger'
  return null
}

const resolveStatusText = (status) => {
  const statusMap = {
    0: '待认证',
    1: '已认证',
    2: '审核失败',
    3: '已禁用'
  }
  return statusMap[status] || null
}

const institutionStatus = computed(() => {
  const status = selectedInstitution.value?.status ?? currentInstitutionSnapshot.value?.status
  const resolved = resolveStatusType(status)
  if (resolved) {
    return resolved
  }
  return userStore.userInfo?.is_pay_institution === 1 ? 'success' : 'warning'
})

const institutionStatusText = computed(() => {
  const status = selectedInstitution.value?.status ?? currentInstitutionSnapshot.value?.status
  const resolved = resolveStatusText(status)
  if (resolved) {
    return resolved
  }
  return userStore.userInfo?.is_pay_institution === 1 ? '已认证' : '待认证'
})

const institutionAvatar = computed(() => userStore.userAvatar || 'https://img.itapgo.com/profile/default-institution.png')

const dateRangeLabel = computed(() => {
  if (!filters.dateRange.length) return '时间范围'
  if (filters.dateRange.length === 1) return filters.dateRange[0]
  return `${filters.dateRange[0]} ~ ${filters.dateRange[1]}`
})

const totalAll = computed(() => onboardingStats.all.pending + onboardingStats.all.approved + onboardingStats.all.rejected)

const openInstitutionSettings = () => {
  const query = {}
  if (typeof selectedInstitutionId.value === 'number' && !Number.isNaN(selectedInstitutionId.value)) {
    query.institution_id = selectedInstitutionId.value
  }
  if (Object.keys(query).length) {
    router.push({ name: 'InstitutionSettings', query })
  } else {
    router.push({ name: 'InstitutionSettings' })
  }
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}

const CANDLE_MAX_HEIGHT = 120

const computeTrendRatio = (value) => {
  if (!trendMax.value) return 0
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return 0
  return Math.min(1, Math.max(0, numeric / trendMax.value))
}

const computeCandleHeight = (value, minHeight = 0) => {
  if (!trendMax.value) return 0
  const ratio = computeTrendRatio(value)
  if (ratio <= 0) {
    return 0
  }
  const height = Math.round(ratio * CANDLE_MAX_HEIGHT)
  return Math.max(height, minHeight)
}

const getWickStyle = (item) => {
  const submitted = Number(item?.submitted ?? 0)
  const min = submitted > 0 ? 12 : 0
  const height = computeCandleHeight(submitted, min)
  return {
    height: `${height}px`
  }
}

const getBodyStyle = (item) => {
  const submitted = Number(item?.submitted ?? 0)
  const approved = Number(item?.approved ?? 0)
  const wickHeight = computeCandleHeight(submitted, submitted > 0 ? 12 : 0)
  const bodyMin = approved > 0 ? 10 : 0
  const bodyHeight = Math.min(wickHeight, computeCandleHeight(Math.min(approved, submitted), bodyMin))
  return {
    height: `${bodyHeight}px`
  }
}

const getBodyClass = (index) => {
  const series = trendSeries.value
  const current = Number(series[index]?.approved ?? 0)
  if (index === 0) {
    return current > 0 ? 'up' : 'flat'
  }
  const previous = Number(series[index - 1]?.approved ?? 0)
  if (current > previous) return 'up'
  if (current < previous) return 'down'
  return 'flat'
}

function normalizeInstitutionOption(source) {
  if (!source) return null
  const idCandidate = source.id ?? source.institution_id ?? source.institutionId ?? null
  const numericId = Number(idCandidate)
  if (!Number.isFinite(numericId)) {
    return null
  }

  const numberCandidate = source.number ?? source.institution_number ?? source.channel_id ?? source.channelId ?? ''
  const nameCandidate = source.name ?? source.nickname ?? source.institution_name ?? ''
  const inviteCodeCandidate = source.invite_code ?? source.invitation_code ?? source.code ?? ''
  const statusCandidate = source.status ?? source.status_code ?? source.state

  return {
    id: numericId,
    number: numberCandidate ? String(numberCandidate) : '',
    name: nameCandidate ? String(nameCandidate) : `机构 ${numericId}`,
    invite_code: inviteCodeCandidate ? String(inviteCodeCandidate) : '',
    status: Number.isFinite(Number(statusCandidate)) ? Number(statusCandidate) : undefined
  }
}

function syncAvailableInstitutionOptions(payload) {
  const rawList = Array.isArray(payload?.available_institutions) ? payload.available_institutions : []
  const normalizedList = rawList
    .map(normalizeInstitutionOption)
    .filter(Boolean)

  const currentInstitution = normalizeInstitutionOption(payload?.institution)

  if (currentInstitution) {
    const existingIndex = normalizedList.findIndex(item => item.id === currentInstitution.id)
    if (existingIndex >= 0) {
      normalizedList[existingIndex] = {
        ...normalizedList[existingIndex],
        ...currentInstitution,
        invite_code: currentInstitution.invite_code || normalizedList[existingIndex].invite_code,
        number: currentInstitution.number || normalizedList[existingIndex].number,
        name: currentInstitution.name || normalizedList[existingIndex].name,
        status: currentInstitution.status ?? normalizedList[existingIndex].status
      }
    } else {
      normalizedList.unshift(currentInstitution)
    }
  }

  availableInstitutions.value = normalizedList
  currentInstitutionSnapshot.value = currentInstitution || null

  if (normalizedList.length === 0) {
    if (currentInstitution && typeof currentInstitution.id === 'number') {
      selectedInstitutionId.value = currentInstitution.id
    } else if (selectedInstitutionId.value !== null) {
      selectedInstitutionId.value = null
    }
    return
  }

  const hasSelected = typeof selectedInstitutionId.value === 'number' && normalizedList.some(item => item.id === selectedInstitutionId.value)
  if (hasSelected) {
    return
  }

  const preferredId =
    (currentInstitution && normalizedList.some(item => item.id === currentInstitution.id) ? currentInstitution.id : null) ??
    normalizedList[0].id

  if (typeof preferredId === 'number' && preferredId !== selectedInstitutionId.value) {
    selectedInstitutionId.value = preferredId
  }
}

function buildInstitutionParams(additional = {}) {
  const params = { ...additional }
  if (typeof selectedInstitutionId.value === 'number' && !Number.isNaN(selectedInstitutionId.value)) {
    params.institution_id = selectedInstitutionId.value
  }
  return params
}

async function fetchStats() {
  if (institutionAccessDeniedHandled) {
    return
  }
  try {
    const res = await getInstitutionOnboardingStats(buildInstitutionParams())
    if (res.code !== 0) {
      if (await handleInstitutionAccessDenied(res)) {
        return
      }
      throw new Error(res.message || '获取统计失败')
    }
    const data = res.data || {}
    onboardingStats.all = data.all || { pending: 0, approved: 0, rejected: 0 }
    onboardingStats.today = data.today || { pending: 0, approved: 0, rejected: 0 }
    onboardingStats.yesterday = data.yesterday || { pending: 0, approved: 0, rejected: 0 }
    onboardingStats.summary = data.summary || { today_auto: 0, today_new: 0, yesterday_auto: 0, yesterday_new: 0 }
    syncAvailableInstitutionOptions(data)
  } catch (error) {
    if (await handleInstitutionAccessDenied(error)) {
      return
    }
    console.error('fetchStats failed', error)
    showFailToast(error.message || '获取统计失败')
  }
}

async function fetchTrend() {
  if (institutionAccessDeniedHandled) {
    return
  }
  trendLoading.value = true
  try {
    const res = await getInstitutionOnboardingTrend(buildInstitutionParams({ days: 7 }))
    if (res.code !== 0) {
      if (await handleInstitutionAccessDenied(res)) {
        return
      }
      throw new Error(res.message || '获取趋势数据失败')
    }
    const data = res.data || {}
    trendState.labels = Array.isArray(data.labels) ? data.labels : []
    trendState.submitted = Array.isArray(data.submitted) ? data.submitted : []
    trendState.approved = Array.isArray(data.approved) ? data.approved : []
  } catch (error) {
    if (await handleInstitutionAccessDenied(error)) {
      return
    }
    console.error('fetchTrend failed', error)
  } finally {
    trendLoading.value = false
  }
}

function resetPagination() {
  listState.page = 1
  listState.finished = false
  listState.error = ''
  listState.total = 0
}

async function loadMerchants() {
  if (institutionAccessDeniedHandled) {
    listState.loading = false
    listState.finished = true
    return
  }
  if (listState.loading || listState.finished) {
    return
  }
  listState.loading = true
  listState.error = ''
  try {
    const params = buildInstitutionParams({
      page: listState.page,
      per_page: listState.perPage,
      keyword: filters.keyword || undefined,
      audit_status: filters.auditStatus || undefined
    })
    if (filters.dateRange.length === 2) {
      params.date_start = filters.dateRange[0]
      params.date_end = filters.dateRange[1]
    }
    const res = await getInstitutionOnboardingMerchants(params)
    if (res.code !== 0) {
      if (await handleInstitutionAccessDenied(res)) {
        return
      }
      throw new Error(res.message || '获取进件数据失败')
    }
    const pageData = res.data || {}
    const meta = res.meta || {}
    metaCounters.pending = meta.approval_counts?.pending ?? 0
    metaCounters.pendingAuto = meta.approval_counts?.pending_auto ?? 0
    metaCounters.approved = meta.approval_counts?.approved ?? 0
    metaCounters.rejected = meta.approval_counts?.rejected ?? 0
    metaCounters.reviewing = meta.approval_counts?.reviewing ?? 0
    metaCounters.disabled = meta.approval_counts?.disabled ?? 0
    const records = Array.isArray(pageData.data) ? pageData.data : []
    if (listState.page === 1) {
      merchants.value = records
    } else {
      merchants.value = merchants.value.concat(records)
    }
    listState.total = pageData.total ?? merchants.value.length
    listState.page += 1
    if (!records.length || merchants.value.length >= listState.total) {
      listState.finished = true
    }
  } catch (error) {
    if (await handleInstitutionAccessDenied(error)) {
      return
    }
    console.error('loadMerchants failed', error)
    listState.error = error.message || '加载失败，请重试'
  } finally {
    listState.loading = false
    if (refreshing.value) {
      refreshing.value = false
    }
  }
}

function handleSearch(value) {
  const keyword = (value || '').trim()
  filters.keyword = keyword
  
  // 清除之前的防抖定时器
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
  
  // 如果关键词为空，立即触发搜索（重置列表）
  if (!keyword) {
    isSearching.value = false
    triggerReload()
    return
  }
  
  // 关键词长度不足2个字符时不触发搜索（等待更多输入）
  if (keyword.length < 2) {
    isSearching.value = false
    return
  }
  
  // 显示搜索中状态
  isSearching.value = true
  
  // 使用防抖延迟执行搜索
  searchDebounceTimer = setTimeout(async () => {
    searchDebounceTimer = null
    try {
      await triggerReload()
    } finally {
      isSearching.value = false
    }
  }, SEARCH_DEBOUNCE_DELAY)
}

function handleClear() {
  // 清除搜索防抖定时器
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
  isSearching.value = false
  filters.keyword = ''
  triggerReload()
}

function onSelectStatus(action) {
  filters.auditStatus = action.value
  showStatusSheet.value = false
  triggerReload()
}

function onSelectInstitution(action) {
  showInstitutionSheet.value = false
  if (!action) {
    return
  }
  const value = typeof action.value === 'number' ? action.value : Number(action.value)
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    return
  }
  if (value === selectedInstitutionId.value) {
    return
  }
  selectedInstitutionId.value = value
}

function onConfirmDateRange(values) {
  const [start, end] = values || []
  if (start && end) {
    filters.dateRange = [formatDate(start), formatDate(end)]
    showCalendar.value = false
    triggerReload()
  } else {
    showCalendar.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.auditStatus = ''
  filters.dateRange = []
  triggerReload()
}

async function triggerReload() {
  if (institutionAccessDeniedHandled) {
    return
  }
  resetPagination()
  merchants.value = []
  await loadMerchants()
}

async function handleRefresh() {
  if (institutionAccessDeniedHandled) {
    return
  }
  refreshing.value = true
  resetPagination()
  merchants.value = []
  try {
    await fetchStats()
    if (!institutionAccessDeniedHandled) {
      await Promise.all([fetchTrend(), loadMerchants()])
      showToast('已更新进件数据')
    }
  } finally {
    refreshing.value = false
  }
}

async function openMerchant(merchant) {
  if (institutionAccessDeniedHandled) {
    return
  }
  detailState.visible = true
  detailState.loading = true
  detailState.data = null
  const isDraft = merchant.record_source === 'draft' || merchant.is_draft
  detailAttachmentSource.value = isDraft ? 'primary-draft' : 'final'
  detailAttachments.value = []
  try {
    const loadDetail = async (source, overrideId) => {
      const params = buildInstitutionParams(source ? { source } : {})
      const requestId = overrideId ?? merchant.id
      const response = await getInstitutionOnboardingDetail(requestId, params)
      if (response.code !== 0) {
        throw new Error(response.message || '获取详情失败')
      }
      return response.data || {}
    }
    const primaryData = await loadDetail(isDraft ? 'draft' : undefined)
    detailState.data = primaryData
    const primaryAttachments = extractAttachments(primaryData)
    detailAttachments.value = primaryAttachments
    if (!primaryAttachments.length && !isDraft) {
      const fallbackDraftId = resolveDraftAttachmentId(merchant, primaryData)
      if (fallbackDraftId) {
        try {
          const draftFallback = await loadDetail('draft', fallbackDraftId)
          const draftAttachments = extractAttachments(draftFallback)
          if (draftAttachments.length) {
            detailAttachments.value = draftAttachments
            detailAttachmentSource.value = 'draft-fallback'
          }
        } catch (fallbackError) {
          console.warn('draft attachment fallback failed', fallbackError)
        }
      }
    }
  } catch (error) {
    console.error('openMerchant failed', error)
    showFailToast(error.message || '获取详情失败')
  } finally {
    detailState.loading = false
  }
}

function closeDetail() {
  detailState.visible = false
  detailState.data = null
  detailAttachmentSource.value = 'final'
  detailAttachments.value = []
}

function resolveDraftAttachmentId(merchant, detail) {
  const candidates = [
    merchant?.draft_id,
    merchant?.draftId,
    merchant?.draft_record_id,
    merchant?.draftRecordId,
    merchant?.record_id,
    merchant?.recordId,
    detail?.draft_id,
    detail?.draftId,
    detail?.draft_record_id,
    detail?.draftRecordId
  ]
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) continue
    const numeric = Number(candidate)
    if (!Number.isNaN(numeric) && numeric > 0) {
      return numeric
    }
  }
  return null
}

const detailStatusTagType = computed(() => {
  if (!detailState.data) return 'primary'
  return detailState.data.audit_tag_type || 'warning'
})

const detailSubmittedAt = computed(() => detailState.data?.submitted_at || detailState.data?.create_time || '—')
const detailSalesman = computed(() => {
  if (!detailState.data) return '—'
  const name = detailState.data.salesman_display_name || detailState.data.salesman_name
  const serial = detailState.data.salesman_display_serial || detailState.data.salesman_code
  if (name && serial) {
    return `${name}（${serial}）`
  }
  return name || serial || '—'
})

const detailRegionText = computed(() => {
  if (!detailState.data) return '—'
  const province = detailState.data.province || detailState.data.province_name || ''
  const city = detailState.data.city || detailState.data.city_name || ''
  const district = detailState.data.district || detailState.data.district_name || ''
  const parts = [province, city, district].filter(Boolean)
  if (parts.length) {
    return parts.join(' / ')
  }
  const codes = [detailState.data.province_code, detailState.data.city_code, detailState.data.district_code].filter(Boolean)
  if (codes.length) {
    return codes.join(' / ')
  }
  return detailState.data.full_address || detailState.data.address || '—'
})

watch(selectedInstitutionId, async (newVal, oldVal) => {
  if (typeof window !== 'undefined') {
    try {
      if (typeof newVal === 'number' && !Number.isNaN(newVal)) {
        window.localStorage.setItem(INSTITUTION_STORAGE_KEY, String(newVal))
      } else {
        window.localStorage.removeItem(INSTITUTION_STORAGE_KEY)
      }
    } catch (error) {
      console.info('同步机构选择缓存失败:', error)
    }
  }

  if (isInstitutionInitializing.value) {
    return
  }

  if (newVal === oldVal || typeof newVal !== 'number' || Number.isNaN(newVal)) {
    return
  }

  institutionAccessDeniedHandled = false
  resetPagination()
  merchants.value = []

  try {
    await fetchStats()
    if (!institutionAccessDeniedHandled) {
      await Promise.all([fetchTrend(), loadMerchants()])
    }
  } catch (error) {
    console.error('切换支付机构后刷新数据失败:', error)
    showFailToast(error.message || '切换机构失败，请重试')
  }
})

onMounted(async () => {
  try {
    await fetchStats()
    if (!institutionAccessDeniedHandled) {
      await Promise.all([fetchTrend(), loadMerchants()])
    }
  } finally {
    isInstitutionInitializing.value = false
  }
})

// 组件卸载时清理搜索防抖定时器
onUnmounted(() => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
})

function previewAttachment(attachment) {
  const target = normalizeImageUrl(attachment?.url ?? attachment?.raw ?? attachment, { fallback: '' })
  if (!target) return
  let previewSources = detailAttachmentPreviewUrls.value.length ? [...detailAttachmentPreviewUrls.value] : []
  if (!previewSources.includes(target)) {
    previewSources.push(target)
  }
  const startIndex = previewSources.findIndex(url => url === target)
  const initialIndex = startIndex >= 0 ? startIndex : Math.max(previewSources.length - 1, 0)
  if (window.wx && typeof window.wx.previewImage === 'function') {
    window.wx.previewImage({
      current: target,
      urls: previewSources
    })
    return
  }
  if (typeof ImagePreview === 'function' && previewSources.length) {
    ImagePreview({
      images: previewSources,
      startPosition: initialIndex,
      showIndex: true,
      closeable: true,
      teleport: 'body'
    })
    return
  }
  window.open(target, '_blank')
}

async function saveAttachment(attachment) {
  const target = normalizeImageUrl(attachment?.url ?? attachment?.raw ?? attachment, { fallback: '' })
  if (!target) return
  const filename = attachment?.filename || deriveFilenameFromUrl(target)
  const serverId = attachment?.serverId
  try {
    if (window.wx && typeof window.wx.downloadImage === 'function' && serverId) {
      window.wx.downloadImage({
        serverId,
        success: response => {
          const localId = response?.localId || response?.localData
          if (localId && typeof window.wx.saveImageToPhotosAlbum === 'function') {
            window.wx.saveImageToPhotosAlbum({
              filePath: localId,
              success: () => showSuccessToast('保存成功'),
              fail: () => fallbackDownload(target, filename)
            })
          } else {
            showSuccessToast('保存成功')
          }
        },
        fail: () => fallbackDownload(target, filename)
      })
      return
    }

    if (window.wx && typeof window.wx.saveImageToPhotosAlbum === 'function') {
      window.wx.saveImageToPhotosAlbum({
        filePath: target,
        success: () => showSuccessToast('保存成功'),
        fail: () => fallbackDownload(target, filename)
      })
      return
    }

    if (navigator?.clipboard && window.isSecureContext && window.ClipboardItem) {
      const response = await fetch(target, { mode: 'cors' })
      if (!response.ok) {
        throw new Error(`fetch image failed with status ${response.status}`)
      }
      const blob = await response.blob()
      await navigator.clipboard.write([
        new window.ClipboardItem({ [blob.type]: blob })
      ])
      showSuccessToast('已复制图片，可手动保存')
      return
    }
  } catch (error) {
    console.warn('保存图片失败，使用降级方案', error)
  }

  fallbackDownload(target, filename)
}

function fallbackDownload(url, filename = 'attachment') {
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'attachment'
  link.rel = 'noopener'
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  showToast('图片已打开，可长按保存')
}

function deriveFilenameFromUrl(url) {
  if (!url) return 'attachment'
  try {
    const { pathname } = new URL(url)
    const candidate = pathname.split('/').pop()
    if (candidate) {
      return candidate
    }
  } catch (error) {
    // ignore URL parsing error, fallback below
  }
  const sanitized = url.split('?')[0].split('#')[0]
  const parts = sanitized.split('/')
  const last = parts.pop()
  return last || 'attachment'
}

function coerceAttachmentValues(value) {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.flatMap(item => coerceAttachmentValues(item))
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    if (/^[\[{]/.test(trimmed)) {
      try {
        const parsed = JSON.parse(trimmed)
        return coerceAttachmentValues(parsed)
      } catch (error) {
        // treat as plain string if JSON.parse fails
      }
    }
    if (!/^data:/i.test(trimmed)) {
      const separators = ['|', '\n']
      for (const separator of separators) {
        if (trimmed.includes(separator)) {
          return trimmed.split(separator).map(item => item.trim()).filter(Boolean)
        }
      }
      if (trimmed.includes(',')) {
        const byComma = trimmed.split(',').map(item => item.trim()).filter(Boolean)
        if (byComma.length > 1) {
          return byComma
        }
      }
    }
    return [trimmed]
  }
  if (typeof value === 'object') {
    const nestedKeys = ['images', 'urls', 'values', 'list', 'items', 'data', 'files', 'fileList', 'records']
    for (const key of nestedKeys) {
      if (Array.isArray(value[key])) {
        return value[key].flatMap(entry => coerceAttachmentValues(entry))
      }
    }
    return [value]
  }
  return []
}

function inferAttachmentLabel(source, fallbackLabel, index, total) {
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    for (const key of ATTACHMENT_LABEL_FIELDS) {
      const candidate = source[key]
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim()
      }
    }
  }
  const base = fallbackLabel || '附件'
  return total > 1 ? `${base}${index + 1}` : base
}

function deriveAttachmentFilename(source, normalizedUrl) {
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    for (const key of ATTACHMENT_FILENAME_FIELDS) {
      const candidate = source[key]
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim()
      }
    }
  }
  return deriveFilenameFromUrl(normalizedUrl)
}

function extractServerId(source) {
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    for (const key of ATTACHMENT_SERVER_ID_FIELDS) {
      const candidate = source[key]
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim()
      }
    }
  }
  return ''
}

function extractAttachments(data) {
  const result = []
  if (!data) return result

  const listCandidates = [
    { key: 'license_images', label: '营业执照' },
    { key: 'idcard_images', label: '法人身份证' },
    { key: 'store_images', label: '门店照片' },
    { key: 'bank_images', label: '银行卡照片' },
    { key: 'attachments', label: '附件' },
    { key: 'licensePhoto', label: '营业执照' },
    { key: 'licensephoto', label: '营业执照' },
    { key: 'indentityPhoto', label: '法人身份证' },
    { key: 'idcardPhoto', label: '法人身份证' },
    { key: 'mainPhoto', label: '门店照片' },
    { key: 'protocolPhoto', label: '协议资料' },
    { key: 'otherDoc', label: '其他附件' },
    { key: 'orgPhoto', label: '签约资料' },
    { key: 'accountCodePhoto', label: '银行卡照片' }
  ]

  const singleFields = [
    { key: 'license_img', label: '营业执照' },
    { key: 'license_photo', label: '营业执照' },
    { key: 'idcard_front', label: '身份证正面' },
    { key: 'idcard_back', label: '身份证反面' },
    { key: 'store_photo', label: '门店照片' },
    { key: 'storefront_photo', label: '门店照片' },
    { key: 'bank_permit', label: '开户许可证' }
  ]

  const seen = new Set()
  let sequence = 0

  const isLikelyImageSource = (candidate) => {
    if (!candidate || typeof candidate !== 'string') {
      return false
    }
    const trimmed = candidate.trim()
    if (!trimmed) {
      return false
    }
    if (/^(data:image\/|blob:)/i.test(trimmed)) {
      return true
    }
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('//')) {
      return true
    }
    if (trimmed.startsWith('/')) {
      return true
    }
    if (/\.(png|jpe?g|gif|webp|bmp|svg|heic|heif|tiff?)$/i.test(trimmed.split('?')[0])) {
      return true
    }
    if (trimmed.includes('/')) {
      return true
    }
    return false
  }

  const appendAttachments = (value, { key, label }) => {
    const canonicalValue = Array.isArray(value) ? value : [value]
    const entries = canonicalValue.flatMap(item => coerceAttachmentValues(item))
    if (!entries.length) return
    const flattened = Array.isArray(entries) ? entries.flat() : [entries]
    const validEntries = flattened
      .map(entry => {
        const resolved = resolveImageSource(entry)
        if (!isLikelyImageSource(resolved)) {
          return null
        }
        const normalized = normalizeImageUrl(resolved, { fallback: '' })
        if (!normalized) {
          return null
        }
        return { entry, resolved, normalized }
      })
      .filter(Boolean)

    if (!validEntries.length) {
      return
    }

    const total = validEntries.length
    validEntries.forEach((item, index) => {
      const attachmentLabel = inferAttachmentLabel(item.entry, label, index, total)
      const uniqueKey = `${item.normalized}::${attachmentLabel}`
      if (seen.has(uniqueKey)) {
        return
      }
      const filename = deriveAttachmentFilename(item.entry, item.normalized)
      const serverId = extractServerId(item.entry)
      sequence += 1
      result.push({
        id: `${key || 'attachment'}-${sequence}`,
        url: item.normalized,
        raw: item.resolved,
        label: attachmentLabel,
        filename,
        serverId
      })
      seen.add(uniqueKey)
    })
  }

  listCandidates.forEach(candidate => appendAttachments(data[candidate.key], candidate))
  singleFields.forEach(candidate => appendAttachments(data[candidate.key], candidate))

  const mediaAssets = data.media_assets || data.mediaAssets
  if (mediaAssets && typeof mediaAssets === 'object') {
    const mediaLabelMap = {
      identity: '法人身份证',
      license: '营业执照',
      storefront: '门店照片',
      protocol: '协议资料',
      other: '其他附件',
      bank: '银行卡照片',
      account: '账户资料'
    }
    Object.entries(mediaAssets).forEach(([assetKey, assetValue]) => {
      if (!assetValue) return
      const normalizedKey = String(assetKey || '').toLowerCase()
      const assetLabel =
        mediaLabelMap[normalizedKey] ||
        (normalizedKey.includes('bank')
          ? '银行卡照片'
          : normalizedKey.includes('account')
            ? '账户资料'
            : normalizedKey.includes('license')
              ? '营业执照'
              : normalizedKey.includes('identity') || normalizedKey.includes('idcard')
                ? '法人身份证'
                : '附件')
      appendAttachments(assetValue, {
        key: `media-${normalizedKey || assetKey}`,
        label: assetLabel
      })
    })
  }

  if (Array.isArray(data.sections)) {
    data.sections.forEach((section, sectionIndex) => {
      if (!section || typeof section !== 'object') {
        return
      }
      const sectionLabel =
        typeof section.title === 'string' && section.title.trim()
          ? section.title.trim()
          : '附件'

      if (Array.isArray(section.photos)) {
        section.photos.forEach((photoGroup, groupIndex) => {
          if (!photoGroup) return
          const photoLabel =
            typeof photoGroup.label === 'string' && photoGroup.label.trim()
              ? photoGroup.label.trim()
              : sectionLabel
          if (Array.isArray(photoGroup.urls) && photoGroup.urls.length) {
            appendAttachments(photoGroup.urls, {
              key: `section-${sectionIndex}-${groupIndex}`,
              label: photoLabel
            })
          } else {
            appendAttachments(photoGroup, {
              key: `section-${sectionIndex}-${groupIndex}`,
              label: photoLabel
            })
          }
        })
      }

      if (Array.isArray(section.fields)) {
        section.fields.forEach((field, fieldIndex) => {
          if (!field || typeof field !== 'object') return
          const fieldValue = field.value
          if (!fieldValue) return
          const fieldLabel =
            typeof field.label === 'string' && field.label.trim()
              ? field.label.trim()
              : sectionLabel
          appendAttachments(fieldValue, {
            key: `section-field-${sectionIndex}-${fieldIndex}`,
            label: fieldLabel
          })
        })
      }
    })
  }

  return result
}
</script>

<style scoped>
.institution-onboarding {
  padding: 16px;
  background-color: #f5f7fb;
  min-height: 100vh;
  box-sizing: border-box;
}

.institution-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  background: #fff;
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(31, 45, 61, 0.04);
  margin-bottom: 12px;
}

.institution-basic {
  display: flex;
  align-items: center;
  gap: 12px;
}

.institution-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.institution-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}

.institution-status-tag {
  font-size: 11px;
  line-height: 1;
}

.institution-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;

  .settings-entry {
    margin-left: auto;
    width: 30px;
    height: 30px;
    border-radius: 15px;
    background-color: #f2f3f5;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1989fa;
  }

  .institution-switch {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border-radius: 16px;
    background-color: #f2f3f5;
    color: #1989fa;
    cursor: pointer;
  }

  .institution-switch:active {
    background-color: #eaf3ff;
  }
}

.institution-code {
  color: #606266;
}

.institution-number {
  color: #909399;
}

.summary-section {
  margin-bottom: 12px;
}

.summary-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(31, 45, 61, 0.04);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.summary-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1f2d3d;
}

.summary-total {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.summary-total-label {
  font-size: 12px;
  color: #909399;
}

.summary-total-value {
  font-size: 24px;
  font-weight: 700;
  color: #1989fa;
  line-height: 1;
}

.summary-metrics {
  display: flex;
  justify-content: space-between;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-label {
  font-size: 12px;
  color: #909399;
}

.metric-value {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}

.metric-current {
  line-height: 1;
}

.metric-value.success {
  color: #07c160;
}

.metric-value.warning {
  color: #ff8f1f;
}

.metric-sub {
  font-size: 12px;
  font-weight: 400;
  color: #c0c4cc;
  line-height: 1;
}

.summary-divider {
  height: 1px;
  background: #f2f3f5;
  margin: 16px 0;
}

.summary-foot {
  display: flex;
  justify-content: space-between;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #606266;
}

.summary-item .value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
}

.summary-item .value.success {
  color: #07c160;
}

.trend-section {
  margin-bottom: 12px;
}

.trend-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(31, 45, 61, 0.04);
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.trend-title {
  font-size: 16px;
  font-weight: 600;
}

.trend-range {
  font-size: 12px;
  color: #909399;
}

.trend-body {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  height: 140px;
  padding: 0 4px;
}

.trend-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.candlestick {
  position: relative;
  width: 20px;
  height: 120px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.candlestick .wick {
  position: absolute;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, rgba(25, 137, 250, 0.5), rgba(25, 137, 250, 0.15));
  border-radius: 1px;
  transition: height 0.3s ease;
  color: rgba(25, 137, 250, 0.45);
}

.candlestick .wick::before,
.candlestick .wick::after {
  content: '';
  position: absolute;
  left: 50%;
  width: 12px;
  height: 2px;
  background: currentColor;
  border-radius: 2px;
  transform: translateX(-50%);
}

.candlestick .wick::before {
  top: 0;
}

.candlestick .wick::after {
  bottom: 0;
}

.candlestick .body {
  position: relative;
  width: 12px;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: height 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
  z-index: 1;
}

.candlestick .body.up {
  background: rgba(7, 193, 96, 0.25);
  border-color: rgba(7, 193, 96, 0.65);
}

.candlestick .body.down {
  background: rgba(238, 10, 36, 0.18);
  border-color: rgba(238, 10, 36, 0.55);
}

.candlestick .body.flat {
  background: rgba(25, 137, 250, 0.22);
  border-color: rgba(25, 137, 250, 0.55);
}

.trend-column .label {
  font-size: 11px;
  color: #909399;
}

.trend-legend {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 12px;
  font-size: 12px;
  color: #606266;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-item .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.legend-item .dot.submitted {
  background: #8bb8ff;
}

.legend-item .dot.approved {
  background: #07c160;
}

.filters-section {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(31, 45, 61, 0.04);
  margin-bottom: 12px;
}

.search-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: #969799;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 18px;
  border: 1px solid #ebedf0;
  font-size: 13px;
  color: #323233;
}

.filter-chip:active {
  background: #f2f3f5;
}

.meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.meta-chip {
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 14px;
  background: #f7f8fa;
  color: #606266;
}

.meta-chip.success {
  color: #07c160;
  background: rgba(7, 193, 96, 0.08);
}

.meta-chip.warning {
  color: #ff8f1f;
  background: rgba(255, 143, 31, 0.12);
}

.meta-chip.danger {
  color: #ee0a24;
  background: rgba(238, 10, 36, 0.1);
}

.meta-chip.info {
  color: #1989fa;
  background: rgba(25, 137, 250, 0.1);
}

.merchant-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(31, 45, 61, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-header .title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
  flex: 1;
  padding-right: 12px;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #909399;
  font-size: 12px;
}

.card-footer .badge {
  background: #fff7e6;
  color: #ff8f1f;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.detail-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: 24px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 0;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
  flex: 1;
  padding-right: 12px;
}

.detail-loading {
  margin: 40px auto;
}

.detail-content {
  padding: 0 12px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-content :deep(.van-cell-group) {
  margin-top: 0;
}

.detail-attachments {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attachment-source-tip {
  font-size: 12px;
  color: #909399;
  background: #f7f8fa;
  padding: 8px 12px;
  border-radius: 8px;
}

.detail-attachments-empty {
  padding: 12px 0;
}

.attachment-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-group + .attachment-group {
  margin-top: 4px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
}

.attachment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.attachment-item {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #606266;
}
</style>
