<template>
  <div class="water-point-container">
    <!-- 搜索框 -->
    <div class="search-wrapper">
      <Search
        v-model="keyword"
        placeholder="搜索取水点名称或地址"
        shape="round"
        background="#f5f5f5"
        show-action
        clearable
        @search="onSearch"
        @cancel="onCancelSearch"
      >
        <template #action>
          <div class="search-action" @click="searchByLocation">
            <Icon name="location-o" />
            <span>附近</span>
          </div>
        </template>
      </Search>
    </div>

    <!-- 筛选和排序 -->
    <div class="filter-bar">
      <div 
        class="filter-item" 
        :class="{ active: sortBy === 'distance' }"
        @click="setSortBy('distance')"
      >
        <span>附近优先</span>
      </div>
      <div 
        class="filter-item" 
        :class="{ active: sortBy === 'rating' }"
        @click="setSortBy('rating')"
      >
        <span>好评优先</span>
      </div>
      <div 
        class="filter-item"
        @click="showMap"
      >
        <Icon name="map-marked" />
        <span>地图模式</span>
      </div>
    </div>

    <!-- 距离筛选 -->
    <div class="distance-filter">
      <Slider
        v-model="distance"
        :min="500"
        :max="10000"
        :step="500"
        @change="onDistanceChange"
      >
        <template #button>
          <div class="distance-button">{{ formatDistance(distance) }}</div>
        </template>
      </Slider>
    </div>

    <!-- 取水点列表 -->
    <div class="water-point-list">
      <PullRefresh v-model="refreshing" @refresh="onRefresh">
        <List
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          loading-text="加载中..."
          @load="onLoad"
        >
          <div v-if="waterPoints.length === 0 && !loading && !refreshing" class="empty-state">
            <Icon name="empty" size="48" />
            <p>暂无取水点</p>
          </div>
          
          <div 
            v-for="item in waterPoints" 
            :key="item.id" 
            class="water-point-item"
            @click="goToDetail(item.id)"
          >
            <div class="item-images">
              <img 
                :src="getImageUrl(getMainImage(item))"
                class="main-image"
                :alt="item.name"
                @error="handleImageError"
                @load="handleImageLoad"
              />
              <div class="image-badges" v-if="hasSpecialImages(item)">
                <div v-if="item.storefront_image" class="badge storefront">门头</div>
                <div v-if="item.water_location_image" class="badge water-location">取水</div>
              </div>
            </div>
            <div class="item-content">
              <div class="item-title">{{ item.name }}</div>
              <div class="item-info">
                <div class="distance">{{ formatDistance(item.distance) }}</div>
              </div>
              <div class="item-address">
                <Icon name="location-o" size="14" />
                <span>{{ item.address }}</span>
              </div>
              <div class="item-tags">
                <Tag v-if="item.is_open" type="success" plain size="mini">营业中</Tag>
                <Tag v-else type="danger" plain size="mini">已关闭</Tag>
                <Tag type="primary" plain size="mini">免费取水</Tag>
                <Tag v-if="item.has_wifi || (item.facilities && item.facilities.includes('免费WiFi'))" type="primary" plain size="mini">免费WiFi</Tag>
                <Tag v-if="item.has_parking || (item.facilities && item.facilities.includes('停车场'))" type="primary" plain size="mini">停车场</Tag>
                <Tag v-if="item.facilities && item.facilities.includes('24小时营业')" type="primary" plain size="mini">24小时</Tag>
                <Tag v-if="item.facilities && item.facilities.includes('空调')" type="primary" plain size="mini">空调</Tag>
                <Tag v-if="item.facilities && item.facilities.includes('休息区')" type="primary" plain size="mini">休息区</Tag>
              </div>
            </div>
            <div class="item-action">
              <Button round size="small" type="primary" @click.stop="showRoute(item)">
                <Icon name="guide-o" />
                <span>导航</span>
              </Button>
            </div>
          </div>
        </List>
      </PullRefresh>
    </div>

    <!-- 返回顶部 -->
    <BackTop right="20" bottom="80" />

    <!-- 地图导航弹窗 -->
    <ActionSheet 
      v-model:show="showRoutePopup" 
      :actions="routeActions"
      cancel-text="取消"
      title="选择导航方式"
      @select="onSelectNavApp"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Toast, Dialog } from 'vant'
import { NavBar, Search, Icon, PullRefresh, List, Image, Tag, Button, Slider, ActionSheet } from 'vant'
import { getWaterPoints, getNearbyWaterPoints } from '@/api/waterPoint'
import BackTop from '@/components/BackTop.vue'

const router = useRouter()

// 状态变量
const keyword = ref('')
const distance = ref(5000) // 默认5公里
const sortBy = ref('distance') // 距离优先
const waterPoints = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const location = reactive({
  latitude: null,
  longitude: null
})
const showRoutePopup = ref(false)
const selectedPoint = ref(null)

// 导航应用选项
const routeActions = [
  { name: '高德地图', icon: 'location' },
  { name: '百度地图', icon: 'location' },
  { name: '腾讯地图', icon: 'location' }
]

// 获取当前位置
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          location.latitude = position.coords.latitude
          location.longitude = position.coords.longitude
          resolve(position.coords)
        },
        (error) => {
          Toast({ type: 'fail', message: '获取位置信息失败，请检查定位权限' })
          reject(error)
        }
      )
    } else {
      Toast({ type: 'fail', message: '您的浏览器不支持地理定位' })
      reject(new Error('Geolocation not supported'))
    }
  })
}

// 格式化距离
const formatDistance = (meters) => {
  if (!meters || meters === null || meters === undefined) {
    return '距离未知'
  }
  if (meters < 1000) {
    return `${Math.round(meters)}米`
  } else {
    return `${(meters / 1000).toFixed(1)}公里`
  }
}

// 搜索取水点
const onSearch = () => {
  currentPage.value = 1
  waterPoints.value = []
  finished.value = false
  loadWaterPoints()
}

// 取消搜索
const onCancelSearch = () => {
  keyword.value = ''
  onSearch()
}

// 使用当前位置搜索
const searchByLocation = async () => {
  try {
    const position = await getCurrentLocation()
    Toast.success('已获取您的位置')
    currentPage.value = 1
    waterPoints.value = []
    finished.value = false
    loadWaterPoints()
  } catch (error) {
    console.error('获取位置失败:', error)
  }
}

// 设置排序方式
const setSortBy = (type) => {
  sortBy.value = type
  currentPage.value = 1
  waterPoints.value = []
  finished.value = false
  loadWaterPoints()
}

// 距离变化
const onDistanceChange = () => {
  currentPage.value = 1
  waterPoints.value = []
  finished.value = false
  loadWaterPoints()
}

// 获取图片URL
const getImageUrl = (url) => {
  if (!url) return 'https://img01.yzcdn.cn/vant/apple-1.jpg' // 默认图片
  if (url.startsWith('http')) return url
  return `https://pay.itapgo.com${url.startsWith('/') ? '' : '/'}${url}`
}

// 获取主要显示图片
const getMainImage = (item) => {
  // 优先显示门头照片
  if (item.storefront_image) {
    return item.storefront_image
  }
  // 其次显示取水位置照片
  if (item.water_location_image) {
    return item.water_location_image
  }
  // 然后显示其他图片
  if (item.images && item.images.length > 0) {
    return item.images[0]
  }
  // 最后使用默认图片
  if (item.image) {
    return item.image
  }
  return null
}

// 检查是否有特殊图片标识
const hasSpecialImages = (item) => {
  return item.storefront_image || item.water_location_image
}

// 图片加载成功处理
const handleImageLoad = (event) => {
  console.log('图片加载成功:', event.target.src)
}

// 图片加载失败处理
const handleImageError = (event) => {
  console.log('图片加载失败:', event.target.src)
  // 设置默认图片
  event.target.src = 'https://img01.yzcdn.cn/vant/apple-1.jpg'
}

// 加载取水点列表
const loadWaterPoints = async () => {
  if (refreshing.value) {
    currentPage.value = 1
    waterPoints.value = []
    finished.value = false
  }
  
  try {
    loading.value = true
    
    // 构建请求参数
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      distance: distance.value
    }
    
    // 添加关键词搜索
    if (keyword.value) {
      params.keyword = keyword.value
    }
    
    // 添加位置信息
    if (location.latitude && location.longitude) {
      params.lat = location.latitude
      params.lng = location.longitude
    }
    
    // 调用真实API获取取水点数据
    const res = await getWaterPoints(params)
    
    if (res.code !== 0) {
      throw new Error(res.message || '获取数据失败')
    }
    
    // 使用API返回的数据
    const items = res.data || []
    
    // 更新列表
    if (refreshing.value) {
      waterPoints.value = items
      refreshing.value = false
    } else {
      waterPoints.value = [...waterPoints.value, ...items]
    }
    
    // 更新分页状态
    const pagination = res.pagination || {}
    loading.value = false
    
    // 根据API返回的分页信息判断是否还有更多数据
    if (!pagination.has_more) {
      finished.value = true
    } else {
      currentPage.value++
    }
  } catch (error) {
    console.error('加载取水点数据失败:', error)
    loading.value = false
    refreshing.value = false
    Toast({ type: 'fail', message: '加载数据失败，请重试' })
    
    // 设置finished为true，防止无限加载
    finished.value = true
  }
}

// 下拉刷新
const onRefresh = () => {
  finished.value = false
  currentPage.value = 1
  loadWaterPoints()
}

// 上拉加载更多
const onLoad = () => {
  loadWaterPoints()
}

// 跳转到取水点详情页
const goToDetail = (id) => {
  router.push(`/water-point/detail/${id}`)
}

// 显示地图页面
const showMap = () => {
  router.push('/water-point/map')
}

// 显示导航选项
const showRoute = (point) => {
  selectedPoint.value = point
  showRoutePopup.value = true
}

// 选择导航应用
const onSelectNavApp = (action) => {
  if (!selectedPoint.value) return
  
  const { latitude, longitude } = location
  const { name, address } = selectedPoint.value
  
  // 跳转到对应的地图应用
  let url = ''
  switch (action.name) {
    case '高德地图':
      url = `https://uri.amap.com/navigation?from=${longitude},${latitude},当前位置&to=${longitude},${latitude},${name}&mode=car`
      break
    case '百度地图':
      url = `https://api.map.baidu.com/direction?origin=${latitude},${longitude}&destination=${latitude},${longitude}&mode=driving&name=${name}`
      break
    case '腾讯地图':
      url = `https://apis.map.qq.com/uri/v1/routeplan?type=drive&from=当前位置&fromcoord=${latitude},${longitude}&to=${name}&tocoord=${latitude},${longitude}`
      break
  }
  
  if (url) {
    window.location.href = url
  }
}

// 页面加载时获取位置并加载取水点
onMounted(async () => {
  try {
    await getCurrentLocation()
  } catch (error) {
    console.warn('未能获取位置信息:', error)
  }
  loadWaterPoints()
})
</script>

<style scoped>
.water-point-container {
  padding-bottom: 100px;
  padding-top: 20px;
  background-color: #f7f8fa;
  min-height: 100vh;
}

.search-wrapper {
  position: sticky;
  top: 20px;
  z-index: 100;
  padding: 8px 16px;
  background-color: #fff;
}

.search-action {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #1989fa;
}

.search-action .van-icon {
  margin-right: 4px;
}

.filter-bar {
  display: flex;
  padding: 10px 16px;
  background-color: #fff;
  margin-bottom: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.filter-item {
  display: flex;
  align-items: center;
  margin-right: 20px;
  font-size: 14px;
  color: #323233;
  cursor: pointer;
}

.filter-item .van-icon {
  margin-right: 4px;
}

.filter-item.active {
  color: #1989fa;
  font-weight: 500;
}

.distance-filter {
  padding: 5px 16px 15px;
  background-color: #fff;
  margin-bottom: 8px;
}

.distance-button {
  width: auto;
  min-width: 60px;
  color: #fff;
  font-size: 12px;
  line-height: 20px;
  text-align: center;
  background-color: #1989fa;
  border-radius: 10px;
  padding: 0 8px;
}

.water-point-list {
  padding: 0 12px;
}

.water-point-item {
  position: relative;
  display: flex;
  margin-bottom: 12px;
  padding: 12px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.item-images {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 4px;
  margin-right: 12px;
}

.main-image {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

.image-badges {
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.badge {
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  padding: 2px 6px;
  font-size: 10px;
  color: #fff;
  backdrop-filter: blur(4px);
}

.badge.storefront {
  background-color: rgba(25, 137, 250, 0.8);
}

.badge.water-location {
  background-color: rgba(82, 196, 26, 0.8);
}

.item-content {
  flex: 1;
  overflow: hidden;
}

.item-title {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 8px;
  line-height: 20px;
}

.item-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}



.distance {
  font-size: 12px;
  color: #1989fa;
}

.item-address {
  display: flex;
  align-items: flex-start;
  margin-bottom: 6px;
  font-size: 12px;
  color: #646566;
  line-height: 18px;
}

.item-address .van-icon {
  margin-right: 4px;
  flex-shrink: 0;
  margin-top: 2px;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
}

.item-tags .van-tag {
  margin-right: 6px;
  margin-bottom: 4px;
}



.item-action {
  position: absolute;
  right: 12px;
  bottom: 12px;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
  color: #969799;
}

.empty-state .van-icon {
  margin-bottom: 8px;
}
</style>