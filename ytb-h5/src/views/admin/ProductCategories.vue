<template>
  <div class="product-categories-container">
    <van-nav-bar
      title="商品分类管理"
      left-arrow
      @click-left="onClickLeft"
    />
    
    <!-- 搜索和操作区 -->
    <div class="search-filter-area">
      <van-search 
        v-model="listQuery.name" 
        placeholder="分类名称"
        @search="handleFilter"
        shape="round"
      />
      
      <van-dropdown-menu>
        <van-dropdown-item v-model="listQuery.status" :options="statusOptions" />
      </van-dropdown-menu>
      
      <div class="action-buttons">
        <van-button type="primary" size="small" @click="showAddDialog = true">
          <van-icon name="plus" />新增分类
        </van-button>
      </div>
    </div>
    
    <!-- 分类列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="listLoading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
      >
        <div v-if="list.length === 0 && !listLoading" class="empty-tip">
          <van-empty description="暂无分类数据" />
        </div>
        
        <div v-for="(item, index) in list" :key="index" class="category-card">
          <van-cell-group inset>
            <van-cell>
              <template #title>
                <div class="category-title">
                  <van-image
                    v-if="item.icon"
                    :src="item.icon"
                    width="24"
                    height="24"
                    class="category-icon"
                  />
                  <span class="category-name">{{ item.name }}</span>
                  <van-tag 
                    :type="item.status === 1 ? 'success' : 'danger'" 
                    round
                    size="small"
                  >
                    {{ item.status === 1 ? '启用' : '禁用' }}
                  </van-tag>
                </div>
              </template>
              <template #right-icon>
                <div class="action-buttons">
                  <van-button type="primary" size="mini" @click="editCategory(item)">编辑</van-button>
                  <van-button type="danger" size="mini" @click="deleteCategory(item.id)">删除</van-button>
                </div>
              </template>
            </van-cell>
            <van-cell title="排序" :value="item.sort" />
            <van-cell title="父级分类" :value="getParentName(item.parent_id)" />
            <van-cell title="创建时间" :value="formatDate(item.created_at)" />
          </van-cell-group>
        </div>
      </van-list>
    </van-pull-refresh>
    
    <!-- 新增/编辑分类弹窗 -->
    <van-dialog
      v-model:show="showAddDialog"
      :title="editingCategory ? '编辑分类' : '新增分类'"
      show-cancel-button
      @confirm="submitCategory"
      @cancel="resetForm"
    >
      <van-form @submit="submitCategory">
        <van-field
          v-model="categoryForm.name"
          name="name"
          label="分类名称"
          placeholder="请输入分类名称"
          :rules="[{ required: true, message: '请输入分类名称' }]"
        />
        
        <van-field name="parent" label="父级分类">
          <template #input>
            <van-picker
              v-model="categoryForm.parent_id"
              :columns="parentOptions"
              @change="onParentChange"
            />
          </template>
        </van-field>
        
        <van-field
          v-model="categoryForm.sort"
          name="sort"
          label="排序"
          type="number"
          placeholder="请输入排序值"
          :rules="[{ required: true, message: '请输入排序值' }]"
        />
        
        <van-field name="status" label="状态">
          <template #input>
            <van-switch v-model="categoryForm.status" :active-value="1" :inactive-value="2" />
          </template>
        </van-field>
        
        <van-field
          v-model="categoryForm.icon"
          name="icon"
          label="图标URL"
          placeholder="请输入图标URL"
        />
      </van-form>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, showConfirmDialog } from 'vant'
import { getProductCategories, createProductCategory, updateProductCategory, deleteProductCategory } from '@/api/admin'

const router = useRouter()

// 返回上一页
const onClickLeft = () => {
  router.back()
}

// 列表数据
const list = ref([])
const listLoading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const page = ref(1)
const pageSize = ref(20)

// 搜索条件
const listQuery = reactive({
  name: '',
  status: ''
})

// 状态选项
const statusOptions = [
  { text: '全部', value: '' },
  { text: '启用', value: '1' },
  { text: '禁用', value: '2' }
]

// 弹窗控制
const showAddDialog = ref(false)
const editingCategory = ref(null)

// 分类表单
const categoryForm = reactive({
  name: '',
  parent_id: 0,
  sort: 0,
  status: 1,
  icon: ''
})

// 父级分类选项
const parentOptions = ref([
  { text: '顶级分类', value: 0 }
])

// 获取分类列表
const fetchList = async (isRefresh = false) => {
  if (isRefresh) {
    page.value = 1
    finished.value = false
  }
  
  try {
    listLoading.value = true
    
    const params = {
      page: page.value,
      page_size: pageSize.value,
      ...listQuery
    }
    
    const res = await getProductCategories(params)
    
    if (res.code === 0) {
      if (isRefresh) {
        list.value = res.data || []
      } else {
        list.value = [...list.value, ...(res.data || [])]
      }
      
      // 更新父级分类选项
      updateParentOptions(res.data || [])
      
      if (!res.data || res.data.length < pageSize.value) {
        finished.value = true
      }
    } else {
      showToast(res.message || '获取分类列表失败')
    }
  } catch (error) {
    console.error('获取分类列表失败', error)
    showToast('获取分类列表失败')
  } finally {
    listLoading.value = false
    refreshing.value = false
  }
}

// 更新父级分类选项
const updateParentOptions = (categories) => {
  const options = [{ text: '顶级分类', value: 0 }]
  
  categories.forEach(category => {
    if (category.parent_id === 0) {
      options.push({
        text: category.name,
        value: category.id
      })
    }
  })
  
  parentOptions.value = options
}

// 下拉刷新
const onRefresh = () => {
  fetchList(true)
}

// 加载更多
const loadMore = () => {
  if (!finished.value) {
    page.value++
    fetchList()
  }
}

// 搜索过滤
const handleFilter = () => {
  fetchList(true)
}

// 编辑分类
const editCategory = (category) => {
  editingCategory.value = category
  categoryForm.name = category.name
  categoryForm.parent_id = category.parent_id
  categoryForm.sort = category.sort
  categoryForm.status = category.status
  categoryForm.icon = category.icon || ''
  showAddDialog.value = true
}

// 提交分类
const submitCategory = async () => {
  try {
    const loadingToast = showLoadingToast({
      message: editingCategory.value ? '更新中...' : '创建中...',
      forbidClick: true
    })
    
    let res
    if (editingCategory.value) {
      res = await updateProductCategory(editingCategory.value.id, categoryForm)
    } else {
      res = await createProductCategory(categoryForm)
    }
    
    loadingToast.close()
    
    if (res.code === 0) {
      showToast(editingCategory.value ? '更新成功' : '创建成功')
      showAddDialog.value = false
      resetForm()
      fetchList(true)
    } else {
      showToast(res.message || '操作失败')
    }
  } catch (error) {
    console.error('提交分类失败', error)
    showToast('操作失败')
  }
}

// 删除分类
const deleteCategory = async (id) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: '确定要删除这个分类吗？'
    })
    
    const loadingToast = showLoadingToast({
      message: '删除中...',
      forbidClick: true
    })
    
    const res = await deleteProductCategory(id)
    
    loadingToast.close()
    
    if (res.code === 0) {
      showToast('删除成功')
      fetchList(true)
    } else {
      showToast(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分类失败', error)
      showToast('删除失败')
    }
  }
}

// 重置表单
const resetForm = () => {
  editingCategory.value = null
  categoryForm.name = ''
  categoryForm.parent_id = 0
  categoryForm.sort = 0
  categoryForm.status = 1
  categoryForm.icon = ''
}

// 获取父级分类名称
const getParentName = (parentId) => {
  if (parentId === 0) return '顶级分类'
  const parent = list.value.find(item => item.id === parentId)
  return parent ? parent.name : '未知'
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

// 父级分类选择
const onParentChange = (value) => {
  categoryForm.parent_id = value
}

// 页面加载
onMounted(() => {
  fetchList(true)
})
</script>

<style scoped>
.product-categories-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.search-filter-area {
  padding: 16px;
  background: white;
  margin-bottom: 8px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.category-card {
  margin-bottom: 12px;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-icon {
  border-radius: 4px;
}

.category-name {
  font-weight: 500;
  flex: 1;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.empty-tip {
  padding: 50px 0;
  text-align: center;
}

:deep(.van-cell__right-icon) {
  margin-left: 8px;
}

:deep(.van-dropdown-menu) {
  margin-bottom: 12px;
}

:deep(.van-field__label) {
  width: 80px;
}
</style>