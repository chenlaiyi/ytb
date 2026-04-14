<template>
  <div class="app-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>商品分类管理</h2>
      <p>管理商城商品分类，支持多级分类结构</p>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-container">
      <el-input
        v-model="listQuery.keyword"
        placeholder="分类名称"
        style="width: 200px;"
        class="filter-item"
        @keyup.enter="handleFilter"
        clearable
      />
      <el-select
        v-model="listQuery.status"
        placeholder="状态"
        style="width: 120px;"
        class="filter-item"
        clearable
      >
        <el-option label="启用" :value="1" />
        <el-option label="禁用" :value="0" />
      </el-select>
      <el-button class="filter-item" type="primary" icon="Search" @click="handleFilter">
        搜索
      </el-button>
      <el-button class="filter-item" type="primary" icon="Plus" @click="handleCreate">
        添加分类
      </el-button>
      <el-button 
        class="filter-item" 
        type="success" 
        icon="Refresh" 
        @click="fetchData"
        :loading="listLoading"
      >
        刷新
      </el-button>
    </div>

    <!-- 统计信息 -->
    <div class="stats-container" v-if="stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">总分类数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ stats.enabled }}</div>
            <div class="stat-label">启用分类</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ stats.disabled }}</div>
            <div class="stat-label">禁用分类</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ stats.featured }}</div>
            <div class="stat-label">推荐分类</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 分类表格 -->
    <el-table
      v-loading="listLoading"
      :data="list"
      element-loading-text="加载中..."
      row-key="id"
      border
      default-expand-all
      :tree-props="{children: 'children'}"
      highlight-current-row
      style="width: 100%;"
    >
      <el-table-column prop="id" label="ID" width="80" />
      
      <el-table-column prop="name" label="分类名称" min-width="200">
        <template #default="scope">
          <div class="category-name">
            <el-tag v-if="scope.row.is_featured" type="warning" size="small" style="margin-right: 8px;">
              推荐
            </el-tag>
            {{ scope.row.name }}
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="icon" label="图标" width="100">
        <template #default="scope">
          <el-image
            v-if="scope.row.icon"
            style="width: 40px; height: 40px; border-radius: 4px;"
            :src="getFullImageUrl(scope.row.icon)"
            :preview-src-list="[getFullImageUrl(scope.row.icon)]"
            fit="cover"
          />
          <span v-else class="no-icon">无图标</span>
        </template>
      </el-table-column>
      
      <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
      
      <el-table-column prop="product_count" label="商品数量" width="100">
        <template #default="scope">
          <el-tag type="info" size="small">{{ scope.row.product_count || 0 }}</el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="sort" label="排序" width="100">
        <template #default="scope">
          <el-input-number
            v-model="scope.row.sort"
            :min="0"
            :max="999"
            size="small"
            @change="handleSortChange(scope.row)"
          />
        </template>
      </el-table-column>
      
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="1"
            :inactive-value="0"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      
      <el-table-column prop="created_at" label="创建时间" width="180" />
      
      <el-table-column label="操作" width="250" align="center" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleUpdate(scope.row)">
            编辑
          </el-button>
          <el-button 
            type="success" 
            size="small" 
            @click="handleCreateChild(scope.row)"
          >
            添加子分类
          </el-button>
          <el-button 
            v-if="!scope.row.children || scope.row.children.length === 0" 
            type="danger" 
            size="small" 
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-show="total > 0"
      :total="total"
      v-model:current-page="listQuery.page"
      v-model:page-size="listQuery.limit"
      @current-change="fetchData"
      @size-change="fetchData"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      background
    />

    <!-- 分类表单弹窗 -->
    <el-dialog 
      :title="dialogStatus === 'create' ? '添加分类' : '编辑分类'" 
      v-model="dialogFormVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="categoryFormRef" 
        :rules="rules" 
        :model="categoryForm" 
        label-position="left" 
        label-width="100px"
      >
        <el-form-item label="上级分类">
          <el-cascader
            v-model="categoryForm.parent_id"
            :options="categoryOptions"
            :props="{
              checkStrictly: true,
              value: 'id',
              label: 'name',
              emitPath: false
            }"
            placeholder="请选择上级分类（不选择则为顶级分类）"
            clearable
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        
        <el-form-item label="分类描述">
          <el-input 
            v-model="categoryForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
        
        <el-form-item label="分类图标">
          <el-upload
            class="avatar-uploader"
            action="#"
            :http-request="uploadIcon"
            :show-file-list="false"
            :before-upload="beforeIconUpload"
          >
            <img v-if="categoryForm.icon" :src="getFullImageUrl(categoryForm.icon)" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="el-upload__tip">支持jpg/png文件，不超过2MB</div>
        </el-form-item>
        
        <el-form-item label="排序" prop="sort">
          <el-input-number 
            v-model="categoryForm.sort" 
            :min="0" 
            :max="999" 
            placeholder="数值越小排序越靠前"
          />
        </el-form-item>
        
        <el-form-item label="是否推荐">
          <el-switch
            v-model="categoryForm.is_featured"
            active-text="推荐"
            inactive-text="普通"
          />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-radio-group v-model="categoryForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="dialogStatus === 'create' ? createCategory() : updateCategory()"
            :loading="submitLoading"
          >
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as mallApi from '@/api/v1/mall'
export default {
  name: 'MallCategoryList',
  components: {
    Plus
  },
  setup() {
    const listLoading = ref(true)
    const submitLoading = ref(false)
    const list = ref([])
    const total = ref(0)
    const stats = ref(null)
    
    const listQuery = reactive({
      keyword: '',
      status: '',
      page: 1,
      limit: 20
    })
    
    const dialogFormVisible = ref(false)
    const dialogStatus = ref('')
    const categoryFormRef = ref(null)
    const categoryForm = reactive({
      id: undefined,
      parent_id: null,
      name: '',
      description: '',
      icon: '',
      sort: 0,
      status: 1,
      is_featured: false
    })
    
    const categoryOptions = ref([])
    
    const rules = {
      name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
      sort: [{ required: true, message: '请输入排序值', trigger: 'blur' }]
    }
    
    // 获取分类列表
    const fetchData = async () => {
      listLoading.value = true
      
      try {
        const response = await mallApi.getCategoryList(listQuery)
        
        if (response.code === 0) {
          list.value = response.data.data || response.data.list || []
          total.value = response.data.total || 0
          
          // 计算统计信息
          calculateStats()
          
          // 生成分类选项
          generateCategoryOptions()
        } else {
          ElMessage.error(response.message || '获取分类列表失败')
        }
      } catch (error) {
        console.error('获取分类列表失败:', error)
        ElMessage.error('获取分类列表失败：' + (error.response?.data?.message || error.message))
      } finally {
        listLoading.value = false
      }
    }
    
    // 计算统计信息
    const calculateStats = () => {
      const flatList = flattenCategories(list.value)
      stats.value = {
        total: flatList.length,
        enabled: flatList.filter(item => item.status === 1).length,
        disabled: flatList.filter(item => item.status === 0).length,
        featured: flatList.filter(item => item.is_featured).length
      }
    }
    
    // 扁平化分类数据
    const flattenCategories = (categories) => {
      let result = []
      categories.forEach(category => {
        result.push(category)
        if (category.children && category.children.length > 0) {
          result = result.concat(flattenCategories(category.children))
        }
      })
      return result
    }
    
    // 生成分类选项
    const generateCategoryOptions = () => {
      categoryOptions.value = buildCategoryTree(list.value)
    }
    
    // 构建分类树
    const buildCategoryTree = (categories) => {
      return categories.map(category => ({
        id: category.id,
        name: category.name,
        children: category.children ? buildCategoryTree(category.children) : []
      }))
    }
    
    // 搜索
    const handleFilter = () => {
      listQuery.page = 1
      fetchData()
    }
    
    // 重置表单
    const resetForm = () => {
      Object.assign(categoryForm, {
        id: undefined,
        parent_id: null,
        name: '',
        description: '',
        icon: '',
        sort: 0,
        status: 1,
        is_featured: false
      })
    }
    
    // 添加分类
    const handleCreate = () => {
      resetForm()
      dialogStatus.value = 'create'
      dialogFormVisible.value = true
      nextTick(() => {
        categoryFormRef.value?.clearValidate()
      })
    }
    
    // 添加子分类
    const handleCreateChild = (row) => {
      resetForm()
      categoryForm.parent_id = row.id
      dialogStatus.value = 'create'
      dialogFormVisible.value = true
      nextTick(() => {
        categoryFormRef.value?.clearValidate()
      })
    }
    
    // 编辑分类
    const handleUpdate = (row) => {
      Object.assign(categoryForm, {
        id: row.id,
        parent_id: row.parent_id || null,
        name: row.name,
        description: row.description || '',
        icon: row.icon || '',
        sort: row.sort,
        status: row.status,
        is_featured: row.is_featured || false
      })
      dialogStatus.value = 'update'
      dialogFormVisible.value = true
      nextTick(() => {
        categoryFormRef.value?.clearValidate()
      })
    }
    
    // 创建分类
    const createCategory = async () => {
      try {
        const valid = await categoryFormRef.value.validate()
        if (!valid) return
        
        submitLoading.value = true
        const response = await mallApi.createCategory(categoryForm)
        
        if (response.code === 0) {
          ElMessage.success('创建分类成功')
          dialogFormVisible.value = false
          fetchData()
        } else {
          ElMessage.error(response.message || '创建分类失败')
        }
      } catch (error) {
        console.error('创建分类失败:', error)
        ElMessage.error('创建分类失败：' + (error.response?.data?.message || error.message))
      } finally {
        submitLoading.value = false
      }
    }
    
    // 更新分类
    const updateCategory = async () => {
      try {
        const valid = await categoryFormRef.value.validate()
        if (!valid) return
        
        submitLoading.value = true
        const response = await mallApi.updateCategory(categoryForm.id, categoryForm)
        
        if (response.code === 0) {
          ElMessage.success('更新分类成功')
          dialogFormVisible.value = false
          fetchData()
        } else {
          ElMessage.error(response.message || '更新分类失败')
        }
      } catch (error) {
        console.error('更新分类失败:', error)
        ElMessage.error('更新分类失败：' + (error.response?.data?.message || error.message))
      } finally {
        submitLoading.value = false
      }
    }
    
    // 删除分类
    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除分类"${row.name}"吗？此操作不可恢复！`,
          '警告',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        const response = await mallApi.deleteCategory(row.id)
        
        if (response.code === 0) {
          ElMessage.success('删除分类成功')
          fetchData()
        } else {
          ElMessage.error(response.message || '删除分类失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除分类失败:', error)
          ElMessage.error('删除分类失败：' + (error.response?.data?.message || error.message))
        }
      }
    }
    
    // 状态变更
    const handleStatusChange = async (row) => {
      try {
        const response = await mallApi.updateCategoryStatus(row.id, row.status)
        
        if (response.code === 0) {
          ElMessage.success('状态更新成功')
        } else {
          ElMessage.error(response.message || '状态更新失败')
          // 恢复原状态
          row.status = row.status === 1 ? 0 : 1
        }
      } catch (error) {
        console.error('状态更新失败:', error)
        ElMessage.error('状态更新失败：' + (error.response?.data?.message || error.message))
        // 恢复原状态
        row.status = row.status === 1 ? 0 : 1
      }
    }
    
    // 排序变更
    const handleSortChange = async (row) => {
      try {
        const response = await mallApi.updateCategorySort([{
          id: row.id,
          sort: row.sort
        }])
        
        if (response.code === 0) {
          ElMessage.success('排序更新成功')
        } else {
          ElMessage.error(response.message || '排序更新失败')
        }
      } catch (error) {
        console.error('排序更新失败:', error)
        ElMessage.error('排序更新失败：' + (error.response?.data?.message || error.message))
      }
    }
    
    // 上传图标前验证
    const beforeIconUpload = (file) => {
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 2
      
      if (!isJPG) {
        ElMessage.error('图标只能是 JPG/PNG 格式!')
        return false
      }
      if (!isLt2M) {
        ElMessage.error('图标大小不能超过 2MB!')
        return false
      }
      return true
    }
    
    // 上传图标
    const uploadIcon = async (options) => {
      try {
        const response = await mallApi.uploadCategoryIcon(options.file)
        
        if (response.code === 0) {
          categoryForm.icon = response.data.url
          ElMessage.success('图标上传成功')
        } else {
          ElMessage.error(response.message || '图标上传失败')
        }
      } catch (error) {
        console.error('图标上传失败:', error)
        ElMessage.error('图标上传失败：' + (error.response?.data?.message || error.message))
      }
    }
    
    // 获取完整图片URL
    const getFullImageUrl = (url) => {
      if (!url) return ''
      if (url.startsWith('http')) return url
      // 如果是相对路径，添加完整域名
      if (url.startsWith('/')) {
        return `https://pay.itapgo.com${url}`
      }
      return `https://pay.itapgo.com/${url}`
    }
    
    onMounted(() => {
      fetchData()
    })
    
    return {
      listLoading,
      submitLoading,
      list,
      total,
      stats,
      listQuery,
      dialogFormVisible,
      dialogStatus,
      categoryFormRef,
      categoryForm,
      categoryOptions,
      rules,
      fetchData,
      handleFilter,
      handleCreate,
      handleCreateChild,
      handleUpdate,
      createCategory,
      updateCategory,
      handleDelete,
      handleStatusChange,
      handleSortChange,
      beforeIconUpload,
      uploadIcon,
      getFullImageUrl
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
  
  h2 {
    margin: 0 0 8px 0;
    color: #ffffff;
  }
  
  p {
    margin: 0;
    color: #ffffff;
    font-size: 14px;
  }
}

.filter-container {
  margin-bottom: 20px;
  
  .filter-item {
    margin-right: 10px;
    margin-bottom: 10px;
  }
}

.stats-container {
  margin-bottom: 20px;
  
  .stat-card {
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    padding: 20px;
    text-align: center;
    
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #409eff;
      margin-bottom: 8px;
    }
    
    .stat-label {
      font-size: 14px;
      color: #909399;
    }
  }
}

.category-name {
  display: flex;
  align-items: center;
}

.no-icon {
  color: #c0c4cc;
  font-size: 12px;
}

.avatar-uploader {
  .avatar {
    width: 80px;
    height: 80px;
    display: block;
    border-radius: 4px;
  }
  
  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 80px;
    height: 80px;
    line-height: 80px;
    text-align: center;
    border: 1px dashed #d9d9d9;
    border-radius: 4px;
    cursor: pointer;
    
    &:hover {
      border-color: #409eff;
    }
  }
}

.el-upload__tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}
</style>
