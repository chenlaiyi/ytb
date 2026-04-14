<template>
  <div class="wechat-replies-page">
    <!-- 操作栏 -->
    <el-card shadow="never" class="action-card">
      <div class="action-bar">
        <el-button type="primary" @click="addReply">
          <el-icon><Plus /></el-icon>
          添加回复规则
        </el-button>
      </div>
    </el-card>

    <!-- 回复类型标签页 -->
    <el-card shadow="never" class="content-card">
      <el-tabs v-model="activeTab" @tab-change="loadReplies">
        <el-tab-pane label="关注回复" name="subscribe">
          <div class="tab-description">
            <el-alert 
              title="用户关注公众号时自动发送的消息" 
              type="info" 
              :closable="false"
              show-icon
            />
          </div>
        </el-tab-pane>
        <el-tab-pane label="关键词回复" name="keyword">
          <div class="tab-description">
            <el-alert 
              title="用户发送特定关键词时自动回复的消息" 
              type="info" 
              :closable="false"
              show-icon
            />
          </div>
        </el-tab-pane>
        <el-tab-pane label="默认回复" name="default">
          <div class="tab-description">
            <el-alert 
              title="用户发送的消息没有匹配到任何关键词时的回复" 
              type="info" 
              :closable="false"
              show-icon
            />
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 回复列表 -->
      <el-table v-loading="loading" :data="replyList" style="width: 100%">
        <el-table-column label="关键词" width="200" v-if="activeTab === 'keyword'">
          <template #default="{ row }">
            <div class="keyword-info">
              <span class="keyword">{{ row.keyword }}</span>
              <el-tag size="small" type="info">{{ getMatchTypeText(row.match_type) }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="回复类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ getReplyTypeText(row.reply_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="回复内容" min-width="300">
          <template #default="{ row }">
            <div class="reply-content">
              <template v-if="row.reply_type === 'text'">
                {{ row.content }}
              </template>
              <template v-else-if="row.reply_type === 'image'">
                <el-image 
                  v-if="row.media_id" 
                  :src="row.media_id" 
                  style="width: 60px; height: 60px;"
                  fit="cover"
                />
                <span v-else class="text-gray">图片素材</span>
              </template>
              <template v-else>
                <span class="text-gray">{{ getReplyTypeText(row.reply_type) }}消息</span>
              </template>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch 
              v-model="row.is_enabled" 
              @change="toggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editReply(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteReply(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="replyList.length === 0 && !loading" class="empty-list">
        <el-empty :description="getEmptyText()">
          <el-button type="primary" @click="addReply">添加回复规则</el-button>
        </el-empty>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.total > pagination.per_page" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.per_page"
          :total="pagination.total"
          layout="total, prev, pager, next"
          @current-change="loadReplies"
        />
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑回复规则' : '添加回复规则'"
      width="600px"
    >
      <el-form :model="replyForm" :rules="replyRules" ref="replyFormRef" label-width="100px">
        <el-form-item label="回复类型" prop="type" v-if="!isEdit">
          <el-select v-model="replyForm.type" placeholder="请选择回复类型" style="width: 100%;">
            <el-option label="关注回复" value="subscribe" />
            <el-option label="关键词回复" value="keyword" />
            <el-option label="默认回复" value="default" />
          </el-select>
        </el-form-item>

        <el-form-item label="关键词" prop="keyword" v-if="replyForm.type === 'keyword'">
          <el-input v-model="replyForm.keyword" placeholder="请输入关键词" />
        </el-form-item>

        <el-form-item label="匹配方式" v-if="replyForm.type === 'keyword'">
          <el-radio-group v-model="replyForm.match_type">
            <el-radio value="full">全匹配</el-radio>
            <el-radio value="partial">半匹配</el-radio>
            <el-radio value="regex">正则匹配</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="消息类型" prop="reply_type">
          <el-select v-model="replyForm.reply_type" placeholder="请选择消息类型" style="width: 100%;">
            <el-option label="文本" value="text" />
            <el-option label="图片" value="image" />
            <el-option label="语音" value="voice" />
            <el-option label="视频" value="video" />
            <el-option label="图文" value="news" />
          </el-select>
        </el-form-item>

        <el-form-item label="回复内容" prop="content" v-if="replyForm.reply_type === 'text'">
          <el-input 
            v-model="replyForm.content" 
            type="textarea" 
            :rows="4"
            placeholder="请输入回复内容"
            maxlength="600"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="素材ID" v-if="['image', 'voice', 'video'].includes(replyForm.reply_type)">
          <el-input v-model="replyForm.media_id" placeholder="请输入素材media_id" />
          <div class="form-tip">请先在微信公众平台上传素材获取media_id</div>
        </el-form-item>

        <el-form-item label="排序优先级">
          <el-input-number v-model="replyForm.sort_order" :min="0" :max="100" />
          <div class="form-tip">数值越大优先级越高</div>
        </el-form-item>

        <el-form-item label="启用状态">
          <el-switch v-model="replyForm.is_enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveReply" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as wechatApi from '@/api/v1/wechat'

// 状态
const loading = ref(false)
const saving = ref(false)
const activeTab = ref('subscribe')
const replyList = ref([])

// 分页
const pagination = reactive({
  page: 1,
  per_page: 20,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const replyFormRef = ref()
const replyForm = reactive({
  id: null,
  type: 'subscribe',
  keyword: '',
  match_type: 'full',
  reply_type: 'text',
  content: '',
  media_id: '',
  sort_order: 0,
  is_enabled: true
})

const replyRules = {
  type: [{ required: true, message: '请选择回复类型', trigger: 'change' }],
  reply_type: [{ required: true, message: '请选择消息类型', trigger: 'change' }],
  keyword: [{ required: true, message: '请输入关键词', trigger: 'blur' }],
  content: [{ required: true, message: '请输入回复内容', trigger: 'blur' }]
}

// 生命周期
onMounted(() => {
  loadReplies()
})

// 方法
const loadReplies = async () => {
  loading.value = true
  try {
    const params = {
      type: activeTab.value,
      page: pagination.page,
      per_page: pagination.per_page
    }
    const res = await wechatApi.getReplyList(params)
    if (res.code === 0) {
      replyList.value = res.data.data || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载回复列表失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const getMatchTypeText = (type) => {
  const map = { full: '全匹配', partial: '半匹配', regex: '正则' }
  return map[type] || type
}

const getReplyTypeText = (type) => {
  const map = { text: '文本', image: '图片', voice: '语音', video: '视频', news: '图文' }
  return map[type] || type
}

const getEmptyText = () => {
  const map = {
    subscribe: '暂无关注回复规则',
    keyword: '暂无关键词回复规则',
    default: '暂无默认回复规则'
  }
  return map[activeTab.value]
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const addReply = () => {
  isEdit.value = false
  Object.assign(replyForm, {
    id: null,
    type: activeTab.value,
    keyword: '',
    match_type: 'full',
    reply_type: 'text',
    content: '',
    media_id: '',
    sort_order: 0,
    is_enabled: true
  })
  dialogVisible.value = true
}

const editReply = (reply) => {
  isEdit.value = true
  Object.assign(replyForm, {
    id: reply.id,
    type: reply.type,
    keyword: reply.keyword || '',
    match_type: reply.match_type || 'full',
    reply_type: reply.reply_type,
    content: reply.content || '',
    media_id: reply.media_id || '',
    sort_order: reply.sort_order || 0,
    is_enabled: reply.is_enabled
  })
  dialogVisible.value = true
}

const saveReply = async () => {
  try {
    await replyFormRef.value?.validate()
    saving.value = true

    let res
    if (isEdit.value) {
      res = await wechatApi.updateReply(replyForm.id, replyForm)
    } else {
      res = await wechatApi.createReply(replyForm)
    }

    if (res.code === 0) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      loadReplies()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

const deleteReply = async (reply) => {
  try {
    await ElMessageBox.confirm('确定要删除这条回复规则吗？', '确认删除', { type: 'warning' })

    const res = await wechatApi.deleteReply(reply.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      loadReplies()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const toggleStatus = async (reply) => {
  try {
    const res = await wechatApi.toggleReplyStatus(reply.id)
    if (res.code === 0) {
      ElMessage.success(res.message)
    } else {
      reply.is_enabled = !reply.is_enabled
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    reply.is_enabled = !reply.is_enabled
    console.error('切换状态失败:', error)
    ElMessage.error('操作失败')
  }
}
</script>

<style scoped>
.wechat-replies-page {
  padding: 0;
}

.action-card {
  margin-bottom: 20px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-card {
  min-height: 400px;
}

.tab-description {
  margin-bottom: 20px;
}

.keyword-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.keyword {
  font-weight: 500;
  color: #303133;
}

.reply-content {
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-gray {
  color: #909399;
}

.empty-list {
  padding: 60px 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
