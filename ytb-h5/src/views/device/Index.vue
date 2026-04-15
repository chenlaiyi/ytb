<template>
  <div class="device-page">
    <div class="hero">
      <van-nav-bar
        title="我的设备"
        left-text="返回"
        left-arrow
        :border="false"
        @click-left="onClickBack"
        class="hero__nav"
      >
        <template #right>
          <div class="hero__nav-actions">
            <van-icon name="ellipsis" />
            <van-icon name="chat-o" />
            <van-icon name="setting-o" />
          </div>
        </template>
      </van-nav-bar>

      <div class="hero__meta">
        <van-icon name="location-o" class="hero__location-icon" />
        <span class="hero__address">{{ address }}</span>
        <button type="button" class="hero__refresh" @click="onRefreshClick">
          <van-icon name="replay" />
          <span>刷新</span>
        </button>
      </div>

      <div class="hero__drops">
        <div class="drop-card">
          <div class="drop-card__inner">
            <span class="drop-card__label">前</span>
            <span class="drop-card__sub">水质TDS值</span>
            <span class="drop-card__value">{{ waterPPM1.ppm }}</span>
            <span class="drop-card__unit">PPM</span>
          </div>
        </div>
        <div class="drop-card">
          <div class="drop-card__inner">
            <span class="drop-card__label">后</span>
            <span class="drop-card__sub">水质TDS值</span>
            <span class="drop-card__value">{{ waterPPM2.ppm }}</span>
            <span class="drop-card__unit">PPM</span>
          </div>
        </div>
      </div>

      <div class="hero__quality">
        <button type="button" class="quality-tag">净化前水质：{{ waterPPM1.state }}</button>
        <button type="button" class="quality-tag quality-tag--highlight">净化后水质：{{ waterPPM2.state }}</button>
      </div>
    </div>

    <main class="content">
      <section class="panel device-panel">
        <header class="panel__header">
          <div>
            <p class="panel__title">我的设备</p>
            <p class="panel__subtitle">{{ deviceInfo.productName }}</p>
          </div>
          <div class="device-panel__meta">
            <span class="device-panel__status">{{ deviceStatus }}</span>
            <span class="device-panel__code">编号：{{ deviceInfo.code }}</span>
          </div>
        </header>

        <div class="device-panel__body">
          <div class="device-panel__badges">
            <div class="badge" @click="togglePower">
              <span :class="['badge__icon', deviceInfo.power ? 'badge__icon--on' : 'badge__icon--off']"></span>
              <span class="badge__text">{{ powerText }}</span>
            </div>
            <div class="badge">
              <span class="badge__icon badge__icon--signal"></span>
              <span class="badge__text">{{ netStatus }}</span>
            </div>
          </div>

          <div class="device-panel__metrics">
            <div class="metric">
              <span class="metric__value metric__value--primary">{{ getLeftValue() }}</span>
              <span class="metric__unit">{{ getLeftUnit() }}</span>
              <span class="metric__label">{{ getLeftLabel() }}</span>
            </div>
            <div class="metric metric--divider"></div>
            <div class="metric">
              <span class="metric__value metric__value--accent">{{ getRightValue() }}</span>
              <span class="metric__unit">{{ getRightUnit() }}</span>
              <span class="metric__label">{{ getRightLabel() }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="panel menu-panel">
        <div class="menu-grid">
          <button
            v-for="(menu, index) in menus"
            :key="menu.label"
            type="button"
            class="menu-grid__item"
            @click="onMenuClick(index)"
          >
            <span class="menu-grid__hex">
              <span class="menu-grid__icon">{{ menu.icon }}</span>
            </span>
            <span class="menu-grid__label">{{ menu.label }}</span>
          </button>
        </div>
      </section>

      <section class="panel filter-panel" @click="toDeviceDetail">
        <header class="panel__header">
          <div>
            <p class="panel__title">滤芯寿命</p>
            <p class="panel__subtitle">滤芯寿命按照用水量和使用时间来综合计算</p>
          </div>
        </header>
        <div class="filter-panel__list">
          <div v-for="item in cartridgeList" :key="item.label" class="filter-panel__item">
            <div class="filter-panel__info">
              <span class="filter-panel__name">{{ item.label }}</span>
              <span class="filter-panel__percent">{{ item.value }}%</span>
            </div>
            <van-progress
              :percentage="parseFloat(item.value)"
              :color="getProgressColor(item.value)"
              :track-color="getProgressBgColor(item.value)"
              :show-pivot="false"
              stroke-width="8"
            />
          </div>
        </div>
      </section>

      <section class="panel water-panel">
        <header class="panel__header">
          <p class="panel__title">用水量</p>
        </header>
        <div class="water-panel__body">
          <div class="water-panel__summary">
            <div class="water-panel__total">
              <p class="water-panel__total-label">累积净水量</p>
              <p class="water-panel__total-value">{{ waterInfo.total }}L</p>
              <p class="water-panel__total-desc">相当于 {{ waterInfo.bottle }} 瓶矿泉水</p>
            </div>
            <div class="water-panel__day">
              <span class="water-panel__chip water-panel__chip--today">
                <span>今日</span>
                <strong>{{ waterInfo.today }}L</strong>
              </span>
              <span class="water-panel__chip water-panel__chip--yesterday">
                <span>昨日</span>
                <strong>{{ waterInfo.yesterday }}L</strong>
              </span>
            </div>
          </div>
          <div class="water-panel__chart">
            <div
              v-for="(item, idx) in waterChart"
              :key="idx"
              class="chart-bar"
            >
              <div class="chart-bar__inner" :style="{ height: item.percent + '%'}"></div>
              <span class="chart-bar__label">{{ item.label }}</span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <van-popup v-model:show="showCustomerService" round closeable>
      <div class="customer-service-popup">
        <div class="service-info">客服电话：4006625818</div>
        <div class="service-qr">
          <div class="qr-placeholder">📱 扫码联系客服</div>
        </div>
        <div class="service-brand">水之净环保科技</div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Toast } from 'vant'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const address = ref('福建省厦门市集美区杏林湾商...')
const showCustomerService = ref(false)

const waterPPM1 = ref({
  label: '前',
  ppm: 91,
  state: '差'
})

const waterPPM2 = ref({
  label: '后', 
  ppm: 3,
  state: '极好'
})

const deviceInfo = ref({
  id: 'JZQ-2025-0001',
  code: 'JZQ-2025-0001',
  productName: '凌之泉ai智能净水机',
  productCode: 'LZQ-AI-001',
  power: true,
  netStatus: '1',
  hadDay: 209,
  leftDay: 170,
  cumulativeFiltrationFlow: 1250,
  surplusFlow: 750,
  billingMode: '0', // 0:按天计费 1:按量计费 2:零售
  deviceStatus: '01',
  videoId: 'video123'
})

const waterInfo = ref({
  total: 355.478,
  bottle: 710.956,
  today: 1.43,
  yesterday: 0
})

const waterChart = ref([
  { label: '14-20', percent: 5 },
  { label: '20-02', percent: 10 },
  { label: '02-08', percent: 15 },
  { label: '08-14', percent: 90 }
])

const cartridgeList = ref([
  { label: 'PP棉', value: '86.67' },
  { label: '颗粒炭', value: '72.30' },
  { label: 'RO膜', value: '45.80' },
  { label: '后置炭', value: '91.20' }
])

// 功能菜单 - 使用emoji图标
const menus = ref([
  { icon: '🛠️', label: '一键报修' },
  { icon: '💰', label: '充值续费' },
  { icon: '📦', label: '新装激活' },
  { icon: '🤖', label: '自动客服' },
  { icon: '🧪', label: '滤芯详情' },
  { icon: '📤', label: '设备分享' },
  { icon: '📜', label: '消费协议' },
  { icon: '🎬', label: '视频中心' }
])

// 设备状态映射
const deviceStatusMap = {
  "00": "出厂设置",
  "01": "正常",
  "02": "欠费", 
  "03": "制水故障",
  "04": "关机",
  "05": "漏水",
  "06": "待激活",
  "07": "正常/制水",
  "08": "频发数据",
  "09": "制水",
  "10": "冲洗",
  "11": "缺水",
  "12": "锁定",
  "13": "保鲜",
  "14": "洗膜"
}

// 计算属性
const powerText = computed(() => {
  return deviceInfo.value.power ? '开机' : '关机'
})

const netStatus = computed(() => {
  return deviceInfo.value.netStatus === '1' ? '在线' : '离线'
})

const deviceStatus = computed(() => {
  return deviceStatusMap[deviceInfo.value.deviceStatus] || '未知'
})

// 获取左侧统计值
const getLeftValue = () => {
  if (deviceInfo.value.billingMode === '1') {
    return deviceInfo.value.cumulativeFiltrationFlow
  }
  return deviceInfo.value.hadDay
}

const getLeftUnit = () => {
  return deviceInfo.value.billingMode === '1' ? '升' : '天'
}

const getLeftLabel = () => {
  return deviceInfo.value.billingMode === '1' ? '累计过滤' : '已服务'
}

// 获取右侧统计值
const getRightValue = () => {
  if (deviceInfo.value.billingMode === '1') {
    return deviceInfo.value.surplusFlow
  }
  return deviceInfo.value.leftDay
}

const getRightUnit = () => {
  return deviceInfo.value.billingMode === '1' ? '升' : '天'
}

const getRightLabel = () => {
  return deviceInfo.value.billingMode === '1' ? '剩余水量' : '剩余服务'
}

// 获取进度条颜色
const getProgressColor = (value) => {
  return parseFloat(value) <= 30 ? '#e93653' : '#3563f5'
}

const getProgressBgColor = (value) => {
  return parseFloat(value) <= 30 ? '#fadcda' : '#becdfe'
}

// 水质等级判断
const getWaterLevel = (ppm) => {
  if (ppm > 100) return '极差'
  if (ppm > 50) return '差'
  if (ppm > 30) return '一般'
  if (ppm > 10) return '好'
  return '极好'
}

// 方法
const onClickBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/device')
  }
}

const onRefreshClick = () => {
  Toast.loading({
    message: '刷新中...',
    forbidClick: true,
    duration: 1000
  })
  
  setTimeout(() => {
    // 模拟数据刷新
    waterPPM1.value.ppm = Math.floor(Math.random() * 50) + 80
    waterPPM2.value.ppm = Math.floor(Math.random() * 10) + 1
    waterPPM1.value.state = getWaterLevel(waterPPM1.value.ppm)
    waterPPM2.value.state = getWaterLevel(waterPPM2.value.ppm)
    Toast.success('刷新成功')
  }, 1000)
}

const togglePower = () => {
  Toast.loading({
    message: deviceInfo.value.power ? '关机中...' : '开机中...',
    forbidClick: true,
    duration: 1500
  })
  
  setTimeout(() => {
    deviceInfo.value.power = !deviceInfo.value.power
    deviceInfo.value.deviceStatus = deviceInfo.value.power ? '01' : '04'
    Toast.success(deviceInfo.value.power ? '开机成功' : '关机成功')
  }, 1500)
}

const onMenuClick = (index) => {
  const menuActions = {
    0: () => Toast('一键报修功能'),
    1: () => {
      if (deviceInfo.value.billingMode === '2') {
        Toast('零售无需充值！')
        return
      }
      Toast('充值续费功能')
    },
    2: () => Toast('新装邀请功能'),
    3: () => Toast('百问百答功能'),
    4: () => toDeviceDetail(),
    5: () => Toast('设备分享功能'),
    6: () => Toast('消费协议功能'),
    7: () => {
      if (deviceInfo.value.videoId) {
        Toast('视频中心功能')
      } else {
        Toast('暂无可参考视频')
      }
    }
  }
  
  menuActions[index]?.()
}


const toDeviceDetail = () => {
  Toast('跳转到设备详情页面')
}

// 初始化
onMounted(() => {
  // 设置初始水质状态
  waterPPM1.value.state = getWaterLevel(waterPPM1.value.ppm)
  waterPPM2.value.state = getWaterLevel(waterPPM2.value.ppm)
})
</script>

<style scoped>
.device-page {
  min-height: 100vh;
  background: #f2f5ff;
  color: #1f2a44;
}

.hero {
  padding: 0 16px 120px;
  background: linear-gradient(180deg, #4f6eff 0%, #3d5eff 100%);
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  position: relative;
  overflow: hidden;
}

.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 120% at 50% -20%, rgba(255, 255, 255, 0.45) 0%, rgba(77, 118, 255, 0) 70%);
  pointer-events: none;
}

.hero__nav {
  background: transparent;
  color: #fff;
  padding-top: 8px;
  z-index: 2;
}

.hero__nav :deep(.van-icon),
.hero__nav :deep(.van-nav-bar__title),
.hero__nav :deep(.van-nav-bar__text) {
  color: #fff;
}

.hero__nav-actions {
  display: flex;
  gap: 10px;
  font-size: 18px;
}

.hero__meta {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  margin-top: 12px;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
}

.hero__location-icon {
  font-size: 16px;
}

.hero__address {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero__refresh {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 12px;
}

.hero__drops {
  position: relative;
  z-index: 2;
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 24px;
}

.drop-card {
  width: 128px;
  height: 160px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.12) 100%);
  box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(12px);
  border-radius: 56% 56% 52% 52% / 66% 66% 38% 38%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.drop-card__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
}

.drop-card__label {
  font-size: 18px;
  font-weight: 600;
}

.drop-card__sub {
  font-size: 12px;
  margin-top: 6px;
  opacity: 0.8;
}

.drop-card__value {
  font-size: 34px;
  font-weight: 700;
  margin: 12px 0 2px;
}

.drop-card__unit {
  font-size: 12px;
  opacity: 0.9;
}

.hero__quality {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.quality-tag {
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 6px 18px;
  border-radius: 999px;
  font-size: 12px;
}

.quality-tag--highlight {
  background: #ffffff;
  color: #2f54eb;
}

.content {
  position: relative;
  z-index: 3;
  margin-top: -80px;
  padding: 0 16px 80px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(34, 84, 177, 0.12);
  padding: 18px;
}

.panel__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.panel__title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1f2a44;
}

.panel__subtitle {
  font-size: 12px;
  color: #7f8bb2;
  margin: 4px 0 0;
}

.device-panel__meta {
  text-align: right;
  font-size: 12px;
  color: #7f8bb2;
}

.device-panel__status {
  display: block;
  margin-bottom: 4px;
}

.device-panel__code {
  color: #3563f5;
}

.device-panel__body {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.device-panel__badges {
  display: flex;
  gap: 18px;
}

.badge {
  flex: 1;
  background: #f2f6ff;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge__icon {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #9aa9ff;
}

.badge__icon--on {
  background: #4ad991;
  box-shadow: 0 0 8px rgba(74, 217, 145, 0.6);
}

.badge__icon--off {
  background: #ff6d6d;
}

.badge__icon--signal {
  position: relative;
  width: 14px;
  height: 14px;
  background: transparent;
}

.badge__icon--signal::before,
.badge__icon--signal::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 2px solid #4d6dff;
  border-radius: 50%;
}

.badge__icon--signal::after {
  opacity: 0.5;
  transform: scale(1.4);
}

.badge__text {
  font-size: 13px;
  color: #1f2a44;
}

.device-panel__metrics {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f7f9ff;
  border-radius: 12px;
  padding: 14px 18px;
}

.metric {
  text-align: center;
  flex: 1;
}

.metric--divider {
  flex: 0;
  width: 1px;
  height: 40px;
  background: rgba(53, 99, 245, 0.15);
}

.metric__value {
  font-size: 24px;
  font-weight: 700;
}

.metric__value--primary {
  color: #3462ff;
}

.metric__value--accent {
  color: #ff4d7d;
}

.metric__unit {
  font-size: 14px;
  margin-left: 4px;
}

.metric__label {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #7f8bb2;
}

.menu-panel {
  padding: 18px 12px 20px;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 12px;
}

.menu-grid__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  border: none;
  background: transparent;
  color: inherit;
}

.menu-grid__hex {
  width: 58px;
  height: 64px;
  background: linear-gradient(180deg, #edf2ff 0%, #dfe7ff 100%);
  clip-path: polygon(50% 0%, 92% 25%, 92% 75%, 50% 100%, 8% 75%, 8% 25%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 8px 14px rgba(53, 98, 245, 0.12);
}

.menu-grid__icon {
  font-size: 20px;
}

.menu-grid__label {
  font-size: 12px;
  color: #47527a;
}

.filter-panel__list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-panel__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-panel__info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #47527a;
}

.filter-panel__percent {
  color: #1f2a44;
}

.water-panel__body {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.water-panel__summary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.water-panel__total {
  flex: 1;
  background: linear-gradient(135deg, #3e61ff 0%, #5898ff 100%);
  border-radius: 16px;
  padding: 18px;
  color: #fff;
  box-shadow: 0 12px 28px rgba(69, 115, 255, 0.22);
}

.water-panel__total-label {
  font-size: 13px;
  opacity: 0.9;
  margin: 0;
}

.water-panel__total-value {
  font-size: 28px;
  font-weight: 700;
  margin: 12px 0 4px;
}

.water-panel__total-desc {
  font-size: 12px;
  margin: 0;
  opacity: 0.85;
}

.water-panel__day {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.water-panel__chip {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 12px;
  min-width: 110px;
  color: #1f2a44;
}

.water-panel__chip strong {
  font-size: 18px;
  margin-top: 4px;
}

.water-panel__chip--today {
  background: #e7f1ff;
}

.water-panel__chip--yesterday {
  background: #f0f3ff;
}

.water-panel__chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 18px;
  background: #f6f8ff;
  border-radius: 16px;
  padding: 20px 16px 16px;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.chart-bar__inner {
  width: 16px;
  border-radius: 999px;
  background: linear-gradient(180deg, #3f6eff 0%, #64a8ff 100%);
}

.chart-bar__label {
  font-size: 11px;
  color: #7f8bb2;
}

.customer-service-popup {
  padding: 24px 32px;
  text-align: center;
}

.service-info {
  font-size: 14px;
  margin-bottom: 16px;
}

.qr-placeholder {
  width: 160px;
  height: 160px;
  border-radius: 16px;
  border: 1px dashed #c5cff3;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: #7f8bb2;
}

.service-brand {
  font-size: 13px;
  color: #7f8bb2;
}

@media (max-width: 360px) {
  .menu-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .hero {
    padding-bottom: 100px;
  }
}
</style>
