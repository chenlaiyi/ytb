<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-title">
        <h2>业务员详情</h2>
        <p class="page-description">查看业务员的详细信息和统计数据</p>
      </div>
      <div class="page-actions">
        <el-button type="primary" size="large" @click="handleEdit">
          <el-icon><Edit /></el-icon>
          编辑信息
        </el-button>
        <el-button type="success" size="large" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回列表
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

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    
    <template v-else>
      <!-- 基本信息 -->
      <el-card class="detail-card">
        <template #header>
          <div class="card-header">
            <span>业务员基本信息</span>
            <el-button type="primary" size="small" @click="handleEdit">编辑</el-button>
          </div>
        </template>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="员工ID" :span="1">{{ salesman.id }}</el-descriptions-item>
          <el-descriptions-item label="员工编号" :span="1">{{ salesman.employee_id || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="姓名" :span="1">{{ salesman.user?.name || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="手机号" :span="1">{{ salesman.user?.phone || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="职位/职级" :span="1">{{ salesman.title }}</el-descriptions-item>
          <el-descriptions-item label="状态" :span="1">
            <el-tag :type="getStatusType(salesman.status)">{{ getStatusText(salesman.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="部门" :span="1">{{ salesman.department || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="区域" :span="1">{{ salesman.region || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="上级经理" :span="1">
            {{ salesman.managerUser?.user?.name || '无' }}
            <span v-if="salesman.managerUser">({{ salesman.managerUser.title }})</span>
          </el-descriptions-item>
          <el-descriptions-item label="入职日期" :span="1">{{ formatDate(salesman.join_date) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="1">{{ formatDate(salesman.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ salesman.remark || '无' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
      
      <!-- 销售统计 -->
      <el-card class="detail-card">
        <template #header>
          <div class="card-header">
            <span>销售统计</span>
          </div>
        </template>
        
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card">
              <div class="stat-title">总销售量</div>
              <div class="stat-value">{{ salesStat.total_quantity || 0 }}</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card">
              <div class="stat-title">总销售金额</div>
              <div class="stat-value">¥{{ formatPrice(salesStat.total_amount) }}</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card">
              <div class="stat-title">总佣金</div>
              <div class="stat-value">¥{{ formatPrice(salesStat.total_commission) }}</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card">
              <div class="stat-title">客户数量</div>
              <div class="stat-value">{{ salesStat.customer_count || 0 }}</div>
            </div>
          </el-col>
        </el-row>
        
        <div class="chart-container" ref="salesChartRef"></div>
      </el-card>
      
      <!-- 操作按钮 -->
      <div class="quick-actions">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="action-card" shadow="hover" @click="viewSales">
              <div class="action-content">
                <el-icon class="action-icon"><ShoppingBag /></el-icon>
                <div class="action-text">销售记录</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="action-card" shadow="hover" @click="viewCommissions">
              <div class="action-content">
                <el-icon class="action-icon"><Money /></el-icon>
                <div class="action-text">佣金记录</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="action-card" shadow="hover" @click="viewTargets">
              <div class="action-content">
                <el-icon class="action-icon"><Aim /></el-icon>
                <div class="action-text">目标设置</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="action-card" shadow="hover" @click="viewCustomers">
              <div class="action-content">
                <el-icon class="action-icon"><UserFilled /></el-icon>
                <div class="action-text">客户列表</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </template>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { 
  Edit, ArrowLeft, User, DataAnalysis, TrendCharts, Reading, UserFilled, Money,
  ShoppingBag, Aim
} from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { getSalesmanDetail } from '@/api/salesman';

export default {
  name: 'SalesmenShow',
  
  setup() {
    const router = useRouter();
    const route = useRoute();
    const loading = ref(true);
    const salesChartRef = ref(null);
    const salesChart = ref(null);
    
    // 获取业务员ID
    const salesmanId = route.params.id;
    
    // 业务员模块导航标签页
    const activeTab = ref('detail');
    
    // 业务员数据
    const salesman = reactive({});
    
    // 销售统计数据
    const salesStat = reactive({
      total_quantity: 0,
      total_amount: 0,
      total_commission: 0,
      customer_count: 0,
      monthly_stats: []
    });
    
    // 获取业务员详情
    const fetchSalesmanDetail = async () => {
      try {
        loading.value = true;
        
        const response = await getSalesmanDetail(salesmanId);
        const data = response.data || {};
        
        
        
        // 填充业务员数据
        Object.assign(salesman, data.salesman || data);
        
        // 填充销售统计数据
        Object.assign(salesStat, data.stats || {});
        
      } catch (error) {
        console.error('获取业务员详情失败', error);
        console.error('错误详情:', error.response?.data || error.message || '未知错误');
        ElMessage.error('获取业务员详情失败: ' + (error.response?.data?.message || error.message || '未知错误'));
        router.push({ name: 'SalesmenList' });
      } finally {
        loading.value = false;
      }
    };
    
    // 初始化销售图表
    const initSalesChart = () => {
      if (!salesChartRef.value) return;
      
      // 如果图表已存在，先销毁
      if (salesChart.value) {
        salesChart.value.dispose();
      }
      
      // 初始化图表
      salesChart.value = echarts.init(salesChartRef.value);
      
      // 准备图表数据
      const months = [];
      const quantities = [];
      const amounts = [];
      
      
      // 如果有月度数据，则添加到图表
      if (salesStat.monthly_stats && salesStat.monthly_stats.length > 0) {
        salesStat.monthly_stats.forEach(item => {
          months.push(item.month);
          quantities.push(Number(item.quantity) || 0);
          amounts.push(Number(item.amount) || 0);
        });
      } else {
        // 如果没有数据，显示最近6个月的空数据
        const currentDate = new Date();
        for (let i = 5; i >= 0; i--) {
          const date = new Date(currentDate);
          date.setMonth(date.getMonth() - i);
          const month = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
          months.push(month);
          quantities.push(0);
          amounts.push(0);
        }
      }
      
      // 图表配置
      const option = {
        title: {
          text: '最近6个月销售趋势',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['销售量', '销售额(元)'],
          bottom: 10
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: months
        },
        yAxis: [
          {
            type: 'value',
            name: '销售量',
            position: 'left',
            minInterval: 1  // 确保销售量显示为整数
          },
          {
            type: 'value',
            name: '销售额(元)',
            position: 'right',
            axisLabel: {
              formatter: '{value} 元'
            }
          }
        ],
        series: [
          {
            name: '销售量',
            type: 'bar',
            data: quantities,
            yAxisIndex: 0,
            barWidth: '30%',
            emphasis: {
              focus: 'series'
            },
            itemStyle: {
              color: '#409EFF'
            }
          },
          {
            name: '销售额(元)',
            type: 'line',
            data: amounts,
            yAxisIndex: 1,
            smooth: true,
            emphasis: {
              focus: 'series'
            },
            itemStyle: {
              color: '#67C23A'
            }
          }
        ]
      };
      
      try {
        // 设置图表选项
        salesChart.value.setOption(option);
        
        // 响应窗口大小变化
        window.addEventListener('resize', () => {
          if (salesChart.value) {
            salesChart.value.resize();
          }
        });
      } catch (error) {
        console.error('初始化图表失败:', error);
      }
    };
    
    // 获取状态对应的类型
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
    
    // 获取状态对应的文本
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
      if (!date) return '无';
      return new Date(date).toLocaleDateString('zh-CN');
    };
    
    // 格式化价格
    const formatPrice = (price) => {
      return parseFloat(price || 0).toFixed(2);
    };
    
    // 编辑业务员
    const handleEdit = () => {
      router.push({ name: 'SalesmenEdit', params: { id: salesmanId } });
    };
    
    // 查看销售记录
    const viewSales = () => {
      router.push({ name: 'SalesmenSales', params: { id: salesmanId } });
    };
    
    // 查看佣金记录
    const viewCommissions = () => {
      router.push({ name: 'SalesmenCommissions', params: { id: salesmanId } });
    };
    
    // 查看目标设置
    const viewTargets = () => {
      router.push({ name: 'SalesmenTargets', params: { id: salesmanId } });
    };
    
    // 查看客户列表
    const viewCustomers = () => {
      router.push({ name: 'SalesmenCustomers', params: { id: salesmanId } });
    };
    
    // 处理标签页点击
    const handleTabClick = (tab) => {
      const tabName = tab.props.name;
      
      // 根据标签页名称跳转到对应的路由
      switch (tabName) {
        case 'list':
          router.push('/users/salesmen');
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
    
    // 返回列表
    const goBack = () => {
      router.push({ name: 'SalesmenList' });
    };
    
    onMounted(() => {
      fetchSalesmanDetail().then(() => {
        initSalesChart();
      });
    });
    
    return {
      loading,
      salesmanId,
      salesman,
      salesStat,
      salesChartRef,
      activeTab,
      getStatusType,
      getStatusText,
      formatDate,
      formatPrice,
      handleEdit,
      viewSales,
      viewCommissions,
      viewTargets,
      viewCustomers,
      handleTabClick,
      goBack,
      // Icons
      Edit,
      ArrowLeft,
      User,
      DataAnalysis,
      TrendCharts,
      Reading,
      UserFilled,
      Money,
      ShoppingBag,
      Aim
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.salesman-tabs .el-tab-pane {
  flex: 1;
}

.salesman-tabs .el-tab-pane .tab-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.loading-container {
  padding: 20px;
}

.detail-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-card {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  background-color: #e8f4fd;
  transform: translateY(-2px);
}

.stat-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.chart-container {
  height: 400px;
  margin-top: 20px;
}

.quick-actions {
  margin-bottom: 20px;
}

.action-card {
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.action-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.action-icon {
  font-size: 32px;
  margin-bottom: 12px;
  color: #409eff;
}

.action-text {
  font-size: 16px;
  color: #303133;
  font-weight: 500;
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
  
  .quick-actions .el-row {
    flex-direction: column;
  }
  
  .quick-actions .el-col {
    margin-bottom: 10px;
  }
  
  .chart-container {
    height: 300px;
  }
}

/* Element Plus 组件样式覆盖 */
.el-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.el-button + .el-button {
  margin-left: 0;
}
</style> 