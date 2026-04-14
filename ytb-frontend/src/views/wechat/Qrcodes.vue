<template>
  <div class="wechat-qrcodes-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.total_qrcodes || 0 }}</div>
            <div class="stat-label">二维码总数</div>
          </div>
          <el-icon class="stat-icon"><Grid /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.permanent_qrcodes || 0 }}</div>
            <div class="stat-label">永久二维码</div>
          </div>
          <el-icon class="stat-icon"><Stamp /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.total_scans || 0 }}</div>
            <div class="stat-label">总扫描次数</div>
          </div>
          <el-icon class="stat-icon"><View /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.total_subscribes || 0 }}</div>
            <div class="stat-label">扫码关注数</div>
          </div>
          <el-icon class="stat-icon"><UserFilled /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索和筛选 -->
    <el-card shadow="never" class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item label="关键词">
          <el-input 
            v-model="filters.keyword" 
            placeholder="名称/场景值"
            clearable
            style="width: 200px;"
            @keyup.enter="loadQrcodes"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filters.type" placeholder="全部" clearable style="width: 140px;">
            <el-option label="永久二维码" value="permanent" />
            <el-option label="临时二维码" value="temporary" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.is_enabled" placeholder="全部" clearable style="width: 100px;">
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadQrcodes">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 二维码列表 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>二维码列表</span>
          <el-button type="primary" @click="addQrcode">
            <el-icon><Plus /></el-icon>
            创建二维码
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="qrcodeList" style="width: 100%">
        <el-table-column label="二维码" width="100">
          <template #default="{ row }">
            <el-image 
              v-if="row.url" 
              :src="row.url" 
              :preview-src-list="[row.url]"
              style="width: 60px; height: 60px;"
              fit="contain"
            />
            <div v-else class="qrcode-placeholder">
              <el-icon><Grid /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="名称" prop="name" min-width="150" />
        <el-table-column label="场景值" prop="scene_value" width="180">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.scene_value }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.type === 'permanent' ? 'success' : 'warning'">
              {{ row.type === 'permanent' ? '永久' : '临时' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="扫描/关注" width="120">
          <template #default="{ row }">
            <span>{{ row.scan_count || 0 }} / {{ row.subscribe_count || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch 
              v-model="row.is_enabled" 
              @change="toggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button size="small" @click="editQrcode(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteQrcode(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadQrcodes"
          @current-change="loadQrcodes"
        />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑二维码' : '创建二维码'"
      width="600px"
    >
      <el-form :model="qrcodeForm" :rules="qrcodeRules" ref="qrcodeFormRef" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="qrcodeForm.name" placeholder="请输入二维码名称" />
        </el-form-item>

        <el-form-item label="类型" prop="type" v-if="!isEdit">
          <el-radio-group v-model="qrcodeForm.type">
            <el-radio value="permanent">永久二维码</el-radio>
            <el-radio value="temporary">临时二维码</el-radio>
          </el-radio-group>
          <div class="form-tip">永久二维码无过期时间，临时二维码最长30天有效</div>
        </el-form-item>

        <el-form-item label="场景类型" prop="scene_type" v-if="!isEdit">
          <el-radio-group v-model="qrcodeForm.scene_type">
            <el-radio value="str">字符串场景</el-radio>
            <el-radio value="id">数字场景</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="场景值" v-if="!isEdit">
          <el-input v-model="qrcodeForm.scene_value" placeholder="留空自动生成" />
          <div class="form-tip">用于标识二维码来源，可用于统计渠道效果</div>
        </el-form-item>

        <el-form-item label="有效期" v-if="qrcodeForm.type === 'temporary' && !isEdit">
          <el-input-number 
            v-model="qrcodeForm.expire_seconds" 
            :min="60" 
            :max="2592000"
            :step="86400"
          />
          <span style="margin-left: 8px;">秒（最长30天）</span>
        </el-form-item>

        <el-form-item label="扫码回复">
          <el-input 
            v-model="qrcodeForm.reply_content" 
            type="textarea" 
            :rows="3"
            placeholder="用户扫码后自动回复的内容（可选）"
          />
        </el-form-item>

        <el-form-item label="启用状态">
          <el-switch v-model="qrcodeForm.is_enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveQrcode" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="二维码详情" width="600px">
      <el-descriptions v-if="currentQrcode" :column="2" border>
        <el-descriptions-item label="二维码" :span="2">
          <el-image 
            v-if="currentQrcode.url" 
            :src="currentQrcode.url" 
            style="width: 150px; height: 150px;"
            fit="contain"
          />
          <span v-else class="text-gray">暂无二维码图片</span>
        </el-descriptions-item>
        <el-descriptions-item label="名称">{{ currentQrcode.name }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag :type="currentQrcode.type === 'permanent' ? 'success' : 'warning'">
            {{ currentQrcode.type === 'permanent' ? '永久二维码' : '临时二维码' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="场景值">{{ currentQrcode.scene_value }}</el-descriptions-item>
        <el-descriptions-item label="场景类型">{{ currentQrcode.scene_type === 'str' ? '字符串' : '数字' }}</el-descriptions-item>
        <el-descriptions-item label="扫描次数">{{ currentQrcode.scan_count || 0 }}</el-descriptions-item>
        <el-descriptions-item label="关注次数">{{ currentQrcode.subscribe_count || 0 }}</el-descriptions-item>
        <el-descriptions-item label="扫码回复" :span="2">{{ currentQrcode.reply_content || '无' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(currentQrcode.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentQrcode.is_enabled ? 'success' : 'danger'">
            {{ currentQrcode.is_enabled ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Grid, Stamp, View, UserFilled, Search, Plus } from '@element-plus/icons-vue'
import * as wechatApi from '@/api/v1/wechat'

// 状态
const loading = ref(false)
const saving = ref(false)
const stats = ref({})
const qrcodeList = ref([])

// 筛选条件
const filters = reactive({
  keyword: '',
  type: '',
  is_enabled: ''
})

// 分页
const pagination = reactive({
  page: 1,
  per_page: 20,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const currentQrcode = ref(null)
const qrcodeFormRef = ref()
const qrcodeForm = reactive({
  id: null,
  name: '',
  type: 'permanent',
  scene_type: 'str',
  scene_value: '',
  expire_seconds: 2592000,
  reply_content: '',
  is_enabled: true
})

const qrcodeRules = {
  name: [{ required: true, message: '请输入二维码名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  scene_type: [{ required: true, message: '请选择场景类型', trigger: 'change' }]
}

// 生命周期
onMounted(() => {
  loadStats()
  loadQrcodes()
})

// 方法
const loadStats = async () => {
  try {
    const res = await wechatApi.getQrcodeStatistics()
    if (res.code === 0) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

const loadQrcodes = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.per_page,
      ...filters
    }
    const res = await wechatApi.getQrcodeList(params)
    if (res.code === 0) {
      qrcodeList.value = res.data.data || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载二维码列表失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  Object.assign(filters, { keyword: '', type: '', is_enabled: '' })
  pagination.page = 1
  loadQrcodes()
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const addQrcode = () => {
  isEdit.value = false
  Object.assign(qrcodeForm, {
    id: null,
    name: '',
    type: 'permanent',
    scene_type: 'str',
    scene_value: '',
    expire_seconds: 2592000,
    reply_content: '',
    is_enabled: true
  })
  dialogVisible.value = true
}

const editQrcode = (qrcode) => {
  isEdit.value = true
  Object.assign(qrcodeForm, {
    id: qrcode.id,
    name: qrcode.name,
    type: qrcode.type,
    scene_type: qrcode.scene_type,
    scene_value: qrcode.scene_value,
    expire_seconds: qrcode.expire_seconds || 2592000,
    reply_content: qrcode.reply_content || '',
    is_enabled: qrcode.is_enabled
  })
  dialogVisible.value = true
}

const viewDetail = (qrcode) => {
  currentQrcode.value = qrcode
  detailVisible.value = true
}

const saveQrcode = async () => {
  try {
    await qrcodeFormRef.value?.validate()
    saving.value = true

    let res
    if (isEdit.value) {
      res = await wechatApi.updateQrcode(qrcodeForm.id, qrcodeForm)
    } else {
      res = await wechatApi.createQrcode(qrcodeForm)
    }

    if (res.code === 0) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      loadQrcodes()
      loadStats()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

const deleteQrcode = async (qrcode) => {
  try {
    await ElMessageBox.confirm('确定要删除这个二维码吗？', '确认删除', { type: 'warning' })

    const res = await wechatApi.deleteQrcode(qrcode.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      loadQrcodes()
      loadStats()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const toggleStatus = async (qrcode) => {
  try {
    const res = await wechatApi.toggleQrcodeStatus(qrcode.id)
    if (res.code === 0) {
      ElMessage.success(res.message)
    } else {
      qrcode.is_enabled = !qrcode.is_enabled
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    qrcode.is_enabled = !qrcode.is_enabled
    console.error('切换状态失败:', error)
    ElMessage.error('操作失败')
  }
}
</script>

<style scoped>
.wechat-qrcodes-page {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-content {
  position: relative;
  z-index: 2;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 48px;
  color: #e4e7ed;
  z-index: 1;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.qrcode-placeholder {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 24px;
  color: #909399;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.text-gray {
  color: #909399;
}
</style>
