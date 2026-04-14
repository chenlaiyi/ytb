<template>
  <div class="wechat-binding-container">
    <el-card class="binding-card">
      <template #header>
        <div class="card-header">
          <div class="header-icon">
            <el-icon class="wechat-icon"><ChatDotRound /></el-icon>
          </div>
          <h3>微信绑定管理</h3>
          <p>绑定微信后可以使用微信扫码登录，提升登录体验</p>
        </div>
      </template>

      <div class="binding-content">
        <!-- 已绑定状态 -->
        <div v-if="isWechatBound" class="bound-section">
          <div class="bound-card">
            <div class="bound-header">
              <div class="status-badge success">
                <el-icon><Check /></el-icon>
                已绑定
              </div>
            </div>
            
            <div class="bound-info">
              <div class="wechat-avatar">
                <img v-if="wechatInfo.avatar" :src="wechatInfo.avatar" alt="微信头像" />
                <el-icon v-else class="default-avatar"><User /></el-icon>
                <div class="avatar-badge">
                  <el-icon><ChatDotRound /></el-icon>
                </div>
              </div>
              
              <div class="wechat-details">
                <h4>{{ wechatInfo.nickname || '微信用户' }}</h4>
                <p class="bind-time">
                  <el-icon><Clock /></el-icon>
                  绑定时间：{{ formatDate(wechatInfo.bound_at) }}
                </p>
                
                <div class="feature-list">
                  <div class="feature-item">
                    <el-icon class="feature-icon"><Key /></el-icon>
                    <span>扫码快速登录</span>
                  </div>
                  <div class="feature-item">
                    <el-icon class="feature-icon"><Key /></el-icon>
                    <span>账号安全保护</span>
                  </div>
                </div>
                
                <div class="login-status">
                  <span class="status-label">微信登录：</span>
                  <el-switch
                    v-model="wechatLoginEnabled"
                    @change="handleToggleWechatLogin"
                    :loading="toggleLoading"
                    size="large"
                    active-color="#07c160"
                    inactive-color="#dcdfe6"
                  />
                  <span class="status-text">{{ wechatLoginEnabled ? '已启用' : '已禁用' }}</span>
                </div>
              </div>
            </div>
            
            <div class="bound-actions">
              <el-button
                type="danger"
                :loading="unbindLoading"
                @click="handleUnbind"
                size="large"
                round
              >
                <el-icon><Close /></el-icon>
                解除绑定
              </el-button>
            </div>
          </div>
        </div>

        <!-- 未绑定状态 -->
        <div v-else class="unbound-section">
          <div class="unbound-card">
            <div class="unbound-illustration">
              <div class="phone-mockup">
                <div class="phone-screen">
                  <div class="wechat-logo">
                    <el-icon><ChatDotRound /></el-icon>
                  </div>
                  <div class="scan-line"></div>
                </div>
              </div>
            </div>
            
            <div class="unbound-content">
              <h4>绑定微信账号</h4>
              <p>享受更便捷的登录体验</p>
              
              <div class="benefits-list">
                <div class="benefit-item">
                  <el-icon class="benefit-icon"><Lightning /></el-icon>
                  <span>扫码即可快速登录</span>
                </div>
                <div class="benefit-item">
                  <el-icon class="benefit-icon"><Shield /></el-icon>
                  <span>提升账号安全性</span>
                </div>
                <div class="benefit-item">
                  <el-icon class="benefit-icon"><Star /></el-icon>
                  <span>无需记忆复杂密码</span>
                </div>
              </div>
            </div>
            
            <!-- 直接在页面中显示绑定区域 -->
            <div v-if="showBindingArea" class="binding-area">
              <div class="binding-header">
                <h4>扫码绑定微信</h4>
                <p>请使用微信扫描下方二维码完成绑定</p>
              </div>
              
              <div v-if="bindQrcode || bindJsConfig" class="qrcode-section">
                <div class="qrcode-container">
                  <!-- 微信官方JS SDK二维码容器 -->
                  <div v-if="bindJsConfig" id="wechat-bind-container" class="wechat-sdk-container"></div>
                  <!-- Fallback: 直接跳转链接 -->
                  <div v-else-if="bindQrcode" class="fallback-container">
                    <div class="fallback-qrcode">
                      <el-icon class="fallback-icon"><ChatDotRound /></el-icon>
                      <p>点击下方按钮完成绑定</p>
                      <el-button type="primary" @click="openWechatAuth" size="large">
                        <el-icon><ChatDotRound /></el-icon>
                        打开微信授权
                      </el-button>
                    </div>
                  </div>
                </div>
                
                <div class="qrcode-tips">
                  <div class="tip-item">
                    <span class="step-number">1</span>
                    <span>打开微信扫一扫</span>
                  </div>
                  <div class="tip-item">
                    <span class="step-number">2</span>
                    <span>扫描上方二维码</span>
                  </div>
                  <div class="tip-item">
                    <span class="step-number">3</span>
                    <span>确认授权绑定</span>
                  </div>
                </div>
                
                <div class="qrcode-status">
                  <el-icon class="status-icon loading"><Loading /></el-icon>
                  <span>等待扫码中...</span>
                </div>
              </div>
              
              <div v-else class="qrcode-loading">
                <div class="loading-animation">
                  <el-icon class="loading-icon"><Loading /></el-icon>
                </div>
                <p>正在生成二维码...</p>
              </div>
              
              <div class="binding-actions">
                <el-button @click="cancelBinding" size="large" round>
                  取消绑定
                </el-button>
                <el-button type="primary" @click="handleBind" :loading="bindLoading" size="large" round>
                  刷新二维码
                </el-button>
              </div>
            </div>
            
            <div v-else class="unbound-actions">
              <el-button
                type="primary"
                :loading="bindLoading"
                @click="handleBind"
                size="large"
                round
                class="bind-button"
              >
                <el-icon><Plus /></el-icon>
                立即绑定微信
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  User, ChatDotRound, Loading, Check, Close, Clock, Key, 
  Lightning, Star, Plus 
} from '@element-plus/icons-vue'
import { getWechatBindUrl, checkWechatBindStatus, unbindWechat, toggleWechatLogin } from '@/api/v1/auth'
import { getUserInfo } from '@/api/v1/auth'
import { getAdminToken } from '@/utils/admin-token-bridge'

// 响应式数据
const isWechatBound = ref(false)
const wechatInfo = reactive({
  nickname: '',
  avatar: '',
  bound_at: null
})
const wechatLoginEnabled = ref(false)
const bindQrcode = ref('')
const bindJsConfig = ref(null)
const bindSceneStr = ref('')
const bindLoading = ref(false)
const unbindLoading = ref(false)
const toggleLoading = ref(false)
const showBindingArea = ref(false)

// 检查绑定状态的定时器
let bindCheckTimer = null

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const response = await getUserInfo()
    const user = response.data
    
    if (user.wechat_openid) {
      isWechatBound.value = true
      wechatInfo.nickname = user.wechat_nickname || '微信用户'
      wechatInfo.avatar = user.wechat_avatar || ''
      wechatInfo.bound_at = user.wechat_bound_at
      wechatLoginEnabled.value = user.wechat_login_enabled || false
    } else {
      isWechatBound.value = false
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
  }
}

// 处理绑定微信
const handleBind = async () => {
  try {
    bindLoading.value = true
    
    // 添加调试信息
    const token = getAdminToken()
    console.log('当前token:', token ? '存在' : '不存在')
    console.log('开始调用微信绑定API...')
    
    const response = await getWechatBindUrl()
    
    console.log('绑定API响应:', response)
    
    if (response.data.use_js_sdk && response.data.js_config) {
      // 使用微信官方JS SDK
      console.log('使用微信JS SDK模式')
      bindJsConfig.value = response.data.js_config
      bindSceneStr.value = response.data.state
      showBindingArea.value = true
      
      // 等待弹窗显示后加载微信SDK
      setTimeout(() => {
        loadWechatBindSDK()
      }, 100)
      
      // 开始检查绑定状态
      startBindCheck()
    } else if (response.data.qrcode_url) {
      // Fallback: 使用直接跳转链接
      bindQrcode.value = response.data.qrcode_url
      bindSceneStr.value = response.data.state
      showBindingArea.value = true
      
      // 开始检查绑定状态
      startBindCheck()
    } else if (response.data.auth_url) {
      // 如果返回的是授权链接，则打开新窗口
      const popup = window.open(response.data.auth_url, 'wechat_bind', 'width=600,height=600,scrollbars=yes,resizable=yes')
      
      // 监听弹窗关闭
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          // 弹窗关闭后重新获取用户信息
          setTimeout(() => {
            fetchUserInfo()
          }, 1000)
        }
      }, 1000)
    }
  } catch (error) {
    console.error('获取绑定二维码失败:', error)
    ElMessage.error('获取绑定二维码失败')
  } finally {
    bindLoading.value = false
  }
}

// 加载微信绑定SDK
const loadWechatBindSDK = async () => {
  try {
    console.log('开始加载微信绑定SDK')
    // 动态加载微信JS SDK
    if (!window.WxLogin) {
      console.log('微信SDK未加载，开始加载...')
      await loadWechatSDK()
    }
    
    if (window.WxLogin && bindJsConfig.value) {
      // 清空容器
      const container = document.getElementById('wechat-bind-container')
      console.log('找到容器:', container)
      if (container) {
        container.innerHTML = ''
        
        console.log('创建微信登录对象，配置:', bindJsConfig.value)
        // 创建微信登录对象
        new window.WxLogin({
          self_redirect: false,
          id: 'wechat-bind-container',
          appid: bindJsConfig.value.appid,
          scope: bindJsConfig.value.scope,
          redirect_uri: bindJsConfig.value.redirect_uri,
          state: bindJsConfig.value.state,
          style: bindJsConfig.value.style || 'black',
          href: bindJsConfig.value.href || ''
        })
        
        console.log('微信绑定SDK加载成功')
      } else {
        console.error('未找到微信绑定容器')
      }
    } else {
      console.error('微信SDK或配置不可用', { WxLogin: !!window.WxLogin, bindJsConfig: bindJsConfig.value })
    }
  } catch (error) {
    console.error('加载微信绑定SDK失败:', error)
    ElMessage.error('加载微信二维码失败，请刷新重试')
  }
}

// 动态加载微信SDK
const loadWechatSDK = () => {
  return new Promise((resolve, reject) => {
    if (window.WxLogin) {
      resolve()
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js'
    script.onload = () => {
      console.log('微信SDK加载成功')
      resolve()
    }
    script.onerror = () => {
      console.error('微信SDK加载失败')
      reject(new Error('微信SDK加载失败'))
    }
    document.head.appendChild(script)
  })
}

// 打开微信授权页面
const openWechatAuth = () => {
  if (bindQrcode.value) {
    window.open(bindQrcode.value, '_blank')
  }
}

// 开始检查绑定状态
const startBindCheck = () => {
  bindCheckTimer = setInterval(async () => {
    try {
      if (!bindSceneStr.value) {
        return
      }
      
      const response = await checkWechatBindStatus(bindSceneStr.value)
      
      if (response.data.status === 'success') {
        // 绑定成功
        clearInterval(bindCheckTimer)
        showBindingArea.value = false
        await fetchUserInfo() // 重新获取用户信息
        ElMessage.success('微信绑定成功！')
      } else if (response.data.status === 'expired') {
        // 二维码已过期
        clearInterval(bindCheckTimer)
        showBindingArea.value = false
        ElMessage.warning('二维码已过期，请重新获取')
      }
    } catch (error) {
      console.error('检查绑定状态失败:', error)
    }
  }, 2000) // 每2秒检查一次
}

// 停止检查绑定状态
const stopBindCheck = () => {
  if (bindCheckTimer) {
    clearInterval(bindCheckTimer)
    bindCheckTimer = null
  }
}

// 取消绑定
const cancelBinding = () => {
  showBindingArea.value = false
  bindQrcode.value = ''
  bindJsConfig.value = null
  bindSceneStr.value = ''
  stopBindCheck()
}

// 处理解除绑定
const handleUnbind = async () => {
  try {
    await ElMessageBox.confirm(
      '解除绑定后将无法使用微信登录，确定要解除绑定吗？',
      '确认解除绑定',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    unbindLoading.value = true
    await unbindWechat()
    
    // 重新获取用户信息
    await fetchUserInfo()
    
    ElMessage.success('微信解绑成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('解除绑定失败:', error)
      ElMessage.error('解除绑定失败')
    }
  } finally {
    unbindLoading.value = false
  }
}

// 处理切换微信登录状态
const handleToggleWechatLogin = async (enabled) => {
  try {
    toggleLoading.value = true
    await toggleWechatLogin(enabled)
    
    ElMessage.success(enabled ? '已启用微信登录' : '已禁用微信登录')
  } catch (error) {
    console.error('切换微信登录状态失败:', error)
    ElMessage.error('操作失败')
    // 恢复原状态
    wechatLoginEnabled.value = !enabled
  } finally {
    toggleLoading.value = false
  }
}

// 组件挂载时获取用户信息
onMounted(() => {
  fetchUserInfo()
})

// 组件卸载时清理定时器
onUnmounted(() => {
  stopBindCheck()
})
</script>

<style scoped>
.wechat-binding-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.binding-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.card-header {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #07c160 0%, #00d4aa 100%);
  color: white;
  position: relative;
}

.header-icon {
  margin-bottom: 12px;
}

.wechat-icon {
  font-size: 48px;
  opacity: 0.9;
}

.card-header h3 {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
}

.card-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.binding-content {
  padding: 32px;
}

/* 已绑定状态 */
.bound-card {
  background: linear-gradient(135deg, #f8fffe 0%, #f0fff4 100%);
  border-radius: 16px;
  padding: 32px;
  border: 2px solid #b7eb8f;
  position: relative;
}

.bound-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.status-badge.success {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.bound-info {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 32px;
}

.wechat-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 4px solid white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.wechat-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar {
  font-size: 32px;
  color: #c0c4cc;
}

.avatar-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 28px;
  height: 28px;
  background: #07c160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  border: 3px solid white;
}

.wechat-details {
  flex: 1;
}

.wechat-details h4 {
  margin: 0 0 12px;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.bind-time {
  margin: 0 0 20px;
  color: #909399;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.feature-list {
  margin-bottom: 24px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

.feature-icon {
  color: #52c41a;
  font-size: 16px;
}

.login-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
}

.status-label {
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.status-text {
  font-size: 14px;
  color: #909399;
}

.bound-actions {
  text-align: center;
}

/* 未绑定状态 */
.unbound-card {
  text-align: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
  border-radius: 16px;
  border: 2px dashed #d9d9d9;
}

.unbound-illustration {
  margin-bottom: 32px;
}

.phone-mockup {
  width: 120px;
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  margin: 0 auto;
  padding: 16px;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.phone-screen {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.wechat-logo {
  font-size: 32px;
  color: #07c160;
  margin-bottom: 16px;
}

.scan-line {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, #07c160 50%, transparent 100%);
  animation: scan 2s ease-in-out infinite;
}

@keyframes scan {
  0%, 100% { transform: translateY(-20px); opacity: 0; }
  50% { transform: translateY(0); opacity: 1; }
}

.unbound-content h4 {
  margin: 0 0 12px;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.unbound-content p {
  margin: 0 0 32px;
  color: #909399;
  font-size: 16px;
}

.benefits-list {
  margin-bottom: 32px;
}

.benefit-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #606266;
  font-size: 15px;
}

.benefit-icon {
  color: #1890ff;
  font-size: 18px;
}

.bind-button {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  border: none;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.3);
  transition: all 0.3s ease;
}

.bind-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4);
}

/* 绑定区域样式 */
.binding-area {
  margin-top: 32px;
  padding: 32px;
  background: linear-gradient(135deg, #f8fffe 0%, #f0fff4 100%);
  border-radius: 16px;
  border: 2px solid #b7eb8f;
}

.binding-header {
  text-align: center;
  margin-bottom: 32px;
}

.binding-header h4 {
  margin: 0 0 8px;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.binding-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.qrcode-section {
  text-align: center;
  margin-bottom: 24px;
}

.qrcode-container {
  display: inline-block;
  margin-bottom: 24px;
}

/* 微信SDK容器样式 */
.wechat-sdk-container {
  width: 240px;
  height: 240px;
  border-radius: 16px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Fallback容器样式 */
.fallback-container {
  width: 240px;
  height: 240px;
  border-radius: 16px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fallback-qrcode {
  text-align: center;
  padding: 20px;
}

.fallback-icon {
  font-size: 48px;
  color: #07c160;
  margin-bottom: 16px;
}

.fallback-qrcode p {
  margin: 0 0 16px;
  color: #606266;
  font-size: 14px;
}

.qrcode-tips {
  margin-bottom: 24px;
}

.tip-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

.step-number {
  width: 24px;
  height: 24px;
  background: #1890ff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.qrcode-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #1890ff;
  font-size: 14px;
}

.status-icon.loading {
  animation: rotate 2s linear infinite;
}

.qrcode-loading {
  padding: 60px 20px;
  color: #909399;
  text-align: center;
}

.loading-animation {
  margin-bottom: 20px;
}

.loading-icon {
  font-size: 48px;
  animation: rotate 2s linear infinite;
}

.binding-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .wechat-binding-container {
    padding: 10px;
  }
  
  .binding-content {
    padding: 20px;
  }
  
  .bound-info {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .login-status {
    flex-direction: column;
    gap: 8px;
  }
  
  .bind-qrcode {
    width: 200px;
    height: 200px;
  }
  
  .bind-dialog-content {
    padding: 20px;
  }
}
</style>
