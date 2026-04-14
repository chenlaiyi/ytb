<template>
  <div class="branch-workspace">
    <div class="workspace-header">
      <div class="workspace-title">
        <el-icon><OfficeBuilding /></el-icon>
        <div>
          <h2>分支机构管理</h2>
          <p>集中维护分支组织、菜单、分红与公众号等配置</p>
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
import { OfficeBuilding } from '@element-plus/icons-vue';

import BranchOrganizations from './BranchOrganizations.vue';
import BranchMenus from './BranchMenus.vue';
import BranchDividends from './BranchDividends.vue';
import WechatAccounts from './WechatAccounts.vue';

const route = useRoute();
const router = useRouter();

const tabs = [
  { label: '组织列表', name: 'organizations', component: BranchOrganizations },
  { label: '菜单配置', name: 'menus', component: BranchMenus },
  { label: '分红配置', name: 'dividends', component: BranchDividends },
  { label: '公众号管理', name: 'wechat', component: WechatAccounts }
];

const normalizeTab = (name) => {
  return tabs.find(tab => tab.name === name)?.name || 'organizations';
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
.branch-workspace {
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
