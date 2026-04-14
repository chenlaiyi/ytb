<template>
  <div class="daily-data-page">
    <div class="page-header">
      <h2>日数据管理</h2>
      <p>机构日数据统计与计算管理</p>
    </div>
    
    <!-- 操作工具栏 -->
    <el-card shadow="hover" class="toolbar-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="日期">
          <el-date-picker
            v-model="searchForm.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.search"
            placeholder="机构名称或编号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="等级">
          <el-select
            v-model="searchForm.lv"
            placeholder="选择等级"
            clearable
            style="width: 120px"
          >
            <el-option label="1级" value="1" />
            <el-option label="2级" value="2" />
            <el-option label="3级" value="3" />
            <el-option label="4级" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="上级机构">
          <el-input
            v-model="searchForm.super_institution"
            placeholder="上级机构名称"
            clearable
            style="width: 200px"
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
        </el-form-item>
      </el-form>
      
      <div class="toolbar-actions">
        <el-button type="success" @click="showCalculateDialog" :disabled="!searchForm.date">
                          <el-icon><Operation /></el-icon>
          计算日数据
        </el-button>
        <el-button type="warning" @click="showBatchCalculateDialog">
          <el-icon><Operation /></el-icon>
          批量计算
        </el-button>
        <el-button type="info" @click="showCheckDataDialog" :disabled="!searchForm.date">
          <el-icon><View /></el-icon>
          检查数据
        </el-button>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="hover" class="table-card">
      <template #header>
        <div class="card-header">
          <span>机构日数据列表</span>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
        :default-sort="{ prop: 'total_transaction', order: 'descending' }"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="institution_id" label="机构ID" width="80" />
        <el-table-column prop="institution_name" label="机构名称" min-width="200" />
        <el-table-column prop="xs_number" label="销售编号" width="120" />
        <el-table-column prop="super_institution_name" label="上级机构" min-width="150" />
        <el-table-column prop="institution_lv" label="等级" width="80" align="center" />
        <el-table-column prop="total_transaction" label="总交易额" width="120" align="right" sortable="custom">
          <template #default="{ row }">
            <span class="amount-text">{{ formatAmount(row.total_transaction) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="direct_transaction" label="直接交易额" width="120" align="right" sortable="custom">
          <template #default="{ row }">
            <span class="amount-text">{{ formatAmount(row.direct_transaction) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="direct_commission" label="直接佣金" width="120" align="right" sortable="custom">
          <template #default="{ row }">
            <span class="commission-text">{{ formatAmount(row.direct_commission) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="commission_difference" label="佣金差额" width="120" align="right" sortable="custom">
          <template #default="{ row }">
            <span class="commission-text">{{ formatAmount(row.commission_difference) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_commission" label="总佣金" width="120" align="right" sortable="custom">
          <template #default="{ row }">
            <span class="commission-text">{{ formatAmount(row.total_commission) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[15, 30, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 计算日数据对话框 -->
    <el-dialog
      v-model="calculateDialogVisible"
      title="计算日数据"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="calculateForm" label-width="80px">
        <el-form-item label="计算日期">
          <el-date-picker
            v-model="calculateForm.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="calculateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCalculateDaily" :loading="calculateLoading">
          开始计算
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量计算对话框 -->
    <el-dialog
      v-model="batchCalculateDialogVisible"
      title="批量计算日数据"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="batchCalculateForm" label-width="100px">
        <el-form-item label="开始日期">
          <el-date-picker
            v-model="batchCalculateForm.start_date"
            type="date"
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker
            v-model="batchCalculateForm.end_date"
            type="date"
            placeholder="选择结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchCalculateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBatchCalculateDaily" :loading="batchCalculateLoading">
          开始批量计算
        </el-button>
      </template>
    </el-dialog>

    <!-- 数据检查对话框 -->
    <el-dialog
      v-model="checkDataDialogVisible"
      title="数据检查"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form :model="checkDataForm" label-width="80px">
        <el-form-item label="检查日期">
          <el-date-picker
            v-model="checkDataForm.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 200px"
          />
          <el-button type="primary" @click="handleCheckData" :loading="checkDataLoading" style="margin-left: 10px">
            开始检查
          </el-button>
        </el-form-item>
      </el-form>
      
      <div v-if="checkDataResult" class="check-result">
        <h4>检查结果</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="检查日期">{{ checkDataResult.date }}</el-descriptions-item>
          <el-descriptions-item label="检查状态">
            <el-tag :type="checkDataResult.status === 'consistent' ? 'success' : 'danger'">
              {{ checkDataResult.status === 'consistent' ? '数据一致' : '数据不一致' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="渠道商汇总数据">{{ checkDataResult.data_status.reseller_sum_count }}条</el-descriptions-item>
          <el-descriptions-item label="交易明细数据">{{ checkDataResult.data_status.detail_count }}条</el-descriptions-item>
          <el-descriptions-item label="代理商汇总数据">{{ checkDataResult.data_status.agent_mch_sum_count }}条</el-descriptions-item>
          <el-descriptions-item label="计算结果数据">{{ checkDataResult.data_status.calculated_count }}条</el-descriptions-item>
          <el-descriptions-item label="明细总金额">{{ formatAmount(checkDataResult.data_consistency.detail_total_amount) }}</el-descriptions-item>
          <el-descriptions-item label="计算总金额">{{ formatAmount(checkDataResult.data_consistency.calculated_total_amount) }}</el-descriptions-item>
        </el-descriptions>
        
        <div v-if="checkDataResult.data_consistency.inconsistencies.length > 0" class="inconsistencies">
          <h5>数据不一致详情</h5>
          <el-table :data="checkDataResult.data_consistency.inconsistencies" border>
            <el-table-column prop="type" label="不一致类型" />
            <el-table-column prop="detail_amount" label="明细金额" align="right">
              <template #default="{ row }">
                {{ formatAmount(row.detail_amount) }}
              </template>
            </el-table-column>
            <el-table-column prop="calculated_amount" label="计算金额" align="right">
              <template #default="{ row }">
                {{ formatAmount(row.calculated_amount) }}
              </template>
            </el-table-column>
            <el-table-column prop="difference" label="差额" align="right">
              <template #default="{ row }">
                <span :class="row.difference > 0 ? 'text-success' : 'text-danger'">
                  {{ formatAmount(row.difference) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="checkDataDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Operation, View } from '@element-plus/icons-vue'
import { getDailyList, calculateDaily, batchCalculateDaily, checkData } from '@/api/shengfutong'

export default {
  name: 'ShengfutongDailyData',
  components: {
    Search,
    Refresh,
  
    Operation,
    View
  },
  setup() {
    const loading = ref(false)
    const calculateLoading = ref(false)
    const batchCalculateLoading = ref(false)
    const checkDataLoading = ref(false)
    
    const calculateDialogVisible = ref(false)
    const batchCalculateDialogVisible = ref(false)
    const checkDataDialogVisible = ref(false)
    
    const checkDataResult = ref(null)

    // 搜索表单
    const searchForm = reactive({
      date: '',
      search: '',
      lv: '',
      super_institution: '',
      sort_by: 'total_transaction',
      order: 'desc'
    })

    // 分页
    const pagination = reactive({
      page: 1,
      size: 15,
      total: 0
    })

    // 表格数据
    const tableData = ref([])

    // 计算表单
    const calculateForm = reactive({
      date: ''
    })

    // 批量计算表单
    const batchCalculateForm = reactive({
      start_date: '',
      end_date: ''
    })

    // 数据检查表单
    const checkDataForm = reactive({
      date: ''
    })

    // 获取数据
    const fetchData = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.page,
          size: pagination.size,
          ...searchForm
        }
        
        const response = await getDailyList(params)
        if (response.code === 0) {
          tableData.value = response.data.list || []
          pagination.total = response.data.total || 0
        } else {
          ElMessage.error(response.message || '获取数据失败')
        }
      } catch (error) {
        console.error('获取日数据失败:', error)
        ElMessage.error('获取数据失败')
      } finally {
        loading.value = false
      }
    }

    // 搜索
    const handleSearch = () => {
      pagination.page = 1
      fetchData()
    }

    // 重置
    const handleReset = () => {
      Object.assign(searchForm, {
        date: '',
        search: '',
        lv: '',
        super_institution: '',
        sort_by: 'total_transaction',
        order: 'desc'
      })
      pagination.page = 1
      fetchData()
    }

    // 刷新
    const handleRefresh = () => {
      fetchData()
    }

    // 排序变化
    const handleSortChange = ({ prop, order }) => {
      searchForm.sort_by = prop
      searchForm.order = order === 'ascending' ? 'asc' : 'desc'
      fetchData()
    }

    // 显示计算对话框
    const showCalculateDialog = () => {
      calculateForm.date = searchForm.date
      calculateDialogVisible.value = true
    }

    // 显示批量计算对话框
    const showBatchCalculateDialog = () => {
      batchCalculateDialogVisible.value = true
    }

    // 显示数据检查对话框
    const showCheckDataDialog = () => {
      checkDataForm.date = searchForm.date
      checkDataResult.value = null
      checkDataDialogVisible.value = true
    }

    // 计算日数据
    const handleCalculateDaily = async () => {
      if (!calculateForm.date) {
        ElMessage.warning('请选择计算日期')
        return
      }

      try {
        await ElMessageBox.confirm(
          `确定要计算 ${calculateForm.date} 的日数据吗？此操作会删除该日期的现有数据并重新计算。`,
          '确认计算',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        calculateLoading.value = true
        const response = await calculateDaily({ date: calculateForm.date })
        
        if (response.code === 0) {
          ElMessage.success(response.message || '计算成功')
          calculateDialogVisible.value = false
          fetchData()
        } else {
          ElMessage.error(response.message || '计算失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('计算日数据失败:', error)
          ElMessage.error('计算失败')
        }
      } finally {
        calculateLoading.value = false
      }
    }

    // 批量计算日数据
    const handleBatchCalculateDaily = async () => {
      if (!batchCalculateForm.start_date || !batchCalculateForm.end_date) {
        ElMessage.warning('请选择开始和结束日期')
        return
      }

      if (batchCalculateForm.start_date > batchCalculateForm.end_date) {
        ElMessage.warning('开始日期不能大于结束日期')
        return
      }

      try {
        await ElMessageBox.confirm(
          `确定要批量计算 ${batchCalculateForm.start_date} 到 ${batchCalculateForm.end_date} 的日数据吗？此操作会删除这些日期的现有数据并重新计算。`,
          '确认批量计算',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        batchCalculateLoading.value = true
        const response = await batchCalculateDaily({
          start_date: batchCalculateForm.start_date,
          end_date: batchCalculateForm.end_date
        })
        
        if (response.code === 0) {
          ElMessage.success(response.message || '批量计算成功')
          batchCalculateDialogVisible.value = false
          fetchData()
        } else {
          ElMessage.error(response.message || '批量计算失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('批量计算日数据失败:', error)
          ElMessage.error('批量计算失败')
        }
      } finally {
        batchCalculateLoading.value = false
      }
    }

    // 检查数据
    const handleCheckData = async () => {
      if (!checkDataForm.date) {
        ElMessage.warning('请选择检查日期')
        return
      }

      checkDataLoading.value = true
      try {
        const response = await checkData({ date: checkDataForm.date })
        
        if (response.code === 0) {
          checkDataResult.value = response.data
          ElMessage.success(response.message || '检查完成')
        } else {
          ElMessage.error(response.message || '检查失败')
        }
      } catch (error) {
        console.error('检查数据失败:', error)
        ElMessage.error('检查失败')
      } finally {
        checkDataLoading.value = false
      }
    }

    // 分页变化
    const handleSizeChange = (size) => {
      pagination.size = size
      pagination.page = 1
      fetchData()
    }

    const handleCurrentChange = (page) => {
      pagination.page = page
      fetchData()
    }

    // 格式化金额
    const formatAmount = (amount) => {
      return amount ? parseFloat(amount).toFixed(2) : '0.00'
    }

    onMounted(() => {
      // 默认查询今天的数据
      const today = new Date()
      searchForm.date = today.toISOString().split('T')[0]
      fetchData()
    })

    return {
      loading,
      calculateLoading,
      batchCalculateLoading,
      checkDataLoading,
      calculateDialogVisible,
      batchCalculateDialogVisible,
      checkDataDialogVisible,
      checkDataResult,
      searchForm,
      pagination,
      tableData,
      calculateForm,
      batchCalculateForm,
      checkDataForm,
      fetchData,
      handleSearch,
      handleReset,
      handleRefresh,
      handleSortChange,
      showCalculateDialog,
      showBatchCalculateDialog,
      showCheckDataDialog,
      handleCalculateDaily,
      handleBatchCalculateDaily,
      handleCheckData,
      handleSizeChange,
      handleCurrentChange,
      formatAmount
    }
  }
}
</script>

<style scoped>
.daily-data-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.toolbar-card {
  margin-bottom: 20px;
}

.toolbar-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.amount-text {
  color: #67c23a;
  font-weight: 500;
}

.commission-text {
  color: #e6a23c;
  font-weight: 500;
}

.check-result {
  margin-top: 20px;
}

.check-result h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.check-result h5 {
  margin: 20px 0 10px 0;
  color: #303133;
}

.inconsistencies {
  margin-top: 20px;
}

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}
</style> 