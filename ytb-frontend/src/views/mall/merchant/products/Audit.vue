<template>
  <div class="merchant-products-audit">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>商户商品审核</span>
          <el-badge :value="pendingCount" class="badge">
            <el-button type="primary" @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </el-badge>
        </div>
      </template>

      <!-- 筛选标签 -->
      <div class="filter-tabs">
        <el-radio-group v-model="activeStatus" @change="handleStatusChange">
          <el-radio-button :label="null">全部</el-radio-button>
          <el-radio-button :label="0">
            待审核 <el-badge :value="statusCounts[0]" :hidden="!statusCounts[0]" />
          </el-radio-button>
          <el-radio-button :label="1">已通过</el-radio-button>
          <el-radio-button :label="3">已拒绝</el-radio-button>
        </el-radio-group>
      </div>

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
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 批量操作 -->
      <div class="batch-actions" v-if="selectedRows.length > 0">
        <el-button type="success" @click="handleBatchAudit(1)">
          批量通过 ({{ selectedRows.length }})
        </el-button>
        <el-button type="danger" @click="handleBatchAudit(3)">
          批量拒绝 ({{ selectedRows.length }})
        </el-button>
      </div>

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
        <el-table-column prop="name" label="商品名称" min-width="200">
          <template #default="scope">
            <div>
              <div class="product-name">{{ scope.row.name }}</div>
              <div class="product-desc">{{ scope.row.description }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="merchant_name" label="商户名称" width="150" />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="scope">
            <span class="price">¥{{ scope.row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="提交时间" width="160" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button type="info" size="small" @click="handleView(scope.row)">
              查看详情
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

    <!-- 审核对话框 -->
    <el-dialog
      v-model="auditDialogVisible"
      :title="auditDialogTitle"
      width="500px"
    >
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.status">
            <el-radio :label="1">通过</el-radio>
            <el-radio :label="3">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核备注">
          <el-input
            v-model="auditForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入审核备注（拒绝时必填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmAudit" :loading="auditing">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { merchantMallApi } from '@/api/v1/merchantMall'

const loading = ref(false)
const auditing = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const activeStatus = ref(null)
const auditDialogVisible = ref(false)
const currentAuditRow = ref(null)

const statusCounts = ref({
  0: 0, // 待审核
  1: 0, // 已通过
  3: 0  // 已拒绝
})

const searchForm = reactive({
  keyword: ''
})

const pagination = reactive({
  current_page: 1,
  per_page: 20,
  total: 0
})

const auditForm = reactive({
  status: 1,
  remark: ''
})

const pendingCount = computed(() => statusCounts.value[0] || 0)

const auditDialogTitle = computed(() => {
  return auditForm.status === 1 ? '审核通过' : '审核拒绝'
})

const getStatusType = (status) => {
  const typeMap = {
    0: 'warning',
    1: 'success',
    3: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    0: '待审核',
    1: '已通过',
    3: '已拒绝'
  }
  return textMap[status] || '未知'
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current_page,
      per_page: pagination.per_page,
      status: activeStatus.value,
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

const loadStatusCounts = async () => {
  try {
    const response = await merchantMallApi.getProductStatusCounts()
    statusCounts.value = response.data
  } catch (error) {
    console.error('加载状态统计失败:', error)
  }
}

const handleStatusChange = () => {
  pagination.current_page = 1
  loadData()
}

const handleSearch = () => {
  pagination.current_page = 1
  loadData()
}

const handleRefresh = () => {
  loadData()
  loadStatusCounts()
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

const handleView = (row) => {
  // 查看商品详情
  ElMessage.info('查看功能待开发')
}

const handleAudit = (row, status) => {
  currentAuditRow.value = row
  auditForm.status = status
  auditForm.remark = ''
  auditDialogVisible.value = true
}

const handleBatchAudit = async (status) => {
  const statusText = getStatusText(status)
  try {
    await ElMessageBox.confirm(
      `确定要批量${statusText}选中的 ${selectedRows.value.length} 个商品吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const ids = selectedRows.value.map(row => row.id)
    await merchantMallApi.batchAuditProducts({ ids, status })
    ElMessage.success(`批量${statusText}成功`)
    loadData()
    loadStatusCounts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`批量${statusText}失败`)
      console.error(error)
    }
  }
}

const handleConfirmAudit = async () => {
  if (auditForm.status === 3 && !auditForm.remark.trim()) {
    ElMessage.warning('拒绝审核时必须填写备注')
    return
  }
  
  auditing.value = true
  try {
    await merchantMallApi.auditProduct(currentAuditRow.value.id, auditForm)
    ElMessage.success('审核成功')
    auditDialogVisible.value = false
    loadData()
    loadStatusCounts()
  } catch (error) {
    ElMessage.error('审核失败')
    console.error(error)
  } finally {
    auditing.value = false
  }
}

onMounted(() => {
  loadData()
  loadStatusCounts()
})
</script>

<style scoped>
.merchant-products-audit {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-tabs {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.batch-actions {
  margin-bottom: 20px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.product-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.product-desc {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price {
  color: #f56c6c;
  font-weight: bold;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.badge {
  margin-left: 10px;
}
</style> 