<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><ShoppingBag /></el-icon>
          套餐管理
        </h2>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          新增套餐
        </el-button>
      </div>
    </div>

    <!-- 套餐列表 -->
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="套餐名称" width="180" />
      <el-table-column prop="flow" label="流量(L)" width="100" align="right" />
      <el-table-column prop="price" label="价格(元)" width="100" align="right">
        <template #default="{ row }">
          <span style="color: #f56c6c; font-weight: 600;">¥{{ row.price }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="validity_days" label="有效期(天)" width="100" align="center" />
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-switch
            v-model="row.is_enabled"
            @change="toggleStatus(row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="sort_order" label="排序" width="80" align="center" />
      <el-table-column label="操作" width="150" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="editPackage(row)">
            编辑
          </el-button>
          <el-button type="danger" link size="small" @click="deletePackage(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑套餐' : '新增套餐'"
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="套餐名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入套餐名称" />
        </el-form-item>
        <el-form-item label="流量(L)" prop="flow">
          <el-input-number v-model="form.flow" :min="1" :max="999999" />
        </el-form-item>
        <el-form-item label="价格(元)" prop="price">
          <el-input-number v-model="form.price" :min="0.01" :precision="2" :step="10" />
        </el-form-item>
        <el-form-item label="有效期(天)" prop="validity_days">
          <el-input-number v-model="form.validity_days" :min="1" :max="3650" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="套餐描述" />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="form.sort_order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="form.is_enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ShoppingBag, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

const loading = ref(false)
const list = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  name: '',
  flow: 1000,
  price: 99,
  validity_days: 365,
  description: '',
  sort_order: 0,
  is_enabled: true
})

const rules = {
  name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  flow: [{ required: true, message: '请输入流量', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }]
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/api/admin/water-purifier/packages',
      method: 'get'
    })
    if (res.code === 0) {
      list.value = res.data || []
    }
  } catch (error) {
    ElMessage.error('获取套餐列表失败')
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  isEdit.value = false
  Object.assign(form, {
    id: null,
    name: '',
    flow: 1000,
    price: 99,
    validity_days: 365,
    description: '',
    sort_order: 0,
    is_enabled: true
  })
  dialogVisible.value = true
}

const editPackage = (row) => {
  isEdit.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

const submitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  submitLoading.value = true
  try {
    const url = isEdit.value 
      ? `/api/admin/water-purifier/packages/${form.id}` 
      : '/api/admin/water-purifier/packages'
    const method = isEdit.value ? 'put' : 'post'
    
    const res = await request({ url, method, data: form })
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
    await request({
      url: `/api/admin/water-purifier/packages/${row.id}`,
      method: 'put',
      data: { is_enabled: row.is_enabled }
    })
    ElMessage.success('状态更新成功')
  } catch (error) {
    row.is_enabled = !row.is_enabled
    ElMessage.error('状态更新失败')
  }
}

const deletePackage = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除此套餐吗？', '确认删除', { type: 'warning' })
    await request({
      url: `/api/admin/water-purifier/packages/${row.id}`,
      method: 'delete'
    })
    ElMessage.success('删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.app-container { padding: 20px; }
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title {
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}
</style>
