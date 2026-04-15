<template>
  <div class="u-page">
    <!-- 导航栏 -->
    <van-nav-bar
      title="我的设备"
      left-arrow
      @click-left="$router.go(-1)"
      fixed
      placeholder
      style="background: #416efc; color: white;"
    />

    <!-- 内容区域 -->
    <div class="content">
      <!-- 加载中状态 -->
      <van-loading v-if="loading" class="loading-container" vertical>
        <template #icon>
          <van-icon name="spinner" class="loading-icon" />
        </template>
        加载中...
      </van-loading>

      <!-- 设备列表 -->
      <div v-else class="item">
        <!-- 空设备提示 -->
        <van-empty
          v-if="!devices.length"
          image="search"
          description="暂无设备"
          class="empty-state"
        />

        <!-- 设备卡片列表 -->
        <div v-else>
          <div
            v-for="(device, index) in devices"
            :key="index"
            class="device-card"
            @click="doDeviceClick(device)"
          >
            <!-- 设备图片 -->
            <div class="device-image">
              <img :src="getDeviceImage(device)" class="img" />
            </div>
            
            <!-- 设备信息 -->
            <div class="device-info">
              <!-- 标题+状态 -->
              <div class="device-header">
                <div class="title">{{ device.device_name || device.title || '净水器设备' }}</div>
                <div class="device-status">{{ getDeviceStatusText(device) }}</div>
              </div>
              
              <!-- 设备编号 -->
              <div class="device-code">
                设备编号：{{ device.device_id || device.code || device.uuid }}
              </div>
              
              <!-- 状态图标 -->
              <div class="info-icon">
                <div class="icon-item">
                  <img :src="getStatusIcon(device)" class="status-icon" />
                  <span>{{ getDeviceOnlineStatus(device) ? '开机' : '关机' }}</span>
                </div>
                <div class="icon-item">
                  <img src="/images/wl.png" class="status-icon" />
                  <span>{{ getNetworkStatus(device) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 浮动添加按钮 -->
    <div class="float-button">
      <img src="/images/sbxz.png" class="add-img" @click="addFunc" />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      devices: []
    }
  },
  mounted() {
    this.loadDevices()
  },
  methods: {
    // 加载设备列表
    loadDevices() {
      this.loading = true
      // 模拟设备数据
      setTimeout(() => {
        this.devices = [
          {
            id: 1,
            device_name: '净之泉智能净水器',
            device_id: '8803093',
            code: '8803093',
            title: '净之泉智能净水器',
            status: 1,
            networkStatus: '1',
            deviceStatus: '01',
            productType: '2'
          }
        ]
        this.loading = false
      }, 1000)
    },
    
    // 获取设备图片
    getDeviceImage(device) {
      return '/images/mrsb.png'
    },
    
    // 获取设备状态文本
    getDeviceStatusText(device) {
      const statusMap = {
        "00": "出厂设置",
        "01": "正常/水满", 
        "02": "欠费",
        "03": "制水故障",
        "04": "关机",
        "05": "漏水",
        "06": "待激活",
        "07": "正常/制水"
      }
      return statusMap[device.deviceStatus] || '未知状态'
    },
    
    // 获取状态图标
    getStatusIcon(device) {
      return '/images/kj.png'
    },
    
    // 获取设备在线状态
    getDeviceOnlineStatus(device) {
      return device.status === 1 || device.networkStatus === '1'
    },
    
    // 获取网络状态
    getNetworkStatus(device) {
      return device.networkStatus === '1' ? '在线' : '离线'
    },
    
    // 点击设备卡片
    doDeviceClick(device) {
      if (device.productType === '1') {
        this.$toast('智能配件不支持查看')
        return
      }
      // 跳转到设备详情页
      this.$router.push({
        path: '/device-detail',
        query: { id: device.id }
      })
    },
    
    // 添加设备
    addFunc() {
      this.$router.push('/device-active')
    }
  }
  }
}
</script>

<style scoped>
.my-devices {
  background-color: #f7f8fa;
  min-height: 100vh;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #969799;
}

.loading-icon {
  font-size: 30px;
  animation: van-rotate 1s linear infinite;
}

.device-list-container {
  padding: 16px;
}

.empty-state {
  margin-top: 100px;
}

.add-device-btn {
  margin-top: 16px;
}

.device-list {
  margin-bottom: 80px;
}

/* 设备项样式 - H5优化 */
.device-item {
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.device-item:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.device-info {
  flex: 1;
  min-width: 0;
}

.device-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1.4;
  word-break: break-all;
}

.main-tag {
  margin-left: 8px;
}

.device-status {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.device-details {
  color: #646566;
  font-size: 14px;
  line-height: 1.5;
}

.device-details p {
  margin: 4px 0;
}

.device-id {
  color: #969799;
  font-size: 12px;
}

.device-model {
  color: #646566;
  font-weight: 500;
}

.device-location {
  color: #646566;
}

.billing-mode {
  color: #1989fa;
  font-weight: 500;
}

.remaining-info {
  margin: 8px 0;
  padding: 8px 12px;
  background: #f7f8fa;
  border-radius: 8px;
  font-size: 14px;
}

.remaining-flow,
.remaining-days,
.remaining-bottles {
  color: #07c160;
  font-weight: 500;
}

.total-water {
  color: #1989fa;
  font-weight: 500;
}

.water-quality {
  display: flex;
  gap: 16px;
  margin: 8px 0;
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 8px;
  font-size: 14px;
}

.tds,
.ph {
  color: #0ea5e9;
  font-weight: 500;
}

.bind-time {
  color: #969799;
  font-size: 12px;
}

.device-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.control-buttons,
.manage-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* H5响应式适配 */
@media (max-width: 375px) {
  .device-item {
    padding: 12px;
    margin-bottom: 8px;
  }
  
  .device-name {
    font-size: 15px;
  }
  
  .device-status {
    grid-template-columns: 1fr;
  }
  
  .water-quality {
    flex-direction: column;
    gap: 4px;
  }
  
  .control-buttons .van-button {
    height: 32px;
    font-size: 12px;
    min-width: 50px;
  }
  
  .manage-buttons .van-button {
    height: 28px;
    font-size: 11px;
  }
}

/* 触摸反馈优化 */
@media (hover: none) and (pointer: coarse) {
  .device-item:hover {
    transform: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  
  .van-button:hover {
    transform: none;
  }
}

.control-buttons .van-button {
  flex: 1;
  min-width: 60px;
  height: 36px;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #ebedf0;
  background: white;
  color: #646566;
  transition: all 0.3s ease;
}

.control-buttons .van-button:active {
  transform: scale(0.95);
}

.control-buttons .van-button--primary {
  background: #1989fa;
  border-color: #1989fa;
  color: white;
}

.control-buttons .van-button--success {
  background: #07c160;
  border-color: #07c160;
  color: white;
}

.control-buttons .van-button--warning {
  background: #ff976a;
  border-color: #ff976a;
  color: white;
}

.manage-buttons .van-button {
  flex: 1;
  min-width: 60px;
  height: 32px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid #ebedf0;
  background: #f7f8fa;
  color: #646566;
  transition: all 0.3s ease;
}

.manage-buttons .van-button:active {
  transform: scale(0.95);
}

.manage-buttons .van-button--primary {
  background: #e8f3ff;
  border-color: #1989fa;
  color: #1989fa;
}

.manage-buttons .van-button--danger {
  background: #ffebee;
  border-color: #ee0a24;
  color: #ee0a24;
}

/* 主设备标识 */
.main-device-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, #ffd700, #ffb347);
  color: #8b4513;
  font-size: 10px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 0 12px 0 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.device-status {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.status-item .label {
  color: #646566;
}

.status-item .value {
  color: #323233;
  font-weight: 500;
}

.water-quality {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #e8f4fd;
  border-radius: 6px;
}

.quality-item {
  display: flex;
  gap: 4px;
  font-size: 13px;
}

.quality-item .label {
  color: #1989fa;
}

.quality-item .value {
  color: #323233;
  font-weight: 500;
}

.bind-time {
  font-size: 12px;
  color: #969799;
  margin-bottom: 12px;
}

.device-operations {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.add-device-floating-btn {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.4);
}

.add-device-form {
  padding: 20px;
}

.add-device-form h3 {
  text-align: center;
  margin-bottom: 20px;
  color: #323233;
}

.form-actions {
  margin-top: 20px;
}

@keyframes van-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* H5适配样式 */
.my-devices {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: env(safe-area-inset-bottom);
}

/* 加载状态 */
.loading-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 999;
}

.loading-icon {
  font-size: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 设备列表容器 */
.device-list-container {
  padding: 16px;
  padding-top: 0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #969799;
}

.empty-state .van-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: #dcdee0;
}

.empty-state p {
  font-size: 16px;
  margin: 8px 0;
}

.empty-state .van-button {
  margin-top: 24px;
}

/* 搜索筛选栏样式 */
.search-filter-bar {
  background: white;
  padding: 12px 16px;
  margin: 0 -16px 12px -16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-filter-bar .van-search {
  padding: 0;
}

.search-filter-bar .van-search__content {
  border-radius: 20px;
  background: #f7f8fa;
}

.search-filter-bar .van-button {
  margin-left: 8px;
  border-radius: 16px;
  padding: 0 12px;
  height: 32px;
  line-height: 30px;
}

/* 筛选标签样式 */
.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  padding: 0 4px;
}

.filter-tags .van-tag {
  border-radius: 12px;
  font-size: 12px;
  padding: 4px 8px;
}

.clear-all-filters {
  color: #1989fa;
  font-size: 12px;
  padding: 4px 8px;
  background: #f0f9ff;
  border: 1px solid #1989fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-all-filters:active {
  background: #1989fa;
  color: white;
}

/* 筛选弹窗样式 */
.filter-popup {
  border-radius: 16px 16px 0 0;
}

.filter-popup .van-popup__close-icon {
  top: 16px;
  right: 16px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 16px 16px;
  border-bottom: 1px solid #ebedf0;
}

.filter-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #323233;
}

.filter-content {
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-section h4 {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 12px 0;
  color: #323233;
}

.filter-actions {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #ebedf0;
  background: white;
}

.filter-actions .van-button {
  flex: 1;
  border-radius: 20px;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .device-status {
    grid-template-columns: 1fr;
  }
  
  .water-quality {
    flex-direction: column;
    gap: 4px;
  }
}
</style>