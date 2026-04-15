<template>
  <div class="trades-page">
    <NavBar
      title="商户交易记录"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
    />
    
    <div class="content">
      <!-- 搜索筛选 -->
      <div class="search-filter">
        <Search
          v-model="searchValue"
          placeholder="搜索交易单号/商户名称"
          show-action
          @search="onSearch"
          @cancel="onCancelSearch"
        />
        
        <div class="filter-row">
          <div class="merchant-filter" v-if="showMerchantFilter">
            <div class="filter-label">商户:</div>
            <Field
              v-model="selectedMerchantName"
              is-link
              readonly
              name="merchant"
              placeholder="选择商户"
              @click="showMerchantPicker = true"
            />
          </div>
          
          <div class="filter-options">
            <DropdownMenu>
              <DropdownItem v-model="filter.status" :options="statusOptions" @change="onFilterChange" />
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownItem v-model="filter.dateRange" :options="dateOptions" @change="onFilterChange" />
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      <!-- 统计卡片 -->
      <div class="stats-card" v-if="selectedMerchantId">
        <div class="stats-title">交易统计</div>
        <div class="stats-grid">
          <div class="stats-item">
            <div class="stats-value">{{ stats.totalCount || 0 }}</div>
            <div class="stats-label">总笔数</div>
          </div>
          <div class="stats-item">
            <div class="stats-value">{{ formatAmount(stats.totalAmount || 0) }}</div>
            <div class="stats-label">总金额</div>
          </div>
          <div class="stats-item">
            <div class="stats-value">{{ formatAmount(stats.totalFee || 0) }}</div>
            <div class="stats-label">总手续费</div>
          </div>
        </div>
      </div>
      
      <!-- 交易列表 -->
      <div class="trade-list" v-if="!loading && tradeList.length > 0">
        <PullRefresh v-model="refreshing" @refresh="onRefresh">
          <List
            v-model:loading="loadingMore"
            :finished="finished"
            finished-text="没有更多交易记录了"
            @load="onLoadMore"
          >
            <div class="trade-card" v-for="(trade, index) in tradeList" :key="trade.id || index" @click="openTradeDetail(trade)">
              <div class="trade-header">
                <div class="trade-merchant">{{ trade.merchant_name }}</div>
                <Tag :type="getStatusType(trade.status)">{{ getStatusText(trade.status) }}</Tag>
              </div>
              
              <div class="trade-info">
                <div class="trade-no">交易单号: {{ trade.trade_no }}</div>
                <div class="trade-amount">{{ formatAmount(trade.amount) }}</div>
              </div>
              
              <div class="trade-footer">
                <div class="trade-method">{{ getPaymentMethodText(trade.payment_method) }}</div>
                <div class="trade-time">{{ formatDate(trade.created_at) }}</div>
              </div>
            </div>
          </List>
        </PullRefresh>
      </div>
      
      <!-- 加载状态 -->
      <div class="loading-state" v-if="loading">
        <Loading size="24px">加载中...</Loading>
      </div>
      
      <!-- 空状态 -->
      <div class="empty-state" v-if="!loading && tradeList.length === 0">
        <Empty description="暂无交易记录">
          <template #image>
            <Icon name="balance-list-o" size="80" color="#dcdee0" />
          </template>
          <Button round type="primary" size="small" @click="onRefresh">刷新</Button>
        </Empty>
      </div>
      
      <!-- 商户选择弹窗 -->
      <Popup v-model:show="showMerchantPicker" position="bottom" round>
        <Picker
          title="选择商户"
          :columns="merchantColumns"
          @confirm="onMerchantConfirm"
          @cancel="showMerchantPicker = false"
        />
      </Popup>
      
      <!-- 交易详情弹窗 -->
      <Popup
        v-model:show="showTradeDetail"
        position="bottom"
        :style="{ height: '70%' }"
        round
        closeable
      >
        <div class="detail-popup" v-if="currentTrade">
          <div class="detail-title">交易详情</div>
          
          <div class="detail-status">
            <Tag :type="getStatusType(currentTrade.status)" size="large">
              {{ getStatusText(currentTrade.status) }}
            </Tag>
          </div>
          
          <div class="detail-amount">{{ formatAmount(currentTrade.amount) }}</div>
          
          <div class="detail-info">
            <Cell title="交易单号" :value="currentTrade.trade_no" />
            <Cell title="商户订单号" :value="currentTrade.order_no || '-'" />
            <Cell title="商户名称" :value="currentTrade.merchant_name" />
            <Cell title="交易类型" :value="getTradeTypeText(currentTrade.trade_type)" />
            <Cell title="支付方式" :value="getPaymentMethodText(currentTrade.payment_method)" />
            <Cell title="交易金额" :value="formatAmount(currentTrade.amount)" />
            <Cell title="手续费" :value="`${formatAmount(currentTrade.fee)}（${currentTrade.fee_rate || 0}%）`" />
            <Cell title="实际金额" :value="formatAmount(currentTrade.actual_amount)" />
            <Cell title="支付时间" :value="currentTrade.pay_time || '-'" />
            <Cell title="支付者" :value="currentTrade.payer_name || '-'" />
            <Cell title="支付账号" :value="currentTrade.payer_account || '-'" />
            <Cell title="创建时间" :value="formatDate(currentTrade.created_at)" />
            <Cell title="更新时间" :value="formatDate(currentTrade.updated_at)" />
          </div>
        </div>
      </Popup>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  NavBar, 
  Search, 
  Field,
  DropdownMenu, 
  DropdownItem,
  List, 
  Tag, 
  Loading, 
  Empty, 
  PullRefresh,
  Popup,
  Picker,
  Cell,
  Icon,
  Button,
  showToast,
  showLoadingToast,
  showSuccessToast,
  closeToast
} from 'vant'

const router = useRouter()
const route = useRoute()
const searchValue = ref('')
const loading = ref(true)
const refreshing = ref(false)
const loadingMore = ref(false)
const finished = ref(false)
const tradeList = ref([])
const currentPage = ref(1)
const pageSize = 10
const showMerchantPicker = ref(false)
const showTradeDetail = ref(false)
const currentTrade = ref(null)
const selectedMerchantId = ref('')
const selectedMerchantName = ref('')
const merchantList = ref([])
const showMerchantFilter = ref(true)
const stats = reactive({
  totalCount: 0,
  totalAmount: 0,
  totalFee: 0
})

// 从路由参数中获取商户ID
const merchantId = computed(() => route.query.merchantId)

// 筛选器状态
const filter = reactive({
  status: 'all',
  dateRange: 'all'
})

// 状态选项
const statusOptions = [
  { text: '全部状态', value: 'all' },
  { text: '成功', value: 'success' },
  { text: '处理中', value: 'processing' },
  { text: '待支付', value: 'pending' },
  { text: '失败', value: 'failed' },
  { text: '已关闭', value: 'closed' }
]

// 日期选项
const dateOptions = [
  { text: '全部时间', value: 'all' },
  { text: '今天', value: 'today' },
  { text: '昨天', value: 'yesterday' },
  { text: '最近7天', value: 'last7days' },
  { text: '本月', value: 'thisMonth' }
]

// 商户选择列
const merchantColumns = computed(() => {
  const options = [{ text: '全部商户', value: '' }]
  merchantList.value.forEach(merchant => {
    options.push({
      text: merchant.name,
      value: merchant.id
    })
  })
  return options
})

// 返回上一页
const onClickLeft = () => {
  router.back()
}

// 初始化时检查路由参数
onMounted(async () => {
  await fetchMerchants()
  
  if (merchantId.value) {
    selectedMerchantId.value = merchantId.value
    const merchant = merchantList.value.find(m => m.id === Number(merchantId.value))
    if (merchant) {
      selectedMerchantName.value = merchant.name
      showMerchantFilter.value = false
    }
  }
  
  loadTradeData(true)
})

// 获取商户列表
const fetchMerchants = async () => {
  try {
    // 模拟API请求
    setTimeout(() => {
      // 模拟数据
      merchantList.value = Array.from({ length: 10 }, (_, i) => ({
        id: 10000 + i,
        name: `测试商户${i + 1}`
      }))
    }, 500)
  } catch (error) {
    console.error('获取商户列表失败:', error)
    showToast('获取商户列表失败')
  }
}

// 加载交易数据
const loadTradeData = async (reset = false) => {
  if (reset) {
    tradeList.value = []
    currentPage.value = 1
    finished.value = false
  }
  
  loading.value = true
  
  try {
    // 构建查询参数
    const params = {
      page: currentPage.value,
      limit: pageSize,
      merchant_id: selectedMerchantId.value,
      status: filter.status !== 'all' ? filter.status : undefined,
      keyword: searchValue.value
    }
    
    // 处理日期范围
    if (filter.dateRange !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      let startDate, endDate
      
      switch (filter.dateRange) {
        case 'today':
          startDate = today
          endDate = now
          break
        case 'yesterday':
          startDate = new Date(today)
          startDate.setDate(startDate.getDate() - 1)
          endDate = today
          break
        case 'last7days':
          startDate = new Date(today)
          startDate.setDate(startDate.getDate() - 7)
          endDate = now
          break
        case 'thisMonth':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1)
          endDate = now
          break
      }
      
      if (startDate && endDate) {
        params.start_date = startDate.toISOString().split('T')[0]
        params.end_date = endDate.toISOString().split('T')[0]
      }
    }
    
    // 显示loading提示
    const loadingToast = showLoadingToast({
      message: '加载中...',
      duration: 0,
      forbidClick: true
    });
    
    // 模拟API请求
    setTimeout(() => {
      try {
        // 模拟数据
        const mockTrades = generateMockTrades(10)
        
        if (reset) {
          tradeList.value = mockTrades
          // 模拟统计数据
          stats.totalCount = Math.floor(Math.random() * 200) + 50
          stats.totalAmount = Math.floor(Math.random() * 100000) + 10000
          stats.totalFee = stats.totalAmount * 0.006
        } else {
          tradeList.value = [...tradeList.value, ...mockTrades]
        }
        
        // 模拟分页
        if (currentPage.value >= 3) {
          finished.value = true
        } else {
          currentPage.value++
        }
        
        loading.value = false
        refreshing.value = false
        loadingMore.value = false
        
        // 安全关闭loading提示
        try {
          loadingToast.close()
        } catch (e) {
          closeToast()
        }
      } catch (error) {
        // 确保关闭loading提示
        closeToast()
        console.error('数据处理失败:', error)
        showToast('数据处理失败')
      }
    }, 1000)
  } catch (error) {
    closeToast() // 确保关闭任何可能的toast
    console.error('加载交易数据失败:', error)
    showToast('加载失败，请重试')
    loading.value = false
    refreshing.value = false
    loadingMore.value = false
  }
}

// 搜索交易
const onSearch = () => {
  loadTradeData(true)
}

// 取消搜索
const onCancelSearch = () => {
  searchValue.value = ''
  loadTradeData(true)
}

// 刷新
const onRefresh = () => {
  refreshing.value = true
  loadTradeData(true)
}

// 加载更多
const onLoadMore = () => {
  if (finished.value) return
  
  loadingMore.value = true
  loadTradeData()
}

// 筛选改变
const onFilterChange = () => {
  loadTradeData(true)
}

// 确认商户选择
const onMerchantConfirm = (option) => {
  selectedMerchantId.value = option.value
  selectedMerchantName.value = option.text === '全部商户' ? '' : option.text
  showMerchantPicker.value = false
  loadTradeData(true)
}

// 查看交易详情
const openTradeDetail = (trade) => {
  currentTrade.value = trade
  showTradeDetail.value = true
}

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'success': return 'success'
    case 'processing': return 'primary'
    case 'pending': return 'warning'
    case 'failed': return 'danger'
    case 'closed': return 'default'
    default: return 'default'
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'success': return '成功'
    case 'processing': return '处理中'
    case 'pending': return '待支付'
    case 'failed': return '失败'
    case 'closed': return '已关闭'
    default: return '未知'
  }
}

// 获取支付方式文本
const getPaymentMethodText = (method) => {
  switch (method) {
    case 'wechat': return '微信支付'
    case 'alipay': return '支付宝'
    case 'unionpay': return '银联支付'
    case 'balance': return '余额支付'
    default: return '其他'
  }
}

// 获取交易类型文本
const getTradeTypeText = (type) => {
  switch (type) {
    case 'payment': return '支付'
    case 'refund': return '退款'
    case 'transfer': return '转账'
    default: return '其他'
  }
}

// 格式化金额
const formatAmount = (amount) => {
  return '¥' + (amount ? Number(amount).toFixed(2) : '0.00')
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 生成模拟交易数据
const generateMockTrades = (count) => {
  const trades = []
  const statuses = ['success', 'processing', 'pending', 'failed', 'closed']
  const paymentMethods = ['wechat', 'alipay', 'unionpay', 'balance']
  const tradeTypes = ['payment', 'refund', 'transfer']
  
  for (let i = 0; i < count; i++) {
    const createDate = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000))
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const amount = (Math.random() * 1000 + 100).toFixed(2)
    const feeRate = 0.6
    const fee = (amount * feeRate / 100).toFixed(2)
    const actualAmount = (amount - fee).toFixed(2)
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
    const tradeType = tradeTypes[Math.floor(Math.random() * tradeTypes.length)]
    
    const merchant = selectedMerchantId.value 
      ? { id: selectedMerchantId.value, name: selectedMerchantName.value || `商户${selectedMerchantId.value}` }
      : { id: 10000 + Math.floor(Math.random() * 10), name: `测试商户${Math.floor(Math.random() * 10) + 1}` }
    
    trades.push({
      id: Date.now() + i,
      trade_no: `T${Date.now().toString().substring(5)}${i}`,
      order_no: `O${Date.now().toString().substring(5)}${i}`,
      merchant_id: merchant.id,
      merchant_name: merchant.name,
      amount: amount,
      fee: fee,
      fee_rate: feeRate,
      actual_amount: actualAmount,
      status: status,
      payment_method: paymentMethod,
      trade_type: tradeType,
      pay_time: status === 'success' ? formatDate(createDate) : null,
      payer_name: `用户${Math.floor(Math.random() * 1000) + 1}`,
      payer_account: `account_${Math.floor(Math.random() * 10000) + 1}`,
      created_at: createDate.toISOString(),
      updated_at: new Date(createDate.getTime() + Math.floor(Math.random() * 3600000)).toISOString()
    })
  }
  
  return trades
}
</script>

<style scoped>
.trades-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.content {
  padding: 16px;
  padding-bottom: 60px;
}

.search-filter {
  margin-bottom: 16px;
  position: sticky;
  top: 46px;
  z-index: 10;
  background-color: #f7f8fa;
}

.filter-row {
  margin-top: 8px;
}

.merchant-filter {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  background-color: #fff;
  border-radius: 4px;
  padding: 0 8px;
}

.filter-label {
  flex: none;
  margin-right: 8px;
  color: #646566;
}

.merchant-filter .van-field {
  flex: 1;
}

.filter-options {
  display: flex;
}

.filter-options .van-dropdown-menu {
  flex: 1;
  --van-dropdown-menu-height: 36px;
  border-radius: 4px;
  overflow: hidden;
}

.stats-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stats-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #323233;
}

.stats-grid {
  display: flex;
  justify-content: space-between;
}

.stats-item {
  text-align: center;
  flex: 1;
}

.stats-value {
  font-size: 16px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 12px;
  color: #969799;
}

.trade-list {
  margin-bottom: 16px;
}

.trade-card {
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.trade-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.trade-merchant {
  font-size: 15px;
  font-weight: bold;
  color: #323233;
}

.trade-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.trade-no {
  font-size: 13px;
  color: #646566;
}

.trade-amount {
  font-size: 16px;
  font-weight: bold;
  color: #ff9500;
}

.trade-footer {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #f2f3f5;
  padding-top: 8px;
}

.trade-method {
  font-size: 13px;
  color: #969799;
}

.trade-time {
  font-size: 13px;
  color: #969799;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.detail-popup {
  padding: 20px 16px;
}

.detail-title {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #323233;
}

.detail-status {
  text-align: center;
  margin-bottom: 16px;
}

.detail-amount {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  color: #ff9500;
  margin-bottom: 24px;
}

.detail-info {
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}
</style> 