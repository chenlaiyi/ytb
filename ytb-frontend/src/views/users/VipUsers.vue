<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>VIP会员管理</span>
        </div>
      </template>

      <!-- 统计面板 -->
      <div class="stats-panel mb-4">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="hover" class="stats-card">
              <template #header>
                <div class="stats-header">
                  <span>VIP会员总数</span>
                </div>
              </template>
              <div class="stats-value">{{ stats.totalVip || 0 }}人</div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" class="stats-card">
              <template #header>
                <div class="stats-header">
                  <span>分红总额</span>
                </div>
              </template>
              <div class="stats-value info">{{ stats.totalDividend || '0.00' }}元</div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" class="stats-card">
              <template #header>
                <div class="stats-header">
                  <span>待结算分红</span>
                </div>
              </template>
              <div class="stats-value warning">{{ stats.pendingDividend || '0.00' }}元</div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 搜索区域 -->
      <div class="search-box mb-4">
        <el-input
          v-model="searchQuery"
          placeholder="输入用户名、手机号或ID搜索"
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>

      <!-- 用户列表 -->
      <el-table
        v-loading="loading"
        :data="userList"
        border
        style="width: 100%"
      >
        <el-table-column label="ID" prop="id" width="80" />
        <el-table-column label="用户信息" min-width="200">
          <template #default="scope">
            <div class="user-info">
              <el-avatar :size="40" :src="scope.row.avatar || defaultAvatar"></el-avatar>
              <div class="user-details">
                <div class="user-name">{{ scope.row.name || '未设置昵称' }}</div>
                <div class="user-mobile">{{ scope.row.mobile || '未绑定手机' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="账户余额" width="120" align="right">
          <template #default="scope">
            <span class="balance">{{ formatCurrency(scope.row.balance) }}元</span>
          </template>
        </el-table-column>
        <el-table-column label="推荐人" width="150">
          <template #default="scope">
            <div v-if="scope.row.referrer_id">
              <div>{{ scope.row.referrer_name || '未知' }}</div>
              <small class="text-muted">ID: {{ scope.row.referrer_id }}</small>
            </div>
            <span v-else class="text-muted">无推荐人</span>
          </template>
        </el-table-column>
        <el-table-column label="成为VIP时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.vip_at) }}
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="120">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="viewDetail(scope.row)"
              link
            >
              详情
            </el-button>
            <el-button 
              type="success" 
              size="small" 
              @click="viewDividends(scope.row)"
              link
            >
              分红
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-if="total > 0"
          v-model:currentPage="page"
          v-model:page-size="perPage"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import { formatDateTime } from '@/utils/formatters';

// 状态数据
const loading = ref(false);
const userList = ref([]);
const total = ref(0);
const page = ref(1);
const perPage = ref(10);
const searchQuery = ref('');
const defaultAvatar = '/images/default-avatar.png';

// 统计数据
const stats = reactive({
  totalVip: 0,
  totalDividend: '0.00',
  pendingDividend: '0.00'
});

// 获取VIP用户列表
const getVipUsers = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/vip-dividends/api/vip-users', {
      params: {
        page: page.value,
        per_page: perPage.value,
        search: searchQuery.value
      }
    });
    
    if (response.data.code === 0) {
      const data = response.data.data;
      userList.value = data.users;
      total.value = data.total;
      
      // 更新统计数据 - 匹配API返回的字段名
      if (data.statistics) {
        stats.totalVip = data.statistics.total || data.total;
        stats.totalDividend = data.statistics.totalDividend || 0;
        stats.pendingDividend = data.statistics.pendingAmount || 0;
      } else if (data.stats) {
        stats.totalVip = data.stats.total_vip || data.total;
        stats.totalDividend = data.stats.total_dividend || 0;
        stats.pendingDividend = data.stats.pending_dividend || 0;
      }
    } else {
      ElMessage.error(response.data.msg || '获取VIP用户列表失败');
    }
  } catch (error) {
    console.error('获取VIP用户列表失败:', error);
    ElMessage.error('获取VIP用户列表失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 初始化
onMounted(() => {
  getVipUsers();
});

// 搜索处理
const handleSearch = () => {
  page.value = 1;
  getVipUsers();
};

// 处理分页大小变化
const handleSizeChange = (size) => {
  perPage.value = size;
  getVipUsers();
};

// 处理页码变化
const handleCurrentChange = (currentPage) => {
  page.value = currentPage;
  getVipUsers();
};

// 格式化金额
const formatCurrency = (value) => {
  return parseFloat(value || 0).toFixed(2);
};

// 格式化日期
const formatDate = (dateString) => {
  return formatDateTime(dateString);
};

// 查看用户详情
const viewDetail = (user) => {
  window.location.href = `/vip-users/show/${user.id}`;
};

// 查看用户分红
const viewDividends = (user) => {
  window.location.href = `/vip-dividends?user_id=${user.id}`;
};
</script>

<style scoped>
.stats-panel {
  margin-bottom: 20px;
}

.stats-card {
  text-align: center;
}

.stats-header {
  font-size: 14px;
  font-weight: bold;
}

.stats-value {
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
}

.stats-value.warning {
  color: #E6A23C;
}

.stats-value.success {
  color: #67C23A;
}

.stats-value.info {
  color: #909399;
}

.search-box {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 20px;
}

.search-input {
  width: 400px;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-details {
  margin-left: 10px;
}

.user-name {
  font-weight: bold;
}

.user-mobile {
  font-size: 12px;
  color: #909399;
}

.balance {
  font-weight: bold;
  color: #F56C6C;
}

.text-muted {
  color: #909399;
  font-size: 12px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style> 