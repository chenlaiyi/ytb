<template>
  <div class="wechat-test">
    <NavHeader title="微信JSSDK测试" />
    
    <div class="test-container">
      <van-cell-group title="环境检测">
        <van-cell title="是否微信环境" :value="isWeChatBrowser ? '是' : '否'" />
        <van-cell title="当前URL" :value="currentUrl" />
      </van-cell-group>
      
      <van-cell-group title="分享测试">
        <van-cell title="分享状态" :value="shareStatus" />
        <van-cell title="错误信息" :value="errorMessage" />
      </van-cell-group>
      
      <div class="button-group">
        <van-button type="primary" block @click="testShare">测试分享配置</van-button>
        <van-button type="success" block @click="testCustomShare">测试自定义分享</van-button>
        <van-button type="warning" block @click="clearLogs">清除日志</van-button>
      </div>
      
      <van-cell-group title="调试日志">
        <div class="log-container">
          <div v-for="(log, index) in logs" :key="index" class="log-item">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </van-cell-group>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { showToast, showSuccessToast, showFailToast } from 'vant'
import { setShareMetadata, isWechatBrowser } from '@/utils/share'
import NavHeader from '@/components/NavHeader.vue'

export default {
  name: 'WeChatTest',
  components: { NavHeader },
  setup() {
    const isWeChatBrowser = ref(false)
    const currentUrl = ref('')
    const shareStatus = ref('未测试')
    const errorMessage = ref('')
    const logs = ref([])
    
    // 添加日志
    const addLog = (message) => {
      logs.value.unshift({
        time: new Date().toLocaleTimeString(),
        message
      })
      console.log(`[WeChatTest] ${message}`)
    }
    
    // 检测微信环境
    const detectWeChatEnvironment = () => {
      isWeChatBrowser.value = isWechatBrowser()
      currentUrl.value = window.location.href
      
      if (isWeChatBrowser.value) {
        addLog('检测到微信环境')
      } else {
        addLog('非微信环境')
      }
      
      addLog(`当前URL: ${currentUrl.value}`)
    }
    
    // 测试默认分享
    const testShare = async () => {
      try {
        addLog('开始测试默认分享配置...')
        shareStatus.value = '配置中'
        errorMessage.value = ''
        
        await setShareMetadata({
          title: '微信JSSDK测试页面',
          subtitle: '这是一个测试页面，用于验证微信分享功能',
          logo: 'https://pay.itapgo.com/app/images/logo.png',
          url: window.location.href.split('#')[0]
        })
        
        shareStatus.value = '配置成功'
        addLog('默认分享配置成功')
        showSuccessToast('分享配置成功')
        
      } catch (error) {
        shareStatus.value = '配置失败'
        errorMessage.value = error.message
        addLog(`分享配置失败: ${error.message}`)
        showFailToast('分享配置失败')
      }
    }
    
    // 测试自定义分享
    const testCustomShare = async () => {
      try {
        addLog('开始测试自定义分享配置...')
        shareStatus.value = '配置中'
        errorMessage.value = ''
        
        await setShareMetadata({
          title: '点点够智能净水设备',
          subtitle: '健康饮水，从点点够开始！专业净水设备服务平台',
          logo: 'https://pay.itapgo.com/app/images/logo.png',
          url: 'https://pay.itapgo.com/app/'
        })
        
        shareStatus.value = '配置成功'
        addLog('自定义分享配置成功')
        showSuccessToast('自定义分享配置成功')
        
      } catch (error) {
        shareStatus.value = '配置失败'
        errorMessage.value = error.message
        addLog(`自定义分享配置失败: ${error.message}`)
        showFailToast('自定义分享配置失败')
      }
    }
    
    // 清除日志
    const clearLogs = () => {
      logs.value = []
      shareStatus.value = '未测试'
      errorMessage.value = ''
      addLog('日志已清除')
    }
    
    onMounted(() => {
      detectWeChatEnvironment()
      addLog('微信JSSDK测试页面已加载')
    })
    
    return {
      isWeChatBrowser,
      currentUrl,
      shareStatus,
      errorMessage,
      logs,
      testShare,
      testCustomShare,
      clearLogs
    }
  }
}
</script>

<style scoped>
.wechat-test {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.test-container {
  padding: 16px;
}

.button-group {
  margin: 16px 0;
}

.button-group .van-button {
  margin-bottom: 12px;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.log-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 12px;
  line-height: 1.4;
}

.log-time {
  color: #666;
  margin-right: 8px;
  min-width: 80px;
}

.log-message {
  color: #333;
  word-break: break-all;
}
</style> 