<template>
  <div class="config-management">
    <div class="management-header">
      <h3>配置管理</h3>
      <div class="header-actions">
        <el-button type="success" icon="Check" @click="saveAllConfigs" :loading="saveLoading">保存所有配置</el-button>
        <el-button icon="Refresh" @click="refreshData" :loading="refreshing">刷新</el-button>
      </div>
    </div>

    <!-- 配置分类标签 -->
    <el-tabs v-model="activeConfigTab" type="card" @tab-change="handleConfigTabChange">
      <!-- 基础配置 -->
      <el-tab-pane label="基础配置" name="basic">
        <el-card class="config-card">
          <template #header>
            <span>应用基础信息</span>
          </template>
          <el-form :model="basicConfig" label-width="120px" :rules="basicRules" ref="basicFormRef">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="应用名称" prop="appName">
                  <el-input v-model="basicConfig.appName" placeholder="请输入应用名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="应用版本" prop="appVersion">
                  <el-input v-model="basicConfig.appVersion" placeholder="如：1.0.0" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="应用包名" prop="packageName">
                  <el-input v-model="basicConfig.packageName" placeholder="如：com.example.app" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="应用图标" prop="appIcon">
                  <el-upload
                    class="icon-uploader"
                    :show-file-list="false"
                    :on-success="handleIconSuccess"
                    :before-upload="beforeIconUpload"
                    action="/api/upload/icon"
                  >
                    <img v-if="basicConfig.appIcon" :src="basicConfig.appIcon" class="icon-preview" />
                    <el-icon v-else class="icon-uploader-icon"><Plus /></el-icon>
                  </el-upload>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="应用描述" prop="appDescription">
              <el-input v-model="basicConfig.appDescription" type="textarea" :rows="3" 
                       placeholder="请输入应用描述" maxlength="200" show-word-limit />
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 功能配置 -->
      <el-tab-pane label="功能配置" name="features">
        <el-card class="config-card">
          <template #header>
            <span>功能开关</span>
          </template>
          <el-form :model="featureConfig" label-width="150px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="用户注册">
                  <el-switch v-model="featureConfig.userRegister" />
                  <span class="config-desc">是否允许新用户注册</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="第三方登录">
                  <el-switch v-model="featureConfig.thirdPartyLogin" />
                  <span class="config-desc">微信、QQ等第三方登录</span>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="在线支付">
                  <el-switch v-model="featureConfig.onlinePayment" />
                  <span class="config-desc">支付宝、微信支付等</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="积分系统">
                  <el-switch v-model="featureConfig.pointSystem" />
                  <span class="config-desc">用户积分功能</span>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="优惠券">
                  <el-switch v-model="featureConfig.couponSystem" />
                  <span class="config-desc">优惠券发放和使用</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="分享功能">
                  <el-switch v-model="featureConfig.shareFunction" />
                  <span class="config-desc">商品和页面分享</span>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="客服系统">
                  <el-switch v-model="featureConfig.customerService" />
                  <span class="config-desc">在线客服功能</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="消息推送">
                  <el-switch v-model="featureConfig.pushNotification" />
                  <span class="config-desc">APP消息推送</span>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 界面配置 -->
      <el-tab-pane label="界面配置" name="ui">
        <el-card class="config-card">
          <template #header>
            <span>界面主题</span>
          </template>
          <el-form :model="uiConfig" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="主题色">
                  <el-color-picker v-model="uiConfig.primaryColor" />
                  <span class="config-desc">应用主色调</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="辅助色">
                  <el-color-picker v-model="uiConfig.secondaryColor" />
                  <span class="config-desc">按钮、链接等颜色</span>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="背景色">
                  <el-color-picker v-model="uiConfig.backgroundColor" />
                  <span class="config-desc">页面背景颜色</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="文字色">
                  <el-color-picker v-model="uiConfig.textColor" />
                  <span class="config-desc">主要文字颜色</span>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="启动页图片">
              <el-upload
                class="splash-uploader"
                :show-file-list="false"
                :on-success="handleSplashSuccess"
                :before-upload="beforeSplashUpload"
                action="/api/upload/splash"
              >
                <img v-if="uiConfig.splashImage" :src="uiConfig.splashImage" class="splash-preview" />
                <div v-else class="splash-placeholder">
                  <el-icon><Picture /></el-icon>
                  <span>点击上传启动页</span>
                </div>
              </el-upload>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 安全配置 -->
      <el-tab-pane label="安全配置" name="security">
        <el-card class="config-card">
          <template #header>
            <span>安全设置</span>
          </template>
          <el-form :model="securityConfig" label-width="150px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="登录验证码">
                  <el-switch v-model="securityConfig.loginCaptcha" />
                  <span class="config-desc">登录时需要验证码</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="手机验证">
                  <el-switch v-model="securityConfig.phoneVerification" />
                  <span class="config-desc">注册和重要操作需要手机验证</span>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="密码强度检查">
                  <el-switch v-model="securityConfig.passwordStrength" />
                  <span class="config-desc">要求密码包含数字、字母</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="登录失败限制">
                  <el-switch v-model="securityConfig.loginFailLimit" />
                  <span class="config-desc">多次登录失败后锁定账户</span>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="失败次数限制">
                  <el-input-number v-model="securityConfig.maxFailAttempts" :min="3" :max="10" 
                                  :disabled="!securityConfig.loginFailLimit" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="锁定时间(分钟)">
                  <el-input-number v-model="securityConfig.lockDuration" :min="5" :max="60" 
                                  :disabled="!securityConfig.loginFailLimit" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- API配置 -->
      <el-tab-pane label="API配置" name="api">
        <el-card class="config-card">
          <template #header>
            <span>接口配置</span>
          </template>
          <el-form :model="apiConfig" label-width="120px" :rules="apiRules" ref="apiFormRef">
            <el-form-item label="API基础地址" prop="baseUrl">
              <el-input v-model="apiConfig.baseUrl" placeholder="https://api.example.com" />
            </el-form-item>
            <el-form-item label="请求超时(秒)" prop="timeout">
              <el-input-number v-model="apiConfig.timeout" :min="5" :max="60" />
            </el-form-item>
            <el-form-item label="重试次数" prop="retryCount">
              <el-input-number v-model="apiConfig.retryCount" :min="0" :max="5" />
            </el-form-item>
            <el-form-item label="调试模式">
              <el-switch v-model="apiConfig.debugMode" />
              <span class="config-desc">开启后会打印详细日志</span>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Picture } from '@element-plus/icons-vue'

export default {
  name: 'ConfigManagement',
  components: {
    Plus,
    Picture
  },
  setup() {
    const refreshing = ref(false)
    const saveLoading = ref(false)
    const activeConfigTab = ref('basic')

    // 基础配置
    const basicConfig = reactive({
      appName: '点点够',
      appVersion: '1.0.0',
      packageName: 'com.itapgo.diandian',
      appIcon: '',
      appDescription: '一款优质的购物应用'
    })

    // 功能配置
    const featureConfig = reactive({
      userRegister: true,
      thirdPartyLogin: true,
      onlinePayment: true,
      pointSystem: true,
      couponSystem: true,
      shareFunction: true,
      customerService: true,
      pushNotification: true
    })

    // 界面配置
    const uiConfig = reactive({
      primaryColor: '#409eff',
      secondaryColor: '#67c23a',
      backgroundColor: '#f5f7fa',
      textColor: '#303133',
      splashImage: ''
    })

    // 安全配置
    const securityConfig = reactive({
      loginCaptcha: true,
      phoneVerification: true,
      passwordStrength: true,
      loginFailLimit: true,
      maxFailAttempts: 5,
      lockDuration: 30
    })

    // API配置
    const apiConfig = reactive({
      baseUrl: 'https://api.itapgo.com',
      timeout: 30,
      retryCount: 3,
      debugMode: false
    })

    // 表单验证规则
    const basicRules = {
      appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
      appVersion: [
        { required: true, message: '请输入应用版本', trigger: 'blur' },
        { pattern: /^\d+\.\d+\.\d+$/, message: '版本号格式不正确，如：1.0.0', trigger: 'blur' }
      ],
      packageName: [
        { required: true, message: '请输入应用包名', trigger: 'blur' },
        { pattern: /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/, message: '包名格式不正确', trigger: 'blur' }
      ]
    }

    const apiRules = {
      baseUrl: [
        { required: true, message: '请输入API基础地址', trigger: 'blur' },
        { type: 'url', message: '请输入正确的URL格式', trigger: 'blur' }
      ],
      timeout: [{ required: true, message: '请设置请求超时时间', trigger: 'blur' }],
      retryCount: [{ required: true, message: '请设置重试次数', trigger: 'blur' }]
    }

    const basicFormRef = ref()
    const apiFormRef = ref()

    // 方法
    const refreshData = async () => {
      refreshing.value = true
      try {
        // 模拟刷新数据
        await new Promise(resolve => setTimeout(resolve, 1000))
        ElMessage.success('配置数据刷新成功')
      } catch (error) {
        ElMessage.error('配置数据刷新失败')
      } finally {
        refreshing.value = false
      }
    }

    const handleConfigTabChange = (tabName) => {
      console.log('切换到配置标签:', tabName)
    }

    const handleIconSuccess = (response, file) => {
      if (response.code === 200) {
        basicConfig.appIcon = response.data.url
        ElMessage.success('图标上传成功')
      } else {
        ElMessage.error('图标上传失败')
      }
    }

    const beforeIconUpload = (file) => {
      const isImage = file.type.startsWith('image/')
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isImage) {
        ElMessage.error('只能上传图片文件!')
        return false
      }
      if (!isLt2M) {
        ElMessage.error('图片大小不能超过 2MB!')
        return false
      }
      return true
    }

    const handleSplashSuccess = (response, file) => {
      if (response.code === 200) {
        uiConfig.splashImage = response.data.url
        ElMessage.success('启动页上传成功')
      } else {
        ElMessage.error('启动页上传失败')
      }
    }

    const beforeSplashUpload = (file) => {
      const isImage = file.type.startsWith('image/')
      const isLt5M = file.size / 1024 / 1024 < 5

      if (!isImage) {
        ElMessage.error('只能上传图片文件!')
        return false
      }
      if (!isLt5M) {
        ElMessage.error('图片大小不能超过 5MB!')
        return false
      }
      return true
    }

    const saveAllConfigs = async () => {
      // 验证表单
      const basicValid = await basicFormRef.value?.validate().catch(() => false)
      const apiValid = await apiFormRef.value?.validate().catch(() => false)

      if (!basicValid || !apiValid) {
        ElMessage.error('请检查配置信息是否正确')
        return
      }

      saveLoading.value = true
      try {
        // 模拟保存配置
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const configData = {
          basic: basicConfig,
          features: featureConfig,
          ui: uiConfig,
          security: securityConfig,
          api: apiConfig
        }
        
        console.log('保存配置数据:', configData)
        ElMessage.success('所有配置保存成功')
      } catch (error) {
        ElMessage.error('配置保存失败')
      } finally {
        saveLoading.value = false
      }
    }

    onMounted(() => {
      // 初始化时可以从API加载配置
    })

    return {
      refreshing,
      saveLoading,
      activeConfigTab,
      basicConfig,
      featureConfig,
      uiConfig,
      securityConfig,
      apiConfig,
      basicRules,
      apiRules,
      basicFormRef,
      apiFormRef,
      refreshData,
      handleConfigTabChange,
      handleIconSuccess,
      beforeIconUpload,
      handleSplashSuccess,
      beforeSplashUpload,
      saveAllConfigs
    }
  }
}
</script>

<style scoped>
.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.management-header h3 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.config-card {
  margin-bottom: 20px;
}

.config-desc {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

.icon-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.icon-uploader:hover {
  border-color: #409eff;
}

.icon-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 80px;
  height: 80px;
  text-align: center;
  line-height: 80px;
}

.icon-preview {
  width: 80px;
  height: 80px;
  display: block;
  object-fit: cover;
}

.splash-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  width: 200px;
  height: 300px;
}

.splash-uploader:hover {
  border-color: #409eff;
}

.splash-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8c939d;
}

.splash-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.splash-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .management-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
