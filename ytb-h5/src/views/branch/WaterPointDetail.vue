<template>
  <div class="branch-water-point-detail">
    <!-- 导航栏 -->
    <van-nav-bar
      title="取水点详情"
      left-arrow
      @click-left="$router.go(-1)"
      fixed
      placeholder
    />

    <!-- 加载状态 -->
    <van-loading v-if="loading" type="spinner" color="#1989fa" class="loading-center">
      加载中...
    </van-loading>

    <!-- 详情内容 -->
    <div v-else-if="waterPoint" class="detail-content">
      <!-- 基本信息卡片 -->
      <div class="info-card">
        <div class="point-header">
          <div class="point-name">{{ waterPoint.name }}</div>
          <div class="point-status" :class="getStatusClass(waterPoint.status)">
            {{ getStatusText(waterPoint.status) }}
          </div>
        </div>
        
        <div class="point-address">
          <van-icon name="location-o" />
          {{ waterPoint.address }}
        </div>
        
        <div class="point-distance">
          <van-icon name="guide-o" />
          距离您 {{ waterPoint.distance }}
        </div>
      </div>

      <!-- 服务信息 -->
      <div class="service-card">
        <div class="card-title">服务信息</div>
        <div class="service-list">
          <div class="service-item">
            <div class="service-label">营业时间</div>
            <div class="service-value">{{ waterPoint.business_hours }}</div>
          </div>
          <div class="service-item">
            <div class="service-label">水质等级</div>
            <div class="service-value quality" :class="getQualityClass(waterPoint.water_quality)">
              {{ getWaterQualityText(waterPoint.water_quality) }}
            </div>
          </div>
          <div class="service-item">
            <div class="service-label">联系电话</div>
            <div class="service-value phone" @click="callPoint">
              {{ waterPoint.phone }}
              <van-icon name="phone-o" />
            </div>
          </div>
          <div class="service-item">
            <div class="service-label">今日用水量</div>
            <div class="service-value">{{ waterPoint.daily_usage || '暂无数据' }}</div>
          </div>
        </div>
      </div>

      <!-- 设备状态 -->
      <div class="device-card">
        <div class="card-title">设备状态</div>
        <div class="device-grid">
          <div class="device-item">
            <div class="device-icon normal">
              <van-icon name="cluster-o" size="24" />
            </div>
            <div class="device-info">
              <div class="device-name">净水器主机</div>
              <div class="device-status">运行正常</div>
            </div>
          </div>
          <div class="device-item">
            <div class="device-icon" :class="getFilterStatus(waterPoint.filter_life)">
              <van-icon name="filter-o" size="24" />
            </div>
            <div class="device-info">
              <div class="device-name">滤芯状态</div>
              <div class="device-status">剩余{{ waterPoint.filter_life || 85 }}%</div>
            </div>
          </div>
          <div class="device-item">
            <div class="device-icon normal">
              <van-icon name="fire-o" size="24" />
            </div>
            <div class="device-info">
              <div class="device-name">水质检测</div>
              <div class="device-status">实时监控</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 用户评价 -->
      <div class="review-card">
        <div class="card-title">
          用户评价
          <span class="review-count">({{ reviews.length }}条)</span>
        </div>
        <div class="review-list">
          <div v-for="review in reviews" :key="review.id" class="review-item">
            <div class="review-header">
              <div class="user-info">
                <van-image
                  round
                  width="36"
                  height="36"
                  :src="review.avatar || '/images/default-avatar.png'"
                  :error-content="'头像'"
                />
                <div class="user-name">{{ review.username }}</div>
              </div>
              <div class="review-time">{{ formatTime(review.created_at) }}</div>
            </div>
            <div class="review-rating">
              <van-rate v-model="review.rating" readonly size="16" />
            </div>
            <div class="review-content">{{ review.content }}</div>
          </div>
        </div>
      </div>

      <!-- 附近其他取水点 -->
      <div class="nearby-card">
        <div class="card-title">附近其他取水点</div>
        <div class="nearby-list">
          <div 
            v-for="nearby in nearbyPoints" 
            :key="nearby.id" 
            class="nearby-item"
            @click="goToPoint(nearby)"
          >
            <div class="nearby-info">
              <div class="nearby-name">{{ nearby.name }}</div>
              <div class="nearby-address">{{ nearby.address }}</div>
            </div>
            <div class="nearby-distance">{{ nearby.distance }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else class="error-state">
      <van-empty description="取水点不存在或已下线" />
      <van-button type="primary" @click="$router.go(-1)" style="margin-top: 16px;">
        返回上一页
      </van-button>
    </div>

    <!-- 底部操作栏 -->
    <div v-if="waterPoint" class="bottom-actions">
      <van-button 
        size="large" 
        @click="navigate"
        class="navigate-btn"
      >
        <van-icon name="guide-o" />
        导航前往
      </van-button>
      <van-button 
        size="large" 
        type="primary" 
        @click="callPoint"
        class="call-btn"
      >
        <van-icon name="phone-o" />
        联系取水点
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const waterPoint = ref(null)
const reviews = ref([])
const nearbyPoints = ref([])

// 模拟数据
const mockWaterPoint = {
  id: 1,
  name: '城市广场取水点',
  address: '北京市朝阳区城市广场1层',
  business_hours: '06:00-22:00',
  status: 'normal',
  water_quality: 'excellent',
  distance: '0.5km',
  phone: '4006625818',
  daily_usage: '1,250L',
  filter_life: 85,
  lat: 39.9042,
  lng: 116.4074
}

const mockReviews = [
  {
    id: 1,
    username: '张先生',
    avatar: '',
    rating: 5,
    content: '水质很好，设备很新，服务态度也不错！',
    created_at: '2024-01-15 14:30:00'
  },
  {
    id: 2,
    username: '李女士',
    avatar: '',
    rating: 4,
    content: '位置方便，水质不错，就是有时候排队人比较多。',
    created_at: '2024-01-14 09:15:00'
  },
  {
    id: 3,
    username: '王同学',
    avatar: '',
    rating: 5,
    content: '学校附近最好的取水点了，24小时营业很方便！',
    created_at: '2024-01-13 21:45:00'
  }
]

const mockNearbyPoints = [
  {
    id: 2,
    name: '购物中心取水站',
    address: '北京市海淀区中关村购物中心B1',
    distance: '1.2km'
  },
  {
    id: 3,
    name: '地铁站取水点',
    address: '北京市西城区地铁4号线西单站',
    distance: '0.8km'
  }
]

// 获取取水点详情
const loadWaterPointDetail = async () => {
  try {
    loading.value = true
    const pointId = route.params.id
    
    if (!pointId) {
      showToast('缺少取水点ID参数')
      router.go(-1)
      return
    }

    // 获取分支机构代码
    const branchCode = localStorage.getItem('branch_code')
    if (!branchCode) {
      showToast('缺少分支机构信息')
      router.go(-1)
      return
    }

    // 动态导入分支机构取水点API
    try {
      const { branchWaterPointApi } = await import('@/api/branchWaterPoint')
      const response = await branchWaterPointApi.getWaterPointDetail(pointId, branchCode)
      
      if (response.code === 0 && response.data) {
        waterPoint.value = response.data
        
        // 处理数据格式，兼容前端显示
        if (waterPoint.value) {
          // 确保所需字段存在
          waterPoint.value.water_quality = waterPoint.value.water_quality || 'good'
          waterPoint.value.daily_usage = waterPoint.value.daily_usage || '暂无数据'
          waterPoint.value.filter_life = waterPoint.value.filter_life || 85
          waterPoint.value.phone = waterPoint.value.contact_phone || waterPoint.value.phone
          waterPoint.value.distance = waterPoint.value.distance_text || '距离未知'
          
          // 解析JSON字段
          if (typeof waterPoint.value.tags === 'string') {
            try {
              waterPoint.value.tags = JSON.parse(waterPoint.value.tags)
            } catch (e) {
              waterPoint.value.tags = []
            }
          }
          
          if (typeof waterPoint.value.facilities === 'string') {
            try {
              waterPoint.value.facilities = JSON.parse(waterPoint.value.facilities)
            } catch (e) {
              waterPoint.value.facilities = []
            }
          }
        }
        
        console.log('获取取水点详情成功:', waterPoint.value)
      } else {
        console.error('API返回错误:', response)
        showToast(response.message || '获取取水点详情失败')
        waterPoint.value = null
      }
    } catch (apiError) {
      console.error('API调用失败:', apiError)
      // 使用备用模拟数据
      showToast('获取详情失败，显示演示数据')
      waterPoint.value = {
        ...mockWaterPoint,
        id: pointId,
        name: `取水点 ${pointId}`,
        address: '地址信息不可用'
      }
    }
  } catch (error) {
    console.error('加载取水点详情失败:', error)
    showToast('加载失败，请重试')
    waterPoint.value = null
  } finally {
    loading.value = false
  }
}

// 获取状态样式类
const getStatusClass = (status) => {
  switch (status) {
    case 'normal':
      return 'status-normal'
    case 'maintenance':
      return 'status-maintenance'
    case 'offline':
      return 'status-offline'
    default:
      return ''
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'normal':
      return '正常营业'
    case 'maintenance':
      return '维护中'
    case 'offline':
      return '暂停服务'
    default:
      return '未知'
  }
}

// 获取水质等级文本
const getWaterQualityText = (quality) => {
  switch (quality) {
    case 'excellent':
      return '优'
    case 'good':
      return '良'
    case 'fair':
      return '中'
    default:
      return '未知'
  }
}

// 获取水质等级样式类
const getQualityClass = (quality) => {
  switch (quality) {
    case 'excellent':
      return 'quality-excellent'
    case 'good':
      return 'quality-good'
    case 'fair':
      return 'quality-fair'
    default:
      return ''
  }
}

// 获取滤芯状态样式
const getFilterStatus = (life) => {
  if (life >= 80) return 'normal'
  if (life >= 50) return 'warning'
  return 'danger'
}

// 格式化时间
const formatTime = (time) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  const day = 24 * 60 * 60 * 1000

  if (diff < day) {
    return '今天'
  } else if (diff < 2 * day) {
    return '昨天'
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
}

// 联系取水点
const callPoint = () => {
  if (!waterPoint.value?.phone) return
  
  showConfirmDialog({
    title: '联系取水点',
    message: `是否拨打电话：${waterPoint.value.phone}？`
  }).then(() => {
    window.open(`tel:${waterPoint.value.phone}`)
  }).catch(() => {
    // 用户取消
  })
}

// 导航到取水点
const navigate = () => {
  if (!waterPoint.value) return
  
  showConfirmDialog({
    title: '导航确认',
    message: `是否导航到：${waterPoint.value.name}？`
  }).then(() => {
    // 这里可以调用地图导航API
    showToast('正在启动导航...')
  }).catch(() => {
    // 用户取消
  })
}

// 跳转到其他取水点
const goToPoint = (point) => {
  router.push(`/branch/water-point/detail/${point.id}`)
}

onMounted(async () => {
  try {
    await loadWaterPointDetail()
  } catch (error) {
    console.error('页面初始化失败:', error)
    showToast('页面加载失败，请重试')
  }
})
</script>

<style scoped>
.branch-water-point-detail {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 80px;
}

.loading-center {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
}

.detail-content {
  padding: 16px;
}

.info-card,
.service-card,
.device-card,
.review-card,
.nearby-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.point-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.point-name {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
}

.point-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-normal {
  background-color: #e8f5e8;
  color: #52c41a;
}

.status-maintenance {
  background-color: #fff7e6;
  color: #fa8c16;
}

.status-offline {
  background-color: #ffebee;
  color: #f5222d;
}

.point-address,
.point-distance {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: #666;
  font-size: 14px;
}

.point-address .van-icon,
.point-distance .van-icon {
  margin-right: 8px;
  color: #1989fa;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.review-count {
  font-size: 14px;
  color: #999;
  font-weight: normal;
  margin-left: 8px;
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.service-item:last-child {
  border-bottom: none;
}

.service-label {
  color: #666;
  font-size: 14px;
}

.service-value {
  color: #323233;
  font-size: 14px;
  font-weight: 500;
}

.service-value.quality {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
}

.quality-excellent {
  background-color: #e8f5e8;
  color: #52c41a;
}

.quality-good {
  background-color: #e6f7ff;
  color: #1890ff;
}

.quality-fair {
  background-color: #fff7e6;
  color: #fa8c16;
}

.service-value.phone {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #1989fa;
  cursor: pointer;
}

.device-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.device-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.device-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #fff;
}

.device-icon.normal {
  background-color: #52c41a;
}

.device-icon.warning {
  background-color: #fa8c16;
}

.device-icon.danger {
  background-color: #f5222d;
}

.device-info {
  flex: 1;
}

.device-name {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 4px;
}

.device-status {
  font-size: 12px;
  color: #666;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
}

.review-time {
  font-size: 12px;
  color: #999;
}

.review-rating {
  margin-bottom: 8px;
}

.review-content {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.nearby-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nearby-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nearby-item:hover {
  background-color: #e6f7ff;
}

.nearby-info {
  flex: 1;
}

.nearby-name {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 4px;
}

.nearby-address {
  font-size: 12px;
  color: #666;
}

.nearby-distance {
  font-size: 12px;
  color: #1989fa;
  font-weight: 500;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  padding: 16px;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 12px 16px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 12px;
  z-index: 100;
}

.navigate-btn,
.call-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.navigate-btn {
  background-color: #f8f9fa;
  color: #323233;
  border: 1px solid #e0e0e0;
}
</style> 