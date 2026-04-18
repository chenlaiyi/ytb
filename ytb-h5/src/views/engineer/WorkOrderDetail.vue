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
        <div class="action-card" v-if="workOrder.status === 'paid'">
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

        <div class="action-card" v-else-if="workOrder.status === 'accepted' || workOrder.status === 'picked' || workOrder.status === 'installing'">
          <div class="card-title">操作</div>
          <div class="action-buttons">
            <van-button 
              type="primary" 
              block 
              @click="showPickDialog = true"
              :loading="startLoading"
              v-if="workOrder.status === 'accepted'"
            >
              领机扫码(登记主板号)
            </van-button>
            <van-button 
              type="primary" 
              block 
              @click="showAccessoryDialog = true"
              :loading="startLoading"
              v-if="workOrder.status === 'picked'"
            >
              录入配件费并开始安装
            </van-button>
            <van-button 
              type="success" 
              block 
              @click="showCompleteDialog = true"
              v-if="workOrder.status === 'installing'"
            >
              提交水质检测(完成)
            </van-button>
          </div>
        </div>

        <!-- 费用信息 -->
        <div class="customer-card" v-if="workOrder.status === 'installing' || workOrder.status === 'completed'">
          <div class="card-title">配件与费用信息</div>
          <div class="customer-info" v-if="workOrder.accessory_order_id">
            <div class="info-item">
              <div class="info-label">配件费</div>
              <div class="info-value">¥{{ workOrder.accessory?.total_amount || 0 }} ({{ workOrder.accessory_paid ? '已支付' : '待用户支付' }})</div>
            </div>
          </div>
          <div class="customer-info" v-else>
            <div class="info-item">
              <div class="info-label">配件</div>
              <div class="info-value">无额外配件产生</div>
            </div>
          </div>
        </div>

        <!-- 工单进度 -->
        <div class="progress-card" v-if="workOrder.status !== 'paid'">
          <div class="card-title">工单进度</div>
          <van-steps :active="getStepActive(workOrder.status)" direction="vertical">
            <van-step>已接单</van-step>
            <van-step>已领机</van-step>
            <van-step>安装中</van-step>
            <van-step>完成安装</van-step>
          </van-steps>
        </div>
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

    <!-- 领机弹窗 -->
    <van-dialog 
      v-model:show="showPickDialog" 
      title="领机扫码" 
      show-cancel-button
      @confirm="submitPick"
    >
      <div class="complete-dialog-content">
        <van-field
          v-model="boardCode"
          label="主板号"
          placeholder="请输入或扫码主板号"
        >
          <template #button>
            <van-button size="small" type="primary" @click="scanQRCode">扫码</van-button>
          </template>
        </van-field>
      </div>
    </van-dialog>

    <!-- 配件与费用弹窗 -->
    <van-dialog 
      v-model:show="showAccessoryDialog" 
      title="录入配件(可选)" 
      show-cancel-button
      @confirm="submitAccessory"
    >
      <div class="complete-dialog-content">
        <van-field
          v-model="accessoryAmount"
          label="额外配件费"
          type="number"
          placeholder="无额外配件留空或0"
        />
        <van-field
          v-model="accessoryNote"
          rows="2"
          autosize
          type="textarea"
          label="配件明细"
          placeholder="如: PPR管x2, 三通x1"
        />
      </div>
    </van-dialog>

    <!-- 提交水质检测弹窗 -->
    <van-dialog 
      v-model:show="showCompleteDialog" 
      title="水质检测提交" 
      show-cancel-button
      @confirm="completeOrder"
      :before-close="beforeCompleteClose"
    >
      <div class="complete-dialog-content">
        <van-field v-model="waterTest.tds_before" label="原水TDS" type="digit" placeholder="原水TDS值" />
        <van-field v-model="waterTest.tds_after" label="净水TDS" type="digit" placeholder="净水TDS值" />
        <van-field v-model="waterTest.chlorine_before" label="原水余氯" type="number" placeholder="例如: 0.5" />
        <van-field v-model="waterTest.chlorine_after" label="净水余氯" type="number" placeholder="例如: 0.0" />
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PullRefresh, Icon as VanIcon, Button as VanButton, Steps as VanSteps, Step as VanStep, Uploader as VanUploader, Image as VanImage, Dialog as VanDialog, Field as VanField, Toast } from 'vant'
import { pickWorkOrder, submitAccessories } from '@/api/engineer'

// ... existing refs
const showPickDialog = ref(false)
const boardCode = ref('')

const showAccessoryDialog = ref(false)
const accessoryAmount = ref('')
const accessoryNote = ref('')

const waterTest = ref({
  tds_before: '',
  tds_after: '',
  chlorine_before: '',
  chlorine_after: ''
})

// 接受工单
const acceptOrder = async () => {
  try {
    acceptLoading.value = true
    const res = await acceptWorkOrder(workOrder.value.id)
    if (res.code === 0) {
      Toast.success('接单成功')
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

// 领机扫码
const scanQRCode = () => {
  // TODO: Call Wechat JS-SDK scan
  Toast('请在此手动输入扫码内容')
}

const submitPick = async () => {
  if (!boardCode.value.trim()) {
    Toast.fail('主板号不能为空')
    return
  }
  try {
    startLoading.value = true
    const res = await pickWorkOrder(workOrder.value.id, { board_code: boardCode.value })
    if (res.code === 0) {
      Toast.success('领机成功')
      workOrder.value.status = 'picked'
      showPickDialog.value = false
    } else {
      Toast.fail(res.message || '领机失败')
    }
  } catch (error) {
    Toast.fail('领机失败')
  } finally {
    startLoading.value = false
  }
}

// 提交配件开始安装
const submitAccessory = async () => {
  try {
    startLoading.value = true
    const items = []
    if (accessoryNote.value.trim()) {
      items.push({ name: '附加配件/服务', qty: 1, price: accessoryAmount.value || 0, remark: accessoryNote.value })
    }
    const res = await submitAccessories(workOrder.value.id, { items })
    if (res.code === 0) {
      Toast.success('已开始安装')
      workOrder.value.status = 'installing'
      showAccessoryDialog.value = false
      fetchWorkOrderDetail(workOrder.value.id)
    } else {
      Toast.fail(res.message || '提交失败')
    }
  } catch (error) {
    Toast.fail('提交失败')
  } finally {
    startLoading.value = false
  }
}

// 完成工单前的确认
const beforeCompleteClose = (action, done) => {
  if (action === 'confirm') {
    if (!waterTest.value.tds_before || !waterTest.value.tds_after) {
      Toast.fail('请填写TDS值')
      done(false)
      return
    }
  }
  done()
}

// 完成工单(提交水质检测)
const completeOrder = async () => {
  try {
    const res = await completeWorkOrder(workOrder.value.id, waterTest.value)
    if (res.code === 0) {
      Toast.success('水质检测提交成功, 安装完成')
      showCompleteDialog.value = false
      workOrder.value.status = 'completed'
    } else {
      Toast.fail(res.message || '完成工单失败')
    }
  } catch (error) {
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
    const formData = new FormData()
    formData.append('photo', file.file)
    const res = await uploadWorkOrderPhoto(workOrder.value.id, formData)
    if (res.code === 0) {
      Toast.success('上传成功')
      uploadedPhotos.value.push(res.data.url)
      photoList.value = []
    } else {
      Toast.fail(res.message || '上传失败')
      photoList.value = photoList.value.filter(item => item !== file)
    }
  } catch (error) {
    Toast.fail('上传失败')
    photoList.value = photoList.value.filter(item => item !== file)
  }
}

// 获取状态样式
const getStatusClass = (status) => {
  const statusMap = {
    'paid': 'status-pending',
    'accepted': 'status-accepted',
    'picked': 'status-processing',
    'installing': 'status-processing',
    'completed': 'status-completed',
    'cancelled': 'status-cancelled'
  }
  return statusMap[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'paid': '待接单',
    'accepted': '待领机',
    'picked': '待安装',
    'installing': '安装中(待检测)',
    'completed': '已完成(待激活)',
    'cancelled': '已取消'
  }
  return statusMap[status] || '未知'
}

// 获取步骤激活状态
const getStepActive = (status) => {
  const stepMap = {
    'accepted': 0,
    'picked': 1,
    'installing': 2,
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