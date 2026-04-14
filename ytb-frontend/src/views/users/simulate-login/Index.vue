<template>
  <div class="simulate-login-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="title-icon"><Monitor /></el-icon>
            模拟登录
          </h1>
          <p class="page-description">管理员可以切换到任意用户视角，查看用户在手机端看到的界面和数据</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="refreshUserList">
            <el-icon><Refresh /></el-icon>
            刷新用户列表
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧用户选择区域 -->
      <div class="user-selection-panel">
        <el-card class="selection-card">
          <template #header>
            <div class="card-header">
              <span>选择用户</span>
              <el-badge :value="selectedUser ? '已选择' : '未选择'" :type="selectedUser ? 'success' : 'info'" />
            </div>
          </template>

          <!-- 搜索框 -->
          <div class="search-section">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索用户（姓名、手机号、ID）"
              @input="handleSearch"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <!-- 用户列表 -->
          <div class="user-list" v-loading="userListLoading">
            <div 
              v-for="user in filteredUsers" 
              :key="user.id"
              class="user-item"
              :class="{ active: selectedUser?.id === user.id }"
              @click="selectUser(user)"
            >
              <div class="user-avatar">
                <el-image
                  v-if="user.wechat_avatar"
                  :src="user.wechat_avatar"
                  fit="cover"
                  class="avatar-img"
                />
                <div v-else class="default-avatar">
                  <span>{{ user.name ? user.name.charAt(0) : '?' }}</span>
                </div>
              </div>
              <div class="user-info">
                <div class="user-name">{{ user.name || user.wechat_nickname || '未知用户' }}</div>
                <div class="user-phone">{{ user.phone || '无手机号' }}</div>
                <div class="user-id">ID: {{ user.id }}</div>
              </div>
            </div>
            
            <!-- 空状态 -->
            <div v-if="filteredUsers.length === 0 && !userListLoading" class="empty-state">
              <el-empty description="没有找到用户" />
            </div>
          </div>

          <!-- 分页 -->
          <div class="pagination-section" v-if="total > 0">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>

        <!-- 当前模拟用户信息 -->
        <el-card v-if="selectedUser" class="user-info-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>当前模拟用户信息</span>
            </div>
          </template>
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="用户ID">{{ selectedUser.id }}</el-descriptions-item>
            <el-descriptions-item label="姓名">{{ selectedUser.name || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ selectedUser.phone || '未绑定' }}</el-descriptions-item>
            <el-descriptions-item label="微信昵称">{{ selectedUser.wechat_nickname || '未绑定' }}</el-descriptions-item>
            <el-descriptions-item label="VIP状态">
              <el-tag :type="selectedUser.is_vip ? 'success' : 'info'">
                {{ selectedUser.is_vip ? 'VIP会员' : '普通用户' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="完款状态">
              <el-tag :type="selectedUser.is_vip_paid ? 'success' : 'warning'">
                {{ selectedUser.is_vip_paid ? '已完款' : '未完款' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ formatDate(selectedUser.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="最后登录">{{ formatDate(selectedUser.last_login_time) || '从未登录' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>

      <!-- 右侧手机界面预览区域 -->
      <div class="mobile-preview-panel">
        <el-card class="preview-card">
          <template #header>
            <div class="card-header">
              <span>手机界面预览</span>
              <div class="preview-actions">
                <el-button 
                  v-if="selectedUser" 
                  type="primary" 
                  size="small"
                  @click="openInNewTab"
                >
                  <el-icon><Link /></el-icon>
                  新窗口打开
                </el-button>
                <el-button 
                  v-if="selectedUser" 
                  type="success" 
                  size="small"
                  @click="refreshPreview"
                >
                  <el-icon><Refresh /></el-icon>
                  刷新预览
                </el-button>
              </div>
            </div>
          </template>

          <!-- 手机框架 -->
          <div class="mobile-frame">
            <div class="mobile-header">
              <div class="status-bar">
                <span class="time">{{ currentTime }}</span>
                <div class="status-icons">
                  <span class="signal">●●●●●</span>
                  <span class="wifi">📶</span>
                  <span class="battery">🔋100%</span>
                </div>
              </div>
            </div>

            <div class="mobile-content">
              <!-- 未选择用户时的提示 -->
              <div v-if="!selectedUser" class="no-user-selected">
                <el-empty description="请先选择一个用户">
                  <template #image>
                    <el-icon size="60"><User /></el-icon>
                  </template>
                </el-empty>
              </div>

              <!-- 选择用户后的iframe预览 -->
              <div v-else class="iframe-container">
                <iframe
                  ref="mobileIframe"
                  :src="mobileUrl"
                  class="mobile-iframe"
                  @load="handleIframeLoad"
                />
                <div v-if="iframeLoading" class="iframe-loading">
                  <el-loading-spinner />
                  <p>正在加载用户界面...</p>
                </div>
              </div>
            </div>
          </div>


        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Monitor, Refresh, Search, User, Link } from '@element-plus/icons-vue'
import { getUsers } from '@/api/v1/appUser'
import { generateSimulateToken } from '@/api/v1/simulateLogin'

// 响应式数据
const userListLoading = ref(false)
const iframeLoading = ref(false)
const searchKeyword = ref('')
const selectedUser = ref(null)
const userList = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const currentTime = ref('')
const mobileIframe = ref(null)

// 计算属性
const filteredUsers = computed(() => {
  if (!searchKeyword.value) {
    return userList.value
  }
  const keyword = searchKeyword.value.toLowerCase()
  return userList.value.filter(user => {
    return (
      (user.name && user.name.toLowerCase().includes(keyword)) ||
      (user.phone && user.phone.includes(keyword)) ||
      (user.wechat_nickname && user.wechat_nickname.toLowerCase().includes(keyword)) ||
      user.id.toString().includes(keyword)
    )
  })
})

const simulateToken = ref('')

const mobileUrl = computed(() => {
  if (!selectedUser.value || !simulateToken.value) return ''
  // 构建手机端URL，包含模拟登录参数，直接打开个人中心页面
  return `https://pay.itapgo.com/app/#/user?simulate_token=${simulateToken.value}`
})

// 方法
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const fetchUserList = async () => {
  userListLoading.value = true
  try {
    const response = await getUsers({
      page: currentPage.value,
      per_page: pageSize.value,
      keyword: searchKeyword.value
    })

    if (response.code === 0 || response.code === 200) {
      userList.value = response.data.data || response.data || []
      total.value = response.data.total || response.total || 0
    } else {
      ElMessage.error('获取用户列表失败: ' + (response.message || '未知错误'))
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败: ' + (error.message || '网络错误'))
  } finally {
    userListLoading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchUserList()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchUserList()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchUserList()
}

const selectUser = async (user) => {
  try {
    iframeLoading.value = true
    
    // 生成模拟登录token
    const response = await generateSimulateToken(user.id)
    
    if (response.code === 0 || response.code === 200) {
      selectedUser.value = user
      // 将token存储到响应式变量和sessionStorage中
      simulateToken.value = response.data.simulate_token
      sessionStorage.setItem('simulate_token', response.data.simulate_token)
      ElMessage.success(`已切换到用户: ${user.name || user.wechat_nickname || user.phone}`)
      
      // 自动刷新预览
      setTimeout(() => {
        refreshPreview()
      }, 500) // 延迟500ms确保token已经设置完成
    } else {
      throw new Error(response.message || '生成模拟登录token失败')
    }
  } catch (error) {
    console.error('切换用户失败:', error)
    ElMessage.error('切换用户失败: ' + (error.message || '网络错误'))
    iframeLoading.value = false
  }
}

const refreshUserList = () => {
  fetchUserList()
}

const refreshPreview = () => {
  if (mobileIframe.value) {
    iframeLoading.value = true
    // 强制刷新iframe：先清空src，然后重新设置
    mobileIframe.value.src = 'about:blank'
    setTimeout(() => {
      if (mobileIframe.value) {
        mobileIframe.value.src = mobileUrl.value
        // 设置一个较短的超时来确保加载状态被隐藏
        setTimeout(() => {
          if (iframeLoading.value) {
            console.log('iframe加载超时，强制隐藏加载状态')
            iframeLoading.value = false
          }
        }, 5000) // 5秒超时，比之前的10秒更短
      }
    }, 100)
  }
}

const openInNewTab = () => {
  if (selectedUser.value) {
    window.open(mobileUrl.value, '_blank')
  }
}

const handleIframeLoad = () => {
  iframeLoading.value = false
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

// 监听器
watch(selectedUser, (newUser) => {
  if (newUser) {
    iframeLoading.value = true
  }
})

// 生命周期
onMounted(() => {
  fetchUserList()
  updateTime()
  // 每分钟更新一次时间
  setInterval(updateTime, 60000)
})
</script>

<style scoped>
.simulate-login-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 84px);
}

/* 页面头部样式 */
.page-header {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 28px;
}

.page-description {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

/* 主要内容区域 */
.main-content {
  display: flex;
  gap: 20px;
  min-height: 600px;
}

/* 左侧用户选择面板 */
.user-selection-panel {
  width: 420px;
  flex-shrink: 0;
}

.selection-card {
  display: flex;
  flex-direction: column;
  max-height: 70vh;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.search-section {
  margin-bottom: 16px;
}

.user-list {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
  margin-bottom: 16px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.user-item.active {
  border-color: #409eff;
  background-color: #e1f3ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.user-avatar {
  width: 50px;
  height: 50px;
  margin-right: 12px;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.default-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #67c23a);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 18px;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.user-phone {
  font-size: 12px;
  color: #606266;
  margin-bottom: 2px;
}

.user-id {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.user-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.pagination-section {
  margin-top: 16px;
  text-align: center;
  padding: 0 8px;
  flex-shrink: 0;
}

.pagination-section :deep(.el-pagination) {
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
}

.pagination-section :deep(.el-pagination .el-pager) {
  flex-wrap: wrap;
}

.pagination-section :deep(.el-pagination .el-pager li) {
  margin: 2px;
}

/* 右侧手机预览面板 */
.mobile-preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.preview-card {
  display: flex;
  flex-direction: column;
  max-height: 70vh;
  overflow: hidden;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.mobile-frame {
  width: 393px;
  height: 852px;
  margin: 0 auto;
  background: linear-gradient(145deg, #1a1a1a, #2d2d2d);
  border-radius: 47px;
  padding: 8px;
  box-shadow: 
    0 0 0 2px #333,
    0 0 0 3px #666,
    0 20px 40px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  position: relative;
}

.mobile-header {
  height: 44px;
  background: #000;
  border-radius: 39px 39px 0 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-header::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 126px;
  height: 30px;
  background: #000;
  border-radius: 19px;
  z-index: 10;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 100%;
  color: white;
  font-size: 14px;
  font-weight: 600;
  width: 100%;
  position: relative;
  z-index: 5;
}

.status-icons {
  display: flex;
  gap: 6px;
  align-items: center;
}

.status-icons .signal {
  font-size: 8px;
  letter-spacing: 1px;
}

.status-icons .wifi {
  font-size: 12px;
}

.status-icons .battery {
  font-size: 12px;
}

.mobile-content {
  height: calc(100% - 44px);
  background: white;
  border-radius: 0 0 39px 39px;
  overflow: hidden;
  position: relative;
}

.no-user-selected {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.iframe-container {
  height: 100%;
  position: relative;
}

.mobile-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 0 0 39px 39px;
}

.iframe-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.iframe-loading p {
  margin-top: 10px;
  color: #606266;
}

.user-info-card {
  flex-shrink: 0;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

/* 响应式设计 - 优化手机预览界面自适应性 */
@media (max-width: 1600px) {
  .preview-card {
    max-height: 75vh;
  }
  
  .mobile-frame {
    width: 360px;
    height: 780px;
  }
}

@media (max-width: 1400px) {
  .user-selection-panel {
    width: 380px;
  }
  
  .preview-card {
    max-height: 80vh;
  }
  
  .mobile-frame {
    width: 340px;
    height: 720px;
  }
}

/* 针对1366x768等常见分辨率优化 */
@media (max-width: 1366px) {
  .preview-card {
    max-height: 85vh;
    overflow-y: auto;
  }
  
  .mobile-frame {
    width: 320px;
    height: 680px;
  }
}

/* 针对1280x720分辨率优化 */
@media (max-width: 1280px) {
  .preview-card {
    max-height: 70vh;
    overflow-y: auto;
  }
  
  .mobile-frame {
    width: 300px;
    height: 600px;
  }
}

/* 进一步优化小屏幕显示 - 提前启用垂直布局 */
@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
    height: auto;
    min-height: auto;
    gap: 20px;
  }
  
  .user-selection-panel {
    width: 100%;
    max-height: 350px;
  }
  
  .mobile-preview-panel {
    margin-top: 0;
  }
  
  .preview-card {
    max-height: 60vh;
    overflow-y: auto;
  }
  
  .mobile-frame {
    width: 300px;
    height: 550px;
  }
}

@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
    height: auto;
    min-height: auto;
    gap: 15px;
  }
  
  .user-selection-panel {
    width: 100%;
    max-height: 280px;
    margin-bottom: 0;
  }
  
  .mobile-preview-panel {
    margin-top: 0;
  }
  
  .preview-card {
    max-height: 45vh;
    overflow-y: auto;
  }
  
  .mobile-frame {
    width: 280px;
    height: 400px;
  }
}

/* 平板和小屏幕优化 */
@media (max-width: 768px) {
  .simulate-login-container {
    padding: 10px;
  }
  
  .page-header {
    padding: 15px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .page-description {
    font-size: 13px;
  }
  
  .main-content {
    flex-direction: column;
    gap: 15px;
  }
  
  .user-selection-panel {
    width: 100%;
    max-height: 250px;
  }
  
  .mobile-preview-panel {
    margin-top: 0;
  }
  
  .preview-card {
    max-height: 50vh;
    overflow-y: auto;
  }
  
  .mobile-frame {
    width: 260px;
    height: 450px;
  }
}

/* 手机端优化 */
@media (max-width: 480px) {
  .pagination-section :deep(.el-pagination) {
    font-size: 12px;
  }
  
  .pagination-section :deep(.el-pagination .el-pager li) {
    min-width: 28px;
    height: 28px;
    line-height: 28px;
  }
  
  .mobile-frame {
    width: 240px;
    height: 500px;
  }
  
  .page-title {
    font-size: 18px;
  }
  
  .page-description {
    font-size: 12px;
  }
}
</style>
