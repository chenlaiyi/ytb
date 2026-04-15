<template>
  <div class="wechat-success-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <van-loading size="24px" vertical>正在处理登录信息...</van-loading>
    </div>

    <!-- 成功状态 -->
    <div v-else-if="success" class="success-container">
      <div class="success-icon">
        <van-icon name="checked" size="48" color="#07c160" />
      </div>
      <h2>微信登录成功！</h2>
      <p class="success-text">正在跳转到分支机构用户中心...</p>
      <div class="countdown">{{ countdown }}秒后自动跳转</div>
    </div>

    <!-- 错误状态 -->
    <div v-else class="error-container">
      <div class="error-icon">
        <van-icon name="cross" size="48" color="#ee0a24" />
      </div>
      <h2>处理登录信息失败</h2>
      <div class="error-details">
        <p class="error-message">{{ errorMessage }}</p>
        <div v-if="debugMode" class="debug-info">
          <h4>调试信息：</h4>
          <div class="debug-item">
            <strong>URL参数：</strong>
            <pre>{{ JSON.stringify(urlParams, null, 2) }}</pre>
          </div>
          <div class="debug-item">
            <strong>解析结果：</strong>
            <pre>{{ JSON.stringify(parseResult, null, 2) }}</pre>
          </div>
          <div class="debug-item">
            <strong>验证过程：</strong>
            <ul>
              <li v-for="(step, index) in validationSteps" :key="index" :class="step.status">
                {{ step.message }}
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="error-actions">
        <van-button type="primary" @click="retry" :loading="retrying">重试</van-button>
        <van-button @click="goToLogin">返回登录</van-button>
        <van-button type="default" @click="toggleDebug">{{ debugMode ? '隐藏' : '显示' }}调试信息</van-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'

export default {
  name: 'BranchWechatSuccess',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const loading = ref(true)
    const success = ref(false)
    const countdown = ref(2)
    const errorMessage = ref('')
    const debugMode = ref(false)
    const retrying = ref(false)
    const urlParams = ref({})
    const parseResult = ref({})
    const validationSteps = ref([])

    const addValidationStep = (message, status = 'pending') => {
      validationSteps.value.push({ message, status })
      console.log(`[验证步骤] ${message} - ${status}`)
    }

    const updateLastStep = (status) => {
      if (validationSteps.value.length > 0) {
        validationSteps.value[validationSteps.value.length - 1].status = status
      }
    }

    const processLoginInfo = () => {
      try {
        console.log('[分支机构微信登录] 开始处理登录信息')
        
        // 获取URL参数 - 使用Vue Router的route.query
        const params = { ...route.query }
        
        // 如果route.query为空，尝试从window.location.hash解析
        if (Object.keys(params).length === 0) {
          console.log('[分支机构微信登录] route.query为空，尝试从hash解析参数')
          const hash = window.location.hash
          console.log('[分支机构微信登录] 当前hash:', hash)
          
          // 解析hash中的参数
          if (hash.includes('?')) {
            const queryString = hash.split('?')[1]
            const urlSearchParams = new URLSearchParams(queryString)
            for (const [key, value] of urlSearchParams) {
              params[key] = value
            }
          }
        }
        
        urlParams.value = params
        console.log('[分支机构微信登录] URL参数:', params)
        console.log('[分支机构微信登录] 完整URL:', window.location.href)
        console.log('[分支机构微信登录] Hash:', window.location.hash)
        console.log('[分支机构微信登录] Route query:', route.query)

        addValidationStep('获取URL参数', 'success')

        // 验证必要参数
        addValidationStep('验证success参数')
        if (!params.success || params.success !== '1') {
          updateLastStep('error')
          throw new Error(`success参数无效: ${params.success}`)
        }
        updateLastStep('success')

        addValidationStep('验证token参数')
        if (!params.token) {
          updateLastStep('error')
          throw new Error('缺少token参数')
        }
        updateLastStep('success')

        addValidationStep('验证isBranch参数')
        if (!params.isBranch || params.isBranch !== '1') {
          updateLastStep('error')
          throw new Error(`isBranch参数无效: ${params.isBranch}`)
        }
        updateLastStep('success')

        addValidationStep('验证branch_code参数')
        if (!params.branch_code) {
          updateLastStep('error')
          throw new Error('缺少branch_code参数')
        }
        updateLastStep('success')

        // 解析登录信息
        const loginInfo = {
          token: params.token,
          user_id: params.user_id,
          branch_id: params.branch_id,
          branch_code: params.branch_code,
          openid: params.openid,
          needBindPhone: params.needBindPhone === '1',
          isBranch: true
        }
        parseResult.value = loginInfo
        console.log('[分支机构微信登录] 解析的登录信息:', loginInfo)

        addValidationStep('解析登录信息', 'success')

        // 构建用户信息对象
        const userInfo = {
          id: params.user_id,
          user_id: params.user_id,  // 确保邀请取水API能正确获取用户ID
          userId: params.user_id,
          nickname: params.nickname || '',
          wechat_nickname: params.wechat_nickname || '',
          avatar: params.avatar || '',
          wechat_avatar: params.wechat_avatar || '',
          phone: params.phone || '',
          email: params.email || '',
          name: params.name || params.wechat_nickname || params.nickname || '',
          roles: [],
          is_pay_institution: parseInt(params.is_pay_institution || 0),
          is_water_purifier_user: parseInt(params.is_water_purifier_user || 0),
          is_engineer: parseInt(params.is_engineer || 0),
          is_water_purifier_agent: parseInt(params.is_water_purifier_agent || 0),
          is_pay_merchant: parseInt(params.is_pay_merchant || 0),
          is_vip: parseInt(params.is_vip || 0),
          is_salesman: parseInt(params.is_salesman || 0),
          is_admin: parseInt(params.is_admin || 0)
        }

        // 保存到本地存储
        addValidationStep('保存到localStorage')
        try {
          localStorage.setItem('user_id', loginInfo.user_id)
          localStorage.setItem('token', loginInfo.token)
          localStorage.setItem('branch_token', loginInfo.token)  // 分支机构专用token
          localStorage.setItem('auth_token', loginInfo.token)
          localStorage.setItem('isBranch', '1')
          localStorage.setItem('branch_code', loginInfo.branch_code)
          localStorage.setItem('branch_id', loginInfo.branch_id)
          
          // 保存用户信息 - 使用分支机构专用的键名
          localStorage.setItem('branch_userInfo', JSON.stringify(userInfo))
          localStorage.setItem('userInfo', JSON.stringify(userInfo))  // 兼容性保存
          
          if (loginInfo.openid) {
            localStorage.setItem('openid', loginInfo.openid)
          }
          updateLastStep('success')
          console.log('[分支机构微信登录] localStorage保存成功')
        } catch (storageError) {
          updateLastStep('error')
          throw new Error(`localStorage保存失败: ${storageError.message}`)
        }

        addValidationStep('保存到sessionStorage')
        try {
          sessionStorage.setItem('user_id', loginInfo.user_id)
          sessionStorage.setItem('token', loginInfo.token)
          sessionStorage.setItem('auth_token', loginInfo.token)
          sessionStorage.setItem('isBranch', '1')
          sessionStorage.setItem('branch_code', loginInfo.branch_code)
          sessionStorage.setItem('branch_id', loginInfo.branch_id)
          updateLastStep('success')
          console.log('[分支机构微信登录] sessionStorage保存成功')
        } catch (storageError) {
          updateLastStep('error')
          throw new Error(`sessionStorage保存失败: ${storageError.message}`)
        }

        addValidationStep('设置Cookie')
        try {
          document.cookie = `user_id=${loginInfo.user_id}; path=/; max-age=604800`
          document.cookie = `token=${loginInfo.token}; path=/; max-age=604800`
          document.cookie = `auth_token=${loginInfo.token}; path=/; max-age=604800`
          document.cookie = `isBranch=1; path=/; max-age=604800`
          document.cookie = `branch_code=${loginInfo.branch_code}; path=/; max-age=604800`
          updateLastStep('success')
          console.log('[分支机构微信登录] Cookie设置成功')
        } catch (cookieError) {
          updateLastStep('error')
          throw new Error(`Cookie设置失败: ${cookieError.message}`)
        }

        // 登录成功
        addValidationStep('登录处理完成', 'success')
        success.value = true
        loading.value = false
        
        console.log('[分支机构微信登录] 登录信息处理成功，准备跳转')
        
        // 立即跳转到分支机构用户中心，不等待倒计时
        setTimeout(() => {
          console.log('[分支机构微信登录] 即将跳转到分支机构用户中心')
          router.push('/branch/profile')
        }, 1500) // 1.5秒后跳转，让用户看到成功提示
        
        // 同时启动倒计时显示
        const timer = setInterval(() => {
          countdown.value--
          if (countdown.value <= 0) {
            clearInterval(timer)
          }
        }, 1000)

      } catch (error) {
        console.error('[分支机构微信登录] 处理失败:', error)
        loading.value = false
        success.value = false
        errorMessage.value = error.message || '未知错误'
        
        // 显示错误提示
        showToast({
          message: `登录处理失败: ${error.message}`,
          type: 'fail',
          duration: 8000
        })
      }
    }

    const retry = () => {
      retrying.value = true
      setTimeout(() => {
        retrying.value = false
        loading.value = true
        success.value = false
        errorMessage.value = ''
        validationSteps.value = []
        processLoginInfo()
      }, 1000)
    }

    const goToLogin = () => {
      const branch_code = urlParams.value.branch_code || 'XM0001'
      router.push(`/branch/login?branch_code=${branch_code}`)
    }

    const toggleDebug = () => {
      debugMode.value = !debugMode.value
    }

    onMounted(() => {
      console.log('[分支机构微信登录] 页面加载完成，开始处理')
      processLoginInfo()
    })

    return {
      loading,
      success,
      countdown,
      errorMessage,
      debugMode,
      retrying,
      urlParams,
      parseResult,
      validationSteps,
      retry,
      goToLogin,
      toggleDebug
    }
  }
}
</script>

<style scoped>
.wechat-success-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.loading-container,
.success-container,
.error-container {
  background: white;
  border-radius: 12px;
  padding: 40px 30px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
}

.success-icon,
.error-icon {
  margin-bottom: 20px;
}

h2 {
  color: #333;
  margin-bottom: 16px;
  font-size: 20px;
  font-weight: 600;
}

.success-text {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
}

.countdown {
  font-size: 16px;
  color: #07c160;
  font-weight: 600;
}

.error-details {
  text-align: left;
  margin: 20px 0;
}

.error-message {
  color: #ee0a24;
  font-weight: 600;
  margin-bottom: 16px;
  padding: 12px;
  background: #fff2f0;
  border-radius: 8px;
  border-left: 4px solid #ee0a24;
}

.debug-info {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.debug-info h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
}

.debug-item {
  margin-bottom: 16px;
}

.debug-item:last-child {
  margin-bottom: 0;
}

.debug-item strong {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-size: 13px;
}

.debug-item pre {
  background: #fff;
  border: 1px solid #ebedf0;
  border-radius: 4px;
  padding: 8px;
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.debug-item ul {
  margin: 0;
  padding-left: 20px;
}

.debug-item li {
  margin-bottom: 4px;
  font-size: 12px;
}

.debug-item li.success {
  color: #07c160;
}

.debug-item li.error {
  color: #ee0a24;
}

.debug-item li.pending {
  color: #1989fa;
}

.error-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.error-actions .van-button {
  flex: 1;
  min-width: 80px;
}

@media (max-width: 480px) {
  .wechat-success-container {
    padding: 16px;
  }
  
  .loading-container,
  .success-container,
  .error-container {
    padding: 30px 20px;
  }
  
  .error-actions {
    flex-direction: column;
  }
  
  .error-actions .van-button {
    flex: none;
  }
}
</style> 