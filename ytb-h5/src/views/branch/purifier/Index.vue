<template>
  <div class="purifier-container">
    <!-- 用户信息卡片 -->
    <div class="user-info-card">
      <div class="user-header">
        <div class="user-avatar">
          <img :src="userInfo.avatar || '/default-avatar.png'" alt="用户头像" />
        </div>
        <div class="user-details">
          <h3>{{ userInfo.name || '未设置姓名' }}</h3>
          <p class="user-phone">{{ userInfo.phone || '未绑定手机' }}</p>
          <p class="user-address">{{ userInfo.address || '未设置地址' }}</p>
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
              <van-image
                width="60"
                height="60"
                :src="device.image || '/images/product/purifier.png'"
                fit="contain"
              />
            </div>
            <div class="device-details">
              <div class="device-name">{{ device.name || '净水器设备' }}</div>
              <div class="device-number">设备编号：{{ device.device_id }}</div>
              <div class="device-address" v-if="device.location">{{ device.location }}</div>
            </div>
          </div>
          <div class="device-status-right">
            <van-tag :type="device.is_online ? 'success' : 'danger'" size="small">
              {{ device.is_online ? '在线' : '离线' }}
            </van-tag>
            <div class="device-status-text">{{ device.status || '正常' }}</div>
          </div>
        </div>

        <div class="device-stats">
          <div class="stat-item">
            <van-icon name="power" :color="device.is_online ? '#52c41a' : '#d9d9d9'" />
            <span class="stat-label">{{ device.is_online ? '开机' : '关机' }}</span>
          </div>
          <div class="stat-item">
            <van-icon name="signal" :color="device.is_online ? '#1890ff' : '#d9d9d9'" />
            <span class="stat-label">{{ device.is_online ? '在线' : '离线' }}</span>
          </div>
          <div class="stat-item">
            <van-icon name="drop-o" color="#1890ff" />
            <span class="stat-label">{{ device.type || '净水器' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 无设备状态 -->
    <div v-else class="no-device-card">
      <div class="no-device-content">
        <van-icon name="water-o" size="48" color="#ccc" />
        <p>您还没有绑定净水器设备</p>
        <van-button type="primary" @click="bindDevice">绑定设备</van-button>
      </div>
    </div>





    <!-- 滤芯详情弹窗 -->
    <van-popup v-model:show="showFilterDetail" position="bottom" round>
      <div class="filter-detail-popup">
        <div class="popup-header">
          <h3>滤芯详情</h3>
          <van-icon name="cross" @click="showFilterDetail = false" />
        </div>
        <div class="popup-content">
          <div 
            v-for="filter in filterStatus" 
            :key="filter.id"
            class="filter-detail-item"
          >
            <div class="filter-detail-info">
              <div class="filter-detail-name">{{ filter.name }}</div>
              <div class="filter-detail-desc">{{ filter.description }}</div>
              <div class="filter-detail-status">
                <span>使用时长：{{ filter.used_days }}天</span>
                <span>剩余时长：{{ filter.remaining_days }}天</span>
              </div>
            </div>
            <div class="filter-detail-action">
              <van-button 
                type="primary" 
                size="small" 
                :disabled="filter.percentage > 20"
                @click="purchaseFilter(filter)"
              >
                {{ filter.percentage > 20 ? '无需更换' : '立即购买' }}
              </van-button>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { showToast } from 'vant'
import { getUserDevices } from '@/api/device'
import { useRouter } from 'vue-router'

export default {
  name: 'BranchPurifierIndex',
  setup() {
    const router = useRouter()
    const showFilterDetail = ref(false)

    const userInfo = reactive({
      avatar: '',
      name: '',
      phone: '',
      address: ''
    })

    const deviceList = ref([])
    const loading = ref(false)



    // 获取设备列表
    const fetchDeviceList = async () => {
      try {
        loading.value = true

        const res = await getUserDevices()

        if (res.code === 0 && res.data) {
          deviceList.value = res.data.list || []
        } else {
          console.warn('获取设备列表失败:', res.code, res.message)
          showToast(res.message || '获取设备列表失败')
        }
      } catch (error) {
        console.error('获取设备列表失败', error)
        showToast('获取数据失败，请稍后再试')
      } finally {
        loading.value = false
      }
    }

    // 跳转到设备详情
    const goToDeviceDetail = (device) => {
      router.push(`/purifier/device-detail/${device.id}`)
    }

    // 功能方法
    const bindDevice = () => {
      showToast('绑定设备功能开发中')
    }

    onMounted(() => {
      fetchDeviceList()
    })

    return {
      showFilterDetail,
      userInfo,
      deviceList,
      loading,
      bindDevice,
      goToDeviceDetail
    }
  }
}
</script>

<style scoped>
.purifier-container {
  padding: 16px;
  background: #f5f5f5;
  min-height: 100vh;
}

/* 用户信息卡片 */
.user-info-card {
  background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  color: white;
}

.user-header {
  display: flex;
  align-items: center;
}

.user-avatar {
  margin-right: 16px;
}

.user-avatar img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.user-details h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: bold;
}

.user-phone {
  margin: 0 0 4px 0;
  font-size: 14px;
  opacity: 0.9;
}

.user-address {
  margin: 0;
  font-size: 12px;
  opacity: 0.8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.device-status-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.device-status-text {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.device-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}
  margin-bottom: 16px;
}

.device-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.device-info {
  margin-bottom: 16px;
}

.device-model,
.device-id,
.device-install-date {
  display: flex;
  margin-bottom: 8px;
}

.device-model:last-child,
.device-id:last-child,
.device-install-date:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 14px;
  color: #666;
  min-width: 80px;
}

.value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.device-actions {
  display: flex;
  gap: 12px;
}

/* 无设备状态 */
.no-device-card {
  background: white;
  border-radius: 12px;
  padding: 40px 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.no-device-content {
  text-align: center;
}

.no-device-content p {
  margin: 16px 0 24px 0;
  font-size: 14px;
  color: #666;
}

/* 滤芯状态 */
.filter-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.filter-item {
  margin-bottom: 16px;
}

.filter-item:last-child {
  margin-bottom: 0;
}

.filter-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.filter-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.filter-days {
  font-size: 12px;
  color: #666;
}

/* 用水统计 */
.water-stats-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stats-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.stats-tabs {
  display: flex;
  gap: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stats-value {
  font-size: 20px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 12px;
  color: #666;
}

/* 常用功能 */
.functions-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.functions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.function-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.3s;
  cursor: pointer;
}

.function-item:active {
  background: #f5f5f5;
  transform: scale(0.95);
}

.function-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  color: white;
}

.function-icon.water-quality {
  background: linear-gradient(45deg, #48dbfb, #0abde3);
}

.function-icon.maintenance {
  background: linear-gradient(45deg, #feca57, #ff9ff3);
}

.function-icon.purchase {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
}

.function-icon.service {
  background: linear-gradient(45deg, #54a0ff, #2e86de);
}

.function-text {
  font-size: 12px;
  color: #666;
  text-align: center;
}

/* 滤芯详情弹窗 */
.filter-detail-popup {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.popup-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.filter-detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 12px;
}

.filter-detail-item:last-child {
  margin-bottom: 0;
}

.filter-detail-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.filter-detail-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.filter-detail-status {
  display: flex;
  gap: 16px;
}

.filter-detail-status span {
  font-size: 11px;
  color: #999;
}
</style> 