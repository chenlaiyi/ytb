<template>
  <div class="container">
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h3>编辑邀请函</h3>
        <router-link to="/invitation/configs" class="btn btn-secondary">
          <i class="fas fa-arrow-left"></i> 返回列表
        </router-link>
      </div>
      <div class="card-body">
        <div class="alert alert-info">此处将显示编辑邀请函的表单</div>
        <form>
          <div class="form-group mb-3">
            <label for="title">标题</label>
            <input type="text" class="form-control" id="title" placeholder="请输入标题">
          </div>
          <div class="form-group mb-3">
            <label for="event_date">活动日期</label>
            <input type="date" class="form-control" id="event_date">
          </div>
          <div class="form-group mb-3">
            <label for="location">活动地点</label>
            <input type="text" class="form-control" id="location" placeholder="请输入活动地点">
          </div>
          <div class="form-group mb-3">
            <label for="description">活动描述</label>
            <textarea class="form-control" id="description" rows="3"></textarea>
          </div>
          <button type="submit" class="btn btn-primary">保存</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InvitationConfigEdit',
  data() {
    return {
      form: {
        id: null,
        title: '',
        event_date: '',
        location: '',
        description: ''
      }
    }
  },
  created() {
    // 在此加载数据
    const id = this.$route.params.id;
    // 加载邀请函数据
  },
  methods: {
    // 添加方法
  }
}
</script>

<style scoped>
/* 样式 */
</style> 