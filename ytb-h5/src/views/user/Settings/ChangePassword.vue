<template>
  <div class="change-password-container">
    <NavBar
      title="修改登录密码"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />
    
    <div class="password-content">
      <div class="form-section">
        <Field 
          v-model="form.oldPassword" 
          type="password"
          label="当前密码" 
          placeholder="请输入当前密码"
          :rules="[{ required: true, message: '请输入当前密码' }]"
        />
        
        <Field 
          v-model="form.newPassword" 
          type="password"
          label="新密码" 
          placeholder="请输入新密码"
          :rules="[
            { required: true, message: '请输入新密码' },
            { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,20}$/, message: '密码需包含大小写字母和数字，长度8-20位' }
          ]"
        />
        
        <Field 
          v-model="form.confirmPassword" 
          type="password"
          label="确认新密码" 
          placeholder="请再次输入新密码"
          :rules="[
            { required: true, message: '请确认新密码' },
            { validator: validateConfirmPassword, message: '两次输入的密码不一致' }
          ]"
        />
      </div>
      
      <div class="password-tips">
        <div class="tips-title">
          <Icon name="info-o" size="14" color="#1989fa" />
          <span>密码要求</span>
        </div>
        <div class="tips-list">
          <div class="tips-item">• 长度为8-20个字符</div>
          <div class="tips-item">• 必须包含大写字母、小写字母和数字</div>
          <div class="tips-item">• 不能与旧密码相同</div>
        </div>
      </div>
      
      <div class="submit-btn">
        <Button round block type="primary" @click="handleSubmit">确认修改</Button>
      </div>
      
      <div class="forgot-password">
        <span @click="goToForgotPassword">忘记密码？</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Field, Button, Icon, Toast, Dialog } from 'vant'
import { changePassword } from '@/api/user'

const router = useRouter()

// 表单数据
const form = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 确认密码验证
const validateConfirmPassword = (val) => {
  return val === form.value.newPassword
}

// 提交表单
const handleSubmit = async () => {
  // 表单验证
  if (!form.value.oldPassword) {
    Toast('请输入当前密码')
    return
  }
  
  if (!form.value.newPassword) {
    Toast('请输入新密码')
    return
  }
  
  // 密码强度验证
  const passwordReg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,20}$/
  if (!passwordReg.test(form.value.newPassword)) {
    Toast('新密码需包含大小写字母和数字，长度8-20位')
    return
  }
  
  if (!form.value.confirmPassword) {
    Toast('请确认新密码')
    return
  }
  
  if (form.value.newPassword !== form.value.confirmPassword) {
    Toast('两次输入的密码不一致')
    return
  }
  
  if (form.value.oldPassword === form.value.newPassword) {
    Toast('新密码不能与旧密码相同')
    return
  }
  
  // 调用修改密码API
  try {
    Toast.loading({
      message: '提交中...',
      forbidClick: true,
    })
    
    const res = await changePassword({
      oldPassword: form.value.oldPassword,
      newPassword: form.value.newPassword
    })
    
    Toast.clear()
    
    if (res.code === 0) {
      Toast.success('密码修改成功')
      
      // 修改成功后返回，并提示重新登录
      setTimeout(() => {
        Dialog.alert({
          title: '提示',
          message: '密码已修改成功，请重新登录',
        }).then(() => {
          // 清除登录状态
          localStorage.removeItem('token')
          // 跳转到登录页
          router.replace('/login')
        })
      }, 1000)
    } else if (res.code === 1001) {
      Toast('当前密码错误')
    } else {
      Toast(res.message || '修改失败')
    }
  } catch (error) {
    Toast.clear()
    console.error('修改密码失败', error)
    Toast('修改失败，请稍后重试')
  }
}

// 跳转到忘记密码页面
const goToForgotPassword = () => {
  router.push('/forgot-password')
}
</script>

<style scoped>
.change-password-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.password-content {
  padding: 16px;
}

.form-section {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.password-tips {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.tips-title {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
}

.tips-title .van-icon {
  margin-right: 6px;
}

.tips-list {
  padding-left: 20px;
}

.tips-item {
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.submit-btn {
  margin: 24px 0;
}

.forgot-password {
  text-align: center;
  font-size: 14px;
  color: #1989fa;
}
</style> 