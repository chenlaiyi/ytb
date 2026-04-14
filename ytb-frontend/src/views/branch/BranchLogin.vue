<template>
  <div class="branch-login-container">
    <!-- 页面加载状态 -->
    <div v-if="pageLoading" class="page-loading-overlay">
      <div class="loading-content">
        <el-icon class="loading-icon" size="48">
          <Loading />
        </el-icon>
        <p class="loading-text">正在加载分支机构信息...</p>
      </div>
    </div>

    <!-- AI现代风格背景 -->
    <div class="background-layer">
      <div class="ai-background"></div>
      <div class="overlay"></div>
  
    </div>
    
    <!-- 左侧装饰内容 -->
    <div class="left-content" v-show="!pageLoading">
      <div class="brand-section">
        <div class="brand-logo">
          <div class="logo-icon">
            <img :src="branchInfo.display_logo || '/images/logo.png'" alt="分支机构Logo" class="system-logo-img" />
          </div>
          <h1 class="brand-title">{{ branchInfo.display_name || '盛辛友' }}</h1>
          <p class="brand-subtitle">
            <span class="typewriter-text">{{ displayText }}</span>
            <span class="typewriter-cursor">|</span>
          </p>
        </div>
      </div>
    </div>
    
    <!-- 右侧登录窗口 -->
    <div class="right-content" v-show="!pageLoading">
      <div class="login-box">
        <div class="login-header">
          <h2>{{ branchInfo.name ? branchInfo.name + ' - 管理后台登录' : '分支机构管理后台登录' }}</h2>
          <p v-if="branchInfo.code">机构代码: {{ branchInfo.code }}</p>
          <p v-if="branchError" class="error-message">{{ branchError }}</p>
          <p v-else>请选择登录方式</p>
        </div>
        
        <!-- 登录方式切换 -->
        <div class="login-tabs">
          <div 
            class="tab-item" 
            :class="{ active: loginType === 'password' }"
            @click="loginType = 'password'"
          >
            <el-icon><Lock /></el-icon>
            账号登录
          </div>
          <div 
            class="tab-item" 
            :class="{ active: loginType === 'wechat' }"
            @click="loginType = 'wechat'"
          >
            <el-icon><ChatDotRound /></el-icon>
            微信登录
          </div>
        </div>

        <!-- 账号密码登录 -->
        <div v-if="loginType === 'password'" class="login-form">
          <el-form 
            ref="loginFormRef" 
            :model="formData" 
            :rules="loginRules"
            @submit.prevent="handleLogin"
          >
            <el-form-item prop="username">
              <el-input
                v-model="formData.username"
                placeholder="请输入用户名"
                size="large"
                :prefix-icon="User"
                clearable
              />
            </el-form-item>
            
            <el-form-item prop="password">
              <el-input
                v-model="formData.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                :prefix-icon="Lock"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <div class="login-options">
              <el-checkbox v-model="formData.remember">记住登录状态</el-checkbox>
              <el-link type="primary" class="forgot-password">忘记密码？</el-link>
            </div>

            <el-button 
              type="primary" 
              size="large" 
              class="login-btn"
              :loading="loading"
              @click="handleLogin"
            >
              <el-icon v-if="!loading"><Check /></el-icon>
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
          </el-form>

          <div v-if="errorMessage" class="error-message">
            <el-icon><Warning /></el-icon>
            {{ errorMessage }}
          </div>
        </div>

        <!-- 微信登录 -->
        <div v-if="loginType === 'wechat'" class="wechat-login-simple">
          <div class="qrcode-simple-container">
            <!-- 加载状态 -->
            <div v-if="wechatLoading" class="qrcode-loading-overlay">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <p class="loading-text">正在准备微信登录...</p>
            </div>
            
            <!-- 微信登录按钮 -->
            <div v-else-if="!wechatLoginStarted" class="wechat-login-button-container">
              <el-button 
                type="primary" 
                size="large" 
                @click="startWechatLogin"
                class="wechat-login-btn"
                :loading="wechatLoading"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.295.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18 0 .659-.52 1.188-1.162 1.188-.642 0-1.162-.529-1.162-1.188 0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18 0 .659-.52 1.188-1.162 1.188-.642 0-1.162-.529-1.162-1.188 0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.045c.134 0 .24-.111.24-.248 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.406-.032zm-2.530 3.274c.535 0 .969.44.969.982 0 .542-.434.982-.969.982s-.969-.44-.969-.982c0-.542.434-.982.969-.982zm5.061 0c.535 0 .969.44.969.982 0 .542-.434.982-.969.982s-.969-.44-.969-.982c0-.542.434-.982.969-.982z"/>
                </svg>
                微信扫码登录
              </el-button>
              <p class="wechat-login-tip">点击按钮打开微信登录页面</p>
            </div>
            
            <!-- 等待扫码状态 -->
            <div v-else class="wechat-waiting-container">
              <div class="waiting-icon">
                <el-icon class="loading-icon"><Loading /></el-icon>
              </div>
              <h4>等待微信扫码登录</h4>
              <p>请在新打开的窗口中使用微信扫码登录</p>
              <div class="waiting-actions">
                <el-button @click="retryWechatLogin" size="small">重新登录</el-button>
                <el-button @click="switchLoginType('password')" size="small">密码登录</el-button>
            </div>
          </div>
          
            <!-- 错误状态 -->
            <div v-if="wechatConfig && wechatConfig.error" class="qrcode-error-overlay">
              <el-icon class="error-icon"><Warning /></el-icon>
              <p class="error-text">{{ wechatConfig.error_message || '微信登录暂时不可用' }}</p>
              <div class="error-actions">
                <el-button type="primary" size="small" @click="retryWechatLogin">重试</el-button>
                <el-button size="small" @click="switchLoginType('password')">密码登录</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部链接 -->
        <div class="login-footer">
          <el-link @click="goToMainLogin">返回总后台登录</el-link>
          <span class="divider">|</span>
          <el-link @click="showHelp">登录帮助</el-link>
        </div>
      </div>
    </div>

    <!-- 帮助对话框 -->
    <el-dialog v-model="helpVisible" title="登录帮助" width="500px">
      <div class="help-content">
        <h4>账号登录：</h4>
        <ul>
          <li>使用分支机构管理员账号登录</li>
          <li>如忘记密码，请联系总部管理员重置</li>
        </ul>
        
        <h4>微信登录：</h4>
        <ul>
          <li>需要先使用账号密码登录</li>
          <li>在个人信息中绑定微信账号</li>
          <li>绑定后即可使用微信扫码登录</li>
        </ul>
        
        <h4>联系方式：</h4>
        <p v-if="branchInfo.contact_phone">电话：{{ branchInfo.contact_phone }}</p>
        <p v-if="branchInfo.contact_email">邮箱：{{ branchInfo.contact_email }}</p>
        <p>技术支持：400-662-5818</p>
      </div>
      <template #footer>
        <el-button @click="helpVisible = false">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  User, 
  Lock, 
  Loading, 
  Clock, 
  Check, 
  Close, 
  Warning,
  ChatDotRound 
} from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getWechatLoginUrl, checkWechatLoginStatus } from '@/api/v1/auth'

const route = useRoute()
const router = useRouter()

// 打字机动画相关
const fullText = '极度真诚·极致服务'
const displayText = ref('')
let typewriterTimer = null
let isTyping = true
let charIndex = 0

// 打字机动画函数
const startTypewriter = () => {
  const typeSpeed = 150 // 打字速度
  const deleteSpeed = 100 // 删除速度
  const pauseTime = 2000 // 完成后暂停时间
  
  const animate = () => {
    if (isTyping) {
      // 正在打字
      if (charIndex < fullText.length) {
        displayText.value = fullText.substring(0, charIndex + 1)
        charIndex++
        typewriterTimer = setTimeout(animate, typeSpeed)
      } else {
        // 打字完成，暂停后开始删除
        isTyping = false
        typewriterTimer = setTimeout(animate, pauseTime)
      }
    } else {
      // 正在删除
      if (charIndex > 0) {
        charIndex--
        displayText.value = fullText.substring(0, charIndex)
        typewriterTimer = setTimeout(animate, deleteSpeed)
      } else {
        // 删除完成，暂停后开始打字
        isTyping = true
        typewriterTimer = setTimeout(animate, 500)
      }
    }
  }
  
  animate()
}

// 停止打字机动画
const stopTypewriter = () => {
  if (typewriterTimer) {
    clearTimeout(typewriterTimer)
    typewriterTimer = null
  }
}

// 响应式数据
const loginFormRef = ref(null)
const loading = ref(false)
const pageLoading = ref(true) // 添加页面加载状态
const errorMessage = ref('')
const loginType = ref('password') // 'password' | 'wechat'
const helpVisible = ref(false)
const branchError = ref('')

// 微信登录相关状态
const wechatLoading = ref(false)
const wechatConfigLoaded = ref(false)
const wechatConfig = ref(null)
const wechatLoginStarted = ref(false)
let wechatLoginTimer = null

// 系统logo
const systemLogo = ref('/images/logo.png')

// 分支机构信息
const branchInfo = reactive({
  id: null,
  name: '',
  code: '',
  logo: '',
  description: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  status: '',
  wechat_account: null,
  display_name: '',
  display_logo: ''
})

// 表单数据
const formData = reactive({
  username: '',
  password: '',
  remember: false,
  branch_code: ''
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

// 获取分支机构代码并加载信息
const initBranchInfo = async () => {
  pageLoading.value = true // 开始加载
  const branchCode = route.params.branchCode || route.query.branch_code
  
  if (!branchCode) {
    branchError.value = '缺少分支机构代码参数'
    pageLoading.value = false
    return
  }
  
  formData.branch_code = branchCode
  
  try {
    // 使用正确的API路径
                const response = await request.get(`/Tapp/admin/public/index.php/api/branch/info?code=${branchCode}`)
    
    console.log('分支机构信息响应:', response)
    
    if (response.code === 0 || response.code === '0') {
      const branch = response.data
      Object.assign(branchInfo, {
        id: branch.id,
        name: branch.name,
        code: branch.code,
        logo: branch.logo,
        description: branch.description,
        contact_name: branch.contact_name,
        contact_phone: branch.contact_phone,
        contact_email: branch.contact_email,
        wechat_account: branch.wechat_account,
        display_name: branch.display_name || branch.name,
        display_logo: branch.display_logo || '/images/logo.png'
      })
      
      branchError.value = ''
    } else {
      branchError.value = response.message || '获取分支机构信息失败'
    }
  } catch (error) {
    console.error('获取分支机构信息失败:', error)
    branchError.value = error.message || '获取分支机构信息失败，请检查网络连接'
  } finally {
    pageLoading.value = false // 加载完成
  }
}

// 登录方法
const handleLogin = async () => {
  if (!formData.username || !formData.password) {
    ElMessage.error('请输入用户名和密码')
    return
  }
  
  // 表单验证
  try {
    await loginFormRef.value.validate()
  } catch (error) {
    console.log('表单验证失败:', error)
    return
  }
  
  loading.value = true
  errorMessage.value = '' // 清除之前的错误信息
  
  try {
    console.log('开始登录:', {
      branch_code: formData.branch_code,
      username: formData.username
    })
    
            const response = await request.post('/Tapp/admin/public/index.php/api/branch/admin-login', {
      branch_code: formData.branch_code,
      username: formData.username,
      password: formData.password
    })
    
    console.log('登录响应:', response)
    
    if (response.code === 0 || response.code === '0') {
      // 保存登录信息
      localStorage.setItem('branch_admin_token', response.data.token)
      localStorage.setItem('branch_admin_info', JSON.stringify(response.data.admin))
      localStorage.setItem('branch_info', JSON.stringify(response.data.branch))
      
      // 只显示一次成功消息
      ElMessage({
        type: 'success',
        message: '登录成功',
        duration: 2000
      })
      
      // 延迟跳转，确保消息显示
      setTimeout(async () => {
        try {
          await router.push({
            name: 'BranchDashboard',
            params: { branchId: response.data.branch.id }
          })
        } catch (routerError) {
          console.error('路由跳转失败:', routerError)
          // 如果路由跳转失败，尝试直接跳转
          window.location.href = `/admin/#/branch/${response.data.branch.id}/dashboard`
        }
      }, 1000)
    } else {
      errorMessage.value = response.message || '登录失败'
      ElMessage.error(errorMessage.value)
    }
  } catch (error) {
    console.error('登录失败:', error)
    const errorMsg = error.response?.data?.message || error.message || '登录失败，请稍后重试'
    errorMessage.value = errorMsg
    ElMessage.error(errorMsg)
  } finally {
    loading.value = false
  }
}

// 切换登录方式
const switchLoginType = (type) => {
  loginType.value = type
  errorMessage.value = ''
  
  // 停止之前的微信登录状态检查
  stopWechatLoginStatusCheck()
  
  if (type === 'wechat') {
    // 重置微信登录状态
    wechatLoginStarted.value = false
    wechatConfig.value = null
    wechatLoading.value = false
  } else {
    // 切换到密码登录时，清理微信登录相关状态
    wechatConfigLoaded.value = false
    wechatConfig.value = null
    wechatLoading.value = false
    wechatLoginStarted.value = false
  }
}

// 开始微信登录 - 直接打开新窗口
const startWechatLogin = async () => {
  wechatLoading.value = true
  wechatConfig.value = null
  
  try {
    console.log('🔄 开始微信登录...')
    
    // 获取微信登录配置
    const response = await getWechatLoginUrl({
      branch_code: formData.branch_code
    })
    console.log('微信登录配置响应:', response)
    
    if (response.code === 0 || response.code === 200) {
      wechatConfig.value = response.data
      
      // 构建微信登录URL
      let wechatLoginUrl = null
      
      if (response.data.qrcode_url) {
        // 如果API直接返回了URL，使用它
        wechatLoginUrl = response.data.qrcode_url
      } else if (response.data.js_config) {
        // 根据JS配置构建微信登录URL
        const config = response.data.js_config
        const params = new URLSearchParams({
          appid: config.appid,
          redirect_uri: config.redirect_uri,
          response_type: 'code',
          scope: config.scope,
          state: config.state
        })
        wechatLoginUrl = `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`
    } else {
        throw new Error('微信登录配置不完整')
      }
      
      if (wechatLoginUrl) {
        console.log('✅ 打开微信登录页面:', wechatLoginUrl)
        window.open(wechatLoginUrl, '_blank')
        
        // 设置登录已开始状态
        wechatLoginStarted.value = true
        
        // 开始检查登录状态
        if (response.data.js_config && response.data.js_config.state) {
          startWechatLoginStatusCheck(response.data.js_config.state)
        }
      } else {
        throw new Error('无法构建微信登录URL')
      }
    } else {
      throw new Error(response.message || '获取微信登录配置失败')
    }
  } catch (error) {
    console.error('微信登录失败:', error)
    wechatConfig.value = {
      error: true,
      error_message: error.message
    }
    ElMessage.error('微信登录失败: ' + error.message)
  } finally {
    wechatLoading.value = false
  }
}

// 重试微信登录
const retryWechatLogin = async () => {
  console.log('用户重试微信登录')
  
  // 重置状态
  wechatLoginStarted.value = false
  wechatConfig.value = null
  stopWechatLoginStatusCheck()
  
  // 重新开始登录
  await startWechatLogin()
}



// 开始检查微信登录状态
const startWechatLoginStatusCheck = (state) => {
  if (!state) {
    console.warn('微信登录状态检查：缺少state参数')
    return
  }
  
  // 如果不是微信登录模式，不启动状态检查
  if (loginType.value !== 'wechat') {
    console.log('当前不是微信登录模式，跳过状态检查')
    return
  }
  
  // 停止之前的检查
  stopWechatLoginStatusCheck()
  
  console.log('🔄 开始检查微信登录状态，state:', state)
  
  let checkCount = 0
  const maxChecks = 15 // 最多检查15次（30秒）
  
  wechatLoginTimer = setInterval(async () => {
    checkCount++
    
    // 如果切换到其他登录方式，停止检查
    if (loginType.value !== 'wechat') {
      console.log('已切换到其他登录方式，停止微信登录状态检查')
      stopWechatLoginStatusCheck()
      return
    }
    
    // 达到最大检查次数，停止检查
    if (checkCount >= maxChecks) {
      console.log('微信登录状态检查达到最大次数，停止检查')
      stopWechatLoginStatusCheck()
      return
    }
    
    try {
      const response = await checkWechatLoginStatus(state)
      console.log(`微信登录状态检查响应 (${checkCount}/${maxChecks}):`, response)
      
      if (response && (response.code === 0 || response.code === 200)) {
        if (response.data.status === 'confirmed') {
          // 登录成功
          stopWechatLoginStatusCheck()
          ElMessage.success('微信登录成功！')
        
          // 保存token和用户信息
          localStorage.setItem('branch_admin_token', response.data.token)
          localStorage.setItem('branch_admin_info', JSON.stringify(response.data.user))
          // 使用已加载的分支机构信息
          localStorage.setItem('branch_info', JSON.stringify(branchInfo))
        
          // 跳转到分支机构管理后台
          await router.push({
            name: 'BranchDashboard',
            params: { branchId: branchInfo.id }
          })
          
        } else if (response.data.status === 'need_bind') {
          // 需要绑定账号
          stopWechatLoginStatusCheck()
          
          ElMessageBox.confirm(
            '检测到您的微信账号尚未绑定管理员账号，请先使用账号密码登录，然后在个人信息页面绑定微信。',
            '需要绑定微信账号',
            {
              confirmButtonText: '去登录',
              cancelButtonText: '取消',
              type: 'info'
            }
          ).then(() => {
            // 切换到密码登录
            switchLoginType('password')
            
            // 保存state参数，登录后跳转到个人信息页面
            sessionStorage.setItem('wechat_bind_state', state)
          }).catch(() => {
            // 用户取消，重新生成二维码
            retryWechatLogin()
          })
          
        } else if (response.data.status === 'expired') {
          // 二维码已过期
          stopWechatLoginStatusCheck()
          ElMessage.warning('二维码已过期，正在重新生成...')
          retryWechatLogin()
        }
      }
    } catch (error) {
      console.error('检查微信登录状态失败:', error)
      // 网络错误时不立即停止，继续尝试
    }
  }, 2000) // 每2秒检查一次
}

const stopWechatLoginStatusCheck = () => {
  if (wechatLoginTimer) {
    clearInterval(wechatLoginTimer)
    wechatLoginTimer = null
    console.log('🛑 微信登录状态检查已停止')
  }
}

// 返回总后台登录
const goToMainLogin = () => {
  router.push('/login')
}

// 显示帮助
const showHelp = () => {
  helpVisible.value = true
}

  

// 组件挂载时初始化
onMounted(() => {
  initBranchInfo()
  startTypewriter()
})

// 组件卸载时清理
onUnmounted(() => {
  stopWechatLoginStatusCheck()
  stopTypewriter()
})
</script>

<style scoped>
.branch-login-container {
  min-height: 100vh;
  display: flex;
  position: relative;
  overflow: hidden;
}

/* 页面加载状态样式 */
.page-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  color: #606266;
}

.loading-content .loading-icon {
  color: #409eff;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.loading-content .loading-text {
  font-size: 16px;
  margin: 0;
}

.background-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
}

.ai-background {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}



.left-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: white;
}

.brand-section {
  max-width: 400px;
  text-align: center;
}

.brand-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
}

.logo-icon {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.system-logo-img {
  width: 70px;
  height: 70px;
  object-fit: contain;
  border-radius: 50%;
}

.brand-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  color: white;
}

.brand-subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
  color: white;
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.typewriter-text {
  display: inline;
}

.typewriter-cursor {
  display: inline-block;
  margin-left: 2px;
  animation: blink 1s step-end infinite;
  font-weight: 300;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.branch-info-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 25px;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  text-align: left;
  margin-bottom: 30px;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.branch-info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 25px;
  gap: 12px;
}

.card-icon {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  opacity: 0.8;
  color: rgba(255, 255, 255, 0.8);
}

.info-label i {
  font-size: 14px;
}

.info-value {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
  padding-left: 20px;
}



.right-content {
  width: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
}

.login-box {
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  font-size: 24px;
  color: #303133;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.login-header p {
  color: #606266;
  margin: 5px 0;
  font-size: 14px;
}

.error-message {
  color: #f56c6c;
  font-size: 14px;
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 5px;
}

.login-tabs {
  display: flex;
  margin-bottom: 30px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #dcdfe6;
}

.tab-item {
  flex: 1;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  background: #f5f7fa;
  color: #606266;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 14px;
}

.tab-item.active {
  background: #409eff;
  color: white;
}

.tab-item:hover:not(.active) {
  background: #ecf5ff;
  color: #409eff;
}

.login-form {
  margin-bottom: 20px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 14px;
}

.forgot-password {
  font-size: 14px;
}

.login-btn {
  width: 100%;
  height: 45px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
}

/* 微信登录样式 */
.wechat-login-simple {
  padding: 20px;
}

.qrcode-simple-container {
  position: relative;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qrcode-loading-overlay, .qrcode-error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  z-index: 10;
}

.loading-icon, .error-icon {
  font-size: 32px;
  margin-bottom: 15px;
}

.loading-icon {
  color: #409eff;
  animation: spin 1s linear infinite;
}

.error-icon {
  color: #f56c6c;
}

.loading-text, .error-text {
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
}

.wechat-login-button-container {
  text-align: center;
  padding: 40px 20px;
}

.wechat-login-btn {
  background: #07c160;
  border-color: #07c160;
  font-size: 16px;
  padding: 15px 30px;
  border-radius: 25px;
  box-shadow: 0 4px 15px rgba(7, 193, 96, 0.3);
  transition: all 0.3s ease;
}

.wechat-login-btn:hover {
  background: #06ad56;
  border-color: #06ad56;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(7, 193, 96, 0.4);
}

.wechat-login-tip {
  margin-top: 15px;
  color: #666;
  font-size: 14px;
}

.wechat-waiting-container {
  text-align: center;
  padding: 40px 20px;
}

.waiting-icon {
  margin-bottom: 20px;
}

.wechat-waiting-container h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 18px;
}

.wechat-waiting-container p {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
}

.waiting-actions, .error-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.login-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  color: #909399;
  font-size: 14px;
}

.divider {
  margin: 0 10px;
}

.help-content h4 {
  color: #303133;
  margin: 15px 0 10px 0;
  font-size: 16px;
}

.help-content h4:first-child {
  margin-top: 0;
}

.help-content ul {
  margin: 0 0 15px 0;
  padding-left: 20px;
}

.help-content li {
  margin-bottom: 5px;
  color: #606266;
}

.help-content p {
  margin: 5px 0;
  color: #606266;
}
</style> 