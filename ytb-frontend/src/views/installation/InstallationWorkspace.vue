<template>
  <div class="installation-workspace">
    <div class="workspace-header">
      <div class="workspace-title">
        <el-icon><Van /></el-icon>
        <div>
          <h2>安装管理</h2>
          <p>集中查看安装订单、工程师配置与统计洞察</p>
        </div>
      </div>
    </div>

    <el-card shadow="never" class="workspace-card">
      <el-tabs v-model="activeTab" class="workspace-tabs" @tab-change="handleTabChange">
        <el-tab-pane
          v-for="tab in tabs"
          :key="tab.name"
          :label="tab.label"
          :name="tab.name"
        >
          <keep-alive>
            <component :is="tab.component" v-show="activeTab === tab.name" />
          </keep-alive>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Van } from '@element-plus/icons-vue';

import BookingView from './Booking.vue';
import EngineersView from './Engineers.vue';
import StatisticsView from './Statistics.vue';
import WorkOrderManagement from './WorkOrderManagement.vue';

const route = useRoute();
const router = useRouter();

const tabs = [
  { label: '工单管理', name: 'workorders', component: WorkOrderManagement },
  { label: '安装订单', name: 'booking', component: BookingView },
  { label: '工程师管理', name: 'engineers', component: EngineersView },
  { label: '数据统计', name: 'statistics', component: StatisticsView }
];

const getValidTab = (name) => {
  return tabs.find((tab) => tab.name === name)?.name || 'booking';
};

const activeTab = ref(getValidTab(route.query.tab));

watch(
  () => route.query.tab,
  (value) => {
    activeTab.value = getValidTab(value);
  }
);

const handleTabChange = (name) => {
  router.replace({
    name: route.name,
    params: route.params,
    query: { ...route.query, tab: name }
  });
};
</script>

<style scoped>
.installation-workspace {
  padding: 20px;
}

.workspace-header {
  margin-bottom: 16px;
}

.workspace-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.workspace-title h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.workspace-title p {
  margin: 4px 0 0;
  color: #909399;
}

.workspace-card {
  background: #fff;
  border-radius: 12px;
}

.workspace-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0 8px;
}
</style>
