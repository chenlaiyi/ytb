<template>
  <div class="merchant-onboarding-list">
    <section class="filter-bar">
      <div class="filter-card" @click="calendarVisible = true">
        <div class="filter-card__icon">
          <van-icon name="clock-o" />
        </div>
        <div class="filter-card__content">
          <span class="filter-card__label">选择日期</span>
          <span :class="['filter-card__value', { placeholder: !selectedDate }]">{{ dateDisplay }}</span>
        </div>
        <van-icon
          v-if="selectedDate"
          name="cross"
          class="filter-card__clear"
          @click.stop="resetDate"
        />
        <van-icon name="arrow" class="filter-card__arrow" />
      </div>

      <div class="filter-card" @click="statusSheetVisible = true">
        <div class="filter-card__icon">
          <van-icon name="manager-o" />
        </div>
        <div class="filter-card__content">
          <span class="filter-card__label">审核状态</span>
          <span :class="['filter-card__value', { placeholder: !hasStatusFilter }]">{{ statusDisplay }}</span>
        </div>
        <van-icon
          v-if="hasStatusFilter"
          name="cross"
          class="filter-card__clear"
          @click.stop="resetStatus"
        />
        <van-icon name="arrow" class="filter-card__arrow" />
      </div>
    </section>

    <van-calendar
      v-model:show="calendarVisible"
      title="选择日期"
      :min-date="minDate"
      :max-date="maxDate"
      color="#ff4d4f"
      @confirm="handleDateConfirm"
    />

    <van-action-sheet
      v-model:show="statusSheetVisible"
      :actions="statusOptions"
      cancel-text="取消"
      close-on-click-action
      @select="onStatusSelect"
    />

    <div v-if="loading" class="state-block">
      <van-loading type="spinner" size="24" />
      <span>加载进件记录...</span>
    </div>

    <div v-else-if="filteredRecords.length === 0" class="state-block">
      <van-empty description="暂无进件记录" />
      <van-button type="primary" round size="small" @click="goToOnboarding">
        去进件
      </van-button>
    </div>

    <div v-else class="record-list">
      <div
        v-for="record in filteredRecords"
        :key="record.id || record.onboarding_id || record.merchant_id || record.apply_id"
        class="record-card"
        @click="openDetail(record)"
      >
        <div class="record-card__header">
          <div class="record-card__time">
            <van-icon name="clock-o" class="record-card__time-icon" />
            {{ formatDateTime(record.submitted_at || record.created_at || record.createdAt) }}
          </div>
          <span :class="['record-card__status', getStatusMeta(record).className]">
            {{ getStatusMeta(record).label }}
          </span>
        </div>
        <div class="record-card__body">
          <div class="record-card__name">
            {{ record.company_name || record.merchant_name || record.store_name || '未命名商户' }}
          </div>
          <div class="record-card__meta">
            <span class="record-card__meta-id">
              {{ record.social_credit_code || record.registration_no || record.license_no || '—' }}
            </span>
            <span :class="['record-card__type', getTypeMeta(record).className]">
              {{ getTypeMeta(record).label }}
            </span>
          </div>
        </div>
        <van-icon name="arrow" class="record-card__arrow" />
      </div>
      <div v-if="finished && filteredRecords.length > 0" class="record-list__end">没有更多数据了</div>
    </div>

    <div class="merchant-onboarding-list__footer">
      <van-button type="primary" block round size="large" @click="goToOnboarding">
        去进件
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getMerchantOnboardingRecords } from '@/api/merchant'

const router = useRouter()

const calendarVisible = ref(false)
const selectedDate = ref('')
const onboardingRecords = ref([])
const loading = ref(false)
const finished = ref(false)
const statusSheetVisible = ref(false)

const minDate = dayjs().subtract(2, 'year').startOf('year').toDate()
const maxDate = new Date()

const dateDisplay = computed(() => (selectedDate.value ? selectedDate.value : '请选择'))
const statusOptions = [
  { name: '全部状态', value: null },
  { name: '审核中', value: '审核中' },
  { name: '已通过', value: '已通过' },
  { name: '已驳回', value: '已驳回' },
  { name: '需再次审核', value: '需再次审核' },
  { name: '已冻结', value: '已冻结' },
  { name: '已注销', value: '已注销' }
]

const selectedStatus = ref(statusOptions[0])
const statusDisplay = computed(() => selectedStatus.value?.name ?? '请选择')
const hasStatusFilter = computed(() => selectedStatus.value?.value !== null && selectedStatus.value?.value !== undefined)

const STATUS_META = [
  { keys: ['approved', 'success', 'passed'], label: '已通过', className: 'status-success' },
  { keys: ['pending', 'review', 'checking', 'submitted'], label: '审核中', className: 'status-pending' },
  { keys: ['recheck', 'review_again', 'need_review'], label: '需再次审核', className: 'status-warning' },
  { keys: ['frozen', 'freeze'], label: '已冻结', className: 'status-default' },
  { keys: ['cancel', 'cancelled', 'cancelled_account'], label: '已注销', className: 'status-muted' },
  { keys: ['unreviewed', 'not_reviewed'], label: '未审核', className: 'status-primary' },
  { keys: ['rejected', 'failed', 'deny'], label: '已驳回', className: 'status-danger' }
]

const STATUS_LABEL_META = {
  已通过: { label: '已通过', className: 'status-success' },
  审核中: { label: '审核中', className: 'status-pending' },
  处理中: { label: '审核中', className: 'status-pending' },
  未审核: { label: '未审核', className: 'status-primary' },
  待提交: { label: '待提交', className: 'status-default' },
  已驳回: { label: '已驳回', className: 'status-danger' },
  已拒绝: { label: '已驳回', className: 'status-danger' },
  需再次审核: { label: '需再次审核', className: 'status-warning' },
  已冻结: { label: '已冻结', className: 'status-default' },
  已注销: { label: '已注销', className: 'status-muted' }
}

const TYPE_META = [
  { keys: ['enterprise', 'company'], label: '企业', className: 'type-enterprise' },
  { keys: ['individual', 'sole'], label: '个体', className: 'type-individual' },
  { keys: ['micro', 'store'], label: '门店', className: 'type-store' },
  { keys: ['personal'], label: '个人', className: 'type-individual' }
]

const TYPE_LABEL_META = {
  企业: { label: '企业', className: 'type-enterprise' },
  个体: { label: '个体', className: 'type-individual' },
  门店: { label: '门店', className: 'type-store' },
  小微: { label: '小微', className: 'type-micro' },
  小微商户: { label: '小微商户', className: 'type-micro' }
}

const fetchRecords = async () => {
  loading.value = true
  finished.value = false
  try {
    const params = {}
    if (selectedDate.value) {
      params.date = selectedDate.value
    }
    const res = await getMerchantOnboardingRecords(params)
    const list =
      res?.data?.items ??
      res?.data?.list ??
      (Array.isArray(res?.data) ? res.data : []) ??
      []

    onboardingRecords.value = Array.isArray(list) ? list : []
    finished.value = true
  } catch (error) {
    onboardingRecords.value = []
    finished.value = true
    if (import.meta.env.MODE !== 'production') {
      console.error('获取进件记录失败', error)
    }
    showToast(error?.message || '获取进件记录失败')
  } finally {
    loading.value = false
  }
}

const formatDateTime = (value) => {
  if (!value) return '未知时间'
  const formatted = dayjs(value)
  if (!formatted.isValid()) return value
  return formatted.format('YYYY-MM-DD HH:mm:ss')
}

const resolveMetaByKeys = (value, metaList) => {
  const normalized = String(value || '').toLowerCase()
  if (normalized) {
    const matched = metaList.find((meta) => meta.keys.some((key) => key === normalized))
    if (matched) {
      return { label: matched.label, className: matched.className }
    }
  }
  return null
}

const getStatusMeta = (record) => {
  const rawLabel = record.status_label || record.statusText || record.status_text
  if (rawLabel && STATUS_LABEL_META[rawLabel]) {
    return STATUS_LABEL_META[rawLabel]
  }

  const meta = resolveMetaByKeys(record.status, STATUS_META)
  if (meta) return meta

  if (rawLabel) {
    return { label: rawLabel, className: 'status-default' }
  }

  return { label: '未审核', className: 'status-primary' }
}

const getTypeMeta = (record) => {
  const rawLabel = record.merchant_type_label || record.merchantTypeLabel || record.type_label
  if (rawLabel && TYPE_LABEL_META[rawLabel]) {
    return TYPE_LABEL_META[rawLabel]
  }

  const meta = resolveMetaByKeys(record.merchant_type || record.type, TYPE_META)
  if (meta) return meta

  if (rawLabel) {
    return { label: rawLabel, className: 'type-default' }
  }

  return { label: '商户', className: 'type-default' }
}

const handleDateConfirm = (date) => {
  calendarVisible.value = false
  selectedDate.value = dayjs(date).format('YYYY-MM-DD')
  fetchRecords()
}

const resetDate = () => {
  selectedDate.value = ''
  fetchRecords()
}

const onStatusSelect = (action) => {
  selectedStatus.value = action
  statusSheetVisible.value = false
}

const resetStatus = () => {
  selectedStatus.value = statusOptions[0]
  statusSheetVisible.value = false
}

const filteredRecords = computed(() => {
  const targetLabel = selectedStatus.value?.value
  if (!targetLabel) {
    return onboardingRecords.value
  }
  return onboardingRecords.value.filter((record) => getStatusMeta(record).label === targetLabel)
})

const goToOnboarding = () => {
  if (router.hasRoute('MerchantOnboarding')) {
    router.push({ name: 'MerchantOnboarding' }).catch(() => {})
    return
  }
  router.push('/merchant/onboarding').catch(() => {})
}

const openDetail = (record) => {
  const id =
    record.id ||
    record.onboarding_id ||
    record.apply_id ||
    record.merchant_id

  if (!id) {
    showToast('无法查看详情：缺少进件ID')
    return
  }

  router.push({
    name: 'MerchantOnboardingDetail',
    params: { id: String(id) }
  })
}

onMounted(() => {
  fetchRecords()
})
</script>

<style scoped>
.merchant-onboarding-list {
  min-height: 100vh;
  background-color: #f6f7fb;
  padding: calc(env(safe-area-inset-top, 0px) + 16px) 16px 80px;
  box-sizing: border-box;
  color: #1f2d3d;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.filter-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(250, 252, 255, 0.95));
  box-shadow: 0 12px 28px rgba(82, 118, 255, 0.12);
  border: 1px solid rgba(117, 135, 255, 0.08);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.filter-card:active {
  transform: translateY(1px);
  box-shadow: 0 8px 18px rgba(82, 118, 255, 0.1);
}

.filter-card__icon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(93, 110, 255, 0.18), rgba(143, 160, 255, 0.12));
  color: #526aff;
  flex-shrink: 0;
}

.filter-card__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.filter-card__label {
  font-size: 12px;
  color: #7d7e80;
}

.filter-card__value {
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filter-card__value.placeholder {
  font-weight: 500;
  color: #b2b6bf;
}

.filter-card__clear {
  font-size: 16px;
  color: #c6c8d4;
  margin-right: 8px;
}

.filter-card__arrow {
  color: #c6c8d4;
  flex-shrink: 0;
}

@media (max-width: 360px) {
  .filter-bar {
    flex-direction: column;
  }

  .filter-card {
    width: 100%;
  }
}

.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #7d7e80;
  min-height: 300px;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-card {
  position: relative;
  background-color: #ffffff;
  border-radius: 16px;
  padding: 18px 20px;
  box-shadow: 0 8px 22px rgba(79, 130, 255, 0.12);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.record-card:active {
  transform: scale(0.98);
  box-shadow: 0 6px 16px rgba(79, 130, 255, 0.08);
}

.record-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.record-card__time {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #7d7e80;
}

.record-card__time-icon {
  margin-right: 6px;
}

.record-card__status {
  font-size: 13px;
  font-weight: 600;
}

.record-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-card__name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
  line-height: 1.4;
}

.record-card__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-card__meta-id {
  font-size: 12px;
  color: #7d7e80;
}

.record-card__type {
  font-size: 13px;
  font-weight: 600;
}

.record-card__arrow {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #c8cad2;
}

.record-list__end {
  text-align: center;
  color: #9a9ca3;
  font-size: 12px;
  padding: 8px 0 20px;
}

.merchant-onboarding-list__footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px);
  background: linear-gradient(180deg, rgba(246, 247, 251, 0.1) 0%, #f6f7fb 60%, #f6f7fb 100%);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.04);
}

.merchant-onboarding-list__footer .van-button {
  font-size: 16px;
  height: 48px;
  background: linear-gradient(135deg, #ff5f52 0%, #ff2d55 100%);
  border: none;
}

.status-success {
  color: #19b27d;
}

.status-pending {
  color: #ff8c1a;
}

.status-primary {
  color: #3478f6;
}

.status-warning {
  color: #ffb020;
}

.status-danger {
  color: #ff4d4f;
}

.status-default {
  color: #7d7e80;
}

.status-muted {
  color: #a0a4ab;
}

.type-enterprise {
  color: #ff4d4f;
}

.type-individual {
  color: #3478f6;
}

.type-store {
  color: #ff8c1a;
}

.type-micro {
  color: #7f5cff;
}

.type-default {
  color: #7d7e80;
}
</style>
