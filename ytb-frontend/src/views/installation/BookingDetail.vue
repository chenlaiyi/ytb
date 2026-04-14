<template>
  <div class="booking-detail-page">
    <div class="page-header">
      <el-page-header @back="goBack" :title="booking.booking_no || '预约详情'" />
    </div>
    
    <div v-loading="loading" class="booking-detail-container" v-if="!loading && booking.id">
      <div class="card status-card">
        <div class="status-header" :class="'status-' + booking.status">
          <div class="status-icon">
            <el-icon size="32px">
              <component :is="getStatusIconName(booking.status)" />
            </el-icon>
          </div>
          <div class="status-text">{{ booking.status_text }}</div>
        </div>
        <div class="status-timeline">
          <el-steps :active="getStatusStepActive(booking.status)" finish-status="success" simple>
            <el-step title="待处理" />
            <el-step title="已确认" />
            <el-step title="已分配" />
            <el-step title="已完成" />
          </el-steps>
        </div>
        <div class="action-buttons" v-if="booking.status !== 'completed' && booking.status !== 'cancelled'">
          <el-button 
            type="primary" 
            @click="handleUpdateStatus"
          >
            更新状态
          </el-button>
        </div>
      </div>
      
      <el-row :gutter="20" class="info-row">
        <el-col :span="12">
          <div class="card">
            <div class="card-header">
              <el-icon><Avatar /></el-icon>
              <span>用户信息</span>
            </div>
            <div class="card-body">
              <div class="user-info-section">
                <div class="user-avatar">
                  <el-avatar 
                    :size="64" 
                    :src="booking.user_avatar"
                    v-if="booking.user_avatar"
                  >
                  </el-avatar>
                  <el-avatar :size="64" icon="el-icon-user" v-else></el-avatar>
                </div>
                <div class="user-details">
                  <h3>{{ booking.user_display_name }}</h3>
                  <p v-if="booking.user_phone">电话: {{ booking.user_phone }}</p>
                  <p>用户ID: {{ booking.user_id }}</p>
                </div>
              </div>
              
              <el-divider />
              
              <div class="info-item">
                <div class="info-label">联系人</div>
                <div class="info-value">{{ booking.contact_name }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">联系电话</div>
                <div class="info-value">{{ booking.contact_phone }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">安装地址</div>
                <div class="info-value address">{{ booking.install_address }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">安装时间</div>
                <div class="info-value">{{ formatDateTime(booking.install_time) }}</div>
              </div>
              <div class="info-item" v-if="booking.remarks">
                <div class="info-label">备注</div>
                <div class="info-value">{{ booking.remarks }}</div>
              </div>
            </div>
          </div>
        </el-col>
        
        <el-col :span="12">
          <div class="card">
            <div class="card-header">
              <el-icon><ShoppingCart /></el-icon>
              <span>套餐信息</span>
            </div>
            <div class="card-body">
              <div class="info-item">
                <div class="info-label">套餐类型</div>
                <div class="info-value">{{ booking.package_type_text }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">套餐价格</div>
                <div class="info-value price">¥{{ booking.package_price }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">安装费用</div>
                <div class="info-value price">¥{{ booking.installation_fee }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">总金额</div>
                <div class="info-value price-total">¥{{ booking.total_amount }}</div>
              </div>
              
              <el-divider />
              
              <div class="info-item">
                <div class="info-label">支付状态</div>
                <div class="info-value">
                  <el-tag :type="getPaymentStatusType(booking.payment_status)" size="small">
                    {{ booking.payment_status_text }}
                  </el-tag>
                </div>
              </div>
              <div class="info-item" v-if="booking.payment_time">
                <div class="info-label">支付时间</div>
                <div class="info-value">{{ formatDateTime(booking.payment_time) }}</div>
              </div>
              <div class="info-item" v-if="booking.payment_method">
                <div class="info-label">支付方式</div>
                <div class="info-value">{{ getPaymentMethodText(booking.payment_method) }}</div>
              </div>
              <div class="info-item" v-if="booking.transaction_id">
                <div class="info-label">交易号</div>
                <div class="info-value">{{ booking.transaction_id }}</div>
              </div>
            </div>
          </div>
          
          <div class="card mt-20" v-if="booking.referrer_id">
            <div class="card-header">
              <el-icon><UserFilled /></el-icon>
              <span>推荐人信息</span>
            </div>
            <div class="card-body">
              <div class="user-info-section">
                <div class="user-avatar">
                  <el-avatar 
                    :size="48" 
                    :src="booking.referrer_avatar"
                    v-if="booking.referrer_avatar"
                  >
                  </el-avatar>
                  <el-avatar :size="48" icon="el-icon-user" v-else></el-avatar>
                </div>
                <div class="user-details">
                  <h4>{{ booking.referrer_display_name }}</h4>
                  <p>推荐人ID: {{ booking.referrer_id }}</p>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
      
      <div class="card mt-20">
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span>订单信息</span>
        </div>
        <div class="card-body">
          <div class="info-item">
            <div class="info-label">预约单号</div>
            <div class="info-value">{{ booking.booking_no }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">创建时间</div>
            <div class="info-value">{{ formatDateTime(booking.created_at) }}</div>
          </div>
          <div class="info-item" v-if="booking.status === 'assigned' || booking.status === 'completed'">
            <div class="info-label">安装工程师</div>
            <div class="info-value">
              <div class="user-info-simple">
                <el-avatar 
                  :size="24" 
                  :src="booking.engineer_avatar"
                  v-if="booking.engineer_avatar"
                >
                </el-avatar>
                <el-avatar :size="24" icon="el-icon-user" v-else></el-avatar>
                <span>{{ booking.engineer_display_name }}</span>
                <span class="engineer-phone" v-if="booking.engineer_phone">{{ booking.engineer_phone }}</span>
              </div>
            </div>
          </div>
          <div class="info-item" v-if="booking.status === 'completed' && booking.completion_time">
            <div class="info-label">完成时间</div>
            <div class="info-value">{{ formatDateTime(booking.completion_time) }}</div>
          </div>
          <div class="info-item" v-if="booking.status === 'cancelled' && booking.cancel_reason">
            <div class="info-label">取消原因</div>
            <div class="info-value">{{ booking.cancel_reason }}</div>
          </div>
          <div class="info-item" v-if="booking.status === 'completed' && booking.device_id">
            <div class="info-label">安装设备ID</div>
            <div class="info-value">{{ booking.device_id }}</div>
          </div>
          <div class="info-item" v-if="booking.status === 'completed' && booking.device_model">
            <div class="info-label">设备型号</div>
            <div class="info-value">{{ booking.device_model }}</div>
          </div>
          <div class="info-item" v-if="booking.status === 'completed' && booking.device_sn">
            <div class="info-label">设备序列号</div>
            <div class="info-value">{{ booking.device_sn }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="empty-state" v-if="!loading && !booking.id">
      <el-empty description="未找到预约记录" />
    </div>
    
    <!-- 状态更新对话框 -->
    <el-dialog
      v-model="statusDialog.visible"
      :title="statusDialog.title"
      width="500px"
    >
      <el-form :model="statusForm" label-width="100px">
        <el-form-item label="当前状态">
          <el-tag :type="getStatusType(booking.status)" v-if="booking.id">
            {{ booking.status_text }}
          </el-tag>
        </el-form-item>
        <el-form-item label="更新为">
          <el-select v-model="statusForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option
              v-for="option in getAvailableStatusOptions(booking.status)"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        
        <!-- 分配工程师 -->
        <el-form-item label="工程师" v-if="statusForm.status === 'assigned'">
          <el-select v-model="statusForm.engineer_id" placeholder="请选择工程师" style="width: 100%">
            <el-option
              v-for="engineer in engineers"
              :key="engineer.id"
              :label="engineer.display_name"
              :value="engineer.id"
            >
              <div class="engineer-option">
                <el-avatar 
                  :size="24" 
                  :src="engineer.wechat_avatar"
                  v-if="engineer.wechat_avatar"
                >
                </el-avatar>
                <el-avatar :size="24" icon="el-icon-user" v-else></el-avatar>
                <span>{{ engineer.display_name }}</span>
                <span class="engineer-phone" v-if="engineer.phone">{{ engineer.phone }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        
        <!-- 设备信息 -->
        <template v-if="statusForm.status === 'completed'">
          <el-form-item label="设备ID" v-if="statusForm.status === 'completed'">
            <el-input v-model="statusForm.device_id" placeholder="请输入设备ID"></el-input>
          </el-form-item>
          <el-form-item label="设备型号" v-if="statusForm.status === 'completed'">
            <el-input v-model="statusForm.device_model" placeholder="请输入设备型号"></el-input>
          </el-form-item>
          <el-form-item label="设备序列号" v-if="statusForm.status === 'completed'">
            <el-input v-model="statusForm.device_sn" placeholder="请输入设备序列号"></el-input>
          </el-form-item>
        </template>
        
        <!-- 取消原因 -->
        <el-form-item label="取消原因" v-if="statusForm.status === 'cancelled'">
          <el-input
            v-model="statusForm.cancel_reason"
            type="textarea"
            :rows="3"
            placeholder="请输入取消原因"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="statusDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitStatusUpdate" :loading="statusDialog.loading">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Avatar, 
  ShoppingCart, 
  UserFilled, 
  Document, 
  Clock, 
  CircleCheck, 
  Warning, 
  User, 
  OfficeBuilding
} from '@element-plus/icons-vue'
import {
  getInstallationBooking,
  updateBookingStatus /*, getEngineers */
} from '@/api/installationBooking' // 导入 API 函数
import {
  formatDateTime,
  getStatusType
} from '@/utils/formatters' // 假设有这些格式化工具

export default {
  name: 'BookingDetail',
  components: {
    Avatar,
    ShoppingCart,
    UserFilled,
    Document,
    Clock,
    CircleCheck,
    Warning,
    User,
    OfficeBuilding
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    // 状态选项
    const statusOptions = [
      { value: 'pending', label: '待处理', icon: 'Clock', step: 0 },
      { value: 'confirmed', label: '已确认', icon: 'Check', step: 1 },
      { value: 'assigned', label: '已分配工程师', icon: 'UserFilled', step: 2 },
      { value: 'completed', label: '已完成', icon: 'Finished', step: 3 },
      { value: 'cancelled', label: '已取消', icon: 'Close', step: -1 }
    ]
    
    // 数据加载状态
    const loading = ref(true)
    
    // 预约详情数据
    const booking = ref({})
    
    // 工程师列表
    const engineers = ref([])
    
    // 状态更新对话框
    const statusDialog = reactive({
      visible: false,
      title: '更新预约状态',
      loading: false
    })
    
    // 状态更新表单
    const statusForm = reactive({
      status: '',
      engineer_id: null,
      device_id: '',
      device_model: '',
      device_sn: '',
      cancel_reason: ''
    })
    
    // 获取预约ID
    const bookingId = computed(() => {
      return route.params.id
    })
    
    // 返回上一页
    const goBack = () => {
      if (route.path.startsWith('/branch/')) {
        const branchId = route.params.branchId
        router.push({
          path: `/branch/${branchId}/devices/installation`,
          query: { tab: 'booking' }
        })
      } else {
        router.push({ name: 'PurifierInstallation', query: { tab: 'booking' } })
      }
    }
    
    // 加载预约详情
    const fetchBookingDetail = async () => {
      if (!bookingId.value) {
        ElMessage.error('缺少预约ID')
        return
      }
      
      loading.value = true
      
      try {
        const response = await getInstallationBooking(bookingId.value)
        
        if (response.data) {
          booking.value = {
            ...response.data,
             // 预处理显示文本
             status_text: getStatusText(response.data.status),
             package_type_text: getPackageTypeText(response.data.package_type),
             payment_status_text: getPaymentStatusText(response.data.payment_status),
             user_display_name: response.data.user?.name || response.data.user?.nickname || response.data.contact_name,
             user_avatar: response.data.user?.avatar || null,
             user_phone: response.data.user?.phone || '-', // 假设用户模型有 phone 字段
             referrer_display_name: response.data.referrer?.name || response.data.referrer?.nickname || '-',
             referrer_avatar: response.data.referrer?.avatar || null,
             engineer_display_name: response.data.engineer?.name || response.data.engineer?.nickname || '-', // 假设工程师模型有关联
             engineer_avatar: response.data.engineer?.avatar || null,
             engineer_phone: response.data.engineer?.phone || '-' // 假设工程师模型有 phone 字段
          }
          
          // 保存工程师列表
          engineers.value = response.data.engineers
        } else {
          ElMessage.error('未找到预约记录')
          booking.value = {}
        }
      } catch (error) {
        console.error('获取预约详情失败:', error)
        ElMessage.error(error.message || '获取预约详情失败')
        booking.value = {}
      } finally {
        loading.value = false
      }
    }
    
    // 获取工程师列表 (如果需要)
    const fetchEngineers = async () => {
        try {
            // 假设 getEngineers API 函数存在
            // const response = await getEngineers({ /* params */ })
            // engineers.value = response.data || []
             engineers.value = [
               { id: 1, display_name: '工程师张三', phone: '13800138000', wechat_avatar: null },
               { id: 2, display_name: '工程师李四', phone: '13900139000', wechat_avatar: '...' }
             ];
        } catch (error) {
            console.error('获取工程师列表失败:', error)
        }
    }
    
    // 获取状态图标名称
    const getStatusIconName = (status) => {
        const option = statusOptions.find(opt => opt.value === status)
        return option ? option.icon : 'Warning' // 默认图标
    }
    
    // 获取状态步骤条的激活索引
    const getStatusStepActive = (status) => {
        const option = statusOptions.find(opt => opt.value === status)
        // 如果是取消状态，返回 -1 或其他特殊值，或者不显示步骤条
        if (status === 'cancelled') return -1; 
        return option ? option.step : 0
    }
    
    // 获取支付状态标签类型 (示例)
    const getPaymentStatusType = (status) => {
      const map = {
        'paid': 'success',
        'unpaid': 'warning',
        'failed': 'danger',
        'refunded': 'info'
      }
      return map[status] || 'info'
    }
    
     // 获取支付状态文本 (示例)
     const getPaymentStatusText = (status) => {
      const map = {
        'paid': '已支付',
        'unpaid': '未支付',
        'failed': '支付失败',
        'refunded': '已退款'
      }
      return map[status] || status
    }
    
    // 获取支付方式文本 (示例)
    const getPaymentMethodText = (method) => {
        const map = {
        'wechat': '微信支付',
            'alipay': '支付宝',
            'cash': '现金支付',
            'offline': '线下转账'
      }
        return map[method] || method
    }
    
    // 获取状态文本
    const getStatusText = (status) => {
      const option = statusOptions.find(opt => opt.value === status)
      return option ? option.label : status
    }
    
    // 获取套餐类型文本 (示例)
    const getPackageTypeText = (type) => {
      return type || '未知'
    }
    
    // 获取可用的状态选项
    const getAvailableStatusOptions = (currentStatus) => {
      // 与列表页逻辑保持一致或根据需要调整
      return statusOptions.filter(opt => opt.value !== currentStatus && opt.value !== 'cancelled'); // 简单示例
    }
    
    // 打开状态更新对话框
    const handleUpdateStatus = () => {
      // 重置表单，使用当前 booking 的值初始化
      statusForm.status = '' // 清空目标状态
      statusForm.engineer_id = booking.value.engineer_id || null
      statusForm.device_id = booking.value.device_id || ''
      statusForm.device_model = booking.value.device_model || ''
      statusForm.device_sn = booking.value.device_sn || ''
      statusForm.cancel_reason = booking.value.cancel_reason || ''
      
      statusDialog.visible = true
      statusDialog.loading = false

      // 获取工程师列表
      if (engineers.value.length === 0) {
        fetchEngineers()
      }
    }
    
    // 提交状态更新
    const submitStatusUpdate = async () => {
      if (!statusForm.status) {
        ElMessage.warning('请选择要更新的状态');
        return;
      }
       if (statusForm.status === 'assigned' && !statusForm.engineer_id) {
            ElMessage.warning('请选择工程师');
            return;
        }
        if (statusForm.status === 'cancelled' && !statusForm.cancel_reason) {
            ElMessage.warning('请输入取消原因');
            return;
        }

      statusDialog.loading = true;
      try {
        const updateData = {
          status: statusForm.status,
          ...(statusForm.status === 'assigned' && { engineer_id: statusForm.engineer_id }),
          ...(statusForm.status === 'completed' && {
              device_id: statusForm.device_id,
              device_model: statusForm.device_model,
              device_sn: statusForm.device_sn,
          }),
          ...(statusForm.status === 'cancelled' && { cancellation_reason: statusForm.cancel_reason }),
        };
        
        // 使用导入的 API 函数
        await updateBookingStatus(bookingId.value, updateData);
        
        ElMessage.success('状态更新成功');
        statusDialog.visible = false;
        // 更新成功后刷新详情
        fetchBookingDetail();
      } catch (error) {
        console.error('更新状态失败:', error);
        ElMessage.error(error.message || '更新状态失败');
      } finally {
        statusDialog.loading = false;
      }
    }
    
    // 页面加载时获取数据
    onMounted(() => {
      if (bookingId.value) {
        fetchBookingDetail()
      } else {
        ElMessage.error('无效的预约ID')
        goBack()
      }
    })
    
    return {
      loading,
      booking,
      statusOptions,
      engineers,
      statusDialog,
      statusForm,
      goBack,
      handleUpdateStatus,
      submitStatusUpdate,
      formatDateTime,
      getStatusIconName,
      getStatusStepActive,
      getPaymentStatusType,
      getPaymentMethodText,
      getAvailableStatusOptions,
      getStatusType
    }
  }
}
</script>

<style scoped>
.booking-detail-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.booking-detail-container {
  margin-top: 20px;
}

.card {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.card-header {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
}

.card-header .el-icon {
  margin-right: 8px;
  color: #409EFF;
}

.card-body {
  padding: 20px;
}

.status-card {
  position: relative;
}

.status-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px;
  border-radius: 4px 4px 0 0;
}

.status-pending {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.status-confirmed {
  background-color: #ecf5ff;
  color: #409eff;
}

.status-assigned {
  background-color: #f0f9eb;
  color: #67c23a;
}

.status-completed {
  background-color: #f0f9eb;
  color: #67c23a;
}

.status-cancelled {
  background-color: #f4f4f5;
  color: #909399;
}

.status-icon {
  margin-bottom: 10px;
}

.status-text {
  font-size: 18px;
  font-weight: bold;
}

.status-timeline {
  padding: 20px;
}

.action-buttons {
  padding: 0 20px 20px;
  display: flex;
  justify-content: center;
}

.info-row {
  margin-top: 20px;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
}

.info-label {
  flex: 0 0 100px;
  color: #606266;
}

.info-value {
  flex: 1;
  color: #303133;
}

.info-value.address,
.info-value.remarks {
  white-space: pre-wrap;
  word-break: break-all;
}

.info-value.price,
.info-value.price-total {
  color: #f56c6c;
  font-weight: bold;
}

.info-value.price-total {
  font-size: 18px;
}

.user-info-section {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.user-avatar {
  margin-right: 15px;
}

.user-details h3,
.user-details h4 {
  margin: 0 0 8px 0;
}

.user-details p {
  margin: 0 0 4px 0;
  color: #606266;
}

.user-info-simple {
  display: flex;
  align-items: center;
}

.user-info-simple span {
  margin-left: 8px;
}

.engineer-phone {
  color: #909399;
  margin-left: 10px;
}

.engineer-option {
  display: flex;
  align-items: center;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}

.mt-20 {
  margin-top: 20px;
}
</style> 
