<template>
  <div class="my-devices-container">
    <div class="content">
      <!-- 设备项 -->
      <div class="device-item" v-for="device in filteredDevices" :key="device.id" @click="goToDeviceDetail(device)">
        <div class="device-info">
          <h3>{{ device.name }}</h3>
          <p>点击查看详情</p>
        </div>
      </div>
      <p class="tips" v-if="filteredDevices.length === 0">我的设备功能开发中...</p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// 模拟设备数据
const filteredDevices = [
  { id: 1, name: '净之泉可智能净水器', status: 'online' }
]

// 跳转到设备详情页面
const goToDeviceDetail = (device) => {
  router.push(`/device/detail-new/${device.id}`)
}
</script>

<style scoped>
.my-devices-container {
  padding-bottom: 50px;
  padding-top: 20px; /* 添加顶部内边距替代导航条空间 */
}

.content {
  padding: 20px;
}

.device-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
}

.device-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.device-info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #323233;
}

.device-info p {
  margin: 0;
  font-size: 14px;
  color: #969799;
}

.tips {
  font-size: 16px;
  color: #999;
  text-align: center;
  margin-top: 50px;
}
</style>