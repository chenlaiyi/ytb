<template>
  <div class="branch-water-point">
    <!-- 搜索栏 -->
    <div class="search-section">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索取水点..."
        @search="onSearch"
        @clear="onClear"
        shape="round"
        show-action
      >
        <template #action>
          <div @click="toggleFilter" class="filter-btn">
            <van-icon name="filter-o" size="16" />
            筛选
          </div>
        </template>
      </van-search>
    </div>

    <!-- 筛选面板 -->
    <van-popup
      v-model:show="showFilterPanel"
      position="top"
      :style="{ height: '60%' }"
    >
      <div class="filter-panel">
        <div class="filter-header">
          <div class="filter-title">筛选条件</div>
          <van-button size="small" type="primary" @click="applyFilter">确定</van-button>
        </div>
        
        <div class="filter-content">
          <!-- 距离筛选 -->
          <div class="filter-item">
            <div class="filter-label">距离范围</div>
            <van-radio-group v-model="filterData.distance">
              <van-radio name="all">不限</van-radio>
              <van-radio name="1km">1公里内</van-radio>
              <van-radio name="3km">3公里内</van-radio>
              <van-radio name="5km">5公里内</van-radio>
            </van-radio-group>
          </div>

          <!-- 设备状态筛选 -->
          <div class="filter-item">
            <div class="filter-label">设备状态</div>
            <van-radio-group v-model="filterData.status">
              <van-radio name="all">全部</van-radio>
              <van-radio name="normal">正常</van-radio>
              <van-radio name="maintenance">维护中</van-radio>
              <van-radio name="offline">离线</van-radio>
            </van-radio-group>
          </div>

          <!-- 水质等级筛选 -->
          <div class="filter-item">
            <div class="filter-label">水质等级</div>
            <van-radio-group v-model="filterData.waterQuality">
              <van-radio name="all">全部</van-radio>
              <van-radio name="excellent">优</van-radio>
              <van-radio name="good">良</van-radio>
              <van-radio name="fair">中</van-radio>
            </van-radio-group>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 地图切换按钮 -->
    <div class="map-toggle">
      <van-button 
        :type="viewMode === 'list' ? 'default' : 'primary'" 
        size="small" 
        @click="switchViewMode"
        round
      >
        <van-icon :name="viewMode === 'list' ? 'location-o' : 'bars'" />
        {{ viewMode === 'list' ? '地图' : '列表' }}
      </van-button>
    </div>

    <!-- 列表视图 -->
    <div v-if="viewMode === 'list'" class="list-view">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div 
            v-for="point in waterPointList" 
            :key="point.id" 
            class="water-point-item"
            @click="goToDetail(point)"
          >
            <div class="point-header">
              <div class="point-name">{{ point.name }}</div>
              <div class="point-status" :class="getStatusClass(point.status)">
                {{ getStatusText(point.status) }}
              </div>
            </div>
            
            <div class="point-info">
              <div class="info-row">
                <van-icon name="location-o" />
                <span class="info-text">{{ point.address }}</span>
              </div>
              <div class="info-row">
                <van-icon name="clock-o" />
                <span class="info-text">营业时间：{{ point.business_hours }}</span>
              </div>
              <div class="info-row">
                <van-icon name="fire-o" />
                <span class="info-text">水质：{{ getWaterQualityText(point.water_quality) }}</span>
              </div>
            </div>
            
            <div class="point-footer">
              <div class="distance">
                <van-icon name="guide-o" />
                {{ point.distance }}
              </div>
              <div class="actions">
                <van-button size="mini" @click.stop="callPoint(point)">
                  <van-icon name="phone-o" />
                  联系
                </van-button>
                <van-button size="mini" type="primary" @click.stop="navigate(point)">
                  <van-icon name="guide-o" />
                  导航
                </van-button>
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 地图视图 -->
    <div v-else class="map-view">
      <div class="map-container" ref="mapContainer" id="mobile-map"></div>
      
      <!-- 地图控制按钮 -->
      <div class="map-controls">
        <van-button 
          class="control-btn location-btn" 
          icon="aim" 
          size="small" 
          @click="centerToUserLocation"
          :loading="locating"
        >
          定位
        </van-button>
        <van-button 
          class="control-btn refresh-btn" 
          icon="replay" 
          size="small" 
          @click="refreshMapData"
          :loading="loading"
        >
          刷新
        </van-button>
        <van-button 
          class="control-btn help-btn" 
          icon="question-o" 
          size="small" 
          @click="showLocationHelp"
        >
          帮助
        </van-button>
      </div>

      <!-- 地图加载状态 -->
      <div v-if="mapLoading" class="map-loading">
        <van-loading type="spinner" />
        <p>地图加载中...</p>
      </div>

      <!-- 地图错误状态 -->
      <div v-if="mapError" class="map-error">
        <van-icon name="warning-o" size="32" />
        <p>地图加载失败</p>
        <van-button size="small" @click="initMap">重试</van-button>
      </div>

      <!-- 取水点详情卡片 -->
      <van-popup 
        v-model:show="showPointDetail" 
        position="bottom" 
        round 
        :style="{ height: '40%' }"
      >
        <div v-if="selectedPoint" class="point-detail-card">
          <div class="detail-header">
            <h3>{{ selectedPoint.name }}</h3>
            <van-icon 
              name="cross" 
              @click="showPointDetail = false"
              class="close-btn"
            />
          </div>
          
          <div class="detail-content">
            <div class="detail-item">
              <van-icon name="location-o" />
              <span>{{ selectedPoint.address }}</span>
            </div>
            
            <div class="detail-item">
              <van-icon name="clock-o" />
              <span>营业时间：{{ selectedPoint.business_hours }}</span>
            </div>
            
            <div class="detail-item">
              <van-icon name="phone-o" />
              <span>联系电话：{{ selectedPoint.contact_phone }}</span>
            </div>
            
            <div class="detail-item">
              <van-icon name="fire-o" />
              <span>状态：{{ selectedPoint.status_text }}</span>
            </div>
            
            <div class="detail-item" v-if="selectedPoint.distance">
              <van-icon name="guide-o" />
              <span>距离：{{ selectedPoint.distance }}</span>
            </div>
          </div>
          
          <div class="detail-actions">
            <van-button 
              type="default" 
              @click="callPoint(selectedPoint)"
              icon="phone-o"
            >
              联系
            </van-button>
            <van-button 
              type="primary" 
              @click="navigate(selectedPoint)"
              icon="guide-o"
            >
              导航
            </van-button>
          </div>
        </div>
      </van-popup>
    </div>

    <!-- 浮动按钮 -->
    <div class="floating-buttons">
      <van-button 
        round 
        type="primary" 
        size="small" 
        @click="refreshLocation"
        class="location-btn"
      >
        <van-icon name="aim" />
        定位
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onActivated, reactive, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { branchWaterPointApi } from '@/api/branchWaterPoint'

const router = useRouter()

// 响应式数据
const searchKeyword = ref('')
const viewMode = ref('list') // list 或 map
const showFilterPanel = ref(false)
const refreshing = ref(false)
const loading = ref(false)
const finished = ref(false)
const waterPointList = ref([])
const mapContainer = ref(null)
const currentPage = ref(1)
const pageSize = ref(20)
const userLocation = reactive({
  latitude: null,
  longitude: null
})

// 地图相关状态
const mapInstance = ref(null)
const mapLoading = ref(false)
const mapError = ref(false)
const locating = ref(false)
const showPointDetail = ref(false)
const selectedPoint = ref(null)
const mapMarkers = ref([])

// 筛选数据
const filterData = reactive({
  distance: 'all',
  status: 'all',
  waterQuality: 'all'
})



// 搜索
const onSearch = () => {
  console.log('搜索:', searchKeyword.value)
  currentPage.value = 1
  waterPointList.value = []
  finished.value = false
  loadWaterPoints()
}

// 清空搜索
const onClear = () => {
  searchKeyword.value = ''
  currentPage.value = 1
  waterPointList.value = []
  finished.value = false
  loadWaterPoints()
}

// 切换筛选面板
const toggleFilter = () => {
  showFilterPanel.value = !showFilterPanel.value
}

// 应用筛选
const applyFilter = () => {
  showFilterPanel.value = false
  currentPage.value = 1
  waterPointList.value = []
  finished.value = false
  loadWaterPoints()
  showToast('筛选条件已应用')
}

// 切换视图模式
const switchViewMode = () => {
  viewMode.value = viewMode.value === 'list' ? 'map' : 'list'
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  currentPage.value = 1
  finished.value = false
  loadWaterPoints()
}

// 上拉加载
const onLoad = () => {
  loadWaterPoints()
}

// 加载取水点数据
const loadWaterPoints = async () => {
  // 如果正在加载中，避免重复加载
  if (loading.value && !refreshing.value) {
    console.log('正在加载中，跳过重复请求')
    return
  }
  
  // 只有在刷新状态或明确要求重新加载时才重置数据
  if (refreshing.value || currentPage.value === 1) {
    console.log('重置分页状态 - refreshing:', refreshing.value, 'currentPage:', currentPage.value)
    if (currentPage.value === 1) {
      waterPointList.value = []
    }
    finished.value = false
  }
  
  loading.value = true
  
  try {
    // 构建请求参数
    const params = {
      keyword: searchKeyword.value,
      status: filterData.status === 'all' ? 'all' : filterData.status,
      page: currentPage.value,
      page_size: pageSize.value
    }
    
    // 添加位置信息（如果有）
    if (userLocation.latitude && userLocation.longitude) {
      params.lat = userLocation.latitude
      params.lng = userLocation.longitude
      params.radius = 10000 // 10公里范围
    }
    
    console.log('请求取水点列表，参数:', params)
    
    // 调用API
    const response = await branchWaterPointApi.getWaterPoints(params)
    
    if (response.code === 0 && response.data) {
      const { list, pagination } = response.data
      
      // 处理数据格式，适配前端显示
      const processedList = list.map(item => ({
        ...item,
        // 兼容旧的字段名
        business_hours: item.business_hours || `${item.open_time || '00:00'}-${item.close_time || '24:00'}`,
        phone: item.contact_phone,
        distance: item.distance_text || '距离未知',
        water_quality: 'good', // 默认水质等级
        // 状态映射
        status: item.status === 'active' ? 'normal' : 
                item.status === 'maintenance' ? 'maintenance' : 'offline'
      }))
      
      if (refreshing.value || currentPage.value === 1) {
        console.log('设置新的数据列表，数据数量:', processedList.length)
        waterPointList.value = processedList
        refreshing.value = false
      } else {
        console.log('追加数据到现有列表，新增数量:', processedList.length, '原有数量:', waterPointList.value.length)
        waterPointList.value = [...waterPointList.value, ...processedList]
      }
      
      // 更新分页状态
      finished.value = !pagination.has_more
      if (pagination.has_more) {
        currentPage.value++
      }
      
      console.log(`成功加载${processedList.length}个取水点，总计${waterPointList.value.length}个`)
    } else {
      console.error('API返回错误:', response)
      showToast(response.message || '获取取水点列表失败')
      finished.value = true
    }
  } catch (error) {
    console.error('加载取水点数据失败:', error)
    showToast('加载数据失败，请重试')
    finished.value = true
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
      return '正常'
    case 'maintenance':
      return '维护中'
    case 'offline':
      return '离线'
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

// 跳转到详情页
const goToDetail = (point) => {
  router.push(`/branch/water-point/detail/${point.id}`)
}

// 联系取水点
const callPoint = (point) => {
  showConfirmDialog({
    title: '联系取水点',
    message: `是否拨打电话：${point.phone}？`
  }).then(() => {
    window.open(`tel:${point.phone}`)
  }).catch(() => {
    // 用户取消
  })
}

// 导航到取水点
const navigate = (point) => {
  const lat = parseFloat(point.latitude)
  const lng = parseFloat(point.longitude)
  
  if (!lat || !lng) {
    showToast('该取水点位置信息不完整')
    return
  }

  showConfirmDialog({
    title: '选择导航方式',
    message: `导航到：${point.name}`
  }).then(() => {
    // 优先使用高德地图
    const amapUrl = `androidamap://navi?sourceApplication=点点够&poiname=${encodeURIComponent(point.name)}&lat=${lat}&lon=${lng}&dev=0&style=2`
    
    // 尝试打开高德地图
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = amapUrl
    document.body.appendChild(iframe)
    
    setTimeout(() => {
      document.body.removeChild(iframe)
      // 如果高德地图没有打开，使用Web导航
      const webMapUrl = `https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(point.name)}&mode=car&policy=1&src=点点够`
      window.open(webMapUrl, '_blank')
    }, 2000)
    
    showToast('正在启动导航应用...')
  }).catch(() => {
    // 用户取消
  })
}

// 获取用户位置
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.log('浏览器不支持地理定位，使用默认位置')
      // 使用福州市中心作为默认位置
      userLocation.latitude = 26.075302
      userLocation.longitude = 119.306239
      resolve({ latitude: userLocation.latitude, longitude: userLocation.longitude })
      return
    }

    console.log('开始获取用户位置...')
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation.latitude = position.coords.latitude
        userLocation.longitude = position.coords.longitude
        console.log('获取位置成功:', userLocation)
        resolve(position.coords)
      },
      (error) => {
        console.error('获取位置失败:', error)
        // 静默处理定位失败，使用默认位置
        userLocation.latitude = 26.075302
        userLocation.longitude = 119.306239
        console.log('使用默认位置:', userLocation)
        
        // 只在用户主动刷新位置时才显示错误信息
        if (error.code === error.PERMISSION_DENIED) {
          console.log('定位权限被拒绝，使用默认位置')
        } else {
          console.log('定位失败，使用默认位置')
        }
        
        resolve({ latitude: userLocation.latitude, longitude: userLocation.longitude })
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // 5分钟缓存
      }
    )
  })
}

// 处理位置获取错误
const handleLocationError = (error) => {
  let message = '获取位置信息失败'
  
  switch (error.code) {
    case error.PERMISSION_DENIED:
      message = '定位权限被拒绝，请在设置中允许定位权限'
      showLocationPermissionGuide()
      break
    case error.POSITION_UNAVAILABLE:
      message = '位置信息不可用，请检查网络连接'
      break
    case error.TIMEOUT:
      message = '定位请求超时，请重试'
      break
    default:
      message = '定位失败，但您仍可以查看所有取水点'
      break
  }
  
  showToast(message)
}

// 显示定位权限引导
const showLocationPermissionGuide = () => {
  showConfirmDialog({
    title: '需要定位权限',
    message: '为了为您推荐最近的取水点，我们需要获取您的位置信息。请在浏览器地址栏或设置中允许定位权限。',
    confirmButtonText: '我知道了',
    showCancelButton: false
  }).catch(() => {
    // 用户关闭对话框
  })
}

// 刷新位置
const refreshLocation = async () => {
  try {
    showToast({
      message: '正在获取位置...',
      duration: 0,
      loadingType: 'spinner'
    })
    
    // 尝试获取真实位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation.latitude = position.coords.latitude
          userLocation.longitude = position.coords.longitude
          showToast.clear()
          showToast('位置获取成功，正在刷新数据...')
          
          // 重新加载数据
          currentPage.value = 1
          waterPointList.value = []
          finished.value = false
          loadWaterPoints()
          
          // 如果是地图模式，更新地图
          if (viewMode.value === 'map' && mapInstance.value) {
            mapInstance.value.setCenter([userLocation.longitude, userLocation.latitude])
            addUserLocationMarker()
          }
        },
        (error) => {
          showToast.clear()
          console.error('定位失败:', error)
          
          // 显示用户友好的错误信息
          if (error.code === error.PERMISSION_DENIED) {
            showLocationPermissionGuide()
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            showToast('位置信息不可用，请检查网络连接')
          } else if (error.code === error.TIMEOUT) {
            showToast('定位请求超时，请重试')
          } else {
            showToast('定位失败，使用默认区域显示取水点')
          }
          
          // 重新加载数据（使用默认位置）
          currentPage.value = 1
          waterPointList.value = []
          finished.value = false
          loadWaterPoints()
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        }
      )
    } else {
      showToast.clear()
      showToast('浏览器不支持定位功能')
      
      // 重新加载数据
      currentPage.value = 1
      waterPointList.value = []
      finished.value = false
      loadWaterPoints()
    }
  } catch (error) {
    showToast.clear()
    console.error('定位操作失败:', error)
    showToast('定位操作失败')
  }
}

// 地图相关方法
const loadMapScript = () => {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.charset = 'utf-8'
    script.src = 'https://webapi.amap.com/maps?v=1.4.15&key=eb59997c3fcabbaceebc01ca65d360bf&plugin=AMap.Geocoder,AMap.PlaceSearch'
    
    script.onload = () => {
      console.log('地图脚本加载成功')
      setTimeout(() => {
        if (window.AMap) {
          // 添加高德地图全局错误监听器
          if (typeof window.AMap.errorHandler === 'undefined') {
            window.AMap.errorHandler = (error) => {
              console.error('高德地图错误:', error)
              // 阻止默认错误提示，返回false
              return false
            }
          }
          
          // 设置高德地图全局错误处理
          if (window.AMap.plugin) {
            window.AMap.plugin(['AMap.Geolocation'], () => {
              // 静默处理定位错误
            })
          }
          
          resolve()
        } else {
          reject(new Error('地图对象未定义'))
        }
      }, 100)
    }
    
    script.onerror = (error) => {
      console.error('地图脚本加载失败:', error)
      reject(new Error('网络连接异常，请检查网络设置'))
    }
    
    document.head.appendChild(script)
  })
}

const initMap = async () => {
  if (viewMode.value !== 'map') return
  
  mapLoading.value = true
  mapError.value = false
  
  try {
    console.log('开始初始化地图...')
    
    // 加载地图脚本
    await loadMapScript()
    
    // 检查容器
    const container = document.getElementById('mobile-map')
    if (!container) {
      throw new Error('地图容器不存在')
    }

    console.log('创建地图实例...')
    
    // 创建地图实例
    mapInstance.value = new AMap.Map('mobile-map', {
      zoom: 13,
      center: [119.306239, 26.075302], // 福州市中心
      mapStyle: 'amap://styles/normal',
      showLabel: true,
      features: ['bg', 'road', 'point', 'building'],
      // 禁用默认的错误提示
      showInfoWindow: false
    })

    // 添加地图错误事件监听
    mapInstance.value.on('error', (error) => {
      console.error('地图错误:', error)
      // 阻止默认错误提示
      return false
    })
    
    // 添加地图完成事件监听
    mapInstance.value.on('complete', () => {
      console.log('地图加载完成')
    })
    
    // 添加更多错误事件监听
    mapInstance.value.on('dragend', () => {
      // 拖拽结束后的错误处理
    })
    
    mapInstance.value.on('zoomend', () => {
      // 缩放结束后的错误处理
    })

    console.log('地图创建成功:', mapInstance.value)

    // 尝试定位到用户位置
    if (userLocation.latitude && userLocation.longitude) {
      mapInstance.value.setCenter([userLocation.longitude, userLocation.latitude])
      // 只有在真实位置时才添加用户位置标记
      if (userLocation.latitude !== 26.075302 || userLocation.longitude !== 119.306239) {
        addUserLocationMarker()
      }
    }

    // 添加取水点标记
    addWaterPointMarkers()
    
    mapLoading.value = false
    console.log('地图初始化完成')
    
  } catch (error) {
    console.error('地图初始化失败:', error)
    mapError.value = true
    mapLoading.value = false
    showToast(`地图加载失败: ${error.message}`)
  }
}

const addUserLocationMarker = () => {
  if (!mapInstance.value || !userLocation.latitude || !userLocation.longitude) return
  
  // 移除已有的用户位置标记
  if (mapInstance.value.userMarker) {
    mapInstance.value.remove(mapInstance.value.userMarker)
  }
  
  // 创建用户位置标记
  const userMarker = new AMap.Marker({
    position: [userLocation.longitude, userLocation.latitude],
    icon: new AMap.Icon({
      image: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#1890ff">
          <circle cx="12" cy="12" r="8" stroke="#fff" stroke-width="3"/>
        </svg>
      `),
      size: new AMap.Size(24, 24),
      imageSize: new AMap.Size(24, 24)
    }),
    title: '我的位置'
  })
  
  mapInstance.value.add(userMarker)
  mapInstance.value.userMarker = userMarker
}

const addWaterPointMarkers = () => {
  if (!mapInstance.value) return
  
  // 移除已有标记
  if (mapMarkers.value.length > 0) {
    mapInstance.value.remove(mapMarkers.value)
    mapMarkers.value = []
  }
  
  // 为每个取水点创建标记
  waterPointList.value.forEach(point => {
    const lat = parseFloat(point.latitude)
    const lng = parseFloat(point.longitude)
    
    if (!lat || !lng) return
    
    const marker = new AMap.Marker({
      position: [lng, lat],
      icon: new AMap.Icon({
        image: 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="12" fill="#00a0e9" stroke="#fff" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">水</text>
          </svg>
        `),
        size: new AMap.Size(32, 32),
        imageSize: new AMap.Size(32, 32)
      }),
      title: point.name
    })
    
    // 添加点击事件
    marker.on('click', () => {
      selectedPoint.value = point
      showPointDetail.value = true
    })
    
    mapMarkers.value.push(marker)
  })
  
  // 添加到地图
  if (mapMarkers.value.length > 0) {
    mapInstance.value.add(mapMarkers.value)
    
    // 自适应显示所有标记
    if (mapMarkers.value.length > 1) {
      mapInstance.value.setFitView(mapMarkers.value)
    }
  }
}

const centerToUserLocation = async () => {
  locating.value = true
  
  try {
    showToast({
      message: '正在定位...',
      duration: 0,
      loadingType: 'spinner'
    })
    
    await getCurrentLocation()
    
    showToast.clear()
    
    if (mapInstance.value && userLocation.latitude && userLocation.longitude) {
      mapInstance.value.setCenter([userLocation.longitude, userLocation.latitude])
      mapInstance.value.setZoom(15)
      addUserLocationMarker()
      showToast('定位成功！已为您显示当前位置')
    } else {
      showToast('定位成功，但地图未就绪')
    }
  } catch (error) {
    showToast.clear()
    console.error('定位失败:', error)
    // 错误消息已在handleLocationError中处理
  } finally {
    locating.value = false
  }
}

const refreshMapData = () => {
  currentPage.value = 1
  waterPointList.value = []
  finished.value = false
  loadWaterPoints().then(() => {
    if (mapInstance.value) {
      addWaterPointMarkers()
    }
  })
}

// 显示定位帮助
const showLocationHelp = () => {
  showConfirmDialog({
    title: '定位使用帮助',
    message: `如何开启定位权限：

1. 点击浏览器地址栏左侧的锁型图标
2. 将"位置"权限设为"允许"
3. 刷新页面重新尝试

如果仍无法定位：
• 检查手机GPS是否已开启
• 确保网络连接正常
• 尝试在户外开阔环境使用

即使无法定位，您也可以正常查看所有取水点信息。`,
    confirmButtonText: '我知道了',
    showCancelButton: false
  }).catch(() => {
    // 用户关闭对话框
  })
}

// 保存原始alert函数的引用
let originalAlert = null

onMounted(async () => {
  // 全局错误捕获，防止页面崩溃
  try {
    // 添加全局错误拦截，阻止高德地图默认错误提示
    originalAlert = window.alert
    window.alert = function(message) {
      if (typeof message === 'string') {
        // 拦截常见的高德地图错误提示
        const errorKeywords = [
          '搜索服务异常',
          '网络连接异常',
          '请稍后重试',
          '请检查网络设置',
          'QUOTA_EXCEEDED',
          'INVALID_PARAMS',
          'SERVICE_NOT_AVAILABLE',
          'DAILY_QUERY_OVER_LIMIT',
          'ACCESS_TOO_FREQUENT',
          '服务暂时不可用',
          '网络请求失败',
          '地图服务异常',
          '定位服务异常',
          '搜索结果为空'
        ]
        
        const shouldIntercept = errorKeywords.some(keyword => message.includes(keyword))
        if (shouldIntercept) {
          console.warn('拦截高德地图错误提示:', message)
          return false
        }
      }
      return originalAlert.apply(this, arguments)
    }
    
    // 调试：检查和设置分支机构代码
    let branchCode = localStorage.getItem('branch_code')
    console.log('页面加载时的分支机构代码:', branchCode)
    
    // 如果没有分支机构代码，设置一个默认的用于测试
    if (!branchCode) {
      branchCode = 'YXY01' // 默认使用益辛友01
      localStorage.setItem('branch_code', branchCode)
      console.log('设置默认分支机构代码:', branchCode)
    }
    
    // 尝试获取用户位置（不阻塞页面加载）
    try {
      await getCurrentLocation()
      console.log('初始化时获取位置成功')
    } catch (error) {
      console.warn('初始化时获取位置失败，将显示所有取水点:', error)
      // 设置默认位置为福州市中心，确保地图可以正常显示
      userLocation.latitude = 26.075302
      userLocation.longitude = 119.306239
    }
    
    // 仅在初次挂载时加载取水点数据
    console.log('onMounted: 加载取水点数据')
    await loadWaterPoints()
    
  } catch (error) {
    console.error('页面初始化错误:', error)
    // 即使发生错误也要尝试加载默认数据
    try {
      userLocation.latitude = 26.075302
      userLocation.longitude = 119.306239
      localStorage.setItem('branch_code', 'YXY01')
      await loadWaterPoints()
    } catch (fallbackError) {
      console.error('备用初始化也失败:', fallbackError)
      showToast('页面加载失败，请刷新重试')
    }
  }
})

// 页面激活时执行（keep-alive缓存页面重新显示时）
onActivated(() => {
  console.log('分支机构取水点页面被激活（从其他页面返回）')
  
  // 检查数据是否为空，如果为空则重新加载
  if (waterPointList.value.length === 0) {
    console.log('onActivated: 取水点列表为空，重新加载数据')
    currentPage.value = 1
    finished.value = false
    loading.value = false
    refreshing.value = false
    loadWaterPoints()
  } else {
    console.log('onActivated: 取水点列表不为空，保持现有数据，当前数量:', waterPointList.value.length)
  }
})

onUnmounted(() => {
  // 恢复原始alert函数
  if (originalAlert) {
    window.alert = originalAlert
  }
})

// 监听视图模式变化，初始化地图
watch(viewMode, (newMode) => {
  if (newMode === 'map') {
    // 延迟初始化地图，确保DOM已渲染
    nextTick(() => {
      setTimeout(() => {
        initMap()
      }, 100)
    })
  }
})

// 监听取水点数据变化，更新地图标记
watch(waterPointList, () => {
  if (viewMode.value === 'map' && mapInstance.value) {
    addWaterPointMarkers()
  }
}, { deep: true })
</script>

<style scoped>
.branch-water-point {
  padding: 0;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.search-section {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #1989fa;
  font-size: 14px;
  padding: 8px;
}

.filter-panel {
  height: 100%;
  background: #fff;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.filter-title {
  font-size: 18px;
  font-weight: 600;
}

.filter-content {
  padding: 16px;
}

.filter-item {
  margin-bottom: 24px;
}

.filter-label {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #323233;
}

.map-toggle {
  position: absolute;
  top: 80px;
  right: 16px;
  z-index: 100;
}

.list-view {
  padding: 16px;
}

.water-point-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
}

.water-point-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.point-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.point-name {
  font-size: 18px;
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

.point-info {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: #666;
  font-size: 14px;
}

.info-row .van-icon {
  margin-right: 8px;
  color: #1989fa;
}

.info-text {
  flex: 1;
}

.point-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.distance {
  display: flex;
  align-items: center;
  color: #666;
  font-size: 14px;
}

.distance .van-icon {
  margin-right: 4px;
  color: #1989fa;
}

.actions {
  display: flex;
  gap: 8px;
}

.map-view {
  height: calc(100vh - 120px);
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
  background: #f0f0f0;
}

.map-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.map-placeholder p {
  margin: 8px 0;
  font-size: 14px;
}

.floating-buttons {
  position: fixed;
  bottom: 80px;
  right: 16px;
  z-index: 1000;
}

.location-btn {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* 单选框组样式调整 */
:deep(.van-radio-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.van-radio) {
  margin-right: 0;
}

/* 地图相关样式 */
.map-view {
  position: relative;
  height: 100%;
}

.map-container {
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
}

.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-btn {
  min-width: 60px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.map-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 1001;
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 8px;
}

.map-loading p {
  margin-top: 8px;
  color: #666;
  font-size: 14px;
}

.map-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 1001;
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 8px;
}

.map-error p {
  margin: 8px 0;
  color: #f56c6c;
  font-size: 14px;
}

.point-detail-card {
  padding: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.detail-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  font-size: 18px;
  color: #999;
  cursor: pointer;
}

.detail-content {
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.detail-item .van-icon {
  margin-right: 8px;
  color: #1890ff;
  font-size: 16px;
}

.detail-actions {
  display: flex;
  gap: 12px;
}

.detail-actions .van-button {
  flex: 1;
}
</style> 