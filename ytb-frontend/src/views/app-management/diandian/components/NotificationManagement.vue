<template>
  <div class="notification-management">
    <div class="management-header">
      <h3>通知管理</h3>
      <div class="header-actions">
        <el-button type="primary" icon="Plus" @click="showAddDialog">发送通知</el-button>
        <el-button icon="Refresh" @click="refreshData" :loading="refreshing">刷新</el-button>
      </div>
    </div>

    <!-- 通知统计 -->
    <el-row :gutter="20" class="mb-6">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon sent">
              <el-icon><Message /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.sent }}</div>
              <div class="stat-label">已发送</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon pending">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.pending }}</div>
              <div class="stat-label">待发送</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon read">
              <el-icon><View /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.read }}</div>
              <div class="stat-label">已读</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon failed">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.failed }}</div>
              <div class="stat-label">发送失败</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选和搜索 -->
    <el-card class="filter-card mb-4">
      <el-form :model="filterForm" :inline="true">
        <el-form-item label="通知类型">
          <el-select v-model="filterForm.type" placeholder="选择类型" clearable>
            <el-option label="系统通知" value="system" />
            <el-option label="活动通知" value="activity" />
            <el-option label="版本更新" value="update" />
            <el-option label="营销推送" value="marketing" />
          </el-select>
        </el-form-item>
        <el-form-item label="发送状态">
          <el-select v-model="filterForm.status" placeholder="选择状态" clearable>
            <el-option label="已发送" value="sent" />
            <el-option label="待发送" value="pending" />
            <el-option label="发送失败" value="failed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="发送时间">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索标题或内容"
            style="width: 200px"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 通知列表 -->
    <el-card class="notification-list">
      <el-table :data="notifications" v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="通知类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="content" label="内容" min-width="300" show-overflow-tooltip />
        <el-table-column label="目标用户" width="120">
          <template #default="{ row }">
            <span>{{ row.targetType === 'all' ? '全部用户' : `${row.targetCount}人` }}</span>
          </template>
        </el-table-column>
        <el-table-column label="发送状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="阅读率" width="100">
          <template #default="{ row }">
            <span v-if="row.status === 'sent'">{{ calculateReadRate(row) }}%</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sendTime" label="发送时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewNotification(row)">查看</el-button>
            <el-button size="small" type="primary" @click="editNotification(row)" 
                      v-if="row.status === 'pending'">编辑</el-button>
            <el-button size="small" type="success" @click="sendNotification(row)" 
                      v-if="row.status === 'pending'">发送</el-button>
            <el-button size="small" type="danger" @click="deleteNotification(row)" 
                      v-if="row.status === 'pending'">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作 -->
      <div class="batch-actions" v-if="selectedNotifications.length > 0">
        <span>已选择 {{ selectedNotifications.length }} 条通知</span>
        <el-button type="success" size="small" @click="batchSend">批量发送</el-button>
        <el-button type="danger" size="small" @click="batchDelete">批量删除</el-button>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalNotifications"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 发送通知对话框 -->
    <el-dialog v-model="addDialogVisible" :title="notificationForm.id ? '编辑通知' : '发送通知'" width="700px">
      <el-form :model="notificationForm" :rules="notificationRules" ref="notificationFormRef" label-width="100px">
        <el-form-item label="通知类型" prop="type">
          <el-select v-model="notificationForm.type" placeholder="选择通知类型">
            <el-option label="系统通知" value="system" />
            <el-option label="活动通知" value="activity" />
            <el-option label="版本更新" value="update" />
            <el-option label="营销推送" value="marketing" />
          </el-select>
        </el-form-item>
        <el-form-item label="通知标题" prop="title">
          <el-input v-model="notificationForm.title" placeholder="请输入通知标题" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="通知内容" prop="content">
          <el-input v-model="notificationForm.content" type="textarea" :rows="4" 
                   placeholder="请输入通知内容" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="目标用户" prop="targetType">
          <el-radio-group v-model="notificationForm.targetType">
            <el-radio label="all">全部用户</el-radio>
            <el-radio label="vip">VIP用户</el-radio>
            <el-radio label="active">活跃用户</el-radio>
            <el-radio label="custom">指定用户</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="用户列表" v-if="notificationForm.targetType === 'custom'">
          <el-input v-model="notificationForm.targetUsers" type="textarea" :rows="3" 
                   placeholder="请输入用户ID，多个用户用逗号分隔" />
        </el-form-item>
        <el-form-item label="发送方式" prop="sendType">
          <el-radio-group v-model="notificationForm.sendType">
            <el-radio label="immediate">立即发送</el-radio>
            <el-radio label="scheduled">定时发送</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="发送时间" v-if="notificationForm.sendType === 'scheduled'" prop="scheduledTime">
          <el-date-picker
            v-model="notificationForm.scheduledTime"
            type="datetime"
            placeholder="选择发送时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input v-model="notificationForm.jumpUrl" placeholder="点击通知后跳转的链接（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitNotification" :loading="submitting">
            {{ notificationForm.sendType === 'immediate' ? '立即发送' : '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Message, Clock, View, Warning } from '@element-plus/icons-vue'

export default {
  name: 'NotificationManagement',
  components: {
    Message,
    Clock,
    View,
    Warning
  },
  setup() {
    const loading = ref(false)
    const refreshing = ref(false)
    const submitting = ref(false)
    const addDialogVisible = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(10)
    const totalNotifications = ref(0)
    const selectedNotifications = ref([])

    // 统计数据
    const stats = reactive({
      sent: 1256,
      pending: 23,
      read: 892,
      failed: 12
    })

    // 筛选表单
    const filterForm = reactive({
      type: '',
      status: '',
      dateRange: [],
      keyword: ''
    })

    // 通知数据
    const notifications = ref([
      {
        id: 1,
        type: 'system',
        title: '系统维护通知',
        content: '系统将于今晚23:00-01:00进行维护，期间可能影响部分功能使用',
        targetType: 'all',
        targetCount: 0,
        status: 'sent',
        readCount: 892,
        totalCount: 1256,
        sendTime: '2025-01-15 14:30:00'
      },
      {
        id: 2,
        type: 'activity',
        title: '新年活动开始啦',
        content: '参与新年活动，赢取丰厚奖品！活动时间：1月15日-2月15日',
        targetType: 'all',
        targetCount: 0,
        status: 'pending',
        readCount: 0,
        totalCount: 0,
        sendTime: null
      },
      {
        id: 3,
        type: 'update',
        title: '版本更新通知',
        content: '新版本已发布，请及时更新以获得更好的使用体验',
        targetType: 'all',
        targetCount: 0,
        status: 'sent',
        readCount: 756,
        totalCount: 1256,
        sendTime: '2025-01-10 16:20:00'
      }
    ])

    // 通知表单
    const notificationForm = reactive({
      id: null,
      type: '',
      title: '',
      content: '',
      targetType: 'all',
      targetUsers: '',
      sendType: 'immediate',
      scheduledTime: '',
      jumpUrl: ''
    })

    // 表单验证规则
    const notificationRules = {
      type: [{ required: true, message: '请选择通知类型', trigger: 'change' }],
      title: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
      content: [{ required: true, message: '请输入通知内容', trigger: 'blur' }],
      targetType: [{ required: true, message: '请选择目标用户', trigger: 'change' }],
      sendType: [{ required: true, message: '请选择发送方式', trigger: 'change' }],
      scheduledTime: [
        { required: true, message: '请选择发送时间', trigger: 'change' },
        {
          validator: (rule, value, callback) => {
            if (notificationForm.sendType === 'scheduled' && !value) {
              callback(new Error('请选择发送时间'))
            } else if (notificationForm.sendType === 'scheduled' && new Date(value) <= new Date()) {
              callback(new Error('发送时间不能早于当前时间'))
            } else {
              callback()
            }
          },
          trigger: 'change'
        }
      ]
    }

    const notificationFormRef = ref()

    // 方法
    const getTypeTagType = (type) => {
      const types = {
        system: 'info',
        activity: 'success',
        update: 'warning',
        marketing: 'primary'
      }
      return types[type] || 'info'
    }

    const getTypeText = (type) => {
      const texts = {
        system: '系统通知',
        activity: '活动通知',
        update: '版本更新',
        marketing: '营销推送'
      }
      return texts[type] || type
    }

    const getStatusTagType = (status) => {
      const types = {
        sent: 'success',
        pending: 'warning',
        failed: 'danger',
        cancelled: 'info'
      }
      return types[status] || 'info'
    }

    const getStatusText = (status) => {
      const texts = {
        sent: '已发送',
        pending: '待发送',
        failed: '发送失败',
        cancelled: '已取消'
      }
      return texts[status] || status
    }

    const calculateReadRate = (notification) => {
      if (notification.totalCount === 0) return 0
      return Math.round((notification.readCount / notification.totalCount) * 100)
    }

    const refreshData = async () => {
      refreshing.value = true
      try {
        // 模拟刷新数据
        await new Promise(resolve => setTimeout(resolve, 1000))
        ElMessage.success('数据刷新成功')
      } catch (error) {
        ElMessage.error('数据刷新失败')
      } finally {
        refreshing.value = false
      }
    }

    const showAddDialog = () => {
      resetForm()
      addDialogVisible.value = true
    }

    const resetForm = () => {
      notificationForm.id = null
      notificationForm.type = ''
      notificationForm.title = ''
      notificationForm.content = ''
      notificationForm.targetType = 'all'
      notificationForm.targetUsers = ''
      notificationForm.sendType = 'immediate'
      notificationForm.scheduledTime = ''
      notificationForm.jumpUrl = ''
    }

    const handleFilter = () => {
      currentPage.value = 1
      // 实际应该调用API进行筛选
      ElMessage.success('筛选完成')
    }

    const resetFilter = () => {
      filterForm.type = ''
      filterForm.status = ''
      filterForm.dateRange = []
      filterForm.keyword = ''
      handleFilter()
    }

    const handleSelectionChange = (selection) => {
      selectedNotifications.value = selection
    }

    const viewNotification = (notification) => {
      ElMessage.info(`查看通知：${notification.title}`)
    }

    const editNotification = (notification) => {
      Object.assign(notificationForm, notification)
      addDialogVisible.value = true
    }

    const sendNotification = (notification) => {
      ElMessageBox.confirm(
        `确认要发送通知"${notification.title}"吗？`,
        '确认发送',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        notification.status = 'sent'
        notification.sendTime = new Date().toLocaleString()
        ElMessage.success('通知发送成功')
      }).catch(() => {
        ElMessage.info('已取消发送')
      })
    }

    const deleteNotification = (notification) => {
      ElMessageBox.confirm(
        `确认要删除通知"${notification.title}"吗？`,
        '确认删除',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        const index = notifications.value.findIndex(item => item.id === notification.id)
        if (index > -1) {
          notifications.value.splice(index, 1)
          ElMessage.success('删除成功')
        }
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }

    const batchSend = () => {
      ElMessageBox.confirm(
        `确认要发送选中的 ${selectedNotifications.value.length} 条通知吗？`,
        '批量发送',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        selectedNotifications.value.forEach(notification => {
          notification.status = 'sent'
          notification.sendTime = new Date().toLocaleString()
        })
        ElMessage.success('批量发送成功')
        selectedNotifications.value = []
      }).catch(() => {
        ElMessage.info('已取消发送')
      })
    }

    const batchDelete = () => {
      ElMessageBox.confirm(
        `确认要删除选中的 ${selectedNotifications.value.length} 条通知吗？`,
        '批量删除',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        selectedNotifications.value.forEach(notification => {
          const index = notifications.value.findIndex(item => item.id === notification.id)
          if (index > -1) {
            notifications.value.splice(index, 1)
          }
        })
        ElMessage.success('批量删除成功')
        selectedNotifications.value = []
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }

    const submitNotification = async () => {
      if (!notificationFormRef.value) return
      
      try {
        await notificationFormRef.value.validate()
        submitting.value = true
        
        // 模拟提交
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        if (notificationForm.sendType === 'immediate') {
          ElMessage.success('通知发送成功')
        } else {
          ElMessage.success('通知保存成功，将在指定时间发送')
        }
        
        addDialogVisible.value = false
        resetForm()
        
        // 刷新数据
        // await fetchNotifications()
      } catch (error) {
        console.error('通知发送失败:', error)
      } finally {
        submitting.value = false
      }
    }

    const handleSizeChange = (val) => {
      pageSize.value = val
      currentPage.value = 1
    }

    const handleCurrentChange = (val) => {
      currentPage.value = val
    }

    onMounted(() => {
      totalNotifications.value = notifications.value.length
    })

    return {
      loading,
      refreshing,
      submitting,
      addDialogVisible,
      currentPage,
      pageSize,
      totalNotifications,
      selectedNotifications,
      stats,
      filterForm,
      notifications,
      notificationForm,
      notificationRules,
      notificationFormRef,
      getTypeTagType,
      getTypeText,
      getStatusTagType,
      getStatusText,
      calculateReadRate,
      refreshData,
      showAddDialog,
      handleFilter,
      resetFilter,
      handleSelectionChange,
      viewNotification,
      editNotification,
      sendNotification,
      deleteNotification,
      batchSend,
      batchDelete,
      submitNotification,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.management-header h3 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 20px;
  color: white;
}

.stat-icon.sent {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.read {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-icon.failed {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  line-height: 1;
}

.filter-card {
  margin-bottom: 16px;
}

.notification-list {
  margin-top: 16px;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid #ebeef5;
  margin-top: 16px;
}

.batch-actions span {
  color: #606266;
  font-size: 14px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.mb-4 {
  margin-bottom: 16px;
}

.mb-6 {
  margin-bottom: 24px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .management-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .batch-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
