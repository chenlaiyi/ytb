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
        <div class="error-detail" v-if="errorDetail">{{ errorDetail }}</div>
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
import { wechatLoginCallback } from '@/api/mobile'
import { useUserStore } from '@/stores/user'
import { bindReferrer } from '@/api/vipRecruit'
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
const errorDetail = ref('')
const successMessage = ref('')
const progressWidth = ref(0)
const debugInfo = ref(null)
const redirectTarget = ref('/user')
const REDIRECT_CACHE_PREFIX = 'forum_redirect:'

if (typeof window !== 'undefined') {
  try {
    const cachedRedirect = sessionStorage.getItem('wechat_post_login_redirect')
    if (cachedRedirect) {
      redirectTarget.value = cachedRedirect.startsWith('/') ? cachedRedirect : `/${cachedRedirect}`
      sessionStorage.removeItem('wechat_post_login_redirect')
    }
  } catch (error) {
    console.warn('[WechatCallback] 读取缓存重定向失败', error)
  }
}

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

const resolveRedirectState = (stateValue) => {
  if (!stateValue) return
  let decoded = stateValue
  for (let i = 0; i < 2; i += 1) {
    try {
      decoded = decodeURIComponent(decoded)
    } catch (error) {
      break
    }
  }

  if (!decoded || !decoded.startsWith('FORUM|')) {
    if (!decoded || !decoded.startsWith('FORUM2|')) {
      return
    }
  }

  const segments = decoded.split('|')

  if (segments[0] === 'FORUM2') {
    const mode = segments[1]
    let target = '/forum'

    if (mode === 'd') {
      const encodedTarget = segments[2] || ''
      try {
        target = decodeURIComponent(encodedTarget) || '/forum'
      } catch (error) {
        target = encodedTarget || '/forum'
      }
    } else if (mode === 'k') {
      const key = segments[2]
      if (key) {
        try {
          const cached = localStorage.getItem(`${REDIRECT_CACHE_PREFIX}${key}`)
          if (cached) {
            target = cached
            localStorage.removeItem(`${REDIRECT_CACHE_PREFIX}${key}`)
          }
        } catch (error) {
          console.warn('[WechatCallback] 读取重定向缓存失败', error)
        }
      }
    } else if (segments.length > 2) {
      // 兼容意外格式
      const fallback = segments[2] || segments[1]
      try {
        target = decodeURIComponent(fallback || '') || '/forum'
      } catch (error) {
        target = fallback || '/forum'
      }
    }

    if (target.startsWith('#/')) {
      target = target.slice(1)
    }

    if (!target.startsWith('/')) {
      target = `/${target.replace(/^#?/, '')}`
    }

    redirectTarget.value = target || '/forum'
    return
  }

  if (segments.length < 2) {
    return
  }

  let target = segments[1] || '/forum'
  try {
    target = decodeURIComponent(target)
  } catch (error) {
    // ignore decode errors
  }

  if (target.startsWith('#/')) {
    target = target.slice(1)
  }

  if (!target.startsWith('/')) {
    target = `/${target.replace(/^#?/, '')}`
  }

  redirectTarget.value = target || '/forum'
}

const navigateToRedirectTarget = () => {
  try {
    sessionStorage.removeItem('wechat_oauth_last_key')
  } catch (error) {
    console.warn('[WechatCallback] 清理微信OAuth标记失败', error)
  }

  const target = redirectTarget.value || '/user'

  if (target.startsWith('http')) {
    window.location.href = target
    return
  }

  let path = target
  if (path.startsWith('#/')) {
    path = path.slice(1)
  }

  if (!path.startsWith('/')) {
    path = `/${path.replace(/^#?/, '')}`
  }

  const host = window.location.host

  if (host.includes('pay.itapgo.com')) {
    window.location.href = `${window.location.origin}/app/#${path}`
  } else {
    router.replace(path)
  }
}

// 处理微信登录回调
const handleCallback = async () => {
  initProgressBar()

  // === 新增：处理来自 pay.itapgo.com OAuth代理的直接token ===
  let directToken = route.query.token
  let directUser = route.query.user
  let directRedirect = route.query.redirect

  if (!directToken) {
    const hashIndex = window.location.hash.indexOf('?')
    if (hashIndex > -1) {
      const hashParams = new URLSearchParams(window.location.hash.substring(hashIndex + 1))
      directToken = hashParams.get('token')
      directUser = hashParams.get('user')
      directRedirect = hashParams.get('redirect')
    }
  }

  if (directToken) {
    try {
      loadingText.value = '正在处理登录...'
      
      // 解析用户数据
      let userData = {}
      if (directUser) {
        try {
          userData = JSON.parse(atob(decodeURIComponent(directUser)))
        } catch (e) {
          console.warn('解析用户数据失败:', e)
        }
      }

      // 设置重定向目标
      if (directRedirect) {
        let target = decodeURIComponent(directRedirect)
        // /home 在 YTB standalone 模式下不存在，映射到 /devices
        if (target === '/home') target = '/devices'
        redirectTarget.value = target
      } else {
        redirectTarget.value = '/devices'
      }

      // 保存登录状态
      localStorage.setItem('token', directToken)
      localStorage.setItem('userInfo', JSON.stringify(userData))
      localStorage.setItem('ytb_token', directToken)
      localStorage.setItem('ytb_user', JSON.stringify(userData))
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('fromWechatLogin', 'true')
      localStorage.setItem('loginTimestamp', Date.now().toString())

      // 更新 store
      userStore.setToken(directToken)
      userStore.setUserInfo(userData)

      // 使用认证工具保存
      try {
        const authModule = await import('@/utils/auth')
        authModule.setAuthData(directToken, userData)
      } catch (e) {
        console.warn('auth module 保存失败:', e)
      }

      completeProgress()
      showSuccess('登录成功，正在为您跳转...')

      setTimeout(() => {
        navigateToRedirectTarget()
      }, 800)
      return
    } catch (error) {
      console.error('处理代理登录回调失败:', error)
      showError('登录处理失败，请重试')
      return
    }
  }
  // === 直接token处理结束 ===

  let code = null, state = null;

  try {
    // 从URL参数中获取code和state
    code = route.query.code
    state = route.query.state

    // 如果路由参数中没有，尝试从URL中直接获取
    if (!code) {
      const urlParams = new URLSearchParams(window.location.search)
      code = urlParams.get('code')
    }

    if (!state) {
      const urlParams = new URLSearchParams(window.location.search)
      state = urlParams.get('state')
    }

    // 如果还是没有code，尝试从hash部分获取
    if (!code) {
      const hashIndex = window.location.hash.indexOf('?');
      if (hashIndex > -1) {
        const hashParams = new URLSearchParams(window.location.hash.substring(hashIndex + 1));
        code = hashParams.get('code');
      }
    }

    if (!state) {
      const hashIndex = window.location.hash.indexOf('?');
      if (hashIndex > -1) {
        const hashParams = new URLSearchParams(window.location.hash.substring(hashIndex + 1));
        state = hashParams.get('state');
      }
    }

    if (!code) {
      showError('微信授权失败，缺少授权码', '请检查URL中是否包含code参数')
      return
    }

    resolveRedirectState(state)
  } catch (error) {
    showError('处理微信回调参数时出错', error.message)
    return
  }

  try {
    loadingText.value = '正在验证授权...'

    // 清除所有可能影响认证的数据
    localStorage.removeItem('userInfo')
    localStorage.removeItem('tempUserInfo')
    localStorage.removeItem('token')

    // 构建回调参数
    const callbackParams = {
      code,
      state,
      version: '1.0.409',
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    }

    try {
      loadingText.value = '正在连接服务器...'

      // 确保请求参数完整
      const enhancedParams = {
        ...callbackParams,
        timestamp: Date.now(),
        _t: Date.now(),
        _r: Math.floor(Math.random() * 1000)
      }

      // 调用API处理微信登录
      loadingText.value = '正在验证微信授权...'
      const res = await wechatLoginCallback(enhancedParams)

      if (res.code === 0) {
        completeProgress()

        // 确保用户数据存在
        if (!res.data) {
          showError('登录数据异常，请重试')
          return
        }

        // 确保token存在
        if (!res.data.token) {
          showError('登录凭证异常，请重试')
          return
        }

        // 处理用户信息并确保正确的ID字段名
        const userData = { ...res.data.user }
        const token = res.data.token

        // 确保token和用户数据存在
        if (!token || !userData) {
          console.error('未获取到有效token或用户数据')
          showError('登录数据不完整，请重试')
          return
        }

        // 使用新的认证工具保存登录状态
        console.log('🔐 准备保存登录状态 - 微信回调')
        try {
          const authModule = await import('@/utils/auth')
          const success = authModule.setAuthData(token, userData)
          
          if (!success) {
            console.error('❌ 保存登录状态失败')
            showError('保存登录状态失败，请重试')
            return
          }
          
          console.log('✅ 微信登录状态保存成功')
          
          // 验证保存是否成功
          const savedToken = authModule.getToken()
          const savedUserInfo = authModule.getUserInfo()
          console.log('🔍 验证保存结果:', {
            tokenSaved: !!savedToken,
            userInfoSaved: !!savedUserInfo,
            userId: savedUserInfo?.id || savedUserInfo?.userId
          })
          
        } catch (authError) {
          console.error('❌ 保存认证数据时出错:', authError)
          showError('保存登录凭证失败，请重试')
          return
        }

        // 确保用户ID字段命名一致 - 解决客户端与服务器ID不一致问题
        if (userData.id && !userData.userId) {
          userData.userId = userData.id
          console.log('用户ID统一: 使用id设置userId', userData.id)
        } else if (userData.userId && !userData.id) {
          userData.id = userData.userId
          console.log('用户ID统一: 使用userId设置id', userData.userId)
        }

        // 确保微信头像URL是可访问的
        if (userData.wechat_avatar && !userData.wechat_avatar.startsWith('http')) {
          userData.wechat_avatar = 'https://pay.itapgo.com' + userData.wechat_avatar
        }

        // 角色设置 - 特殊规则
        // 1. 确保业务员角色默认为1
        if (userData.is_salesman !== 0 && userData.is_salesman !== '0') {
          userData.is_salesman = 1
        }

        // 2. 确保VIP状态正确 - 只使用is_vip字段
        if (userData.is_vip !== 1 && userData.is_vip !== '1') {
          userData.is_vip = 0
        } else {
          userData.is_vip = 1
          console.log('检测到is_vip=1，确认VIP状态')
        }

        // 3. 其他角色默认为0
        ['is_pay_institution', 'is_water_purifier_user', 'is_engineer',
         'is_water_purifier_agent', 'is_pay_merchant', 'is_admin'].forEach(role => {
          if (userData[role] !== 1 && userData[role] !== '1') {
            userData[role] = 0
          } else {
            userData[role] = 1
          }
        })

        console.log('角色处理完成:', {
          is_salesman: userData.is_salesman,
          is_vip: userData.is_vip
        })

        // 清除之前可能存在的用户信息
        localStorage.removeItem('userInfo')

        // 立即保存数据，不使用延迟
        try {
          // 存储token到localStorage - 优先保存token
          localStorage.setItem('token', token)
          
          // 存储用户信息到localStorage
          const userInfoString = JSON.stringify(userData)
          localStorage.setItem('userInfo', userInfoString)

          console.log('用户信息已保存到localStorage:', userInfoString.substring(0, 100) + '...')

          // 设置token到store - 关键修复
          userStore.setToken(token)
          
          // 设置用户信息到store
          userStore.setUserInfo(userData)

          // 设置额外的登录状态标记
          localStorage.setItem('isLoggedIn', 'true')
          localStorage.setItem('fromWechatLogin', 'true')
          localStorage.setItem('loginTimestamp', Date.now().toString())

          // 强制刷新用户存储数据 - 确保store与localStorage同步
          const refreshSuccess = userStore.refreshUserData()
          console.log('用户存储刷新结果:', refreshSuccess ? '成功' : '失败')

          // 增加额外确认
          console.log('确认登录数据已正确保存:', {
            localStorage: localStorage.getItem('userInfo') ? '已设置' : '未设置',
            localStorageToken: localStorage.getItem('token') ? '已设置' : '未设置',
            storeHasUser: userStore.userInfo && userStore.userInfo.userId ? '已设置' : '未设置',
            storeHasToken: userStore.token ? '已设置' : '未设置',
            storeIsLoggedIn: userStore.isLoggedIn ? '已登录' : '未登录',
            userId: userStore.userInfo ? userStore.userInfo.userId : '未设置'
          })
        } catch (userDataError) {
          console.error('保存用户数据失败:', userDataError)
          showError('保存登录信息失败，请重试')
          return
        }

        // 不再强制绑定手机号，直接登录成功
        const needBindPhone = false; // 改为false，不再强制绑定手机号

        if (needBindPhone) {
          showSuccess('授权成功，正在跳转到手机号绑定页面...')

          // 构建完整的临时用户数据
          const tempUserData = {
            // 基本用户信息
            id: userData.id || userData.userId,
            userId: userData.id || userData.userId,
            
            // 微信相关信息
            openid: res.data.openid || userData.openid || userData.open_id,
            unionid: res.data.unionid || userData.unionid,
            
            // 微信昵称
            wechat_nickname: res.data.nickname || userData.wechat_nickname || userData.nickname || userData.name,
            nickname: res.data.nickname || userData.wechat_nickname || userData.nickname || userData.name,
            
            // 微信头像
            wechat_avatar: res.data.headimgurl || userData.wechat_avatar || userData.avatar,
            avatar: res.data.headimgurl || userData.wechat_avatar || userData.avatar,
            
            // 绑定流程标识
            fromWechatLogin: true,
            needBindPhone: true,
            bindTimestamp: Date.now(),
            
            // 其他用户信息
            ...userData
          }

          // 保存到localStorage
          localStorage.setItem('tempUserInfo', JSON.stringify(tempUserData))
          localStorage.setItem('needBindPhone', 'true')
          localStorage.setItem('wechatLoginFlow', 'true')
          
          // 额外保存一份备份数据，防止数据丢失
          localStorage.setItem('wechatUserBackup', JSON.stringify({
            nickname: res.data.nickname,
            headimgurl: res.data.headimgurl,
            openid: res.data.openid,
            timestamp: Date.now()
          }))
          
          // 保存到store
          userStore.setTempUserInfo(tempUserData)

          setTimeout(() => {
            // 跳转到绑定页面
            if (window.location.host.includes('pay.itapgo.com')) {
              window.location.href = 'https://pay.itapgo.com/app/#/bind-phone'
            } else {
              window.location.href = '/#/bind-phone'
            }
          }, 1500)
        } else {
          showSuccess('登录成功，正在为您跳转...')

          // 增加延迟以确保数据更新
          setTimeout(() => {
            try {
              // 强制写入sessionStorage用于跨页面传递
              sessionStorage.setItem('token', localStorage.getItem('token'))
              sessionStorage.setItem('userInfo', localStorage.getItem('userInfo'))
              sessionStorage.setItem('login_timestamp', Date.now().toString())

              // 保存标记，指示用户是从微信登录过来的
              localStorage.setItem('fromWechatLogin', 'true')
              localStorage.setItem('wechatLoginTimestamp', Date.now().toString())

              // 在跳转前再强制设置一次
              try {
                const tokenData = token || localStorage.getItem('token')
                if (tokenData) {
                  document.cookie = `auth_token=${encodeURIComponent(tokenData)}; path=/; max-age=86400`
                }
              } catch (cookieError) {
                // 静默处理cookie设置失败
              }

              // 生成一个验证码，同时存储在localStorage和sessionStorage
              const verifyCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
              localStorage.setItem('login_verify_code', verifyCode)
              sessionStorage.setItem('login_verify_code', verifyCode)
              
              // 确保用户认证状态已正确设置
              try {
                import('@/utils/auth').then((authModule) => {
                  authModule.setAuthData(token, userData)
                }).catch((authError) => {
                  console.error('设置认证数据时出错:', authError)
                })
              } catch (authError) {
                console.error('设置认证数据时出错:', authError)
              }

              // 登录完成，跳转到目标页面
              console.log('准备跳转到目标页面:', redirectTarget.value)

              // 强制设置登录状态标记
              localStorage.setItem('isLoggedIn', 'true')
              sessionStorage.setItem('isLoggedIn', 'true')

              navigateToRedirectTarget()
            } catch (e) {
              console.error('重定向过程中发生错误:', e)
              // 备用跳转方式
              console.log('使用备用跳转方式')
              localStorage.setItem('isLoggedIn', 'true')
              sessionStorage.setItem('isLoggedIn', 'true')
              navigateToRedirectTarget()
            }
          }, 800) // 减少到0.8秒，加快跳转速度
        }
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
const showError = (message, detail = '') => {
  completeProgress()
  loadingText.value = '处理失败'
  errorMessage.value = message
  errorDetail.value = detail

  // 记录错误到控制台
  console.error('微信登录错误:', message, detail)

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
  const target = redirectTarget.value
  const loginPath = target && target.startsWith('/forum') ? '/forum/login' : '/login'

  if (host.includes('pay.itapgo.com')) {
    window.location.href = `/app/#${loginPath}`
  } else {
    router.replace(loginPath)
  }
}

// 处理自动绑定推荐关系
const handleAutoBindReferrer = async (targetPath, redirectUrl) => {
  console.log('🔍 开始处理自动绑定推荐关系...')
  console.log('目标路径:', targetPath)
  console.log('当前用户:', userStore.user)

  try {
    // 检查目标路径是否是VIP招募页面
    if (!targetPath || !targetPath.includes('/vip/recruit-landing/')) {
      console.log('❌ 不是VIP招募页面，跳过自动绑定推荐关系')
      console.log('目标路径不包含 /vip/recruit-landing/')
      return
    }

    console.log('✅ 检测到VIP招募页面')

    // 从路径中提取推荐人ID
    const match = targetPath.match(/\/vip\/recruit-landing\/(\d+)/)
    if (!match || !match[1]) {
      console.log('❌ 无法从路径中提取推荐人ID:', targetPath)
      return
    }

    const referrerId = parseInt(match[1])
    console.log('✅ 提取到推荐人ID:', referrerId)

    // 检查用户是否已经有推荐人
    const currentUser = userStore.user
    if (currentUser && currentUser.referrer_id > 0) {
      console.log('⚠️ 用户已有推荐人，推荐人ID:', currentUser.referrer_id)
      if (currentUser.referrer_id === referrerId) {
        console.log('✅ 推荐人ID匹配，无需重复绑定')
        showSuccess('您已经是该用户的下级，正在跳转...')
      } else {
        console.log('⚠️ 推荐人ID不匹配，当前推荐人:', currentUser.referrer_id, '新推荐人:', referrerId)
        showSuccess('您已有其他推荐人，正在跳转...')
      }
      return
    }

    // 自动绑定推荐关系
    console.log('🔄 开始自动绑定推荐关系...')
    showSuccess('正在自动接受邀请...')

    const bindRes = await bindReferrer({
      referrer_id: referrerId,
      bind_type: 'auto_login' // 标记为登录时自动绑定
    })

    console.log('📡 绑定API响应:', bindRes)

    if (bindRes.code === 0) {
      console.log('✅ 自动绑定推荐关系成功:', bindRes.data)

      // 更新用户信息中的推荐人ID
      const updatedUser = { ...currentUser, referrer_id: referrerId }
      userStore.setUserInfo(updatedUser)
      console.log('✅ 用户信息已更新:', updatedUser)

      // 显示成功提示
      showSuccess('邀请接受成功！正在跳转到VIP升级页面...')
    } else {
      console.log('❌ 自动绑定推荐关系失败:', bindRes.message)
      showSuccess('登录成功，正在跳转...')
    }
  } catch (error) {
    console.error('❌ 自动绑定推荐关系异常:', error)
    showSuccess('登录成功，正在跳转...')
    // 不阻断正常流程，静默处理错误
  }
}

onMounted(() => {
  // 检查各种可能的参数来源
  let code = null;
  let state = null;

  // 1. 检查URL查询参数
  const urlParams = new URLSearchParams(window.location.search);
  code = urlParams.get('code');
  state = urlParams.get('state');

  // 2. 如果没有，检查路由参数
  if (!code && route.query.code) {
    code = route.query.code;
  }

  if (!state && route.query.state) {
    state = route.query.state;
  }

  // 3. 如果还没有，检查hash部分
  if (!code) {
    const hashIndex = window.location.hash.indexOf('?');
    if (hashIndex > -1) {
      const hashParams = new URLSearchParams(window.location.hash.substring(hashIndex + 1));
      code = hashParams.get('code');

      if (!state) {
        state = hashParams.get('state');
      }
    }
  }

  if (route.query.source === 'install') {
    const nextQuery = { ...route.query };
    delete nextQuery.source;
    if (code) {
      nextQuery.code = code;
    }
    if (state) {
      nextQuery.state = state;
    }
    router.replace({
      path: '/installation/wechat-callback',
      query: nextQuery
    });
    return;
  }

  // 特别处理生产环境下的路径问题
  if (code) {
    // 检查当前URL是否正确
    const currentPath = window.location.pathname + window.location.hash;
    const isCorrectPath = currentPath.includes('/app/#/user/wechat-callback') || 
                         currentPath.includes('/app/#/wechat-callback');
    
    if (!isCorrectPath) {
      // 重定向到正确的URL
      const redirectUrl = `/app/#/user/wechat-callback?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ''}`;
      console.log('重定向到正确的回调URL:', redirectUrl);
      window.location.replace(redirectUrl);
      return;
    }
  }

  // 处理回调
  handleCallback();
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

.error-detail {
  margin-top: 10px;
  font-size: 14px;
  color: #969799;
  max-width: 100%;
  word-break: break-word;
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
