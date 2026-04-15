<template>
  <div class="notifications-container">
    <!-- 头部导航 -->
    <van-nav-bar 
      title="通知消息" 
      left-arrow 
      @click-left="$router.back()" 
      fixed
      placeholder
    >
      <template #right>
        <van-icon name="setting-o" size="18" @click="goToSettings" />
      </template>
    </van-nav-bar>
    
    <!-- 内容区域 -->
    <div class="content">
      <!-- 通知分类标签 -->
      <van-tabs v-model:active="activeTab" @change="onTabChange" sticky>
        <van-tab title="全部" name="all"></van-tab>
        <van-tab title="系统通知" name="system"></van-tab>
        <van-tab title="交易通知" name="trade"></van-tab>
        <van-tab title="订单通知" name="order"></van-tab>
      </van-tabs>
      
      <!-- 通知列表 -->
      <div class="notifications-list">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
          >
            <div 
              v-for="notification in notifications" 
              :key="notification.id"
              class="notification-item"
              :class="{ 'unread': !notification.is_read }"
              @click="markAsRead(notification)"
            >
              <div class="notification-icon">
                <van-icon 
                  :name="getNotificationIcon(notification.type)" 
                  :color="getNotificationColor(notification.type)"
                  size="20"
                />
              </div>
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-message">{{ notification.message }}</div>
                <div class="notification-time">{{ formatTime(notification.created_at) }}</div>
              </div>
              <div class="notification-status">
                <van-icon 
                  v-if="!notification.is_read" 
                  name="circle" 
                  color="#1989fa" 
                  size="8"
                />
              </div>
            </div>
          </van-list>
        </van-pull-refresh>
        
        <!-- 空状态 -->
        <div v-if="notifications.length === 0 && !loading" class="empty-state">
          <van-empty 
            image="search" 
            description="暂无通知消息"
          >
            <van-button 
              round 
              type="primary" 
              class="bottom-button"
              @click="onRefresh"
            >
              刷新试试
            </van-button>
          </van-empty>
        </div>
      </div>
    </div>
    
    <!-- 底部操作栏 -->
    <div class="bottom-actions" v-if="notifications.length > 0">
      <van-button 
        type="default" 
        size="small"
        @click="markAllAsRead"
      >
        全部已读
      </van-button>
      <van-button 
        type="danger" 
        size="small"
        @click="clearAllNotifications"
      >
        清空通知
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, clearNotifications } from '@/api/notifications'

const router = useRouter()

// 响应式数据
const activeTab = ref('all')
const refreshing = ref(false)
const loading = ref(false)
const finished = ref(false)
const notifications = ref([])

// 分页参数
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 获取通知图标
const getNotificationIcon = (type) => {
  const iconMap = {
    'system': 'info-o',
    'trade': 'gold-coin-o',
    'order': 'bag-o',
    'promotion': 'gift-o',
    'warning': 'warning-o'
  }
  return iconMap[type] || 'bell'
}

// 获取通知颜色
const getNotificationColor = (type) => {
  const colorMap = {
    'system': '#1989fa',
    'trade': '#07c160',
    'order': '#ff976a',
    'promotion': '#ee0a24',
    'warning': '#ff976a'
  }
  return colorMap[type] || '#1989fa'
}

// 格式化时间
const formatTime = (time) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 24小时内
    return `${Math.floor(diff / 3600000)}小时前`
  } else if (diff < 604800000) { // 7天内
    return `${Math.floor(diff / 86400000)}天前`
  } else {
    return date.toLocaleDateString()
  }
}

// 加载通知列表
const loadNotifications = async (isRefresh = false) => {
  try {
    if (isRefresh) {
      pagination.page = 1
      finished.value = false
    }
    
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      type: activeTab.value === 'all' ? '' : activeTab.value
    }
    
    const response = await getNotifications(params)
    
    if (response.code === 200) {
      const newNotifications = response.data.list || []
      
      if (isRefresh) {
        notifications.value = newNotifications
      } else {
        notifications.value.push(...newNotifications)
      }
      
      pagination.total = response.data.total || 0
      
      // 检查是否还有更多数据
      if (notifications.value.length >= pagination.total) {
        finished.value = true
      } else {
        pagination.page++
      }
    } else {
      showToast(response.message || '获取通知失败')
    }
  } catch (error) {
    console.error('获取通知失败:', error)
    showToast('获取通知失败')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  loadNotifications(true)
}

// 上拉加载
const onLoad = () => {
  if (finished.value) return
  loading.value = true
  loadNotifications()
}

// 切换标签
const onTabChange = () => {
  notifications.value = []
  pagination.page = 1
  finished.value = false
  loading.value = true
  loadNotifications(true)
}

// 标记为已读
const markAsRead = async (notification) => {
  if (notification.is_read) return
  
  try {
    const response = await markNotificationAsRead(notification.id)
    if (response.code === 200) {
      notification.is_read = true
    }
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

// 全部标记为已读
const markAllAsRead = async () => {
  try {
    const response = await markAllNotificationsAsRead()
    if (response.code === 200) {
      notifications.value.forEach(item => {
        item.is_read = true
      })
      showToast('已全部标记为已读')
    } else {
      showToast(response.message || '操作失败')
    }
  } catch (error) {
    console.error('标记全部已读失败:', error)
    showToast('操作失败')
  }
}

// 清空所有通知
const clearAllNotifications = async () => {
  try {
    await showConfirmDialog({
      title: '确认清空',
      message: '确定要清空所有通知吗？此操作不可恢复。'
    })
    
    const response = await clearNotifications()
    if (response.code === 200) {
      notifications.value = []
      showToast('已清空所有通知')
    } else {
      showToast(response.message || '清空失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空通知失败:', error)
      showToast('清空失败')
    }
  }
}

// 跳转到设置
const goToSettings = () => {
  router.push('/merchant/notification-settings')
}

// 初始化
onMounted(() => {
  loading.value = true
  loadNotifications(true)
})
</script>

<style scoped>
.notifications-container {
  background-color: #f5f7fa;
  min-height: 100vh;
  padding-bottom: 60px;
}

.content {
  padding-top: 0;
}

.notifications-list {
  padding: 0 12px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background-color: #ffffff;
  border-radius: 8px;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  cursor: pointer;
}

.notification-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.notification-item.unread {
  border-left: 3px solid #1989fa;
  background-color: #f8fafe;
}

.notification-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 50%;
  margin-right: 12px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  line-height: 1.4;
}

.notification-message {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.notification-status {
  flex-shrink: 0;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  padding: 40px 20px;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #ffffff;
  padding: 12px 16px;
  border-top: 1px solid #ebedf0;
  display: flex;
  gap: 12px;
  z-index: 100;
}

.bottom-actions .van-button {
  flex: 1;
}

/* 标签页样式 */
:deep(.van-tabs__wrap) {
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

:deep(.van-tabs__nav) {
  background-color: #ffffff;
}

:deep(.van-tab) {
  font-weight: 500;
}

:deep(.van-tab--active) {
  color: #1989fa;
  font-weight: 600;
}

/* 下拉刷新样式 */
:deep(.van-pull-refresh__head) {
  color: #1989fa;
}

/* 加载更多样式 */
:deep(.van-list__finished-text) {
  color: #999;
  font-size: 14px;
  padding: 20px 0;
}
</style> 