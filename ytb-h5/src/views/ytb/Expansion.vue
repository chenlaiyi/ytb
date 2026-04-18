<template>
  <div class="ytb-expansion">
    <van-nav-bar title="拓展" />

    <van-tabs v-model:active="activeTab" color="#667eea" line-width="32">
      <van-tab v-for="category in categories" :key="category.value" :name="category.value" :title="category.label">
        <div class="poster-section">
          <div v-if="loading" class="loading-wrapper">
            <van-loading size="24" vertical>加载中...</van-loading>
          </div>
          <template v-else>
            <div v-if="posters[category.value].length" class="poster-list">
              <div
                v-for="poster in posters[category.value]"
                :key="poster.id"
                class="poster-card"
                @click="previewPoster(poster)"
              >
                <van-image
                  :src="poster.image_url"
                  fit="cover"
                  radius="12"
                  width="100%"
                  height="190"
                />
                <div class="poster-info">
                  <div class="poster-title">{{ poster.title }}</div>
                  <div class="poster-desc" v-if="poster.description">{{ poster.description }}</div>
                </div>
              </div>
            </div>
            <van-empty v-else description="暂无海报" />
          </template>
        </div>
      </van-tab>
    </van-tabs>

    <YtbTabBar />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ImagePreview, showToast } from 'vant'
import { getPosters, isLoggedIn } from '@/api/ytb'
import YtbTabBar from '@/components/ytb/TabBar.vue'
import { useYtbShare } from '@/composables/useYtbShare'

// 设置亿拓宝分享配置
useYtbShare('亿拓宝联盟 - 拓展')

const router = useRouter()

const categories = [
  { label: '拓展伙伴', value: 'partner' },
  { label: '发展客户', value: 'customer' }
]

const activeTab = ref('partner')
const loading = ref(false)
const posters = reactive({
  partner: [],
  customer: []
})

const loadPosters = async () => {
  loading.value = true
  try {
    const res = await getPosters()
    if (res.code === 0) {
      const list = res.data.items || []
      posters.partner = list.filter(item => item.type === 'partner')
      posters.customer = list.filter(item => item.type === 'customer')
    } else {
      showToast(res.message || '获取海报失败')
    }
  } catch (error) {
    console.error('获取海报失败:', error)
    showToast('获取海报失败')
  } finally {
    loading.value = false
  }
}

const previewPoster = (poster) => {
  if (!poster?.image_url) return
  ImagePreview({
    images: [poster.image_url],
    showIndex: false,
    closeable: true
  })
}

onMounted(async () => {
  if (!isLoggedIn()) {
    router.replace('/login')
    return
  }

  await loadPosters()
})
</script>

<style scoped>
.ytb-expansion {
  min-height: 100vh;
  background: #f5f6fb;
  padding-bottom: 60px;
}

.poster-section {
  padding: 16px;
}

.loading-wrapper {
  padding: 40px 0;
  display: flex;
  justify-content: center;
}

.poster-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.poster-card {
  background: #fff;
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 12px 30px rgba(102, 126, 234, 0.08);
}

.poster-info {
  padding: 10px 4px 4px;
}

.poster-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.poster-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}
</style>
