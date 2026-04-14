<template>
  <div class="mall-categories">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>商品分类管理</h1>
      <p>统一管理官方商城和商户商城的商品分类</p>
    </div>

    <!-- 筛选和操作栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-select 
          v-model="filters.type" 
          placeholder="分类类型" 
          style="width: 150px; margin-right: 10px;"
          @change="loadCategories"
        >
          <el-option label="全部分类" value="" />
          <el-option label="官方分类" value="official" />
          <el-option label="商户分类" value="merchant" />
        </el-select>
        
        <el-select 
          v-model="filters.status" 
          placeholder="状态" 
          style="width: 120px; margin-right: 10px;"
          @change="loadCategories"
        >
          <el-option label="全部状态" value="" />
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>

        <el-input
          v-model="filters.keyword"
          placeholder="搜索分类名称"
          style="width: 200px; margin-right: 10px;"
          @keyup.enter="loadCategories"
          clearable
        >
          <template #append>
            <el-button @click="loadCategories">搜索</el-button>
          </template>
        </el-input>
      </div>

      <div class="filter-right">
        <el-button type="primary" @click="showCreateDialog">
          新增分类
        </el-button>
        <el-button @click="loadCategories">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 分类统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon official">
                <i class="el-icon-shop"></i>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ stats.official.total }}</div>
                <div class="stats-label">官方分类</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon merchant">
                <i class="el-icon-store"></i>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ stats.merchant.total }}</div>
                <div class="stats-label">商户分类</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon active">
                <i class="el-icon-check"></i>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ stats.active }}</div>
                <div class="stats-label">启用分类</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon inactive">
                <i class="el-icon-close"></i>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ stats.inactive }}</div>
                <div class="stats-label">禁用分类</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 分类列表 -->
    <div class="categories-section">
      <el-table 
        :data="categories" 
        v-loading="loading"
        row-key="id"
        border
        stripe
      >
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column prop="name" label="分类名称" min-width="200">
          <template #default="{ row }">
            <div class="category-name">
              <span>{{ row.name }}</span>
              <el-tag 
                :type="row.mch_id === 0 ? 'primary' : 'success'" 
                size="small"
                style="margin-left: 8px;"
              >
                {{ row.mch_id === 0 ? '官方' : '商户' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="merchant_name" label="所属商户" width="150">
          <template #default="{ row }">
            <span v-if="row.mch_id === 0" class="official-tag">官方商城</span>
            <span v-else>{{ row.merchant_name || `商户${row.mch_id}` }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="sort" label="排序" width="100" />
        
        <el-table-column prop="goods_count" label="商品数量" width="100">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.goods_count || 0 }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'danger'">
              {{ row.status ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editCategory(row)">
              编辑
            </el-button>
            <el-button 
              size="small" 
              :type="row.status ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status ? '禁用' : '启用' }}
            </el-button>
            <el-button 
              size="small" 
              type="danger"
              @click="deleteCategory(row)"
              :disabled="row.goods_count > 0"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadCategories"
          @current-change="loadCategories"
        />
      </div>
    </div>

    <!-- 新增/编辑分类对话框 -->
    <el-dialog 
      v-model="showDialog" 
      :title="editingCategory ? '编辑分类' : '新增分类'"
      width="600px"
    >
      <el-form 
        ref="categoryFormRef"
        :model="categoryForm" 
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="分类类型" prop="type">
          <el-radio-group v-model="categoryForm.type" :disabled="!!editingCategory">
            <el-radio label="official">官方分类</el-radio>
            <el-radio label="merchant">商户分类</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item 
          v-if="categoryForm.type === 'merchant'" 
          label="所属商户" 
          prop="mch_id"
        >
          <el-select 
            v-model="categoryForm.mch_id" 
            placeholder="请选择商户"
            style="width: 100%"
            filterable
          >
            <el-option 
              v-for="merchant in merchants"
              :key="merchant.id"
              :label="merchant.name"
              :value="merchant.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="分类名称" prop="name">
          <el-input 
            v-model="categoryForm.name" 
            placeholder="请输入分类名称"
          />
        </el-form-item>
        
        <el-form-item label="排序" prop="sort">
          <el-input-number 
            v-model="categoryForm.sort" 
            :min="0" 
            :max="9999"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-switch 
            v-model="categoryForm.status"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveCategory" :loading="saving">
          {{ editingCategory ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { mallOfficialApi, mallMerchantApi, mallCategoriesApi } from '@/api/v1/mall'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'MallCategories',
  setup() {
    const route = useRoute()
    const loading = ref(false)
    const saving = ref(false)
    const categories = ref([])
    const merchants = ref([])
    const showDialog = ref(false)
    const editingCategory = ref(null)
    const categoryFormRef = ref(null)

    const filters = reactive({
      type: '',
      status: '',
      keyword: ''
    })

    const pagination = reactive({
      page: 1,
      size: 20,
      total: 0
    })

    const categoryForm = reactive({
      type: 'official',
      name: '',
      mch_id: null,
      sort: 0,
      status: 1
    })

    const formRules = {
      type: [
        { required: true, message: '请选择分类类型', trigger: 'change' }
      ],
      name: [
        { required: true, message: '请输入分类名称', trigger: 'blur' },
        { min: 1, max: 50, message: '分类名称长度在1到50个字符', trigger: 'blur' }
      ],
      mch_id: [
        { 
          validator: (rule, value, callback) => {
            if (categoryForm.type === 'merchant' && !value) {
              callback(new Error('请选择所属商户'))
            } else {
              callback()
            }
          }, 
          trigger: 'change' 
        }
      ]
    }

    // 统计数据
    const stats = ref({
      official: { total: 0 },
      merchant: { total: 0 },
      active: 0,
      inactive: 0
    })

    // 加载统计数据
    const loadStats = async () => {
      try {
        const response = await mallCategoriesApi.getCategoryStats()
        if (response.code === 0) {
          stats.value = {
            official: response.data.official,
            merchant: response.data.merchant,
            active: response.data.total.active,
            inactive: response.data.total.inactive
          }
        }
      } catch (error) {
        console.error('加载统计失败:', error)
      }
    }

    // 加载分类数据
    const loadCategories = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.page,
          size: pagination.size,
          ...filters
        }

        // 使用综合分类API
        const response = await mallCategoriesApi.getAllCategories(params)
        
        if (response.code === 0) {
          categories.value = response.data?.data || []
          pagination.total = response.data?.total || 0
        } else {
          ElMessage.error(response.message || '加载失败')
        }
      } catch (error) {
        console.error('加载分类失败:', error)
        ElMessage.error('加载失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    // 加载商户列表
    const loadMerchants = async () => {
      try {
        const response = await mallMerchantApi.getMerchants({ status: 1 })
        if (response.code === 0) {
          merchants.value = response.data?.data || []
        }
      } catch (error) {
        console.error('加载商户失败:', error)
      }
    }

    // 显示创建对话框
    const showCreateDialog = () => {
      resetForm()
      showDialog.value = true
    }

    // 重置表单
    const resetForm = () => {
      Object.assign(categoryForm, {
        type: 'official',
        name: '',
        mch_id: null,
        sort: 0,
        status: 1
      })
      editingCategory.value = null
      if (categoryFormRef.value) {
        categoryFormRef.value.clearValidate()
      }
    }

    // 编辑分类
    const editCategory = (category) => {
      editingCategory.value = category
      Object.assign(categoryForm, {
        type: category.mch_id === 0 ? 'official' : 'merchant',
        name: category.name,
        mch_id: category.mch_id || null,
        sort: category.sort || 0,
        status: category.status ? 1 : 0
      })
      showDialog.value = true
    }

    // 保存分类
    const saveCategory = async () => {
      if (!categoryFormRef.value) return
      
      try {
        await categoryFormRef.value.validate()
      } catch (error) {
        return
      }

      saving.value = true
      try {
        const formData = { ...categoryForm }
        if (formData.type === 'official') {
          formData.mch_id = 0
        }

        let response
        if (editingCategory.value) {
          response = await mallCategoriesApi.updateCategory(editingCategory.value.id, formData)
        } else {
          response = await mallCategoriesApi.createCategory(formData)
        }

        if (response.code === 0) {
          ElMessage.success(editingCategory.value ? '更新成功' : '创建成功')
          closeDialog()
          loadCategories()
          loadStats()
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

    // 切换状态
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

        const response = await mallCategoriesApi.updateCategoryStatus(category.id, category.mch_id, {
          status: category.status ? 0 : 1
        })

        if (response.code === 0) {
          ElMessage.success(`${action}成功`)
          loadCategories()
          loadStats()
        } else {
          ElMessage.error(response.message || `${action}失败`)
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error(`${action}分类失败:`, error)
          ElMessage.error(`${action}失败: ` + error.message)
        }
      }
    }

    // 删除分类
    const deleteCategory = async (category) => {
      if (category.goods_count > 0) {
        ElMessage.warning('该分类下还有商品，无法删除')
        return
      }

      try {
        await ElMessageBox.confirm(
          `确定要删除分类"${category.name}"吗？此操作不可恢复！`,
          '确认删除',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'error'
          }
        )

        const response = await mallCategoriesApi.deleteCategory(category.id, category.mch_id)

        if (response.code === 0) {
          ElMessage.success('删除成功')
          loadCategories()
          loadStats()
        } else {
          ElMessage.error(response.message || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除分类失败:', error)
          ElMessage.error('删除失败: ' + error.message)
        }
      }
    }

    // 关闭对话框
    const closeDialog = () => {
      showDialog.value = false
      resetForm()
    }

    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN')
    }

    // 根据路由设置默认筛选类型
    const setDefaultFilter = () => {
      if (route.name === 'OfficialCategories') {
        filters.type = 'official'
      } else if (route.name === 'MerchantCategories') {
        filters.type = 'merchant'
      } else {
        filters.type = ''
      }
    }

    // 初始化数据
    const initData = async () => {
      await Promise.all([
        loadStats(),
        loadCategories(),
        loadMerchants()
      ])
    }

    // 监听路由变化
    watch(() => route.name, () => {
      setDefaultFilter()
      loadCategories()
      loadStats()
    })

    onMounted(() => {
      setDefaultFilter()
      initData()
    })

    return {
      loading,
      saving,
      categories,
      merchants,
      showDialog,
      editingCategory,
      categoryFormRef,
      filters,
      pagination,
      categoryForm,
      formRules,
      stats,
      loadCategories,
      showCreateDialog,
      editCategory,
      saveCategory,
      toggleStatus,
      deleteCategory,
      closeDialog,
      formatDate
    }
  }
}
</script>

<style scoped>
.mall-categories {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-left {
  display: flex;
  align-items: center;
}

.filter-right {
  display: flex;
  gap: 10px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stats-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.stats-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.stats-icon.official {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stats-icon.merchant {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stats-icon.active {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stats-icon.inactive {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stats-info {
  flex: 1;
}

.stats-number {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stats-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.categories-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.category-name {
  display: flex;
  align-items: center;
}

.official-tag {
  color: #409eff;
  font-weight: 500;
}

.pagination-wrapper {
  padding: 20px;
  text-align: right;
  border-top: 1px solid #ebeef5;
}

:deep(.el-table) {
  border: none;
}

:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f0f0f0;
}

:deep(.el-table tr:hover > td) {
  background-color: #f5f7fa;
}
</style>
