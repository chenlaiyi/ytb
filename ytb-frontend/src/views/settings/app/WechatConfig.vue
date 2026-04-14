<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>微信登录配置</span>
          <el-button
            style="float: right; padding: 3px 0"
            type="primary"
            @click="handleSave"
            :loading="saveLoading"
          >
            保存配置
          </el-button>
        </div>
      </template>
      
      <div v-if="loadError" class="error-info">
        <el-alert
          :title="loadError"
          type="error"
          show-icon
          :closable="false"
          class="mb-4"
        />
      </div>
      
      <el-form
        ref="configForm"
        :model="configForm"
        label-width="120px"
        v-loading="loading"
      >
        <el-form-item label="启用微信登录">
          <el-switch 
            v-model="configForm.enabled" 
            :active-value="true"
            :inactive-value="false"
          />
        </el-form-item>
        
        <el-form-item label="AppID">
          <el-input 
            v-model="configForm.app_id" 
            placeholder="请输入微信公众平台AppID"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="AppSecret">
          <el-input 
            v-model="configForm.app_secret" 
            placeholder="请输入微信公众平台AppSecret" 
            show-password
          ></el-input>
        </el-form-item>
        
        <el-form-item label="授权回调地址">
          <el-input 
            v-model="configForm.oauth_callback_url" 
            placeholder="请输入授权回调地址"
          >
            <template #prepend>{{ baseUrl }}</template>
          </el-input>
          <div class="form-tip">
            授权回调地址相对路径，自动拼接当前网站域名
          </div>
        </el-form-item>
        
        <el-form-item label="授权二维码">
          <div class="qrcode-container">
            <div id="wechat-qrcode" class="qrcode"></div>
            <el-button type="primary" @click="generateQrCode" :disabled="!isConfigValid">
              生成二维码
            </el-button>
          </div>
          <div class="form-tip">
            可用于测试微信授权登录
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import adminApi from '@/api/admin';

// 延迟导入QRCode，避免在服务器端渲染时出错
let QRCode = null;

export default {
  name: 'WechatConfig',
  setup() {
    const loading = ref(true);
    const saveLoading = ref(false);
    const loadError = ref('');
    const configForm = ref({
      enabled: false,
      app_id: '',
      app_secret: '',
      oauth_callback_url: '/api/auth/wechat/callback'
    });
    const qrcode = ref(null);
    
    // 获取当前网站基础URL，用于拼接回调地址
    const baseUrl = computed(() => {
      return window.location.origin;
    });
    
    // 检查配置是否有效
    const isConfigValid = computed(() => {
      return configForm.value.app_id && 
        configForm.value.app_secret && 
        configForm.value.oauth_callback_url;
    });
    
    // 调试辅助函数
    const logFormState = () => {
      // 调试日志已移除
    };
    
    // 初始化默认值
    const initDefaultValues = () => {
      configForm.value = {
        enabled: false,
        app_id: '',
        app_secret: '',
        oauth_callback_url: '/api/auth/wechat/callback'
      };
    };
    
    // 获取微信配置
    const fetchConfig = async () => {
      loading.value = true;
      loadError.value = '';
      
      try {

        // 使用API获取配置
        const result = await adminApi.getWechatConfig();
        
        if (result && (result.code === 0 || result.code === 200) && result.data) {
          // 确保数据存在，避免读取undefined的属性
          const data = result.data || {};
          configForm.value.enabled = data.enabled === '1';
          configForm.value.app_id = data.app_id || '';
          configForm.value.app_secret = data.app_secret || '';
          configForm.value.oauth_callback_url = data.oauth_callback_url || '/api/auth/wechat/callback';
          

          // ElMessage.success('微信配置加载成功'); // 移除页面加载时的成功提示
          logFormState();
        } else {
          // 处理错误响应
          const errorMsg = result?.message || '数据格式错误';
          console.error('微信配置API响应错误:', result);
          loadError.value = '获取微信配置失败: ' + errorMsg;
          initDefaultValues();
          ElMessage.warning('获取微信配置为空，已使用默认值');
        }
      } catch (error) {
        console.error('获取微信配置出错:', error);
        const errorMsg = error.response?.data?.message || error.message || '网络错误';
        loadError.value = '获取微信配置失败: ' + errorMsg;
        initDefaultValues();
        ElMessage.error('获取微信配置失败: ' + errorMsg);
      } finally {
        loading.value = false;
      }
    };
    
    // 保存微信配置
    const handleSave = async () => {
      saveLoading.value = true;
      
      try {
        // 确保值是字符串类型
        const saveData = {
          enabled: configForm.value.enabled ? '1' : '0',
          app_id: configForm.value.app_id || '',
          app_secret: configForm.value.app_secret || '',
          oauth_callback_url: configForm.value.oauth_callback_url || '/api/auth/wechat/callback'
        };
        
        // 使用API保存配置
        const result = await adminApi.saveWechatConfig(saveData);
        
        if (result && result.code === 0) {
          ElMessage.success('微信配置保存成功');
          await fetchConfig(); // 重新获取配置
        } else {
          ElMessage.error(result?.message || '微信配置保存失败');
        }
      } catch (error) {
        console.error('保存微信配置出错:', error);
        ElMessage.error('微信配置保存失败: ' + (error.message || '未知错误'));
      } finally {
        saveLoading.value = false;
      }
    };
    
    // 生成微信授权二维码
    const generateQrCode = async () => {
      if (!isConfigValid.value) {
        ElMessage.warning('请先填写完整的微信配置信息');
        return;
      }
      
      try {
        // 延迟加载QRCode库
        if (!QRCode) {
          try {
            QRCode = (await import('qrcodejs2')).default;
          } catch (e) {
            console.error('加载QRCode库失败:', e);
            ElMessage.error('生成二维码组件加载失败');
            return;
          }
        }
        
        // 清除旧的二维码
        const qrcodeContainer = document.getElementById('wechat-qrcode');
        if (!qrcodeContainer) {
          console.error('未找到二维码容器元素');
          return;
        }
        qrcodeContainer.innerHTML = '';
        
        // 构建微信授权URL
        const redirectUrl = baseUrl.value + configForm.value.oauth_callback_url;
        const state = Math.random().toString(36).substring(2, 15);
        
        const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${configForm.value.app_id}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`;
        
        // 生成二维码
        qrcode.value = new QRCode(qrcodeContainer, {
          text: authUrl,
          width: 180,
          height: 180,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel ? QRCode.CorrectLevel.H : 2
        });
        
        ElMessage.success('微信授权二维码生成成功');
      } catch (error) {
        console.error('生成二维码出错:', error);
        ElMessage.error('生成二维码失败，请重试');
      }
    };
    
    onMounted(() => {
      // 初始化默认值
      initDefaultValues();
      
      // 尝试获取配置
      fetchConfig().catch(error => {
        console.error('初始化微信配置失败:', error);
      });
    });
    
    return {
      loading,
      saveLoading,
      loadError,
      configForm,
      baseUrl,
      isConfigValid,
      handleSave,
      generateQrCode,
      logFormState
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

.error-info {
  margin-bottom: 15px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.qrcode-container {
  display: flex;
  align-items: center;
  gap: 20px;
}

.qrcode {
  border: 1px solid #EBEEF5;
  padding: 10px;
  border-radius: 4px;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style> 