<template>
  <div :class="containerClass">
    <van-nav-bar
      v-if="!embedded"
      title="安装预约管理"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
    >
      <template #right>
        <van-icon name="replay" size="18" @click="reloadAll" />
      </template>
    </van-nav-bar>

    <section class="summary-card card-shadow">
      <div class="summary-header">
        <div class="summary-title">概览</div>
        <div class="date-tabs">
          <span
            v-for="preset in datePresets"
            :key="preset.value"
            class="date-tab"
            :class="{ active: datePreset === preset.value }"
            @click="setDatePreset(preset.value)"
          >
            {{ preset.label }}
          </span>
        </div>
      </div>
      <div class="summary-grid">
        <div class="summary-item" v-for="item in summaryCards" :key="item.key">
          <div class="summary-value">{{ formatCount(item.value) }}</div>
          <div class="summary-label">{{ item.label }}</div>
        </div>
      </div>
    </section>

    <section class="filter-card card-shadow">
      <van-search
        v-model="keyword"
        placeholder="搜索联系人 / 电话 / 预约号"
        shape="round"
        clearable
        show-action
        @search="handleSearch"
        @clear="handleSearch"
      >
        <template #action>
          <van-button type="primary" size="small" round @click="handleSearch">查询</van-button>
        </template>
      </van-search>

      <div class="filter-row">
        <van-dropdown-menu>
          <van-dropdown-item
            v-model="statusFilter"
            :options="statusOptions"
            @change="handleStatusChange"
          />
        </van-dropdown-menu>
      </div>
    </section>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        class="booking-list"
        v-model:loading="listLoading"
        :finished="finished"
        finished-text="没有更多预约了"
        @load="loadMore"
      >
        <div
          v-for="booking in bookings"
          :key="booking.id"
          class="booking-card card-shadow"
          @click="openDetail(booking)"
        >
          <div class="booking-card__header">
            <div>
              <div class="booking-no">{{ booking.booking_no }}</div>
              <div class="plan-label">{{ booking.billing_plan_text || booking.package_type_text }}</div>
            </div>
            <van-tag :type="statusTagType(booking.status)">
              {{ statusText(booking.status) }}
            </van-tag>
          </div>

          <div class="booking-card__meta">
            <div class="meta-item">
              <span class="label">联系人</span>
              <span class="value">{{ booking.contact_name }} {{ booking.contact_phone }}</span>
            </div>
            <div class="meta-item">
              <span class="label">安装时间</span>
              <span class="value">{{ formatDateTime(booking.install_time) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">押金</span>
              <span class="value">
                ¥{{ formatAmount(booking.deposit_amount) }}
                <span v-if="booking.deposit_waived" class="badge">已免</span>
              </span>
            </div>
          </div>

          <div class="booking-card__footer">
            <span class="created-at">创建：{{ formatDateTime(booking.created_at) }}</span>
            <div class="actions">
              <van-button
                size="mini"
                round
                type="primary"
                plain
                @click.stop="openDetail(booking)"
              >
                详情
              </van-button>
              <van-button
                v-if="showActionEntry(booking.status)"
                size="mini"
                round
                type="warning"
                plain
                @click.stop="openActions(booking)"
              >
                处理
              </van-button>
            </div>
          </div>
        </div>

        <van-empty v-if="!bookings.length && !listLoading" description="暂无预约记录" />
      </van-list>
    </van-pull-refresh>

    <van-popup
      v-model:show="detailVisible"
      position="bottom"
      round
      teleport="body"
      :style="{ height: '80vh' }"
    >
      <div class="detail-popup">
        <div class="popup-header">
          <div>
            <div class="popup-title">{{ currentDetail?.booking_no || '预约详情' }}</div>
            <div class="popup-subtitle">状态：{{ statusText(currentDetail?.status) }}</div>
          </div>
          <van-icon name="close" size="20" @click="detailVisible = false" />
        </div>

        <van-loading v-if="detailLoading" size="24px">加载中...</van-loading>

        <template v-else-if="currentDetail">
          <div class="detail-section">
            <div class="detail-label">扣费计划</div>
            <div class="detail-value">{{ currentDetail.billing_plan_text || currentDetail.package_type_text }}</div>
          </div>
          <div class="detail-section">
            <div class="detail-label">押金</div>
            <div class="detail-value">
              ¥{{ formatAmount(currentDetail.deposit_amount) }}
              <van-tag v-if="currentDetail.deposit_waived" type="success" plain size="small">已免</van-tag>
            </div>
          </div>
          <div class="detail-section" v-if="currentDetail.wechat_pay_score">
            <div class="detail-label">微信支付分</div>
            <div class="detail-value">{{ currentDetail.wechat_pay_score }}</div>
          </div>
          <div class="detail-section">
            <div class="detail-label">联系人</div>
            <div class="detail-value">{{ currentDetail.contact_name }} {{ currentDetail.contact_phone }}</div>
          </div>
          <div class="detail-section">
            <div class="detail-label">安装地址</div>
            <div class="detail-value">{{ currentDetail.install_address }}</div>
          </div>
          <div class="detail-section">
            <div class="detail-label">预约时间</div>
            <div class="detail-value">{{ formatDateTime(currentDetail.install_time) }}</div>
          </div>
          <div class="detail-section" v-if="currentDetail.remarks">
            <div class="detail-label">备注</div>
            <div class="detail-value">{{ currentDetail.remarks }}</div>
          </div>

          <div class="detail-section">
            <div class="detail-label">费用</div>
            <div class="detail-value">安装 ¥{{ formatAmount(currentDetail.installation_fee) }} · 计划 ¥{{ formatAmount(currentDetail.package_price) }}</div>
          </div>

          <div class="detail-section">
            <div class="detail-label">创建时间</div>
            <div class="detail-value">{{ formatDateTime(currentDetail.created_at) }}</div>
          </div>
          <div class="detail-section">
            <div class="detail-label">最近更新</div>
            <div class="detail-value">{{ formatDateTime(currentDetail.updated_at) }}</div>
          </div>
        </template>

        <div class="popup-actions" v-if="currentDetail && showActionEntry(currentDetail.status)">
          <van-button round block type="primary" @click="openActions(currentDetail)">
            处理预约
          </van-button>
        </div>
      </div>
    </van-popup>

    <van-action-sheet
      v-model:show="actionSheetVisible"
      :actions="availableActions"
      cancel-text="取消"
      close-on-click-action
      @select="handleActionSelect"
    />

    <van-dialog
      v-model:show="cancelDialogVisible"
      title="取消预约"
      show-cancel-button
      confirm-button-text="提交"
      @confirm="submitCancel"
    >
      <van-field
        v-model="cancelReason"
        type="textarea"
        rows="3"
        maxlength="120"
        placeholder="请输入取消原因（可选）"
        show-word-limit
      />
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showFailToast, showLoadingToast, closeToast } from 'vant'
import {
  getAdminInstallStats,
  getAdminInstallBookings,
  getAdminInstallBookingDetail,
  updateAdminInstallBookingStatus
} from '@/api/installation-admin'
import { formatDateTime } from '@/utils/date'

const props = defineProps({
  embedded: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()

const embedded = computed(() => props.embedded)

const datePresets = [
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' },
  { label: '近90天', value: '90d' }
]
const datePreset = ref('30d')

const overview = ref({
  total: 0,
  pending: 0,
  confirmed: 0,
  assigned: 0,
  completed: 0,
  cancelled: 0
})

const summaryCards = computed(() => [
  { key: 'total', label: '总预约', value: overview.value.total },
  { key: 'pending', label: '待处理', value: overview.value.pending },
  { key: 'confirmed', label: '已确认', value: overview.value.confirmed },
  { key: 'assigned', label: '已分配', value: overview.value.assigned },
  { key: 'completed', label: '已完成', value: overview.value.completed },
  { key: 'cancelled', label: '已取消', value: overview.value.cancelled }
])

const keyword = ref('')
const statusFilter = ref('')
const statusOptions = [
  { text: '全部状态', value: '' },
  { text: '待处理', value: 'pending' },
  { text: '已确认', value: 'confirmed' },
  { text: '已分配', value: 'assigned' },
  { text: '已完成', value: 'completed' },
  { text: '已取消', value: 'cancelled' }
]

const bookings = ref([])
const listLoading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  pages: 1
})

const detailVisible = ref(false)
const detailLoading = ref(false)
const currentDetail = ref(null)

const actionSheetVisible = ref(false)
const actionTarget = ref(null)
const cancelDialogVisible = ref(false)
const cancelReason = ref('')
const actionSubmitting = ref(false)

const availableActions = computed(() => {
  if (!actionTarget.value) return []
  const status = actionTarget.value.status
  const actions = []
  if (['pending'].includes(status)) {
    actions.push({ name: '标记已确认', key: 'confirmed', status: 'confirmed' })
  }
  if (['pending', 'confirmed', 'assigned'].includes(status)) {
    actions.push({ name: '标记完成', key: 'completed', status: 'completed' })
  }
  if (!['completed', 'cancelled'].includes(status)) {
    actions.push({ name: '取消预约', key: 'cancelled', status: 'cancelled', color: '#ee0a24' })
  }
  return actions
})

const dateRangeParams = computed(() => {
  const now = new Date()
  const end = formatDate(now)
  let startDate = new Date()
  const preset = datePreset.value
  if (preset === '7d') {
    startDate.setDate(startDate.getDate() - 7)
  } else if (preset === '30d') {
    startDate.setDate(startDate.getDate() - 30)
  } else if (preset === '90d') {
    startDate.setDate(startDate.getDate() - 90)
  }
  const start = formatDate(startDate)
  return { start_date: start, end_date: end }
})

const statusText = (status) => {
  const map = {
    pending: '待处理',
    confirmed: '已确认',
    assigned: '已分配',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status || '未知'
}

const statusTagType = (status) => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'confirmed':
      return 'primary'
    case 'assigned':
      return 'success'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'default'
    default:
      return 'default'
  }
}

const showActionEntry = (status) =>
  ['pending', 'confirmed', 'assigned'].includes(status || '')

const setDatePreset = (value) => {
  if (datePreset.value === value) return
  datePreset.value = value
  reloadAll()
}

const handleStatusChange = () => {
  fetchBookings({ reset: true })
}

const handleSearch = () => {
  fetchBookings({ reset: true })
}

const onRefresh = () => {
  refreshing.value = true
  fetchBookings({ reset: true })
}

const loadMore = async () => {
  if (finished.value || listLoading.value) return
  pagination.page += 1
  const ok = await fetchBookings()
  if (!ok) {
    pagination.page = Math.max(1, pagination.page - 1)
  }
}

const reloadAll = () => {
  fetchStats()
  fetchBookings({ reset: true })
}

const fetchStats = async () => {
  try {
    const params = { ...dateRangeParams.value }
    const res = await getAdminInstallStats(params)
    if (res?.code === 0) {
      const payload = res.data?.overview || res.data || {}
      overview.value = {
        total: Number(payload.total ?? payload.total_count ?? overview.value.total ?? 0),
        pending: Number(payload.pending ?? payload.pending_count ?? overview.value.pending ?? 0),
        confirmed: Number(payload.confirmed ?? payload.confirmed_count ?? overview.value.confirmed ?? 0),
        assigned: Number(payload.assigned ?? payload.assigned_count ?? overview.value.assigned ?? 0),
        completed: Number(payload.completed ?? payload.completed_count ?? overview.value.completed ?? 0),
        cancelled: Number(payload.cancelled ?? payload.cancelled_count ?? overview.value.cancelled ?? 0)
      }
    }
  } catch (error) {
    console.error('获取统计失败', error)
  }
}

const fetchBookings = async ({ reset = false } = {}) => {
  if (listLoading.value) return
  listLoading.value = true
  let success = false
  try {
    if (reset) {
      pagination.page = 1
      finished.value = false
      bookings.value = []
    }

    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...dateRangeParams.value
    }

    if (statusFilter.value) params.status = statusFilter.value
    if (keyword.value?.trim()) params.search = keyword.value.trim()

    const res = await getAdminInstallBookings(params)
    if (res?.code !== 0) {
      showFailToast(res?.message || '获取预约失败')
      return
    }

    const payload = res?.data ?? {}
    const list = Array.isArray(payload.list)
      ? payload.list
      : Array.isArray(payload.data)
        ? payload.data
        : []

    const derivedTotal = payload.total ?? list.length ?? 0
    const derivedPages = (() => {
      if (payload.pages ?? payload.last_page) {
        return payload.pages ?? payload.last_page
      }
      const base = Math.ceil((derivedTotal || 0) / pagination.limit)
      return base > 0 ? base : 1
    })()

    const paginationMeta = payload.pagination ?? {
      total: derivedTotal,
      page: payload.page ?? payload.current_page ?? pagination.page,
      limit: payload.limit ?? payload.per_page ?? pagination.limit,
      pages: derivedPages
    }

    bookings.value = reset ? list : bookings.value.concat(list)
    pagination.total = paginationMeta.total ?? bookings.value.length
    pagination.pages = paginationMeta.pages ?? paginationMeta.total_pages ?? pagination.pages

    const reachedEnd = (paginationMeta.page ?? pagination.page) >= (paginationMeta.pages ?? pagination.pages) ||
      bookings.value.length >= (pagination.total ?? bookings.value.length)
    finished.value = reachedEnd
    success = true
  } catch (error) {
    console.error('获取预约失败', error)
    showFailToast(error.message || '获取预约失败')
  } finally {
    listLoading.value = false
    refreshing.value = false
  }
  return success
}

const resolveDetailPayload = (data) => {
  if (!data) return null
  if (data.booking) {
    return data.booking
  }
  return data
}

const openDetail = async (booking) => {
  detailVisible.value = true
  detailLoading.value = true
  currentDetail.value = null
  try {
    const res = await getAdminInstallBookingDetail({ id: booking.id })
    if (res?.code === 0 && res.data) {
      currentDetail.value = resolveDetailPayload(res.data)
    } else {
      showFailToast(res?.message || '获取详情失败')
      detailVisible.value = false
    }
  } catch (error) {
    console.error('获取预约详情失败', error)
    showFailToast(error.message || '获取详情失败')
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

const openActions = (booking) => {
  actionTarget.value = booking
  actionSheetVisible.value = true
}

const handleActionSelect = (action) => {
  if (!actionTarget.value) return
  if (action.key === 'cancelled') {
    cancelReason.value = ''
    cancelDialogVisible.value = true
    actionSheetVisible.value = false
    return
  }
  submitStatus(action.status)
}

const submitCancel = () => {
  submitStatus('cancelled', { cancel_reason: cancelReason.value })
}

const submitStatus = async (status, extra = {}) => {
  if (!actionTarget.value || actionSubmitting.value) return
  actionSubmitting.value = true
  showLoadingToast({ message: '处理中', duration: 0 })
  try {
    const payload = {
      id: actionTarget.value.id,
      status,
      ...extra
    }
    const res = await updateAdminInstallBookingStatus(payload)
    if (res?.code === 0) {
      showToast('操作成功')
      actionSheetVisible.value = false
      cancelDialogVisible.value = false

      if (currentDetail.value && currentDetail.value.id === actionTarget.value.id) {
        if (res.data) {
          currentDetail.value = resolveDetailPayload(res.data)
        } else {
          await refreshCurrentDetail()
        }
      }

      reloadAll()
    } else {
      showFailToast(res?.message || '操作失败')
    }
  } catch (error) {
    console.error('更新预约状态失败', error)
    showFailToast(error.message || '操作失败')
  } finally {
    actionSubmitting.value = false
    closeToast()
  }
}

const refreshCurrentDetail = async () => {
  if (!currentDetail.value) return
  try {
    const res = await getAdminInstallBookingDetail({ id: currentDetail.value.id })
    if (res?.code === 0 && res.data) {
      currentDetail.value = resolveDetailPayload(res.data)
    }
  } catch (error) {
    console.error('刷新详情失败', error)
  }
}

const goBack = () => {
  router.push('/admin')
}

const formatCount = (value) => {
  const num = Number(value || 0)
  if (num >= 10000) return `${(num / 10000).toFixed(1)}w`
  return num
}

const formatAmount = (value) => {
  const num = Number(value || 0)
  return num.toFixed(2)
}

const formatDate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

onMounted(() => {
  reloadAll()
})

const containerClass = computed(() => ({
  'install-admin-page': true,
  embedded: embedded.value
}))
</script>

<style scoped>
.install-admin-page {
  background-color: #f5f7fb;
  min-height: 100vh;
  padding: 16px;
}

.install-admin-page.embedded {
  padding: 0 0 16px 0;
  background-color: transparent;
}

.card-shadow {
  background-color: #ffffff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.summary-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.date-tabs {
  display: flex;
  gap: 8px;
}

.date-tab {
  padding: 4px 10px;
  border-radius: 999px;
  background-color: #f1f5f9;
  font-size: 12px;
  color: #64748b;
}

.date-tab.active {
  background-color: #2563eb;
  color: #fff;
  font-weight: 600;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.summary-item {
  background: linear-gradient(135deg, #eef2ff, #eef2ff);
  border-radius: 12px;
  padding: 12px;
  text-align: left;
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  color: #1e1b4b;
}

.summary-label {
  font-size: 12px;
  color: #475569;
  margin-top: 4px;
}

.filter-row {
  margin-top: 12px;
}

.booking-list {
  min-height: 50vh;
}

.booking-card {
  border-radius: 16px;
  margin-bottom: 12px;
  padding: 16px;
}

.booking-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.booking-no {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.plan-label {
  font-size: 12px;
  color: #475569;
  margin-top: 4px;
}

.booking-card__meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #475569;
}

.meta-item {
  display: flex;
  justify-content: space-between;
}

.meta-item .label {
  color: #94a3b8;
}

.meta-item .value {
  color: #0f172a;
  text-align: right;
  flex: 1;
  margin-left: 8px;
}

.badge {
  margin-left: 6px;
  color: #16a34a;
  font-size: 12px;
}

.booking-card__footer {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #94a3b8;
}

.actions {
  display: flex;
  gap: 8px;
}

.detail-popup {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.popup-title {
  font-size: 18px;
  font-weight: 600;
}

.popup-subtitle {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.detail-section {
  margin-bottom: 12px;
}

.detail-label {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 14px;
  color: #0f172a;
  word-break: break-word;
}

.popup-actions {
  margin-top: auto;
  padding-top: 12px;
}
</style>
