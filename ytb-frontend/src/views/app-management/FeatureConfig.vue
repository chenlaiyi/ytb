<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>APP功能配置管理</span>
          <div>
            <el-button type="primary" @click="refreshConfig" :loading="loading">
              刷新配置
            </el-button>
            <el-button type="success" @click="saveConfig" :loading="saveLoading">
              保存配置
            </el-button>
          </div>
        </div>
      </template>

      <- 字段兼容性：添加monthTeamRechargeCount字段映射 快
      <el-row :gutter="20" class="mb-4">
        <el-col :span="12">
          <el-card>
            <template #header>
              <h4>快速操作</h4>
            </template>
            <div class="quick-actions">
              <el-button 
                type="warning" 
                @click="toggleIOSReviewMode(true)"
                :loading="reviewModeLoading"
                class="mb-2"
                style="width: 100%"
              >
                iOS进入审核模式 - 隐藏分红功能
              </el-button>
              <el-button 
                type="success" 
                @click="toggleIOSReviewMode(false)"
                :loading="reviewModeLoading"
                class="mb-2"
                style="width: 100%"
              >
                iOS审核通过 - 恢复所有功能
              </el-button>
              <el-button 
                type="info" 
                @click="toggleAndroidVipCard"
                class="mb-2"
                style="width: 100%"
              >
                切换Android VIP权益卡片
              </el-button>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <h4>当前状态</h4>
            </template>
            <div class="status-info">
              <p><strong>最后更新:</strong> {{ lastUpdated }}</p>
              <p><strong>配置版本:</strong> {{ configVersion }}</p>
              <p><strong>iOS审核模式:</strong> 
                <el-tag :type="iosReviewMode ? 'warning' : 'success'">
                  {{ iosReviewMode ? '审核中' : '正常' }}
                </el-tag>
              </p>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <- 字段兼容性：添加monthTeamRechargeCount字段映射 Android平
      <el-card class="mb-4">
        <template #header>
          <h4>Android平台配置</h4>
        </template>
        <el-row :gutter="20">
          <el-col :span="6" v-for="(value, key) in androidConfig" :key="key">
            <div class="config-item">
              <div class="config-label">{{ getConfigLabel(key) }}</div>
              <el-switch
                v-model="androidConfig[key]"
                :active-text="androidConfig[key] ? '启用' : '禁用'"
                active-color="#13ce66"
                inactive-color="#ff4949"
              />
            </div>
          </el-col>
        </el-row>
      </el-card>

      <- 字段兼容性：添加monthTeamRechargeCount字段映射 iOS平
      <el-card class="mb-4">
        <template #header>
          <h4>iOS平台配置</h4>
        </template>
        <el-row :gutter="20">
          <el-col :span="6" v-for="(value, key) in iosConfig" :key="key">
            <div class="config-item">
              <div class="config-label">{{ getConfigLabel(key) }}</div>
              <el-switch
                v-model="iosConfig[key]"
                :active-text="iosConfig[key] ? '启用' : '禁用'"
                active-color="#13ce66"
                inactive-color="#ff4949"
              />
            </div>
          </el-col>
        </el-row>
      </el-card>

      <- 字段兼容性：添加monthTeamRechargeCount字段映射 配
      <el-card>
        <template #header>
          <h4>配置预览</h4>
        </template>
        <el-tabs v-model="previewTab">
          <el-tab-pane label="Android配置" name="android">
            <pre>{{ JSON.stringify(androidConfig, null, 2) }}</pre>
          </el-tab-pane>
          <el-tab-pane label="iOS配置" name="ios">
            <pre>{{ JSON.stringify(iosConfig, null, 2) }}</pre>
          </el-tab-pane>
          <el-tab-pane label="完整配置" name="full">
            <pre>{{ JSON.stringify(fullConfig, null, 2) }}</pre>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </el-card>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

export default defineComponent({
  name: 'FeatureConfig',
  setup() {
    // 响应式数据
    const loading = ref(false)
    const saveLoading = ref(false)
    const reviewModeLoading = ref(false)
    const previewTab = ref('android')

    const androidConfig = reactive({
      show_dividend_card: true,
      show_vip_benefits_card: false,
      show_team_info_card: true,
      show_recruit_button: true
    })

    const iosConfig = reactive({
      show_dividend_card: false,
      show_vip_benefits_card: true,
      show_team_info_card: false,
      show_recruit_button: false
    })

    const configMeta = ref({
      last_updated: '',
      version: '1.0.0'
    })

    // 计算属性
    const lastUpdated = computed(() => {
      return configMeta.value.last_updated ? 
        new Date(configMeta.value.last_updated).toLocaleString() : 
        '未知'
    })

    const configVersion = computed(() => configMeta.value.version)

    const iosReviewMode = computed(() => {
             iosConfig.show_vip_benefits_card
    })

    const fullConfig = computed(() => ({
      platform_specific: {
        android: androidConfig,
        ios: iosConfig
      },
      meta: configMeta.value
    }))

    // 配置标签映射
    const configLabels = {
      show_dividend_card: '分红卡片',
      show_vip_benefits_card: 'VIP权益卡片',
      show_team_info_card: '团队信息卡片',
      show_recruit_button: '招募按钮'
    }

    // 方法
    const getConfigLabel = (key) => configLabels[key] || key

    const refreshConfig = async () => {
      loading.value = true
      try {
        const response = await axios.get('/api/app/v1/config/features')
        if (response.data.success) {
          const config = response.data.data
          
          // 更新Android配置
          Object.assign(androidConfig, config.platform_specific?.android || {})
          
          // 更新iOS配置
          Object.assign(iosConfig, config.platform_specific?.ios || {})
          
          // 更新元数据
          configMeta.value = {
            last_updated: config.last_updated,
            version: config.version
          }
          
          ElMessage.success('配置刷新成功')
        } else {
          ElMessage.error('获取配置失败: ' + response.data.message)
        }
      } catch (error) {
        console.error('刷新配置失败:', error)
        ElMessage.error('刷新配置失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    const saveConfig = async () => {
      saveLoading.value = true
      try {
        const config = {
          platform_specific: {
            android: { ...androidConfig },
            ios: { ...iosConfig }
          }
        }
        
        const response = await axios.post('/api/app/v1/config/features', config)
        if (response.data.success) {
          ElMessage.success('配置保存成功！APP将在下次启动时生效。')
          await refreshConfig()
        } else {
          ElMessage.error('保存配置失败: ' + response.data.message)
        }
      } catch (error) {
        console.error('保存配置失败:', error)
        ElMessage.error('保存配置失败: ' + error.message)
      } finally {
        saveLoading.value = false
      }
    }

    const toggleIOSReviewMode = async (reviewMode) => {
      try {
        await ElMessageBox.confirm(
          reviewMode ? 
            '确定要启用iOS审核模式吗？这将隐藏所有分红功能。' : 
            '确定要退出iOS审核模式吗？这将恢复所有功能。',
          '确认操作',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        reviewModeLoading.value = true
        
        const response = await axios.post('/api/app/v1/config/features/ios-review-mode', {
          review_mode: reviewMode
        })
        
        if (response.data.success) {
          ElMessage.success(response.data.message)
          await refreshConfig()
        } else {
          ElMessage.error('操作失败: ' + response.data.message)
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('切换审核模式失败:', error)
          ElMessage.error('操作失败: ' + error.message)
        }
      } finally {
        reviewModeLoading.value = false
      }
    }

    const toggleAndroidVipCard = () => {
      ElMessage.info(`Android VIP权益卡片已${androidConfig.show_vip_benefits_card ? '启用' : '禁用'}，请保存配置`)
    }

    // 生命周期
    onMounted(() => {
      refreshConfig()
    })

    return {
      loading,
      saveLoading,
      reviewModeLoading,
      previewTab,
      androidConfig,
      iosConfig,
      configMeta,
      lastUpdated,
      configVersion,
      iosReviewMode,
      fullConfig,
      getConfigLabel,
      refreshConfig,
      saveConfig,
      toggleIOSReviewMode,
      toggleAndroidVipCard
    }
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-actions .el-button {
  margin-bottom: 8px;
}

.config-item {
  text-align: center;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 16px;
}

.config-label {
  margin-bottom: 8px;
  font-weight: 500;
  color: #606266;
}

.status-info p {
  margin: 8px 0;
  color: #606266;
}

pre {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
