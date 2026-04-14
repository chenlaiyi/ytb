<template>
  <div class="branch-system-config">
    <div class="config-header">
      <h2>分支机构系统配置</h2>
      <p>管理分支机构的基础配置信息</p>
    </div>

    <el-card class="config-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>基础配置</span>
          <el-button 
            type="primary" 
            @click="handleSave" 
            :loading="saving"
            size="small"
          >
            保存配置
          </el-button>
        </div>
      </template>

      <el-form 
        ref="configForm" 
        :model="configData" 
        :rules="rules" 
        label-width="120px"
        class="config-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="机构名称" prop="name">
              <el-input 
                v-model="configData.name" 
                placeholder="请输入机构名称"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="机构代码" prop="code">
              <el-input 
                v-model="configData.code" 
                placeholder="机构代码"
                readonly
                disabled
              >
                <template #suffix>
                  <el-tooltip content="机构代码不可编辑" placement="top">
                    <el-icon><Lock /></el-icon>
                  </el-tooltip>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input 
                v-model="configData.phone" 
                placeholder="请输入联系电话"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系邮箱" prop="email">
              <el-input 
                v-model="configData.email" 
                placeholder="请输入联系邮箱"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="机构地址" prop="address">
          <el-input 
            v-model="configData.address" 
            type="textarea"
            :rows="3"
            placeholder="请输入机构地址"
          />
        </el-form-item>

        <el-form-item label="机构描述" prop="description">
          <el-input 
            v-model="configData.description" 
            type="textarea"
            :rows="4"
            placeholder="请输入机构描述"
          />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="configData.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 站点配置 -->
    <el-card class="config-card" shadow="never" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>站点配置</span>
          <el-button 
            type="primary" 
            @click="handleSave" 
            :loading="saving"
            size="small"
          >
            保存配置
          </el-button>
        </div>
      </template>

      <el-form 
        ref="siteConfigForm" 
        :model="siteData" 
        :rules="siteRules" 
        label-width="120px"
        class="config-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="站点名称" prop="site_name">
              <el-input 
                v-model="siteData.site_name" 
                placeholder="请输入站点名称"
                clearable
              >
                <template #suffix>
                  <el-tooltip content="默认为：公众号名称+管理后台" placement="top">
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="站点图标" prop="site_logo">
              <div class="logo-upload-container">
                <div class="logo-preview" v-if="siteData.site_logo">
                  <el-image 
                    :src="siteData.site_logo" 
                    fit="cover"
                    style="width: 60px; height: 60px; border-radius: 8px;"
                    :preview-src-list="[siteData.site_logo]"
                  />
                </div>
                <div class="logo-upload">
                  <el-input 
                    v-model="siteData.site_logo" 
                    placeholder="请输入站点图标URL或上传图片"
                    clearable
                  >
                    <template #suffix>
                      <el-tooltip content="默认使用公众号头像" placement="top">
                        <el-icon><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </template>
                  </el-input>
                  <el-button 
                    type="primary" 
                    style="margin-top: 8px;" 
                    size="small"
                    @click="handleLogoUpload"
                  >
                    上传图片
                  </el-button>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客服电话" prop="contact_phone">
              <el-input 
                v-model="siteData.contact_phone" 
                placeholder="请输入客服电话"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客服邮箱" prop="contact_email">
              <el-input 
                v-model="siteData.contact_email" 
                placeholder="请输入客服邮箱"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="营业时间" prop="business_hours">
          <el-input 
            v-model="siteData.business_hours" 
            placeholder="例如：周一至周五 9:00-18:00"
            clearable
          />
        </el-form-item>

        <el-form-item label="系统公告" prop="announcement">
          <el-input 
            v-model="siteData.announcement" 
            type="textarea"
            :rows="3"
            placeholder="请输入系统公告内容"
          />
        </el-form-item>

        <el-form-item label="欢迎语" prop="welcome_message">
          <el-input 
            v-model="siteData.welcome_message" 
            type="textarea"
            :rows="2"
            placeholder="请输入用户登录后的欢迎语"
          />
        </el-form-item>

        <el-form-item label="服务特色">
          <el-tag
            v-for="(feature, index) in siteData.service_features"
            :key="index"
            closable
            @close="removeFeature(index)"
            style="margin-right: 8px; margin-bottom: 8px;"
          >
            {{ feature }}
          </el-tag>
          <el-input
            v-if="showFeatureInput"
            ref="featureInput"
            v-model="newFeature"
            size="small"
            style="width: 120px; margin-right: 8px;"
            @keyup.enter="addFeature"
            @blur="addFeature"
          />
          <el-button v-else size="small" @click="showFeatureInput = true">
            + 添加特色
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 微信配置 -->
    <el-card class="config-card" shadow="never" style="margin-top: 20px;">
      <template #header>
        <span>微信公众号配置（第三方平台授权）</span>
      </template>

      <el-form 
        :model="wechatConfig" 
        label-width="120px"
        class="config-form"
      >
        <el-alert
          title="微信配置说明"
          type="info"
          :closable="false"
          style="margin-bottom: 20px;"
        >
          <template #default>
            <p>此分支机构的微信公众号通过第三方平台授权管理，配置信息由微信第三方平台自动同步。</p>
            <p>如需修改微信配置，请前往 <router-link to="/system/wechat-third-party-platform" style="color: #409EFF;">微信第三方平台管理</router-link> 进行操作。</p>
          </template>
        </el-alert>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="AppID">
              <el-input 
                v-model="wechatConfig.app_id" 
                placeholder="微信公众号AppID"
                readonly
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公众号名称">
              <el-input 
                v-model="wechatConfig.nick_name" 
                placeholder="公众号名称"
                readonly
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="原始ID">
              <el-input 
                v-model="wechatConfig.user_name" 
                placeholder="微信原始ID"
                readonly
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主体名称">
              <el-input 
                v-model="wechatConfig.principal_name" 
                placeholder="主体名称"
                readonly
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="公众号类型">
              <el-input 
                v-model="wechatConfig.service_type" 
                placeholder="公众号类型"
                readonly
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="认证状态">
              <el-input 
                v-model="wechatConfig.verify_type" 
                placeholder="认证状态"
                readonly
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="授权状态">
          <el-tag 
            :type="wechatConfig.is_authorized ? 'success' : 'danger'"
            size="large"
          >
            {{ wechatConfig.is_authorized ? '已授权' : '未授权' }}
          </el-tag>
          <span v-if="wechatConfig.authorized_at" style="margin-left: 10px; color: #666;">
            授权时间: {{ wechatConfig.authorized_at }}
          </span>
        </el-form-item>

        <el-form-item label="头像" v-if="wechatConfig.head_img">
          <el-avatar 
            :size="60" 
            :src="wechatConfig.head_img" 
            style="border: 1px solid #dcdfe6;"
          />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, QuestionFilled } from '@element-plus/icons-vue'
import { getBranchSystemConfig, saveBranchSystemConfig } from '@/api/v1/branchManagement'

export default {
  name: 'BranchSystemConfig',
  components: {
    Lock,
    QuestionFilled
  },
  setup() {
    const route = useRoute()
    const branchId = route.params.branchId
    
    const saving = ref(false)
    const loading = ref(false)
    const configForm = ref(null)
    const siteConfigForm = ref(null)
    const featureInput = ref(null)
    const showFeatureInput = ref(false)
    const newFeature = ref('')
    
    // 基础配置数据
    const configData = reactive({
      name: '',
      code: '',
      phone: '',
      email: '',
      address: '',
      description: '',
      status: 'active'
    })
    
    // 站点配置数据
    const siteData = reactive({
      site_name: '',
      site_logo: '',
      contact_phone: '',
      contact_email: '',
      business_hours: '',
      announcement: '',
      welcome_message: '',
      service_features: []
    })
    
    // 微信配置数据
    const wechatConfig = reactive({
      app_id: '',
      app_secret: '',
      token: '',
      encoding_aes_key: '',
      is_authorized: false,
      authorized_at: '',
      nick_name: '',
      head_img: '',
      service_type: '',
      verify_type: '',
      user_name: '',
      principal_name: ''
    })
    
    // 表单验证规则
    const rules = {
      name: [
        { required: true, message: '请输入机构名称', trigger: 'blur' }
      ],
      phone: [
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
      ],
      email: [
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ]
    }
    
    // 站点配置验证规则
    const siteRules = {
      site_name: [
        { required: true, message: '请输入站点名称', trigger: 'blur' }
      ],
      contact_phone: [
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
      ],
      contact_email: [
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ]
    }
    
    // 获取配置数据
    const fetchConfig = async () => {
      try {
        loading.value = true
        const response = await getBranchSystemConfig(branchId)
        
        if (response.code === 0) {
          // 更新基础配置
          Object.assign(configData, response.data.basic)
          
          // 更新站点配置
          if (response.data.site) {
            Object.assign(siteData, response.data.site)
          }
          
          // 更新微信配置
          Object.assign(wechatConfig, response.data.wechat)
        } else {
          ElMessage.error(response.message || '获取配置失败')
        }
      } catch (error) {
        console.error('获取配置失败:', error)
        ElMessage.error('获取配置失败')
      } finally {
        loading.value = false
      }
    }
    
    // 保存配置
    const handleSave = async () => {
      // 验证基础配置表单
      const basicValid = await configForm.value?.validate().catch(() => false)
      // 验证站点配置表单
      const siteValid = await siteConfigForm.value?.validate().catch(() => false)
      
      if (!basicValid || !siteValid) {
        ElMessage.warning('请检查表单填写是否正确')
        return
      }
      
      try {
        saving.value = true
        
        // 合并基础配置和站点配置
        const saveData = {
          ...configData,
          ...siteData
        }
        
        const response = await saveBranchSystemConfig(branchId, saveData)
        
        if (response.code === 0) {
          ElMessage.success('配置保存成功')
          // 重新加载配置
          await fetchConfig()
        } else {
          ElMessage.error(response.message || '保存配置失败')
        }
      } catch (error) {
        console.error('保存配置失败:', error)
        ElMessage.error('保存配置失败')
      } finally {
        saving.value = false
      }
    }
    
    // 处理图标上传
    const handleLogoUpload = () => {
      // TODO: 实现图片上传功能
      ElMessage.info('图片上传功能开发中，请先输入图片URL')
    }
    
    // 添加服务特色
    const addFeature = () => {
      if (newFeature.value && newFeature.value.trim()) {
        siteData.service_features.push(newFeature.value.trim())
        newFeature.value = ''
      }
      showFeatureInput.value = false
    }
    
    // 删除服务特色
    const removeFeature = (index) => {
      siteData.service_features.splice(index, 1)
    }
    
    onMounted(() => {
      fetchConfig()
    })
    
    return {
      branchId,
      saving,
      loading,
      configForm,
      siteConfigForm,
      featureInput,
      showFeatureInput,
      newFeature,
      configData,
      siteData,
      wechatConfig,
      rules,
      siteRules,
      handleSave,
      handleLogoUpload,
      addFeature,
      removeFeature
    }
  }
}
</script>

<style scoped>
.branch-system-config {
  padding: 20px;
}

.config-header {
  margin-bottom: 20px;
}

.config-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 20px;
  font-weight: 500;
}

.config-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.config-card {
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-form {
  padding: 20px 0;
}

.config-form .el-form-item {
  margin-bottom: 22px;
}

.config-form .el-input,
.config-form .el-textarea {
  width: 100%;
}

.logo-upload-container {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.logo-preview {
  flex-shrink: 0;
}

.logo-upload {
  flex: 1;
}
</style> 