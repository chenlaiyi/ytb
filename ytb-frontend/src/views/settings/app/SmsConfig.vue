<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>短信服务配置</span>
          <el-button
            style="float: right; padding: 3px 0"
            type="primary"
            @click="saveConfig"
            :loading="saveLoading"
          >
            保存配置
          </el-button>
        </div>
      </template>
      
      <div v-if="loadError" class="error-info">
        错误信息: {{ loadError }}
      </div>
      
      <div class="debugging-info">
        组件状态: {{ loading ? '加载中' : '已加载' }}
        <el-button size="small" @click="logFormChanges">检查表单状态</el-button>
      </div>
      
      <el-form
        ref="configForm"
        :model="configForm"
        label-width="140px"
        v-loading="loading"
        class="sms-config-form"
      >
        <!-- 基础配置 -->
        <h3 class="section-title">基础配置</h3>
        
        <el-form-item label="启用测试模式">
          <el-switch 
            v-model="configForm.enable_test_code"
          />
          <div class="form-tip">
            开启后，验证码会在页面上显示，且不会真正发送短信，仅用于测试和开发
          </div>
        </el-form-item>
        
        <el-form-item label="服务提供商">
          <el-select 
            v-model="configForm.provider"
            placeholder="请选择短信服务提供商"
          >
            <el-option label="阿里云" value="aliyun" />
            <el-option label="腾讯云" value="tencent" disabled />
          </el-select>
        </el-form-item>
        
        <!-- 阿里云配置 -->
        <div v-if="configForm.provider === 'aliyun'">
          <h3 class="section-title">阿里云SMS配置</h3>
          
          <el-form-item label="AccessKey ID" prop="aliyun_sms_access_key_id">
            <el-input 
              v-model="configForm.aliyun_sms_access_key_id" 
              placeholder="请输入阿里云AccessKey ID"
            ></el-input>
          </el-form-item>
          
          <el-form-item label="AccessKey Secret" prop="aliyun_sms_access_key_secret">
            <el-input 
              v-model="configForm.aliyun_sms_access_key_secret" 
              placeholder="请输入阿里云AccessKey Secret"
              show-password
            ></el-input>
          </el-form-item>
          
          <el-form-item label="短信签名" prop="aliyun_sms_sign_name">
            <el-input 
              v-model="configForm.aliyun_sms_sign_name" 
              placeholder="请输入阿里云短信签名"
            ></el-input>
            <div class="form-tip">
              已通过审核的短信签名，例如"点点够"
            </div>
          </el-form-item>
        </div>
        
        <!-- 模板配置 -->
        <h3 class="section-title">短信模板配置</h3>
        <div class="templates-container">
          <div class="templates-header">
            <span class="template-column">模板名称</span>
            <span class="template-column">模板ID</span>
            <span class="template-column">模板用途</span>
            <span class="template-column-action">操作</span>
          </div>
          
          <div 
            v-for="(template, index) in configForm.templates" 
            :key="index" 
            class="template-item"
          >
            <el-input 
              v-model="template.name" 
              placeholder="模板名称"
              class="template-column"
            ></el-input>
            
            <el-input 
              v-model="template.code" 
              placeholder="模板ID"
              class="template-column"
            ></el-input>
            
            <el-select 
              v-model="template.type" 
              placeholder="选择用途"
              class="template-column"
            >
              <el-option label="验证码" value="verify" />
              <el-option label="通知" value="notice" />
              <el-option label="营销" value="marketing" />
            </el-select>
            
            <div class="template-column-action">
              <el-button 
                type="danger" 
                size="small" 
                circle
                @click="removeTemplate(index)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          
          <div class="add-template">
            <el-button type="primary" @click="addTemplate">
              <el-icon><Plus /></el-icon> 添加模板
            </el-button>
          </div>
        </div>
        
        <!-- 测试发送 -->
        <h3 class="section-title">测试发送</h3>
        <div class="test-sms-container">
          <el-form-item label="接收手机号">
            <el-input 
              v-model="testPhone" 
              placeholder="请输入接收短信的手机号"
              maxlength="11"
              style="width: 250px"
            ></el-input>
          </el-form-item>
          
          <el-form-item label="选择模板">
            <el-select 
              v-model="testTemplateIndex" 
              placeholder="选择要测试的模板"
              style="width: 250px"
            >
              <el-option 
                v-for="(template, index) in configForm.templates" 
                :key="index"
                :label="template.name"
                :value="index"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="testSend" :loading="testLoading">
              发送测试短信
            </el-button>
            <div class="form-tip">
              注意：测试发送会产生实际短信费用
            </div>
          </el-form-item>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted, toRefs } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';
import adminApi from '@/api/admin';

export default {
  name: 'SmsConfig',
  components: {
    Plus,
    Delete
  },
  setup() {

    
    const loading = ref(false);
    const saveLoading = ref(false);
    const testLoading = ref(false);
    const testPhone = ref('');
    const testTemplateIndex = ref(null);
    const loadError = ref('');
    
    // 配置表单 - 使用ref而不是reactive
    const configForm = ref({
      provider: 'aliyun',
      enable_test_code: false,
      aliyun_sms_access_key_id: '',
      aliyun_sms_access_key_secret: '',
      aliyun_sms_sign_name: '',
      templates: [{
        name: '验证码模板',
        code: '',
        type: 'verify'
      }]
    });
    
    // 监控表单变化
    const logFormChanges = () => {
      // 调试日志已移除
    };
    
    // 添加模板
    const addTemplate = () => {

      const newTemplate = {
        name: '',
        code: '',
        type: 'verify'
      };
      
      // 使用展开语法确保数组响应性
      configForm.value.templates = [...configForm.value.templates, newTemplate];
      
      logFormChanges();
    };
    
    // 移除模板
    const removeTemplate = (index) => {

      
      // 创建新数组而不是修改原数组
      const newTemplates = [...configForm.value.templates];
      newTemplates.splice(index, 1);
      
      // 更新整个数组
      configForm.value.templates = newTemplates;
      
      // 确保至少有一个模板
      if (configForm.value.templates.length === 0) {
        addTemplate();
      }
      
      logFormChanges();
    };
    
    // 获取短信配置
    const fetchConfig = async () => {
      loading.value = true;
      loadError.value = '';
      
      try {

        // 使用API获取配置
        const result = await adminApi.getModuleConfigs('sms');
        
        if (result && (result.code === 0 || result.code === 200) && result.data) {
          // 解析获取到的配置数据
          parseConfigData(result.data);
          // ElMessage.success('短信配置加载成功'); // 移除页面加载时的成功提示
        } else {
          // 处理错误响应
          const errorMsg = result?.message || '数据格式错误';
          console.error('短信配置API响应错误:', result);
          loadError.value = '获取短信配置失败: ' + errorMsg;
          setDefaultConfig();
          ElMessage.warning('获取短信配置为空，已使用默认值');
        }
      } catch (error) {
        console.error('获取短信配置异常:', error);
        const errorMsg = error.response?.data?.message || error.message || '网络错误';
        loadError.value = '获取短信配置失败: ' + errorMsg;
        setDefaultConfig();
        ElMessage.error('获取短信配置失败: ' + errorMsg);
      } finally {
        loading.value = false;
      }
    };
    
    // 设置默认配置
    const setDefaultConfig = () => {
      configForm.value = {
        provider: 'aliyun',
        enable_test_code: false,
        aliyun_sms_access_key_id: '',
        aliyun_sms_access_key_secret: '',
        aliyun_sms_sign_name: '',
        templates: [{
          name: '验证码模板',
          code: '',
          type: 'verify'
        }]
      };
    };
    
    // 解析配置数据
    const parseConfigData = (data) => {
      if (!data) return;
      
      // 设置基本参数
      configForm.value.provider = data.provider || 'aliyun'; // 默认阿里云
      configForm.value.enable_test_code = data.enable_test_code === '1';
      configForm.value.aliyun_sms_access_key_id = data.access_key_id || '';
      configForm.value.aliyun_sms_access_key_secret = data.access_key_secret || '';
      configForm.value.aliyun_sms_sign_name = data.sign_name || '';
      
      // 处理模板
      if (data.templates) {
        try {
          const templatesData = typeof data.templates === 'string' 
            ? JSON.parse(data.templates) 
            : data.templates;
            
          if (Array.isArray(templatesData) && templatesData.length > 0) {
            configForm.value.templates = [...templatesData];
            return;
          }
        } catch (e) {
          console.error('解析模板数据失败:', e);
        }
      }
      
      // 如果没有模板或解析失败，使用简单模板
      if (data.template_code) {
        configForm.value.templates = [{
          name: '验证码模板',
          code: data.template_code || '',
          type: 'verify'
        }];
      } else {
        // 默认模板
        configForm.value.templates = [{
          name: '验证码模板',
          code: '',
          type: 'verify'
        }];
      }
    };
    
    // 保存短信配置
    const saveConfig = async () => {
      saveLoading.value = true;
      
      try {
        // 准备要保存的数据
        const saveData = {
          provider: configForm.value.provider,
          access_key_id: configForm.value.aliyun_sms_access_key_id,
          access_key_secret: configForm.value.aliyun_sms_access_key_secret,
          sign_name: configForm.value.aliyun_sms_sign_name,
          template_code: configForm.value.templates[0]?.code || '',
          enable_test_code: configForm.value.enable_test_code ? '1' : '0',
          templates: JSON.stringify(configForm.value.templates)
        };
        
        // 使用API保存配置
        const result = await adminApi.saveModuleConfig('sms', saveData);
        
        if (result && result.code === 0) {
          ElMessage.success('短信配置保存成功');
          // 重新获取配置
          await fetchConfig();
        } else {
          ElMessage.error(result?.message || '保存短信配置失败');
        }
      } catch (error) {
        console.error('保存短信配置异常:', error);
        ElMessage.error('保存短信配置失败: ' + (error.message || '未知错误'));
      } finally {
        saveLoading.value = false;
      }
    };
    
    // 测试发送短信
    const testSend = async () => {
      if (!testPhone.value) {
        ElMessage.warning('请输入接收短信的手机号');
        return;
      }
      
      if (testTemplateIndex.value === null) {
        ElMessage.warning('请选择要测试的模板');
        return;
      }
      
      testLoading.value = true;
      
      try {
        const template = configForm.value.templates[testTemplateIndex.value];
        
        // 测试发送请求数据
        const testData = {
          phone: testPhone.value,
          template_code: template.code,
          sign_name: configForm.value.aliyun_sms_sign_name,
          template_param: JSON.stringify({ code: '123456' })
        };
        
        // 使用API发送测试短信
        const result = await adminApi.testSms(testData);
        
        if (result && result.code === 0) {
          ElMessage.success('测试短信发送成功');
        } else {
          ElMessage.error(result?.message || '测试短信发送失败');
        }
      } catch (error) {
        console.error('测试短信异常:', error);
        ElMessage.error('测试短信发送失败: ' + (error.message || '未知错误'));
      } finally {
        testLoading.value = false;
      }
    };
    
    // 初始化时，将设置基础配置
    onMounted(() => {
      
      // 加载短信配置
      fetchConfig();
    });
    
    return {
      loading,
      saveLoading,
      testLoading,
      loadError,
      configForm,
      testPhone,
      testTemplateIndex,
      addTemplate,
      removeTemplate,
      saveConfig,
      testSend
    };
  }
};
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sms-config-form {
  position: relative;
  z-index: 10;
}

.debugging-info {
  background-color: #f0f9eb;
  color: #67c23a;
  padding: 8px 16px;
  margin-bottom: 15px;
  border-radius: 4px;
  font-size: 14px;
}

.error-info {
  background-color: #fef0f0;
  color: #f56c6c;
  padding: 8px 16px;
  margin-bottom: 15px;
  border-radius: 4px;
  font-size: 14px;
}

.section-title {
  margin: 20px 0 15px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  border-left: 4px solid #409eff;
  padding-left: 12px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.templates-container {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 20px;
  padding: 0 0 15px 0;
}

.templates-header {
  display: flex;
  align-items: center;
  background-color: #f5f7fa;
  padding: 10px;
  border-bottom: 1px solid #ebeef5;
  font-weight: 500;
}

.template-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.template-column {
  flex: 1;
  margin: 0 5px;
}

.template-column-action {
  width: 70px;
  text-align: center;
}

.add-template {
  margin-top: 15px;
  text-align: center;
}

.test-sms-container {
  background-color: #f9fafc;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
}
</style> 