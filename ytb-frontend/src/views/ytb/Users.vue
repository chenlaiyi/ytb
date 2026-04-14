<template>
  <div class="ytb-users-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.total_users || 0 }}</div>
            <div class="stat-label">总用户数</div>
          </div>
          <el-icon class="stat-icon"><User /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-scp">
          <div class="stat-content">
            <div class="stat-value">{{ stats.scp_users || 0 }}</div>
            <div class="stat-label">CP伙伴</div>
          </div>
          <el-icon class="stat-icon"><UserFilled /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-teamcp">
          <div class="stat-content">
            <div class="stat-value">{{ stats.team_cp_users || 0 }}</div>
            <div class="stat-label">VIPCP伙伴</div>
          </div>
          <el-icon class="stat-icon"><Avatar /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-new">
          <div class="stat-content">
            <div class="stat-value">{{ stats.today_new_users || 0 }}</div>
            <div class="stat-label">今日新增</div>
          </div>
          <el-icon class="stat-icon"><Plus /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索和筛选 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="昵称/手机号/姓名/邀请码"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="filters.role" placeholder="全部角色" clearable>
            <el-option label="普通用户" value="normal" />
            <el-option label="CP伙伴" value="scp" />
            <el-option label="VIPCP伙伴" value="team_cp" />
            <el-option label="BossCP" value="boss_cp" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button type="warning" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="users"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户信息" min-width="200">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="40" :src="row.avatar">
                {{ row.nickname?.charAt(0) || 'Y' }}
              </el-avatar>
              <div class="user-detail">
                <div class="nickname">{{ row.nickname || '未设置' }}</div>
                <div class="phone">{{ row.phone || '未绑定' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="real_name" label="真实姓名" width="100">
          <template #default="{ row }">
            {{ row.real_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)">
              {{ row.role_name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="invite_code" label="邀请码" width="100">
          <template #default="{ row }">
            <span v-if="row.invite_code" class="invite-code">{{ row.invite_code }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="上级" width="150">
          <template #default="{ row }">
            <div v-if="row.parent">
              <div>{{ row.parent.nickname || '未知' }}</div>
              <div class="text-muted">{{ row.parent.phone }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="直推数据" width="120">
          <template #default="{ row }">
            <div>用户: {{ row.direct_user_count || 0 }}</div>
            <div>CP伙伴: {{ row.direct_scp_count || 0 }}</div>
          </template>
        </el-table-column>
        <el-table-column label="分佣(元)" width="120">
          <template #default="{ row }">
            <div class="commission-info">
              <div>总计: ¥{{ row.total_commission || '0.00' }}</div>
              <div class="text-muted">待结: ¥{{ row.pending_commission || '0.00' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button type="warning" link size="small" @click="handleEditRole(row)">
              角色
            </el-button>
            <el-button
              :type="row.status === 'active' ? 'danger' : 'success'"
              link
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.perPage"
          :page-sizes="[15, 30, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 用户详情弹窗 -->
    <el-dialog v-model="detailVisible" title="用户详情" width="700px">
      <div v-if="currentUser" class="user-detail-dialog">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ currentUser.id }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ currentUser.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentUser.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="真实姓名">{{ currentUser.real_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="getRoleTagType(currentUser.role)">{{ currentUser.role_name }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="邀请码">{{ currentUser.invite_code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="直推用户">{{ currentUser.direct_user_count || 0 }}</el-descriptions-item>
          <el-descriptions-item label="直推CP伙伴">{{ currentUser.direct_scp_count || 0 }}</el-descriptions-item>
          <el-descriptions-item label="总分佣">¥{{ currentUser.total_commission || '0.00' }}</el-descriptions-item>
          <el-descriptions-item label="待结算">¥{{ currentUser.pending_commission || '0.00' }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDate(currentUser.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="升级时间">{{ formatDate(currentUser.role_upgraded_at) || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="currentUser.parent" class="section-title">上级信息</div>
        <el-descriptions v-if="currentUser.parent" :column="2" border>
          <el-descriptions-item label="昵称">{{ currentUser.parent.nickname }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentUser.parent.phone }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 修改角色弹窗 -->
    <el-dialog v-model="roleDialogVisible" title="修改用户角色" width="400px">
      <el-form :model="roleForm" label-width="80px">
        <el-form-item label="当前角色">
          <el-tag :type="getRoleTagType(roleForm.currentRole)">
            {{ getRoleName(roleForm.currentRole) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="新角色">
          <el-select v-model="roleForm.newRole" placeholder="请选择角色">
            <el-option label="普通用户" value="normal" />
            <el-option label="CP伙伴" value="scp" />
            <el-option label="VIPCP伙伴" value="team_cp" />
            <el-option label="BossCP" value="boss_cp" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmUpdateRole" :loading="submitting">
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, UserFilled, Avatar, Plus, Search, Refresh, Download } from '@element-plus/icons-vue'
import {
  getUsers,
  getUserDetail,
  getUserStatistics,
  updateUserRole,
  updateUserStatus
} from '@/api/v1/ytb'

// 状态
const loading = ref(false)
const submitting = ref(false)
const users = ref([])
const stats = ref({})
const currentUser = ref(null)
const detailVisible = ref(false)
const roleDialogVisible = ref(false)

// 筛选条件
const filters = reactive({
  keyword: '',
  role: '',
  status: ''
})

// 分页
const pagination = reactive({
  page: 1,
  perPage: 15,
  total: 0
})

// 角色表单
const roleForm = reactive({
  userId: null,
  currentRole: '',
  newRole: ''
})

// 角色名称映射
const roleNames = {
  normal: '普通用户',
  scp: 'CP伙伴',
  team_cp: 'VIPCP伙伴',
  boss_cp: 'BossCP'
}

// 初始化
onMounted(() => {
  loadStats()
  loadUsers()
})

// 加载统计数据
const loadStats = async () => {
  try {
    const res = await getUserStatistics()
    if (res.code === 0) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

// 加载用户列表
const loadUsers = async () => {
  loading.value = true
  try {
    const res = await getUsers({
      page: pagination.page,
      per_page: pagination.perPage,
      ...filters
    })
    if (res.code === 0) {
      users.value = res.data.items || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载用户失败:', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadUsers()
}

// 重置
const handleReset = () => {
  filters.keyword = ''
  filters.role = ''
  filters.status = ''
  pagination.page = 1
  loadUsers()
}

// 分页
const handleSizeChange = (size) => {
  pagination.perPage = size
  pagination.page = 1
  loadUsers()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadUsers()
}

// 查看详情
const handleView = async (row) => {
  try {
    const res = await getUserDetail(row.id)
    if (res.code === 0) {
      currentUser.value = res.data
      detailVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取用户详情失败')
  }
}

// 编辑角色
const handleEditRole = (row) => {
  roleForm.userId = row.id
  roleForm.currentRole = row.role
  roleForm.newRole = row.role
  roleDialogVisible.value = true
}

// 确认修改角色
const confirmUpdateRole = async () => {
  if (roleForm.newRole === roleForm.currentRole) {
    ElMessage.warning('角色未变更')
    return
  }

  submitting.value = true
  try {
    const res = await updateUserRole(roleForm.userId, roleForm.newRole)
    if (res.code === 0) {
      ElMessage.success('角色修改成功')
      roleDialogVisible.value = false
      loadUsers()
      loadStats()
    } else {
      ElMessage.error(res.message || '修改失败')
    }
  } catch (error) {
    ElMessage.error('修改失败')
  } finally {
    submitting.value = false
  }
}

// 切换状态
const handleToggleStatus = async (row) => {
  const newStatus = row.status === 'active' ? 'disabled' : 'active'
  const action = newStatus === 'disabled' ? '禁用' : '启用'

  try {
    await ElMessageBox.confirm(
      `确定要${action}用户 "${row.nickname || row.phone}" 吗？`,
      '提示',
      { type: 'warning' }
    )

    const res = await updateUserStatus(row.id, newStatus)
    if (res.code === 0) {
      ElMessage.success(`${action}成功`)
      loadUsers()
    } else {
      ElMessage.error(res.message || `${action}失败`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`)
    }
  }
}

// 导出用户
const handleExport = async () => {
  try {
    const res = await getUsers({
      ...filters,
      per_page: 10000 // 获取所有数据
    })
    if (res.code === 0) {
      const data = res.data.items || []
      if (data.length === 0) {
        ElMessage.warning('没有可导出的数据')
        return
      }

      const exportData = data.map(user => ({
        'ID': user.id,
        '昵称': user.nickname || '-',
        '手机号': user.phone || '-',
        '真实姓名': user.real_name || '-',
        '角色': roleNames[user.role] || '未知',
        '邀请码': user.invite_code || '-',
        '上级昵称': user.parent?.nickname || '-',
        '上级手机': user.parent?.phone || '-',
        '直推用户': user.direct_user_count || 0,
        '直推CP伙伴': user.direct_scp_count || 0,
        '总分佣': user.total_commission || '0.00',
        '待结算': user.pending_commission || '0.00',
        '状态': user.status === 'active' ? '正常' : '禁用',
        '注册时间': formatDate(user.created_at)
      }))

      const headers = Object.keys(exportData[0])
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
      ].join('\n')

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `YTB用户列表_${new Date().toISOString().slice(0, 10)}.csv`
      link.click()

      ElMessage.success('导出成功')
    } else {
      ElMessage.error(res.message || '导出失败')
    }
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 工具函数
const getRoleTagType = (role) => {
  switch (role) {
    case 'scp': return 'warning'
    case 'team_cp': return 'danger'
    case 'boss_cp': return ''
    default: return 'info'
  }
}

const getRoleName = (role) => {
  return roleNames[role] || '未知'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').substring(0, 19)
}
</script>

<style scoped>
.ytb-users-page {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card .stat-content {
  position: relative;
  z-index: 1;
}

.stat-card .stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}

.stat-card.stat-scp .stat-value {
  color: #e6a23c;
}

.stat-card.stat-teamcp .stat-value {
  color: #f56c6c;
}

.stat-card.stat-new .stat-value {
  color: #67c23a;
}

.stat-card .stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.stat-card .stat-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 48px;
  color: #f0f0f0;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.table-card {
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-detail .nickname {
  font-weight: 500;
}

.user-detail .phone {
  font-size: 12px;
  color: #909399;
}

.invite-code {
  font-family: monospace;
  color: #409eff;
  font-weight: bold;
}

.text-muted {
  font-size: 12px;
  color: #909399;
}

.commission-info {
  font-size: 13px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.user-detail-dialog .section-title {
  margin: 20px 0 10px;
  font-weight: bold;
  color: #303133;
}
</style>
