<template>
  <div class="auth-callback-container">
    <el-card class="callback-card">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><Check /></el-icon>
          <span>微信公众号授权回调</span>
        </div>
      </template>

      <div class="callback-content">
        <div v-if="processing" class="processing-state">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <h3>正在处理授权信息...</h3>
          <p>请稍候，系统正在获取公众号详细信息</p>
        </div>

        <div v-else-if="success" class="success-state">
          <el-icon class="success-icon"><CircleCheck /></el-icon>
          <h3>授权成功！</h3>
          <div v-if="accountInfo" class="account-info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="公众号名称">{{ accountInfo.nick_name }}</el-descriptions-item>
              <el-descriptions-item label="AppID">{{ accountInfo.authorizer_appid }}</el-descriptions-item>
              <el-descriptions-item label="头像" :span="2">
                <img v-if="accountInfo.head_img" :src="accountInfo.head_img" alt="公众号头像" style="width: 64px; height: 64px; border-radius: 50%;" />
              </el-descriptions-item>
              <el-descriptions-item label="服务类型">{{ getServiceTypeText(accountInfo.service_type_info) }}</el-descriptions-item>
              <el-descriptions-item label="认证类型">{{ getVerifyTypeText(accountInfo.verify_type_info) }}</el-descriptions-item>
            </el-descriptions>
          </div>
          <div class="action-buttons">
            <el-button type="primary" @click="goToAccountList">
              <el-icon><List /></el-icon>
              查看公众号列表
            </el-button>
            <el-button @click="addAnotherAccount">
              <el-icon><Plus /></el-icon>
              继续添加公众号
            </el-button>
          </div>
        </div>

        <div v-else-if="error" class="error-state">
          <el-icon class="error-icon"><CircleClose /></el-icon>
          <h3>授权失败</h3>
          <p class="error-message">{{ errorMessage }}</p>
          <div class="action-buttons">
            <el-button type="primary" @click="retryAuth">
              <el-icon><Refresh /></el-icon>
              重新授权
            </el-button>
            <el-button @click="goToAccountList">
              <el-icon><Back /></el-icon>
              返回列表
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Check,
  Loading,
  CircleCheck,
  CircleClose,
  List,
  Plus,
  Refresh,
  Back
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const processing = ref(true)
const success = ref(false)
const error = ref(false)
const errorMessage = ref('')
const accountInfo = ref(null)

// 处理授权回调
const handleAuthCallback = async () => {
  try {
    const authCode = route.query.auth_code
    
    if (!authCode) {
      throw new Error('未获取到授权码，请重新授权')
    }

    // 模拟处理授权信息（实际应该调用后端API）
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 模拟获取到的公众号信息
    accountInfo.value = {
      authorizer_appid: 'wx' + Math.random().toString(36).substr(2, 16),
      nick_name: '测试公众号',
      head_img: 'https://via.placeholder.com/64x64/409EFF/FFFFFF?text=微信',
      service_type_info: { id: 2 },
      verify_type_info: { id: 0 }
    }
    
    processing.value = false
    success.value = true
    
    ElMessage.success('公众号授权成功！')
    
  } catch (err) {
    processing.value = false
    error.value = true
    errorMessage.value = err.message || '授权处理失败'
    ElMessage.error(errorMessage.value)
  }
}

// 获取服务类型文本
const getServiceTypeText = (serviceType) => {
  const types = {
    0: '订阅号',
    1: '由历史老帐号升级后的订阅号',
    2: '服务号'
  }
  return types[serviceType?.id] || '未知'
}

// 获取认证类型文本
const getVerifyTypeText = (verifyType) => {
  const types = {
    '-1': '未认证',
    0: '微信认证',
    1: '新浪微博认证',
    2: '腾讯微博认证',
    3: '已资质认证通过但还未通过名称认证',
    4: '已资质认证通过、还未通过名称认证，但通过了新浪微博认证',
    5: '已资质认证通过、还未通过名称认证，但通过了腾讯微博认证'
  }
  return types[verifyType?.id] || '未知'
}

// 跳转到公众号列表
const goToAccountList = () => {
  router.push('/system/wechat-accounts')
}

// 继续添加公众号
const addAnotherAccount = () => {
  router.push('/system/wechat-accounts?action=add')
}

// 重新授权
const retryAuth = () => {
  router.push('/system/wechat-accounts?action=add')
}

onMounted(() => {
  handleAuthCallback()
})
</script>

<style scoped>
.auth-callback-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.callback-card {
  width: 100%;
  max-width: 600px;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #409EFF;
}

.header-icon {
  font-size: 24px;
}

.callback-content {
  text-align: center;
  padding: 40px 20px;
}

.processing-state,
.success-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-icon {
  font-size: 48px;
  color: #409EFF;
  animation: spin 1s linear infinite;
}

.success-icon {
  font-size: 48px;
  color: #67C23A;
}

.error-icon {
  font-size: 48px;
  color: #F56C6C;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

p {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.error-message {
  color: #F56C6C;
  font-weight: 500;
}

.account-info {
  width: 100%;
  margin: 20px 0;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-buttons .el-button {
  min-width: 140px;
}
</style> 