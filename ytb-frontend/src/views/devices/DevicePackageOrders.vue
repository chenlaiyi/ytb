<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><Tickets /></el-icon>
          套餐订单
        </h2>
        <span class="subtitle">查看所有已激活净水器的套餐情况</span>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">激活设备</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.flow_count }}</div>
        <div class="stat-label">流量套餐</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.duration_count }}</div>
        <div class="stat-label">包年套餐</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.online }}</div>
        <div class="stat-label">在线设备</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-value">{{ stats.low_warning }}</div>
        <div class="stat-label">低量预警</div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-select v-model="filter.billing_mode" placeholder="套餐类型" clearable @change="fetchList" style="width: 130px">
        <el-option label="流量套餐" value="flow" />
        <el-option label="包年套餐" value="time" />
      </el-select>
      <el-select v-model="filter.status" placeholder="设备状态" clearable @change="fetchList" style="width: 130px">
        <el-option label="在线" value="online" />
        <el-option label="离线" value="offline" />
      </el-select>
      <el-input v-model="filter.keyword" placeholder="设备编号/板号" clearable @input="debounceFetch" style="width: 180px">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button @click="resetFilter">重置</el-button>
    </div>

    <!-- 设备套餐列表 -->
    <el-table v-loading="loading" :data="list" border stripe style="width: 100%">
      <el-table-column prop="board_code" label="设备编号" width="140" align="center">
        <template #default="{ row }">
          <span class="device-code">{{ row.board_code }}</span>
        </template>
      </el-table-column>
      <el-table-column label="设备信息" min-width="160">
        <template #default="{ row }">
          <div class="device-info">
            <span class="brand">{{ row.brand || '净之泉' }}</span>
            <span class="model">{{ row.device_model || '未知型号' }}</span>
          </div>
          <div class="device-address">{{ row.address || row.client_address || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="套餐类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.billing_mode === 'flow' ? 'primary' : 'success'" size="small">
            {{ row.billing_mode === 'flow' ? '流量套餐' : '包年套餐' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="剩余量" width="120" align="center">
        <template #default="{ row }">
          <div v-if="row.billing_mode === 'flow'" class="剩余量">
            <span class="value">{{ row.surplus_flow || 0 }}</span>
            <span class="unit">L</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: Math.min(100, (row.surplus_flow / 4000) * 100) + '%' }"></div>
            </div>
          </div>
          <div v-else class="剩余量">
            <span class="value">{{ row.remaining_days || 0 }}</span>
            <span class="unit">天</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: Math.min(100, (row.remaining_days / 365) * 100) + '%' }"></div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.is_online ? 'success' : 'danger'" size="small">
            {{ row.is_online ? '在线' : '离线' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="用户" min-width="120">
        <template #default="{ row }">
          <div v-if="row.user_name">{{ row.user_name }}</div>
          <div v-if="row.user_phone" class="phone">{{ row.user_phone }}</div>
          <span v-if="!row.user_name && !row.user_phone" class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="activate_date" label="激活日期" width="100" align="center">
        <template #default="{ row }">
          {{ row.activate_date ? row.activate_date.split(' ')[0] : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="最新心跳" width="160" align="center">
        <template #default="{ row }">
          <span v-if="row.last_heartbeat">{{ row.last_heartbeat }}</span>
          <span v-else class="text-muted">无</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
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
import { Tickets, Search } from '@element-plus/icons-vue'
import request from '@/utils/request'

const loading = ref(false)
const list = ref([])
const stats = ref({ total: 0, flow_count: 0, duration_count: 0, online: 0, low_warning: 0 })

const filter = reactive({
  billing_mode: '',
  status: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

let debounceTimer = null
const debounceFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    pagination.page = 1
    fetchList()
  }, 300)
}

const resetFilter = () => {
  filter.billing_mode = ''
  filter.status = ''
  filter.keyword = ''
  pagination.page = 1
  fetchList()
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit
    }
    if (filter.billing_mode) params.billing_mode = filter.billing_mode
    if (filter.status) params.status = filter.status
    if (filter.keyword) params.keyword = filter.keyword

    const res = await request({
      url: '/api/admin/device-package-orders',
      method: 'get',
      params
    })
    if (res.code === 0) {
      list.value = res.data.list || []
      stats.value = res.data.stats || { total: 0, flow_count: 0, duration_count: 0, online: 0, low_warning: 0 }
      pagination.total = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (error) {
    ElMessage.error('获取套餐订单列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.app-container { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.header-left { display: flex; flex-direction: column; gap: 4px; }
.page-title { font-size: 24px; font-weight: 600; display: flex; align-items: center; gap: 8px; margin: 0; }
.subtitle { font-size: 13px; color: #909399; margin-left: 32px; }

.stats-row { display: flex; gap: 16px; margin-bottom: 20px; }
.stat-card { flex: 1; background: #fff; border-radius: 8px; padding: 16px 20px; border: 1px solid #ebeef5; text-align: center; }
.stat-value { font-size: 28px; font-weight: 700; color: #409eff; }
.stat-card:nth-child(2) .stat-value { color: #67c23a; }
.stat-card:nth-child(3) .stat-value { color: #e6a23c; }
.stat-card:nth-child(4) .stat-value { color: #909399; }
.stat-card.warning .stat-value { color: #f56c6c; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }

.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; }

.device-code { font-family: monospace; font-weight: 600; }
.device-info { display: flex; gap: 8px; align-items: center; }
.brand { background: #409eff; color: #fff; padding: 1px 6px; border-radius: 3px; font-size: 12px; }
.model { color: #606266; font-size: 13px; }
.device-address { font-size: 12px; color: #909399; margin-top: 2px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.剩余量 { display: flex; flex-direction: column; align-items: center; }
.剩余量 .value { font-size: 16px; font-weight: 700; color: #409eff; }
.剩余量 .unit { font-size: 11px; color: #909399; }
.progress-bar { width: 60px; height: 4px; background: #ebeef5; border-radius: 2px; margin-top: 4px; }
.progress-fill { height: 100%; background: #409eff; border-radius: 2px; transition: width 0.3s; }

.phone { font-size: 12px; color: #909399; }
.text-muted { color: #c0c4cc; }

.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 20px; }
</style>
