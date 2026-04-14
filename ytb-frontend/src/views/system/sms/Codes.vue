<template>
  <div class="app-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="clearfix">
          <span>验证码管理</span>
        </div>
      </template>
      
      <div class="content">
        <h2>验证码列表</h2>
        <p>这里显示所有发送的验证码记录。</p>
        
        <el-table
          :data="codesList"
          border
          style="width: 100%"
          v-loading="loading">
          <el-table-column
            prop="id"
            label="ID"
            width="80">
          </el-table-column>
          <el-table-column
            prop="phone"
            label="手机号"
            width="150">
          </el-table-column>
          <el-table-column
            prop="code"
            label="验证码"
            width="100">
          </el-table-column>
          <el-table-column
            prop="type"
            label="类型"
            width="120">
          </el-table-column>
          <el-table-column
            prop="used"
            label="使用状态"
            width="100">
            <template #default="scope">
              <el-tag :type="scope.row.used ? 'success' : 'info'">
                {{ scope.row.used ? '已使用' : '未使用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="created_at"
            label="创建时间"
            width="180">
          </el-table-column>
          <el-table-column
            prop="expired_at"
            label="过期时间"
            width="180">
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'SmsCodes',
  data() {
    return {
      loading: false,
      codesList: [
        {
          id: 1,
          phone: '13800138000',
          code: '123456',
          type: '登录验证',
          used: 1,
          created_at: '2025-04-01 10:00:00',
          expired_at: '2025-04-01 10:05:00'
        },
        {
          id: 2,
          phone: '13900139000',
          code: '654321',
          type: '注册验证',
          used: 1,
          created_at: '2025-04-01 11:00:00',
          expired_at: '2025-04-01 11:05:00'
        },
        {
          id: 3,
          phone: '13700137000',
          code: '111222',
          type: '重置密码',
          used: 0,
          created_at: '2025-04-01 12:00:00',
          expired_at: '2025-04-01 12:05:00'
        }
      ]
    }
  }
}
</script>

<style scoped>
.content {
  padding: 20px;
}
</style>
