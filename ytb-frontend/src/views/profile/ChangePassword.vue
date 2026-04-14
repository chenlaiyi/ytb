<template>
  <div class="change-password-container">
    <el-card class="password-card">
      <template #header>
        <div class="card-header">
          <span>修改密码</span>
        </div>
      </template>
      
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="120px"
        class="password-form"
      >
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            v-model="passwordForm.currentPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="changePassword" :loading="loading">
            修改密码
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import adminApi from '@/api/admin';
import { clearAdminToken } from '@/utils/admin-token-bridge'

export default {
  name: 'ChangePassword',
  setup() {
    const passwordFormRef = ref();
    const loading = ref(false);
    
    const passwordForm = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    // 验证确认密码
    const validateConfirmPassword = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入新密码'));
      } else if (value !== passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'));
      } else {
        callback();
      }
    };
    
    const passwordRules = {
      currentPassword: [
        { required: true, message: '请输入当前密码', trigger: 'blur' }
      ],
      newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, validator: validateConfirmPassword, trigger: 'blur' }
      ]
    };
    
    // 修改密码
    const changePassword = async () => {
      if (!passwordFormRef.value) return;
      
      try {
        await passwordFormRef.value.validate();
        loading.value = true;
        
        const response = await adminApi.changePassword({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
          new_password_confirmation: passwordForm.confirmPassword
        });
        
        
        if (response && response.code === 200) {
          ElMessage.success('密码修改成功');
          resetForm();
        } else {
          throw new Error(response?.message || '修改失败');
        }
      } catch (error) {
        console.error('修改密码失败:', error);
        
        // 如果是401错误，说明token无效，需要重新登录
        if (error.response && error.response.status === 401) {
          ElMessage.error('登录已过期，请重新登录');
          // 清除本地存储
          clearAdminToken();
          localStorage.removeItem('user');
          // 跳转到登录页
          setTimeout(() => {
            window.location.href = '/admin/#/login';
          }, 1500);
        } else {
          ElMessage.error(error.message || '修改密码失败');
        }
      } finally {
        loading.value = false;
      }
    };
    
    // 重置表单
    const resetForm = () => {
      if (passwordFormRef.value) {
        passwordFormRef.value.resetFields();
      }
    };
    
    return {
      passwordFormRef,
      passwordForm,
      passwordRules,
      loading,
      changePassword,
      resetForm
    };
  }
};
</script>

<style scoped>
.change-password-container {
  padding: 20px;
}

.password-card {
  max-width: 600px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.password-form {
  margin-top: 20px;
}
</style> 
