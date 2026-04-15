<template>
  <div class="ytb-device-detail">
    <van-nav-bar title="设备详情" left-arrow @click-left="goBack" />

    <van-loading v-if="loading" class="page-loading" size="36" vertical>加载中...</van-loading>

    <template v-else-if="device">
      <div class="status-card">
        <div class="device-header">
          <div class="device-main-info">
            <div class="device-name">
              {{ device.brand ? device.brand + ' ' : '' }}{{ device.device_model || '净水器' }}
            </div>
            <div class="device-code">编号: {{ device.board_code || device.sn || '-' }}</div>
          </div>
          <div class="device-status-badge" :class="statusClass">
            <div class="status-dot"></div>
            <span>{{ statusText }}</span>
          </div>
        </div>

        <div class="data-grid">
          <template v-if="device.billing_mode === 'flow'">
            <div class="data-item">
              <div class="data-value">
                {{ stats.totalUsage }}<span class="data-unit">L</span>
              </div>
              <div class="data-label">已使用</div>
            </div>
            <div class="data-divider"></div>
            <div class="data-item">
              <div class="data-value highlight">
                {{ stats.surplusFlow }}<span class="data-unit">L</span>
              </div>
              <div class="data-label">剩余流量</div>
            </div>
            <div class="data-divider"></div>
            <div class="data-item">
              <div class="data-value">{{ stats.signalStrength }}<span class="data-unit">dBm</span></div>
              <div class="data-label">信号强度</div>
            </div>
          </template>
          <template v-else>
            <div class="data-item">
              <div class="data-value">
                {{ stats.usedDays }}<span class="data-unit">天</span>
              </div>
              <div class="data-label">已使用</div>
            </div>
            <div class="data-divider"></div>
            <div class="data-item">
              <div class="data-value highlight">
                {{ stats.remainingDays }}<span class="data-unit">天</span>
              </div>
              <div class="data-label">剩余天数</div>
            </div>
            <div class="data-divider"></div>
            <div class="data-item">
              <div class="data-value date-value">{{ stats.expireDate }}</div>
              <div class="data-label">服务到期</div>
            </div>
          </template>
        </div>

        <div class="status-indicators">
          <div class="indicator" :class="{ active: device.is_activated }">
            <van-icon :name="device.is_activated ? 'checked' : 'close'" size="14" />
            <span>{{ device.is_activated ? '已激活' : '未激活' }}</span>
          </div>
          <div class="indicator">
            <van-icon name="orders-o" size="14" />
            <span>{{ device.billing_mode_text || billingModeText }}</span>
          </div>
        </div>
      </div>

      <div class="package-card">
        <div class="package-card-header">
          <div class="package-card-title">
            <span class="package-icon">📦</span>
            <span>我的套餐</span>
          </div>
          <div class="package-more">
            <span>管理</span>
            <van-icon name="arrow" size="12" />
          </div>
        </div>
        <div class="package-card-body">
          <div v-if="currentPackage" class="package-info">
            <div class="package-name-row">
              <span class="package-name">{{ currentPackage.name }}</span>
              <van-tag type="success" size="small">使用中</van-tag>
            </div>
            <div class="package-meta">
              <span class="package-type">{{ currentPackage.type_text }}</span>
              <span v-if="currentPackage.service_end_date" class="package-expire">到期: {{ currentPackage.service_end_date }}</span>
            </div>
          </div>
          <div v-else class="no-package-tip">
            <van-icon name="info-o" size="18" color="#999" />
            <span>暂无生效套餐，联系工作人员开通</span>
          </div>
        </div>
      </div>

      <div class="tds-showcase-card">
        <div class="tds-card-header">
          <div class="tds-card-title">
            <span class="tds-title-icon">💧</span>
            <span>水质实时监测</span>
          </div>
          <div class="tds-refresh-btn" @click="loadDevice">
            <van-icon name="replay" size="14" />
            <span>刷新</span>
          </div>
        </div>
        <div class="tds-comparison">
          <div class="tds-drop raw-water">
            <div class="drop-shape">
              <div class="drop-inner">
                <div class="tds-value-wrap">
                  <span class="tds-number">{{ tdsData.rawWater }}</span>
                  <span class="tds-unit">ppm</span>
                </div>
              </div>
            </div>
            <div class="tds-label">原水TDS</div>
            <div class="tds-quality" :class="tdsData.rawWaterLevel">{{ tdsData.rawWaterText }}</div>
          </div>

          <div class="purify-arrow">
            <div class="arrow-line"></div>
            <div class="arrow-icon">
              <van-icon name="arrow" size="20" color="#52c41a" />
            </div>
            <div class="purify-rate">
              <span class="rate-value">{{ tdsData.purifyRate }}%</span>
              <span class="rate-label">净化率</span>
            </div>
          </div>

          <div class="tds-drop pure-water">
            <div class="drop-shape">
              <div class="drop-inner">
                <div class="tds-value-wrap">
                  <span class="tds-number">{{ tdsData.pureWater }}</span>
                  <span class="tds-unit">ppm</span>
                </div>
              </div>
            </div>
            <div class="tds-label">净水TDS</div>
            <div class="tds-quality" :class="tdsData.pureWaterLevel">{{ tdsData.pureWaterText }}</div>
          </div>
        </div>
      </div>

      <div class="filter-tech-card">
        <div class="section-title">滤芯状态</div>
        <div class="filter-tube-grid" :style="{ '--filter-columns': filterColumns }">
          <div
            v-for="(filter, index) in filters"
            :key="index"
            class="filter-tube-cell"
            :class="getFilterStatusClass(filter.life)"
          >
            <div class="tube-body">
              <div class="tube-fill" :style="{ height: `${filter.life}%` }"></div>
            </div>
            <div class="filter-tube-name">{{ filter.name }}</div>
            <div class="filter-tube-percent">{{ filter.life }}%</div>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">用水统计</div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalUsage }}</div>
            <div class="stat-label">累计用水(L)</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ device.today_water || 0 }}</div>
            <div class="stat-label">今日用水(L)</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ device.month_water || 0 }}</div>
            <div class="stat-label">本月用水(L)</div>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">设备信息</div>
        <van-cell-group :border="false">
          <van-cell title="设备编号" :value="device.board_code || device.sn || '-'" />
          <van-cell title="设备型号" :value="device.device_model || device.model || '-'" />
          <van-cell title="安装地址" :value="device.address || device.install_address || '-'" />
          <van-cell title="联系人" :value="device.contact_name || '-'" />
          <van-cell title="联系电话" :value="device.contact_phone || '-'" />
          <van-cell title="IMEI" :value="device.imei || '-'" />
          <van-cell title="ICCID" :value="device.iccid || '-'" />
          <van-cell title="最后在线" :value="formatDateTime(device.last_online_at)" />
        </van-cell-group>
      </div>

      <div class="action-section">
        <van-button type="primary" block round @click="contactService">联系客服</van-button>
      </div>
    </template>

    <van-empty v-else description="设备不存在" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getDeviceDetail } from '@/api/ytb'
import { useYtbShare } from '@/composables/useYtbShare'

// 设置亿拓宝分享配置
useYtbShare('亿拓宝联盟 - 设备详情')

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const device = ref(null)
const currentPackage = ref(null)

const normalizeBillingMode = (mode, remainingDays) => {
  const normalized = String(mode || '').toLowerCase()
  if (['time', 'duration', '0'].includes(normalized)) return 'duration'
  if (['flow', '1'].includes(normalized)) return 'flow'
  if (Number(remainingDays) > 0) return 'duration'
  return 'flow'
}

const billingModeText = computed(() => {
  return device.value?.billing_mode === 'duration' ? '时长计费' : '流量计费'
})

const statusClass = computed(() => {
  if (!device.value) return 'offline'
  if (device.value.has_fault) return 'fault'
  return device.value.is_power_on ? 'online' : 'offline'
})

const statusText = computed(() => {
  if (!device.value) return '未知'
  if (device.value.has_fault) return device.value.fault_type || '故障'
  return device.value.is_power_on ? '运行中' : '已关机'
})

const stats = computed(() => {
  if (!device.value) {
    return {
      totalUsage: 0,
      surplusFlow: 0,
      signalStrength: 0,
      expireDate: '--',
      remainingDays: 0,
      usedDays: 0
    }
  }

  return {
    totalUsage: formatNumber(device.value.total_water),
    surplusFlow: formatNumber(device.value.surplus_flow),
    signalStrength: device.value.signal_intensity || 0,
    expireDate: formatDate(device.value.service_end_date) || '--',
    remainingDays: device.value.remaining_days || 0,
    usedDays: device.value.used_days || 0
  }
})

const tdsData = computed(() => {
  if (!device.value) {
    return {
      rawWater: 0,
      pureWater: 0,
      rawWaterText: '--',
      pureWaterText: '--',
      rawWaterLevel: '',
      pureWaterLevel: '',
      purifyRate: 0
    }
  }

  const raw = Number(device.value.raw_water_value || 0)
  const pure = Number(device.value.purification_water_value || 0)
  const rawLevel = getWaterQualityLevel(raw)
  const pureLevel = getWaterQualityLevel(pure)
  const purifyRate = raw > 0 ? Math.max(0, Math.min(100, Math.round((1 - pure / raw) * 100))) : 0

  return {
    rawWater: raw,
    pureWater: pure,
    rawWaterText: rawLevel.text,
    pureWaterText: pureLevel.text,
    rawWaterLevel: rawLevel.level,
    pureWaterLevel: pureLevel.level,
    purifyRate
  }
})

const filters = computed(() => {
  if (!device.value) return []
  if (device.value.filters && device.value.filters.length > 0) return device.value.filters
  return []
})

const filterColumns = computed(() => {
  return Math.max(filters.value.length, 1)
})

const getWaterQualityLevel = (tds) => {
  if (tds <= 10) return { level: 'excellent', text: '优质' }
  if (tds <= 50) return { level: 'good', text: '良好' }
  if (tds <= 150) return { level: 'normal', text: '一般' }
  return { level: 'poor', text: '较差' }
}

const getFilterStatusClass = (life) => {
  if (life <= 10) return 'danger'
  if (life <= 30) return 'warning'
  return 'normal'
}

const loadDevice = async () => {
  const deviceId = route.params.id
  if (!deviceId) {
    showToast('设备ID无效')
    loading.value = false
    return
  }

  try {
    loading.value = true
    const res = await getDeviceDetail(deviceId)
    if (res.code === 0) {
      const data = res.data
      device.value = {
        ...data,
        brand: data.brand || '',
        device_model: data.device_model || data.model || '',
        board_code: data.board_code || data.sn || '',
        billing_mode: normalizeBillingMode(data.billing_mode, data.remaining_days)
      }
    } else {
      showToast(res.message || '加载失败')
    }
  } catch (error) {
    console.error('加载设备详情失败:', error)
    showToast('网络错误')
  } finally {
    loading.value = false
  }
}

const formatNumber = (value) => {
  const num = Number(value || 0)
  return Number.isNaN(num) ? 0 : num
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const contactService = () => {
  showToast('客服热线：400-xxx-xxxx')
}

const goBack = () => router.back()

onMounted(() => {
  loadDevice()
})
</script>

<style scoped>
.ytb-device-detail {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 20px;
}

.page-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}

.status-card {
  background: linear-gradient(135deg, #1989fa 0%, #4aa3ff 100%);
  border-radius: 16px;
  padding: 20px;
  color: #fff;
  margin: 12px;
  box-shadow: 0 8px 20px rgba(25, 137, 250, 0.3);
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.device-main-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.device-name {
  font-size: 18px;
  font-weight: bold;
}

.device-code {
  font-size: 12px;
  opacity: 0.85;
}

.device-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
}

.device-status-badge.online {
  background: rgba(82, 196, 26, 0.3);
}

.device-status-badge.offline {
  background: rgba(255, 255, 255, 0.2);
}

.device-status-badge.fault {
  background: rgba(255, 77, 79, 0.4);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
}

.data-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 16px 0;
}

.data-item {
  flex: 1;
  text-align: center;
}

.data-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);
}

.data-value {
  font-size: 20px;
  font-weight: bold;
}

.data-value.highlight {
  color: #ffe58f;
}

.data-unit {
  font-size: 12px;
  margin-left: 2px;
}

.data-label {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 4px;
}

.date-value {
  font-size: 12px;
}

.status-indicators {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  font-size: 12px;
}

.indicator.active {
  background: rgba(82, 196, 26, 0.3);
}

.package-card {
  background: #fff;
  border-radius: 16px;
  margin: 12px;
  padding: 16px;
  position: relative;
  overflow: hidden;
}

.package-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #ff976a, #ff7a45, #fa541c);
}

.package-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.package-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #333;
}

.package-more {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.no-package-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 13px;
}

.tds-showcase-card {
  background: #fff;
  border-radius: 16px;
  margin: 12px;
  padding: 16px;
}

.tds-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.tds-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #333;
}

.tds-refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #1989fa;
}

.tds-comparison {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tds-drop {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.drop-shape {
  width: 80px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drop-inner {
  width: 64px;
  height: 80px;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.raw-water .drop-inner {
  background: linear-gradient(180deg, #ffd89b 0%, #f5a623 60%, #e09915 100%);
}

.pure-water .drop-inner {
  background: linear-gradient(180deg, #89f7fe 0%, #52c41a 60%, #36a910 100%);
}

.tds-value-wrap {
  color: #fff;
  text-align: center;
}

.tds-number {
  font-size: 20px;
  font-weight: bold;
}

.tds-unit {
  font-size: 12px;
  display: block;
  opacity: 0.9;
}

.tds-label {
  font-size: 12px;
  color: #666;
}

.tds-quality {
  font-size: 12px;
  font-weight: 600;
}

.tds-quality.excellent {
  color: #52c41a;
}

.tds-quality.good {
  color: #1989fa;
}

.tds-quality.normal {
  color: #faad14;
}

.tds-quality.poor {
  color: #ff4d4f;
}

.purify-arrow {
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.purify-rate {
  text-align: center;
  color: #52c41a;
}

.rate-value {
  font-size: 14px;
  font-weight: bold;
  display: block;
}

.rate-label {
  font-size: 12px;
}

.filter-tech-card {
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-radius: 16px;
  padding: 16px;
  margin: 12px;
  color: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.filter-tech-card .section-title {
  color: #fff;
  font-size: 14px;
  margin-bottom: 12px;
}

.filter-tube-grid {
  display: grid;
  grid-template-columns: repeat(var(--filter-columns, 1), minmax(0, 1fr));
  gap: 10px;
}

.filter-tube-cell {
  text-align: center;
}

.tube-body {
  width: 24px;
  height: 80px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  margin: 0 auto 8px;
  position: relative;
  overflow: hidden;
}

.tube-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, #95de64 0%, #52c41a 100%);
}

.filter-tube-cell.warning .tube-fill {
  background: linear-gradient(180deg, #ffd666 0%, #faad14 100%);
}

.filter-tube-cell.danger .tube-fill {
  background: linear-gradient(180deg, #ff7875 0%, #ff4d4f 100%);
}

.filter-tube-name {
  font-size: 12px;
  color: #cbd3ff;
}

.filter-tube-percent {
  font-size: 11px;
  color: #fff;
  margin-top: 4px;
}

.section-card {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #1989fa;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  text-align: center;
}

.stat-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #1989fa;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.action-section {
  padding: 16px;
}

:deep(.van-cell) {
  padding: 12px 0;
}

:deep(.van-cell__title) {
  color: #999;
}

:deep(.van-cell__value) {
  color: #333;
}
</style>
