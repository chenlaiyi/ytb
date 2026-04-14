<template>
  <div class="merchant-overview">
    <el-page-header content="商户概览" class="page-header" />

    <el-row :gutter="16">
      <el-col :md="6" :sm="12" :xs="24" v-for="card in overviewCards" :key="card.label">
        <div class="overview-card" :class="card.type">
          <div class="card-title">{{ card.label }}</div>
          <div class="card-value">{{ card.value }}</div>
          <div class="card-sub">{{ card.caption }}</div>
        </div>
      </el-col>
    </el-row>

    <el-card class="tips-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>快捷操作</span>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :md="8" :sm="12" :xs="24">
          <el-card class="shortcut" shadow="hover" @click="$router.push({ name: 'MerchantList' })">
            <h3>商户列表</h3>
            <p>管理已经审核通过的商户信息及账户状态。</p>
          </el-card>
        </el-col>
        <el-col :md="8" :sm="12" :xs="24">
          <el-card class="shortcut" shadow="hover" @click="$router.push({ name: 'MerchantOnboarding' })">
            <h3>进件管理</h3>
            <p>审核小程序提交的商户进件，支持通过/拒绝/补件。</p>
          </el-card>
        </el-col>
        <el-col :md="8" :sm="12" :xs="24">
          <el-card class="shortcut" shadow="hover" @click="$router.push({ name: 'MerchantOnboarding', params: {} })">
            <h3>待审核列表</h3>
            <p>快速查看当日新的自动进件，优先处理高优先级任务。</p>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import merchantApi from '@/api/v1/merchant'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const stats = reactive({
  total: 0,
  active: 0,
  pending: 0,
  reviewing: 0,
  rejected: 0,
  today_new: 0,
  today_auto: 0,
  yesterday_new: 0,
  yesterday_auto: 0
})

const fetchOverview = async () => {
  loading.value = true
  try {
    const response = await merchantApi.getDashboard()
    if (response.code !== 0) {
      ElMessage.error(response.message || '获取商户概览失败')
      return
    }

    const summary = response.data?.summary || {}
    stats.total = summary.total ?? 0
    stats.active = summary.enabled ?? 0
    stats.pending = summary.pending_auto ?? 0
    stats.reviewing = summary.reviewing ?? 0
    stats.rejected = summary.rejected ?? 0
    stats.today_new = summary.today_new ?? 0
    stats.today_auto = summary.today_auto ?? 0
    stats.yesterday_new = summary.yesterday_new ?? 0
    stats.yesterday_auto = summary.yesterday_auto ?? 0
  } catch (error) {
    console.error('加载商户概览失败:', error)
    ElMessage.error(error?.response?.data?.message || error.message || '获取商户概览失败')
  } finally {
    loading.value = false
  }
}

const overviewCards = computed(() => [
  {
    label: '商户总数',
    value: stats.total,
    caption: '系统内全部商户数量',
    type: 'primary'
  },
  {
    label: '已启用',
    value: stats.active,
    caption: '正常运营中的商户',
    type: 'success'
  },
  {
    label: '待审核',
    value: stats.pending + stats.reviewing,
    caption: '自动提交和人工审核中的进件',
    type: 'warning'
  },
  {
    label: '已拒绝',
    value: stats.rejected,
    caption: '审批未通过商户',
    type: 'danger'
  },
  {
    label: '今日新增',
    value: stats.today_new ?? 0,
    caption: '今日审核通过的商户数',
    type: 'info'
  },
  {
    label: '今日自动提交',
    value: stats.today_auto ?? 0,
    caption: '今日小程序自动提交的进件',
    type: 'info'
  },
  {
    label: '昨日新增',
    value: stats.yesterday_new ?? 0,
    caption: '昨日审核通过的商户数',
    type: 'info'
  },
  {
    label: '昨日自动提交',
    value: stats.yesterday_auto ?? 0,
    caption: '昨日小程序自动提交的进件',
    type: 'info'
  }
])

onMounted(fetchOverview)
</script>

<style scoped>
.merchant-overview {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.page-header {
  padding: 0 0 8px 0;
}

.overview-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 20px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.overview-card.primary {
  border: 1px solid rgba(37, 99, 235, 0.25);
}

.overview-card.success {
  border: 1px solid rgba(34, 197, 94, 0.35);
}

.overview-card.warning {
  border: 1px solid rgba(251, 191, 36, 0.35);
}

.overview-card.danger {
  border: 1px solid rgba(248, 113, 113, 0.35);
}

.overview-card.info {
  border: 1px solid rgba(129, 140, 248, 0.35);
}

.card-title {
  color: #6b7280;
  font-size: 14px;
}

.card-value {
  font-size: 32px;
  font-weight: 600;
  margin: 8px 0 4px;
  color: #111827;
}

.card-sub {
  color: #9ca3af;
  font-size: 12px;
}

.tips-card {
  border-radius: 12px;
}

.card-header {
  font-weight: 600;
}

.shortcut {
  cursor: pointer;
  border-radius: 12px;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.shortcut h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #1f2937;
}

.shortcut p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}
</style>
