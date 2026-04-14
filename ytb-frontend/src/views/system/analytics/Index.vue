<template>
  <div class="access-analytics">
    <div class="analytics-header">
      <h2>权限分析</h2>
      <p>分析系统权限使用情况，优化权限配置</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon admin-icon">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.adminCount }}</div>
            <div class="stat-label">后台管理员</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon role-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.roleCount }}</div>
            <div class="stat-label">系统角色</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon permission-icon">
            <el-icon><Key /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.permissionCount }}</div>
            <div class="stat-label">系统权限</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon module-icon">
            <el-icon><Grid /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.moduleCount }}</div>
            <div class="stat-label">权限模块</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <!-- 角色权限分布 -->
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span>角色权限分布</span>
            <el-button size="small" @click="refreshRoleChart">刷新</el-button>
          </div>
        </template>
        <div ref="roleChartRef" class="chart-container"></div>
      </el-card>

      <!-- 权限模块使用情况 -->
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span>权限模块使用情况</span>
            <el-button size="small" @click="refreshModuleChart">刷新</el-button>
          </div>
        </template>
        <div ref="moduleChartRef" class="chart-container"></div>
      </el-card>
    </div>

    <!-- 详细分析表格 -->
    <div class="analysis-tables">
      <!-- 角色权限详情 -->
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <span>角色权限详情</span>
            <el-button size="small" @click="exportRoleData">导出数据</el-button>
          </div>
        </template>
        <el-table :data="roleAnalysis" style="width: 100%">
          <el-table-column prop="role_name" label="角色名称" width="150" />
          <el-table-column prop="permission_count" label="权限数量" width="120" />
          <el-table-column prop="admin_count" label="管理员数量" width="120" />
          <el-table-column prop="is_system" label="系统角色" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.is_system ? 'success' : 'info'">
                {{ scope.row.is_system ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="permissions" label="权限列表">
            <template #default="scope">
              <el-tag
                v-for="perm in scope.row.permissions.slice(0, 3)"
                :key="perm"
                size="small"
                class="mr-1"
              >
                {{ perm }}
              </el-tag>
              <span v-if="scope.row.permissions.length > 3" class="text-gray-500">
                等{{ scope.row.permissions.length }}个权限
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 权限使用统计 -->
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <span>权限使用统计</span>
            <el-button size="small" @click="exportPermissionData">导出数据</el-button>
          </div>
        </template>
        <el-table :data="permissionAnalysis" style="width: 100%">
          <el-table-column prop="module" label="权限模块" width="150" />
          <el-table-column prop="permission_count" label="权限数量" width="120" />
          <el-table-column prop="used_count" label="已使用" width="120" />
          <el-table-column prop="usage_rate" label="使用率" width="120">
            <template #default="scope">
              <el-progress
                :percentage="scope.row.usage_rate"
                :color="getProgressColor(scope.row.usage_rate)"
                :stroke-width="8"
              />
            </template>
          </el-table-column>
          <el-table-column prop="unused_permissions" label="未使用权限">
            <template #default="scope">
              <el-tag
                v-for="perm in scope.row.unused_permissions.slice(0, 2)"
                :key="perm"
                size="small"
                type="warning"
                class="mr-1"
              >
                {{ perm }}
              </el-tag>
              <span v-if="scope.row.unused_permissions.length > 2" class="text-gray-500">
                等{{ scope.row.unused_permissions.length }}个
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { UserFilled, User, Key, Grid } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { 
  getAnalyticsStats, 
  getRoleAnalysis, 
  getPermissionAnalysis, 
  getRoleChartData, 
  getModuleChartData,
  getAdminAnalysis,
  exportAnalyticsReport
} from '@/api/v1/accessAnalytics';

export default {
  name: 'AccessAnalytics',
  components: {
    UserFilled,
    User,
    Key,
    Grid
  },
  setup() {
    const roleChartRef = ref(null);
    const moduleChartRef = ref(null);
    let roleChart = null;
    let moduleChart = null;

    // 统计数据
    const stats = reactive({
      adminCount: 0,
      roleCount: 0,
      permissionCount: 0,
      moduleCount: 0
    });

    // 角色分析数据
    const roleAnalysis = ref([]);
    
    // 权限分析数据
    const permissionAnalysis = ref([]);

    // 获取统计数据
    const fetchStats = async () => {
      try {
        // 获取基础统计数据
        const statsResponse = await getAnalyticsStats();
        if (statsResponse.code === 0) {
          Object.assign(stats, statsResponse.data);
        }

        // 获取角色分析数据
        const roleResponse = await getRoleAnalysis();
        if (roleResponse.code === 0) {
          roleAnalysis.value = roleResponse.data;
        }

        // 获取权限分析数据
        const permissionResponse = await getPermissionAnalysis();
        if (permissionResponse.code === 0) {
          permissionAnalysis.value = permissionResponse.data;
        }

      } catch (error) {
        console.error('获取统计数据失败:', error);
        ElMessage.error('获取统计数据失败');
        
        // 如果API调用失败，使用默认数据
        stats.adminCount = 0;
        stats.roleCount = 0;
        stats.permissionCount = 0;
        stats.moduleCount = 0;
        roleAnalysis.value = [];
        permissionAnalysis.value = [];
      }
    };

    // 初始化角色权限分布图表
    const initRoleChart = async () => {
      if (!roleChartRef.value) return;
      
      roleChart = echarts.init(roleChartRef.value);
      
      try {
        const response = await getRoleChartData();
        let chartData = [];
        
        if (response.code === 0 && response.data.length > 0) {
          chartData = response.data;
        } else {
          // 默认数据
          chartData = [
            { name: '超级管理员', value: 62 },
            { name: '普通管理员', value: 25 }
          ];
        }
        
        const option = {
          title: {
            text: '角色权限分布',
            left: 'center'
          },
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          series: [
            {
              name: '权限数量',
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              label: {
                show: false,
                position: 'center'
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: '18',
                  fontWeight: 'bold'
                }
              },
              labelLine: {
                show: false
              },
              data: chartData
            }
          ]
        };
        
        roleChart.setOption(option);
      } catch (error) {
        console.error('获取角色图表数据失败:', error);
      }
    };

    // 初始化权限模块使用情况图表
    const initModuleChart = async () => {
      if (!moduleChartRef.value) return;
      
      moduleChart = echarts.init(moduleChartRef.value);
      
      try {
        const response = await getModuleChartData();
        let modules = [];
        let usageRates = [];
        
        if (response.code === 0 && response.data.length > 0) {
          modules = response.data.map(item => item.module);
          usageRates = response.data.map(item => item.usage_rate);
        } else {
          // 默认数据
          modules = ['仪表盘', '用户管理', '设备管理', '商城管理'];
          usageRates = [100, 75, 70, 67];
        }
        
        const option = {
          title: {
            text: '权限模块使用率',
            left: 'center'
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            }
          },
          xAxis: {
            type: 'category',
            data: modules,
            axisLabel: {
              rotate: 45
            }
          },
          yAxis: {
            type: 'value',
            max: 100,
            axisLabel: {
              formatter: '{value}%'
            }
          },
          series: [
            {
              name: '使用率',
              type: 'bar',
              data: usageRates,
              itemStyle: {
                color: function(params) {
                  const colors = ['#67C23A', '#E6A23C', '#F56C6C', '#909399'];
                  return colors[Math.floor(params.value / 25)] || '#409EFF';
                }
              }
            }
          ]
        };
        
        moduleChart.setOption(option);
      } catch (error) {
        console.error('获取模块图表数据失败:', error);
      }
    };

    // 刷新图表
    const refreshRoleChart = () => {
      if (roleChart) {
        roleChart.resize();
      }
    };

    const refreshModuleChart = () => {
      if (moduleChart) {
        moduleChart.resize();
      }
    };

    // 导出数据
    const exportRoleData = async () => {
      try {
        const response = await exportAnalyticsReport();
        if (response.code === 0) {
          ElMessage.success('角色数据导出成功');
        } else {
          ElMessage.info(response.data?.message || '导出功能开发中...');
        }
      } catch (error) {
        console.error('导出角色数据失败:', error);
        ElMessage.error('导出失败');
      }
    };

    const exportPermissionData = async () => {
      try {
        const response = await exportAnalyticsReport();
        if (response.code === 0) {
          ElMessage.success('权限数据导出成功');
        } else {
          ElMessage.info(response.data?.message || '导出功能开发中...');
        }
      } catch (error) {
        console.error('导出权限数据失败:', error);
        ElMessage.error('导出失败');
      }
    };

    // 获取进度条颜色
    const getProgressColor = (percentage) => {
      if (percentage >= 80) return '#67C23A';
      if (percentage >= 60) return '#E6A23C';
      if (percentage >= 40) return '#F56C6C';
      return '#909399';
    };

    onMounted(async () => {
      await fetchStats();
      await nextTick();
      initRoleChart();
      initModuleChart();
    });

    return {
      roleChartRef,
      moduleChartRef,
      stats,
      roleAnalysis,
      permissionAnalysis,
      refreshRoleChart,
      refreshModuleChart,
      exportRoleData,
      exportPermissionData,
      getProgressColor
    };
  }
};
</script>

<style scoped>
.access-analytics {
  padding: 24px;
}

.analytics-header {
  margin-bottom: 24px;
}

.analytics-header h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.analytics-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.admin-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.role-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.permission-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.module-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-container {
  height: 300px;
  width: 100%;
}

.analysis-tables {
  display: grid;
  gap: 20px;
}

.table-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mr-1 {
  margin-right: 4px;
}

.text-gray-500 {
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .access-analytics {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .stat-content {
    padding: 12px;
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
    margin-right: 12px;
  }
  
  .stat-number {
    font-size: 24px;
  }
}
</style> 