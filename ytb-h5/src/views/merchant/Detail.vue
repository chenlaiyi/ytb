<template>
  <div class="merchant-detail">
    <van-nav-bar
      title="商户详情"
      left-arrow
      fixed
      placeholder
      @click-left="router.back()"
    />

    <div class="detail-content">
      <div v-if="loading" class="loading-block">
        <van-loading type="spinner" size="28" />
        <span>正在加载商户信息...</span>
      </div>

      <template v-else>
        <section class="summary-card">
          <div class="summary-main">
            <van-image
              class="summary-logo"
              width="64"
              height="64"
              round
              fit="cover"
              :src="merchantInfo.logo || undefined"
              :error-icon="'shop-o'"
              :show-error="true"
            />
            <div class="summary-info">
            <div class="summary-name">{{ merchantInfo.display_name || merchantInfo.name || '未命名商户' }}</div>
              <div class="summary-meta">商户编号：{{ merchantInfo.merchant_id || merchantInfo.out_merchant_id || '—' }}</div>
              <div v-if="merchantInfo.short_name" class="summary-meta">简称：{{ merchantInfo.short_name }}</div>
              <div v-if="merchantInfo.industry" class="summary-meta">行业：{{ merchantInfo.industry }}</div>
            </div>
          </div>
          <div v-if="merchantInfo.address" class="summary-address">
            <van-icon name="location" />
            <span>{{ merchantInfo.address }}</span>
          </div>
        </section>

        <section class="stats-section">
          <div class="section-title">收款概览</div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">今日收款</div>
              <div class="stat-value">¥ {{ formatCurrency(incomeData.todayIncome) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">本月收款</div>
              <div class="stat-value">¥ {{ formatCurrency(incomeData.monthIncome) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">累计收款</div>
              <div class="stat-value">¥ {{ formatCurrency(incomeData.totalReceived) }}</div>
            </div>
          </div>
        </section>

        <section class="stats-section">
          <div class="section-title">交易统计</div>
          <div class="stats-grid two-column">
            <div class="stat-item">
              <div class="stat-label">今日交易数</div>
              <div class="stat-value">{{ formatNumber(businessData.todaySales) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">本月交易数</div>
              <div class="stat-value">{{ formatNumber(businessData.monthSales) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">累计交易数</div>
              <div class="stat-value">{{ formatNumber(businessData.totalSales) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">今日交易额</div>
              <div class="stat-value">¥ {{ formatCurrency(businessData.todayAmount) }}</div>
            </div>
          </div>
        </section>

        <section class="points-section">
          <div class="section-title">积分信息</div>
          <div class="points-card">
            <div class="points-total">
              <span class="points-value">{{ formatPoints(pointsData.total) }}</span>
              <span class="points-label">当前积分</span>
            </div>
            <div class="points-breakdown">
              <div>
                <span class="breakdown-label">累计获取</span>
                <span class="breakdown-value positive">+{{ formatPoints(pointsData.earned) }}</span>
              </div>
              <div>
                <span class="breakdown-label">累计消耗</span>
                <span class="breakdown-value negative">-{{ formatPoints(pointsData.spent) }}</span>
              </div>
              <div v-if="pointsData.last_updated_at" class="points-updated">最近更新：{{ pointsData.last_updated_at }}</div>
            </div>
          </div>
        </section>

        <section class="payment-section" v-if="hasPaymentData">
          <div class="section-title">支付方式占比</div>
          <div class="payment-tags">
            <van-tag plain type="primary">微信支付 ¥ {{ formatCurrency(paymentMethods.wechat) }}</van-tag>
            <van-tag plain type="success">支付宝 ¥ {{ formatCurrency(paymentMethods.alipay) }}</van-tag>
            <van-tag plain type="default">其他 ¥ {{ formatCurrency(paymentMethods.other) }}</van-tag>
          </div>
        </section>

        <section class="recent-section">
          <div class="section-title with-action">
            <span>最近交易</span>
            <van-button size="mini" type="primary" plain @click="goToTradeList">查看全部</van-button>
          </div>
          <div v-if="!recentOrders.length" class="empty-tip">暂无交易记录</div>
          <van-cell-group v-else>
            <van-cell
              v-for="order in recentOrders"
              :key="order.tradeNo || order.createTime"
              :title="order.productName"
              :label="order.createTime"
              :value="`¥ ${order.amount}`"
              size="large"
            />
          </van-cell-group>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getMerchantWorkspace } from '@/api/merchant'

const router = useRouter()
const route = useRoute()


const loading = ref(true)
const detailData = ref(null)

const merchantInfo = computed(() => detailData.value?.merchantInfo || {})
const incomeData = computed(() => detailData.value?.incomeData || {})
const businessData = computed(() => detailData.value?.businessData || {})
const pointsData = computed(() => detailData.value?.points || { total: 0, earned: 0, spent: 0, history: [] })
const paymentMethods = computed(() => detailData.value?.payment_methods || { wechat: 0, alipay: 0, other: 0 })
const recentOrders = computed(() => detailData.value?.recentOrders || [])

const hasPaymentData = computed(() => {
  const data = paymentMethods.value
  return [data.wechat, data.alipay, data.other].some((value) => Number(value) > 0)
})

const formatCurrency = (value) => {
  const num = Number(value || 0)
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatNumber = (value) => {
  const num = Number(value || 0)
  return num.toLocaleString('zh-CN')
}

const formatPoints = (value) => {
  const num = Number(value || 0)
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const fetchDetail = async () => {
  const merchantId = String(route.params.id || '').trim()
  if (!merchantId) {
    showToast('缺少商户ID')
    router.back()
    return
  }

  loading.value = true
  try {
    const res = await getMerchantWorkspace({ merchant_id: merchantId })
    if (res && res.code === 0 && res.data) {
      detailData.value = res.data
    } else {
      showToast(res?.message || '获取商户详情失败')
    }
  } catch (error) {
    showToast('获取商户详情失败')
  } finally {
    loading.value = false
  }
}

const goToTradeList = () => {
  const merchantId = merchantInfo.value.merchant_id || merchantInfo.value.out_merchant_id
  router.push({ name: 'MerchantTrades', query: { merchant_id: merchantId } })
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.merchant-detail {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.detail-content {
  padding: 0 16px 32px;
}

.loading-block {
  margin-top: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #646566;
}

.summary-card {
  margin-top: 16px;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 20px;
  box-shadow: 0 12px 24px rgba(43, 109, 229, 0.08);
}

.summary-main {
  display: flex;
  align-items: center;
  gap: 14px;
}

.summary-logo {
  flex-shrink: 0;
  background: #f2f3f5;
}

.summary-info {
  flex: 1;
}

.summary-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}

.summary-meta {
  font-size: 12px;
  color: #80848f;
  margin-top: 4px;
}

.summary-address {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(76, 141, 255, 0.08);
  color: #4c8dff;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
  margin-bottom: 12px;
}

.section-title.with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stats-section,
.points-section,
.payment-section,
.recent-section {
  margin-top: 20px;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 20px;
  box-shadow: 0 12px 24px rgba(15, 34, 67, 0.05);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.stats-grid.two-column {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.stat-item {
  background: #f7f9ff;
  border-radius: 14px;
  padding: 12px 14px;
}

.stat-label {
  font-size: 12px;
  color: #7c88a1;
}

.stat-value {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
}

.points-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #4c8dff 0%, #2b6de5 100%);
  color: #ffffff;
  border-radius: 18px;
  padding: 18px 20px;
  gap: 20px;
}

.points-total {
  text-align: center;
}

.points-value {
  font-size: 24px;
  font-weight: 700;
  display: block;
}

.points-label {
  font-size: 12px;
  opacity: 0.85;
}

.points-breakdown {
  flex: 1;
  display: grid;
  gap: 6px;
  font-size: 12px;
}

.breakdown-label {
  opacity: 0.85;
  margin-right: 6px;
}

.breakdown-value {
  font-weight: 600;
}

.breakdown-value.positive {
  color: #0ad29d;
}

.breakdown-value.negative {
  color: #ff6f6f;
}

.points-updated {
  margin-top: 4px;
  opacity: 0.75;
}

.payment-section .payment-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.recent-section .empty-tip {
  font-size: 13px;
  color: #80848f;
  text-align: center;
  padding: 20px 0 8px;
}
</style>
