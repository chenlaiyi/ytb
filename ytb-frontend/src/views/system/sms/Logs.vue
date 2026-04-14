<template>
  <div class="app-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="clearfix">
          <span>短信日志</span>
        </div>
      </template>
      
      <div class="content">
        <h2>短信日志列表</h2>
        <p>这里显示所有发送的短信记录。</p>
        
        <el-table
          :data="logsList"
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
            prop="content"
            label="短信内容">
          </el-table-column>
          <el-table-column
            prop="status"
            label="状态"
            width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status ? 'success' : 'danger'">
                {{ scope.row.status ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="created_at"
            label="发送时间"
            width="180">
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'SmsLogs',
  data() {
    return {
      loading: false,
      logsList: [
        {
          id: 1,
          phone: '13800138000',
          content: '您的验证码是123456，有效期5分钟，请勿泄露。',
          status: 1,
          created_at: '2025-04-01 10:00:00'
        },
        {
          id: 2,
          phone: '13900139000',
          content: '您的验证码是654321，有效期5分钟，请勿泄露。',
          status: 1,
          created_at: '2025-04-01 11:00:00'
        },
        {
          id: 3,
          phone: '13700137000',
          content: '您的验证码是111222，有效期5分钟，请勿泄露。',
          status: 0,
          created_at: '2025-04-01 12:00:00'
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
