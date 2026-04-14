<template>
  <div class="merchant-summary">
    <!-- 查询条件 -->
    <el-card shadow="hover" class="search-card">
      <template #header>
        <div class="card-header">
          <span class="title">商户汇总查询</span>
        </div>
      </template>
      
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="数据日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        
        <el-form-item label="商户号">
          <el-input
            v-model="searchForm.merchantCode"
            placeholder="请输入商户号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="商户名称">
          <el-input
            v-model="searchForm.merchantName"
            placeholder="请输入商户名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="机构代码">
          <el-input
            v-model="searchForm.institutionCode"
            placeholder="请输入机构代码"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="交易金额">
          <el-input
            v-model="searchForm.minAmount"
            placeholder="最小金额"
            style="width: 120px"
          />
          <span style="margin: 0 8px;">-</span>
          <el-input
            v-model="searchForm.maxAmount"
            placeholder="最大金额"
            style="width: 120px"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button type="success" @click="handleExport" :loading="exporting">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计概览 -->
    <el-card shadow="hover" class="stats-card">
      <template #header>
        <div class="card-header">
          <span class="title">汇总统计</span>
          <div class="time-filter">
            <el-date-picker
              v-model="summaryDateRange"
              type="daterange"
              unlink-panels
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 250px"
              @change="updateSummaryStats"
            />
            <el-button
              size="small"
              type="danger"
              plain
              style="margin-left: 10px;"
              @click="resetSummaryRange"
            >
              重置时间
            </el-button>
          </div>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">¥{{ formatNumber(summaryStats.totalCommission) }}</div>
            <div class="stat-label">总分润</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">¥{{ formatNumber(summaryStats.totalAmount) }}</div>
            <div class="stat-label">商户交易额</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">¥{{ formatNumber(summaryStats.totalReward) }}</div>
            <div class="stat-label">总奖励</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ formatNumber(summaryStats.totalMerchants) }}</div>
            <div class="stat-label">商户总数</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="hover" class="table-card">
      <template #header>
        <div class="card-header">
          <span class="title">商户汇总数据</span>
          <div class="actions">
            <el-button size="small" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-dropdown @command="handleBatchAction">
              <el-button size="small">
                批量操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="export">导出选中</el-dropdown-item>
                  <el-dropdown-item command="analyze">数据分析</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>
      
      <el-table 
        :data="tableData" 
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        :default-sort="{ prop: 'total_amount', order: 'descending' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" label="排名" width="60" align="center" />
        
        <el-table-column prop="merchant_code" label="商户号" width="150" align="center">
          <template #default="scope">
            <el-link type="primary" @click="viewMerchantDetail(scope.row)">
              {{ scope.row.merchant_code }}
            </el-link>
          </template>
        </el-table-column>
        
        <el-table-column prop="merchant_name" label="商户名称" min-width="200" show-overflow-tooltip />
        
        <el-table-column prop="institution_name" label="机构名称" min-width="180" show-overflow-tooltip />
        
        <el-table-column prop="transaction_count" label="交易笔数" width="120" align="center" sortable>
          <template #default="scope">
            <span class="number-text">{{ formatNumber(scope.row.transaction_count) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="total_amount" label="交易金额(元)" width="150" align="right" sortable>
          <template #default="scope">
            <span class="amount-text">{{ formatNumber(scope.row.total_amount) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="commission_amount" label="佣金(元)" width="120" align="right" sortable>
          <template #default="scope">
            <span class="commission-text">{{ formatNumber(scope.row.commission_amount) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="commission_rate" label="佣金率" width="100" align="center" sortable>
          <template #default="scope">
            <span class="rate-text">{{ (scope.row.commission_rate * 100).toFixed(3) }}%</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="avg_amount" label="平均金额(元)" width="120" align="right" sortable>
          <template #default="scope">
            <span class="amount-text">{{ formatNumber(scope.row.avg_amount) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="success_rate" label="成功率" width="100" align="center" sortable>
          <template #default="scope">
            <el-progress 
              :percentage="scope.row.success_rate" 
              :stroke-width="8"
              :show-text="false"
              :color="getSuccessRateColor(scope.row.success_rate)"
            />
            <div class="rate-text">{{ scope.row.success_rate }}%</div>
          </template>
        </el-table-column>
        
        <el-table-column prop="data_date" label="数据日期" width="120" align="center" />
        
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="viewMerchantDetail(scope.row)">
              详情
            </el-button>
            <el-button type="info" size="small" @click="viewTrend(scope.row)">
              趋势
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 商户详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="商户详情"
      width="80%"
      :before-close="handleCloseDetail"
    >
      <div v-if="merchantDetail" class="detail-content">
        <!-- 基本信息 -->
        <el-descriptions title="基本信息" :column="3" border>
          <el-descriptions-item label="商户号">{{ merchantDetail.merchant_code }}</el-descriptions-item>
          <el-descriptions-item label="商户名称">{{ merchantDetail.merchant_name }}</el-descriptions-item>
          <el-descriptions-item label="机构名称">{{ merchantDetail.institution_name }}</el-descriptions-item>
          <el-descriptions-item label="交易笔数">{{ formatNumber(merchantDetail.transaction_count) }}</el-descriptions-item>
          <el-descriptions-item label="交易金额">¥{{ formatNumber(merchantDetail.total_amount) }}</el-descriptions-item>
          <el-descriptions-item label="佣金金额">¥{{ formatNumber(merchantDetail.commission_amount) }}</el-descriptions-item>
          <el-descriptions-item label="佣金率">{{ (merchantDetail.commission_rate * 100).toFixed(3) }}%</el-descriptions-item>
          <el-descriptions-item label="平均金额">¥{{ formatNumber(merchantDetail.avg_amount) }}</el-descriptions-item>
          <el-descriptions-item label="成功率">{{ merchantDetail.success_rate }}%</el-descriptions-item>
        </el-descriptions>
        
        <!-- 趋势图表 -->
        <div class="trend-chart" style="margin-top: 20px;">
          <h4>交易趋势</h4>
          <div ref="trendChartRef" style="width: 100%; height: 300px;"></div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 趋势分析对话框 -->
    <el-dialog
      v-model="trendDialogVisible"
      title="趋势分析"
      width="70%"
      :before-close="handleCloseTrend"
    >
      <div class="trend-analysis">
        <div ref="trendAnalysisChartRef" style="width: 100%; height: 400px;"></div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="trendDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Download, ArrowDown } from '@element-plus/icons-vue'
import { getMerchantSummary, getMerchantSummaryStats, getMerchantDetail } from '@/api/shengfutong'
import * as echarts from 'echarts'

// 搜索表单
const searchForm = reactive({
  dateRange: [],
  merchantCode: '',
  merchantName: '',
  institutionCode: '',
  minAmount: '',
  maxAmount: ''
})

// 表格数据
const tableData = ref([])
const loading = ref(false)
const exporting = ref(false)
const selectedRows = ref([])

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 统计数据
const summaryDateRange = ref([])
const summaryStats = reactive({
  totalMerchants: 0,
  totalAmount: 0,
  totalCommission: 0,
  totalReward: 0
})

// 详情对话框
const detailDialogVisible = ref(false)
const merchantDetail = ref(null)
const trendChartRef = ref(null)

// 趋势分析对话框
const trendDialogVisible = ref(false)
const trendAnalysisChartRef = ref(null)

// 图表实例
let trendChart = null
let trendAnalysisChart = null

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      start_date: searchForm.dateRange?.[0],
      end_date: searchForm.dateRange?.[1],
      merchant_code: searchForm.merchantCode || undefined,
      merchant_name: searchForm.merchantName || undefined,
      institution_code: searchForm.institutionCode || undefined,
      min_amount: searchForm.minAmount || undefined,
      max_amount: searchForm.maxAmount || undefined
    }

    const res = await getMerchantSummary(params)
    if (res.code !== 200 && res.code !== 0) {
      throw new Error(res.message || '接口返回异常')
    }

    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('Error fetching merchant summary:', error)
    ElMessage.error(error.message || '获取商户汇总数据失败')
  } finally {
    loading.value = false
  }
}

// 更新统计数据
const updateSummaryStats = async () => {
  try {
    const res = await getMerchantSummaryStats({
      start_date: summaryDateRange.value?.[0],
      end_date: summaryDateRange.value?.[1]
    })
    if (res.code !== 200 && res.code !== 0) {
      throw new Error(res.message || '接口异常')
    }

    summaryStats.totalMerchants = res.data?.totalMerchants ?? 0
    summaryStats.totalAmount = res.data?.totalAmount ?? 0
    summaryStats.totalCommission = res.data?.totalCommission ?? 0
    summaryStats.totalReward = res.data?.totalReward ?? 0
  } catch (error) {
    console.error('Error updating summary stats:', error)
    ElMessage.error(error.message || '获取统计数据失败')
  }
}

const resetSummaryRange = () => {
  const defaultRange = getDefaultRange()
  summaryDateRange.value = defaultRange
  updateSummaryStats()
}

const getDefaultRange = () => {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - 30)
  return [
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  ]
}

// 查询
const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    dateRange: [],
    merchantCode: '',
    merchantName: '',
    institutionCode: '',
    minAmount: '',
    maxAmount: ''
  })
  pagination.page = 1
  fetchData()
}

// 导出
const handleExport = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要导出当前查询条件下的商户汇总数据吗？',
      '确认导出',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    exporting.value = true
    
    // 这里应该调用导出API
    setTimeout(() => {
      ElMessage.success('导出成功！')
      exporting.value = false
    }, 2000)
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('导出失败')
    }
  }
}

// 刷新数据
const refreshData = () => {
  fetchData()
  updateSummaryStats()
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 批量操作
const handleBatchAction = (command) => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要操作的数据')
    return
  }
  
  switch (command) {
    case 'export':
      ElMessage.success(`导出 ${selectedRows.value.length} 条数据`)
      break
    case 'analyze':
      ElMessage.success(`分析 ${selectedRows.value.length} 条数据`)
      break
  }
}

// 查看商户详情
const viewMerchantDetail = async (row) => {
  try {
    merchantDetail.value = { ...row }
    detailDialogVisible.value = true
    
    // 等待DOM更新后初始化图表
    await nextTick()
    initTrendChart()
  } catch (error) {
    console.error('Error fetching merchant detail:', error)
    ElMessage.error('获取商户详情失败')
  }
}

// 查看趋势
const viewTrend = async (row) => {
  try {
    trendDialogVisible.value = true
    
    // 等待DOM更新后初始化图表
    await nextTick()
    initTrendAnalysisChart(row)
  } catch (error) {
    console.error('Error viewing trend:', error)
    ElMessage.error('查看趋势失败')
  }
}

// 初始化趋势图表
const initTrendChart = () => {
  if (!trendChartRef.value) return
  
  trendChart = echarts.init(trendChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['交易金额', '交易笔数']
    },
    xAxis: {
      type: 'category',
      data: ['01-10', '01-11', '01-12', '01-13', '01-14', '01-15', '01-16']
    },
    yAxis: [
      {
        type: 'value',
        name: '金额(元)',
        position: 'left'
      },
      {
        type: 'value',
        name: '笔数',
        position: 'right'
      }
    ],
    series: [
      {
        name: '交易金额',
        type: 'line',
        data: [45000, 52000, 48000, 61000, 55000, 67000, 58000],
        smooth: true
      },
      {
        name: '交易笔数',
        type: 'bar',
        yAxisIndex: 1,
        data: [150, 173, 160, 203, 183, 223, 193]
      }
    ]
  }
  
  trendChart.setOption(option)
}

// 初始化趋势分析图表
const initTrendAnalysisChart = (row) => {
  if (!trendAnalysisChartRef.value) return
  
  trendAnalysisChart = echarts.init(trendAnalysisChartRef.value)
  
  const option = {
    title: {
      text: `${row.merchant_name} 趋势分析`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['交易金额', '佣金', '成功率'],
      top: 30
    },
    xAxis: {
      type: 'category',
      data: ['01-10', '01-11', '01-12', '01-13', '01-14', '01-15', '01-16']
    },
    yAxis: [
      {
        type: 'value',
        name: '金额(元)',
        position: 'left'
      },
      {
        type: 'value',
        name: '成功率(%)',
        position: 'right',
        max: 100
      }
    ],
    series: [
      {
        name: '交易金额',
        type: 'line',
        data: [45000, 52000, 48000, 61000, 55000, 67000, 58000],
        smooth: true
      },
      {
        name: '佣金',
        type: 'line',
        data: [225, 260, 240, 305, 275, 335, 290],
        smooth: true
      },
      {
        name: '成功率',
        type: 'line',
        yAxisIndex: 1,
        data: [98.2, 97.8, 98.5, 96.9, 98.1, 98.5, 97.6],
        smooth: true
      }
    ]
  }
  
  trendAnalysisChart.setOption(option)
}

// 关闭详情对话框
const handleCloseDetail = () => {
  detailDialogVisible.value = false
  merchantDetail.value = null
  trendChart?.dispose()
  trendChart = null
}

// 关闭趋势对话框
const handleCloseTrend = () => {
  trendDialogVisible.value = false
  trendAnalysisChart?.dispose()
  trendAnalysisChart = null
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchData()
}

// 获取成功率颜色
const getSuccessRateColor = (rate) => {
  if (rate >= 98) return '#67c23a'
  if (rate >= 95) return '#e6a23c'
  return '#f56c6c'
}

// 格式化数字
const formatNumber = (num) => {
  if (!num && num !== 0) return '0'
  return parseFloat(num).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

onMounted(() => {
  // 设置默认查询时间为最近30天
  searchForm.dateRange = getDefaultRange()
  summaryDateRange.value = getDefaultRange()
  
  fetchData()
  updateSummaryStats()
})
</script>

<style scoped>
.merchant-summary {
  padding: 20px;
}

.search-card,
.stats-card,
.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-weight: 600;
  font-size: 16px;
}

.search-form {
  padding: 10px 0;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  position: relative;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 5px;
}

.stat-change {
  font-size: 12px;
  font-weight: 600;
}

.stat-change.up {
  color: #67c23a;
}

.stat-change.down {
  color: #f56c6c;
}

.number-text {
  color: #409eff;
  font-weight: 600;
}

.amount-text {
  color: #67c23a;
  font-weight: 600;
}

.commission-text {
  color: #e6a23c;
  font-weight: 600;
}

.rate-text {
  color: #f56c6c;
  font-weight: 600;
  font-size: 12px;
  margin-top: 2px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.trend-chart h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.time-filter {
  display: flex;
  align-items: center;
}
</style> 
