<template>
  <div class="debug-page">
    <van-nav-bar title="分红页面调试" left-arrow @click-left="$router.back()" />
    
    <div class="debug-content">
      <van-cell-group title="用户状态检查">
        <van-cell title="用户ID" :value="userId || '未设置'" />
        <van-cell title="用户姓名" :value="userName || '未设置'" />
        <van-cell title="登录状态" :value="isLoggedIn ? '已登录' : '未登录'" />
        <van-cell title="Token" :value="token ? `${token.substring(0, 20)}...` : '未设置'" />
      </van-cell-group>
      
      <van-cell-group title="分支机构信息">
        <van-cell title="分支机构代码" :value="branchCode || '未设置'" />
        <van-cell title="分支机构信息" :value="branchInfo || '未设置'" />
      </van-cell-group>
      
      <van-cell-group title="API测试">
        <van-cell title="API状态" :value="apiStatus" />
        <van-cell title="错误信息" :value="apiError || '无'" />
      </van-cell-group>
      
      <div class="debug-actions">
        <van-button type="primary" @click="testAPI" :loading="testing">测试API调用</van-button>
        <van-button type="warning" @click="clearStorage">清除本地数据</van-button>
        <van-button type="success" @click="setTestData">设置测试数据</van-button>
      </div>
      
      <div class="debug-logs">
        <h3>调试日志</h3>
        <div class="logs">
          <div v-for="(log, index) in logs" :key="index" class="log-item">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { showToast } from 'vant'
import request from '@/utils/request'

const userStore = useUserStore()
const testing = ref(false)
const apiStatus = ref('未测试')
const apiError = ref('')
const logs = ref([])

// 计算属性
const userId = computed(() => userStore.userId)
const userName = computed(() => userStore.userName)
const isLoggedIn = computed(() => userStore.isLoggedIn)
const token = computed(() => userStore.token)
const branchCode = computed(() => localStorage.getItem('branch_code'))
const branchInfo = computed(() => {
  const info = localStorage.getItem('branch_info')
  return info ? JSON.parse(info).name : null
})

// 添加日志
const addLog = (message) => {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message
  })
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50)
  }
}

// 测试API调用
const testAPI = async () => {
  testing.value = true
  apiStatus.value = '测试中...'
  apiError.value = ''
  
  try {
    addLog('开始测试API调用')
    addLog(`用户ID: ${userId.value}`)
    addLog(`分支机构代码: ${branchCode.value}`)
    
    const response = await request.get('/admin/api/branch-user/dividend_detail.php', {
      params: {
        user_id: userId.value,
        branch_code: branchCode.value,
        month: '2025-06'
      }
    })
    
    addLog(`API响应: ${JSON.stringify(response.data)}`)
    
    if (response.data.code === 0) {
      apiStatus.value = '成功'
      showToast('API调用成功')
    } else {
      apiStatus.value = '失败'
      apiError.value = response.data.message
      showToast(`API调用失败: ${response.data.message}`)
    }
    
  } catch (error) {
    addLog(`API错误: ${error.message}`)
    apiStatus.value = '错误'
    apiError.value = error.message
    showToast(`API调用错误: ${error.message}`)
  } finally {
    testing.value = false
  }
}

// 清除本地数据
const clearStorage = () => {
  localStorage.removeItem('branch_code')
  localStorage.removeItem('branch_info')
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  addLog('已清除本地存储数据')
  showToast('已清除本地数据')
}

// 设置测试数据
const setTestData = () => {
  localStorage.setItem('branch_code', 'YXY01')
  localStorage.setItem('branch_info', JSON.stringify({
    id: 2,
    name: '益辛友01',
    code: 'YXY01'
  }))
  
  // 设置测试用户信息
  const testUserInfo = {
    id: 257,
    userId: 257,
    name: '测试用户',
    wechat_nickname: '测试用户',
    is_vip: 1,
    is_salesman: 1
  }
  
  userStore.setUserInfo(testUserInfo)
  userStore.setToken('test_token_123456789')
  
  addLog('已设置测试数据')
  showToast('已设置测试数据')
}

onMounted(() => {
  addLog('调试页面已加载')
  addLog(`当前用户状态: ${isLoggedIn.value ? '已登录' : '未登录'}`)
  addLog(`用户ID: ${userId.value}`)
  addLog(`分支机构代码: ${branchCode.value}`)
})
</script>

<style scoped>
.debug-page {
  background: #f5f5f5;
  min-height: 100vh;
}

.debug-content {
  padding: 16px;
}

.debug-actions {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.debug-logs {
  margin-top: 20px;
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.debug-logs h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
}

.logs {
  max-height: 300px;
  overflow-y: auto;
  font-size: 12px;
}

.log-item {
  margin-bottom: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
}

.log-time {
  color: #999;
  margin-right: 10px;
}

.log-message {
  color: #333;
}
</style> 