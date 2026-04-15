<template>
  <div class="water-point-detail">
    <!-- 返回按钮 -->
    <div class="header-bar">
      <Icon name="arrow-left" size="20" @click="goBack" />
      <span class="header-title">取水点详情</span>
      <div class="header-action">
        <Icon 
          :name="waterPoint.is_favorite ? 'star' : 'star-o'" 
          size="20" 
          :color="waterPoint.is_favorite ? '#ffd21e' : '#969799'"
          @click="toggleFavorite"
        />
      </div>
    </div>

    <!-- 取水点图片轮播 -->
    <div class="image-section">
      <Swipe class="image-swiper" :autoplay="3000" indicator-color="white" v-if="allImages.length > 0">
        <SwipeItem v-for="(image, index) in allImages" :key="index">
          <Image 
            :src="getImageUrl(image.url)" 
            fit="cover" 
            class="swiper-image" 
            @click="showImagePreview(index)"
          />
          <div class="image-badge" v-if="image.type">{{ image.type }}</div>
        </SwipeItem>
      </Swipe>
      <div v-else class="no-image">
        <Icon name="photo-fail" size="48" color="#ddd" />
        <p>暂无图片</p>
      </div>
    </div>
    
    <!-- 基本信息 -->
    <div class="info-card">
      <div class="info-header">
        <h2 class="info-name">{{ waterPoint.name || '取水点' }}</h2>
        <div class="info-status">
          <Tag v-if="waterPoint.is_open" type="success" size="mini">营业中</Tag>
          <Tag v-else type="danger" size="mini">已关闭</Tag>
        </div>
      </div>
      

      
      <div class="info-address" @click="showNavigation">
        <Icon name="location-o" size="16" color="#1989fa" />
        <span class="address-text">{{ waterPoint.address || '地址未知' }}</span>
        <Icon name="guide-o" size="14" color="#1989fa" />
      </div>
    </div>
    
    <!-- 联系信息 -->
    <div class="contact-card">
      <div class="contact-item" v-if="waterPoint.phone">
        <Icon name="phone-o" size="18" color="#1989fa" />
        <span class="contact-text">{{ waterPoint.phone }}</span>
        <Button size="mini" type="primary" plain @click="callPhone(waterPoint.phone)">拨打</Button>
      </div>
      
      <div class="contact-item" v-if="waterPoint.business_hours">
        <Icon name="clock-o" size="18" color="#1989fa" />
        <span class="contact-text">{{ waterPoint.business_hours }}</span>
      </div>
      
      <div class="contact-item">
        <Icon name="discount" size="18" color="#1989fa" />
        <span class="contact-text">免费取水</span>
      </div>
    </div>
    
    <!-- 设施标签 -->
    <div class="facilities-card" v-if="waterPoint.facilities && waterPoint.facilities.length > 0">
      <div class="card-title">设施服务</div>
      <div class="facilities-list">
        <Tag 
          v-for="facility in waterPoint.facilities" 
          :key="facility" 
          type="primary" 
          plain 
          size="mini"
          class="facility-tag"
        >
          {{ facility }}
        </Tag>
      </div>
    </div>
    
    <!-- 取水点介绍 -->
    <div class="description-card" v-if="waterPoint.description">
      <div class="card-title">取水点介绍</div>
      <div class="description-content">{{ waterPoint.description }}</div>
    </div>
    
    <!-- 底部操作栏 -->
    <div class="bottom-actions">
      <Button 
        type="primary" 
        size="large" 
        block 
        icon="guide-o"
        @click="showNavigation"
      >
        导航到这里
      </Button>
    </div>

    <!-- 导航选择弹窗 -->
    <ActionSheet 
      v-model:show="showNavPopup" 
      :actions="navActions"
      cancel-text="取消"
      title="选择导航方式"
      @select="onSelectNavApp"
    />

    <!-- 图片预览 -->
    <ImagePreview 
      v-model:show="showPreview" 
      :images="previewImages" 
      :start-position="previewIndex"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Toast, Dialog } from 'vant'
import { 
  Icon, Button, Tag, Image, Swipe, SwipeItem, 
  ActionSheet, ImagePreview 
} from 'vant'
import { getWaterPointDetail, toggleFavoriteWaterPoint } from '@/api/waterPoint'

const router = useRouter()
const route = useRoute()

// 状态变量
const waterPoint = ref({})
const loading = ref(false)
const showNavPopup = ref(false)
const showPreview = ref(false)
const previewIndex = ref(0)

// 导航应用选项
const navActions = [
  { name: '高德地图', icon: 'location' },
  { name: '百度地图', icon: 'location' },
  { name: '腾讯地图', icon: 'location' }
]

// 计算属性
const allImages = computed(() => {
  const images = []
  
  // 门头照片
  if (waterPoint.value.storefront_image) {
    images.push({
      url: waterPoint.value.storefront_image,
      type: '门头照片'
    })
  }
  
  // 取水位置照片
  if (waterPoint.value.water_location_image) {
    images.push({
      url: waterPoint.value.water_location_image,
      type: '取水位置'
    })
  }
  
  // 其他图片
  if (waterPoint.value.images && waterPoint.value.images.length > 0) {
    waterPoint.value.images.forEach(img => {
      images.push({
        url: img,
        type: null
      })
    })
  }
  
  return images
})

const previewImages = computed(() => {
  return allImages.value.map(img => getImageUrl(img.url))
})

// 获取图片URL
const getImageUrl = (url) => {
  if (!url) return 'https://img01.yzcdn.cn/vant/apple-1.jpg'
  if (url.startsWith('http')) return url
  return `https://pay.itapgo.com${url.startsWith('/') ? '' : '/'}${url}`
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 显示图片预览
const showImagePreview = (index) => {
  previewIndex.value = index
  showPreview.value = true
}

// 显示导航选择
const showNavigation = () => {
  if (!waterPoint.value.latitude || !waterPoint.value.longitude) {
    Toast('该取水点暂无位置信息')
    return
  }
  showNavPopup.value = true
}

// 选择导航应用
const onSelectNavApp = (action) => {
  const { latitude, longitude, name, address } = waterPoint.value
  
  if (!latitude || !longitude) {
    Toast({ type: 'fail', message: '该取水点暂无位置信息' })
    return
  }
  
  const pointName = encodeURIComponent(name || '取水点')
  const pointAddress = encodeURIComponent(address || '')
  
  let url = ''
  switch (action.name) {
    case '高德地图':
      url = `https://uri.amap.com/navigation?to=${longitude},${latitude},${pointName}&mode=car`
      break
    case '百度地图':
      url = `https://api.map.baidu.com/direction?destination=${latitude},${longitude}&mode=driving&name=${pointName}`
      break
    case '腾讯地图':
      url = `https://apis.map.qq.com/uri/v1/routeplan?type=drive&to=${pointName}&tocoord=${latitude},${longitude}`
      break
  }
  
  if (url) {
    try {
      window.location.href = url
    } catch (error) {
      console.error('打开导航应用失败:', error)
      Toast({ type: 'fail', message: '打开导航应用失败' })
    }
  }
}

// 拨打电话
const callPhone = (phone) => {
  if (!phone) return
  window.location.href = `tel:${phone}`
}

// 切换收藏状态
const toggleFavorite = async () => {
  try {
    if (!waterPoint.value.id) {
      Toast({ type: 'fail', message: '取水点信息异常' })
      return
    }
    
    const result = await toggleFavoriteWaterPoint({
      id: waterPoint.value.id,
      is_favorite: !waterPoint.value.is_favorite
    })
    
    if (result && result.code === 0) {
      waterPoint.value.is_favorite = !waterPoint.value.is_favorite
      Toast.success(waterPoint.value.is_favorite ? '收藏成功' : '取消收藏')
    } else {
      Toast({ type: 'fail', message: result?.message || '操作失败' })
    }
  } catch (error) {
    console.error('切换收藏状态失败:', error)
    Toast({ type: 'fail', message: '网络错误，请重试' })
  }
}

// 加载取水点详情
const loadWaterPointDetail = async () => {
  try {
    loading.value = true
    const id = route.params.id
    
    if (!id) {
      Toast({ type: 'fail', message: '取水点ID不能为空' })
      router.back()
      return
    }
    
    const result = await getWaterPointDetail(id)
    
    if (result && result.code === 0 && result.data) {
      waterPoint.value = result.data
      
      // 确保数组字段存在并且是数组类型
      waterPoint.value.images = Array.isArray(waterPoint.value.images) ? waterPoint.value.images : []
      waterPoint.value.facilities = Array.isArray(waterPoint.value.facilities) ? waterPoint.value.facilities : []
      waterPoint.value.tags = Array.isArray(waterPoint.value.tags) ? waterPoint.value.tags : []
      
      // 确保收藏状态字段存在
      if (typeof waterPoint.value.is_favorite === 'undefined') {
        waterPoint.value.is_favorite = false
      }
    } else {
      const message = result?.message || '获取详情失败'
      Toast({ type: 'fail', message })
      router.back()
    }
  } catch (error) {
    console.error('加载取水点详情失败:', error)
    Toast({ type: 'fail', message: '网络错误，请重试' })
    router.back()
  } finally {
    loading.value = false
  }
}

// 页面加载时获取详情
onMounted(async () => {
  try {
    await loadWaterPointDetail()
  } catch (error) {
    console.error('页面初始化失败:', error)
    Toast({ type: 'fail', message: '页面加载失败，请重试' })
  }
})
</script>

<style scoped>
.water-point-detail {
  background-color: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 80px;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #ebedf0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-bar .van-icon {
  color: #323233 !important;
  cursor: pointer;
  display: inline-block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
}

.header-action {
  cursor: pointer;
}

.image-section {
  position: relative;
  height: 240px;
  background-color: #f5f5f5;
}

.image-swiper {
  height: 100%;
}

.swiper-image {
  width: 100%;
  height: 100%;
}

.image-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  backdrop-filter: blur(4px);
}

.no-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #969799;
}

.info-card {
  background-color: #fff;
  padding: 16px;
  margin-bottom: 8px;
}

.info-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.info-name {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
  margin: 0;
  flex: 1;
  margin-right: 12px;
}



.info-address {
  display: flex;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
}

.address-text {
  flex: 1;
  margin: 0 8px;
  font-size: 14px;
  color: #323233;
  line-height: 20px;
}

.contact-card {
  background-color: #fff;
  padding: 16px;
  margin-bottom: 8px;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.contact-item:not(:last-child) {
  border-bottom: 1px solid #f7f8fa;
}

.contact-text {
  flex: 1;
  margin-left: 12px;
  font-size: 14px;
  color: #323233;
}

.facilities-card {
  background-color: #fff;
  padding: 16px;
  margin-bottom: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 12px;
}

.facilities-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.facility-tag {
  margin: 0;
}

.description-card {
  background-color: #fff;
  padding: 16px;
  margin-bottom: 8px;
}

.description-content {
  font-size: 14px;
  color: #646566;
  line-height: 22px;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background-color: #fff;
  border-top: 1px solid #ebedf0;
  z-index: 100;
}
</style>
