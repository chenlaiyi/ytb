<template>
  <div class="work-order-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-info">
        <h1>
          <el-icon><Tickets /></el-icon>
          工单管理
        </h1>
        <p class="description">净水器预约安装工单管理，支持派单与抢单功能</p>
      </div>
      <div class="header-stats">
        <div class="stat-card pending">
          <div class="stat-value">{{ stats.pendingPool }}</div>
          <div class="stat-label">待接单</div>
        </div>
        <div class="stat-card assigned">
          <div class="stat-value">{{ stats.assigned }}</div>
          <div class="stat-label">已派单</div>
        </div>
        <div class="stat-card accepted">
          <div class="stat-value">{{ stats.accepted }}</div>
          <div class="stat-label">待领取</div>
        </div>
        <div class="stat-card picked">
          <div class="stat-value">{{ stats.picked }}</div>
          <div class="stat-label">待安装</div>
        </div>
        <div class="stat-card completed">
          <div class="stat-value">{{ stats.completedToday }}</div>
          <div class="stat-label">今日完成</div>
        </div>
      </div>
    </div>

    <!-- Tab切换 -->
    <el-card shadow="never" class="main-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部工单" name="all">
          <WorkOrderList 
            ref="allOrdersRef"
            :filterStatus="null"
            @assign="handleAssign"
            @view="handleViewDetail"
          />
        </el-tab-pane>
        <el-tab-pane label="抢单大厅" name="grab">
          <div class="grab-hall">
            <div class="grab-header">
              <div class="grab-info">
                <el-icon><Notification /></el-icon>
                <span>公共池订单：工程师可在小程序端进行抢单</span>
              </div>
              <el-button type="primary" @click="refreshGrabOrders">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
            <WorkOrderList 
              ref="grabOrdersRef"
              :filterStatus="'paid'"
              :showUnassignedOnly="true"
              @assign="handleAssign"
              @view="handleViewDetail"
            />
          </div>
        </el-tab-pane>
        <el-tab-pane label="待派单" name="pending">
          <WorkOrderList 
            ref="pendingOrdersRef"
            :filterStatus="'paid'"
            @assign="handleAssign"
            @view="handleViewDetail"
          />
        </el-tab-pane>
        <el-tab-pane label="进行中" name="processing">
          <WorkOrderList 
            ref="processingOrdersRef"
            :filterStatus="['assigned', 'accepted', 'picked']"
            @assign="handleAssign"
            @view="handleViewDetail"
          />
        </el-tab-pane>
        <el-tab-pane label="已完成" name="completed">
          <WorkOrderList 
            ref="completedOrdersRef"
            :filterStatus="'completed'"
            @view="handleViewDetail"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 派单对话框 -->
    <el-dialog
      v-model="assignDialog.visible"
      title="派单给工程师"
      width="560px"
      :close-on-click-modal="false"
    >
      <div class="assign-dialog-content" v-if="assignDialog.order">
        <div class="order-info-card">
          <div class="info-header">
            <span class="order-no">{{ assignDialog.order.order_no }}</span>
            <el-tag :type="getStatusTagType(assignDialog.order.status)" size="small">
              {{ assignDialog.order.status_text }}
            </el-tag>
          </div>
          <div class="info-body">
            <div class="info-row">
              <el-icon><User /></el-icon>
              <span>{{ assignDialog.order.contact_name }}</span>
              <span class="phone">{{ assignDialog.order.contact_phone }}</span>
            </div>
            <div class="info-row">
              <el-icon><Location /></el-icon>
              <span>{{ assignDialog.order.full_address || assignDialog.order.address }}</span>
            </div>
            <div class="info-row" v-if="assignDialog.order.preferred_date">
              <el-icon><Calendar /></el-icon>
              <span>期望时间：{{ assignDialog.order.preferred_date }} {{ assignDialog.order.preferred_time }}</span>
            </div>
          </div>
        </div>

        <el-divider content-position="left">选择工程师</el-divider>

        <div class="engineer-search">
          <el-input
            v-model="engineerSearch"
            placeholder="搜索工程师姓名或手机号"
            clearable
            @input="filterEngineers"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="engineer-list" v-loading="loadingEngineers">
          <div
            v-for="engineer in filteredEngineers"
            :key="engineer.id"
            class="engineer-item"
            :class="{ 'selected': selectedEngineer?.id === engineer.id }"
            @click="selectEngineer(engineer)"
          >
            <el-avatar :size="40" :src="engineer.avatar || defaultAvatar">
              <el-icon><UserFilled /></el-icon>
            </el-avatar>
            <div class="engineer-info">
              <div class="name">{{ engineer.name || engineer.display_name }}</div>
              <div class="meta">
                <span class="phone">{{ engineer.phone }}</span>
                <span class="divider">|</span>
                <span class="orders">已完成 {{ engineer.completed_count || 0 }} 单</span>
              </div>
            </div>
            <div class="engineer-status">
              <el-tag :type="getEngineerStatusType(engineer)" size="small">
                {{ getEngineerStatusText(engineer) }}
              </el-tag>
            </div>
          </div>
          <el-empty v-if="filteredEngineers.length === 0 && !loadingEngineers" description="暂无可用工程师" />
        </div>
      </div>
      <template #footer>
        <el-button @click="assignDialog.visible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmAssign" 
          :loading="assignDialog.loading"
          :disabled="!selectedEngineer"
        >
          确认派单
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="detailDrawer.visible"
      title="工单详情"
      size="500px"
      direction="rtl"
    >
      <WorkOrderDetail 
        v-if="detailDrawer.order" 
        :order="detailDrawer.order"
        @refresh="refreshCurrentTab"
      />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Tickets, Notification, Refresh, User, Location, 
  Calendar, Search, UserFilled 
} from '@element-plus/icons-vue';
import WorkOrderList from './components/WorkOrderList.vue';
import WorkOrderDetail from './components/WorkOrderDetail.vue';
import { waterEngineerApi } from '@/api/waterEngineerApi';

const route = useRoute();
const router = useRouter();

// 默认头像
const defaultAvatar = 'https://img.itapgo.com/profile/default-engineer.png';

// 统计数据
const stats = reactive({
  pendingPool: 0,
  assigned: 0,
  accepted: 0,
  picked: 0,
  completedToday: 0
});

// Tab相关
const activeTab = ref(route.query.tab || 'all');

// 列表组件引用
const allOrdersRef = ref(null);
const grabOrdersRef = ref(null);
const pendingOrdersRef = ref(null);
const processingOrdersRef = ref(null);
const completedOrdersRef = ref(null);

// 派单对话框
const assignDialog = reactive({
  visible: false,
  loading: false,
  order: null
});

// 工程师相关
const loadingEngineers = ref(false);
const engineers = ref([]);
const engineerSearch = ref('');
const selectedEngineer = ref(null);

// 详情抽屉
const detailDrawer = reactive({
  visible: false,
  order: null
});

// 过滤后的工程师列表
const filteredEngineers = computed(() => {
  if (!engineerSearch.value) return engineers.value;
  const search = engineerSearch.value.toLowerCase();
  return engineers.value.filter(e => 
    (e.name || '').toLowerCase().includes(search) ||
    (e.phone || '').includes(search)
  );
});

// 加载统计数据
const loadStats = async () => {
  try {
    const response = await waterEngineerApi.getWorkOrderStats();
    if (response.code === 0 && response.data) {
      Object.assign(stats, response.data);
    }
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
};

// 加载工程师列表
const loadEngineers = async () => {
  loadingEngineers.value = true;
  try {
    const response = await waterEngineerApi.getEngineers();
    if (response.code === 0) {
      engineers.value = response.data || [];
    }
  } catch (error) {
    console.error('加载工程师列表失败:', error);
    ElMessage.error('加载工程师列表失败');
  } finally {
    loadingEngineers.value = false;
  }
};

// 处理Tab切换
const handleTabChange = (name) => {
  router.replace({
    query: { ...route.query, tab: name }
  });
};

// 刷新抢单大厅
const refreshGrabOrders = () => {
  grabOrdersRef.value?.refresh();
};

// 刷新当前Tab
const refreshCurrentTab = () => {
  const refMap = {
    all: allOrdersRef,
    grab: grabOrdersRef,
    pending: pendingOrdersRef,
    processing: processingOrdersRef,
    completed: completedOrdersRef
  };
  refMap[activeTab.value]?.value?.refresh();
  loadStats();
};

// 处理派单
const handleAssign = (order) => {
  assignDialog.order = order;
  selectedEngineer.value = null;
  engineerSearch.value = '';
  assignDialog.visible = true;
  if (engineers.value.length === 0) {
    loadEngineers();
  }
};

// 选择工程师
const selectEngineer = (engineer) => {
  selectedEngineer.value = engineer;
};

// 确认派单
const confirmAssign = async () => {
  if (!selectedEngineer.value || !assignDialog.order) return;

  try {
    assignDialog.loading = true;
    const response = await waterEngineerApi.assignOrder(
      assignDialog.order.order_no,
      selectedEngineer.value.id
    );
    
    if (response.code === 0) {
      ElMessage.success('派单成功');
      assignDialog.visible = false;
      refreshCurrentTab();
    } else {
      ElMessage.error(response.message || '派单失败');
    }
  } catch (error) {
    console.error('派单失败:', error);
    ElMessage.error('派单失败，请重试');
  } finally {
    assignDialog.loading = false;
  }
};

// 查看详情
const handleViewDetail = (order) => {
  detailDrawer.order = order;
  detailDrawer.visible = true;
};

// 获取状态标签类型
const getStatusTagType = (status) => {
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

// 获取工程师状态类型
const getEngineerStatusType = (engineer) => {
  if (engineer.is_busy) return 'warning';
  if (!engineer.is_active) return 'info';
  return 'success';
};

// 获取工程师状态文本
const getEngineerStatusText = (engineer) => {
  if (!engineer.is_active) return '休息中';
  if (engineer.is_busy) return '忙碌';
  return '空闲';
};

// 过滤工程师
const filterEngineers = () => {
  // 计算属性已处理
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.work-order-management {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-info h1 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.header-info .description {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.header-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 24px;
  min-width: 100px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-card .stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-card .stat-label {
  font-size: 13px;
  color: #909399;
}

.stat-card.pending .stat-value { color: #e6a23c; }
.stat-card.assigned .stat-value { color: #409eff; }
.stat-card.accepted .stat-value { color: #909399; }
.stat-card.picked .stat-value { color: #67c23a; }
.stat-card.completed .stat-value { color: #52c41a; }

.main-card {
  border-radius: 12px;
  border: none;
}

.main-card :deep(.el-card__body) {
  padding: 0;
}

.main-card :deep(.el-tabs__header) {
  padding: 0 20px;
  margin: 0;
  background: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}

.main-card :deep(.el-tabs__content) {
  padding: 20px;
}

/* 抢单大厅样式 */
.grab-hall {
  /* background: #fff; */
}

.grab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #f6f8fc 0%, #e8f4fd 100%);
  border-radius: 8px;
  margin-bottom: 16px;
}

.grab-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
  font-size: 14px;
}

/* 派单对话框样式 */
.assign-dialog-content {
  max-height: 60vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.order-info-card {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.order-no {
  font-weight: 600;
  color: #303133;
}

.info-body .info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

.info-body .info-row:last-child {
  margin-bottom: 0;
}

.info-body .phone {
  color: #909399;
}

.engineer-search {
  margin-bottom: 16px;
}

.engineer-list {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.engineer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #ebeef5;
}

.engineer-item:last-child {
  border-bottom: none;
}

.engineer-item:hover {
  background: #f5f7fa;
}

.engineer-item.selected {
  background: #ecf5ff;
  border-color: #409eff;
}

.engineer-info {
  flex: 1;
}

.engineer-info .name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.engineer-info .meta {
  font-size: 12px;
  color: #909399;
}

.engineer-info .meta .divider {
  margin: 0 8px;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }
  
  .header-stats {
    width: 100%;
    justify-content: space-between;
  }
  
  .stat-card {
    flex: 1;
    min-width: auto;
    padding: 12px 8px;
  }
  
  .stat-card .stat-value {
    font-size: 20px;
  }
}
</style>
