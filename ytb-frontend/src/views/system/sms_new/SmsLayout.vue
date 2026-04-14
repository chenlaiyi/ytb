<template>
  <div class="sms-layout-container">
    <!-- 导航标签页 -->
    <div class="sms-tabs">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="短信日志" name="logs"></el-tab-pane>
        <el-tab-pane label="短信统计" name="statistics"></el-tab-pane>
        <el-tab-pane label="验证码管理" name="codes"></el-tab-pane>
      </el-tabs>
    </div>

    <!-- 使用router-view渲染子路由组件 -->
    <div class="sms-content">
      <router-view />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export default {
  name: 'SmsLayout',
  setup() {
    const route = useRoute();
    const router = useRouter();

    // 根据当前路由路径设置激活的标签页
    const getActiveTab = () => {
      const path = route.path;
      if (path.includes('/logs')) {
        return 'logs';
      } else if (path.includes('/statistics')) {
        return 'statistics';
      } else if (path.includes('/codes')) {
        return 'codes';
      }
      return 'logs'; // 默认标签页
    };

    const activeTab = ref(getActiveTab());

    // 监听路由变化，更新激活的标签页
    watch(() => route.path, () => {
      activeTab.value = getActiveTab();
    });

    // 处理标签页点击事件
    const handleTabClick = (tab) => {
      const tabName = tab.props.name;
      if (tabName !== activeTab.value) {
        // 跳转到相应的路由
        router.push(`/sms/${tabName}`);
      }
    };

    return {
      activeTab,
      handleTabClick
    };
  }
}
</script>

<style scoped>
.sms-layout-container {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
}

.sms-tabs {
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.sms-content {
  background-color: transparent;
}
</style>