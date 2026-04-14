<template>
  <div class="merchant-list">
    <!-- 查询条件 -->
    <el-card shadow="hover" class="search-card">
      <template #header>
        <div class="card-header">
          <span class="title">商户查询</span>
        </div>
      </template>
      
      <el-form :model="searchForm" :inline="true" class="search-form">
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
        
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="全部" value="" />
            <el-option label="正常" value="1" />
            <el-option label="停用" value="0" />
          </el-select>
        </el-form-item>
        
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

    <!-- 数据表格 -->
    <el-card shadow="hover" class="table-card">
      <template #header>
        <div class="card-header">
          <span class="title">商户列表</span>
          <div class="actions">
            <el-button size="small" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button type="primary" size="small" @click="showAddDialog">
              <el-icon><Plus /></el-icon>
              新增商户
            </el-button>
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
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        
        <el-table-column prop="merchant_code" label="商户号" width="150" align="center">
          <template #default="scope">
            <el-link type="primary" @click="viewMerchantDetail(scope.row)">
              {{ scope.row.merchant_code }}
            </el-link>
          </template>
        </el-table-column>
        
        <el-table-column prop="merchant_name" label="商户名称" min-width="200" show-overflow-tooltip />
        
        <el-table-column prop="institution_code" label="机构代码" width="120" align="center" />
        
        <el-table-column prop="institution_name" label="机构名称" min-width="180" show-overflow-tooltip />
        
        <el-table-column prop="contact_person" label="联系人" width="100" align="center" />
        
        <el-table-column prop="contact_phone" label="联系电话" width="130" align="center" />
        
        <el-table-column prop="transaction_count" label="交易笔数" width="100" align="center" sortable>
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
        
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="small">
              {{ scope.row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" width="160" align="center" />
        
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="viewMerchantDetail(scope.row)">
              详情
            </el-button>
            <el-button type="warning" size="small" @click="editMerchant(scope.row)">
              编辑
            </el-button>
            <el-button 
              :type="scope.row.status === 1 ? 'danger' : 'success'" 
              size="small" 
              @click="toggleMerchantStatus(scope.row)"
            >
              {{ scope.row.status === 1 ? '停用' : '启用' }}
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
          <el-descriptions-item label="机构代码">{{ merchantDetail.institution_code }}</el-descriptions-item>
          <el-descriptions-item label="机构名称">{{ merchantDetail.institution_name }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ merchantDetail.contact_person }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ merchantDetail.contact_phone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ merchantDetail.email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="地址">{{ merchantDetail.address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="merchantDetail.status === 1 ? 'success' : 'danger'">
              {{ merchantDetail.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 交易统计 -->
        <div class="transaction-stats" style="margin-top: 20px;">
          <h4>交易统计</h4>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value">{{ formatNumber(merchantDetail.transaction_count) }}</div>
                <div class="stat-label">交易笔数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value">¥{{ formatNumber(merchantDetail.total_amount) }}</div>
                <div class="stat-label">交易金额</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value">¥{{ formatNumber(merchantDetail.commission_amount) }}</div>
                <div class="stat-label">佣金金额</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value">¥{{ formatNumber(merchantDetail.avg_amount) }}</div>
                <div class="stat-label">平均金额</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 新增/编辑商户对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editForm.id ? '编辑商户' : '新增商户'"
      width="600px"
      :before-close="handleCloseEdit"
    >
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="商户号" prop="merchant_code">
          <el-input v-model="editForm.merchant_code" :disabled="!!editForm.id" />
        </el-form-item>
        
        <el-form-item label="商户名称" prop="merchant_name">
          <el-input v-model="editForm.merchant_name" />
        </el-form-item>
        
        <el-form-item label="机构代码" prop="institution_code">
          <el-input v-model="editForm.institution_code" />
        </el-form-item>
        
        <el-form-item label="联系人" prop="contact_person">
          <el-input v-model="editForm.contact_person" />
        </el-form-item>
        
        <el-form-item label="联系电话" prop="contact_phone">
          <el-input v-model="editForm.contact_phone" />
        </el-form-item>
        
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
        
        <el-form-item label="地址">
          <el-input v-model="editForm.address" type="textarea" :rows="3" />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="editForm.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveMerchant" :loading="saving">
            {{ saving ? '保存中...' : '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Download, Plus } from '@element-plus/icons-vue'
import { getMerchantList, getMerchantDetail, updateMerchant, deleteMerchant } from '@/api/shengfutong'

// 搜索表单
const searchForm = reactive({
  merchantCode: '',
  merchantName: '',
  institutionCode: '',
  status: '',
  dateRange: []
})

// 表格数据
const tableData = ref([])
const loading = ref(false)
const exporting = ref(false)

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 详情对话框
const detailDialogVisible = ref(false)
const merchantDetail = ref(null)

// 编辑对话框
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const saving = ref(false)

const editForm = reactive({
  id: null,
  merchant_code: '',
  merchant_name: '',
  institution_code: '',
  contact_person: '',
  contact_phone: '',
  email: '',
  address: '',
  status: 1
})

const editRules = {
  merchant_code: [
    { required: true, message: '请输入商户号', trigger: 'blur' }
  ],
  merchant_name: [
    { required: true, message: '请输入商户名称', trigger: 'blur' }
  ],
  institution_code: [
    { required: true, message: '请输入机构代码', trigger: 'blur' }
  ],
  contact_person: [
    { required: true, message: '请输入联系人', trigger: 'blur' }
  ],
  contact_phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      merchant_code: searchForm.merchantCode,
      merchant_name: searchForm.merchantName,
      institution_code: searchForm.institutionCode,
      status: searchForm.status,
      start_date: searchForm.dateRange?.[0],
      end_date: searchForm.dateRange?.[1]
    }
    
    // 暂时使用模拟数据
    const mockData = {
      code: 200,
      data: {
        list: [
          {
            id: 1,
            merchant_code: 'M001',
            merchant_name: '测试商户1',
            institution_code: '42083878',
            institution_name: '盛付通电子支付服务有限公司',
            contact_person: '张三',
            contact_phone: '13800138001',
            email: 'zhangsan@test.com',
            address: '上海市浦东新区',
            transaction_count: 1200,
            total_amount: 360000.00,
            commission_amount: 1800.00,
            avg_amount: 300.00,
            status: 1,
            created_at: '2024-01-01 10:00:00'
          },
          {
            id: 2,
            merchant_code: 'M002',
            merchant_name: '测试商户2',
            institution_code: '42083878',
            institution_name: '盛付通电子支付服务有限公司',
            contact_person: '李四',
            contact_phone: '13800138002',
            email: 'lisi@test.com',
            address: '北京市朝阳区',
            transaction_count: 800,
            total_amount: 240000.00,
            commission_amount: 1200.00,
            avg_amount: 300.00,
            status: 1,
            created_at: '2024-01-02 10:00:00'
          }
        ],
        total: 2
      }
    }
    
    tableData.value = mockData.data.list
    pagination.total = mockData.data.total
    
  } catch (error) {
    console.error('Error fetching merchant list:', error)
    ElMessage.error('获取商户列表失败')
  } finally {
    loading.value = false
  }
}

// 查询
const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    merchantCode: '',
    merchantName: '',
    institutionCode: '',
    status: '',
    dateRange: []
  })
  pagination.page = 1
  fetchData()
}

// 导出
const handleExport = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要导出当前查询条件下的商户数据吗？',
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
}

// 查看商户详情
const viewMerchantDetail = async (row) => {
  try {
    // 暂时使用模拟数据
    merchantDetail.value = { ...row }
    detailDialogVisible.value = true
  } catch (error) {
    console.error('Error fetching merchant detail:', error)
    ElMessage.error('获取商户详情失败')
  }
}

// 关闭详情对话框
const handleCloseDetail = () => {
  detailDialogVisible.value = false
  merchantDetail.value = null
}

// 显示新增对话框
const showAddDialog = () => {
  Object.assign(editForm, {
    id: null,
    merchant_code: '',
    merchant_name: '',
    institution_code: '',
    contact_person: '',
    contact_phone: '',
    email: '',
    address: '',
    status: 1
  })
  editDialogVisible.value = true
}

// 编辑商户
const editMerchant = (row) => {
  Object.assign(editForm, { ...row })
  editDialogVisible.value = true
}

// 关闭编辑对话框
const handleCloseEdit = () => {
  editDialogVisible.value = false
  editFormRef.value?.resetFields()
}

// 保存商户
const handleSaveMerchant = async () => {
  try {
    await editFormRef.value.validate()
    
    saving.value = true
    
    // 这里应该调用保存API
    setTimeout(() => {
      ElMessage.success(editForm.id ? '更新成功！' : '新增成功！')
      editDialogVisible.value = false
      fetchData()
      saving.value = false
    }, 1000)
    
  } catch (error) {
    console.error('Validation failed:', error)
  }
}

// 切换商户状态
const toggleMerchantStatus = async (row) => {
  try {
    const action = row.status === 1 ? '停用' : '启用'
    await ElMessageBox.confirm(
      `确定要${action}商户 "${row.merchant_name}" 吗？`,
      `确认${action}`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里应该调用状态切换API
    row.status = row.status === 1 ? 0 : 1
    ElMessage.success(`${action}成功！`)
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
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

// 格式化数字
const formatNumber = (num) => {
  if (!num && num !== 0) return '0'
  return parseFloat(num).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.merchant-list {
  padding: 20px;
}

.search-card,
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

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.detail-content {
  max-height: 60vh;
  overflow-y: auto;
}

.transaction-stats h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.stat-card {
  text-align: center;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}
</style> 