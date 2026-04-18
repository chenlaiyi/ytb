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
            <el-button @click="loadAll">
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
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="待激活" value="pending" />
            <el-option label="已安装" value="installed" />
            <el-option label="已激活" value="activated" />
            <el-option label="已锁定" value="locked" />
            <el-option label="故障" value="fault" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadDevices">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 设备列表 -->
      <el-table :data="devices" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column label="主板编码" width="110">
          <template #default="{ row }">
            <span style="font-weight: 600; color: #303133;">{{ row.board_code || row.device_number }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="imei" label="IMEI" width="160">
          <template #default="{ row }">
            <span style="font-family: monospace; font-size: 12px;">{{ row.imei || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="ICCID" width="200">
          <template #default="{ row }">
            <span style="font-family: monospace; font-size: 12px;">{{ row.iccid || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="模块" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ moduleLabels[row.module_code] || row.module_code || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="品牌/型号" width="130">
          <template #default="{ row }">
            <div v-if="row.brand">
              <span style="font-weight: 500;">{{ row.brand }}</span>
              <span v-if="row.device_model" style="color: #909399;"> / {{ row.device_model }}</span>
            </div>
            <span v-else style="color: #c0c4cc;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="85" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status] || 'info'" size="small">
              {{ statusText[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="IOT" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.iot_registered ? 'success' : 'info'" size="small" effect="light">
              {{ row.iot_registered ? '✓ 已注册' : '○ 未注册' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="入库时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.created_at || row.create_date) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDevice(row)">查看</el-button>
            <el-button size="small" type="success" link @click="registerToIot(row)">
              {{ row.iot_registered ? '重新注册IOT' : '注册IOT' }}
            </el-button>
            <el-button size="small" type="warning" link @click="showEditImeiDialog(row)">改IMEI</el-button>
            <el-button size="small" type="info" link @click="syncFromIot(row)">同步IOT</el-button>
            <el-button v-if="row.status === 'pending'" size="small" type="danger" link @click="deleteDevice(row)">删除</el-button>
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
    <el-dialog v-model="registerDialogVisible" title="设备入库" width="600px" destroy-on-close>
      <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" label-width="100px">
        <el-divider content-position="left">设备硬件信息</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="主板编码" prop="board_code">
              <el-input v-model="registerForm.board_code" placeholder="如：88066491" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="IMEI" prop="imei">
              <el-input v-model="registerForm.imei" placeholder="15位IMEI号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="ICCID">
              <el-input v-model="registerForm.iccid" placeholder="SIM卡ICCID（可选）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模块型号">
              <el-select v-model="registerForm.module_code" placeholder="选择模块型号" style="width: 100%">
                <el-option v-for="(label, key) in moduleLabels" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">净水器信息</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="品牌">
              <el-select v-model="registerForm.brand" placeholder="选择品牌" style="width: 100%" filterable clearable @change="onBrandChange(registerForm)">
                <el-option v-for="b in brands" :key="b.brand_code" :label="b.brand_name" :value="b.brand_name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="型号">
              <el-select v-model="registerForm.device_model" placeholder="选择型号" style="width: 100%" filterable clearable allow-create>
                <el-option v-for="m in getModelsForBrand(registerForm.brand)" :key="m.model_code" :label="m.model_name" :value="m.model_name" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="registerForm.remark" type="textarea" :rows="2" placeholder="备注信息（可选）" />
        </el-form-item>
        <el-form-item label="同步IOT">
          <el-switch v-model="registerForm.sync_to_iot" active-text="入库时同步注册到七云IOT平台" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="registerDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRegister">确认入库</el-button>
      </template>
    </el-dialog>

    <!-- 批量入库对话框 -->
    <el-dialog v-model="batchDialogVisible" title="批量设备入库" width="800px" destroy-on-close>
      <el-tabs v-model="batchTabActive">
        <!-- Excel文件上传 -->
        <el-tab-pane label="Excel文件导入" name="excel">
          <el-alert type="info" :closable="false" style="margin-bottom: 16px;">
            <template #title>
              请上传七云提供的设备模板文件（.xlsx/.xls/.csv格式）<br/>
              模板列：<code>主板编码(board_code), IMEI(imei), ICCID(iccid), 模块型号(module_code)</code>
            </template>
          </el-alert>

          <el-form label-width="100px">
            <el-form-item label="选择文件">
              <el-upload
                ref="uploadRef"
                :auto-upload="false"
                :limit="1"
                accept=".xlsx,.xls,.csv"
                :on-change="handleFileChange"
                :on-remove="handleFileRemove"
              >
                <template #trigger>
                  <el-button type="primary">
                    <el-icon><Upload /></el-icon>
                    选择文件
                  </el-button>
                </template>
                <template #tip>
                  <div class="el-upload__tip">支持 .xlsx / .xls / .csv 格式，文件大小不超过10MB</div>
                </template>
              </el-upload>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 手动输入 -->
        <el-tab-pane label="手动输入" name="text">
          <el-alert type="info" :closable="false" style="margin-bottom: 16px;">
            <template #title>
              每行一个设备，格式：<code>主板编码,IMEI,ICCID(可选),模块型号(可选)</code><br/>
              示例：<code>88066491,868292080628401,89860847112D046964,QY_QN4G</code>
            </template>
          </el-alert>

          <el-input
            v-model="batchForm.text"
            type="textarea"
            :rows="8"
            placeholder="每行一个设备，格式：主板编码,IMEI,ICCID,模块型号"
          />
        </el-tab-pane>
      </el-tabs>

      <!-- 品牌/型号统一设置 -->
      <el-divider content-position="left">批量设置（可选）</el-divider>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="统一品牌" label-width="80px">
            <el-select v-model="batchForm.brand" placeholder="品牌" filterable clearable style="width: 100%" @change="onBrandChange(batchForm)">
              <el-option v-for="b in brands" :key="b.brand_code" :label="b.brand_name" :value="b.brand_name" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="统一型号" label-width="80px">
            <el-select v-model="batchForm.device_model" placeholder="型号" filterable clearable allow-create style="width: 100%">
              <el-option v-for="m in getModelsForBrand(batchForm.brand)" :key="m.model_code" :label="m.model_name" :value="m.model_name" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="同步IOT" label-width="80px">
            <el-switch v-model="batchForm.sync_to_iot" active-text="同步注册IOT" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 解析预览 -->
      <div v-if="parsedDevices.length > 0" class="parsed-preview">
        <div class="preview-header">
          <el-icon style="color: #67c23a; margin-right: 5px;"><SuccessFilled /></el-icon>
          解析成功：{{ parsedDevices.filter(d => d.valid).length }} / {{ parsedDevices.length }} 个有效设备
        </div>
        <el-table :data="parsedDevices" max-height="250" size="small" stripe>
          <el-table-column type="index" width="50" label="#" />
          <el-table-column prop="board_code" label="主板编码" width="110" />
          <el-table-column prop="imei" label="IMEI" width="155" />
          <el-table-column label="ICCID" width="175">
            <template #default="{ row }">{{ row.iccid || '-' }}</template>
          </el-table-column>
          <el-table-column prop="module_code" label="模块" width="90" />
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
        <el-button v-if="batchTabActive === 'text' && parsedDevices.length === 0" type="info" @click="parseDevices">解析预览</el-button>
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
    <el-dialog v-model="editImeiDialogVisible" title="修改设备IMEI" width="450px" destroy-on-close>
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
          <el-switch v-model="editImeiForm.sync_to_iot" active-text="同步更新IOT平台IMEI" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editImeiDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitUpdateImei">确认修改</el-button>
      </template>
    </el-dialog>

    <!-- 设备详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="设备详情" width="650px">
      <el-descriptions :column="2" border v-if="currentDevice">
        <el-descriptions-item label="主板编码">{{ currentDevice.board_code || currentDevice.device_number }}</el-descriptions-item>
        <el-descriptions-item label="IMEI">{{ currentDevice.imei || '-' }}</el-descriptions-item>
        <el-descriptions-item label="ICCID">{{ currentDevice.iccid || '-' }}</el-descriptions-item>
        <el-descriptions-item label="模块型号">{{ moduleLabels[currentDevice.module_code] || currentDevice.module_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="品牌">{{ currentDevice.brand || '-' }}</el-descriptions-item>
        <el-descriptions-item label="型号">{{ currentDevice.device_model || '-' }}</el-descriptions-item>
        <el-descriptions-item label="计费模式">
          <el-tag :type="currentDevice.billing_mode === 'time' ? 'success' : 'primary'" size="small">
            {{ currentDevice.billing_mode === 'time' ? '包年计费' : '流量计费' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType[currentDevice.status] || 'info'" size="small">
            {{ statusText[currentDevice.status] || currentDevice.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="IOT注册">
          <el-tag :type="currentDevice.iot_registered ? 'success' : 'info'" size="small">
            {{ currentDevice.iot_registered ? '已注册' : '未注册' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="剩余流量">{{ currentDevice.surplus_flow || 0 }} L</el-descriptions-item>
        <el-descriptions-item label="客户姓名">{{ currentDevice.client_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户电话">{{ currentDevice.client_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="安装地址" :span="2">{{ currentDevice.client_address || currentDevice.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="入库时间">{{ formatTime(currentDevice.created_at || currentDevice.create_date) }}</el-descriptions-item>
        <el-descriptions-item label="激活时间">{{ currentDevice.activate_date || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Refresh, SuccessFilled } from '@element-plus/icons-vue'
import request from '@/utils/request'

const API_BASE = '/api/admin/water-purifier'

// 状态
const loading = ref(false)
const submitting = ref(false)
const devices = ref([])
const statistics = ref({
  total: 0, pending: 0, activated: 0, installed: 0, locked: 0, fault: 0,
  iot_registered: 0, today_registered: 0, this_month_registered: 0,
})

// 品牌和型号
const brands = ref([])
const models = ref([])

const moduleLabels = {
  'QY_QN4G': '七云4G',
  'CS_01': '常规4G',
  'QY_WIFI': '七云WiFi',
}

const statusType = {
  pending: 'info', installed: 'warning', activated: 'success', locked: 'danger', fault: 'danger',
}
const statusText = {
  pending: '待激活', installed: '已安装', activated: '已激活', locked: '已锁定', fault: '故障',
}

// 搜索与分页
const searchForm = reactive({ keyword: '', status: '' })
const pagination = reactive({ current_page: 1, per_page: 15, total: 0 })

// 对话框
const registerDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const editImeiDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentDevice = ref(null)

// 单个入库表单
const registerFormRef = ref(null)
const registerForm = reactive({
  board_code: '', imei: '', iccid: '', module_code: 'QY_QN4G',
  brand: '', device_model: '', remark: '', sync_to_iot: true,
})
const registerRules = {
  board_code: [{ required: true, message: '请输入主板编码', trigger: 'blur' }],
  imei: [{ required: true, message: '请输入IMEI', trigger: 'blur' }, { min: 15, max: 15, message: 'IMEI为15位', trigger: 'blur' }],
}

// 批量入库
const batchTabActive = ref('excel')
const batchForm = reactive({ text: '', sync_to_iot: true, brand: '', device_model: '' })
const parsedDevices = ref([])
const batchResult = ref(null)
const uploadRef = ref(null)

// 修改IMEI表单
const editImeiForm = reactive({ device_id: null, board_code: '', old_imei: '', imei: '', sync_to_iot: true })

// 获取品牌下的型号列表
const getModelsForBrand = (brandName) => {
  if (!brandName) return models.value
  const brand = brands.value.find(b => b.brand_name === brandName)
  if (!brand) return []
  return models.value.filter(m => m.brand_id === brand.id)
}

const onBrandChange = (form) => { form.device_model = '' }

const formatTime = (str) => {
  if (!str) return '-'
  return str.replace('T', ' ').substring(0, 19)
}

// ========== 数据加载 ==========

const loadStatistics = async () => {
  try {
    const data = await request.get(`${API_BASE}/stock-statistics`)
    if (data.code === 0) statistics.value = data.data
  } catch (e) { console.error('加载统计失败:', e) }
}

const loadDevices = async () => {
  loading.value = true
  try {
    const params = { page: pagination.current_page, per_page: pagination.per_page }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.status) params.status = searchForm.status
    const data = await request.get(`${API_BASE}/`, { params })
    if (data.code === 0) {
      devices.value = data.data || []
      pagination.total = data.meta?.total || 0
    }
  } catch (e) {
    ElMessage.error('加载设备列表失败')
  } finally {
    loading.value = false
  }
}

const loadBrandsAndModels = async () => {
  try {
    const data = await request.get(`${API_BASE}/brands-models`)
    if (data.code === 0 && data.data) {
      brands.value = data.data.brands || []
      models.value = data.data.models || []
    }
  } catch (e) {
    // 使用默认数据
    brands.value = [
      { id: 1, brand_name: '华迈', brand_code: 'HUAMAI' },
      { id: 2, brand_name: '净之泉', brand_code: 'JINGZHIQUAN' },
      { id: 3, brand_name: '沃特佳', brand_code: 'WOTEJIA' },
      { id: 4, brand_name: '万达', brand_code: 'WANDA' },
    ]
    models.value = [
      { id: 1, brand_id: 1, model_name: '大扁豆', model_code: 'DABIANDOU' },
      { id: 2, brand_id: 1, model_name: '屠龙', model_code: 'TULONG' },
      { id: 3, brand_id: 2, model_name: '小扁豆', model_code: 'XIAOBIANDOU' },
      { id: 4, brand_id: 2, model_name: '商务机', model_code: 'SHANGWUJI' },
    ]
  }
}

const loadAll = () => { loadStatistics(); loadDevices() }

// ========== 单个入库 ==========

const showRegisterDialog = () => {
  Object.assign(registerForm, { board_code: '', imei: '', iccid: '', module_code: 'QY_QN4G', brand: '', device_model: '', remark: '', sync_to_iot: true })
  registerDialogVisible.value = true
}

const submitRegister = async () => {
  await registerFormRef.value?.validate()
  submitting.value = true
  try {
    const data = await request.post(`${API_BASE}/register`, registerForm)
    if (data.code === 0) {
      ElMessage.success(data.message || '设备入库成功')
      // 显示IOT结果
      if (registerForm.sync_to_iot && data.data?.iot_result) {
        const ir = data.data.iot_result
        await ElMessageBox.alert(
          `<div style="text-align:left;">
            <p><strong>主板编码:</strong> ${registerForm.board_code}</p>
            <p><strong>IMEI:</strong> ${registerForm.imei}</p>
            <p><strong>IOT状态:</strong> <span style="color:${ir.code == 0 ? '#67c23a' : '#f56c6c'};font-weight:bold;">${ir.code == 0 ? '✓ 注册成功' : '✗ 注册失败'}</span></p>
            <p><strong>IOT返回:</strong></p>
            <pre style="background:#f5f7fa;padding:8px;font-size:12px;border-radius:4px;max-height:150px;overflow:auto;">${JSON.stringify(ir, null, 2)}</pre>
          </div>`, 'IOT注册结果',
          { dangerouslyUseHTMLString: true, confirmButtonText: '确定', type: ir.code == 0 ? 'success' : 'warning' }
        )
      }
      registerDialogVisible.value = false
      loadAll()
    } else {
      ElMessage.error(data.message || '入库失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

// ========== 批量入库 ==========

const showBatchDialog = () => {
  batchTabActive.value = 'excel'
  batchForm.text = ''
  batchForm.sync_to_iot = true
  batchForm.brand = ''
  batchForm.device_model = ''
  parsedDevices.value = []
  batchResult.value = null
  batchDialogVisible.value = true
  uploadRef.value?.clearFiles()
}

const handleFileChange = async (file) => {
  if (!file?.raw) return
  parsedDevices.value = []
  batchResult.value = null
  try {
    const formData = new FormData()
    formData.append('file', file.raw)
    const data = await request.post(`${API_BASE}/parse-excel`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (data.code === 0) {
      parsedDevices.value = (data.data.devices || []).map(d => ({
        ...d, valid: !!(d.board_code && d.imei), error: (!d.board_code || !d.imei) ? '缺少必填字段' : null,
      }))
      ElMessage.success(`成功解析 ${data.data.devices.length} 个设备`)
    } else {
      ElMessage.error(data.message || '解析失败')
    }
  } catch (e) {
    ElMessage.error('文件解析失败')
  }
}

const handleFileRemove = () => { parsedDevices.value = []; batchResult.value = null }

const parseDevices = () => {
  const lines = batchForm.text.trim().split('\n').filter(l => l.trim())
  parsedDevices.value = lines.map(line => {
    const parts = line.split(',').map(p => p.trim())
    const d = { board_code: parts[0] || '', imei: parts[1] || '', iccid: parts[2] || '', module_code: parts[3] || 'QY_QN4G' }
    d.valid = !!(d.board_code && d.imei)
    d.error = d.valid ? null : '缺少必填字段'
    return d
  })
}

watch(() => batchForm.text, (val) => { if (val) parseDevices(); else parsedDevices.value = [] })

const submitBatchRegister = async () => {
  const validDevices = parsedDevices.value.filter(d => d.valid)
  if (validDevices.length === 0) return ElMessage.warning('没有有效的设备数据')

  submitting.value = true
  try {
    const data = await request.post(`${API_BASE}/batch-register`, {
      devices: validDevices.map(d => ({
        board_code: d.board_code, imei: d.imei, iccid: d.iccid, module_code: d.module_code,
        brand: batchForm.brand, device_model: batchForm.device_model,
      })),
      sync_to_iot: batchForm.sync_to_iot,
    })
    if (data.code === 0) {
      batchResult.value = { message: data.message, success: data.data.success || [], failed: data.data.failed || [] }
      loadAll()
    } else {
      ElMessage.error(data.message || '批量入库失败')
    }
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// ========== IOT操作 ==========

const registerToIot = async (device) => {
  const loadingMsg = ElMessage({ message: '正在注册到七云IOT平台...', type: 'info', duration: 0 })
  try {
    const data = await request.post(`${API_BASE}/${device.id}/register-iot`)
    loadingMsg.close()
    const ir = data.data?.iot_result || {}
    await ElMessageBox.alert(
      `<div style="text-align:left;">
        <p><strong>主板编码:</strong> ${device.board_code || device.device_number}</p>
        <p><strong>IMEI:</strong> ${device.imei}</p>
        <p><strong>注册状态:</strong> <span style="color:${data.code === 0 ? '#67c23a' : '#f56c6c'};font-weight:bold;">${data.code === 0 ? '✓ 成功' : '✗ 失败'}</span></p>
        <p>${data.message || ''}</p>
        <pre style="background:#f5f7fa;padding:8px;font-size:12px;border-radius:4px;max-height:200px;overflow:auto;">${JSON.stringify(ir, null, 2)}</pre>
      </div>`, 'IOT注册结果',
      { dangerouslyUseHTMLString: true, type: data.code === 0 ? 'success' : 'error' }
    )
    loadAll()
  } catch (e) {
    loadingMsg.close()
    ElMessage.error('IOT注册请求失败')
  }
}

const syncFromIot = async (device) => {
  const loadingMsg = ElMessage({ message: '正在从七云IOT同步数据...', type: 'info', duration: 0 })
  try {
    const data = await request.post(`${API_BASE}/${device.id}/sync-iot`)
    loadingMsg.close()
    if (data.code === 0) {
      await ElMessageBox.alert(
        `<pre style="background:#f5f7fa;padding:10px;font-size:12px;border-radius:4px;max-height:300px;overflow:auto;">${JSON.stringify(data.data?.iot_result || {}, null, 2)}</pre>`,
        'IOT同步结果', { dangerouslyUseHTMLString: true, type: 'success' }
      )
      loadAll()
    } else {
      ElMessage.error(data.message || '同步失败')
    }
  } catch (e) {
    loadingMsg.close()
    ElMessage.error('同步请求失败')
  }
}

// ========== IMEI修改 ==========

const showEditImeiDialog = (device) => {
  editImeiForm.device_id = device.id
  editImeiForm.board_code = device.board_code || device.device_number
  editImeiForm.old_imei = device.imei
  editImeiForm.imei = ''
  editImeiForm.sync_to_iot = !!device.iot_registered
  editImeiDialogVisible.value = true
}

const submitUpdateImei = async () => {
  if (!editImeiForm.imei) return ElMessage.warning('请输入新的IMEI')
  submitting.value = true
  try {
    const data = await request.post(`${API_BASE}/${editImeiForm.device_id}/update-imei`, {
      imei: editImeiForm.imei, sync_to_iot: editImeiForm.sync_to_iot,
    })
    if (data.code === 0) {
      ElMessage.success(data.message || 'IMEI修改成功')
      editImeiDialogVisible.value = false
      loadDevices()
    } else {
      ElMessage.error(data.message || '修改失败')
    }
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// ========== 其他操作 ==========

const viewDevice = (device) => { currentDevice.value = device; detailDialogVisible.value = true }

const deleteDevice = async (device) => {
  await ElMessageBox.confirm(`确定要删除设备 ${device.board_code || device.device_number} 吗？此操作不可恢复。`, '确认删除', { type: 'warning' })
  try {
    const data = await request.delete(`${API_BASE}/${device.id}`)
    if (data.code === 0) { ElMessage.success('删除成功'); loadAll() }
    else ElMessage.error(data.message || '删除失败')
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

const resetSearch = () => { searchForm.keyword = ''; searchForm.status = ''; pagination.current_page = 1; loadDevices() }

// 初始化
onMounted(() => { loadStatistics(); loadDevices(); loadBrandsAndModels() })
</script>

<style scoped>
.device-stock-page { padding: 20px; }
.stats-row { margin-bottom: 20px; }
.stat-card { text-align: center; cursor: pointer; transition: transform 0.2s; }
.stat-card:hover { transform: translateY(-2px); }
.stat-value { font-size: 28px; font-weight: bold; color: #303133; }
.stat-label { font-size: 14px; color: #909399; margin-top: 8px; }
.stat-pending .stat-value { color: #909399; }
.stat-activated .stat-value { color: #67c23a; }
.stat-iot .stat-value { color: #409eff; }
.stat-today .stat-value { color: #e6a23c; }
.stat-month .stat-value { color: #f56c6c; }
.main-card { margin-bottom: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; gap: 8px; }
.search-form { margin-bottom: 16px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
.parsed-preview { margin-top: 16px; border: 1px solid #ebeef5; border-radius: 4px; }
.preview-header { padding: 10px 16px; background: #f5f7fa; font-weight: 500; display: flex; align-items: center; }
.batch-result { margin-top: 16px; }
.batch-result ul { text-align: left; margin: 10px 0; padding-left: 20px; }
</style>
