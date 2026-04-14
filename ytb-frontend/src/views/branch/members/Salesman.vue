<template>
  <div class="salesman-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>业务员管理</h2>
      <p>管理分支机构的业务员信息</p>
    </div>

    <!-- 搜索和操作栏 -->
    <div class="search-bar">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索姓名、手机号、工号"
            prefix-icon="Search"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.status" placeholder="状态" clearable>
            <el-option label="在职" value="active" />
            <el-option label="离职" value="leave" />
            <el-option label="停职" value="suspend" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-input
            v-model="searchForm.department"
            placeholder="部门"
            clearable
          />
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-col>
        <el-col :span="4" style="text-align: right">
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>
            添加业务员
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.total || 0 }}</div>
              <div class="stat-label">总业务员</div>
            </div>
            <el-icon class="stat-icon total"><User /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.active || 0 }}</div>
              <div class="stat-label">在职</div>
            </div>
            <el-icon class="stat-icon active"><UserFilled /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.today_new || 0 }}</div>
              <div class="stat-label">今日新增</div>
            </div>
            <el-icon class="stat-icon new"><Plus /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.inactive || 0 }}</div>
              <div class="stat-label">非在职</div>
            </div>
            <el-icon class="stat-icon inactive"><Remove /></el-icon>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 业务员列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="salesmanList"
        style="width: 100%"
        :default-sort="{ prop: 'created_at', order: 'descending' }"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="employee_id" label="工号" width="120" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="title" label="职位" width="120" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="region" label="负责区域" width="120" />
        <el-table-column prop="commission_rate" label="提成比例" width="100">
          <template #default="{ row }">
            {{ row.commission_rate }}%
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="入职时间" width="160" sortable="custom">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="showEditDialog(row)">
              编辑
            </el-button>
            <el-dropdown @command="(command) => handleAction(command, row)">
              <el-button type="info" size="small">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="toggle-status">
                    {{ row.status === 'active' ? '停职' : '激活' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑业务员对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :before-close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="关联用户" prop="user_id" v-if="!isEdit">
          <el-select
            v-model="form.user_id"
            placeholder="选择要设为业务员的用户"
            filterable
            remote
            :remote-method="searchUsers"
            :loading="userSearchLoading"
            style="width: 100%"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="`${user.name} (${user.phone})`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="工号" prop="employee_id">
          <el-input v-model="form.employee_id" placeholder="自动生成或手动输入" />
        </el-form-item>
        <el-form-item label="职位" prop="title">
          <el-input v-model="form.title" placeholder="请输入职位" />
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-input v-model="form.department" placeholder="请输入部门" />
        </el-form-item>
        <el-form-item label="负责区域" prop="region">
          <el-input v-model="form.region" placeholder="请输入负责区域" />
        </el-form-item>
        <el-form-item label="直属上级" prop="manager_id">
          <el-select v-model="form.manager_id" placeholder="选择直属上级" clearable>
            <el-option
              v-for="manager in managerOptions"
              :key="manager.id"
              :label="`${manager.name} (${manager.title})`"
              :value="manager.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="选择状态">
            <el-option label="在职" value="active" />
            <el-option label="离职" value="leave" />
            <el-option label="停职" value="suspend" />
          </el-select>
        </el-form-item>
        <el-form-item label="提成比例" prop="commission_rate">
          <el-input-number
            v-model="form.commission_rate"
            :min="0"
            :max="100"
            :precision="2"
            style="width: 100%"
          />
          <span style="margin-left: 10px; color: #999;">%</span>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, User, UserFilled, Remove, ArrowDown } from '@element-plus/icons-vue'
import {
  getSalesman,
  createSalesman,
  updateSalesman,
  deleteSalesman,
  toggleSalesmanStatus,
  getAppUsers
} from '../../../api/v1/branchManagement'

const route = useRoute()
const branchId = computed(() => route.params.branchId)

// 响应式数据
const loading = ref(false)
const salesmanList = ref([])
const statistics = ref({})
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: '',
  department: ''
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref()

// 表单数据
const form = reactive({
  user_id: '',
  employee_id: '',
  title: '',
  department: '',
  region: '',
  manager_id: '',
  status: 'active',
  commission_rate: 0,
  remark: ''
})

// 表单验证规则
const formRules = {
  user_id: [
    { required: true, message: '请选择关联用户', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入职位', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 用户搜索相关
const userSearchLoading = ref(false)
const userOptions = ref([])
const managerOptions = ref([])

// 生命周期
onMounted(() => {
  fetchSalesmanList()
  fetchManagerOptions()
})

// 方法
const fetchSalesmanList = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      ...searchForm
    }
    
    const response = await getSalesman(branchId.value, params)
    
    if (response.data.code === 0) {
      salesmanList.value = response.data.data.list.data || []
      total.value = response.data.data.list.total || 0
      statistics.value = response.data.data.statistics || {}
    } else {
      ElMessage.error(response.data.message || '获取业务员列表失败')
    }
  } catch (error) {
    console.error('获取业务员列表失败:', error)
    ElMessage.error('获取业务员列表失败')
  } finally {
    loading.value = false
  }
}

const fetchManagerOptions = async () => {
  try {
    const response = await getSalesman(branchId.value, { size: 1000, status: 'active' })
    if (response.data.code === 0) {
      managerOptions.value = response.data.data.list.data || []
    }
  } catch (error) {
    console.error('获取管理者列表失败:', error)
  }
}

const searchUsers = async (query) => {
  if (!query) {
    userOptions.value = []
    return
  }
  
  try {
    userSearchLoading.value = true
    const response = await getAppUsers(branchId.value, { 
      keyword: query, 
      size: 20,
      is_salesman: 0 // 只查询非业务员用户
    })
    
    if (response.data.code === 0) {
      userOptions.value = response.data.data.list.data || []
    }
  } catch (error) {
    console.error('搜索用户失败:', error)
  } finally {
    userSearchLoading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchSalesmanList()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  currentPage.value = 1
  fetchSalesmanList()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchSalesmanList()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchSalesmanList()
}

const handleSortChange = ({ prop, order }) => {
  // 这里可以添加排序逻辑
  fetchSalesmanList()
}

const showCreateDialog = () => {
  dialogTitle.value = '添加业务员'
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const showEditDialog = (row) => {
  dialogTitle.value = '编辑业务员'
  isEdit.value = true
  Object.keys(form).forEach(key => {
    form[key] = row[key] || ''
  })
  dialogVisible.value = true
}

const resetForm = () => {
  Object.keys(form).forEach(key => {
    form[key] = key === 'status' ? 'active' : (key === 'commission_rate' ? 0 : '')
  })
  userOptions.value = []
}

const handleDialogClose = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
  resetForm()
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    submitLoading.value = true
    
    let response
    if (isEdit.value) {
      response = await updateSalesman(branchId.value, form.id, form)
    } else {
      response = await createSalesman(branchId.value, form)
    }
    
    if (response.data.code === 0) {
      ElMessage.success(isEdit.value ? '更新业务员成功' : '创建业务员成功')
      handleDialogClose()
      fetchSalesmanList()
    } else {
      ElMessage.error(response.data.message || '操作失败')
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitLoading.value = false
  }
}

const handleAction = async (command, row) => {
  if (command === 'toggle-status') {
    const newStatus = row.status === 'active' ? 'suspend' : 'active'
    const statusText = newStatus === 'active' ? '激活' : '停职'
    
    try {
      await ElMessageBox.confirm(`确定要${statusText}该业务员吗？`, '确认操作', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      const response = await toggleSalesmanStatus(branchId.value, row.id, { status: newStatus })
      
      if (response.data.code === 0) {
        ElMessage.success(`${statusText}成功`)
        fetchSalesmanList()
      } else {
        ElMessage.error(response.data.message || `${statusText}失败`)
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('切换状态失败:', error)
        ElMessage.error(`${statusText}失败`)
      }
    }
  } else if (command === 'delete') {
    try {
      await ElMessageBox.confirm('确定要删除该业务员吗？删除后将无法恢复！', '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      const response = await deleteSalesman(branchId.value, row.id)
      
      if (response.data.code === 0) {
        ElMessage.success('删除成功')
        fetchSalesmanList()
      } else {
        ElMessage.error(response.data.message || '删除失败')
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
        ElMessage.error('删除失败')
      }
    }
  }
}

const getStatusType = (status) => {
  const types = {
    active: 'success',
    leave: 'info',
    suspend: 'warning'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    active: '在职',
    leave: '离职',
    suspend: '停职'
  }
  return texts[status] || '未知'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}
</script>

<style scoped>
.salesman-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.search-bar {
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.statistics-cards {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-content {
  position: relative;
  z-index: 2;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 48px;
  opacity: 0.1;
  z-index: 1;
}

.stat-icon.total {
  color: #409eff;
}

.stat-icon.active {
  color: #67c23a;
}

.stat-icon.new {
  color: #e6a23c;
}

.stat-icon.inactive {
  color: #f56c6c;
}

.table-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 