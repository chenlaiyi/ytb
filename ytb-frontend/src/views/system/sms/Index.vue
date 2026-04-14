<template>
  <div class="app-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="clearfix">
          <span>短信管理</span>
        </div>
      </template>
      
      <div class="content">
        <h2>短信管理模块</h2>
        <p>这是短信管理模块的主页面。</p>
        
        <el-row :gutter="20" class="mt-4">
          <el-col :span="8">
            <el-card shadow="hover" class="feature-card">
              <h3>短信日志</h3>
              <p>查看所有发送的短信记录</p>
              <el-button type="primary" @click="goToLogs">查看日志</el-button>
            </el-card>
          </el-col>
          
          <el-col :span="8">
            <el-card shadow="hover" class="feature-card">
              <h3>验证码管理</h3>
              <p>管理短信验证码</p>
              <el-button type="primary" @click="goToCodes">查看验证码</el-button>
            </el-card>
          </el-col>
          
          <el-col :span="8">
            <el-card shadow="hover" class="feature-card">
              <h3>短信统计</h3>
              <p>查看短信发送统计数据</p>
              <el-button type="primary" @click="goToStats">查看统计</el-button>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'SmsIndex',
  methods: {
    goToLogs() {
      this.$router.push('/system/sms/logs');
    },
    goToCodes() {
      this.$router.push('/system/sms/codes');
    },
    goToStats() {
      this.$router.push('/system/sms/statistics');
    }
  }
}
</script>

<style scoped>
.content {
  padding: 20px;
}
.feature-card {
  text-align: center;
  padding: 20px;
  height: 100%;
}
.mt-4 {
  margin-top: 20px;
}
</style>
