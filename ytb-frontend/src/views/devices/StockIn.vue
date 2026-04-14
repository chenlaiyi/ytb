<template>
  <div class="device-stock-page">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ statistics.total_devices || 0 }}</div>
          <div class="stat-label">设备总数</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-pending">
          <div class="stat-value">{{ statistics.pending_devices || 0 }}</div>
          <div class="stat-label">待激活</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-activated">
          <div class="stat-value">{{ statistics.activated_devices || 0 }}</div>
          <div class="stat-label">已激活</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-iot">
          <div class="stat-value">{{ statistics.iot_registered_devices || 0 }}</div>
          <div class="stat-label">IOT已注册</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-today">
          <div class="stat-value">{{ statistics.today_devices || 0 }}</div>
          <div class="stat-label">今日注册</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-month">
          <div class="stat-value">{{ statistics.this_month_devices || 0 }}</div>
          <div class="stat-label">本月注册</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作区域 -->
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>设备入库管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="showAddDialog">
              <el-icon><Plus /></el-icon>
              添加设备
            </el-button>
            <el-button type="success" @click="showBatchDialog">
              <el-icon><Upload /></el-icon>
              批量登记
            </el-button>
            <el-button @click="loadDevices">
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
            placeholder="设备编号/IMEI/主板编码"
            clearable
            @keyup.enter="loadDevices"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="待激活" value="pending" />
            <el-option label="已分配" value="assigned" />
            <el-option label="已安装" value="installed" />
            <el-option label="已激活" value="activated" />
            <el-option label="已禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="IOT注册">
          <el-select v-model="searchForm.iot_registered" placeholder="全部" clearable>
            <el-option label="已注册" value="1" />
            <el-option label="未注册" value="0" />
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
        <el-table-column prop="device_number" label="设备编号" width="120" />
        <el-table-column prop="board_code" label="主板编码" width="120" />
        <el-table-column prop="imei" label="IMEI" width="150" />
        <el-table-column prop="iccid" label="ICCID" width="150" />
        <el-table-column prop="module_code" label="模块编码" width="120" />
        <el-table-column label="品牌/型号" width="120">
          <template #default="{ row }">
            <span>{{ row.brand || '-' }}</span>
            <span v-if="row.device_model"> / {{ row.device_model }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status_text" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="IOT" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.iot_registered ? 'success' : 'info'" size="small">
              {{ row.iot_registered ? '已注册' : '未注册' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ row.created_at ? row.created_at.substring(0, 19) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDevice(row)">
              查看
            </el-button>
            <el-button
              v-if="!row.iot_registered"
              size="small"
              type="success"
              link
              @click="registerIot(row)"
            >
              注册IOT
            </el-button>
            <el-button size="small" type="warning" link @click="editImei(row)">
              修改IMEI
            </el-button>
            <el-button
              v-if="row.iot_registered"
              size="small"
              type="info"
              link
              @click="syncIot(row)"
            >
              同步IOT
            </el-button>
            <el-button size="small" type="danger" link @click="deleteDevice(row)">
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

    <!-- 添加设备对话框 -->
    <el-dialog v-model="addDialogVisible" title="添加设备" width="550px">
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addRules"
        label-width="100px"
      >
        <el-form-item label="设备编号" prop="device_number">
          <el-input v-model="addForm.device_number" placeholder="请输入设备编号" />
        </el-form-item>
        <el-form-item label="主板编码" prop="board_code">
          <el-input v-model="addForm.board_code" placeholder="请输入主板编码" />
        </el-form-item>
        <el-form-item label="IMEI" prop="imei">
          <el-input v-model="addForm.imei" placeholder="请输入设备IMEI号" />
        </el-form-item>
        <el-form-item label="ICCID">
          <el-input v-model="addForm.iccid" placeholder="请输入ICCID" />
        </el-form-item>
        <el-form-item label="模块编码">
          <el-input v-model="addForm.module_code" placeholder="请输入模块编码" />
        </el-form-item>
        <el-form-item label="品牌">
          <el-select v-model="addForm.brand" placeholder="请选择品牌" style="width: 100%" clearable>
            <el-option label="扬子" value="扬子" />
            <el-option label="万达" value="万达" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="型号">
          <el-select v-model="addForm.device_model" placeholder="请选择型号" style="width: 100%" clearable>
            <el-option label="100G" value="100G" />
            <el-option label="200G" value="200G" />
            <el-option label="400G" value="400G" />
            <el-option label="800G" value="800G" />
          </el-select>
        </el-form-item>
        <el-form-item label="计费模式">
          <el-select v-model="addForm.billing_mode" placeholder="请选择计费模式" style="width: 100%">
            <el-option label="流量计费" value="flow" />
            <el-option label="包年计费" value="time" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户姓名">
          <el-input v-model="addForm.client_name" placeholder="请输入客户姓名" />
        </el-form-item>
        <el-form-item label="客户电话">
          <el-input v-model="addForm.client_phone" placeholder="请输入客户电话" />
        </el-form-item>
        <el-form-item label="安装地址">
          <el-input v-model="addForm.address" placeholder="请输入安装地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAdd">
          确认添加
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量登记对话框 -->
    <el-dialog v-model="batchDialogVisible" title="批量设备登记" width="700px">
      <el-tabs v-model="batchTabActive">
        <el-tab-pane label="Excel上传" name="excel">
          <div class="batch-upload">
            <el-upload
              ref="uploadRef"
              class="upload-demo"
              drag
              :action="API_BASE + '/devices/batch-import'"
              :headers="uploadHeaders"
              :before-upload="beforeExcelUpload"
              :on-success="handleExcelSuccess"
              :on-error="handleExcelError"
              :limit="1"
              accept=".xlsx,.xls"
            >
              <el-icon class="el-icon--upload"><Upload /></el-icon>
              <div class="el-upload__text">
                拖拽Excel文件到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  请上传Excel文件(.xlsx, .xls)，包含设备信息
                </div>
                <el-button size="small" type="primary" @click="downloadTemplate">
                  下载模板
                </el-button>
              </template>
            </el-upload>
          </div>
        </el-tab-pane>
        <el-tab-pane label="文本输入" name="text">
          <div class="batch-text">
            <p class="text-tip">每行一个设备信息，格式：设备编号,主板编码,IMEI,ICCID,模块编码,品牌,型号</p>
            <el-input
              v-model="batchTextContent"
              type="textarea"
              :rows="10"
              placeholder="例如：&#10;88026798,BOARD001,861234567890123,89860123456789012345,MOD001,扬子,100G&#10;88053880,BOARD002,861234567890124,89860123456789012346,MOD002,万达,200G"
            />
          </div>
          <div style="margin-top: 16px; text-align: right;">
            <el-button type="primary" :loading="batchSubmitting" @click="submitBatchText">
              确认导入
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 修改IMEI对话框 -->
    <el-dialog v-model="editImeiDialogVisible" title="修改IMEI" width="450px">
      <el-form ref="editImeiFormRef" :model="editImeiForm" label-width="80px">
        <el-form-item label="设备编号">
          <el-input v-model="editImeiForm.device_number" disabled />
        </el-form-item>
        <el-form-item label="当前IMEI">
          <el-input v-model="editImeiForm.old_imei" disabled />
        </el-form-item>
        <el-form-item label="新IMEI" prop="new_imei">
          <el-input v-model="editImeiForm.new_imei" placeholder="请输入新IMEI" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editImeiDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editImeiSubmitting" @click="submitEditImei">
          确认修改
        </el-button>
      </template>
    </el-dialog>

    <!-- 设备详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="设备详情" width="650px">
      <el-descriptions :column="2" border v-if="currentDevice">
        <el-descriptions-item label="设备编号">{{ currentDevice.device_number }}</el-descriptions-item>
        <el-descriptions-item label="主板编码">{{ currentDevice.board_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="IMEI">{{ currentDevice.imei }}</el-descriptions-item>
        <el-descriptions-item label="ICCID">{{ currentDevice.iccid || '-' }}</el-descriptions-item>
        <el-descriptions-item label="模块编码">{{ currentDevice.module_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="品牌">{{ currentDevice.brand || '-' }}</el-descriptions-item>
        <el-descriptions-item label="型号">{{ currentDevice.device_model || '-' }}</el-descriptions-item>
        <el-descriptions-item label="设备类型">{{ currentDevice.device_type || '-' }}</el-descriptions-item>
        <el-descriptions-item label="计费模式">
          <el-tag :type="currentDevice.billing_mode === 'time' ? 'success' : 'primary'" size="small">
            {{ currentDevice.billing_mode === 'time' ? '包年计费' : '流量计费' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentDevice.status)" size="small">
            {{ currentDevice.status_text }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="IOT注册">
          <el-tag :type="currentDevice.iot_registered ? 'success' : 'info'" size="small">
            {{ currentDevice.iot_registered ? '已注册' : '未注册' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="客户姓名">{{ currentDevice.client_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户电话">{{ currentDevice.client_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="安装地址" :span="2">{{ currentDevice.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="剩余流量">{{ currentDevice.surplus_flow || 0 }} L</el-descriptions-item>
        <el-descriptions-item label="累计净化">{{ currentDevice.cumulative_filtration_flow || 0 }} L</el-descriptions-item>
        <el-descriptions-item label="激活时间">{{ currentDevice.activate_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="服务到期">{{ currentDevice.service_end_time || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ currentDevice.created_at ? currentDevice.created_at.substring(0, 19) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentDevice.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Upload } from '@element-plus/icons-vue'
import request from '@/utils/request'

// API基础路径
const API_BASE = '/api/admin/v1'

// 上传请求头
const uploadHeaders = {
  Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
}

// 状态数据
const loading = ref(false)
const submitting = ref(false)
const batchSubmitting = ref(false)
const editImeiSubmitting = ref(false)
const devices = ref([])
const statistics = ref({
  total_devices: 0,
  pending_devices: 0,
  activated_devices: 0,
  iot_registered_devices: 0,
  today_devices: 0,
  this_month_devices: 0,
})

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: '',
  iot_registered: '',
})

// 分页
const pagination = reactive({
  current_page: 1,
  per_page: 15,
  total: 0,
})

// 对话框
const addDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const batchTabActive = ref('excel')
const batchTextContent = ref('')
const editImeiDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentDevice = ref(null)

// 添加表单
const addFormRef = ref(null)
const addForm = reactive({
  device_number: '',
  board_code: '',
  imei: '',
  iccid: '',
  module_code: '',
  brand: '',
  device_model: '',
  billing_mode: 'flow',
  client_name: '',
  client_phone: '',
  address: '',
})

const addRules = {
  device_number: [
    { required: true, message: '请输入设备编号', trigger: 'blur' },
  ],
  imei: [
    { required: true, message: '请输入IMEI', trigger: 'blur' },
  ],
}

// 修改IMEI表单
const editImeiFormRef = ref(null)
const editImeiForm = reactive({
  id: null,
  device_number: '',
  old_imei: '',
  new_imei: '',
})

// 加载设备列表
const loadDevices = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current_page,
      per_page: pagination.per_page,
      ...searchForm,
    }
    // 移除空值参数
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })

    const data = await request.get(API_BASE + '/devices', { params })
    if (data.code === 0) {
      devices.value = data.data.data || []
      pagination.total = data.data.total || 0
      if (data.data.statistics) {
        statistics.value = {
          total_devices: data.data.statistics.total_devices || 0,
          pending_devices: data.data.statistics.pending_devices || 0,
          activated_devices: data.data.statistics.activated_devices || 0,
          iot_registered_devices: data.data.statistics.iot_registered_devices || 0,
          today_devices: data.data.statistics.today_devices || 0,
          this_month_devices: data.data.statistics.this_month_devices || 0,
        }
      }
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
  searchForm.iot_registered = ''
  pagination.current_page = 1
  loadDevices()
}

// 显示添加对话框
const showAddDialog = () => {
  addForm.device_number = ''
  addForm.board_code = ''
  addForm.imei = ''
  addForm.iccid = ''
  addForm.module_code = ''
  addForm.brand = ''
  addForm.device_model = ''
  addForm.billing_mode = 'flow'
  addForm.client_name = ''
  addForm.client_phone = ''
  addForm.address = ''
  addDialogVisible.value = true
}

// 提交添加
const submitAdd = async () => {
  await addFormRef.value?.validate()

  submitting.value = true
  try {
    const postData = { ...addForm }
    const data = await request.post(API_BASE + '/devices', postData)
    if (data.code === 0) {
      ElMessage.success('设备添加成功')
      addDialogVisible.value = false
      loadDevices()
    } else {
      ElMessage.error(data.message || '添加失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

// 显示批量登记对话框
const showBatchDialog = () => {
  batchTextContent.value = ''
  batchTabActive.value = 'excel'
  batchDialogVisible.value = true
}

// Excel上传前
const beforeExcelUpload = (file) => {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isExcel) {
    ElMessage.error('只能上传Excel文件(.xlsx, .xls)')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过10MB')
    return false
  }
  return true
}

// Excel上传成功
const handleExcelSuccess = (response) => {
  if (response.code === 0) {
    ElMessage.success(`成功导入 ${response.data.success_count || 0} 条设备`)
    batchDialogVisible.value = false
    loadDevices()
  } else {
    ElMessage.error(response.message || '导入失败')
  }
}

// Excel上传失败
const handleExcelError = (err) => {
  ElMessage.error('Excel导入失败: ' + (err.message || '未知错误'))
}

// 下载模板
const downloadTemplate = () => {
  window.open(API_BASE + '/devices/template', '_blank')
}

// 提交批量文本
const submitBatchText = async () => {
  if (!batchTextContent.value.trim()) {
    ElMessage.warning('请输入设备信息')
    return
  }

  batchSubmitting.value = true
  try {
    const lines = batchTextContent.value.trim().split('\n').filter(l => l.trim())
    const devices_data = lines.map(line => {
      const parts = line.split(',').map(p => p.trim())
      return {
        device_number: parts[0] || '',
        board_code: parts[1] || '',
        imei: parts[2] || '',
        iccid: parts[3] || '',
        module_code: parts[4] || '',
        brand: parts[5] || '',
        device_model: parts[6] || '',
      }
    })

    const data = await request.post(API_BASE + '/devices/batch-text', { devices: devices_data })
    if (data.code === 0) {
      ElMessage.success(`成功导入 ${data.data.success_count || 0} 条设备`)
      batchDialogVisible.value = false
      loadDevices()
    } else {
      ElMessage.error(data.message || '导入失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '导入失败')
  } finally {
    batchSubmitting.value = false
  }
}

// 查看设备
const viewDevice = (device) => {
  currentDevice.value = device
  detailDialogVisible.value = true
}

// 注册IOT
const registerIot = async (device) => {
  try {
    await ElMessageBox.confirm(
      `确定要为设备 ${device.device_number} 注册IOT吗？`,
      '注册IOT',
      { type: 'info' }
    )

    const data = await request.post(API_BASE + '/devices/' + device.id + '/register-iot')
    if (data.code === 0) {
      ElMessage.success('IOT注册成功')
      loadDevices()
    } else {
      ElMessage.error(data.message || '注册失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '注册失败')
    }
  }
}

// 修改IMEI
const editImei = (device) => {
  editImeiForm.id = device.id
  editImeiForm.device_number = device.device_number
  editImeiForm.old_imei = device.imei
  editImeiForm.new_imei = ''
  editImeiDialogVisible.value = true
}

// 提交修改IMEI
const submitEditImei = async () => {
  if (!editImeiForm.new_imei.trim()) {
    ElMessage.warning('请输入新IMEI')
    return
  }

  editImeiSubmitting.value = true
  try {
    const data = await request.put(API_BASE + '/devices/' + editImeiForm.id + '/imei', {
      imei: editImeiForm.new_imei
    })
    if (data.code === 0) {
      ElMessage.success('IMEI修改成功')
      editImeiDialogVisible.value = false
      loadDevices()
    } else {
      ElMessage.error(data.message || '修改失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '修改失败')
  } finally {
    editImeiSubmitting.value = false
  }
}

// 同步IOT
const syncIot = async (device) => {
  try {
    await ElMessageBox.confirm(
      `确定为设备 ${device.device_number} 同步IOT数据吗？`,
      '同步IOT',
      { type: 'info' }
    )

    const data = await request.post(API_BASE + '/devices/' + device.id + '/sync-iot')
    if (data.code === 0) {
      ElMessage.success('IOT同步成功')
      loadDevices()
    } else {
      ElMessage.error(data.message || '同步失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '同步失败')
    }
  }
}

// 删除设备
const deleteDevice = async (device) => {
  await ElMessageBox.confirm(
    `确定要删除设备 ${device.device_number} 吗？此操作不可恢复。`,
    '确认删除',
    { type: 'warning' }
  )

  try {
    const data = await request.delete(API_BASE + '/devices/' + device.id)
    if (data.code === 0) {
      ElMessage.success('删除成功')
      loadDevices()
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
    'pending': 'info',
    'assigned': 'warning',
    'installed': 'warning',
    'activated': 'success',
    'disabled': 'danger',
  }
  return types[status] || 'info'
}

// 初始化
onMounted(() => {
  loadDevices()
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

.stat-pending .stat-value { color: #e6a23c; }
.stat-activated .stat-value { color: #67c23a; }
.stat-iot .stat-value { color: #409eff; }
.stat-today .stat-value { color: #f56c6c; }
.stat-month .stat-value { color: #9c27b0; }

.main-card {
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

.search-form {
  margin-bottom: 16px;
}

.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.batch-upload {
  padding: 20px;
}

.batch-text {
  padding: 16px 0;
}

.text-tip {
  margin-bottom: 12px;
  color: #909399;
  font-size: 13px;
}

.el-upload__tip {
  margin-top: 8px;
  color: #909399;
}
</style>
