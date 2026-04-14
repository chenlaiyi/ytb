<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>点点够 APP管理</span>
          <div class="header-actions">
            <el-button type="primary" icon="Refresh" @click="refreshData" :loading="refreshing">刷新数据</el-button>
          </div>
        </div>
      </template>

      <!-- 统计概览 -->
      <div class="stats-overview mb-6">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-item">
                <div class="stat-icon ios">
                  <el-icon><Platform /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ stats.ios.downloads || 0 }}</div>
                  <div class="stat-label">iOS下载量</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-item">
                <div class="stat-icon android">
                  <el-icon><Platform /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ stats.android.downloads || 0 }}</div>
                  <div class="stat-label">安卓下载量</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-item">
                <div class="stat-icon harmony">
                  <el-icon><Platform /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ stats.harmony.downloads || 0 }}</div>
                  <div class="stat-label">鸿蒙下载量</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-item">
                <div class="stat-icon h5">
                  <el-icon><Monitor /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ stats.h5.visits || 0 }}</div>
                  <div class="stat-label">H5访问量</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 功能模块标签页 -->
      <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
        <!-- 版本管理 -->
        <el-tab-pane label="版本管理" name="versions">
          <version-management v-if="activeTab === 'versions'" />
        </el-tab-pane>

        <!-- 通知管理 -->
        <el-tab-pane label="通知管理" name="notifications">
          <notification-management v-if="activeTab === 'notifications'" />
        </el-tab-pane>
        
        <!-- Banner管理 -->
        <el-tab-pane label="Banner管理" name="banners">
          <banner-management v-if="activeTab === 'banners'" />
        </el-tab-pane>
        
        <el-tab-pane label="APP导航" name="navigation">
          <navigation-management v-if="activeTab === 'navigation'" />
        </el-tab-pane>
        <el-tab-pane label="配置管理" name="config">
          <config-management v-if="activeTab === 'config'" />
        </el-tab-pane>
        <el-tab-pane label="用户反馈" name="feedback">
          <user-feedback v-if="activeTab === 'feedback'" />
        </el-tab-pane>
        <el-tab-pane label="统计分析" name="analytics">
          <analytics v-if="activeTab === 'analytics'" />
        </el-tab-pane>
        <el-tab-pane label="智能客服" name="ai-service">
          <el-tabs v-model="aiActiveTab" type="border-card" v-if="activeTab === 'ai-service'">
            <el-tab-pane label="知识库管理" name="knowledge">
              <ai-knowledge-management v-if="aiActiveTab === 'knowledge'" />
            </el-tab-pane>
            <el-tab-pane label="分类管理" name="categories">
              <ai-category-management v-if="aiActiveTab === 'categories'" />
            </el-tab-pane>
            <el-tab-pane label="聊天监控" name="chat-monitor">
              <ai-chat-monitor v-if="aiActiveTab === 'chat-monitor'" />
            </el-tab-pane>
            <el-tab-pane label="AI配置" name="ai-config">
              <ai-service-config v-if="aiActiveTab === 'ai-config'" />
            </el-tab-pane>
          </el-tabs>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Platform, Monitor } from '@element-plus/icons-vue'
import VersionManagement from './components/VersionManagement.vue'
import NotificationManagement from './components/NotificationManagement.vue'
import BannerManagement from './components/BannerManagement.vue'
import NavigationManagement from './components/NavigationManagement.vue'
import ConfigManagement from './components/ConfigManagement.vue'
import UserFeedback from './components/UserFeedback.vue'
import Analytics from './components/Analytics.vue'
import AiKnowledgeManagement from './components/AiKnowledgeManagement.vue'
import AiCategoryManagement from './components/AiCategoryManagement.vue'
import AiChatMonitor from './components/AiChatMonitor.vue'
import AiServiceConfig from './components/AiServiceConfig.vue'

export default {
  name: 'DiandianAppManagement',
  components: {
    VersionManagement,
    NotificationManagement,
    BannerManagement,
    NavigationManagement,
    ConfigManagement,
    UserFeedback,
    Analytics,
    AiKnowledgeManagement,
    AiCategoryManagement,
    AiChatMonitor,
    AiServiceConfig
  },
  setup() {
    const activeTab = ref('versions')
    const aiActiveTab = ref('knowledge')
    const refreshing = ref(false)

    // 统计数据
    const stats = reactive({
      ios: {
        downloads: 0,
        version: '',
        updateTime: ''
      },
      android: {
        downloads: 0,
        version: '',
        updateTime: ''
      },
      harmony: {
        downloads: 0,
        version: '',
        updateTime: ''
      },
      h5: {
        visits: 0,
        version: '',
        updateTime: ''
      }
    })

    // 获取统计数据
    const fetchStats = async () => {
      try {
        // 引入版本API
        const { versionApi } = await import('@/api/version')
        const response = await versionApi.getPlatformStats()
        
        if (response.code === 200) {
          const data = response.data
          
          // 更新统计数据
          if (data.ios) {
            stats.ios.downloads = data.ios.downloads
            stats.ios.version = data.ios.current_version
          }
          if (data.android) {
            stats.android.downloads = data.android.downloads
            stats.android.version = data.android.current_version
          }
          if (data.harmony) {
            stats.harmony.downloads = data.harmony.downloads
            stats.harmony.version = data.harmony.current_version
          }
          if (data.h5) {
            stats.h5.visits = data.h5.downloads // H5用downloads作为访问量
            stats.h5.version = data.h5.current_version
          }
        } else {
          // 如果API失败，使用默认数据
          stats.ios.downloads = 0
          stats.android.downloads = 0
          stats.harmony.downloads = 0
          stats.h5.visits = 0
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
        ElMessage.error('获取统计数据失败')
        
        // 使用默认数据
        stats.ios.downloads = 0
        stats.android.downloads = 0
        stats.harmony.downloads = 0
        stats.h5.visits = 0
      }
    }

    // 刷新数据
    const refreshData = async () => {
      refreshing.value = true
      try {
        await fetchStats()
        ElMessage.success('数据刷新成功')
      } catch (error) {
        ElMessage.error('数据刷新失败')
      } finally {
        refreshing.value = false
      }
    }

    // 标签页切换
    const handleTabChange = (tabName) => {
      console.log('切换到标签页:', tabName)
    }

    onMounted(() => {
      fetchStats()
    })

    return {
      activeTab,
      aiActiveTab,
      refreshing,
      stats,
      refreshData,
      handleTabChange
    }
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-overview {
  margin-bottom: 24px;
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
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.stat-icon.ios {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.android {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.harmony {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-icon.h5 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
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

.mb-6 {
  margin-bottom: 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-overview .el-col {
    margin-bottom: 16px;
  }
  
  .stat-item {
    padding: 16px;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 20px;
    margin-right: 12px;
  }
  
  .stat-value {
    font-size: 24px;
  }
}
</style>
