<template>
  <div class="merchant-settlements">
    <van-nav-bar 
      title="结算记录" 
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
          placeholder="搜索结算单号"
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
        </div>
      </div>
      
      <!-- 汇总卡片 -->
      <div class="summary-card" v-if="settlementSummary">
        <div class="summary-item">
          <div class="label">总结算数</div>
          <div class="value">{{ settlementSummary.total_count || 0 }}笔</div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <div class="label">成功结算</div>
          <div class="value">{{ settlementSummary.success_count || 0 }}笔</div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <div class="label">总金额</div>
          <div class="value">¥{{ settlementSummary.total_amount || '0.00' }}</div>
        </div>
      </div>
      
      <!-- 结算列表 -->
      <div class="settlement-list">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list
            v-model:loading="listLoading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
          >
            <div v-if="settlementList.length === 0 && !listLoading && !loading" class="empty-data">
              <van-empty description="暂无结算记录" />
            </div>
            
            <div v-for="(settlement, index) in settlementList" :key="index" class="settlement-item" @click="viewSettlementDetail(settlement)">
              <div class="settlement-info">
                <div class="name-status">
                  <div class="settlement-name">
                    结算单 #{{ settlement.settlement_no }}
                  </div>
                  <div :class="['settlement-status', getStatusClass(settlement.status)]">
                    {{ getStatusText(settlement.status) }}
                  </div>
                </div>
                <div class="settlement-bank">
                  {{ settlement.bank_name }} | {{ settlement.bank_account_name }}
                </div>
                <div class="settlement-time">{{ settlement.created_at }}</div>
              </div>
              <div class="settlement-amount">
                <div class="amount">¥ {{ settlement.amount }}</div>
              </div>
              <div class="settlement-arrow">
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
          <div class="popup-title">结算状态</div>
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
    
    <!-- 详情弹窗 -->
    <van-popup 
      v-model:show="detailVisible" 
      position="bottom" 
      :style="{ height: '80%' }" 
      round
      closeable
    >
      <div class="detail-popup">
        <div class="detail-title">结算详情</div>
        <div class="detail-content" v-if="currentSettlement">
          <van-cell-group inset>
            <van-cell title="结算单号" :value="currentSettlement.settlement_no" />
            <van-cell title="结算金额">
              <template #value>
                <span class="amount-text">¥{{ currentSettlement.amount }}</span>
              </template>
            </van-cell>
            <van-cell title="结算状态">
              <template #value>
                <van-tag :type="getStatusTagType(currentSettlement.status)">{{ getStatusText(currentSettlement.status) }}</van-tag>
              </template>
            </van-cell>
            <van-cell title="创建时间" :value="currentSettlement.created_at" />
            <van-cell title="结算时间" :value="currentSettlement.settlement_time || '-'" />
          </van-cell-group>
          
          <van-cell-group inset title="银行信息" style="margin-top: 12px;">
            <van-cell title="银行名称" :value="currentSettlement.bank_name" />
            <van-cell title="支行名称" :value="currentSettlement.bank_branch" />
            <van-cell title="开户名" :value="currentSettlement.bank_account_name" />
            <van-cell title="银行账号" :value="currentSettlement.bank_account_no" />
          </van-cell-group>
          
          <van-cell-group inset title="备注信息" style="margin-top: 12px;">
            <van-cell v-if="currentSettlement.remarks">
              <template #title>
                <div style="white-space: pre-wrap;">{{ currentSettlement.remarks }}</div>
              </template>
            </van-cell>
            <van-cell v-else>
              <template #title>
                <div class="empty-remark">暂无备注信息</div>
              </template>
            </van-cell>
          </van-cell-group>
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
import { getMerchantSettlements } from '@/api/merchant'
import { formatDate } from '@/utils/date'

const router = useRouter()
const merchantStore = useMerchantStore()

// 状态变量
const loading = ref(false)
const refreshing = ref(false)
const listLoading = ref(false)
const finished = ref(false)
const settlementList = ref([])
const settlementSummary = ref(null)
const currentPage = ref(1)
const pageSize = 20

// 详情相关
const detailVisible = ref(false)
const currentSettlement = ref(null)

// 筛选相关
const showDatePicker = ref(false)
const showStatusFilter = ref(false)
const selectedDate = ref(['', ''])
const minDate = new Date(new Date().getFullYear() - 1, 0, 1)
const maxDate = new Date()
const currentDateShortcut = ref(0)

// 搜索表单
const searchForm = ref({
  keyword: '',
  status: '',
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
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' }
]

// 日期筛选标签
const dateFilterLabel = computed(() => {
  if (searchForm.value.start_date && searchForm.value.end_date) {
    if (searchForm.value.start_date === searchForm.value.end_date) {
      return searchForm.value.start_date
    }
    return `${searchForm.value.start_date} ~ ${searchForm.value.end_date}`
  }
  return '日期筛选'
})

// 状态筛选标签
const statusFilterLabel = computed(() => {
  const status = statusOptions.find(item => item.value === searchForm.value.status)
  return status ? status.label : '状态筛选'
})

// 初始化
onMounted(() => {
  fetchSettlements()
})

// 返回上一页
const onBack = () => {
  router.back()
}

// 获取结算记录
const fetchSettlements = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      limit: pageSize,
      keyword: searchForm.value.keyword,
      status: searchForm.value.status,
      start_date: searchForm.value.start_date,
      end_date: searchForm.value.end_date
    }
    
    const res = await getMerchantSettlements(params)
    
    if (res.code === 0) {
      if (res.data.summary) {
        settlementSummary.value = res.data.summary
      }
      
      if (refreshing.value) {
        settlementList.value = res.data.items || []
      } else {
        settlementList.value = [...settlementList.value, ...(res.data.items || [])]
      }
      
      // 判断是否加载完成
      if (!res.data.items || res.data.items.length < pageSize) {
        finished.value = true
      } else {
        currentPage.value++
      }
    } else {
      showToast('获取结算记录失败')
    }
  } catch (error) {
    console.error('获取结算记录失败', error)
    showToast('获取结算记录失败')
  } finally {
    loading.value = false
    listLoading.value = false
    refreshing.value = false
  }
}

// 搜索
const onSearch = () => {
  settlementList.value = []
  currentPage.value = 1
  finished.value = false
  fetchSettlements()
}

// 加载更多
const onLoad = () => {
  if (!finished.value) {
    fetchSettlements()
  }
}

// 下拉刷新
const onRefresh = () => {
  finished.value = false
  currentPage.value = 1
  fetchSettlements()
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
    onSearch()
    return
  }
  
  const today = new Date()
  let startDate, endDate
  
  switch (shortcut.value) {
    case 'today':
      startDate = formatDate(today)
      endDate = startDate
      break
    case 'yesterday':
      startDate = formatDate(new Date(today.setDate(today.getDate() - 1)))
      endDate = startDate
      break
    case 'week':
      endDate = formatDate(new Date())
      startDate = formatDate(new Date(today.setDate(today.getDate() - 6)))
      break
    case 'month':
      endDate = formatDate(new Date())
      startDate = formatDate(new Date(today.setDate(today.getDate() - 29)))
      break
    case 'custom':
      showDatePicker.value = true
      return
    default:
      return
  }
  
  searchForm.value.start_date = startDate
  searchForm.value.end_date = endDate
  showDatePicker.value = false
  onSearch()
}

// 日期选择确认
const onDateConfirm = (value) => {
  searchForm.value.start_date = formatDate(value[0])
  searchForm.value.end_date = formatDate(value[1])
  showDatePicker.value = false
  onSearch()
}

// 选择状态
const selectStatus = (status) => {
  searchForm.value.status = status
  showStatusFilter.value = false
  onSearch()
}

// 获取状态类名
const getStatusClass = (status) => {
  const statusMap = {
    pending: 'status-pending',
    processing: 'status-processing',
    success: 'status-success',
    failed: 'status-failed'
  }
  return statusMap[status] || 'status-default'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: '待处理',
    processing: '处理中',
    success: '成功',
    failed: '失败'
  }
  return statusMap[status] || '未知状态'
}

// 获取状态标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    pending: 'warning',
    processing: 'primary',
    success: 'success',
    failed: 'danger'
  }
  return typeMap[status] || 'default'
}

// 查看结算详情
const viewSettlementDetail = (settlement) => {
  currentSettlement.value = settlement
  detailVisible.value = true
}
</script>

<style scoped>
.merchant-settlements {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.content-wrap {
  padding-top: 46px;
  padding-bottom: 20px;
}

.search-area {
  background-color: #fff;
  padding-bottom: 8px;
}

.filter-actions {
  display: flex;
  padding: 0 16px 8px;
}

.filter-item {
  display: flex;
  align-items: center;
  margin-right: 16px;
  font-size: 14px;
  color: #666;
}

.filter-item .van-icon {
  margin-right: 4px;
}

.summary-card {
  margin: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
}

.summary-item {
  flex: 1;
  text-align: center;
}

.summary-divider {
  width: 1px;
  height: 20px;
  background-color: #eee;
}

.summary-item .label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.summary-item .value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.settlement-list {
  padding: 0 12px;
}

.settlement-item {
  margin-bottom: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  position: relative;
}

.settlement-info {
  flex: 1;
}

.name-status {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.settlement-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.settlement-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-pending {
  background-color: #fffbe6;
  color: #faad14;
}

.status-processing {
  background-color: #e6f7ff;
  color: #1890ff;
}

.status-success {
  background-color: #f6ffed;
  color: #52c41a;
}

.status-failed {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.settlement-bank {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.settlement-time {
  font-size: 12px;
  color: #999;
}

.settlement-amount {
  margin-right: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.settlement-amount .amount {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.settlement-arrow {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #ccc;
}

.empty-data {
  margin-top: 80px;
  text-align: center;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.popup-title {
  font-size: 16px;
  font-weight: bold;
}

.popup-close {
  padding: 4px;
}

.date-shortcuts {
  display: flex;
  padding: 8px 16px;
  overflow-x: auto;
}

.shortcut-item {
  flex-shrink: 0;
  margin-right: 8px;
  padding: 6px 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 14px;
}

.shortcut-item.active {
  background-color: #e6f7ff;
  color: #1890ff;
}

.filter-popup {
  padding-bottom: 20px;
}

.filter-content {
  padding: 16px;
}

.filter-option {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  background-color: #f5f5f5;
  font-size: 14px;
}

.filter-option.active {
  background-color: #e6f7ff;
  color: #1890ff;
}

.detail-popup {
  padding: 24px 16px;
}

.detail-title {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
}

.detail-content {
  padding-bottom: 24px;
}

.amount-text {
  font-weight: bold;
  font-size: 16px;
  color: #ff6b00;
}

.empty-remark {
  color: #999;
  font-style: italic;
}
</style> 