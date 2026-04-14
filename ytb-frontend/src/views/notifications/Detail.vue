<template>
  <div class="notification-detail">
    <div class="page-header">
      <el-page-header @back="goBack" content="通知详情" />
    </div>

    <div class="detail-container" v-loading="loading">
      <el-card v-if="notification" class="notification-card">
        <template #header>
          <div class="card-header">
            <h3>{{ notification.title }}</h3>
            <div class="notification-meta">
              <el-tag :type="notification.is_read ? 'info' : 'warning'">
                {{ notification.is_read ? '已读' : '未读' }}
              </el-tag>
              <span class="time">{{ formatTime(notification.created_at) }}</span>
            </div>
          </div>
        </template>

        <div class="notification-content">
          <div class="content-text" v-html="notification.content"></div>
          
          <div v-if="notification.action_url" class="action-section">
            <el-divider />
            <el-button type="primary" @click="handleAction">
              查看相关内容
            </el-button>
          </div>
        </div>

        <div class="notification-footer">
          <el-divider />
          <div class="footer-actions">
            <el-button v-if="!notification.is_read" type="success" @click="markAsRead">
              标记为已读
            </el-button>
            <el-button @click="goBack">返回</el-button>
          </div>
        </div>
      </el-card>

      <el-empty v-else-if="!loading" description="通知不存在或已被删除" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import adminApi from '@/api/admin';

export default {
  name: 'NotificationDetail',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const loading = ref(false);
    const notification = ref(null);

    // 获取通知详情
    const fetchNotification = async () => {
      try {
        loading.value = true;
        const response = await adminApi.getNotificationDetail(route.params.id);
        
        if (response && (response.code === 0 || response.code === 200)) {
          notification.value = response.data;
          
          // 如果是未读通知，自动标记为已读
          if (!notification.value.is_read) {
            await markAsRead(false);
          }
        } else {
          ElMessage.error('获取通知详情失败: ' + (response?.message || '未知错误'));
        }
      } catch (error) {
        console.error('获取通知详情失败:', error);
        ElMessage.error('获取通知详情失败: ' + (error.message || '网络错误'));
      } finally {
        loading.value = false;
      }
    };

    // 标记为已读
    const markAsRead = async (showMessage = true) => {
      try {
        const response = await adminApi.markNotificationAsRead(route.params.id);
        
        if (response && (response.code === 0 || response.code === 200)) {
          if (notification.value) {
            notification.value.is_read = true;
          }
          if (showMessage) {
            ElMessage.success('已标记为已读');
          }
        } else {
          if (showMessage) {
            ElMessage.error('操作失败: ' + (response?.message || '未知错误'));
          }
        }
      } catch (error) {
        console.error('标记已读失败:', error);
        if (showMessage) {
          ElMessage.error('操作失败: ' + (error.message || '网络错误'));
        }
      }
    };

    // 处理操作按钮点击
    const handleAction = () => {
      if (notification.value?.action_url) {
        router.push(notification.value.action_url);
      }
    };

    // 返回上一页
    const goBack = () => {
      router.back();
    };

    // 格式化时间
    const formatTime = (timeString) => {
      if (!timeString) return '';
      
      const time = new Date(timeString);
      const now = new Date();
      const diff = now - time;
      
      // 小于1分钟
      if (diff < 60000) {
        return '刚刚';
      }
      
      // 小于1小时
      if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}分钟前`;
      }
      
      // 小于1天
      if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)}小时前`;
      }
      
      // 小于7天
      if (diff < 604800000) {
        return `${Math.floor(diff / 86400000)}天前`;
      }
      
      // 超过7天显示具体日期
      return time.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    onMounted(() => {
      fetchNotification();
    });

    return {
      loading,
      notification,
      markAsRead,
      handleAction,
      goBack,
      formatTime
    };
  }
};
</script>

<style scoped>
.notification-detail {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.detail-container {
  max-width: 800px;
  margin: 0 auto;
}

.notification-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
  flex: 1;
  margin-right: 20px;
}

.notification-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.time {
  color: #909399;
  font-size: 14px;
}

.notification-content {
  padding: 20px 0;
}

.content-text {
  line-height: 1.6;
  color: #606266;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}

.content-text :deep(p) {
  margin: 0 0 12px 0;
}

.content-text :deep(p:last-child) {
  margin-bottom: 0;
}

.action-section {
  margin-top: 20px;
}

.notification-footer {
  margin-top: 20px;
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .notification-detail {
    padding: 10px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .notification-meta {
    align-items: flex-start;
    flex-direction: row;
    gap: 12px;
  }
  
  .footer-actions {
    justify-content: center;
  }
}
</style> 