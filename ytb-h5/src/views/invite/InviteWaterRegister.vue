<template>
  <div class="invite-register-container">
    <div class="register-header">
      <div class="app-info">
        <h1 class="app-title">益辛友取水</h1>
      <div class="invite-info">
        <div class="invite-badge">
          <van-icon name="gift-o" />
          邀请注册
        </div>

        </div>
      </div>
    </div>

    <div class="register-form-container">
      <!-- 邀请人信息 -->
      <div class="inviter-card" v-if="inviterInfo">
        <div class="inviter-avatar">
          <img :src="inviterInfo.avatar || '/default-avatar.png'" alt="邀请人头像" />
        </div>
        <div class="inviter-info">
          <div class="inviter-name">{{ inviterInfo.name }}</div>
          <div class="inviter-title">{{ inviterInfo.title || '业务员' }}</div>
        </div>
        <div class="inviter-action">
          <van-icon name="arrow" color="#999" size="16" />
        </div>
      </div>

      <!-- 注册表单 -->
      <div class="form-card">
        <van-form @submit="handleSubmit" ref="formRef">
          <van-cell-group inset>
            <van-field
              v-model="registerForm.name"
              name="name"
              label="真实姓名"
              placeholder="请输入您的真实姓名"
              :rules="nameRules"
              required
            />
            <van-field
              v-model="registerForm.phone"
              name="phone"
              label="手机号"
              placeholder="请输入手机号"
              :rules="phoneRules"
              required
            />
            <van-field
              v-model="registerForm.address"
              name="address"
              label="详细地址"
              placeholder="请输入您的详细地址"
              :rules="addressRules"
              required
            />
          </van-cell-group>



          <!-- 服务协议 -->
          <div class="agreement-section">
            <van-checkbox v-model="registerForm.agreement" icon-size="16px">
              我已阅读并同意
              <span class="agreement-link" @click="showAgreement">《用户服务协议》</span>
              和
              <span class="agreement-link" @click="showPrivacy">《隐私政策》</span>
            </van-checkbox>
          </div>

          <!-- 提交按钮 -->
          <div class="submit-section">
            <van-button 
              round 
              block 
              type="primary" 
              native-type="submit"
              :loading="submitting"
              size="large"
            >
              立即注册
            </van-button>
          </div>
        </van-form>
      </div>

      <!-- 已有账号 -->
      <div class="login-link">
        已有账号？<span @click="goToLogin">立即登录</span>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showSuccessToast, showFailToast, showDialog } from 'vant'

const route = useRoute()
const router = useRouter()

// 响应式数据
const formRef = ref()
const submitting = ref(false)

// 邀请人信息
const inviterInfo = ref(null)

// 注册表单
const registerForm = reactive({
  name: '',
  phone: '',
  address: '',
  agreement: false
})

// 表单验证规则
const nameRules = [
  { required: true, message: '请输入真实姓名' },
  { pattern: /^[\u4e00-\u9fa5]{2,10}$/, message: '请输入2-10位中文姓名' }
]

const phoneRules = [
  { required: true, message: '请输入手机号' },
  { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
]

const addressRules = [
  { required: true, message: '请输入详细地址' }
]

// 微信身份验证
const verifyWeChatAuth = async () => {
  try {
    // 检查是否在微信环境中
    if (!window.wx) {
      throw new Error('请在微信中打开此页面')
    }
    
    // 获取微信用户信息
    const wechatInfo = await getWeChatUserInfo()
    if (!wechatInfo || !wechatInfo.openid) {
      throw new Error('微信身份验证失败，请重新进入')
    }
    
    return wechatInfo
  } catch (error) {
    console.error('微信身份验证失败:', error)
    throw error
  }
}

// 获取微信用户信息
const getWeChatUserInfo = () => {
  return new Promise((resolve, reject) => {
    // 模拟微信授权获取用户信息
    // 实际项目中需要调用微信JS-SDK
    setTimeout(() => {
      const mockWeChatInfo = {
        openid: 'mock_openid_' + Date.now(),
        nickname: '微信用户',
        avatar: '/default-avatar.png'
      }
      resolve(mockWeChatInfo)
    }, 1000)
  })
}

// 检查用户是否已存在
const checkUserExists = async (phone) => {
  try {
    const { checkUserByPhone } = await import('@/api/inviteWater')
    const response = await checkUserByPhone(phone)
    return response.data && response.data.exists
  } catch (error) {
    console.error('检查用户失败:', error)
    return false
  }
}

// 处理用户已存在的情况
const handleUserExists = (existingUser) => {
  showDialog({
    title: '用户已存在',
    message: `
      <div style="text-align: center; padding: 20px 0;">
        <div style="font-size: 48px; color: #ff9500; margin-bottom: 16px;">⚠️</div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">该手机号已注册</div>
        <div style="color: #666; margin-bottom: 16px;">手机号 ${registerForm.phone} 已经注册过账号</div>
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
          <div style="color: #1989fa; font-weight: 600;">💡 建议操作</div>
          <div style="font-size: 12px; color: #666; margin-top: 4px;">
            • 直接登录现有账号<br/>
            • 联系客服找回密码<br/>
            • 使用其他手机号注册
          </div>
        </div>
        <div style="color: #999; font-size: 12px;">如有疑问，请联系客服：4006625818</div>
      </div>
    `,
    allowHtml: true,
    showCancelButton: true,
    cancelButtonText: '重新填写',
    confirmButtonText: '去登录',
    closeOnClickOverlay: false
  }).then((action) => {
    if (action === 'confirm') {
      // 跳转到登录页面
      router.push('/login')
    }
    // 如果选择重新填写，不做任何操作，让用户修改表单
  })
}

// 提交注册
const handleSubmit = async () => {
  if (!registerForm.agreement) {
    showFailToast('请先阅读并同意服务协议')
    return
  }

  try {
    submitting.value = true
    
    // 1. 微信身份验证
    showToast({
      message: '验证微信身份中...',
      duration: 0,
      loadingType: 'spinner'
    })
    
    const wechatInfo = await verifyWeChatAuth()
    
    // 2. 检查用户是否已存在
    showToast({
      message: '检查用户信息中...',
      duration: 0,
      loadingType: 'spinner'
    })
    
    const userExists = await checkUserExists(registerForm.phone)
    if (userExists) {
      handleUserExists()
      return
    }
    
    // 3. 提交注册
    showToast({
      message: '注册中，请稍候...',
      duration: 0,
      loadingType: 'spinner'
    })
    
    const inviteCode = route.params.inviteCode
    
    // 调用注册API
    const response = await registerWithInviteAPI({
      name: registerForm.name,
      phone: registerForm.phone,
      address: registerForm.address,
      invite_code: inviteCode,
      register_type: 'invite_water',
      wechat_openid: wechatInfo.openid,
      wechat_nickname: wechatInfo.nickname,
      wechat_avatar: wechatInfo.avatar
    })

    if (response.code === 0) {
      showSuccessToast('注册成功！')
      
      // 显示成功页面
      showRegistrationSuccess(response.data)
    } else {
      // 详细错误处理
      handleRegistrationError(response)
    }
  } catch (error) {
    console.error('注册失败:', error)
    handleRegistrationError({ message: error.message, code: -1 })
  } finally {
    submitting.value = false
  }
}

// 详细错误处理
const handleRegistrationError = (response) => {
  const errorCode = response.code
  const errorMessage = response.message || '注册失败'
  
  let title = '注册失败'
  let message = errorMessage
  let suggestions = []
  
  // 根据错误码提供具体建议
  switch (errorCode) {
    case 1001:
      title = '手机号已存在'
      suggestions = ['直接登录现有账号', '使用其他手机号注册']
      break
    case 1002:
      title = '邀请码无效'
      suggestions = ['检查邀请码是否正确', '联系邀请人重新发送']
      break
    case 1003:
      title = '微信授权失败'
      suggestions = ['重新进入页面', '检查微信网络连接']
      break
    case 1004:
      title = '信息格式错误'
      suggestions = ['检查姓名格式', '检查手机号格式', '检查地址信息']
      break
    default:
      suggestions = ['检查网络连接', '稍后重试', '联系客服：4006625818']
  }
  
  showDialog({
    title: title,
    message: `
      <div style="text-align: center; padding: 20px 0;">
        <div style="font-size: 48px; color: #ee0a24; margin-bottom: 16px;">❌</div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">${title}</div>
        <div style="color: #666; margin-bottom: 16px;">${message}</div>
        ${suggestions.length > 0 ? `
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
          <div style="color: #1989fa; font-weight: 600;">💡 解决建议</div>
          <div style="font-size: 12px; color: #666; margin-top: 4px;">
            ${suggestions.map(s => `• ${s}`).join('<br/>')}
          </div>
        </div>
        ` : ''}
        <div style="color: #999; font-size: 12px;">错误代码：${errorCode}</div>
      </div>
    `,
    allowHtml: true,
    confirmButtonText: '我知道了',
    confirmButtonColor: '#ee0a24'
  })
}

// 显示注册成功页面
const showRegistrationSuccess = (userData) => {
  showDialog({
    title: '注册成功',
    message: '恭喜注册成功！请到去取水取水！',
    confirmButtonText: '确认',
    closeOnClickOverlay: false
  }).then(() => {
    // 关闭弹窗后跳转到首页或其他合适页面
    router.replace('/')
  })
}

// 获取邀请人信息
const fetchInviterInfo = async (inviteCode) => {
  try {
    const { verifyInviteCode } = await import('@/api/inviteWater')
    const response = await verifyInviteCode(inviteCode)
    if (response.code === 0) {
      inviterInfo.value = response.data
    }
  } catch (error) {
    console.error('获取邀请人信息失败:', error)
  }
}

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login')
}

// 显示协议
const showAgreement = () => {
  showDialog({
    title: '用户服务协议',
    message: `
      <div style="max-height: 400px; overflow-y: auto; text-align: left; padding: 16px; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h3 style="color: #1989fa; margin: 0;">用户服务协议</h3>
          <p style="color: #666; font-size: 12px; margin: 8px 0 0 0;">生效日期：2024年1月1日</p>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="color: #333; margin: 0 0 8px 0;">第一条 协议的接受</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">欢迎使用益辛友取水服务！本协议是您与益辛友平台之间的法律协议。使用我们的服务即表示您同意遵守本协议的所有条款。</p>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="color: #333; margin: 0 0 8px 0;">第二条 服务内容</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">我们提供以下服务：</p>
          <ul style="color: #666; font-size: 14px; margin: 8px 0; padding-left: 20px;">
            <li>净水器设备租赁服务</li>
            <li>取水点定位与导航服务</li>
            <li>积分管理与消费服务</li>
            <li>VIP会员增值服务</li>
            <li>设备维护与技术支持</li>
          </ul>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="color: #333; margin: 0 0 8px 0;">第三条 用户权利与义务</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">用户享有服务使用权，同时需要：</p>
          <ul style="color: #666; font-size: 14px; margin: 8px 0; padding-left: 20px;">
            <li>提供真实、准确的个人信息</li>
            <li>合理使用服务，不得恶意消耗资源</li>
            <li>遵守取水点的使用规范</li>
            <li>及时支付相关费用</li>
          </ul>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="color: #333; margin: 0 0 8px 0;">第四条 积分规则</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">积分获取与使用规则：</p>
          <ul style="color: #666; font-size: 14px; margin: 8px 0; padding-left: 20px;">
            <li>注册成功获得15积分</li>
            <li>每次取水消耗1积分</li>
            <li>积分有效期为1个月</li>
            <li>积分不可转让，仅限本人使用</li>
          </ul>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="color: #333; margin: 0 0 8px 0;">第五条 服务费用</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">服务费用说明：</p>
          <ul style="color: #666; font-size: 14px; margin: 8px 0; padding-left: 20px;">
            <li>基础取水服务：1积分/次</li>
            <li>VIP会员服务：按套餐收费</li>
            <li>设备租赁费用：根据设备型号确定</li>
            <li>支付方式：积分、微信支付、支付宝</li>
          </ul>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="color: #333; margin: 0 0 8px 0;">第六条 免责声明</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">在法律允许的范围内，平台对以下情况不承担责任：</p>
          <ul style="color: #666; font-size: 14px; margin: 8px 0; padding-left: 20px;">
            <li>因不可抗力导致的服务中断</li>
            <li>用户违规使用造成的损失</li>
            <li>第三方设备故障</li>
            <li>网络连接问题</li>
          </ul>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="color: #333; margin: 0 0 8px 0;">第七条 协议修改</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">我们保留随时修改本协议的权利。修改后的协议将在平台上公布，继续使用服务即视为同意修改后的协议。</p>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="color: #333; margin: 0 0 8px 0;">第八条 争议解决</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">因本协议产生的争议，双方应友好协商解决。协商不成的，提交至平台所在地人民法院解决。</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">客服电话：4006625818</p>
          <p style="color: #999; font-size: 12px; margin: 4px 0 0 0;">客服邮箱：service@yixinyou.com</p>
        </div>
      </div>
    `,
    allowHtml: true,
    confirmButtonText: '我已阅读',
    confirmButtonColor: '#1989fa'
  })
}

// 显示隐私政策
const showPrivacy = () => {
  showDialog({
    title: '隐私政策',
    message: `
      <div style="max-height: 400px; overflow-y: auto; text-align: left; padding: 16px; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h3 style="color: #1989fa; margin: 0;">隐私政策</h3>
          <p style="color: #666; font-size: 12px; margin: 8px 0 0 0;">生效日期：2024年1月1日</p>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="color: #333; margin: 0 0 8px 0;">第一条 引言</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">益辛友平台非常重视用户的隐私保护。本政策详细说明了我们如何收集、使用、存储和保护您的个人信息。</p>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="color: #333; margin: 0 0 8px 0;">第二条 信息收集</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">我们可能收集以下信息：</p>
          <ul style="color: #666; font-size: 14px; margin: 8px 0; padding-left: 20px;">
            <li>基本信息：姓名、手机号、地址</li>
            <li>微信信息：昵称、头像、OpenID</li>
            <li>使用信息：取水记录、积分变动</li>
            <li>设备信息：设备型号、使用状态</li>
            <li>位置信息：取水点位置（仅在使用时）</li>
          </ul>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="color: #333; margin: 0 0 8px 0;">第三条 信息使用</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">我们使用收集的信息用于：</p>
          <ul style="color: #666; font-size: 14px; margin: 8px 0; padding-left: 20px;">
            <li>提供和改进服务</li>
            <li>处理订单和支付</li>
            <li>客户服务和技术支持</li>
            <li>发送服务通知</li>
            <li>防范欺诈和滥用</li>
          </ul>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="color: #333; margin: 0 0 8px 0;">第四条 信息共享</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">我们不会出售、交易或转让您的个人信息给第三方，除非：</p>
          <ul style="color: #666; font-size: 14px; margin: 8px 0; padding-left: 20px;">
            <li>获得您的明确同意</li>
            <li>法律法规要求</li>
            <li>保护平台和用户权益</li>
            <li>与可信的服务提供商合作</li>
          </ul>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="color: #333; margin: 0 0 8px 0;">第五条 信息存储</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">您的信息存储在中国境内的安全服务器上，我们采用行业标准的安全措施保护您的数据。个人信息的保存期限不会超过实现目的所必需的期限。</p>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="color: #333; margin: 0 0 8px 0;">第六条 信息安全</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">我们采取以下措施保护您的信息：</p>
          <ul style="color: #666; font-size: 14px; margin: 8px 0; padding-left: 20px;">
            <li>数据加密传输和存储</li>
            <li>访问权限控制</li>
            <li>定期安全审计</li>
            <li>员工隐私培训</li>
          </ul>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="color: #333; margin: 0 0 8px 0;">第七条 您的权利</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">您对个人信息享有以下权利：</p>
          <ul style="color: #666; font-size: 14px; margin: 8px 0; padding-left: 20px;">
            <li>查询和获取个人信息</li>
            <li>更正不准确的信息</li>
            <li>删除个人信息</li>
            <li>撤回同意</li>
            <li>投诉举报</li>
          </ul>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="color: #333; margin: 0 0 8px 0;">第八条 Cookie和类似技术</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">我们使用Cookie和类似技术来改善用户体验、分析服务使用情况。您可以通过浏览器设置控制Cookie的使用。</p>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="color: #333; margin: 0 0 8px 0;">第九条 未成年人保护</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">我们不会故意收集14岁以下儿童的个人信息。如果您是未成年人，请在监护人指导下使用我们的服务。</p>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="color: #333; margin: 0 0 8px 0;">第十条 政策更新</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">我们可能会不时更新本隐私政策。重大变更时，我们会通过适当方式通知您。</p>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="color: #333; margin: 0 0 8px 0;">第十一条 联系我们</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">如果您对本隐私政策有任何疑问或需要行使相关权利，请联系我们：</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">客服电话：4006625818</p>
          <p style="color: #999; font-size: 12px; margin: 4px 0 0 0;">客服邮箱：privacy@yixinyou.com</p>
        </div>
      </div>
    `,
    allowHtml: true,
    confirmButtonText: '我已阅读',
    confirmButtonColor: '#1989fa'
  })
}

// 模拟API函数
const registerWithInviteAPI = async (data) => {
  // 使用真实的API调用
  const { registerWithInvite } = await import('@/api/inviteWater')
  return registerWithInvite(data)
}

const getInviterInfoAPI = async (data) => {
  // 使用真实的API调用
  const { verifyInviteCode } = await import('@/api/inviteWater')
  return verifyInviteCode(data.invite_code)
}

onMounted(() => {
  const inviteCode = route.params.inviteCode
  if (inviteCode) {
    fetchInviterInfo(inviteCode)
  } else {
    showFailToast('邀请码无效')
    router.replace('/login')
  }
})
</script>

<style scoped>
.invite-register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.register-header {
  text-align: center;
  padding: 60px 20px 30px;
  color: white;
}

.app-info {
  margin-bottom: 20px;
}

.app-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 20px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.invite-info {
  margin-top: 16px;
}

.invite-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  margin-bottom: 12px;
}

.invite-desc {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

.register-form-container {
  padding: 0 16px 32px;
}

/* 邀请人卡片 - 更精致紧凑 */
.inviter-card {
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.inviter-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
  flex-shrink: 0;
  background: #f5f5f5;
}

.inviter-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.inviter-info {
  flex: 1;
  min-width: 0;
}

.inviter-name {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 2px;
}

.inviter-title {
  font-size: 12px;
  color: #1989fa;
  background: rgba(25, 137, 250, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}

.inviter-action {
  flex-shrink: 0;
  margin-left: 8px;
}

/* 表单卡片 */
.form-card {
  background: white;
  border-radius: 16px;
  padding: 24px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 积分说明 */
.points-info {
  margin: 24px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}

.points-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 12px;
}

.points-list {
  space-y: 8px;
}

.points-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

/* 协议部分 */
.agreement-section {
  margin: 20px 0;
  font-size: 14px;
}

.agreement-link {
  color: #1989fa;
  text-decoration: none;
}

/* 提交按钮 */
.submit-section {
  margin-top: 24px;
}

/* 登录链接 */
.login-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.login-link span {
  color: white;
  text-decoration: underline;
  cursor: pointer;
}

/* 服务特色 */
.features-section {
  padding: 32px 16px;
  background: white;
  border-radius: 24px 24px 0 0;
}

.features-section h3 {
  text-align: center;
  font-size: 20px;
  margin: 0 0 24px;
  color: #323233;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.feature-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.feature-title {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin: 8px 0 4px;
}

.feature-desc {
  font-size: 12px;
  color: #666;
}
</style> 