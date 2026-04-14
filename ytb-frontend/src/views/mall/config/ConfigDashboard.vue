<template>
  <div class="mall-config-dashboard">
    <div class="page-header">
      <div>
        <h1>商城设置总览</h1>
        <p>快速了解商城运行状态，并跳转到常用配置</p>
      </div>
      <el-button type="primary" :loading="loading" @click="fetchOverview">
        刷新
      </el-button>
    </div>

    <el-alert
      v-if="loadError"
      type="error"
      :closable="false"
      class="mb-20"
      :title="loadError"
    />

    <div v-if="loading" class="skeleton-wrapper">
      <el-skeleton :rows="6" animated />
    </div>

    <div v-else-if="overview">
      <el-row :gutter="20" class="mb-20">
        <el-col :md="12" :lg="8" :sm="24">
          <el-card shadow="hover" class="card-fill">
            <template #header>
              <div class="card-header">
                <span>基础信息</span>
                <el-tag :type="basicInfo.mall_status ? 'success' : 'danger'" effect="plain">
                  {{ basicInfo.mall_status ? '商城开启' : '商城关闭' }}
                </el-tag>
              </div>
            </template>
            <div class="basic-info">
              <div class="info-row">
                <span class="label">商城名称</span>
                <span class="value">{{ basicInfo.mall_name || '未配置' }}</span>
              </div>
              <div class="info-row">
                <span class="label">客服热线</span>
                <span class="value">{{ basicInfo.service_phone || '未配置' }}</span>
              </div>
              <div class="info-row">
                <span class="label">客服微信</span>
                <span class="value">{{ basicInfo.service_wechat || '未配置' }}</span>
              </div>
              <div class="info-row">
                <span class="label">允许商户入驻</span>
                <el-tag :type="basicInfo.allow_merchant ? 'success' : 'info'" size="small">
                  {{ basicInfo.allow_merchant ? '已开启' : '未开启' }}
                </el-tag>
              </div>
              <div class="info-row">
                <span class="label">商户商品审核</span>
                <el-tag :type="basicInfo.merchant_audit ? 'warning' : 'success'" size="small">
                  {{ basicInfo.merchant_audit ? '需要审核' : '自动通过' }}
                </el-tag>
              </div>
              <div class="info-row">
                <span class="label">最近更新</span>
                <span class="value">{{ formatDate(basicInfo.last_updated_at) || '暂无' }}</span>
              </div>
              <div class="actions">
                <el-button type="primary" size="small" @click="goTo('MallConfigSettings')">
                  编辑基础设置
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :md="12" :lg="8" :sm="24">
          <el-card shadow="hover" class="card-fill">
            <template #header>
              <div class="card-header">
                <span>支付方式</span>
                <el-tag type="info" effect="plain">
                  启用 {{ paymentSummary.enabledCount }}/{{ paymentSummary.total }}
                </el-tag>
              </div>
            </template>
            <div class="payment-summary">
              <div
                v-for="method in paymentSummary.methods"
                :key="method.key"
                class="method-row"
              >
                <div>
                  <span class="method-name">{{ method.title }}</span>
                  <p class="method-desc">{{ method.description }}</p>
                </div>
                <el-tag :type="method.enabled ? 'success' : 'info'" size="small">
                  {{ method.enabled ? '启用' : '停用' }}
                </el-tag>
              </div>
              <div class="actions">
                <el-button type="primary" size="small" @click="goTo('MallConfigPayment')">
                  管理支付方式
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :md="24" :lg="8" :sm="24">
          <el-card shadow="hover" class="card-fill">
            <template #header>
              <div class="card-header">
                <span>运营提醒</span>
                <el-tag type="warning" effect="plain">
                  待处理 {{ alerts.total }}
                </el-tag>
              </div>
            </template>
            <div class="alert-list">
              <div class="alert-item">
                <div>
                  <p class="alert-title">官方待处理订单</p>
                  <p class="alert-desc">官方商城未完成的订单数量</p>
                </div>
                <el-tag :type="alerts.official_pending_orders ? 'warning' : 'success'" size="small">
                  {{ alerts.official_pending_orders }}
                </el-tag>
              </div>
              <div class="alert-item">
                <div>
                  <p class="alert-title">官方低库存</p>
                  <p class="alert-desc">官方商城库存预警商品</p>
                </div>
                <el-tag :type="alerts.official_low_stock ? 'danger' : 'success'" size="small">
                  {{ alerts.official_low_stock }}
                </el-tag>
              </div>
              <div class="alert-item">
                <div>
                  <p class="alert-title">商户待处理订单</p>
                  <p class="alert-desc">商户商城等待处理的订单</p>
                </div>
                <el-tag :type="alerts.merchant_pending_orders ? 'warning' : 'success'" size="small">
                  {{ alerts.merchant_pending_orders }}
                </el-tag>
              </div>
              <div class="alert-item">
                <div>
                  <p class="alert-title">待审核商户</p>
                  <p class="alert-desc">需要人工审核的商户申请</p>
                </div>
                <el-tag :type="alerts.pending_merchants ? 'danger' : 'success'" size="small">
                  {{ alerts.pending_merchants }}
                </el-tag>
              </div>
              <div class="alert-item">
                <div>
                  <p class="alert-title">待审核商品</p>
                  <p class="alert-desc">商户提交的新品需要审核</p>
                </div>
                <el-tag :type="alerts.pending_products ? 'warning' : 'success'" size="small">
                  {{ alerts.pending_products }}
                </el-tag>
              </div>
              <div class="alert-item">
                <div>
                  <p class="alert-title">商城轮播图</p>
                  <p class="alert-desc">商城位置启用 {{ bannerStats.mall_active }}/{{ bannerStats.mall_total }}</p>
                </div>
                <el-button link type="primary" size="small" @click="goTo('MallConfigBanners')">
                  查看
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="mb-20">
        <el-col :md="12" :lg="6" :sm="12">
          <el-card shadow="hover" class="stat-card">
            <p class="stat-title">商品总数</p>
            <div class="stat-value">{{ summaryStats.goods.total }}</div>
            <p class="stat-desc">
              官方 {{ summaryStats.goods.official }} · 商户 {{ summaryStats.goods.merchant }}
            </p>
            <el-button link type="primary" size="small" @click="goToNamed('/mall/products')">
              商品管理
            </el-button>
          </el-card>
        </el-col>
        <el-col :md="12" :lg="6" :sm="12">
          <el-card shadow="hover" class="stat-card">
            <p class="stat-title">订单总数</p>
            <div class="stat-value">{{ summaryStats.orders.total }}</div>
            <p class="stat-desc">
              待处理 {{ summaryStats.orders.pending }} · 今日 {{ summaryStats.orders.today }}
            </p>
            <el-button link type="primary" size="small" @click="goToNamed('/mall/orders')">
              订单管理
            </el-button>
          </el-card>
        </el-col>
        <el-col :md="12" :lg="6" :sm="12">
          <el-card shadow="hover" class="stat-card">
            <p class="stat-title">销售额</p>
            <div class="stat-value">¥{{ formatAmount(summaryStats.sales.total) }}</div>
            <p class="stat-desc">
              官方 ¥{{ formatAmount(summaryStats.sales.official) }} · 商户 ¥{{ formatAmount(summaryStats.sales.merchant) }}
            </p>
            <el-button link type="primary" size="small" @click="goTo('MallDashboard')">
              查看概览
            </el-button>
          </el-card>
        </el-col>
        <el-col :md="12" :lg="6" :sm="12">
          <el-card shadow="hover" class="stat-card">
            <p class="stat-title">入驻商户</p>
            <div class="stat-value">{{ merchantStats.merchants.total }}</div>
            <p class="stat-desc">
              待审核 {{ merchantStats.merchants.pending }} · 启用 {{ merchantStats.merchants.active }}
            </p>
            <el-button link type="primary" size="small" @click="goToNamed('/mall/merchant/merchants')">
              商户管理
            </el-button>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="mb-20">
        <el-col :md="12" :sm="24">
          <el-card shadow="hover" class="detail-card">
            <template #header>
              <div class="card-header">
                <span>官方商城概览</span>
              </div>
            </template>
            <div class="detail-grid">
              <div class="detail-item">
                <p class="detail-title">商品总数</p>
                <p class="detail-value">{{ officialStats.goods.total }}</p>
                <p class="detail-desc">
                  上架 {{ officialStats.goods.on_sale }} · 下架 {{ officialStats.goods.off_sale }}
                </p>
              </div>
              <div class="detail-item">
                <p class="detail-title">库存状态</p>
                <p class="detail-value">{{ officialStats.goods.low_stock }}</p>
                <p class="detail-desc">
                  低库存 {{ officialStats.goods.low_stock }} · 缺货 {{ officialStats.goods.out_of_stock }}
                </p>
              </div>
              <div class="detail-item">
                <p class="detail-title">订单总数</p>
                <p class="detail-value">{{ officialStats.orders.total }}</p>
                <p class="detail-desc">
                  待处理 {{ officialStats.orders.pending }} · 今日 {{ officialStats.orders.today }}
                </p>
              </div>
              <div class="detail-item">
                <p class="detail-title">销售额</p>
                <p class="detail-value">¥{{ formatAmount(officialStats.orders.sales.total) }}</p>
                <p class="detail-desc">
                  今日 ¥{{ formatAmount(officialStats.orders.sales.today) }} · 本月 ¥{{ formatAmount(officialStats.orders.sales.month) }}
                </p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :md="12" :sm="24">
          <el-card shadow="hover" class="detail-card">
            <template #header>
              <div class="card-header">
                <span>商户商城概览</span>
              </div>
            </template>
            <div class="detail-grid">
              <div class="detail-item">
                <p class="detail-title">入驻商户</p>
                <p class="detail-value">{{ merchantStats.merchants.total }}</p>
                <p class="detail-desc">
                  待审核 {{ merchantStats.merchants.pending }} · 有效 {{ merchantStats.merchants.active }}
                </p>
              </div>
              <div class="detail-item">
                <p class="detail-title">商品总数</p>
                <p class="detail-value">{{ merchantStats.goods.total }}</p>
                <p class="detail-desc">
                  上架 {{ merchantStats.goods.on_sale }} · 待审核 {{ merchantStats.goods.pending }}
                </p>
              </div>
              <div class="detail-item">
                <p class="detail-title">订单总数</p>
                <p class="detail-value">{{ merchantStats.orders.total }}</p>
                <p class="detail-desc">
                  待付款 {{ merchantStats.orders.pending_payment }} · 待发货 {{ merchantStats.orders.pending_ship }}
                </p>
              </div>
              <div class="detail-item">
                <p class="detail-title">销售额</p>
                <p class="detail-value">¥{{ formatAmount(merchantStats.sales.total) }}</p>
                <p class="detail-desc">
                  今日 ¥{{ formatAmount(merchantStats.sales.today) }} · 本月 ¥{{ formatAmount(merchantStats.sales.month) }}
                </p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never">
        <template #header>
          <div class="card-header">
            <span>快捷入口</span>
          </div>
        </template>
        <div class="quick-links">
          <div
            v-for="link in quickLinks"
            :key="link.label"
            class="quick-link"
            @click="link.action()"
          >
            <i :class="link.icon" />
            <div>
              <p class="link-label">{{ link.label }}</p>
              <p class="link-desc">{{ link.description }}</p>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getMallConfigOverview } from '@/api/v1/mallConfig'

const router = useRouter()
const loading = ref(false)
const loadError = ref('')
const overview = ref(null)

const defaultBasic = {
  mall_name: '',
  mall_status: false,
  allow_merchant: false,
  merchant_audit: false,
  service_phone: '',
  service_wechat: '',
  last_updated_at: ''
}

const defaultOfficial = {
  goods: {
    total: 0,
    on_sale: 0,
    off_sale: 0,
    low_stock: 0,
    out_of_stock: 0,
    categories: { total: 0, enabled: 0, disabled: 0 }
  },
  orders: {
    total: 0,
    pending: 0,
    today: 0,
    sales: { total: 0, today: 0, month: 0 }
  }
}

const defaultMerchant = {
  merchants: { total: 0, active: 0, pending: 0, inactive: 0 },
  goods: { total: 0, on_sale: 0, pending: 0, rejected: 0, offline: 0 },
  orders: { total: 0, today: 0, pending_payment: 0, pending_ship: 0, pending: 0, completed: 0 },
  sales: { total: 0, today: 0, month: 0, year: 0 }
}

const defaultAggregate = {
  goods: { official: 0, merchant: 0, total: 0 },
  orders: { official: 0, merchant: 0, total: 0, pending: 0, today: 0 },
  sales: { official: 0, merchant: 0, total: 0, today: 0, month: 0 }
}

const basicInfo = computed(() => ({ ...defaultBasic, ...(overview.value?.basic || {}) }))

const officialStats = computed(() => {
  const source = overview.value?.official || {}
  return {
    goods: {
      ...defaultOfficial.goods,
      ...(source.goods || {}),
      categories: {
        ...defaultOfficial.goods.categories,
        ...((source.goods && source.goods.categories) || {})
      }
    },
    orders: {
      ...defaultOfficial.orders,
      ...(source.orders || {}),
      sales: {
        ...defaultOfficial.orders.sales,
        ...((source.orders && source.orders.sales) || {})
      }
    }
  }
})

const merchantStats = computed(() => {
  const source = overview.value?.merchant || {}
  return {
    merchants: { ...defaultMerchant.merchants, ...(source.merchants || {}) },
    goods: { ...defaultMerchant.goods, ...(source.goods || {}) },
    orders: { ...defaultMerchant.orders, ...(source.orders || {}) },
    sales: { ...defaultMerchant.sales, ...(source.sales || {}) }
  }
})

const summaryStats = computed(() => {
  const stats = overview.value?.statistics || {}
  return {
    goods: { ...defaultAggregate.goods, ...(stats.goods || {}) },
    orders: { ...defaultAggregate.orders, ...(stats.orders || {}) },
    sales: { ...defaultAggregate.sales, ...(stats.sales || {}) }
  }
})

const paymentSummary = computed(() => {
  const payment = overview.value?.payment
  if (!payment) {
    return { total: 0, enabledCount: 0, methods: [] }
  }
  const methods = payment.methods || []
  const enabledCount = methods.filter(item => item.enabled).length
  return {
    total: methods.length,
    enabledCount,
    methods
  }
})

const bannerStats = computed(() => overview.value?.banners || { total: 0, active: 0, mall_total: 0, mall_active: 0 })

const alerts = computed(() => {
  const source = overview.value?.alerts || {}
  const officialPending = source.official_pending_orders || 0
  const officialLowStock = source.official_low_stock || 0
  const merchantPendingOrders = source.merchant_pending_orders || 0
  const pendingMerchants = source.pending_merchants || 0
  const pendingProducts = source.pending_products || 0
  const total = source.total ?? (
    officialPending +
    officialLowStock +
    merchantPendingOrders +
    pendingMerchants +
    pendingProducts
  )
  return {
    official_pending_orders: officialPending,
    official_low_stock: officialLowStock,
    merchant_pending_orders: merchantPendingOrders,
    pending_merchants: pendingMerchants,
    pending_products: pendingProducts,
    total
  }
})

const quickLinks = computed(() => [
  {
    label: '商城基础信息',
    icon: 'el-icon-setting',
    description: '修改商城名称、Logo、客服信息',
    action: () => goTo('MallConfigSettings')
  },
  {
    label: '支付方式',
    icon: 'el-icon-bank-card',
    description: '配置商城可用支付渠道',
    action: () => goTo('MallConfigPayment')
  },
  {
    label: '商城轮播图',
    icon: 'el-icon-picture-outline',
    description: '维护商城首页轮播图内容',
    action: () => goTo('MallConfigBanners')
  },
  {
    label: '商城总览',
    icon: 'el-icon-data-analysis',
    description: '查看商城整体运营数据',
    action: () => goTo('MallDashboard')
  }
])

const fetchOverview = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const response = await getMallConfigOverview()
    if (response && (response.code === 0 || response.code === 200)) {
      overview.value = response.data || {}
    } else {
      throw new Error(response?.message || '获取商城总览失败')
    }
  } catch (error) {
    console.error('加载商城配置总览失败:', error)
    loadError.value = error.message || '加载商城配置总览失败'
    ElMessage.error(loadError.value)
  } finally {
    loading.value = false
  }
}

const goTo = (name) => {
  router.push({ name })
}

const goToNamed = (path) => {
  router.push(path)
}

const formatAmount = (value) => {
  const number = Number(value || 0)
  return number.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (value) => {
  if (!value) {
    return ''
  }
  try {
    return new Date(value).toLocaleString()
  } catch (error) {
    return ''
  }
}

onMounted(() => {
  fetchOverview()
})
</script>

<style scoped>
.mall-config-dashboard {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 22px;
  margin: 0;
  color: #303133;
}

.page-header p {
  margin: 4px 0 0;
  color: #909399;
  font-size: 14px;
}

.mb-20 {
  margin-bottom: 20px;
}

.skeleton-wrapper {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
}

.card-fill {
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.basic-info .info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.basic-info .label {
  color: #606266;
  font-size: 13px;
}

.basic-info .value {
  color: #303133;
  font-weight: 500;
}

.basic-info .actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.payment-summary .method-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f2f5;
}

.payment-summary .method-row:last-child {
  border-bottom: none;
}

.method-name {
  font-weight: 500;
  color: #303133;
}

.method-desc {
  margin: 4px 0 0;
  color: #909399;
  font-size: 12px;
}

.payment-summary .actions {
  text-align: right;
  margin-top: 12px;
}

.alert-list .alert-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f2f5;
}

.alert-list .alert-item:last-child {
  border-bottom: none;
}

.alert-title {
  margin: 0;
  font-weight: 500;
  color: #303133;
}

.alert-desc {
  margin: 4px 0 0;
  color: #909399;
  font-size: 12px;
}

.stat-card {
  text-align: left;
  height: 100%;
}

.stat-title {
  margin: 0 0 6px;
  color: #909399;
  font-size: 13px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.stat-desc {
  margin: 0 0 10px;
  color: #909399;
  font-size: 13px;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.quick-link {
  display: flex;
  gap: 12px;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-link:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
}

.quick-link i {
  font-size: 24px;
  color: var(--el-color-primary);
}

.link-label {
  margin: 0;
  color: #303133;
  font-weight: 500;
}

.link-desc {
  margin: 4px 0 0;
  color: #909399;
  font-size: 12px;
}

.detail-card {
  height: 100%;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.detail-item {
  background: #f6f8fa;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-title {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.detail-value {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.detail-desc {
  margin: 0;
  color: #909399;
  font-size: 12px;
  line-height: 18px;
}

@media (max-width: 960px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
