<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><Wallet /></el-icon>
        充值记录
      </h2>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row" v-loading="statsLoading">
      <el-col :xs="12" :sm="8" :md="4">
        <div class="stat-card today">
          <div class="stat-label">今日</div>
          <div class="stat-value">¥{{ stats.today.amount }}</div>
          <div class="stat-count">{{ stats.today.count }}笔</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <div class="stat-card yesterday">
          <div class="stat-label">昨日</div>
          <div class="stat-value">¥{{ stats.yesterday.amount }}</div>
          <div class="stat-count">{{ stats.yesterday.count }}笔</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <div class="stat-card week">
          <div class="stat-label">近7日</div>
          <div class="stat-value">¥{{ stats.week.amount }}</div>
          <div class="stat-count">{{ stats.week.count }}笔</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <div class="stat-card month">
          <div class="stat-label">近30天</div>
          <div class="stat-value">¥{{ stats.month.amount }}</div>
          <div class="stat-count">{{ stats.month.count }}笔</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <div class="stat-card half-year">
          <div class="stat-label">近180天</div>
          <div class="stat-value">¥{{ stats.halfYear.amount }}</div>
          <div class="stat-count">{{ stats.halfYear.count }}笔</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <div class="stat-card year">
          <div class="stat-label">近360天</div>
          <div class="stat-value">¥{{ stats.year.amount }}</div>
          <div class="stat-count">{{ stats.year.count }}笔</div>
        </div>
      </el-col>
    </el-row>

    <!-- 筛选区域 -->
    <div class="filter-container">
      <el-input
        v-model="listQuery.keyword"
        placeholder="搜索设备编号、用户名..."
        style="width: 280px;"
        clearable
        @keyup.enter="handleFilter"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <el-date-picker
        v-model="listQuery.date_range"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 260px;"
      />
      
      <el-button type="primary" @click="handleFilter">
        <el-icon><Search /></el-icon>
        搜索
      </el-button>
      <el-button @click="resetFilter">重置</el-button>
    </div>

    <!-- 充值记录列表 -->
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="70" align="center" />
      <el-table-column prop="order_no" label="订单号" width="200" />
      <el-table-column label="设备编号" width="120">
        <template #default="{ row }">
          {{ row.device?.board_code || row.device_id }}
        </template>
      </el-table-column>
      <el-table-column label="用户" width="120">
        <template #default="{ row }">
          {{ row.user?.name || row.user?.phone || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="套餐名称" width="150">
        <template #default="{ row }">
          {{ row.package?.name || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="amount" label="充值金额" width="100" align="right">
        <template #default="{ row }">
          <span style="color: #67c23a; font-weight: 600;">¥{{ row.amount }}</span>
        </template>
      </el-table-column>
      <el-table-column label="充值流量/天数" width="120" align="right">
        <template #default="{ row }">
          <span v-if="row.flow_added">{{ row.flow_added }}L</span>
          <span v-else-if="row.days_added">{{ row.days_added }}天</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="支付状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="支付时间" width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.paid_at) }}
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.limit"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Wallet, Search } from '@element-plus/icons-vue'
import request from '@/utils/request'

const loading = ref(false)
const statsLoading = ref(false)
const list = ref([])
const total = ref(0)
const listQuery = reactive({
  page: 1,
  limit: 20,
  keyword: '',
  date_range: []
})

const stats = reactive({
  today: { amount: 0, count: 0 },
  yesterday: { amount: 0, count: 0 },
  week: { amount: 0, count: 0 },
  month: { amount: 0, count: 0 },
  halfYear: { amount: 0, count: 0 },
  year: { amount: 0, count: 0 }
})

const statusMap = {
  pending: { text: '待支付', type: 'warning' },
  paid: { text: '已支付', type: 'success' },
  using: { text: '已支付', type: 'success' },
  completed: { text: '已支付', type: 'success' },
  refunded: { text: '已退款', type: 'danger' },
  failed: { text: '失败', type: 'danger' }
}

const getStatusText = (status) => statusMap[status]?.text || status
const getStatusType = (status) => statusMap[status]?.type || 'info'

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: listQuery.page,
      per_page: listQuery.limit,
      keyword: listQuery.keyword
    }
    if (listQuery.date_range?.length === 2) {
      params.start_date = listQuery.date_range[0]
      params.end_date = listQuery.date_range[1]
    }
    
    const res = await request({
      url: '/api/admin/water-purifier/recharge-records',
      method: 'get',
      params
    })
    if (res.code === 0) {
      list.value = res.data || []
      total.value = res.meta?.total || 0
    }
  } catch (error) {
    ElMessage.error('获取充值记录失败')
  } finally {
    loading.value = false
  }
}

const handleFilter = () => {
  listQuery.page = 1
  fetchList()
}

const resetFilter = () => {
  listQuery.keyword = ''
  listQuery.date_range = []
  handleFilter()
}

const fetchStats = async () => {
  statsLoading.value = true
  try {
    const res = await request({
      url: '/api/admin/water-purifier/recharge-records/stats',
      method: 'get'
    })
    if (res.code === 0 && res.data) {
      Object.assign(stats, res.data)
    }
  } catch (error) {
    console.error('获取统计数据失败', error)
  } finally {
    statsLoading.value = false
  }
}

onMounted(() => {
  fetchList()
  fetchStats()
})
</script>

<style scoped>
.app-container { padding: 20px; }
.page-header { margin-bottom: 20px; }
.page-title {
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}
.stats-row {
  margin-bottom: 20px;
}
.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 16px;
  color: #fff;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.stat-card.today { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
.stat-card.yesterday { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-card.week { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-card.month { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.stat-card.half-year { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
.stat-card.year { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; }
.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 22px;
  font-weight: 700;
}
.stat-count {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}
.filter-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
