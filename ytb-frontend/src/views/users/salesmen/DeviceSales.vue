<template>
  <div class="device-sales-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>业务员设备销售管理</h2>
      <p class="page-description">管理业务员的设备销售记录和30%提成计算</p>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="业务员">
          <el-select v-model="filters.salesman_id" placeholder="选择业务员" clearable @change="handleFilterChange">
            <el-option label="全部业务员" value=""></el-option>
            <el-option
              v-for="salesman in salesmenList"
              :key="salesman.id"
              :label="salesman.name"
              :value="salesman.id">
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="设备编号">
          <el-input v-model="filters.device_number" placeholder="输入设备编号" clearable @change="handleFilterChange"></el-input>
        </el-form-item>
        
        <el-form-item label="客户姓名">
          <el-input v-model="filters.customer_name" placeholder="输入客户姓名" clearable @change="handleFilterChange"></el-input>
        </el-form-item>
        
        <el-form-item label="销售日期">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleFilterChange">
          </el-date-picker>
        </el-form-item>
        
        <el-form-item label="提成状态">
          <el-select v-model="filters.commission_status" placeholder="选择提成状态" clearable @change="handleFilterChange">
            <el-option label="全部" value=""></el-option>
            <el-option label="未计算" value="pending"></el-option>
            <el-option label="已计算" value="calculated"></el-option>
            <el-option label="已发放" value="paid"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="loadDeviceSales" :loading="loading">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮 -->
    <el-card class="action-card" shadow="never">
      <div class="action-buttons">
        <el-button type="primary" @click="showSyncDialog">
          <el-icon><Download /></el-icon>
          同步设备销售数据
        </el-button>
        <el-button type="success" @click="showBatchCalculateDialog" :disabled="!selectedRows.length">
                          <el-icon><Download /></el-icon>
          批量计算提成
        </el-button>
        <el-button type="warning" @click="exportDeviceSales">
          <el-icon><Upload /></el-icon>
          导出数据
        </el-button>
      </div>
    </el-card>

    <!-- 设备销售列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>设备销售记录</span>
          <div class="header-info">
            <span>共 {{ pagination.total }} 条记录</span>
          </div>
        </div>
      </template>
      
      <el-table 
        :data="deviceSalesList" 
        v-loading="loading" 
        stripe
        @selection-change="handleSelectionChange"
        :header-cell-style="{ background: '#f8f9fa', color: '#495057' }">
        
        <el-table-column type="selection" width="55"></el-table-column>
        
        <el-table-column prop="device_number" label="设备编号" width="150">
          <template #default="scope">
            <el-link type="primary" @click="viewDeviceDetail(scope.row.device_id)">
              {{ scope.row.device_number }}
            </el-link>
          </template>
        </el-table-column>
        
        <el-table-column prop="salesman_name" label="业务员" width="120">
          <template #default="scope">
            <div class="salesman-info">
              <div class="name">{{ scope.row.salesman_name }}</div>
              <div class="employee-id">{{ scope.row.employee_id }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="customer_name" label="客户姓名" width="120"></el-table-column>
        
        <el-table-column prop="customer_phone" label="客户电话" width="130"></el-table-column>
        
        <el-table-column prop="order_amount" label="订单金额" width="120" sortable>
          <template #default="scope">
            <span class="amount-text">¥{{ scope.row.order_amount }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="commission_rate" label="提成比例" width="100">
          <template #default="scope">
            <el-tag type="success">{{ scope.row.commission_rate }}%</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="commission_amount" label="提成金额" width="120" sortable>
          <template #default="scope">
            <span class="commission-amount">¥{{ scope.row.commission_amount }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="order_date" label="销售日期" width="120" sortable></el-table-column>
        
        <el-table-column prop="billing_mode" label="计费模式" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.billing_mode === '1' ? 'primary' : 'info'">
              {{ scope.row.billing_mode === '1' ? '流量计费' : '包年计费' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="commission_status" label="提成状态" width="100">
          <template #default="scope">
            <el-tag :type="getCommissionStatusType(scope.row.commission_status)">
              {{ getCommissionStatusText(scope.row.commission_status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="viewDetail(scope.row)">
              查看详情
            </el-button>
            <el-button 
              type="success" 
              size="small" 
              @click="calculateCommission(scope.row)"
              :disabled="scope.row.commission_status === 'calculated' || scope.row.commission_status === 'paid'">
              计算提成
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          :page-size="pagination.pageSize"
          :current-page="pagination.currentPage"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange">
        </el-pagination>
      </div>
    </el-card>

    <!-- 同步设备销售数据对话框 -->
    <el-dialog v-model="syncDialogVisible" title="同步设备销售数据" width="50%">
      <el-form :model="syncForm" :rules="syncRules" ref="syncFormRef" label-width="100px">
        <el-form-item label="业务员" prop="salesman_id">
          <el-select v-model="syncForm.salesman_id" placeholder="选择业务员" style="width: 100%">
            <el-option label="全部业务员" value=""></el-option>
            <el-option
              v-for="salesman in salesmenList"
              :key="salesman.id"
              :label="salesman.name"
              :value="salesman.id">
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="同步日期" prop="dateRange">
          <el-date-picker
            v-model="syncForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%">
          </el-date-picker>
        </el-form-item>
        
        <el-form-item label="同步选项">
          <el-checkbox-group v-model="syncForm.options">
            <el-checkbox label="overwrite">覆盖已存在的记录</el-checkbox>
            <el-checkbox label="calculate_commission">自动计算提成</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="syncDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="syncDeviceSales" :loading="syncLoading">
            开始同步
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量计算提成对话框 -->
    <el-dialog v-model="batchCalculateDialogVisible" title="批量计算提成" width="50%">
      <div class="batch-calculate-content">
        <div class="selected-info">
          <p>已选择 <strong>{{ selectedRows.length }}</strong> 条记录进行提成计算</p>
          <p>预计提成总额：<span class="total-commission">¥{{ calculateTotalCommission() }}</span></p>
        </div>
        
        <el-form :model="batchCalculateForm" label-width="100px">
          <el-form-item label="提成周期">
            <el-input v-model="batchCalculateForm.period" placeholder="例如：2024-01"></el-input>
          </el-form-item>
          
          <el-form-item label="备注">
            <el-input 
              v-model="batchCalculateForm.remark" 
              type="textarea" 
              placeholder="输入备注信息"
              :rows="3">
            </el-input>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchCalculateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="batchCalculateCommission" :loading="batchCalculateLoading">
            确认计算
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 设备详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="设备销售详情" width="70%">
      <div v-loading="detailLoading">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备编号">{{ deviceDetail.device_number }}</el-descriptions-item>
          <el-descriptions-item label="业务员">{{ deviceDetail.salesman_name }}</el-descriptions-item>
          <el-descriptions-item label="客户姓名">{{ deviceDetail.customer_name }}</el-descriptions-item>
          <el-descriptions-item label="客户电话">{{ deviceDetail.customer_phone }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">¥{{ deviceDetail.order_amount }}</el-descriptions-item>
          <el-descriptions-item label="提成比例">{{ deviceDetail.commission_rate }}%</el-descriptions-item>
          <el-descriptions-item label="提成金额">¥{{ deviceDetail.commission_amount }}</el-descriptions-item>
          <el-descriptions-item label="销售日期">{{ deviceDetail.order_date }}</el-descriptions-item>
          <el-descriptions-item label="计费模式">
            {{ deviceDetail.billing_mode === '1' ? '流量计费' : '包年计费' }}
          </el-descriptions-item>
          <el-descriptions-item label="充值类型">
            {{ deviceDetail.surrogate_type === '1' ? '代充' : '自充' }}
          </el-descriptions-item>
          <el-descriptions-item label="提成状态">
            <el-tag :type="getCommissionStatusType(deviceDetail.commission_status)">
              {{ getCommissionStatusText(deviceDetail.commission_status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ deviceDetail.created_at }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 提成记录 -->
        <div v-if="deviceDetail.commission_records && deviceDetail.commission_records.length > 0" class="commission-records">
          <h4>提成记录</h4>
          <el-table :data="deviceDetail.commission_records" stripe>
            <el-table-column prop="period" label="提成周期" width="120"></el-table-column>
            <el-table-column prop="amount" label="提成金额" width="120">
              <template #default="scope">
                ¥{{ scope.row.amount }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'paid' ? 'success' : 'warning'">
                  {{ scope.row.status === 'paid' ? '已发放' : '待发放' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间"></el-table-column>
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Download, Upload } from '@element-plus/icons-vue'
import request from '@/utils/request'

export default {
  name: 'DeviceSales',
  components: {
    Search,
    Refresh,
    Download,

    Upload
  },
  setup() {
    // 响应式数据
    const loading = ref(false)
    const syncLoading = ref(false)
    const batchCalculateLoading = ref(false)
    const detailLoading = ref(false)
    
    // 筛选条件
    const filters = reactive({
      salesman_id: '',
      device_number: '',
      customer_name: '',
      dateRange: [],
      commission_status: ''
    })
    
    // 业务员列表
    const salesmenList = ref([])
    
    // 设备销售列表
    const deviceSalesList = ref([])
    const selectedRows = ref([])
    
    // 分页
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    })
    
    // 对话框状态
    const syncDialogVisible = ref(false)
    const batchCalculateDialogVisible = ref(false)
    const detailDialogVisible = ref(false)
    
    // 表单数据
    const syncForm = reactive({
      salesman_id: '',
      dateRange: [],
      options: ['calculate_commission']
    })
    
    const batchCalculateForm = reactive({
      period: '',
      remark: ''
    })
    
    const deviceDetail = ref({})
    
    // 表单验证规则
    const syncRules = {
      dateRange: [{ required: true, message: '请选择同步日期', trigger: 'change' }]
    }
    
    // 获取业务员列表
    const fetchSalesmenList = async () => {
      try {
        const response = await request.get('/api/admin/v1/salesmen')
        if (response.data && response.data.data) {
          salesmenList.value = response.data.data.map(item => ({
            id: item.id,
            name: item.user?.name || item.name || '未知',
            employee_id: item.employee_id
          }))
        }
      } catch (error) {
        console.error('获取业务员列表失败:', error)
        ElMessage.error('获取业务员列表失败')
      }
    }
    
    // 加载设备销售数据
    const loadDeviceSales = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.currentPage,
          per_page: pagination.pageSize,
          salesman_id: filters.salesman_id || undefined,
          device_number: filters.device_number || undefined,
          customer_name: filters.customer_name || undefined,
          commission_status: filters.commission_status || undefined
        }
        
        if (filters.dateRange && filters.dateRange.length === 2) {
          params.start_date = filters.dateRange[0]
          params.end_date = filters.dateRange[1]
        }
        
        const response = await request.get('/api/admin/v1/salesman-sales/device-sales', { params })
        if (response.data && response.data.data) {
          deviceSalesList.value = response.data.data.data || response.data.data
          pagination.total = response.data.data.total || response.data.total || 0
        }
      } catch (error) {
        console.error('加载设备销售数据失败:', error)
        ElMessage.error('加载设备销售数据失败')
        deviceSalesList.value = []
        pagination.total = 0
      } finally {
        loading.value = false
      }
    }
    
    // 处理筛选条件变化
    const handleFilterChange = () => {
      pagination.currentPage = 1
      loadDeviceSales()
    }
    
    // 重置筛选条件
    const resetFilters = () => {
      Object.assign(filters, {
        salesman_id: '',
        device_number: '',
        customer_name: '',
        dateRange: [],
        commission_status: ''
      })
      pagination.currentPage = 1
      loadDeviceSales()
    }
    
    // 处理选择变化
    const handleSelectionChange = (selection) => {
      selectedRows.value = selection
    }
    
    // 处理分页变化
    const handleSizeChange = (size) => {
      pagination.pageSize = size
      pagination.currentPage = 1
      loadDeviceSales()
    }
    
    const handleCurrentChange = (page) => {
      pagination.currentPage = page
      loadDeviceSales()
    }
    
    // 显示同步对话框
    const showSyncDialog = () => {
      syncForm.salesman_id = ''
      syncForm.dateRange = []
      syncForm.options = ['calculate_commission']
      syncDialogVisible.value = true
    }
    
    // 显示批量计算对话框
    const showBatchCalculateDialog = () => {
      if (selectedRows.value.length === 0) {
        ElMessage.warning('请先选择要计算提成的记录')
        return
      }
      
      batchCalculateForm.period = new Date().toISOString().slice(0, 7)
      batchCalculateForm.remark = ''
      batchCalculateDialogVisible.value = true
    }
    
    // 同步设备销售数据
    const syncDeviceSales = async () => {
      const formRef = ref(null)
      if (!formRef.value) return
      
      try {
        await formRef.value.validate()
      } catch {
        return
      }
      
      syncLoading.value = true
      
      try {
        const params = {
          salesman_id: syncForm.salesman_id || undefined,
          start_date: syncForm.dateRange[0],
          end_date: syncForm.dateRange[1],
          options: syncForm.options
        }
        
        const response = await request.post('/api/admin/v1/salesman-sales/sync-device-sales', params)
        if (response.data && response.data.code === 200) {
          const data = response.data.data
          ElMessage.success(`同步成功：${data.synced_count}条记录，提成总额：¥${data.total_commission}`)
          syncDialogVisible.value = false
          loadDeviceSales()
        }
      } catch (error) {
        console.error('同步设备销售数据失败:', error)
        ElMessage.error(error.response?.data?.message || '同步设备销售数据失败')
      } finally {
        syncLoading.value = false
      }
    }
    
    // 批量计算提成
    const batchCalculateCommission = async () => {
      batchCalculateLoading.value = true
      
      try {
        const deviceIds = selectedRows.value.map(row => row.id)
        const params = {
          device_sale_ids: deviceIds,
          period: batchCalculateForm.period,
          remark: batchCalculateForm.remark
        }
        
        const response = await request.post('/api/admin/v1/salesman-commissions/batch-calculate', params)
        if (response.data && response.data.code === 200) {
          const data = response.data.data
          ElMessage.success(`批量计算成功：${data.calculated_count}条记录，提成总额：¥${data.total_commission}`)
          batchCalculateDialogVisible.value = false
          selectedRows.value = []
          loadDeviceSales()
        }
      } catch (error) {
        console.error('批量计算提成失败:', error)
        ElMessage.error(error.response?.data?.message || '批量计算提成失败')
      } finally {
        batchCalculateLoading.value = false
      }
    }
    
    // 单个计算提成
    const calculateCommission = async (row) => {
      try {
        await ElMessageBox.confirm(
          `确定要为设备 ${row.device_number} 计算提成吗？`,
          '确认计算',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        const params = {
          device_sale_id: row.id,
          period: new Date().toISOString().slice(0, 7)
        }
        
        const response = await request.post('/api/admin/v1/salesman-commissions/calculate-single', params)
        if (response.data && response.data.code === 200) {
          ElMessage.success('提成计算成功')
          loadDeviceSales()
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('计算提成失败:', error)
          ElMessage.error(error.response?.data?.message || '计算提成失败')
        }
      }
    }
    
    // 查看详情
    const viewDetail = async (row) => {
      detailDialogVisible.value = true
      detailLoading.value = true
      
      try {
        const response = await request.get(`/api/admin/v1/salesman-sales/device-sales/${row.id}`)
        if (response.data && response.data.data) {
          deviceDetail.value = response.data.data
        }
      } catch (error) {
        console.error('获取设备详情失败:', error)
        ElMessage.error('获取设备详情失败')
        detailDialogVisible.value = false
      } finally {
        detailLoading.value = false
      }
    }
    
    // 查看设备详情
    const viewDeviceDetail = (deviceId) => {
      // 跳转到设备详情页面
      window.open(`/admin/#/devices/${deviceId}`, '_blank')
    }
    
    // 导出数据
    const exportDeviceSales = () => {
      ElMessage.info('导出功能开发中...')
    }
    
    // 计算总提成
    const calculateTotalCommission = () => {
      return selectedRows.value.reduce((total, row) => {
        return total + parseFloat(row.commission_amount || 0)
      }, 0).toFixed(2)
    }
    
    // 获取提成状态类型
    const getCommissionStatusType = (status) => {
      switch (status) {
        case 'pending': return 'info'
        case 'calculated': return 'warning'
        case 'paid': return 'success'
        default: return 'info'
      }
    }
    
    // 获取提成状态文本
    const getCommissionStatusText = (status) => {
      switch (status) {
        case 'pending': return '未计算'
        case 'calculated': return '已计算'
        case 'paid': return '已发放'
        default: return '未知'
      }
    }
    
    // 组件挂载
    onMounted(async () => {
      await fetchSalesmenList()
      loadDeviceSales()
    })
    
    return {
      // 响应式数据
      loading,
      syncLoading,
      batchCalculateLoading,
      detailLoading,
      filters,
      salesmenList,
      deviceSalesList,
      selectedRows,
      pagination,
      syncDialogVisible,
      batchCalculateDialogVisible,
      detailDialogVisible,
      syncForm,
      batchCalculateForm,
      deviceDetail,
      syncRules,
      
      // 方法
      loadDeviceSales,
      handleFilterChange,
      resetFilters,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      showSyncDialog,
      showBatchCalculateDialog,
      syncDeviceSales,
      batchCalculateCommission,
      calculateCommission,
      viewDetail,
      viewDeviceDetail,
      exportDeviceSales,
      calculateTotalCommission,
      getCommissionStatusType,
      getCommissionStatusText
    }
  }
}
</script>

<style scoped>
.device-sales-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.page-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 15px;
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

.salesman-info .name {
  font-weight: 500;
  color: #303133;
}

.salesman-info .employee-id {
  font-size: 12px;
  color: #909399;
}

.amount-text {
  color: #409eff;
  font-weight: 600;
}

.commission-amount {
  color: #e6a23c;
  font-weight: 600;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.batch-calculate-content {
  padding: 20px 0;
}

.selected-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.selected-info p {
  margin: 5px 0;
}

.total-commission {
  color: #e6a23c;
  font-weight: 600;
  font-size: 16px;
}

.commission-records {
  margin-top: 20px;
}

.commission-records h4 {
  margin-bottom: 15px;
  color: #303133;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 