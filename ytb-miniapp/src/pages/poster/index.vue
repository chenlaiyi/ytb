<template>
  <view class="page">
    <!-- 顶部分类标签 -->
    <view class="tab-bar">
      <view class="tab-item" :class="{ active: activeType === '' }" @tap="switchType('')">全部</view>
      <view class="tab-item" :class="{ active: activeType === 'promotion' }" @tap="switchType('promotion')">推广海报</view>
      <view class="tab-item" :class="{ active: activeType === 'product' }" @tap="switchType('product')">产品介绍</view>
      <view class="tab-item" :class="{ active: activeType === 'activity' }" @tap="switchType('activity')">活动海报</view>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-box">
      <view class="spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 空状态 -->
    <view v-else-if="posters.length === 0" class="empty-box">
      <text class="empty-icon">🖼️</text>
      <text class="empty-text">暂无推广海报</text>
      <text class="empty-hint">管理后台添加海报后将在这里展示</text>
    </view>

    <!-- 海报列表 -->
    <scroll-view v-else scroll-y class="poster-scroll" refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="poster-list">
        <view class="poster-card" v-for="poster in posters" :key="poster.id">
          <!-- 海报图片 -->
          <view class="poster-image-wrap" @tap="previewPoster(poster)">
            <image class="poster-image" :src="poster.image_url" mode="widthFix" :lazy-load="true" @error="onImageError($event, poster)" />
            <view class="poster-type-badge" :class="'type-' + (poster.type || 'promotion')">
              {{ getTypeName(poster.type) }}
            </view>
            <view class="poster-preview-tip">
              <text>👁️ 点击预览大图</text>
            </view>
          </view>
          <!-- 海报信息 -->
          <view class="poster-info">
            <text class="poster-title">{{ poster.title }}</text>
            <text class="poster-desc" v-if="poster.description">{{ poster.description }}</text>
            <view class="poster-actions">
              <button class="action-btn save-btn" @tap="savePoster(poster)">
                <text class="btn-icon">💾</text>
                <text>保存到相册</text>
              </button>
              <button class="action-btn share-btn" open-type="share" :data-id="poster.id" :data-title="poster.title" :data-image="poster.image_url">
                <text class="btn-icon">📤</text>
                <text>分享</text>
              </button>
            </view>
          </view>
        </view>
      </view>
      <view class="footer-tip" v-if="posters.length > 0">
        <text>共 {{ posters.length }} 张海报</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow, onShareAppMessage } from '@dcloudio/uni-app'
import { getPosters } from '../../api/ytb'

const posters = ref([])
const loading = ref(false)
const refreshing = ref(false)
const activeType = ref('')

const getTypeName = (type) => {
  const map = { promotion: '推广', product: '产品', activity: '活动', brand: '品牌' }
  return map[type] || '推广'
}

const fetchPosters = async () => {
  loading.value = true
  try {
    const params = {}
    if (activeType.value) params.type = activeType.value
    const res = await getPosters(params)
    if (res.code === 0) {
      posters.value = res.data?.items || res.data?.list || []
    }
  } catch (e) {
    console.error('获取海报失败:', e)
  }
  finally { loading.value = false; refreshing.value = false }
}

const switchType = (type) => {
  activeType.value = type
  fetchPosters()
}

const onRefresh = () => {
  refreshing.value = true
  fetchPosters()
}

const previewPoster = (poster) => {
  const urls = posters.value.map(p => p.image_url).filter(Boolean)
  uni.previewImage({
    current: poster.image_url,
    urls
  })
}

const savePoster = (poster) => {
  uni.showLoading({ title: '保存中...' })
  uni.downloadFile({
    url: poster.image_url,
    success: (downloadRes) => {
      if (downloadRes.statusCode === 200) {
        uni.saveImageToPhotosAlbum({
          filePath: downloadRes.tempFilePath,
          success: () => {
            uni.hideLoading()
            uni.showToast({ title: '已保存到相册', icon: 'success' })
          },
          fail: (err) => {
            uni.hideLoading()
            if (err.errMsg && err.errMsg.includes('auth deny')) {
              uni.showModal({
                title: '权限提示',
                content: '需要您授权保存到相册权限，才能保存海报图片',
                confirmText: '去设置',
                success: (modalRes) => {
                  if (modalRes.confirm) uni.openSetting()
                }
              })
            } else {
              uni.showToast({ title: '保存失败', icon: 'none' })
            }
          }
        })
      } else {
        uni.hideLoading()
        uni.showToast({ title: '下载失败', icon: 'none' })
      }
    },
    fail: () => {
      uni.hideLoading()
      uni.showToast({ title: '网络异常，下载失败', icon: 'none' })
    }
  })
}

const onImageError = (e, poster) => {
  console.warn('海报图片加载失败:', poster.title, poster.image_url)
}

// 分享
onShareAppMessage((res) => {
  // 点分享按钮时带海报信息
  const dataset = res.target?.dataset || {}
  if (dataset.title) {
    return {
      title: dataset.title,
      imageUrl: dataset.image,
      path: '/pages/index/index'
    }
  }
  return {
    title: '亿拓宝 - 净水器安装服务平台',
    path: '/pages/index/index'
  }
})

onShow(() => fetchPosters())
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f7;
  display: flex;
  flex-direction: column;
}

/* 分类标签 */
.tab-bar {
  display: flex;
  background: #fff;
  padding: 16rpx 24rpx;
  gap: 12rpx;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.tab-item {
  flex: 1;
  text-align: center;
  padding: 14rpx 0;
  font-size: 26rpx;
  color: #64748b;
  border-radius: 24rpx;
  background: #f1f5f9;
  transition: all 0.3s;
}
.tab-item.active {
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(79, 70, 229, 0.3);
}

/* 加载和空 */
.loading-box, .empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
  gap: 16rpx;
}
.spinner {
  width: 56rpx;
  height: 56rpx;
  border: 6rpx solid #E5E7EB;
  border-top-color: #4F46E5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 26rpx; color: #94a3b8; }
.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 30rpx; color: #64748b; font-weight: 600; }
.empty-hint { font-size: 24rpx; color: #94a3b8; }

/* 列表 */
.poster-scroll {
  flex: 1;
  height: calc(100vh - 100rpx);
}
.poster-list {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

/* 海报卡片 */
.poster-card {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06);
}
.poster-image-wrap {
  position: relative;
  width: 100%;
}
.poster-image {
  width: 100%;
  display: block;
}
.poster-type-badge {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  font-size: 22rpx;
  padding: 6rpx 18rpx;
  border-radius: 20rpx;
  font-weight: 600;
  backdrop-filter: blur(10rpx);
}
.type-promotion { background: rgba(79,70,229,0.85); color: #fff; }
.type-product { background: rgba(16,185,129,0.85); color: #fff; }
.type-activity { background: rgba(245,158,11,0.85); color: #fff; }
.type-brand { background: rgba(236,72,153,0.85); color: #fff; }

.poster-preview-tip {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.4));
  padding: 40rpx 20rpx 16rpx;
  text-align: center;
}
.poster-preview-tip text {
  font-size: 22rpx;
  color: rgba(255,255,255,0.8);
}

/* 信息区 */
.poster-info {
  padding: 24rpx;
}
.poster-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1e293b;
  display: block;
  margin-bottom: 8rpx;
}
.poster-desc {
  font-size: 24rpx;
  color: #94a3b8;
  display: block;
  margin-bottom: 20rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 操作按钮 */
.poster-actions {
  display: flex;
  gap: 16rpx;
}
.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  height: 72rpx;
  border-radius: 16rpx;
  font-size: 26rpx;
  font-weight: 600;
  border: none;
  margin: 0;
  padding: 0;
  line-height: 1;
}
.action-btn::after { border: none; }
.btn-icon { font-size: 28rpx; }
.save-btn {
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: #fff;
}
.share-btn {
  background: #f0f0ff;
  color: #4F46E5;
}

/* 底部提示 */
.footer-tip {
  text-align: center;
  padding: 32rpx 0;
  font-size: 24rpx;
  color: #c4c4c4;
}
</style>
