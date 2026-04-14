<template>
  <div v-if="false" class="voice-notification-container">
    <!-- 语音播报控制按钮 -->
    <div class="voice-controls">
      <el-button 
        :type="isEnabled ? 'primary' : 'default'" 
        :icon="isEnabled ? 'VideoPlay' : 'VideoPause'"
        @click="toggleVoiceNotification"
        size="small"
      >
        {{ isEnabled ? '语音播报已开启' : '语音播报已关闭' }}
      </el-button>
      
      <el-button 
        v-if="isEnabled && pendingNotifications.length > 0"
        type="warning" 
        icon="Bell"
        @click="playAllNotifications"
        size="small"
      >
        播放全部 ({{ pendingNotifications.length }})
      </el-button>

      <el-button 
        type="info" 
        icon="Microphone"
        @click="showTestDialog = true"
        size="small"
      >
        测试语音
      </el-button>
    </div>

    <!-- 当前播放状态 -->
    <div v-if="currentPlaying" class="current-playing">
      <el-alert
        :title="`正在播报: ${currentPlaying.title}`"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <div class="playing-content">
            <p>{{ currentPlaying.voice_text }}</p>
            <el-progress 
              :percentage="playProgress" 
              :show-text="false"
              :stroke-width="4"
            />
          </div>
        </template>
      </el-alert>
    </div>

    <!-- 测试语音对话框 -->
    <el-dialog
      v-model="showTestDialog"
      title="测试语音播报"
      width="500px"
    >
      <el-form @submit.prevent="testVoice">
        <el-form-item label="测试文本">
          <el-input
            v-model="testText"
            type="textarea"
            :rows="3"
            placeholder="请输入要测试的语音文本..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showTestDialog = false">取消</el-button>
        <el-button type="primary" @click="testVoice" :loading="testLoading">
          播放测试
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import adminApi from '@/api/admin';

export default {
  name: 'VoiceNotification',
  setup() {
    const isEnabled = ref(false);
    const pendingNotifications = ref([]);
    const currentPlaying = ref(null);
    const playProgress = ref(0);
    const showTestDialog = ref(false);
    const testText = ref('');
    const testLoading = ref(false);
    
    let checkInterval = null;
    let speechSynthesis = null;
    let currentUtterance = null;

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
      
      isEnabled.value = !isEnabled.value;
      
      if (isEnabled.value) {
        startVoiceNotification();
        ElMessage.success('语音播报已开启');
      } else {
        stopVoiceNotification();
        ElMessage.info('语音播报已关闭');
      }
      
      // 保存设置到本地存储
      localStorage.setItem('voiceNotificationEnabled', isEnabled.value);
    };

    // 开始语音播报
    const startVoiceNotification = () => {
      checkForNewNotifications();
      checkInterval = setInterval(checkForNewNotifications, 30000); // 每30秒检查一次
    };

    // 停止语音播报
    const stopVoiceNotification = () => {
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
      
      if (currentUtterance) {
        speechSynthesis.cancel();
        currentUtterance = null;
        currentPlaying.value = null;
        playProgress.value = 0;
      }
    };

    // 检查新通知
    const checkForNewNotifications = async () => {
      try {
        const response = await adminApi.getVoiceNotifications();
        if (response && response.code === 200) {
          const newNotifications = response.data || [];
          
          // 过滤掉已经在队列中的通知
          const existingIds = pendingNotifications.value.map(n => n.id);
          const reallyNewNotifications = newNotifications.filter(n => !existingIds.includes(n.id));
          
          if (reallyNewNotifications.length > 0) {
            pendingNotifications.value.push(...reallyNewNotifications);
            
            // 如果当前没有在播放，开始播放
            if (!currentPlaying.value) {
              playNextNotification();
            }
          }
        }
      } catch (error) {
        console.error('检查语音通知失败:', error);
      }
    };

    // 播放下一个通知
    const playNextNotification = () => {
      if (pendingNotifications.value.length === 0) {
        currentPlaying.value = null;
        playProgress.value = 0;
        return;
      }

      const notification = pendingNotifications.value.shift();
      playNotification(notification);
    };

    // 播放单个通知
    const playNotification = (notification) => {
      if (!speechSynthesis) return;

      currentPlaying.value = notification;
      playProgress.value = 0;

      const utterance = new SpeechSynthesisUtterance(notification.voice_text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9; // 语速
      utterance.pitch = 1; // 音调
      utterance.volume = 1; // 音量

      // 播放进度模拟
      const duration = notification.voice_text.length * 150; // 估算播放时长
      const progressInterval = setInterval(() => {
        playProgress.value += 2;
        if (playProgress.value >= 100) {
          clearInterval(progressInterval);
        }
      }, duration / 50);

      utterance.onend = () => {
        clearInterval(progressInterval);
        playProgress.value = 100;
        
        // 标记通知已播放
        markNotificationPlayed(notification.id);
        
        // 播放下一个通知
        setTimeout(() => {
          playNextNotification();
        }, 1000);
      };

      utterance.onerror = (event) => {
        clearInterval(progressInterval);
        console.error('语音播报错误:', event);
        ElMessage.error('语音播报失败');
        playNextNotification();
      };

      currentUtterance = utterance;
      speechSynthesis.speak(utterance);
    };

    // 播放所有通知
    const playAllNotifications = () => {
      if (!currentPlaying.value && pendingNotifications.value.length > 0) {
        playNextNotification();
      }
    };

    // 标记通知已播放
    const markNotificationPlayed = async (notificationId) => {
      try {
        await adminApi.markVoiceNotificationPlayed({ notification_id: notificationId });
      } catch (error) {
        console.error('标记通知已播放失败:', error);
      }
    };

    // 测试语音播报
    const testVoice = async () => {
      if (!testText.value.trim()) {
        ElMessage.warning('请输入测试文本');
        return;
      }

      testLoading.value = true;
      
      try {
        const response = await adminApi.testVoiceNotification({ text: testText.value });
        if (response && response.code === 200) {
          ElMessage.success('测试语音通知已创建');
          showTestDialog.value = false;
          testText.value = '';
          
          // 立即检查新通知
          setTimeout(checkForNewNotifications, 1000);
        } else {
          ElMessage.error(response.message || '创建测试通知失败');
        }
      } catch (error) {
        console.error('测试语音播报失败:', error);
        ElMessage.error('测试语音播报失败');
      } finally {
        testLoading.value = false;
      }
    };

    // 组件挂载时初始化
    onMounted(() => {
      // 从本地存储恢复设置
      const savedEnabled = localStorage.getItem('voiceNotificationEnabled');
      if (savedEnabled === 'true') {
        isEnabled.value = true;
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
      isEnabled,
      pendingNotifications,
      currentPlaying,
      playProgress,
      showTestDialog,
      testText,
      testLoading,
      toggleVoiceNotification,
      playAllNotifications,
      testVoice
    };
  }
};
</script>

<style scoped>
.voice-notification-container {
  position: fixed;
  top: 70px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
}

.voice-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.current-playing {
  margin-bottom: 10px;
}

.playing-content {
  margin-top: 8px;
}

.playing-content p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .voice-notification-container {
    position: relative;
    top: auto;
    right: auto;
    max-width: 100%;
    margin: 10px;
  }
  
  .voice-controls {
    justify-content: center;
  }
}
</style> 