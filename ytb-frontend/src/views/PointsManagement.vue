<template>
  <div class="points-management">
    <div class="page-header">
      <h1>积分管理</h1>
      <p>管理用户积分分配和查看积分使用记录</p>
    </div>

    <!-- 操作卡片 -->
    <div class="action-cards">
      <el-card class="action-card">
        <div class="card-content">
          <div class="card-icon">
            <el-icon size="32" color="#1890ff">
              <Gift />
            </el-icon>
          </div>
          <div class="card-info">
            <h3>手动分配积分</h3>
            <p>为用户手动分配积分</p>
          </div>
          <el-button type="primary" @click="showAssignDialog">
            分配积分
          </el-button>
        </div>
      </el-card>

      <el-card class="action-card">
        <div class="card-content">
          <div class="card-icon">
            <el-icon size="32" color="#52c41a">
              <DataAnalysis />
            </el-icon>
          </div>
          <div class="card-info">
            <h3>积分统计</h3>
            <p>查看积分使用统计</p>
          </div>
          <el-button type="success" @click="showStats">
            查看统计
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 积分记录表格 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>积分记录</span>
          <div class="header-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索用户手机号或姓名"
              style="width: 200px; margin-right: 10px"
              clearable
              @change="fetchPointRecords"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select
              v-model="filterType"
              placeholder="积分类型"
              style="width: 120px; margin-right: 10px"
              clearable
              @change="fetchPointRecords"
            >
              <el-option label="获得" value="earn" />
              <el-option label="使用" value="use" />
              <el-option label="过期" value="expire" />
            </el-select>
            <el-button type="primary" @click="fetchPointRecords">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="pointRecords"
        v-loading="loading"
        style="width: 100%"
        :default-sort="{ prop: 'created_at', order: 'descending' }"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="user_name" label="用户" width="120">
          <template #default="{ row }">
            <div>
              <div>{{ row.user_name || '未知' }}</div>
              <div style="color: #999; font-size: 12px">{{ row.user_phone }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="100">
          <template #default="{ row }">
            <span :class="getPointsClass(row.type)">
              {{ row.type === 'use' ? '-' : '+' }}{{ row.points }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" size="small">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="100">
          <template #default="{ row }">
            <el-tag size="small" plain>
              {{ getSourceText(row.source) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150" />
        <el-table-column prop="expires_at" label="过期时间" width="180">
          <template #default="{ row }">
            <span v-if="row.expires_at">
              {{ formatDateTime(row.expires_at) }}
            </span>
            <span v-else style="color: #999">永不过期</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>

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

    <!-- 分配积分对话框 -->
    <el-dialog
      v-model="assignDialogVisible"
      title="手动分配积分"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="assignFormRef"
        :model="assignForm"
        :rules="assignRules"
        label-width="100px"
      >
        <el-form-item label="选择用户" prop="user_id">
          <el-select
            v-model="assignForm.user_id"
            placeholder="请选择用户"
            style="width: 100%"
            filterable
            remote
            :remote-method="searchUsers"
            :loading="userSearchLoading"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="`${user.name} (${user.phone})`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="积分数量" prop="points">
          <el-input-number
            v-model="assignForm.points"
            :min="1"
            :max="1000"
            placeholder="请输入积分数量"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="有效期" prop="expires_days">
          <el-input-number
            v-model="assignForm.expires_days"
            :min="1"
            :max="365"
            placeholder="天数"
            style="width: 100%"
          />
          <div style="color: #999; font-size: 12px; margin-top: 4px">
            设置积分有效期（天数），留空则永不过期
          </div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="assignForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入积分分配原因或描述"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="assignForm.is_new_user_reward">
            这是新用户注册奖励（将同时给邀请人奖励5积分）
          </el-checkbox>
          <div style="color: #999; font-size: 12px; margin-top: 4px">
            勾选此项后，如果该用户是通过邀请码注册的，邀请人将自动获得5积分奖励
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="assignDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAssign" :loading="assigning">
            确认分配
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Gift, DataAnalysis, Search, Refresh } from '@element-plus/icons-vue'
import { manualAssignPoints, getPointConfig } from '@/api/userPoints'
import { getUserList } from '@/api/user'

// 响应式数据
const loading = ref(false)
const pointRecords = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchKeyword = ref('')
const filterType = ref('')

// 分配积分对话框
const assignDialogVisible = ref(false)
const assigning = ref(false)
const assignFormRef = ref()
const assignForm = reactive({
  user_id: null,
  points: 15,
  expires_days: 30,
  description: '',
  is_new_user_reward: false
})

// 用户搜索
const userOptions = ref([])
const userSearchLoading = ref(false)

// 表单验证规则
const assignRules = {
  user_id: [
    { required: true, message: '请选择用户', trigger: 'change' }
  ],
  points: [
    { required: true, message: '请输入积分数量', trigger: 'blur' },
    { type: 'number', min: 1, max: 1000, message: '积分数量必须在1-1000之间', trigger: 'blur' }
  ]
}

// 获取积分记录
const fetchPointRecords = async () => {
  try {
    loading.value = true
    // 这里应该调用真实的API
    // const response = await getPointRecords({
    //   page: currentPage.value,
    //   per_page: pageSize.value,
    //   keyword: searchKeyword.value,
    //   type: filterType.value
    // })
    
    // 模拟数据
    pointRecords.value = [
      {
        id: 1,
        user_name: '张三',
        user_phone: '13800138000',
        points: 15,
        type: 'earn',
        source: 'admin',
        description: '管理员手动分配积分',
        expires_at: '2025-02-20 12:00:00',
        status: 'active',
        created_at: '2025-01-21 12:00:00'
      }
    ]
    total.value = 1
  } catch (error) {
    console.error('获取积分记录失败:', error)
    ElMessage.error('获取积分记录失败')
  } finally {
    loading.value = false
  }
}

// 搜索用户
const searchUsers = async (query) => {
  if (!query) return
  
  try {
    userSearchLoading.value = true
    // 这里应该调用真实的API
    // const response = await getUserList({ keyword: query })
    
    // 模拟数据
    userOptions.value = [
      { id: 1, name: '张三', phone: '13800138000' },
      { id: 2, name: '李四', phone: '13800138001' }
    ]
  } catch (error) {
    console.error('搜索用户失败:', error)
  } finally {
    userSearchLoading.value = false
  }
}

// 显示分配对话框
const showAssignDialog = () => {
  assignDialogVisible.value = true
  // 重置表单
  Object.assign(assignForm, {
    user_id: null,
    points: 15,
    expires_days: 30,
    description: '',
    is_new_user_reward: false
  })
  userOptions.value = []
}

// 提交分配
const submitAssign = async () => {
  try {
    const valid = await assignFormRef.value.validate()
    if (!valid) return

    assigning.value = true
    
    const response = await manualAssignPoints(assignForm)
    if (response.code === 0) {
      ElMessage.success('积分分配成功')
      assignDialogVisible.value = false
      fetchPointRecords()
    } else {
      ElMessage.error(response.message || '分配失败')
    }
  } catch (error) {
    console.error('分配积分失败:', error)
    ElMessage.error('分配失败，请重试')
  } finally {
    assigning.value = false
  }
}

// 显示统计
const showStats = () => {
  ElMessage.info('积分统计功能开发中')
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
  fetchPointRecords()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchPointRecords()
}

// 工具函数
const getPointsClass = (type) => {
  return type === 'use' ? 'points-negative' : 'points-positive'
}

const getTypeTagType = (type) => {
  const typeMap = {
    'earn': 'success',
    'use': 'warning',
    'expire': 'danger'
  }
  return typeMap[type] || 'info'
}

const getTypeText = (type) => {
  const textMap = {
    'earn': '获得',
    'use': '使用',
    'expire': '过期'
  }
  return textMap[type] || '未知'
}

const getSourceText = (source) => {
  const textMap = {
    'invite': '邀请注册',
    'checkin': '签到取水',
    'admin': '管理员分配',
    'system': '系统分配',
    'invite_reward': '邀请奖励'
  }
  return textMap[source] || '其他'
}

const getStatusTagType = (status) => {
  const typeMap = {
    'active': 'success',
    'used': 'info',
    'expired': 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    'active': '有效',
    'used': '已使用',
    'expired': '已过期'
  }
  return textMap[status] || '未知'
}

const formatDateTime = (datetime) => {
  return new Date(datetime).toLocaleString()
}

// 初始化
onMounted(() => {
  fetchPointRecords()
})
</script>

<style scoped>
.points-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.action-card .card-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-icon {
  flex-shrink: 0;
}

.card-info {
  flex: 1;
}

.card-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.card-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.points-positive {
  color: #52c41a;
  font-weight: bold;
}

.points-negative {
  color: #ff4d4f;
  font-weight: bold;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 