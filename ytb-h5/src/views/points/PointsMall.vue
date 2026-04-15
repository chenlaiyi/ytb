<template>
  <div class="points-mall-page">
    <!-- 导航栏 -->
    <van-nav-bar
      title="水之净积分商城"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
    />

    <!-- 加载状态 -->
    <van-loading v-if="loading" type="spinner" color="#1989fa" class="loading-center">
      正在跳转到积分商城...
    </van-loading>

    <!-- 跳转提示 -->
    <div v-else class="redirect-content">
      <div class="redirect-card">
        <van-icon name="gift-o" color="#FF6B35" size="60" />
        <h2>水之净积分商城</h2>
        <p class="redirect-description">
          即将跳转到积分商城页面<br/>
          在这里您可以使用积分兑换各种生活必需品
        </p>
        
        <div class="redirect-actions">
          <van-button 
            type="primary" 
            size="large" 
            @click="redirectToMall"
            :loading="redirecting"
            block
          >
            {{ redirecting ? '正在跳转...' : '立即前往积分商城' }}
          </van-button>
          
          <van-button 
            type="default" 
            size="large" 
            @click="goBack"
            :disabled="redirecting"
            block
            style="margin-top: 15px;"
          >
            返回
          </van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()

// 数据状态
const loading = ref(true)
const redirecting = ref(false)

// 积分商城URL
const POINTS_MALL_URL = 'https://h.7dingdong.com/#/?store_id=4350607'

// 页面加载
onMounted(() => {
  // 模拟加载过程
  setTimeout(() => {
    loading.value = false
  }, 1000)
})

// 跳转到积分商城
const redirectToMall = () => {
  try {
    redirecting.value = true
    
    showToast({
      message: '正在跳转到积分商城...',
      type: 'loading',
      duration: 1500
    })
    
    // 延迟跳转，让用户看到加载提示
    setTimeout(() => {
      // 在新窗口打开积分商城
      window.open(POINTS_MALL_URL, '_blank')
      redirecting.value = false
      
      // 可选：跳转后自动返回
      setTimeout(() => {
        goBack()
      }, 2000)
    }, 1500)
    
  } catch (error) {
    console.error('跳转积分商城失败:', error)
    showToast({
      message: '跳转失败，请稍后重试',
      type: 'fail'
    })
    redirecting.value = false
  }
}

// 返回
const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.points-mall-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.loading-center {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
}

.redirect-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 100px);
  padding-top: 50px;
}

.redirect-card {
  background: white;
  border-radius: 16px;
  padding: 40px 30px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
}

.redirect-card h2 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 20px 0 15px;
}

.redirect-description {
  font-size: 16px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 30px;
}

.redirect-actions {
  margin-top: 20px;
}

.van-nav-bar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}
</style> 