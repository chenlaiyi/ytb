<template>
  <div class="dividend-history-page">
    <!-- 导航栏 -->
    <van-nav-bar
      title="分红历史"
      left-text="返回"
      left-arrow
      @click-left="$router.go(-1)"
      fixed
      placeholder
    />

    <!-- 统计卡片 -->
    <div class="stats-card">
      <div class="stats-header">
        <h3>累计分红收益</h3>
        <span class="total-amount">¥{{ totalDividend }}</span>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">{{ vipDividendCount }}</span>
          <span class="stat-label">VIP分红次数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ rechargeDividendCount }}</span>
          <span class="stat-label">充值分红次数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ avgMonthlyDividend }}</span>
          <span class="stat-label">月均分红</span>
        </div>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filter-section">
      <van-dropdown-menu>
        <van-dropdown-item 
          v-model="filterType" 
          :options="typeOptions"
          @change="onFilterChange"
        />
        <van-dropdown-item 
          v-model="filterMonth" 
          :options="monthOptions"
          @change="onFilterChange"
        />
      </van-dropdown-menu>
    </div>

    <!-- 分红记录列表 -->
    <div class="dividend-list">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div 
            v-for="item in dividendList" 
            :key="item.id"
            class="dividend-item"
            @click="viewDividendDetail(item)"
          >
            <div class="dividend-header">
              <div class="dividend-type">
                <van-icon 
                  :name="item.type === 'vip' ? 'friends' : 'shop'" 
                  :color="item.type === 'vip' ? '#ff9500' : '#52c41a'"
                />
                <span class="type-text">{{ item.typeName }}</span>
              </div>
              <span class="dividend-amount">+¥{{ item.amount }}</span>
            </div>
            
            <div class="dividend-info">
              <p class="dividend-level">{{ item.levelName }} · {{ item.date }}</p>
              <p class="dividend-desc">{{ item.description }}</p>
            </div>
            
            <div class="dividend-footer">
              <span class="dividend-status" :class="item.statusClass">
                {{ item.statusText }}
              </span>
              <van-icon name="arrow" class="arrow-icon" />
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 空状态 -->
    <van-empty 
      v-if="!loading && dividendList.length === 0"
      image="search"
      description="暂无分红记录"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from 'vant'
import { getVipDividends } from '@/api/vip'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const dividendList = ref([])
const page = ref(1)
const pageSize = 20

// 筛选条件
const filterType = ref('all')
const filterMonth = ref('all')

// 统计数据
const totalDividend = ref('0.00')
const vipDividendCount = ref(0)
const rechargeDividendCount = ref(0)

// 筛选选项
const typeOptions = [
  { text: '全部类型', value: 'all' },
  { text: 'VIP分红', value: 'vip' },
  { text: '充值分红', value: 'recharge' }
]

const monthOptions = [
  { text: '全部月份', value: 'all' },
  { text: '本月', value: new Date().toISOString().slice(0, 7) },
  { text: '上月', value: new Date(Date.now() - 30*24*60*60*1000).toISOString().slice(0, 7) },
  { text: '近3个月', value: '3months' },
  { text: '近6个月', value: '6months' }
]

// 计算平均月分红
const avgMonthlyDividend = computed(() => {
  const total = parseFloat(totalDividend.value)
  const months = Math.max(1, vipDividendCount.value + rechargeDividendCount.value)
  return (total / months).toFixed(0)
})

// 加载分红记录
const loadDividends = async (isRefresh = false) => {
  if (loading.value) return

  loading.value = true
  
  try {
    const params = {
      page: isRefresh ? 1 : page.value,
      page_size: pageSize,
      type: filterType.value !== 'all' ? filterType.value : undefined,
      month: filterMonth.value !== 'all' ? filterMonth.value : undefined
    }

    const res = await getVipDividends(params)
    
    if (res.code === 0) {
      const data = res.data
      
      if (isRefresh) {
        dividendList.value = data.list || []
        page.value = 1
      } else {
        dividendList.value.push(...(data.list || []))
      }
      
      // 更新统计数据
      if (data.stats) {
        totalDividend.value = data.stats.total_amount || '0.00'
        vipDividendCount.value = data.stats.vip_count || 0
        rechargeDividendCount.value = data.stats.recharge_count || 0
      }
      
      // 检查是否还有更多数据
      finished.value = !data.has_more
      
      if (!isRefresh) {
        page.value++
      }
      
      // 格式化数据
      dividendList.value = dividendList.value.map(item => ({
        ...item,
        typeName: item.type === 'vip' ? 'VIP招募分红' : '充值设备分红',
        levelName: getLevelName(item.level),
        statusClass: getStatusClass(item.status),
        statusText: getStatusText(item.status),
        date: formatDate(item.created_at)
      }))
      
    } else {
      Toast({ type: 'fail', message: res.message || '获取分红记录失败' })
    }
  } catch (error) {
    console.error('获取分红记录失败:', error)
    Toast({ type: 'fail', message: '网络错误，请重试' })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 获取等级名称
const getLevelName = (level) => {
  const levelMap = {
    'junior': '初级分红',
    'middle': '中级分红',
    'senior': '高级分红'
  }
  return levelMap[level] || '未知等级'
}

// 获取状态样式类
const getStatusClass = (status) => {
  const classMap = {
    'pending': 'status-pending',
    'paid': 'status-paid',
    'failed': 'status-failed'
  }
  return classMap[status] || 'status-pending'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'pending': '待发放',
    'paid': '已发放',
    'failed': '发放失败'
  }
  return textMap[status] || '未知状态'
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

// 筛选条件变化
const onFilterChange = () => {
  dividendList.value = []
  page.value = 1
  finished.value = false
  loadDividends(true)
}

// 下拉刷新
const onRefresh = () => {
  finished.value = false
  loadDividends(true)
}

// 上拉加载
const onLoad = () => {
  if (!finished.value) {
    loadDividends()
  }
}

// 查看分红详情
const viewDividendDetail = (item) => {
  router.push({
    name: 'VipDividendDetail',
    params: { id: item.id }
  })
}

// 页面初始化
onMounted(() => {
  loadDividends(true)
})
</script>

<style scoped>
.dividend-history-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 20px;
}

/* 统计卡片 */
.stats-card {
  background: linear-gradient(135deg, #ff9500, #ff6b35);
  margin: 15px;
  border-radius: 12px;
  padding: 20px;
  color: white;
}

.stats-header {
  text-align: center;
  margin-bottom: 20px;
}

.stats-header h3 {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 10px 0;
  opacity: 0.9;
}

.total-amount {
  font-size: 32px;
  font-weight: 700;
}

.stats-grid {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

/* 筛选器 */
.filter-section {
  margin: 0 15px 15px 15px;
}

/* 分红记录列表 */
.dividend-list {
  margin: 0 15px;
}

.dividend-item {
  background: white;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
}

.dividend-item:active {
  transform: scale(0.98);
}

.dividend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.dividend-type {
  display: flex;
  align-items: center;
}

.dividend-type .van-icon {
  margin-right: 8px;
  font-size: 18px;
}

.type-text {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.dividend-amount {
  font-size: 18px;
  font-weight: 700;
  color: #ff9500;
}

.dividend-info {
  margin-bottom: 10px;
}

.dividend-level {
  font-size: 14px;
  color: #666;
  margin: 0 0 5px 0;
}

.dividend-desc {
  font-size: 13px;
  color: #999;
  margin: 0;
  line-height: 1.4;
}

.dividend-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dividend-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background: #fff7e6;
  color: #fa8c16;
}

.status-paid {
  background: #f6ffed;
  color: #52c41a;
}

.status-failed {
  background: #fff2f0;
  color: #ff4d4f;
}

.arrow-icon {
  color: #ccc;
  font-size: 14px;
}

/* 空状态 */
.van-empty {
  margin-top: 50px;
}
</style> 