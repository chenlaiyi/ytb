<template>
  <div class="container">
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h3>报名记录</h3>
        <div>
          <button class="btn btn-success me-2">
            <i class="fas fa-file-export"></i> 导出数据
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="alert alert-info">邀请函报名记录列表将在此显示</div>
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>姓名</th>
                <th>手机号</th>
                <th>邀请函</th>
                <th>推荐人</th>
                <th>是否已参加</th>
                <th>报名时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="8" class="text-center">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InvitationRegistrationList',
  data() {
    return {
      registrations: []
    }
  },
  created() {
    // 在此加载数据
  },
  methods: {
    // 添加方法
  }
}
</script>

<style scoped>
/* 样式 */
</style> 