<template>
  <view class="page">
    <view v-if="loading" class="loading-box">
      <view class="spinner"></view>
    </view>

    <view v-else-if="posters.length === 0" class="empty-box">
      <text class="empty-icon">🖼️</text>
      <text class="empty-text">暂无推广海报</text>
    </view>

    <view v-else class="poster-list">
      <view class="poster-item" v-for="poster in posters" :key="poster.id" @tap="previewPoster(poster)">
        <image class="poster-image" :src="poster.image_url" mode="widthFix" />
        <view class="poster-footer">
          <text class="poster-title">{{ poster.title || '推广海报' }}</text>
          <view class="poster-actions">
            <button class="save-btn" @tap.stop="savePoster(poster)">保存到相册</button>
            <button class="share-btn" open-type="share" :data-poster="poster">分享</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow, onShareAppMessage } from '@dcloudio/uni-app'
import { getPosters } from '../../api/ytb'

const posters = ref([])
const loading = ref(false)

const fetchPosters = async () => {
  loading.value = true
  try {
    const res = await getPosters()
    if (res.code === 0) posters.value = res.data?.items || res.data?.list || []
  } catch (e) {}
  finally { loading.value = false }
}

const previewPoster = (poster) => {
  uni.previewImage({
    current: poster.image_url,
    urls: posters.value.map(p => p.image_url)
  })
}

const savePoster = (poster) => {
  uni.showLoading({ title: '保存中...' })
  uni.downloadFile({
    url: poster.image_url,
    success: (res) => {
      uni.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: () => { uni.hideLoading(); uni.showToast({ title: '已保存到相册', icon: 'success' }) },
        fail: (err) => {
          uni.hideLoading()
          if (err.errMsg.includes('auth deny')) {
            uni.showModal({ title: '提示', content: '需要相册权限才能保存', confirmText: '去设置', success: r => { if (r.confirm) uni.openSetting() } })
          } else {
            uni.showToast({ title: '保存失败', icon: 'none' })
          }
        }
      })
    },
    fail: () => { uni.hideLoading(); uni.showToast({ title: '下载失败', icon: 'none' }) }
  })
}

onShareAppMessage(() => ({
  title: '亿拓宝 - 净水器安装服务',
  path: '/pages/index/index'
}))

onShow(() => fetchPosters())
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f5f7; padding: 24rpx; padding-bottom: 60rpx; }

.loading-box, .empty-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120rpx 0; gap: 16rpx; }
.spinner { width: 48rpx; height: 48rpx; border: 4rpx solid #E5E7EB; border-top-color: #4F46E5; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon { font-size: 60rpx; }
.empty-text { font-size: 28rpx; color: #94a3b8; }

.poster-list { display: flex; flex-direction: column; gap: 24rpx; }
.poster-item { background: #fff; border-radius: 20rpx; overflow: hidden; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06); }
.poster-image { width: 100%; display: block; }
.poster-footer { padding: 20rpx 24rpx; }
.poster-title { font-size: 28rpx; font-weight: 600; color: #1e293b; display: block; margin-bottom: 16rpx; }
.poster-actions { display: flex; gap: 16rpx; }
.save-btn, .share-btn { flex: 1; height: 64rpx; line-height: 64rpx; border-radius: 12rpx; font-size: 26rpx; font-weight: 600; text-align: center; margin: 0; border: none; }
.save-btn::after, .share-btn::after { border: none; }
.save-btn { background: #4F46E5; color: #fff; }
.share-btn { background: #f0f0ff; color: #4F46E5; }
</style>
