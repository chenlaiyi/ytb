<template>
  <div class="vip-test-container">
    <div class="test-header">
      <h2>分支机构VIP中心测试</h2>
      <p>用于验证分支机构登录状态和VIP功能</p>
    </div>

    <!-- 登录状态检查 -->
    <div class="test-section">
      <h3>1. 登录状态检查</h3>
      <div class="status-item">
        <span class="label">用户ID:</span>
        <span class="value" :class="{ 'success': userId, 'error': !userId }">
          {{ userId || '未登录' }}
        </span>
      </div>
      <div class="status-item">
        <span class="label">分支机构代码:</span>
        <span class="value" :class="{ 'success': branchCode, 'error': !branchCode }">
          {{ branchCode || '未设置' }}
        </span>
      </div>
      <div class="status-item">
        <span class="label">是否分支机构用户:</span>
        <span class="value" :class="{ 'success': isBranch === '1', 'error': isBranch !== '1' }">
          {{ isBranch === '1' ? '是' : '否' }}
        </span>
      </div>
      <div class="status-item">
        <span class="label">用户信息:</span>
        <span class="value" :class="{ 'success': userInfo, 'error': !userInfo }">
          {{ userInfo ? '已获取' : '未获取' }}
        </span>
      </div>
    </div>

    <!-- 用户信息显示 -->
    <div class="test-section" v-if="userInfo">
      <h3>2. 用户信息</h3>
      <div class="user-info">
        <div class="avatar-section">
          <img :src="userInfo.wechat_avatar || userInfo.avatar || '/app/images/profile/default-avatar.png'" 
               alt="头像" class="user-avatar">
        </div>
        <div class="info-section">
          <p><strong>姓名:</strong> {{ userInfo.name || userInfo.wechat_nickname || '未设置' }}</p>
          <p><strong>微信昵称:</strong> {{ userInfo.wechat_nickname || '未设置' }}</p>
          <p><strong>手机号:</strong> {{ userInfo.phone || '未设置' }}</p>
          <p><strong>VIP状态:</strong> {{ userInfo.is_vip ? 'VIP会员' : '普通用户' }}</p>
        </div>
      </div>
    </div>

    <!-- API测试 -->
    <div class="test-section">
      <h3>3. API测试</h3>
      <div class="api-test">
        <button @click="testWorkspaceApi" :loading="apiLoading" class="test-btn">
          测试VIP工作台API
        </button>
        <button @click="testTimeInfoApi" :loading="apiLoading" class="test-btn">
          测试VIP时间信息API
        </button>
        <button @click="clearTestData" class="test-btn clear-btn">
          清除测试数据
        </button>
      </div>
      
      <!-- API响应结果 -->
      <div class="api-result" v-if="apiResult">
        <h4>API响应结果:</h4>
        <pre>{{ JSON.stringify(apiResult, null, 2) }}</pre>
      </div>
    </div>

    <!-- 快速登录测试 -->
    <div class="test-section">
      <h3>4. 快速登录测试</h3>
      <div class="quick-login">
        <div class="login-option">
          <h4>用户257 (华东/陈来意) - YXY01分支</h4>
          <button @click="quickLogin('257', 'YXY01', '华东', '陈来意')" class="login-btn">
            快速登录
          </button>
        </div>
        <div class="login-option">
          <h4>用户259 (陈来意) - YXY01分支</h4>
          <button @click="quickLogin('259', 'YXY01', '陈来意', '陈来意')" class="login-btn">
            快速登录
          </button>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="test-actions">
      <button @click="refreshStatus" class="action-btn">刷新状态</button>
      <button @click="goToVipCenter" class="action-btn primary" v-if="isLoggedIn">
        进入VIP中心
      </button>
      <button @click="goToBranchLogin" class="action-btn" v-if="!isLoggedIn">
        前往登录
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getBranchVipWorkspace, getBranchVipTimeInfo } from '@/api/branchVip'

const router = useRouter()

// 响应式数据
const userId = ref('')
const branchCode = ref('')
const isBranch = ref('')
const userInfo = ref(null)
const apiLoading = ref(false)
const apiResult = ref(null)

// 计算属性
const isLoggedIn = computed(() => {
  return userId.value && branchCode.value && isBranch.value === '1' && userInfo.value
})

// 刷新状态
const refreshStatus = () => {
  userId.value = localStorage.getItem('user_id') || ''
  branchCode.value = localStorage.getItem('branch_code') || ''
  isBranch.value = localStorage.getItem('isBranch') || ''
  
  try {
    const storedUserInfo = localStorage.getItem('branch_userInfo') || localStorage.getItem('userInfo')
    userInfo.value = storedUserInfo ? JSON.parse(storedUserInfo) : null
  } catch (e) {
    userInfo.value = null
  }
}

// 测试VIP工作台API
const testWorkspaceApi = async () => {
  if (!userId.value || !branchCode.value) {
    showToast('请先登录')
    return
  }
  
  apiLoading.value = true
  try {
    const res = await getBranchVipWorkspace({ month: 'current' })
    apiResult.value = res
    
    if (res.code === 0) {
      showToast('API调用成功')
    } else {
      showToast(`API调用失败: ${res.message}`)
    }
  } catch (error) {
    console.error('API调用失败:', error)
    apiResult.value = { error: error.message }
    showToast('API调用异常')
  } finally {
    apiLoading.value = false
  }
}

// 测试VIP时间信息API
const testTimeInfoApi = async () => {
  if (!userId.value || !branchCode.value) {
    showToast('请先登录')
    return
  }
  
  apiLoading.value = true
  try {
    const res = await getBranchVipTimeInfo()
    apiResult.value = res
    
    if (res.code === 0) {
      showToast('API调用成功')
    } else {
      showToast(`API调用失败: ${res.message}`)
    }
  } catch (error) {
    console.error('API调用失败:', error)
    apiResult.value = { error: error.message }
    showToast('API调用异常')
  } finally {
    apiLoading.value = false
  }
}

// 快速登录
const quickLogin = (uid, bcode, name, nickname) => {
  // 设置登录信息
  localStorage.setItem('user_id', uid)
  localStorage.setItem('branch_code', bcode)
  localStorage.setItem('isBranch', '1')
  localStorage.setItem('token', 'test_token_' + uid)
  localStorage.setItem('auth_token', 'test_token_' + uid)
  
  // 设置用户信息
  const testUserInfo = {
    id: uid,
    userId: uid,
    name: name,
    wechat_nickname: nickname,
    avatar: '',
    wechat_avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/PiajxSqBRaEJdfHRhyLqsaypLw5rXgLyZCXm7Wk2co9z9LTd1kvicF5beYYQf2T5Nd7e68WrPkhE9n6HqY4SwaDz3MBhhPCU3kZIRGweAJdJ0lMVFlPJnCGg/132',
    phone: '',
    is_vip: 1,
    is_salesman: 1
  }
  
  localStorage.setItem('branch_userInfo', JSON.stringify(testUserInfo))
  localStorage.setItem('userInfo', JSON.stringify(testUserInfo))
  
  showToast('快速登录成功')
  refreshStatus()
}

// 清除测试数据
const clearTestData = () => {
  apiResult.value = null
  showToast('测试数据已清除')
}

// 前往VIP中心
const goToVipCenter = () => {
  router.push('/branch/vip/index')
}

// 前往分支机构登录
const goToBranchLogin = () => {
  const targetBranchCode = branchCode.value || 'YXY01'
  router.push(`/branch-login?branch_code=${targetBranchCode}`)
}

// 初始化
onMounted(() => {
  refreshStatus()
})
</script>

<style scoped>
.vip-test-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
}

.test-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.test-header h2 {
  color: #333;
  margin-bottom: 10px;
}

.test-header p {
  color: #666;
  margin: 0;
}

.test-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.test-section h3 {
  color: #333;
  margin-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.status-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: bold;
  color: #333;
}

.value {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.value.success {
  background: #e8f5e8;
  color: #52c41a;
}

.value.error {
  background: #ffe7e7;
  color: #ff4d4f;
}

.user-info {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f0f0f0;
}

.info-section {
  flex: 1;
}

.info-section p {
  margin: 8px 0;
  color: #333;
}

.api-test {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.test-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #1890ff;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.test-btn:hover {
  background: #40a9ff;
}

.test-btn.clear-btn {
  background: #ff4d4f;
}

.test-btn.clear-btn:hover {
  background: #ff7875;
}

.api-result {
  background: #f8f8f8;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 15px;
  margin-top: 15px;
}

.api-result h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.api-result pre {
  background: #fff;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
}

.quick-login {
  display: grid;
  gap: 15px;
}

.login-option {
  padding: 15px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background: #fafafa;
}

.login-option h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 14px;
}

.login-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #52c41a;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.login-btn:hover {
  background: #73d13d;
}

.test-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

.action-btn {
  padding: 12px 24px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: white;
  color: #333;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.action-btn:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.action-btn.primary {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.action-btn.primary:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}
</style> 