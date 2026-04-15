<template>
  <div class="debug-page">
    <van-nav-bar title="VIP升级调试" left-arrow @click-left="$router.back()" />
    
    <div class="debug-content">
      <van-cell-group title="用户状态">
        <van-cell title="登录状态" :value="userStore.isLoggedIn ? '已登录' : '未登录'" />
        <van-cell title="用户ID" :value="userStore.user?.id || '无'" />
        <van-cell title="微信OpenID" :value="userStore.user?.wechat_openid || '无'" />
        <van-cell title="VIP状态" :value="userStore.user?.is_vip ? '是' : '否'" />
        <van-cell title="VIP付费状态" :value="userStore.user?.is_vip_paid ? '是' : '否'" />
      </van-cell-group>
      
      <van-cell-group title="处理状态">
        <van-cell title="升级处理中" :value="isProcessing ? '是' : '否'" />
        <van-cell title="全局标志" :value="window._isProcessingVipUpgrade ? '是' : '否'" />
      </van-cell-group>
      
      <van-cell-group title="环境检测">
        <van-cell title="微信环境" :value="isWechat ? '是' : '否'" />
        <van-cell title="WeixinJSBridge" :value="hasWeixinJSBridge ? '可用' : '不可用'" />
      </van-cell-group>
      
      <div class="debug-actions">
        <van-button type="primary" block @click="clearProcessingFlag">
          清除处理标志
        </van-button>
        <van-button type="warning" block @click="testCreateOrder" :loading="testing">
          测试创建订单
        </van-button>
        <van-button type="success" block @click="goToRecruitLanding">
          前往招募页面
        </van-button>
      </div>
      
      <van-cell-group title="调试日志" v-if="logs.length > 0">
        <div class="logs">
          <div v-for="(log, index) in logs" :key="index" class="log-item">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </van-cell-group>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from 'vant'
import { useUserStore } from '@/stores/user'
import { createVipOrder } from '@/api/vipRecruit'

const router = useRouter()
const userStore = useUserStore()

const isProcessing = ref(false)
const testing = ref(false)
const logs = ref([])

const isWechat = computed(() => {
  return /micromessenger/i.test(navigator.userAgent)
})

const hasWeixinJSBridge = computed(() => {
  return typeof WeixinJSBridge !== 'undefined'
})

const addLog = (message) => {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message
  })
  if (logs.value.length > 20) {
    logs.value = logs.value.slice(0, 20)
  }
}

const clearProcessingFlag = () => {
  window._isProcessingVipUpgrade = false
  addLog('已清除全局处理标志')
  Toast.success('处理标志已清除')
}

const testCreateOrder = async () => {
  if (!userStore.isLoggedIn) {
    Toast({ type: 'fail', message: '请先登录' })
    return
  }
  
  testing.value = true
  addLog('开始测试创建订单...')
  
  try {
    const orderData = {
      openid: userStore.user?.wechat_openid || `temp_${userStore.user?.id}_${Date.now()}`,
      referrer_id: 78
    }
    
    addLog(`订单数据: ${JSON.stringify(orderData)}`)
    
    const res = await createVipOrder(orderData)
    addLog(`API响应: ${JSON.stringify(res)}`)
    
    if (res.code === 0) {
      Toast.success('订单创建成功')
      addLog('✅ 订单创建成功')
    } else {
      Toast({ type: 'fail', message: res.message || '创建失败' })
      addLog(`❌ 订单创建失败: ${res.message}`)
    }
  } catch (error) {
    console.error('测试创建订单失败:', error)
    addLog(`❌ 网络错误: ${error.message}`)
    Toast({ type: 'fail', message: '网络错误' })
  } finally {
    testing.value = false
  }
}

const goToRecruitLanding = () => {
  router.push('/vip/recruit-landing/78')
}

onMounted(() => {
  addLog('调试页面已加载')
  addLog(`用户登录状态: ${userStore.isLoggedIn}`)
  addLog(`微信环境: ${isWechat.value}`)
  addLog(`WeixinJSBridge: ${hasWeixinJSBridge.value}`)
})
</script>

<style scoped>
.debug-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.debug-content {
  padding: 16px;
}

.debug-actions {
  margin: 16px 0;
}

.debug-actions .van-button {
  margin-bottom: 12px;
}

.logs {
  max-height: 300px;
  overflow-y: auto;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.log-item {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  line-height: 1.4;
}

.log-time {
  color: #666;
  margin-right: 8px;
}

.log-message {
  color: #333;
}
</style>
