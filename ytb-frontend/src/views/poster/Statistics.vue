<template>
  <div class="poster-statistics">
    <div class="page-header">
      <div class="header-left">
        <h2>邀请海报数据统计</h2>
        <p v-if="posterInfo">
          {{ posterInfo.title }} · {{ posterInfo.location || '未设置地点' }}
        </p>
        <p v-else>请选择要分析的海报</p>
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
        <el-button type="primary" :disabled="!hasPosterSelected" @click="goRegistrations">
          <el-icon><UserFilled /></el-icon>
          查看报名名单
        </el-button>
        <el-button :disabled="!hasPosterSelected" @click="refreshStatistics">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="poster-info-card" v-if="posterInfo">
      <el-descriptions :column="3" border size="small">
        <el-descriptions-item label="活动时间">
          {{ formatDateTime(posterInfo.start_time) }} - {{ formatDateTime(posterInfo.end_time) }}
        </el-descriptions-item>
        <el-descriptions-item label="活动地点">
          {{ posterInfo.location || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="最大报名">
          {{ posterInfo.max_registrations || '不限制' }}
        </el-descriptions-item>
        <el-descriptions-item label="海报预览">
          <el-link v-if="posterInfo.poster_url" type="primary" :href="posterInfo.poster_url" target="_blank">
            查看海报
          </el-link>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="二维码">
          <el-link v-if="posterInfo.qr_code_url" type="primary" :href="posterInfo.qr_code_url" target="_blank">
            下载二维码
          </el-link>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="stats-cards" v-if="hasPosterSelected">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card total">
            <div class="stat-icon">
              <el-icon><Tickets /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ basicStats.total || 0 }}</div>
              <div class="stat-label">报名总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card confirmed">
            <div class="stat-icon">
              <el-icon><CircleCheckFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ basicStats.confirmed || 0 }}</div>
              <div class="stat-label">已确认</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card pending">
            <div class="stat-icon">
              <el-icon><Promotion /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ basicStats.pending || 0 }}</div>
              <div class="stat-label">待审核</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card cancelled">
            <div class="stat-icon">
              <el-icon><Close /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ basicStats.cancelled || 0 }}</div>
              <div class="stat-label">已取消</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div v-if="hasPosterSelected" class="statistics-grid">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>近30日报名趋势</span>
                <el-tag size="small" type="info">按日期</el-tag>
              </div>
            </template>
            <el-table
              :data="dailyTrend"
              height="360"
              size="small"
              v-loading="statsLoading"
              empty-text="暂无趋势数据"
            >
              <el-table-column prop="date" label="日期" />
              <el-table-column prop="count" label="报名人数" width="120" />
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>按时段分布</span>
                <el-tag size="small" type="info">24小时</el-tag>
              </div>
            </template>
            <el-table
              :data="hourlyStats"
              height="360"
              size="small"
              v-loading="statsLoading"
              empty-text="暂无时段数据"
            >
              <el-table-column label="时段">
                <template #default="{ row }">
                  {{ row.hour }}:00 - {{ (Number(row.hour) + 1) % 24 }}:00
                </template>
              </el-table-column>
              <el-table-column prop="count" label="报名人数" width="120" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <el-card v-if="formFieldStatsList.length" shadow="hover" class="form-stats-card">
        <template #header>
          <div class="card-header">
            <span>自定义表单字段统计</span>
            <el-tag size="small" type="success">选择题</el-tag>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col
            v-for="field in formFieldStatsList"
            :key="field.label"
            :span="12"
            class="form-field-column"
          >
            <h4>{{ field.label }}</h4>
            <el-table
              :data="field.stats"
              size="small"
              max-height="260"
              empty-text="暂无统计数据"
            >
              <el-table-column prop="value" label="选项" />
              <el-table-column prop="count" label="人数" width="120" />
            </el-table>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <el-empty
      v-else
      description="请选择海报查看统计数据"
      :image-size="180"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { posterApi } from '@/api/poster'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

export default {
  name: 'PosterStatistics',
  components: {
    ...ElementPlusIconsVue
  },
  setup() {
    const router = useRouter()
    const route = useRoute()

    const posterOptions = ref([])
    const selectedPosterId = ref(route.query.poster_id ? String(route.query.poster_id) : '')
    const posterInfo = ref(null)

    const basicStats = reactive({
      total: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0
    })

    const dailyTrend = ref([])
    const hourlyStats = ref([])
    const formFieldStats = ref({})

    const statsLoading = ref(false)

    const hasPosterSelected = computed(() => Boolean(selectedPosterId.value))
    const formFieldStatsList = computed(() => Object.values(formFieldStats.value || {}))

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

    const loadPosterStatistics = async () => {
      const posterId = getPosterIdNumber()
      if (!posterId) {
        posterInfo.value = null
        Object.assign(basicStats, { total: 0, confirmed: 0, pending: 0, cancelled: 0 })
        dailyTrend.value = []
        hourlyStats.value = []
        formFieldStats.value = {}
        return
      }

      statsLoading.value = true
      try {
        const response = await posterApi.getStatistics(posterId)
        if (response?.code === 0) {
          const data = response.data || {}
          posterInfo.value = data.poster_info || null

          const stats = data.basic_stats || {}
          Object.assign(basicStats, {
            total: stats.total || 0,
            confirmed: stats.confirmed || 0,
            pending: stats.pending || 0,
            cancelled: stats.cancelled || 0
          })

          dailyTrend.value = (data.daily_trend || [])
            .map(item => ({
              date: item.date,
              count: item.count
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))

          hourlyStats.value = (data.hourly_stats || []).map(item => ({
            hour: item.hour,
            count: item.count
          }))

          formFieldStats.value = data.form_field_stats || {}
        } else {
          ElMessage.error(response?.message || '获取统计数据失败')
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
        ElMessage.error(`获取统计数据失败：${error.message}`)
      } finally {
        statsLoading.value = false
      }
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
      await loadPosterStatistics()
    }

    const refreshStatistics = async () => {
      await loadPosterStatistics()
    }

    const goRegistrations = () => {
      if (!selectedPosterId.value) return
      router.push({ name: 'PosterRegistrations', query: { poster_id: selectedPosterId.value } })
    }

    const formatDateTime = (value) => {
      if (!value) return '-'
      return new Date(value).toLocaleString()
    }

    onMounted(async () => {
      await loadPosterOptions()
      if (selectedPosterId.value) {
        await loadPosterStatistics()
      } else if (posterOptions.value.length) {
        handlePosterChange(posterOptions.value[0].value)
      }
    })

    return {
      posterOptions,
      selectedPosterId,
      posterInfo,
      basicStats,
      dailyTrend,
      hourlyStats,
      formFieldStatsList,
      statsLoading,
      hasPosterSelected,
      handlePosterChange,
      refreshStatistics,
      goRegistrations,
      formatDateTime
    }
  }
}
</script>

<style scoped>
.poster-statistics {
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
  margin: 0 0 8px;
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

.poster-info-card {
  margin-bottom: 20px;
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

.stat-card .stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 22px;
  color: #fff;
}

.stat-card.total .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card.confirmed .stat-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-card.pending .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card.cancelled .stat-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
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

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
}

.form-stats-card h4 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #303133;
}

.form-field-column {
  margin-bottom: 20px;
}

.statistics-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (max-width: 768px) {
  .poster-statistics {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }
}
</style>
