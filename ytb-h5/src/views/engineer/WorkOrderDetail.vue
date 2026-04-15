<template>
  <div class="work-order-detail-page">
    <!-- 自定义导航栏 -->
    <div class="custom-navbar">
      <div class="navbar-content">
        <div class="navbar-left" @click="$router.go(-1)">
          <van-icon name="arrow-left" />
          <span>返回</span>
        </div>
        <div class="navbar-title">工单详情</div>
        <div class="navbar-right"></div>
      </div>
    </div>

    <PullRefresh v-model="refreshing" @refresh="onRefresh">
      <div v-if="workOrder" class="content">
        <!-- 工单基本信息 -->
        <div class="order-card">
          <div class="order-header">
            <div class="order-id">#{{ workOrder.id }}</div>
            <div class="order-status" :class="getStatusClass(workOrder.status)">
              {{ getStatusText(workOrder.status) }}
            </div>
          </div>
          
          <div class="order-info">
            <div class="info-item">
              <div class="info-label">工单类型</div>
              <div class="info-value">{{ workOrder.title }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">预约时间</div>
              <div class="info-value">{{ workOrder.scheduled_time }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">联系人</div>
              <div class="info-value">{{ workOrder.contact_name }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">联系电话</div>
              <div class="info-value">{{ workOrder.contact_phone }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">安装地址</div>
              <div class="info-value">{{ workOrder.address }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">设备类型</div>
              <div class="info-value">{{ workOrder.device_type }}</div>
            </div>
            <div class="info-item" v-if="workOrder.remark">
              <div class="info-label">备注</div>
              <div class="info-value">{{ workOrder.remark }}</div>
            </div>
          </div>
        </div>

        <!-- 客户信息 -->
        <div class="customer-card">
          <div class="card-title">客户信息</div>
          <div class="customer-info">
            <div class="info-item">
              <div class="info-label">客户姓名</div>
              <div class="info-value">{{ workOrder.user?.name || '未知' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">客户电话</div>
              <div class="info-value">{{ workOrder.user?.mobile || '未知' }}</div>
            </div>
          </div>
        </div>

        <!-- 工程师操作 -->
        <div class="action-card" v-if="workOrder.status === 'pending'">
          <div class="card-title">操作</div>
          <div class="action-buttons">
            <van-button 
              type="primary" 
              block 
              @click="acceptOrder"
              :loading="acceptLoading"
            >
              接受工单
            </van-button>
          </div>
        </div>

        <div class="action-card" v-else-if="workOrder.status === 'accepted' || workOrder.status === 'in_progress'">
          <div class="card-title">操作</div>
          <div class="action-buttons">
            <van-button 
              type="primary" 
              block 
              @click="startWork"
              :loading="startLoading"
              v-if="workOrder.status === 'accepted'"
            >
              开始工作
            </van-button>
            <van-button 
              type="success" 
              block 
              @click="showCompleteDialog = true"
              v-if="workOrder.status === 'in_progress'"
            >
              完成工单
            </van-button>
          </div>
        </div>

        <!-- 工单进度 -->
        <div class="progress-card" v-if="workOrder.status !== 'pending'">
          <div class="card-title">工单进度</div>
          <van-steps :active="getStepActive(workOrder.status)" direction="vertical">
            <van-step>工单已接单</van-step>
            <van-step>工程师出发</van-step>
            <van-step>开始安装</van-step>
            <van-step>完成安装</van-step>
          </van-steps>
        </div>

        <!-- 完成信息 -->
        <div class="completion-card" v-if="workOrder.status === 'completed' && workOrder.completion_note">
          <div class="card-title">完成信息</div>
          <div class="completion-info">
            <div class="info-item">
              <div class="info-label">完成时间</div>
              <div class="info-value">{{ workOrder.completion_time }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">完成说明</div>
              <div class="info-value">{{ workOrder.completion_note }}</div>
            </div>
          </div>
        </div>

        <!-- 照片上传 -->
        <div class="photo-card" v-if="workOrder.status === 'in_progress' || workOrder.status === 'completed'">
          <div class="card-title">工作照片</div>
          <div class="photo-upload">
            <van-uploader 
              v-model="photoList" 
              multiple 
              :max-count="9"
              :after-read="afterRead"
              :before-read="beforeRead"
            />
          </div>
          <div class="photo-list" v-if="uploadedPhotos.length > 0">
            <div 
              class="photo-item" 
              v-for="(photo, index) in uploadedPhotos" 
              :key="index"
            >
              <van-image
                width="80"
                height="80"
                fit="cover"
                :src="photo"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-else-if="!loading && !refreshing">
        <van-icon name="records" size="60" color="#ddd" />
        <div class="empty-text">工单不存在</div>
      </div>
    </PullRefresh>

    <!-- 完成工单弹窗 -->
    <van-dialog 
      v-model:show="showCompleteDialog" 
      title="完成工单" 
      show-cancel-button
      @confirm="completeOrder"
      :before-close="beforeCompleteClose"
    >
      <div class="complete-dialog-content">
        <van-field
          v-model="completionNote"
          rows="3"
          autosize
          type="textarea"
          placeholder="请输入完成说明..."
        />
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PullRefresh, Icon as VanIcon, Button as VanButton, Steps as VanSteps, Step as VanStep, Uploader as VanUploader, Image as VanImage, Dialog as VanDialog, Field as VanField, Toast } from 'vant'
import { getWorkOrderDetail, acceptWorkOrder, completeWorkOrder, uploadWorkOrderPhoto } from '@/api/engineer'

const route = useRoute()
const router = useRouter()

// 页面状态
const loading = ref(false)
const refreshing = ref(false)
const acceptLoading = ref(false)
const startLoading = ref(false)

// 工单数据
const workOrder = ref(null)

// 照片相关
const photoList = ref([])
const uploadedPhotos = ref([])

// 完成工单相关
const showCompleteDialog = ref(false)
const completionNote = ref('')

// 页面加载时获取工单详情
onMounted(() => {
  const orderId = route.params.id
  if (orderId) {
    fetchWorkOrderDetail(orderId)
  }
})

// 获取工单详情
const fetchWorkOrderDetail = async (orderId) => {
  try {
    loading.value = true
    const res = await getWorkOrderDetail(orderId)
    if (res.code === 0) {
      workOrder.value = res.data
      // 如果有已上传的照片，初始化照片列表
      if (workOrder.value.images && workOrder.value.images.length > 0) {
        uploadedPhotos.value = workOrder.value.images
      }
    } else {
      Toast.fail(res.message || '获取工单详情失败')
    }
  } catch (error) {
    console.error('获取工单详情失败:', error)
    Toast.fail('获取工单详情失败')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新
const onRefresh = () => {
  const orderId = route.params.id
  if (orderId) {
    fetchWorkOrderDetail(orderId)
  }
}

// 接受工单
const acceptOrder = async () => {
  try {
    acceptLoading.value = true
    const res = await acceptWorkOrder(workOrder.value.id)
    if (res.code === 0) {
      Toast.success('接单成功')
      // 更新工单状态
      workOrder.value.status = 'accepted'
    } else {
      Toast.fail(res.message || '接单失败')
    }
  } catch (error) {
    console.error('接单失败:', error)
    Toast.fail('接单失败')
  } finally {
    acceptLoading.value = false
  }
}

// 开始工作
const startWork = async () => {
  try {
    startLoading.value = true
    // 这里应该调用开始工作的API，暂时直接更新状态
    workOrder.value.status = 'in_progress'
    Toast.success('开始工作')
  } catch (error) {
    console.error('开始工作失败:', error)
    Toast.fail('开始工作失败')
  } finally {
    startLoading.value = false
  }
}

// 完成工单前的确认
const beforeCompleteClose = (action, done) => {
  if (action === 'confirm') {
    if (!completionNote.value.trim()) {
      Toast.fail('请输入完成说明')
      done(false)
      return
    }
  }
  done()
}

// 完成工单
const completeOrder = async () => {
  try {
    const res = await completeWorkOrder(workOrder.value.id, {
      completion_note: completionNote.value,
      completion_time: new Date().toISOString()
    })
    if (res.code === 0) {
      Toast.success('工单完成')
      showCompleteDialog.value = false
      completionNote.value = ''
      // 更新工单状态
      workOrder.value.status = 'completed'
      workOrder.value.completion_note = completionNote.value
      workOrder.value.completion_time = new Date().toISOString()
    } else {
      Toast.fail(res.message || '完成工单失败')
    }
  } catch (error) {
    console.error('完成工单失败:', error)
    Toast.fail('完成工单失败')
  }
}

// 照片上传前的检查
const beforeRead = (file) => {
  if (Array.isArray(file)) {
    return file.every(item => item.type.startsWith('image/'))
  }
  return file.type.startsWith('image/')
}

// 照片读取后的处理
const afterRead = async (file) => {
  try {
    // 创建FormData对象
    const formData = new FormData()
    formData.append('photo', file.file)
    
    // 上传照片
    const res = await uploadWorkOrderPhoto(workOrder.value.id, formData)
    if (res.code === 0) {
      Toast.success('上传成功')
      // 添加到已上传照片列表
      uploadedPhotos.value.push(res.data.url)
      // 清空上传列表
      photoList.value = []
    } else {
      Toast.fail(res.message || '上传失败')
      // 移除上传失败的文件
      photoList.value = photoList.value.filter(item => item !== file)
    }
  } catch (error) {
    console.error('上传照片失败:', error)
    Toast.fail('上传失败')
    // 移除上传失败的文件
    photoList.value = photoList.value.filter(item => item !== file)
  }
}

// 获取状态样式
const getStatusClass = (status) => {
  const statusMap = {
    'pending': 'status-pending',
    'accepted': 'status-accepted',
    'in_progress': 'status-processing',
    'completed': 'status-completed',
    'cancelled': 'status-cancelled'
  }
  return statusMap[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'pending': '待接单',
    'accepted': '已接单',
    'in_progress': '处理中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || '未知'
}

// 获取步骤激活状态
const getStepActive = (status) => {
  const stepMap = {
    'accepted': 1,
    'in_progress': 2,
    'completed': 3
  }
  return stepMap[status] || 0
}
</script>

<style scoped>
.work-order-detail-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 自定义导航栏 */
.custom-navbar {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  color: white;
  padding: 0 12px;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 4px;
}

.navbar-left, .navbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
  cursor: pointer;
}

.navbar-title {
  font-size: 18px;
  font-weight: bold;
}

.content {
  padding: 12px;
}

/* 卡片样式 */
.order-card, .customer-card, .action-card, .progress-card, .completion-card, .photo-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
}

/* 工单头部 */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.order-id {
  font-weight: bold;
  color: #333;
}

.order-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status-pending { background: #fff3cd; color: #856404; }
.status-accepted { background: #d4edda; color: #155724; }
.status-processing { background: #cce5ff; color: #004085; }
.status-completed { background: #d1ecf1; color: #0c5460; }
.status-cancelled { background: #f8d7da; color: #721c24; }

/* 信息项 */
.info-item {
  display: flex;
  margin-bottom: 12px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  width: 80px;
  font-size: 14px;
  color: #666;
}

.info-value {
  flex: 1;
  font-size: 14px;
  color: #333;
}

/* 操作按钮 */
.action-buttons {
  margin-top: 8px;
}

/* 进度条 */
.progress-card :deep(.van-step__title) {
  font-size: 14px;
}

/* 完成弹窗 */
.complete-dialog-content {
  padding: 16px;
}

/* 照片上传 */
.photo-upload {
  margin-bottom: 12px;
}

.photo-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.photo-item {
  margin-right: 8px;
  margin-bottom: 8px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-text {
  margin-top: 12px;
  color: #999;
  font-size: 14px;
}
</style>