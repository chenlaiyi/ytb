<template>
  <div class="batch-operations">
    <!-- 批量操作工具栏 -->
    <div class="batch-toolbar" v-show="selectedItems.length > 0">
      <div class="batch-info">
        <el-icon><Select /></el-icon>
        <span>已选择 {{ selectedItems.length }} 项</span>
      </div>
      
      <div class="batch-actions">
        <el-button 
          v-for="action in availableActions" 
          :key="action.key"
          :type="action.type || 'default'"
          :icon="action.icon"
          :loading="action.loading"
          @click="handleBatchAction(action.key)"
          :disabled="!canExecuteAction(action)"
        >
          {{ action.label }}
        </el-button>
        
        <el-button @click="clearSelection" icon="Close">清空选择</el-button>
      </div>
    </div>

    <!-- 批量操作确认对话框 -->
    <el-dialog
      v-model="confirmDialog.visible"
      :title="confirmDialog.title"
      width="500px"
      :before-close="handleDialogClose"
    >
      <div class="confirm-content">
        <el-icon class="warning-icon"><Warning /></el-icon>
        <div class="confirm-text">
          <p>{{ confirmDialog.message }}</p>
          <p class="selected-count">将对 <strong>{{ selectedItems.length }}</strong> 项执行此操作</p>
          
          <!-- 额外参数输入 -->
          <div v-if="confirmDialog.extraParams" class="extra-params">
            <el-form :model="batchParams" label-width="80px">
              <el-form-item 
                v-for="param in confirmDialog.extraParams" 
                :key="param.key"
                :label="param.label"
                :required="param.required"
              >
                <el-input 
                  v-if="param.type === 'input'"
                  v-model="batchParams[param.key]"
                  :placeholder="param.placeholder"
                />
                <el-select 
                  v-else-if="param.type === 'select'"
                  v-model="batchParams[param.key]"
                  :placeholder="param.placeholder"
                  style="width: 100%"
                >
                  <el-option
                    v-for="option in param.options"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                <el-date-picker
                  v-else-if="param.type === 'datetime'"
                  v-model="batchParams[param.key]"
                  type="datetime"
                  :placeholder="param.placeholder"
                  style="width: 100%"
                />
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="confirmDialog.visible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="executeBatchAction"
          :loading="executing"
        >
          确认执行
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量操作进度对话框 -->
    <el-dialog
      v-model="progressDialog.visible"
      title="批量操作进度"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="progress-content">
        <div class="progress-header">
          <span>正在执行：{{ progressDialog.actionName }}</span>
          <span class="progress-text">{{ progressDialog.current }}/{{ progressDialog.total }}</span>
        </div>
        
        <el-progress 
          :percentage="progressDialog.percentage" 
          :status="progressDialog.status"
          :stroke-width="8"
        />
        
        <!-- 详细进度列表 -->
        <div class="progress-details" v-if="progressDialog.details.length > 0">
          <div class="detail-header">
            <span>操作详情</span>
            <el-button 
              text 
              type="primary" 
              @click="progressDialog.showDetails = !progressDialog.showDetails"
            >
              {{ progressDialog.showDetails ? '收起' : '展开' }}
            </el-button>
          </div>
          
          <div v-show="progressDialog.showDetails" class="detail-list">
            <div 
              v-for="(detail, index) in progressDialog.details" 
              :key="index"
              class="detail-item"
              :class="detail.status"
            >
              <el-icon>
                <Check v-if="detail.status === 'success'" />
                <Close v-else-if="detail.status === 'error'" />
                <Loading v-else />
              </el-icon>
              <span class="detail-text">{{ detail.text }}</span>
              <span v-if="detail.error" class="error-message">{{ detail.error }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button 
          v-if="progressDialog.status === 'success' || progressDialog.status === 'exception'"
          type="primary" 
          @click="closeProgressDialog"
        >
          完成
        </el-button>
        <el-button 
          v-else
          @click="cancelBatchOperation"
          :loading="cancelling"
        >
          取消操作
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Select, Warning, Check, Close, Loading,
  Delete, Edit, Send, Download, Refresh
} from '@element-plus/icons-vue'

export default {
  name: 'BatchOperations',
  components: {
    Select, Warning, Check, Close, Loading,
    Delete, Edit, Send, Download, Refresh
  },
  props: {
    // 选中的项目
    selectedItems: {
      type: Array,
      default: () => []
    },
    // 可用的批量操作
    actions: {
      type: Array,
      default: () => []
    },
    // 操作类型（用于区分不同模块的批量操作）
    operationType: {
      type: String,
      default: 'default'
    }
  },
  emits: ['batch-action', 'clear-selection', 'action-completed'],
  setup(props, { emit }) {
    const executing = ref(false)
    const cancelling = ref(false)
    const currentAction = ref(null)
    const batchParams = reactive({})

    // 确认对话框状态
    const confirmDialog = reactive({
      visible: false,
      title: '',
      message: '',
      extraParams: null
    })

    // 进度对话框状态
    const progressDialog = reactive({
      visible: false,
      actionName: '',
      current: 0,
      total: 0,
      percentage: 0,
      status: '',
      details: [],
      showDetails: false
    })

    // 可用操作（根据操作类型动态生成）
    const availableActions = computed(() => {
      const baseActions = props.actions
      
      // 根据操作类型添加默认操作
      const defaultActions = getDefaultActions(props.operationType)
      
      return [...baseActions, ...defaultActions]
    })

    // 获取默认操作
    function getDefaultActions(type) {
      const actions = {
        notifications: [
          {
            key: 'batchSend',
            label: '批量发送',
            icon: Send,
            type: 'primary',
            requiresConfirm: true,
            extraParams: [
              {
                key: 'sendTime',
                label: '发送时间',
                type: 'datetime',
                placeholder: '选择发送时间（留空立即发送）',
                required: false
              }
            ]
          },
          {
            key: 'batchDelete',
            label: '批量删除',
            icon: Delete,
            type: 'danger',
            requiresConfirm: true
          }
        ],
        feedback: [
          {
            key: 'batchReply',
            label: '批量回复',
            icon: Edit,
            type: 'primary',
            requiresConfirm: true,
            extraParams: [
              {
                key: 'replyContent',
                label: '回复内容',
                type: 'input',
                placeholder: '请输入回复内容',
                required: true
              },
              {
                key: 'status',
                label: '处理状态',
                type: 'select',
                placeholder: '选择处理状态',
                required: true,
                options: [
                  { label: '已回复', value: 'replied' },
                  { label: '已处理', value: 'resolved' },
                  { label: '已关闭', value: 'closed' }
                ]
              }
            ]
          },
          {
            key: 'batchUpdateStatus',
            label: '批量更新状态',
            icon: Refresh,
            type: 'warning',
            requiresConfirm: true,
            extraParams: [
              {
                key: 'status',
                label: '新状态',
                type: 'select',
                placeholder: '选择新状态',
                required: true,
                options: [
                  { label: '待处理', value: 'pending' },
                  { label: '处理中', value: 'processing' },
                  { label: '已回复', value: 'replied' },
                  { label: '已关闭', value: 'closed' }
                ]
              }
            ]
          }
        ],
        users: [
          {
            key: 'batchExport',
            label: '批量导出',
            icon: Download,
            type: 'primary',
            requiresConfirm: false
          },
          {
            key: 'batchUpdateStatus',
            label: '批量更新状态',
            icon: Refresh,
            type: 'warning',
            requiresConfirm: true
          }
        ]
      }
      
      return actions[type] || []
    }

    // 检查是否可以执行操作
    function canExecuteAction(action) {
      if (props.selectedItems.length === 0) return false
      
      // 可以添加更多的权限检查逻辑
      return true
    }

    // 处理批量操作
    function handleBatchAction(actionKey) {
      const action = availableActions.value.find(a => a.key === actionKey)
      if (!action) return

      currentAction.value = action

      if (action.requiresConfirm) {
        showConfirmDialog(action)
      } else {
        executeBatchAction()
      }
    }

    // 显示确认对话框
    function showConfirmDialog(action) {
      confirmDialog.title = `确认${action.label}`
      confirmDialog.message = `确定要对选中的项目执行"${action.label}"操作吗？`
      confirmDialog.extraParams = action.extraParams || null
      confirmDialog.visible = true

      // 重置参数
      Object.keys(batchParams).forEach(key => {
        delete batchParams[key]
      })
    }

    // 执行批量操作
    async function executeBatchAction() {
      if (!currentAction.value) return

      confirmDialog.visible = false
      executing.value = true

      try {
        // 显示进度对话框
        showProgressDialog(currentAction.value)

        // 执行批量操作
        await performBatchOperation(currentAction.value)

        ElMessage.success(`${currentAction.value.label}完成`)
        emit('action-completed', {
          action: currentAction.value.key,
          items: props.selectedItems,
          params: { ...batchParams }
        })

      } catch (error) {
        console.error('批量操作失败:', error)
        ElMessage.error(`${currentAction.value.label}失败: ${error.message}`)
        progressDialog.status = 'exception'
      } finally {
        executing.value = false
      }
    }

    // 显示进度对话框
    function showProgressDialog(action) {
      progressDialog.visible = true
      progressDialog.actionName = action.label
      progressDialog.current = 0
      progressDialog.total = props.selectedItems.length
      progressDialog.percentage = 0
      progressDialog.status = ''
      progressDialog.details = []
      progressDialog.showDetails = false
    }

    // 执行批量操作的具体逻辑
    async function performBatchOperation(action) {
      const total = props.selectedItems.length
      let completed = 0

      for (let i = 0; i < props.selectedItems.length; i++) {
        const item = props.selectedItems[i]
        
        try {
          // 添加进度详情
          progressDialog.details.push({
            text: `正在处理: ${item.name || item.title || `项目${i + 1}`}`,
            status: 'processing'
          })

          // 执行单个操作
          await emit('batch-action', {
            action: action.key,
            item: item,
            params: { ...batchParams }
          })

          // 更新成功状态
          progressDialog.details[i].status = 'success'
          progressDialog.details[i].text = `已完成: ${item.name || item.title || `项目${i + 1}`}`
          
          completed++
          
        } catch (error) {
          // 更新失败状态
          progressDialog.details[i].status = 'error'
          progressDialog.details[i].error = error.message
        }

        // 更新进度
        progressDialog.current = completed
        progressDialog.percentage = Math.round((completed / total) * 100)

        // 模拟操作延时
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      progressDialog.status = completed === total ? 'success' : 'exception'
    }

    // 取消批量操作
    function cancelBatchOperation() {
      cancelling.value = true
      // 这里可以添加取消操作的逻辑
      setTimeout(() => {
        progressDialog.visible = false
        cancelling.value = false
        ElMessage.info('操作已取消')
      }, 1000)
    }

    // 关闭进度对话框
    function closeProgressDialog() {
      progressDialog.visible = false
      currentAction.value = null
    }

    // 清空选择
    function clearSelection() {
      emit('clear-selection')
    }

    // 处理对话框关闭
    function handleDialogClose() {
      if (!executing.value) {
        confirmDialog.visible = false
      }
    }

    return {
      executing,
      cancelling,
      confirmDialog,
      progressDialog,
      batchParams,
      availableActions,
      canExecuteAction,
      handleBatchAction,
      executeBatchAction,
      cancelBatchOperation,
      closeProgressDialog,
      clearSelection,
      handleDialogClose
    }
  }
}
</script>

<style scoped>
.batch-operations {
  position: relative;
}

.batch-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 16px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.confirm-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.warning-icon {
  color: #e6a23c;
  font-size: 24px;
  margin-top: 2px;
}

.confirm-text {
  flex: 1;
}

.selected-count {
  color: #909399;
  font-size: 14px;
  margin-top: 8px;
}

.extra-params {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.progress-content {
  padding: 0 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-text {
  color: #909399;
  font-size: 14px;
}

.progress-details {
  margin-top: 24px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 12px;
}

.detail-list {
  max-height: 200px;
  overflow-y: auto;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f7fa;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item.success {
  color: #67c23a;
}

.detail-item.error {
  color: #f56c6c;
}

.detail-item.processing {
  color: #409eff;
}

.detail-text {
  flex: 1;
  font-size: 14px;
}

.error-message {
  color: #f56c6c;
  font-size: 12px;
  margin-left: auto;
}
</style>
