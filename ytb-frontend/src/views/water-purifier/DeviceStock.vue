<template>
  <div class="device-stock-page">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ statistics.total }}</div>
          <div class="stat-label">设备总数</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-pending">
          <div class="stat-value">{{ statistics.pending }}</div>
          <div class="stat-label">待激活</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-activated">
          <div class="stat-value">{{ statistics.activated }}</div>
          <div class="stat-label">已激活</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-iot">
          <div class="stat-value">{{ statistics.iot_registered }}</div>
          <div class="stat-label">IOT已注册</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-today">
          <div class="stat-value">{{ statistics.today_registered }}</div>
          <div class="stat-label">今日入库</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-month">
          <div class="stat-value">{{ statistics.this_month_registered }}</div>
          <div class="stat-label">本月入库</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作区域 -->
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>设备入库管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="showRegisterDialog">
              <el-icon><Plus /></el-icon>
              单个入库
            </el-button>
            <el-button type="success" @click="showBatchDialog">
              <el-icon><Upload /></el-icon>
              批量入库
            </el-button>
            <el-button @click="loadStatistics">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索筛选 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="主板编码/IMEI/ICCID"
            clearable
            @keyup.enter="loadDevices"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="待激活" value="pending" />
            <el-option label="已安装" value="installed" />
            <el-option label="已激活" value="activated" />
            <el-option label="已锁定" value="locked" />
            <el-option label="故障" value="fault" />
          </el-select>
        </el-form-item>
        <el-form-item label="IOT注册">
          <el-select v-model="searchForm.iot_registered" placeholder="全部" clearable>
            <el-option label="已注册" :value="true" />
            <el-option label="未注册" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadDevices">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 设备列表 -->
      <el-table :data="devices" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="board_code" label="主板编码" width="120" />
        <el-table-column prop="imei" label="IMEI" width="160" />
        <el-table-column prop="iccid" label="ICCID" width="200">
          <template #default="{ row }">
            {{ row.iccid || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="module_code" label="模块型号" width="100">
          <template #default="{ row }">
            {{ moduleTypes[row.module_code] || row.module_code || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="iot_registered" label="IOT注册" width="90">
          <template #default="{ row }">
            <el-tag :type="row.iot_registered ? 'success' : 'info'" size="small">
              {{ row.iot_registered ? '已注册' : '未注册' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="入库时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDevice(row)">
              查看
            </el-button>
            <el-button size="small" type="success" link @click="registerToIot(row)">
              注册IOT
            </el-button>
            <el-button size="small" type="warning" link @click="showEditImeiDialog(row)">
              修改IMEI
            </el-button>
            <el-button size="small" type="info" link @click="syncFromIot(row)">
              同步IOT
            </el-button>
            <el-button 
              v-if="row.status === 'pending'"
              size="small" 
              type="danger" 
              link 
              @click="deleteDevice(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.current_page"
          v-model:page-size="pagination.per_page"
          :total="pagination.total"
          :page-sizes="[15, 30, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadDevices"
          @current-change="loadDevices"
        />
      </div>
    </el-card>

    <!-- 单个入库对话框 -->
    <el-dialog v-model="registerDialogVisible" title="设备入库" width="550px">
      <el-form 
        ref="registerFormRef" 
        :model="registerForm" 
        :rules="registerRules" 
        label-width="100px"
      >
        <el-form-item label="主板编码" prop="board_code">
          <el-input v-model="registerForm.board_code" placeholder="请输入主板编码" />
        </el-form-item>
        <el-form-item label="IMEI" prop="imei">
          <el-input v-model="registerForm.imei" placeholder="请输入设备IMEI号" />
        </el-form-item>
        <el-form-item label="ICCID">
          <el-input v-model="registerForm.iccid" placeholder="请输入SIM卡ICCID（可选）" />
        </el-form-item>
        <el-form-item label="模块型号">
          <el-select v-model="registerForm.module_code" placeholder="请选择模块型号" style="width: 100%">
            <el-option 
              v-for="(label, value) in moduleTypes" 
              :key="value" 
              :label="label" 
              :value="value" 
            />
          </el-select>
        </el-form-item>
        <el-divider content-position="left">净水器信息</el-divider>
        <el-form-item label="净水器品牌">
          <el-select v-model="registerForm.brand" placeholder="请选择品牌" style="width: 100%" @change="onBrandChange">
            <el-option 
              v-for="brand in brands" 
              :key="brand.brand_code" 
              :label="brand.brand_name" 
              :value="brand.brand_name" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="净水器型号">
          <el-select v-model="registerForm.device_model" placeholder="请选择型号" style="width: 100%">
            <el-option 
              v-for="model in filteredModels" 
              :key="model.model_code" 
              :label="model.model_name" 
              :value="model.model_name" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="registerForm.remark" 
            type="textarea" 
            :rows="2" 
            placeholder="备注信息（可选）" 
          />
        </el-form-item>
        <el-form-item label="同步IOT">
          <el-switch v-model="registerForm.sync_to_iot" />
          <span class="form-tip">开启后将同时注册到七云智联IOT平台</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="registerDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRegister">
          确认入库
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量入库对话框 -->
    <el-dialog v-model="batchDialogVisible" title="批量设备入库" width="750px">
      <el-tabs v-model="batchTabActive">
        <!-- Excel文件上传 -->
        <el-tab-pane label="Excel文件导入" name="excel">
          <el-alert 
            type="info" 
            :closable="false" 
            style="margin-bottom: 16px;"
          >
            <template #title>
              请上传七云提供的设备模板文件（.xlsx格式）<br/>
              模板格式：<code>board_code, board_imei, module_code</code>
            </template>
          </el-alert>
          
          <el-form :model="batchForm" label-width="100px">
            <el-form-item label="选择文件">
              <el-upload
                ref="uploadRef"
                :auto-upload="false"
                :limit="1"
                accept=".xlsx,.xls"
                :on-change="handleFileChange"
                :on-remove="handleFileRemove"
              >
                <template #trigger>
                  <el-button type="primary">
                    <el-icon><Upload /></el-icon>
                    选择Excel文件
                  </el-button>
                </template>
                <template #tip>
                  <div class="el-upload__tip">仅支持 .xlsx 或 .xls 格式</div>
                </template>
              </el-upload>
            </el-form-item>
            <el-form-item label="同步IOT">
              <el-switch v-model="batchForm.sync_to_iot" />
              <span class="form-tip">开启后将同时注册到七云智联IOT平台</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 手动输入 -->
        <el-tab-pane label="手动输入" name="text">
          <el-alert 
            type="info" 
            :closable="false" 
            style="margin-bottom: 16px;"
          >
            <template #title>
              请按格式输入设备信息，每行一个设备：<br/>
              <code>主板编码,IMEI,ICCID(可选),模块型号(可选)</code><br/>
              示例：<code>88000001,864723075256943,89860847112D046964,CS_01</code>
            </template>
          </el-alert>
          
          <el-form :model="batchForm" label-width="100px">
            <el-form-item label="设备列表">
              <el-input
                v-model="batchForm.text"
                type="textarea"
                :rows="10"
                placeholder="每行一个设备，格式：主板编码,IMEI,ICCID,模块型号"
              />
            </el-form-item>
            <el-form-item label="同步IOT">
              <el-switch v-model="batchForm.sync_to_iot" />
              <span class="form-tip">开启后将同时注册到七云智联IOT平台</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <!-- 解析预览 -->
      <div v-if="parsedDevices.length > 0" class="parsed-preview">
        <div class="preview-header">
          <el-icon style="color: #67c23a; margin-right: 5px;"><SuccessFilled /></el-icon>
          解析成功：{{ parsedDevices.length }} 个设备
        </div>
        <el-table :data="parsedDevices" max-height="250" size="small" stripe>
          <el-table-column type="index" width="50" label="#" />
          <el-table-column prop="board_code" label="主板编码" width="110" />
          <el-table-column prop="imei" label="IMEI" width="155" />
          <el-table-column prop="iccid" label="ICCID" width="175">
            <template #default="{ row }">
              {{ row.iccid || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="module_code" label="模块型号" width="100" />
          <el-table-column label="状态" width="80" fixed="right">
            <template #default="{ row }">
              <el-tag v-if="row.valid" type="success" size="small">有效</el-tag>
              <el-tag v-else type="danger" size="small">{{ row.error || '无效' }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 入库结果 -->
      <div v-if="batchResult" class="batch-result">
        <el-result
          :icon="batchResult.failed.length === 0 ? 'success' : 'warning'"
          :title="batchResult.message"
        >
          <template #sub-title>
            <div v-if="batchResult.failed.length > 0">
              失败设备：
              <ul style="text-align: left; max-height: 150px; overflow-y: auto;">
                <li v-for="(item, index) in batchResult.failed" :key="index">
                  {{ item.board_code }}: {{ item.reason }}
                </li>
              </ul>
            </div>
          </template>
        </el-result>
      </div>

      <template #footer>
        <el-button @click="batchDialogVisible = false">关闭</el-button>
        <el-button v-if="batchTabActive === 'text'" type="info" @click="parseDevices">解析预览</el-button>
        <el-button 
          type="primary" 
          :loading="submitting" 
          :disabled="parsedDevices.filter(d => d.valid).length === 0"
          @click="submitBatchRegister"
        >
          确认入库 ({{ parsedDevices.filter(d => d.valid).length }} 个)
        </el-button>
      </template>
    </el-dialog>

    <!-- 修改IMEI对话框 -->
    <el-dialog v-model="editImeiDialogVisible" title="修改设备IMEI" width="450px">
      <el-form :model="editImeiForm" label-width="100px">
        <el-form-item label="主板编码">
          <el-input :value="editImeiForm.board_code" disabled />
        </el-form-item>
        <el-form-item label="当前IMEI">
          <el-input :value="editImeiForm.old_imei" disabled />
        </el-form-item>
        <el-form-item label="新IMEI" required>
          <el-input v-model="editImeiForm.imei" placeholder="请输入新的IMEI" />
        </el-form-item>
        <el-form-item label="同步IOT">
          <el-switch v-model="editImeiForm.sync_to_iot" />
          <span class="form-tip">开启后将同时更新IOT平台</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editImeiDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitUpdateImei">
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Refresh, SuccessFilled } from '@element-plus/icons-vue'
import request from '@/utils/request'

// API基础路径
const API_BASE = '/api/admin/water-purifier'

// 状态数据
const loading = ref(false)
const submitting = ref(false)
const devices = ref([])
const statistics = ref({
  total: 0,
  pending: 0,
  installed: 0,
  activated: 0,
  locked: 0,
  fault: 0,
  iot_registered: 0,
  today_registered: 0,
  this_month_registered: 0,
})

// 模块型号
const moduleTypes = ref({
  'QY_QN4G': '七云4G模块',
  'CS_01': '常规4G模块',
  'QY_WIFI': '七云WiFi模块',
})

// 净水器品牌和型号
const brands = ref([])
const models = ref([])
const filteredModels = computed(() => {
  if (!registerForm.brand) return models.value
  const brand = brands.value.find(b => b.brand_name === registerForm.brand)
  if (!brand) return []
  return models.value.filter(m => m.brand_id === brand.id)
})

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: '',
  iot_registered: null,
})

// 分页
const pagination = reactive({
  current_page: 1,
  per_page: 15,
  total: 0,
})

// 对话框可见性
const registerDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const editImeiDialogVisible = ref(false)

// 单个入库表单
const registerFormRef = ref(null)
const registerForm = reactive({
  board_code: '',
  imei: '',
  iccid: '',
  module_code: 'QY_QN4G',
  brand: '',
  device_model: '',
  remark: '',
  sync_to_iot: true,
})

const registerRules = {
  board_code: [
    { required: true, message: '请输入主板编码', trigger: 'blur' },
  ],
  imei: [
    { required: true, message: '请输入IMEI', trigger: 'blur' },
  ],
}

// 批量入库表单
const batchTabActive = ref('excel')
const batchForm = reactive({
  text: '',
  sync_to_iot: true,
  file: null,
})
const parsedDevices = ref([])
const batchResult = ref(null)
const uploadRef = ref(null)
const uploading = ref(false)

// 修改IMEI表单
const editImeiForm = reactive({
  device_id: null,
  board_code: '',
  old_imei: '',
  imei: '',
  sync_to_iot: true,
})

// 加载统计数据
const loadStatistics = async () => {
  try {
    const data = await request.get(`${API_BASE}/stock-statistics`)
    if (data.code === 0) {
      statistics.value = data.data
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

// 加载设备列表
const loadDevices = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current_page,
      per_page: pagination.per_page,
      ...searchForm,
    }
    const data = await request.get(`${API_BASE}/`, { params })
    if (data.code === 0) {
      devices.value = data.data
      pagination.total = data.meta?.total || 0
    }
  } catch (error) {
    ElMessage.error('加载设备列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.iot_registered = null
  pagination.current_page = 1
  loadDevices()
}

// 显示单个入库对话框
const showRegisterDialog = () => {
  registerForm.board_code = ''
  registerForm.imei = ''
  registerForm.iccid = ''
  registerForm.module_code = 'QY_QN4G'
  registerForm.brand = ''
  registerForm.device_model = ''
  registerForm.remark = ''
  registerForm.sync_to_iot = true
  registerDialogVisible.value = true
}

// 品牌切换时重置型号
const onBrandChange = () => {
  registerForm.device_model = ''
}

// 提交单个入库
const submitRegister = async () => {
  await registerFormRef.value?.validate()
  
  submitting.value = true
  try {
    const data = await request.post(`${API_BASE}/register`, registerForm)
    if (data.code === 0) {
      ElMessage.success('设备入库成功')
      registerDialogVisible.value = false
      loadDevices()
      loadStatistics()
    } else {
      ElMessage.error(data.message || '入库失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

// 显示批量入库对话框
const showBatchDialog = () => {
  batchTabActive.value = 'excel'
  batchForm.text = ''
  batchForm.file = null
  batchForm.sync_to_iot = true
  parsedDevices.value = []
  batchResult.value = null
  batchDialogVisible.value = true
  // 清除上传组件的文件列表
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

// 处理文件选择
const handleFileChange = async (file) => {
  if (!file || !file.raw) return
  
  batchForm.file = file.raw
  uploading.value = true
  parsedDevices.value = []
  batchResult.value = null
  
  try {
    // 上传文件并解析
    const formData = new FormData()
    formData.append('file', file.raw)
    
    const data = await request.post(`${API_BASE}/parse-excel`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    if (data.code === 0) {
      parsedDevices.value = data.data.devices.map(d => ({
        ...d,
        valid: d.board_code && d.imei,
        error: (!d.board_code || !d.imei) ? '缺少必填字段' : null
      }))
      ElMessage.success(`成功解析 ${data.data.devices.length} 个设备`)
    } else {
      ElMessage.error(data.message || '解析失败')
    }
  } catch (error) {
    console.error('Excel解析失败:', error)
    ElMessage.error(error.response?.data?.message || 'Excel解析失败')
  } finally {
    uploading.value = false
  }
}

// 处理文件移除
const handleFileRemove = () => {
  batchForm.file = null
  parsedDevices.value = []
  batchResult.value = null
}

// 解析设备列表
const parseDevices = () => {
  const lines = batchForm.text.trim().split('\n').filter(line => line.trim())
  parsedDevices.value = lines.map(line => {
    const parts = line.split(',').map(p => p.trim())
    const device = {
      board_code: parts[0] || '',
      imei: parts[1] || '',
      iccid: parts[2] || '',
      module_code: parts[3] || 'QY_QN4G',
      valid: false,
    }
    device.valid = device.board_code && device.imei
    return device
  })
}

// 监听文本变化自动解析
watch(() => batchForm.text, () => {
  if (batchForm.text) {
    parseDevices()
  } else {
    parsedDevices.value = []
  }
})

// 提交批量入库
const submitBatchRegister = async () => {
  const validDevices = parsedDevices.value.filter(d => d.valid)
  if (validDevices.length === 0) {
    ElMessage.warning('没有有效的设备数据')
    return
  }
  
  submitting.value = true
  try {
    const data = await request.post(`${API_BASE}/batch-register`, {
      devices: validDevices.map(d => ({
        board_code: d.board_code,
        imei: d.imei,
        iccid: d.iccid,
        module_code: d.module_code,
      })),
      sync_to_iot: batchForm.sync_to_iot,
    })
    if (data.code === 0) {
      batchResult.value = {
        message: data.message,
        success: data.data.success,
        failed: data.data.failed,
      }
      loadDevices()
      loadStatistics()
    } else {
      ElMessage.error(data.message || '批量入库失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

// 显示修改IMEI对话框
const showEditImeiDialog = (device) => {
  editImeiForm.device_id = device.id
  editImeiForm.board_code = device.board_code
  editImeiForm.old_imei = device.imei
  editImeiForm.imei = ''
  editImeiForm.sync_to_iot = device.iot_registered
  editImeiDialogVisible.value = true
}

// 提交修改IMEI
const submitUpdateImei = async () => {
  if (!editImeiForm.imei) {
    ElMessage.warning('请输入新的IMEI')
    return
  }
  
  submitting.value = true
  try {
    const data = await request.post(`${API_BASE}/${editImeiForm.device_id}/update-imei`, {
      imei: editImeiForm.imei,
      sync_to_iot: editImeiForm.sync_to_iot,
    })
    if (data.code === 0) {
      ElMessage.success('IMEI修改成功')
      editImeiDialogVisible.value = false
      loadDevices()
    } else {
      ElMessage.error(data.message || '修改失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

// 查看设备详情
const viewDevice = (device) => {
  // 跳转到设备详情页
  window.location.hash = `/water-purifier/devices?id=${device.id}`
}

// 从IOT同步
const syncFromIot = async (device) => {
  try {
    const data = await request.post(`${API_BASE}/${device.id}/sync-iot`)
    if (data.code === 0) {
      ElMessage.success('同步成功')
      loadDevices()
    } else {
      ElMessage.error(data.message || '同步失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '同步失败')
  }
}

// 注册设备到IOT平台
const registerToIot = async (device) => {
  try {
    // 显示加载中
    const loadingMsg = ElMessage({
      message: '正在注册到IOT平台...',
      type: 'info',
      duration: 0
    })
    
    // 调用注册API
    const data = await request.post(`${API_BASE}/${device.id}/register-iot`)
    
    loadingMsg.close()
    
    if (data.code === 0) {
      // 显示成功结果弹窗
      await ElMessageBox.alert(
        `<div style="text-align: left;">
          <p><strong>设备编号:</strong> ${device.board_code}</p>
          <p><strong>IMEI:</strong> ${device.imei}</p>
          <p><strong>注册状态:</strong> <span style="color: #67c23a; font-weight: bold;">✓ ${data.message || '注册成功'}</span></p>
          ${data.data?.iot_result ? `<p><strong>IOT返回:</strong></p><pre style="background:#f5f5f5;padding:10px;font-size:12px;overflow:auto;max-height:200px;border-radius:4px;">${JSON.stringify(data.data.iot_result, null, 2)}</pre>` : ''}
        </div>`,
        'IOT注册结果',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '确定',
          type: 'success'
        }
      )
      loadDevices() // 刷新列表
      loadStatistics() // 刷新统计
    } else {
      // 显示失败结果弹窗
      await ElMessageBox.alert(
        `<div style="text-align: left;">
          <p><strong>设备编号:</strong> ${device.board_code}</p>
          <p><strong>IMEI:</strong> ${device.imei}</p>
          <p><strong>注册状态:</strong> <span style="color: #f56c6c; font-weight: bold;">✗ 失败</span></p>
          <p><strong>错误信息:</strong> ${data.message || '未知错误'}</p>
          ${data.iot_result ? `<p><strong>IOT返回:</strong></p><pre style="background:#fff1f0;padding:10px;font-size:12px;overflow:auto;max-height:200px;border-radius:4px;border:1px solid #ffa39e;">${JSON.stringify(data.iot_result, null, 2)}</pre>` : ''}
        </div>`,
        'IOT注册结果',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '确定',
          type: 'error'
        }
      )
    }
  } catch (error) {
    console.error('IOT注册失败:', error)
    ElMessage.error(error.response?.data?.message || 'IOT注册请求失败')
  }
}

// 删除设备
const deleteDevice = async (device) => {
  await ElMessageBox.confirm(
    `确定要删除设备 ${device.board_code} 吗？此操作不可恢复。`,
    '确认删除',
    { type: 'warning' }
  )
  
  try {
    const data = await request.delete(`${API_BASE}/${device.id}`)
    if (data.code === 0) {
      ElMessage.success('删除成功')
      loadDevices()
      loadStatistics()
    } else {
      ElMessage.error(data.message || '删除失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '删除失败')
  }
}

// 状态相关函数
const getStatusType = (status) => {
  const types = {
    pending: 'info',
    installed: 'warning',
    activated: 'success',
    locked: 'danger',
    fault: 'danger',
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待激活',
    installed: '已安装',
    activated: '已激活',
    locked: '已锁定',
    fault: '故障',
  }
  return texts[status] || status
}

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

// 加载模块型号
const loadModuleTypes = async () => {
  try {
    const data = await request.get(`${API_BASE}/module-types`)
    if (data.code === 0 && data.data) {
      moduleTypes.value = data.data
    }
  } catch (error) {
    console.error('加载模块型号失败:', error)
  }
}

// 加载品牌和型号
const loadBrandsAndModels = async () => {
  try {
    const data = await request.get(`${API_BASE}/brands-models`)
    if (data.code === 0 && data.data) {
      brands.value = data.data.brands || []
      models.value = data.data.models || []
    }
  } catch (error) {
    console.error('加载品牌型号失败:', error)
    // 使用默认数据
    brands.value = [
      { id: 1, brand_name: '华迈', brand_code: 'HUAMAI' },
      { id: 2, brand_name: '净之泉', brand_code: 'JINGZHIQUAN' },
      { id: 3, brand_name: '沃特佳', brand_code: 'WOTEJIA' },
    ]
    models.value = [
      { id: 1, brand_id: 1, model_name: '大扁豆', model_code: 'DABIANDOU' },
      { id: 2, brand_id: 1, model_name: '屠龙', model_code: 'TULONG' },
      { id: 3, brand_id: 2, model_name: '小扁豆', model_code: 'XIAOBIANDOU' },
      { id: 4, brand_id: 2, model_name: '商务机', model_code: 'SHANGWUJI' },
      { id: 5, brand_id: 3, model_name: '100G', model_code: '100G' },
    ]
  }
}

// 初始化
onMounted(() => {
  loadStatistics()
  loadDevices()
  loadModuleTypes()
  loadBrandsAndModels()
})
</script>

<style scoped>
.device-stock-page {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.stat-pending .stat-value { color: #909399; }
.stat-activated .stat-value { color: #67c23a; }
.stat-iot .stat-value { color: #409eff; }
.stat-today .stat-value { color: #e6a23c; }
.stat-month .stat-value { color: #f56c6c; }

.main-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 16px;
}

.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.form-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

.parsed-preview {
  margin-top: 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.preview-header {
  padding: 10px 16px;
  background: #f5f7fa;
  font-weight: 500;
}

.batch-result {
  margin-top: 16px;
}

.batch-result ul {
  text-align: left;
  margin: 10px 0;
  padding-left: 20px;
}
</style>
