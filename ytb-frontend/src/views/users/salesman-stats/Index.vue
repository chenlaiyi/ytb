<template>
  <div class="app-container">
    <el-card class="stats-card">
      <template #header>
        <div class="card-header">
          <span>业务员统计</span>
          <div class="filter-actions">
            <el-select v-model="period" placeholder="选择时间段" @change="loadData">
              <el-option label="今日" value="today" />
              <el-option label="昨日" value="yesterday" />
              <el-option label="本周" value="week" />
              <el-option label="本月" value="month" />
              <el-option label="本季度" value="quarter" />
              <el-option label="本年度" value="year" />
              <el-option label="全部" value="all" />
            </el-select>
          </div>
        </div>
      </template>

      <!-- 统计卡片 -->
      <div class="stat-cards">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="stat-card" body-style="padding: 20px">
              <div class="stat-icon bg-primary">
                <i class="el-icon-user"></i>
              </div>
              <div class="stat-content">
                <div class="stat-title">在职业务员</div>
                <div class="stat-value">{{ stats.activeSalesmen || 0 }}</div>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="stat-card" body-style="padding: 20px">
              <div class="stat-icon bg-success">
                <i class="el-icon-shopping-cart-full"></i>
              </div>
              <div class="stat-content">
                <div class="stat-title">总销售数量</div>
                <div class="stat-value">{{ stats.totalSales || 0 }}</div>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="stat-card" body-style="padding: 20px">
              <div class="stat-icon bg-warning">
                <i class="el-icon-money"></i>
              </div>
              <div class="stat-content">
                <div class="stat-title">总销售金额</div>
                <div class="stat-value">￥{{ formatPrice(stats.totalAmount) }}</div>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="stat-card" body-style="padding: 20px">
              <div class="stat-icon bg-danger">
                <i class="el-icon-data-line"></i>
              </div>
              <div class="stat-content">
                <div class="stat-title">总提成金额</div>
                <div class="stat-value">￥{{ formatPrice(stats.totalCommission) }}</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 图表区域 -->
      <div class="chart-container">
        <el-row :gutter="20">
          <el-col :xs="24" :md="16">
            <el-card shadow="hover" class="chart-card">
              <template #header>
                <div class="chart-title">月度销售趋势</div>
              </template>
              <div class="chart" ref="salesChartRef" style="height: 350px"></div>
            </el-card>
          </el-col>

          <el-col :xs="24" :md="8">
            <el-card shadow="hover" class="chart-card">
              <template #header>
                <div class="chart-title">
                  <span>业务员排行榜</span>
                  <el-dropdown @command="changeRankBy">
                    <span class="el-dropdown-link">
                      {{ getRankByText() }}<i class="el-icon-arrow-down el-icon--right"></i>
                    </span>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="quantity">按销售数量</el-dropdown-item>
                        <el-dropdown-item command="amount">按销售金额</el-dropdown-item>
                        <el-dropdown-item command="commission">按提成金额</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </template>
              <div class="rank-list">
                <div v-for="(item, index) in stats.topSalesmen" :key="index" class="rank-item">
                  <div class="rank-index">{{ index + 1 }}</div>
                  <div class="rank-avatar">
                    <el-avatar :size="40" :src="item.avatar || '/images/default-avatar.png'"></el-avatar>
                  </div>
                  <div class="rank-info">
                    <div class="rank-name">{{ item.name }}</div>
                    <div class="rank-title">{{ item.title || item.department }}</div>
                  </div>
                  <div class="rank-value">
                    <template v-if="rankBy === 'quantity'">
                      {{ item.quantity }} 台
                    </template>
                    <template v-else-if="rankBy === 'commission'">
                      ￥{{ formatPrice(item.commission) }}
                    </template>
                    <template v-else>
                      ￥{{ formatPrice(item.amount) }}
                    </template>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 业务员销售详情表格 -->
      <el-card shadow="hover" class="table-card">
        <template #header>
          <div class="table-header">业务员销售详情</div>
        </template>
        <el-table
          v-loading="loading"
          :data="stats.salesmenData"
          border
          style="width: 100%"
        >
          <el-table-column
            align="center"
            label="排名"
            width="80"
          >
            <template #default="scope">
              <span>{{ scope.$index + 1 }}</span>
            </template>
          </el-table-column>

          <el-table-column
            align="center"
            label="业务员"
            min-width="120"
          >
            <template #default="scope">
              <span>{{ scope.row.name }}</span>
            </template>
          </el-table-column>

          <el-table-column
            align="center"
            label="部门"
            min-width="120"
          >
            <template #default="scope">
              <span>{{ scope.row.department || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column
            align="center"
            label="区域"
            min-width="120"
          >
            <template #default="scope">
              <span>{{ scope.row.region || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column
            align="center"
            label="销售数量"
            min-width="100"
          >
            <template #default="scope">
              <span>{{ scope.row.quantity }}</span>
            </template>
          </el-table-column>

          <el-table-column
            align="center"
            label="销售金额"
            min-width="120"
          >
            <template #default="scope">
              <span>￥{{ formatPrice(scope.row.amount) }}</span>
            </template>
          </el-table-column>

          <el-table-column
            align="center"
            label="提成金额"
            min-width="120"
          >
            <template #default="scope">
              <span>￥{{ formatPrice(scope.row.commission) }}</span>
            </template>
          </el-table-column>

          <el-table-column
            align="center"
            label="客户数量"
            min-width="100"
          >
            <template #default="scope">
              <span>{{ scope.row.customers || 0 }}</span>
            </template>
          </el-table-column>

          <el-table-column
            align="center"
            label="转化率"
            min-width="100"
          >
            <template #default="scope">
              <span>{{ scope.row.conversion_rate || 0 }}%</span>
            </template>
          </el-table-column>

          <el-table-column
            align="center"
            label="操作"
            width="100"
            fixed="right"
          >
            <template #default="scope">
              <el-button
                type="primary"
                size="small"
                @click="viewSalesmanDetail(scope.row.id)"
              >
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import * as echarts from 'echarts';

export default {
  name: 'SalesmanStats',

  setup() {
    const router = useRouter();
    const loading = ref(false);
    const salesChartRef = ref(null);
    const salesChart = ref(null);
    const departmentChartRef = ref(null);
    const departmentChart = ref(null);
    const productChartRef = ref(null);
    const productChart = ref(null);

    // 时间段选择
    const period = ref('month');
    // 排序字段
    const rankBy = ref('amount');

    // 统计数据
    const stats = reactive({
      activeSalesmen: 0,
      totalSales: 0,
      totalAmount: 0,
      totalCommission: 0,
      monthlySales: {
        labels: [],
        amounts: [],
        quantities: []
      },
      topSalesmen: [],
      departmentSales: {
        labels: [],
        data: []
      },
      productSales: {
        labels: [],
        data: []
      },
      salesmenData: []
    });

    // 加载数据
    const loadData = async () => {
      try {
        loading.value = true;
        const params = { period: period.value, rank_by: rankBy.value };
        const response = await request.get('salesman-stats', params);

        // 更新统计数据
        Object.assign(stats, response.data);

        // 刷新图表
        nextTick(() => {
          initSalesChart();
        });

        loading.value = false;
      } catch (error) {
        console.error('获取统计数据失败', error);
        ElMessage.error('获取统计数据失败');
        loading.value = false;
      }
    };

    // 初始化销售趋势图表
    const initSalesChart = () => {
      if (!salesChartRef.value) return;

      if (salesChart.value) {
        salesChart.value.dispose();
      }

      salesChart.value = echarts.init(salesChartRef.value);

      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985'
            }
          }
        },
        legend: {
          data: ['销售金额', '销售数量']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: [
          {
            type: 'category',
            boundaryGap: false,
            data: stats.monthlySales.labels
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: '金额(元)',
            position: 'left'
          },
          {
            type: 'value',
            name: '数量(台)',
            position: 'right'
          }
        ],
        series: [
          {
            name: '销售金额',
            type: 'line',
            stack: '总量',
            areaStyle: {},
            emphasis: {
              focus: 'series'
            },
            data: stats.monthlySales.amounts,
            yAxisIndex: 0
          },
          {
            name: '销售数量',
            type: 'line',
            stack: '总量',
            areaStyle: {},
            emphasis: {
              focus: 'series'
            },
            data: stats.monthlySales.quantities,
            yAxisIndex: 1
          }
        ]
      };

      salesChart.value.setOption(option);

      // 窗口大小变化时重绘图表
      window.addEventListener('resize', () => {
        salesChart.value && salesChart.value.resize();
      });
    };

    // 格式化价格显示
    const formatPrice = (price) => {
      if (!price) return '0.00';
      return parseFloat(price).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    // 获取排序文本
    const getRankByText = () => {
      switch (rankBy.value) {
        case 'quantity':
          return '按销售数量';
        case 'commission':
          return '按提成金额';
        default:
          return '按销售金额';
      }
    };

    // 改变排序字段
    const changeRankBy = async (command) => {
      rankBy.value = command;

      // 尝试从之前加载的数据中获取排名
      if (stats.rankings && stats.rankings[command]) {
        stats.topSalesmen = stats.rankings[command];
        stats.salesmenData = stats.rankings[command].slice(0, 20);
        return;
      }

      // 如果没有缓存数据，则请求新数据
      loading.value = true;
      try {
        const params = {
          period: period.value,
          rank_by: command
        };
        const response = await request.get(`salesman-stats/rankings/${command}`, params);
        stats.topSalesmen = response.data;
        stats.salesmenData = response.data.slice(0, 20);
      } catch (error) {
        console.error(`获取${getRankByText()}排名失败:`, error);
        ElMessage.error(`获取${getRankByText()}排名失败`);
      } finally {
        loading.value = false;
      }
    };

    // 查看业务员详情
    const viewSalesmanDetail = (id) => {
      router.push({ name: 'SalesmenDetail', params: { id } });
    };

    onMounted(() => {
      loadData();
    });

    return {
      loading,
      salesChartRef,
      period,
      rankBy,
      stats,
      formatPrice,
      getRankByText,
      changeRankBy,
      viewSalesmanDetail
    };
  }
};
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.stats-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  margin-right: 15px;
  font-size: 24px;
  color: #fff;
}

.bg-primary {
  background-color: #409EFF;
}

.bg-success {
  background-color: #67C23A;
}

.bg-warning {
  background-color: #E6A23C;
}

.bg-danger {
  background-color: #F56C6C;
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.chart-container {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.chart-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

.el-dropdown-link {
  cursor: pointer;
  color: #409EFF;
  display: flex;
  align-items: center;
}

.rank-list {
  padding: 10px 0;
}

.rank-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  margin-bottom: 10px;
  border-radius: 4px;
  background-color: #f9f9f9;
  transition: all 0.3s;
}

.rank-item:hover {
  background-color: #f0f0f0;
}

.rank-index {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #409EFF;
  color: #fff;
  border-radius: 50%;
  margin-right: 10px;
  font-size: 14px;
}

.rank-avatar {
  margin-right: 10px;
}

.rank-info {
  flex: 1;
}

.rank-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.rank-title {
  font-size: 12px;
  color: #909399;
}

.rank-value {
  font-weight: bold;
  color: #F56C6C;
}

.table-card {
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  font-size: 16px;
  font-weight: bold;
}
</style>