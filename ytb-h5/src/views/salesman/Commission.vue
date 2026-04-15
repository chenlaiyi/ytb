<template>
  <div class="commission-page">
    <van-nav-bar
      title="佣金记录"
      left-arrow
      @click-left="onClickLeft"
    />
    
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <van-dropdown-menu>
        <van-dropdown-item v-model="timeRange" :options="timeOptions" @change="refreshList" />
      </van-dropdown-menu>
    </div>
    
    <div class="content">
      <!-- 佣金统计 -->
      <div class="commission-summary">
        <div class="summary-item">
          <div class="summary-label">本月佣金</div>
          <div class="summary-value">¥{{ summary.monthAmount || '0.00' }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">待结算</div>
          <div class="summary-value">¥{{ summary.pendingAmount || '0.00' }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">累计佣金</div>
          <div class="summary-value">¥{{ summary.totalAmount || '0.00' }}</div>
        </div>
      </div>
    
      <!-- 佣金列表 -->
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多记录了"
        @load="onLoad"
        v-if="commissionList.length > 0"
      >
        <van-cell-group inset v-for="(item, index) in commissionList" :key="index">
          <van-cell>
            <template #title>
              <div class="commission-title">
                <span>{{ item.title }}</span>
                <span :class="['commission-amount', item.type === 'income' ? 'income' : 'payout']">
                  {{ item.type === 'income' ? '+' : '-' }}¥{{ item.amount }}
                </span>
              </div>
            </template>
            <template #label>
              <div class="commission-detail">
                <div>订单号: {{ item.orderNo || '-' }}</div>
                <div>客户: {{ item.customerName }}</div>
                <div>时间: {{ formatDate(item.createTime) }}</div>
                <div>状态: <van-tag :type="getStatusType(item.status)">{{ getStatusText(item.status) }}</van-tag></div>
              </div>
            </template>
          </van-cell>
        </van-cell-group>
      </van-list>
      
      <!-- 空状态 -->
      <van-empty description="暂无佣金记录" v-if="!loading && commissionList.length === 0" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar as VanNavBar, Empty as VanEmpty, List as VanList,
  Cell as VanCell, CellGroup as VanCellGroup, Tag as VanTag,
  DropdownMenu as VanDropdownMenu, DropdownItem as VanDropdownItem,
  showToast } from 'vant'
import { getSalesmanCommission } from '@/api/user'

const router = useRouter()
const loading = ref(false)
const finished = ref(false)
const commissionList = ref([])
const currentPage = ref(1)
const pageSize = 10
const timeRange = ref('all')

// 时间筛选选项
const timeOptions = [
  { text: '全部', value: 'all' },
  { text: '本月', value: 'month' },
  { text: '本周', value: 'week' }
]

// 佣金汇总数据
const summary = ref({
  monthAmount: '0.00',
  pendingAmount: '0.00',
  totalAmount: '0.00'
})

const onClickLeft = () => {
  router.back()
}

// 刷新列表
const refreshList = () => {
  currentPage.value = 1
  commissionList.value = []
  finished.value = false
  loading.value = true
  onLoad()
}

// 加载佣金数据
const onLoad = async () => {
  try {
    const res = await getSalesmanCommission({
      page: currentPage.value,
      pageSize: pageSize,
      timeRange: timeRange.value
    })
    
    if (res.code === 0) {
      // 更新汇总数据
      if (currentPage.value === 1 && res.data.summary) {
        summary.value = res.data.summary
      }
      
      // 添加到列表中
      commissionList.value = [...commissionList.value, ...res.data.list || []]
      
      // 判断是否还有更多数据
      if (!res.data.list || res.data.list.length < pageSize) {
        finished.value = true
      } else {
        currentPage.value++
      }
    } else {
      finished.value = true
      showToast(res.message || '获取佣金记录失败')
    }
  } catch (error) {
    console.error('获取佣金记录失败', error)
    showToast('获取佣金记录失败，请稍后重试')
    finished.value = true
  }
  
  // 结束加载状态
  loading.value = false
}

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'settled': return 'success'
    case 'pending': return 'warning'
    case 'cancelled': return 'danger'
    default: return 'primary'
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'settled': return '已结算'
    case 'pending': return '待结算'
    case 'cancelled': return '已取消'
    default: return '未知'
  }
}

// 初始化页面
onMounted(() => {
  refreshList()
})
</script>

<style scoped>
.commission-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.filter-bar {
  position: sticky;
  top: 46px;
  z-index: 10;
  background-color: #fff;
}

.content {
  padding: 16px;
}

.commission-summary {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  box-shadow: 0 2px 12px rgba(100, 101, 102, 0.08);
}

.summary-item {
  text-align: center;
  flex: 1;
}

.summary-label {
  font-size: 12px;
  color: #646566;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 16px;
  font-weight: bold;
  color: #323233;
}

.commission-title {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
}

.commission-amount {
  font-weight: bold;
}

.income {
  color: #07c160;
}

.payout {
  color: #ee0a24;
}

.commission-detail {
  line-height: 1.6;
}
</style> 