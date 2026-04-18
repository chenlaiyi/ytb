<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><ShoppingBag /></el-icon>
          套餐管理
        </h2>
        <span class="subtitle">管理净水器充值套餐，与点点够系统同步</span>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          新增套餐
        </el-button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-select v-model="filter.brand" placeholder="品牌" clearable @change="fetchList" style="width: 140px">
        <el-option label="净之泉" value="净之泉" />
        <el-option label="华迈" value="华迈" />
        <el-option label="万达" value="万达" />
      </el-select>
      <el-select v-model="filter.device_model" placeholder="设备型号" clearable @change="fetchList" style="width: 140px">
        <el-option label="小扁豆" value="小扁豆" />
        <el-option label="大扁豆" value="大扁豆" />
        <el-option label="屠龙" value="屠龙" />
        <el-option label="商务机" value="商务机" />
        <el-option label="200G" value="200G" />
      </el-select>
      <el-select v-model="filter.type" placeholder="套餐类型" clearable @change="fetchList" style="width: 140px">
        <el-option label="流量套餐" value="flow" />
        <el-option label="包年套餐" value="yearly" />
      </el-select>
      <el-select v-model="filter.is_active" placeholder="状态" clearable @change="fetchList" style="width: 120px">
        <el-option label="已启用" :value="1" />
        <el-option label="已禁用" :value="0" />
      </el-select>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">{{ list.length }}</div>
        <div class="stat-label">套餐总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ list.filter(i => i.is_active).length }}</div>
        <div class="stat-label">已启用</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ list.filter(i => i.type === 'flow').length }}</div>
        <div class="stat-label">流量套餐</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ list.filter(i => i.type === 'yearly').length }}</div>
        <div class="stat-label">包年套餐</div>
      </div>
    </div>

    <!-- 套餐列表 -->
    <el-table v-loading="loading" :data="list" border stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="60" align="center" />
      <el-table-column label="套餐信息" min-width="200">
        <template #default="{ row }">
          <div style="font-weight: 600;">{{ row.name }}</div>
          <div style="font-size: 12px; color: #909399;">{{ row.code }}</div>
        </template>
      </el-table-column>
      <el-table-column label="品牌/型号" width="130" align="center">
        <template #default="{ row }">
          <div v-if="row.brand">
            <el-tag size="small" effect="plain">{{ row.brand }}</el-tag>
            <div style="font-size: 12px; color: #606266; margin-top: 2px;">{{ row.device_model }}</div>
          </div>
          <span v-else style="color: #c0c4cc">通用</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.type === 'flow' ? 'primary' : row.type === 'yearly' ? 'success' : 'warning'" size="small">
            {{ typeMap[row.type] || row.type }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="规格" width="120" align="center">
        <template #default="{ row }">
          <span v-if="row.type === 'flow'">{{ row.flow_limit }}L</span>
          <span v-else-if="row.type === 'yearly'">{{ row.days }}天</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="价格" width="140" align="right">
        <template #default="{ row }">
          <div style="color: #f56c6c; font-weight: 700; font-size: 15px;">¥{{ row.price }}</div>
          <div v-if="row.original_price && row.original_price > row.price" style="font-size: 12px; color: #c0c4cc; text-decoration: line-through;">¥{{ row.original_price }}</div>
        </template>
      </el-table-column>
      <el-table-column label="提成" width="120" align="center">
        <template #default="{ row }">
          <div>{{ row.commission_rate }}%</div>
          <div style="color: #67c23a; font-weight: 600;">¥{{ row.commission_amount }}</div>
        </template>
      </el-table-column>
      <el-table-column label="标签" width="120" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.is_first_only" type="warning" size="small" effect="plain" style="margin: 2px;">首次</el-tag>
          <el-tag v-if="row.is_renewal_only" type="info" size="small" effect="plain" style="margin: 2px;">续费</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-switch
            v-model="row.is_active"
            @change="toggleStatus(row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="sort_order" label="排序" width="70" align="center" />
      <el-table-column label="操作" width="140" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="editPackage(row)">编辑</el-button>
          <el-button type="danger" link size="small" @click="deletePackage(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑套餐' : '新增套餐'" width="620px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="套餐名称" prop="name">
              <el-input v-model="form.name" placeholder="如：4000L流量套餐" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="套餐编码" prop="code">
              <el-input v-model="form.code" placeholder="如：JZQ_XBD_FLOW_4000" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="品牌" prop="brand">
              <el-select v-model="form.brand" placeholder="选择品牌" clearable style="width: 100%">
                <el-option label="净之泉" value="净之泉" />
                <el-option label="华迈" value="华迈" />
                <el-option label="万达" value="万达" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备型号" prop="device_model">
              <el-select v-model="form.device_model" placeholder="选择型号" clearable style="width: 100%">
                <el-option label="小扁豆" value="小扁豆" />
                <el-option label="大扁豆" value="大扁豆" />
                <el-option label="屠龙" value="屠龙" />
                <el-option label="商务机" value="商务机" />
                <el-option label="200G" value="200G" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="套餐类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio-button value="flow">流量计费</el-radio-button>
            <el-radio-button value="yearly">包年计费</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12" v-if="form.type === 'flow'">
            <el-form-item label="流量上限(L)">
              <el-input-number v-model="form.flow_limit" :min="1" :max="999999" :step="500" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.type === 'yearly'">
            <el-form-item label="有效期(天)">
              <el-input-number v-model="form.days" :min="1" :max="3650" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.type === 'flow'">
            <el-form-item label="单价(元/L)">
              <el-input-number v-model="form.unit_price" :min="0" :precision="2" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="售价(元)" prop="price">
              <el-input-number v-model="form.price" :min="0.01" :precision="2" :step="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="原价(元)">
              <el-input-number v-model="form.original_price" :min="0" :precision="2" :step="100" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="提成比例(%)">
              <el-input-number v-model="form.commission_rate" :min="0" :max="100" :precision="1" :step="5" @change="calcCommission" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="提成金额">
              <el-input-number v-model="form.commission_amount" :min="0" :precision="2" disabled style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序">
              <el-input-number v-model="form.sort_order" :min="0" :max="999" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="套餐描述" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="启用">
              <el-switch v-model="form.is_active" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="仅限首次">
              <el-switch v-model="form.is_first_only" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="仅限续费">
              <el-switch v-model="form.is_renewal_only" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ShoppingBag, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

const loading = ref(false)
const list = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

const typeMap = { flow: '流量', yearly: '包年', deposit: '押金' }

const filter = reactive({
  brand: '',
  device_model: '',
  type: '',
  is_active: ''
})

const defaultForm = {
  id: null, name: '', code: '', description: '',
  type: 'flow', price: 980, original_price: null,
  flow_limit: 4000, days: 365, unit_price: null,
  brand: '净之泉', device_model: '小扁豆',
  billing_mode: 'prepaid',
  is_active: true, is_first_only: false, is_renewal_only: false,
  commission_rate: 30, commission_amount: 294,
  sort_order: 0
}

const form = reactive({ ...defaultForm })

const rules = {
  name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择套餐类型', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }]
}

const calcCommission = () => {
  form.commission_amount = Math.round(form.price * form.commission_rate) / 100
}
watch(() => form.price, calcCommission)

const fetchList = async () => {
  loading.value = true
  try {
    const params = {}
    if (filter.brand) params.brand = filter.brand
    if (filter.device_model) params.device_model = filter.device_model
    if (filter.type) params.type = filter.type
    if (filter.is_active !== '') params.is_active = filter.is_active
    const res = await request({ url: '/api/admin/water-purifier/packages', method: 'get', params })
    if (res.code === 0) list.value = res.data || []
  } catch (error) {
    ElMessage.error('获取套餐列表失败')
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  isEdit.value = false
  Object.assign(form, { ...defaultForm })
  dialogVisible.value = true
}

const editPackage = (row) => {
  isEdit.value = true
  Object.assign(form, {
    id: row.id, name: row.name, code: row.code, description: row.description || '',
    type: row.type, price: row.price, original_price: row.original_price,
    flow_limit: row.flow_limit, days: row.days, unit_price: row.unit_price,
    brand: row.brand, device_model: row.device_model,
    billing_mode: row.billing_mode || 'prepaid',
    is_active: row.is_active, is_first_only: row.is_first_only, is_renewal_only: row.is_renewal_only,
    commission_rate: row.commission_rate, commission_amount: row.commission_amount,
    sort_order: row.sort_order
  })
  dialogVisible.value = true
}

const submitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    const url = isEdit.value ? `/api/admin/water-purifier/packages/${form.id}` : '/api/admin/water-purifier/packages'
    const method = isEdit.value ? 'put' : 'post'
    const res = await request({ url, method, data: { ...form } })
    if (res.code === 0) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      fetchList()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const toggleStatus = async (row) => {
  try {
    await request({ url: `/api/admin/water-purifier/packages/${row.id}`, method: 'put', data: { is_active: row.is_active } })
    ElMessage.success('状态更新成功')
  } catch (error) {
    row.is_active = !row.is_active
    ElMessage.error('状态更新失败')
  }
}

const deletePackage = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除套餐「${row.name}」(${row.code}) 吗？`, '确认删除', { type: 'warning' })
    await request({ url: `/api/admin/water-purifier/packages/${row.id}`, method: 'delete' })
    ElMessage.success('删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(() => { fetchList() })
</script>

<style scoped>
.app-container { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.header-left { display: flex; flex-direction: column; gap: 4px; }
.page-title { font-size: 24px; font-weight: 600; display: flex; align-items: center; gap: 8px; margin: 0; }
.subtitle { font-size: 13px; color: #909399; margin-left: 32px; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.stats-row { display: flex; gap: 16px; margin-bottom: 20px; }
.stat-card { flex: 1; background: #fff; border-radius: 8px; padding: 16px 20px; border: 1px solid #ebeef5; text-align: center; }
.stat-value { font-size: 28px; font-weight: 700; color: #409eff; }
.stat-card:nth-child(2) .stat-value { color: #67c23a; }
.stat-card:nth-child(3) .stat-value { color: #e6a23c; }
.stat-card:nth-child(4) .stat-value { color: #909399; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }
</style>
