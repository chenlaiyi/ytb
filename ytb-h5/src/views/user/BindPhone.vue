<template>
  <div class="bind-phone-container">
    <NavBar
      title="绑定手机号"
      left-text="返回"
      left-arrow
      @click-left="handleBack"
      fixed
      placeholder
    />

    <div class="bind-phone-content">
      <div class="bind-phone-header">
        <template v-if="userInfo.wechat_avatar || userInfo.avatar">
          <img
            :src="userInfo.wechat_avatar || userInfo.avatar"
            alt="头像"
            class="user-avatar"
            @error="handleAvatarError"
          />
        </template>
        <div v-else class="avatar-fallback">头像</div>
        <div class="bind-phone-title">您好，{{ userInfo.wechat_nickname || userInfo.nickname || '新用户' }}</div>
        <div class="bind-phone-desc">为了提供更好的服务，请绑定手机号</div>
      </div>

      <div class="bind-steps">
        <div class="step-item completed">
          <div class="step-icon">1</div>
          <div class="step-label">微信授权</div>
        </div>
        <div class="step-line"></div>
        <div class="step-item active">
          <div class="step-icon">2</div>
          <div class="step-label">绑定手机</div>
        </div>
        <div class="step-line"></div>
        <div class="step-item">
          <div class="step-icon">3</div>
          <div class="step-label">角色分配</div>
        </div>
      </div>

      <van-form @submit="onSubmit" class="bind-form">
        <Field
          v-model="bindForm.phone"
          name="phone"
          placeholder="请输入手机号"
          :rules="[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
          ]"
        >
          <template #left-icon>
            <Icon name="phone-o" />
          </template>
        </Field>

        <Field
          v-model="bindForm.code"
          name="code"
          placeholder="请输入验证码"
          :rules="[{ required: true, message: '请输入验证码' }]"
        >
          <template #left-icon>
            <Icon name="comment-o" />
          </template>
          <template #button>
            <Button
              size="small"
              type="primary"
              :disabled="!!cooldown"
              @click="handleSendSms"
            >
              {{ cooldown ? `${cooldown}s` : '获取验证码' }}
            </Button>
          </template>
        </Field>

        <div class="form-actions">
          <Button round block type="primary" native-type="submit" :loading="loading" :disabled="!agreePolicy">
            绑定并继续
          </Button>
        </div>
      </van-form>

      <div class="bind-advantages">
        <div class="advantages-title">绑定手机号的好处</div>
        <div class="advantage-item">
          <Icon name="checked" color="#07c160" />
          <span>自动获取您在其他系统的角色和权限</span>
        </div>
        <div class="advantage-item">
          <Icon name="checked" color="#07c160" />
          <span>账号安全保障，方便找回密码</span>
        </div>
        <div class="advantage-item">
          <Icon name="checked" color="#07c160" />
          <span>接收重要通知和提醒</span>
        </div>
      </div>

      <div class="bind-policy">
        <Checkbox v-model="agreePolicy" icon-size="14px" checked-color="#1989fa">
          <span class="policy-text">我已阅读并同意</span>
        </Checkbox>
        <span class="policy-link" @click.stop="openAgreement">《用户协议》</span>和
        <span class="policy-link" @click.stop="openPrivacy">《隐私政策》</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Field, Button, Icon, Dialog, Checkbox } from 'vant'
import { bindPhone, sendSmsCode, getUserInfo, syncUserRoles } from '@/api/user'
import { useUserStore } from '@/stores/user'
// 使用修复版的Toast
import Toast from '@/utils/toast-fix'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const cooldown = ref(0)
const agreePolicy = ref(false)  // 隐私政策同意状态
let timer = null

const userInfo = ref({
  nickname: '',
  wechat_nickname: '',
  avatar: '',
  wechat_avatar: ''
})

const bindForm = reactive({
  phone: '',
  code: ''
})

const ROLE_LABELS = {
  is_pay_institution: '支付机构',
  is_pay_merchant: '支付商户',
  is_water_purifier_user: '净水器用户',
  is_water_purifier_agent: '净水器代理商',
  is_engineer: '售后工程师',
  is_salesman: '渠道业务员',
  is_vip: 'VIP会员'
}

const extractRoleNames = (info = {}) => {
  const names = []
  Object.entries(ROLE_LABELS).forEach(([field, label]) => {
    if (info[field] === 1 || info[field] === true) {
      names.push(label)
    }
  })
  return names
}

const matchUserRoles = async () => {
  try {
    const res = await syncUserRoles()
    if (res?.code === 0) {
      if (res.data?.user) {
        userStore.setUserInfo(res.data.user)
      }
      return res.data?.matched_roles || res.data?.all_roles || []
    }
  } catch (error) {
    console.error('角色匹配失败', error)
  }
  return []
}

// 头像加载错误处理
const handleAvatarError = (e) => {
  console.log('头像加载失败，使用默认头像样式')
  // 替换为内联样式的默认头像，而不是新建元素
  e.target.style.display = 'none'

  // 创建一个默认头像元素或使用已有的
  let fallback = e.target.parentNode.querySelector('.avatar-fallback')
  if (!fallback) {
    fallback = document.createElement('div')
    fallback.className = 'avatar-fallback'
    fallback.textContent = '头像'
    e.target.parentNode.appendChild(fallback)
  } else {
    // 如果已存在，则显示它
    fallback.style.display = 'flex'
  }
}

// 返回处理
const handleBack = () => {
  // 使用Toast的confirm方法代替Dialog.confirm
  Toast.confirm({
    title: '确认提示',
    message: '离开此页面将中断绑定流程，确定要返回吗？',
    confirmButtonText: '确认返回',
    cancelButtonText: '继续绑定'
  }).then(() => {
    router.back()
  }).catch(() => {
    // 取消返回，继续当前页面
  })
}

// 获取用户基本信息
const fetchUserInfo = async () => {
  try {
    console.log('开始获取用户信息...')
    
    // 优先使用临时用户信息
    try {
      const tempUserInfo = JSON.parse(localStorage.getItem('tempUserInfo') || '{}')
      console.log('从tempUserInfo加载用户信息:', tempUserInfo)

      if (tempUserInfo && Object.keys(tempUserInfo).length > 0) {
        // 默认头像URL
        const defaultAvatar = 'https://pay.itapgo.com/app/assets/images/default-avatar.png'

        // 确保微信头像URL是可访问的
        let wechatAvatar = tempUserInfo.wechat_avatar || tempUserInfo.avatar || defaultAvatar
        if (wechatAvatar && !wechatAvatar.startsWith('http')) {
          wechatAvatar = 'https://pay.itapgo.com' + wechatAvatar
        }

        // 获取昵称，优先使用微信昵称
        const displayName = tempUserInfo.wechat_nickname || 
                           tempUserInfo.nickname || 
                           tempUserInfo.name || 
                           '微信用户'

        userInfo.value = {
          ...tempUserInfo,
          nickname: displayName,
          wechat_nickname: displayName,
          wechat_avatar: wechatAvatar,
          avatar: wechatAvatar
        }

        console.log('成功使用临时用户信息:', {
          nickname: userInfo.value.nickname,
          wechat_nickname: userInfo.value.wechat_nickname,
          wechat_avatar: userInfo.value.wechat_avatar,
          avatar: userInfo.value.avatar
        })
        return;
      }
    } catch (e) {
      console.error('解析临时用户信息失败:', e)
    }

    // 如果临时用户信息不可用，尝试使用备份数据
    try {
      const backupData = JSON.parse(localStorage.getItem('wechatUserBackup') || '{}')
      console.log('尝试使用备份数据:', backupData)
      
      if (backupData && backupData.nickname && backupData.headimgurl) {
        userInfo.value = {
          nickname: backupData.nickname,
          wechat_nickname: backupData.nickname,
          wechat_avatar: backupData.headimgurl,
          avatar: backupData.headimgurl,
          openid: backupData.openid
        }
        
        console.log('成功使用备份数据:', userInfo.value)
        return;
      }
    } catch (e) {
      console.error('解析备份数据失败:', e)
    }

    // 从localStorage获取数据
    try {
      const storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      if (storedUserInfo && (storedUserInfo.wechat_nickname || storedUserInfo.nickname)) {
        console.log('从localStorage加载用户信息:', storedUserInfo)

        // 确保微信头像URL是可访问的
        let wechatAvatar = storedUserInfo.wechat_avatar || storedUserInfo.avatar || ''
        if (wechatAvatar && !wechatAvatar.startsWith('http')) {
          wechatAvatar = 'https://pay.itapgo.com' + wechatAvatar
        }

        userInfo.value = {
          ...storedUserInfo,
          nickname: storedUserInfo.wechat_nickname || storedUserInfo.nickname || storedUserInfo.name || '新用户',
          wechat_avatar: wechatAvatar
        }
        
        console.log('成功使用localStorage数据:', userInfo.value)
        return;
      }
    } catch (e) {
      console.error('解析localStorage用户信息失败:', e)
    }

    // 从userStore获取数据
    const storeUserInfo = userStore.userInfo
    if (storeUserInfo && (storeUserInfo.wechat_nickname || storeUserInfo.nickname)) {
      console.log('从Store加载用户信息:', storeUserInfo)

      // 确保微信头像URL是可访问的
      let wechatAvatar = storeUserInfo.wechat_avatar || storeUserInfo.avatar || ''
      if (wechatAvatar && !wechatAvatar.startsWith('http')) {
        wechatAvatar = 'https://pay.itapgo.com' + wechatAvatar
      }

      userInfo.value = {
        ...storeUserInfo,
        nickname: storeUserInfo.wechat_nickname || storeUserInfo.nickname || storeUserInfo.name || '新用户',
        wechat_avatar: wechatAvatar
      }
      
      console.log('成功使用Store数据:', userInfo.value)
      return;
    }

    console.log('所有数据源都无法获取用户信息，使用默认值')
    userInfo.value = {
      nickname: '微信用户',
      wechat_nickname: '微信用户',
      wechat_avatar: 'https://pay.itapgo.com/app/assets/images/default-avatar.png',
      avatar: 'https://pay.itapgo.com/app/assets/images/default-avatar.png'
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    // 设置默认值
    userInfo.value = {
      nickname: '微信用户',
      wechat_nickname: '微信用户',
      wechat_avatar: 'https://pay.itapgo.com/app/assets/images/default-avatar.png',
      avatar: 'https://pay.itapgo.com/app/assets/images/default-avatar.png'
    }
  }
}

// 发送短信验证码
const handleSendSms = async () => {
  if (!bindForm.phone) {
    Toast({ type: 'fail', message: '请输入手机号' })
    return
  }

  // 验证手机号
  if (!/^1[3-9]\d{9}$/.test(bindForm.phone)) {
    Toast({ type: 'fail', message: '请输入正确的手机号' })
    return
  }

  try {
    console.log('准备发送验证码到:', bindForm.phone)

    // 显示发送中状态
    const loadingToast = Toast.loading('验证码发送中...')

    // 使用正确的API路径及参数格式，添加channel参数
    const res = await sendSmsCode({
      phone: bindForm.phone,
      type: 'bind',
      channel: 'aliyun' // 明确指定channel参数
    })

    // 关闭loading提示
    Toast.clear()

    console.log('短信验证码发送响应:', res)

    if (res && res.code === 0) {
      // 使用醒目的成功提示
      Toast.success({
        message: '验证码已发送',
        duration: 2000
      })

      // 开始倒计时
      cooldown.value = 60
      timer = setInterval(() => {
        cooldown.value--
        if (cooldown.value <= 0) {
          clearInterval(timer)
          timer = null
        }
      }, 1000)
    } else {
      Toast({ type: 'fail', message: res && res.message ? res.message : '验证码发送失败' })
    }
  } catch (error) {
    // 确保loading提示被清除
    Toast.clear()

    console.error('发送验证码失败', error)

    // 提供更具体的错误信息
    if (error.response) {
      console.error('错误响应:', error.response.data)
      Toast({ type: 'fail', message: `发送失败: ${error.response.status}` })
    } else if (error.request) {
      Toast({ type: 'fail', message: '网络错误，请检查网络连接' })
    } else {
      Toast({ type: 'fail', message: error.message || '发送失败，请稍后重试' })
    }
  }
}

// 处理角色分配成功的对话框
const showRoleAssignmentDialog = (roles = []) => {
  const message = roles.length
    ? `系统已为您匹配到以下角色：\n${roles.map((role) => `• ${role}`).join('\n')}`
    : '绑定成功，暂未匹配到新的角色，您可在个人中心继续完善资料。'

  return Dialog.alert({
    title: '绑定成功',
    message,
    confirmButtonText: '进入个人中心',
    confirmButtonColor: '#ff4d55'
  })
}

const redirectToUserCenter = () => {
  const host = window.location.host
  const target = host.includes('pay.itapgo.com') ? 'https://pay.itapgo.com/app/#/user' : '/#/user'
  window.location.href = `${target}?refresh=${Date.now()}`
}

// 提交绑定
const onSubmit = async () => {
  // 检查隐私政策同意状态
  if (!agreePolicy.value) {
    Toast({ type: 'fail', message: '请先阅读并同意用户协议和隐私政策' })
    return
  }
  
  loading.value = true
  try {
    console.log('提交绑定手机号:', bindForm)
    const res = await bindPhone(bindForm)
    console.log('绑定手机号响应:', res)

    if (res.code === 0) {
      Toast.success('绑定成功')

      localStorage.removeItem('tempUserInfo')
      localStorage.removeItem('needBindPhone')

      if (res.data) {
        const userData = res.data.user || res.data
        if (userData.wechat_avatar && !userData.wechat_avatar.startsWith('http')) {
          userData.wechat_avatar = 'https://pay.itapgo.com' + userData.wechat_avatar
        }
        userStore.setUserInfo(userData)
      }

      const matchedRoles = await matchUserRoles()
      await userStore.fetchUserInfo({ forceRefresh: true }).catch(() => {})
      const rolesToShow = matchedRoles.length ? matchedRoles : extractRoleNames(userStore.userInfo || {})

      await showRoleAssignmentDialog(rolesToShow)
      redirectToUserCenter()
    } else {
      console.error('绑定失败，服务器返回错误:', res);
      Toast({ type: 'fail', message: res.message || '绑定失败，请重试' });
    }
  } catch (error) {
    console.error('绑定手机号失败', error);

    // 提供更详细的错误信息
    if (error.response) {
      console.error('错误响应数据:', error.response.data);
      Toast({ type: 'fail', message: `绑定失败: ${error.response.status} - ${error.response.data.message || '请重试'}` });
    } else if (error.request) {
      Toast({ type: 'fail', message: '网络错误，请检查网络连接后重试' });
    } else {
      Toast({ type: 'fail', message: error.message || '绑定失败，请稍后再试' });
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  console.log('绑定手机号页面加载')
  
  // 获取临时用户信息
  const tempUserInfo = JSON.parse(localStorage.getItem('tempUserInfo') || '{}')
  console.log('临时用户信息:', tempUserInfo)

  // 简单检查：只要有任何用户标识就允许继续绑定流程
  const hasUserIdentity = (
    tempUserInfo.id ||
    tempUserInfo.userId ||
    tempUserInfo.openid ||
    tempUserInfo.wechat_nickname ||
    tempUserInfo.nickname ||
    localStorage.getItem('needBindPhone') === 'true' ||
    localStorage.getItem('wechatLoginFlow') === 'true'
  )

  console.log('用户身份验证:', {
    hasUserIdentity,
    tempUserInfo: !!Object.keys(tempUserInfo).length,
    needBindPhone: localStorage.getItem('needBindPhone'),
    wechatLoginFlow: localStorage.getItem('wechatLoginFlow')
  })

  if (!hasUserIdentity) {
    console.log('没有用户身份信息，跳转到登录页面')
    Toast({ type: 'fail', message: '登录信息不完整，请重新登录' })

    setTimeout(() => {
      const host = window.location.host
      if (host.includes('pay.itapgo.com')) {
        window.location.href = 'https://pay.itapgo.com/app/#/login'
      } else {
        router.replace('/login')
      }
    }, 1500)
    return
  }

  console.log('用户身份验证通过，继续绑定流程')

  // 加载用户信息
  fetchUserInfo()

  // 隐藏底部导航
  const tabbarElements = document.querySelectorAll('.van-tabbar, .tab-bar-container')
  tabbarElements.forEach(el => {
    if (el) {
      el.style.display = 'none'
    }
  })
})

// 组件卸载前清除定时器
onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})

// 打开用户协议
const openAgreement = () => {
  router.push('/user/settings/agreement')
}

// 打开隐私政策
const openPrivacy = () => {
  router.push('/user/settings/privacy-policy')
}
</script>

<style scoped>
.bind-phone-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.bind-phone-content {
  padding: 20px;
}

.bind-phone-header {
  text-align: center;
  margin: 20px 0 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 16px;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  object-fit: cover;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 16px;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: #f2f3f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 16px;
}

.avatar-fallback {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 16px;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: #f2f3f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 16px;
}

.bind-phone-title {
  font-size: 20px;
  color: #323233;
  margin: 0 0 8px;
  font-weight: 500;
}

.bind-phone-desc {
  font-size: 14px;
  color: #969799;
}

.bind-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 30px 0;
  padding: 0 10px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
}

.step-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #f2f3f5;
  color: #969799;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  border: 1px solid #ebedf0;
}

.step-label {
  font-size: 12px;
  color: #969799;
}

.step-line {
  height: 1px;
  background-color: #ebedf0;
  flex: 1;
  margin: 0 5px;
  position: relative;
  top: -14px;
}

.step-item.completed .step-icon {
  background-color: #07c160;
  color: white;
  border-color: #07c160;
}

.step-item.completed .step-label {
  color: #07c160;
}

.step-item.active .step-icon {
  background-color: #1989fa;
  color: white;
  border-color: #1989fa;
}

.step-item.active .step-label {
  color: #1989fa;
  font-weight: 500;
}

.bind-form {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.form-actions {
  margin: 24px 0 8px;
}

.bind-advantages {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.advantages-title {
  font-size: 15px;
  color: #323233;
  font-weight: 500;
  margin-bottom: 12px;
}

.advantage-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
  color: #646566;
}

.advantage-item i {
  margin-right: 8px;
  flex-shrink: 0;
}

.bind-policy {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  font-size: 12px;
  color: #969799;
  margin-top: 24px;
  padding: 0 16px;
}

.bind-policy .van-checkbox {
  margin-right: 4px;
}

.bind-policy .policy-text {
  color: #666;
}

.policy-link {
  color: #1989fa;
  cursor: pointer;
}

.policy-link:active {
  opacity: 0.7;
}
</style>
