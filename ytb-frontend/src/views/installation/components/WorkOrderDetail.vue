<template>
  <div class="work-order-detail">
    <!-- 状态流程 -->
    <div class="status-timeline">
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step title="下单" :description="order.created_at" />
        <el-step title="支付" :description="order.paid_at || '-'" />
        <el-step title="派单" :description="order.assigned_at || '-'" />
        <el-step title="接单" :description="order.accepted_at || '-'" />
        <el-step title="领取设备" :description="order.picked_at || '-'" />
        <el-step title="安装完成" :description="order.installed_at || '-'" />
      </el-steps>
    </div>

    <!-- 订单信息 -->
    <div class="info-section">
      <div class="section-title">
        <el-icon><Tickets /></el-icon>
        订单信息
      </div>
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="订单号">
          <span class="order-no">{{ order.order_no }}</span>
          <el-button size="small" link @click="copyOrderNo">
            <el-icon><CopyDocument /></el-icon>
          </el-button>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(order.status)">
            {{ order.status_text || getStatusText(order.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="安装费">
          <span class="price">¥{{ formatPrice(order.install_fee) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDateTime(order.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" v-if="order.remark">
          {{ order.remark }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 客户信息 -->
    <div class="info-section">
      <div class="section-title">
        <el-icon><User /></el-icon>
        客户信息
      </div>
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="联系人">
          {{ order.contact_name }}
        </el-descriptions-item>
        <el-descriptions-item label="联系电话">
          <div class="phone-row">
            <span>{{ order.contact_phone }}</span>
            <el-button size="small" link type="primary" @click="callPhone">
              <el-icon><Phone /></el-icon>
              拨打
            </el-button>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="安装地址">
          {{ order.full_address || formatAddress(order) }}
        </el-descriptions-item>
        <el-descriptions-item label="期望时间" v-if="order.preferred_date">
          {{ order.preferred_date }} {{ order.preferred_time }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 工程师信息 -->
    <div class="info-section" v-if="order.engineer || order.engineer_id">
      <div class="section-title">
        <el-icon><UserFilled /></el-icon>
        工程师信息
      </div>
      <div class="engineer-card" v-if="order.engineer">
        <el-avatar :size="48" :src="order.engineer.avatar">
          <el-icon><UserFilled /></el-icon>
        </el-avatar>
        <div class="engineer-info">
          <div class="name">{{ order.engineer.name || order.engineer.display_name }}</div>
          <div class="phone">{{ order.engineer.phone }}</div>
        </div>
      </div>
      <div v-else class="text-muted">
        工程师ID: {{ order.engineer_id }}
      </div>
    </div>

    <!-- 设备信息 -->
    <div class="info-section" v-if="order.board_code || order.device_id">
      <div class="section-title">
        <el-icon><Monitor /></el-icon>
        设备信息
      </div>
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="设备编码" v-if="order.board_code">
          <span class="device-code">{{ order.board_code }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="设备ID" v-if="order.device_id">
          {{ order.device_id }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 安装照片 -->
    <div class="info-section" v-if="installPhotos.length > 0">
      <div class="section-title">
        <el-icon><Picture /></el-icon>
        安装照片
      </div>
      <div class="photo-gallery">
        <el-image
          v-for="(photo, index) in installPhotos"
          :key="index"
          :src="photo"
          :preview-src-list="installPhotos"
          :initial-index="index"
          fit="cover"
          class="photo-item"
        />
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-bar" v-if="showActions">
      <el-button
        v-if="canAssign"
        type="primary"
        @click="$emit('assign', order)"
      >
        <el-icon><Pointer /></el-icon>
        派单
      </el-button>
      <el-button
        v-if="canCancel"
        type="danger"
        plain
        @click="handleCancel"
      >
        <el-icon><Close /></el-icon>
        取消订单
      </el-button>
      <el-button @click="$emit('refresh')">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Tickets, User, UserFilled, Phone, Monitor, Picture,
  CopyDocument, Pointer, Close, Refresh
} from '@element-plus/icons-vue';
import { waterEngineerApi } from '@/api/waterEngineerApi';

const props = defineProps({
  order: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['assign', 'refresh']);

// 当前步骤
const currentStep = computed(() => {
  const statusStepMap = {
    pending: 0,
    paid: 1,
    assigned: 2,
    accepted: 3,
    picked: 4,
    installing: 4,
    completed: 5,
    cancelled: -1
  };
  return statusStepMap[props.order.status] ?? 0;
});

// 安装照片
const installPhotos = computed(() => {
  if (!props.order.install_photos) return [];
  if (typeof props.order.install_photos === 'string') {
    try {
      return JSON.parse(props.order.install_photos);
    } catch {
      return [];
    }
  }
  return props.order.install_photos || [];
});

// 是否可派单
const canAssign = computed(() => {
  return ['paid', 'assigned'].includes(props.order.status);
});

// 是否可取消
const canCancel = computed(() => {
  return ['pending', 'paid'].includes(props.order.status);
});

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    pending: 'info',
    paid: 'warning',
    assigned: 'primary',
    accepted: '',
    picked: 'success',
    installing: 'success',
    completed: 'success',
    cancelled: 'danger'
  };
  return typeMap[status] || 'info';
};

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    pending: '待支付',
    paid: '待接单',
    assigned: '已派单',
    accepted: '待领取设备',
    picked: '待上门安装',
    installing: '安装中',
    completed: '已完成',
    cancelled: '已取消'
  };
  return textMap[status] || status;
};

// 格式化价格
const formatPrice = (price) => {
  return Number(price || 0).toFixed(2);
};

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '-';
  const date = new Date(dateTimeStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/\//g, '-');
};

// 格式化地址
const formatAddress = (row) => {
  return [row.province, row.city, row.district, row.address]
    .filter(Boolean)
    .join('');
};

// 复制订单号
const copyOrderNo = () => {
  navigator.clipboard.writeText(props.order.order_no).then(() => {
    ElMessage.success('已复制订单号');
  }).catch(() => {
    ElMessage.error('复制失败');
  });
};

// 拨打电话
const callPhone = () => {
  window.location.href = `tel:${props.order.contact_phone}`;
};

// 取消订单
const handleCancel = async () => {
  try {
    await ElMessageBox.prompt('请输入取消原因', '确认取消', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入取消原因',
      inputValidator: (value) => {
        if (!value) return '请输入取消原因';
        return true;
      }
    }).then(async ({ value }) => {
      const response = await waterEngineerApi.cancelOrder(props.order.order_no, value);
      if (response.code === 0) {
        ElMessage.success('已取消');
        emit('refresh');
      } else {
        ElMessage.error(response.message || '取消失败');
      }
    }).catch(() => {});
  } catch (error) {
    console.error('取消工单失败:', error);
  }
};
</script>

<style scoped>
.work-order-detail {
  padding: 0 16px 16px;
}

.status-timeline {
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 20px;
}

.status-timeline :deep(.el-step__description) {
  font-size: 11px;
}

.info-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.order-no {
  font-family: monospace;
  font-weight: 500;
  margin-right: 8px;
}

.price {
  font-weight: 600;
  color: #f56c6c;
  font-size: 16px;
}

.phone-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.engineer-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.engineer-info .name {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}

.engineer-info .phone {
  color: #909399;
  font-size: 14px;
}

.device-code {
  font-family: monospace;
  font-size: 14px;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.photo-gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.photo-item {
  width: 100%;
  height: 100px;
  border-radius: 8px;
  cursor: pointer;
}

.action-bar {
  display: flex;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.text-muted {
  color: #909399;
}
</style>
