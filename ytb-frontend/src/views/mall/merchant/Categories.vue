<template>
  <div class="merchant-categories">
    <div class="page-header">
      <h1>商户商品分类管理</h1>
      <p>管理商户商城的商品分类</p>
    </div>

    <div class="action-bar">
      <el-button type="primary" @click="showCreateDialog = true">
        新增分类
      </el-button>
      <el-button @click="loadCategories">
        刷新
      </el-button>
    </div>

    <div class="categories-section">
      <el-table 
        :data="categories" 
        v-loading="loading"
        row-key="id"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="分类名称" min-width="200" />
        <el-table-column prop="sort" label="排序" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'danger'">
              {{ row.status ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editCategory(row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="row.status ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog 
      v-model="showCreateDialog" 
      :title="editingCategory ? '编辑分类' : '新增分类'"
      width="500px"
    >
      <el-form 
        ref="categoryFormRef"
        :model="categoryForm" 
        label-width="100px"
      >
        <el-form-item label="分类名称">
          <el-input 
            v-model="categoryForm.name" 
            placeholder="请输入分类名称"
          />
        </el-form-item>
        
        <el-form-item label="排序">
          <el-input-number 
            v-model="categoryForm.sort" 
            :min="0" 
            :max="9999"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-switch 
            v-model="categoryForm.status"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCategory" :loading="saving">
          {{ editingCategory ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { mallMerchantApi } from '@/api/v1/mall'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'MerchantCategories',
  setup() {
    const loading = ref(false)
    const saving = ref(false)
    const categories = ref([])
    const showCreateDialog = ref(false)
    const editingCategory = ref(null)
    const categoryFormRef = ref(null)

    const categoryForm = reactive({
      name: '',
      sort: 0,
      status: 1
    })

    const loadCategories = async () => {
      loading.value = true
      try {
        console.log('正在加载商户分类...')
        const response = await mallMerchantApi.getCategories()
        console.log('商户分类API响应:', response)
        
        if (response.code === 0) {
          categories.value = response.data || []
          console.log('商户分类数据:', categories.value)
        } else {
          ElMessage.error(response.message || '加载失败')
        }
      } catch (error) {
        console.error('加载商户分类失败:', error)
        ElMessage.error('加载失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    const resetForm = () => {
      Object.assign(categoryForm, {
        name: '',
        sort: 0,
        status: 1
      })
      editingCategory.value = null
    }

    const editCategory = (category) => {
      editingCategory.value = category
      Object.assign(categoryForm, {
        name: category.name,
        sort: category.sort || 0,
        status: category.status ? 1 : 0
      })
      showCreateDialog.value = true
    }

    const saveCategory = async () => {
      saving.value = true
      try {
        let response
        if (editingCategory.value) {
          response = await mallMerchantApi.updateCategory(editingCategory.value.id, categoryForm)
        } else {
          response = await mallMerchantApi.createCategory(categoryForm)
        }

        if (response.code === 0) {
          ElMessage.success(editingCategory.value ? '更新成功' : '创建成功')
          showCreateDialog.value = false
          resetForm()
          loadCategories()
        } else {
          ElMessage.error(response.message || '操作失败')
        }
      } catch (error) {
        console.error('保存分类失败:', error)
        ElMessage.error('操作失败: ' + error.message)
      } finally {
        saving.value = false
      }
    }

    const toggleStatus = async (category) => {
      const action = category.status ? '禁用' : '启用'
      
      try {
        await ElMessageBox.confirm(
          `确定要${action}分类"${category.name}"吗？`,
          '确认操作',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        const response = await mallMerchantApi.updateCategoryStatus(category.id, {
          status: category.status ? 0 : 1
        })
        
        if (response.code === 0) {
          ElMessage.success(`${action}成功`)
          loadCategories()
        } else {
          ElMessage.error(response.message || `${action}失败`)
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error(`${action}分类失败:`, error)
          ElMessage.error(`${action}失败`)
        }
      }
    }

    onMounted(() => {
      loadCategories()
    })

    return {
      loading,
      saving,
      categories,
      showCreateDialog,
      editingCategory,
      categoryForm,
      categoryFormRef,
      loadCategories,
      editCategory,
      saveCategory,
      toggleStatus
    }
  }
}
</script>

<style scoped>
.merchant-categories {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-header p {
  color: #6b7280;
  margin: 0;
}

.action-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
}

.categories-section {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
</style>
