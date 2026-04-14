<template>
  <div class="error-page">
    <div class="error-code">404</div>
    <div class="error-desc">抱歉，您访问的页面不存在</div>
    <div class="actions">
      <el-button type="primary" @click="goHome">返回首页</el-button>
      <el-button @click="goBack">返回上一页</el-button>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';

export default {
  name: 'Page404',
  setup() {
    const router = useRouter();
    
    const goHome = () => {
      router.push('/dashboard');
    };
    
    const goBack = () => {
      router.go(-1);
    };
    
    return {
      goHome,
      goBack
    };
  }
};
</script>

<style scoped>
.error-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 20px;
  text-shadow: 2px 2px 3px rgba(0, 0, 0, 0.1);
}

.error-desc {
  font-size: 24px;
  color: #606266;
  margin-bottom: 40px;
}

.actions {
  display: flex;
  gap: 20px;
}
</style> 