<template>
  <div class="branch-help-container">
    <van-nav-bar
      title="帮助中心"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />
    
    <div class="help-content">
      <!-- 搜索框 -->
      <div class="search-section">
        <van-search
          v-model="searchKeyword"
          placeholder="搜索帮助内容"
          @search="handleSearch"
          @clear="handleClear"
        />
      </div>

      <!-- 热门问题 -->
      <div class="hot-questions-section" v-if="!searchKeyword">
        <div class="section-header">
          <h3>热门问题</h3>
        </div>
        <div class="questions-list">
          <div 
            v-for="question in hotQuestions" 
            :key="question.id"
            class="question-item"
            @click="showQuestionDetail(question)"
          >
            <div class="question-icon">
              <van-icon name="question-o" size="18" />
            </div>
            <div class="question-content">
              <div class="question-title">{{ question.title }}</div>
              <div class="question-summary">{{ question.summary }}</div>
            </div>
            <van-icon name="arrow" class="question-arrow" />
          </div>
        </div>
      </div>

      <!-- 帮助分类 -->
      <div class="categories-section" v-if="!searchKeyword">
        <div class="section-header">
          <h3>帮助分类</h3>
        </div>
        <div class="categories-grid">
          <div 
            v-for="category in helpCategories" 
            :key="category.id"
            class="category-item"
            @click="showCategoryDetail(category)"
          >
            <div class="category-icon" :class="category.type">
              <van-icon :name="category.icon" size="24" />
            </div>
            <div class="category-text">
              <div class="category-title">{{ category.title }}</div>
              <div class="category-count">{{ category.count }}个问题</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索结果 -->
      <div class="search-results-section" v-if="searchKeyword">
        <div class="section-header">
          <h3>搜索结果 ({{ searchResults.length }})</h3>
        </div>
        <div class="search-results" v-if="searchResults.length > 0">
          <div 
            v-for="result in searchResults" 
            :key="result.id"
            class="result-item"
            @click="showQuestionDetail(result)"
          >
            <div class="result-title" v-html="sanitize(highlightKeyword(result.title))"></div>
            <div class="result-content" v-html="sanitize(highlightKeyword(result.content))"></div>
            <div class="result-category">{{ result.category }}</div>
          </div>
        </div>
        <div v-else class="empty-results">
          <van-empty description="未找到相关内容" />
          <van-button type="primary" size="small" @click="contactService">联系客服</van-button>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="quick-actions-section" v-if="!searchKeyword">
        <div class="section-header">
          <h3>快捷操作</h3>
        </div>
        <div class="actions-list">
          <div class="action-item" @click="contactService">
            <div class="action-icon service">
              <van-icon name="service-o" size="20" />
            </div>
            <div class="action-content">
              <div class="action-title">联系客服</div>
              <div class="action-desc">7x24小时在线服务</div>
            </div>
            <van-icon name="arrow" class="action-arrow" />
          </div>
          
          <div class="action-item" @click="showFeedback">
            <div class="action-icon feedback">
              <van-icon name="comment-o" size="20" />
            </div>
            <div class="action-content">
              <div class="action-title">意见反馈</div>
              <div class="action-desc">告诉我们您的建议</div>
            </div>
            <van-icon name="arrow" class="action-arrow" />
          </div>
          
          <div class="action-item" @click="showUserGuide">
            <div class="action-icon guide">
              <van-icon name="guide-o" size="20" />
            </div>
            <div class="action-content">
              <div class="action-title">使用指南</div>
              <div class="action-desc">新手入门教程</div>
            </div>
            <van-icon name="arrow" class="action-arrow" />
          </div>
          
          <div class="action-item" @click="showVideoTutorials">
            <div class="action-icon video">
              <van-icon name="video-o" size="20" />
            </div>
            <div class="action-content">
              <div class="action-title">视频教程</div>
              <div class="action-desc">操作演示视频</div>
            </div>
            <van-icon name="arrow" class="action-arrow" />
          </div>
        </div>
      </div>

      <!-- 联系信息 -->
      <div class="contact-section" v-if="!searchKeyword">
        <div class="section-header">
          <h3>联系我们</h3>
        </div>
        <div class="contact-info">
          <div class="contact-item">
            <van-icon name="phone-o" size="16" />
            <span>客服热线：400-888-9999</span>
          </div>
          <div class="contact-item">
            <van-icon name="clock-o" size="16" />
            <span>服务时间：7x24小时</span>
          </div>
          <div class="contact-item">
            <van-icon name="envelop-o" size="16" />
            <span>邮箱：support@itapgo.com</span>
          </div>
          <div class="contact-item">
            <van-icon name="wechat" size="16" />
            <span>微信：点点够客服</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 问题详情弹窗 -->
    <van-popup v-model:show="showQuestionPopup" position="bottom" round>
      <div class="question-detail">
        <div class="detail-header">
          <h3>{{ currentQuestion.title }}</h3>
          <van-icon name="cross" @click="showQuestionPopup = false" />
        </div>
        <div class="detail-content">
          <div class="detail-text" v-html="sanitize(currentQuestion.content)"></div>
          <div class="detail-actions">
            <van-button size="small" @click="likeQuestion">
              <van-icon name="like-o" /> 有用 ({{ currentQuestion.likes || 0 }})
            </van-button>
            <van-button size="small" plain @click="contactService">
              联系客服
            </van-button>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getBranchHelpData, searchHelpContent, likeHelpQuestion } from '@/api/branchUser'
import { showToast } from 'vant'
import sanitize from '@/utils/sanitize'

const router = useRouter()

// 搜索相关
const searchKeyword = ref('')
const searchResults = ref([])

// 弹窗状态
const showQuestionPopup = ref(false)
const currentQuestion = ref({})

// 热门问题
const hotQuestions = ref([
  {
    id: 1,
    title: '如何注册分支机构账号？',
    summary: '详细介绍分支机构账号注册流程',
    content: `
      <h4>注册步骤：</h4>
      <ol>
        <li>访问分支机构登录页面</li>
        <li>点击"注册账号"按钮</li>
        <li>填写机构信息和联系方式</li>
        <li>上传相关证件材料</li>
        <li>等待审核通过</li>
      </ol>
      <p><strong>注意事项：</strong></p>
      <ul>
        <li>确保提供的信息真实有效</li>
        <li>上传的证件照片清晰可见</li>
        <li>审核时间通常为1-3个工作日</li>
      </ul>
    `,
    category: '账号管理',
    likes: 156
  },
  {
    id: 2,
    title: '如何进行账户充值？',
    summary: '支持多种充值方式，操作简单便捷',
    content: `
      <h4>充值方式：</h4>
      <ol>
        <li>支付宝充值</li>
        <li>微信支付充值</li>
        <li>银行卡充值</li>
        <li>线下转账充值</li>
      </ol>
      <p><strong>充值步骤：</strong></p>
      <ol>
        <li>进入"我的钱包"页面</li>
        <li>点击"充值"按钮</li>
        <li>选择充值金额和支付方式</li>
        <li>完成支付即可到账</li>
      </ol>
    `,
    category: '支付相关',
    likes: 89
  },
  {
    id: 3,
    title: '分支机构有哪些专属权益？',
    summary: '享受多项专属服务和优惠政策',
    content: `
      <h4>专属权益包括：</h4>
      <ul>
        <li>专属产品价格优惠</li>
        <li>优先客服支持</li>
        <li>定制化服务方案</li>
        <li>营销活动支持</li>
        <li>数据分析报告</li>
        <li>培训资源提供</li>
      </ul>
      <p>更多权益详情请联系您的专属客服了解。</p>
    `,
    category: '权益说明',
    likes: 234
  }
])

// 帮助分类
const helpCategories = ref([
  {
    id: 1,
    title: '账号管理',
    icon: 'user-o',
    type: 'account',
    count: 12
  },
  {
    id: 2,
    title: '支付相关',
    icon: 'credit-pay',
    type: 'payment',
    count: 8
  },
  {
    id: 3,
    title: '产品服务',
    icon: 'goods-collect-o',
    type: 'product',
    count: 15
  },
  {
    id: 4,
    title: '权益说明',
    icon: 'gem-o',
    type: 'benefits',
    count: 6
  },
  {
    id: 5,
    title: '技术支持',
    icon: 'service-o',
    type: 'technical',
    count: 10
  },
  {
    id: 6,
    title: '其他问题',
    icon: 'question-o',
    type: 'others',
    count: 5
  }
])

// 搜索处理
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = []
    return
  }
  
  try {
    const res = await searchHelpContent({ keyword: searchKeyword.value })
    if (res.code === 0) {
      searchResults.value = res.data || []
    }
  } catch (error) {
    console.error('搜索失败', error)
    // 使用模拟搜索结果
    searchResults.value = hotQuestions.value.filter(item => 
      item.title.includes(searchKeyword.value) || 
      item.content.includes(searchKeyword.value)
    )
  }
}

// 清空搜索
const handleClear = () => {
  searchKeyword.value = ''
  searchResults.value = []
}

// 高亮关键词
const highlightKeyword = (text) => {
  if (!searchKeyword.value || !text) return text
  const regex = new RegExp(`(${searchKeyword.value})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// 显示问题详情
const showQuestionDetail = (question) => {
  currentQuestion.value = question
  showQuestionPopup.value = true
}

// 显示分类详情
const showCategoryDetail = (category) => {
  showToast(`${category.title}功能开发中...`)
}

// 点赞问题
const likeQuestion = async () => {
  try {
    const res = await likeHelpQuestion({ id: currentQuestion.value.id })
    if (res.code === 0) {
      currentQuestion.value.likes = (currentQuestion.value.likes || 0) + 1
      showToast.success('感谢您的反馈')
    }
  } catch (error) {
    console.error('点赞失败', error)
    showToast.success('感谢您的反馈')
    currentQuestion.value.likes = (currentQuestion.value.likes || 0) + 1
  }
}

// 联系客服
const contactService = () => {
  showToast('正在为您转接客服...')
  // 这里可以集成客服系统
}

// 意见反馈
const showFeedback = () => {
  router.push('/branch/feedback')
}

// 使用指南
const showUserGuide = () => {
  showToast('使用指南功能开发中...')
}

// 视频教程
const showVideoTutorials = () => {
  showToast('视频教程功能开发中...')
}

// 获取帮助数据
const fetchHelpData = async () => {
  try {
    const res = await getBranchHelpData()
    if (res.code === 0 && res.data) {
      if (res.data.hotQuestions) {
        hotQuestions.value = res.data.hotQuestions
      }
      if (res.data.categories) {
        helpCategories.value = res.data.categories
      }
    }
  } catch (error) {
    console.error('获取帮助数据失败', error)
  }
}

onMounted(() => {
  fetchHelpData()
})
</script>

<style scoped>
.branch-help-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.help-content {
  padding: 16px;
}

/* 搜索框 */
.search-section {
  margin-bottom: 16px;
}

/* 通用区块样式 */
.section-header {
  margin-bottom: 12px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

/* 热门问题 */
.hot-questions-section {
  margin-bottom: 24px;
}

.questions-list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.question-item {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 1px solid #f7f8fa;
}

.question-item:last-child {
  border-bottom: none;
}

.question-item:hover {
  background-color: #f7f8fa;
}

.question-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1989fa, #4dabf7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 12px;
}

.question-content {
  flex: 1;
}

.question-title {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 4px;
}

.question-summary {
  font-size: 12px;
  color: #969799;
  line-height: 1.4;
}

.question-arrow {
  color: #c8c9cc;
}

/* 帮助分类 */
.categories-section {
  margin-bottom: 24px;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.category-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.category-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.category-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  color: #fff;
}

.category-icon.account { background: linear-gradient(135deg, #667eea, #764ba2); }
.category-icon.payment { background: linear-gradient(135deg, #f093fb, #f5576c); }
.category-icon.product { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.category-icon.benefits { background: linear-gradient(135deg, #43e97b, #38f9d7); }
.category-icon.technical { background: linear-gradient(135deg, #fa709a, #fee140); }
.category-icon.others { background: linear-gradient(135deg, #a8edea, #fed6e3); }

.category-text {
  text-align: left;
}

.category-title {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 4px;
}

.category-count {
  font-size: 12px;
  color: #969799;
}

/* 搜索结果 */
.search-results-section {
  margin-bottom: 24px;
}

.search-results {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.result-item {
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 1px solid #f7f8fa;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background-color: #f7f8fa;
}

.result-title {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 8px;
}

.result-content {
  font-size: 12px;
  color: #646566;
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-category {
  font-size: 11px;
  color: #1989fa;
  background-color: #f0f8ff;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

.empty-results {
  text-align: center;
  padding: 40px 16px;
}

/* 快捷操作 */
.quick-actions-section {
  margin-bottom: 24px;
}

.actions-list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.action-item {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 1px solid #f7f8fa;
}

.action-item:last-child {
  border-bottom: none;
}

.action-item:hover {
  background-color: #f7f8fa;
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #fff;
}

.action-icon.service { background: linear-gradient(135deg, #07c160, #51cf66); }
.action-icon.feedback { background: linear-gradient(135deg, #ff9500, #ffb84d); }
.action-icon.guide { background: linear-gradient(135deg, #1989fa, #4dabf7); }
.action-icon.video { background: linear-gradient(135deg, #ff6b6b, #ffa8a8); }

.action-content {
  flex: 1;
}

.action-title {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 2px;
}

.action-desc {
  font-size: 12px;
  color: #969799;
}

.action-arrow {
  color: #c8c9cc;
}

/* 联系信息 */
.contact-section {
  margin-bottom: 24px;
}

.contact-info {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
  color: #323233;
}

.contact-item:not(:last-child) {
  border-bottom: 1px solid #f7f8fa;
}

.contact-item .van-icon {
  margin-right: 12px;
  color: #1989fa;
}

/* 问题详情弹窗 */
.question-detail {
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
  flex: 1;
  padding-right: 16px;
}

.detail-content {
  line-height: 1.6;
}

.detail-text {
  font-size: 14px;
  color: #323233;
  margin-bottom: 24px;
}

.detail-text h4 {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 16px 0 8px 0;
}

.detail-text ol,
.detail-text ul {
  padding-left: 20px;
  margin: 8px 0;
}

.detail-text li {
  margin: 4px 0;
}

.detail-text p {
  margin: 8px 0;
}

.detail-text strong {
  font-weight: 600;
  color: #323233;
}

.detail-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 高亮样式 */
:deep(mark) {
  background-color: #fff3cd;
  color: #856404;
  padding: 0 2px;
  border-radius: 2px;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .help-content {
    padding: 12px;
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
  }
  
  .question-detail {
    padding: 16px;
  }
  
  .detail-actions {
    flex-direction: column;
  }
}
</style>
