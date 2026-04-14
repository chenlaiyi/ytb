<template>
  <div class="poster-registrations">
    <div class="page-header">
      <div class="header-left">
        <h2>邀请海报报名记录</h2>
        <p v-if="posterInfo">
          当前海报：{{ posterInfo.title }} · 活动时间：
          {{ formatDateTime(posterInfo.start_time) }} - {{ formatDateTime(posterInfo.end_time) }}
        </p>
        <p v-else>请选择一个海报以查看报名情况</p>
      </div>
      <div class="header-actions">
        <el-select
          v-model="selectedPosterId"
          placeholder="选择海报"
          filterable
          clearable
          style="width: 260px"
          @change="handlePosterChange"
        >
          <el-option
            v-for="option in posterOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <el-button type="primary" @click="handleCreatePoster">
          <el-icon><Plus /></el-icon>
          新建海报
        </el-button>
      </div>
    </div>

    <el-card class="search-section" shadow="never">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="姓名 / 手机号 / 邮箱"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="签到状态">
          <el-select v-model="searchForm.check_in_status" placeholder="全部" clearable>
            <el-option
              v-for="item in checkInOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="报名时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            unlink-panels
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleDateChange"
          />
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
          <el-button :disabled="!hasPosterSelected" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出报名
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="bulk-actions">
      <el-space wrap>
        <el-button
          type="success"
          :disabled="!hasSelection"
          :loading="actionLoading"
          @click="batchUpdateRegistrationStatus(1)"
        >
          <el-icon><CircleCheckFilled /></el-icon>
          批量确认
        </el-button>
        <el-button
          type="info"
          :disabled="!hasSelection"
          :loading="actionLoading"
          @click="batchUpdateRegistrationStatus(0)"
        >
          <el-icon><Collection /></el-icon>
          批量待审核
        </el-button>
        <el-button
          type="warning"
          :disabled="!hasSelection"
          :loading="actionLoading"
          @click="batchUpdateRegistrationStatus(2)"
        >
          <el-icon><Close /></el-icon>
          批量取消
        </el-button>
        <el-button
          type="primary"
          :disabled="!hasSelection"
          :loading="actionLoading"
          @click="batchCheckIn"
        >
          <el-icon><Finished /></el-icon>
          批量签到
        </el-button>
      </el-space>
    </div>

    <div class="stats-cards" v-if="hasPosterSelected">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon total">
              <el-icon><Tickets /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.total_count }}</div>
              <div class="stat-label">报名总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon confirmed">
              <el-icon><CircleCheckFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.confirmed_count }}</div>
              <div class="stat-label">已确认</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon pending">
              <el-icon><Promotion /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.pending_count }}</div>
              <div class="stat-label">待审核</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon checked-in">
              <el-icon><Finished /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.checked_in_count }}</div>
              <div class="stat-label">已签到</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div v-if="hasPosterSelected" class="table-container">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="registrations"
        row-key="id"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="姓名" min-width="140" />
        <el-table-column prop="phone" label="手机号" min-width="140" />
        <el-table-column prop="email" label="邮箱" min-width="160" show-overflow-tooltip />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="签到" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.is_checked_in" type="success">
              {{ formatDateTime(row.check_in_time) }}
            </el-tag>
            <el-tag v-else type="info">未签到</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="报名时间" min-width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button
                size="small"
                type="primary"
                :disabled="row.is_checked_in"
                @click="handleCheckIn(row)"
              >
                签到
              </el-button>
              <el-dropdown @command="(command) => handleCommand(command, row)">
                <el-button size="small">
                  更多
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="confirm">
                      <el-icon><CircleCheckFilled /></el-icon>设为已确认
                    </el-dropdown-item>
                    <el-dropdown-item command="pending">
                      <el-icon><Edit /></el-icon>设为待审核
                    </el-dropdown-item>
                    <el-dropdown-item command="cancel">
                      <el-icon><Close /></el-icon>设为已取消
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

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current_page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[10, 20, 50, 100]"
          :disabled="loading"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <el-empty
      v-else
      description="请选择海报后查看报名数据"
      :image-size="180"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { posterApi } from '@/api/poster'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '待审核', value: '0' },
  { label: '已确认', value: '1' },
  { label: '已取消', value: '2' }
]

const checkInOptions = [
  { label: '全部', value: '' },
  { label: '已签到', value: 'checked_in' },
  { label: '未签到', value: 'not_checked_in' }
]

const initialStatistics = {
  total_count: 0,
  confirmed_count: 0,
  pending_count: 0,
  cancelled_count: 0,
  checked_in_count: 0,
  today_count: 0,
  this_month_count: 0
}

export default {
  name: 'PosterRegistrations',
  components: {
    ...ElementPlusIconsVue
  },
  setup() {
    const router = useRouter()
    const route = useRoute()

    const loading = ref(false)
    const actionLoading = ref(false)
    const tableRef = ref(null)

    const posterOptions = ref([])
    const posterInfo = ref(null)
    const registrations = ref([])
    const selectedRows = ref([])
    const dateRange = ref([])

    const selectedPosterId = ref(route.query.poster_id ? String(route.query.poster_id) : '')

    const searchForm = reactive({
      keyword: '',
      status: '',
      check_in_status: '',
      start_date: '',
      end_date: ''
    })

    const pagination = reactive({
      current_page: 1,
      per_page: 20,
      total: 0
    })

    const statistics = ref({ ...initialStatistics })

    const hasPosterSelected = computed(() => Boolean(selectedPosterId.value))
    const selectedIds = computed(() => selectedRows.value.map(item => item.id))
    const hasSelection = computed(() => selectedIds.value.length > 0)

    const getPosterIdNumber = () => {
      const value = Number(selectedPosterId.value)
      return Number.isNaN(value) ? null : value
    }

    const loadPosterOptions = async () => {
      try {
        const response = await posterApi.getList({ per_page: 100, order_by: 'created_at', order_dir: 'desc' })
        if (response?.code === 0) {
          posterOptions.value = (response.data?.data || []).map(item => ({
            label: item.title,
            value: String(item.id)
          }))
        } else {
          ElMessage.error(response?.message || '加载海报列表失败')
        }
      } catch (error) {
        console.error('加载海报列表失败:', error)
        ElMessage.error(`加载海报列表失败：${error.message}`)
      }
    }

    const loadPosterDetail = async () => {
      const posterId = getPosterIdNumber()
      if (!posterId) {
        posterInfo.value = null
        return
      }

      try {
        const response = await posterApi.getDetail(posterId)
        if (response?.code === 0) {
          posterInfo.value = response.data
        } else {
          ElMessage.error(response?.message || '获取海报详情失败')
        }
      } catch (error) {
        console.error('获取海报详情失败:', error)
        ElMessage.error(`获取海报详情失败：${error.message}`)
      }
    }

    const loadRegistrationStats = async () => {
      const posterId = getPosterIdNumber()
      if (!posterId) {
        statistics.value = { ...initialStatistics }
        return
      }

      try {
        const response = await posterApi.getRegistrationStatistics(posterId)
        if (response?.code === 0) {
          statistics.value = { ...initialStatistics, ...(response.data || {}) }
        } else {
          ElMessage.error(response?.message || '获取报名统计失败')
        }
      } catch (error) {
        console.error('获取报名统计失败:', error)
        ElMessage.error(`获取报名统计失败：${error.message}`)
      }
    }

    const buildQueryParams = () => {
      const params = {
        page: pagination.current_page,
        per_page: pagination.per_page,
        keyword: searchForm.keyword || undefined,
        check_in_status: searchForm.check_in_status || undefined,
        start_date: searchForm.start_date || undefined,
        end_date: searchForm.end_date || undefined
      }

      if (searchForm.status !== '') {
        params.status = Number(searchForm.status)
      }

      return params
    }

    const loadRegistrations = async () => {
      const posterId = getPosterIdNumber()
      if (!posterId) {
        registrations.value = []
        pagination.total = 0
        return
      }

      loading.value = true
      try {
        const response = await posterApi.getRegistrations(posterId, buildQueryParams())
        if (response?.code === 0) {
          const payload = response.data || {}
          registrations.value = payload.data || []
          pagination.total = payload.total || 0
          pagination.current_page = payload.current_page || pagination.current_page
          pagination.per_page = payload.per_page || pagination.per_page
          if (selectedRows.value.length) {
            selectedRows.value = []
            tableRef.value?.clearSelection?.()
          }
        } else {
          ElMessage.error(response?.message || '加载报名记录失败')
          registrations.value = []
          pagination.total = 0
        }
      } catch (error) {
        console.error('加载报名记录失败:', error)
        ElMessage.error(`加载报名记录失败：${error.message}`)
        registrations.value = []
        pagination.total = 0
      } finally {
        loading.value = false
      }
    }

    const fetchPosterContext = async () => {
      await Promise.all([loadPosterDetail(), loadRegistrationStats()])
      await loadRegistrations()
    }

    const handlePosterChange = async (value) => {
      const nextQuery = { ...route.query }
      if (value) {
        nextQuery.poster_id = value
      } else {
        delete nextQuery.poster_id
      }
      router.replace({ query: nextQuery })

      selectedPosterId.value = value || ''
      pagination.current_page = 1
      selectedRows.value = []
      registrations.value = []

      if (value) {
        await fetchPosterContext()
      } else {
        posterInfo.value = null
        statistics.value = { ...initialStatistics }
      }
    }

    const handleSearch = () => {
      pagination.current_page = 1
      loadRegistrations()
    }

    const handleReset = () => {
      Object.assign(searchForm, {
        keyword: '',
        status: '',
        check_in_status: '',
        start_date: '',
        end_date: ''
      })
      dateRange.value = []
      pagination.current_page = 1
      loadRegistrations()
    }

    const handleDateChange = (dates) => {
      if (dates && dates.length === 2) {
        searchForm.start_date = dates[0]
        searchForm.end_date = dates[1]
      } else {
        searchForm.start_date = ''
        searchForm.end_date = ''
      }
    }

    const handleSizeChange = (size) => {
      pagination.per_page = size
      pagination.current_page = 1
      loadRegistrations()
    }

    const handleCurrentChange = (page) => {
      pagination.current_page = page
      loadRegistrations()
    }

    const handleSelectionChange = (selection) => {
      selectedRows.value = selection
    }

    const handleCheckIn = async (row) => {
      actionLoading.value = true
      try {
        const response = await posterApi.checkInRegistration(row.id)
        if (response?.code === 0) {
          ElMessage.success('签到成功')
          await Promise.all([loadRegistrations(), loadRegistrationStats()])
        } else {
          ElMessage.error(response?.message || '签到失败')
        }
      } catch (error) {
        console.error('签到失败:', error)
        ElMessage.error(`签到失败：${error.message}`)
      } finally {
        actionLoading.value = false
      }
    }

    const updateRegistrationStatus = async (ids, status, successMessage) => {
      actionLoading.value = true
      try {
        const response = await posterApi.batchUpdateRegistrationStatus(ids, status)
        if (response?.code === 0) {
          ElMessage.success(successMessage)
          await Promise.all([loadRegistrations(), loadRegistrationStats()])
        } else {
          ElMessage.error(response?.message || '操作失败')
        }
      } catch (error) {
        console.error('更新报名状态失败:', error)
        ElMessage.error(`操作失败：${error.message}`)
      } finally {
        actionLoading.value = false
      }
    }

    const batchUpdateRegistrationStatus = (status) => {
      if (!selectedIds.value.length) return
      const text = getStatusText(status)
      updateRegistrationStatus(selectedIds.value, status, `已批量设置为${text}`)
    }

    const batchCheckIn = async () => {
      if (!selectedIds.value.length) return
      actionLoading.value = true
      try {
        const response = await posterApi.batchCheckInRegistrations(selectedIds.value)
        if (response?.code === 0) {
          ElMessage.success('批量签到成功')
          await Promise.all([loadRegistrations(), loadRegistrationStats()])
        } else {
          ElMessage.error(response?.message || '批量签到失败')
        }
      } catch (error) {
        console.error('批量签到失败:', error)
        ElMessage.error(`批量签到失败：${error.message}`)
      } finally {
        actionLoading.value = false
      }
    }

    const handleDelete = (row) => {
      ElMessageBox.confirm(
        '确定要删除该报名记录吗？此操作不可恢复。',
        '删除确认',
        {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        actionLoading.value = true
        try {
          const response = await posterApi.deleteRegistration(row.id)
          if (response?.code === 0) {
            ElMessage.success('报名记录删除成功')
            if (registrations.value.length === 1 && pagination.current_page > 1) {
              pagination.current_page -= 1
            }
            await Promise.all([loadRegistrations(), loadRegistrationStats()])
          } else {
            ElMessage.error(response?.message || '删除失败')
          }
        } catch (error) {
          console.error('删除报名记录失败:', error)
          ElMessage.error(`删除失败：${error.message}`)
        } finally {
          actionLoading.value = false
        }
      }).catch(() => {})
    }

    const handleCommand = (command, row) => {
      switch (command) {
        case 'confirm':
          updateRegistrationStatus([row.id], 1, '已设置为已确认')
          break
        case 'pending':
          updateRegistrationStatus([row.id], 0, '已设置为待审核')
          break
        case 'cancel':
          updateRegistrationStatus([row.id], 2, '已设置为已取消')
          break
        case 'delete':
          handleDelete(row)
          break
        default:
          break
      }
    }

    const handleExport = async () => {
      const posterId = getPosterIdNumber()
      if (!posterId) {
        ElMessage.warning('请选择海报后再导出')
        return
      }

      try {
        const blob = await posterApi.exportRegistrations(posterId)
        const filename = `${posterInfo.value?.title || 'poster'}_报名记录.csv`
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.click()
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('导出报名记录失败:', error)
        ElMessage.error(`导出失败：${error.message}`)
      }
    }

    const handleCreatePoster = () => {
      router.push({ name: 'PosterCreate' })
    }

    const getStatusType = (status) => {
      const value = Number(status)
      const typeMap = {
        0: 'warning',
        1: 'success',
        2: 'info'
      }
      return typeMap[value] || 'info'
    }

    const getStatusText = (status) => {
      const value = Number(status)
      const textMap = {
        0: '待审核',
        1: '已确认',
        2: '已取消'
      }
      return textMap[value] || '未知'
    }

    const formatDateTime = (value) => {
      if (!value) return ''
      return new Date(value).toLocaleString()
    }

    onMounted(async () => {
      await loadPosterOptions()
      if (selectedPosterId.value) {
        await fetchPosterContext()
      } else if (posterOptions.value.length) {
        handlePosterChange(posterOptions.value[0].value)
      }
    })

    return {
      loading,
      actionLoading,
      tableRef,
      posterOptions,
      posterInfo,
      registrations,
      selectedRows,
      dateRange,
      selectedPosterId,
      searchForm,
      pagination,
      statistics,
      statusOptions,
      checkInOptions,
      hasPosterSelected,
      hasSelection,
      handlePosterChange,
      handleSearch,
      handleReset,
      handleDateChange,
      handleSizeChange,
      handleCurrentChange,
      handleSelectionChange,
      handleCheckIn,
      batchUpdateRegistrationStatus,
      batchCheckIn,
      handleCommand,
      handleExport,
      handleCreatePoster,
      getStatusType,
      getStatusText,
      formatDateTime
    }
  }
}
</script>

<style scoped>
.poster-registrations {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.header-left p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-section {
  margin-bottom: 20px;
}

.bulk-actions {
  margin: 0 0 20px;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 22px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.confirmed {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.checked-in {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.pagination-container {
  padding: 20px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .poster-registrations {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .search-section {
    overflow-x: auto;
  }
}
</style>
