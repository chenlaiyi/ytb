<template>
  <div class="container">
    <div class="card">
      <div class="card-header">
        <h3>数据统计</h3>
      </div>
      <div class="card-body">
        <div class="alert alert-info">邀请函数据统计信息将在此显示</div>
        
        <div class="row">
          <div class="col-md-4">
            <div class="card bg-primary text-white mb-4">
              <div class="card-body">
                <h5 class="card-title">总浏览次数</h5>
                <h2>0</h2>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card bg-success text-white mb-4">
              <div class="card-body">
                <h5 class="card-title">总报名人数</h5>
                <h2>0</h2>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card bg-info text-white mb-4">
              <div class="card-body">
                <h5 class="card-title">总参与人数</h5>
                <h2>0</h2>
              </div>
            </div>
          </div>
        </div>
        
        <div class="row mt-4">
          <div class="col-md-6">
            <div class="card mb-4">
              <div class="card-header">
                <h5>业务员推广效果排行</h5>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-striped">
                    <thead>
                      <tr>
                        <th>排名</th>
                        <th>业务员</th>
                        <th>分享次数</th>
                        <th>报名人数</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colspan="4" class="text-center">暂无数据</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card mb-4">
              <div class="card-header">
                <h5>报名趋势图</h5>
              </div>
              <div class="card-body">
                <div style="height: 200px; display: flex; justify-content: center; align-items: center; background-color: #f8f9fa;">
                  <p class="text-muted">报名趋势图表将在此显示</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InvitationStatistics',
  data() {
    return {
      statistics: {}
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