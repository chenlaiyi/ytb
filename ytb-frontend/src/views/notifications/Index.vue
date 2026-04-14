<template>
  <div class="notifications-container">
    <div class="page-header">
      <h2>系统通知</h2>
      <div class="header-actions">
        <!-- 语音播报控制 -->
        <div class="voice-controls">
          <el-button 
            :type="isVoiceEnabled ? 'primary' : 'default'" 
            :icon="isVoiceEnabled ? 'VideoPlay' : 'VideoPause'"
            @click="toggleVoiceNotification"
            size="small"
          >
            {{ isVoiceEnabled ? '语音播报已开启' : '语音播报已关闭' }}
          </el-button>
          
          <el-button 
            v-if="isVoiceEnabled && pendingVoiceNotifications.length > 0"
            type="warning" 
            icon="Bell"
            @click="playAllVoiceNotifications"
            size="small"
          >
            播放全部 ({{ pendingVoiceNotifications.length }})
          </el-button>

          <el-button 
            type="info" 
            icon="Microphone"
            @click="showVoiceTestDialog = true"
            size="small"
          >
            测试语音
          </el-button>
        </div>
        
        <el-button 
          v-if="unreadCount > 0" 
          type="primary" 
          @click="markAllAsRead"
          :loading="markingAllRead"
        >
          全部标记为已读 ({{ unreadCount }})
        </el-button>
      </div>
    </div>

    <!-- 当前播放状态 -->
    <div v-if="currentVoicePlaying" class="current-playing">
      <el-alert
        :title="`正在播报: ${currentVoicePlaying.title}`"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <div class="playing-content">
            <p>{{ currentVoicePlaying.voice_text || currentVoicePlaying.content }}</p>
            <el-progress 
              :percentage="voicePlayProgress" 
              :show-text="false"
              :stroke-width="4"
            />
          </div>
        </template>
      </el-alert>
    </div>

    <!-- 筛选器 -->
    <div class="filter-bar">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择状态" clearable @change="handleFilterChange" style="width: 120px;">
            <el-option label="全部状态" value="" />
            <el-option label="未读" value="unread" />
            <el-option label="已读" value="read" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filters.type" placeholder="请选择类型" clearable @change="handleFilterChange" style="width: 120px;">
            <el-option label="全部类型" value="" />
            <el-option label="信息" value="info" />
            <el-option label="成功" value="success" />
            <el-option label="警告" value="warning" />
            <el-option label="错误" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="refreshList">刷新</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 通知列表 -->
    <div class="notifications-list" v-loading="loading">
      <div v-if="notifications.length === 0" class="empty-state">
        <el-empty description="暂无通知" />
      </div>
      <div v-else>
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="notification-card"
          :class="{ 'unread': !notification.is_read }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-header">
            <div class="notification-title">
              <el-tag 
                :type="getTypeColor(notification.type)" 
                size="small"
                class="type-tag"
              >
                {{ getTypeText(notification.type) }}
              </el-tag>
              <el-tag 
                :type="getPriorityColor(notification.priority)" 
                size="small"
                class="priority-tag"
              >
                {{ getPriorityText(notification.priority) }}
              </el-tag>
              <span class="title-text">{{ notification.title }}</span>
              <div v-if="!notification.is_read" class="unread-indicator"></div>
            </div>
            <div class="notification-time">
              {{ formatTime(notification.created_at) }}
            </div>
          </div>
          <div class="notification-content">
            {{ notification.content }}
          </div>
          <div class="notification-actions">
            <el-button 
              v-if="!notification.is_read" 
              type="text" 
              size="small" 
              @click.stop="markAsRead(notification)"
            >
              标记已读
            </el-button>
            <el-button 
              type="text" 
              size="small" 
              @click.stop="deleteNotification(notification)"
              class="delete-btn"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 语音测试对话框 -->
    <el-dialog
      v-model="showVoiceTestDialog"
      title="测试语音播报"
      width="500px"
    >
      <el-form @submit.prevent="testVoice">
        <el-form-item label="测试文本">
          <el-input
            v-model="voiceTestText"
            type="textarea"
            :rows="3"
            placeholder="请输入要测试的语音文本..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showVoiceTestDialog = false">取消</el-button>
        <el-button type="primary" @click="testVoice" :loading="voiceTestLoading">
          播放测试
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import adminApi from '@/api/admin';

export default {
  name: 'NotificationIndex',
  setup() {
    const loading = ref(false);
    const markingAllRead = ref(false);
    const notifications = ref([]);
    
    const filters = reactive({
      status: '',
      type: ''
    });

    const pagination = reactive({
      page: 1,
      limit: 10,
      total: 0
    });

    const unreadCount = computed(() => {
      return notifications.value.filter(n => !n.is_read).length;
    });

    // 语音播报相关变量
    const isVoiceEnabled = ref(false);
    const pendingVoiceNotifications = ref([]);
    const currentVoicePlaying = ref(null);
    const voicePlayProgress = ref(0);
    const showVoiceTestDialog = ref(false);
    const voiceTestText = ref('');
    const voiceTestLoading = ref(false);
    
    let voiceCheckInterval = null;
    let speechSynthesis = null;
    let currentUtterance = null;

    // 获取通知列表
    const fetchNotifications = async () => {
      try {
        loading.value = true;
        const params = {
          page: pagination.page,
          per_page: pagination.limit,
          ...filters
        };

        const response = await adminApi.getNotifications(params);
        
        if (response && (response.code === 0 || response.code === 200)) {
          // 适配后端返回的分页数据格式
          if (response.data && response.data.data) {
            notifications.value = response.data.data;
            pagination.total = response.data.total || 0;
          } else if (Array.isArray(response.data)) {
            notifications.value = response.data;
            pagination.total = response.data.length;
          } else {
            notifications.value = [];
            pagination.total = 0;
          }
        } else {
          console.error('通知API返回错误:', response);
          ElMessage.error(response.message || '获取通知列表失败');
        }
      } catch (error) {
        console.error('获取通知列表失败:', error);
        ElMessage.error('获取通知列表失败');
      } finally {
        loading.value = false;
      }
    };

    // 标记单个通知为已读
    const markAsRead = async (notification) => {
      try {
        const response = await adminApi.markNotificationAsRead(notification.id);
        if (response && (response.code === 0 || response.code === 200)) {
          notification.is_read = true;
          notification.read_at = new Date().toISOString();
          ElMessage.success('已标记为已读');
        } else {
          ElMessage.error(response.message || '标记已读失败');
        }
      } catch (error) {
        console.error('标记已读失败:', error);
        ElMessage.error('标记已读失败');
      }
    };

    // 标记所有通知为已读
    const markAllAsRead = async () => {
      try {
        markingAllRead.value = true;
        const response = await adminApi.markAllNotificationsAsRead();
        if (response && (response.code === 0 || response.code === 200)) {
          notifications.value.forEach(notification => {
            notification.is_read = true;
            notification.read_at = new Date().toISOString();
          });
          ElMessage.success('已标记全部通知为已读');
        } else {
          ElMessage.error(response.message || '标记全部已读失败');
        }
      } catch (error) {
        console.error('标记全部已读失败:', error);
        ElMessage.error('标记全部已读失败');
      } finally {
        markingAllRead.value = false;
      }
    };

    // 删除通知
    const deleteNotification = async (notification) => {
      try {
        await ElMessageBox.confirm('确定要删除这条通知吗？', '确认删除', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });

        const response = await adminApi.deleteNotification(notification.id);
        if (response && (response.code === 0 || response.code === 200)) {
          const index = notifications.value.findIndex(n => n.id === notification.id);
          if (index > -1) {
            notifications.value.splice(index, 1);
            pagination.total--;
          }
          ElMessage.success('删除成功');
        } else {
          ElMessage.error(response.message || '删除失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除通知失败:', error);
          ElMessage.error('删除失败');
        }
      }
    };

    // 处理通知点击
    const handleNotificationClick = async (notification) => {
      // 如果未读，自动标记为已读
      if (!notification.is_read) {
        await markAsRead(notification);
      }

      // 如果有操作链接，跳转到对应页面
      if (notification.action_url) {
        this.$router.push(notification.action_url);
      }
    };

    // 筛选变化处理
    const handleFilterChange = () => {
      pagination.page = 1;
      fetchNotifications();
    };

    // 分页大小变化
    const handleSizeChange = (size) => {
      pagination.limit = size;
      pagination.page = 1;
      fetchNotifications();
    };

    // 当前页变化
    const handleCurrentChange = (page) => {
      pagination.page = page;
      fetchNotifications();
    };

    // 刷新列表
    const refreshList = () => {
      fetchNotifications();
    };

    // 获取类型颜色
    const getTypeColor = (type) => {
      const colors = {
        info: '',
        success: 'success',
        warning: 'warning',
        error: 'danger'
      };
      return colors[type] || '';
    };

    // 获取类型文本
    const getTypeText = (type) => {
      const texts = {
        info: '信息',
        success: '成功',
        warning: '警告',
        error: '错误'
      };
      return texts[type] || '信息';
    };

    // 获取优先级颜色
    const getPriorityColor = (priority) => {
      const colors = {
        low: 'info',
        normal: '',
        high: 'warning',
        urgent: 'danger'
      };
      return colors[priority] || '';
    };

    // 获取优先级文本
    const getPriorityText = (priority) => {
      const texts = {
        low: '低',
        normal: '普通',
        high: '高',
        urgent: '紧急'
      };
      return texts[priority] || '普通';
    };

    // 格式化时间
    const formatTime = (time) => {
      if (!time) return '';
      const date = new Date(time);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) { // 1分钟内
        return '刚刚';
      } else if (diff < 3600000) { // 1小时内
        return Math.floor(diff / 60000) + '分钟前';
      } else if (diff < 86400000) { // 24小时内
        return Math.floor(diff / 3600000) + '小时前';
      } else {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      }
    };

    // ==================== 语音播报功能 ====================
    
    // 初始化语音合成
    const initSpeechSynthesis = () => {
      if ('speechSynthesis' in window) {
        speechSynthesis = window.speechSynthesis;
        return true;
      } else {
        ElMessage.error('您的浏览器不支持语音播报功能');
        return false;
      }
    };

    // 开启/关闭语音播报
    const toggleVoiceNotification = () => {
      if (!initSpeechSynthesis()) return;
      
      isVoiceEnabled.value = !isVoiceEnabled.value;
      
      if (isVoiceEnabled.value) {
        startVoiceNotification();
        ElMessage.success('语音播报已开启');
      } else {
        stopVoiceNotification();
        ElMessage.info('语音播报已关闭');
      }
      
      // 保存设置到本地存储
      localStorage.setItem('voiceNotificationEnabled', isVoiceEnabled.value);
    };

    // 开始语音播报
    const startVoiceNotification = () => {
      checkForVoiceNotifications();
      voiceCheckInterval = setInterval(checkForVoiceNotifications, 60000); // 每1分钟检查一次
    };

    // 停止语音播报
    const stopVoiceNotification = () => {
      if (voiceCheckInterval) {
        clearInterval(voiceCheckInterval);
        voiceCheckInterval = null;
      }
      
      if (currentUtterance) {
        speechSynthesis.cancel();
        currentUtterance = null;
        currentVoicePlaying.value = null;
        voicePlayProgress.value = 0;
      }
    };

    // 检查语音通知
    const checkForVoiceNotifications = async () => {
      try {
        const response = await adminApi.getVoiceNotifications();
        if (response && response.code === 200) {
          const newNotifications = response.data || [];
          
          // 过滤掉已经在队列中的通知
          const existingIds = pendingVoiceNotifications.value.map(n => n.id);
          const reallyNewNotifications = newNotifications.filter(n => !existingIds.includes(n.id));
          
          if (reallyNewNotifications.length > 0) {
            pendingVoiceNotifications.value.push(...reallyNewNotifications);
            
            // 如果当前没有在播放，开始播放
            if (!currentVoicePlaying.value) {
              playNextVoiceNotification();
            }
          }
        }
      } catch (error) {
        console.error('检查语音通知失败:', error);
      }
    };

    // 播放下一个语音通知
    const playNextVoiceNotification = () => {
      if (pendingVoiceNotifications.value.length === 0) {
        currentVoicePlaying.value = null;
        voicePlayProgress.value = 0;
        return;
      }

      const notification = pendingVoiceNotifications.value.shift();
      playVoiceNotification(notification);
    };

    // 播放单个语音通知
    const playVoiceNotification = (notification) => {
      if (!speechSynthesis) return;

      currentVoicePlaying.value = notification;
      voicePlayProgress.value = 0;

      const text = notification.voice_text || notification.content || notification.title;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      // 播放进度模拟
      const duration = text.length * 150;
      const progressInterval = setInterval(() => {
        voicePlayProgress.value += 2;
        if (voicePlayProgress.value >= 100) {
          clearInterval(progressInterval);
        }
      }, duration / 50);

      utterance.onend = () => {
        clearInterval(progressInterval);
        voicePlayProgress.value = 100;
        
        // 标记通知已播放
        markVoiceNotificationPlayed(notification.id);
        
        // 播放下一个通知
        setTimeout(() => {
          playNextVoiceNotification();
        }, 1000);
      };

      utterance.onerror = (event) => {
        clearInterval(progressInterval);
        console.error('语音播报错误:', event);
        ElMessage.error('语音播报失败');
        playNextVoiceNotification();
      };

      currentUtterance = utterance;
      speechSynthesis.speak(utterance);
    };

    // 播放所有语音通知
    const playAllVoiceNotifications = () => {
      if (!currentVoicePlaying.value && pendingVoiceNotifications.value.length > 0) {
        playNextVoiceNotification();
      }
    };

    // 标记语音通知已播放
    const markVoiceNotificationPlayed = async (notificationId) => {
      try {
        await adminApi.markVoiceNotificationPlayed({ notification_id: notificationId });
      } catch (error) {
        console.error('标记语音通知已播放失败:', error);
      }
    };

    // 测试语音播报
    const testVoice = async () => {
      if (!voiceTestText.value.trim()) {
        ElMessage.warning('请输入测试文本');
        return;
      }

      voiceTestLoading.value = true;
      
      try {
        const response = await adminApi.testVoiceNotification({ text: voiceTestText.value });
        if (response && response.code === 200) {
          ElMessage.success('测试语音通知已创建');
          showVoiceTestDialog.value = false;
          voiceTestText.value = '';
          
          // 立即检查新通知
          setTimeout(checkForVoiceNotifications, 1000);
        } else {
          ElMessage.error(response.message || '创建测试通知失败');
        }
      } catch (error) {
        console.error('测试语音播报失败:', error);
        ElMessage.error('测试语音播报失败');
      } finally {
        voiceTestLoading.value = false;
      }
    };

    // 组件挂载时初始化
    onMounted(() => {
      fetchNotifications();
      
      // 初始化语音播报
      const savedEnabled = localStorage.getItem('voiceNotificationEnabled');
      if (savedEnabled === 'true') {
        isVoiceEnabled.value = true;
        if (initSpeechSynthesis()) {
          startVoiceNotification();
        }
      }
    });

    // 组件卸载时清理
    onUnmounted(() => {
      stopVoiceNotification();
    });

    return {
      loading,
      markingAllRead,
      notifications,
      filters,
      pagination,
      unreadCount,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      handleNotificationClick,
      handleFilterChange,
      handleSizeChange,
      handleCurrentChange,
      refreshList,
      getTypeColor,
      getTypeText,
      getPriorityColor,
      getPriorityText,
      formatTime,
      // 语音播报相关
      isVoiceEnabled,
      pendingVoiceNotifications,
      currentVoicePlaying,
      voicePlayProgress,
      showVoiceTestDialog,
      voiceTestText,
      voiceTestLoading,
      toggleVoiceNotification,
      playAllVoiceNotifications,
      testVoice
    };
  }
};
</script>

<style scoped>
.notifications-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.voice-controls {
  display: flex;
  gap: 8px;
  margin-right: 15px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.current-playing {
  margin-bottom: 15px;
}

.playing-content {
  margin-top: 8px;
}

.playing-content p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
}

.filter-bar {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 6px;
}

.filter-form {
  margin: 0;
}

.notifications-list {
  min-height: 400px;
}

.notification-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.notification-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.notification-card.unread {
  border-left: 4px solid #409eff;
  background: #f0f9ff;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.notification-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.type-tag {
  margin-right: 4px;
}

.priority-tag {
  margin-right: 8px;
}

.title-text {
  font-weight: 500;
  color: #303133;
  flex: 1;
}

.unread-indicator {
  width: 8px;
  height: 8px;
  background: #f56c6c;
  border-radius: 50%;
  margin-left: 8px;
}

.notification-time {
  color: #909399;
  font-size: 12px;
  white-space: nowrap;
}

.notification-content {
  color: #606266;
  line-height: 1.5;
  margin-bottom: 12px;
}

.notification-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.delete-btn {
  color: #f56c6c;
}

.delete-btn:hover {
  color: #f56c6c;
  background: #fef0f0;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .voice-controls {
    flex-wrap: wrap;
    margin-right: 0;
  }
  
  .notification-header {
    flex-direction: column;
    gap: 8px;
  }
  
  .notification-title {
    flex-wrap: wrap;
  }
}
</style> 