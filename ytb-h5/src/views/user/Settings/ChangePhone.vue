<template>
  <div class="change-phone-container">
    <NavBar
      title="修改手机号"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />
    
    <div class="change-phone-content">
      <!-- 旧手机号验证 -->
      <div v-if="step === 1" class="verify-old-phone">
        <div class="step-title">验证当前手机号</div>
        <div class="step-desc">请先验证您当前绑定的手机号</div>
        
        <div class="form-section">
          <Cell :value="maskPhone(currentPhone)" title="当前手机号" />
          
          <Field 
            v-model="oldPhoneForm.code" 
            label="验证码" 
            placeholder="请输入验证码"
            :rules="[{ required: true, message: '请输入验证码' }]"
          >
            <template #button>
              <Button 
                size="small" 
                type="primary" 
                :disabled="oldPhoneForm.countdown > 0"
                @click="sendCode('old')"
              >
                {{ oldPhoneForm.countdown > 0 ? `${oldPhoneForm.countdown}秒后重试` : '获取验证码' }}
              </Button>
            </template>
          </Field>
        </div>
        
        <div class="submit-btn">
          <Button round block type="primary" @click="verifyOldPhone">下一步</Button>
        </div>
      </div>
      
      <!-- 新手机号设置 -->
      <div v-if="step === 2" class="set-new-phone">
        <div class="step-title">绑定新手机号</div>
        <div class="step-desc">请输入您要绑定的新手机号</div>
        
        <div class="form-section">
          <Field 
            v-model="newPhoneForm.phone" 
            label="新手机号" 
            placeholder="请输入新手机号"
            type="tel"
            maxlength="11"
            :rules="[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
            ]"
          />
          
          <Field 
            v-model="newPhoneForm.code" 
            label="验证码" 
            placeholder="请输入验证码"
            :rules="[{ required: true, message: '请输入验证码' }]"
          >
            <template #button>
              <Button 
                size="small" 
                type="primary" 
                :disabled="newPhoneForm.countdown > 0 || !isValidPhone(newPhoneForm.phone)"
                @click="sendCode('new')"
              >
                {{ newPhoneForm.countdown > 0 ? `${newPhoneForm.countdown}秒后重试` : '获取验证码' }}
              </Button>
            </template>
          </Field>
        </div>
        
        <div class="submit-btn">
          <Button round block type="primary" @click="bindNewPhone">确认绑定</Button>
        </div>
      </div>
      
      <!-- 绑定成功 -->
      <div v-if="step === 3" class="success-step">
        <div class="success-icon">
          <Icon name="checked" size="60" color="#07c160" />
        </div>
        <div class="success-title">手机号修改成功</div>
        <div class="success-desc">您的手机号已成功修改为 {{ maskPhone(newPhoneForm.phone) }}</div>
        
        <div class="success-btn">
          <Button round block type="primary" @click="goBack">完成</Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Cell, Field, Button, Icon, Toast } from 'vant'
import { getUserInfo, sendSmsCode, verifyPhone, changePhone } from '@/api/user'

const router = useRouter()
const step = ref(1)  // 步骤：1-验证旧手机号，2-绑定新手机号，3-绑定成功
const currentPhone = ref('')  // 当前手机号

// 旧手机号表单
const oldPhoneForm = ref({
  code: '',
  countdown: 0
})

// 新手机号表单
const newPhoneForm = ref({
  phone: '',
  code: '',
  countdown: 0
})

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const res = await getUserInfo()
    if (res.code === 0 && res.data) {
      currentPhone.value = res.data.phone || ''
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
    Toast('获取用户信息失败')
  }
}

// 手机号脱敏
const maskPhone = (phone) => {
  if (!phone) return ''
  if (phone.length !== 11) return phone
  return phone.substr(0, 3) + '****' + phone.substr(7)
}

// 验证手机号格式
const isValidPhone = (phone) => {
  return /^1[3-9]\d{9}$/.test(phone)
}

// 发送验证码
const sendCode = async (type) => {
  // 确定发送验证码的手机号
  const phone = type === 'old' ? currentPhone.value : newPhoneForm.value.phone
  
  // 验证手机号
  if (!isValidPhone(phone)) {
    Toast('请输入正确的手机号')
    return
  }
  
  try {
    // 发送验证码类型
    const codeType = type === 'old' ? 'verify' : 'bind'
    
    const res = await sendSmsCode({
      phone,
      type: codeType
    })
    
    if (res.code === 0) {
      Toast.success('验证码已发送')
      
      // 开始倒计时
      const form = type === 'old' ? oldPhoneForm : newPhoneForm
      form.value.countdown = 60
      
      const timer = setInterval(() => {
        form.value.countdown--
        if (form.value.countdown <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    } else {
      Toast(res.message || '发送验证码失败')
    }
  } catch (error) {
    console.error('发送验证码失败', error)
    Toast('发送验证码失败，请稍后重试')
  }
}

// 验证旧手机号
const verifyOldPhone = async () => {
  if (!oldPhoneForm.value.code) {
    Toast('请输入验证码')
    return
  }
  
  try {
    const res = await verifyPhone({
      phone: currentPhone.value,
      code: oldPhoneForm.value.code
    })
    
    if (res.code === 0) {
      // 验证成功，进入下一步
      step.value = 2
    } else {
      Toast(res.message || '验证码错误')
    }
  } catch (error) {
    console.error('验证手机号失败', error)
    Toast('验证失败，请稍后重试')
  }
}

// 绑定新手机号
const bindNewPhone = async () => {
  if (!newPhoneForm.value.phone) {
    Toast('请输入新手机号')
    return
  }
  
  if (!isValidPhone(newPhoneForm.value.phone)) {
    Toast('请输入正确的手机号')
    return
  }
  
  if (newPhoneForm.value.phone === currentPhone.value) {
    Toast('新手机号不能与当前手机号相同')
    return
  }
  
  if (!newPhoneForm.value.code) {
    Toast('请输入验证码')
    return
  }
  
  try {
    const res = await changePhone({
      oldPhone: currentPhone.value,
      oldCode: oldPhoneForm.value.code,
      newPhone: newPhoneForm.value.phone,
      newCode: newPhoneForm.value.code
    })
    
    if (res.code === 0) {
      // 绑定成功，进入成功页面
      step.value = 3
    } else {
      Toast(res.message || '绑定失败')
    }
  } catch (error) {
    console.error('绑定新手机号失败', error)
    Toast('绑定失败，请稍后重试')
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 页面加载时获取数据
onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.change-phone-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.change-phone-content {
  padding: 16px;
}

.step-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.step-desc {
  font-size: 14px;
  color: #999;
  margin-bottom: 24px;
}

.form-section {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 24px;
}

.submit-btn {
  margin: 24px 0;
}

.success-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 16px;
}

.success-icon {
  margin-bottom: 24px;
}

.success-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.success-desc {
  font-size: 14px;
  color: #999;
  margin-bottom: 40px;
  text-align: center;
}

.success-btn {
  width: 100%;
}
</style> 