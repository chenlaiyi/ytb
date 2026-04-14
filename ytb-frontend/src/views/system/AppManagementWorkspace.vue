<template>
  <div class="app-workspace">
    <div class="workspace-header">
      <div class="workspace-title">
        <el-icon><Iphone /></el-icon>
        <div>
          <h2>APP 管理中心</h2>
          <p>维护点点够及点点换 App 的版本、配置与内容</p>
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
import { Iphone } from '@element-plus/icons-vue';

import DiandianApp from '../app-management/diandian/Index.vue';
import DianhuanApp from '../app-management/dianhuan/Index.vue';

const route = useRoute();
const router = useRouter();

const tabs = [
  { label: '点点够', name: 'diandian', component: DiandianApp },
  { label: '点点换', name: 'dianhuan', component: DianhuanApp }
];

const normalizeTab = (name) => {
  return tabs.find(tab => tab.name === name)?.name || 'diandian';
};

const activeTab = ref(normalizeTab(route.query.tab));

watch(
  () => route.query.tab,
  (val) => {
    activeTab.value = normalizeTab(val);
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
.app-workspace {
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
