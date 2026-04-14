<template>
  <div class="ytb-posters-page">
    <el-card class="filter-card">
      <div class="filter-header">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增海报
        </el-button>
      </div>
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="海报标题"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filters.type" placeholder="全部类型" clearable>
            <el-option label="拓展伙伴" value="partner" />
            <el-option label="发展客户" value="customer" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="posters"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="海报" width="160">
          <template #default="{ row }">
            <el-image
              v-if="row.image_url"
              :src="row.image_url"
              :preview-src-list="[row.image_url]"
              fit="cover"
              style="width: 120px; height: 70px; border-radius: 6px;"
              preview-teleported
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ typeLabelMap[row.type] || row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row, $event)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.perPage"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="海报标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入海报标题" />
        </el-form-item>
        <el-form-item label="海报类型" prop="type">
          <el-radio-group v-model="formData.type">
            <el-radio label="partner">拓展伙伴</el-radio>
            <el-radio label="customer">发展客户</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="海报图片" prop="image_url">
          <ImageUpload
            v-model="formData.image_url"
            :width="240"
            :height="135"
            upload-type="image"
            upload-folder="ytb-posters"
            placeholder="上传海报"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="可选描述"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="formData.sort_order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import ImageUpload from '@/components/ImageUpload.vue'
import {
  getPosters,
  createPoster,
  updatePoster,
  deletePoster,
  updatePosterStatus
} from '@/api/v1/ytb'

const loading = ref(false)
const posters = ref([])
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const typeLabelMap = {
  partner: '拓展伙伴',
  customer: '发展客户'
}

const filters = reactive({
  keyword: '',
  type: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  perPage: 15,
  total: 0
})

const defaultFormData = () => ({
  id: null,
  title: '',
  type: 'partner',
  image_url: '',
  description: '',
  sort_order: 0,
  status: 1
})

const formData = reactive(defaultFormData())

const formRules = {
  title: [{ required: true, message: '请输入海报标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择海报类型', trigger: 'change' }],
  image_url: [{ required: true, message: '请上传海报图片', trigger: 'change' }],
  sort_order: [{ required: true, message: '请输入排序', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const dialogTitle = computed(() => (formData.id ? '编辑海报' : '新增海报'))

const loadPosters = async () => {
  loading.value = true
  try {
    const res = await getPosters({
      page: pagination.page,
      per_page: pagination.perPage,
      keyword: filters.keyword,
      type: filters.type,
      status: filters.status
    })
    if (res.code === 0) {
      posters.value = res.data.items || []
      pagination.total = res.data.total || 0
    } else {
      ElMessage.error(res.message || '加载海报失败')
    }
  } catch (error) {
    console.error('加载海报失败:', error)
    ElMessage.error('加载海报失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadPosters()
}

const handleReset = () => {
  filters.keyword = ''
  filters.type = ''
  filters.status = ''
  pagination.page = 1
  loadPosters()
}

const handleSizeChange = (size) => {
  pagination.perPage = size
  pagination.page = 1
  loadPosters()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadPosters()
}

const handleAdd = () => {
  Object.assign(formData, defaultFormData())
  dialogVisible.value = true
}

const handleEdit = (row) => {
  Object.assign(formData, {
    id: row.id,
    title: row.title,
    type: row.type,
    image_url: row.image_url,
    description: row.description || '',
    sort_order: row.sort_order ?? 0,
    status: row.status
  })
  dialogVisible.value = true
}

const handleDialogClose = () => {
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload = {
        title: formData.title,
        type: formData.type,
        image_url: formData.image_url,
        description: formData.description,
        sort_order: formData.sort_order,
        status: formData.status
      }
      const res = formData.id
        ? await updatePoster(formData.id, payload)
        : await createPoster(payload)
      if (res.code === 0) {
        ElMessage.success(formData.id ? '更新成功' : '创建成功')
        dialogVisible.value = false
        loadPosters()
      } else {
        ElMessage.error(res.message || '保存失败')
      }
    } catch (error) {
      console.error('保存海报失败:', error)
      ElMessage.error('保存海报失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该海报吗？', '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
    .then(async () => {
      try {
        const res = await deletePoster(row.id)
        if (res.code === 0) {
          ElMessage.success('删除成功')
          loadPosters()
        } else {
          ElMessage.error(res.message || '删除失败')
        }
      } catch (error) {
        console.error('删除失败:', error)
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

const handleStatusChange = async (row, newStatus) => {
  const originalStatus = Number(newStatus) === 1 ? 0 : 1
  try {
    const res = await updatePosterStatus(row.id, newStatus)
    if (res.code !== 0) {
      row.status = originalStatus
      ElMessage.error(res.message || '状态更新失败')
    }
  } catch (error) {
    row.status = originalStatus
    ElMessage.error('状态更新失败')
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return String(dateStr).replace('T', ' ').substring(0, 19)
}

onMounted(() => {
  loadPosters()
})
</script>

<style scoped>
.ytb-posters-page {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}
</style>
