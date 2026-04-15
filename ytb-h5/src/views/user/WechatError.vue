<template>
  <div class="wechat-error-container">
    <div class="error-content">
      <div class="error-wrapper">
        <van-icon name="close" size="60" color="#ee0a24" />
        <div class="error-title">微信登录失败</div>
        <div class="error-message">{{ errorMessage }}</div>
        
        <div class="button-group">
          <van-button 
            type="primary" 
            size="large" 
            @click="handleRetry"
            class="retry-button"
          >
            重新登录
          </van-button>
          
          <van-button 
            type="default" 
            size="large" 
            @click="handleGoHome"
            class="home-button"
          >
            返回首页
          </van-button>
        </div>
        
        <!-- 调试信息（仅开发环境显示） -->
        <div v-if="showDebugInfo" class="debug-info">
          <div class="debug-title">调试信息</div>
          <div class="debug-content">
            <div>错误类型: {{ debugInfo.type }}</div>
            <div>当前URL: {{ debugInfo.url }}</div>
            <div>时间: {{ debugInfo.timestamp }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Toast } from 'vant'

const route = useRoute()
const router = useRouter()

const errorMessage = ref('登录过程中发生未知错误，请稍后重试')
const debugInfo = ref({})

// 是否显示调试信息（开发环境）
const showDebugInfo = computed(() => {
  return import.meta.env.DEV || window.location.hostname === 'localhost'
})

// 处理重新登录
const handleRetry = () => {
  // 清除可能的错误状态
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  localStorage.removeItem('wechat_info')
  
  // 跳转到登录页
  router.replace('/login')
}

// 返回首页
const handleGoHome = () => {
  router.replace('/')
}

// 解析错误信息
const parseError = () => {
  try {
    const {
      success,
      error,
      type
    } = route.query

    // 设置调试信息
    debugInfo.value = {
      type: type || 'unknown',
      url: window.location.href,
      timestamp: new Date().toLocaleString(),
      success,
      error
    }

    // 解析错误消息
    if (error) {
      try {
        errorMessage.value = decodeURIComponent(error)
      } catch (e) {
        errorMessage.value = error
      }
    } else if (success === '0') {
      errorMessage.value = '微信授权失败，请重新尝试'
    }

    // 根据错误类型设置特定消息
    if (type === 'branch_wechat_login') {
      errorMessage.value = errorMessage.value || '分支机构微信登录失败'
    }

    console.log('微信登录错误信息:', {
      errorMessage: errorMessage.value,
      debugInfo: debugInfo.value
    })

  } catch (e) {
    console.error('解析错误信息失败:', e)
    errorMessage.value = '登录失败，请重新尝试'
  }
}

onMounted(() => {
  console.log('WechatError 组件已挂载')
  console.log('URL参数:', route.query)
  
  parseError()
  
  // 显示错误提示
  Toast({ type: 'fail', message: '微信登录失败' })
})
</script>

<style scoped>
.wechat-error-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f7f8fa;
  padding: 20px;
}

.error-content {
  width: 100%;
  max-width: 360px;
  padding: 40px 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.error-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.error-title {
  margin-top: 20px;
  font-size: 18px;
  font-weight: 600;
  color: #323233;
}

.error-message {
  margin-top: 12px;
  font-size: 14px;
  color: #646566;
  line-height: 1.5;
  word-break: break-all;
}

.button-group {
  margin-top: 32px;
  width: 100%;
}

.retry-button {
  width: 100%;
  margin-bottom: 12px;
}

.home-button {
  width: 100%;
}

.debug-info {
  margin-top: 24px;
  padding: 16px;
  background-color: #f7f8fa;
  border-radius: 8px;
  text-align: left;
}

.debug-title {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 8px;
}

.debug-content {
  font-size: 12px;
  color: #646566;
  line-height: 1.5;
  word-break: break-all;
}

.debug-content div {
  margin-bottom: 4px;
}
</style> 