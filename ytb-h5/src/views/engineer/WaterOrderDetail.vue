<template>
  <div class="water-order-detail">
    <!-- 头部导航 -->
    <NavBar title="工单详情" left-arrow @click-left="$router.go(-1)" />
    
    <div class="content" v-if="orderDetail">
      <!-- 工单基本信息 -->
      <div class="detail-card">
        <div class="card-header">
          <div class="order-title">{{ getOrderTypeText(orderDetail.type) }}</div>
          <div class="order-status" :class="getStatusClass(orderDetail.status)">
            {{ getStatusText(orderDetail.status) }}
          </div>
        </div>
        <div class="order-no">工单号：{{ orderDetail.work_order_no || `WO${orderDetail.id}` }}</div>
      </div>

      <!-- 客户信息 -->
      <div class="detail-card">
        <div class="card-title">
          <Icon name="contact" />
          客户信息
        </div>
        <div class="info-list">
          <div class="info-item" v-if="orderDetail.customer_name">
            <span class="label">客户姓名：</span>
            <span class="value">{{ orderDetail.customer_name }}</span>
          </div>
          <van-cell-group inset>
            <van-cell title="工单编号" :value="orderDetail.work_order_code || `WO${orderDetail.id}`" />
            <van-cell title="工单分类" :value="orderDetail.work_order_classification_name || '未知分类'" />
            <van-cell title="工单状态" :value="orderDetail.work_status_name || '未知状态'" />
            <van-cell title="派单类型" :value="orderDetail.work_status_type_name || '未知类型'" v-if="orderDetail.work_status_type_name" />
            <van-cell title="库类型" :value="orderDetail.storehouse_type_name || '未知库类型'" v-if="orderDetail.storehouse_type_name" />
            <van-cell title="创建时间" :value="formatDate(orderDetail.created_at)" />
            <van-cell title="更新时间" :value="formatDate(orderDetail.updated_at)" />
          </van-cell-group>

          <van-cell-group title="客户信息">
            <van-cell title="客户姓名" :value="orderDetail.client_name" />
            <van-cell title="联系电话" :value="orderDetail.client_phone" />
            <van-cell title="客户ID" :value="orderDetail.client_id || '无'" />
            <van-cell title="推荐人" :value="orderDetail.client_referrer || '无'" />
          </van-cell-group>

          <van-cell-group title="地址信息">
            <van-cell title="服务地址" :value="orderDetail.address" />
            <van-cell title="省份" :value="orderDetail.province" />
            <van-cell title="城市" :value="orderDetail.city" />
            <van-cell title="区域" :value="orderDetail.area" />
            <van-cell v-if="orderDetail.move_address" title="搬迁地址" :value="`${orderDetail.move_province || ''} ${orderDetail.move_city || ''} ${orderDetail.move_area || ''} ${orderDetail.move_address || ''}`" />
          </van-cell-group>

          <van-cell-group title="设备信息">
            <van-cell title="设备ID" :value="orderDetail.device_id || '无'" />
            <van-cell title="设备编号" :value="orderDetail.device_number || '无'" />
            <van-cell title="产品ID" :value="orderDetail.product_id || '无'" />
            <van-cell title="套餐ID" :value="orderDetail.set_meal_id || '无'" />
          </van-cell-group>

          <van-cell-group title="费用信息" v-if="orderDetail.pay_amount || orderDetail.cash_pledge">
            <van-cell title="支付金额" :value="orderDetail.pay_amount ? `¥${orderDetail.pay_amount}` : '无'" />
            <van-cell title="押金" :value="orderDetail.cash_pledge ? `¥${orderDetail.cash_pledge}` : '无'" />
          </van-cell-group>

          <van-cell-group inset v-if="orderDetail.logistics_company || orderDetail.logistics_number || orderDetail.ship_type || orderDetail.ship_status_name">
            <van-cell title="物流公司" :value="orderDetail.logistics_company || '暂无'" />
            <van-cell title="物流单号" :value="orderDetail.logistics_number || '暂无'" />
            <van-cell title="发货状态" :value="orderDetail.ship_status_name || '未发货'" />
            <van-cell title="发货类型" :value="getShipTypeText(orderDetail.ship_type)" v-if="orderDetail.ship_type" />
          </van-cell-group>

          <van-cell-group title="时间信息">
            <van-cell title="创建时间" :value="orderDetail.create_date" />
            <van-cell title="更新时间" :value="orderDetail.update_date || '无'" />
            <van-cell title="预约时间" :value="orderDetail.reservation_date || '无'" />
            <van-cell title="反馈时间" :value="orderDetail.feedback_date || '无'" />
          </van-cell-group>

          <van-cell-group title="反馈信息" v-if="orderDetail.feedback_content">
            <van-cell title="反馈状态" :value="orderDetail.feedback_status || '无'" />
            <van-cell title="反馈内容" :value="orderDetail.feedback_content" />
          </van-cell-group>

          <van-cell-group title="备注信息">
            <van-cell title="工单备注" :value="orderDetail.work_order_remark || '无'" />
            <van-cell title="其他备注" :value="orderDetail.remark || '无'" />
          </van-cell-group>

          <van-cell-group title="经销商信息" v-if="orderDetail.dealer_id">
            <van-cell title="经销商ID" :value="orderDetail.dealer_id || '无'" />
            <van-cell title="微信经销商ID" :value="orderDetail.dealer_id_wei || '无'" />
            <van-cell title="新经销商ID" :value="orderDetail.dealer_id_new || '无'" />
          </van-cell-group>

          <van-cell-group title="其他信息">
            <van-cell title="渠道" :value="orderDetail.channel || '无'" />
            <van-cell title="是否使用过" :value="orderDetail.have_used || '无'" />
            <van-cell title="仓库类型" :value="orderDetail.storehouse_type || '无'" />
            <van-cell title="创建人" :value="orderDetail.create_name || '无'" />
            <van-cell title="更新人" :value="orderDetail.update_name || '无'" />
          </van-cell-group>
        </div>
      </div>

      <!-- 设备信息 -->
      <div class="detail-card" v-if="orderDetail.device">
        <div class="card-title">
          <Icon name="setting-o" />
          设备信息
        </div>
        <div class="info-list">
          <div class="info-item" v-if="orderDetail.device.device_no">
            <span class="label">设备编号：</span>
            <span class="value">{{ orderDetail.device.device_no }}</span>
          </div>
          <div class="info-item" v-if="orderDetail.device.model">
            <span class="label">设备型号：</span>
            <span class="value">{{ orderDetail.device.model }}</span>
          </div>
          <div class="info-item" v-if="orderDetail.device.install_date">
            <span class="label">安装日期：</span>
            <span class="value">{{ formatTime(orderDetail.device.install_date) }}</span>
          </div>
        </div>
      </div>

      <!-- 工单详情 -->
      <div class="detail-card">
        <div class="card-title">
          <Icon name="orders-o" />
          工单详情
        </div>
        <div class="info-list">
          <div class="info-item">
            <span class="label">创建时间：</span>
            <span class="value">{{ formatTime(orderDetail.created_at) }}</span>
          </div>
          <div class="info-item" v-if="orderDetail.appointment_time">
            <span class="label">预约时间：</span>
            <span class="value">{{ formatTime(orderDetail.appointment_time) }}</span>
          </div>
          <div class="info-item" v-if="orderDetail.description">
            <span class="label">工单描述：</span>
            <span class="value">{{ orderDetail.description }}</span>
          </div>
          <div class="info-item" v-if="orderDetail.remark">
            <span class="label">备注信息：</span>
            <span class="value">{{ orderDetail.remark }}</span>
          </div>
        </div>
      </div>

      <!-- 工单属性 -->
      <div class="detail-card" v-if="orderDetail.attributes && orderDetail.attributes.length > 0">
        <div class="card-title">
          <Icon name="info-o" />
          工单属性
        </div>
        <div class="info-list">
          <div class="info-item" v-for="attr in orderDetail.attributes" :key="attr.id">
            <span class="label">{{ attr.attribute_name }}：</span>
            <span class="value">{{ attr.attribute_value }}</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons" v-if="orderDetail.status === '01'">
        <Button type="primary" size="large" @click="handleOrder">
          接单处理
        </Button>
      </div>
      <div class="action-buttons" v-else-if="orderDetail.status === '02'">
        <Button type="success" size="large" @click="completeOrder">
          完成工单
        </Button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else class="loading-container">
      <Loading type="spinner" />
      <div class="loading-text">加载中...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NavBar, Icon, Button, Loading, Toast } from 'vant'

const route = useRoute()
const router = useRouter()

const orderDetail = ref(null)
const loading = ref(true)

// 获取工单详情
const fetchOrderDetail = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('未找到登录token')
      router.push('/login')
      return
    }

    const orderId = route.params.id
    console.log('获取工单详情，ID:', orderId)
    
    const response = await fetch(`/api/mobile/v1/engineer/water-work-orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('工单详情响应:', result)
    
    if (result.code === 0 && result.data) {
      orderDetail.value = result.data
    } else {
      console.error('获取工单详情失败:', result.message)
    }
  } catch (error) {
    console.error('获取工单详情失败:', error)
  } finally {
    loading.value = false
  }
}

// 接单处理
const handleOrder = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/mobile/v1/engineer/water-work-orders/${orderDetail.value.id}/handle`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()
    
    if (result.code === 0) {
      console.log('接单成功')
      orderDetail.value.status = '02'
    } else {
      console.error('接单失败:', result.message)
    }
  } catch (error) {
    console.error('接单失败:', error)
  }
}

// 完成工单
const completeOrder = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/mobile/v1/engineer/water-work-orders/${orderDetail.value.id}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()
    
    if (result.code === 0) {
      console.log('工单完成')
      orderDetail.value.status = '03'
    } else {
      console.error('完成工单失败:', result.message)
    }
  } catch (error) {
    console.error('完成工单失败:', error)
  }
}

// 获取工单状态样式类
const getStatusClass = (status) => {
  switch (status) {
    case '01':
      return 'status-pending'
    case '02':
      return 'status-processing'
    case '03':
      return 'status-completed'
    case '04':
      return 'status-cancelled'
    default:
      return ''
  }
}

// 获取工单状态文本
const getStatusText = (status) => {
  switch (status) {
    case '01':
      return '待处理'
    case '02':
      return '处理中'
    case '03':
      return '已完成'
    case '04':
      return '已取消'
    default:
      return '未知'
  }
}

// 获取工单类型文本
const getOrderTypeText = (type) => {
  switch (type) {
    case '01':
      return '预约工单'
    case '02':
      return '维修工单'
    case '03':
      return '拆机工单'
    case '06':
      return '滤芯工单'
    case '09':
      return '安装工单'
    case '10':
      return '滤芯预警'
    default:
      return '净水器工单'
  }
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 获取发货类型文本
const getShipTypeText = (shipType) => {
  const typeMap = {
    '1': '厂家直发',
    '2': '经销商发货',
    '3': '仓库发货',
    '4': '门店自提'
  }
  return typeMap[shipType] || '未知类型'
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<style scoped>
.water-order-detail {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.content {
  padding: 56px 16px 16px; /* NavBar高度 + 内边距 */
}

.detail-card {
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.order-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.order-status {
  font-size: 14px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 12px;
}

.status-pending {
  color: #ff9800;
  background-color: #fff3e0;
}

.status-processing {
  color: #2196f3;
  background-color: #e3f2fd;
}

.status-completed {
  color: #4caf50;
  background-color: #e8f5e9;
}

.status-cancelled {
  color: #f44336;
  background-color: #ffebee;
}

.order-no {
  padding: 0 16px 16px;
  font-size: 14px;
  color: #999;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
}

.info-list {
  padding: 16px;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
  line-height: 1.5;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  flex-shrink: 0;
  width: 80px;
  color: #666;
  font-size: 14px;
}

.value {
  flex: 1;
  color: #333;
  font-size: 14px;
  word-break: break-all;
}

.phone-link {
  color: #1989fa;
  text-decoration: none;
}

.phone-link:hover {
  text-decoration: underline;
}

.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background-color: #fff;
  border-top: 1px solid #f0f0f0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
}

.loading-text {
  margin-top: 16px;
  color: #999;
  font-size: 14px;
}
</style>
