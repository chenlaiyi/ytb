<template>
  <div class="monthly-data-page">
    <div class="page-header">
      <h2>月数据</h2>
      <p>查看盛付通机构月度交易数据统计</p>
    </div>
    
    <!-- 查询条件 -->
    <el-card shadow="hover" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="数据月份">
          <el-date-picker
            v-model="searchForm.month"
            type="month"
            placeholder="选择月份"
            value-format="YYYY-MM"
            :disabled-date="disabledDate"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="机构名称/编号">
          <el-input
            v-model="searchForm.search"
            placeholder="请输入机构名称或编号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="等级">
          <el-select v-model="searchForm.lv" placeholder="所有等级" clearable style="width: 120px">
            <el-option
              v-for="i in 8"
              :key="i"
              :label="`等级 ${i}`"
              :value="i"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="上级机构">
          <el-input
            v-model="searchForm.super_institution"
            placeholder="请输入上级机构"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
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
    </el-card>

    <!-- 操作按钮 -->
    <el-card shadow="hover" class="action-card">
      <div class="action-buttons">
        <el-button type="primary" @click="showCalculateDialog" :loading="calculating">
          <el-icon><Operation /></el-icon>
          计算月数据
        </el-button>
        <el-button type="success" @click="showCheckDataDialog" :loading="checking">
          <el-icon><CircleCheck /></el-icon>
          检查数据
        </el-button>
        <el-button type="info" @click="handleRefresh" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
          </div>
        </el-card>

    <!-- 数据表格 -->
    <el-card shadow="hover" class="table-card">
      <template #header>
        <div class="card-header">
          <span>月数据列表</span>
          <div class="header-info">
            <span>共 {{ total }} 条记录</span>
          </div>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
        @sort-change="handleSortChange"
        :default-sort="{ prop: 'current_month_total_transaction', order: 'descending' }"
      >
        <el-table-column prop="institution_id" label="机构ID" width="80" align="center" />
        <el-table-column prop="institution_name" label="机构名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="xs_number" label="销售编号" width="120" />
        <el-table-column prop="super_institution_name" label="上级机构" min-width="150" show-overflow-tooltip />
        <el-table-column prop="institution_lv" label="等级" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.institution_lv)" size="small">
              {{ row.institution_lv }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column 
          prop="current_month_total_transaction" 
          label="月总交易额" 
          width="150" 
          align="right" 
          sortable="custom"
        >
          <template #default="{ row }">
            <span class="amount-text">{{ formatAmount(row.current_month_total_transaction) }}</span>
          </template>
        </el-table-column>
        <el-table-column 
          prop="current_month_direct_transaction" 
          label="月直营交易额" 
          width="150" 
          align="right" 
          sortable="custom"
        >
          <template #default="{ row }">
            <span class="amount-text">{{ formatAmount(row.current_month_direct_transaction) }}</span>
          </template>
        </el-table-column>
        <el-table-column 
          prop="current_month_direct_commission" 
          label="月直营分润" 
          width="130" 
          align="right" 
          sortable="custom"
        >
          <template #default="{ row }">
            <span class="commission-text">{{ formatAmount(row.current_month_direct_commission) }}</span>
          </template>
        </el-table-column>
        <el-table-column 
          prop="commission_difference" 
          label="分润差额" 
          width="120" 
          align="right" 
          sortable="custom"
        >
          <template #default="{ row }">
            <span class="difference-text">{{ formatAmount(row.commission_difference) }}</span>
          </template>
        </el-table-column>
        <el-table-column 
          prop="current_month_total_commission" 
          label="月总分润" 
          width="120" 
          align="right" 
          sortable="custom"
        >
          <template #default="{ row }">
            <span class="total-commission-text">{{ formatAmount(row.current_month_total_commission) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[15, 30, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 计算月数据对话框 -->
    <el-dialog
      v-model="calculateDialogVisible"
      title="计算月数据"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form :model="calculateForm" label-width="100px">
        <el-form-item label="选择月份" required>
          <el-date-picker
            v-model="calculateForm.month"
            type="month"
            placeholder="选择月份"
            value-format="YYYY-MM"
            :disabled="calculating"
            :disabled-date="disabledDate"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="机构ID">
          <el-input
            v-model="calculateForm.institution_id"
            placeholder="可选，不填则计算所有机构"
            :disabled="calculating"
          />
        </el-form-item>
        
        <!-- 计算进度提示 -->
        <el-form-item v-if="calculating">
          <div class="calculating-tip">
            <el-progress :percentage="calculateProgress" :status="calculateStatus">
              <template #default="{ percentage }">
                <span class="percentage-value">{{ percentage }}%</span>
                <span class="percentage-label">{{ calculateTip }}</span>
              </template>
            </el-progress>
      </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelCalculate" :disabled="calculating">取消</el-button>
          <el-button type="primary" :loading="calculating" @click="submitCalculate">
            {{ calculating ? '计算中...' : '确定' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 检查数据对话框 -->
    <el-dialog
      v-model="checkDataDialogVisible"
      title="检查月数据"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="checkDataForm" label-width="100px">
        <el-form-item label="选择月份" required>
          <el-date-picker
            v-model="checkDataForm.month"
            type="month"
            placeholder="选择月份"
            value-format="YYYY-MM"
            :disabled="checking"
            :disabled-date="disabledDate"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="checkDataDialogVisible = false" :disabled="checking">取消</el-button>
          <el-button type="primary" :loading="checking" @click="submitCheckData">
            {{ checking ? '检查中...' : '确定' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Operation, CircleCheck } from '@element-plus/icons-vue'
import { getMonthlyList, calculateMonthly, checkMonthlyData } from '@/api/shengfutong'

export default {
  name: 'ShengfutongMonthlyData',
  components: {
    Search,
    Refresh,
    Operation,
    CircleCheck
  },
  setup() {
    const loading = ref(false)
    const calculating = ref(false)
    const checking = ref(false)
    const calculateDialogVisible = ref(false)
    const checkDataDialogVisible = ref(false)
    const calculateProgress = ref(0)
    const calculateTip = ref('')
    const calculateStatus = ref('')

    // 搜索表单
    const searchForm = reactive({
      month: '',
      search: '',
      lv: '',
      super_institution: '',
      sort_by: 'current_month_total_transaction',
      order: 'desc'
    })

    // 计算表单
    const calculateForm = reactive({
      month: '',
      institution_id: ''
    })

    // 检查数据表单
    const checkDataForm = reactive({
      month: ''
    })

    // 分页
    const pagination = reactive({
      page: 1,
      size: 15
    })

    // 表格数据
    const tableData = ref([])
    const total = ref(0)

    // 获取数据
    const fetchData = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.page,
          size: pagination.size,
          ...searchForm
        }
        
        const response = await getMonthlyList(params)
        if (response.code === 200) {
          tableData.value = response.data.list || []
          total.value = response.data.total || 0
        } else {
          ElMessage.error(response.message || '获取数据失败')
        }
      } catch (error) {
        console.error('获取月数据失败:', error)
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
      searchForm.month = new Date().toISOString().slice(0, 7)
      searchForm.search = ''
      searchForm.lv = ''
      searchForm.super_institution = ''
      searchForm.sort_by = 'current_month_total_transaction'
      searchForm.order = 'desc'
      pagination.page = 1
      fetchData()
    }

    // 刷新
    const handleRefresh = () => {
      fetchData()
    }

    // 排序变化
    const handleSortChange = ({ prop, order }) => {
      if (prop) {
        searchForm.sort_by = prop
        searchForm.order = order === 'ascending' ? 'asc' : 'desc'
        fetchData()
      }
    }

    // 显示计算对话框
    const showCalculateDialog = () => {
      calculateForm.month = searchForm.month || new Date().toISOString().slice(0, 7)
      calculateForm.institution_id = ''
      calculateDialogVisible.value = true
    }

    // 提交计算
    const submitCalculate = async () => {
      if (!calculateForm.month) {
        ElMessage.warning('请选择月份')
        return
      }

      calculating.value = true
      calculateProgress.value = 0
      calculateTip.value = '开始计算...'
      calculateStatus.value = ''

      try {
        // 模拟计算进度
        const progressSteps = [
          { progress: 20, tip: '计算直营交易和分润...' },
          { progress: 40, tip: '计算总交易量...' },
          { progress: 60, tip: '计算分润差额...' },
          { progress: 80, tip: '计算总分润...' },
          { progress: 100, tip: '计算完成' }
        ]

        for (const step of progressSteps) {
          calculateProgress.value = step.progress
          calculateTip.value = step.tip
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        const response = await calculateMonthly(calculateForm)
        if (response.code === 200) {
          ElMessage.success('计算成功')
          calculateDialogVisible.value = false
          fetchData()
        } else {
          ElMessage.error(response.message || '计算失败')
          calculateStatus.value = 'exception'
        }
      } catch (error) {
        console.error('计算月数据失败:', error)
        ElMessage.error('计算失败')
        calculateStatus.value = 'exception'
      } finally {
        calculating.value = false
        calculateProgress.value = 0
        calculateTip.value = ''
        calculateStatus.value = ''
      }
    }

    // 取消计算
    const cancelCalculate = () => {
      if (calculating.value) {
        return
      }
      calculateDialogVisible.value = false
      calculateForm.month = ''
      calculateForm.institution_id = ''
      calculateProgress.value = 0
      calculateTip.value = ''
      calculateStatus.value = ''
    }

    // 显示检查数据对话框
    const showCheckDataDialog = () => {
      checkDataForm.month = searchForm.month || new Date().toISOString().slice(0, 7)
      checkDataDialogVisible.value = true
    }

    // 提交检查数据
    const submitCheckData = async () => {
      if (!checkDataForm.month) {
        ElMessage.warning('请选择月份')
        return
      }

      checking.value = true
      try {
        const response = await checkMonthlyData(checkDataForm)
        if (response.code === 200) {
          ElMessage.success('数据检查通过')
          checkDataDialogVisible.value = false
        } else {
          ElMessage.warning(response.message || '数据检查失败')
          if (response.available_months) {
            ElMessage.info(`可用月份: ${response.available_months.join(', ')}`)
          }
        }
      } catch (error) {
        console.error('检查月数据失败:', error)
        ElMessage.error('检查失败')
      } finally {
        checking.value = false
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

    // 禁用未来月份
    const disabledDate = (time) => {
      return time.getTime() > Date.now()
    }

    // 格式化金额
    const formatAmount = (amount) => {
      return amount ? parseFloat(amount).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) : '0.00'
    }

    // 获取等级类型
    const getLevelType = (level) => {
      if (level >= 7) return 'danger'
      if (level >= 5) return 'warning'
      if (level >= 3) return 'success'
      return 'info'
    }

    onMounted(() => {
      // 设置默认月份为本月
      searchForm.month = new Date().toISOString().slice(0, 7)
      fetchData()
    })

    return {
      loading,
      calculating,
      checking,
      calculateDialogVisible,
      checkDataDialogVisible,
      calculateProgress,
      calculateTip,
      calculateStatus,
      searchForm,
      calculateForm,
      checkDataForm,
      pagination,
      tableData,
      total,
      fetchData,
      handleSearch,
      handleReset,
      handleRefresh,
      handleSortChange,
      showCalculateDialog,
      submitCalculate,
      cancelCalculate,
      showCheckDataDialog,
      submitCheckData,
      handleSizeChange,
      handleCurrentChange,
      disabledDate,
      formatAmount,
      getLevelType
    }
  }
}
</script>

<style scoped>
.monthly-data-page {
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

.search-card {
  margin-bottom: 20px;
}

.action-card {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info {
  color: #909399;
  font-size: 14px;
}

.amount-text {
  font-weight: 600;
  color: #409EFF;
}

.commission-text {
  font-weight: 600;
  color: #67C23A;
}

.difference-text {
  font-weight: 600;
  color: #E6A23C;
}

.total-commission-text {
  font-weight: 600;
  color: #F56C6C;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.calculating-tip {
  margin-top: 20px;
  text-align: center;
}

.percentage-value {
  font-size: 16px;
  font-weight: bold;
  margin-right: 8px;
}

.percentage-label {
  color: #909399;
  font-size: 14px;
}
</style> 