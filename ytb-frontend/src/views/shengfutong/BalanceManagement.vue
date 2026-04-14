<template>
  <div class="balance-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>盛付通余额管理</span>
        </div>
      </template>

      <!-- 顶部操作区 -->
      <div class="filter-container">
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          format="YYYY-MM"
          value-format="YYYY-MM"
          placeholder="选择月份"
          class="filter-item"
        />
        <el-button
          class="filter-item"
          type="primary"
          @click="handleAddBalance"
          :loading="syncLoading"
        >
          同步分润到待结算
        </el-button>
        <el-button
          class="filter-item"
          type="warning"
          @click="handleBatchToNonWithdrawable"
          :loading="batchNonWithdrawableLoading"
        >
          批量加入不可提现余额
        </el-button>
        <el-button
          class="filter-item"
          type="info"
          @click="handleBatchToWithdrawable"
          :loading="batchWithdrawableLoading"
        >
          批量加入可提现余额
        </el-button>
      </div>

      <!-- 搜索区 -->
      <div class="filter-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索机构名称或ID"
          class="filter-item"
          @keyup.enter="handleSearch"
          clearable
        />
        <el-button
          class="filter-item"
          type="primary"
          @click="handleSearch"
        >
          搜索
        </el-button>
      </div>

      <!-- 统计信息 -->
      <el-row :gutter="20" class="statistics-container">
        <el-col :span="6">
          <div class="statistics-item">
            <div class="stat-label">总待结算:</div>
            <div class="stat-value">¥{{ totalBalances.pending_balance_sum }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="statistics-item">
            <div class="stat-label">可提现余额:</div>
            <div class="stat-value">¥{{ totalBalances.withdrawable_balance_sum }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="statistics-item">
            <div class="stat-label">不可提现余额:</div>
            <div class="stat-value">¥{{ totalBalances.non_withdrawable_balance_sum }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="statistics-item">
            <div class="stat-label">总已提现:</div>
            <div class="stat-value">¥{{ totalBalances.withdrawn_amount_sum }}</div>
          </div>
        </el-col>
      </el-row>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
        :default-sort="{ prop: 'withdrawable_balance', order: 'descending' }"
      >
        <el-table-column prop="institution_id" label="机构ID" width="100" align="center" />
        <el-table-column prop="name" label="机构名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="pending_balance" label="待结算" width="120" align="right" sortable>
          <template #default="scope">
            <span :class="{'amount-positive': scope.row.pending_balance > 0}">
              ¥{{ formatAmount(scope.row.pending_balance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="withdrawable_balance" label="可提余额" width="120" align="right" sortable>
          <template #default="scope">
            <span :class="{'amount-positive': scope.row.withdrawable_balance > 0}">
              ¥{{ formatAmount(scope.row.withdrawable_balance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="non_withdrawable_balance" label="不可提余额" width="120" align="right" sortable>
          <template #default="scope">
            <span :class="{'amount-positive': scope.row.non_withdrawable_balance > 0}">
              ¥{{ formatAmount(scope.row.non_withdrawable_balance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="withdrawn_amount" label="已提现" width="120" align="right" sortable>
          <template #default="scope">
            <span :class="{'amount-positive': scope.row.withdrawn_amount > 0}">
              ¥{{ formatAmount(scope.row.withdrawn_amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="last_synced_period" label="最后同步期间" width="120" align="center" />
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="handleAdjust(scope.row)"
            >
              调整
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 调整余额弹窗 -->
    <el-dialog
      title="余额调整"
      v-model="dialogVisible"
      width="500px"
      destroy-on-close
    >
      <el-form ref="adjustFormRef" :model="adjustForm" label-width="120px">
        <el-form-item label="机构名称">
          <span>{{ currentInstitution.name }}</span>
        </el-form-item>
        <el-form-item label="机构ID">
          <span>{{ currentInstitution.institution_id }}</span>
        </el-form-item>
        <el-form-item label="余额类型" required>
          <el-radio-group v-model="adjustForm.balance_type">
            <el-radio label="pending">待结算</el-radio>
            <el-radio label="withdrawable">可提现</el-radio>
            <el-radio label="non_withdrawable">不可提现</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="变化类型" required>
          <el-radio-group v-model="adjustForm.change_type">
            <el-radio label="increase">增加</el-radio>
            <el-radio label="decrease">减少</el-radio>
            <el-radio label="final">设为最终余额</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="金额" required>
          <el-input-number
            v-model="adjustForm.amount"
            :precision="2"
            :step="0.01"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="confirmAdjust" :loading="adjustLoading">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getBalanceList, 
  addBalance, 
  batchToNonWithdrawable, 
  batchToWithdrawable, 
  updateBalance 
} from '@/api/balance-management'

// 状态定义
const loading = ref(false)
const syncLoading = ref(false)
const batchNonWithdrawableLoading = ref(false)
const batchWithdrawableLoading = ref(false)
const adjustLoading = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const selectedMonth = ref('')
const dialogVisible = ref(false)
const currentInstitution = ref({})

// 统计数据
const totalBalances = ref({
  pending_balance_sum: '0.00',
  withdrawable_balance_sum: '0.00',
  non_withdrawable_balance_sum: '0.00',
  withdrawn_amount_sum: '0.00'
})

// 调整表单
const adjustForm = reactive({
  balance_type: 'withdrawable',
  change_type: 'increase',
  amount: 0
})

const adjustFormRef = ref(null)

// 初始化月份
const initMonth = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  selectedMonth.value = `${year}-${month}`
}

// 获取列表数据
const fetchData = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value
    }
    const res = await getBalanceList(params)
    if (res.code === 20000) {
      tableData.value = res.data.items
      total.value = res.data.total
      totalBalances.value = res.data.totalBalances
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

// 同步分润到待结算
const handleAddBalance = async () => {
  if (!selectedMonth.value) {
    ElMessage.warning('请选择月份')
    return
  }
  
  try {
    await ElMessageBox.confirm('确定要同步该月份的分润数据到待结算余额吗？', '确认操作', {
      type: 'warning'
    })
    
    syncLoading.value = true
    const res = await addBalance({ month: selectedMonth.value })
    if (res.code === 20000) {
      ElMessage.success('同步成功')
      fetchData()
    } else {
      ElMessage.error(res.message || '同步失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('同步失败')
    }
  } finally {
    syncLoading.value = false
  }
}

// 批量转入不可提现余额
const handleBatchToNonWithdrawable = async () => {
  try {
    await ElMessageBox.confirm('确定要将所有待结算余额转入不可提现余额吗？', '确认操作', {
      type: 'warning'
    })
    
    batchNonWithdrawableLoading.value = true
    const res = await batchToNonWithdrawable()
    if (res.code === 20000) {
      ElMessage.success('操作成功')
      fetchData()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  } finally {
    batchNonWithdrawableLoading.value = false
  }
}

// 批量转入可提现余额
const handleBatchToWithdrawable = async () => {
  try {
    await ElMessageBox.confirm('确定要将所有待结算余额转入可提现余额吗？', '确认操作', {
      type: 'warning'
    })
    
    batchWithdrawableLoading.value = true
    const res = await batchToWithdrawable()
    if (res.code === 20000) {
      ElMessage.success('操作成功')
      fetchData()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  } finally {
    batchWithdrawableLoading.value = false
  }
}

// 调整余额
const handleAdjust = (row) => {
  currentInstitution.value = row
  adjustForm.balance_type = 'withdrawable'
  adjustForm.change_type = 'increase'
  adjustForm.amount = 0
  dialogVisible.value = true
}

// 确认调整
const confirmAdjust = async () => {
  if (adjustForm.amount <= 0) {
    ElMessage.warning('请输入有效金额')
    return
  }
  
  try {
    adjustLoading.value = true
    const data = {
      institution_id: currentInstitution.value.institution_id,
      balance_type: adjustForm.balance_type,
      change_type: adjustForm.change_type,
      amount: adjustForm.amount
    }
    const res = await updateBalance(data)
    if (res.code === 20000) {
      ElMessage.success('调整成功')
      dialogVisible.value = false
      fetchData()
    } else {
      ElMessage.error(res.message || '调整失败')
    }
  } catch (error) {
    ElMessage.error('调整失败')
  } finally {
    adjustLoading.value = false
  }
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchData()
}

// 金额格式化
const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0.00'
  return Number(amount).toFixed(2)
}

// 初始化
onMounted(() => {
  initMonth()
  fetchData()
})
</script>

<style lang="scss" scoped>
.balance-management {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .filter-container {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 15px;

    .filter-item {
      margin-right: 10px;
    }
  }

  .statistics-container {
    margin-bottom: 20px;

    .statistics-item {
      background: #f5f7fa;
      padding: 20px;
      border-radius: 4px;
      text-align: center;

      .stat-label {
        font-size: 14px;
        color: #606266;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #409EFF;
      }
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .amount-positive {
    color: #67C23A;
    font-weight: 500;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}
</style> 