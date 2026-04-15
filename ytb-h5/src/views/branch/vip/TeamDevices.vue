<template>
  <div class="team-devices-page">
    <van-nav-bar
      title="团队销售净水器"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    >
      <template #right>
        <van-icon name="replay" size="18" @click="refreshData" :class="{ 'refresh-loading': isRefreshing }" />
      </template>
    </van-nav-bar>

    <!-- 统计卡片 -->
    <div class="stats-container">
      <div v-if="hasLoginError" class="login-prompt">
        <van-icon name="warning" class="prompt-icon" />
        <span class="prompt-text">请先登录后查看设备数据</span>
        <van-button type="primary" size="mini" @click="$router.push('/branch-login')">去登录</van-button>
      </div>
      
      <div v-else class="stats-card">
        <div class="stats-header">
          <van-icon name="gold-coin" class="stats-icon" />
          <span class="stats-title">{{ summary.query_type || '团队销售' }}</span>
          <span class="stats-period">{{ summary.query_month || '本月' }}</span>
        </div>
        <div class="stats-content">
          <div class="stats-item">
            <div class="stats-value">{{ summary.total_count || 0 }}</div>
            <div class="stats-label">设备总数</div>
          </div>
          <div class="stats-divider"></div>
          <div class="stats-item">
            <div class="stats-value">{{ summary.sale_count || 0 }}</div>
            <div class="stats-label">销售设备</div>
          </div>
          <div class="stats-divider"></div>
          <div class="stats-item">
            <div class="stats-value">{{ summary.self_use_count || 0 }}</div>
            <div class="stats-label">自用设备</div>
          </div>
          <div class="stats-divider"></div>
          <div class="stats-item">
            <div class="stats-value">{{ summary.water_point_count || 0 }}</div>
            <div class="stats-label">取水点</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选Tab -->
    <van-tabs v-model="activeTab" @change="handleTabChange" :sticky="true" color="#ff4a47">
      <van-tab title="团队销售" name="team" />
      <van-tab title="直推销售" name="direct" />
    </van-tabs>

    <!-- 月份筛选 -->
    <div class="month-filter">
      <div
        class="month-option"
        :class="{ active: selectedMonth === 'current' }"
        @click="switchMonth('current')"
      >
        本月
      </div>
      <div
        class="month-option"
        :class="{ active: selectedMonth === 'last' }"
        @click="switchMonth('last')"
      >
        上月
      </div>
      <div
        class="month-option"
        :class="{ active: selectedMonth === 'all' }"
        @click="switchMonth('all')"
      >
        全部
      </div>
    </div>

    <!-- 设备列表 -->
    <div class="devices-content">
      <template v-if="deviceList.length > 0">
        <div class="device-list">
          <div class="device-item" v-for="device in deviceList" :key="device.id">
            <div class="device-header">
              <div class="device-info">
                <div class="device-title">
                  <span class="device-number">{{ device.device_number }}</span>
                  <span class="device-type-tag" :class="device.device_type_class">{{ device.device_type_text }}</span>
                  <span class="device-status-tag" :class="device.is_online ? 'online' : 'offline'">
                    {{ device.network_status_text }}
                  </span>
                </div>
                <div class="device-meta">
                  <span class="activate-date">{{ device.activate_date_short }}</span>
                  <span class="relation-type">{{ device.user_info.relation_type }}</span>
                </div>
              </div>
            </div>
            
            <div class="device-details">
              <div class="detail-row">
                <span class="label">客户姓名:</span>
                <span class="value">{{ device.client_name }}</span>
              </div>
              <div class="detail-row" v-if="device.client_phone">
                <span class="label">客户电话:</span>
                <span class="value">{{ device.client_phone }}</span>
              </div>
              <div class="detail-row">
                <span class="label">剩余流量:</span>
                <span class="value">{{ device.surplus_flow }}</span>
              </div>
              <div class="detail-row">
                <span class="label">累计滤水:</span>
                <span class="value">{{ device.cumulative_flow }}</span>
              </div>
              <div class="detail-row">
                <span class="label">推荐人:</span>
                <span class="value">{{ device.user_info.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <van-pagination
          v-if="totalPages > 1"
          v-model="currentPage"
          :total-items="total"
          :items-per-page="pageSize"
          force-ellipses
          @change="handlePageChange"
        />
      </template>

      <!-- 空状态 -->
      <van-empty v-else-if="!loading" description="暂无设备数据" />
    </div>

    <!-- 加载状态 -->
    <div class="loading-container" v-if="loading">
      <van-loading color="#ff4a47" />
      <span class="loading-text">加载中...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { NavBar, Tab, Tabs, Icon, Image as VanImage, Empty, Loading, Pagination, Tag, Button } from 'vant'
import { getBranchTeamDevices } from '@/api/branchVip'
import Toast from '@/utils/toast-fix'
import { safeGet, validateAndFixData, safeAsync, safeToast } from '@/utils/bug-fix'

// 设备列表数据
const deviceList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const totalPages = ref(0)
const activeTab = ref('team')
const selectedMonth = ref('current')
const loading = ref(false)
const isRefreshing = ref(false)

// 统计数据
const summary = ref({
  total_count: 0,
  total_amount: '0.00',
  self_use_count: 0,
  water_point_count: 0,
  sale_count: 0,
  query_month: '本月',
  query_type: '团队销售'
})

// 数据加载状态
const hasLoginError = ref(false)

// 获取设备列表
const fetchDevices = () => {
  return safeAsync(async () => {
    loading.value = true
    hasLoginError.value = false
    
    try {
      // 获取用户ID和分支机构代码
      const userId = localStorage.getItem('user_id')
      const branchCode = localStorage.getItem('branch_code')
      
      const params = {
        user_id: userId,
        branch_code: branchCode,
        type: activeTab.value,
        month: selectedMonth.value,
        page: currentPage.value,
        page_size: pageSize.value
      }
      
      const res = await getBranchTeamDevices(params)
      
      if (res && res.code === 0) {
        const data = res.data || {}
        
        // 更新设备列表
        deviceList.value = data.devices || []
        total.value = data.total || 0
        totalPages.value = Math.ceil(total.value / pageSize.value)
        
        // 更新统计数据
        summary.value = {
          total_count: data.total_count || 0,
          total_amount: data.total_amount || '0.00',
          self_use_count: data.self_use_count || 0,
          water_point_count: data.water_point_count || 0,
          sale_count: data.sale_count || 0,
          query_month: data.query_month || '本月',
          query_type: data.query_type || '团队销售'
        }
        
        // 处理设备数据
        deviceList.value = deviceList.value.map(device => ({
          ...device,
          device_type_class: getDeviceTypeClass(device.device_type),
          device_type_text: getDeviceTypeText(device.device_type),
          network_status_text: device.is_online ? '在线' : '离线',
          activate_date_short: formatDate(device.activate_date),
          user_info: device.user_info || { name: '未知', relation_type: '团队' }
        }))
        
      } else {
        safeToast(res?.message || '获取设备数据失败')
        if (res?.code === 401) {
          hasLoginError.value = true
        }
      }
    } catch (error) {
      console.error('获取设备列表错误:', error)
      safeToast('网络错误，请稍后重试')
    } finally {
      loading.value = false
      isRefreshing.value = false
    }
  })
}

// 刷新数据
const refreshData = () => {
  isRefreshing.value = true
  fetchDevices()
}

// 切换Tab
const handleTabChange = (name) => {
  activeTab.value = name
  currentPage.value = 1
  fetchDevices()
}

// 切换月份
const switchMonth = (month) => {
  selectedMonth.value = month
  currentPage.value = 1
  fetchDevices()
}

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page
  fetchDevices()
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 获取设备类型样式
const getDeviceTypeClass = (type) => {
  const typeMap = {
    1: 'type-sale',
    2: 'type-self',
    3: 'type-water'
  }
  return typeMap[type] || 'type-default'
}

// 获取设备类型文本
const getDeviceTypeText = (type) => {
  const typeMap = {
    1: '销售',
    2: '自用',
    3: '取水点'
  }
  return typeMap[type] || '未知'
}

// 页面加载时获取数据
onMounted(() => {
  fetchDevices()
})
</script>

<style scoped>
.team-devices-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-bottom: 20px;
}

.stats-container {
  padding: 16px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
}

.login-prompt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
}

.prompt-icon {
  color: #ffd93d;
  margin-right: 8px;
}

.prompt-text {
  flex: 1;
  font-size: 14px;
}

.stats-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  color: white;
}

.stats-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.stats-icon {
  color: #ffd93d;
  margin-right: 8px;
}

.stats-title {
  font-size: 16px;
  font-weight: 600;
  margin-right: 8px;
}

.stats-period {
  font-size: 12px;
  opacity: 0.8;
}

.stats-content {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.stats-item {
  text-align: center;
}

.stats-value {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 12px;
  opacity: 0.8;
}

.stats-divider {
  width: 1px;
  height: 30px;
  background: rgba(255, 255, 255, 0.3);
}

.month-filter {
  display: flex;
  background: white;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.month-option {
  flex: 1;
  text-align: center;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.month-option.active {
  background: #ff4a47;
  color: white;
}

.devices-content {
  padding: 16px;
}

.device-list {
  margin-bottom: 20px;
}

.device-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.device-header {
  margin-bottom: 12px;
}

.device-title {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.device-number {
  font-size: 16px;
  font-weight: 600;
  margin-right: 8px;
}

.device-type-tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  margin-right: 8px;
}

.type-sale {
  background: #e8f5e8;
  color: #52c41a;
}

.type-self {
  background: #e6f7ff;
  color: #1890ff;
}

.type-water {
  background: #fff7e6;
  color: #fa8c16;
}

.device-status-tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.online {
  background: #e8f5e8;
  color: #52c41a;
}

.offline {
  background: #fff2f0;
  color: #ff4d4f;
}

.device-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.device-details {
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.label {
  color: #666;
}

.value {
  color: #333;
  font-weight: 500;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 16px;
}

.loading-text {
  margin-top: 12px;
  color: #666;
  font-size: 14px;
}

.refresh-loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 