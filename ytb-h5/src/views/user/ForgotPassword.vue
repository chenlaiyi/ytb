<template>
  <div class="forgot-password-container">
    <NavBar
      title="忘记密码"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />
    
    <div class="forgot-password-content">
      <div class="forgot-password-header">
        <div class="lock-icon">
          <Icon name="closed-eye" size="30" color="#1989fa" />
        </div>
        <h2 class="forgot-password-title">重置密码</h2>
        <p class="forgot-password-desc">请通过手机验证码重置密码</p>
      </div>
      
      <div class="steps-indicator">
        <div class="step active">1. 验证手机</div>
        <div class="step-line"></div>
        <div class="step" :class="{ active: step > 1 }">2. 设置新密码</div>
        <div class="step-line"></div>
        <div class="step" :class="{ active: step > 2 }">3. 完成</div>
      </div>
      
      <!-- 步骤1: 验证手机号 -->
      <van-form @submit="verifyPhone" v-if="step === 1" class="form-card">
        <Field
          v-model="formData.phone"
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
          v-model="formData.code"
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
          <Button round block type="primary" native-type="submit" :loading="loading">
            下一步
          </Button>
        </div>
      </van-form>
      
      <!-- 步骤2: 设置新密码 -->
      <van-form @submit="resetPassword" v-if="step === 2" class="form-card">
        <Field
          v-model="formData.password"
          type="password"
          name="password"
          placeholder="请输入新密码"
          :rules="[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度不能少于6位' }
          ]"
        >
          <template #left-icon>
            <Icon name="lock" />
          </template>
        </Field>
        
        <Field
          v-model="formData.confirmPassword"
          type="password"
          name="confirmPassword"
          placeholder="请确认新密码"
          :rules="[
            { required: true, message: '请确认新密码' },
            { validator: validateConfirmPassword, message: '两次输入的密码不一致' }
          ]"
        >
          <template #left-icon>
            <Icon name="eye-o" />
          </template>
        </Field>
        
        <div class="form-actions">
          <Button round block type="primary" native-type="submit" :loading="loading">
            确认修改
          </Button>
        </div>
      </van-form>
      
      <!-- 步骤3: 完成 -->
      <div v-if="step === 3" class="success-card">
        <Icon name="success" size="50" color="#07c160" />
        <h3 class="success-title">密码重置成功</h3>
        <p class="success-desc">您的密码已成功重置，请使用新密码登录</p>
        <Button round type="primary" block @click="goToLogin" class="success-btn">
          立即登录
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Field, Button, Icon } from 'vant'
import { sendSmsCode, forgotPassword } from '@/api/user'
import Toast from '@/utils/toast'

const router = useRouter()
const loading = ref(false)
const step = ref(1)
const cooldown = ref(0)
let timer = null

// 表单数据
const formData = reactive({
  phone: '',
  code: '',
  password: '',
  confirmPassword: ''
})

// 验证确认密码
const validateConfirmPassword = (val) => {
  return val === formData.password
}

// 发送短信验证码
const handleSendSms = async () => {
  if (!formData.phone) {
    Toast.show('请输入手机号')
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
    Toast.show('请输入正确的手机号')
    return
  }
  
  try {
    console.log('准备发送重置密码验证码到:', formData.phone)
    
    const res = await sendSmsCode({ 
      phone: formData.phone, 
      type: 'reset',
      channel: 'aliyun'
    })
    
    console.log('短信验证码发送响应:', res)
    
    if (res && res.code === 0) {
      Toast.success('验证码已发送')
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
    // 检查是否包含TypeError与success相关的错误（可能验证码已发送）
    if (error && error.toString().includes("TypeError") && 
        error.toString().includes("success") && 
        error.toString().includes("is not a function")) {
      console.warn('捕获到Toast.success兼容性问题，但验证码可能已发送:', error.message)
      
      // 直接使用普通Toast提示用户
      Toast.show('验证码发送成功，请注意查收')
      
      // 强制开始倒计时
      cooldown.value = 60
      timer = setInterval(() => {
        cooldown.value--
        if (cooldown.value <= 0) {
          clearInterval(timer)
          timer = null
        }
      }, 1000)
      return
    }
    
    // 检查是否是数据库相关错误
    if (error && error.toString().includes("mysql")) {
      console.error('检测到数据库相关错误:', error)
      alert('系统维护中，请稍后再试')
      return
    }
    
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

// 验证手机号
const verifyPhone = () => {
  // 简单验证，验证码实际验证在最后一步
  step.value = 2
}

// 重置密码
const resetPassword = async () => {
  loading.value = true
  try {
    const res = await forgotPassword({
      phone: formData.phone,
      code: formData.code,
      password: formData.password
    })
    
    if (res.code === 0) {
      step.value = 3
    } else {
      Toast({ type: 'fail', message: res.message || '密码重置失败' })
    }
  } catch (error) {
    console.error('密码重置失败', error)
    Toast({ type: 'fail', message: '密码重置失败，请稍后重试' })
  } finally {
    loading.value = false
  }
}

// 跳转到登录页面
const goToLogin = () => {
  router.replace('/login')
}

// 组件卸载前清除定时器
onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.forgot-password-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.forgot-password-content {
  padding: 20px;
}

.forgot-password-header {
  text-align: center;
  margin: 30px 0;
}

.lock-icon {
  width: 60px;
  height: 60px;
  background-color: #e6f2ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.forgot-password-title {
  font-size: 24px;
  color: #323233;
  margin: 0 0 8px;
}

.forgot-password-desc {
  font-size: 14px;
  color: #969799;
}

.steps-indicator {
  display: flex;
  align-items: center;
  margin: 30px 0;
  padding: 0 16px;
}

.step {
  flex: 1;
  text-align: center;
  color: #c8c9cc;
  font-size: 13px;
  font-weight: 500;
}

.step.active {
  color: #1989fa;
}

.step-line {
  height: 1px;
  background-color: #ebedf0;
  flex: 0.5;
  margin: 0 8px;
}

.form-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.form-actions {
  margin: 24px 0 8px;
}

.success-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 40px 16px;
  margin: 40px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.success-title {
  font-size: 18px;
  color: #323233;
  margin: 16px 0 8px;
}

.success-desc {
  font-size: 14px;
  color: #969799;
  margin-bottom: 24px;
}

.success-btn {
  width: 200px;
}
</style> 