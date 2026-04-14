<template>
  <div class="work-order-list">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item>
          <el-input
            v-model="filters.search"
            placeholder="订单号/联系人/电话"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="!filterStatus">
          <el-select v-model="filters.status" placeholder="状态" clearable style="width: 140px">
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 工单表格 -->
    <el-table
      v-loading="loading"
      :data="orderList"
      border
      stripe
      style="width: 100%"
      row-key="id"
      @row-click="handleRowClick"
    >
      <el-table-column prop="order_no" label="订单号" min-width="160" fixed="left">
        <template #default="{ row }">
          <div class="order-no-cell">
            <span class="order-no">{{ row.order_no }}</span>
            <el-tag v-if="row.is_urgent" type="danger" size="small">加急</el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="联系信息" min-width="180">
        <template #default="{ row }">
          <div class="contact-cell">
            <div class="contact-name">{{ row.contact_name }}</div>
            <div class="contact-phone">
              <el-icon><Phone /></el-icon>
              {{ row.contact_phone }}
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="安装地址" min-width="240" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.full_address || formatAddress(row) }}
        </template>
      </el-table-column>

      <el-table-column label="期望时间" min-width="160">
        <template #default="{ row }">
          <template v-if="row.preferred_date">
            <div>{{ row.preferred_date }}</div>
            <div class="sub-text">{{ row.preferred_time }}</div>
          </template>
          <span v-else class="text-muted">未指定</span>
        </template>
      </el-table-column>

      <el-table-column label="安装费" min-width="100" align="right">
        <template #default="{ row }">
          <span class="price">¥{{ formatPrice(row.install_fee) }}</span>
        </template>
      </el-table-column>

      <el-table-column label="工程师" min-width="140">
        <template #default="{ row }">
          <template v-if="row.engineer">
            <div class="engineer-cell">
              <el-avatar :size="24" :src="row.engineer.avatar">
                <el-icon><UserFilled /></el-icon>
              </el-avatar>
              <span>{{ row.engineer.name || row.engineer.display_name }}</span>
            </div>
          </template>
          <el-tag v-else type="info" size="small">待派单</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="状态" min-width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="default">
            {{ row.status_text || getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="创建时间" min-width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.created_at) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" fixed="right" min-width="180" align="center">
        <template #default="{ row }">
          <el-button 
            type="primary" 
            link 
            size="small" 
            @click.stop="$emit('view', row)"
          >
            详情
          </el-button>
          <el-button
            v-if="canAssign(row)"
            type="success"
            link
            size="small"
            @click.stop="$emit('assign', row)"
          >
            派单
          </el-button>
          <el-button
            v-if="canCancel(row)"
            type="danger"
            link
            size="small"
            @click.stop="handleCancel(row)"
          >
            取消
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[15, 30, 50, 100]"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Phone, UserFilled } from '@element-plus/icons-vue';
import { waterEngineerApi } from '@/api/waterEngineerApi';

const props = defineProps({
  filterStatus: {
    type: [String, Array, null],
    default: null
  },
  showUnassignedOnly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['view', 'assign']);

// 状态选项
const statusOptions = [
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '待接单' },
  { value: 'assigned', label: '已派单' },
  { value: 'accepted', label: '待领取设备' },
  { value: 'picked', label: '待上门安装' },
  { value: 'installing', label: '安装中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
];

// 数据加载状态
const loading = ref(false);

// 工单列表
const orderList = ref([]);

// 分页
const pagination = reactive({
  page: 1,
  limit: 15,
  total: 0
});

// 筛选条件
const filters = reactive({
  search: '',
  status: '',
  dateRange: null
});

// 获取工单列表
const fetchOrders = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: filters.search,
      start_date: filters.dateRange?.[0] || '',
      end_date: filters.dateRange?.[1] || ''
    };

    // 处理状态筛选
    if (props.filterStatus) {
      if (Array.isArray(props.filterStatus)) {
        params.status = props.filterStatus.join(',');
      } else {
        params.status = props.filterStatus;
      }
    } else if (filters.status) {
      params.status = filters.status;
    }

    // 处理未派单筛选
    if (props.showUnassignedOnly) {
      params.unassigned = true;
    }

    const response = await waterEngineerApi.getWorkOrders(params);
    
    if (response.code === 0) {
      orderList.value = response.data?.list || response.data || [];
      pagination.total = response.data?.total || response.meta?.total || orderList.value.length;
    } else {
      ElMessage.error(response.message || '获取工单列表失败');
    }
  } catch (error) {
    console.error('获取工单列表失败:', error);
    ElMessage.error('获取工单列表失败');
  } finally {
    loading.value = false;
  }
};

// 查询
const handleSearch = () => {
  pagination.page = 1;
  fetchOrders();
};

// 重置筛选
const resetFilters = () => {
  filters.search = '';
  filters.status = '';
  filters.dateRange = null;
  pagination.page = 1;
  fetchOrders();
};

// 分页大小变化
const handleSizeChange = (val) => {
  pagination.limit = val;
  fetchOrders();
};

// 页码变化
const handleCurrentChange = (val) => {
  pagination.page = val;
  fetchOrders();
};

// 行点击
const handleRowClick = (row) => {
  emit('view', row);
};

// 刷新
const refresh = () => {
  fetchOrders();
};

// 是否可派单
const canAssign = (order) => {
  return ['paid', 'assigned'].includes(order.status);
};

// 是否可取消
const canCancel = (order) => {
  return ['pending', 'paid'].includes(order.status);
};

// 取消工单
const handleCancel = async (order) => {
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
      const response = await waterEngineerApi.cancelOrder(order.order_no, value);
      if (response.code === 0) {
        ElMessage.success('已取消');
        fetchOrders();
      } else {
        ElMessage.error(response.message || '取消失败');
      }
    }).catch(() => {});
  } catch (error) {
    console.error('取消工单失败:', error);
  }
};

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
  const option = statusOptions.find(o => o.value === status);
  return option?.label || status;
};

// 格式化地址
const formatAddress = (row) => {
  return [row.province, row.city, row.district, row.address]
    .filter(Boolean)
    .join('');
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

// 暴露方法
defineExpose({
  refresh,
  fetchOrders
});

onMounted(() => {
  fetchOrders();
});
</script>

<style scoped>
.work-order-list {
  background: #fff;
}

.filter-bar {
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 16px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
}

.order-no-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-no {
  font-family: monospace;
  font-weight: 500;
}

.contact-cell {
  line-height: 1.6;
}

.contact-name {
  font-weight: 500;
}

.contact-phone {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 13px;
}

.sub-text {
  color: #909399;
  font-size: 12px;
}

.text-muted {
  color: #c0c4cc;
}

.price {
  font-weight: 600;
  color: #f56c6c;
}

.engineer-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background: #f5f7fa;
}
</style>
