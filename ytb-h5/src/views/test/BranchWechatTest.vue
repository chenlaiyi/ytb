<template>
  <div class="branch-wechat-test">
    <van-nav-bar title="分支机构微信配置测试" left-arrow @click-left="$router.go(-1)" />
    
    <div class="test-container">
      <van-cell-group>
        <van-field
          v-model="branchCode"
          label="分支机构代码"
          placeholder="请输入分支机构代码"
          @blur="updateBranchCode"
        />
        
        <van-cell title="当前分支机构" :value="currentBranch || '未设置'" />
        <van-cell title="微信配置状态" :value="wechatStatus" />
      </van-cell-group>
      
      <div class="button-group">
        <van-button type="primary" block @click="testWechatConfig">
          测试微信配置
        </van-button>
        
        <van-button type="success" block @click="testWechatShare">
          测试微信分享
        </van-button>
        
        <van-button type="warning" block @click="clearBranchCode">
          清除分支机构代码
        </van-button>
      </div>
      
      <div class="log-container">
        <van-cell-group title="测试日志">
          <div class="log-content">
            <div v-for="(log, index) in logs" :key="index" class="log-item">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </van-cell-group>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'

export default {
  name: 'BranchWechatTest',
  setup() {
    const branchCode = ref('')
    const currentBranch = ref('')
    const wechatStatus = ref('未测试')
    const logs = ref([])
    
    const addLog = (message) => {
      const now = new Date()
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      logs.value.unshift({ time, message })
      if (logs.value.length > 20) {
        logs.value = logs.value.slice(0, 20)
      }
    }
    
    const updateBranchCode = async () => {
      try {
        const { setBranchCode, getCurrentBranchCode } = await import('@/utils/branch')
        if (branchCode.value) {
          setBranchCode(branchCode.value)
          addLog(`设置分支机构代码: ${branchCode.value}`)
        }
        currentBranch.value = getCurrentBranchCode()
        addLog(`当前分支机构: ${currentBranch.value || '无'}`)
      } catch (error) {
        addLog(`设置分支机构代码失败: ${error.message}`)
      }
    }
    
    const testWechatConfig = async () => {
      try {
        addLog('开始测试微信配置...')
        wechatStatus.value = '测试中...'
        
        const { initWechatSDK } = await import('@/utils/share')
        const { getCurrentBranchCode } = await import('@/utils/branch')
        
        const currentBranchCode = getCurrentBranchCode()
        addLog(`使用分支机构代码: ${currentBranchCode || '默认'}`)
        
        await initWechatSDK(currentBranchCode)
        
        wechatStatus.value = '配置成功'
        addLog('微信SDK初始化成功')
        showToast('微信配置测试成功')
        
      } catch (error) {
        wechatStatus.value = '配置失败'
        addLog(`微信配置测试失败: ${error.message}`)
        showToast('微信配置测试失败')
      }
    }
    
    const testWechatShare = async () => {
      try {
        addLog('开始测试微信分享...')
        
        const { setShareMetadata } = await import('@/utils/share')
        const { getCurrentBranchCode } = await import('@/utils/branch')
        
        const currentBranchCode = getCurrentBranchCode()
        
        setShareMetadata({
          title: '分支机构微信配置测试',
          subtitle: '测试分支机构微信分享功能',
          logo: 'https://pay.itapgo.com/app/images/logo.png',
          url: window.location.href,
          branchCode: currentBranchCode
        })
        
        addLog(`微信分享配置完成，分支机构: ${currentBranchCode || '默认'}`)
        showToast('微信分享配置完成')
        
      } catch (error) {
        addLog(`微信分享测试失败: ${error.message}`)
        showToast('微信分享测试失败')
      }
    }
    
    const clearBranchCode = async () => {
      try {
        const { clearBranchCode: clearCode, getCurrentBranchCode } = await import('@/utils/branch')
        clearCode()
        branchCode.value = ''
        currentBranch.value = getCurrentBranchCode()
        addLog('已清除分支机构代码')
        showToast('已清除分支机构代码')
      } catch (error) {
        addLog(`清除分支机构代码失败: ${error.message}`)
      }
    }
    
    onMounted(async () => {
      try {
        const { getCurrentBranchCode } = await import('@/utils/branch')
        currentBranch.value = getCurrentBranchCode()
        branchCode.value = currentBranch.value || ''
        addLog('页面初始化完成')
      } catch (error) {
        addLog(`页面初始化失败: ${error.message}`)
      }
    })
    
    return {
      branchCode,
      currentBranch,
      wechatStatus,
      logs,
      updateBranchCode,
      testWechatConfig,
      testWechatShare,
      clearBranchCode
    }
  }
}
</script>

<style scoped>
.branch-wechat-test {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.test-container {
  padding: 16px;
}

.button-group {
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-container {
  margin-top: 16px;
}

.log-content {
  max-height: 300px;
  overflow-y: auto;
  background: white;
  padding: 12px;
  border-radius: 8px;
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
  min-width: 60px;
}

.log-message {
  color: #333;
  flex: 1;
}
</style> 