<template>
  <div class="wechat-success-container">
    <div class="success-content">
      <div class="success-wrapper">
        <van-icon name="success" size="60" color="#07c160" />
        <div class="success-text">{{ loadingText }}</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressWidth + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Toast } from 'vant'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loadingText = ref('微信登录成功')
const progressWidth = ref(0)

let progressTimer = null

// 初始化进度条
const initProgressBar = () => {
  progressWidth.value = 0
  progressTimer = setInterval(() => {
    if (progressWidth.value < 90) {
      progressWidth.value += 3
    }
  }, 100)
}

// 完成进度条
const completeProgress = () => {
  progressWidth.value = 100
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

// 处理登录成功
const handleSuccess = async () => {
  initProgressBar()
  
  try {
    // 从URL参数中获取登录信息
    const {
      success,
      token,
      user_id,
      branch_id,
      branch_code,
      openid,
      needBindPhone
    } = route.query

    if (!success || success !== '1') {
      throw new Error('登录状态无效')
    }

    if (!token) {
      throw new Error('未获取到登录令牌')
    }

    loadingText.value = '正在保存登录信息...'

    // 保存登录信息到本地存储
    localStorage.setItem('token', token)
    localStorage.setItem('isLoggedIn', 'true')
    
    // 保存微信相关信息
    if (openid) {
      localStorage.setItem('wechat_info', JSON.stringify({
        openid: openid,
        branch_id: branch_id,
        branch_code: branch_code
      }))
    }

    // 检查是否需要绑定手机号
    if (needBindPhone === '1') {
      localStorage.setItem('needBindPhone', 'true')
    }

    loadingText.value = '登录成功，正在跳转...'
    completeProgress()

    // 显示成功提示
    Toast.success('微信登录成功！')

    // 延迟跳转，让用户看到成功状态
    setTimeout(() => {
      // 检查是否需要绑定手机号
      if (needBindPhone === '1') {
        router.replace('/bind-phone')
      } else {
        // 跳转到个人中心
        router.replace('/user')
      }
    }, 1500)

  } catch (error) {
    console.error('处理微信登录成功时出错:', error)
    
    loadingText.value = '处理登录信息失败'
    
    Toast({ type: 'fail', message: error.message || '登录处理失败' })
    
    // 3秒后跳转到登录页
    setTimeout(() => {
      router.replace('/login')
    }, 3000)
  }
}

onMounted(() => {
  console.log('WechatSuccess 组件已挂载')
  console.log('URL参数:', route.query)
  
  handleSuccess()
})

onBeforeUnmount(() => {
  if (progressTimer) {
    clearInterval(progressTimer)
  }
})
</script>

<style scoped>
.wechat-success-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f7f8fa;
}

.success-content {
  width: 85%;
  max-width: 360px;
  padding: 40px 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.success-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.success-text {
  margin-top: 24px;
  font-size: 16px;
  color: #323233;
  line-height: 1.5;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background-color: #f2f3f5;
  border-radius: 2px;
  margin-top: 24px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #07c160;
  border-radius: 2px;
  transition: width 0.3s ease;
}
</style> 