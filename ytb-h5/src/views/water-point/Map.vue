<template>
  <div class="map-container">
    <!-- 地图容器 -->
    <div ref="mapContainer" class="map-body"></div>

    <!-- 加载中提示 -->
    <div v-if="loading" class="loading-container">
      <Loading size="24px" type="spinner" color="#1989fa" vertical>加载中...</Loading>
    </div>

    <!-- 定位按钮 -->
    <div class="location-button" @click="centerOnLocation">
      <Icon name="aim" size="20" />
    </div>

    <!-- 地图模式切换 -->
    <div class="map-type-button" @click="toggleMapType">
      <span>{{ mapType === 'normal' ? '卫星' : '常规' }}</span>
    </div>

    <!-- 取水点信息卡片 -->
    <div v-if="selectedPoint" class="point-card">
      <div class="card-header">
        <div class="card-title">{{ selectedPoint.name }}</div>
        <div class="card-close" @click="closeCard">
          <Icon name="cross" size="16" />
        </div>
      </div>
      <div class="card-body">
        <div class="card-info">
          <div class="card-rating">
            <Rate v-model="selectedPoint.rating" readonly allow-half :size="12" color="#ffd21e" />
            <span class="rating-text">{{ selectedPoint.rating }}</span>
          </div>
          <div class="card-distance">{{ formatDistance(selectedPoint.distance) }}</div>
        </div>
        <div class="card-address">
          <Icon name="location-o" size="14" />
          <span>{{ selectedPoint.address }}</span>
        </div>
        <div class="card-status">
          <Tag v-if="selectedPoint.is_open" type="success" plain size="mini">营业中</Tag>
          <Tag v-else type="danger" plain size="mini">已关闭</Tag>
        </div>
      </div>
      <div class="card-actions">
        <Button type="primary" plain size="small" icon="guide-o" @click="navigateTo(selectedPoint)">导航</Button>
        <Button type="primary" size="small" icon="eye-o" @click="viewDetail(selectedPoint.id)">查看详情</Button>
      </div>
    </div>

    <!-- 列表切换按钮 -->
    <div class="list-button" @click="router.push('/water-point')">
      <Icon name="bars" size="18" />
      <span>列表</span>
    </div>

    <!-- 地图导航弹窗 -->
    <ActionSheet 
      v-model:show="showNavPopup" 
      :actions="navActions"
      cancel-text="取消"
      title="选择导航方式"
      @select="onSelectNavApp"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from 'vant'
import { Icon, Loading, Rate, Tag, Button, ActionSheet } from 'vant'
import { getNearbyWaterPoints } from '@/api/waterPoint'

const router = useRouter()
const mapContainer = ref(null)
const map = ref(null)
const loading = ref(true)
const mapType = ref('normal') // 地图类型：normal 或 satellite
const markers = ref([])
const selectedPoint = ref(null)
const showNavPopup = ref(false)
const navTarget = ref(null)
const AMap = window.AMap // 高德地图API对象

// 当前位置
const currentLocation = reactive({
  latitude: 39.9,
  longitude: 116.3
})

// 导航应用选项
const navActions = [
  { name: '高德地图', icon: 'location' },
  { name: '百度地图', icon: 'location' },
  { name: '腾讯地图', icon: 'location' }
]

// 格式化距离显示
const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${meters}米`
  } else {
    return `${(meters / 1000).toFixed(1)}公里`
  }
}

// 获取并标记附近取水点
const fetchNearbyWaterPoints = async () => {
  try {
    loading.value = true
    
    // 清除现有标记
    if (markers.value.length > 0) {
      markers.value.forEach(marker => {
        marker.setMap(null)
      })
      markers.value = []
    }
    
    // 获取附近取水点数据
    const params = {
      lat: currentLocation.latitude,
      lng: currentLocation.longitude,
      radius: 5000,
      limit: 50
    }
    
    // 注释掉API调用，防止反复请求导致页面崩溃
    // const response = await getNearbyWaterPoints(params)
    
    // 直接使用模拟数据
    const mockData = Array(10).fill().map((_, index) => ({
      id: index + 1,
      name: `取水点 ${index + 1}`,
      address: `测试地址 ${index + 1}`,
      latitude: currentLocation.latitude + (Math.random() - 0.5) * 0.03,
      longitude: currentLocation.longitude + (Math.random() - 0.5) * 0.03,
      distance: Math.floor(Math.random() * 5000),
      rating: (Math.random() * 2 + 3).toFixed(1),
      is_open: Math.random() > 0.3,
    }))
    
    // 使用模拟数据
    const waterPoints = mockData
    
    // 添加标记
    waterPoints.forEach(point => {
      // 若AMap不存在（地图未加载），则返回
      if (!window.AMap || !map.value) return
      
      try {
        // 创建标记
        const marker = new AMap.Marker({
          position: [point.longitude, point.latitude],
          title: point.name,
          icon: new AMap.Icon({
            size: new AMap.Size(32, 32),
            image: point.is_open 
              ? 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png'
              : 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
          }),
          anchor: 'bottom-center'
        })
        
        // 绑定点击事件
        marker.on('click', () => {
          selectedPoint.value = point
          map.value.setCenter([point.longitude, point.latitude])
        })
        
        // 添加到地图
        marker.setMap(map.value)
        
        // 保存标记引用
        markers.value.push(marker)
      } catch (err) {
        console.error('创建地图标记失败:', err)
      }
    })
    
    loading.value = false
  } catch (error) {
    console.error('获取附近取水点失败:', error)
    Toast({ type: 'fail', message: '获取取水点数据失败' })
    loading.value = false
  }
}

// 初始化地图
const initMap = async () => {
  loading.value = true
  
  try {
    // 动态加载高德地图脚本
    if (!window.AMap) {
      try {
        await loadAMapScript()
      } catch (error) {
        console.error('加载地图脚本失败:', error)
        Toast({ type: 'fail', message: '加载地图失败' })
        loading.value = false
        return
      }
    }
    
    // 若依然没有AMap，则退出
    if (!window.AMap) {
      Toast({ type: 'fail', message: '地图组件加载失败' })
      loading.value = false
      return
    }
    
    // 创建地图实例
    map.value = new AMap.Map(mapContainer.value, {
      zoom: 15,
      center: [currentLocation.longitude, currentLocation.latitude],
      resizeEnable: true
    })
    
    // 添加控件
    map.value.plugin(['AMap.ToolBar', 'AMap.Scale'], () => {
      // 添加工具栏
      const toolBar = new AMap.ToolBar({
        position: 'RB'
      })
      map.value.addControl(toolBar)
      
      // 添加比例尺
      const scale = new AMap.Scale({
        position: 'LB'
      })
      map.value.addControl(scale)
    })
    
    // 获取并标记附近取水点
    await fetchNearbyWaterPoints()
    
    // 监听地图事件
    map.value.on('click', () => {
      selectedPoint.value = null
    })
    
    loading.value = false
  } catch (error) {
    console.error('初始化地图失败:', error)
    Toast({ type: 'fail', message: '初始化地图失败，请刷新重试' })
    loading.value = false
  }
}

// 动态加载高德地图脚本
const loadAMapScript = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://webapi.amap.com/maps?v=2.0&key=您的高德地图Key&plugin=AMap.Geolocation,AMap.Scale,AMap.ToolBar'
    script.async = true
    script.onload = () => {
      resolve()
    }
    script.onerror = () => {
      reject(new Error('加载地图资源失败'))
    }
    document.head.appendChild(script)
  })
}

// 获取当前位置
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          currentLocation.latitude = position.coords.latitude
          currentLocation.longitude = position.coords.longitude
          resolve(position.coords)
        },
        (error) => {
          Toast('获取位置信息失败，使用默认位置')
          reject(error)
        }
      )
    } else {
      Toast('您的浏览器不支持地理定位')
      reject(new Error('Geolocation not supported'))
    }
  })
}

// 定位到当前位置
const centerOnLocation = async () => {
  try {
    await getCurrentLocation()
    
    if (map.value) {
      map.value.setCenter([currentLocation.longitude, currentLocation.latitude])
      
      // 如果有当前位置标记，则移动它
      if (markers.value.length > 0 && markers.value[0].isCurrentLocation) {
        markers.value[0].setPosition([currentLocation.longitude, currentLocation.latitude])
      } else {
        // 添加当前位置标记
        const currentMarker = new AMap.Marker({
          position: [currentLocation.longitude, currentLocation.latitude],
          icon: new AMap.Icon({
            size: new AMap.Size(24, 24),
            image: 'https://webapi.amap.com/theme/v1.3/markers/n/loc.png'
          }),
          anchor: 'center',
          zIndex: 100
        })
        
        // 标记为当前位置标记
        currentMarker.isCurrentLocation = true
        
        // 添加到地图
        currentMarker.setMap(map.value)
        
        // 保存标记引用
        markers.value.unshift(currentMarker)
      }
      
      Toast.success('已定位到当前位置')
    }
  } catch (error) {
    console.error('定位失败:', error)
    Toast({ type: 'fail', message: '定位失败，请检查定位权限' })
  }
}

// 切换地图类型
const toggleMapType = () => {
  if (!map.value) return
  
  mapType.value = mapType.value === 'normal' ? 'satellite' : 'normal'
  
  if (mapType.value === 'satellite') {
    map.value.setMapStyle('amap://styles/satellite')
  } else {
    map.value.setMapStyle('amap://styles/normal')
  }
}

// 刷新地图
const refreshMap = async () => {
  if (!map.value) return
  
  try {
    await getCurrentLocation()
    await fetchNearbyWaterPoints()
    map.value.setCenter([currentLocation.longitude, currentLocation.latitude])
    Toast.success('已刷新地图')
  } catch (error) {
    console.error('刷新地图失败:', error)
    Toast({ type: 'fail', message: '刷新失败，请重试' })
  }
}

// 关闭信息卡片
const closeCard = () => {
  selectedPoint.value = null
}

// 查看取水点详情
const viewDetail = (id) => {
  router.push(`/water-point/detail/${id}`)
}

// 导航到取水点
const navigateTo = (point) => {
  navTarget.value = point
  showNavPopup.value = true
}

// 选择导航应用
const onSelectNavApp = (action) => {
  if (!navTarget.value) return
  
  const { name, latitude, longitude } = navTarget.value
  
  // 构建导航URL
  let url = ''
  
  switch (action.name) {
    case '高德地图':
      url = `https://uri.amap.com/navigation?from=${currentLocation.longitude},${currentLocation.latitude},当前位置&to=${longitude},${latitude},${name}&mode=car`
      break
    case '百度地图':
      url = `https://api.map.baidu.com/direction?origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${latitude},${longitude}&mode=driving&origin_name=当前位置&destination_name=${name}`
      break
    case '腾讯地图':
      url = `https://apis.map.qq.com/uri/v1/routeplan?type=drive&from=当前位置&fromcoord=${currentLocation.latitude},${currentLocation.longitude}&to=${name}&tocoord=${latitude},${longitude}`
      break
  }
  
  // 打开导航应用
  if (url) {
    window.location.href = url
  }
}

// 组件挂载
onMounted(async () => {
  try {
    await getCurrentLocation()
  } catch (error) {
    console.warn('未能获取位置信息:', error)
  }
  
  initMap()
})

// 组件卸载
onUnmounted(() => {
  if (map.value) {
    map.value.destroy()
  }
})
</script>

<style scoped>
.map-container {
  height: 100vh;
  width: 100%;
  position: relative;
  background-color: #f7f8fa;
  padding-top: 20px; /* 添加顶部内边距替代导航条空间 */
}

.map-body {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.loading-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 20px;
  border-radius: 8px;
  color: #fff;
}

.location-button {
  position: absolute;
  bottom: 170px;
  right: 15px;
  width: 40px;
  height: 40px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  color: #1989fa;
}

.map-type-button {
  position: absolute;
  bottom: 220px;
  right: 15px;
  width: 40px;
  height: 40px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  font-size: 12px;
}

.list-button {
  position: absolute;
  bottom: 120px;
  right: 15px;
  width: 40px;
  height: 40px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  font-size: 12px;
}

.point-card {
  position: absolute;
  bottom: 70px;
  left: 10px;
  right: 10px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  padding: 12px;
  max-height: 35vh;
  overflow-y: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
}

.card-close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #969799;
}

.card-body {
  margin-bottom: 12px;
}

.card-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-rating {
  display: flex;
  align-items: center;
}

.rating-text {
  margin-left: 4px;
  font-size: 12px;
  color: #ff9900;
}

.card-distance {
  font-size: 12px;
  color: #1989fa;
}

.card-address {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  font-size: 12px;
  color: #646566;
  line-height: 18px;
}

.card-address .van-icon {
  margin-right: 4px;
  flex-shrink: 0;
  margin-top: 2px;
}

.card-status {
  margin-bottom: 8px;
}

.card-actions {
  display: flex;
  justify-content: space-between;
}

.card-actions .van-button {
  flex: 1;
}

.card-actions .van-button:first-child {
  margin-right: 8px;
}
</style>
