<template>
  <div class="branch-feedback-container">
    <van-nav-bar
      title="意见反馈"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />
    
    <div class="feedback-content">
      <!-- 反馈表单 -->
      <div class="feedback-form-section">
        <div class="section-header">
          <h3>提交反馈</h3>
          <p class="section-desc">您的意见对我们很重要，我们会认真处理每一条反馈</p>
        </div>
        
        <div class="form-container">
          <van-form @submit="handleSubmit">
            <!-- 反馈类型 -->
            <van-field
              v-model="feedbackForm.type"
              is-link
              readonly
              label="反馈类型"
              placeholder="请选择反馈类型"
              @click="showTypePicker = true"
              required
            />
            
            <!-- 反馈标题 -->
            <van-field
              v-model="feedbackForm.title"
              label="反馈标题"
              placeholder="请简要描述问题"
              maxlength="50"
              show-word-limit
              required
            />
            
            <!-- 反馈内容 -->
            <van-field
              v-model="feedbackForm.content"
              type="textarea"
              label="详细描述"
              placeholder="请详细描述您遇到的问题或建议"
              rows="4"
              maxlength="500"
              show-word-limit
              required
            />
            
            <!-- 联系方式 -->
            <van-field
              v-model="feedbackForm.contact"
              label="联系方式"
              placeholder="手机号或邮箱（可选）"
              maxlength="50"
            />
            
            <!-- 上传图片 -->
            <van-field label="相关图片">
              <template #input>
                <van-uploader
                  v-model="feedbackForm.images"
                  multiple
                  :max-count="3"
                  :after-read="afterRead"
                  :before-delete="beforeDelete"
                >
                  <van-icon name="photograph" size="24" />
                </van-uploader>
              </template>
            </van-field>
            
            <div class="submit-section">
              <van-button
                type="primary"
                native-type="submit"
                block
                :loading="submitting"
                :disabled="!isFormValid"
              >
                提交反馈
              </van-button>
            </div>
          </van-form>
        </div>
      </div>

      <!-- 历史反馈 -->
      <div class="history-section">
        <div class="section-header">
          <h3>我的反馈</h3>
          <span class="view-all" @click="toggleHistoryView">查看全部</span>
        </div>
        
        <div class="feedback-list" v-if="feedbackHistory.length > 0">
          <div 
            v-for="item in displayHistory" 
            :key="item.id"
            class="feedback-item"
            @click="showFeedbackDetail(item)"
          >
            <div class="feedback-header">
              <div class="feedback-type" :class="getTypeClass(item.type)">
                {{ item.type }}
              </div>
              <div class="feedback-status" :class="getStatusClass(item.status)">
                {{ getStatusText(item.status) }}
              </div>
            </div>
            <div class="feedback-title">{{ item.title }}</div>
            <div class="feedback-content">{{ item.content }}</div>
            <div class="feedback-footer">
              <span class="feedback-time">{{ formatTime(item.created_at) }}</span>
              <van-icon name="arrow" class="feedback-arrow" />
            </div>
          </div>
        </div>
        
        <div v-else class="empty-history">
          <van-empty description="暂无反馈记录" />
        </div>
      </div>

      <!-- 常见问题 -->
      <div class="faq-section">
        <div class="section-header">
          <h3>常见问题</h3>
          <span class="view-all" @click="$router.push('/branch/help')">查看更多</span>
        </div>
        
        <div class="faq-list">
          <div 
            v-for="faq in commonFAQs" 
            :key="faq.id"
            class="faq-item"
            @click="showFAQDetail(faq)"
          >
            <div class="faq-question">{{ faq.question }}</div>
            <div class="faq-answer">{{ faq.answer }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 反馈类型选择器 -->
    <van-popup v-model:show="showTypePicker" position="bottom" round>
      <van-picker
        :columns="feedbackTypes"
        @confirm="onTypeConfirm"
        @cancel="showTypePicker = false"
      />
    </van-popup>

    <!-- 反馈详情弹窗 -->
    <van-popup v-model:show="showDetailPopup" position="bottom" round>
      <div class="detail-popup">
        <div class="detail-header">
          <h3>反馈详情</h3>
          <van-icon name="cross" @click="showDetailPopup = false" />
        </div>
        <div class="detail-content">
          <div class="detail-item">
            <span class="detail-label">反馈类型：</span>
            <span class="detail-value">{{ currentFeedback.type }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">反馈标题：</span>
            <span class="detail-value">{{ currentFeedback.title }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">详细描述：</span>
            <span class="detail-value">{{ currentFeedback.content }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">提交时间：</span>
            <span class="detail-value">{{ formatTime(currentFeedback.created_at) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">处理状态：</span>
            <span class="detail-value" :class="getStatusClass(currentFeedback.status)">
              {{ getStatusText(currentFeedback.status) }}
            </span>
          </div>
          <div v-if="currentFeedback.reply" class="detail-item">
            <span class="detail-label">官方回复：</span>
            <div class="reply-content">{{ currentFeedback.reply }}</div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { submitFeedback, getFeedbackHistory, uploadFeedbackImage } from '@/api/branchUser'
import { showToast, showDialog } from 'vant'

const router = useRouter()

// 表单数据
const feedbackForm = ref({
  type: '',
  title: '',
  content: '',
  contact: '',
  images: []
})

// 状态控制
const submitting = ref(false)
const showTypePicker = ref(false)
const showDetailPopup = ref(false)
const currentFeedback = ref({})

// 反馈类型
const feedbackTypes = [
  '功能建议',
  '问题反馈',
  '产品咨询',
  '服务投诉',
  '账户问题',
  '支付问题',
  '其他'
]

// 反馈历史
const feedbackHistory = ref([])
const showAllHistory = ref(false)

// 常见问题
const commonFAQs = ref([
  {
    id: 1,
    question: '如何修改分支机构信息？',
    answer: '请联系客服或在设置页面进行修改，需要提供相关证明材料。'
  },
  {
    id: 2,
    question: '为什么充值没有到账？',
    answer: '通常情况下充值会即时到账，如未到账请检查网络或联系客服。'
  },
  {
    id: 3,
    question: '如何申请提现？',
    answer: '在钱包页面点击提现，填写相关信息后提交申请，1-3个工作日内到账。'
  }
])

// 表单验证
const isFormValid = computed(() => {
  return feedbackForm.value.type && 
         feedbackForm.value.title.trim() && 
         feedbackForm.value.content.trim()
})

// 显示的历史记录
const displayHistory = computed(() => {
  return showAllHistory.value ? feedbackHistory.value : feedbackHistory.value.slice(0, 3)
})

// 反馈类型选择
const onTypeConfirm = ({ selectedOptions }) => {
  feedbackForm.value.type = selectedOptions[0]?.text || ''
  showTypePicker.value = false
}

// 图片上传
const afterRead = async (file) => {
  try {
    showToast.loading('上传中...')
    const formData = new FormData()
    formData.append('image', file.file)
    
    const res = await uploadFeedbackImage(formData)
    if (res.code === 0) {
      file.url = res.data.url
      showToast.success('上传成功')
    } else {
      showToast({ type: 'fail', message: '上传失败' })
      return false
    }
  } catch (error) {
    console.error('图片上传失败', error)
    showToast({ type: 'fail', message: '上传失败' })
    return false
  }
}

// 删除图片确认
const beforeDelete = () => {
  return showDialog({
    title: '确认删除',
    message: '确定要删除这张图片吗？'
  }).then(() => true).catch(() => false)
}

// 提交反馈
const handleSubmit = async () => {
  if (!isFormValid.value) {
    showToast('请填写完整信息')
    return
  }
  
  try {
    submitting.value = true
    
    const submitData = {
      type: feedbackForm.value.type,
      title: feedbackForm.value.title.trim(),
      content: feedbackForm.value.content.trim(),
      contact: feedbackForm.value.contact.trim(),
      images: feedbackForm.value.images.map(img => img.url).filter(Boolean)
    }
    
    const res = await submitFeedback(submitData)
    
    if (res.code === 0) {
      showToast.success('反馈提交成功')
      
      // 重置表单
      feedbackForm.value = {
        type: '',
        title: '',
        content: '',
        contact: '',
        images: []
      }
      
      // 刷新历史记录
      await fetchFeedbackHistory()
    } else {
      showToast({ type: 'fail', message: res.message || '提交失败' })
    }
  } catch (error) {
    console.error('提交反馈失败', error)
    showToast({ type: 'fail', message: '提交失败，请稍后重试' })
  } finally {
    submitting.value = false
  }
}

// 获取类型样式类
const getTypeClass = (type) => {
  const typeMap = {
    '功能建议': 'suggestion',
    '问题反馈': 'problem',
    '产品咨询': 'inquiry',
    '服务投诉': 'complaint',
    '账户问题': 'account',
    '支付问题': 'payment',
    '其他': 'other'
  }
  return typeMap[type] || 'other'
}

// 获取状态样式类
const getStatusClass = (status) => {
  const statusMap = {
    'pending': 'pending',
    'processing': 'processing',
    'resolved': 'resolved',
    'closed': 'closed'
  }
  return statusMap[status] || 'pending'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'pending': '待处理',
    'processing': '处理中',
    'resolved': '已解决',
    'closed': '已关闭'
  }
  return statusMap[status] || '待处理'
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 显示反馈详情
const showFeedbackDetail = (feedback) => {
  currentFeedback.value = feedback
  showDetailPopup.value = true
}

// 显示FAQ详情
const showFAQDetail = (faq) => {
  showToast(faq.answer)
}

// 查看全部历史
const toggleHistoryView = () => {
  showAllHistory.value = !showAllHistory.value
}

// 获取反馈历史
const fetchFeedbackHistory = async () => {
  try {
    const res = await getFeedbackHistory()
    if (res.code === 0 && res.data) {
      feedbackHistory.value = res.data
    }
  } catch (error) {
    console.error('获取反馈历史失败', error)
    // 使用模拟数据
    feedbackHistory.value = [
      {
        id: 1,
        type: '功能建议',
        title: '希望增加批量操作功能',
        content: '在管理页面希望能够批量选择和操作多个项目，提高工作效率。',
        status: 'resolved',
        reply: '感谢您的建议，我们已经在新版本中加入了批量操作功能。',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: 2,
        type: '问题反馈',
        title: '充值页面加载缓慢',
        content: '最近几天充值页面加载很慢，有时候要等很久才能打开。',
        status: 'processing',
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  }
}

onMounted(() => {
  fetchFeedbackHistory()
})
</script>

<style scoped>
.branch-feedback-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.feedback-content {
  padding: 16px;
}

/* 通用区块样式 */
.section-header {
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 4px 0;
}

.section-desc {
  font-size: 12px;
  color: #969799;
  margin: 0;
  line-height: 1.4;
}

.view-all {
  font-size: 12px;
  color: #1989fa;
  cursor: pointer;
}

/* 反馈表单 */
.feedback-form-section {
  margin-bottom: 24px;
}

.form-container {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.submit-section {
  padding: 16px;
  background: #fff;
}

/* 历史反馈 */
.history-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.feedback-list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.feedback-item {
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 1px solid #f7f8fa;
}

.feedback-item:last-child {
  border-bottom: none;
}

.feedback-item:hover {
  background-color: #f7f8fa;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.feedback-type {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  color: #fff;
  font-weight: 500;
}

.feedback-type.suggestion { background-color: #1989fa; }
.feedback-type.problem { background-color: #ff4d4f; }
.feedback-type.inquiry { background-color: #52c41a; }
.feedback-type.complaint { background-color: #ff9500; }
.feedback-type.account { background-color: #722ed1; }
.feedback-type.payment { background-color: #13c2c2; }
.feedback-type.other { background-color: #8c8c8c; }

.feedback-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.feedback-status.pending {
  background-color: #fff7e6;
  color: #fa8c16;
}

.feedback-status.processing {
  background-color: #e6f7ff;
  color: #1890ff;
}

.feedback-status.resolved {
  background-color: #f6ffed;
  color: #52c41a;
}

.feedback-status.closed {
  background-color: #f5f5f5;
  color: #8c8c8c;
}

.feedback-title {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 4px;
}

.feedback-content {
  font-size: 12px;
  color: #646566;
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.feedback-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.feedback-time {
  font-size: 11px;
  color: #c8c9cc;
}

.feedback-arrow {
  color: #c8c9cc;
}

.empty-history {
  text-align: center;
  padding: 40px 16px;
}

/* 常见问题 */
.faq-section {
  margin-bottom: 24px;
}

.faq-list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.faq-item {
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 1px solid #f7f8fa;
}

.faq-item:last-child {
  border-bottom: none;
}

.faq-item:hover {
  background-color: #f7f8fa;
}

.faq-question {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 4px;
}

.faq-answer {
  font-size: 12px;
  color: #646566;
  line-height: 1.4;
}

/* 详情弹窗 */
.detail-popup {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #969799;
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: #323233;
  line-height: 1.4;
}

.reply-content {
  background-color: #f7f8fa;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  color: #323233;
  line-height: 1.5;
  border-left: 3px solid #1989fa;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .feedback-content {
    padding: 12px;
  }
  
  .detail-popup {
    padding: 16px;
  }
  
  .feedback-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
