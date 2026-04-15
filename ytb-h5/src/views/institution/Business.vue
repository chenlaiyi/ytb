<template>
  <div class="institution-business">
    <van-nav-bar
      fixed
      placeholder
      safe-area-inset-top
      title="展业中心"
      left-arrow
      @click-left="handleBack"
    />

    <section class="filter-bar" :style="filterStickyStyle">
      <div class="filter-bar__types">
        <button
          v-for="type in typeOptions"
          :key="type.value"
          type="button"
          class="type-chip"
          :class="{ 'type-chip--active': activeType === type.value }"
          @click="setType(type.value)"
        >
          <span class="type-chip__label">{{ type.label }}</span>
          <span class="type-chip__count">{{ typeBadge(type.value) }}</span>
        </button>
      </div>
      <div class="filter-bar__statuses">
        <button
          v-for="status in statusOptions"
          :key="status.value"
          type="button"
          class="status-chip"
          :class="{ 'status-chip--active': listState.status === status.value }"
          @click="changeStatus(status.value)"
        >
          {{ status.label }}
          <span class="status-chip__count">{{ getStatusCount(status.value) }}</span>
        </button>
        <button type="button" class="status-action" @click="refreshList">
          <van-icon name="replay" />
        </button>
      </div>
    </section>

    <section class="invite-list-section" ref="listSectionRef">
      <van-pull-refresh v-model="listState.refreshing" @refresh="refreshList">
        <div class="invite-list">
          <div v-if="listState.error" class="error-placeholder">
            <van-icon name="warning-o" class="error-placeholder__icon" />
            <p class="error-placeholder__message">{{ listState.error }}</p>
            <van-button size="small" type="primary" plain @click="retryLoadInvites">
              重新加载
            </van-button>
          </div>

          <div v-else-if="isEmptyState" class="empty-placeholder">
            <van-empty
              description="暂无邀请码"
              image="https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png"
            />
          </div>

          <div v-else>
            <div v-if="isInitialLoading" class="list-loading">
              <van-loading size="24" type="spinner" />
              <span>加载中，请稍候...</span>
            </div>

            <article v-for="item in items" :key="item.id" class="invite-card">
              <header class="invite-card__header">
                <div class="invite-card__code">
                  <span>{{ item.code }}</span>
                  <van-tag :type="statusTagType(item.status)" round size="small">
                    {{ statusDisplay(item.status) }}
                  </van-tag>
                </div>
                <div class="invite-card__meta">
                  <span>生成时间 {{ formatDateTime(item.created_at) }}</span>
                  <span v-if="item.status === 'used' && item.used_by_institution">
                    已绑定 {{ item.used_by_institution.name }}
                  </span>
                </div>
              </header>
              <div class="invite-card__actions">
                <van-button
                  size="small"
                  round
                  plain
                  icon="qr"
                  @click="openQrDialog(item)"
                >
                  二维码
                </van-button>
                <van-button
                  size="small"
                  round
                  plain
                  icon="share-o"
                  @click="shareInvite(item)"
                >
                  分享
                </van-button>
                <van-button
                  size="small"
                  round
                  type="primary"
                  icon="records"
                  @click="copyInviteCode(item.code)"
                >
                  复制邀请码
                </van-button>
              </div>
            </article>

            <div v-if="listState.loading && items.length" class="list-loading list-loading--inline">
              <van-loading size="20" type="spinner" />
              <span>正在更新数据...</span>
            </div>
          </div>
        </div>
      </van-pull-refresh>

      <div v-if="shouldShowPagination" class="pagination-container">
        <van-pagination
          v-model="listState.page"
          :page-count="listState.lastPage"
          :total-items="listState.total"
          :items-per-page="listState.perPage"
          mode="simple"
          prev-text="上一页"
          next-text="下一页"
          @change="handlePageChange"
        />
        <div class="pagination-summary">
          第 {{ listState.page }} / {{ listState.lastPage }} 页 · 共 {{ listState.total }} 条邀请码
        </div>
      </div>
    </section>

    <van-popup
      v-model:show="qrDialog.show"
      round
      position="bottom"
      :style="{ height: '70vh' }"
    >
      <div class="qr-dialog">
        <div class="qr-dialog__title">扫码加入</div>
        <div class="qr-dialog__subtitle">{{ qrDialog.subtitle }}</div>
        <div class="qr-dialog__image">
          <img v-if="qrDialog.qrUrl" :src="qrDialog.qrUrl" alt="邀请码二维码" />
          <van-loading v-else size="24" type="spinner" />
        </div>
        <div class="qr-dialog__code">
          邀请码：<strong>{{ qrDialog.code }}</strong>
        </div>
        <div class="qr-dialog__actions">
          <van-button round type="primary" block icon="down" @click="downloadQr">
            保存二维码
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Dialog, showFailToast, showSuccessToast, showToast } from 'vant'
import QRCode from 'qrcode'
import { getInstitutionInviteOverview, getInstitutionInvites } from '@/api/institution'
import { formatDateTime } from '@/utils/date'

const router = useRouter()

const FILTER_STICKY_OFFSET = 56
const typeOptions = [
  { value: 'partner', label: '合伙人', icon: 'friends-o' },
  { value: 'salesman', label: '销售经理', icon: 'manager-o' }
]

const statusOptions = [
  { value: 'available', label: '未使用' },
  { value: 'used', label: '已使用' },
  { value: 'revoked', label: '已失效' }
]

const overview = ref({
  institution: {
    id: null,
    name: '',
    number: '',
    role: 0,
    role_text: ''
  },
  types: {
    partner: { total: 0, available: 0, used: 0, revoked: 0, baseline: 0, purchased: 0 },
    salesman: { total: 0, available: 0, used: 0, revoked: 0, baseline: 0, purchased: 0 }
  }
})

const activeType = ref('partner')
const listSectionRef = ref(null)

const INVITES_PER_PAGE = 5

const listState = reactive({
  items: [],
  page: 1,
  perPage: INVITES_PER_PAGE,
  total: 0,
  lastPage: 1,
  loading: false,
  refreshing: false,
  status: 'available',
  stats: {},
  error: ''
})

const qrDialog = reactive({
  show: false,
  qrUrl: '',
  code: '',
  subtitle: '',
  downloading: false
})

const items = computed(() => listState.items)
const shouldShowPagination = computed(() => listState.lastPage > 1)
const isEmptyState = computed(() => !listState.loading && !listState.error && items.value.length === 0)
const isInitialLoading = computed(
  () => listState.loading && !listState.refreshing && items.value.length === 0
)

const filterStickyStyle = computed(() => ({
  top: `calc(var(--van-safe-area-top, 0px) + ${FILTER_STICKY_OFFSET}px)`
}))

const typeStats = computed(() => {
  const types = overview.value.types || {}
  const fallback = (value) => (Number.isFinite(value) ? value : 0)
  return {
    partner: {
      available: fallback(types.partner?.available),
      total:
        fallback(types.partner?.total) ||
        fallback(types.partner?.available) + fallback(types.partner?.used) + fallback(types.partner?.revoked)
    },
    salesman: {
      available: fallback(types.salesman?.available),
      total:
        fallback(types.salesman?.total) ||
        fallback(types.salesman?.available) + fallback(types.salesman?.used) + fallback(types.salesman?.revoked)
    }
  }
})

function typeBadge(type) {
  const meta = typeStats.value[type]
  if (!meta) return '—'
  return `剩余 ${meta.available} / 总 ${meta.total}`
}


function statusDisplay(status) {
  switch (status) {
    case 'available':
      return '未使用'
    case 'used':
      return '已使用'
    case 'revoked':
      return '已失效'
    default:
      return status
  }
}

function statusTagType(status) {
  switch (status) {
    case 'available':
      return 'success'
    case 'revoked':
      return 'danger'
    default:
      return 'primary'
  }
}

function handleBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.replace({ name: 'Institution' })
}

function getStatusCount(status) {
  const statsByType = listState.stats[activeType.value] || {}
  return statsByType[status] ?? 0
}

function scrollToListTop() {
  if (!listSectionRef.value) return
  const rect = listSectionRef.value.getBoundingClientRect()
  const targetTop = window.scrollY + rect.top - FILTER_STICKY_OFFSET - 12
  window.scrollTo({
    top: targetTop > 0 ? targetTop : 0,
    behavior: 'smooth'
  })
}

function changeStatus(status) {
  if (listState.status === status) return
  listState.status = status
  resetList()
  loadInvites()
}

function setType(type) {
  if (activeType.value === type) return
  activeType.value = type
  listState.status = 'available'
  resetList()
  loadInvites({ scrollToTop: true })
}

function resetList({ keepPage = false } = {}) {
  if (!keepPage) {
    listState.page = 1
  }
  listState.items = []
  listState.total = 0
  listState.lastPage = 1
  listState.error = ''
}

function refreshList() {
  listState.refreshing = true
  resetList({ keepPage: true })
  loadInvites()
}

function handlePageChange(page) {
  if (page === listState.page) {
    loadInvites({ scrollToTop: true })
    return
  }
  listState.page = page
  loadInvites({ scrollToTop: true })
}

function retryLoadInvites() {
  listState.error = ''
  loadInvites()
}

async function loadOverview() {
  try {
    const res = await getInstitutionInviteOverview()
    if (res?.code === 0 && res.data) {
      overview.value = res.data
      const partnerInvites = res.data.types?.partner?.total ?? 0
      const salesmanInvites = res.data.types?.salesman?.total ?? 0
      if (partnerInvites === 0 && salesmanInvites > 0) {
        activeType.value = 'salesman'
      }
    } else if (res) {
      showFailToast(res.message || '获取展业数据失败')
    }
  } catch (error) {
    console.error('loadOverview failed', error)
    showFailToast(error?.message || '获取展业数据失败')
  }
}

async function loadInvites({ scrollToTop = false } = {}) {
  listState.loading = true
  listState.error = ''
  try {
    const res = await getInstitutionInvites({
      type: activeType.value,
      status: listState.status,
      page: listState.page,
      per_page: listState.perPage
    })
    if (res?.code === 0 && res.data) {
      const incoming = Array.isArray(res.data.items) ? res.data.items : []
      listState.items = incoming

      const pagination = res.data.pagination || {}
      const currentPage = Number(pagination.page ?? listState.page)
      const lastPage = Number(pagination.last_page ?? currentPage)
      const perPage = Number(pagination.per_page ?? listState.perPage)
      const total = Number(pagination.total ?? incoming.length ?? 0)

      listState.page = Number.isFinite(currentPage) ? currentPage : listState.page
      listState.perPage = Number.isFinite(perPage) && perPage > 0 ? perPage : listState.perPage
      listState.total = Number.isFinite(total) ? total : incoming.length
      listState.lastPage = Number.isFinite(lastPage) && lastPage > 0 ? lastPage : 1

      if (res.data.stats && typeof res.data.stats === 'object') {
        listState.stats = res.data.stats
      }
      if (res.data.summary) {
        overview.value = res.data.summary
      }

      if (scrollToTop && listState.page > 1 && !listState.refreshing) {
        await nextTick()
        scrollToListTop()
      }
    } else if (res) {
      const message = res.message || '获取邀请码失败'
      listState.error = message
      showFailToast(message)
    }
  } catch (error) {
    console.error('loadInvites failed', error)
    const message = error?.message || '获取邀请码失败'
    listState.error = message
    showFailToast(message)
  } finally {
    listState.loading = false
    listState.refreshing = false
  }
}

function buildShareLink(code) {
  const base = window.location.origin || 'https://pay.itapgo.com'
  const channel = activeType.value === 'partner' ? 'partner' : 'salesman'
  return `${base}/app/#/institution/invite-register?type=${channel}&invite_code=${encodeURIComponent(code)}`
}

async function openQrDialog(item) {
  if (!item?.code) return
  qrDialog.show = true
  qrDialog.code = item.code
  qrDialog.subtitle = activeType.value === 'partner' ? '邀请合伙人扫码加入' : '邀请销售经理扫码加入'
  qrDialog.qrUrl = ''
  try {
    const url = buildShareLink(item.code)
    qrDialog.qrUrl = await QRCode.toDataURL(url, {
      width: 360,
      margin: 1,
      color: {
        dark: '#0f296b',
        light: '#ffffff'
      }
    })
  } catch (error) {
    console.error('generate qr failed', error)
    showFailToast('生成二维码失败')
  }
}

async function downloadQr() {
  if (!qrDialog.qrUrl) {
    showFailToast('二维码生成中，请稍后重试')
    return
  }
  const link = document.createElement('a')
  link.href = qrDialog.qrUrl
  link.download = `${qrDialog.code || 'invite'}-qrcode.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  showToast('二维码已保存')
}

async function copyInviteCode(code) {
  if (!code) return
  try {
    await navigator.clipboard.writeText(code)
    showSuccessToast('邀请码已复制')
  } catch (error) {
    console.warn('copy invite code failed', error)
    showFailToast('复制失败，请手动复制')
  }
}

async function shareInvite(item) {
  if (!item?.code) {
    return
  }
  const shareUrl = buildShareLink(item.code)
  const shareTitle =
    activeType.value === 'partner'
      ? '点点够运营中心合伙人招募'
      : '点点够销售经理招募'
  const shareText =
    activeType.value === 'partner'
      ? '扫码注册成为点点够合伙人，锁定优先开城权益。'
      : '加入点点够销售团队，享受专业培训与多元收益。'

  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      })
      return
    } catch (error) {
      console.info('navigator.share failed', error)
    }
  }

  try {
    await navigator.clipboard.writeText(shareUrl)
    showSuccessToast('链接已复制，可粘贴到聊天窗口')
  } catch (error) {
    console.warn('copy share link failed', error)
    Dialog.alert({
      title: '分享链接',
      message: shareUrl
    })
  }
}

onMounted(async () => {
  await loadOverview()
  await loadInvites()
})

watch(
  () => overview.value,
  (next) => {
    if (!next?.types) return
    listState.stats = Object.assign({}, listState.stats, {
      partner: {
        available: next.types.partner?.available ?? 0,
        used: next.types.partner?.used ?? 0,
        revoked: next.types.partner?.revoked ?? 0
      },
      salesman: {
        available: next.types.salesman?.available ?? 0,
        used: next.types.salesman?.used ?? 0,
        revoked: next.types.salesman?.revoked ?? 0
      }
    })
  },
  { deep: true }
)
</script>

<style scoped>
.institution-business {
  min-height: 100vh;
  background: linear-gradient(180deg, #f7f8fc 0%, #ffffff 18%, #f7f8fc 100%);
}


.filter-bar {
  position: sticky;
  z-index: 9;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 12px;
  background: rgba(247, 248, 252, 0.96);
  border-bottom: 1px solid rgba(31, 47, 77, 0.06);
  backdrop-filter: blur(6px);
}

.filter-bar__types {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.type-chip {
  border: none;
  border-radius: 14px;
  padding: 10px 12px;
  background: rgba(26, 104, 255, 0.08);
  color: #1f2f4d;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  transition: all 0.2s ease;
}

.type-chip__label {
  flex: 1;
  text-align: left;
}

.type-chip__count {
  font-size: 11px;
  font-weight: 500;
  color: rgba(31, 47, 77, 0.65);
}

.type-chip--active {
  background: linear-gradient(135deg, #1a68ff 0%, #4c8dff 100%);
  color: #ffffff;
  box-shadow: 0 10px 20px rgba(26, 104, 255, 0.18);
}

.type-chip--active .type-chip__count {
  color: rgba(255, 255, 255, 0.85);
}

.filter-bar__statuses {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) 44px;
  gap: 10px;
  align-items: center;
}

.status-chip {
  border: 1px solid rgba(26, 104, 255, 0.2);
  border-radius: 12px;
  padding: 8px 10px;
  background: #fff;
  color: #1f2f4d;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.status-chip--active {
  background: linear-gradient(135deg, #1a68ff 0%, #4c8dff 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 10px 20px rgba(26, 104, 255, 0.18);
}

.status-chip__count {
  font-size: 11px;
  opacity: 0.8;
}

.status-action {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 1px solid rgba(26, 104, 255, 0.2);
  background: rgba(26, 104, 255, 0.08);
  color: #1a68ff;
}

.invite-list-section {
  padding-bottom: 16px;
}

.type-nav {
  padding: 0 12px;
  background: #f7f8fc;
  border-bottom: 1px solid rgba(31, 47, 77, 0.06);
}

.type-nav ::v-deep(.van-tabs__line) {
  display: none;
}

.type-tab {
  min-width: 0;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(26, 104, 255, 0.08);
  color: #1f2f4d;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.type-tab__count {
  font-size: 11px;
  font-weight: 500;
  color: rgba(31, 47, 77, 0.7);
}

.type-tab--active {
  background: linear-gradient(135deg, #1a68ff 0%, #4c8dff 100%);
  color: #ffffff;
  box-shadow: 0 10px 20px rgba(26, 104, 255, 0.2);
}

.type-tab--active .type-tab__count {
  color: rgba(255, 255, 255, 0.85);
}

.invite-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
}

.invite-card {
  margin: 0 16px;
  padding: 18px;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 16px 32px rgba(17, 42, 90, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invite-card__header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.invite-card__code {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 18px;
  font-weight: 600;
  color: #142552;
}

.invite-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: #5f6d92;
  font-size: 12px;
}

.invite-card__actions {
  display: flex;
  gap: 10px;
}

.empty-placeholder {
  padding: 48px 0;
}

.error-placeholder {
  margin: 48px 16px 24px;
  padding: 20px 16px;
  border-radius: 16px;
  background: rgba(255, 86, 48, 0.08);
  color: #ff5630;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.error-placeholder__icon {
  font-size: 28px;
}

.error-placeholder__message {
  font-size: 14px;
  line-height: 1.5;
}

.list-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 0 24px;
  color: #5f6d92;
  font-size: 13px;
}

.list-loading--inline {
  padding: 16px 0 8px;
}

.pagination-container {
  padding: 12px 16px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.pagination-summary {
  font-size: 12px;
  color: #5f6d92;
}

.pagination-container ::v-deep(.van-pagination) {
  width: 100%;
}

.qr-dialog {
  padding: 24px;
  text-align: center;
}

.qr-dialog__title {
  font-size: 18px;
  font-weight: 600;
  color: #142552;
}

.qr-dialog__subtitle {
  margin-top: 8px;
  color: #5b6c94;
  font-size: 13px;
}

.qr-dialog__image {
  margin: 24px auto 20px;
  width: 240px;
  height: 240px;
  border-radius: 24px;
  background: #f3f5fb;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(26, 104, 255, 0.12);
}

.qr-dialog__image img {
  width: 200px;
  height: 200px;
}

.qr-dialog__code {
  font-size: 14px;
  color: #142552;
  margin-bottom: 16px;
}

.qr-dialog__actions {
  margin-top: 12px;
}

@media (min-width: 768px) {
  .invite-list {
    max-width: 720px;
    margin: 0 auto;
  }

  .invite-card {
    margin: 0;
  }
}

</style>
