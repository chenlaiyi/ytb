<template>
  <div class="merchant-trades">
    <van-nav-bar 
      title="交易记录" 
      left-arrow 
      @click-left="onBack" 
      fixed
    />
    
    <div class="content-wrap">
      <!-- 加载状态 -->
      <van-empty v-if="loading" description="加载中...">
        <template #image>
          <van-loading type="spinner" size="36" />
        </template>
      </van-empty>
      
      <!-- 搜索筛选区域 -->
      <div class="search-area">
        <van-search
          v-model="searchForm.keyword"
          placeholder="搜索交易单号"
          shape="round"
          background="#f7f8fa"
          @search="onSearch"
        />
        
        <div class="filter-actions">
          <div class="filter-item" @click="showDatePicker = true">
            <van-icon name="calendar-o" />
            <span>{{ dateFilterLabel }}</span>
          </div>
          <div class="filter-item" @click="showStatusFilter = true">
            <van-icon name="filter-o" />
            <span>{{ statusFilterLabel }}</span>
          </div>
          <div class="filter-item" @click="showTypeFilter = true">
            <van-icon name="filter-o" />
            <span>{{ typeFilterLabel }}</span>
          </div>
        </div>
      </div>
      
      <!-- 汇总卡片 -->
      <div class="summary-card" v-if="tradeSummary">
        <div class="summary-item">
          <div class="label">总交易数</div>
          <div class="value">{{ tradeSummary.total_count || 0 }}笔</div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <div class="label">总金额</div>
          <div class="value">¥{{ tradeSummary.total_amount || '0.00' }}</div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <div class="label">手续费</div>
          <div class="value">¥{{ tradeSummary.total_fee || '0.00' }}</div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <div class="label">实际收入</div>
          <div class="value">¥{{ tradeSummary.actual_amount || '0.00' }}</div>
        </div>
      </div>
      
      <!-- 友情提示 -->
      <div class="notice-bar">
        <van-notice-bar
          left-icon="info-o"
          scrollable
          background="#ecf9ff"
          text="交易款项由支付公司直接结算到您的账户，平台仅提供交易数据展示"
        />
      </div>
      
      <!-- 交易列表 -->
      <div class="trade-list">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list
            v-model:loading="listLoading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
          >
            <div v-if="tradeList.length === 0 && !listLoading && !loading" class="empty-data">
              <van-empty description="暂无交易记录" />
            </div>
            
            <div v-for="(trade, index) in tradeList" :key="index" class="trade-item" @click="viewTradeDetail(trade)">
              <div class="trade-info">
                <div class="name-status">
                  <div class="trade-name">
                    {{ trade.payment_method === 'wechat' ? '微信支付' : 
                      trade.payment_method === 'alipay' ? '支付宝' : '其他支付' }}
                  </div>
                  <div :class="['trade-status', getStatusClass(trade.status)]">
                    {{ getStatusText(trade.status) }}
                  </div>
                </div>
                <div class="trade-no">单号: {{ trade.trade_no }}</div>
                <div class="trade-time">{{ trade.pay_time }}</div>
              </div>
              <div class="trade-amount">
                <div class="amount">¥ {{ trade.amount }}</div>
                <div class="amount-detail">
                  <span>手续费: ¥{{ trade.fee }}</span>
                </div>
              </div>
              <div class="trade-arrow">
                <van-icon name="arrow" />
              </div>
            </div>
          </van-list>
        </van-pull-refresh>
      </div>
    </div>
    
    <!-- 日期选择器 -->
    <van-popup v-model:show="showDatePicker" position="bottom">
      <div class="popup-header">
        <div class="popup-title">选择日期范围</div>
        <div class="popup-close" @click="showDatePicker = false">
          <van-icon name="cross" />
        </div>
      </div>
      <div class="date-shortcuts">
        <div 
          v-for="(item, index) in dateShortcuts" 
          :key="index"
          :class="['shortcut-item', { active: currentDateShortcut === index }]"
          @click="selectDateShortcut(index)"
        >
          {{ item.label }}
        </div>
      </div>
      <van-date-picker
        v-model="selectedDate"
        type="date-range"
        title="选择日期范围"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>
    
    <!-- 状态筛选器 -->
    <van-popup v-model:show="showStatusFilter" position="bottom" round>
      <div class="filter-popup">
        <div class="popup-header">
          <div class="popup-title">交易状态</div>
          <div class="popup-close" @click="showStatusFilter = false">
            <van-icon name="cross" />
          </div>
        </div>
        <div class="filter-content">
          <div 
            v-for="(status, index) in statusOptions" 
            :key="index"
            :class="['filter-option', { active: searchForm.status === status.value }]"
            @click="selectStatus(status.value)"
          >
            {{ status.label }}
          </div>
        </div>
      </div>
    </van-popup>
    
    <!-- 类型筛选器 -->
    <van-popup v-model:show="showTypeFilter" position="bottom" round>
      <div class="filter-popup">
        <div class="popup-header">
          <div class="popup-title">交易类型</div>
          <div class="popup-close" @click="showTypeFilter = false">
            <van-icon name="cross" />
          </div>
        </div>
        <div class="filter-content">
          <div 
            v-for="(type, index) in typeOptions" 
            :key="index"
            :class="['filter-option', { active: searchForm.trade_type === type.value }]"
            @click="selectType(type.value)"
          >
            {{ type.label }}
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useMerchantStore } from '@/stores/merchant'
import { formatDate } from '@/utils/date'

const router = useRouter()
const merchantStore = useMerchantStore()

// 状态变量
const loading = ref(false)
const refreshing = ref(false)
const listLoading = ref(false)
const finished = ref(false)
const tradeList = ref([])
const tradeSummary = ref(null)
const currentPage = ref(1)
const pageSize = 20

// 筛选相关
const showDatePicker = ref(false)
const showStatusFilter = ref(false)
const showTypeFilter = ref(false)
const selectedDate = ref(['', ''])
const minDate = new Date(new Date().getFullYear() - 1, 0, 1)
const maxDate = new Date()
const currentDateShortcut = ref(0)

// 搜索表单
const searchForm = ref({
  keyword: '',
  status: '',
  trade_type: '',
  start_date: '',
  end_date: '',
  page: 1,
  limit: pageSize
})

// 日期快捷选项
const dateShortcuts = [
  { label: '全部', value: null },
  { label: '今天', value: 'today' },
  { label: '昨天', value: 'yesterday' },
  { label: '最近7天', value: 'week' },
  { label: '最近30天', value: 'month' },
  { label: '自定义', value: 'custom' }
]

// 状态选项
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '交易成功', value: 'success' },
  { label: '处理中', value: 'pending' },
  { label: '交易失败', value: 'failed' },
  { label: '已退款', value: 'refunded' },
  { label: '已关闭', value: 'closed' }
]

// 类型选项
const typeOptions = [
  { label: '全部类型', value: '' },
  { label: '收款', value: 'payment' },
  { label: '退款', value: 'refund' },
  { label: '转账', value: 'transfer' }
]

// 计算属性
const dateFilterLabel = computed(() => {
  if (!searchForm.value.start_date && !searchForm.value.end_date) {
    return '日期筛选'
  }
  
  const shortcut = dateShortcuts[currentDateShortcut.value]
  if (shortcut && shortcut.value !== 'custom') {
    return shortcut.label
  }
  
  return `${searchForm.value.start_date} ~ ${searchForm.value.end_date}`
})

const statusFilterLabel = computed(() => {
  if (!searchForm.value.status) {
    return '状态筛选'
  }
  
  const option = statusOptions.find(item => item.value === searchForm.value.status)
  return option ? option.label : '状态筛选'
})

const typeFilterLabel = computed(() => {
  if (!searchForm.value.trade_type) {
    return '类型筛选'
  }
  
  const option = typeOptions.find(item => item.value === searchForm.value.trade_type)
  return option ? option.label : '类型筛选'
})

// 返回上一页
const onBack = () => {
  router.back()
}

// 搜索
const onSearch = () => {
  resetList()
  loadTradeList()
}

// 刷新
const onRefresh = () => {
  resetList()
  loadTradeList()
}

// 加载更多
const onLoad = () => {
  currentPage.value++
  searchForm.value.page = currentPage.value
  loadTradeList(true)
}

// 重置列表
const resetList = () => {
  currentPage.value = 1
  searchForm.value.page = 1
  tradeList.value = []
  finished.value = false
}

// 查看交易详情
const viewTradeDetail = (trade) => {
  router.push({
    name: 'MerchantTradeDetail',
    params: { tradeNo: trade.trade_no }
  })
}

// 获取交易状态文本
const getStatusText = (status) => {
  const statusMap = {
    'success': '交易成功',
    'pending': '处理中',
    'failed': '交易失败',
    'refunded': '已退款',
    'closed': '已关闭'
  }
  return statusMap[status] || '未知状态'
}

// 获取状态样式类
const getStatusClass = (status) => {
  const classMap = {
    'success': 'status-success',
    'pending': 'status-pending',
    'failed': 'status-failed',
    'refunded': 'status-refunded',
    'closed': 'status-closed'
  }
  return classMap[status] || ''
}

// 选择日期快捷方式
const selectDateShortcut = (index) => {
  currentDateShortcut.value = index
  const shortcut = dateShortcuts[index]
  
  if (!shortcut.value) {
    // 全部
    searchForm.value.start_date = ''
    searchForm.value.end_date = ''
    showDatePicker.value = false
    resetList()
    loadTradeList()
    return
  }
  
  const now = new Date()
  let startDate, endDate
  
  switch (shortcut.value) {
    case 'today':
      startDate = formatDate(now, 'YYYY-MM-DD')
      endDate = formatDate(now, 'YYYY-MM-DD')
      break
    case 'yesterday':
      startDate = formatDate(new Date(now.setDate(now.getDate() - 1)), 'YYYY-MM-DD')
      endDate = startDate
      break
    case 'week':
      startDate = formatDate(new Date(now.setDate(now.getDate() - 6)), 'YYYY-MM-DD')
      endDate = formatDate(new Date(), 'YYYY-MM-DD')
      break
    case 'month':
      startDate = formatDate(new Date(now.setDate(now.getDate() - 29)), 'YYYY-MM-DD')
      endDate = formatDate(new Date(), 'YYYY-MM-DD')
      break
    case 'custom':
      // 自定义不做处理
      return
    default:
      startDate = ''
      endDate = ''
  }
  
  if (shortcut.value !== 'custom') {
    searchForm.value.start_date = startDate
    searchForm.value.end_date = endDate
    showDatePicker.value = false
    resetList()
    loadTradeList()
  }
}

// 选择状态
const selectStatus = (status) => {
  searchForm.value.status = status
  showStatusFilter.value = false
  resetList()
  loadTradeList()
}

// 选择类型
const selectType = (type) => {
  searchForm.value.trade_type = type
  showTypeFilter.value = false
  resetList()
  loadTradeList()
}

// 日期确认
const onDateConfirm = (values) => {
  const [startDate, endDate] = values
  searchForm.value.start_date = formatDate(startDate, 'YYYY-MM-DD')
  searchForm.value.end_date = formatDate(endDate, 'YYYY-MM-DD')
  currentDateShortcut.value = 5 // 设置为自定义
  showDatePicker.value = false
  resetList()
  loadTradeList()
}

// 加载交易列表
const loadTradeList = async (append = false) => {
  if (!append) {
    loading.value = true
  }
  listLoading.value = true
  
  try {
    // 确保查询参数干净
    const params = { ...searchForm.value }
    Object.keys(params).forEach(key => {
      if (params[key] === '') {
        delete params[key]
      }
    })
    
    const res = await merchantStore.fetchTradeList(params)
    
    if (res) {
      if (append) {
        tradeList.value = [...tradeList.value, ...res.items]
      } else {
        tradeList.value = res.items
      }
      
      tradeSummary.value = res.summary
      
      if (res.items.length < pageSize) {
        finished.value = true
      }
    } else {
      showToast('获取交易记录失败')
      finished.value = true
    }
  } catch (error) {
    console.error('获取交易记录失败', error)
    showToast('获取交易记录失败')
    finished.value = true
  } finally {
    refreshing.value = false
    listLoading.value = false
    loading.value = false
  }
}

// 初始化
onMounted(async () => {
  // 默认加载最近1个月的数据
  selectDateShortcut(4)
})
</script>

<style scoped>
.merchant-trades {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.content-wrap {
  padding-top: 46px;
  padding-bottom: 30px;
}

.search-area {
  padding: 10px 0 0;
}

.filter-actions {
  display: flex;
  padding: 0 15px 10px;
}

.filter-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  margin-right: 10px;
  background-color: #fff;
  border-radius: 16px;
  font-size: 12px;
  color: #646566;
}

.filter-item .van-icon {
  margin-right: 3px;
  font-size: 14px;
}

.summary-card {
  margin: 0 15px 10px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(100, 101, 102, 0.08);
  display: flex;
  padding: 10px 0;
}

.summary-item {
  flex: 1;
  text-align: center;
  padding: 5px 0;
}

.summary-divider {
  width: 1px;
  background-color: #f2f2f2;
  margin: 5px 0;
}

.summary-item .label {
  font-size: 12px;
  color: #646566;
  margin-bottom: 4px;
}

.summary-item .value {
  font-size: 14px;
  font-weight: bold;
  color: #323233;
}

.notice-bar {
  margin: 0 15px 10px;
}

.trade-list {
  margin: 0 15px;
}

.empty-data {
  padding: 30px 0;
}

.trade-item {
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 10px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(100, 101, 102, 0.05);
  display: flex;
  position: relative;
}

.trade-info {
  flex: 1;
}

.name-status {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 5px;
}

.trade-name {
  font-size: 15px;
  font-weight: bold;
  color: #323233;
}

.trade-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.status-success {
  color: #07c160;
  background-color: rgba(7, 193, 96, 0.1);
}

.status-pending {
  color: #ff976a;
  background-color: rgba(255, 151, 106, 0.1);
}

.status-failed {
  color: #ee0a24;
  background-color: rgba(238, 10, 36, 0.1);
}

.status-refunded {
  color: #1989fa;
  background-color: rgba(25, 137, 250, 0.1);
}

.status-closed {
  color: #969799;
  background-color: rgba(150, 151, 153, 0.1);
}

.trade-no {
  font-size: 12px;
  color: #646566;
  margin-bottom: 3px;
}

.trade-time {
  font-size: 12px;
  color: #969799;
}

.trade-amount {
  text-align: right;
  margin-right: 15px;
}

.trade-amount .amount {
  font-size: 16px;
  font-weight: bold;
  color: #323233;
  margin-bottom: 5px;
}

.trade-amount .amount-detail {
  font-size: 12px;
  color: #969799;
}

.trade-arrow {
  display: flex;
  align-items: center;
  color: #c8c9cc;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f2f2f2;
}

.popup-title {
  font-size: 16px;
  font-weight: bold;
  color: #323233;
}

.popup-close {
  padding: 5px;
}

.date-shortcuts {
  display: flex;
  padding: 10px 15px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.shortcut-item {
  flex-shrink: 0;
  padding: 5px 12px;
  margin-right: 8px;
  border-radius: 16px;
  font-size: 13px;
  color: #646566;
  background-color: #f7f8fa;
}

.shortcut-item.active {
  color: #fff;
  background-color: #1989fa;
}

.filter-popup {
  padding-bottom: 15px;
}

.filter-content {
  padding: 10px 15px;
}

.filter-option {
  padding: 12px 0;
  font-size: 14px;
  color: #323233;
  border-bottom: 1px solid #f2f2f2;
}

.filter-option:last-child {
  border-bottom: none;
}

.filter-option.active {
  color: #1989fa;
}
</style> 