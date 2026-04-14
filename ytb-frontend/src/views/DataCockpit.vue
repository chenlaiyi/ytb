<template>
  <div class="data-cockpit">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">数据驾驶舱</h1>
      <p class="page-subtitle">全方位数据中心 - 总览业务运营状况</p>
    </div>

    <!-- 视角切换标签 -->
    <el-tabs v-model="activeTab" class="cockpit-tabs" @tab-click="handleTabClick">
      <el-tab-pane label="总驾驶舱" name="overview">
        <OverviewPanel :data="cockpitData.overview" :loading="loading" />
      </el-tab-pane>
      <el-tab-pane label="订单视角" name="orders">
        <OrdersPanel :data="cockpitData.orders" :loading="loading" />
      </el-tab-pane>
      <el-tab-pane label="会员视角" name="members">
        <MembersPanel :data="cockpitData.members" :loading="loading" />
      </el-tab-pane>
      <el-tab-pane label="设备视角" name="devices">
        <DevicesPanel :data="cockpitData.devices" :loading="loading" />
      </el-tab-pane>
      <el-tab-pane label="财务视角" name="finance">
        <FinancePanel :data="cockpitData.finance" :loading="loading" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import OverviewPanel from '@/components/cockpit/OverviewPanel.vue'
import OrdersPanel from '@/components/cockpit/OrdersPanel.vue'
import MembersPanel from '@/components/cockpit/MembersPanel.vue'
import DevicesPanel from '@/components/cockpit/DevicesPanel.vue'
import FinancePanel from '@/components/cockpit/FinancePanel.vue'

// 响应式数据
const activeTab = ref('overview')
const loading = ref(false)
const cockpitData = reactive({
  overview: {},
  orders: {},
  members: {},
  devices: {},
  finance: {}
})

const normalizeApiResult = (response) => {
  if (!response) {
    return { code: null, payload: null, message: '无响应数据' }
  }
  const code = response?.code ?? response?.status ?? response?.data?.code ?? null
  const payload = (typeof response?.data !== 'undefined' && response?.data !== null)
    ? response.data
    : response?.data?.data ?? null
  const message = response?.message ?? response?.data?.message ?? ''
  return { code, payload, message }
}

// 获取驾驶舱数据
const fetchCockpitData = async () => {
  try {
    loading.value = true
    const response = await request.get('/api/admin/v1/dashboard/cockpit')
    const { code, payload, message } = normalizeApiResult(response)
    const isSuccess = [0, 200, 'success', true, null, undefined].includes(code)
    if (isSuccess && payload) {
      Object.assign(cockpitData, payload)
      return
    }
    ElMessage.error(message || '获取数据失败')
  } catch (error) {
    console.error('获取驾驶舱数据失败:', error)
    ElMessage.error('获取数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 标签切换处理
const handleTabClick = (tab) => {
  console.log('切换到视角:', tab.props.name)
}

// 组件挂载时获取数据
onMounted(() => {
  fetchCockpitData()
})
</script>

<style lang="scss" scoped>
.data-cockpit {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);

  .page-header {
    margin-bottom: 24px;
    text-align: center;

    .page-title {
      font-size: 28px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 8px 0;
    }

    .page-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }
  }

  .cockpit-tabs {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 20px;

    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }

    :deep(.el-tabs__nav-wrap) {
      padding: 0 20px;
    }

    :deep(.el-tabs__item) {
      font-size: 16px;
      font-weight: 500;
      padding: 0 30px;
      height: 50px;
      line-height: 50px;
    }

    :deep(.el-tabs__active-bar) {
      height: 3px;
      background: linear-gradient(90deg, #409eff, #67c23a);
    }
  }
}
</style>
