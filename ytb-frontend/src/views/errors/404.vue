<template>
  <div class="error-page">
    <div class="error-container">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">页面未找到</h2>
      <p class="error-description">
        很抱歉，您访问的页面不存在或已被移动。
      </p>
      <div class="error-causes">
        <h3>可能的原因：</h3>
        <ul>
          <li>页面路由未正确配置</li>
          <li>对应的后端API不存在</li>
          <li>组件文件丢失或未正确导入</li>
          <li>URL输入错误</li>
        </ul>
      </div>
      <div class="error-actions">
        <el-button type="primary" @click="goHome">返回首页</el-button>
        <el-button @click="goBack">返回上一页</el-button>
        <el-button @click="reloadPage">刷新页面</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';

export default {
  name: 'NotFound',
  setup() {
    const router = useRouter();
    
    const goHome = () => {
      router.push('/dashboard');
    };
    
    const goBack = () => {
      router.go(-1);
    };
    
    const reloadPage = () => {
      window.location.reload();
    };
    
    return {
      goHome,
      goBack,
      reloadPage
    };
  }
};
</script>

<style scoped>
.error-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.error-container {
  text-align: center;
  max-width: 600px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.error-code {
  font-size: 120px;
  margin: 0;
  background: linear-gradient(to right, #409EFF, #67C23A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
}

.error-title {
  font-size: 28px;
  margin-top: 0;
  margin-bottom: 20px;
  color: #303133;
}

.error-description {
  font-size: 16px;
  color: #606266;
  margin-bottom: 30px;
}

.error-causes {
  text-align: left;
  margin-bottom: 30px;
  background-color: #f8f9fb;
  padding: 20px;
  border-radius: 4px;
}

.error-causes h3 {
  margin-top: 0;
  font-size: 16px;
  color: #303133;
}

.error-causes ul {
  margin: 10px 0 0;
  padding-left: 20px;
  color: #606266;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

@media (max-width: 768px) {
  .error-container {
    padding: 20px;
    width: 90%;
  }
  
  .error-code {
    font-size: 80px;
  }
  
  .error-title {
    font-size: 22px;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .error-actions .el-button {
    margin-bottom: 10px;
    width: 100%;
  }
}
</style> 