<template>
  <div class="filter-alerts-container">
    <!-- 头部导航 -->
    <NavBar title="全部滤芯预警" left-arrow @click-left="$router.go(-1)" />

    <PullRefresh v-model="refreshing" @refresh="onRefresh">
      <div class="content">
        <!-- 统计卡片 -->
        <div class="stats-card">
          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-number">{{ stats.total_count }}</div>
              <div class="stat-label">总预警</div>
            </div>
            <div class="stat-item">
              <div class="stat-number pending">{{ stats.pending_count }}</div>
              <div class="stat-label">待处理</div>
            </div>
            <div class="stat-item">
              <div class="stat-number processed">{{ stats.processed_count }}</div>
              <div class="stat-label">已处理</div>
            </div>
          </div>
        </div>

        <!-- 筛选栏 -->
        <div class="filter-bar">
          <div class="filter-tabs">
            <div 
              class="filter-tab" 
              :class="{ active: currentStatus === '' }"
              @click="filterByStatus('')"
            >
              全部
            </div>
            <div 
              class="filter-tab" 
              :class="{ active: currentStatus === '01' }"
              @click="filterByStatus('01')"
            >
              待处理
            </div>
            <div 
              class="filter-tab" 
              :class="{ active: currentStatus === '03' }"
              @click="filterByStatus('03')"
            >
              已完成
            </div>
          </div>
        </div>

        <!-- 工单列表 -->
        <div class="order-list" v-if="orders.length > 0">
          <div 
            class="order-item" 
            v-for="order in orders" 
            :key="order.id"
            @click="goToOrderDetailByDevice(order.device_number)"
          >
            <div class="order-header">
              <div class="order-info">
                <span class="device-number">{{ order.device_number }}</span>
                <span class="status-tag" :class="getStatusClass(order.work_status)">
                  {{ order.work_status_name }}
                </span>
              </div>
              <div class="urgency-tag" :class="getUrgencyClass(order.urgency)">
                {{ order.urgency === 'critical' ? '紧急' : '一般' }}
              </div>
            </div>
            
            <div class="client-info">
              <div class="client-name">{{ order.client_name }}</div>
              <div class="client-phone">{{ order.client_phone }}</div>
            </div>
            
            <div class="address">{{ order.address }}</div>
            
            <div class="filter-status">
              <div class="filter-item">
                <span class="filter-label">PP棉:</span>
                <span class="filter-percentage" :style="{ color: getFilterColor(order.pp_percentage) }">
                  {{ order.pp_percentage }}%
                </span>
              </div>
              <div class="filter-item">
                <span class="filter-label">RO膜:</span>
                <span class="filter-percentage" :style="{ color: getFilterColor(order.ro_percentage) }">
                  {{ order.ro_percentage }}%
                </span>
              </div>
              <div class="filter-item">
                <span class="filter-label">CTO:</span>
                <span class="filter-percentage" :style="{ color: getFilterColor(order.cto_percentage) }">
                  {{ order.cto_percentage }}%
                </span>
              </div>
            </div>
            
            <div class="order-footer">
              <span class="create-time">{{ order.create_date }}</span>
              <Icon name="arrow" class="arrow-icon" />
            </div>
          </div>
        </div>

        <!-- 空/错误状态 -->
        <div class="empty-state" v-else-if="!loading">
          <Icon name="info-o" size="60" color="#ddd" />
          <div class="empty-text" v-if="!errorMessage">暂无滤芯预警工单</div>
          <div class="empty-text" v-else>获取数据失败：{{ errorMessage }}</div>
          <div style="margin-top:12px;">
            <Button type="primary" size="small" @click="onRefresh">重试</Button>
          </div>
        </div>

        <!-- 加载更多 -->
        <div class="load-more" v-if="hasMore && !loading">
          <Button 
            type="primary" 
            size="small" 
            @click="loadMore"
            :loading="loadingMore"
          >
            加载更多
          </Button>
        </div>
      </div>
    </PullRefresh>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, PullRefresh, Icon, Button, showToast } from 'vant'
import { getAllFilterAlerts, getFilterAlertStats } from '@/api/engineer'

const router = useRouter()

// 响应式数据
const refreshing = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)
const currentStatus = ref('')
const errorMessage = ref('')

const stats = reactive({
  total_count: 0,
  pending_count: 0,
  processed_count: 0
})

const orders = ref([])

// 基于已加载数据推导本地统计（紧急）
const deriveLocalStats = () => {
  const list = Array.isArray(orders.value) ? orders.value : []
  const crit = list.filter(isCritical)
  const total = crit.length
  let pending = 0
  let processed = 0
  for (const o of crit) {
    const sn = (o?.status_name ?? o?.status ?? '').toString().toLowerCase()
    const doneBool = o?.is_done === true || String(o?.is_done).toLowerCase() === 'true'
    const done =
      doneBool ||
      sn.includes('已处理') ||
      sn.includes('完成') ||
      sn === 'done' ||
      sn === 'processed' ||
      sn === 'resolved'
    if (done) processed++
    else pending++
  }
  return { total, pending, processed }
}

// 统一紧急判定（兼容多种后端口径）
const isCritical = (o) => {
  if (!o || typeof o !== 'object') return false
  const txt = (v) => (v ?? '').toString().toLowerCase()
  // 1) 直接文本口径
  const urg = txt(o.urgency)
  const pri = txt(o.priority)
  const statusName = txt(o.status_name)
  if (urg === 'critical' || urg === '紧急' || pri === 'high' || pri === '紧急') return true
  if (statusName.includes('紧急') || statusName.includes('告警') || statusName.includes('预警')) return true
  // 2) 数值/布尔口径
  const levelVals = [o.urgency_level, o.priority_level].map(v => Number.isFinite(+v) ? +v : null)
  if (levelVals.some(v => v !== null && v <= 1)) return true
  if (o.is_urgent === true || txt(o.is_urgent) === 'true') return true
  // 3) 阈值口径（寿命/百分比）
  const pctCandidates = [
    o.percentage, o.left_percentage,
    o.pp_percentage, o.ro_percentage, o.cto_percentage,
    o.filter_percentage, o.filter_left_percentage
  ].map(v => Number.isFinite(+v) ? +v : null)
  if (pctCandidates.some(v => v !== null && v <= 10)) return true
  const life = Number.isFinite(+o.min_filter_life) ? +o.min_filter_life : null
  if (life !== null && life <= 5) return true
  return false
}

// 详情跳转（按8位设备编号）
const goToOrderDetailByDevice = (deviceNo) => {
  const n = String(deviceNo || '').trim()
  const is8Digits = /^\d{8}$/.test(n)
  if (!is8Digits) {
    showToast('设备编号无效，需为8位数字')
    return
  }
  // 假设详情路由按设备编号
  // 可根据现有路由调整为实际路径
  // 例如：/engineer/filter-alert-device/:device_number
  window.location.hash = `#/engineer/filter-alert-device/${n}`
}

// 获取数据
const fetchData = async (page = 1, status = '', append = false) => {
  try {
    errorMessage.value = ''
    if (page === 1) {
      loading.value = true
    } else {
      loadingMore.value = true
    }

    // 参数兜底
    const params = {
      page: Number(page) > 0 ? Number(page) : 1,
      per_page: 15,
      status: status || '',
      urgency: 'critical' // 仅请求紧急
    }

    // 首屏并行请求 统计 + 列表；翻页仅请求列表
    let listPromise = getAllFilterAlerts(params)
    let statsPromise = page === 1 ? getFilterAlertStats(params) : null

    const [listRes, statsRes] = await Promise.all([
      listPromise.catch(e => e?.response || e),
      statsPromise ? statsPromise.catch(e => e?.response || e) : Promise.resolve(null)
    ])

    // 处理列表响应（兼容无 code 的返回）
    const listDataWrapper = listRes?.data || listRes
    const isOkList = (typeof listDataWrapper?.code === 'number' ? listDataWrapper.code === 200 : true)
    const listData = (typeof listDataWrapper?.code === 'number') ? (listDataWrapper.data || {}) : (listDataWrapper || {})
    if (isOkList) {
      let newOrders = Array.isArray(listData.orders) ? listData.orders : []
      // 兜底过滤，仅保留紧急工单（扩展多口径）
      newOrders = newOrders.filter(isCritical)
      if (append) {
        orders.value.push(...newOrders)
      } else {
        orders.value = newOrders
      }
      // 使用本地已加载数据先行更新统计，避免展示为0
      const local = deriveLocalStats()
      stats.total_count = local.total
      stats.pending_count = local.pending
      stats.processed_count = local.processed

      const pg = listData.pagination || {}
      currentPage.value = pg.current_page || params.page
      hasMore.value = (pg.last_page ? currentPage.value < pg.last_page : newOrders.length === params.per_page)
    } else {
      const msg = listDataWrapper?.message || '获取数据失败'
      errorMessage.value = msg
      showToast(msg)
      console.warn('FilterAlerts list error:', listDataWrapper)
    }

    // 处理统计响应（仅首屏，兼容无 code）
    if (statsRes) {
      const statsWrapper = statsRes?.data || statsRes
      const isOkStats = (typeof statsWrapper?.code === 'number' ? statsWrapper.code === 200 : true)
      const s = (typeof statsWrapper?.code === 'number') ? (statsWrapper.data || {}) : (statsWrapper || {})
      if (isOkStats) {
        // 优先采用服务端按 urgency=critical 聚合的统计
        // 兼容不同字段名
        const total = s.total_count ?? s.all_count
        const pending = s.pending_count ?? s.wait_count
        const processed = s.processed_count ?? s.done_count
        if (typeof total === 'number' || typeof pending === 'number' || typeof processed === 'number') {
          stats.total_count = total ?? 0
          stats.pending_count = pending ?? 0
          stats.processed_count = processed ?? 0
        } else {
          // 若服务端未按紧急返回统计，不用“首屏长度”覆盖，避免低估；
          // 仅当用户加载更多累计足够数据时，再在界面旁提示“统计为估算”
          console.warn('Stats lacks critical-only aggregation, keep previous stats as-is')
        }
      } else {
        console.warn('FilterAlerts stats error:', statsWrapper)
        // 统计失败不阻断列表
      }
    }
  } catch (error) {
    console.error('获取滤芯预警工单失败:', error)
    errorMessage.value = (error?.data?.message || error?.message || '网络错误，请稍后重试')
    showToast(errorMessage.value)
  } finally {
    loading.value = false
    loadingMore.value = false
    refreshing.value = false
  }
}

// 刷新数据
const onRefresh = () => {
  currentPage.value = 1
  hasMore.value = true
  fetchData(1, currentStatus.value)
}

// 加载更多
const loadMore = () => {
  if (hasMore.value && !loadingMore.value) {
    fetchData(currentPage.value + 1, currentStatus.value, true)
  }
}

// 按状态筛选
const filterByStatus = (status) => {
  currentStatus.value = status
  currentPage.value = 1
  hasMore.value = true
  fetchData(1, status)
}

// 跳转到工单详情
const goToOrderDetail = (orderId) => {
  router.push(`/engineer/water-order-detail/${orderId}`)
}

// 获取状态样式类
const getStatusClass = (status) => {
  const statusMap = {
    '01': 'status-pending',
    '02': 'status-processing', 
    '03': 'status-completed',
    '04': 'status-cancelled'
  }
  return statusMap[status] || 'status-pending'
}

// 获取紧急程度样式类
const getUrgencyClass = (urgency) => {
  return urgency === 'critical' ? 'urgency-critical' : 'urgency-warning'
}

// 获取滤芯寿命颜色
const getFilterColor = (percentage) => {
  if (percentage <= 5) return '#ee0a24'
  if (percentage <= 20) return '#ff9500'
  return '#07c160'
}

// 页面初始化
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.filter-alerts-container {
  background-color: #f7f8fa;
  min-height: 100vh;
}

.content {
  padding: 16px;
}

/* 统计卡片 */
.stats-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stats-row {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #323233;
  margin-bottom: 4px;
}

.stat-number.pending {
  color: #ff9500;
}

.stat-number.processed {
  color: #07c160;
}

.stat-label {
  font-size: 14px;
  color: #969799;
}

/* 筛选栏 */
.filter-bar {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filter-tabs {
  display: flex;
  gap: 16px;
}

.filter-tab {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  color: #646566;
  background: #f2f3f5;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-tab.active {
  background: #1989fa;
  color: white;
}

/* 工单列表 */
.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s;
}

.order-item:active {
  transform: scale(0.98);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.order-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-number {
  font-size: 16px;
  font-weight: bold;
  color: #323233;
}

.status-tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: white;
}

.status-pending {
  background: #ff9500;
}

.status-processing {
  background: #1989fa;
}

.status-completed {
  background: #07c160;
}

.status-cancelled {
  background: #969799;
}

.urgency-tag {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: white;
}

.urgency-critical {
  background: #ee0a24;
}

.urgency-warning {
  background: #ff9500;
}

.client-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.client-name {
  font-size: 15px;
  font-weight: 500;
  color: #323233;
}

.client-phone {
  font-size: 14px;
  color: #646566;
}

.address {
  font-size: 14px;
  color: #969799;
  margin-bottom: 12px;
}

.filter-status {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-label {
  font-size: 14px;
  color: #646566;
}

.filter-percentage {
  font-size: 14px;
  font-weight: 500;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.create-time {
  font-size: 13px;
  color: #969799;
}

.arrow-icon {
  color: #c8c9cc;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-text {
  font-size: 16px;
  color: #969799;
  margin-top: 16px;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 20px;
}
</style>
