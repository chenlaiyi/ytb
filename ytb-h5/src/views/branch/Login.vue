<template>
  <div class="login-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" vertical>加载中...</van-loading>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <van-empty 
        image="error" 
        :description="error"
      >
        <van-button 
          type="primary" 
          @click="retry"
          style="width: 160px;"
        >
          重试
        </van-button>
      </van-empty>
    </div>

    <!-- 分支机构登录页面 -->
    <div v-else-if="branchInfo && wechatAccount" class="login-content">
      <div class="login-header">
        <!-- 使用微信公众号头像作为logo -->
        <img :src="wechatAccount.head_img" :alt="wechatAccount.nick_name" class="login-logo" />
        <!-- 使用分支机构名称 -->
        <h2 class="login-title">欢迎登录{{ branchInfo.name }}</h2>
        <p class="login-subtitle">多角色智能管家</p>
      </div>

      <!-- 微信登录入口 - 突出显示 -->
      <div class="wechat-login-btn" @click="handleWechatLogin" :class="{ 'loading': loginLoading }">
        <van-icon name="wechat" size="20" />
        <span>微信一键登录</span>
      </div>

      <!-- 其他登录方式折叠区域 -->
      <div class="other-login-toggle" @click="toggleOtherLogin">
        <span>其他登录方式</span>
        <van-icon :name="showOtherLogin ? 'arrow-up' : 'arrow-down'" />
      </div>

      <!-- 折叠的登录表单区域 -->
      <div class="collapsible-content" :style="{ maxHeight: showOtherLogin ? '300px' : '0' }">
        <!-- 登录标签切换 -->
        <div class="login-tabs">
          <div 
            class="login-tab" 
            :class="{ active: activeTab === 'phone' }"
            @click="activeTab = 'phone'"
          >
            手机号登录
          </div>
          <div 
            class="login-tab" 
            :class="{ active: activeTab === 'email' }"
            @click="activeTab = 'email'"
          >
            邮箱登录
          </div>
        </div>

        <!-- 手机号登录表单 -->
        <div v-show="activeTab === 'phone'" class="login-form">
          <van-form @submit="handlePhoneLogin">
            <van-cell-group>
              <van-field
                v-model="phoneForm.phone"
                name="phone"
                label="手机号"
                placeholder="请输入手机号"
                :rules="[{ required: true, message: '请输入手机号' }]"
                type="tel"
                maxlength="11"
                clearable
              />
              <van-field
                v-model="phoneForm.password"
                type="password"
                name="password"
                label="密码"
                placeholder="请输入密码"
                :rules="[{ required: true, message: '请输入密码' }]"
                clearable
              />
            </van-cell-group>
            
            <div class="login-actions">
              <van-button 
                round 
                block 
                type="primary" 
                native-type="submit"
                :loading="phoneLoginLoading"
              >
                登录
              </van-button>
              <div class="forgot-password" @click="handleForgotPassword">
                忘记密码？
              </div>
            </div>
          </van-form>
        </div>

        <!-- 邮箱登录表单 -->
        <div v-show="activeTab === 'email'" class="login-form">
          <van-form @submit="handleEmailLogin">
            <van-cell-group>
              <van-field
                v-model="emailForm.email"
                name="email"
                label="邮箱"
                placeholder="请输入邮箱"
                :rules="[{ required: true, message: '请输入邮箱' }]"
                type="email"
                clearable
              />
              <van-field
                v-model="emailForm.password"
                type="password"
                name="password"
                label="密码"
                placeholder="请输入密码"
                :rules="[{ required: true, message: '请输入密码' }]"
                clearable
              />
            </van-cell-group>
            
            <div class="login-actions">
              <van-button 
                round 
                block 
                type="primary" 
                native-type="submit"
                :loading="emailLoginLoading"
              >
                登录
              </van-button>
              <div class="forgot-password" @click="handleForgotPassword">
                忘记密码？
              </div>
            </div>
          </van-form>
        </div>
      </div>

      <!-- 服务条款 -->
      <div class="terms-section">
        <van-checkbox v-model="agreePolicy" icon-size="14px" checked-color="#1989fa">
          <span class="terms-text">我已阅读并同意</span>
        </van-checkbox>
        <span class="terms-link" @click.stop="openAgreement">《用户协议》</span> 和 
        <span class="terms-link" @click.stop="openPrivacy">《隐私政策》</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getBranchWechatLoginUrl } from '@/api/branchWechatAuth'
import { showToast, showLoadingToast, closeToast } from 'vant'

export default {
  name: 'BranchLogin',
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    const loading = ref(true)
    const error = ref('')
    const loginLoading = ref(false)
    const branchInfo = ref(null)
    const wechatAccount = ref(null)
    
    // 表单切换状态
    const showOtherLogin = ref(false)
    const activeTab = ref('phone')
    const phoneLoginLoading = ref(false)
    const emailLoginLoading = ref(false)
    const agreePolicy = ref(false)  // 隐私政策同意状态
    
    // 表单数据
    const phoneForm = reactive({
      phone: '',
      password: ''
    })
    
    const emailForm = reactive({
      email: '',
      password: ''
    })
    
    // 获取分支机构代码
    const branchCode = computed(() => {
      return route.query.branch_code || 
             new URLSearchParams(window.location.hash.split('?')[1] || '').get('branch_code')
    })
    
    // 获取分支机构信息
    const fetchBranchInfo = async () => {
      try {
        loading.value = true
        error.value = ''
        
        if (!branchCode.value) {
          throw new Error('缺少分支机构代码')
        }
        
        // 调用API获取分支机构微信登录信息
        // 不设置回调URL，让后端使用默认的API回调地址
        const response = await getBranchWechatLoginUrl(branchCode.value, null)
        
        if (response.code === 0) {
          branchInfo.value = response.data.branch
          wechatAccount.value = response.data.wechat_account
        } else {
          throw new Error(response.message || '获取分支机构信息失败')
        }
      } catch (err) {
        console.error('获取分支机构信息失败:', err)
        error.value = err.message || '获取分支机构信息失败，请稍后重试'
      } finally {
        loading.value = false
      }
    }
    
    // 处理微信登录
    const handleWechatLogin = async () => {
      // 检查隐私政策同意状态
      if (!agreePolicy.value) {
        showToast({
          message: '请先阅读并同意用户协议和隐私政策',
          type: 'fail'
        })
        return
      }
      
      try {
        loginLoading.value = true
        showLoadingToast({
          message: '正在准备微信登录...',
          forbidClick: true,
        })
        
        // 不设置回调URL，让后端使用默认的API回调地址
        const response = await getBranchWechatLoginUrl(branchCode.value, null)
        
        if (response.code === 0) {
          // 保存登录成功后的跳转路径
          localStorage.setItem('branch_login_redirect', route.fullPath)
          localStorage.setItem('branch_code', branchCode.value)
          
          console.log('跳转到分支机构微信授权页面')
          console.log('分支机构:', response.data.branch.name)
          console.log('微信公众号:', response.data.wechat_account.nick_name)
          
          // 跳转到微信授权页面
          window.location.href = response.data.url
        } else {
          throw new Error(response.message || '获取微信登录URL失败')
        }
      } catch (err) {
        console.error('微信登录失败:', err)
        showToast({
          message: err.message || '微信登录失败，请稍后重试',
          type: 'fail'
        })
      } finally {
        loginLoading.value = false
        closeToast()
      }
    }
    
    // 切换其他登录方式
    const toggleOtherLogin = () => {
      showOtherLogin.value = !showOtherLogin.value
    }
    
    // 手机号登录
    const handlePhoneLogin = async () => {
      // 检查隐私政策同意状态
      if (!agreePolicy.value) {
        showToast({
          message: '请先阅读并同意用户协议和隐私政策',
          type: 'fail'
        })
        return
      }
      
      try {
        phoneLoginLoading.value = true
        showToast('手机号登录功能开发中，请使用微信登录')
      } catch (error) {
        showToast({
          message: error.message || '登录失败',
          type: 'fail'
        })
      } finally {
        phoneLoginLoading.value = false
      }
    }
    
    // 邮箱登录
    const handleEmailLogin = async () => {
      // 检查隐私政策同意状态
      if (!agreePolicy.value) {
        showToast({
          message: '请先阅读并同意用户协议和隐私政策',
          type: 'fail'
        })
        return
      }
      
      try {
        emailLoginLoading.value = true
        showToast('邮箱登录功能开发中，请使用微信登录')
      } catch (error) {
        showToast({
          message: error.message || '登录失败',
          type: 'fail'
        })
      } finally {
        emailLoginLoading.value = false
      }
    }
    
    // 忘记密码
    const handleForgotPassword = () => {
      showToast('忘记密码功能开发中')
    }
    
    // 重试
    const retry = () => {
      fetchBranchInfo()
    }
    
    // 打开用户协议
    const openAgreement = () => {
      router.push('/user/settings/agreement')
    }
    
    // 打开隐私政策
    const openPrivacy = () => {
      router.push('/user/settings/privacy-policy')
    }
    
    onMounted(() => {
      fetchBranchInfo()
    })
    
    return {
      loading,
      error,
      loginLoading,
      branchInfo,
      wechatAccount,
      branchCode,
      showOtherLogin,
      activeTab,
      phoneLoginLoading,
      emailLoginLoading,
      phoneForm,
      emailForm,
      agreePolicy,
      handleWechatLogin,
      toggleOtherLogin,
      handlePhoneLogin,
      handleEmailLogin,
      handleForgotPassword,
      openAgreement,
      openPrivacy,
      retry
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background-color: #fff;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  color: #666;
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 20px;
}

.login-content {
  padding: 60px 20px 20px;
}

.login-header {
  text-align: center;
  margin: 20px 0 30px;
}

.login-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
  border-radius: 50%;
  border: 2px solid #f0f0f0;
}

.login-title {
  font-size: 24px;
  color: #333;
  margin: 0 0 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.wechat-login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  background-color: #07c160;
  color: white;
  font-size: 16px;
  font-weight: 500;
  border-radius: 22px;
  margin: 0 16px 20px;
  box-shadow: 0 2px 8px rgba(7, 193, 96, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.wechat-login-btn:hover {
  background-color: #06ad56;
}

.wechat-login-btn.loading {
  opacity: 0.7;
  pointer-events: none;
}

.wechat-login-btn .van-icon {
  margin-right: 8px;
}

.other-login-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
  margin: 20px 0;
  padding: 10px;
  cursor: pointer;
}

.other-login-toggle span {
  margin-right: 5px;
}

.collapsible-content {
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.login-tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.login-tab {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 15px;
  color: #666;
  position: relative;
  cursor: pointer;
}

.login-tab.active {
  color: #1989fa;
}

.login-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 2px;
  background-color: #1989fa;
}

.login-form {
  margin-bottom: 20px;
}

.login-actions {
  margin-top: 20px;
  padding: 0 16px;
}

.forgot-password {
  text-align: center;
  color: #1989fa;
  font-size: 14px;
  margin-top: 16px;
  cursor: pointer;
}

.terms-section {
  margin-top: 40px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  font-size: 12px;
  color: #999;
}

.terms-section .van-checkbox {
  margin-right: 4px;
}

.terms-text {
  color: #666;
}

.terms-link {
  color: #1989fa;
  cursor: pointer;
}

.terms-link:active {
  opacity: 0.7;
}
</style> 