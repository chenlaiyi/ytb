<template>
  <div class="device-detail">
    <!-- 顶部蓝色渐变区域 -->
    <div class="header-section">
      <!-- 导航栏 -->
      <van-nav-bar
        title="我的设备"
        left-arrow
        @click-left="goBack"
        class="custom-nav"
      >
        <template #right>
          <van-icon name="ellipsis" />
          <van-icon name="minus" />
          <van-icon name="close" />
        </template>
      </van-nav-bar>

      <!-- 设备基本信息 -->
      <div class="device-info-section">
        <div class="location-info">
          <van-icon name="location-o" />
          <span>{{ deviceInfo.location || '福建省厦门市集美区杏林...' }}</span>
          <van-button size="mini" type="primary" round class="refresh-btn">刷新</van-button>
        </div>

        <!-- 前后水质数据 -->
        <div class="water-quality-section">
          <div class="quality-item">
            <div class="quality-label">前</div>
            <div class="quality-value">{{ frontWaterQuality }}</div>
            <div class="quality-unit">PPM</div>
          </div>
          <div class="quality-item">
            <div class="quality-label">后</div>
            <div class="quality-value">{{ backWaterQuality }}</div>
            <div class="quality-unit">PPM</div>
          </div>
        </div>
        
        <!-- 水质状态描述 -->
        <div class="water-status-section">
          <div class="status-item">
            <span>净化前水质：差</span>
          </div>
          <div class="status-item">
            <span>净化后水质：极好</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 白色内容区域 -->
    <div class="content-section">
      <!-- 设备信息卡片 -->
      <div class="device-card">
        <div class="device-header">
          <span class="device-subtitle">我的设备</span>
          <span class="device-status">{{ deviceStatus }}</span>
          <span class="device-code">编号：{{ deviceInfo.code || '88003093' }}</span>
        </div>
        
        <div class="device-title-row">
          <span class="device-name">{{ deviceInfo.name || '净之泉可智能净水...' }}</span>
          <div class="device-controls">
            <div class="control-item" @click="togglePower">
              <van-icon :name="deviceInfo.power ? 'play-circle-o' : 'pause-circle-o'" />
              <span>{{ deviceInfo.power ? '开机' : '关机' }}</span>
            </div>
            <div class="control-item">
              <van-icon name="signal" />
              <span>{{ deviceInfo.online ? '在线' : '离线' }}</span>
            </div>
          </div>
        </div>

        <!-- 分割线 -->
        <div class="divider"></div>
        
        <div class="service-info">
          <div class="service-item">
            <div class="service-value-row">
              <span class="service-value had-service">{{ serviceDays }}</span>
              <span class="service-unit">天</span>
            </div>
            <div class="service-desc">已服务</div>
          </div>
          
          <div class="service-divider"></div>
          
          <div class="service-item">
            <div class="service-value-row">
              <span class="service-value remaining-service">{{ remainingDays }}</span>
              <span class="service-unit">天</span>
            </div>
            <div class="service-desc">剩余服务</div>
          </div>
        </div>
      </div>

      <!-- 功能图标网格 -->
      <div class="function-grid">
        <div class="function-item" v-for="func in functions" :key="func.id" @click="handleFunction(func)">
          <div class="function-icon" :style="{ backgroundColor: func.color }">
            <van-icon :name="func.icon" />
          </div>
          <div class="function-name">{{ func.name }}</div>
        </div>
      </div>

      <!-- 滤芯寿命 -->
      <div class="filter-life-section">
        <h3>滤芯寿命</h3>
        <p class="filter-desc">高效滤芯配置可有效过滤有害物质保障合格</p>
        
        <div class="filter-progress-list">
          <div class="filter-item" v-for="filter in filters" :key="filter.name">
            <div class="filter-info">
              <span class="filter-name">{{ filter.name }}</span>
              <span class="filter-percentage">{{ filter.percentage }}%</span>
            </div>
            <van-progress 
              :percentage="filter.percentage" 
              :color="filter.color"
              stroke-width="8"
              class="filter-progress"
            />
          </div>
        </div>
      </div>

      <!-- 用水量统计 -->
      <div class="water-usage-section">
        <h3>用水量</h3>
        
        <div class="usage-cards">
          <div class="usage-card primary">
            <div class="usage-title">累积净水量</div>
            <div class="usage-value">{{ totalWaterUsage }}</div>
            <div class="usage-desc">每日平均{{ dailyAverage }}升 净水</div>
          </div>
          <div class="usage-card-group">
            <div class="usage-card secondary">
              <van-icon name="water-o" />
              <div class="usage-amount">{{ todayUsage }}</div>
            </div>
            <div class="usage-card secondary">
              <van-icon name="water-o" />
              <div class="usage-amount">{{ monthUsage }}</div>
            </div>
          </div>
        </div>

        <!-- 用水量图表 -->
        <div class="chart-container">
          <div class="chart-header">
            <div class="chart-scale">
              <div class="scale-item" v-for="scale in chartScales" :key="scale">{{ scale }}</div>
            </div>
          </div>
          <div class="chart-bars">
            <div 
              class="chart-bar" 
              v-for="(value, index) in chartData" 
              :key="index"
              :style="{ height: `${(value / maxChartValue) * 100}%` }"
            ></div>
          </div>
          <div class="chart-time-labels">
            <span v-for="time in timeLabels" :key="time">{{ time }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()

// 设备基本信息
const deviceInfo = reactive({
  name: '净之泉可智能净水...',
  location: '福建省厦门市集美区杏林...',
  deviceId: '8B003093',
  code: '88003093',
  power: true,
  online: true
})

// 设备状态
const deviceStatus = ref('正常/制水')

// 水质数据
const frontWaterQuality = ref(91)
const backWaterQuality = ref(5)

// 服务信息
const serviceDays = ref(218)
const remainingDays = ref(161)

// 功能按钮
const functions = ref([
  { id: 1, name: '一键检修', icon: 'setting-o', color: '#4285f4' },
  { id: 2, name: '充值续费', icon: 'gold-coin-o', color: '#4285f4' },
  { id: 3, name: '新装激活', icon: 'chart-trending-o', color: '#4285f4' },
  { id: 4, name: '自动客服', icon: 'service', color: '#4285f4' },
  { id: 5, name: '滤芯详情', icon: 'filter', color: '#4285f4' },
  { id: 6, name: '设备分享', icon: 'share-o', color: '#4285f4' },
  { id: 7, name: '消费历史', icon: 'orders-o', color: '#4285f4' },
  { id: 8, name: '我的中心', icon: 'user-o', color: '#4285f4' }
])

// 滤芯寿命数据
const filters = ref([
  { name: 'PP棉', percentage: 81.67, color: '#4285f4' },
  { name: 'CTO', percentage: 74.16, color: '#4285f4' },
  { name: 'RO膜', percentage: 70.14, color: '#4285f4' }
])

// 用水量数据
const totalWaterUsage = ref('334.84L')
const dailyAverage = ref('5.04')
const todayUsage = ref('0.00L')
const monthUsage = ref('1.61L')

// 图表数据
const chartData = ref([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 150])
const maxChartValue = ref(1700)
const chartScales = ref(['1700ml', '1360ml', '1020ml', '680ml', '340ml', '0ml'])
const timeLabels = ref(['06:00-12:00', '12:00-18:00', '18:00-00:00', '00:00-06:00'])

// 方法
const goBack = () => {
  router.go(-1)
}

const togglePower = () => {
  deviceInfo.power = !deviceInfo.power
  showToast(deviceInfo.power ? '设备已开机' : '设备已关机')
}

const handleFunction = (func) => {
  showToast(`点击了${func.name}`)
}

onMounted(() => {
  // 页面加载时的初始化逻辑
})
</script>

<style scoped>
.device-detail {
  min-height: 100vh;
  background: #f7f8fa;
}

/* 顶部蓝色渐变区域 */
.header-section {
  background: linear-gradient(135deg, #4285f4 0%, #1976d2 100%);
  color: white;
  padding-bottom: 20px;
}

.custom-nav {
  background: transparent;
  color: white;
}

.custom-nav :deep(.van-nav-bar__title) {
  color: white;
}

.custom-nav :deep(.van-nav-bar__arrow) {
  color: white;
}

.custom-nav :deep(.van-icon) {
  color: white;
  margin-left: 8px;
}

.device-info-section {
  padding: 0 16px;
}

.location-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-size: 14px;
}

.location-info .van-icon {
  margin-right: 4px;
}

.refresh-btn {
  margin-left: auto;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.water-quality-section {
  display: flex;
  justify-content: space-around;
  gap: 40px;
}

.quality-item {
  text-align: center;
  flex: 1;
}

.quality-label {
  font-size: 16px;
  margin-bottom: 8px;
  opacity: 0.9;
}

.quality-value {
  font-size: 48px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 4px;
}

.quality-unit {
  font-size: 14px;
  margin-bottom: 8px;
  opacity: 0.8;
}

.quality-status {
  font-size: 12px;
  opacity: 0.8;
}

/* 白色内容区域 */
.content-section {
  background: white;
  border-radius: 20px 20px 0 0;
  margin-top: -10px;
  padding: 20px 16px;
  min-height: calc(100vh - 300px);
}

.device-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.device-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.device-subtitle {
  font-size: 14px;
  color: #999999;
  flex: 1;
}

.device-status {
  font-size: 13px;
  color: #666666;
  margin-right: 16px;
}

.device-code {
  font-size: 13px;
  color: #416efc;
}

.device-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.device-name {
  font-size: 18px;
  font-weight: 500;
  color: #333333;
  flex: 1;
  margin-right: 16px;
}

.device-controls {
  display: flex;
  gap: 16px;
}

.control-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  color: #666666;
  cursor: pointer;
}

.control-item .van-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.divider {
  width: 100%;
  height: 1px;
  background: #e6e6e6;
  margin-bottom: 16px;
}

.service-info {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.service-item {
  text-align: center;
}

.service-value-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 8px;
}

.service-value {
  font-size: 18px;
  font-weight: 600;
  margin-right: 4px;
}

.service-value.had-service {
  color: #1890ff;
}

.service-value.remaining-service {
  color: #ff4d4f;
}

.service-unit {
  font-size: 18px;
  font-weight: 600;
  color: #333333;
}

.service-desc {
  font-size: 14px;
  color: #999999;
}

.service-divider {
  width: 1px;
  height: 40px;
  background: #e6e6e6;
  margin: 0 16px;
}

/* 功能图标网格 */
.function-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.function-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.function-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.function-icon .van-icon {
  font-size: 24px;
  color: white;
}

.function-name {
  font-size: 12px;
  color: #323233;
  text-align: center;
}

/* 滤芯寿命 */
.filter-life-section {
  margin-bottom: 30px;
}

.filter-life-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 8px 0;
}

.filter-desc {
  font-size: 12px;
  color: #969799;
  margin: 0 0 20px 0;
}

.filter-item {
  margin-bottom: 16px;
}

.filter-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.filter-name {
  font-size: 14px;
  color: #323233;
}

.filter-percentage {
  font-size: 14px;
  color: #4285f4;
  font-weight: 600;
}

.filter-progress {
  border-radius: 4px;
}

/* 用水量统计 */
.water-usage-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 16px 0;
}

.usage-cards {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.usage-card {
  border-radius: 12px;
  padding: 16px;
}

.usage-card.primary {
  flex: 1;
  background: linear-gradient(135deg, #4285f4 0%, #1976d2 100%);
  color: white;
}

.usage-card-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.usage-card.secondary {
  background: #e8f4fd;
  color: #4285f4;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  min-width: 80px;
}

.usage-title {
  font-size: 12px;
  margin-bottom: 8px;
  opacity: 0.9;
}

.usage-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.usage-desc {
  font-size: 11px;
  opacity: 0.8;
}

.usage-amount {
  font-size: 14px;
  font-weight: 600;
}

/* 图表 */
.chart-container {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #ebedf0;
}

.chart-header {
  margin-bottom: 16px;
}

.chart-scale {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-size: 10px;
  color: #969799;
}

.chart-bars {
  display: flex;
  align-items: end;
  gap: 2px;
  height: 120px;
  margin-bottom: 8px;
}

.chart-bar {
  flex: 1;
  background: #4285f4;
  border-radius: 2px 2px 0 0;
  min-height: 2px;
}

.chart-time-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #969799;
}
</style>