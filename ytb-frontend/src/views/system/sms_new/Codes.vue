<template>
  <div class="sms-codes-page">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>验证码管理</span>
          <div class="header-buttons">
            <el-button type="primary" @click="exportData">导出数据</el-button>
          </div>
        </div>
      </template>

      <!-- 统计数据 -->
      <div class="dashboard-stats">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-item">
                <div class="stat-value">{{ statsData.total }}</div>
                <div class="stat-label">总发送量</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-item">
                <div class="stat-value">{{ statsData.used }}</div>
                <div class="stat-label">已使用</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-item">
                <div class="stat-value">{{ statsData.unused }}</div>
                <div class="stat-label">未使用</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-item">
                <div class="stat-value">{{ statsData.usageRate }}%</div>
                <div class="stat-label">使用率</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 搜索筛选 -->
      <div class="filter-container">
        <el-form :inline="true" :model="filters" class="demo-form-inline">
          <el-form-item label="手机号">
            <el-input v-model="filters.phone" placeholder="输入手机号" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="全部状态" clearable>
              <el-option
                v-for="option in statusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="filters.type" placeholder="全部类型" clearable>
              <el-option
                v-for="option in typeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="日期范围">
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        :data="codesList"
        border
        style="width: 100%"
        max-height="600"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="code" label="验证码" width="100" />
        <el-table-column prop="type_text" label="类型" width="120">
          <template #default="scope">
            {{ getTypeLabel(scope.row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status === 'used' ? '已使用' : '未使用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="used_at" label="使用时间" width="180">
          <template #default="scope">
            {{ scope.row.used_at ? formatDateTime(scope.row.used_at) : '未使用' }}
          </template>
        </el-table-column>
        <el-table-column prop="expires_at" label="过期时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.expires_at) }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import smsApi from '../../../api/smsApi';
import { formatDateTime, formatDate } from '../../../utils/formatters';

export default {
  name: 'SmsCodes',
  setup() {
    // 数据加载状态
    const loading = ref(false);

    // 验证码列表数据
    const codesList = ref([]);

    // 分页信息
    const pagination = reactive({
      page: 1,
      limit: 20,
      total: 0
    });

    // 搜索筛选
    const filters = reactive({
      phone: '',
      status: '',
      type: '',
      dateRange: null
    });

    // 状态选项
    const statusOptions = [
      { value: 'all', label: '全部' },
      { value: 'used', label: '已使用' },
      { value: 'unused', label: '未使用' }
    ];

    // 短信类型选项
    const typeOptions = [
      { value: 'all', label: '全部' },
      { value: 'login', label: '登录验证' },
      { value: 'register', label: '注册验证' },
      { value: 'reset', label: '重置密码' },
      { value: 'bind', label: '绑定手机' },
      { value: 'verify', label: '身份验证' }
    ];

    // 统计数据
    const statsData = reactive({
      total: 0,
      used: 0,
      unused: 0,
      usageRate: 0
    });

    // 获取验证码列表
    const getSmsCodes = async () => {
      loading.value = true;
      try {
        // 尝试使用API获取数据
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          phone: filters.phone || undefined,
          status: filters.status || undefined,
          type: filters.type || undefined
        };

        // 添加日期范围
        if (filters.dateRange && filters.dateRange.length === 2) {
          params.start_date = filters.dateRange[0];
          params.end_date = filters.dateRange[1];
        }

        const response = await smsApi.getSmsCodes(params);

        if (response.data && response.code === 0) {
          // 标准结构
          if (Array.isArray(response.data)) {
            // 数组结构
            codesList.value = response.data || [];
            pagination.total = response.data.total || 0;
          } else if (response.data && response.data.list) {
            // 嵌套结构
            codesList.value = response.data.list || [];
            pagination.total = response.data.total || 0;
          } else {
            // 直接数组
            codesList.value = response.data || [];
            pagination.total = response.data.total || 0;
          }
        } else {
          // API调用失败，显示错误信息
          console.error('获取验证码失败:', response.data?.message || '未知错误');
          ElMessage.error('获取验证码失败: ' + (response.data?.message || '未知错误'));
          codesList.value = [];
          pagination.total = 0;
        }
      } catch (error) {
        console.error('获取验证码失败:', error);
        if (error.response) {
          console.error('错误状态码:', error.response.status);
          console.error('错误响应:', error.response.data);
        }
        ElMessage.error('获取验证码失败，请检查网络和API配置');
        // 显示错误信息
        codesList.value = [];
        pagination.total = 0;
      } finally {
        loading.value = false;
      }
    };

    // 获取验证码统计数据
    const getSmsCodesStats = async () => {
      try {
        const params = {};
        
        // 添加日期范围
        if (filters.dateRange && filters.dateRange.length === 2) {
          params.start_date = filters.dateRange[0];
          params.end_date = filters.dateRange[1];
        }
        
        const response = await smsApi.getSmsCodesStats(params);
        if (response.data && response.code === 0) {
          statsData.total = response.data.total || 0;
          statsData.used = response.data.used || 0;
          statsData.unused = response.data.unused || 0;
          statsData.usageRate = response.data.usageRate || 0;
        } else {
          console.error('获取验证码统计数据失败:', response.data?.message || '未知错误');
        }
      } catch (error) {
        console.error('获取验证码统计数据失败:', error);
      }
    };

    // 清空数据方法
    const clearData = () => {
      codesList.value = [];
      statsData.total = 0;
      statsData.used = 0;
      statsData.unused = 0;
      statsData.usageRate = 0;
      pagination.total = 0;
    };

    // 导出数据
    const exportData = () => {
      ElMessage.info('导出功能开发中...');
    };

    // 处理搜索
    const handleSearch = () => {
      pagination.page = 1;
      getSmsCodes();
      getSmsCodesStats();
    };

    // 重置筛选条件
    const resetFilters = () => {
      filters.phone = '';
      filters.status = '';
      filters.type = '';
      filters.dateRange = null;
      handleSearch();
    };

    // 处理每页显示数量变化
    const handleSizeChange = (val) => {
      pagination.limit = val;
      getSmsCodes();
    };

    // 处理页码变化
    const handleCurrentChange = (val) => {
      pagination.page = val;
      getSmsCodes();
    };

    // 获取状态标签类型
    const getStatusType = (status) => {
      switch (status) {
        case 'used':
          return 'success';
        case 'unused':
          return 'info';
        default:
          return 'info';
      }
    };

    // 获取短信类型标签
    const getTypeLabel = (type) => {
      const typeMap = {
        'login': '登录验证',
        'register': '注册验证',
        'reset': '重置密码',
        'bind': '绑定手机',
        'verify': '身份验证'
      };
      return typeMap[type] || type;
    };

    // 页面加载时获取数据
    onMounted(() => {

      getSmsCodes();
      getSmsCodesStats();
    });

    return {
      loading,
      codesList,
      pagination,
      filters,
      statusOptions,
      typeOptions,
      statsData,
      formatDateTime,
      formatDate,
      getStatusType,
      getTypeLabel,
      getSmsCodes,
      exportData,
      handleSearch,
      resetFilters,
      handleSizeChange,
      handleCurrentChange
    };
  }
};
</script>

<style lang="scss" scoped>
.sms-codes-page {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .filter-container {
    margin-bottom: 20px;
  }

  .dashboard-stats {
    margin-bottom: 20px;

    .el-card {
      margin-bottom: 0;
    }

    .stat-item {
      text-align: center;
      padding: 15px 0;

      .stat-value {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 5px;
      }

      .stat-label {
        color: #666;
      }
    }
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
