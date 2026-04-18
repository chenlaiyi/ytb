<template>
  <div class="heartbeat-page">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.total_devices }}</div>
          <div class="stat-label">设备总数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-online">
          <div class="stat-value">{{ stats.online_devices }}</div>
          <div class="stat-label">在线设备</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-offline">
          <div class="stat-value">{{ stats.offline_devices }}</div>
          <div class="stat-label">离线设备</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-today">
          <div class="stat-value">{{ stats.today_heartbeats }}</div>
          <div class="stat-label">今日心跳</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>设备心跳数据</span>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索设备编号"
            style="width: 200px;"
            clearable
            @clear="loadData"
            @keyup.enter="loadData"
          >
            <template #append>
              <el-button @click="loadData">搜索</el-button>
            </template>
          </el-input>
        </div>
      </template>

      <el-table :data="heartbeats" stripe v-loading="loading">
        <el-table-column prop="board_code" label="设备编号" width="120" fixed />
        <el-table-column label="在线状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_online ? 'success' : 'danger'" size="small">
              {{ row.is_online ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="设备状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.locking_status === 'locked'" type="danger" size="small">锁定</el-tag>
            <el-tag v-else-if="row.is_online" type="success" size="small">正常</el-tag>
            <el-tag v-else type="info" size="small">离线</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="TDS" width="120">
          <template #default="{ row }">
            <span class="tds-info">
              <span class="tds-label">原水</span>
              <span :class="getTdsClass(row.raw_water_tds)">{{ row.raw_water_tds }}</span>
              <span class="tds-divider">/</span>
              <span class="tds-label">净水</span>
              <span :class="getTdsClass(row.pure_water_tds, true)">{{ row.pure_water_tds }}</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="滤芯寿命" min-width="280">
          <template #default="{ row }">
            <div class="filter-progress">
              <el-tooltip :content="`F1: ${row.f1_flux}/${row.f1_flux_max}L`" placement="top">
                <div class="filter-item">
                  <span class="filter-label">F1</span>
                  <el-progress
                    :percentage="calcFilterPercent(row.f1_flux, row.f1_flux_max)"
                    :status="getFilterStatus(row.f1_flux, row.f1_flux_max)"
                    :stroke-width="8"
                    style="width: 50px;"
                  />
                </div>
              </el-tooltip>
              <el-tooltip :content="`F2: ${row.f2_flux}/${row.f2_flux_max}L`" placement="top">
                <div class="filter-item">
                  <span class="filter-label">F2</span>
                  <el-progress
                    :percentage="calcFilterPercent(row.f2_flux, row.f2_flux_max)"
                    :status="getFilterStatus(row.f2_flux, row.f2_flux_max)"
                    :stroke-width="8"
                    style="width: 50px;"
                  />
                </div>
              </el-tooltip>
              <el-tooltip :content="`F3: ${row.f3_flux}/${row.f3_flux_max}L`" placement="top">
                <div class="filter-item">
                  <span class="filter-label">F3</span>
                  <el-progress
                    :percentage="calcFilterPercent(row.f3_flux, row.f3_flux_max)"
                    :status="getFilterStatus(row.f3_flux, row.f3_flux_max)"
                    :stroke-width="8"
                    style="width: 50px;"
                  />
                </div>
              </el-tooltip>
              <el-tooltip :content="`F4: ${row.f4_flux}/${row.f4_flux_max}L`" placement="top">
                <div class="filter-item">
                  <span class="filter-label">F4</span>
                  <el-progress
                    :percentage="calcFilterPercent(row.f4_flux, row.f4_flux_max)"
                    :status="getFilterStatus(row.f4_flux, row.f4_flux_max)"
                    :stroke-width="8"
                    style="width: 50px;"
                  />
                </div>
              </el-tooltip>
              <el-tooltip :content="`F5: ${row.f5_flux}/${row.f5_flux_max}L`" placement="top">
                <div class="filter-item">
                  <span class="filter-label">F5</span>
                  <el-progress
                    :percentage="calcFilterPercent(row.f5_flux, row.f5_flux_max)"
                    :status="getFilterStatus(row.f5_flux, row.f5_flux_max)"
                    :stroke-width="8"
                    style="width: 50px;"
                  />
                </div>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="剩余流量" width="90">
          <template #default="{ row }">
            <span :class="{ 'low-flow': row.surplus_flow < 100 }">{{ row.surplus_flow }}L</span>
          </template>
        </el-table-column>
        <el-table-column label="累计净化" width="100">
          <template #default="{ row }">
            {{ row.cumulative_filtration_flow }}L
          </template>
        </el-table-column>
        <el-table-column label="信号" width="70">
          <template #default="{ row }">
            <el-tag :type="getSignalType(row.signal_strength)" size="small">
              {{ row.signal_strength }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="received_at" label="最后心跳" width="160" />
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadData"
        @current-change="loadData"
        style="margin-top: 20px;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getDeviceHeartbeats } from '@/api/v1/ytb'

const heartbeats = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchKeyword = ref('')
const stats = ref({
  total_devices: 0,
  online_devices: 0,
  offline_devices: 0,
  today_heartbeats: 0,
})

const calcFilterPercent = (used, max) => {
  if (!max || max === 0) return 100
  const percent = ((max - used) / max) * 100
  return Math.max(0, Math.min(100, Math.round(percent)))
}

const getFilterStatus = (used, max) => {
  const percent = calcFilterPercent(used, max)
  if (percent <= 10) return 'exception'
  if (percent <= 30) return 'warning'
  return 'success'
}

const getSignalType = (strength) => {
  if (strength >= 80) return 'success'
  if (strength >= 50) return 'warning'
  return 'danger'
}

const getTdsClass = (tds, isPure = false) => {
  if (isPure) {
    if (tds <= 50) return 'tds-excellent'
    if (tds <= 100) return 'tds-good'
    if (tds <= 200) return 'tds-fair'
    return 'tds-poor'
  }
  if (tds <= 300) return 'tds-excellent'
  if (tds <= 500) return 'tds-good'
  if (tds <= 1000) return 'tds-fair'
  return 'tds-poor'
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getDeviceHeartbeats({
      page: currentPage.value,
      per_page: pageSize.value,
      keyword: searchKeyword.value
    })
    if (res.code === 0) {
      heartbeats.value = res.data.list || []
      total.value = res.data.total || 0
      if (res.data.stats) {
        stats.value = res.data.stats
      }
    }
  } catch (error) {
    console.error('加载心跳数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.heartbeat-page {
  padding: 20px;
}

.stats-row {
  margin-bottom: 0;
}

.stat-card {
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-online {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-offline {
  background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
}

.stat-today {
  background: linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%);
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-progress {
  display: flex;
  gap: 8px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-label {
  font-size: 12px;
  width: 20px;
  color: #909399;
}

.tds-info {
  font-size: 12px;
}

.tds-label {
  color: #909399;
  margin: 0 2px;
}

.tds-divider {
  color: #c0c4cc;
  margin: 0 4px;
}

.tds-excellent {
  color: #67c23a;
}

.tds-good {
  color: #85ce61;
}

.tds-fair {
  color: #e6a23c;
}

.tds-poor {
  color: #f56c6c;
}

.low-flow {
  color: #f56c6c;
  font-weight: bold;
}
</style>
