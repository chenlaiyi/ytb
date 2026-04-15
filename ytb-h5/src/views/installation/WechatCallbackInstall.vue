<template>
  <div class="wechat-callback-container">
    <div class="callback-content">
      <div class="loading-wrapper" v-if="isLoading">
        <van-loading type="spinner" color="#07c160" size="48px" />
        <div class="loading-text">{{ loadingText }}</div>
        <div class="loading-progress">
          <div 
            class="progress-bar" 
            :style="{ width: `${progressWidth}%` }"
          ></div>
        </div>
      </div>
      
      <div class="error-wrapper" v-if="hasError">
        <Icon name="close" size="48" color="#ee0a24" />
        <div class="error-text">{{ errorMessage }}</div>
        <Button 
          type="primary" 
          class="retry-btn" 
          @click="handleRetry"
        >
          返回登录
        </Button>
      </div>
      
      <div class="success-wrapper" v-if="isSuccess">
        <Icon name="success" size="48" color="#07c160" />
        <div class="success-text">{{ successMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Loading as VanLoading, Icon, Button } from 'vant'
import { wechatLoginCallback } from '@/api/user'
import { useUserStore } from '@/stores/user'
import Toast from '@/utils/toast'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 页面状态
const isLoading = ref(true)
const isSuccess = ref(false)
const hasError = ref(false)
const loadingText = ref('正在处理微信登录...')
const errorMessage = ref('')
const successMessage = ref('')
const progressWidth = ref(0)

// 进度条定时器
let progressTimer = null

// 初始化进度条
const initProgressBar = () => {
  progressWidth.value = 0
  progressTimer = setInterval(() => {
    if (progressWidth.value < 90) {
      progressWidth.value += 2
    }
  }, 100)
}

// 完成进度条
const completeProgress = () => {
  progressWidth.value = 100
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

// 处理微信登录回调
const handleCallback = async () => {
  initProgressBar()
  
  try {
    // 从URL参数中获取code和state
    let code = route.query.code
    let state = route.query.state
    
    // 如果路由参数中没有，尝试从URL中直接获取
    if (!code || !state) {
      const urlParams = new URLSearchParams(window.location.search)
      code = urlParams.get('code')
      state = urlParams.get('state')
    }
    
    console.log('微信回调参数:', { code, state, path: window.location.pathname })
    
    if (!code) {
      showError('微信授权失败，缺少授权码')
      return
    }
    
    try {
      loadingText.value = '正在验证授权...'
      
      // 只清除必要的数据，不要清除整个localStorage
      localStorage.removeItem('userInfo');
      localStorage.removeItem('tempUserInfo');
      
      // 调用API处理微信登录 - 简化数据
      const res = await wechatLoginCallback({ 
        code, 
        state,
        version: '1.0.409' // 添加客户端版本号
      })
      
      console.log('微信登录API响应:', res)
      
      if (res.code === 0) {
        completeProgress()
        
        // 确保用户数据存在
        if (!res.data) {
          console.error('微信登录响应缺少data字段:', res)
          showError('登录数据异常，请重试')
          return
        }
        
        // 确保token存在
        if (!res.data.token) {
          console.error('微信登录响应缺少token:', res.data)
          showError('登录凭证异常，请重试')
          return
        }
        
        console.log('获取到新Token:', res.data.token)
        
        // 清除旧数据
        localStorage.removeItem('userInfo')
        
        // 先保存token并设置到Store中
        localStorage.setItem('token', res.data.token)
        userStore.setToken(res.data.token)
        console.log('已保存token到localStorage和Store')
        
        // 处理用户信息并确保正确的ID字段名
        const userData = { ...res.data.user }
        
        // 确保用户ID字段命名一致 - 解决客户端与服务器ID不一致问题
        if (userData.id && !userData.userId) {
          userData.userId = userData.id;
          console.log('用户ID统一: 使用id设置userId', userData.id);
        } else if (userData.userId && !userData.id) {
          userData.id = userData.userId;
          console.log('用户ID统一: 使用userId设置id', userData.userId);
        }
        
        // 确保微信头像URL是可访问的
        if (userData.wechat_avatar && !userData.wechat_avatar.startsWith('http')) {
          userData.wechat_avatar = 'https://pay.itapgo.com' + userData.wechat_avatar
        }

        // *** 标准化头像字段：确保 userInfo.avatar 存在 ***
        if (!userData.avatar && userData.wechat_avatar) {
            userData.avatar = userData.wechat_avatar;
            console.log('标准化头像：使用 wechat_avatar 设置 avatar');
        } else if (userData.avatar && typeof userData.avatar === 'string' && !userData.avatar.startsWith('http') && !userData.avatar.startsWith('/')) {
            // 如果 avatar 存在但不是完整 URL (非http开头且非/开头)，尝试添加域名
            userData.avatar = 'https://pay.itapgo.com' + userData.avatar;
            console.log('标准化头像：修复非 http 开头的 avatar 字段');
        }
        // *** 结束标准化 ***
        
        // 存储用户信息到localStorage和Store
        localStorage.setItem('userInfo', JSON.stringify(userData))
        userStore.setUserInfo(userData)
        console.log('保存用户信息到localStorage和Store:', userData)
        
        // 安装流程特殊处理 - 从state参数获取原始URL
        showSuccess('授权成功，正在跳转回原页面...') // 显示成功提示
        
        setTimeout(async () => {
          try {
            // 保存标记，指示用户是从微信登录过来的
            localStorage.setItem('fromWechatLogin', 'true');

            // 1. 从 route.query.state 直接获取 redirectKey (普通字符串)
            const redirectKey = route.query.state || null;
            let finalRedirectUrl = '/install-booking'; // 默认值
            let referrerId = null;

            if (redirectKey) {
              console.log('从 state 获取到 redirectKey:', redirectKey);
              const storedDataString = localStorage.getItem(redirectKey);
              if (storedDataString) {
                  try {
                      const storedData = JSON.parse(storedDataString);
                      if (storedData.originalUrl) {
                          finalRedirectUrl = storedData.originalUrl;
                          console.log('从localStorage获取到原始URL:', finalRedirectUrl);
                      }
                      if (storedData.referrerId) {
                          referrerId = storedData.referrerId;
                          console.log('从localStorage获取到 referrerId:', referrerId);
                          // *** 移动 referrerId 存储位置：确保尽早存储 ***
                          localStorage.setItem('referrer_id', referrerId);
                          console.log('已将 referrerId 提前存回 localStorage');
                      }
                  } catch (e) {
                      console.error('解析 localStorage 数据失败:', e);
                      // 解析失败也尝试使用默认URL，但 referrerId 会丢失
                      finalRedirectUrl = '/install-booking'; 
                  }
                  localStorage.removeItem(redirectKey);
                  console.log(`已从localStorage移除Key: ${redirectKey}`);
              } else {
                  console.warn('未能在localStorage中找到Key对应的URL数据:', redirectKey);
                  // 未找到数据，使用默认URL
                  finalRedirectUrl = '/install-booking';
              }
            }

            console.log('准备跳转，最终URL（可能为默认值）:', finalRedirectUrl);

            try {
                console.log('跳转前，尝试调用 userStore.fetchUserInfo()');
                try {
                    await userStore.fetchUserInfo();
                    console.log('userStore.fetchUserInfo() 调用完成, Store state:', JSON.parse(JSON.stringify(userStore.userInfo))); 

                    // !!! 二次检查并标准化头像 (API刷新后) !!!
                    const refreshedUserInfo = userStore.userInfo;
                    if (refreshedUserInfo && (!refreshedUserInfo.avatar || refreshedUserInfo.avatar === '/app/images/profile/default-avatar.png') && refreshedUserInfo.wechat_avatar) {
                        console.log('getUserInfo 后，avatar 无效，尝试使用 wechat_avatar');
                        refreshedUserInfo.avatar = refreshedUserInfo.wechat_avatar;
                        // 可选：如果需要，再次确保 URL 完整性 (虽然标准化时应该已处理)
                        if (typeof refreshedUserInfo.avatar === 'string' && !refreshedUserInfo.avatar.startsWith('http')) {
                           refreshedUserInfo.avatar = 'https://pay.itapgo.com' + refreshedUserInfo.avatar.replace(/^\/+/, ''); 
                        }
                        userStore.setUserInfo(refreshedUserInfo); // 更新 Store
                        localStorage.setItem('userInfo', JSON.stringify(refreshedUserInfo)); // 更新 localStorage
                        console.log('二次标准化头像后, Store state:', JSON.parse(JSON.stringify(userStore.userInfo))); 
                    }
                    // !!! 结束二次检查 !!!

                } catch (fetchError) {
                    console.error('调用 userStore.fetchUserInfo() 失败:', fetchError);
                }
                
                // *** 增加 URL 有效性检查 ***
                console.log('尝试解析URL进行跳转:', finalRedirectUrl);
                if (typeof finalRedirectUrl !== 'string' || !finalRedirectUrl.startsWith('http')) {
                    console.warn('finalRedirectUrl 无效，将使用默认路由 /install-booking');
                    router.replace('/install-booking');
                    return; // 结束执行
                }
                // *** 结束 URL 检查 ***

                const urlObject = new URL(finalRedirectUrl); 
                const hash = urlObject.hash;
                
                if (hash && hash.startsWith('#/')) {
                    const pathAndQuery = hash.substring(1); // 移除 #，得到 /install-booking?referrer_id=32
                    const [pathPart, queryString] = pathAndQuery.split('?');
                    const queryParams = queryString ? Object.fromEntries(new URLSearchParams(queryString)) : {};
                    
                    console.log(`即将使用 router.replace 跳转: path=${pathPart}, query=`, queryParams);
                    router.replace({ path: pathPart, query: queryParams });
                } else {
                    // 如果 URL 格式不符合预期 (没有 #/ )，回退到默认页面
                    console.warn('解析出的 URL hash 格式不正确，回退到默认 install-booking');
                    router.replace('/install-booking'); 
                }
            } catch (parseError) {
                console.error('解析 finalRedirectUrl 或路由跳转失败，回退:', parseError);
                router.replace('/install-booking');
            }
          } catch (e) {
            console.error('重定向过程中发生错误:', e);
            // 备用跳转方式
            router.replace('/install-booking');
          }
        }, 1500)
      } else {
        showError(res.message || '微信登录处理失败')
      }
    } catch (apiError) {
      console.error('API请求异常:', apiError)
      
      // 获取详细错误信息
      let errorMsg = '网络异常，请稍后重试'
      if (apiError.response && apiError.response.data && apiError.response.data.message) {
        errorMsg = apiError.response.data.message
      } else if (apiError.message) {
        errorMsg = apiError.message
      }
      
      // 特殊错误处理
      if (errorMsg.includes("Table") && errorMsg.includes("doesn't exist")) {
        errorMsg = '服务器配置问题，请联系管理员处理'
      }
      
      showError(errorMsg)
    }
  } catch (error) {
    console.error('微信登录回调处理失败', error)
    showError('处理异常，请重新登录')
  }
}

// 显示错误
const showError = (message) => {
  completeProgress()
  loadingText.value = '处理失败'
  errorMessage.value = message
  
  setTimeout(() => {
    isLoading.value = false
    hasError.value = true
  }, 500)
}

// 显示成功
const showSuccess = (message) => {
  loadingText.value = '处理成功'
  successMessage.value = message
  
  setTimeout(() => {
    isLoading.value = false
    isSuccess.value = true
  }, 500)
}

// 重试/返回登录
const handleRetry = () => {
  // 确保使用完整的登录页面URL
  const host = window.location.host
  if (host.includes('pay.itapgo.com')) {
    // 生产环境使用完整路径
    window.location.href = '/app/#/login'
  } else {
    // 开发环境
    router.replace('/login')
  }
}

onMounted(() => {
  console.log('--- WechatCallbackInstall onMounted --- ');
  console.log('window.location.href:', window.location.href);
  console.log('route object:', route);
  console.log('route.query:', JSON.parse(JSON.stringify(route.query)));
  console.log('--- End WechatCallbackInstall onMounted --- ');
  
  console.log('WechatCallbackInstall 组件已挂载')
  console.log('当前URL:', window.location.href)
  console.log('路由参数:', route.query)
  
  // 检查URL中是否直接包含code参数（直接访问而非通过app）
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const state = urlParams.get('state')
  
  if (code && state) {
    console.log('检测到微信授权回调参数')
    
    // 如果不在正确的应用路径下
    if (window.location.pathname.includes('/Tapp/app-vue/')) {
      // 如果是在开发环境中直接被访问，重定向到正确的URL
      const redirectUrl = `/app/#/wechat-callback-install?code=${code}&state=${state}`
      console.log('重定向到正确的应用路径:', redirectUrl)
      window.location.href = redirectUrl
      return
    }
  }
  
  handleCallback()
})

onBeforeUnmount(() => {
  if (progressTimer) {
    clearInterval(progressTimer)
  }
})
</script>

<style scoped>
.wechat-callback-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f7f8fa;
}

.callback-content {
  width: 85%;
  max-width: 360px;
  padding: 40px 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.loading-wrapper, .error-wrapper, .success-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-text, .error-text, .success-text {
  margin-top: 24px;
  font-size: 16px;
  color: #323233;
  line-height: 1.5;
}

.error-text {
  color: #ee0a24;
}

.success-text {
  color: #07c160;
}

.loading-progress {
  width: 80%;
  height: 4px;
  background-color: #f2f3f5;
  border-radius: 2px;
  margin-top: 30px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #07c160;
  border-radius: 2px;
  transition: width 0.2s;
}

.retry-btn {
  margin-top: 30px;
  width: 140px;
}
</style>
