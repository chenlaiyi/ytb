<template>
  <div class="oss-config-container">
    <!-- OSS配置卡片 -->
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>阿里云OSS存储配置</span>
          <div class="header-actions">
            <el-button 
              type="success" 
              :loading="testLoading"
              @click="testConnection"
              :disabled="!canTest"
            >
              测试连接
            </el-button>
            <el-button 
              type="primary" 
              :loading="saveLoading"
              @click="saveConfig"
            >
              保存配置
            </el-button>
          </div>
        </div>
      </template>

      <el-form
        ref="configFormRef"
        :model="configForm"
        :rules="rules"
        label-width="160px"
        v-loading="loading"
        class="oss-config-form"
      >
        <!-- 启用开关 -->
        <el-form-item label="启用OSS存储">
          <el-switch 
            v-model="configForm.enabled"
            active-text="启用"
            inactive-text="禁用"
          />
          <div class="form-tip">
            启用后，系统所有上传文件将存储到阿里云OSS，减少本地存储压力
          </div>
        </el-form-item>

        <el-divider content-position="left">OSS访问凭证</el-divider>

        <el-form-item label="AccessKey ID" prop="access_key_id">
          <el-input 
            v-model="configForm.access_key_id"
            placeholder="请输入阿里云AccessKey ID"
            :disabled="!configForm.enabled"
          >
            <template #suffix>
              <el-tooltip content="从阿里云控制台获取" placement="top">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="AccessKey Secret" prop="access_key_secret">
          <el-input 
            v-model="configForm.access_key_secret"
            placeholder="请输入阿里云AccessKey Secret"
            show-password
            :disabled="!configForm.enabled"
          />
          <div class="form-tip">
            如不修改密钥请留空，系统将使用已保存的密钥
          </div>
        </el-form-item>

        <el-divider content-position="left">OSS Bucket配置</el-divider>

        <el-form-item label="Endpoint" prop="endpoint">
          <el-input 
            v-model="configForm.endpoint"
            placeholder="例如：oss-cn-hangzhou.aliyuncs.com"
            :disabled="!configForm.enabled"
            @blur="cleanEndpoint"
          >
            <template #prepend>https://</template>
          </el-input>
          <div class="form-tip">
            OSS服务域名，根据您创建Bucket的区域选择，如：oss-cn-hangzhou.aliyuncs.com
          </div>
        </el-form-item>

        <el-form-item label="Bucket名称" prop="bucket">
          <el-input 
            v-model="configForm.bucket"
            placeholder="例如：my-bucket-name（仅填名称，不是完整域名）"
            :disabled="!configForm.enabled"
            @blur="cleanBucket"
          />
          <div class="form-tip">
            <span class="tip-warning">注意：只填Bucket名称（如 my-bucket），不要填完整域名</span>
          </div>
        </el-form-item>

        <el-form-item label="自定义域名">
          <el-input 
            v-model="configForm.domain"
            placeholder="例如：https://cdn.example.com"
            :disabled="!configForm.enabled"
          />
          <div class="form-tip">
            可选，配置CDN加速域名或自定义域名，留空则使用OSS默认域名
          </div>
        </el-form-item>

        <el-form-item label="存储路径前缀">
          <el-input 
            v-model="configForm.path_prefix"
            placeholder="例如：uploads"
            :disabled="!configForm.enabled"
          />
          <div class="form-tip">
            文件存储的根目录，默认为 uploads
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 使用统计卡片 -->
    <el-card class="box-card stats-card" v-if="configForm.enabled && ossStats.enabled">
      <template #header>
        <div class="card-header">
          <span>OSS使用统计</span>
          <el-button type="text" @click="fetchStats" :loading="statsLoading">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-value">{{ ossStats.bucket || '-' }}</div>
            <div class="stat-label">Bucket</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-value">{{ ossStats.file_count || 0 }}</div>
            <div class="stat-label">文件数量</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-value">{{ ossStats.total_size_formatted || '0 B' }}</div>
            <div class="stat-label">存储大小</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 本地存储迁移卡片 -->
    <el-card class="box-card migrate-card" v-if="configForm.enabled">
      <template #header>
        <div class="card-header">
          <span>本地存储迁移</span>
        </div>
      </template>

      <el-alert
        title="迁移说明"
        type="info"
        :closable="false"
        show-icon
        class="migrate-alert"
      >
        <p>启用OSS后，新上传的文件将自动存储到OSS。</p>
        <p>如需迁移历史文件，建议使用阿里云ossutil工具进行批量迁移，以获得更好的性能和稳定性。</p>
      </el-alert>

      <el-form label-width="120px" class="migrate-form">
        <el-form-item label="迁移目录">
          <el-input 
            v-model="migrateFolder"
            placeholder="例如：common/uploads"
            style="width: 300px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="warning" @click="checkMigration" :loading="migrateLoading">
            <el-icon><FolderOpened /></el-icon>
            分析本地文件
          </el-button>
        </el-form-item>
      </el-form>

      <div v-if="migrateStats" class="migrate-stats">
        <el-descriptions title="本地文件统计" :column="2" border>
          <el-descriptions-item label="目录">{{ migrateStats.folder }}</el-descriptions-item>
          <el-descriptions-item label="文件数量">{{ migrateStats.file_count }} 个</el-descriptions-item>
          <el-descriptions-item label="总大小">{{ migrateStats.total_size_formatted }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ migrateStats.note }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <!-- 配置说明卡片 -->
    <el-card class="box-card help-card">
      <template #header>
        <div class="card-header">
          <span>配置说明</span>
        </div>
      </template>

      <el-collapse v-model="helpActiveNames">
        <el-collapse-item title="如何获取AccessKey" name="1">
          <ol>
            <li>登录阿里云控制台</li>
            <li>点击右上角头像，选择"AccessKey 管理"</li>
            <li>创建AccessKey，获取AccessKey ID和Secret</li>
            <li>建议使用RAM子账号，并只授予OSS相关权限</li>
          </ol>
        </el-collapse-item>
        <el-collapse-item title="如何创建Bucket" name="2">
          <ol>
            <li>进入阿里云OSS控制台</li>
            <li>点击"创建Bucket"</li>
            <li>选择区域（建议选择与服务器同区域）</li>
            <li>设置读写权限为"公共读"（用于图片访问）</li>
            <li>创建成功后记录Bucket名称和Endpoint</li>
          </ol>
        </el-collapse-item>
        <el-collapse-item title="推荐的权限策略" name="3">
          <pre class="policy-code">{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "oss:PutObject",
        "oss:GetObject",
        "oss:DeleteObject",
        "oss:ListObjects"
      ],
      "Resource": [
        "acs:oss:*:*:your-bucket-name",
        "acs:oss:*:*:your-bucket-name/*"
      ]
    }
  ]
}</pre>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { QuestionFilled, Refresh, FolderOpened } from '@element-plus/icons-vue';
import { 
  getOssConfig, 
  saveOssConfig, 
  testOssConnection, 
  getOssStats,
  migrateToOss 
} from '@/api/admin';

export default {
  name: 'OssConfig',
  components: {
    QuestionFilled,
    Refresh,
    FolderOpened
  },
  setup() {
    const loading = ref(false);
    const saveLoading = ref(false);
    const testLoading = ref(false);
    const statsLoading = ref(false);
    const migrateLoading = ref(false);
    
    const configFormRef = ref(null);
    const helpActiveNames = ref([]);
    const migrateFolder = ref('common/uploads');
    const migrateStats = ref(null);

    // 配置表单
    const configForm = reactive({
      enabled: false,
      access_key_id: '',
      access_key_secret: '',
      endpoint: '',
      bucket: '',
      domain: '',
      path_prefix: 'uploads'
    });

    // OSS统计
    const ossStats = reactive({
      enabled: false,
      bucket: '',
      file_count: 0,
      total_size_formatted: ''
    });

    // 表单验证规则
    const rules = {
      access_key_id: [
        { required: true, message: '请输入AccessKey ID', trigger: 'blur' }
      ],
      endpoint: [
        { required: true, message: '请输入Endpoint', trigger: 'blur' }
      ],
      bucket: [
        { required: true, message: '请输入Bucket名称', trigger: 'blur' }
      ]
    };

    // 是否可以测试连接
    const canTest = computed(() => {
      return configForm.enabled && 
             configForm.endpoint && 
             configForm.bucket;
    });

    // 获取配置
    const fetchConfig = async () => {
      loading.value = true;
      try {
        const result = await getOssConfig();
        if (result && result.code === 0 && result.data) {
          const data = result.data;
          configForm.enabled = data.enabled === '1';
          configForm.access_key_id = data.access_key_id_masked || '';
          configForm.access_key_secret = ''; // 密钥不回显
          configForm.endpoint = data.endpoint || '';
          configForm.bucket = data.bucket || '';
          configForm.domain = data.domain || '';
          configForm.path_prefix = data.path_prefix || 'uploads';
        }
      } catch (error) {
        console.error('获取OSS配置失败:', error);
        ElMessage.error('获取配置失败: ' + (error.message || '未知错误'));
      } finally {
        loading.value = false;
      }
    };

    // 保存配置
    const saveConfig = async () => {
      if (!configFormRef.value) return;
      
      // 如果启用了OSS，需要验证表单
      if (configForm.enabled) {
        try {
          await configFormRef.value.validate();
        } catch (e) {
          ElMessage.warning('请填写必填项');
          return;
        }
      }

      saveLoading.value = true;
      try {
        const saveData = {
          enabled: configForm.enabled ? '1' : '0',
          access_key_id: configForm.access_key_id.includes('****') ? '' : configForm.access_key_id,
          access_key_secret: configForm.access_key_secret || '',
          endpoint: configForm.endpoint,
          bucket: configForm.bucket,
          domain: configForm.domain,
          path_prefix: configForm.path_prefix || 'uploads'
        };

        const result = await saveOssConfig(saveData);
        if (result && result.code === 0) {
          ElMessage.success('OSS配置保存成功');
          // 重新获取配置
          await fetchConfig();
          // 如果启用了，获取统计信息
          if (configForm.enabled) {
            await fetchStats();
          }
        } else {
          ElMessage.error(result?.message || '保存失败');
        }
      } catch (error) {
        console.error('保存OSS配置失败:', error);
        ElMessage.error('保存失败: ' + (error.message || '未知错误'));
      } finally {
        saveLoading.value = false;
      }
    };

    // 测试连接
    const testConnection = async () => {
      testLoading.value = true;
      try {
        const testData = {
          access_key_id: configForm.access_key_id,
          access_key_secret: configForm.access_key_secret || '********',
          endpoint: configForm.endpoint,
          bucket: configForm.bucket
        };

        const result = await testOssConnection(testData);
        if (result && result.code === 0) {
          ElMessage.success('OSS连接成功！');
        } else {
          ElMessage.error(result?.message || '连接失败');
        }
      } catch (error) {
        console.error('测试OSS连接失败:', error);
        ElMessage.error('连接测试失败: ' + (error.message || '未知错误'));
      } finally {
        testLoading.value = false;
      }
    };

    // 获取统计信息
    const fetchStats = async () => {
      statsLoading.value = true;
      try {
        const result = await getOssStats();
        if (result && result.code === 0 && result.data) {
          Object.assign(ossStats, result.data);
        }
      } catch (error) {
        console.error('获取OSS统计失败:', error);
      } finally {
        statsLoading.value = false;
      }
    };

    // 检查迁移
    const checkMigration = async () => {
      migrateLoading.value = true;
      migrateStats.value = null;
      try {
        const result = await migrateToOss({ folder: migrateFolder.value });
        if (result && result.code === 0 && result.data) {
          migrateStats.value = result.data;
        } else {
          ElMessage.error(result?.message || '分析失败');
        }
      } catch (error) {
        console.error('分析本地文件失败:', error);
        ElMessage.error('分析失败: ' + (error.message || '未知错误'));
      } finally {
        migrateLoading.value = false;
      }
    };

    // 清理Bucket名称输入
    const cleanBucket = () => {
      let bucket = configForm.bucket.trim();
      
      // 移除 https:// 或 http:// 前缀
      bucket = bucket.replace(/^https?:\/\//, '');
      
      // 如果用户输入了完整域名，提取bucket名称
      const match = bucket.match(/^([a-z0-9][a-z0-9-]{1,61}[a-z0-9])\.oss-/);
      if (match) {
        bucket = match[1];
        ElMessage.warning('已自动提取Bucket名称: ' + bucket);
      }
      
      // 移除可能的域名后缀
      bucket = bucket.replace(/\.oss-.*$/, '');
      
      configForm.bucket = bucket;
    };

    // 清理Endpoint输入
    const cleanEndpoint = () => {
      let endpoint = configForm.endpoint.trim();
      
      // 移除 https:// 或 http:// 前缀
      endpoint = endpoint.replace(/^https?:\/\//, '');
      
      // 移除结尾的斜杠
      endpoint = endpoint.replace(/\/+$/, '');
      
      // 如果 endpoint 以 bucket 名称开头（用户误填了完整域名），自动移除
      const bucket = configForm.bucket.trim();
      if (bucket && endpoint.startsWith(bucket + '.')) {
        endpoint = endpoint.substring(bucket.length + 1);
        ElMessage.warning('已自动移除Endpoint中的Bucket前缀: ' + endpoint);
      }
      
      configForm.endpoint = endpoint;
    };

    onMounted(() => {
      fetchConfig();
    });

    return {
      loading,
      saveLoading,
      testLoading,
      statsLoading,
      migrateLoading,
      configFormRef,
      configForm,
      ossStats,
      rules,
      canTest,
      helpActiveNames,
      migrateFolder,
      migrateStats,
      fetchConfig,
      saveConfig,
      testConnection,
      fetchStats,
      checkMigration,
      cleanBucket,
      cleanEndpoint
    };
  }
};
</script>

<style scoped>
.oss-config-container {
  padding: 20px;
}

.box-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.oss-config-form {
  max-width: 700px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.5;
}

.form-tip .tip-warning {
  color: #e6a23c;
  font-weight: 500;
}

.stats-card .stat-item {
  text-align: center;
  padding: 20px 0;
}

.stats-card .stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}

.stats-card .stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.migrate-card .migrate-alert {
  margin-bottom: 20px;
}

.migrate-card .migrate-alert p {
  margin: 5px 0;
}

.migrate-form {
  margin-bottom: 20px;
}

.migrate-stats {
  margin-top: 20px;
}

.help-card .policy-code {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  white-space: pre;
  margin: 0;
}

.help-card ol {
  padding-left: 20px;
  margin: 0;
}

.help-card li {
  margin: 8px 0;
  color: #606266;
}
</style>
