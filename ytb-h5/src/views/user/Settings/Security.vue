<template>
  <div class="security-container">
    <NavBar
      title="账号安全"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />
    
    <div class="security-content">
      <div class="security-section">
        <Cell 
          title="修改登录密码" 
          is-link 
          @click="goToChangePassword"
        >
          <template #icon>
            <Icon name="lock" class="cell-icon" />
          </template>
        </Cell>
        
        <Cell 
          title="修改手机号" 
          is-link 
          @click="goToChangePhone"
          :value="maskPhone(userInfo.phone)"
        >
          <template #icon>
            <Icon name="phone-o" class="cell-icon" />
          </template>
        </Cell>
        
        <Cell 
          title="设置支付密码" 
          is-link 
          @click="goToPaymentPassword"
        >
          <template #icon>
            <Icon name="balance-pay" class="cell-icon" />
          </template>
          <template #right-icon>
            <Tag type="primary" v-if="userInfo.hasPaymentPassword">已设置</Tag>
            <Tag type="warning" v-else>未设置</Tag>
          </template>
        </Cell>
        
        <Cell 
          title="微信账号绑定" 
          is-link 
          @click="handleWechatBinding"
        >
          <template #icon>
            <Icon name="wechat" class="cell-icon" color="#07c160" />
          </template>
          <template #right-icon>
            <Tag type="primary" v-if="userInfo.hasWechatBind">已绑定</Tag>
            <Tag type="warning" v-else>未绑定</Tag>
          </template>
        </Cell>
      </div>
      
      <div class="security-section">
        <Cell 
          title="登录设备管理" 
          is-link 
          @click="goToDeviceManagement"
        >
          <template #icon>
            <Icon name="phone-circle-o" class="cell-icon" />
          </template>
        </Cell>
        
        <Cell 
          title="登录日志" 
          is-link 
          @click="goToLoginHistory"
        >
          <template #icon>
            <Icon name="records" class="cell-icon" />
          </template>
        </Cell>
      </div>
      
      <div class="security-section">
        <Cell 
          title="注销账号" 
          is-link 
          @click="showDeleteAccount = true"
        >
          <template #icon>
            <Icon name="delete-o" class="cell-icon danger-icon" />
          </template>
        </Cell>
      </div>
      
      <div class="security-tips">
        <div class="tips-title">账号安全提示</div>
        <div class="tips-item">
          <Icon name="info-o" size="14" color="#1989fa" />
          <span>定期修改密码，提高账号安全性</span>
        </div>
        <div class="tips-item">
          <Icon name="info-o" size="14" color="#1989fa" />
          <span>不要将账号密码透露给他人</span>
        </div>
        <div class="tips-item">
          <Icon name="info-o" size="14" color="#1989fa" />
          <span>设备管理可随时查看和下线已登录设备</span>
        </div>
      </div>
    </div>
    
    <!-- 注销账号弹窗 -->
    <Dialog
      v-model:show="showDeleteAccount"
      title="注销账号"
      show-cancel-button
      confirm-button-color="#ee0a24"
      @confirm="confirmDeleteAccount"
    >
      <div class="delete-account-content">
        <p>注销后，您的账号将被永久删除，无法恢复。</p>
        <p>账号相关的所有数据将被清除，包括个人信息、订单记录等。</p>
        <p>余额、积分等资产将无法使用，请先处理完毕。</p>
        <p>请确认您已了解注销账号的后果。</p>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Cell, Icon, Tag, Dialog } from 'vant'
import Toast from '@/utils/toast-fix'
import { getUserInfo, getWechatLoginUrl, unbindWechat } from '@/api/user'

const router = useRouter()
const showDeleteAccount = ref(false)

// 用户信息
const userInfo = ref({
  phone: '',
  hasPaymentPassword: false,
  hasWechatBind: false
})

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const res = await getUserInfo()
    if (res.code === 0 && res.data) {
      userInfo.value = {
        ...userInfo.value,
        ...res.data
      }
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
    Toast('获取用户信息失败')
  }
}

// 修改登录密码
const goToChangePassword = () => {
  router.push('/user/settings/change-password')
}

// 修改手机号
const goToChangePhone = () => {
  router.push('/user/settings/change-phone')
}

// 设置支付密码
const goToPaymentPassword = () => {
  router.push('/user/settings/payment-password')
}

// 登录设备管理
const goToDeviceManagement = () => {
  router.push('/user/settings/device-management')
}

// 登录日志
const goToLoginHistory = () => {
  router.push('/user/settings/login-history')
}

// 处理微信绑定/解绑
const handleWechatBinding = async () => {
  if (userInfo.value.hasWechatBind) {
    // 已绑定，提示是否解绑
    Toast.confirm({
      title: '解绑微信',
      message: '确定要解绑当前微信账号吗？解绑后将无法使用微信快捷登录。',
      confirmButtonText: '解绑',
      confirmButtonColor: '#ee0a24',
      cancelButtonText: '取消'
    }).then(async () => {
      try {
        const res = await unbindWechat()
        if (res.code === 0) {
          Toast.success('解绑成功')
          userInfo.value.hasWechatBind = false
        } else {
          Toast({ type: 'fail', message: res.message || '解绑失败' })
        }
      } catch (error) {
        console.error('解绑微信失败', error)
        Toast({ type: 'fail', message: '解绑失败，请稍后重试' })
      }
    }).catch(() => {
      // 取消操作
    })
  } else {
    // 未绑定，跳转到微信授权页面
    try {
      const res = await getWechatLoginUrl()
      if (res.code === 0 && res.data && res.data.url) {
        // 存储当前状态，用于回调判断是绑定还是登录
        localStorage.setItem('wechatBindingRedirect', 'true')
        window.location.href = res.data.url
      } else {
        Toast({ type: 'fail', message: '获取授权链接失败' })
      }
    } catch (error) {
      console.error('获取微信登录URL失败', error)
      Toast({ type: 'fail', message: '获取授权链接失败' })
    }
  }
}

// 确认注销账号
const confirmDeleteAccount = () => {
  // 这里应该跳转到专门的注销账号确认页面
  // 通常需要再次验证身份后才能注销
  router.push('/user/settings/delete-account')
}

// 手机号脱敏
const maskPhone = (phone) => {
  if (!phone) return ''
  if (phone.length !== 11) return phone
  return phone.substr(0, 3) + '****' + phone.substr(7)
}

// 页面加载时获取数据
onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.security-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.security-content {
  padding: 16px;
}

.security-section {
  margin-bottom: 16px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.cell-icon {
  margin-right: 8px;
  font-size: 20px;
  color: var(--primary-color, #1989fa);
}

.danger-icon {
  color: #ee0a24 !important;
}

.security-tips {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-top: 24px;
}

.tips-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.tips-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  color: #666;
}

.tips-item .van-icon {
  margin-right: 6px;
  flex-shrink: 0;
}

.delete-account-content {
  padding: 10px 0;
  font-size: 14px;
  color: #666;
  text-align: left;
}

.delete-account-content p {
  margin-bottom: 8px;
}
</style> 