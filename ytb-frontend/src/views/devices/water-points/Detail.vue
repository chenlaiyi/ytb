<template>
  <div class="water-point-detail">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">取水点详情</h1>
        <p class="page-description">查看取水点详细信息</p>
      </div>
      <div class="header-actions">
        <el-button @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </el-button>
        <el-button type="primary" @click="handleEdit">
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- 详情内容 -->
    <div v-else-if="waterPoint" class="detail-container">
      <!-- 基本信息 -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
            <div class="status-badges">
              <el-tag :type="getStatusType(waterPoint.status)" size="large">
                {{ getStatusText(waterPoint.status) }}
              </el-tag>
              <el-tag :type="waterPoint.is_open ? 'success' : 'danger'" size="large">
                {{ waterPoint.is_open ? '营业中' : '已关闭' }}
              </el-tag>
            </div>
          </div>
        </template>

        <el-row :gutter="30">
          <el-col :span="12">
            <div class="info-group">
              <h3>基础信息</h3>
              <div class="info-item">
                <label>取水点名称：</label>
                <span>{{ waterPoint.name }}</span>
              </div>
              <div class="info-item">
                <label>详细地址：</label>
                <span>{{ waterPoint.address }}</span>
              </div>
              <div class="info-item">
                <label>联系人：</label>
                <span>{{ waterPoint.contact_person }}</span>
              </div>
              <div class="info-item">
                <label>联系电话：</label>
                <span>{{ waterPoint.contact_phone }}</span>
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-group">
              <h3>位置信息</h3>
              <div class="info-item">
                <label>纬度：</label>
                <span>{{ waterPoint.latitude }}</span>
              </div>
              <div class="info-item">
                <label>经度：</label>
                <span>{{ waterPoint.longitude }}</span>
              </div>
              <div class="info-item">
                <label>设备数量：</label>
                <span>{{ waterPoint.device_count || 0 }} 台</span>
              </div>
              <div class="info-item">
                <label>评分：</label>
                <span>
                  <el-rate
                    v-model="waterPoint.rating"
                    disabled
                    show-score
                    text-color="#ff9900"
                  />
                </span>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 营业信息 -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>营业信息</span>
          </div>
        </template>

        <el-row :gutter="30">
          <el-col :span="12">
            <div class="info-group">
              <div class="info-item">
                <label>营业时间：</label>
                <span>{{ waterPoint.business_hours || '暂无' }}</span>
              </div>
              <div class="info-item">
                <label>开始时间：</label>
                <span>{{ waterPoint.open_time || '暂无' }}</span>
              </div>
              <div class="info-item">
                <label>结束时间：</label>
                <span>{{ waterPoint.close_time || '暂无' }}</span>
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-group">
              <div class="info-item">
                <label>价格信息：</label>
                <span>{{ waterPoint.price || '暂无' }}</span>
              </div>
              <div class="info-item">
                <label>营业状态：</label>
                <el-switch
                  v-model="waterPoint.is_open"
                  active-text="营业中"
                  inactive-text="已关闭"
                  @change="handleOpenStatusChange"
                />
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 标签和设施 -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>标签和设施</span>
          </div>
        </template>

        <div class="info-group">
          <div class="info-item">
            <label>标签：</label>
            <div class="tags-container">
              <el-tag
                v-for="tag in waterPoint.tags"
                :key="tag"
                type="info"
                class="tag-item"
              >
                {{ tag }}
              </el-tag>
              <span v-if="!waterPoint.tags || waterPoint.tags.length === 0" class="no-data">
                暂无标签
              </span>
            </div>
          </div>
          <div class="info-item">
            <label>设施：</label>
            <div class="facilities-container">
              <el-tag
                v-for="facility in waterPoint.facilities"
                :key="facility"
                type="success"
                class="tag-item"
              >
                {{ facility }}
              </el-tag>
              <span v-if="!waterPoint.facilities || waterPoint.facilities.length === 0" class="no-data">
                暂无设施信息
              </span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 描述信息 -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>描述信息</span>
          </div>
        </template>

        <div class="description-content">
          <p v-if="waterPoint.description">{{ waterPoint.description }}</p>
          <p v-else class="no-data">暂无描述信息</p>
        </div>
      </el-card>

      <!-- 创建和更新信息 -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>系统信息</span>
          </div>
        </template>

        <el-row :gutter="30">
          <el-col :span="12">
            <div class="info-group">
              <div class="info-item">
                <label>创建时间：</label>
                <span>{{ formatDate(waterPoint.created_at) }}</span>
              </div>
              <div class="info-item">
                <label>创建人：</label>
                <span>{{ waterPoint.creator?.name || '系统' }}</span>
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-group">
              <div class="info-item">
                <label>更新时间：</label>
                <span>{{ formatDate(waterPoint.updated_at) }}</span>
              </div>
              <div class="info-item">
                <label>更新人：</label>
                <span>{{ waterPoint.updater?.name || '系统' }}</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 数据不存在 -->
    <div v-else class="empty-container">
      <el-empty description="取水点不存在或已被删除">
        <el-button type="primary" @click="handleBack">返回列表</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Edit } from '@element-plus/icons-vue'
import { getWaterPointDetail, updateWaterPointOpenStatus } from '@/api/v1/waterPoint'

export default {
  name: 'WaterPointDetail',
  components: {
    ArrowLeft,
    Edit
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const loading = ref(true)
    const waterPoint = ref(null)

    // 获取取水点详情
    const fetchWaterPointDetail = async () => {
      try {
        loading.value = true
        const response = await getWaterPointDetail(route.params.id)
        
        if (response.code === 0) {
          waterPoint.value = response.data
        } else {
          ElMessage.error(response.message || '获取取水点详情失败')
        }
      } catch (error) {
        console.error('获取取水点详情失败:', error)
        ElMessage.error('获取取水点详情失败')
      } finally {
        loading.value = false
      }
    }

    // 获取状态类型
    const getStatusType = (status) => {
      const statusMap = {
        'active': 'success',
        'inactive': 'warning',
        'maintenance': 'danger'
      }
      return statusMap[status] || 'info'
    }

    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        'active': '正常营业',
        'inactive': '暂停营业',
        'maintenance': '维护中'
      }
      return statusMap[status] || '未知状态'
    }

    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleString('zh-CN')
    }

    // 处理营业状态变更
    const handleOpenStatusChange = async (value) => {
      try {
        await ElMessageBox.confirm(
          `确定要${value ? '开启' : '关闭'}营业状态吗？`,
          '确认操作',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        await updateWaterPointOpenStatus(route.params.id, value)
        ElMessage.success('营业状态更新成功')
        
        // 刷新数据
        await fetchWaterPointDetail()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('更新营业状态失败:', error)
          ElMessage.error('更新营业状态失败')
          // 恢复原状态
          waterPoint.value.is_open = !value
        } else {
          // 用户取消，恢复原状态
          waterPoint.value.is_open = !value
        }
      }
    }

    // 返回列表
    const handleBack = () => {
      router.push('/devices/water-points')
    }

    // 编辑
    const handleEdit = () => {
      router.push(`/devices/water-points/${route.params.id}/edit`)
    }

    // 组件挂载时获取数据
    onMounted(() => {
      fetchWaterPointDetail()
    })

    return {
      loading,
      waterPoint,
      getStatusType,
      getStatusText,
      formatDate,
      handleOpenStatusChange,
      handleBack,
      handleEdit
    }
  }
}
</script>

<style scoped>
.water-point-detail {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 10px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: bold;
}

.page-description {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.header-actions .el-button {
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.3);
  color: white;
}

.header-actions .el-button:hover {
  background: rgba(255,255,255,0.3);
  border-color: rgba(255,255,255,0.5);
}

.header-actions .el-button--primary {
  background: rgba(255,255,255,0.9);
  color: #667eea;
}

.header-actions .el-button--primary:hover {
  background: white;
}

.loading-container {
  background: white;
  padding: 30px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.detail-container {
  max-width: 1200px;
  margin: 0 auto;
}

.detail-card {
  margin-bottom: 20px;
  border-radius: 10px;
  overflow: hidden;
}

.detail-card :deep(.el-card__header) {
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  color: #333;
  font-size: 16px;
}

.status-badges {
  display: flex;
  gap: 10px;
}

.info-group {
  margin-bottom: 20px;
}

.info-group h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  min-height: 32px;
}

.info-item label {
  font-weight: 500;
  color: #666;
  min-width: 120px;
  margin-right: 10px;
}

.info-item span {
  color: #333;
  flex: 1;
}

.tags-container,
.facilities-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag-item {
  margin: 0;
}

.no-data {
  color: #999;
  font-style: italic;
}

.description-content {
  line-height: 1.6;
  color: #333;
}

.description-content p {
  margin: 0;
  white-space: pre-wrap;
}

.empty-container {
  background: white;
  padding: 60px;
  border-radius: 10px;
  text-align: center;
}

:deep(.el-rate) {
  display: inline-flex;
  align-items: center;
}

:deep(.el-rate__text) {
  margin-left: 8px;
  color: #333;
}

:deep(.el-switch) {
  margin-left: 0;
}
</style> 