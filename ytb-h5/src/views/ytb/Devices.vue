<template>
  <div class="ytb-devices">
    <van-nav-bar title="我的净水器" />

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadDevices"
      >
        <div v-if="!loading && devices.length === 0" class="empty-state">
          <van-icon name="filter-o" size="64" color="#ddd" />
          <div class="empty-text">暂无绑定的净水设备</div>
          <div class="empty-tip">如需绑定请联系工作人员</div>
          <div class="empty-actions">
            <van-button type="primary" round @click="handleAddDevice">添加设备</van-button>
            <van-button plain round @click="contactService">联系客服</van-button>
          </div>
        </div>

        <div v-else>
          <div class="device-header-bar">
            <div class="device-count-badge" v-if="showDeviceList">
              <van-icon name="cluster-o" size="14" color="#1989fa" />
              <span>{{ devices.length }}台设备</span>
            </div>
            <div class="single-device-title" v-else>
              <span>我的净水器</span>
            </div>
            <div class="add-device-btn" @click="handleAddDevice">
              <van-icon name="plus" size="14" />
              <span>添加设备</span>
            </div>
          </div>

          <div class="device-list-container">
            <div class="device-list">
              <div
                v-for="device in devices"
                :key="device.id"
                class="device-list-item"
                :class="{ 'has-warning': device.has_warning }"
                @click="goToDetail(device)"
              >
                <div class="device-item-left">
                  <img
                    class="device-product-image"
                    :src="device.product_image"
                    alt="设备"
                  />
                  <div class="device-online-badge" :class="device.is_online ? 'online' : 'offline'">
                    <div class="badge-dot"></div>
                  </div>
                </div>

                <div class="device-item-middle">
                  <div class="device-item-top">
                    <div class="device-item-name">
                      {{ device.brand ? device.brand + ' ' : '' }}{{ device.device_model || '净水器' }}
                    </div>
                    <div class="warning-tags" v-if="device.has_warning">
                      <span
                        v-for="(warning, index) in device.warnings"
                        :key="index"
                        class="warning-tag"
                      >
                        {{ warning }}
                      </span>
                    </div>
                  </div>

                  <div class="device-item-code">编号: {{ device.board_code || device.sn || '-' }}</div>

                  <div class="device-item-quota">
                    <template v-if="device.billing_mode === 'flow'">
                      <span class="quota-label">剩余流量</span>
                      <span class="quota-value">{{ formatNumber(device.surplus_flow) }}</span>
                      <span class="quota-unit">L</span>
                    </template>
                    <template v-else>
                      <span class="quota-label">剩余</span>
                      <span class="quota-value">{{ device.remaining_days || 0 }}</span>
                      <span class="quota-unit">天</span>
                    </template>
                  </div>

                  <div class="device-item-address" v-if="device.address">
                    <van-icon name="location-o" size="12" color="#999" />
                    <span>{{ device.address }}</span>
                  </div>
                </div>

                <div class="device-item-right">
                  <van-icon name="arrow" size="14" color="#999" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </van-list>
    </van-pull-refresh>

    <YtbTabBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getMyDevices, isLoggedIn } from '@/api/ytb'
import YtbTabBar from '@/components/ytb/TabBar.vue'
import { useYtbShare } from '@/composables/useYtbShare'

// 设置亿拓宝分享配置
useYtbShare('亿拓宝联盟 - 我的净水器')

const router = useRouter()

const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const devices = ref([])
const page = ref(1)
const pageSize = 10

const PRODUCT_IMAGE_MAP = {
  小扁豆: 'https://payitapgo.oss-cn-shanghai.aliyuncs.com/uploads/devices/2026/01/09/xiaobiandou.png',
  大扁豆: 'https://payitapgo.oss-cn-shanghai.aliyuncs.com/uploads/devices/2026/01/09/dabiandou.png',
  商务机: 'https://payitapgo.oss-cn-shanghai.aliyuncs.com/uploads/devices/2026/01/09/shangwuji.png',
  屠龙: 'https://payitapgo.oss-cn-shanghai.aliyuncs.com/uploads/devices/2026/01/09/tulong.png'
}

const DEFAULT_PRODUCT_IMAGE = 'https://payitapgo.oss-cn-shanghai.aliyuncs.com/uploads/devices/default.png'

const showDeviceList = computed(() => devices.value.length > 1)

const normalizeBillingMode = (mode, remainingDays) => {
  const normalized = String(mode || '').toLowerCase()
  if (['time', 'duration', '0'].includes(normalized)) return 'duration'
  if (['flow', '1'].includes(normalized)) return 'flow'
  if (Number(remainingDays) > 0) return 'duration'
  return 'flow'
}

const getProductImage = (deviceModel) => {
  if (!deviceModel) return DEFAULT_PRODUCT_IMAGE
  return PRODUCT_IMAGE_MAP[deviceModel] || DEFAULT_PRODUCT_IMAGE
}

const buildWarnings = (device, filterLife, isOnline) => {
  const warnings = []
  if (device.fault_type || device.has_fault) {
    warnings.push(device.fault_type || '故障')
  }
  if (filterLife !== null && filterLife <= 20) {
    warnings.push('滤芯更换')
  }
  if (!isOnline) {
    warnings.push('离线')
  }
  return Array.from(new Set(warnings))
}

const formatDevice = (device) => {
  const deviceModel = device.device_model || device.model || device.deviceModel || ''
  const boardCode = device.board_code || device.sn || device.boardCode || ''
  const billingMode = normalizeBillingMode(device.billing_mode || device.billingMode, device.remaining_days || device.remainingDays)
  const isOnline = Boolean(device.is_online || device.isOnline || device.net_status === '1' || device.status === 'online')
  const filterLife = Number(device.filter_life ?? 100)
  const warnings = device.warnings && device.warnings.length > 0
    ? device.warnings
    : buildWarnings(device, filterLife, isOnline)

  return {
    ...device,
    brand: device.brand || '',
    device_model: deviceModel,
    board_code: boardCode,
    billing_mode: billingMode,
    surplus_flow: Number(device.surplus_flow ?? device.surplusFlow ?? 0),
    remaining_days: Number(device.remaining_days ?? device.remainingDays ?? 0),
    is_online: isOnline,
    filter_life: filterLife,
    warnings,
    has_warning: warnings.length > 0,
    product_image: device.product_image || getProductImage(deviceModel)
  }
}

const loadDevices = async () => {
  if (refreshing.value) return

  try {
    loading.value = true
    const res = await getMyDevices({ page: page.value, page_size: pageSize })

    if (res.code === 0) {
      const list = res.data.list || res.data || []
      const newDevices = list.map(formatDevice)
      if (page.value === 1) {
        devices.value = newDevices
      } else {
        devices.value.push(...newDevices)
      }

      if (newDevices.length < pageSize) {
        finished.value = true
      } else {
        page.value++
      }
    } else {
      showToast(res.message || '加载失败')
      finished.value = true
    }
  } catch (error) {
    if (error?.response?.status === 401) {
      return
    }
    console.error('加载设备失败:', error)
    showToast('网络错误')
    finished.value = true
  } finally {
    loading.value = false
  }
}

const onRefresh = async () => {
  refreshing.value = true
  page.value = 1
  finished.value = false
  devices.value = []
  await loadDevices()
  refreshing.value = false
}

const goToDetail = (device) => {
  router.push(`/ytb/device/${device.id}`)
}

const handleAddDevice = () => {
  showToast('请联系工作人员添加设备')
}

const contactService = () => {
  showToast('客服热线：400-xxx-xxxx')
}

const formatNumber = (value) => {
  const num = Number(value || 0)
  return Number.isNaN(num) ? 0 : num
}

onMounted(() => {
  if (!isLoggedIn()) {
    router.replace('/ytb/login')
    return
  }
  loadDevices()
})
</script>

<style scoped>
.ytb-devices {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 60px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}

.empty-text {
  font-size: 16px;
  color: #333;
  margin-top: 16px;
}

.empty-tip {
  font-size: 14px;
  color: #999;
  margin-top: 8px;
}

.empty-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.device-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  margin: 12px 0 8px;
}

.device-count-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #e6f4ff 0%, #d4ebff 100%);
  border-radius: 16px;
  font-size: 12px;
  color: #1989fa;
  font-weight: 500;
}

.single-device-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.add-device-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #1989fa, #4aa3ff);
  border-radius: 16px;
  font-size: 12px;
  color: #fff;
  box-shadow: 0 2px 8px rgba(25, 137, 250, 0.2);
}

.device-list-container {
  margin-bottom: 12px;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 12px 12px;
}

.device-list-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.device-list-item.has-warning {
  background: linear-gradient(135deg, #fff5f5 0%, #fff 100%);
  border: 1px solid #ffccc7;
}

.device-list-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #1989fa 0%, #4aa3ff 100%);
  opacity: 0;
}

.device-list-item.has-warning::before {
  background: linear-gradient(180deg, #ff4d4f 0%, #ff7875 100%);
  opacity: 1;
}

.device-item-left {
  position: relative;
  margin-right: 12px;
  flex-shrink: 0;
}

.device-product-image {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #f5f5f5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  object-fit: cover;
}

.device-online-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-online-badge .badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d9d9d9;
}

.device-online-badge.online .badge-dot {
  background: #52c41a;
}

.device-item-middle {
  flex: 1;
}

.device-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.device-item-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.warning-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.warning-tag {
  padding: 2px 6px;
  background: #ff4d4f;
  color: #fff;
  font-size: 10px;
  border-radius: 4px;
  white-space: nowrap;
}

.device-item-code {
  font-size: 12px;
  color: #666;
  margin-top: 6px;
  font-family: "SF Mono", "Monaco", monospace;
}

.device-item-quota {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 8px;
  padding: 4px 8px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f4ff 100%);
  border-radius: 6px;
}

.quota-label {
  font-size: 12px;
  color: #4a6fa5;
}

.quota-value {
  font-size: 16px;
  font-weight: 700;
  color: #1989fa;
}

.quota-unit {
  font-size: 12px;
  color: #4a6fa5;
}

.device-item-address {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.device-item-right {
  display: flex;
  align-items: center;
  margin-left: 8px;
}
</style>
