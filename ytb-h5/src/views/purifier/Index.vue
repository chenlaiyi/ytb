<template>
  <div class="purifier-container">
    <!-- 页面已更新 - v20250109 -->
    <!-- 移除头部导航条，界面更简洁 -->
    
    <div class="content">
      <!-- 用户信息卡片 -->
      <div class="user-card">
        <div class="user-avatar">
          <VanImage
            round
            width="50"
            height="50"
            :src="userStore.userAvatar || '/app/images/profile/default-avatar.png'"
          />
        </div>
        <div class="user-info">
          <div class="user-name">{{ userStore.userName || '净水器用户' }}</div>
          <div class="user-role">净水器用户</div>
        </div>
        <div class="device-stats">
          <div class="stat-item">
            <div class="stat-number">{{ deviceStats.selfUse }}</div>
            <div class="stat-label">自用设备</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ deviceStats.sale }}</div>
            <div class="stat-label">销售设备</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ deviceStats.waterPoint }}</div>
            <div class="stat-label">取水点</div>
          </div>
        </div>
      </div>



      <!-- 设备列表 -->
      <div class="devices-container" v-if="deviceList.length > 0">
        <div
          class="device-card"
          v-for="device in deviceList"
          :key="device.device_id"
          @click="goToDeviceDetail(device)"
        >
          <div class="device-header">
            <div class="device-info-left">
              <div class="device-image">
                <VanImage
                  width="60"
                  height="60"
                  :src="device.image || '/images/product/purifier.png'"
                  fit="contain"
                />
              </div>
              <div class="device-details">
                <div class="device-name">{{ device.client_name || '用户姓名' }}</div>
                <div class="device-number">设备编号：{{ getDeviceNumber(device) }}</div>
                <div class="device-address" v-if="device.location">{{ device.location }}</div>
                <!-- 安装师傅信息 -->
                <div class="device-master" v-if="device.master_info && (device.master_info.master_name || device.master_info.master_phone)">
                  <div class="master-info">
                    <span class="master-label">安装师傅：</span>
                    <span class="master-name" v-if="device.master_info.master_name">{{ device.master_info.master_name }}</span>
                    <span class="master-phone" v-if="device.master_info.master_phone">
                      <a :href="'tel:' + device.master_info.master_phone" class="phone-link">
                        {{ device.master_info.master_phone }}
                      </a>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="device-status-right">
              <div class="status-badge" :class="{ 'online': device.is_online, 'offline': !device.is_online }">
                {{ device.is_online ? '在线' : '离线' }}
              </div>
              <div class="warning-status" :class="getWarningClass(device)">
                {{ getWarningText(device) }}
              </div>
            </div>
          </div>

          <div class="device-actions">
            <Button
              size="small"
              type="primary"
              @click.stop="showDeviceControl(device)"
              :disabled="!device.is_online"
            >
              开关
            </Button>
            <div class="device-type">{{ device.device_type || '净水器' }}</div>
          </div>
        </div>
      </div>

      <!-- 无设备状态 -->
      <div class="empty-device" v-else>
        <Icon name="filter-o" size="48" color="#cccccc" />
        <div class="empty-text">您暂未绑定净水器设备</div>
        <Button type="primary" size="small" @click="goToDeviceManagement">管理设备</Button>
      </div>
    </div>

    <!-- 设备控制弹窗 -->
    <VanPopup v-model:show="showControlPopup" position="bottom" :style="{ height: '60%' }">
      <div class="control-popup">
        <div class="popup-header">
          <h3>设备控制 - {{ currentDevice?.client_name }}</h3>
          <Icon name="cross" @click="showControlPopup = false" />
        </div>

        <div class="control-content">
          <!-- 设备基本信息 -->
          <div class="device-info-section">
            <div class="info-item">
              <span class="label">设备编号：</span>
              <span class="value">{{ getDeviceNumber(currentDevice) }}</span>
            </div>
            <div class="info-item">
              <span class="label">在线状态：</span>
              <span class="value" :class="{ 'online': currentDevice?.is_online, 'offline': !currentDevice?.is_online }">
                {{ currentDevice?.is_online ? '在线' : '离线' }}
              </span>
            </div>
          </div>

          <!-- 控制按钮 -->
          <div class="control-buttons">
            <Button
              type="primary"
              size="large"
              @click="controlDevice('power_on')"
              :disabled="!currentDevice?.is_online"
              class="control-btn"
            >
              开机
            </Button>
            <Button
              type="danger"
              size="large"
              @click="controlDevice('power_off')"
              :disabled="!currentDevice?.is_online"
              class="control-btn"
            >
              关机
            </Button>
            <Button
              type="warning"
              size="large"
              @click="controlDevice('flush')"
              :disabled="!currentDevice?.is_online"
              class="control-btn"
            >
              强冲
            </Button>
          </div>

          <!-- 滤芯寿命情况 -->
          <div class="filter-life-section">
            <h4>滤芯寿命情况</h4>
            <div class="filter-list">
              <div class="filter-item" v-for="filter in currentDevice?.filters || []" :key="filter.name">
                <div class="filter-info">
                  <span class="filter-name">{{ filter.name }}</span>
                  <span class="filter-percent">{{ filter.remainingPercent }}%</span>
                </div>
                <div class="filter-progress">
                  <div
                    class="progress-bar"
                    :style="{ width: filter.remainingPercent + '%' }"
                    :class="{ 'warning': filter.remainingPercent < 20, 'normal': filter.remainingPercent >= 20 }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </VanPopup>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Image as VanImage, Icon, Button, Popup as VanPopup } from 'vant'
import Toast from '@/utils/toast-fix'
import { getUserDevices, controlDevice as apiControlDevice } from '@/api/device'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()



// 前往设备管理页面
const goToDeviceManagement = () => {
  router.push('/purifier/devices')
}

// 设备列表
const deviceList = ref([])

// 加载状态
const loading = ref(false)
const showControlPopup = ref(false)
const currentDevice = ref(null)

const getDeviceNumber = (device) => {
  if (!device) return '未设置'
  return device.device_number || device.board_code || device.device_id || device.sn || '未设置'
}

// 设备统计数据
const deviceStats = computed(() => {
  const stats = { selfUse: 0, sale: 0, waterPoint: 0 }
  deviceList.value.forEach(device => {
    if (device.is_self_use === '1') {
      stats.selfUse++
    } else if (device.is_water_point === '1') {
      stats.waterPoint++
    } else {
      stats.sale++
    }
  })
  return stats
})

// 跳转到设备详情
const goToDeviceDetail = (device) => {
  router.push(`/purifier/device-detail/${device.id}`)
}

// 显示设备控制弹窗
const showDeviceControl = (device) => {
  currentDevice.value = device
  showControlPopup.value = true
}

// 设备控制
const controlDevice = async (command) => {
  try {
    Toast.loading({
      message: '控制中...',
      forbidClick: true,
    })

    const res = await apiControlDevice(currentDevice.value.id, {
      command: command,
      device_number: getDeviceNumber(currentDevice.value)
    })

    Toast.clear()

    if (res.code === 0) {
      Toast.success(`${getCommandText(command)}成功`)
      // 刷新设备列表
      await fetchDeviceList()
    } else {
      Toast.fail(res.message || `${getCommandText(command)}失败`)
    }
  } catch (error) {
    Toast.clear()
    Toast.fail(`${getCommandText(command)}失败`)
    console.error('设备控制失败:', error)
  }
}

// 获取命令文本
const getCommandText = (command) => {
  const commandMap = {
    'power_on': '开机',
    'power_off': '关机',
    'flush': '强冲'
  }
  return commandMap[command] || '操作'
}

// 获取预警状态
const getWarningText = (device) => {
  const warnings = []

  // 滤芯预警
  if (device.filters) {
    const lowFilters = device.filters.filter(f => f.remainingPercent < 20)
    if (lowFilters.length > 0) {
      warnings.push('滤芯预警')
    }
  }

  // 到期预警
  if (device.remaining_days !== null && device.remaining_days < 30) {
    warnings.push('到期预警')
  }

  // 用量预警
  if (device.surplus_flow !== null && parseFloat(device.surplus_flow) < 100) {
    warnings.push('用量预警')
  }

  return warnings.length > 0 ? warnings.join('、') : '正常'
}

// 获取预警样式类
const getWarningClass = (device) => {
  const warningText = getWarningText(device)
  return warningText === '正常' ? 'normal' : 'warning'
}

// 获取设备列表
const fetchDeviceList = async () => {
  try {
    loading.value = true
    Toast.loading({
      message: '加载中...',
      forbidClick: true,
    })

    const res = await getUserDevices()

    if (res.code === 0 && res.data) {
      // API返回的数据结构是 { total, page, pageSize, list }
      deviceList.value = res.data.list || []

      // 更新设备数量
      userStore.userInfo = {
        ...userStore.userInfo,
        devices_count: deviceList.value.length
      }
    } else {
      console.warn('获取设备列表失败:', res.code, res.message)
      Toast({ type: 'fail', message: res.message || '获取设备列表失败' })
    }

    Toast.clear()
  } catch (error) {
    console.error('获取设备列表失败', error)
    Toast.clear()
    Toast({ type: 'fail', message: '获取数据失败，请稍后再试' })
  } finally {
    loading.value = false
  }
}






onMounted(() => {
  fetchDeviceList()
})
</script>

<style scoped>
.purifier-container {
  background-color: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 20px;
  padding-top: 20px; /* 添加顶部内边距替代导航条空间 */
}

.content {
  padding: 0 12px;
}

/* 用户信息卡片 */
.user-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.user-avatar {
  margin-right: 15px;
}

.user-info {
  flex: 1;
}

/* 设备统计 */
.device-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.user-name {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 5px;
  color: #333;
}

.user-role {
  font-size: 14px;
  color: #999;
}

/* 查询卡片 */
.search-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.search-header h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.search-header p {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #666;
}

.search-form {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.search-form .van-field {
  flex: 1;
}

.search-form .van-button {
  flex-shrink: 0;
  height: 44px;
}

/* 设备列表容器 */
.devices-container {
  margin-top: 12px;
}

/* 设备卡片 */
.device-card {
  margin-bottom: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
}

.device-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.device-card:last-child {
  margin-bottom: 0;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.device-info-left {
  display: flex;
  flex: 1;
}

.device-image {
  margin-right: 12px;
  flex-shrink: 0;
}

.device-details {
  flex: 1;
}

.device-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.device-number {
  font-size: 13px;
  color: #666;
  margin-bottom: 2px;
}

.device-address {
  font-size: 12px;
  color: #999;
}

.device-status-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.status-badge {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 12px;
  margin-bottom: 4px;
}

.status-badge.online {
  background-color: #e8f7ef;
  color: #00b578;
}

.status-badge.offline {
  background-color: #f7f8fa;
  color: #969799;
}

.device-status-text {
  font-size: 12px;
  color: #666;
}

/* 设备操作区域 */
.device-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

.device-type {
  font-size: 12px;
  color: #666;
}

/* 预警状态 */
.warning-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 8px;
}

.warning-status.normal {
  background-color: #e8f7ef;
  color: #00b578;
}

.warning-status.warning {
  background-color: #fff2e8;
  color: #ff8f1f;
}

/* 在线状态颜色 */
.status-badge.online {
  color: #52c41a !important;
}

.status-badge.offline {
  color: #ff4d4f !important;
}

.item-value {
  font-size: 14px;
  color: #333;
}

.device-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 15px;
  border-top: 1px solid #f5f5f5;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  color: #333;
}

.action-button :deep(.van-icon) {
  font-size: 24px;
  margin-bottom: 5px;
  color: #0088f5;
}

/* 无设备状态 */
.empty-device {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 30px 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-text {
  font-size: 14px;
  color: #999;
  margin: 15px 0;
}

/* 滤芯卡片 */
.filter-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 15px;
}

.filter-list {
  margin-bottom: 10px;
}

.filter-item {
  margin-bottom: 15px;
}

.filter-item:last-child {
  margin-bottom: 0;
}

.filter-info {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
}

.filter-name {
  font-size: 12px;
  color: #333;
}

.filter-days {
  font-size: 12px;
  color: #999;
}

.card-more {
  text-align: center;
  font-size: 12px;
  color: #0088f5;
  padding: 10px 0 0;
  border-top: 1px solid #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 用水数据 */
.water-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.water-stats {
  display: flex;
  margin-bottom: 15px;
}

.stats-col {
  flex: 1;
  text-align: center;
}

.stats-value {
  font-size: 18px;
  font-weight: bold;
  color: #0088f5;
  margin-bottom: 5px;
}

.stats-label {
  font-size: 12px;
  color: #999;
}

.chart-container {
  height: 160px;
}

.chart-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 14px;
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

/* 滤芯详情弹窗 */
.filter-popup {
  padding: 20px;
}

.popup-title {
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  margin-bottom: 20px;
}

.filter-detail {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f5f5f5;
}

.filter-detail:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.detail-name {
  font-size: 14px;
  font-weight: 500;
}

.detail-percent {
  font-size: 14px;
  color: #0088f5;
}

.detail-info {
  margin-top: 15px;
  margin-bottom: 15px;
}

.info-row {
  display: flex;
}

/* 控制弹窗样式 */
.control-popup {
  padding: 20px;
  background: white;
  border-radius: 16px 16px 0 0;
  height: 100%;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.popup-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.device-info-section {
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.info-item .label {
  color: #666;
  font-size: 14px;
}

.info-item .value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.info-item .value.online {
  color: #52c41a;
}

.info-item .value.offline {
  color: #ff4d4f;
}

.control-buttons {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
}

.control-btn {
  flex: 1;
  height: 48px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
}

.filter-life-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.filter-list {
  space-y: 12px;
}

.filter-item {
  margin-bottom: 12px;
}

.filter-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.filter-name {
  font-size: 14px;
  color: #333;
}

.filter-percent {
  font-size: 14px;
  font-weight: 500;
  color: #1890ff;
}

.filter-progress {
  height: 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-bar.normal {
  background-color: #52c41a;
}

.progress-bar.warning {
  background-color: #ff8f1f;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.info-row span:first-child {
  color: #999;
}

.detail-action {
  text-align: center;
}

.popup-close {
  margin-top: 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 10px 0;
}

/* 师傅信息样式 */
.device-master {
  margin-top: 8px;
}

.master-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.master-label {
  color: #999;
  font-size: 12px;
}

.master-name {
  color: #333;
  font-weight: 500;
}

.master-phone {
  margin-left: 8px;
}

.phone-link {
  color: #1890ff;
  text-decoration: none;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: #f0f8ff;
  transition: all 0.2s ease;
}

.phone-link:hover {
  background-color: #e6f4ff;
  color: #0066cc;
}
</style> 
