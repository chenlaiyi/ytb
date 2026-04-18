<template>
  <div class="ytb-register">
    <!-- 顶部背景 -->
    <div class="header-bg">
      <div class="header-content">
        <h1 class="title">加入亿拓宝联盟</h1>
        <p class="subtitle">开启您的创业之旅</p>
      </div>
    </div>

    <!-- 推广人信息卡片 -->
    <div class="inviter-card" v-if="inviter">
      <div class="card-title">
        <van-icon name="user-circle-o" />
        <span>推广人信息</span>
      </div>
      <div class="inviter-info">
        <div class="info-row">
          <span class="label">推广人</span>
          <span class="value">{{ inviter.real_name || inviter.nickname || '未知' }}</span>
        </div>
        <div class="info-row">
          <span class="label">联系电话</span>
          <span class="value">{{ formatPhone(inviter.phone) }}</span>
        </div>
        <div class="info-row">
          <span class="label">邀请码</span>
          <span class="value invite-code">{{ inviteCode }}</span>
        </div>
      </div>
    </div>

    <!-- 邀请码无效提示 -->
    <div class="error-card" v-else-if="inviteCodeError">
      <van-icon name="warning-o" size="48" color="#ee0a24" />
      <p class="error-text">{{ inviteCodeError }}</p>
      <van-button type="primary" size="small" @click="goToLogin">返回登录</van-button>
    </div>

    <!-- 注册表单 -->
    <div class="register-card" v-if="inviter">
      <div class="card-title">
        <van-icon name="edit" />
        <span>填写您的信息</span>
      </div>
      <van-form @submit="onSubmit" ref="formRef">
        <van-cell-group inset>
          <van-field
            v-model="form.real_name"
            name="real_name"
            label="真实姓名"
            placeholder="请输入您的真实姓名"
            :rules="[{ required: true, message: '请输入真实姓名' }]"
          />
          <van-field
            v-model="form.phone"
            name="phone"
            label="手机号码"
            type="tel"
            placeholder="请输入您的手机号"
            maxlength="11"
            :rules="[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]"
          />
        </van-cell-group>

        <!-- 升级费用说明 -->
        <div class="fee-section">
          <div class="fee-title">升级费用</div>
          <div class="fee-amount">¥{{ config.scp_upgrade_fee || 980 }}</div>
          <div class="fee-desc">成为CP伙伴，享受推广分佣权益</div>
        </div>

        <!-- 提交按钮 -->
        <div class="submit-section">
          <van-button 
            type="primary" 
            block 
            round 
            size="large"
            native-type="submit"
            :loading="submitting"
          >
            提交申请
          </van-button>
          <p class="submit-tip">提交后请等待管理员审核，或联系推广人完成付款</p>
        </div>
      </van-form>
    </div>

    <!-- 底部说明 -->
    <div class="footer" v-if="inviter">
      <p>成为CP伙伴后，您将获得：</p>
      <div class="benefits">
        <div class="benefit-item">
          <van-icon name="checked" color="#07c160" />
          <span>专属推广二维码</span>
        </div>
        <div class="benefit-item">
          <van-icon name="checked" color="#07c160" />
          <span>邀请好友升级可获得分佣</span>
        </div>
        <div class="benefit-item">
          <van-icon name="checked" color="#07c160" />
          <span>更多平台专属权益</span>
        </div>
      </div>
    </div>

    <!-- 申请成功弹窗 -->
    <van-dialog
      v-model:show="showSuccessDialog"
      title="申请已提交"
      :show-cancel-button="false"
      confirm-button-text="我知道了"
      @confirm="onSuccessConfirm"
    >
      <div class="success-content">
        <van-icon name="checked" size="48" color="#07c160" />
        <p>您的CP伙伴升级申请已提交成功！</p>
        <p class="sub-text">请联系推广人 <strong>{{ inviter?.real_name || inviter?.nickname }}</strong> 完成付款，或等待管理员审核。</p>
        <p class="contact-text" v-if="inviter?.phone">推广人电话：{{ inviter.phone }}</p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { validateInviteCode, getConfig, isLoggedIn } from '@/api/ytb'
import ytbApi from '@/api/ytb'
import { useYtbShare } from '@/composables/useYtbShare'

// 设置亿拓宝分享配置
useYtbShare('加入亿拓宝联盟')

const route = useRoute()
const router = useRouter()

// 状态
const inviteCode = ref('')
const inviter = ref(null)
const inviteCodeError = ref('')
const submitting = ref(false)
const showSuccessDialog = ref(false)
const config = ref({
  scp_upgrade_fee: 980
})

const form = ref({
  real_name: '',
  phone: ''
})

// 初始化
onMounted(async () => {
  // 获取URL中的邀请码
  inviteCode.value = route.query.invite_code || ''
  
  if (!inviteCode.value) {
    inviteCodeError.value = '缺少邀请码参数'
    return
  }

  // 未登录时先跳转到微信授权登录，避免产生重复账号
  if (!isLoggedIn()) {
    router.replace({ path: '/login', query: { invite_code: inviteCode.value } })
    return
  }

  // 加载配置
  await loadConfig()
  
  // 验证邀请码
  await verifyInviteCode()
})

// 加载配置
const loadConfig = async () => {
  try {
    const res = await getConfig()
    if (res.code === 0) {
      config.value = res.data
    }
  } catch (error) {
    console.error('加载配置失败:', error)
  }
}

// 验证邀请码
const verifyInviteCode = async () => {
  try {
    const res = await validateInviteCode(inviteCode.value)
    if (res.code === 0 && res.data?.inviter) {
      inviter.value = res.data.inviter
    } else {
      inviteCodeError.value = res.message || '邀请码无效或已过期'
    }
  } catch (error) {
    inviteCodeError.value = '验证邀请码失败，请重试'
  }
}

// 格式化手机号（隐藏中间4位）
const formatPhone = (phone) => {
  if (!phone || phone.length !== 11) return phone || '未设置'
  return phone.substring(0, 3) + '****' + phone.substring(7)
}

// 提交表单
const onSubmit = async () => {
  submitting.value = true
  
  try {
    const res = await ytbApi.post('/register', {
      invite_code: inviteCode.value,
      real_name: form.value.real_name,
      phone: form.value.phone
    })
    
    if (res.code === 0) {
      showSuccessDialog.value = true
    } else {
      showToast(res.message || '提交失败，请重试')
    }
  } catch (error) {
    showToast('网络错误，请重试')
  } finally {
    submitting.value = false
  }
}

// 成功确认
const onSuccessConfirm = () => {
  // 跳转到登录页
  router.push('/login')
}

// 返回登录
const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.ytb-register {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 40px;
}

.header-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px 60px;
  text-align: center;
}

.header-content {
  color: white;
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 8px;
}

.subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.inviter-card,
.register-card,
.error-card {
  background: white;
  margin: -30px 16px 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.error-card {
  text-align: center;
  padding: 40px 20px;
}

.error-text {
  color: #666;
  margin: 16px 0;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.card-title .van-icon {
  color: #667eea;
}

.inviter-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-row .label {
  color: #999;
  font-size: 14px;
}

.info-row .value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.info-row .invite-code {
  color: #667eea;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 2px;
}

.register-card {
  margin-top: 16px;
}

.fee-section {
  text-align: center;
  padding: 20px;
  margin: 16px 0;
  background: linear-gradient(135deg, #fff5f5 0%, #fff0f6 100%);
  border-radius: 12px;
}

.fee-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.fee-amount {
  font-size: 36px;
  font-weight: bold;
  color: #ee0a24;
}

.fee-desc {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.submit-section {
  padding: 16px 0;
}

.submit-tip {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 12px;
}

.footer {
  padding: 20px;
  text-align: center;
}

.footer > p {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.benefits {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.success-content {
  text-align: center;
  padding: 20px;
}

.success-content p {
  margin: 12px 0;
  color: #333;
}

.success-content .sub-text {
  font-size: 14px;
  color: #666;
}

.success-content .contact-text {
  font-size: 14px;
  color: #667eea;
  margin-top: 16px;
}
</style>
