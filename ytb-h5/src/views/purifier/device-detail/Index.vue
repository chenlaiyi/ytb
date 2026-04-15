<template>
  <div class="device-detail">
    <!-- 顶部蓝色渐变区域 -->
    <div class="header-section">
      <!-- 导航栏 -->
      <van-nav-bar
        :title="deviceInfo.name || '我的设备'"
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
          <van-button size="mini" type="primary" round class="refresh-btn" @click="refreshDevice">刷新</van-button>
        </div>

        <!-- 前后水质数据 -->
        <div class="water-quality-section">
          <div class="quality-item">
            <div class="quality-label">前</div>
            <div class="quality-value">{{ frontWaterQuality }}</div>
            <div class="quality-unit">PPM</div>
            <div class="quality-status">净化前水质：差</div>
          </div>
          <div class="quality-item">
            <div class="quality-label">后</div>
            <div class="quality-value">{{ backWaterQuality }}</div>
            <div class="quality-unit">PPM</div>
            <div class="quality-status">净化后水质：极好</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 白色内容区域 -->
    <div class="content-section">
      <!-- 设备信息卡片 -->
      <div class="device-card">
        <div class="device-title">
          <span class="device-name">{{ deviceInfo.name || '净之泉可智能净水...' }}</span>
          <van-icon name="edit" />
          <van-icon name="clock-o" />
          <van-icon name="setting-o" />
        </div>
        
        <div class="service-info">
          <div class="service-item">
            <div class="service-value">{{ serviceDays }}</div>
            <div class="service-label">天</div>
            <div class="service-desc">已服务</div>
          </div>
          <div class="service-item">
            <div class="service-value">{{ remainingDays }}</div>
            <div class="service-label">天</div>
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

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <van-loading color="#4285f4" size="24px">加载中...</van-loading>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showSuccessToast, showFailToast } from 'vant'
import { request } from '@/utils/request'

export default {
  name: 'DeviceDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    // 响应式数据
    const loading = ref(false)
    const deviceInfo = ref({})
    
    // 水质数据
    const frontWaterQuality = ref(0)
    const backWaterQuality = ref(0)
    
    // 服务天数计算
    const serviceDays = ref(0)
    const remainingDays = ref(0)
    
    // 功能菜单数据
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
    
    // 滤芯数据
    const filters = ref([])
    
    // 用水量数据
    const totalWaterUsage = ref('0L')
    const dailyAverage = ref('0')
    const todayUsage = ref('0.00L')
    const monthUsage = ref('0.00L')
    
    // 图表数据
    const chartData = ref([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 150])
    const maxChartValue = ref(1700)
    const chartScales = ref(['1700ml', '1360ml', '1020ml', '680ml', '340ml', '0ml'])
    const timeLabels = ref(['06:00-12:00', '12:00-18:00', '18:00-00:00', '00:00-06:00'])
    
    // 方法
    const goBack = () => {
      router.go(-1)
    }
    
    const handleFunction = (func) => {
      showToast(`点击了${func.name}`)
    }
    
    // 获取设备详情数据
    const getDetailInfo = async (id) => {
      loading.value = true
      try {
        console.log('🔍 [设备详情] 获取设备ID:', id)

        // 调用Laravel API获取设备详情
        const response = await request({
          url: `/api/mobile/v1/devices/${id}`,
          method: 'GET'
        })

        console.log('📡 [设备详情] Laravel API响应:', response)

        if (response.code === 0 && response.data) {
          // 使用API返回的真实数据
          deviceInfo.value = response.data
          console.log('✅ [设备详情] 数据设置完成:', deviceInfo.value)
          
          // 设置水质数据 - 使用API返回的数据
          if (response.data.raw_water_value !== undefined) {
            frontWaterQuality.value = response.data.raw_water_value
          }
          if (response.data.purification_water_value !== undefined) {
            backWaterQuality.value = response.data.purification_water_value
          }
          
          // 设置滤芯数据 - 使用API返回的数据
          if (response.data.filters && Array.isArray(response.data.filters)) {
            filters.value = response.data.filters.map(filter => ({
              name: filter.name || '未知滤芯',
              percentage: filter.remainingPercent || filter.percentage || 0,
              remaining: filter.remaining || 0,
              max: filter.max || 0,
              status: filter.status || 'normal',
              color: filter.color || '#4285f4'
            }))
          }
          
          // 设置用水量数据 - 使用API返回的数据
          if (response.data.cumulative_filtration_flow !== undefined) {
            totalWaterUsage.value = `${response.data.cumulative_filtration_flow}L`
            
            // 计算日均用水量
            if (serviceDays.value > 0) {
              const dailyAvg = (response.data.cumulative_filtration_flow / serviceDays.value).toFixed(2)
              dailyAverage.value = dailyAvg
            }
          }
          
          // 计算服务天数
          if (response.data.activate_date) {
            const activateDate = new Date(response.data.activate_date)
            const today = new Date()
            const daysDiff = Math.floor((today - activateDate) / (1000 * 60 * 60 * 24))
            serviceDays.value = daysDiff > 0 ? daysDiff : 0
            
            // 重新计算日均用水量
            if (response.data.cumulative_filtration_flow !== undefined && serviceDays.value > 0) {
              const dailyAvg = (response.data.cumulative_filtration_flow / serviceDays.value).toFixed(2)
              dailyAverage.value = dailyAvg
            }
          }
          
          // 设置剩余天数
          if (response.data.remaining_days !== undefined) {
            remainingDays.value = response.data.remaining_days
          }
          
          // 设置今日和本月用水量（暂时使用模拟数据，因为API没有提供）
          todayUsage.value = '0.00L'
          monthUsage.value = '0.00L'
          
          // 显示成功提示
          showSuccessToast('获取设备详情成功')
        } else {
          // API调用失败时，使用模拟数据确保页面正常显示
          deviceInfo.value = {
            id: id,
            name: '净之泉智能净水器',
            location: '福建省厦门市集美区杏林'
          }
          
          // 设置模拟数据确保页面正常显示
          frontWaterQuality.value = 91
          backWaterQuality.value = 5
          serviceDays.value = 180
          remainingDays.value = 185
          totalWaterUsage.value = '334.84L'
          dailyAverage.value = '5.04'
          todayUsage.value = '0.00L'
          monthUsage.value = '1.61L'
          
          // 设置模拟滤芯数据
          filters.value = [
            { name: 'PP棉滤芯', percentage: 81.67, remaining: 4083, max: 5000, status: 'normal', color: '#4285f4' },
            { name: 'CTO活性炭滤芯', percentage: 74.16, remaining: 3708, max: 5000, status: 'normal', color: '#4285f4' },
            { name: 'RO反渗透膜', percentage: 70.14, remaining: 2104, max: 3000, status: 'normal', color: '#4285f4' }
          ]
          
          console.log('⚠️ [设备详情] API调用失败，使用模拟数据:', deviceInfo.value)
          showFailToast(response.message || '获取设备详情失败')
        }
      } catch (error) {
        console.error('❌ [设备详情] 请求异常:', error)
        // 请求异常时，使用模拟数据确保页面正常显示
        deviceInfo.value = {
          id: id,
          name: '净之泉智能净水器',
          location: '福建省厦门市集美区杏林'
        }
        
        // 设置模拟数据确保页面正常显示
        frontWaterQuality.value = 91
        backWaterQuality.value = 5
        serviceDays.value = 180
        remainingDays.value = 185
        totalWaterUsage.value = '334.84L'
        dailyAverage.value = '5.04'
        todayUsage.value = '0.00L'
        monthUsage.value = '1.61L'
        
        // 设置模拟滤芯数据
        filters.value = [
          { name: 'PP棉滤芯', percentage: 81.67, remaining: 4083, max: 5000, status: 'normal', color: '#4285f4' },
          { name: 'CTO活性炭滤芯', percentage: 74.16, remaining: 3708, max: 5000, status: 'normal', color: '#4285f4' },
          { name: 'RO反渗透膜', percentage: 70.14, remaining: 2104, max: 3000, status: 'normal', color: '#4285f4' }
        ]
        
        console.log('⚠️ [设备详情] 请求异常，使用模拟数据:', deviceInfo.value)
        showFailToast('获取设备详情失败')
      } finally {
        loading.value = false
      }
    }
    
    // 刷新设备信息
    const refreshDevice = () => {
      const deviceId = route.params.id
      if (deviceId) {
        getDetailInfo(deviceId)
      }
    }
    
    // 页面加载时获取数据
    onMounted(() => {
      const deviceId = route.params.id
      if (deviceId) {
        console.log('🚀 [设备详情] 页面加载，设备ID:', deviceId)
        getDetailInfo(deviceId)
      } else {
        console.error('❌ [设备详情] 设备ID为空')
        showFailToast('设备ID不能为空')
        router.back()
      }
    })
    
    return {
      loading,
      deviceInfo,
      serviceDays,
      remainingDays,
      functions,
      filters,
      todayUsage,
      monthUsage,
      totalWaterUsage,
      frontWaterQuality,
      backWaterQuality,
      chartData,
      timeLabels,
      goBack,
      handleFunction,
      refreshDevice
    }
  }
}
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
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.device-title {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.device-name {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.device-title .van-icon {
  margin-left: 8px;
  color: #969799;
}

.service-info {
  display: flex;
  gap: 40px;
}

.service-item {
  text-align: center;
}

.service-value {
  font-size: 24px;
  font-weight: bold;
  color: #323233;
  line-height: 1;
}

.service-label {
  font-size: 14px;
  color: #323233;
  margin: 4px 0;
}

.service-desc {
  font-size: 12px;
  color: #969799;
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

.chart-content {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.chart-scale {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 10px;
  color: #969799;
  height: 120px;
  width: 20px;
}

.chart-bars {
  display: flex;
  align-items: end;
  gap: 2px;
  height: 120px;
  flex: 1;
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
  margin-left: 28px;
}

/* 加载状态 */
.loading-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 999;
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 8px;
}
</style>