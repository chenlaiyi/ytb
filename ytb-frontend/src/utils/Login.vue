<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>点点够管理系统</h2>
      </div>
      <el-form
        ref="loginFormRef"
        :model="formData"
        :rules="loginRules"
        label-width="0"
        class="login-form"
        autocomplete="off"
      >
        <el-form-item prop="username">
          <el-input
            v-model="formData.username"
            placeholder="用户名"
            :prefix-icon="User"
            autocomplete="off"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            autocomplete="new-password"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            :loading="loading"
            type="primary"
            class="login-button"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import axios from 'axios';
import { setAdminToken } from '@/utils/admin-token-bridge'

export default {
  name: 'Login',
  setup() {
    const router = useRouter();
    const store = useStore();
    const loginFormRef = ref(null);

    const loading = ref(false);
    const errorMessage = ref('');
    const formData = reactive({
      username: '',
      password: ''
    });

    const loginRules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
      ]
    };

    const handleLogin = () => {
      if (!loginFormRef.value) {
        console.error('表单引用不存在');
        return;
      }

      loginFormRef.value.validate(async (valid) => {
        if (!valid) {
          return false;
        }

        errorMessage.value = '';
        loading.value = true;


        try {
          // 直接使用axios进行登录，使用正确的API路径
          const response = await axios.post('/api/admin/login', {
            username: formData.username,
            password: formData.password
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });


          if (response.data && response.code === 0) {
            // 成功登录
            const userData = response.data.user;
            const token = response.data.token;

            // 保存登录状态
            setAdminToken(token);
            localStorage.setItem('user', JSON.stringify(userData));

            ElMessage.success('登录成功');
            router.push({ path: '/dashboard' });
          } else {
            // API返回错误
            const errorMsg = (response.data && response.data.message) || '登录失败';
            errorMessage.value = errorMsg;
            ElMessage.error(errorMsg);
          }
        } catch (error) {
          console.error('登录请求错误:', error);

          const errorData = error.response?.data;
          const errorMsg = errorData?.message || error.message || '登录失败，请检查用户名和密码';

          errorMessage.value = errorMsg;
          ElMessage.error(errorMsg);
        } finally {
          loading.value = false;
        }
      });
    };

    return {
      loginFormRef,
      loginRules,
      loading,
      formData,
      errorMessage,
      handleLogin,
      User,
      Lock
    };
  }
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  width: 100%;
  background-color: #f0f2f5;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-box {
  width: 350px;
  padding: 30px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  font-weight: 500;
  color: #409eff;
}

.login-button {
  width: 100%;
}

.error-message {
  margin-top: 15px;
  padding: 10px;
  color: #f56c6c;
  background-color: #fef0f0;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}
</style>
