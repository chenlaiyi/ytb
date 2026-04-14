<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-title">
        <h2>业务员管理</h2>
        <p class="page-description">管理和查看所有业务员信息</p>
      </div>
      <div class="page-actions">
        <el-button type="primary" size="large" @click="redirectToCreate">
          <el-icon><Plus /></el-icon>
          新增业务员
        </el-button>
        <el-button type="success" size="large" @click="handleSyncAppUsers">
          <el-icon><Refresh /></el-icon>
          同步APP用户
        </el-button>
      </div>
    </div>

    <!-- 业务员模块导航标签页 -->
    <el-card class="navigation-card" shadow="never">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="salesman-tabs">
        <el-tab-pane label="业务员列表" name="list">
          <template #label>
            <span class="tab-label">
              <el-icon><User /></el-icon>
              业务员列表
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="数据统计" name="statistics">
          <template #label>
            <span class="tab-label">
              <el-icon><DataAnalysis /></el-icon>
              数据统计
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="绩效管理" name="performance">
          <template #label>
            <span class="tab-label">
              <el-icon><TrendCharts /></el-icon>
              绩效管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="培训管理" name="training">
          <template #label>
            <span class="tab-label">
              <el-icon><Reading /></el-icon>
              培训管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="团队管理" name="team">
          <template #label>
            <span class="tab-label">
              <el-icon><UserFilled /></el-icon>
              团队管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="薪酬管理" name="salary">
          <template #label>
            <span class="tab-label">
              <el-icon><Money /></el-icon>
              薪酬管理
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 筛选卡片 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-header">
        <el-icon><Search /></el-icon>
        <span>筛选条件</span>
      </div>
      <el-form :inline="true" class="filter-form" :model="listQuery">
        <el-form-item label="搜索">
          <el-input
            v-model="listQuery.search"
            placeholder="输入姓名、手机号或员工编号"
            clearable
            prefix-icon="Search"
            style="width: 280px"
            @keyup.enter="handleFilter"
            @clear="handleFilter"
          />
        </el-form-item>
        <el-form-item label="分支机构">
          <el-select 
            v-model="listQuery.branch_id" 
            placeholder="选择分支机构" 
            clearable
            style="width: 180px"
            @change="handleFilter"
          >
            <el-option label="全部分支机构" value="all" />
            <el-option 
              v-for="branch in branchOptions" 
              :key="branch.id" 
              :label="branch.name" 
              :value="branch.id"
            >
              <el-tag 
                :type="branch.id === 3 ? 'primary' : 'warning'" 
                size="small"
              >
                {{ branch.name }}
              </el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select 
            v-model="listQuery.status" 
            placeholder="选择状态" 
            clearable
            style="width: 150px"
            @change="handleFilter"
          >
            <el-option label="全部状态" value="" />
            <el-option label="在职" value="active">
              <el-tag type="success" size="small">在职</el-tag>
            </el-option>
            <el-option label="离职" value="leave">
              <el-tag type="danger" size="small">离职</el-tag>
            </el-option>
            <el-option label="暂停" value="suspend">
              <el-tag type="warning" size="small">暂停</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据统计卡片 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card" shadow="hover">
            <div class="stats-item">
              <div class="stats-icon stats-icon-primary">
                <el-icon><User /></el-icon>
              </div>
              <div class="stats-content">
                <div class="stats-number">{{ total }}</div>
                <div class="stats-label">总业务员</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card" shadow="hover">
            <div class="stats-item">
              <div class="stats-icon stats-icon-success">
                <el-icon><ShoppingCart /></el-icon>
              </div>
              <div class="stats-content">
                <div class="stats-number">{{ getTotalSales() }}</div>
                <div class="stats-label">销售总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card" shadow="hover">
            <div class="stats-item">
              <div class="stats-icon stats-icon-warning">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stats-content">
                <div class="stats-number">￥{{ formatCommission(getTotalCommission()) }}</div>
                <div class="stats-label">提成总额</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card" shadow="hover">
            <div class="stats-item">
              <div class="stats-icon stats-icon-danger">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stats-content">
                <div class="stats-number">{{ getMonthlyActivations() }}</div>
                <div class="stats-label">本月激活总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="6">
          <el-card class="stats-card" shadow="hover">
            <div class="stats-item">
              <div class="stats-icon stats-icon-info">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stats-content">
                <div class="stats-number">￥{{ formatCommission(getMonthlyCommission()) }}</div>
                <div class="stats-label">本月提成总额</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card" shadow="hover">
            <div class="stats-item">
              <div class="stats-icon stats-icon-success">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stats-content">
                <div class="stats-number">{{ getMonthlySales() }}</div>
                <div class="stats-label">本月销售总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据表格卡片 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <div class="table-title">
            <el-icon><List /></el-icon>
            <span>业务员列表</span>
            <el-tag v-if="total > 0" type="info" size="small">{{ total }}条记录</el-tag>
          </div>
          <div class="table-actions">
            <el-tooltip content="刷新数据" placement="top">
              <el-button circle @click="getList">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </template>

      <el-table
        v-loading="listLoading"
        :data="list"
        element-loading-text="正在加载业务员数据..."
        element-loading-spinner="el-icon-loading"
        border
        stripe
        highlight-current-row
        style="width: 100%"
        :header-cell-style="{ background: '#f8f9fa', color: '#606266' }"
      >
        <el-table-column
          align="center"
          label="ID"
          width="80"
          prop="id"
        />

        <el-table-column
          align="center"
          label="员工编号"
          width="120"
          prop="employee_id"
        >
          <template #default="scope">
            <el-tag type="info" size="small">{{ scope.row.employee_id }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="基本信息"
          min-width="200"
        >
          <template #default="scope">
            <div class="user-info">
              <div class="user-avatar">
                <el-avatar 
                  :size="40" 
                  :src="getAvatarUrl(scope.row)" 
                  :icon="UserFilled"
                  @error="handleAvatarError"
                >
                  {{ getAvatarFallback(scope.row) }}
                </el-avatar>
              </div>
              <div class="user-details">
                <div class="user-name">{{ scope.row.user?.name || scope.row.user?.wechat_nickname || '未知' }}</div>
                <div class="user-phone">
                  <el-icon><Phone /></el-icon>
                  {{ scope.row.user?.phone || '未知' }}
                </div>
                <div v-if="scope.row.user?.wechat_nickname" class="user-wechat">
                  <el-icon><ChatDotRound /></el-icon>
                  {{ scope.row.user?.wechat_nickname }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          align="center"
          label="分支机构"
          min-width="120"
        >
          <template #default="scope">
            <div class="branch-info">
              <el-tag 
                :type="getBranchTagType(scope.row.user?.branch_id)" 
                size="small"
                effect="dark"
              >
                {{ getBranchName(scope.row.user?.branch) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          align="center"
          label="销售信息"
          min-width="180"
        >
          <template #default="scope">
            <div class="sales-info">
              <div class="sales-item">
                <span class="sales-label">销售设备：</span>
                <el-tag type="success" size="small">{{ scope.row.sales_devices || 0 }}台</el-tag>
              </div>
              <div class="sales-item">
                <span class="sales-label">自用设备：</span>
                <el-tag type="warning" size="small">{{ scope.row.self_use_devices || 0 }}台</el-tag>
              </div>
              <div class="sales-item">
                <span class="sales-label">取水点：</span>
                <el-tag type="primary" size="small">{{ scope.row.water_points || 0 }}台</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          align="center"
          label="提成总计"
          width="120"
        >
          <template #default="scope">
            <div class="commission-info">
              <el-tag
                type="danger"
                effect="dark"
                size="small"
              >
                ￥{{ formatCommission(scope.row.total_commission) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          align="center"
          label="创建时间"
          width="160"
          prop="created_at"
        >
          <template #default="scope">
            <div class="time-info">
              <div class="time-date">{{ formatDate(scope.row.created_at) }}</div>
              <div class="time-relative">{{ getRelativeTime(scope.row.created_at) }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          fixed="right"
          align="center"
          label="操作"
          width="200"
        >
          <template #default="scope">
            <div class="action-buttons">
              <el-tooltip content="查看详情" placement="top">
                <el-button
                  type="primary"
                  size="small"
                  circle
                  @click="viewDetail(scope.row.id)"
                >
                  <el-icon><View /></el-icon>
                </el-button>
              </el-tooltip>
              
              <el-tooltip content="编辑信息" placement="top">
                <el-button
                  type="warning"
                  size="small"
                  circle
                  @click="editItem(scope.row.id)"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              
              <el-popconfirm
                title="确定要删除此业务员吗？"
                confirm-button-text="确定"
                cancel-button-text="取消"
                @confirm="deleteItem(scope.row.id)"
              >
                <template #reference>
                  <el-tooltip content="删除" placement="top">
                    <el-button
                      type="danger"
                      size="small"
                      circle
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </el-tooltip>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="!listLoading && list.length === 0" class="empty-state">
        <el-empty description="暂无业务员数据">
          <el-button type="primary" @click="redirectToCreate">
            <el-icon><Plus /></el-icon>
            新增业务员
          </el-button>
        </el-empty>
      </div>

      <!-- 分页 -->
      <div v-if="total > 0" class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-size="listQuery.per_page"
          :current-page="listQuery.page"
          :page-sizes="[10, 15, 30, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 同步进度对话框 -->
    <el-dialog
      title="同步APP用户到业务员"
      v-model="syncDialogVisible"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      center
    >
      <div class="sync-content">
        <div class="sync-icon">
          <el-icon v-if="!syncing" size="48" color="#409EFF"><Refresh /></el-icon>
          <el-icon v-else size="48" color="#67C23A" class="rotating"><Loading /></el-icon>
        </div>
        <div class="sync-description">
          <p>此操作将把APP用户中标记为业务员的用户同步到业务员管理系统中。</p>
          <p class="sync-warning">
            <el-icon><Warning /></el-icon>
            请确保数据准确性后再执行同步操作。
          </p>
        </div>
        
        <div v-if="syncing" class="sync-progress-container">
          <div class="sync-status">{{ syncStatus }}</div>
          <el-progress 
            :percentage="syncProgress" 
            :format="syncProgressFormat"
            :stroke-width="8"
            status="success"
          />
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="syncDialogVisible = false" :disabled="syncing">取消</el-button>
          <el-button 
            type="primary" 
            @click="executeSyncAppUsers" 
            :loading="syncing"
            :disabled="syncing"
          >
            {{ syncing ? '同步中...' : '开始同步' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus';
import { 
  Plus, Refresh, Search, RefreshLeft, User, CircleCheck, Warning, CircleClose,
  List, View, Edit, Delete, Phone, UserFilled, Loading, DataAnalysis, TrendCharts, Reading, Money, ChatDotRound, ShoppingCart
} from '@element-plus/icons-vue';
import { getSalesmenList, deleteSalesman } from '@/api/salesman';
import { syncAppUsersToSalesmen } from '@/api/v1/salesmanSync';
import { getAdminToken } from '@/utils/admin-token-bridge'
// 移除复杂的token验证，简化处理

export default {
  name: 'SalesmenList',

  setup() {
    const router = useRouter();
    const list = ref([]);
    const total = ref(0);
    const listLoading = ref(true);

    const listQuery = reactive({
      page: 1,
      per_page: 15,
      search: '',
      status: '',
      branch_id: 3  // 默认显示分支机构3（点点够）
    });

    // 同步相关状态
    const syncDialogVisible = ref(false);
    const syncing = ref(false);
    const syncProgress = ref(0);
    const syncStatus = ref('');

    // 业务员模块导航标签页
    const activeTab = ref('list');
    
    // 分支机构选项
    const branchOptions = ref([
      { id: 1, name: '益辛友厦门' },
      { id: 2, name: '益辛友重庆' },
      { id: 3, name: '点点够' }
    ]);

    // 全局统计数据
    const monthlyActivations = ref(0);
    const monthlySales = ref(0);
    const totalSales = ref(0);
    const totalCommission = ref(0);
    const monthlyCommission = ref(0);

    // 获取业务员列表
    const getList = async () => {
      try {
        listLoading.value = true;
        
        // 简化token检查
        const token = getAdminToken();
        if (!token) {
          console.warn('业务员列表: 没有token，跳转登录页');
          this.$router.push('/login');
          return;
        }
        console.log('业务员列表: token存在，开始获取数据');

        // 添加时间戳避免缓存
        const params = {
          ...listQuery,
          _t: new Date().getTime()
        };

        console.log('业务员列表: 准备调用API', {
          url: '/api/admin/v1/salesmen',
          params,
          timestamp: new Date().toISOString()
        });

        // 设置请求超时时间
        const requestStartTime = Date.now();

        const response = await getSalesmenList(params);
        

        // 确保响应有数据
        if (response && response.data) {
          list.value = response.data;
          total.value = response.total;
          // 更新全局统计数据
          monthlyActivations.value = response.monthly_activations || 0;
          monthlySales.value = response.monthly_sales || 0;
          totalSales.value = response.total_sales || 0;
          totalCommission.value = response.total_commission || 0;
          monthlyCommission.value = response.monthly_commission || 0;

        } else {
          console.error('业务员列表数据格式不正确', response);
          list.value = [];
          total.value = 0;
          monthlyActivations.value = 0;
          monthlySales.value = 0;
          totalSales.value = 0;
          totalCommission.value = 0;
          monthlyCommission.value = 0;
          ElMessage.warning('获取业务员列表返回的数据格式不正确');
        }

        listLoading.value = false;
      } catch (error) {
        console.error('获取业务员列表失败', error);
        console.error('详细错误信息:', error.response || error.message || error);

        // 检查错误类型
        let errorMsg = '获取业务员列表失败: ';

        if (error.response) {
          console.error('HTTP错误状态码:', error.response.status);

          // 针对不同的HTTP状态码显示不同的错误消息
          if (error.response.status === 401) {
            errorMsg += '会话已过期，请重新登录';
            // 401错误由request.js统一处理，这里只显示错误信息
          } else if (error.response.status === 403) {
            errorMsg += '您没有权限访问业务员管理模块';
          } else if (error.response.status === 404) {
            errorMsg += 'API接口不存在，请联系管理员';
          } else if (error.response.status >= 500) {
            errorMsg += '服务器内部错误，请稍后再试';
          } else {
            errorMsg += error.response.data?.message || error.message || '未知错误';
          }
        } else if (error.request) {
          // 请求已经发出，但没有收到响应
          errorMsg += '服务器无响应，请检查网络连接';
        } else {
          // 请求配置出错
          errorMsg += error.message || '未知错误';
        }

        ElMessage.error(errorMsg);

        listLoading.value = false;
        list.value = [];
        total.value = 0;
      }
    };

    // 跳转到创建页面
    const redirectToCreate = () => {
      router.push({ name: 'SalesmenCreate' });
    };

    // 查看详情
    const viewDetail = (id) => {
      router.push({ name: 'SalesmenDetail', params: { id } });
    };

    // 编辑
    const editItem = (id) => {
      router.push({ name: 'SalesmenEdit', params: { id } });
    };

    // 删除
    const deleteItem = async (id) => {
      try {
        await deleteSalesman(id);
        ElMessage.success('删除成功');
        getList();
      } catch (error) {
        console.error('删除失败', error);
        ElMessage.error('删除失败: ' + (error.message || '未知错误'));
      }
    };

    // 筛选
    const handleFilter = () => {
      listQuery.page = 1;
      getList();
    };

    // 重置筛选条件
    const resetFilter = () => {
      listQuery.search = '';
      listQuery.status = '';
      listQuery.branch_id = 3; // 重置时默认选择分支机构3
      listQuery.page = 1;
      getList();
    };
    
    // 获取分支机构名称
    const getBranchName = (branch) => {
      if (branch && branch.name) {
        return branch.name;
      }
      // 如果没有关联的分支机构对象，根据ID查找
      if (branch && branch.id) {
        const branchOption = branchOptions.value.find(b => b.id === branch.id);
        return branchOption ? branchOption.name : '未知分支';
      }
      return '未分配';
    };
    
    // 获取分支机构标签类型
    const getBranchTagType = (branchId) => {
      if (branchId === 3) {
        return 'primary'; // 点点够使用蓝色
      } else if (branchId === 1 || branchId === 2) {
        return 'warning'; // 其他分支使用橙色
      }
      return 'info'; // 未分配使用灰色
    };
    
    // 格式化提成金额
    const formatCommission = (amount) => {
      if (!amount || amount === 0) {
        return '0.00';
      }
      return parseFloat(amount).toFixed(2);
    };

    // 改变每页显示数量
    const handleSizeChange = (size) => {
      listQuery.per_page = size;
      getList();
    };

    // 改变页码
    const handleCurrentChange = (page) => {
      listQuery.page = page;
      getList();
    };

    // 获取状态类型
    const getStatusType = (status) => {
      switch (status) {
        case 'active':
          return 'success';
        case 'leave':
          return 'danger';
        case 'suspend':
          return 'warning';
        default:
          return 'info';
      }
    };

    // 获取状态文本
    const getStatusText = (status) => {
      switch (status) {
        case 'active':
          return '在职';
        case 'leave':
          return '离职';
        case 'suspend':
          return '暂停';
        default:
          return '未知';
      }
    };

    // 格式化日期
    const formatDate = (date) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('zh-CN');
    };

    // 获取相对时间
    const getRelativeTime = (date) => {
      if (!date) return '';
      const now = new Date();
      const target = new Date(date);
      const diff = now - target;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) return '今天';
      if (days === 1) return '昨天';
      if (days < 7) return `${days}天前`;
      if (days < 30) return `${Math.floor(days / 7)}周前`;
      if (days < 365) return `${Math.floor(days / 30)}个月前`;
      return `${Math.floor(days / 365)}年前`;
    };

    // 获取全局销售总数（从后端获取）
    const getTotalSales = () => {
      return totalSales.value;
    };

    // 获取全局提成总额（从后端获取）
    const getTotalCommission = () => {
      return totalCommission.value;
    };

    // 获取本月激活总数（从后端获取）
    const getMonthlyActivations = () => {
      return monthlyActivations.value;
    };

    // 获取本月销售总数（从后端获取）
    const getMonthlySales = () => {
      return monthlySales.value;
    };

    // 获取本月提成总额（从后端获取）
    const getMonthlyCommission = () => {
      return monthlyCommission.value;
    };

    // 处理同步APP用户到业务员
    const handleSyncAppUsers = () => {
      syncDialogVisible.value = true;
      syncProgress.value = 0;
      syncStatus.value = '准备同步...';
      syncing.value = false;
    };

    // 执行同步操作
    const executeSyncAppUsers = () => {
      ElMessageBox.confirm(
        '确定要将APP用户同步到业务员吗？这个操作会将所有APP用户中is_sales=1的用户同步为业务员。',
        '确认同步',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        syncing.value = true;
        syncProgress.value = 0;
        syncStatus.value = '正在同步...';

        // 开始更新进度
        let progress = 0;
        const timer = setInterval(() => {
          // 模拟进度更新，实际上后端任务可能已经完成
          if (progress < 90) {
            progress += Math.floor(Math.random() * 5) + 1;
            syncProgress.value = progress;
          }
        }, 800);

        // 调用API执行同步
        syncAppUsersToSalesmen({
          force: true // 可选参数，强制重新同步
        }).then(response => {
          if (response.code === 200) {
            // 显示完成状态
            clearInterval(timer);
            syncProgress.value = 100;
            syncStatus.value = '同步完成！';

            ElNotification({
              title: '同步成功',
              message: '已成功将APP用户同步到业务员表。请刷新页面查看最新数据。',
              type: 'success',
              duration: 5000
            });

            // 5秒后自动关闭对话框
            setTimeout(() => {
              syncDialogVisible.value = false;
              syncing.value = false;
              // 刷新业务员列表
              getList();
            }, 2000);
          } else {
            throw new Error(response.message || '同步失败');
          }
        }).catch(error => {
          clearInterval(timer);
          syncProgress.value = 100;
          syncStatus.value = `同步失败: ${error.message || '未知错误'}`;
          syncing.value = false;

          ElMessage.error('同步失败: ' + (error.message || '未知错误'));
        });
      }).catch(() => {
        // 用户取消同步
      });
    };

    // 格式化同步进度百分比
    const syncProgressFormat = (percentage) => {
      return percentage + '%';
    };

    // 处理业务员模块导航标签页点击
    const handleTabClick = (tab) => {
      const tabName = tab.props.name;

      
      // 根据标签页名称跳转到对应的路由
      switch (tabName) {
        case 'list':
          // 当前页面，不需要跳转
          break;
        case 'statistics':
          router.push('/users/salesmen/statistics');
          break;
        case 'performance':
          router.push('/users/salesmen/performance');
          break;
        case 'training':
          router.push('/users/salesmen/training');
          break;
        case 'team':
          router.push('/users/salesmen/team');
          break;
        case 'salary':
          router.push('/users/salesmen/salary');
          break;
        default:
          console.warn('未知的标签页:', tabName);
      }
    };

    // 处理头像加载失败
    const handleAvatarError = () => {
    };

    // 获取头像回退文本
    const getAvatarFallback = (row) => {
      if (row.user?.name) {
        return row.user.name.charAt(0);
      } else if (row.user?.wechat_nickname) {
        return row.user.wechat_nickname.charAt(0);
      } else {
        return '?';
      }
    };

    // 获取头像URL
    const getAvatarUrl = (row) => {
      if (row.user?.wechat_avatar) {
        // 如果是完整的URL，直接返回
        if (row.user.wechat_avatar.startsWith('http://') || row.user.wechat_avatar.startsWith('https://')) {
          return row.user.wechat_avatar;
        }
        // 如果是相对路径，添加基础URL
        return `${window.location.origin}${row.user.wechat_avatar}`;
      }
      // 如果没有微信头像，返回null，让el-avatar显示fallback
      return null;
    };

    onMounted(async () => {
      // 诊断当前认证状态
      console.log('业务员列表页面: 组件挂载，开始诊断认证状态');
              // 简化认证状态检查
        const token = getAdminToken();
        const user = localStorage.getItem('user');
        const admin = localStorage.getItem('admin');
      
      if (!token) {
        console.warn('业务员列表页面: 未找到token，跳转登录页');
        const baseUrl = '/admin';
        const redirectUrl = baseUrl + '/#/login?redirect=' + encodeURIComponent(window.location.pathname);
        window.location.href = redirectUrl;
        return;
      }
      
      console.log('业务员列表页面: 认证状态诊断完成，开始获取数据');
      await getList();
    });

    return {
      list,
      total,
      listLoading,
      listQuery,
      branchOptions,
      redirectToCreate,
      viewDetail,
      editItem,
      deleteItem,
      handleFilter,
      resetFilter,
      handleSizeChange,
      handleCurrentChange,
      getStatusType,
      getStatusText,
      formatDate,
      getRelativeTime,
      getTotalSales,
      getTotalCommission,
      getMonthlyActivations,
      getMonthlySales,
      getMonthlyCommission,
      getBranchName,
      getBranchTagType,
      formatCommission,
      syncDialogVisible,
      syncing,
      syncProgress,
      syncStatus,
      handleSyncAppUsers,
      executeSyncAppUsers,
      syncProgressFormat,
      // Icons
      Plus, Refresh, Search, RefreshLeft, User, CircleCheck, Warning, CircleClose,
      List, View, Edit, Delete, Phone, UserFilled, Loading, DataAnalysis, TrendCharts, Reading, Money, ShoppingCart,
      activeTab,
      handleTabClick,
      handleAvatarError,
      getAvatarFallback,
      getAvatarUrl
    };
  }
};
</script>

<style scoped>
.app-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.page-title h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.page-description {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.page-actions {
  display: flex;
  gap: 12px;
}

/* 业务员模块导航标签页 */
.navigation-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: none;
}

.salesman-tabs {
  width: 100%;
}

.salesman-tabs .el-tabs__header {
  margin: 0;
}

.salesman-tabs .el-tabs__nav-wrap {
  padding: 0;
}

.salesman-tabs .el-tabs__nav {
  display: flex;
  width: 100%;
}

.salesman-tabs .el-tabs__item {
  flex: 1;
  text-align: center;
  padding: 0 20px;
  height: 50px;
  line-height: 50px;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.salesman-tabs .el-tabs__item:hover {
  color: #409eff;
}

.salesman-tabs .el-tabs__item.is-active {
  color: #409eff;
  border-bottom-color: #409eff;
}

.salesman-tabs .el-tab-pane .tab-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
}

.salesman-tabs .el-tab-pane .tab-label .el-icon {
  font-size: 16px;
}

/* 筛选卡片 */
.filter-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: none;
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-weight: 600;
  color: #374151;
}

.filter-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-form .el-form-item {
  margin-bottom: 0;
}

/* 数据统计卡片 */
.stats-container {
  margin-bottom: 20px;
}

.stats-card {
  border-radius: 12px;
  border: none;
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stats-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stats-icon-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stats-icon-success {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stats-icon-warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stats-icon-danger {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  color: #e53e3e;
}

.stats-icon-info {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #3182ce;
}

.stats-content {
  flex: 1;
}

.stats-number {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stats-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

/* 表格卡片 */
.table-card {
  border-radius: 12px;
  border: none;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #374151;
}

.table-title .el-tag {
  margin-left: 8px;
}

.table-actions {
  display: flex;
  gap: 8px;
}

/* 表格内容样式 */
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details {
  flex: 1;
  text-align: left;
}

.user-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.user-phone {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.user-wechat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #10b981;
  margin-top: 2px;
}

.job-info {
  text-align: center;
}

.job-title {
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.job-department {
  margin-top: 4px;
}

.time-info {
  text-align: center;
}

.time-date {
  font-size: 13px;
  color: #374151;
  margin-bottom: 2px;
}

.time-relative {
  font-size: 11px;
  color: #9ca3af;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* 空状态 */
.empty-state {
  padding: 60px 0;
}

/* 分页 */
.pagination-container {
  padding: 24px 0 0 0;
  text-align: right;
  border-top: 1px solid #f3f4f6;
  margin-top: 24px;
}

/* 同步对话框 */
.sync-content {
  text-align: center;
  padding: 20px 0;
}

.sync-icon {
  margin-bottom: 20px;
}

.sync-description {
  margin-bottom: 20px;
  color: #606266;
  line-height: 1.6;
}

.sync-warning {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #e6a23c;
  font-size: 14px;
  margin-top: 12px;
}

.sync-progress-container {
  margin-top: 20px;
}

.sync-status {
  margin-bottom: 15px;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

/* 动画效果 */
.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-container .el-col {
    margin-bottom: 16px;
  }
}

@media (max-width: 768px) {
  .app-container {
    padding: 12px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .filter-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-form .el-form-item {
    width: 100%;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
  
  .pagination-container {
    text-align: center;
  }
}

/* 销售信息样式 */
.sales-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.sales-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.sales-label {
  color: #606266;
  font-size: 12px;
  min-width: 60px;
  text-align: left;
}

/* 提成信息样式 */
.commission-info {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 分支机构信息样式 */
.branch-info {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Element Plus 组件样式覆盖 */
.el-table {
  border-radius: 8px;
  overflow: hidden;
}

.el-table th {
  font-weight: 600;
}

.el-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.el-button + .el-button {
  margin-left: 0;
}

.el-tag {
  border: none;
  font-weight: 500;
}
</style>
