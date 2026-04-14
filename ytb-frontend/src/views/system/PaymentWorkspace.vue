<template>
  <div class="payment-workspace">
    <div class="workspace-header">
      <div class="workspace-title">
        <el-icon><CreditCard /></el-icon>
        <div>
          <h2>支付中心</h2>
          <p>配置支付方式并监控交易、退款等业务数据</p>
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
import { CreditCard } from '@element-plus/icons-vue';

import PaymentMethods from '../payment/methods/Index.vue';
import PaymentTransactions from '../payment/transactions/Index.vue';
import PaymentRefunds from '../payment/refunds/Index.vue';

const route = useRoute();
const router = useRouter();

const tabs = [
  { label: '支付方式', name: 'methods', component: PaymentMethods },
  { label: '交易记录', name: 'transactions', component: PaymentTransactions },
  { label: '退款记录', name: 'refunds', component: PaymentRefunds }
];

const normalizeTab = (name) => {
  return tabs.find(tab => tab.name === name)?.name || 'methods';
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
.payment-workspace {
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
