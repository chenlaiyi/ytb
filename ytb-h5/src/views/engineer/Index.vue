<template>
  <div class="engineer-container">
    <!-- 统一导航栏 -->
  <NavHeader title="工程师工作台" :custom-back="handleBackToProfile" />

    <PullRefresh v-model="refreshing" @refresh="onRefresh">
      <div class="content">
      <!-- 工程师信息卡片 -->
      <div class="engineer-card">
        <div class="engineer-header">
          <div class="avatar-wrapper">
            <VanImage
              round
              width="60"
              height="60"
              fit="cover"
              :src="engineerInfo.avatar || userStore?.userAvatar || '/app/images/profile/default-avatar.png'"
              :error-content="'头像'"
            />
          </div>
          <div class="engineer-info">
            <div class="engineer-name">{{ engineerInfo.name || userStore?.userName || '工程师' }}</div>
            <div class="engineer-level">{{ engineerInfo.level || '高级工程师' }}</div>
            <div class="engineer-id">工号: {{ engineerInfo.employeeId || 'E10086' }}</div>
            <div class="engineer-phone">电话: {{ engineerInfo.phone || '' }}</div>
          </div>
          <div class="online-status" :class="{'status-online': engineerInfo.isOnline}">
            {{ engineerInfo.isOnline ? '在线' : '离线' }}
          </div>
        </div>
      </div>
      
      
      <!-- 工单类型分布 -->
      <div class="work-type-card">
        <div class="card-title">工单类型分布</div>
        <div class="type-stats">
          <div class="type-row">
            <div class="type-item" 
                 v-for="(type, index) in workOrderTypeStats.slice(0, 3)" 
                 :key="index"
                 @click="goToOrderType(type.type)">
              <div class="type-count" :style="{ color: type.color }">{{ type.count }}</div>
              <div class="type-label">{{ type.name }}</div>
            </div>
          </div>
          <div class="type-row">
            <div class="type-item" 
                 v-for="(type, index) in workOrderTypeStats.slice(3, 6)" 
                 :key="index + 3"
                 @click="goToOrderType(type.type)">
              <div class="type-count" :style="{ color: type.color }">{{ type.count }}</div>
              <div class="type-label">{{ type.name }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 滤芯预警工单 -->
      <div class="work-card">
        <div class="card-title">
          <span>滤芯预警工单</span>
          <router-link to="/engineer/filter-alerts" class="more">全部预警 <Icon name="arrow" /></router-link>
        </div>
        <div class="work-list" v-if="filterAlertDevices.length > 0">
          <div class="alert-device-item" 
               v-for="(device, index) in filterAlertDevices" 
               :key="index" 
               @click="$router.push(`/engineer/filter-alert-device/${device.device_number}`)"
          >
            <div class="alert-tag">紧急</div>
            <div class="device-content">
              <div class="device-header">
                <span class="client-name">{{ device.client_name }}</span>
                <span class="device-separator">-</span>
                <span class="device-number">{{ device.device_number }}</span>
              </div>
              <div class="device-address">{{ device.address }}</div>
              <div class="filter-status">
                <span v-if="device.pp_percentage < 10" class="filter-tag" :class="getFilterTagClass('PP', device.pp_percentage)">
                  PP棉: {{ device.pp_percentage }}%
                </span>
                <span v-if="device.ro_percentage < 10" class="filter-tag" :class="getFilterTagClass('RO', device.ro_percentage)">
                  RO膜: {{ device.ro_percentage }}%
                </span>
                <span v-if="device.cto_percentage < 10" class="filter-tag" :class="getFilterTagClass('CTO', device.cto_percentage)">
                  CTO: {{ device.cto_percentage }}%
                </span>
              </div>
            </div>
            <Icon name="arrow" class="work-arrow" />
          </div>
        </div>
        <div class="empty-list" v-else>
          <Icon name="smile-o" size="40" color="#cccccc" />
          <div>暂无滤芯预警工单</div>
        </div>
      </div>
      
      <!-- 维修记录 -->
      <div class="history-card">
        <div class="card-title">
          <span>近期维修</span>
          <router-link to="/engineer/orders" class="more">全部记录 <Icon name="arrow" /></router-link>
        </div>
        <div class="history-list" v-if="maintenanceHistory.length > 0">
          <div class="history-item" 
               v-for="(history, index) in maintenanceHistory" 
               :key="index" 
               @click="$router.push(`/engineer/work-orders/${history.id}`)"
          >
            <div class="history-time">{{ history.date }}</div>
            <div class="history-content">
              <div class="history-title">{{ history.title }}</div>
              <div class="history-user">用户: {{ history.userName }}</div>
              <div class="history-address">地址: {{ history.address }}</div>
            </div>
            <div class="history-status" :class="getStatusClass(history.status)">
              {{ getStatusText(history.status) }}
            </div>
          </div>
        </div>
        <div class="empty-list" v-else>
          <Icon name="notes-o" size="40" color="#cccccc" />
          <div>暂无维修记录</div>
        </div>
      </div>
      
      <!-- 快捷功能 -->
      <div class="function-card">
        <div class="card-title">工程功能</div>
        <Grid :column-num="4" :border="false" square>
          <GridItem v-for="(feature, index) in features" :key="index" :to="feature.path">
            <Icon :name="feature.icon" size="28" :color="feature.color" />
            <div class="text">{{ feature.name }}</div>
          </GridItem>
        </Grid>
      </div>
      
      <!-- 便签 -->
      <div class="note-card">
        <div class="card-title">便签</div>
        <Field
          v-model="note"
          type="textarea"
          rows="3"
          placeholder="记录一些备忘信息..."
          autosize
        />
        <div class="note-action">
          <Button size="small" type="primary" @click="saveNoteContent">保存便签</Button>
        </div>
      </div>
      
      <!-- 维修指南 -->
      <div class="guide-card">
        <div class="card-title">
          <span>维修指南</span>
          <router-link to="/engineer/guides" class="more">更多 <Icon name="arrow" /></router-link>
        </div>
        <div class="guide-list" v-if="repairGuides.length > 0">
          <div class="guide-item" 
               v-for="(guide, index) in repairGuides" 
               :key="index" 
               @click="$router.push(`/engineer/guides/${guide.id}`)"
          >
            <Icon :name="guide.icon" class="guide-icon" :color="guide.color" />
            <div class="guide-content">
              <div class="guide-title">{{ guide.title }}</div>
              <div class="guide-desc">{{ guide.description }}</div>
            </div>
            <Icon name="arrow" class="guide-arrow" />
          </div>
        </div>
        <div class="empty-list" v-else>
          <Icon name="description" size="40" color="#cccccc" />
          <div>暂无维修指南</div>
        </div>
      </div>
      
      <!-- 耗材库存 -->
      <div class="inventory-card">
        <div class="card-title">
          <span>耗材库存</span>
          <router-link to="/engineer/inventory" class="more">查看全部 <Icon name="arrow" /></router-link>
        </div>
        <div class="inventory-list" v-if="inventoryItems.length > 0">
          <div class="inventory-item" v-for="(item, index) in inventoryItems" :key="index">
            <div class="inventory-name">{{ item.name }}</div>
            <div class="inventory-progress">
              <Progress
                :percentage="calculatePercentage(item.current, item.total)"
                :pivot-text="`${item.current}/${item.total}`"
                :color="getInventoryColor(item.current, item.total)"
              />
            </div>
            <Button 
              size="small" 
              :type="item.current < item.warning ? 'danger' : 'default'"
              @click="$router.push('/engineer/inventory/apply')"
            >
              {{ item.current < item.warning ? '申请补货' : '详情' }}
            </Button>
          </div>
        </div>
        <div class="empty-list" v-else>
          <Icon name="cart-o" size="40" color="#cccccc" />
          <div>暂无库存信息</div>
        </div>
      </div>
      
      <!-- 个人设置 -->
      <div class="settings-card">
        <div class="card-title">个人设置</div>
        <div class="settings-list">
          <div class="setting-item" @click="$router.push('/engineer/profile')">
            <Icon name="user-o" class="setting-icon" />
            <span class="setting-text">个人信息</span>
            <Icon name="arrow" class="setting-arrow" />
          </div>
          <div class="setting-item" @click="$router.push('/engineer/settings')">
            <Icon name="setting-o" class="setting-icon" />
            <span class="setting-text">工作设置</span>
            <Icon name="arrow" class="setting-arrow" />
          </div>
          <div class="setting-item" @click="$router.push('/engineer/location')">
            <Icon name="location-o" class="setting-icon" />
            <span class="setting-text">位置管理</span>
            <Icon name="arrow" class="setting-arrow" />
          </div>
        </div>
      </div>
    </div>
    </PullRefresh>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, PullRefresh, Image as VanImage, Icon, Progress, Button, Grid, GridItem, Field } from 'vant'
import { useUserStore } from '@/stores/user'
import NavHeader from '@/components/NavHeader.vue'

const userStore = useUserStore()
import { request } from '@/utils/request'
import { showSuccessToast, showFailToast } from 'vant'
import {
  getWorkspaceData,
  getFilterAlertStats,
  saveNote,
  getNote,
  getWorkOrders,
  getInventory
} from '@/api/engineer'

const router = useRouter()

const handleBackToProfile = () => {
  router.replace('/user')
}

// 页面状态
const loading = ref(false)
const refreshing = ref(false)

// 工程师信息
const engineerInfo = ref({
  name: '',
  level: '',
  employeeId: '',
  phone: '',
  avatar: '',
  isOnline: true
})

// 工单类型分布统计数据
const workOrderTypeStats = ref([
  { type: '01', name: '安装工单', count: 0, color: '#1989fa' },
  { type: '02', name: '维修工单', count: 0, color: '#ff9500' },
  { type: '03', name: '拆机工单', count: 0, color: '#ee0a24' },
  { type: '04', name: '迁机工单', count: 0, color: '#07c160' },
  { type: '05', name: '水质预警', count: 0, color: '#7232dd' },
  { type: '10', name: '滤芯预警', count: 0, color: '#ff6034' }
])

// 滤芯预警设备
const filterAlertDevices = ref([])

// 维修记录
const maintenanceHistory = ref([])

// 功能列表
const features = ref([
  { name: '接单', icon: 'orders-o', path: '/engineer/orders', color: '#1989fa' },
  { name: '报告', icon: 'records', path: '/engineer/reports', color: '#ff9500' },
  { name: '库存', icon: 'cart-o', path: '/engineer/inventory', color: '#07c160' },
  { name: '指南', icon: 'guide-o', path: '/engineer/guides', color: '#ee0a24' },
  { name: '日程', icon: 'calendar-o', path: '/engineer/schedule', color: '#7232dd' },
  { name: '区域', icon: 'location-o', path: '/engineer/area', color: '#ff6034' },
  { name: '消息', icon: 'chat-o', path: '/engineer/messages', color: '#2eb57d' },
  { name: '设置', icon: 'setting-o', path: '/engineer/settings', color: '#969799' },
  { name: '测试', icon: 'setting-o', path: '/engineer/test-api', color: '#ff0000' } // 添加测试入口
])

// 便签内容
const note = ref('')

// 维修指南
const repairGuides = ref([])

// 耗材库存
const inventoryItems = ref([
  { name: 'PP棉滤芯', current: 8, total: 20, warning: 5 },
  { name: '活性炭滤芯', current: 3, total: 15, warning: 3 },
  { name: 'RO膜滤芯', current: 2, total: 10, warning: 2 }
])

// 获取紧急程度样式
const getUrgencyClass = (urgency) => {
  switch (urgency) {
    case 'high':
      return 'urgency-high'
    case 'medium':
      return 'urgency-medium'
    case 'low':
      return 'urgency-low'
    default:
      return ''
  }
}

// 获取紧急程度文本
const getUrgencyText = (urgency) => {
  switch (urgency) {
    case 'high':
      return '紧急'
    case 'medium':
      return '一般'
    case 'low':
      return '普通'
    default:
      return '一般'
  }
}

// 获取滤芯百分比颜色
const getFilterColor = (percentage) => {
  if (percentage <= 5) {
    return '#ee0a24' // 红色 - 紧急
  } else if (percentage <= 15) {
    return '#ff9500' // 橙色 - 警告
  } else if (percentage <= 30) {
    return '#ffc107' // 黄色 - 注意
  } else {
    return '#07c160' // 绿色 - 正常
  }
}

// 获取滤芯标签样式类
const getFilterTagClass = (filterType, percentage) => {
  if (percentage <= 5) {
    return 'filter-tag-critical' // 红色 - 紧急
  } else if (percentage <= 30) {
    return 'filter-tag-warning' // 橙色 - 警告
  } else {
    return 'filter-tag-normal' // 绿色 - 正常
  }
}

// 跳转到滤芯预警页面
const goToFilterAlert = () => {
  router.push('/engineer/orders?type=filter_alert')
}

// 跳转到指定类型的工单页面
const goToOrderType = (type) => {
  router.push(`/engineer/orders?type=${type}`)
}

// 获取状态样式
const getStatusClass = (status) => {
  switch (status) {
    case 'completed':
      return 'status-completed'
    case 'pending':
      return 'status-pending'
    case 'processing':
      return 'status-processing'
    case 'cancelled':
      return 'status-cancelled'
    default:
      return ''
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'pending':
      return '待处理'
    case 'processing':
      return '处理中'
    case 'cancelled':
      return '已取消'
    default:
      return status || '未知状态'
  }
}

// 获取工单状态文本
const getWorkOrderStatusText = (order) => {
  // 优先使用后端计算的状态名称
  if (order.work_status_name) {
    return order.work_status_name;
  }

  // 如果有旧的简单状态值，作为备用（向后兼容）
  if (order.status) {
    const statusMap = {
      'pending': '待处理',
      'processing': '处理中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[order.status] || order.status;
  }

  // 使用新的复合状态判断逻辑（备用）
  const classification = order.work_order_classification;
  const orderType = order.work_order_type;

  // 安装工单 (01) - 使用order_type字典
  if (classification === '01') {
    switch (orderType) {
      case '01': return '公司派装';
      case '02': return '待派师傅';
      case '03': return '待安装';
      case '05': return '已激活';
      case '06': return '待发货';
      case '09': return '已完成';
      case '10': return '撤销';
      default: return '未知状态';
    }
  }

  // 维修工单 (02) - 使用or_wei字典
  if (classification === '02') {
    switch (orderType) {
      case '01': return '待派单';
      case '02': return '待维修';
      case '03': return '已完成';
      default: return '未知状态';
    }
  }

  // 拆机工单 (03) - 使用or_chai字典
  if (classification === '03') {
    switch (orderType) {
      case '01': return '待派单';
      case '02': return '待拆机';
      case '04': return '待还库';
      case '09': return '已完成';
      default: return '未知状态';
    }
  }

  // 迁机工单 (04) - 使用or_qian字典
  if (classification === '04') {
    switch (orderType) {
      case '01': return '待支付';
      case '02': return '待派单';
      case '03': return '待迁机';
      case '04': return '已完成';
      default: return '未知状态';
    }
  }

  return '未知状态';
}

// 格式化时间显示（兼容 iOS Safari 日期解析）
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  try {
    let s = timeStr
    if (/^\d+$/.test(s)) {
      const n = Number(s)
      const d = new Date(s.length === 10 ? n * 1000 : n)
      return d.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    s = s.replace(/T/, ' ').replace(/Z$/, '').replace(/-/g, '/').replace(/\.\d{3}$/, '')
    const date = new Date(s)
    if (isNaN(date.getTime())) return String(timeStr)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    if (targetDate.getTime() === today.getTime()) {
      return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    if (targetDate.getTime() === today.getTime() + 24 * 60 * 60 * 1000) {
      return '明天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' +
           date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch (error) {
    return String(timeStr)
  }
}

// 计算百分比
const calculatePercentage = (current, total) => {
  if (!total || total === 0) return 0
  return Math.floor((current / total) * 100)
}

// 获取库存颜色
const getInventoryColor = (current, total) => {
  const percentage = calculatePercentage(current, total)
  if (percentage <= 20) {
    return '#ee0a24'
  } else if (percentage <= 50) {
    return '#ff9500'
  } else {
    return '#07c160'
  }
}

// 保存便签
const saveNoteContent = async () => {
  try {
    await saveNote({ content: note.value })
    showSuccessToast('便签保存成功')
  } catch (error) {
    console.error('保存便签失败:', error)
    showFailToast('保存便签失败')
  }
}

// 获取滤芯预警统计数据（已合并到工作台数据中，此函数保留但不使用）
const fetchFilterAlertStats = async () => {
  // 滤芯预警统计已合并到工单类型分布中，不再单独获取
}

// 获取工程师工作台数据
const fetchWorkspaceData = async () => {
  try {
    const res = await request({
      url: '/api/mobile/v1/engineer/workspace',
      method: 'get'
    })
    
    if (res && res.code === 0 && res.data) {
      const data = res.data
      
      // 更新工程师信息
      if (data.engineer_info) {
        engineerInfo.value = {
          ...engineerInfo.value,
          ...data.engineer_info
        }
      }
      
      // 更新工单统计 - 暂时注释掉，因为workOrderStats未定义
      // if (data.stats) {
      //   Object.assign(workOrderStats.value, {
      //     todayCount: data.stats.today_installs || '0',
      //     pendingCount: data.stats.pending_installs || '0',
      //     monthCount: data.stats.current_month_installs || '0',
      //     completedCount: data.stats.total_installs || '0',
      //     totalCount: data.stats.total_installs || '0'
      //   })
      // }
      
      // 更新工单类型分布统计
      if (data.work_order_type_stats) {
        workOrderTypeStats.value = data.work_order_type_stats
      }
      
      // 更新滤芯预警设备
      if (data.filter_alert_devices) {
        filterAlertDevices.value = data.filter_alert_devices
      }
      
      // 更新维修记录
      if (data.recent_installs) {
        maintenanceHistory.value = data.recent_installs.slice(0, 5)
      }
    } else if (res && res.code === 401) {
      // 认证失败，跳转到登录页
      console.warn('工程师身份认证失败，需要重新登录')
      showFailToast('身份认证失败，请重新登录')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      console.warn('获取工程师工作台数据失败:', res?.message || '未知错误')
      showFailToast('获取工作台数据失败')
    }
  } catch (error) {
    console.error('获取工程师工作台数据失败:', error)
    if (error.response?.status === 401) {
      showFailToast('身份认证失败，请重新登录')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      showFailToast('网络错误，请稍后重试')
    }
  }
}

// 获取维修记录
const fetchMaintenanceHistory = async () => {
  try {
    const res = await request({
      url: '/api/mobile/v1/engineer/maintenance-history',
      method: 'get'
    })
    
    if (res && res.code === 0 && res.data) {
      maintenanceHistory.value = res.data.slice(0, 5)
    }
  } catch (error) {
    console.error('获取维修记录失败:', error)
  }
}

// 获取耗材库存
const fetchInventoryItems = async () => {
  try {
    const res = await request({
      url: '/api/mobile/v1/engineer/inventory',
      method: 'get'
    })
    
    if (res && res.code === 0 && res.data) {
      inventoryItems.value = res.data
    }
  } catch (error) {
    console.error('获取耗材库存失败:', error)
  }
}

// 获取维修指南
const fetchRepairGuides = async () => {
  try {
    const res = await request({
      url: '/api/mobile/v1/engineer/repair-guides',
      method: 'get'
    })
    
    if (res && res.code === 0 && res.data) {
      repairGuides.value = res.data
    }
  } catch (error) {
    console.error('获取维修指南失败:', error)
  }
}

// 下拉刷新
const onRefresh = async () => {
  refreshing.value = true
  await fetchWorkspaceData()
  await fetchMaintenanceHistory()
  await fetchInventoryItems()
  refreshing.value = false
}

onMounted(async () => {
  await fetchWorkspaceData()
  await fetchMaintenanceHistory()
  await fetchInventoryItems()
  await fetchRepairGuides()
})
</script>

<style scoped>
.engineer-container {
  background-color: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 20px;
}

.content {
  padding: 12px;
}

/* 工程师信息卡片 */
.engineer-card {
  margin-top: 12px;
  background: linear-gradient(135deg, #36d1dc 0%, #5b86e5 100%);
  border-radius: 8px;
  padding: 15px;
  color: #fff;
  box-shadow: 0 2px 12px rgba(54, 209, 220, 0.2);
}

.engineer-header {
  display: flex;
  align-items: center;
}

.avatar-wrapper {
  margin-right: 15px;
}

.engineer-info {
  flex: 1;
}

.engineer-name {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 4px;
}

.engineer-level {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.engineer-id {
  font-size: 12px;
  opacity: 0.8;
}

.engineer-phone {
  font-size: 12px;
  opacity: 0.8;
}

.online-status {
  padding: 3px 8px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.2);
  font-size: 12px;
}

.status-online {
  background-color: #07c160;
  color: #fff;
}

/* 工单统计卡片 */
.stats-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.card-title {
  margin-bottom: 15px;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-item {
  flex: 1;
  text-align: center;
}

.stats-value {
  font-size: 24px;
  font-weight: bold;
  color: #36d1dc;
  margin-bottom: 5px;
}

.stats-label {
  font-size: 12px;
  color: #999;
}

.stats-divider {
  width: 1px;
  height: 30px;
  background-color: #eee;
}

/* 工单卡片 */
.work-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.work-list {
  margin-top: 10px;
}

.work-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.work-item:last-child {
  border-bottom: none;
}

.work-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
  margin-right: 12px;
  min-width: 40px;
  text-align: center;
}

.urgency-high {
  background-color: #ee0a24;
}

.urgency-medium {
  background-color: #ff9500;
}

.urgency-low {
  background-color: #07c160;
}

.work-content {
  flex: 1;
}

.work-title {
  font-size: 14px;
  color: #323233;
  margin-bottom: 4px;
}

.work-desc {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #969799;
}

.work-time {
  color: #969799;
}

.work-arrow {
  color: #c8c9cc;
}

/* 滤芯预警设备样式 */
.alert-device-item {
  display: flex;
  align-items: flex-start;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.alert-device-item:last-child {
  border-bottom: none;
}

.alert-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
  background-color: #ee0a24;
  margin-right: 12px;
  min-width: 40px;
  text-align: center;
  margin-top: 2px;
}

.device-content {
  flex: 1;
}

.device-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.client-name {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
}

.device-separator {
  font-size: 16px;
  color: #323233;
  margin: 0 6px;
}

.device-number {
  font-size: 16px;
  color: #323233;
}

.device-address {
  font-size: 13px;
  color: #646566;
  margin-bottom: 10px;
}

.filter-status {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tag {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
}

.filter-tag-critical {
  background-color: #ee0a24;
}

.filter-tag-warning {
  background-color: #ff9500;
}

.filter-tag-normal {
  background-color: #07c160;
}

/* 维修记录卡片 */
.history-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.history-list {
  margin-top: 10px;
}

.history-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.history-item:last-child {
  border-bottom: none;
}

.history-time {
  font-size: 12px;
  color: #999;
  min-width: 70px;
  margin-right: 10px;
}

.history-content {
  flex: 1;
}

.history-title {
  font-size: 14px;
  margin-bottom: 4px;
}

.history-user, .history-address {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.history-status {
  font-size: 12px;
  border-radius: 10px;
  padding: 1px 6px;
  display: inline-block;
}

.status-completed {
  background-color: #e8f5e9;
  color: #07c160;
}

.status-pending {
  background-color: #e6f7ff;
  color: #1989fa;
}

.status-processing {
  background-color: #fff7e6;
  color: #ff9500;
}

.status-cancelled {
  background-color: #f5f5f5;
  color: #999;
}

/* 功能卡片 */
.function-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.text {
  font-size: 12px;
  margin-top: 4px;
  color: #646566;
}

/* 工单类型分布 */
.order-types {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 10px;
}

.type-item {
  text-align: center;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-item:hover {
  background-color: #e9ecef;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.type-item:active {
  transform: translateY(0);
}

.type-count {
  font-size: 18px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 4px;
}

.type-label {
  font-size: 12px;
  color: #666;
}

/* 工单类型分布卡片 */
.work-type-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.type-stats {
  margin-top: 10px;
}

.type-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.type-row:last-child {
  margin-bottom: 0;
}

.work-type-card .type-item {
  text-align: center;
  padding: 12px 8px;
  background-color: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e9ecef;
}

.work-type-card .type-item:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.work-type-card .type-item:active {
  transform: translateY(0);
}

.work-type-card .type-count {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 6px;
  line-height: 1;
}

.work-type-card .type-label {
  font-size: 12px;
  color: #666;
  line-height: 1.2;
}

/* 便签卡片 */
.note-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.note-action {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

/* 维修指南卡片 */
.guide-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.guide-list {
  margin-top: 10px;
}

.guide-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.guide-item:last-child {
  border-bottom: none;
}

.guide-icon {
  font-size: 24px;
  margin-right: 10px;
}

.guide-content {
  flex: 1;
}

.guide-title {
  font-size: 14px;
  margin-bottom: 4px;
}

.guide-desc {
  font-size: 12px;
  color: #999;
}

.guide-arrow {
  color: #ccc;
  font-size: 16px;
}

/* 库存卡片 */
.inventory-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.inventory-list {
  margin-top: 10px;
}

.inventory-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.inventory-item:last-child {
  border-bottom: none;
}

.inventory-name {
  width: 80px;
  font-size: 14px;
}

.inventory-progress {
  flex: 1;
  margin: 0 15px;
}

/* 个人设置卡片 */
.settings-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.settings-list {
  margin-top: 10px;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-icon {
  font-size: 20px;
  color: #1989fa;
  margin-right: 10px;
}

.setting-text {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.setting-arrow {
  color: #ccc;
  font-size: 16px;
}

.empty-list {
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 14px;
}
</style>
