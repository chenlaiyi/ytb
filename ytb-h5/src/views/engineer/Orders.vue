<template>
  <div class="orders-container">
    <!-- 移除头部导航条，界面更简洁 -->
    
    <div class="content">
    <!-- 状态筛选标签页 -->
    <Tabs v-model:active="activeTab" sticky>
      <Tab title="全部">
        <OrderList :status="'all'" v-if="activeTab === 0" />
      </Tab>
      <Tab title="待处理">
        <OrderList :status="'pending'" v-if="activeTab === 1" />
      </Tab>
      <Tab title="处理中">
        <OrderList :status="'processing'" v-if="activeTab === 2" />
      </Tab>
      <Tab title="已完成">
        <OrderList :status="'completed'" v-if="activeTab === 3" />
      </Tab>
      <Tab title="已取消">
        <OrderList :status="'cancelled'" v-if="activeTab === 4" />
      </Tab>
    </Tabs>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Tab, Tabs } from 'vant'
import OrderList from './components/OrderList.vue'

// 当前选中的标签页
const activeTab = ref(0)
</script>

<style scoped>
.orders-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}
</style> 