<template>
  <div class="branch-vip-users">
    <!-- 页面标题和操作 -->
    <div class="page-header">
      <div class="header-left">
        <h2>CP会员</h2>
        <p>管理分支机构的CP用户</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="exportUsers">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon total">
            <el-icon size="20"><Star /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics.totalVip }}</div>
            <div class="stat-label">总CP数</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon today">
            <el-icon size="20"><Plus /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics.todayVip }}</div>
            <div class="stat-label">今日新增</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon paid">
            <el-icon size="20"><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics.paidVip }}</div>
            <div class="stat-label">已完款CP</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon unpaid">
            <el-icon size="20"><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics.unpaidVip }}</div>
            <div class="stat-label">未完款CP</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 搜索过滤器 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filters" inline>
        <el-form-item label="手机号">
          <el-input
            v-model="filters.phone"
            placeholder="请输入手机号"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="完款状态">
          <el-select v-model="filters.vip_at_status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="已完款" :value="1" />
            <el-option label="未完款" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchUsers">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- CP用户列表 -->
    <el-card shadow="never">
      <el-table
        :data="users"
        v-loading="loading"
        style="width: 100%"
        row-key="id"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.avatar" />
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="CP状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.vip_at ? 'success' : 'warning'">
              {{ row.vip_at ? '已完款' : '未完款' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="vip_at" label="完款时间" width="160" />
        <el-table-column prop="balance" label="余额" width="100">
          <template #default="{ row }">
            ¥{{ row.balance }}
          </template>
        </el-table-column>
        <el-table-column label="设备数" width="80">
          <template #default="{ row }">
            {{ row.total_devices_count || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="团队人数" width="80">
          <template #default="{ row }">
            {{ row.team_count || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="160" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="showUserDetail(row)">详情</el-button>
            <el-button size="small" type="primary" @click="showEditDialog(row)">编辑</el-button>
            <el-button size="small" type="warning" @click="showTeamTree(row)">关系树</el-button>
            <el-button
              size="small"
              :type="row.status === 'normal' ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'normal' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchUsers"
          @current-change="fetchUsers"
        />
      </div>
    </el-card>

    <!-- CP用户详情对话框 -->
    <el-dialog
      title="CP用户详情"
      v-model="detailVisible"
      width="800px"
    >
      <div v-if="currentUser" class="user-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户ID">{{ currentUser.id }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ currentUser.nickname }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
          <el-descriptions-item label="CP状态">
            <el-tag :type="currentUser.vip_at ? 'success' : 'warning'">
              {{ currentUser.vip_at ? '已完款' : '未完款' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="完款时间">{{ currentUser.vip_at || '未完款' }}</el-descriptions-item>
          <el-descriptions-item label="账户余额">¥{{ currentUser.balance }}</el-descriptions-item>
          <el-descriptions-item label="设备数量">{{ currentUser.total_devices_count || 0 }}台</el-descriptions-item>
          <el-descriptions-item label="团队人数">{{ currentUser.team_count || 0 }}人</el-descriptions-item>
          <el-descriptions-item label="推荐人">{{ currentUser.referrer || '无' }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ currentUser.created_at }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 团队关系树弹窗 -->
    <el-dialog
      v-model="teamDialogVisible"
      width="90%"
      top="5vh"
      :close-on-click-modal="false"
    >
      <template #header="{ close, titleId, titleClass }">
        <div class="dialog-header-custom">
          <span :id="titleId" :class="titleClass">
            {{ `${currentTeamUser?.nickname || currentTeamUser?.name}的团队关系树` }}
          </span>
          <div class="header-actions">
            <!-- 时间选择器 -->
            <el-select 
              v-model="selectedTimeRange" 
              placeholder="选择时间范围" 
              size="small" 
              style="width: 120px; margin-right: 10px;"
              @change="handleTimeRangeChange"
            >
              <el-option label="所有" value="all" />
              <el-option label="本月" value="current_month" />
              <el-option label="上月" value="last_month" />
            </el-select>
            <el-button
              type="primary"
              size="small"
              :loading="saveImageLoading"
              @click="saveAsImage"
            >
              <el-icon><Camera /></el-icon>
              保存为图片
            </el-button>
            <el-button
              type="info"
              size="small"
              circle
              @click="close"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
      </template>
      <div v-loading="teamLoading" class="team-dialog-content" ref="teamTreeContainer">
        <!-- 团队统计面板 -->
        <div v-if="teamStats" class="team-stats-panel mb-4">
          <el-row :gutter="15">
            <el-col :span="6">
              <el-card shadow="hover" class="team-stat-card">
                <div class="stat-item">
                  <div class="stat-value primary">{{ teamStats.total_members }}</div>
                  <div class="stat-label">团队总人数</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="team-stat-card">
                <div class="stat-item">
                  <div class="stat-value info">{{ teamStats.month_new_vip }}</div>
                  <div class="stat-label">本月新增</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="team-stat-card">
                <div class="stat-item">
                  <div class="stat-value danger">{{ teamStats.last_month_new_vip }}</div>
                  <div class="stat-label">上月新增</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="team-stat-card">
                <div class="stat-item">
                  <div class="stat-value purple">{{ teamStats.max_level }}</div>
                  <div class="stat-label">最大层级</div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 团队关系树可视化 -->
        <TeamTreeVisualization
          :root-user="currentTeamUser"
          :team-members="teamMembers"
          @node-click="handleNodeClick"
        />
      </div>
    </el-dialog>

    <!-- 编辑CP用户对话框 -->
    <el-dialog
      title="编辑CP用户"
      v-model="editVisible"
      width="600px"
      @close="resetEditForm"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="CP状态" prop="vip_at_status">
          <el-select v-model="editForm.vip_at_status" placeholder="请选择CP状态">
            <el-option label="已完款" value="paid" />
            <el-option label="未完款" value="unpaid" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="editForm.status" placeholder="请选择状态">
            <el-option label="正常" value="normal" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="editForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEdit" :loading="submitting">
            更新
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
import { Download, Star, Plus, CircleCheck, Clock, Camera, Close } from '@element-plus/icons-vue'
import { getBranchVipUsers, getBranchVipTeamMembers, updateBranchAppUser } from '@/api/v1/branchManagement.js'
import TeamTreeVisualization from '@/components/TeamTreeVisualization.vue'
import axios from 'axios'
import html2canvas from 'html2canvas'

const route = useRoute()
const branchId = computed(() => route.params.branchId)

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const detailVisible = ref(false)
const editVisible = ref(false)
const editFormRef = ref()

// CP用户列表
const users = ref([])
const currentUser = ref(null)

// 团队关系树相关状态
const teamDialogVisible = ref(false)
const teamLoading = ref(false)
const currentTeamUser = ref(null)
const teamMembers = ref([])
const teamTreeContainer = ref(null)
const saveImageLoading = ref(false)
const teamStats = ref(null)
const selectedTimeRange = ref('all')

// 统计数据
const statistics = reactive({
  totalVip: 0,
  todayVip: 0,
  paidVip: 0,
  unpaidVip: 0
})

// 搜索过滤器
const filters = reactive({
  phone: '',
  vip_at_status: '',
  dateRange: []
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 编辑表单
const editForm = reactive({
  id: '',
  nickname: '',
  vip_at_status: '',
  status: '',
  remark: ''
})

// 编辑表单验证规则
const editRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' }
  ],
  vip_at_status: [
    { required: true, message: '请选择CP状态', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 获取CP用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      page: pagination.page,
      size: pagination.size,
      phone: filters.phone,
      dateRange: filters.dateRange
    }
    
    // 转换CP状态过滤参数
    if (filters.vip_at_status) {
      params.is_vip_paid = filters.vip_at_status === 'paid' ? 1 : 0
    }
    
    const response = await getBranchVipUsers(branchId.value, params)
    
    if (response.code === 0) {
      users.value = response.data.data || []
      pagination.total = response.data.total || 0
      
      // 更新统计数据
      statistics.totalVip = response.data.total || 0
      statistics.todayVip = response.data.today_vip || 0
      statistics.paidVip = response.data.paid_vip || 0
      statistics.unpaidVip = response.data.unpaid_vip || 0
    } else {
      ElMessage.error(response.message || '获取CP用户列表失败')
    }
  } catch (error) {
    console.error('获取CP用户列表失败:', error)
    ElMessage.error('获取CP用户列表失败')
  } finally {
    loading.value = false
  }
}

// 显示CP用户详情
const showUserDetail = (row) => {
  currentUser.value = row
  detailVisible.value = true
}

// 显示编辑对话框
const showEditDialog = (row) => {
  Object.assign(editForm, {
    id: row.id,
    nickname: row.nickname,
    vip_at_status: row.vip_at ? 'paid' : 'unpaid',
    status: row.status,
    remark: row.remark || ''
  })
  editVisible.value = true
}

// 提交编辑
const submitEdit = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      const response = await updateBranchAppUser(branchId.value, editForm.id, {
        nickname: editForm.nickname,
        vip_at_status: editForm.vip_at_status === 'paid',
        status: editForm.status,
        remark: editForm.remark
      })
      
      if (response.code === 0) {
        ElMessage.success('更新成功')
        editVisible.value = false
        fetchUsers()
      } else {
        ElMessage.error(response.message || '更新失败')
      }
    } catch (error) {
      console.error('更新失败:', error)
      ElMessage.error('更新失败')
    } finally {
      submitting.value = false
    }
  })
}

// 重置编辑表单
const resetEditForm = () => {
  if (editFormRef.value) {
    editFormRef.value.resetFields()
  }
  Object.assign(editForm, {
    id: '',
    nickname: '',
    vip_at_status: '',
    status: '',
    remark: ''
  })
}

// 重置搜索
const resetFilters = () => {
  Object.assign(filters, {
    phone: '',
    vip_at_status: '',
    dateRange: []
  })
  pagination.page = 1
  fetchUsers()
}

// 切换状态
const toggleStatus = async (row) => {
  const newStatus = row.status === 'normal' ? 'disabled' : 'normal'
  const action = row.status === 'normal' ? '禁用' : '启用'
  
  try {
    await ElMessageBox.confirm(`确定要${action}该CP用户吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await updateBranchAppUser(branchId.value, row.id, {
      ...row,
      status: newStatus
    })
    
    if (response.code === 0) {
      ElMessage.success(`${action}成功`)
      fetchUsers()
    } else {
      ElMessage.error(response.message || `${action}失败`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error(`${action}失败:`, error)
      ElMessage.error(`${action}失败`)
    }
  }
}

// 导出CP用户数据
const exportUsers = () => {
  ElMessage.success('导出功能开发中')
}

// 显示团队关系树
const showTeamTree = async (user) => {
  currentTeamUser.value = user
  teamDialogVisible.value = true
  selectedTimeRange.value = 'all' // 重置时间范围为默认值
  await loadTeamData(user.id)
}

// 加载团队数据
const loadTeamData = async (userId) => {
  teamLoading.value = true
  
  try {
    const branchId = route.params.branchId
    const params = {
      user_id: userId
    }
    
    // 根据时间范围添加参数
    if (selectedTimeRange.value !== 'all') {
      params.time_range = selectedTimeRange.value
    }
    
    console.log('🔍 加载分支机构VIP团队数据:', { branchId, params })
    
    // 使用Laravel V1 API
    const response = await getBranchVipTeamMembers(branchId, params)
    
    if (response.code === 0) {
      const data = response.data
      
      // 处理团队成员数据
      const processedMembers = data.members || []
      
      teamMembers.value = processedMembers
      teamStats.value = {
        total_members: data.statistics?.total_members || 0,
        month_new_vip: data.statistics?.this_month_new || 0,
        last_month_new_vip: data.statistics?.last_month_new || 0,
        max_level: data.statistics?.total_levels || 1
      }
      
      console.log('✅ 分支机构VIP团队数据加载成功:', {
        userCount: processedMembers.length,
        stats: teamStats.value
      })
    } else {
      console.error('❌ 获取分支机构团队数据失败:', response.message)
      ElMessage.error(response.message || '获取团队数据失败')
    }
  } catch (error) {
    console.error('❌ 加载分支机构团队数据失败:', error)
    ElMessage.error('获取团队数据失败，请稍后重试')
  } finally {
    teamLoading.value = false
  }
}

// 处理时间范围变更
const handleTimeRangeChange = () => {
  if (currentTeamUser.value) {
    loadTeamData(currentTeamUser.value.id)
  }
}

// 处理节点点击事件
const handleNodeClick = (node) => {
  console.log('团队节点点击:', node)
}

// 保存为图片功能
const saveAsImage = async () => {
  if (!teamTreeContainer.value) {
    ElMessage.error('无法获取团队关系树容器')
    return
  }

  saveImageLoading.value = true
  
  try {
    console.log('=== 开始保存分支机构团队关系树图片 ===')
    
    // 验证html2canvas是否可用
    if (typeof html2canvas !== 'function') {
      console.error('❌ html2canvas不可用')
      ElMessage.error('图片生成库未正确加载，请刷新页面重试')
      return
    }
    
    const container = teamTreeContainer.value
    console.log('✅ 容器获取成功')
    
    // 添加截图优化样式类
    container.classList.add('capturing')
    
    // 等待样式生效
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 生成图片
    const canvas = await html2canvas(container, {
      backgroundColor: '#f5f7fa',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: Math.max(800, container.scrollWidth),
      height: Math.max(600, container.scrollHeight)
    })
    
    // 移除截图样式类
    container.classList.remove('capturing')
    
    // 下载图片
    const link = document.createElement('a')
    link.download = `${currentTeamUser.value?.name || 'VIP'}_团队关系树_${new Date().toISOString().slice(0, 10)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    
    console.log('✅ 图片保存成功')
    ElMessage.success('团队关系树图片已保存')
    
  } catch (error) {
    console.error('❌ 保存图片失败:', error)
    ElMessage.error('保存图片失败: ' + error.message)
  } finally {
    saveImageLoading.value = false
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.branch-vip-users {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.header-left h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.header-left p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.today {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.paid {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.unpaid {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  color: #333;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.user-detail {
  margin-top: 20px;
}

.dialog-footer {
  text-align: right;
}

.dialog-footer .el-button {
  margin-left: 10px;
}
</style> 