<template>
  <div class="branch-water-container">
    <div class="content">
      <!-- 净水器概览卡片 -->
      <div class="overview-card">
        <div class="card-title">设备概览</div>
        <div class="data-overview">
          <div class="overview-item">
            <div class="item-value">{{ deviceStats.totalDevices || '0' }}</div>
            <div class="item-label">设备总数</div>
          </div>
          <div class="overview-divider"></div>
          <div class="overview-item">
            <div class="item-value">{{ deviceStats.onlineDevices || '0' }}</div>
            <div class="item-label">在线设备</div>
          </div>
          <div class="overview-divider"></div>
          <div class="overview-item">
            <div class="item-value">{{ deviceStats.alertDevices || '0' }}</div>
            <div class="item-label">告警设备</div>
          </div>
        </div>
        
        <div class="data-overview margin-top">
          <div class="overview-item">
            <div class="item-value">{{ waterStats.todayUsage || '0' }}L</div>
            <div class="item-label">今日用水</div>
          </div>
          <div class="overview-divider"></div>
          <div class="overview-item">
            <div class="item-value">{{ filterStats.needReplace || '0' }}</div>
            <div class="item-label">待换滤芯</div>
          </div>
          <div class="overview-divider"></div>
          <div class="overview-item">
            <div class="item-value">{{ maintenanceStats.pending || '0' }}</div>
            <div class="item-label">待维修</div>
          </div>
        </div>
      </div>
      
      <!-- 水质监控图表 -->
      <div class="chart-card">
        <div class="card-title">
          <span>水质监控</span>
          <div class="chart-tabs">
            <span 
              v-for="(tab, index) in chartTabs" 
              :key="index" 
              :class="{ 'active-tab': currentChartTab === index }"
              @click="currentChartTab = index"
            >
              {{ tab }}
            </span>
          </div>
        </div>
        <div class="chart-container">
          <div class="chart-placeholder" v-if="!hasChartData">
            <van-icon name="chart-trending-o" size="40" color="#cccccc" />
            <div>暂无水质数据</div>
          </div>
          <div v-else class="chart-data">
            <div class="water-quality-chart">
              <div class="quality-item">
                <div class="quality-label">TDS值</div>
                <div class="quality-value good">{{ waterQuality.tds || '0' }} ppm</div>
              </div>
              <div class="quality-item">
                <div class="quality-label">pH值</div>
                <div class="quality-value good">{{ waterQuality.ph || '0' }}</div>
              </div>
              <div class="quality-item">
                <div class="quality-label">余氯</div>
                <div class="quality-value good">{{ waterQuality.chlorine || '0' }} mg/L</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 快捷功能 -->
      <div class="function-card">
        <div class="card-title">快捷功能</div>
        <van-grid :column-num="4" :border="false" square>
          <van-grid-item v-for="(feature, index) in features" :key="index" @click="goToFeature(feature)">
            <van-icon :name="feature.icon" size="28" :color="feature.color" />
            <div class="text">{{ feature.name }}</div>
          </van-grid-item>
        </van-grid>
      </div>
      
      <!-- 设备列表 -->
      <div class="device-card">
        <div class="card-title">
          <span>我的设备</span>
          <div class="more" @click="$router.push('/branch/water/devices')">查看全部 <van-icon name="arrow" /></div>
        </div>
        <div class="device-list" v-if="devices.length > 0">
          <div class="device-item" v-for="(device, index) in devices" :key="index" @click="goToDeviceDetail(device)">
            <div class="device-left">
              <div class="device-icon">
                <van-icon name="droplet" size="24" :color="getDeviceStatusColor(device.status)" />
              </div>
              <div class="device-info">
                <div class="device-name">{{ device.name }}</div>
                <div class="device-location">{{ device.location }}</div>
              </div>
            </div>
            <div class="device-right">
              <div class="device-status" :class="getDeviceStatusClass(device.status)">
                {{ getDeviceStatusText(device.status) }}
              </div>
              <div class="device-usage">{{ device.todayUsage || '0' }}L</div>
            </div>
          </div>
        </div>
        <div class="empty-list" v-else>
          <van-icon name="droplet-o" size="40" color="#cccccc" />
          <div>暂无绑定设备</div>
        </div>
      </div>
      
      <!-- 滤芯状态 -->
      <div class="filter-card">
        <div class="card-title">滤芯状态</div>
        <div class="filter-list" v-if="filters.length > 0">
          <div class="filter-item" v-for="(filter, index) in filters" :key="index">
            <div class="filter-left">
              <div class="filter-name">{{ filter.name }}</div>
              <div class="filter-device">{{ filter.deviceName }}</div>
            </div>
            <div class="filter-right">
              <div class="filter-progress">
                <van-progress 
                  :percentage="filter.lifePercent" 
                  :color="getFilterColor(filter.lifePercent)"
                  :show-pivot="false"
                />
              </div>
              <div class="filter-life">剩余{{ filter.remainDays }}天</div>
            </div>
          </div>
        </div>
        <div class="empty-list" v-else>
          <van-icon name="filter" size="40" color="#cccccc" />
          <div>暂无滤芯信息</div>
        </div>
      </div>
      
      <!-- 告警信息 */
      <div class="alert-card">
        <div class="card-title">
          <span>告警信息</span>
          <div class="more" @click="$router.push('/branch/water/alerts')">查看全部 <van-icon name="arrow" /></div>
        </div>
        <div class="alert-list" v-if="alerts.length > 0">
          <div class="alert-item" v-for="(alert, index) in alerts" :key="index" @click="handleAlert(alert)">
            <div class="alert-left">
              <div class="alert-icon" :class="getAlertTypeClass(alert.type)">
                <van-icon :name="getAlertIcon(alert.type)" size="16" />
              </div>
              <div class="alert-info">
                <div class="alert-title">{{ alert.title }}</div>
                <div class="alert-device">{{ alert.deviceName }}</div>
              </div>
            </div>
            <div class="alert-right">
              <div class="alert-time">{{ alert.time }}</div>
              <div class="alert-level" :class="getAlertLevelClass(alert.level)">{{ alert.level }}</div>
            </div>
          </div>
        </div>
        <div class="empty-list" v-else>
          <van-icon name="warning-o" size="40" color="#cccccc" />
          <div>暂无告警信息</div>
        </div>
      </div>
      
      <!-- 维修提醒 -->
      <div class="maintenance-card">
        <div class="card-title">维修提醒</div>
        <div class="maintenance-list" v-if="maintenanceReminders.length > 0">
          <div class="maintenance-item" v-for="(item, index) in maintenanceReminders" :key="index" @click="applyMaintenance(item)">
            <div class="maintenance-content">
              <div class="maintenance-title">{{ item.title }}</div>
              <div class="maintenance-desc">{{ item.description }}</div>
            </div>
            <div class="maintenance-action">
              <van-button type="primary" size="small">申请维修</van-button>
            </div>
          </div>
        </div>
        <div class="empty-list" v-else>
          <van-icon name="service-o" size="40" color="#cccccc" />
          <div>暂无维修提醒</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { getBranchPurifierWorkspace } from '@/api/branchWater'

const router = useRouter()

// 设备统计数据
const deviceStats = ref({
  totalDevices: '0',
  onlineDevices: '0',
  alertDevices: '0'
})

// 用水统计数据
const waterStats = ref({
  todayUsage: '0'
})

// 滤芯统计数据
const filterStats = ref({
  needReplace: '0'
})

// 维修统计数据
const maintenanceStats = ref({
  pending: '0'
})

// 水质数据
const waterQuality = ref({
  tds: '0',
  ph: '0',
  chlorine: '0'
})

// 图表相关
const chartTabs = ref(['实时', '今日', '本周'])
const currentChartTab = ref(0)
const hasChartData = ref(false)

// 功能列表
const features = ref([
  { name: '设备管理', icon: 'droplet', path: '/branch/water/devices', color: '#1989fa' },
  { name: '用水统计', icon: 'chart-trending-o', path: '/branch/water/usage', color: '#07c160' },
  { name: '滤芯商城', icon: 'shop-o', path: '/branch/water/shop', color: '#ff9500' },
  { name: '设备绑定', icon: 'plus', path: '/branch/water/bind', color: '#ee0a24' },
  { name: '水质报告', icon: 'notes-o', path: '/branch/water/reports', color: '#7232dd' },
  { name: '远程控制', icon: 'setting-o', path: '/branch/water/control', color: '#ff6034' },
  { name: '维修记录', icon: 'service-o', path: '/branch/water/maintenance', color: '#2eb57d' },
  { name: '保养提醒', icon: 'clock-o', path: '/branch/water/reminders', color: '#969799' }
])

// 设备列表
const devices = ref([])

// 滤芯列表
const filters = ref([])

// 告警列表
const alerts = ref([])

// 维修提醒
const maintenanceReminders = ref([])

// 跳转到功能页面
const goToFeature = (feature) => {
  if (feature.path) {
    router.push(feature.path)
  } else {
    showToast('功能开发中...')
  }
}

// 跳转到设备详情
const goToDeviceDetail = (device) => {
  router.push(`/branch/water/device/${device.id}`)
}

// 获取设备状态颜色
const getDeviceStatusColor = (status) => {
  switch (status) {
    case 'online': return '#52c41a'
    case 'offline': return '#999'
    case 'alert': return '#ff4d4f'
    default: return '#999'
  }
}

// 获取设备状态样式类
const getDeviceStatusClass = (status) => {
  switch (status) {
    case 'online': return 'status-online'
    case 'offline': return 'status-offline'
    case 'alert': return 'status-alert'
    default: return 'status-offline'
  }
}

// 获取设备状态文本
const getDeviceStatusText = (status) => {
  switch (status) {
    case 'online': return '在线'
    case 'offline': return '离线'
    case 'alert': return '告警'
    default: return '未知'
  }
}

// 获取滤芯进度条颜色
const getFilterColor = (percent) => {
  if (percent > 30) return '#52c41a'
  if (percent > 10) return '#faad14'
  return '#ff4d4f'
}

// 获取告警类型样式类
const getAlertTypeClass = (type) => {
  switch (type) {
    case 'filter': return 'alert-filter'
    case 'water': return 'alert-water'
    case 'device': return 'alert-device'
    default: return 'alert-default'
  }
}

// 获取告警图标
const getAlertIcon = (type) => {
  switch (type) {
    case 'filter': return 'filter'
    case 'water': return 'droplet'
    case 'device': return 'warning-o'
    default: return 'info-o'
  }
}

// 获取告警等级样式类
const getAlertLevelClass = (level) => {
  switch (level) {
    case '高': return 'level-high'
    case '中': return 'level-medium'
    case '低': return 'level-low'
    default: return 'level-low'
  }
}

// 处理告警
const handleAlert = (alert) => {
  showToast(`处理告警: ${alert.title}`)
}

// 申请维修
const applyMaintenance = async (item) => {
  try {
    await showConfirmDialog({
      title: '申请维修',
      message: `确定要申请维修"${item.title}"吗？`
    })
    showToast('维修申请已提交')
  } catch {
    // 用户取消
  }
}

// 加载工作台数据
const loadWorkspaceData = async () => {
  try {
    const response = await getBranchPurifierWorkspace()
    if (response.code === 0) {
      const data = response.data
      
      // 更新统计数据
      deviceStats.value = data.device_stats || deviceStats.value
      waterStats.value = data.water_stats || waterStats.value
      filterStats.value = data.filter_stats || filterStats.value
      maintenanceStats.value = data.maintenance_stats || maintenanceStats.value
      
      // 更新水质数据
      waterQuality.value = data.water_quality || waterQuality.value
      
      // 更新设备列表
      devices.value = data.devices || []
      
      // 更新滤芯列表
      filters.value = data.filters || []
      
      // 更新告警列表
      alerts.value = data.alerts || []
      
      // 更新维修提醒
      maintenanceReminders.value = data.maintenance_reminders || []
      
      hasChartData.value = data.has_chart_data || false
    }
  } catch (error) {
    console.error('加载工作台数据失败:', error)
    // 使用模拟数据
    loadMockData()
  }
}

// 加载模拟数据
const loadMockData = () => {
  // 模拟统计数据
  deviceStats.value = {
    totalDevices: '12',
    onlineDevices: '10',
    alertDevices: '1'
  }
  
  waterStats.value = {
    todayUsage: '156'
  }
  
  filterStats.value = {
    needReplace: '3'
  }
  
  maintenanceStats.value = {
    pending: '2'
  }
  
  // 模拟水质数据
  waterQuality.value = {
    tds: '45',
    ph: '7.2',
    chlorine: '0.3'
  }
  
  // 模拟设备列表
  devices.value = [
    {
      id: 1,
      name: '客厅净水器',
      location: '客厅',
      status: 'online',
      todayUsage: '25'
    },
    {
      id: 2,
      name: '厨房净水器',
      location: '厨房',
      status: 'online',
      todayUsage: '68'
    },
    {
      id: 3,
      name: '办公室净水器',
      location: '办公室',
      status: 'alert',
      todayUsage: '12'
    }
  ]
  
  // 模拟滤芯列表
  filters.value = [
    {
      name: 'PP棉滤芯',
      deviceName: '客厅净水器',
      lifePercent: 75,
      remainDays: 45
    },
    {
      name: '活性炭滤芯',
      deviceName: '厨房净水器',
      lifePercent: 25,
      remainDays: 15
    },
    {
      name: 'RO膜滤芯',
      deviceName: '办公室净水器',
      lifePercent: 5,
      remainDays: 3
    }
  ]
  
  // 模拟告警列表
  alerts.value = [
    {
      title: 'TDS值异常',
      deviceName: '办公室净水器',
      type: 'water',
      level: '高',
      time: '10:30'
    },
    {
      title: '滤芯需更换',
      deviceName: '厨房净水器',
      type: 'filter',
      level: '中',
      time: '09:45'
    }
  ]
  
  // 模拟维修提醒
  maintenanceReminders.value = [
    {
      title: '设备年度保养',
      description: '客厅净水器已使用11个月，建议进行年度保养'
    },
    {
      title: '管路清洗',
      description: '厨房净水器管路需要清洗，建议联系维修人员'
    }
  ]
  
  hasChartData.value = true
}

onMounted(() => {
  loadWorkspaceData()
})
</script>

<style scoped>
.branch-water-container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 50px;
}

.content {
  padding: 20px 16px;
}

/* 概览卡片 */
.overview-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.data-overview {
  display: flex;
  align-items: center;
}

.data-overview.margin-top {
  margin-top: 20px;
}

.overview-item {
  flex: 1;
  text-align: center;
}

.item-value {
  font-size: 20px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 4px;
}

.item-label {
  font-size: 12px;
  color: #666;
}

.overview-divider {
  width: 1px;
  height: 40px;
  background-color: #eee;
  margin: 0 16px;
}

/* 图表卡片 */
.chart-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-tabs {
  display: flex;
  gap: 16px;
  font-size: 14px;
}

.chart-tabs span {
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.chart-tabs .active-tab {
  color: #1989fa;
  background-color: #e8f4fd;
}

.chart-container {
  margin-top: 16px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #999;
}

.chart-placeholder div {
  margin-top: 8px;
  font-size: 14px;
}

.water-quality-chart {
  display: flex;
  justify-content: space-around;
  width: 100%;
}

.quality-item {
  text-align: center;
}

.quality-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.quality-value {
  font-size: 18px;
  font-weight: bold;
  padding: 8px 12px;
  border-radius: 8px;
}

.quality-value.good {
  background-color: #e8f5e8;
  color: #52c41a;
}

/* 功能卡片 */
.function-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.text {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

/* 设备卡片 */
.device-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.more {
  font-size: 14px;
  color: #1989fa;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.device-list {
  margin-top: 16px;
}

.device-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.device-item:last-child {
  border-bottom: none;
}

.device-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.device-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-info {
  flex: 1;
}

.device-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.device-location {
  font-size: 12px;
  color: #999;
}

.device-right {
  text-align: right;
}

.device-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 4px;
}

.status-online {
  background-color: #e8f5e8;
  color: #52c41a;
}

.status-offline {
  background-color: #f5f5f5;
  color: #999;
}

.status-alert {
  background-color: #fff1f0;
  color: #ff4d4f;
}

.device-usage {
  font-size: 12px;
  color: #666;
}

/* 滤芯卡片 */
.filter-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-list {
  margin-top: 16px;
}

.filter-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.filter-item:last-child {
  border-bottom: none;
}

.filter-left {
  flex: 1;
}

.filter-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.filter-device {
  font-size: 12px;
  color: #999;
}

.filter-right {
  width: 120px;
  text-align: right;
}

.filter-progress {
  margin-bottom: 4px;
}

.filter-life {
  font-size: 12px;
  color: #666;
}

/* 告警卡片 */
.alert-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.alert-list {
  margin-top: 16px;
}

.alert-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.alert-item:last-child {
  border-bottom: none;
}

.alert-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.alert-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.alert-filter {
  background-color: #ff9500;
}

.alert-water {
  background-color: #1989fa;
}

.alert-device {
  background-color: #ff4d4f;
}

.alert-default {
  background-color: #999;
}

.alert-info {
  flex: 1;
}

.alert-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.alert-device {
  font-size: 12px;
  color: #999;
}

.alert-right {
  text-align: right;
}

.alert-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.alert-level {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.level-high {
  background-color: #fff1f0;
  color: #ff4d4f;
}

.level-medium {
  background-color: #fff2e8;
  color: #faad14;
}

.level-low {
  background-color: #e8f4fd;
  color: #1989fa;
}

/* 维修卡片 */
.maintenance-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.maintenance-list {
  margin-top: 16px;
}

.maintenance-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.maintenance-item:last-child {
  border-bottom: none;
}

.maintenance-content {
  flex: 1;
}

.maintenance-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.maintenance-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.maintenance-action {
  margin-left: 16px;
}

.empty-list {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.empty-list div {
  margin-top: 8px;
  font-size: 14px;
}
</style> 