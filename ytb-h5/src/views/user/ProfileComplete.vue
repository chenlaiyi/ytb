<template>
  <div class="profile-complete-page">
    <van-nav-bar
      title="完善个人信息"
      left-arrow
      @click-left="$router.back()"
    />

    <div class="content">
      <div class="tips">
        <van-icon name="info-o" color="#1989fa" />
        <span>完善个人信息有助于提升账户安全性和服务体验</span>
      </div>

      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field
            v-model="form.phone"
            name="phone"
            label="手机号"
            placeholder="请输入手机号"
            :rules="[{ required: false, message: '请输入手机号' }]"
            maxlength="11"
          >
            <template #button v-if="!form.phone">
              <van-button
                size="small"
                type="primary"
                @click="showBindPhone = true"
              >
                绑定
              </van-button>
            </template>
          </van-field>

          <van-field
            v-model="form.real_name"
            name="real_name"
            label="真实姓名"
            placeholder="请输入真实姓名"
            :rules="[{ required: false, message: '请输入真实姓名' }]"
          />

          <van-field
            v-model="form.id_card"
            name="id_card"
            label="身份证号"
            placeholder="请输入身份证号"
            :rules="[{ required: false, message: '请输入身份证号' }]"
            maxlength="18"
          />
        </van-cell-group>

        <div class="submit-section">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="loading"
          >
            保存信息
          </van-button>
          
          <van-button
            round
            block
            plain
            type="primary"
            @click="skipForNow"
            style="margin-top: 12px;"
          >
            暂时跳过
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 手机号绑定弹窗 -->
    <van-popup v-model:show="showBindPhone" position="bottom" round>
      <div class="bind-phone-popup">
        <div class="popup-header">
          <h3>绑定手机号</h3>
          <van-icon name="cross" @click="showBindPhone = false" />
        </div>
        
        <van-form @submit="bindPhone">
          <van-field
            v-model="phoneForm.phone"
            name="phone"
            label="手机号"
            placeholder="请输入手机号"
            :rules="[{ required: true, message: '请输入手机号' }]"
            maxlength="11"
          />
          
          <van-field
            v-model="phoneForm.code"
            name="code"
            label="验证码"
            placeholder="请输入验证码"
            :rules="[{ required: true, message: '请输入验证码' }]"
          >
            <template #button>
              <van-button
                size="small"
                type="primary"
                @click="sendSmsCode"
                :disabled="smsTimer > 0"
              >
                {{ smsTimer > 0 ? `${smsTimer}s` : '发送验证码' }}
              </van-button>
            </template>
          </van-field>
          
          <div class="popup-actions">
            <van-button
              round
              block
              type="primary"
              native-type="submit"
              :loading="bindingPhone"
            >
              确认绑定
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Toast, Dialog } from 'vant'
import { updateUserProfile, bindPhone as bindPhoneApi, sendSmsCode as sendSmsCodeApi, syncUserRoles } from '@/api/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const showBindPhone = ref(false)
const bindingPhone = ref(false)
const smsTimer = ref(0)
let timer = null

// 主表单
const form = reactive({
  phone: '',
  real_name: '',
  id_card: ''
})

// 手机号绑定表单
const phoneForm = reactive({
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
  const roles = []
  Object.entries(ROLE_LABELS).forEach(([field, label]) => {
    if (info[field] === 1 || info[field] === true) {
      roles.push(label)
    }
  })
  return roles
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

const showRoleDialog = (roles = []) => {
  const message = roles.length
    ? `系统已为您匹配到以下角色：\n${roles.map((role) => `• ${role}`).join('\n')}`
    : '绑定成功，暂未匹配到新的角色。\n您可以继续完善信息或联系顾问获取更多权限。'

  return Dialog.alert({
    title: '绑定成功',
    message,
    confirmButtonText: '好的',
    confirmButtonColor: '#ff4d55'
  })
}

const redirectToUserCenter = () => {
  const host = window.location.host
  const target = host.includes('pay.itapgo.com') ? 'https://pay.itapgo.com/app/#/user' : '/#/user'
  window.location.href = `${target}?refresh=${Date.now()}`
}

// 初始化表单数据
const initForm = () => {
  if (userStore.user) {
    form.phone = userStore.user.phone || ''
    form.real_name = userStore.user.real_name || ''
    form.id_card = userStore.user.id_card || ''
  }
}

// 提交主表单
const onSubmit = async () => {
  loading.value = true
  try {
    const res = await updateUserProfile(form)
    if (res.code === 0) {
      Toast.success('信息保存成功')
      // 更新用户信息
      userStore.updateUserInfo(form)
      setTimeout(() => {
        router.back()
      }, 1500)
    } else {
      Toast({ type: 'fail', message: res.message || '保存失败' })
    }
  } catch (error) {
    console.error('保存失败:', error)
    Toast({ type: 'fail', message: '保存失败，请重试' })
  } finally {
    loading.value = false
  }
}

// 发送短信验证码
const sendSmsCode = async () => {
  if (!phoneForm.phone) {
    Toast({ type: 'fail', message: '请输入手机号' })
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(phoneForm.phone)) {
    Toast({ type: 'fail', message: '请输入正确的手机号' })
    return
  }
  
  try {
    const res = await sendSmsCodeApi({
      phone: phoneForm.phone,
      type: 'bind'
    })
    
    if (res.code === 0) {
      Toast.success('验证码已发送')
      // 开始倒计时
      smsTimer.value = 60
      timer = setInterval(() => {
        smsTimer.value--
        if (smsTimer.value <= 0) {
          clearInterval(timer)
          timer = null
        }
      }, 1000)
    } else {
      Toast({ type: 'fail', message: res.message || '发送失败' })
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    Toast({ type: 'fail', message: '发送失败，请重试' })
  }
}

// 绑定手机号
const bindPhone = async () => {
  bindingPhone.value = true
  try {
    const res = await bindPhoneApi(phoneForm)
    if (res.code === 0) {
      Toast.success('绑定成功')
      form.phone = phoneForm.phone
      showBindPhone.value = false

      if (res.data) {
        const userData = res.data.user || res.data
        userStore.setUserInfo(userData)
      }

      const matchedRoles = await matchUserRoles()
      await userStore.fetchUserInfo({ forceRefresh: true }).catch(() => {})
      const rolesToShow = matchedRoles.length ? matchedRoles : extractRoleNames(userStore.userInfo || {})
      await showRoleDialog(rolesToShow)
      redirectToUserCenter()
    } else {
      Toast({ type: 'fail', message: res.message || '绑定失败' })
    }
  } catch (error) {
    console.error('绑定失败:', error)
    Toast({ type: 'fail', message: '绑定失败，请重试' })
  } finally {
    bindingPhone.value = false
  }
}

// 暂时跳过
const skipForNow = () => {
  router.back()
}

onMounted(() => {
  initForm()
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.profile-complete-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.content {
  padding: 16px;
}

.tips {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f0f9ff;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #1989fa;
}

.submit-section {
  margin-top: 32px;
  padding: 0 16px;
}

.bind-phone-popup {
  padding: 20px;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.popup-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.popup-actions {
  margin-top: 20px;
}
</style>
