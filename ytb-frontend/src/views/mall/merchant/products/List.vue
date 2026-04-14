<template>
  <div class="merchant-products">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>商户商品管理</span>
          <el-button type="primary" @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <!-- 搜索表单 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="商品名称/商户名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="商户">
          <el-select v-model="searchForm.merchant_id" placeholder="选择商户" clearable>
            <el-option
              v-for="merchant in merchants"
              :key="merchant.id"
              :label="merchant.name"
              :value="merchant.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable>
            <el-option label="待审核" :value="0" />
            <el-option label="已上架" :value="1" />
            <el-option label="已下架" :value="2" />
            <el-option label="审核拒绝" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="积分支持">
          <el-select v-model="searchForm.integral_status" placeholder="选择" clearable>
            <el-option label="支持积分" :value="1" />
            <el-option label="不支持" :value="0" />
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

      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="商品图片" width="100">
          <template #default="scope">
            <el-image
              :src="scope.row.thumbnail"
              :preview-src-list="[scope.row.thumbnail]"
              style="width: 60px; height: 60px"
              fit="cover"
            />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="200" />
        <el-table-column prop="merchant_name" label="商户名称" width="150" />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="scope">
            <span class="price">¥{{ scope.row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column label="积分抵扣" width="130">
          <template #default="scope">
            <template v-if="scope.row.integral_status == 1">
              <el-tag type="success" size="small">支持积分</el-tag>
              <div class="integral-info">
                最多抵扣 ¥{{ scope.row.integral_price || 0 }}
              </div>
            </template>
            <el-tag v-else type="info" size="small">不支持</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column prop="sales" label="销量" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button
              v-if="scope.row.status === 0"
              type="success"
              size="small"
              @click="handleAudit(scope.row, 1)"
            >
              通过
            </el-button>
            <el-button
              v-if="scope.row.status === 0"
              type="danger"
              size="small"
              @click="handleAudit(scope.row, 3)"
            >
              拒绝
            </el-button>
            <el-button
              v-if="scope.row.status === 1"
              type="warning"
              size="small"
              @click="handleAudit(scope.row, 2)"
            >
              下架
            </el-button>
            <el-button
              v-if="scope.row.status === 2"
              type="primary"
              size="small"
              @click="handleAudit(scope.row, 1)"
            >
              上架
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current_page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 商品编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑商品"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editFormRules"
        label-width="120px"
      >
        <el-divider content-position="left">基本信息</el-divider>
        
        <el-form-item label="商品图片">
          <el-image
            v-if="editForm.thumbnail"
            :src="editForm.thumbnail"
            style="width: 100px; height: 100px"
            fit="cover"
          />
        </el-form-item>
        
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入商品名称" />
        </el-form-item>
        
        <el-form-item label="商品价格" prop="price">
          <el-input-number
            v-model="editForm.price"
            :precision="2"
            :min="0"
            :max="999999"
          />
          <span class="form-hint">元</span>
        </el-form-item>
        
        <el-form-item label="商品库存" prop="stock">
          <el-input-number
            v-model="editForm.stock"
            :min="0"
            :max="999999"
          />
        </el-form-item>

        <el-divider content-position="left">积分抵扣配置</el-divider>
        
        <el-form-item label="支持积分抵扣">
          <el-switch
            v-model="editForm.integral_status"
            :active-value="1"
            :inactive-value="0"
            active-text="开启"
            inactive-text="关闭"
          />
          <div class="form-tip">开启后，用户购买此商品可使用积分抵扣部分金额</div>
        </el-form-item>
        
        <template v-if="editForm.integral_status == 1">
          <el-form-item label="最大抵扣金额" prop="integral_price">
            <el-input-number
              v-model="editForm.integral_price"
              :precision="2"
              :min="0"
              :max="editForm.price"
              placeholder="最多可用积分抵扣的金额"
            />
            <span class="form-hint">元（1积分 = 1元）</span>
            <div class="form-tip">
              建议设置为商品价格的 10%-50%，当前商品价格为 ¥{{ editForm.price }}
            </div>
          </el-form-item>
          
          <el-form-item label="抵扣比例" prop="integral_ratio">
            <el-slider
              v-model="editForm.integral_ratio"
              :min="0"
              :max="100"
              :format-tooltip="formatRatio"
              show-input
            />
            <div class="form-tip">
              用户最多可使用积分抵扣商品价格的 {{ editForm.integral_ratio }}%
            </div>
          </el-form-item>
          
          <el-form-item label="仅积分购买">
            <el-switch
              v-model="editForm.is_points_only"
              :active-value="1"
              :inactive-value="0"
              active-text="是"
              inactive-text="否"
            />
            <div class="form-tip">开启后，该商品只能使用纯积分购买，无需现金</div>
          </el-form-item>
        </template>

        <el-divider content-position="left">商品描述</el-divider>
        
        <el-form-item label="商品描述" prop="content">
          <el-input
            v-model="editForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入商品描述"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="handleSaveEdit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { merchantMallApi } from '@/api/v1/merchantMall'

const loading = ref(false)
const tableData = ref([])
const merchants = ref([])
const selectedRows = ref([])

const searchForm = reactive({
  keyword: '',
  merchant_id: '',
  status: '',
  integral_status: ''
})

const pagination = reactive({
  current_page: 1,
  per_page: 20,
  total: 0
})

// 编辑对话框
const editDialogVisible = ref(false)
const editLoading = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  id: null,
  name: '',
  price: 0,
  stock: 0,
  thumbnail: '',
  content: '',
  integral_status: 0,
  integral_price: 0,
  integral_ratio: 30,
  is_points_only: 0
})

const editFormRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入商品价格', trigger: 'blur' }],
  integral_price: [
    {
      validator: (rule, value, callback) => {
        if (editForm.integral_status === 1 && (!value || value <= 0)) {
          callback(new Error('请设置最大抵扣金额'))
        } else if (value > editForm.price) {
          callback(new Error('抵扣金额不能超过商品价格'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const formatRatio = (val) => `${val}%`

const getStatusType = (status) => {
  const typeMap = {
    0: 'warning',
    1: 'success',
    2: 'info',
    3: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    0: '待审核',
    1: '已上架',
    2: '已下架',
    3: '审核拒绝'
  }
  return textMap[status] || '未知'
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current_page,
      per_page: pagination.per_page,
      ...searchForm
    }
    
    const response = await merchantMallApi.getProducts(params)
    tableData.value = response.data.data
    pagination.total = response.data.total
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const loadMerchants = async () => {
  try {
    // 这里应该调用商户列表API
    merchants.value = []
  } catch (error) {
    console.error('加载商户列表失败:', error)
  }
}

const handleSearch = () => {
  pagination.current_page = 1
  loadData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    merchant_id: '',
    status: '',
    integral_status: ''
  })
  handleSearch()
}

const handleRefresh = () => {
  loadData()
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleSizeChange = (size) => {
  pagination.per_page = size
  pagination.current_page = 1
  loadData()
}

const handleCurrentChange = (page) => {
  pagination.current_page = page
  loadData()
}

const handleAudit = async (row, status) => {
  const statusText = getStatusText(status)
  try {
    await ElMessageBox.confirm(
      `确定要将商品"${row.name}"${statusText}吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await merchantMallApi.auditProduct(row.id, { status })
    ElMessage.success(`${statusText}成功`)
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${statusText}失败`)
      console.error(error)
    }
  }
}

const handleEdit = async (row) => {
  // 重置表单
  Object.assign(editForm, {
    id: row.id,
    name: row.name || '',
    price: parseFloat(row.price) || 0,
    stock: parseInt(row.stock) || 0,
    thumbnail: row.thumbnail || '',
    content: row.content || '',
    integral_status: row.integral_status || 0,
    integral_price: parseFloat(row.integral_price) || 0,
    integral_ratio: parseInt(row.integral_ratio) || 30,
    is_points_only: row.is_points_only || 0
  })
  editDialogVisible.value = true
}

const handleSaveEdit = async () => {
  try {
    await editFormRef.value?.validate()
    editLoading.value = true
    
    const updateData = {
      name: editForm.name,
      price: editForm.price,
      stock: editForm.stock,
      content: editForm.content,
      integral_status: editForm.integral_status,
      integral_price: editForm.integral_status ? editForm.integral_price : 0,
      integral_ratio: editForm.integral_status ? editForm.integral_ratio : 0,
      is_points_only: editForm.integral_status ? editForm.is_points_only : 0
    }
    
    await merchantMallApi.updateProduct(editForm.id, updateData)
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    loadData()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('保存失败')
      console.error(error)
    }
  } finally {
    editLoading.value = false
  }
}

onMounted(() => {
  loadData()
  loadMerchants()
})
</script>

<style scoped>
.merchant-products {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.price {
  color: #f56c6c;
  font-weight: bold;
}

.integral-info {
  font-size: 12px;
  color: #67c23a;
  margin-top: 4px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.form-hint {
  margin-left: 8px;
  color: #909399;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.5;
}

:deep(.el-divider__text) {
  font-weight: 500;
  color: #303133;
}
</style> 