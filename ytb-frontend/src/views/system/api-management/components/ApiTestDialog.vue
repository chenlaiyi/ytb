<template>
  <el-dialog
    v-model="dialogVisible"
    title="API接口测试"
    width="80%"
    :before-close="handleClose"
    destroy-on-close
  >
    <div class="api-test-dialog" v-if="apiInfo">
      <!-- API基本信息 -->
      <el-card class="api-info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>接口信息</span>
          </div>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="接口名称">
            {{ apiInfo.name }}
          </el-descriptions-item>
          <el-descriptions-item label="接口类型">
            <el-tag :type="getApiTypeTag(apiInfo.type)">
              {{ getApiTypeLabel(apiInfo.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="请求路径">
            <el-text type="primary" class="api-path">{{ apiInfo.path }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item label="完整URL">
            <el-text type="info" class="api-url">{{ apiInfo.full_url }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item label="支持方法">
            <div class="method-tags">
              <el-tag 
                v-for="method in apiInfo.methods" 
                :key="method"
                :type="getMethodTagType(method)"
                size="small"
                style="margin-right: 4px;"
              >
                {{ method }}
              </el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="控制器">
            {{ apiInfo.controller }}.{{ apiInfo.method }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 测试配置 -->
      <el-card class="test-config-card">
        <template #header>
          <div class="card-header">
            <span>测试配置</span>
            <el-button type="primary" @click="executeTest" :loading="testing">
              <el-icon><VideoPlay /></el-icon>
              执行测试
            </el-button>
          </div>
        </template>

        <el-form :model="testForm" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="请求方法">
                <el-select v-model="testForm.method" style="width: 100%">
                  <el-option 
                    v-for="method in apiInfo.methods" 
                    :key="method"
                    :label="method"
                    :value="method"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="请求URL">
                <el-input v-model="testForm.url" placeholder="请输入完整的API地址" />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 请求参数 -->
          <el-form-item label="请求参数">
            <el-tabs v-model="paramTab" type="border-card">
              <el-tab-pane label="表单参数" name="form">
                <div class="params-config">
                  <div 
                    v-for="(param, index) in testForm.formParams" 
                    :key="index"
                    class="param-item"
                  >
                    <el-input 
                      v-model="param.key" 
                      placeholder="参数名"
                      style="width: 200px; margin-right: 8px;"
                    />
                    <el-input 
                      v-model="param.value" 
                      placeholder="参数值"
                      style="width: 300px; margin-right: 8px;"
                    />
                    <el-button 
                      type="danger" 
                      size="small" 
                      @click="removeFormParam(index)"
                    >
                      删除
                    </el-button>
                  </div>
                  <el-button type="primary" size="small" @click="addFormParam">
                    添加参数
                  </el-button>
                </div>
              </el-tab-pane>
              <el-tab-pane label="JSON参数" name="json">
                <el-input
                  v-model="testForm.jsonParams"
                  type="textarea"
                  :rows="8"
                  placeholder="请输入JSON格式的参数"
                />
              </el-tab-pane>
            </el-tabs>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 测试结果 -->
      <el-card class="test-result-card" v-if="testResult">
        <template #header>
          <div class="card-header">
            <span>测试结果</span>
            <el-tag 
              :type="testResult.success ? 'success' : 'danger'"
              size="large"
            >
              {{ testResult.success ? '成功' : '失败' }}
            </el-tag>
          </div>
        </template>

        <el-tabs type="border-card">
          <el-tab-pane label="响应信息" name="response">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="状态码">
                <el-tag 
                  :type="getStatusCodeType(testResult.data?.response?.status_code)"
                  size="large"
                >
                  {{ testResult.data?.response?.status_code || 'N/A' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="响应时间">
                {{ testResult.data?.response?.response_time || 'N/A' }}
              </el-descriptions-item>
              <el-descriptions-item label="请求URL">
                <el-text type="info" class="request-url">
                  {{ testResult.data?.request?.url }}
                </el-text>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          
          <el-tab-pane label="响应体" name="body">
            <div class="response-body">
              <pre>{{ formatJson(testResult.data?.response?.body) }}</pre>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="executeTest" :loading="testing">
          重新测试
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay } from '@element-plus/icons-vue'
import { testApi } from '../../../../api/v1/apiManagement'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  apiInfo: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'test-complete'])

// 响应式数据
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const testing = ref(false)
const paramTab = ref('form')
const testResult = ref(null)

const testForm = reactive({
  method: 'GET',
  url: '',
  formParams: [],
  jsonParams: '{\n  \n}'
})

// 监听API信息变化
watch(() => props.apiInfo, (newApiInfo) => {
  if (newApiInfo) {
    testForm.method = newApiInfo.methods[0] || 'GET'
    testForm.url = newApiInfo.full_url
    testForm.formParams = []
    testForm.jsonParams = '{\n  \n}'
    testResult.value = null
  }
}, { immediate: true })

// 方法
const getApiTypeLabel = (type) => {
  const labels = {
    'admin_v1': '管理端',
    'mobile_v1': '移动端',
    'legacy_php': 'PHP'
  }
  return labels[type] || type
}

const getApiTypeTag = (type) => {
  const tags = {
    'admin_v1': 'primary',
    'mobile_v1': 'success',
    'legacy_php': 'warning'
  }
  return tags[type] || 'info'
}

const getMethodTagType = (method) => {
  const types = {
    'GET': 'success',
    'POST': 'primary',
    'PUT': 'warning',
    'DELETE': 'danger',
    'PATCH': 'info'
  }
  return types[method] || 'info'
}

const getStatusCodeType = (statusCode) => {
  if (statusCode >= 200 && statusCode < 300) return 'success'
  if (statusCode >= 300 && statusCode < 400) return 'warning'
  if (statusCode >= 400) return 'danger'
  return 'info'
}

const addFormParam = () => {
  testForm.formParams.push({ key: '', value: '' })
}

const removeFormParam = (index) => {
  testForm.formParams.splice(index, 1)
}

const executeTest = async () => {
  testing.value = true
  testResult.value = null

  try {
    // 构建请求参数
    let params = {}
    
    if (paramTab.value === 'form') {
      // 表单参数
      testForm.formParams.forEach(param => {
        if (param.key && param.value) {
          params[param.key] = param.value
        }
      })
    } else {
      // JSON参数
      try {
        params = JSON.parse(testForm.jsonParams)
      } catch (error) {
        ElMessage.error('JSON参数格式错误')
        return
      }
    }

    const response = await testApi({
      method: testForm.method,
      url: testForm.url,
      params
    })

    testResult.value = {
      success: response.code === 200,
      data: response.data,
      message: response.message
    }

    emit('test-complete', testResult.value)
    
    if (response.code === 200) {
      ElMessage.success('API测试完成')
    } else {
      ElMessage.error(response.message || 'API测试失败')
    }
  } catch (error) {
    console.error('API测试失败:', error)
    testResult.value = {
      success: false,
      data: null,
      message: error.message || 'API测试异常'
    }
    ElMessage.error('API测试异常')
  } finally {
    testing.value = false
  }
}

const formatJson = (obj) => {
  if (!obj) return ''
  try {
    return JSON.stringify(obj, null, 2)
  } catch (error) {
    return String(obj)
  }
}

const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style scoped>
.api-test-dialog {
  max-height: 80vh;
  overflow-y: auto;
}

.api-info-card,
.test-config-card,
.test-result-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.api-path,
.api-url {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  word-break: break-all;
}

.method-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.params-config {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  background-color: #fafafa;
}

.param-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.response-body pre {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 400px;
  overflow-y: auto;
}

.request-url {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  word-break: break-all;
}

.dialog-footer {
  text-align: right;
}
</style> 