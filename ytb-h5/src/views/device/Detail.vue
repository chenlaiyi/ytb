<template>
  <div class="device-detail-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="设备详情"
      left-text="返回"
      left-arrow
      @click-left="goBack"
      :style="{ background: '#416efc', color: '#fff' }"
    >
      <template #right>
        <van-icon name="replay" @click="refreshDevice" />
      </template>
    </van-nav-bar>

    <div v-if="loading" class="loading-container">
      <van-loading color="#416efc" size="24px">加载中...</van-loading>
    </div>

    <!-- 设备详情信息列表 -->
    <div v-else class="device-info-list">
      <div class="info-item">
        <span class="info-label">设备编号:</span>
        <span class="info-value">{{ deviceInfo.device_number || deviceInfo.number || '未知' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">设备型号:</span>
        <span class="info-value">{{ deviceInfo.device_name || '未知' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">设备状态:</span>
        <span class="info-value">{{ getStatusText(deviceInfo.status) }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">原水值:</span>
        <span class="info-value">{{ deviceInfo.raw_water_value || '0' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">净水值:</span>
        <span class="info-value">{{ deviceInfo.purification_water_value || '0' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">计费模式:</span>
        <span class="info-value">{{ getBillingModeText(deviceInfo.billing_mode) }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">剩余流量:</span>
        <span class="info-value">{{ deviceInfo.surplus_flow || '0' }}升</span>
      </div>
      <div class="info-item">
        <span class="info-label">剩余天数:</span>
        <span class="info-value">{{ deviceInfo.remaining_days || '0' }}天</span>
      </div>
      <div class="info-item">
        <span class="info-label">累计过滤流量:</span>
        <span class="info-value">{{ deviceInfo.cumulative_filtration_flow || '0' }}升</span>
      </div>
      <div class="info-item">
        <span class="info-label">网络状态:</span>
        <span class="info-value">{{ deviceInfo.is_online ? '在线' : '离线' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">设备地址:</span>
        <span class="info-value">{{ deviceInfo.location || deviceInfo.address || '未设置' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">激活日期:</span>
        <span class="info-value">{{ formatDate(deviceInfo.activated_at) }}</span>
      </div>

      <!-- 设备控制按钮 -->
      <div class="control-section">
        <van-button
          type="danger"
          size="large"
          @click="showControlDialog"
          :loading="controlLoading"
        >
          {{ deviceInfo.status === '04' ? '关机' : '开机' }}
        </van-button>
      </div>
    </div>

    <!-- 控制确认弹窗 -->
    <van-dialog
      v-model:show="showDialog"
      title="设备控制"
      :message="dialogMessage"
      show-cancel-button
      @confirm="confirmControl"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showFailToast, showSuccessToast } from 'vant'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(true)
const controlLoading = ref(false)
const showDialog = ref(false)
const deviceInfo = ref({})

// 计算属性
const dialogMessage = computed(() => {
  const action = deviceInfo.value.status === '04' ? '关机' : '开机'
  return `确定要${action}设备吗？`
})

// 格式化函数
const getStatusText = (status) => {
  const statusMap = {
    '01': '离线',
    '02': '在线',
    '03': '故障',
    '04': '运行中',
    '05': '待机',
    '06': '维护中',
    '07': '关机'
  }
  return statusMap[status] || '未知'
}

const getBillingModeText = (mode) => {
  const modeMap = {
    '0': '包年包月',
    '1': '按流量计费',
    '2': '按时间计费'
  }
  return modeMap[mode] || '未知'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '未知'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN')
  } catch (e) {
    return '未知'
  }
}

// 获取设备详情数据
const getDeviceDetail = async () => {
  loading.value = true
  try {
    const deviceId = route.params.id
    console.log('🔍 [设备详情] 获取设备ID:', deviceId)

    // 调用Laravel API获取设备详情
    const response = await request({
      url: `/api/mobile/v1/devices/${deviceId}`,
      method: 'GET'
    })

    console.log('📡 [设备详情] Laravel API响应:', response)

    if (response.code === 200 && response.data) {
      deviceInfo.value = response.data
      console.log('✅ [设备详情] 数据设置完成:', deviceInfo.value)
    } else {
      showFailToast(response.message || '获取设备详情失败')
    }
  } catch (error) {
    console.error('❌ [设备详情] 请求异常:', error)
    showFailToast('获取设备详情失败')
  } finally {
    loading.value = false
  }
}

// 显示控制弹窗
const showControlDialog = () => {
  showDialog.value = true
}

// 确认控制设备
const confirmControl = async () => {
  controlLoading.value = true
  try {
    const action = deviceInfo.value.status === '04' ? 'power_off' : 'power_on'
    const deviceNumber = deviceInfo.value.device_number

    console.log('🔄 [设备控制] 执行操作:', { action, deviceNumber })

    // 调用设备控制API
    const response = await request({
      url: '/api/mobile/v1/devices/control',
      method: 'POST',
      data: {
        device_id: deviceInfo.value.id,
        device_number: deviceNumber,
        action: action
      }
    })

    if (response.code === 200) {
      // 更新设备状态
      const newStatus = action === 'power_on' ? '04' : '07'
      deviceInfo.value.status = newStatus

      showSuccessToast(action === 'power_on' ? '设备已开机' : '设备已关机')

      // 延迟刷新设备状态
      setTimeout(() => {
        getDeviceDetail()
      }, 2000)
    } else {
      showFailToast(response.message || '操作失败')
    }
  } catch (error) {
    console.error('❌ [设备控制] 操作失败:', error)
    showFailToast('操作失败')
  } finally {
    controlLoading.value = false
  }
}

// 刷新设备信息
const refreshDevice = () => {
  getDeviceDetail()
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 页面加载时获取数据
onMounted(() => {
  const deviceId = route.params.id
  if (deviceId) {
    getDeviceDetail()
  } else {
    showFailToast('设备ID不能为空')
    router.back()
  }
})
</script>

<style scoped>
.device-detail-container {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 导航栏样式 */
:deep(.van-nav-bar) {
  background: #416efc !important;
}

:deep(.van-nav-bar__title) {
  color: #fff !important;
}

:deep(.van-nav-bar__text) {
  color: #fff !important;
}

:deep(.van-nav-bar .van-icon) {
  color: #fff !important;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  margin-top: 100px;
}

/* 设备信息列表 */
.device-info-list {
  background: #fff;
  margin: 16px;
  border-radius: 8px;
  overflow: hidden;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  min-height: 48px;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #333;
  font-size: 14px;
  flex-shrink: 0;
  width: 80px;
  font-weight: 500;
}

.info-value {
  color: #666;
  font-size: 14px;
  flex: 1;
  text-align: right;
  word-break: break-all;
}

/* 控制按钮区域 */
.control-section {
  margin-top: 16px;
  border-top: 8px solid #f5f5f5;
  padding: 16px;
  text-align: center;
}

.control-section .van-button {
  width: 100%;
  height: 44px;
  border-radius: 6px;
}
</style>
