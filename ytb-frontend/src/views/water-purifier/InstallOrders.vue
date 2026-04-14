<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><Tools /></el-icon>
        安装订单
      </h2>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row" v-loading="statsLoading">
      <el-col :xs="12" :sm="8" :md="4">
        <div class="stat-card today">
          <div class="stat-label">今日</div>
          <div class="stat-value">¥{{ stats.today.amount }}</div>
          <div class="stat-count">{{ stats.today.count }}单</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <div class="stat-card yesterday">
          <div class="stat-label">昨日</div>
          <div class="stat-value">¥{{ stats.yesterday.amount }}</div>
          <div class="stat-count">{{ stats.yesterday.count }}单</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <div class="stat-card week">
          <div class="stat-label">近7日</div>
          <div class="stat-value">¥{{ stats.week.amount }}</div>
          <div class="stat-count">{{ stats.week.count }}单</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <div class="stat-card month">
          <div class="stat-label">近30天</div>
          <div class="stat-value">¥{{ stats.month.amount }}</div>
          <div class="stat-count">{{ stats.month.count }}单</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <div class="stat-card total-paid">
          <div class="stat-label">已支付</div>
          <div class="stat-value">¥{{ stats.totalPaid.amount }}</div>
          <div class="stat-count">{{ stats.totalPaid.count }}单</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <div class="stat-card total">
          <div class="stat-label">全部订单</div>
          <div class="stat-value">{{ stats.total.count }}</div>
          <div class="stat-count">待支付{{ stats.pending.count }}单</div>
        </div>
      </el-col>
    </el-row>

    <!-- 筛选区域 -->
    <div class="filter-container">
      <el-input
        v-model="listQuery.keyword"
        placeholder="搜索订单号、联系人、手机号..."
        style="width: 280px;"
        clearable
        @keyup.enter="handleFilter"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <el-select v-model="listQuery.payment_status" placeholder="支付状态" clearable style="width: 120px;">
        <el-option label="待支付" value="pending" />
        <el-option label="已支付" value="paid" />
        <el-option label="已退款" value="refunded" />
      </el-select>
      
      <el-select v-model="listQuery.status" placeholder="订单状态" clearable style="width: 120px;">
        <el-option label="待支付" value="pending" />
        <el-option label="已支付" value="paid" />
        <el-option label="已派单" value="assigned" />
        <el-option label="已接单" value="accepted" />
        <el-option label="已领设备" value="picked" />
        <el-option label="安装中" value="installing" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      
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

    <!-- 订单列表 -->
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="60" align="center" />
      <el-table-column prop="order_no" label="订单号" width="180" />
      <el-table-column label="联系人" width="100">
        <template #default="{ row }">
          {{ row.contact_name }}
        </template>
      </el-table-column>
      <el-table-column label="联系电话" width="120">
        <template #default="{ row }">
          {{ row.contact_phone }}
        </template>
      </el-table-column>
      <el-table-column label="安装地址" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.province }}{{ row.city }}{{ row.district }}{{ row.address }}
        </template>
      </el-table-column>
      <el-table-column label="预约时间" width="150">
        <template #default="{ row }">
          <div v-if="row.preferred_date">
            {{ row.preferred_date }}
            <span v-if="row.preferred_time" style="color: #909399;">{{ row.preferred_time }}</span>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="安装费" width="80" align="right">
        <template #default="{ row }">
          <span style="color: #67c23a; font-weight: 600;">¥{{ row.install_fee }}</span>
        </template>
      </el-table-column>
      <el-table-column label="支付状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="getPaymentStatusType(row.payment_status)" size="small">
            {{ getPaymentStatusText(row.payment_status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="订单状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="工程师" width="100">
        <template #default="{ row }">
          {{ row.engineer?.name || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="设备编号" width="100">
        <template #default="{ row }">
          {{ row.board_code || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="支付时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.paid_at) }}
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="showDetail(row)">
            详情
          </el-button>
        </template>
      </el-table-column>
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

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="700px">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="订单号">{{ currentOrder.order_no }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(currentOrder.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ currentOrder.contact_name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentOrder.contact_phone }}</el-descriptions-item>
        <el-descriptions-item label="安装地址" :span="2">
          {{ currentOrder.province }}{{ currentOrder.city }}{{ currentOrder.district }}{{ currentOrder.address }}
        </el-descriptions-item>
        <el-descriptions-item label="预约日期">{{ currentOrder.preferred_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预约时段">{{ currentOrder.preferred_time || '-' }}</el-descriptions-item>
        <el-descriptions-item label="安装费">
          <span style="color: #67c23a; font-weight: 600;">¥{{ currentOrder.install_fee }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="支付状态">
          <el-tag :type="getPaymentStatusType(currentOrder.payment_status)" size="small">
            {{ getPaymentStatusText(currentOrder.payment_status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ formatDateTime(currentOrder.paid_at) }}</el-descriptions-item>
        <el-descriptions-item label="交易流水号">{{ currentOrder.transaction_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(currentOrder.status)" size="small">
            {{ getStatusText(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="工程师">{{ currentOrder.engineer?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="接单时间">{{ formatDateTime(currentOrder.accepted_at) }}</el-descriptions-item>
        <el-descriptions-item label="领设备时间">{{ formatDateTime(currentOrder.picked_at) }}</el-descriptions-item>
        <el-descriptions-item label="设备编号">{{ currentOrder.board_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="安装完成时间">{{ formatDateTime(currentOrder.installed_at) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentOrder.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      
      <!-- 安装照片 -->
      <div v-if="currentOrder?.install_photos" style="margin-top: 20px;">
        <h4 style="margin-bottom: 12px;">安装照片</h4>
        <div class="photo-gallery">
          <el-image
            v-for="(photo, index) in parsePhotos(currentOrder.install_photos)"
            :key="index"
            :src="photo"
            :preview-src-list="parsePhotos(currentOrder.install_photos)"
            :initial-index="index"
            fit="cover"
            style="width: 100px; height: 100px; margin-right: 10px; border-radius: 4px;"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Tools, Search } from '@element-plus/icons-vue'
import request from '@/utils/request'

const loading = ref(false)
const statsLoading = ref(false)
const list = ref([])
const total = ref(0)
const detailVisible = ref(false)
const currentOrder = ref(null)

const listQuery = reactive({
  page: 1,
  limit: 20,
  keyword: '',
  payment_status: '',
  status: '',
  date_range: []
})

const stats = reactive({
  today: { amount: 0, count: 0 },
  yesterday: { amount: 0, count: 0 },
  week: { amount: 0, count: 0 },
  month: { amount: 0, count: 0 },
  totalPaid: { amount: 0, count: 0 },
  pending: { count: 0 },
  total: { count: 0 }
})

const paymentStatusMap = {
  pending: { text: '待支付', type: 'warning' },
  paid: { text: '已支付', type: 'success' },
  refunded: { text: '已退款', type: 'danger' }
}

const statusMap = {
  pending: { text: '待支付', type: 'info' },
  paid: { text: '待派单', type: 'warning' },
  assigned: { text: '已派单', type: '' },
  accepted: { text: '已接单', type: 'primary' },
  picked: { text: '已领设备', type: 'primary' },
  installing: { text: '安装中', type: 'primary' },
  completed: { text: '已完成', type: 'success' },
  cancelled: { text: '已取消', type: 'danger' }
}

const getPaymentStatusText = (status) => paymentStatusMap[status]?.text || status
const getPaymentStatusType = (status) => paymentStatusMap[status]?.type || 'info'
const getStatusText = (status) => statusMap[status]?.text || status
const getStatusType = (status) => statusMap[status]?.type || 'info'

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const parsePhotos = (photos) => {
  if (!photos) return []
  try {
    return JSON.parse(photos)
  } catch {
    return photos.split(',').filter(p => p)
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: listQuery.page,
      per_page: listQuery.limit,
      keyword: listQuery.keyword,
      payment_status: listQuery.payment_status,
      status: listQuery.status
    }
    if (listQuery.date_range?.length === 2) {
      params.start_date = listQuery.date_range[0]
      params.end_date = listQuery.date_range[1]
    }
    
    const res = await request({
      url: '/api/admin/water-purifier/install-orders',
      method: 'get',
      params
    })
    if (res.code === 0) {
      list.value = res.data || []
      total.value = res.meta?.total || 0
    }
  } catch (error) {
    ElMessage.error('获取安装订单失败')
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  statsLoading.value = true
  try {
    const res = await request({
      url: '/api/admin/water-purifier/install-orders/stats',
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

const handleFilter = () => {
  listQuery.page = 1
  fetchList()
}

const resetFilter = () => {
  listQuery.keyword = ''
  listQuery.payment_status = ''
  listQuery.status = ''
  listQuery.date_range = []
  handleFilter()
}

const showDetail = (row) => {
  currentOrder.value = row
  detailVisible.value = true
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
.stat-card.total-paid { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
.stat-card.total { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; }
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
.photo-gallery {
  display: flex;
  flex-wrap: wrap;
}
</style>
