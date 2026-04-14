<template>
  <div class="login-container">
    <!-- AI现代风格背景 -->
    <div class="background-layer">
      <div class="ai-background"></div>
      <div class="overlay"></div>
    </div>
    
    <!-- 左侧装饰内容 -->
    <div class="left-content">
      <div class="brand-section">
        <div class="brand-logo">
          <div class="logo-icon">
            <img :src="systemLogo" alt="点点够Logo" class="system-logo-img" />
          </div>
          <h1 class="brand-title">点点够管理系统</h1>
        </div>
        <p class="brand-subtitle">每天进步一点点，实现富而喜悦人生</p>
      </div>
    </div>
    
    <!-- 右侧登录窗口 -->
    <div class="right-content">
      <div class="login-box">
        <div class="login-header">
          <h2>{{ branchInfo ? branchInfo.name + ' - 管理后台' : '欢迎登录' }}</h2>
          <p v-if="branchInfo && !branchInfo.error" class="branch-code">机构代码: {{ branchInfo.code }}</p>
          <p v-else-if="branchInfo && branchInfo.error" class="branch-error">{{ branchInfo.error_message }}</p>
          <p v-else>请选择登录方式</p>
        </div>
        
        <!-- 登录方式切换 -->
        <div class="login-tabs">
          <div 
            class="tab-item" 
            :class="{ active: loginType === 'password' }"
            @click="switchLoginType('password')"
          >
            <el-icon><Lock /></el-icon>
            <span>密码登录</span>
          </div>
          <div 
            class="tab-item" 
            :class="{ active: loginType === 'wechat' }"
            @click="switchLoginType('wechat')"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.295.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18 0 .659-.52 1.188-1.162 1.188-.642 0-1.162-.529-1.162-1.188 0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18 0 .659-.52 1.188-1.162 1.188-.642 0-1.162-.529-1.162-1.188 0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.045c.134 0 .24-.111.24-.248 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.406-.032zm-2.530 3.274c.535 0 .969.44.969.982 0 .542-.434.982-.969.982s-.969-.44-.969-.982c0-.542.434-.982.969-.982zm5.061 0c.535 0 .969.44.969.982 0 .542-.434.982-.969.982s-.969-.44-.969-.982c0-.542.434-.982.969-.982z"/>
            </svg>
            <span>微信登录</span>
          </div>
        </div>
        
        <!-- 密码登录表单 -->
        <div v-show="loginType === 'password'" class="login-form-container">
          <el-form
            ref="loginFormRef"
            :model="formData"
            :rules="loginRules"
            label-width="0"
            class="login-form"
            autocomplete="off"
          >
            <el-form-item prop="username">
              <el-input
                v-model="formData.username"
                placeholder="用户名"
                autocomplete="off"
                size="large"
              >
                <template #prefix>
                  <el-icon><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="formData.password"
                type="password"
                placeholder="密码"
                autocomplete="new-password"
                size="large"
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-button
                :loading="loading"
                type="primary"
                class="login-button"
                size="large"
                @click="handleLogin"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </div>
        
        <!-- 微信登录 - 简洁设计 -->
        <div v-show="loginType === 'wechat'" class="wechat-login-simple">
          <!-- 微信登录状态显示 -->
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

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Loading, Clock, Check, Close, Warning } from '@element-plus/icons-vue'
import { login, getWechatLoginUrl, checkWechatLoginStatus } from '@/api/v1/auth'
import adminApi from '@/api/admin'
import { setAdminToken } from '@/utils/admin-token-bridge'

export default {
  name: 'Login',
  components: {
    User,
    Lock,
    Loading,
    Clock,
    Check,
    Close,
    Warning
  },
  setup() {
    const router = useRouter()
    const loginFormRef = ref(null)
    const loading = ref(false)
    const errorMessage = ref('')
    const loginType = ref('password') // 'password' | 'wechat'
    
    // 微信登录相关状态
    const wechatLoading = ref(false)
    const wechatConfigLoaded = ref(false)
    const wechatConfig = ref(null)
    const wechatLoginStarted = ref(false)
    
    // 微信登录状态检查定时器
    let wechatLoginTimer = null

    // 系统logo
    const systemLogo = ref('/images/logo.png')

    const formData = reactive({
      username: '',
      password: '',
      branch_code: '' // 添加分支机构代码字段
    })

    const loginRules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' }
      ]
    }

    // 获取系统logo
    const fetchSystemLogo = async () => {
      try {
        const result = await adminApi.getModuleConfigs('basic')
        if (result && result.code === 0 && result.data && result.data.site_logo) {
          systemLogo.value = result.data.site_logo
        }
      } catch (error) {
        console.warn('获取系统logo失败，使用默认logo:', error)
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

    // 密码登录
    const handleLogin = async () => {
      if (!loginFormRef.value) return
      
      await loginFormRef.value.validate(async (valid) => {
        if (!valid) return
        
        loading.value = true
        errorMessage.value = ''
        
        try {
          const loginData = {
            username: formData.username,
            password: formData.password
          }
          
          // 如果有分支机构代码，添加到登录数据中
          if (formData.branch_code) {
            loginData.branch_code = formData.branch_code
          }
          
          const response = await login(loginData)
          
          if (response.code === 0 || response.code === 200) {
            ElMessage.success('登录成功')
            // 保存token和用户信息
            setAdminToken(response.data.token)
            localStorage.setItem('user', JSON.stringify(response.data.user))
            
            // 检查是否有待绑定的微信信息
            const wechatBindState = sessionStorage.getItem('wechat_bind_state')
            if (wechatBindState) {
              // 清除sessionStorage
              sessionStorage.removeItem('wechat_bind_state')
              // 跳转到个人信息页面并带上绑定参数
              router.push(`/profile?wechat_bind_state=${wechatBindState}`)
            } else {
              // 跳转到首页
              router.push('/dashboard')
            }
          } else {
            errorMessage.value = response.message || '登录失败'
          }
        } catch (error) {
          console.error('登录失败:', error)
          errorMessage.value = error.response?.data?.message || '登录失败，请检查用户名和密码'
        } finally {
          loading.value = false
        }
      })
    }

    // 开始微信登录 - 直接打开新窗口
    const startWechatLogin = async () => {
      wechatLoading.value = true
      wechatConfig.value = null
      
      try {
        console.log('🔄 开始微信登录...')
        
        // 获取微信登录配置
        const response = await getWechatLoginUrl()
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
              setAdminToken(response.data.token)
              localStorage.setItem('user', JSON.stringify(response.data.user))
              
              // 跳转到首页
              router.push('/dashboard')
              
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
                generateQRCode()
              })
              
            } else if (response.data.status === 'expired') {
              // 二维码已过期
              stopWechatLoginStatusCheck()
              ElMessage.warning('二维码已过期，正在重新生成...')
              generateQRCode()
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

    // 分支机构信息
    const branchInfo = ref(null)
    
    // 检查URL参数并设置分支机构代码
    const checkBranchCode = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const branchCode = urlParams.get('branch_code')
      
      if (branchCode) {
        formData.branch_code = branchCode
        // 这里可以添加获取分支机构信息的逻辑
        fetchBranchInfo(branchCode)
      }
    }
    
    // 获取分支机构信息
    const fetchBranchInfo = async (branchCode) => {
      try {
        // 调用API获取分支机构信息
        const response = await axios.get(`https://pay.itapgo.com/api/admin/v1/branch-organizations`, {
          params: { code: branchCode }
        })
        
        if (response.data.code === 0 && response.data.data.data.length > 0) {
          const branchData = response.data.data.data[0]
          branchInfo.value = {
            id: branchData.id,
            code: branchData.code,
            name: branchData.name,
            status: branchData.status
          }
        } else {
          // 如果找不到分支机构，设置错误信息
          branchInfo.value = {
            code: branchCode,
            name: `分支机构 ${branchCode}`,
            error: true,
            error_message: '分支机构不存在或已禁用'
          }
        }
      } catch (error) {
        console.error('获取分支机构信息失败:', error)
        branchInfo.value = {
          code: branchCode,
          name: `分支机构 ${branchCode}`,
          error: true,
          error_message: '获取分支机构信息失败'
        }
      }
    }

    onMounted(() => {
      fetchSystemLogo()
      checkBranchCode()
    })

        onUnmounted(() => {
      // 清理资源
      stopWechatLoginStatusCheck()
    })

     return {
       loginFormRef,
       loading,
       errorMessage,
       loginType,
       wechatLoading,
       wechatConfigLoaded,
       wechatConfig,
       wechatLoginStarted,
       systemLogo,
       formData,
       loginRules,
       branchInfo,
       switchLoginType,
       handleLogin,
       startWechatLogin,
       retryWechatLogin
     }
  }
}
</script>

<style scoped>
/* 引入tapgo字体 */
@font-face {
  font-family: 'Tapgo';
  src: url('/admin/resources/fonts/tapgo.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'Tapgo';
  src: url('/admin/resources/fonts/tapgoB.ttf') format('truetype');
  font-weight: bold;
  font-style: normal;
}

.login-container {
  position: relative;
  display: flex;
  min-height: 100vh;
  overflow: hidden;
}

/* AI现代风格背景 */
.background-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.ai-background {
   width: 100%;
   height: 100%;
   background: url('/Tapp/admin/resources/images/ai-login-bg.svg') no-repeat center center;
   background-size: cover;
   animation: backgroundPulse 20s ease-in-out infinite;
 }

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.1) 0%,
    rgba(118, 75, 162, 0.1) 50%,
    rgba(64, 224, 208, 0.1) 100%
  );
}

@keyframes backgroundPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 左侧内容区域 */
.left-content {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.05) 0%,
    rgba(118, 75, 162, 0.05) 100%
  );
  backdrop-filter: blur(10px);
}

.brand-section {
  max-width: 500px;
  text-align: center;
  color: white;
}

.brand-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.logo-icon {
  margin-bottom: 20px;
  animation: logoFloat 3s ease-in-out infinite;
}

.system-logo-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.brand-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #667eea, #764ba2, #40e0d0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.brand-subtitle {
  font-family: 'Tapgo', sans-serif;
  font-size: 1.2rem;
  margin: 20px 0 40px;
  color: #262525;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.8);
  letter-spacing: 0.5px;
}

/* 右侧登录区域 */
.right-content {
  position: relative;
  z-index: 2;
  width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.login-box {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: #2d3748;
  margin: 0 0 10px;
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-header p {
  color: #718096;
  margin: 0;
  font-size: 14px;
}

.branch-code {
  color: #4a5568;
  font-weight: 500;
}

.branch-error {
  color: #f56c6c;
  background-color: #fef0f0;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #fbc4c4;
  font-weight: 500;
}

/* 登录方式切换 */
.login-tabs {
  display: flex;
  margin-bottom: 30px;
  background: #f7fafc;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #718096;
  font-size: 14px;
  font-weight: 500;
}

.tab-item:hover {
  color: #4a5568;
  background: rgba(255, 255, 255, 0.5);
}

.tab-item.active {
  background: white;
  color: #667eea;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-item svg {
  width: 16px;
  height: 16px;
}

/* 登录表单 */
.login-form-container {
  animation: fadeInUp 0.3s ease;
}

.login-form {
  width: 100%;
}

.login-form .el-form-item {
  margin-bottom: 20px;
}

.login-form .el-input {
  border-radius: 10px;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

/* 微信登录 */
.wechat-login-container {
  animation: fadeInUp 0.3s ease;
}

.qrcode-section {
  text-align: center;
}

.qrcode-loading {
  padding: 40px 20px;
  color: #718096;
}

.qrcode-loading .el-icon {
  font-size: 32px;
  margin-bottom: 15px;
  color: #667eea;
}

.qrcode-display {
  padding: 20px;
}

.wechat-qrcode-container {
  width: 220px;
  height: 220px;
  margin: 0 auto 15px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #e2e8f0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 微信二维码iframe精确居中样式 */
.wechat-qrcode-container iframe {
  width: 300px !important;
  height: 400px !important;
  transform: scale(0.55);
  transform-origin: center center;
  position: absolute;
  top: 50%;
  left: 50%;
  margin: -200px 0 0 -150px;
  border: none;
}

/* 微信登录简洁设计 - 只有二维码绝对居中 */
.wechat-login-simple {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.qrcode-simple-container {
  position: relative;
  width: 220px;
  height: 220px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
}

.wechat-qrcode-simple {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 微信登录按钮容器 */
.wechat-login-button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 20px;
}

.wechat-login-btn {
  width: 200px;
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 25px;
  background: linear-gradient(135deg, #07c160, #06ad56);
  border: none;
  box-shadow: 0 4px 15px rgba(7, 193, 96, 0.3);
  transition: all 0.3s ease;
}

.wechat-login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(7, 193, 96, 0.4);
  background: linear-gradient(135deg, #06ad56, #059c4b);
}

.wechat-login-tip {
  margin-top: 15px;
  color: #909399;
  font-size: 14px;
  text-align: center;
}

/* 等待扫码容器 */
.wechat-waiting-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 20px;
  text-align: center;
}

.waiting-icon {
  margin-bottom: 20px;
}

.wechat-waiting-container h4 {
  color: #303133;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 10px;
}

.wechat-waiting-container p {
  color: #606266;
  font-size: 14px;
  margin: 0 0 25px;
  line-height: 1.5;
}

.waiting-actions {
  display: flex;
  gap: 12px;
}

/* 加载状态文本 */
.loading-text {
  margin-top: 15px;
  color: #606266;
  font-size: 14px;
  text-align: center;
}

.qrcode-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
}

.qrcode-error-overlay {
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
  gap: 10px;
  padding: 20px;
  text-align: center;
}

.qrcode-error-overlay .error-text {
  color: #666;
  font-size: 14px;
  margin: 8px 0;
}

.qrcode-error-overlay .error-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.loading-icon {
  font-size: 24px;
  color: #07C160;
}

.error-icon {
  font-size: 24px;
  color: #ff6b6b;
}

.qrcode-fallback {
  text-align: center;
  padding: 20px;
}

.wechat-login-link {
  display: inline-block;
  background: #07c160;
  color: white;
  padding: 12px 24px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  margin-top: 10px;
  transition: background-color 0.3s;
}

.wechat-login-link:hover {
  background: #06ad56;
  color: white;
  text-decoration: none;
}

.qrcode-image {
  width: 200px;
  height: 200px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  margin-bottom: 15px;
}

.qrcode-tip {
  color: #718096;
  font-size: 14px;
  margin: 15px 0;
}

.qrcode-status {
  margin-top: 20px;
}

.status-waiting {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #667eea;
  font-size: 14px;
}

.status-waiting .el-icon {
  animation: pulse 2s infinite;
}

.status-scanned {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #48bb78;
  font-size: 14px;
}

.status-expired {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #f56565;
  font-size: 14px;
}

.qrcode-error {
  padding: 40px 20px;
  color: #f56565;
  text-align: center;
}

.qrcode-error .el-icon {
  font-size: 32px;
  margin-bottom: 15px;
}

/* SDK错误界面 */
.sdk-error {
  padding: 30px 20px;
  text-align: center;
  background: #fef5e7;
  border: 1px solid #f6ad55;
  border-radius: 12px;
  margin: 20px 0;
}

.sdk-error .el-icon {
  font-size: 48px;
  color: #ed8936;
  margin-bottom: 15px;
}

.sdk-error h4 {
  color: #c05621;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 10px;
}

.error-detail {
  color: #9c4221;
  font-size: 14px;
  margin: 10px 0 20px;
  padding: 10px;
  background: #fed7aa;
  border-radius: 6px;
  font-family: monospace;
}

.error-tips {
  text-align: left;
  margin: 20px 0;
  padding: 15px;
  background: #fffbf0;
  border-radius: 8px;
  border-left: 4px solid #f6ad55;
}

.error-tips p {
  color: #c05621;
  font-weight: 600;
  margin: 0 0 10px;
}

.error-tips ul {
  color: #9c4221;
  margin: 0;
  padding-left: 20px;
}

.error-tips li {
  margin: 5px 0;
  font-size: 14px;
}

.error-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 错误消息 */
.error-message {
  color: #f56565;
  text-align: center;
  margin-top: 20px;
  padding: 12px 16px;
  background: #fed7d7;
  border-radius: 8px;
  border: 1px solid #feb2b2;
  font-size: 14px;
}

/* 动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .left-content {
    display: none;
  }
  
  .right-content {
    width: 100%;
    background: rgba(255, 255, 255, 0.95);
  }
}

@media (max-width: 768px) {
  .right-content {
    padding: 20px;
  }
  
  .login-box {
    padding: 30px 20px;
    border-radius: 16px;
  }
  
  .brand-title {
    font-size: 2rem;
  }
  
  .qrcode-image {
    width: 160px;
    height: 160px;
  }
}

@media (max-width: 480px) {
  .login-box {
    padding: 25px 15px;
  }
  
  .login-header h2 {
    font-size: 24px;
  }
  
  .tab-item {
    padding: 10px 12px;
    font-size: 13px;
  }
  
  .qrcode-image {
    width: 140px;
    height: 140px;
  }
}
</style>
