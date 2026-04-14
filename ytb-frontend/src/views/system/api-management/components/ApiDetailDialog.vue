<template>
  <el-dialog
    v-model="dialogVisible"
    title="API接口详情"
    width="70%"
    :before-close="handleClose"
    destroy-on-close
  >
    <div class="api-detail-dialog" v-if="apiInfo">
      <!-- 基本信息 -->
      <el-card class="detail-card">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
            <el-tag :type="getApiTypeTag(apiInfo.type)">
              {{ getApiTypeLabel(apiInfo.type) }}
            </el-tag>
          </div>
        </template>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="接口名称" :span="2">
            <el-text size="large" tag="strong">{{ apiInfo.name }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item label="接口描述" :span="2">
            {{ apiInfo.description }}
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
            {{ apiInfo.controller }}
          </el-descriptions-item>
          <el-descriptions-item label="方法名">
            {{ apiInfo.method }}
          </el-descriptions-item>
          <el-descriptions-item label="中间件">
            <div v-if="apiInfo.middleware && apiInfo.middleware.length > 0">
              <el-tag 
                v-for="middleware in apiInfo.middleware" 
                :key="middleware"
                type="info"
                size="small"
                style="margin-right: 4px; margin-bottom: 4px;"
              >
                {{ middleware }}
              </el-tag>
            </div>
            <el-text v-else type="info">无中间件</el-text>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 参数信息 -->
      <el-card class="detail-card" v-if="apiInfo.parameters && apiInfo.parameters.length > 0">
        <template #header>
          <div class="card-header">
            <span>参数信息</span>
            <el-tag type="info">{{ apiInfo.parameters.length }} 个参数</el-tag>
          </div>
        </template>
        
        <el-table :data="apiInfo.parameters" border>
          <el-table-column prop="name" label="参数名" width="150" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getParamTypeTag(row.type)" size="small">
                {{ row.type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="required" label="必填" width="80">
            <template #default="{ row }">
              <el-tag :type="row.required ? 'danger' : 'info'" size="small">
                {{ row.required ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" />
        </el-table>
      </el-card>

      <!-- 示例代码 -->
      <el-card class="detail-card">
        <template #header>
          <div class="card-header">
            <span>请求示例</span>
            <el-button-group>
              <el-button 
                v-for="method in apiInfo.methods" 
                :key="method"
                :type="selectedMethod === method ? 'primary' : 'default'"
                size="small"
                @click="selectedMethod = method"
              >
                {{ method }}
              </el-button>
            </el-button-group>
          </div>
        </template>

        <el-tabs type="border-card">
          <el-tab-pane label="cURL" name="curl">
            <div class="code-block">
              <pre>{{ generateCurlExample() }}</pre>
              <el-button 
                class="copy-btn" 
                size="small" 
                @click="copyToClipboard(generateCurlExample())"
              >
                复制
              </el-button>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="JavaScript" name="javascript">
            <div class="code-block">
              <pre>{{ generateJavaScriptExample() }}</pre>
              <el-button 
                class="copy-btn" 
                size="small" 
                @click="copyToClipboard(generateJavaScriptExample())"
              >
                复制
              </el-button>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="PHP" name="php">
            <div class="code-block">
              <pre>{{ generatePhpExample() }}</pre>
              <el-button 
                class="copy-btn" 
                size="small" 
                @click="copyToClipboard(generatePhpExample())"
              >
                复制
              </el-button>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>

      <!-- 响应示例 -->
      <el-card class="detail-card">
        <template #header>
          <div class="card-header">
            <span>响应示例</span>
          </div>
        </template>
        
        <div class="response-example">
          <pre>{{ generateResponseExample() }}</pre>
        </div>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleTestApi">
          测试接口
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

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
const emit = defineEmits(['update:modelValue', 'test-api'])

// 响应式数据
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const selectedMethod = ref('GET')

// 方法
const getApiTypeLabel = (type) => {
  const labels = {
    'admin_v1': '管理端API',
    'mobile_v1': '移动端API',
    'legacy_php': '原生PHP API'
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

const getParamTypeTag = (type) => {
  const tags = {
    'path': 'warning',
    'query': 'info',
    'body': 'primary'
  }
  return tags[type] || 'default'
}

const generateCurlExample = () => {
  if (!props.apiInfo) return ''
  
  const method = selectedMethod.value
  const url = props.apiInfo.full_url
  
  let curl = `curl -X ${method} "${url}"`
  
  if (method !== 'GET') {
    curl += ` \\\n  -H "Content-Type: application/json"`
    curl += ` \\\n  -d '{"key": "value"}'`
  }
  
  return curl
}

const generateJavaScriptExample = () => {
  if (!props.apiInfo) return ''
  
  const method = selectedMethod.value
  const url = props.apiInfo.full_url
  
  let js = `fetch('${url}', {\n  method: '${method}',\n  headers: {\n    'Content-Type': 'application/json'\n  }`
  
  if (method !== 'GET') {
    js += `,\n  body: JSON.stringify({\n    key: 'value'\n  })`
  }
  
  js += `\n})\n.then(response => response.json())\n.then(data => console.log(data))\n.catch(error => console.error('Error:', error));`
  
  return js
}

const generatePhpExample = () => {
  if (!props.apiInfo) return ''
  
  const method = selectedMethod.value
  const url = props.apiInfo.full_url
  
  let php = `<?php\n$url = '${url}';\n$data = array('key' => 'value');\n\n$options = array(\n  'http' => array(\n    'header' => "Content-type: application/json\\r\\n",\n    'method' => '${method}'`
  
  if (method !== 'GET') {
    php += `,\n    'content' => json_encode($data)`
  }
  
  php += `\n  )\n);\n\n$context = stream_context_create($options);\n$result = file_get_contents($url, false, $context);\n$response = json_decode($result, true);\n\nvar_dump($response);\n?>`
  
  return php
}

const generateResponseExample = () => {
  return `{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 1,
    "name": "示例数据",
    "created_at": "2024-01-01 12:00:00"
  }
}`
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('代码已复制到剪贴板')
  } catch (error) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    ElMessage.success('代码已复制到剪贴板')
  }
}

const handleClose = () => {
  dialogVisible.value = false
}

const handleTestApi = () => {
  emit('test-api', props.apiInfo)
  handleClose()
}
</script>

<style scoped>
.api-detail-dialog {
  max-height: 80vh;
  overflow-y: auto;
}

.detail-card {
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

.code-block {
  position: relative;
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 16px;
  margin: 8px 0;
}

.code-block pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
}

.response-example {
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 16px;
}

.response-example pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #333;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
}

:deep(.el-card__header) {
  background-color: #f8f9fa;
}
</style> 