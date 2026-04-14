<template>
  <div class="app-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="clearfix">
          <span>短信统计</span>
        </div>
      </template>
      
      <div class="content">
        <h2>短信发送统计</h2>
        <p>这里显示短信发送的统计数据。</p>
        
        <el-row :gutter="20" class="mt-4">
          <el-col :span="8">
            <el-card shadow="hover" class="stat-card">
              <h3>总发送量</h3>
              <div class="stat-value">1,234</div>
            </el-card>
          </el-col>
          
          <el-col :span="8">
            <el-card shadow="hover" class="stat-card">
              <h3>发送成功</h3>
              <div class="stat-value">1,200</div>
            </el-card>
          </el-col>
          
          <el-col :span="8">
            <el-card shadow="hover" class="stat-card">
              <h3>发送失败</h3>
              <div class="stat-value">34</div>
            </el-card>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" class="mt-4">
          <el-col :span="12">
            <el-card shadow="hover" class="chart-card">
              <h3>日发送量趋势</h3>
              <div class="chart-placeholder">
                <p>这里将显示日发送量趋势图表</p>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="12">
            <el-card shadow="hover" class="chart-card">
              <h3>短信类型分布</h3>
              <div class="chart-placeholder">
                <p>这里将显示短信类型分布图表</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'SmsStatistics'
}
</script>

<style scoped>
.content {
  padding: 20px;
}
.mt-4 {
  margin-top: 20px;
}
.stat-card {
  text-align: center;
  padding: 20px;
  height: 100%;
}
.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #409EFF;
  margin-top: 10px;
}
.chart-card {
  padding: 20px;
  height: 100%;
}
.chart-placeholder {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style>
