<template>
  <div class="engineers-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.total }}</div>
            <div class="stat-label">工程师总数</div>
          </div>
          <el-icon class="stat-icon"><User /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-success">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.active }}</div>
            <div class="stat-label">已启用</div>
          </div>
          <el-icon class="stat-icon"><CircleCheck /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-warning">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.inactive }}</div>
            <div class="stat-label">已禁用</div>
          </div>
          <el-icon class="stat-icon"><CircleClose /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-primary">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.linked }}</div>
            <div class="stat-label">已关联用户</div>
          </div>
          <el-icon class="stat-icon"><Connection /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-danger">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.supervisors }}</div>
            <div class="stat-label">总监数量</div>
          </div>
          <el-icon class="stat-icon"><Avatar /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-info">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.total_installations }}</div>
            <div class="stat-label">总安装数</div>
          </div>
          <el-icon class="stat-icon"><Finished /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索和操作栏 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="姓名/手机号" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="已启用" :value="1" />
            <el-option label="已禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联状态">
          <el-select v-model="searchForm.linked" placeholder="全部" clearable>
            <el-option label="已关联用户" value="1" />
            <el-option label="未关联用户" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
        <el-form-item style="float: right">
          <el-button type="success" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            添加工程师
          </el-button>
          <el-button type="primary" :disabled="selectedIds.length === 0" @click="handleBatchEnable">
            批量启用
          </el-button>
          <el-button type="warning" :disabled="selectedIds.length === 0" @click="handleBatchDisable">
            批量禁用
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never" class="table-card">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="姓名" width="120">
          <template #default="{ row }">
            <div class="name-cell">
              <el-avatar :size="32" :src="row.avatar">
                {{ row.name?.charAt(0) }}
              </el-avatar>
              <span class="name-text">{{ row.name }}</span>
              <el-tag v-if="row.is_supervisor" type="danger" size="small">总监</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="关联用户" width="180">
          <template #default="{ row }">
            <template v-if="row.user_id">
              <el-tag type="success" size="small">
                用户ID: {{ row.user_id }}
              </el-tag>
              <div class="user-nickname">{{ row.user_nickname }}</div>
            </template>
            <el-tag v-else type="info" size="small">未关联</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="region" label="服务区域" min-width="150" show-overflow-tooltip />
        <el-table-column prop="completed_installations" label="完成安装" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="primary">{{ row.completed_installations || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button 
              v-if="!row.user_id" 
              type="success" 
              link 
              size="small" 
              @click="handleLink(row)"
            >
              <el-icon><Connection /></el-icon>
              关联用户
            </el-button>
            <el-button 
              v-else 
              type="warning" 
              link 
              size="small" 
              @click="handleUnlink(row)"
            >
              <el-icon><Unlock /></el-icon>
              取消关联
            </el-button>
            <el-popconfirm
              title="确定删除该工程师吗？"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button type="danger" link size="small">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 15, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入工程师姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="formData.password" 
            type="password" 
            placeholder="不修改请留空"
            show-password
          />
        </el-form-item>
        <el-form-item label="服务区域" prop="region">
          <el-input v-model="formData.region" placeholder="请输入服务区域" />
        </el-form-item>
        <el-form-item label="详细地址" prop="address">
          <el-input v-model="formData.address" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item label="身份证号" prop="id_card">
          <el-input v-model="formData.id_card" placeholder="请输入身份证号" />
        </el-form-item>
        <el-form-item label="是否总监" prop="is_supervisor">
          <el-switch v-model="formData.is_supervisor" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input 
            v-model="formData.remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 关联用户对话框 -->
    <el-dialog
      v-model="linkDialogVisible"
      title="关联APP用户"
      width="500px"
      destroy-on-close
    >
      <el-form label-width="80px">
        <el-form-item label="搜索用户">
          <el-input 
            v-model="userSearchKeyword"
            placeholder="输入用户ID/昵称/手机号搜索"
            @input="handleUserSearch"
          >
            <template #append>
              <el-button @click="handleUserSearch">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="选择用户">
          <el-select 
            v-model="selectedUserId" 
            placeholder="请选择要关联的用户"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="`${user.nickname || '未设置昵称'} (${user.phone}) - ID:${user.id}`"
              :value="user.id"
            >
              <div class="user-option">
                <el-avatar :size="24" :src="user.avatar">{{ user.nickname?.charAt(0) || 'U' }}</el-avatar>
                <span class="user-name">{{ user.nickname || '未设置昵称' }}</span>
                <span class="user-phone">{{ user.phone }}</span>
                <el-tag v-if="user.is_engineer" type="success" size="small">已是工程师</el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="linkDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="linkLoading" @click="confirmLink">
          确定关联
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User, CircleCheck, CircleClose, Connection, Avatar, Finished,
  Search, Refresh, Plus, Edit, Delete, Unlock
} from '@element-plus/icons-vue'
import request from '@/utils/request'

// 统计数据
const statistics = reactive({
  total: 0,
  active: 0,
  inactive: 0,
  linked: 0,
  supervisors: 0,
  total_installations: 0
})

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: '',
  linked: ''
})

// 表格数据
const loading = ref(false)
const tableData = ref([])
const selectedIds = ref([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 15,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('添加工程师')
const submitLoading = ref(false)
const formRef = ref(null)
const formData = reactive({
  id: null,
  name: '',
  phone: '',
  password: '',
  region: '',
  address: '',
  id_card: '',
  status: 1,
  is_supervisor: 0,
  remark: ''
})

const formRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

// 关联用户对话框
const linkDialogVisible = ref(false)
const linkLoading = ref(false)
const userSearchKeyword = ref('')
const userList = ref([])
const selectedUserId = ref(null)
const currentLinkEngineerId = ref(null)

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const { data } = await request.get('/api/admin/engineers/statistics')
    if (data.code === 0) {
      Object.assign(statistics, data.data)
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取列表数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.pageSize,
      ...searchForm
    }
    const res = await request.get('/api/admin/engineers', { params })
    if (res.code === 0) {
      tableData.value = res.data.data
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('获取列表失败:', error)
    ElMessage.error('获取工程师列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.linked = ''
  handleSearch()
}

// 分页
const handleSizeChange = (size) => {
  pagination.pageSize = size
  fetchData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchData()
}

// 选择
const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id)
}

// 添加
const handleAdd = () => {
  dialogTitle.value = '添加工程师'
  Object.assign(formData, {
    id: null,
    name: '',
    phone: '',
    password: '',
    region: '',
    address: '',
    id_card: '',
    status: 1,
    is_supervisor: 0,
    remark: ''
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogTitle.value = '编辑工程师'
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    phone: row.phone,
    password: '',
    region: row.region,
    address: row.address,
    id_card: row.id_card,
    status: row.status,
    is_supervisor: row.is_supervisor,
    remark: row.remark
  })
  dialogVisible.value = true
}

// 提交
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    const submitData = { ...formData }
    if (!submitData.password) {
      delete submitData.password
    }
    
    let res
    if (formData.id) {
      res = await request.put(`/api/admin/engineers/${formData.id}`, submitData)
    } else {
      res = await request.post('/api/admin/engineers', submitData)
    }
    
    if (res.data.code === 0) {
      ElMessage.success(formData.id ? '更新成功' : '添加成功')
      dialogVisible.value = false
      fetchData()
      fetchStatistics()
    } else {
      ElMessage.error(res.data.message || '操作失败')
    }
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 状态切换
const handleStatusChange = async (row) => {
  try {
    const res = await request.put(`/api/admin/engineers/${row.id}`, { status: row.status })
    if (res.data.code === 0) {
      ElMessage.success('状态更新成功')
      fetchStatistics()
    } else {
      ElMessage.error(res.data.message || '状态更新失败')
      row.status = row.status === 1 ? 0 : 1
    }
  } catch (error) {
    console.error('状态更新失败:', error)
    row.status = row.status === 1 ? 0 : 1
  }
}

// 删除
const handleDelete = async (row) => {
  try {
    const res = await request.delete(`/api/admin/engineers/${row.id}`)
    if (res.data.code === 0) {
      ElMessage.success('删除成功')
      fetchData()
      fetchStatistics()
    } else {
      ElMessage.error(res.data.message || '删除失败')
    }
  } catch (error) {
    console.error('删除失败:', error)
  }
}

// 批量启用
const handleBatchEnable = async () => {
  try {
    await ElMessageBox.confirm('确定批量启用选中的工程师吗？', '提示', { type: 'warning' })
    const res = await request.post('/api/admin/engineers/batch-status', {
      ids: selectedIds.value,
      status: 1
    })
    if (res.data.code === 0) {
      ElMessage.success('批量启用成功')
      fetchData()
      fetchStatistics()
    } else {
      ElMessage.error(res.data.message || '批量启用失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量启用失败:', error)
    }
  }
}

// 批量禁用
const handleBatchDisable = async () => {
  try {
    await ElMessageBox.confirm('确定批量禁用选中的工程师吗？', '提示', { type: 'warning' })
    const res = await request.post('/api/admin/engineers/batch-status', {
      ids: selectedIds.value,
      status: 0
    })
    if (res.data.code === 0) {
      ElMessage.success('批量禁用成功')
      fetchData()
      fetchStatistics()
    } else {
      ElMessage.error(res.data.message || '批量禁用失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量禁用失败:', error)
    }
  }
}

// 关联用户
const handleLink = (row) => {
  currentLinkEngineerId.value = row.id
  userSearchKeyword.value = ''
  userList.value = []
  selectedUserId.value = null
  linkDialogVisible.value = true
}

// 搜索用户
const handleUserSearch = async () => {
  if (!userSearchKeyword.value) {
    userList.value = []
    return
  }
  try {
    const res = await request.get('/api/admin/engineers/search-users', {
      params: { keyword: userSearchKeyword.value }
    })
    if (res.data.code === 0) {
      userList.value = res.data.data
    }
  } catch (error) {
    console.error('搜索用户失败:', error)
  }
}

// 确认关联
const confirmLink = async () => {
  if (!selectedUserId.value) {
    ElMessage.warning('请选择要关联的用户')
    return
  }
  linkLoading.value = true
  try {
    const res = await request.post(`/api/admin/engineers/${currentLinkEngineerId.value}/link`, {
      user_id: selectedUserId.value
    })
    if (res.data.code === 0) {
      ElMessage.success('关联成功')
      linkDialogVisible.value = false
      fetchData()
      fetchStatistics()
    } else {
      ElMessage.error(res.data.message || '关联失败')
    }
  } catch (error) {
    console.error('关联失败:', error)
  } finally {
    linkLoading.value = false
  }
}

// 取消关联
const handleUnlink = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定取消工程师"${row.name}"与用户ID:${row.user_id}的关联吗？`,
      '提示',
      { type: 'warning' }
    )
    const res = await request.post(`/api/admin/engineers/${row.id}/unlink`)
    if (res.data.code === 0) {
      ElMessage.success('取消关联成功')
      fetchData()
      fetchStatistics()
    } else {
      ElMessage.error(res.data.message || '取消关联失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消关联失败:', error)
    }
  }
}

onMounted(() => {
  fetchStatistics()
  fetchData()
})
</script>

<style scoped>
.engineers-container {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
}

.stat-content {
  z-index: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.stat-icon {
  font-size: 48px;
  opacity: 0.2;
  color: #409eff;
}

.stat-success .stat-icon { color: #67c23a; }
.stat-warning .stat-icon { color: #e6a23c; }
.stat-primary .stat-icon { color: #409eff; }
.stat-danger .stat-icon { color: #f56c6c; }
.stat-info .stat-icon { color: #909399; }

.filter-card {
  margin-bottom: 20px;
}

.filter-card :deep(.el-card__body) {
  padding-bottom: 0;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
}

.table-card :deep(.el-card__body) {
  padding: 0;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name-text {
  font-weight: 500;
}

.user-nickname {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.pagination-wrapper {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
}

.user-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-option .user-name {
  flex: 1;
}

.user-option .user-phone {
  color: #909399;
  font-size: 12px;
}
</style>
