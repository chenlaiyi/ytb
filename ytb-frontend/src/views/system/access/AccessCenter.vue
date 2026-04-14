<template>
  <div class="access-center">
    <el-card class="hero-card" shadow="never">
      <div class="hero-content">
        <div>
          <p class="hero-eyebrow">System Access Hub</p>
          <h1>系统访问中心</h1>
          <p class="hero-subtitle">
            集中维护后台管理员、角色、权限并实时洞察使用情况
          </p>
        </div>
        <el-button type="primary" plain :loading="statsLoading" @click="fetchStats">
          刷新统计
        </el-button>
      </div>
      <el-row :gutter="16" class="metric-row">
        <el-col
          v-for="metric in metricCards"
          :key="metric.key"
          :xs="12"
          :sm="6"
          :md="6"
        >
          <div class="metric-card">
            <div class="metric-icon" :style="{ backgroundColor: metric.bg, color: metric.color }">
              <el-icon :size="18">
                <component :is="metric.icon" />
              </el-icon>
            </div>
            <div class="metric-info">
              <p>{{ metric.label }}</p>
              <h3>{{ metric.value }}</h3>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="tab-card" shadow="never">
      <div class="tab-card__header">
        <div>
          <h2>一体化维护面板</h2>
          <p>通过一个入口完成管理员、角色、权限及分析工作</p>
        </div>
        <el-tag effect="dark" type="success">/system/access-center</el-tag>
      </div>
      <el-tabs v-model="activeTab" class="access-tabs">
        <el-tab-pane v-for="pane in panes" :key="pane.name" :label="pane.label" :name="pane.name">
          <p class="pane-tip">{{ pane.tip }}</p>
          <Suspense>
            <template #default>
              <keep-alive>
                <component :is="tabComponents[pane.name]" v-if="activeTab === pane.name" />
              </keep-alive>
            </template>
            <template #fallback>
              <div class="tab-fallback">
                <el-skeleton :rows="6" animated />
              </div>
            </template>
          </Suspense>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { UserFilled, Avatar, Key, DataAnalysis } from '@element-plus/icons-vue';
import { getAnalyticsStats } from '@/api/v1/accessAnalytics';

const AdminList = defineAsyncComponent(() => import('../admins/List.vue'));
const RoleList = defineAsyncComponent(() => import('../roles/List.vue'));
const PermissionList = defineAsyncComponent(() => import('../permissions/List.vue'));
const AnalyticsPanel = defineAsyncComponent(() => import('../analytics/Index.vue'));

const tabComponents = {
  admins: AdminList,
  roles: RoleList,
  permissions: PermissionList,
  analytics: AnalyticsPanel
};

const panes = [
  { name: 'admins', label: '后台管理员', tip: '创建、禁用后台账号并指派角色' },
  { name: 'roles', label: '角色管理', tip: '维护角色与对应权限集合' },
  { name: 'permissions', label: '权限管理', tip: '新增或调整系统功能权限' },
  { name: 'analytics', label: '权限分析', tip: '查看权限使用率与冗余情况' }
];

const VALID_TABS = panes.map((pane) => pane.name);
const route = useRoute();
const router = useRouter();

const resolveTab = (tab) => (tab && VALID_TABS.includes(tab) ? tab : 'admins');

const activeTab = ref(resolveTab(route.query.tab));

watch(
  () => route.query.tab,
  (tab) => {
    const resolved = resolveTab(tab);
    if (resolved !== activeTab.value) {
      activeTab.value = resolved;
    }
  }
);

watch(
  activeTab,
  (tab) => {
    if (resolveTab(route.query.tab) !== tab) {
      router.replace({ path: route.path, query: { ...route.query, tab } });
    }
  },
  { flush: 'post' }
);

const statsLoading = ref(false);
const stats = ref({
  adminCount: 0,
  roleCount: 0,
  permissionCount: 0,
  moduleCount: 0
});

const fetchStats = async () => {
  statsLoading.value = true;
  try {
    const response = await getAnalyticsStats();
    if (response.code === 0 && response.data) {
      stats.value = {
        adminCount: response.data.adminCount ?? 0,
        roleCount: response.data.roleCount ?? 0,
        permissionCount: response.data.permissionCount ?? 0,
        moduleCount: response.data.moduleCount ?? 0
      };
    }
  } catch (error) {
    console.error('获取权限统计失败:', error);
    ElMessage.error('获取权限统计失败');
  } finally {
    statsLoading.value = false;
  }
};

const metricCards = computed(() => [
  { key: 'admins', label: '后台管理员', value: stats.value.adminCount, icon: UserFilled, bg: 'rgba(64,158,255,0.12)', color: '#409EFF' },
  { key: 'roles', label: '系统角色', value: stats.value.roleCount, icon: Avatar, bg: 'rgba(64,158,255,0.12)', color: '#67C23A' },
  { key: 'permissions', label: '系统权限', value: stats.value.permissionCount, icon: Key, bg: 'rgba(237,100,166,0.12)', color: '#F56C6C' },
  { key: 'modules', label: '权限模块', value: stats.value.moduleCount, icon: DataAnalysis, bg: 'rgba(103,194,58,0.12)', color: '#E6A23C' }
]);

onMounted(() => {
  if (!route.query.tab) {
    router.replace({ path: route.path, query: { ...route.query, tab: activeTab.value } });
  }
  fetchStats();
});
</script>

<style scoped>
.access-center {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-card {
  background: linear-gradient(135deg, #f4f8ff 0%, #ffffff 35%, #f8fbff 100%);
}

.hero-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.hero-eyebrow {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-content h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  color: #1f2d3d;
}

.hero-subtitle {
  margin: 6px 0 0;
  color: #606266;
}

.metric-row {
  margin-top: 12px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background-color: #fff;
  box-shadow: inset 0 0 0 1px rgba(31, 45, 61, 0.04);
}

.metric-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-info p {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.metric-info h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2d3d;
}

.tab-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.tab-card__header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.tab-card__header p {
  margin: 4px 0 0;
  color: #909399;
}

.pane-tip {
  margin: 0 0 12px;
  color: #909399;
  font-size: 13px;
}

.tab-fallback {
  padding: 24px 0;
}

@media (max-width: 768px) {
  .hero-content {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
