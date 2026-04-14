<template>
  <div class="institution-summary">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <template v-if="showBreadcrumb">
              <el-breadcrumb separator="/">
                <el-breadcrumb-item>
                  <span style="cursor: pointer" @click="backToParent">机构汇总</span>
                </el-breadcrumb-item>
                <el-breadcrumb-item>{{ parentName }}</el-breadcrumb-item>
              </el-breadcrumb>
            </template>
            <span v-else>机构汇总</span>
          </div>
          <el-button type="primary" @click="syncData" :loading="syncing">
            同步数据
          </el-button>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="search-section">
        <el-input 
          v-model="searchForm.search" 
          placeholder="机构名称/XS编号"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <!-- 数据列表 -->
      <el-table 
        :data="tableData" 
        border 
        stripe
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="institution_id" label="机构ID" min-width="100">
          <template #default="scope">
            <span class="institution-id">{{ scope.row.institution_id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="xs_number" label="XS编号" min-width="120">
          <template #default="scope">
            <span class="xs-number">{{ scope.row.xs_number }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="机构名称" min-width="180" show-overflow-tooltip>
          <template #default="scope">
            <span class="institution-name">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="lv" label="等级" width="80" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.lv > 3 ? 'success' : 'info'" size="small">
              {{ scope.row.lv }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="super_institution_name" label="上级机构" min-width="180" show-overflow-tooltip />
        <el-table-column prop="current_transaction" label="本月交易额" min-width="150">
          <template #default="scope">
            <span :class="{'red': scope.row.current_transaction < 0, 'green': scope.row.current_transaction > 0}">
              {{ formatMoney(scope.row.current_transaction) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="total_transaction" label="总交易额" min-width="150">
          <template #default="scope">
            <span :class="{'red': scope.row.total_transaction < 0, 'green': scope.row.total_transaction > 0}">
              {{ formatMoney(scope.row.total_transaction) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="direct_merchant_count" label="直营商户数" min-width="120" />
        <el-table-column prop="total_merchant_count" label="总商户数" min-width="120" />
        <el-table-column prop="team_merchant_count" label="团队商户数" min-width="120" />
        <el-table-column prop="direct_sub_count" label="直属下级人数" min-width="120" />
        <el-table-column prop="sub_count" label="总下级人数" min-width="120" />
        <el-table-column 
          label="操作" 
          width="120" 
          fixed="right"
          align="center"
        >
          <template #default="scope">
            <el-button
              v-if="scope.row.direct_sub_count > 0"
              type="success"
              link
              @click="viewSubInstitutions(scope.row)"
            >
              <el-icon><View /></el-icon>
              下级 ({{ scope.row.direct_sub_count }})
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[15, 30, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>

      <!-- 同步进度对话框 -->
      <el-dialog
        title="同步进度"
        v-model="syncDialogVisible"
        :close-on-click-modal="false"
        width="400px"
      >
        <div class="sync-progress">
          <el-progress 
            :percentage="syncProgress" 
            :status="syncStatus === 'completed' ? 'success' : ''"
          ></el-progress>
          <div class="sync-message">{{ syncMessage }}</div>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, View } from '@element-plus/icons-vue'
import { getInstitutionList, syncInstitutionData, getSyncStatus } from '@/api/institution-count'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 状态定义
const loading = ref(false)
const syncing = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(15)
const syncDialogVisible = ref(false)
const syncProgress = ref(0)
const syncStatus = ref('')
const syncMessage = ref('')

// 搜索表单
const searchForm = reactive({
  search: ''
})

// 添加定时器清理
let syncTimer = null

// 获取列表数据
const fetchData = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      search: searchForm.search,
      parent_id: route.query.parent_id
    }
    const res = await getInstitutionList(params)
    if (res.code === 0) {
      tableData.value = res.data.list
      total.value = res.data.total
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (error) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

// 重置搜索
const resetSearch = () => {
  searchForm.search = ''
  handleSearch()
}

// 同步数据
const syncData = async () => {
  try {
    syncing.value = true
    syncDialogVisible.value = true
    syncProgress.value = 0
    syncStatus.value = 'syncing'
    syncMessage.value = '准备同步...'
    
    const res = await syncInstitutionData()
    if (res.code === 0) {
      checkSyncStatus()
    } else {
      throw new Error(res.message || '同步失败')
    }
  } catch (error) {
    console.error('同步失败:', error)
    ElMessage.error(error.message || '同步失败，请检查网络连接')
    syncing.value = false
    syncDialogVisible.value = false
  }
}

// 检查同步状态
const checkSyncStatus = () => {
  if (syncTimer) {
    clearInterval(syncTimer)
  }
  
  syncTimer = setInterval(async () => {
    try {
      const res = await getSyncStatus()
      if (res.code === 0) {
        const { progress, status, message, current_step } = res.data
        syncProgress.value = progress
        syncStatus.value = status
        syncMessage.value = `${current_step}\n${message}`
        
        if (status === 'completed' || progress >= 100) {
          clearInterval(syncTimer)
          syncTimer = null
          syncing.value = false
          ElMessage.success('同步完成')
          fetchData()
          setTimeout(() => {
            syncDialogVisible.value = false
          }, 1000)
        }
      } else {
        throw new Error(res.message || '获取同步状态失败')
      }
    } catch (error) {
      clearInterval(syncTimer)
      syncTimer = null
      syncing.value = false
      
      // 如果是401错误，让响应拦截器处理
      if (error.response?.status === 401) {
        return
      }
      
      ElMessage.error(error.message || '获取同步状态失败')
      syncDialogVisible.value = false
    }
  }, 2000)
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchData()
}

// 金额格式化
const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '--'
  return Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 修改查看下级方法
const viewSubInstitutions = (row) => {
  router.push({
    name: 'ShengfutongInstitutionSummary',
    query: {
      parent_id: row.institution_id,
      parent_name: row.name
    }
  })
}

// 添加返回上级功能
const backToParent = () => {
  router.go(-1)
}

// 添加面包屑导航
const showBreadcrumb = computed(() => !!route.query.parent_id)
const parentName = computed(() => route.query.parent_name)

// 初始化时监听路由变化
watch(
  () => route.query,
  () => {
    fetchData()
  },
  { immediate: true }
)

// 初始化
onMounted(() => {
  fetchData()
})

// 组件销毁前清理定时器
onBeforeUnmount(() => {
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }
})
</script>

<style lang="scss" scoped>
.institution-summary {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      display: flex;
      align-items: center;
      
      :deep(.el-breadcrumb) {
        font-size: 16px;
      }
    }
  }

  .search-section {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
    background-color: #f5f7fa;
    padding: 15px;
    border-radius: 4px;

    .el-input {
      width: 200px;
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .institution-id {
    color: #409EFF;
    font-family: Monaco, monospace;
  }

  .institution-name {
    font-weight: 500;
  }

  .xs-number {
    color: #606266;
    font-size: 13px;
  }

  .red {
    color: #F56C6C;
  }

  .green {
    color: #67C23A;
  }

  .sync-progress {
    padding: 20px;
    text-align: center;

    .sync-status {
      margin-top: 15px;
      color: #606266;
      font-size: 14px;
    }

    .sync-detail {
      margin-top: 8px;
      font-size: 12px;
      color: #909399;
      white-space: pre-line;
    }
  }

  :deep(.el-table) {
    .el-button {
      padding: 4px 8px;
      
      .el-icon {
        margin-right: 4px;
      }
    }
  }
}
</style> 