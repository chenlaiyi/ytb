<template>
  <div class="container">
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h3>邀请函管理</h3>
        <router-link to="/invitation/configs/create" class="btn btn-primary">
          <i class="fas fa-plus"></i> 创建邀请函
        </router-link>
      </div>
      <div class="card-body">
        <div class="alert alert-info">邀请函配置列表将在此显示</div>
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>标题</th>
                <th>活动日期</th>
                <th>活动地点</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="7" class="text-center">暂无数据</td>
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
  name: 'InvitationConfigList',
  data() {
    return {
      invitations: []
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