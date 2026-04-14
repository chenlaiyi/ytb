<template>
  <div class="starpay-partner-page">
    <div class="content-container">
      <el-card shadow="hover" class="overview-card">
        <template #header>
          <div class="card-header">
            <span>服务商概览</span>
            <el-button link type="primary" @click="loadSummary" :loading="loading.summary">
              刷新
            </el-button>
          </div>
        </template>
        <div class="summary-grid">
          <div
            v-for="item in summaryCards"
            :key="item.title"
            class="stat-card"
          >
            <div class="stat-title">{{ item.title }}</div>
            <div class="stat-value">{{ item.value }}</div>
            <div class="stat-extra">{{ item.extra }}</div>
          </div>
        </div>
        <div class="summary-range">
          统计区间：{{ summaryRangeText }}
        </div>
      </el-card>

      <el-card shadow="hover" class="filter-card">
        <template #header>
          <div class="card-header">
            <span>筛选条件</span>
            <div class="card-actions">
              <el-button @click="resetFilters">重置</el-button>
              <el-button type="primary" @click="handleFilter" :loading="loading.table">查询</el-button>
            </div>
          </div>
        </template>
        <el-form :model="filters" label-width="96px" label-position="left" class="filter-form">
          <el-row :gutter="16">
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="关键字">
                <el-input v-model.trim="filters.keyword" placeholder="服务商名称 / 编号" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="4">
              <el-form-item label="活动名称">
                <el-input v-model.trim="filters.activity" placeholder="如：买断版" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="4">
              <el-form-item label="业务类型">
                <el-select v-model="filters.businessType" placeholder="全部" clearable>
                  <el-option label="星驿付" value="星驿付" />
                  <el-option label="其他业务" value="其他" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <el-card shadow="hover" class="table-card">
        <template #header>
          <div class="card-header">
            <span>服务商列表</span>
            <div class="card-actions">
              <el-button type="primary" @click="handleExport" :loading="loading.export">
                导出
              </el-button>
              <el-button @click="loadPartners" :loading="loading.table">
                刷新
              </el-button>
            </div>
          </div>
        </template>
        <el-table
          v-loading="loading.table"
          :data="partners"
          border
          size="small"
          @sort-change="handleSortChange"
        >
          <el-table-column prop="agent_no" label="服务商编号" width="160" />
          <el-table-column prop="agent_name" label="服务商名称" min-width="200" show-overflow-tooltip />
          <el-table-column prop="merchant_total" label="商户总数" width="130" sortable="custom">
            <template #default="scope">
              {{ formatInteger(scope.row.merchant_total) }}
            </template>
          </el-table-column>
          <el-table-column prop="transaction_volume" label="交易量" width="140" sortable="custom">
            <template #default="scope">
              ¥{{ formatAmount(scope.row.transaction_volume) }}
            </template>
          </el-table-column>
          <el-table-column prop="transaction_count" label="交易笔数" width="130" sortable="custom">
            <template #default="scope">
              {{ formatInteger(scope.row.transaction_count) }} 笔
            </template>
          </el-table-column>
          <el-table-column prop="average_per_transaction" label="笔均交易" width="140" sortable="custom">
            <template #default="scope">
              ¥{{ formatAmount(scope.row.average_per_transaction) }}
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="导入时间" width="180" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button type="primary" link @click="viewDetail(scope.row)">
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-bar">
          <el-pagination
            v-model:current-page="pagination.current"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            layout="prev, pager, next, ->, total"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 服务商详情对话框 -->
    <el-dialog
      v-model="detailDialog.visible"
      title="服务商详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="detailDialog.data" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="服务商编号">{{ detailDialog.data.agent_no }}</el-descriptions-item>
          <el-descriptions-item label="服务商名称">{{ detailDialog.data.agent_name }}</el-descriptions-item>
          <el-descriptions-item label="商户总数">{{ formatInteger(detailDialog.data.merchant_total) }}</el-descriptions-item>
          <el-descriptions-item label="业务类型">{{ detailDialog.data.business_type }}</el-descriptions-item>
          <el-descriptions-item label="产品类型">{{ detailDialog.data.product_type }}</el-descriptions-item>
          <el-descriptions-item label="活动名称">{{ detailDialog.data.activity_name }}</el-descriptions-item>
          <el-descriptions-item label="交易量">¥{{ formatAmount(detailDialog.data.transaction_volume) }}</el-descriptions-item>
          <el-descriptions-item label="交易笔数">{{ formatInteger(detailDialog.data.transaction_count) }}</el-descriptions-item>
          <el-descriptions-item label="笔均金额">¥{{ formatAmount(detailDialog.data.average_per_transaction) }}</el-descriptions-item>
          <el-descriptions-item label="导入时间">{{ detailDialog.data.created_at }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ detailDialog.data.updated_at }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  fetchStarpayPartners, 
  exportStarpayPartners,
  fetchStarpayStats 
} from '@/api/v1/starpayUpload'

const loading = reactive({
  table: false,
  summary: false,
  export: false
})

const filters = reactive({
  keyword: '',
  activity: '',
  businessType: ''
})

const partners = ref([])
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0
})

const sortConfig = reactive({
  prop: '',
  order: ''
})

const detailDialog = reactive({
  visible: false,
  data: null
})

const summaryCards = ref([
  { title: '服务商总数', value: '0', extra: '累计导入的服务商' },
  { title: '总交易量', value: '¥0.00', extra: '上传数据统计' },
  { title: '总交易笔数', value: '0', extra: '上传数据统计' },
  { title: '平均单笔金额', value: '¥0.00', extra: '交易量 / 笔数' },
  { title: '总手续费', value: '¥0.00', extra: '交易手续费合计' }
])
const summaryRange = ref({ start: '--', end: '--' })
const summaryRangeText = computed(() => {
  const start = summaryRange.value.start || '--'
  const end = summaryRange.value.end || '--'
  return `${start} ~ ${end}`
})

const formatAmount = amount => {
  return Number(amount || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatInteger = value => {
  return Number(value || 0).toLocaleString('zh-CN')
}

const loadSummary = async () => {
  loading.summary = true
  try {
    const response = await fetchStarpayStats()
    if (response?.code === 0 && response.data) {
      const partnerStats = response.data.partners || {}
      const importedCount = Number(partnerStats.total_count || 0)
      const activeCount = Number(partnerStats.active_count || 0)
      const totalVolume = Number(partnerStats.total_amount || 0)
      const totalTransactions = Number(partnerStats.total_volume || 0)
      const totalFee = Number(partnerStats.total_fee || 0)
      const avgPerTxn = totalTransactions > 0 ? totalVolume / totalTransactions : 0
      summaryCards.value = [
        { title: '服务商总数', value: formatInteger(importedCount), extra: '累计导入服务商' },
        { title: '活跃服务商', value: formatInteger(activeCount), extra: '交易明细内有数据' },
        { title: '总交易量', value: `¥${formatAmount(totalVolume)}`, extra: '服务商数据合计' },
        { title: '总交易笔数', value: `${formatInteger(totalTransactions)} 笔`, extra: '服务商数据合计' },
        { title: '平均单笔金额', value: `¥${formatAmount(avgPerTxn)}`, extra: '交易量 / 笔数' },
        { title: '总手续费', value: `¥${formatAmount(totalFee)}`, extra: '交易明细手续费合计' }
      ]
      summaryRange.value = partnerStats.range || { start: '--', end: '--' }
    }
  } catch (error) {
    ElMessage.error('获取概览数据失败')
  } finally {
    loading.summary = false
  }
}

const loadPartners = async () => {
  loading.table = true
  try {
    const params = {
      page: pagination.current,
      per_page: pagination.pageSize,
      keyword: filters.keyword || undefined,
      activity_name: filters.activity || undefined,
      business_type: filters.businessType || undefined,
      sort: sortConfig.prop,
      order: sortConfig.order
    }
    const response = await fetchStarpayPartners(params)
    if (response?.code === 0 && response.data) {
      partners.value = response.data.data || []
      pagination.total = response.data.total || 0
    }
  } catch (error) {
    ElMessage.error('获取服务商列表失败')
  } finally {
  loading.table = false
  }
}

const handleFilter = () => {
  pagination.current = 1
  loadPartners()
}

const resetFilters = () => {
  Object.assign(filters, {
    keyword: '',
    activity: '',
    businessType: ''
  })
  pagination.current = 1
  loadPartners()
}

const handlePageChange = page => {
  pagination.current = page
  loadPartners()
}

const handleSortChange = ({ prop, order }) => {
  sortConfig.prop = prop
  sortConfig.order = order
  pagination.current = 1
  loadPartners()
}

const handleExport = async () => {
  loading.export = true
  try {
    const params = {
      keyword: filters.keyword || undefined,
      activity_name: filters.activity || undefined,
      business_type: filters.businessType || undefined
    }
    const response = await exportStarpayPartners(params)
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `星驿付服务商数据_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    loading.export = false
  }
}

const viewDetail = row => {
  detailDialog.data = row
  detailDialog.visible = true
}

onMounted(() => {
  loadSummary()
  loadPartners()
})
</script>

<style scoped>
.starpay-partner-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100%;
}

.content-container {
  max-width: 1400px;
  margin: 0 auto;
}

.overview-card {
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.summary-range {
  margin-top: 16px;
  font-size: 13px;
  color: #6c757d;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  border: 1px solid #e9ecef;
}

.stat-title {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 4px;
}

.stat-extra {
  font-size: 12px;
  color: #adb5bd;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 600;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-form {
  margin-top: 10px;
}

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.detail-content {
  max-height: 60vh;
  overflow-y: auto;
}
</style>
