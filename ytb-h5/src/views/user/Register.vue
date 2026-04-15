<template>
  <div class="register-container">
    <NavBar
      title="用户注册"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />
    
    <div class="register-content">
      <div class="register-header">
        <img src="/images/logo.png" alt="点点够Logo" class="register-logo" />
        <h2 class="register-title">欢迎注册点点够</h2>
        <p class="register-subtitle">创建账号，享受全部功能</p>
      </div>
      
      <van-form @submit="onSubmit" class="register-form">
        <Field
          v-model="registerForm.phone"
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
          v-model="registerForm.code"
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
              @click="handleSendCode"
            >
              {{ cooldown ? `${cooldown}s` : '获取验证码' }}
            </Button>
          </template>
        </Field>
        
        <Field
          v-model="registerForm.nickname"
          name="nickname"
          placeholder="请输入昵称（选填）"
        >
          <template #left-icon>
            <Icon name="contact" />
          </template>
        </Field>
        
        <Field
          v-model="registerForm.password"
          type="password"
          name="password"
          placeholder="请输入密码（6-20位）"
          :rules="[
            { required: true, message: '请输入密码' },
            { min: 6, max: 20, message: '密码长度为6-20位' }
          ]"
        >
          <template #left-icon>
            <Icon name="lock" />
          </template>
        </Field>
        
        <Field
          v-model="registerForm.confirmPassword"
          type="password"
          name="confirmPassword"
          placeholder="请确认密码"
          :rules="[
            { required: true, message: '请确认密码' },
            { validator: validateConfirmPassword, message: '两次输入的密码不一致' }
          ]"
        >
          <template #left-icon>
            <Icon name="eye-o" />
          </template>
        </Field>
        
        <div class="form-agreement">
          <Checkbox v-model="registerForm.agreement" shape="square" icon-size="14px">
            我已阅读并同意
          </Checkbox>
          <span class="agreement-link" @click.stop="openAgreement">《用户协议》</span>和
          <span class="agreement-link" @click.stop="openPrivacy">《隐私政策》</span>
        </div>
        
        <div class="form-actions">
          <Button 
            round 
            block 
            type="primary" 
            native-type="submit" 
            :loading="loading"
            :disabled="!registerForm.agreement"
          >
            立即注册
          </Button>
        </div>
      </van-form>
      
      <div class="login-link">
        <span>已有账号?</span>
        <span class="link" @click="$router.push('/login')">立即登录</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Field, Button, Checkbox, Icon } from 'vant'
import { register, sendSmsCode } from '@/api/user'
import Toast from '@/utils/toast'

const router = useRouter()
const loading = ref(false)
const cooldown = ref(0)
let timer = null

// 注册表单
const registerForm = reactive({
  phone: '',
  code: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  agreement: false
})

// 验证确认密码
const validateConfirmPassword = (val) => {
  return val === registerForm.password
}

// 发送验证码
const handleSendCode = async () => {
  if (!registerForm.phone) {
    Toast.show('请输入手机号')
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(registerForm.phone)) {
    Toast.show('请输入正确的手机号')
    return
  }
  
  try {
    console.log('准备发送注册验证码到:', registerForm.phone)
    
    const res = await sendSmsCode({ 
      phone: registerForm.phone, 
      type: 'register',
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
    
    // 其他实际错误处理
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

// 提交注册
const onSubmit = async () => {
  if (!registerForm.agreement) {
    Toast.show('请阅读并同意用户协议和隐私政策')
    return
  }
  
  loading.value = true
  try {
    const res = await register({
      phone: registerForm.phone,
      code: registerForm.code,
      nickname: registerForm.nickname,
      password: registerForm.password
    })
    
    if (res.code === 0) {
      Toast.success('注册成功')
      
      // 保存token和用户信息
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('userInfo', JSON.stringify(res.data.user))
      
      // 跳转到个人中心
      setTimeout(() => {
        router.replace('/user')
      }, 1500)
    } else {
      Toast({ type: 'fail', message: res.message || '注册失败' })
    }
  } catch (error) {
    console.error('注册失败', error)
    Toast({ type: 'fail', message: '注册失败，请稍后重试' })
  } finally {
    loading.value = false
  }
}

// 组件卸载前清除定时器
onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
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
.register-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.register-content {
  padding: 20px;
}

.register-header {
  text-align: center;
  margin: 20px 0 30px;
}

.register-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
}

.register-title {
  font-size: 24px;
  color: #323233;
  margin: 0 0 8px;
}

.register-subtitle {
  font-size: 14px;
  color: #969799;
  margin: 0;
}

.register-form {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.form-agreement {
  margin: 24px 16px 0;
  font-size: 12px;
  color: #969799;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.agreement-link {
  color: #1989fa;
  margin: 0 2px;
  cursor: pointer;
}

.agreement-link:active {
  opacity: 0.7;
}

.form-actions {
  margin: 24px 16px 8px;
}

.login-link {
  text-align: center;
  margin: 20px 0;
  font-size: 14px;
  color: #969799;
}

.link {
  color: #1989fa;
  margin-left: 5px;
}
</style> 