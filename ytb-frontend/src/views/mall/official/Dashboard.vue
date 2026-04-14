<template>
  <div class="official-dashboard">
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6" v-for="card in topCards" :key="card.title">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">{{ card.title }}</div>
          <div class="stat-value">{{ card.format ? card.format(card.value) : card.value }}</div>
          <div class="stat-desc">{{ card.desc }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="detail-row">
      <el-col :span="12">
        <el-card shadow="never" class="detail-card" header="商品概览">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="总商品">{{ stats.goods.total }}</el-descriptions-item>
            <el-descriptions-item label="在售">{{ stats.goods.on_sale }}</el-descriptions-item>
            <el-descriptions-item label="下架">{{ stats.goods.off_sale }}</el-descriptions-item>
            <el-descriptions-item label="低库存">{{ stats.goods.low_stock }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="detail-card" header="分类概览">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="总分类">{{ stats.categories.total }}</el-descriptions-item>
            <el-descriptions-item label="启用">{{ stats.categories.enabled }}</el-descriptions-item>
            <el-descriptions-item label="停用">{{ stats.categories.disabled }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="detail-row">
      <el-col :span="12">
        <el-card shadow="never" class="detail-card" header="订单状态">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="总订单">{{ stats.orders.total }}</el-descriptions-item>
            <el-descriptions-item label="今日新增">{{ stats.orders.today }}</el-descriptions-item>
            <el-descriptions-item label="待付款">{{ stats.orders.pending_payment }}</el-descriptions-item>
            <el-descriptions-item label="待发货">{{ stats.orders.pending_ship }}</el-descriptions-item>
            <el-descriptions-item label="已发货">{{ stats.orders.shipped }}</el-descriptions-item>
            <el-descriptions-item label="已完成">{{ stats.orders.completed }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="detail-card" header="销售概览">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="累计销售">{{ formatCurrency(stats.sales.total_amount) }}</el-descriptions-item>
            <el-descriptions-item label="今日销售">{{ formatCurrency(stats.sales.today_amount) }}</el-descriptions-item>
            <el-descriptions-item label="本月销售">{{ formatCurrency(stats.sales.month_amount) }}</el-descriptions-item>
            <el-descriptions-item label="本年销售">{{ formatCurrency(stats.sales.year_amount) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { mallOfficialApi } from '@/api/v1/mall'

const stats = reactive({
  goods: { total: 0, on_sale: 0, off_sale: 0, low_stock: 0 },
  categories: { total: 0, enabled: 0, disabled: 0 },
  orders: { total: 0, today: 0, pending_payment: 0, pending_ship: 0, shipped: 0, completed: 0 },
  sales: { total_amount: 0, today_amount: 0, month_amount: 0, year_amount: 0 }
})

const loading = ref(false)

const fetchStats = async () => {
  loading.value = true
  try {
    const response = await mallOfficialApi.getDashboard()
    if (response.code === 0 && response.data) {
      Object.assign(stats.goods, response.data.goods || {})
      Object.assign(stats.categories, response.data.categories || {})
      Object.assign(stats.orders, response.data.orders || {})
      Object.assign(stats.sales, response.data.sales || {})
    } else {
      ElMessage.error(response.message || '获取概览数据失败')
    }
  } catch (error) {
    console.error('获取官方商城概览失败:', error)
    ElMessage.error('获取概览数据失败：' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

const formatCurrency = (value) => {
  const number = Number(value || 0)
  return `¥${number.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

const topCards = computed(() => [
  {
    title: '商品总数',
    value: stats.goods.total,
    desc: `在售 ${stats.goods.on_sale} 件`
  },
  {
    title: '订单总数',
    value: stats.orders.total,
    desc: `今日新增 ${stats.orders.today}`
  },
  {
    title: '销售总额',
    value: stats.sales.total_amount,
    format: formatCurrency,
    desc: `本月 ${formatCurrency(stats.sales.month_amount)}`
  },
  {
    title: '今日销售',
    value: stats.sales.today_amount,
    format: formatCurrency,
    desc: `本年 ${formatCurrency(stats.sales.year_amount)}`
  }
])

onMounted(fetchStats)
</script>

<style scoped lang="scss">
.official-dashboard {
  .stat-row {
    margin-bottom: 20px;
  }

  .stat-card {
    min-height: 140px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: linear-gradient(135deg, #4e83fd 0%, #789dff 100%);
    color: #fff;

    .stat-title {
      font-size: 16px;
    }

    .stat-value {
      font-size: 32px;
      font-weight: bold;
    }

    .stat-desc {
      font-size: 13px;
      opacity: 0.85;
    }
  }

  .detail-row {
    margin-bottom: 20px;
  }

  .detail-card {
    min-height: 220px;
  }
}
</style>
