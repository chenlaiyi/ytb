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
        <van-button type="primary" size="mini" @click="$router.push('/login')">去登录</van-button>
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
import { getTeamDevices } from '@/api/vip'
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
      const params = {
        type: activeTab.value,
        month: selectedMonth.value,
        page: currentPage.value,
        page_size: pageSize.value
      }
      
      console.log('📡 准备调用团队设备API，参数:', params)
      
      // 增强的token状态检查
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('auth_token') || 
                   sessionStorage.getItem('simulate_token')
      const simulateMode = sessionStorage.getItem('simulate_mode')
      
      console.log('📡 详细token状态:', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'null',
        isSimulateMode: simulateMode === 'true',
        tokenSource: localStorage.getItem('token') ? 'localStorage(token)' : 
                    localStorage.getItem('auth_token') ? 'localStorage(auth_token)' : 
                    sessionStorage.getItem('simulate_token') ? 'sessionStorage(simulate_token)' : 'none'
      })
      
      // 调试：输出完整token用于分析
      if (token) {
        console.log('🔍 完整Token用于调试:', token)
      }
      
      // 如果没有token，提示用户登录
      if (!token) {
        console.warn('📡 未找到有效token，设置登录错误状态')
        hasLoginError.value = true
        loading.value = false
        return
      }
      
      const res = await getTeamDevices(params)
      
      console.log('📡 团队设备API响应:', {
        code: res.code,
        message: res.message,
        hasData: !!res.data,
        apiSource: res._apiSource || '未知来源'
      })
      
      if (safeGet(res, 'code') === 0) {
        const data = safeGet(res, 'data', {})
        
        deviceList.value = safeGet(data, 'devices', [])
        total.value = safeGet(data, 'total', 0)
        totalPages.value = safeGet(data, 'total_pages', 0)
        summary.value = safeGet(data, 'summary', {
          total_count: 0,
          total_amount: '0.00',
          self_use_count: 0,
          water_point_count: 0,
          sale_count: 0,
          query_month: '本月',
          query_type: '团队销售'
        })
        
        console.log('设备列表获取成功:', {
          total: total.value,
          devices: deviceList.value.length,
          summary: summary.value
        })
      } else {
        const message = safeGet(res, 'message', '获取设备列表失败')
        console.log('📡 API返回错误:', {
          code: res.code,
          message: message
        })
        
        if (message.includes('登录') || message.includes('令牌') || message.includes('Token') || message.includes('访问令牌') || message.includes('认证') || message.includes('JWT') || message.includes('签名')) {
          console.log('🔐 检测到认证相关错误，清理token并显示登录提示')
          hasLoginError.value = true
          
          // 检查是否处于模拟登录模式
          const isSimulateMode = sessionStorage.getItem('simulate_mode') === 'true'
          
          if (isSimulateMode) {
            console.log('🔐 模拟登录模式下的认证错误，不清理管理员token')
            // 只清理模拟登录相关数据
            sessionStorage.removeItem('simulate_mode')
            sessionStorage.removeItem('simulate_token')
            sessionStorage.removeItem('simulate_user_info')
          } else {
            // 非模拟登录模式下才清理localStorage中的token
            console.log('🔐 正常模式认证错误，清理用户token')
            localStorage.removeItem('token')
            localStorage.removeItem('auth_token')
            sessionStorage.removeItem('simulate_token')
          }
          
          // 特殊处理JWT签名错误
          if (message.includes('JWT') || message.includes('签名')) {
            safeToast.show('登录凭证已失效，请重新登录', 'error')
          } else {
            safeToast.show('登录已过期，请重新登录', 'error')
          }
        } else {
          safeToast.show(message, 'error')
        }
      }
    } catch (error) {
      console.error('📡 获取设备列表异常:', error)
      
      // 详细的错误分析
      const errorDetails = {
        hasResponse: !!error.response,
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorMessage: error.message,
        errorType: error.name || 'Unknown'
      }
      console.log('📡 错误详情:', errorDetails)
      
      if (error.message && (error.message.includes('登录') || error.message.includes('令牌') || error.message.includes('Token') || error.message.includes('JWT') || error.message.includes('签名'))) {
        console.log('🔐 检测到认证失败，原因:', error.message)
        
        // 清理无效token
        localStorage.removeItem('token')
        localStorage.removeItem('auth_token')
        sessionStorage.removeItem('simulate_token')
        
        // 检查是否是模拟登录模式
        const simulateMode = sessionStorage.getItem('simulate_mode')
        const simulateToken = sessionStorage.getItem('simulate_token')
        
        if (simulateMode === 'true' && simulateToken) {
          console.log('🔄 模拟登录模式下的令牌错误，可能需要重新验证')
          safeToast.show('模拟登录状态异常，请返回管理后台重新进入', 'error')
        } else {
          hasLoginError.value = true
          console.log('🔐 设置登录错误状态为true，显示登录提示')
          
          // 特殊处理JWT签名错误
          if (error.message.includes('JWT') || error.message.includes('签名')) {
            safeToast.show('登录凭证已失效，请重新登录', 'error')
          }
        }
      } else if (error.response && error.response.status === 401) {
        console.log('🔐 检测到401未授权错误，清理token')
        hasLoginError.value = true
        
        // 清理所有token
        localStorage.removeItem('token')
        localStorage.removeItem('auth_token')
        sessionStorage.removeItem('simulate_token')
        
        safeToast.show('登录已过期，请重新登录', 'error')
      } else if (error.response && error.response.status >= 500) {
        console.log('🔧 检测到服务器错误')
        safeToast.show('服务器繁忙，请稍后重试', 'error')
      } else if (!error.response) {
        console.log('🌐 检测到网络错误')
        safeToast.show('网络连接失败，请检查网络后重试', 'error')
      } else {
        console.log('❓ 其他类型错误:', error)
        safeToast.show('获取设备列表失败，请稍后重试', 'error')
      }
    } finally {
      loading.value = false
      isRefreshing.value = false
    }
  })
}

// 处理Tab切换
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

// 处理分页
const handlePageChange = (page) => {
  currentPage.value = page
  fetchDevices()
}

// 刷新数据
const refreshData = () => {
  isRefreshing.value = true
  currentPage.value = 1
  fetchDevices()
}

// 监听Tab和月份变化
watch([activeTab, selectedMonth], () => {
  currentPage.value = 1
})

// 页面加载时获取数据
onMounted(async () => {
  try {
    // 检查登录状态
    const token = localStorage.getItem('token')
    const simulateMode = sessionStorage.getItem('simulate_mode')
    const simulateToken = sessionStorage.getItem('simulate_token')
    
    console.log('团队设备页面认证状态检查:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'null',
      isSimulateMode: simulateMode === 'true',
      hasSimulateToken: !!simulateToken
    })
    
    // 如果既没有正常token也没有模拟登录，显示登录提示
    if (!token && !(simulateMode === 'true' && simulateToken)) {
      console.log('团队设备页面检测到未登录状态，显示登录提示')
      hasLoginError.value = true
      return
    }
    
    // 如果是模拟登录模式，确保用户store已经设置了模拟登录状态
    if (simulateMode === 'true' && simulateToken) {
      console.log('团队设备页面检测到模拟登录模式')
      try {
        const { useUserStore } = await import('@/stores/user')
        const userStore = useUserStore()
        
        // 如果用户store还没有设置模拟模式，则设置它
        if (!userStore.isSimulateMode) {
          console.log('用户store未设置模拟模式，正在恢复...')
          userStore.checkSimulateMode()
        }
      } catch (storeError) {
        console.warn('用户store初始化失败:', storeError)
      }
    }
    
    // 获取设备数据
    await fetchDevices()
  } catch (error) {
    console.error('团队设备页面初始化失败:', error)
    // 如果初始化失败，显示登录提示而不是强制调用API
    hasLoginError.value = true
  }
})
</script>

<style scoped>
.team-devices-page {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 20px;
}

/* 统计卡片 */
.stats-container {
  padding: 16px;
  background: white;
  margin-bottom: 8px;
}

.login-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  text-align: center;
  color: #666;
}

.prompt-icon {
  color: #ff6b35;
}

.stats-card {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  border-radius: 12px;
  padding: 16px;
  color: white;
}

.stats-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.stats-icon {
  font-size: 20px;
}

.stats-title {
  font-size: 16px;
  font-weight: 600;
}

.stats-period {
  font-size: 14px;
  opacity: 0.8;
}

.stats-content {
  display: flex;
  align-items: center;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 8px;
}

.stats-item {
  text-align: center;
  flex: 1;
  min-width: 60px;
}

.stats-value {
  font-size: 24px;
  font-weight: bold;
  line-height: 1.2;
}

.stats-label {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

.stats-divider {
  width: 1px;
  height: 30px;
  background: rgba(255, 255, 255, 0.3);
}

/* 月份筛选 */
.month-filter {
  display: flex;
  background: white;
  padding: 12px 16px;
  gap: 16px;
  margin-bottom: 8px;
}

.month-option {
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  color: #666;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.3s;
}

.month-option.active {
  background: #ff4a47;
  color: white;
}

/* 设备列表 */
.devices-content {
  padding: 0 16px;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.device-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 设备头部 */
.device-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

/* 设备类型标签 */
.device-type-tag.sale {
  background-color: #52c41a;
}

.device-type-tag.self-use {
  background-color: #faad14;
}

.device-type-tag.water-point {
  background-color: #f5222d;
}

.device-info {
  flex: 1;
}

.device-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-number {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.device-type-tag {
  font-size: 12px;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
}

.device-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.activate-date {
  font-size: 14px;
  color: #666;
}

.relation-type {
  font-size: 12px;
  color: #666;
}

.device-details {
  margin-top: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.label {
  font-size: 12px;
  color: #666;
}

.value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 设备状态 */
.device-status {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.status-label {
  font-size: 12px;
  color: #666;
}

.status-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
}

.loading-text {
  font-size: 14px;
  color: #666;
}

/* 刷新动画 */
.refresh-loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 分页样式 */
.van-pagination {
  margin-top: 20px;
  padding: 0;
}

/* 设备状态标签样式 */
.device-status-tag {
  font-size: 12px;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
}

.device-status-tag.online {
  background-color: #52c41a;
}

.device-status-tag.offline {
  background-color: #999;
}
</style> 