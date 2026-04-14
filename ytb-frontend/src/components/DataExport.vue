<template>
  <div class="data-export">
    <!-- 导出按钮 -->
    <el-button 
      type="primary" 
      icon="Download" 
      @click="showExportDialog"
      :loading="exporting"
    >
      导出数据
    </el-button>

    <!-- 导出配置对话框 -->
    <el-dialog
      v-model="exportDialog.visible"
      title="数据导出配置"
      width="600px"
      :before-close="handleDialogClose"
    >
      <el-form :model="exportConfig" label-width="120px" ref="exportFormRef">
        <!-- 导出类型 -->
        <el-form-item label="导出类型" required>
          <el-select 
            v-model="exportConfig.type" 
            placeholder="选择导出数据类型"
            @change="handleTypeChange"
            style="width: 100%"
          >
            <el-option
              v-for="type in exportTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>

        <!-- 导出格式 -->
        <el-form-item label="导出格式" required>
          <el-radio-group v-model="exportConfig.format">
            <el-radio label="xlsx">Excel (.xlsx)</el-radio>
            <el-radio label="csv">CSV (.csv)</el-radio>
            <el-radio label="json" v-if="exportConfig.type !== 'statistics'">JSON (.json)</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 文件名 -->
        <el-form-item label="文件名">
          <el-input 
            v-model="exportConfig.filename" 
            placeholder="自定义文件名（可选）"
          />
        </el-form-item>

        <!-- 数据筛选 -->
        <el-form-item label="数据筛选" v-if="showFilters">
          <el-card class="filter-card">
            <!-- 时间范围 -->
            <el-form-item label="时间范围" label-width="80px">
              <el-date-picker
                v-model="exportConfig.dateRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                style="width: 100%"
              />
            </el-form-item>

            <!-- 状态筛选 -->
            <el-form-item 
              label="状态筛选" 
              label-width="80px"
              v-if="exportConfig.type === 'feedback' || exportConfig.type === 'notifications'"
            >
              <el-select 
                v-model="exportConfig.statusFilter" 
                placeholder="选择状态"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="status in getStatusOptions()"
                  :key="status.value"
                  :label="status.label"
                  :value="status.value"
                />
              </el-select>
            </el-form-item>

            <!-- 用户角色筛选 -->
            <el-form-item 
              label="用户角色" 
              label-width="80px"
              v-if="exportConfig.type === 'users'"
            >
              <el-select 
                v-model="exportConfig.roleFilter" 
                placeholder="选择角色"
                clearable
                multiple
                style="width: 100%"
              >
                <el-option
                  v-for="role in userRoles"
                  :key="role.value"
                  :label="role.label"
                  :value="role.value"
                />
              </el-select>
            </el-form-item>
          </el-card>
        </el-form-item>

        <!-- 导出选项 -->
        <el-form-item label="导出选项">
          <el-checkbox-group v-model="exportConfig.options">
            <el-checkbox 
              label="includeImages" 
              v-if="exportConfig.type === 'feedback'"
            >
              包含图片信息
            </el-checkbox>
            <el-checkbox 
              label="includeStats" 
              v-if="exportConfig.type === 'notifications'"
            >
              包含统计信息
            </el-checkbox>
            <el-checkbox 
              label="includeCharts" 
              v-if="exportConfig.type === 'statistics' && exportConfig.format === 'xlsx'"
            >
              包含图表数据
            </el-checkbox>
            <el-checkbox label="compressFile">
              压缩文件
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <!-- 数据预览 -->
        <el-form-item label="数据预览" v-if="previewData.length > 0">
          <div class="preview-info">
            <span>预计导出 <strong>{{ previewData.length }}</strong> 条记录</span>
            <el-button text type="primary" @click="showPreview = !showPreview">
              {{ showPreview ? '收起预览' : '展开预览' }}
            </el-button>
          </div>
          
          <el-table 
            v-show="showPreview"
            :data="previewData.slice(0, 5)" 
            size="small"
            max-height="200"
            class="preview-table"
          >
            <el-table-column
              v-for="(column, index) in previewColumns"
              :key="index"
              :prop="column.key"
              :label="column.title"
              :width="column.width || 120"
              show-overflow-tooltip
            />
          </el-table>
          
          <div v-show="showPreview && previewData.length > 5" class="preview-more">
            还有 {{ previewData.length - 5 }} 条记录...
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <div class="export-tips">
            <el-icon><InfoFilled /></el-icon>
            <span>大量数据导出可能需要较长时间，请耐心等待</span>
          </div>
          <div class="dialog-buttons">
            <el-button @click="exportDialog.visible = false">取消</el-button>
            <el-button @click="previewExportData" :loading="previewing">预览数据</el-button>
            <el-button 
              type="primary" 
              @click="startExport"
              :loading="exporting"
              :disabled="!canExport"
            >
              开始导出
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 导出进度对话框 -->
    <el-dialog
      v-model="progressDialog.visible"
      title="数据导出进度"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="export-progress">
        <div class="progress-info">
          <div class="progress-text">
            <span>正在导出：{{ exportConfig.type | formatExportType }}</span>
            <span class="progress-count">{{ progressDialog.current }}/{{ progressDialog.total }}</span>
          </div>
          
          <el-progress 
            :percentage="progressDialog.percentage" 
            :status="progressDialog.status"
            :stroke-width="8"
          />
        </div>

        <div class="progress-details" v-if="progressDialog.details.length > 0">
          <div class="detail-item" v-for="(detail, index) in progressDialog.details" :key="index">
            <el-icon>
              <Check v-if="detail.status === 'success'" />
              <Loading v-else />
            </el-icon>
            <span>{{ detail.message }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button 
          v-if="progressDialog.status === 'success'"
          type="primary" 
          @click="closeProgressDialog"
        >
          完成
        </el-button>
        <el-button 
          v-else
          @click="cancelExport"
          :loading="cancelling"
        >
          取消导出
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, InfoFilled, Check, Loading } from '@element-plus/icons-vue'
import dataExportService from '../services/dataExportService'

export default {
  name: 'DataExport',
  components: {
    Download, InfoFilled, Check, Loading
  },
  props: {
    // 导出数据源
    dataSource: {
      type: String,
      required: true // 'users', 'feedback', 'notifications', 'statistics'
    },
    // 额外的导出选项
    extraOptions: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['export-started', 'export-completed', 'export-failed'],
  setup(props, { emit }) {
    const exportFormRef = ref(null)
    const exporting = ref(false)
    const previewing = ref(false)
    const cancelling = ref(false)
    const showPreview = ref(false)

    // 导出配置
    const exportConfig = reactive({
      type: props.dataSource,
      format: 'xlsx',
      filename: '',
      dateRange: null,
      statusFilter: null,
      roleFilter: [],
      options: []
    })

    // 导出对话框状态
    const exportDialog = reactive({
      visible: false
    })

    // 进度对话框状态
    const progressDialog = reactive({
      visible: false,
      current: 0,
      total: 0,
      percentage: 0,
      status: '',
      details: []
    })

    // 预览数据
    const previewData = ref([])
    const previewColumns = ref([])

    // 导出类型选项
    const exportTypes = [
      { value: 'users', label: '用户数据' },
      { value: 'feedback', label: '用户反馈' },
      { value: 'notifications', label: '通知记录' },
      { value: 'statistics', label: '统计报表' }
    ]

    // 用户角色选项
    const userRoles = [
      { value: 'admin', label: '管理员' },
      { value: 'user', label: '普通用户' },
      { value: 'vip', label: 'VIP用户' },
      { value: 'agent', label: '业务员' },
      { value: 'merchant', label: '商户' }
    ]

    // 是否显示筛选器
    const showFilters = computed(() => {
      return ['users', 'feedback', 'notifications'].includes(exportConfig.type)
    })

    // 是否可以导出
    const canExport = computed(() => {
      return exportConfig.type && exportConfig.format
    })

    // 获取状态选项
    function getStatusOptions() {
      const statusMap = {
        feedback: [
          { value: 'pending', label: '待处理' },
          { value: 'processing', label: '处理中' },
          { value: 'replied', label: '已回复' },
          { value: 'closed', label: '已关闭' }
        ],
        notifications: [
          { value: 'sent', label: '已发送' },
          { value: 'pending', label: '待发送' },
          { value: 'failed', label: '发送失败' },
          { value: 'cancelled', label: '已取消' }
        ]
      }
      return statusMap[exportConfig.type] || []
    }

    // 显示导出对话框
    function showExportDialog() {
      exportConfig.type = props.dataSource
      exportDialog.visible = true
      
      // 重置配置
      exportConfig.filename = ''
      exportConfig.dateRange = null
      exportConfig.statusFilter = null
      exportConfig.roleFilter = []
      exportConfig.options = []
      previewData.value = []
      previewColumns.value = []
      showPreview.value = false
    }

    // 处理类型变化
    function handleTypeChange() {
      // 重置相关配置
      exportConfig.statusFilter = null
      exportConfig.roleFilter = []
      previewData.value = []
      previewColumns.value = []
      showPreview.value = false
    }

    // 预览导出数据
    async function previewExportData() {
      previewing.value = true
      
      try {
        // 模拟获取预览数据
        const mockData = await getMockPreviewData()
        previewData.value = mockData.data
        previewColumns.value = mockData.columns
        
        ElMessage.success('数据预览加载完成')
      } catch (error) {
        console.error('预览数据失败:', error)
        ElMessage.error('预览数据失败')
      } finally {
        previewing.value = false
      }
    }

    // 获取模拟预览数据
    async function getMockPreviewData() {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockDataMap = {
        users: {
          data: [
            { id: 1, name: '张三', phone: '13800138001', role: 'user', status: 'active', created_at: '2025-01-01 10:00:00' },
            { id: 2, name: '李四', phone: '13800138002', role: 'vip', status: 'active', created_at: '2025-01-02 11:00:00' },
            { id: 3, name: '王五', phone: '13800138003', role: 'agent', status: 'active', created_at: '2025-01-03 12:00:00' }
          ],
          columns: [
            { key: 'id', title: 'ID', width: 80 },
            { key: 'name', title: '姓名', width: 100 },
            { key: 'phone', title: '手机号', width: 120 },
            { key: 'role', title: '角色', width: 100 },
            { key: 'status', title: '状态', width: 100 },
            { key: 'created_at', title: '注册时间', width: 160 }
          ]
        },
        feedback: {
          data: [
            { id: 1, user_name: '张三', type: 'bug', title: '页面加载慢', priority: 'high', status: 'pending', created_at: '2025-01-01 10:00:00' },
            { id: 2, user_name: '李四', type: 'suggestion', title: '增加夜间模式', priority: 'medium', status: 'replied', created_at: '2025-01-02 11:00:00' }
          ],
          columns: [
            { key: 'id', title: 'ID', width: 80 },
            { key: 'user_name', title: '用户', width: 100 },
            { key: 'type', title: '类型', width: 100 },
            { key: 'title', title: '标题', width: 150 },
            { key: 'priority', title: '优先级', width: 100 },
            { key: 'status', title: '状态', width: 100 }
          ]
        },
        notifications: {
          data: [
            { id: 1, type: 'system', title: '系统维护通知', target_users: 'all', status: 'sent', read_rate: 0.75, sent_at: '2025-01-01 10:00:00' },
            { id: 2, type: 'activity', title: '新年活动', target_users: 'vip', status: 'pending', read_rate: null, sent_at: null }
          ],
          columns: [
            { key: 'id', title: 'ID', width: 80 },
            { key: 'type', title: '类型', width: 100 },
            { key: 'title', title: '标题', width: 150 },
            { key: 'target_users', title: '目标用户', width: 100 },
            { key: 'status', title: '状态', width: 100 },
            { key: 'read_rate', title: '阅读率', width: 100 }
          ]
        },
        statistics: {
          data: [
            { date: '2025-01-01', new_users: 120, revenue: 15600, orders: 89 },
            { date: '2025-01-02', new_users: 98, revenue: 12400, orders: 76 },
            { date: '2025-01-03', new_users: 156, revenue: 18900, orders: 102 }
          ],
          columns: [
            { key: 'date', title: '日期', width: 120 },
            { key: 'new_users', title: '新增用户', width: 100 },
            { key: 'revenue', title: '收入', width: 100 },
            { key: 'orders', title: '订单数', width: 100 }
          ]
        }
      }
      
      return mockDataMap[exportConfig.type] || { data: [], columns: [] }
    }

    // 开始导出
    async function startExport() {
      try {
        // 验证配置
        if (!canExport.value) {
          ElMessage.error('请完善导出配置')
          return
        }

        exporting.value = true
        exportDialog.visible = false
        
        // 显示进度对话框
        showProgressDialog()
        
        emit('export-started', { ...exportConfig })

        // 执行导出
        const result = await performExport()
        
        progressDialog.status = 'success'
        ElMessage.success('数据导出完成')
        
        emit('export-completed', result)

      } catch (error) {
        console.error('导出失败:', error)
        progressDialog.status = 'exception'
        ElMessage.error(`导出失败: ${error.message}`)
        
        emit('export-failed', error)
      } finally {
        exporting.value = false
      }
    }

    // 显示进度对话框
    function showProgressDialog() {
      progressDialog.visible = true
      progressDialog.current = 0
      progressDialog.total = 100
      progressDialog.percentage = 0
      progressDialog.status = ''
      progressDialog.details = []
    }

    // 执行导出
    async function performExport() {
      const steps = [
        { message: '正在获取数据...', duration: 1000 },
        { message: '正在处理数据...', duration: 1500 },
        { message: '正在生成文件...', duration: 2000 },
        { message: '正在压缩文件...', duration: 1000 },
        { message: '导出完成', duration: 500 }
      ]

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        
        progressDialog.details.push({
          status: 'success',
          message: step.message
        })
        
        progressDialog.current = i + 1
        progressDialog.percentage = Math.round(((i + 1) / steps.length) * 100)
        
        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, step.duration))
      }

      // 实际导出逻辑
      const exportOptions = {
        format: exportConfig.format,
        filename: exportConfig.filename || getDefaultFilename(),
        dateRange: exportConfig.dateRange,
        statusFilter: exportConfig.statusFilter,
        roleFilter: exportConfig.roleFilter,
        ...Object.fromEntries(exportConfig.options.map(opt => [opt, true]))
      }

      // 根据类型调用相应的导出方法
      switch (exportConfig.type) {
        case 'users':
          return await dataExportService.exportUsers(previewData.value, exportOptions)
        case 'feedback':
          return await dataExportService.exportFeedback(previewData.value, exportOptions)
        case 'notifications':
          return await dataExportService.exportNotifications(previewData.value, exportOptions)
        case 'statistics':
          return await dataExportService.exportStatistics(previewData.value, exportOptions)
        default:
          throw new Error(`不支持的导出类型: ${exportConfig.type}`)
      }
    }

    // 获取默认文件名
    function getDefaultFilename() {
      const typeMap = {
        users: '用户数据',
        feedback: '用户反馈',
        notifications: '通知记录',
        statistics: '统计报表'
      }
      return typeMap[exportConfig.type] || '导出数据'
    }

    // 取消导出
    function cancelExport() {
      cancelling.value = true
      
      setTimeout(() => {
        progressDialog.visible = false
        cancelling.value = false
        exporting.value = false
        ElMessage.info('导出已取消')
      }, 1000)
    }

    // 关闭进度对话框
    function closeProgressDialog() {
      progressDialog.visible = false
    }

    // 处理对话框关闭
    function handleDialogClose() {
      if (!exporting.value) {
        exportDialog.visible = false
      }
    }

    // 监听数据源变化
    watch(() => props.dataSource, (newValue) => {
      exportConfig.type = newValue
    })

    return {
      exportFormRef,
      exporting,
      previewing,
      cancelling,
      showPreview,
      exportConfig,
      exportDialog,
      progressDialog,
      previewData,
      previewColumns,
      exportTypes,
      userRoles,
      showFilters,
      canExport,
      getStatusOptions,
      showExportDialog,
      handleTypeChange,
      previewExportData,
      startExport,
      cancelExport,
      closeProgressDialog,
      handleDialogClose
    }
  },
  filters: {
    formatExportType(type) {
      const typeMap = {
        users: '用户数据',
        feedback: '用户反馈',
        notifications: '通知记录',
        statistics: '统计报表'
      }
      return typeMap[type] || type
    }
  }
}
</script>

<style scoped>
.data-export {
  display: inline-block;
}

.filter-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.filter-card :deep(.el-card__body) {
  padding: 16px;
}

.preview-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 4px;
}

.preview-table {
  margin-top: 12px;
}

.preview-more {
  text-align: center;
  padding: 8px;
  color: #909399;
  font-size: 14px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-top: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.export-tips {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  font-size: 14px;
}

.dialog-buttons {
  display: flex;
  gap: 8px;
}

.export-progress {
  padding: 0 8px;
}

.progress-info {
  margin-bottom: 24px;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-count {
  color: #909399;
  font-size: 14px;
}

.progress-details {
  max-height: 200px;
  overflow-y: auto;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f7fa;
  font-size: 14px;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item .el-icon {
  color: #67c23a;
}
</style>
