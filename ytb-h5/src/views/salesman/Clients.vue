<template>
  <div class="clients-container">
    <div class="content">
      <!-- 顶部搜索区域 -->
      <div class="search-section">
        <div class="search-bar">
          <Search
            v-model="searchValue"
            placeholder="搜索客户姓名或手机号"
            show-action
            @search="onSearch"
            @cancel="onCancelSearch"
            action-text="搜索"
            background="#f7f8fa"
            shape="round"
          />
        </div>
        <!-- 筛选标签 -->
        <div class="filter-tabs">
          <div 
            class="filter-tab" 
            :class="{ active: filterType === 'all' }"
            @click="setFilter('all')"
          >
            全部客户
          </div>
          <div 
            class="filter-tab" 
            :class="{ active: filterType === 'vip' }"
            @click="setFilter('vip')"
          >
            VIP客户
          </div>
          <div 
            class="filter-tab" 
            :class="{ active: filterType === 'normal' }"
            @click="setFilter('normal')"
          >
            普通客户
          </div>
        </div>
      </div>
      
      <!-- 统计概览卡片 -->
      <div class="stats-overview">
        <div class="stats-card">
          <div class="stat-item">
            <div class="stat-icon">
              <Icon name="friends" size="18" color="#6366f1" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ displayedClients.length }}</div>
              <div class="stat-label">客户总数</div>
            </div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-icon">
              <Icon name="desktop-o" size="18" color="#10b981" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ totalDevices }}</div>
              <div class="stat-label">设备总数</div>
            </div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-icon">
              <Icon name="checked" size="18" color="#059669" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ onlineDevices }}</div>
              <div class="stat-label">在线设备</div>
            </div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-icon">
              <Icon name="diamond-o" size="18" color="#f59e0b" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ vipClients }}</div>
              <div class="stat-label">VIP客户</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 客户列表 -->
      <div class="client-list" v-if="displayedClients.length > 0">
        <div v-for="(client, index) in displayedClients" :key="client.id || index"
             class="client-card"
             @click="viewClientDetail(client)">
          <!-- 客户基本信息头部 -->
          <div class="client-header">
            <div class="client-info">
              <div class="client-name-row">
                <span class="client-name">{{ client.name || '未知客户' }}</span>
                <Tag v-if="client.is_vip || client.is_vip_paid" type="warning" size="small" class="vip-tag">
                  <Icon name="diamond-o" size="10" />
                  VIP
                </Tag>
              </div>
              <div class="client-meta">
                <span class="client-phone">
                  <Icon name="phone-o" size="12" color="#6b7280" />
                  {{ client.phone || '无手机号' }}
                </span>
                <span class="client-time">
                  <Icon name="clock-o" size="12" color="#6b7280" />
                  {{ formatDate(client.created_at) }}
                </span>
              </div>
            </div>
            <!-- 设备统计信息 -->
            <div class="client-stats-inline">
              <div class="stat-item-inline">
                <div class="stat-icon-inline">
                  <Icon name="desktop-o" size="12" color="#6b7280" />
                </div>
                <div class="stat-content-inline">
                  <div class="stat-number-inline">{{ client.devices ? client.devices.length : 0 }}</div>
                  <div class="stat-text-inline">设备</div>
                </div>
              </div>
              <div class="stat-item-inline">
                <div class="stat-icon-inline">
                  <Icon name="checked" size="12" color="#10b981" />
                </div>
                <div class="stat-content-inline">
                  <div class="stat-number-inline">{{ getOnlineDeviceCount(client.devices) }}</div>
                  <div class="stat-text-inline">在线</div>
                </div>
              </div>
              <div class="stat-item-inline">
                <div class="stat-icon-inline">
                  <Icon name="warning-o" size="12" color="#f59e0b" />
                </div>
                <div class="stat-content-inline">
                  <div class="stat-number-inline">{{ getMaintenanceDeviceCount(client.devices) }}</div>
                  <div class="stat-text-inline">维护</div>
                </div>
              </div>
            </div>
          </div>



          <!-- 设备快速预览 -->
          <div class="device-preview" v-if="client.devices && client.devices.length > 0">
            <div class="device-preview-header">
              <span class="preview-title">设备列表</span>
              <span class="preview-more">点击查看详情</span>
            </div>
            <div class="device-preview-grid">
              <div v-for="(device, dIndex) in client.devices.slice(0, 3)"
                   :key="dIndex"
                   class="device-preview-item"
                   @click.stop="viewDeviceDetail(device.id)">
                <div class="device-preview-status">
                  <div class="status-dot" :class="device.network_status ? 'online' : 'offline'"></div>
                  <Icon v-if="isDeviceNeedsMaintenance(device)" name="warning-o" size="12" color="#f59e0b" />
                </div>
                <div class="device-preview-info">
                  <div class="device-preview-number">{{ device.device_number || '设备' + (dIndex + 1) }}</div>
                  <div class="device-preview-location">{{ device.address || '未设置地址' }}</div>
                </div>
              </div>
              <div v-if="client.devices.length > 3" class="device-preview-more-item">
                <Icon name="plus" size="16" color="#9ca3af" />
                <span>还有{{ client.devices.length - 3 }}台设备</span>
              </div>
            </div>
          </div>

          <!-- 无设备状态 -->
          <div v-else class="no-devices-preview">
            <Icon name="desktop-o" size="20" color="#d1d5db" />
            <span>暂无设备</span>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else-if="loading" class="loading-state">
        <Loading size="24px" color="#4f46e5">加载客户数据中...</Loading>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">
          <Icon name="friends-o" size="64" color="#d1d5db" />
        </div>
        <div class="empty-text">
          <h3>暂无客户信息</h3>
          <p>还没有客户数据，开始添加您的第一个客户吧</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, Icon, Tag, Progress, Collapse, CollapseItem, Loading, Toast, Button } from 'vant'
import { getSalesmanClients } from '@/api/user'

const router = useRouter()
const route = useRoute()
const searchValue = ref('')
const clientList = ref([])
const loading = ref(false)
const retryCount = ref(0)
const maxRetries = 3
const filterType = ref('all') // 筛选类型：all, vip, normal

// 计算属性：根据搜索条件和筛选条件显示的客户列表
const displayedClients = computed(() => {
  let filteredClients = clientList.value
  
  // 按类型筛选
  if (filterType.value === 'vip') {
    filteredClients = filteredClients.filter(client => client.is_vip || client.is_vip_paid)
  } else if (filterType.value === 'normal') {
    filteredClients = filteredClients.filter(client => !client.is_vip && !client.is_vip_paid)
  }
  
  // 按搜索关键词筛选
  if (!searchValue.value) {
    return filteredClients
  }
  
  return filteredClients.filter(client => {
    // 确保client存在且有有效的属性
    if (!client) return false
    
    const name = client.name || ''
    const phone = client.phone || ''
    const searchTerm = searchValue.value || ''
    
    return (typeof name === 'string' && name.includes(searchTerm)) || 
           (typeof phone === 'string' && phone.toString().includes(searchTerm))
  })
})

// 计算属性：设备总数
const totalDevices = computed(() => {
  let total = 0
  clientList.value.forEach(client => {
    if (client.devices && Array.isArray(client.devices)) {
      total += client.devices.length
    }
  })
  return total
})

// 计算属性：在线设备数
const onlineDevices = computed(() => {
  let total = 0
  clientList.value.forEach(client => {
    if (client.devices && Array.isArray(client.devices)) {
      client.devices.forEach(device => {
        if (device.network_status) {
          total++
        }
      })
    }
  })
  return total
})

// 计算属性：VIP客户数
const vipClients = computed(() => {
  return clientList.value.filter(client => client.is_vip || client.is_vip_paid).length
})

// 获取客户在线设备数量
const getOnlineDeviceCount = (devices) => {
  if (!devices || !Array.isArray(devices)) return 0
  return devices.filter(device => device.network_status).length
}

// 获取需要维护的设备数量
const getMaintenanceDeviceCount = (devices) => {
  if (!devices || !Array.isArray(devices)) return 0
  return devices.filter(device => isDeviceNeedsMaintenance(device)).length
}

// 获取客户状态类名


// 获取滤芯状态类名
const getFilterStatusClass = (percentage) => {
  if (percentage <= 20) return 'critical'
  if (percentage <= 50) return 'warning'
  return 'normal'
}

// 切换设备详情显示状态
const toggleDeviceDetail = (clientId, deviceIndex) => {
  const key = `${clientId}_${deviceIndex}`
  deviceDetails[key] = !deviceDetails[key]
}

// 获取客户列表
const fetchClients = async () => {
  loading.value = true
  
  try {
    console.log('正在获取业务员客户列表...')
    
    // 检查用户认证状态
    const token = localStorage.getItem('token') || 
                 localStorage.getItem('jwt_token') || 
                 localStorage.getItem('auth_token') ||
                 route.query.token
    
    if (!token) {
      console.warn('未找到认证token，跳转到登录页面')
      Toast('请先登录')
      router.push('/user/login')
      return
    }
    
    console.log('使用token调用API:', token.substring(0, 20) + '...')
    const res = await getSalesmanClients({ token })
    
    if (res.code === 0 && res.data && res.data.clients) {
      console.log('获取客户列表成功:', res.data.clients.length)
      clientList.value = res.data.clients
      
      // 初始化折叠面板状态
      clientList.value.forEach(client => {
        if (client && client.id) {
          activeDevices[client.id] = client.id
          
          // 默认所有设备详情都是折叠的
          if (client.devices && Array.isArray(client.devices)) {
            client.devices.forEach((_, index) => {
              deviceDetails[`${client.id}_${index}`] = false
            })
          }
        }
      })
    } else {
      console.error('获取客户列表返回错误:', res)
      
      // 如果是认证错误，跳转到登录页面
      if (res.code === 401 || res.code === 1002) {
        console.warn('认证失败，清除token并跳转到登录页面')
        localStorage.removeItem('token')
        localStorage.removeItem('jwt_token')
        localStorage.removeItem('auth_token')
        Toast('登录已过期，请重新登录')
        router.push('/user/login')
        return
      }
      
      Toast(res.message || '获取客户列表失败')
      clientList.value = []
    }
  } catch (error) {
    console.error('获取客户列表异常:', error)
    
    // 检查是否是认证相关错误
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn('API认证失败，清除token并跳转到登录页面')
      localStorage.removeItem('token')
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('auth_token')
      Toast('登录已过期，请重新登录')
      router.push('/user/login')
      return
    }
    
    // 如果是网络问题，尝试重试
    if (retryCount.value < maxRetries) {
      retryCount.value++
      Toast(`获取客户列表失败，正在重试(${retryCount.value}/${maxRetries})...`)
      setTimeout(fetchClients, 1500)
      return
    } else {
      Toast('获取客户列表失败，请稍后重试')
      clientList.value = []
    }
  } finally {
    loading.value = false
  }
}

// 搜索功能
const onSearch = () => {
  console.log('搜索客户:', searchValue.value)
}

const onCancelSearch = () => {
  searchValue.value = ''
  console.log('取消搜索')
}

// 筛选功能
const setFilter = (type) => {
  filterType.value = type
  console.log('设置筛选类型:', type)
}

// 计算滤芯剩余寿命百分比 - 优先使用后端计算好的百分比
const getFilterPercentage = (device, filterCode) => {
  // 先检查后端是否已经计算好了百分比（life_percent是已使用百分比，需要转换为剩余百分比）
  if (device && device[`${filterCode}_life_percent`] !== undefined) {
    const usedPercent = device[`${filterCode}_life_percent`];
    return Math.max(0, 100 - usedPercent);
  }
  
  // 后备方案：手动计算
  return calcFilterLife(device[`${filterCode}_flux`], device[`${filterCode}_flux_max`]);
}

// 计算滤芯剩余寿命百分比
const calcFilterLife = (current, max) => {
  if (!current || !max || max <= 0 || isNaN(current) || isNaN(max)) return 100;
  // 计算已使用百分比，然后转换为剩余百分比
  const usedPercentage = Math.round((current / max) * 100);
  const remainingPercentage = 100 - usedPercentage;
  return Math.min(Math.max(remainingPercentage, 0), 100); // 限制在0-100之间
}

// 根据寿命百分比获取颜色
const getLifeColor = (percentage) => {
  // 百分比越低，滤芯寿命越少，颜色越红
  if (percentage <= 20) return '#ee0a24'  // 红色 - 严重不足
  if (percentage <= 50) return '#ff976a'  // 橙色 - 注意更换
  return '#07c160'  // 绿色 - 正常
}

// 拨打电话
const callClient = (phone) => {
  if (!phone) {
    Toast('该客户未设置手机号')
    return
  }
  window.location.href = `tel:${phone}`
}

// 查看客户详情
const viewClientDetail = (client) => {
  if (!client || !client.id) {
    Toast('客户信息无效')
    return
  }

  // 跳转到客户详情页面
  router.push({
    path: `/salesman/client-detail/${client.id}`,
    query: {
      name: client.name || '未知客户',
      phone: client.phone || ''
    }
  })
}

// 查看设备详情
const viewDeviceDetail = (deviceId) => {
  if (!deviceId) {
    Toast('设备ID无效')
    return
  }
  
  router.push({
    path: `/device/detail/${deviceId}`
  })
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '未设置'
  
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  } catch (e) {
    return dateStr
  }
}

// 获取设备状态标签类型
const getStatusTagType = (status) => {
  if (!status || status === 'unknown') return 'default'
  
  switch (status.toLowerCase()) {
    case 'normal':
    case 'online':
      return 'success'
    case 'warning':
      return 'warning'
    case 'error':
    case 'offline':
      return 'danger'
    default:
      return 'primary'
  }
}

// 获取设备状态文本
const getStatusText = (status) => {
  if (!status || status === 'unknown') return '未知'
  
  switch (status.toLowerCase()) {
    case 'normal':
    case 'online':
      return '正常'
    case 'warning':
      return '警告'
    case 'error':
      return '异常'
    case 'offline':
      return '离线'
    default:
      return status
  }
}

// 判断设备是否需要维护
const isDeviceNeedsMaintenance = (device) => {
  // 只要有一个滤芯的剩余寿命百分比小于等于20%，就提示需要维护
  if (getFilterPercentage(device, 'f1') <= 20 || 
      getFilterPercentage(device, 'f2') <= 20 || 
      getFilterPercentage(device, 'f3') <= 20) {
    return true
  }
  return false
}

// 格式化流量显示（只显示L）
const formatFlow = (flow) => {
  if (!flow || isNaN(flow)) return '0L'
  return `${flow.toFixed(1)}L`
}

// 格式化累计制水量（显示L和矿泉水瓶数）
const formatWaterWithBottles = (flow) => {
  if (!flow || isNaN(flow)) return '0L'
  const bottles = Math.floor(flow / 0.5) // 1L = 2瓶矿泉水
  return `${flow.toFixed(1)}L (约${bottles}瓶)`
}

// 格式化累计制水量（仅显示瓶数）
const formatWaterBottles = (flow) => {
  if (!flow || isNaN(flow)) return '0瓶'
  const bottles = Math.floor(flow / 0.5) // 1L = 2瓶矿泉水
  if (bottles < 1000) {
    return `${bottles}瓶`
  } else {
    return `${(bottles / 1000).toFixed(1)}千瓶`
  }
}

// 获取剩余流量的样式类
const getSurplusFlowClass = (flow) => {
  if (!flow || isNaN(flow)) return ''
  if (flow <= 100) return 'danger-value' // 少于100L显示红色
  if (flow <= 500) return 'warning-value' // 少于500L显示橙色
  return 'success-value' // 正常显示绿色
}

// 获取剩余天数的样式类
const getRemainingDaysClass = (days) => {
  if (!days || isNaN(days)) return ''
  if (days <= 7) return 'danger-value' // 少于7天显示红色
  if (days <= 30) return 'warning-value' // 少于30天显示橙色
  return 'success-value' // 正常显示绿色
}

// 获取TDS值的样式类
const getTdsClass = (tds, isRaw) => {
  if (!tds || isNaN(tds)) return ''
  
  // 原水TDS值通常越高越不好
  if (isRaw) {
    if (tds > 300) return 'danger-value' 
    if (tds > 200) return 'warning-value'
    return ''
  } 
  // 净水TDS值越低越好
  else {
    if (tds <= 50) return 'success-value' // 净水TDS值低于50为优秀
    if (tds <= 100) return '' // 正常
    return 'warning-value' // 有点高
  }
}

onMounted(() => {
  fetchClients()
})
</script>

<style scoped>
.clients-container {
  min-height: 100vh;
  background: #ffffff;
  position: relative;
}

.content {
  position: relative;
  z-index: 1;
  padding-bottom: 20px;
}

/* 搜索区域样式 */
.search-section {
  background: #ffffff;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-bar {
  margin-bottom: 12px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.filter-tab {
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.filter-tab.active {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.filter-tab:hover {
  background: #e5e7eb;
}

.filter-tab.active:hover {
  background: #5855eb;
  border-bottom: 1px solid rgba(229, 231, 235, 0.3);
}

.search-bar {
  max-width: 400px;
  margin: 0 auto;
}

/* 统计概览样式 */
.stats-overview {
  padding: 16px;
}

.stats-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(229, 231, 235, 0.3);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(79, 70, 229, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  border: 1px solid rgba(79, 70, 229, 0.12);
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, transparent, #e5e7eb, transparent);
  margin: 0 16px;
}

/* 客户列表样式 */
.client-list {
  padding: 0 16px;
}

.client-card {
  background: #ffffff;
  border-radius: 12px;
  margin-bottom: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(229, 231, 235, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.client-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.client-card:active {
  transform: translateY(-1px);
}

/* 客户头部样式 */
.client-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
}






.client-info {
  flex: 1;
}

.client-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.client-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.2;
}

.vip-tag {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
}

.client-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.client-phone, .client-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
}

/* 内联统计信息样式 */
.client-stats-inline {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.stat-item-inline {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-icon-inline {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: rgba(248, 250, 252, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(229, 231, 235, 0.5);
}

.stat-content-inline {
  display: flex;
  align-items: center;
  gap: 2px;
}

.stat-number-inline {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1;
}

.stat-text-inline {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}

/* 设备预览样式 */
.device-preview {
  padding: 12px 16px 16px;
}

.device-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.preview-more {
  font-size: 12px;
  color: #9ca3af;
}

.device-preview-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.device-preview-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba(248, 250, 252, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(229, 231, 235, 0.5);
  transition: all 0.2s ease;
  cursor: pointer;
}

.device-preview-item:hover {
  background: rgba(241, 245, 249, 0.9);
  border-color: rgba(203, 213, 225, 0.8);
  transform: translateX(2px);
}

.device-preview-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 12px;
}

.device-preview-info {
  flex: 1;
}

.device-preview-number {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 2px;
}

.device-preview-location {
  font-size: 12px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  width: 100%;
  word-break: break-all;
}

.device-preview-more-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: rgba(243, 244, 246, 0.6);
  border-radius: 12px;
  border: 1px dashed rgba(156, 163, 175, 0.5);
  font-size: 12px;
  color: #9ca3af;
}

/* 无设备预览样式 */
.no-devices-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: #9ca3af;
  font-size: 14px;
}



.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px white, 0 0 0 3px currentColor;
}

.status-dot.online {
  background: #10b981;
  color: rgba(16, 185, 129, 0.3);
}

.status-dot.offline {
  background: #ef4444;
  color: rgba(239, 68, 68, 0.3);
}

/* 加载和空状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-text h3 {
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8px;
}

.empty-text p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}

/* 响应式调整 */
@media (min-width: 768px) {
  .device-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .device-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .client-list {
    padding: 0 24px;
  }
  
  .stats-overview {
    padding: 16px 24px;
  }
}
</style> 