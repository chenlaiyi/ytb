<template>
  <div class="wallet-container">
    <NavBar
      title="我的钱包"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />

    <div class="wallet-content">
      <Skeleton :loading="skeletonLoading" title :row="4">
        <section class="balance-card">
          <div class="balance-header">
            <div class="balance-header__info">
              <p class="balance-label">账户余额(元)</p>
              <p class="balance-amount">{{ balanceDisplay }}</p>
            </div>
            <div class="balance-actions">
              <Button round size="small" type="primary" @click="openWithdrawPopup">提现</Button>
            </div>
          </div>
          <div class="balance-metrics">
            <div class="metric-item">
              <span class="metric-label">可用余额</span>
              <span class="metric-value">¥{{ availableBalanceDisplay }}</span>
            </div>
            <div class="metric-divider" />
            <div class="metric-item">
              <span class="metric-label">冻结金额</span>
              <span class="metric-value">¥{{ frozenBalanceDisplay }}</span>
            </div>
          </div>
        </section>

        <section class="stat-grid">
          <div
            v-for="statCard in statCards"
            :key="statCard.label"
            class="stat-card"
            :class="statCard.type"
          >
            <p class="stat-label">{{ statCard.label }}</p>
            <p class="stat-value">{{ statCard.value }}</p>
            <span class="stat-extra">{{ statCard.extra }}</span>
          </div>
        </section>
      </Skeleton>

      <section class="transaction-panel">
        <div class="panel-header">
          <div class="panel-title-group">
            <p class="panel-title">交易记录</p>
            <p class="panel-subtitle">共 {{ totalRecordsDisplay }} 笔 · 最近更新 {{ lastTransactionDisplay }}</p>
          </div>
          <Tabs v-model:active="activeTab" @click-tab="onTabChange" shrink>
            <Tab title="全部" name="all" />
            <Tab title="收入" name="income" />
            <Tab title="支出" name="expense" />
          </Tabs>
        </div>

        <PullRefresh v-model="refreshing" @refresh="onRefresh">
          <div class="transaction-list">
            <div v-if="listLoading" class="transaction-loading">
              <Icon name="replay" size="18" />
              <span>正在加载...</span>
            </div>
            <template v-else>
              <div
                v-for="item in transactionList"
                :key="item.id"
                class="transaction-item"
              >
                <div class="transaction-icon" :class="getAmountClass(item)">
                  <img v-if="shouldUseImageIcon(item)" :src="getTransactionIconImage(item)" alt="icon" />
                  <Icon v-else :name="getTransactionIcon(item)" size="22" />
                </div>
                <div class="transaction-body">
                  <div class="transaction-row">
                    <span class="transaction-type">{{ getTransactionLabel(item) }}</span>
                    <span class="transaction-amount" :class="getAmountClass(item)">
                      {{ item.amount_display }}
                    </span>
                  </div>
                  <div class="transaction-row meta">
                    <span class="transaction-desc">{{ getTransactionDescription(item) }}</span>
                    <Tag v-if="getTransactionTag(item)" plain type="primary" size="small">
                      {{ getTransactionTag(item) }}
                    </Tag>
                  </div>
                  <div class="transaction-date">{{ formatTransactionDate(item) }}</div>
                </div>
              </div>

              <div v-if="transactionList.length === 0" class="empty-state">
                <Icon name="cash-back-record" size="48" />
                <p>暂无交易记录</p>
              </div>
            </template>
          </div>
        </PullRefresh>
        <Pagination
          v-if="paginationMeta.last_page > 1"
          v-model="currentPage"
          :total-items="paginationMeta.total"
          :items-per-page="perPage"
          :page-count="paginationMeta.last_page"
          mode="simple"
          class="transaction-pagination"
          @change="handlePageChange"
        />
      </section>
    </div>

    <Popup
      v-model:show="showWithdrawPopup"
      round
      position="bottom"
      closeable
      class="withdraw-popup"
    >
      <div class="withdraw-popup__header">
        <div class="withdraw-popup__title">提现至支付宝</div>
        <p class="withdraw-popup__desc">平台将收取 8% 税费，预计 1-3 个工作日到账</p>
      </div>

      <div v-if="!isAlipayBound" class="withdraw-empty">
        <Icon name="alipay" size="42" />
        <p>您还未绑定支付宝账号</p>
        <Button type="primary" round block @click="goBindAlipay">
          去绑定支付宝
        </Button>
      </div>

      <template v-else>
        <div class="alipay-account-card">
          <img :src="alipayProfile.avatar || defaultAvatar" alt="支付宝头像" />
          <div>
            <p class="name">{{ alipayProfile.nickname }}</p>
            <p class="account">{{ maskedAlipayAccount }}</p>
          </div>
          <Button size="mini" type="primary" plain round @click="goBindAlipay">更换</Button>
        </div>

        <Field
          v-model="withdrawForm.amount"
          type="number"
          label="提现金额"
          placeholder="请输入提现金额"
          maxlength="10"
          autocomplete="off"
          @update:model-value="onAmountChange"
        />
        <div class="withdraw-all">
          <span>最高可提 ¥{{ availableBalanceDisplay }}</span>
          <Button size="small" type="primary" plain round @click="withdrawAll">全部提现</Button>
        </div>

        <div class="withdraw-popup__info">
          <p>
            <span>可用余额</span>
            <span>¥{{ availableBalanceDisplay }}</span>
          </p>
          <p>
            <span>税费 (8%)</span>
            <span>¥{{ taxAmountDisplay }}</span>
          </p>
          <p>
            <span>预计到账</span>
            <span>¥{{ netAmountDisplay }}</span>
          </p>
        </div>

        <Button
          type="primary"
          block
          round
          class="withdraw-popup__submit"
          :loading="withdrawSubmitting"
          @click="submitWithdraw"
        >
          提交提现申请
        </Button>
      </template>
    </Popup>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import { Button, Field, Icon, NavBar, Pagination, Popup, PullRefresh, Skeleton, Tab, Tabs, Tag, showToast, showFailToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { applyWithdraw, getUserWalletSummary, getUserWalletTransactions } from '@/api/user'
import meituanLogo from '@/assets/meituan-logo.png'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('all')
const refreshing = ref(false)
const listLoading = ref(false)
const perPage = 10
const currentPage = ref(1)
const paginationMeta = reactive({
  total: 0,
  last_page: 1
})

const walletSummary = ref({
  balance: 0,
  available_balance: 0,
  frozen_balance: 0,
  total_income: 0,
  total_expense: 0,
  total_adjustment: 0,
  last_transaction_at: null
})

const stats = ref({
  today_income: 0,
  today_expense: 0,
  yesterday_income: 0
})

const skeletonLoading = ref(true)
const transactionList = ref([])
const showWithdrawPopup = ref(false)
const withdrawSubmitting = ref(false)
const withdrawForm = reactive({
  amount: '',
  accountName: ''
})
const TAX_RATE = 0.08
const defaultAvatar = 'https://img.itapgo.com/profile/default-avatar.png'

const toAmount = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number.toFixed(2) : '0.00'
}

const balanceDisplay = computed(() => toAmount(walletSummary.value.balance))
const availableBalanceDisplay = computed(() => toAmount(walletSummary.value.available_balance))
const frozenBalanceDisplay = computed(() => toAmount(walletSummary.value.frozen_balance))
const todayIncomeDisplay = computed(() => toAmount(stats.value.today_income))
const todayExpenseDisplay = computed(() => toAmount(stats.value.today_expense))
const yesterdayIncomeDisplay = computed(() => toAmount(stats.value.yesterday_income))
const totalIncomeDisplay = computed(() => toAmount(walletSummary.value.total_income))
const totalExpenseDisplay = computed(() => toAmount(walletSummary.value.total_expense))
const lastTransactionDisplay = computed(() => {
  const raw = walletSummary.value.last_transaction_at
  if (!raw) {
    return '暂无记录'
  }
  const parsed = dayjs(raw)
  return parsed.isValid() ? parsed.format('YYYY.MM.DD HH:mm') : raw
})
const totalRecordsDisplay = computed(() => paginationMeta.total || 0)

const statCards = computed(() => [
  {
    label: '今日收入',
    value: todayIncomeDisplay.value,
    extra: `昨日收入 ¥${yesterdayIncomeDisplay.value} · 累计 ¥${totalIncomeDisplay.value}`,
    type: 'income'
  },
  {
    label: '今日支出',
    value: todayExpenseDisplay.value,
    extra: `累计支出 ¥${totalExpenseDisplay.value}`,
    type: 'expense'
  }
])

const alipayProfile = computed(() => {
  const info = userStore.userInfo || {}
  const account = info.alipay_account || info.alipay_user_id || ''
  const nickname = info.alipay_nickname || info.nickname || '支付宝用户'
  const avatar = info.alipay_avatar || info.wechat_avatar || info.avatar || ''
  const bound = Boolean(info.alipay_openid || info.alipay_user_id || info.alipay_account)

  return {
    bound,
    nickname,
    account,
    avatar
  }
})

const isAlipayBound = computed(() => alipayProfile.value.bound)

const maskedAlipayAccount = computed(() => {
  const value = alipayProfile.value.account
  if (!value) return ''
  if (value.includes('@')) {
    const [name, domain] = value.split('@')
    const masked = name.length <= 2 ? `${name[0]}*` : `${name[0]}***${name[name.length - 1]}`
    return `${masked}@${domain}`
  }
  if (value.length <= 4) {
    return `${value[0]}***${value[value.length - 1]}`
  }
  return `${value.slice(0, 3)}****${value.slice(-2)}`
})

const availableBalanceValue = computed(() => Number(walletSummary.value.available_balance) || 0)
const withdrawAmountNumber = computed(() => {
  const value = parseFloat(withdrawForm.amount)
  return Number.isFinite(value) ? value : 0
})
const taxAmountDisplay = computed(() => {
  const tax = withdrawAmountNumber.value * TAX_RATE
  return tax > 0 ? tax.toFixed(2) : '0.00'
})
const netAmountDisplay = computed(() => {
  const amount = withdrawAmountNumber.value
  const net = amount - amount * TAX_RATE
  return net > 0 ? net.toFixed(2) : '0.00'
})

const transactionCategoryMap = {
  recharge: {
    label: '余额充值',
    tag: '充值',
    icon: 'gold-coin-o',
    description: '充值到账户余额'
  },
  withdraw: {
    label: '余额提现',
    tag: '提现',
    icon: 'cash-back-record',
    description: '提现至银行卡/账户'
  },
  meituan_commission: {
    label: '美团分润',
    tag: '美团',
    icon: 'meituan-logo',
    iconType: 'image',
    iconImage: meituanLogo,
    description: '美团分润结算'
  },
  order_income: {
    label: '订单结算',
    tag: '订单',
    icon: 'bill-o',
    description: '订单收入结算'
  },
  order_refund: {
    label: '订单退款',
    tag: '退款',
    icon: 'after-sale',
    description: '订单退款退回'
  },
  refund: {
    label: '退款退回',
    tag: '退款',
    icon: 'after-sale',
    description: '退款退回余额'
  },
  commission: {
    label: '分润收益',
    tag: '分润',
    icon: 'manager-o',
    description: '渠道分润入账'
  },
  service_fee: {
    label: '服务费',
    tag: '费用',
    icon: 'balance-list',
    description: '扣除平台服务费'
  },
  adjust: {
    label: '账户调整',
    tag: '调整',
    icon: 'records',
    description: '人工或系统调整'
  },
  income: {
    label: '收入',
    tag: '入账',
    icon: 'points',
    description: '收入到账户'
  },
  expense: {
    label: '支出',
    tag: '支出',
    icon: 'points',
    description: '支出扣减余额'
  },
  general: {
    label: '账户变动',
    tag: '账户',
    icon: 'records',
    description: '账户变动明细'
  }
}

const parseDateSafe = (value) => {
  if (!value && value !== 0) return null
  if (typeof value === 'number') {
    const timestamp = value < 1e12 ? value * 1000 : value
    const parsed = dayjs(timestamp)
    return parsed.isValid() ? parsed : null
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    if (/^\d+$/.test(trimmed)) {
      const numeric = Number(trimmed)
      const timestamp = trimmed.length <= 10 ? numeric * 1000 : numeric
      const parsed = dayjs(timestamp)
      return parsed.isValid() ? parsed : null
    }
    const normalized = trimmed.replace(' ', 'T')
    const parsed = dayjs(normalized)
    if (parsed.isValid()) return parsed
    const fallbackParsed = dayjs(trimmed)
    return fallbackParsed.isValid() ? fallbackParsed : null
  }
  return null
}

const getTransactionMeta = (item = {}) => {
  const categoryKey = (item.category || '').toString().toLowerCase()
  const typeKey = (item.type || '').toString().toLowerCase()
  return transactionCategoryMap[categoryKey] || transactionCategoryMap[typeKey] || transactionCategoryMap.general
}

const shouldUseImageIcon = (item = {}) => getTransactionMeta(item).iconType === 'image'
const getTransactionIconImage = (item = {}) => getTransactionMeta(item).iconImage || ''

const getTransactionLabel = (item = {}) => item?.meta?.title || getTransactionMeta(item).label
const getTransactionDescription = (item = {}) => {
  const label = (getTransactionLabel(item) || '').trim()
  const candidates = [
    item.description,
    item?.meta?.remark,
    item?.meta?.description,
    getTransactionMeta(item).description
  ]

  const description = candidates.find((text) => {
    if (!text) return false
    const trimmed = String(text).trim()
    return trimmed && trimmed !== label
  })

  if (!description) {
    return ''
  }

  const normalized = String(description)
  if (!label) {
    return normalized.trim()
  }

  const labelPattern = new RegExp(`^${label.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}[：:、，\s]*`, 'i')
  return normalized.replace(labelPattern, '').trim()
}
const getTransactionTag = (item = {}) => item?.meta?.tag || getTransactionMeta(item).tag
const getTransactionIcon = (item = {}) => item?.meta?.icon || getTransactionMeta(item).icon
const getAmountClass = (item = {}) => {
  const type = (item.type || '').toLowerCase()
  if (type === 'income') {
    return 'income'
  }
  if (type === 'expense') {
    return 'expense'
  }
  return 'adjust'
}
const formatTransactionDate = (item = {}) => {
  const shouldUseBusinessDate = item.type === 'income' && item.business_date
  const primarySource = shouldUseBusinessDate ? item.business_date : item.created_at
  const fallbackSource = shouldUseBusinessDate ? item.created_at : item.business_date
  const preferredFormat = shouldUseBusinessDate ? 'YYYY.MM.DD' : 'YYYY.MM.DD HH:mm'

  const primary = parseDateSafe(primarySource)
  if (primary) {
    return primary.format(preferredFormat)
  }

  const fallback = parseDateSafe(fallbackSource)
  if (fallback) {
    return fallback.format(preferredFormat)
  }

  return typeof primarySource === 'string' && primarySource ? primarySource : '时间未知'
}

const fetchWalletSummary = async () => {
  skeletonLoading.value = true
  try {
    const res = await getUserWalletSummary()
    if (res?.code === 0) {
      walletSummary.value = res.data?.wallet || walletSummary.value
      stats.value = res.data?.stats || stats.value
    }
  } catch (error) {
    console.error('获取钱包概览失败', error)
      showFailToast('获取钱包信息失败')
  } finally {
    skeletonLoading.value = false
  }
}

const fetchTransactions = async (pageParam = 1) => {
  listLoading.value = true
  try {
    const res = await getUserWalletTransactions({
      page: pageParam,
      per_page: perPage,
      type: activeTab.value === 'all' ? undefined : activeTab.value
    })

    if (res?.code === 0) {
      transactionList.value = res.data?.list || []
      const pagination = res.data?.pagination || {}
      currentPage.value = pagination.page ?? pageParam
      paginationMeta.total = pagination.total ?? transactionList.value.length
      paginationMeta.last_page = pagination.last_page ?? 1
    } else {
      showFailToast(res?.message || '加载交易记录失败')
    }
  } catch (error) {
    console.error('加载交易记录失败', error)
    showFailToast('加载交易记录失败')
  } finally {
    listLoading.value = false
    refreshing.value = false
  }
}

const onRefresh = async () => {
  refreshing.value = true
  await Promise.all([fetchWalletSummary(), fetchTransactions(currentPage.value || 1)])
  refreshing.value = false
}

const onTabChange = async () => {
  await fetchTransactions(1)
}

const handlePageChange = (page) => {
  const targetPage = Number(page)
  if (!Number.isFinite(targetPage) || targetPage < 1 || targetPage > paginationMeta.last_page) {
    return
  }
  fetchTransactions(targetPage)
}

const openWithdrawPopup = async () => {
  try {
    await userStore.fetchUserInfo({ forceRefresh: true })
  } catch (error) {
    console.error('刷新用户信息失败', error)
  }
  withdrawForm.amount = ''
  withdrawForm.accountName = alipayProfile.value.nickname || ''
  showWithdrawPopup.value = true
}

const submitWithdraw = async () => {
  if (!isAlipayBound.value) {
    showToast('请先绑定支付宝账号')
    return
  }
  if (withdrawSubmitting.value) return

  const amount = withdrawAmountNumber.value
  if (!amount || amount <= 0) {
    showToast('请输入正确的提现金额')
    return
  }

  if (amount > availableBalanceValue.value) {
    showToast('提现金额不能超过可用余额')
    return
  }

  if (!withdrawForm.accountName.trim()) {
    showToast('请输入开户名')
    return
  }

  try {
    withdrawSubmitting.value = true
    const res = await applyWithdraw({
      amount,
      accountName: withdrawForm.accountName.trim() || alipayProfile.value.nickname,
      channel: 'alipay'
    })

    if (res?.code === 0) {
      showToast('提现申请已提交，预计1-3个工作日到账')
      showWithdrawPopup.value = false
      await fetchWalletSummary()
      await fetchTransactions(currentPage.value || 1)
    } else {
      showFailToast(res?.message || '提现申请失败，请稍后重试')
    }
  } catch (error) {
    console.error('提交提现申请失败', error)
    showFailToast('提现申请失败，请稍后重试')
  } finally {
    withdrawSubmitting.value = false
  }
}

const goBindAlipay = () => {
  showWithdrawPopup.value = false
  router.push({ name: 'UserSettingsBankCard', query: { tab: 'alipay' } })
}

const onAmountChange = (value) => {
  if (!value) {
    withdrawForm.amount = ''
    return
  }
  const parsed = parseFloat(value)
  if (Number.isNaN(parsed) || parsed <= 0) {
    withdrawForm.amount = ''
    return
  }
  const capped = Math.min(parsed, availableBalanceValue.value)
  withdrawForm.amount = capped.toFixed(2)
}

const withdrawAll = () => {
  if (availableBalanceValue.value <= 0) {
    showToast('当前没有可提现的余额')
    return
  }
  withdrawForm.amount = availableBalanceValue.value.toFixed(2)
}

onMounted(async () => {
  await fetchWalletSummary()
  await fetchTransactions(1)
})
</script>

<style scoped>
.wallet-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f2f8ff 0%, #f7f8fa 100%);
}

.wallet-content {
  padding: 12px 12px 32px;
}

.withdraw-popup {
  padding: 24px 20px 32px;
}

.withdraw-popup__header {
  text-align: center;
  margin-bottom: 16px;
}

.withdraw-popup__title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}

.withdraw-popup__desc {
  margin-top: 6px;
  font-size: 13px;
  color: #8a8f99;
}

.withdraw-popup :deep(.van-field) {
  margin-bottom: 12px;
  border-radius: 12px;
  background: #f7f8fa;
  padding: 8px 12px;
}

.withdraw-popup__info {
  margin: 12px 0 16px;
  padding: 12px;
  border-radius: 12px;
  background: #f4f6ff;
  color: #4f5565;
  font-size: 13px;
}

.withdraw-popup__info p {
  margin: 4px 0;
  display: flex;
  justify-content: space-between;
}

.withdraw-all {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #7a7f8c;
  margin: -6px 0 12px;
}

.withdraw-popup__submit {
  margin-top: 8px;
}

.withdraw-empty {
  text-align: center;
  padding: 12px 0 24px;
  color: #7a7f8c;
}

.withdraw-empty p {
  margin: 12px 0 16px;
}

.alipay-account-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: #f5f7ff;
  margin-bottom: 12px;
}

.alipay-account-card img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.alipay-account-card .name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
}

.alipay-account-card .account {
  font-size: 13px;
  color: #7a7f8c;
}

.alipay-account-card button {
  margin-left: auto;
}

.balance-card {
  margin-bottom: 16px;
  padding: 20px;
  border-radius: 18px;
  color: #fff;
  background: linear-gradient(135deg, #2b7cff, #5ad8ff 85%);
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 24px rgba(43, 124, 255, 0.25);
}

.balance-card::after {
  content: '';
  position: absolute;
  top: -40px;
  right: -40px;
  width: 160px;
  height: 160px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  filter: blur(0.5px);
}

.balance-header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}

.balance-header__info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.balance-label {
  font-size: 14px;
  opacity: 0.85;
}

.balance-amount {
  font-size: 40px;
  font-weight: 600;
  margin: 6px 0;
}

.balance-subtitle {
  font-size: 12px;
  opacity: 0.85;
}

.balance-actions {
  display: flex;
  gap: 12px;
}

.balance-metrics {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  gap: 12px;
}

.metric-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 13px;
  opacity: 0.85;
}

.metric-value {
  font-size: 18px;
  font-weight: 500;
}

.metric-divider {
  width: 1px;
  height: 38px;
  background: rgba(255, 255, 255, 0.35);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 25px rgba(15, 39, 102, 0.08);
  border: 1px solid rgba(40, 102, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-card.income {
  border-color: rgba(7, 193, 96, 0.2);
}

.stat-card.expense {
  border-color: rgba(238, 10, 36, 0.2);
}

.stat-card.neutral {
  border-color: rgba(153, 153, 153, 0.2);
}

.stat-label {
  font-size: 13px;
  color: #7a7f8c;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #101828;
}

.stat-extra {
  font-size: 12px;
  color: #7a7f8c;
}

.transaction-panel {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 12px 32px rgba(15, 39, 102, 0.08);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-end;
  margin-bottom: 8px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #101828;
}

.panel-subtitle {
  font-size: 12px;
  color: #98a1b2;
  margin-top: 4px;
}

.panel-title-group {
  display: flex;
  flex-direction: column;
}

:deep(.van-tabs__nav) {
  background-color: transparent;
}

:deep(.van-tabs__wrap) {
  margin-bottom: -4px;
}

.transaction-item {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f1f2f5;
}

.transaction-item:last-of-type {
  border-bottom: none;
}

.transaction-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(43, 124, 255, 0.12);
  color: #2b7cff;
}

.transaction-icon img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.transaction-icon.income {
  background: rgba(7, 193, 96, 0.12);
  color: #07c160;
}

.transaction-icon.expense {
  background: rgba(238, 10, 36, 0.12);
  color: #ee0a24;
}

.transaction-icon.adjust {
  background: rgba(16, 24, 40, 0.08);
  color: #101828;
}

.transaction-icon img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.transaction-body {
  flex: 1;
}

.transaction-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.transaction-type {
  font-size: 16px;
  font-weight: 500;
  color: #1d2129;
}

.transaction-amount {
  font-size: 16px;
  font-weight: 600;
}

.transaction-amount.income {
  color: #07c160;
}

.transaction-amount.expense {
  color: #ee0a24;
}

.transaction-amount.adjust {
  color: #2b7cff;
}

.transaction-row.meta {
  margin-top: 4px;
  font-size: 12px;
  color: #7a7f8c;
}

.transaction-desc {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.transaction-date {
  margin-top: 6px;
  font-size: 12px;
  color: #99a0b0;
}

.transaction-list {
  min-height: 200px;
}

.transaction-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 24px 0;
  color: #8a8f99;
  font-size: 13px;
}

.transaction-pagination {
  margin: 16px auto 0;
  display: flex;
  justify-content: center;
}

.transaction-pagination :deep(.van-pagination__item) {
  min-width: 64px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

:deep(.van-tag) {
  margin-left: 8px;
}

.empty-state {
  padding: 32px 0;
  text-align: center;
  color: #b3b8c2;
}

.empty-state :deep(.van-icon) {
  color: #d0d6e3;
  margin-bottom: 12px;
}

@media (min-width: 768px) {
  .wallet-content {
    padding: 24px 48px 48px;
  }

  .transaction-panel {
    padding: 24px;
  }
}
</style>
