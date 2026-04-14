<template>
  <div class="poster-list-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>邀请海报管理</h2>
      <p>管理所有邀请海报的创建、编辑和发布</p>
    </div>

    <!-- 搜索和操作栏 -->
    <div class="search-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索海报标题或描述"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.status" placeholder="状态筛选" clearable>
            <el-option label="全部状态" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已下线" value="offline" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleDateChange"
          />
        </el-col>
        <el-col :span="8">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button type="success" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建海报
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 数据统计卡片 -->
    <div class="stats-cards" v-if="statistics">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon published">
              <el-icon><Picture /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.published || 0 }}</div>
              <div class="stat-label">已发布</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon draft">
              <el-icon><Edit /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.draft || 0 }}</div>
              <div class="stat-label">草稿</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon registrations">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.total_registrations || 0 }}</div>
              <div class="stat-label">总报名数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon views">
              <el-icon><View /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.total_views || 0 }}</div>
              <div class="stat-label">总浏览量</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 海报列表 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="posterList"
        row-key="id"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="海报预览" width="120">
          <template #default="{ row }">
            <div class="poster-preview">
              <img 
                v-if="row.cover_image" 
                :src="getImageUrl(row.cover_image)" 
                :alt="row.title"
                @error="handleImageError"
              />
              <div v-else class="no-image">
                <el-icon><Picture /></el-icon>
                <span>暂无图片</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="海报信息" min-width="200">
          <template #default="{ row }">
            <div class="poster-info">
              <div class="poster-title">{{ row.title || '未命名海报' }}</div>
              <div class="poster-desc">{{ row.description || '暂无描述' }}</div>
              <div class="poster-meta">
                <span class="meta-item">
                  <el-icon><Calendar /></el-icon>
                  {{ formatDate(row.created_at) }}
                </span>
                <span class="meta-item" v-if="row.location">
                  <el-icon><Location /></el-icon>
                  {{ row.location }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="活动时间" width="180">
          <template #default="{ row }">
            <div class="time-info">
              <div v-if="row.start_time">
                <strong>开始：</strong>{{ formatDateTime(row.start_time) }}
              </div>
              <div v-if="row.end_time">
                <strong>结束：</strong>{{ formatDateTime(row.end_time) }}
              </div>
              <div v-if="!row.start_time && !row.end_time" class="no-time">
                暂未设置
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="数据统计" width="120">
          <template #default="{ row }">
            <div class="data-stats">
              <div class="stat-item">
                <span class="stat-label">报名：</span>
                <span class="stat-value">{{ row.registrations_count || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">浏览：</span>
                <span class="stat-value">{{ row.views_count || 0 }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button size="small" @click="handleView(row)">
                <el-icon><View /></el-icon>
                预览
              </el-button>
              <el-button size="small" type="primary" @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-dropdown @command="(command) => handleCommand(command, row)">
                <el-button size="small">
                  更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="copy">
                      <el-icon><CopyDocument /></el-icon>复制
                    </el-dropdown-item>
                    <el-dropdown-item command="registrations">
                      <el-icon><UserFilled /></el-icon>报名记录
                    </el-dropdown-item>
                    <el-dropdown-item command="statistics">
                      <el-icon><DataAnalysis /></el-icon>数据统计
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <el-icon><Delete /></el-icon>删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current_page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[10, 20, 50, 100]"
          :small="false"
          :disabled="loading"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { posterApi } from '@/api/poster'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

export default {
  name: 'PosterList',
  components: {
    ...ElementPlusIconsVue
  },
  setup() {
    const router = useRouter()
    
    // 响应式数据
    const loading = ref(false)
    const posterList = ref([])
    const selectedRows = ref([])
    const dateRange = ref([])
    
    // 搜索表单
    const searchForm = reactive({
      keyword: '',
      status: '',
      start_date: '',
      end_date: ''
    })
    
    // 分页信息
    const pagination = reactive({
      current_page: 1,
      per_page: 20,
      total: 0
    })
    
    // 统计数据
    const statistics = ref({
      published: 0,
      draft: 0,
      total_registrations: 0,
      total_views: 0
    })
    
    // 加载海报列表
    const loadPosterList = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.current_page,
          per_page: pagination.per_page,
          ...searchForm
        }
        
        console.log('加载海报列表参数:', params)
        const response = await posterApi.getList(params)
        console.log('海报列表API响应:', response)
        
        if (response && response.code === 0) {
          posterList.value = response.data.data || []
          pagination.total = response.data.total || 0
          statistics.value = response.data.statistics || statistics.value
          
          console.log('成功加载海报列表:', posterList.value.length, '个')
        } else {
          ElMessage.error(response?.message || '加载海报列表失败')
          posterList.value = []
          pagination.total = 0
        }
      } catch (error) {
        console.error('加载海报列表失败:', error)
        ElMessage.error('加载海报列表失败: ' + error.message)
        posterList.value = []
        pagination.total = 0
      } finally {
        loading.value = false
      }
    }
    
    // 搜索处理
    const handleSearch = () => {
      pagination.current_page = 1
      loadPosterList()
    }
    
    // 重置搜索
    const handleReset = () => {
      Object.assign(searchForm, {
        keyword: '',
        status: '',
        start_date: '',
        end_date: ''
      })
      dateRange.value = []
      pagination.current_page = 1
      loadPosterList()
    }
    
    // 日期范围变化
    const handleDateChange = (dates) => {
      if (dates && dates.length === 2) {
        searchForm.start_date = dates[0]
        searchForm.end_date = dates[1]
      } else {
        searchForm.start_date = ''
        searchForm.end_date = ''
      }
    }
    
    // 分页处理
    const handleSizeChange = (size) => {
      pagination.per_page = size
      pagination.current_page = 1
      loadPosterList()
    }
    
    const handleCurrentChange = (page) => {
      pagination.current_page = page
      loadPosterList()
    }
    
    // 选择变化
    const handleSelectionChange = (selection) => {
      selectedRows.value = selection
    }
    
    // 操作处理
    const handleCreate = () => {
      router.push('/poster/create')
    }
    
    const handleEdit = (row) => {
      router.push(`/poster/${row.id}/edit`)
    }
    
    const handleView = (row) => {
      // 打开预览窗口
      const previewUrl = `${window.location.origin}/poster/${row.id}`
      window.open(previewUrl, '_blank')
    }
    
    const handleCommand = (command, row) => {
      switch (command) {
        case 'copy':
          handleCopy(row)
          break
        case 'registrations':
          router.push(`/poster/registrations?poster_id=${row.id}`)
          break
        case 'statistics':
          router.push(`/poster/statistics?poster_id=${row.id}`)
          break
        case 'delete':
          handleDelete(row)
          break
      }
    }
    
    const handleCopy = (row) => {
      ElMessageBox.confirm('确定要复制这个海报吗？', '复制确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        ElMessage.success('复制功能开发中...')
      })
    }
    
    const handleDelete = (row) => {
      ElMessageBox.confirm('确定要删除这个海报吗？删除后无法恢复。', '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ElMessage.success('删除功能开发中...')
      })
    }
    
    // 工具函数
    const getImageUrl = (url) => {
      if (!url) return ''
      if (url.startsWith('http')) return url
      return `${window.location.origin}${url}`
    }
    
    const handleImageError = (event) => {
      event.target.src = '/admin/images/default-poster.png'
    }
    
    const getStatusType = (status) => {
      const typeMap = {
        draft: 'info',
        published: 'success',
        offline: 'warning'
      }
      return typeMap[status] || 'info'
    }
    
    const getStatusText = (status) => {
      const textMap = {
        draft: '草稿',
        published: '已发布',
        offline: '已下线'
      }
      return textMap[status] || '未知'
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleDateString()
    }
    
    const formatDateTime = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleString()
    }
    
    // 组件挂载时加载数据
    onMounted(() => {
      loadPosterList()
    })
    
    return {
      loading,
      posterList,
      selectedRows,
      dateRange,
      searchForm,
      pagination,
      statistics,
      loadPosterList,
      handleSearch,
      handleReset,
      handleDateChange,
      handleSizeChange,
      handleCurrentChange,
      handleSelectionChange,
      handleCreate,
      handleEdit,
      handleView,
      handleCommand,
      getImageUrl,
      handleImageError,
      getStatusType,
      getStatusText,
      formatDate,
      formatDateTime
    }
  }
}
</script>

<style scoped>
.poster-list-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.search-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 20px;
  color: white;
}

.stat-icon.published {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.draft {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.registrations {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.views {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.poster-preview {
  width: 80px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.poster-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #c0c4cc;
  font-size: 12px;
}

.poster-info {
  padding: 5px 0;
}

.poster-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.poster-desc {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.poster-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.meta-item .el-icon {
  margin-right: 4px;
}

.time-info {
  font-size: 12px;
  line-height: 1.5;
}

.time-info div {
  margin-bottom: 2px;
}

.no-time {
  color: #c0c4cc;
  font-style: italic;
}

.data-stats {
  font-size: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.stat-label {
  color: #909399;
}

.stat-value {
  color: #303133;
  font-weight: 600;
}

.pagination-container {
  padding: 20px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .poster-list-container {
    padding: 10px;
  }
  
  .page-header {
    padding: 20px;
  }
  
  .search-section {
    padding: 15px;
  }
  
  .stats-cards .el-col {
    margin-bottom: 15px;
  }
}
</style> 