<template>
  <div class="ytb-commission">
    <van-nav-bar title="分佣记录" left-arrow @click-left="goBack" />

    <!-- 统计卡片 -->
    <div class="stats-card">
      <div class="stats-main">
        <div class="stat-item main">
          <div class="stat-label">可提现余额</div>
          <div class="stat-value">{{ formatMoney(stats.available_balance) }}</div>
        </div>
        <van-button 
          type="primary" 
          size="small" 
          round 
          class="withdraw-btn"
          @click="goToWithdraw"
        >
          立即提现
        </van-button>
      </div>
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-value small">{{ formatMoney(stats.total_settled) }}</div>
          <div class="stat-label">已结算</div>
        </div>
        <div class="stat-item">
          <div class="stat-value small">{{ formatMoney(stats.total_pending) }}</div>
          <div class="stat-label">待结算</div>
        </div>
        <div class="stat-item">
          <div class="stat-value small">{{ formatMoney(stats.total_withdrawn) }}</div>
          <div class="stat-label">已提现</div>
        </div>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="filter-bar">
      <van-dropdown-menu>
        <van-dropdown-item v-model="filters.status" :options="statusOptions" @change="loadCommissions" />
      </van-dropdown-menu>
    </div>

    <!-- 分佣列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
      >
        <div class="commission-list">
          <div class="commission-item" v-for="item in commissions" :key="item.id">
            <div class="commission-main">
              <div class="commission-info">
                <div class="commission-title">
                  {{ item.from_user?.nickname || '用户' }}升级分佣
                </div>
                <div class="commission-time">{{ item.created_at }}</div>
              </div>
              <div class="commission-amount">+{{ formatMoney(item.amount) }}</div>
            </div>
            <div class="commission-footer">
              <van-tag :type="getStatusType(item.status)" size="small">
                {{ item.status_name }}
              </van-tag>
              <span class="settled-time" v-if="item.settled_at">
                结算时间：{{ item.settled_at }}
              </span>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <van-empty v-if="!loading && commissions.length === 0" description="暂无分佣记录" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getUserInfo, getCommissions, isLoggedIn } from '@/api/ytb'
import { useYtbShare } from '@/composables/useYtbShare'

// 设置亿拓宝分享配置
useYtbShare('亿拓宝联盟 - 分佣记录')

const router = useRouter()

// 状态
const stats = ref({
  total_settled: 0,
  total_pending: 0,
  available_balance: 0,
  total_withdrawn: 0
})
const commissions = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const perPage = 20

const filters = reactive({
  status: ''
})

const statusOptions = [
  { text: '全部状态', value: '' },
  { text: '待结算', value: 'pending' },
  { text: '已结算', value: 'settled' },
  { text: '已取消', value: 'cancelled' }
]

// 初始化
onMounted(async () => {
  if (!isLoggedIn()) {
    router.replace('/login')
    return
  }

  await loadStats()
  await loadCommissions()
})

// 加载统计
const loadStats = async () => {
  try {
    const res = await getUserInfo()
    if (res.code === 0) {
      const commissionStats = res.data.commission_stats || {}
      stats.value = {
        total_settled: commissionStats.total_settled || 0,
        total_pending: commissionStats.total_pending || 0,
        available_balance: res.data.available_balance || 0,
        total_withdrawn: res.data.total_withdrawn || 0
      }
    }
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

// 加载分佣记录
const loadCommissions = async () => {
  page.value = 1
  finished.value = false
  commissions.value = []
  await loadMore()
}

// 加载更多
const loadMore = async () => {
  if (loading.value) return
  
  loading.value = true
  try {
    const res = await getCommissions({
      page: page.value,
      per_page: perPage,
      status: filters.status
    })
    
    if (res.code === 0) {
      const list = res.data.list || []
      if (page.value === 1) {
        commissions.value = list
      } else {
        commissions.value.push(...list)
      }
      
      if (list.length < perPage) {
        finished.value = true
      } else {
        page.value++
      }
    }
  } catch (error) {
    console.error('获取分佣记录失败:', error)
    finished.value = true
  } finally {
    loading.value = false
  }
}

// 下拉刷新
const onRefresh = async () => {
  await loadStats()
  await loadCommissions()
  refreshing.value = false
}

// 格式化金额
const formatMoney = (value) => {
  return parseFloat(value || 0).toFixed(2)
}

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'settled': return 'success'
    case 'cancelled': return 'default'
    default: return 'warning'
  }
}

// 跳转到提现页面
const goToWithdraw = () => router.push('/withdraw')

// 返回
const goBack = () => router.back()
</script>

<style scoped>
.ytb-commission {
  min-height: 100vh;
  background: #f5f5f5;
}

.stats-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
}

.stats-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  color: white;
}

.stat-item.main {
  text-align: left;
}

.stat-item.main .stat-label {
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-item.main .stat-value {
  font-size: 32px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
}

.stat-value.small {
  font-size: 18px;
}

.stat-value::before {
  content: '¥';
  font-size: 14px;
}

.stat-item.main .stat-value::before {
  font-size: 18px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 4px;
}

.withdraw-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.stats-row {
  display: flex;
  justify-content: space-around;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.filter-bar {
  background: white;
}

.commission-list {
  padding: 12px;
}

.commission-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.commission-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.commission-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.commission-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.commission-amount {
  font-size: 18px;
  font-weight: bold;
  color: #ff6b6b;
}

.commission-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
  display: flex;
  align-items: center;
  gap: 12px;
}

.settled-time {
  font-size: 12px;
  color: #999;
}
</style>
