<template>
  <div class="sms-statistics-page">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>短信统计分析</span>
          <div class="header-buttons">
            <el-button type="primary" @click="exportData">导出数据</el-button>
          </div>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-container">
        <el-form :inline="true" :model="filters" class="demo-form-inline">
          <el-form-item label="日期范围">
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              :shortcuts="dateRangeShortcuts"
              clearable
            />
          </el-form-item>
          <el-form-item label="统计类型">
            <el-select v-model="filters.type" placeholder="请选择统计类型">
              <el-option label="按日统计" value="daily" />
              <el-option label="按周统计" value="weekly" />
              <el-option label="按月统计" value="monthly" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 统计卡片 -->
      <div class="stat-cards">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-card-title">总发送量</div>
              <div class="stat-card-value">{{ statistics.total }}</div>
              <div class="stat-card-footer">
                <span :class="statistics.totalTrend > 0 ? 'trend-up' : 'trend-down'">
                  <el-icon><ArrowUp v-if="statistics.totalTrend > 0" /><ArrowDown v-else /></el-icon>
                  {{ Math.abs(statistics.totalTrend) }}%
                </span>
                <span class="trend-period">较上期</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-card-title">发送成功</div>
              <div class="stat-card-value">{{ statistics.success }}</div>
              <div class="stat-card-footer">
                <span :class="statistics.successTrend > 0 ? 'trend-up' : 'trend-down'">
                  <el-icon><ArrowUp v-if="statistics.successTrend > 0" /><ArrowDown v-else /></el-icon>
                  {{ Math.abs(statistics.successTrend) }}%
                </span>
                <span class="trend-period">较上期</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-card-title">发送失败</div>
              <div class="stat-card-value">{{ statistics.failed }}</div>
              <div class="stat-card-footer">
                <span :class="statistics.failedTrend < 0 ? 'trend-up' : 'trend-down'">
                  <el-icon><ArrowUp v-if="statistics.failedTrend < 0" /><ArrowDown v-else /></el-icon>
                  {{ Math.abs(statistics.failedTrend) }}%
                </span>
                <span class="trend-period">较上期</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-card-title">成功率</div>
              <div class="stat-card-value">{{ statistics.successRate }}%</div>
              <div class="stat-card-footer">
                <span :class="statistics.successRateTrend > 0 ? 'trend-up' : 'trend-down'">
                  <el-icon><ArrowUp v-if="statistics.successRateTrend > 0" /><ArrowDown v-else /></el-icon>
                  {{ Math.abs(statistics.successRateTrend) }}%
                </span>
                <span class="trend-period">较上期</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 图表区域 -->
      <div class="chart-container">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="hover" class="chart-card">
              <template #header>
                <div class="chart-header">
                  <span>发送量趋势</span>
                </div>
              </template>
              <div class="chart-placeholder">
                <div class="chart-mock">
                  <div class="chart-bar" v-for="(item, index) in 7" :key="index" :style="{ height: 20 + Math.random() * 80 + 'px' }"></div>
                </div>
                <div class="chart-mock-label">模拟图表 - 实际开发中将使用ECharts</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover" class="chart-card">
              <template #header>
                <div class="chart-header">
                  <span>短信类型分布</span>
                </div>
              </template>
              <div class="chart-placeholder">
                <div class="chart-mock-pie">
                  <div class="pie-segment" style="transform: rotate(0deg); background-color: #409EFF;"></div>
                  <div class="pie-segment" style="transform: rotate(120deg); background-color: #67C23A;"></div>
                  <div class="pie-segment" style="transform: rotate(240deg); background-color: #E6A23C;"></div>
                </div>
                <div class="chart-mock-label">模拟图表 - 实际开发中将使用ECharts</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 详细数据表格 -->
      <div class="table-container">
        <el-card shadow="hover" class="table-card">
          <template #header>
            <div class="table-header">
              <span>详细数据</span>
            </div>
          </template>
          <el-table
            v-loading="loading"
            :data="tableData"
            style="width: 100%"
            border
          >
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="total" label="总发送量" width="120" />
            <el-table-column prop="success" label="发送成功" width="120" />
            <el-table-column prop="failed" label="发送失败" width="120" />
            <el-table-column prop="successRate" label="成功率" width="120">
              <template #default="scope">
                {{ scope.row.successRate }}%
              </template>
            </el-table-column>
            <el-table-column prop="verificationCode" label="验证码短信" width="120" />
            <el-table-column prop="notification" label="通知短信" width="120" />
            <el-table-column prop="marketing" label="营销短信" width="120" />
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
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue';
import { get } from '@/utils/request';

export default {
  name: 'SmsStatistics',
  components: {
    ArrowUp,
    ArrowDown
  },
  setup() {
    // 加载状态
    const loading = ref(false);
    
    // 筛选条件
    const filters = reactive({
      dateRange: null,
      type: 'daily'
    });
    
    // 日期范围快捷选项
    const dateRangeShortcuts = [
      {
        text: '最近一周',
        value: () => {
          const end = new Date();
          const start = new Date();
          start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
          return [start, end];
        }
      },
      {
        text: '最近一个月',
        value: () => {
          const end = new Date();
          const start = new Date();
          start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
          return [start, end];
        }
      },
      {
        text: '最近三个月',
        value: () => {
          const end = new Date();
          const start = new Date();
          start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
          return [start, end];
        }
      }
    ];
    
    // 统计数据
    const statistics = reactive({
      total: 1234,
      totalTrend: 5.2,
      success: 1200,
      successTrend: 6.8,
      failed: 34,
      failedTrend: 2.3,
      successRate: 97.2,
      successRateTrend: 1.5
    });
    
    // 表格数据
    const tableData = ref([]);
    
    // 分页
    const pagination = reactive({
      page: 1,
      limit: 10,
      total: 0
    });
    
    // 获取统计数据
    const getStatisticsData = async () => {
      loading.value = true;
      try {
        // 构建查询参数
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          type: filters.type
        };
        
        // 添加日期范围
        if (filters.dateRange && filters.dateRange.length === 2) {
          params.start_date = filters.dateRange[0];
          params.end_date = filters.dateRange[1];
        }
        
        // 模拟API调用
        // const response = await get('/system/api/sms/statistics', params);
        
        // 模拟数据
        const mockData = {
          code: 0,
          message: 'success',
          data: {
            list: [
              {
                date: '2025-04-01',
                total: 156,
                success: 152,
                failed: 4,
                successRate: 97.4,
                verificationCode: 98,
                notification: 45,
                marketing: 13
              },
              {
                date: '2025-04-02',
                total: 142,
                success: 138,
                failed: 4,
                successRate: 97.2,
                verificationCode: 87,
                notification: 42,
                marketing: 13
              },
              {
                date: '2025-04-03',
                total: 168,
                success: 165,
                failed: 3,
                successRate: 98.2,
                verificationCode: 103,
                notification: 48,
                marketing: 17
              },
              {
                date: '2025-04-04',
                total: 175,
                success: 172,
                failed: 3,
                successRate: 98.3,
                verificationCode: 112,
                notification: 51,
                marketing: 12
              },
              {
                date: '2025-04-05',
                total: 189,
                success: 184,
                failed: 5,
                successRate: 97.4,
                verificationCode: 118,
                notification: 56,
                marketing: 15
              },
              {
                date: '2025-04-06',
                total: 201,
                success: 196,
                failed: 5,
                successRate: 97.5,
                verificationCode: 125,
                notification: 59,
                marketing: 17
              },
              {
                date: '2025-04-07',
                total: 203,
                success: 193,
                failed: 10,
                successRate: 95.1,
                verificationCode: 128,
                notification: 62,
                marketing: 13
              }
            ],
            total: 7
          }
        };
        
        // 更新数据
        tableData.value = mockData.data.list;
        pagination.total = mockData.data.total;
      } catch (error) {
        console.error('获取统计数据失败:', error);
        ElMessage.error('获取统计数据失败，请重试');
      } finally {
        loading.value = false;
      }
    };
    
    // 导出数据
    const exportData = () => {
      ElMessage.info('导出功能开发中...');
    };
    
    // 处理搜索
    const handleSearch = () => {
      pagination.page = 1;
      getStatisticsData();
    };
    
    // 重置筛选条件
    const resetFilters = () => {
      filters.dateRange = null;
      filters.type = 'daily';
      pagination.page = 1;
      getStatisticsData();
    };
    
    // 处理每页显示数量变化
    const handleSizeChange = (val) => {
      pagination.limit = val;
      getStatisticsData();
    };
    
    // 处理页码变化
    const handleCurrentChange = (val) => {
      pagination.page = val;
      getStatisticsData();
    };
    
    // 组件挂载时获取数据
    onMounted(() => {
      getStatisticsData();
    });
    
    return {
      loading,
      filters,
      dateRangeShortcuts,
      statistics,
      tableData,
      pagination,
      getStatisticsData,
      exportData,
      handleSearch,
      resetFilters,
      handleSizeChange,
      handleCurrentChange
    };
  }
};
</script>

<style scoped>
.sms-statistics-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-container {
  margin-bottom: 20px;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-card-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.stat-card-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.stat-card-footer {
  font-size: 12px;
}

.trend-up {
  color: #67C23A;
}

.trend-down {
  color: #F56C6C;
}

.trend-period {
  color: #909399;
  margin-left: 5px;
}

.chart-container {
  margin-bottom: 20px;
}

.chart-card {
  height: 350px;
}

.chart-header, .table-header {
  font-weight: bold;
}

.chart-placeholder {
  height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.chart-mock {
  width: 80%;
  height: 200px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.chart-bar {
  width: 30px;
  background-color: #409EFF;
  border-radius: 3px 3px 0 0;
}

.chart-mock-pie {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
}

.pie-segment {
  position: absolute;
  width: 100%;
  height: 100%;
  clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%);
}

.chart-mock-label {
  margin-top: 20px;
  color: #909399;
  font-size: 12px;
}

.table-container {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
