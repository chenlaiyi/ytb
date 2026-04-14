<template>
  <div class="user-feedback">
    <div class="management-header">
      <h3>用户反馈</h3>
      <div class="header-actions">
        <el-button type="primary" icon="Plus" @click="showReplyDialog">批量回复</el-button>
        <el-button icon="Download" @click="exportFeedback">导出反馈</el-button>
        <el-button icon="Refresh" @click="refreshData" :loading="refreshing">刷新</el-button>
      </div>
    </div>

    <!-- 反馈统计 -->
    <el-row :gutter="20" class="mb-6">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon total">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">总反馈</div>
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
              <div class="stat-label">待处理</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon replied">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.replied }}</div>
              <div class="stat-label">已回复</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon satisfaction">
              <el-icon><Star /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.satisfaction }}%</div>
              <div class="stat-label">满意度</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选和搜索 -->
    <el-card class="filter-card mb-4">
      <el-form :model="filterForm" :inline="true">
        <el-form-item label="反馈类型">
          <el-select v-model="filterForm.type" placeholder="选择类型" clearable>
            <el-option label="功能建议" value="suggestion" />
            <el-option label="问题反馈" value="bug" />
            <el-option label="投诉" value="complaint" />
            <el-option label="表扬" value="praise" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select v-model="filterForm.status" placeholder="选择状态" clearable>
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已回复" value="replied" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="filterForm.priority" placeholder="选择优先级" clearable>
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="提交时间">
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
            placeholder="搜索用户或内容"
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

    <!-- 反馈列表 -->
    <el-card class="feedback-list">
      <el-table :data="feedbackList" v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="feedback-detail">
              <div class="detail-section">
                <h4>反馈详情</h4>
                <p>{{ row.content }}</p>
                <div class="feedback-images" v-if="row.images && row.images.length > 0">
                  <el-image
                    v-for="(image, index) in row.images"
                    :key="index"
                    :src="image"
                    :preview-src-list="row.images"
                    class="feedback-image"
                    fit="cover"
                  />
                </div>
              </div>
              <div class="detail-section" v-if="row.reply">
                <h4>回复内容</h4>
                <p>{{ row.reply }}</p>
                <div class="reply-info">
                  <span>回复人：{{ row.replyUser }}</span>
                  <span>回复时间：{{ row.replyTime }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="反馈类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="user" label="用户" width="120" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityTagType(row.priority)" size="small">
              {{ getPriorityText(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="满意度" width="100">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled size="small" v-if="row.rating > 0" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewFeedback(row)">查看</el-button>
            <el-button size="small" type="primary" @click="replyFeedback(row)" 
                      v-if="row.status === 'pending' || row.status === 'processing'">回复</el-button>
            <el-button size="small" type="success" @click="closeFeedback(row)" 
                      v-if="row.status === 'replied'">关闭</el-button>
            <el-dropdown>
              <el-button size="small" type="info">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="setPriority(row, 'high')">设为高优先级</el-dropdown-item>
                  <el-dropdown-item @click="setPriority(row, 'medium')">设为中优先级</el-dropdown-item>
                  <el-dropdown-item @click="setPriority(row, 'low')">设为低优先级</el-dropdown-item>
                  <el-dropdown-item divided @click="deleteFeedback(row)">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作 -->
      <div class="batch-actions" v-if="selectedFeedback.length > 0">
        <span>已选择 {{ selectedFeedback.length }} 条反馈</span>
        <div>
          <el-button type="primary" size="small" @click="batchReply">批量回复</el-button>
          <el-button type="success" size="small" @click="batchClose">批量关闭</el-button>
          <el-button type="danger" size="small" @click="batchDelete">批量删除</el-button>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalFeedback"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 回复对话框 -->
    <el-dialog v-model="replyDialogVisible" title="回复反馈" width="600px">
      <div class="reply-form">
        <div class="original-feedback" v-if="currentFeedback">
          <h4>原反馈内容</h4>
          <p><strong>用户：</strong>{{ currentFeedback.user }}</p>
          <p><strong>标题：</strong>{{ currentFeedback.title }}</p>
          <p><strong>内容：</strong>{{ currentFeedback.content }}</p>
        </div>
        <el-form :model="replyForm" :rules="replyRules" ref="replyFormRef" label-width="80px">
          <el-form-item label="回复内容" prop="content">
            <el-input v-model="replyForm.content" type="textarea" :rows="6" 
                     placeholder="请输入回复内容" maxlength="1000" show-word-limit />
          </el-form-item>
          <el-form-item label="处理状态" prop="status">
            <el-radio-group v-model="replyForm.status">
              <el-radio label="replied">已回复</el-radio>
              <el-radio label="closed">已关闭</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="replyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitReply" :loading="replyLoading">提交回复</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotRound, Clock, Check, Star } from '@element-plus/icons-vue'

export default {
  name: 'UserFeedback',
  components: {
    ChatDotRound,
    Clock,
    Check,
    Star
  },
  setup() {
    const loading = ref(false)
    const refreshing = ref(false)
    const replyLoading = ref(false)
    const replyDialogVisible = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(10)
    const totalFeedback = ref(0)
    const selectedFeedback = ref([])
    const currentFeedback = ref(null)

    // 统计数据
    const stats = reactive({
      total: 1256,
      pending: 89,
      replied: 1067,
      satisfaction: 92
    })

    // 筛选表单
    const filterForm = reactive({
      type: '',
      status: '',
      priority: '',
      dateRange: [],
      keyword: ''
    })

    // 反馈数据
    const feedbackList = ref([
      {
        id: 1,
        type: 'bug',
        user: '张三',
        userId: 'user001',
        title: '商品页面加载缓慢',
        content: '在浏览商品详情页时，页面加载速度很慢，影响购物体验。希望能够优化一下。',
        images: ['/images/feedback1.jpg'],
        priority: 'high',
        status: 'pending',
        rating: 0,
        submitTime: '2025-01-15 14:30:00',
        reply: '',
        replyUser: '',
        replyTime: ''
      },
      {
        id: 2,
        type: 'suggestion',
        user: '李四',
        userId: 'user002',
        title: '建议增加夜间模式',
        content: '希望APP能够增加夜间模式，这样在晚上使用时眼睛会更舒服一些。',
        images: [],
        priority: 'medium',
        status: 'replied',
        rating: 5,
        submitTime: '2025-01-14 20:15:00',
        reply: '感谢您的建议，我们已经将夜间模式功能加入开发计划，预计下个版本会上线。',
        replyUser: '客服小王',
        replyTime: '2025-01-15 09:30:00'
      },
      {
        id: 3,
        type: 'praise',
        user: '王五',
        userId: 'user003',
        title: '界面设计很棒',
        content: 'APP的界面设计非常美观，操作也很流畅，给你们点赞！',
        images: [],
        priority: 'low',
        status: 'replied',
        rating: 5,
        submitTime: '2025-01-13 16:45:00',
        reply: '谢谢您的认可和支持，我们会继续努力提供更好的服务！',
        replyUser: '客服小李',
        replyTime: '2025-01-14 10:20:00'
      }
    ])

    // 回复表单
    const replyForm = reactive({
      content: '',
      status: 'replied'
    })

    // 表单验证规则
    const replyRules = {
      content: [{ required: true, message: '请输入回复内容', trigger: 'blur' }],
      status: [{ required: true, message: '请选择处理状态', trigger: 'change' }]
    }

    const replyFormRef = ref()

    // 方法
    const getTypeTagType = (type) => {
      const types = {
        suggestion: 'primary',
        bug: 'danger',
        complaint: 'warning',
        praise: 'success',
        other: 'info'
      }
      return types[type] || 'info'
    }

    const getTypeText = (type) => {
      const texts = {
        suggestion: '功能建议',
        bug: '问题反馈',
        complaint: '投诉',
        praise: '表扬',
        other: '其他'
      }
      return texts[type] || type
    }

    const getPriorityTagType = (priority) => {
      const types = {
        high: 'danger',
        medium: 'warning',
        low: 'success'
      }
      return types[priority] || 'info'
    }

    const getPriorityText = (priority) => {
      const texts = {
        high: '高',
        medium: '中',
        low: '低'
      }
      return texts[priority] || priority
    }

    const getStatusTagType = (status) => {
      const types = {
        pending: 'warning',
        processing: 'primary',
        replied: 'success',
        closed: 'info'
      }
      return types[status] || 'info'
    }

    const getStatusText = (status) => {
      const texts = {
        pending: '待处理',
        processing: '处理中',
        replied: '已回复',
        closed: '已关闭'
      }
      return texts[status] || status
    }

    const refreshData = async () => {
      refreshing.value = true
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        ElMessage.success('数据刷新成功')
      } catch (error) {
        ElMessage.error('数据刷新失败')
      } finally {
        refreshing.value = false
      }
    }

    const handleFilter = () => {
      currentPage.value = 1
      ElMessage.success('筛选完成')
    }

    const resetFilter = () => {
      filterForm.type = ''
      filterForm.status = ''
      filterForm.priority = ''
      filterForm.dateRange = []
      filterForm.keyword = ''
      handleFilter()
    }

    const handleSelectionChange = (selection) => {
      selectedFeedback.value = selection
    }

    const viewFeedback = (feedback) => {
      ElMessage.info(`查看反馈：${feedback.title}`)
    }

    const replyFeedback = (feedback) => {
      currentFeedback.value = feedback
      replyForm.content = ''
      replyForm.status = 'replied'
      replyDialogVisible.value = true
    }

    const closeFeedback = (feedback) => {
      ElMessageBox.confirm(
        `确认要关闭反馈"${feedback.title}"吗？`,
        '确认关闭',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        feedback.status = 'closed'
        ElMessage.success('反馈已关闭')
      }).catch(() => {
        ElMessage.info('已取消关闭')
      })
    }

    const setPriority = (feedback, priority) => {
      feedback.priority = priority
      ElMessage.success(`优先级已设置为${getPriorityText(priority)}`)
    }

    const deleteFeedback = (feedback) => {
      ElMessageBox.confirm(
        `确认要删除反馈"${feedback.title}"吗？`,
        '确认删除',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        const index = feedbackList.value.findIndex(item => item.id === feedback.id)
        if (index > -1) {
          feedbackList.value.splice(index, 1)
          ElMessage.success('删除成功')
        }
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }

    const submitReply = async () => {
      if (!replyFormRef.value) return
      
      try {
        await replyFormRef.value.validate()
        replyLoading.value = true
        
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        if (currentFeedback.value) {
          currentFeedback.value.reply = replyForm.content
          currentFeedback.value.status = replyForm.status
          currentFeedback.value.replyUser = '管理员'
          currentFeedback.value.replyTime = new Date().toLocaleString()
        }
        
        ElMessage.success('回复提交成功')
        replyDialogVisible.value = false
      } catch (error) {
        console.error('回复提交失败:', error)
      } finally {
        replyLoading.value = false
      }
    }

    const batchReply = () => {
      ElMessage.info('批量回复功能')
    }

    const batchClose = () => {
      ElMessageBox.confirm(
        `确认要关闭选中的 ${selectedFeedback.value.length} 条反馈吗？`,
        '批量关闭',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        selectedFeedback.value.forEach(feedback => {
          feedback.status = 'closed'
        })
        ElMessage.success('批量关闭成功')
        selectedFeedback.value = []
      }).catch(() => {
        ElMessage.info('已取消关闭')
      })
    }

    const batchDelete = () => {
      ElMessageBox.confirm(
        `确认要删除选中的 ${selectedFeedback.value.length} 条反馈吗？`,
        '批量删除',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        selectedFeedback.value.forEach(feedback => {
          const index = feedbackList.value.findIndex(item => item.id === feedback.id)
          if (index > -1) {
            feedbackList.value.splice(index, 1)
          }
        })
        ElMessage.success('批量删除成功')
        selectedFeedback.value = []
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }

    const exportFeedback = () => {
      ElMessage.success('反馈数据导出中...')
    }

    const showReplyDialog = () => {
      if (selectedFeedback.value.length === 0) {
        ElMessage.warning('请先选择要回复的反馈')
        return
      }
      ElMessage.info('批量回复功能')
    }

    const handleSizeChange = (val) => {
      pageSize.value = val
      currentPage.value = 1
    }

    const handleCurrentChange = (val) => {
      currentPage.value = val
    }

    onMounted(() => {
      totalFeedback.value = feedbackList.value.length
    })

    return {
      loading,
      refreshing,
      replyLoading,
      replyDialogVisible,
      currentPage,
      pageSize,
      totalFeedback,
      selectedFeedback,
      currentFeedback,
      stats,
      filterForm,
      feedbackList,
      replyForm,
      replyRules,
      replyFormRef,
      getTypeTagType,
      getTypeText,
      getPriorityTagType,
      getPriorityText,
      getStatusTagType,
      getStatusText,
      refreshData,
      handleFilter,
      resetFilter,
      handleSelectionChange,
      viewFeedback,
      replyFeedback,
      closeFeedback,
      setPriority,
      deleteFeedback,
      submitReply,
      batchReply,
      batchClose,
      batchDelete,
      exportFeedback,
      showReplyDialog,
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

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.replied {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.satisfaction {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
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

.feedback-list {
  margin-top: 16px;
}

.feedback-detail {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 10px 0;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 16px;
}

.detail-section p {
  margin: 0 0 10px 0;
  color: #606266;
  line-height: 1.6;
}

.feedback-images {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.feedback-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
}

.reply-info {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
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

.reply-form {
  max-height: 400px;
  overflow-y: auto;
}

.original-feedback {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.original-feedback h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.original-feedback p {
  margin: 8px 0;
  color: #606266;
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
