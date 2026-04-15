<template>
  <div class="device-monitor-container">
    <van-nav-bar
      title="设备监控"
      left-arrow
      @click-left="$router.back()"
    />
    
    <div v-if="loading" class="loading-block">
      <van-loading color="#1989fa" size="24px">加载中...</van-loading>
    </div>
    
    <!-- 设备基本信息 -->
    <div v-else class="device-info-card">
      <div class="device-header">
        <div class="device-name">{{ deviceInfo.device_name || '我的净水器' }}</div>
        <div class="device-status" :class="deviceInfo.network_status === 1 ? 'online' : 'offline'">
          {{ deviceInfo.network_status === 1 ? '在线' : '离线' }}
        </div>
      </div>
      <div class="device-id">设备ID: {{ deviceInfo.device_id }}</div>
      
      <!-- 最后更新时间 -->
      <div class="update-time">
        最后更新: {{ formatDate(lastUpdateTime) }}
        <van-button size="mini" type="primary" plain @click="refreshData">刷新</van-button>
      </div>
      
      <!-- 实时监控数据 -->
      <div class="monitor-section">
        <div class="section-title">实时状态</div>
        
        <!-- 水质数据卡片 -->
        <div class="data-card">
          <div class="data-title">水质监测</div>
          <div class="data-grid">
            <div class="data-item">
              <div class="data-value">{{ deviceInfo.raw_water_value || '0' }}</div>
              <div class="data-label">原水TDS值</div>
            </div>
            <div class="data-item">
              <div class="data-value">{{ deviceInfo.purification_water_value || '0' }}</div>
              <div class="data-label">净水TDS值</div>
            </div>
            <div class="data-item">
              <div class="data-value">{{ calculatePurificationRate() }}%</div>
              <div class="data-label">净化率</div>
            </div>
            <div class="data-item">
              <div class="data-value">{{ getWaterQualityRating() }}</div>
              <div class="data-label">水质评级</div>
            </div>
          </div>
        </div>
        
        <!-- 使用状态卡片 -->
        <div class="data-card">
          <div class="data-title">使用状态</div>
          <div class="data-grid">
            <div class="data-item">
              <div class="data-value">{{ deviceInfo.billing_mode === 1 ? '流量计费' : '包年计费' }}</div>
              <div class="data-label">计费模式</div>
            </div>
            <div class="data-item" v-if="deviceInfo.billing_mode === 1">
              <div class="data-value">{{ formatFlow(deviceInfo.surplus_flow) }}</div>
              <div class="data-label">剩余流量</div>
            </div>
            <div class="data-item" v-else>
              <div class="data-value">{{ deviceInfo.remaining_days || 0 }}天</div>
              <div class="data-label">剩余天数</div>
            </div>
            <div class="data-item">
              <div class="data-value">{{ formatFlow(deviceInfo.today_usage) }}</div>
              <div class="data-label">今日用水</div>
            </div>
            <div class="data-item">
              <div class="data-value">{{ deviceInfo.current_status || '待机中' }}</div>
              <div class="data-label">当前状态</div>
            </div>
          </div>
        </div>
        
        <!-- 设备性能卡片 -->
        <div class="data-card">
          <div class="data-title">设备性能</div>
          <div class="data-grid">
            <div class="data-item">
              <div class="data-value">{{ deviceInfo.temperature || '25℃' }}</div>
              <div class="data-label">环境温度</div>
            </div>
            <div class="data-item">
              <div class="data-value">{{ deviceInfo.water_pressure || '0.2MPa' }}</div>
              <div class="data-label">水压</div>
            </div>
            <div class="data-item">
              <div class="data-value">{{ formatFlow(deviceInfo.flow_rate || 0) }}/分钟</div>
              <div class="data-label">流速</div>
            </div>
            <div class="data-item">
              <div class="data-value">{{ deviceInfo.system_version || '1.0.0' }}</div>
              <div class="data-label">系统版本</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 滤芯状态监控 -->
      <div class="monitor-section">
        <div class="section-title">滤芯状态监控</div>
        <div class="filter-list">
          <div class="filter-item" v-for="(filter, index) in deviceInfo.filters" :key="index">
            <div class="filter-header">
              <div class="filter-name">{{ filter.name }}</div>
              <div class="filter-percent">{{ filter.remaining_percent }}%</div>
            </div>
            <van-progress 
              :percentage="filter.remaining_percent" 
              :color="getFilterColor(filter.remaining_percent)"
              track-color="#f5f5f5"
              :stroke-width="10"
            />
            <div class="filter-info">
              <span>剩余{{ filter.remaining_days || 0 }}天</span>
              <span>{{ filter.status === 'normal' ? '状态正常' : '需要更换' }}</span>
            </div>
          </div>
          
          <div class="filter-empty" v-if="!deviceInfo.filters || deviceInfo.filters.length === 0">
            <van-empty description="暂无滤芯信息" />
          </div>
        </div>
      </div>
      
      <!-- 用水趋势分析 -->
      <div class="monitor-section">
        <div class="section-title">用水趋势分析</div>
        <div class="chart-container">
          <div class="chart-placeholder" v-if="!deviceInfo.water_trends || deviceInfo.water_trends.length === 0">
            <van-empty description="暂无用水趋势数据" />
          </div>
          <!-- 用水趋势图表将在这里实现 -->
          <div class="usage-summary" v-else>
            <div class="summary-item">
              <div class="summary-value">{{ formatFlow(deviceInfo.month_usage) }}</div>
              <div class="summary-label">本月用水量</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">{{ formatFlow(deviceInfo.cumulative_filtration_flow) }}</div>
              <div class="summary-label">累计制水量</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">{{ formatBottleCount(deviceInfo.cumulative_filtration_flow) }}瓶</div>
              <div class="summary-label">相当于</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button type="primary" block @click="goToDetail">设备详情</van-button>
        <van-button type="warning" block @click="goToMaintenance">预约维护</van-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showSuccessToast, showFailToast } from 'vant';
import { getPurifierDeviceMonitor } from '@/api/user';

export default {
  name: 'DeviceMonitor',
  
  setup() {
    const route = useRoute();
    const router = useRouter();
    const loading = ref(true);
    const deviceInfo = ref({
      device_id: '',
      device_name: '',
      network_status: 0,
      raw_water_value: 0,
      purification_water_value: 0,
      billing_mode: 0,
      surplus_flow: 0,
      remaining_days: 0,
      today_usage: 0,
      month_usage: 0,
      cumulative_filtration_flow: 0,
      current_status: '',
      temperature: '',
      water_pressure: '',
      flow_rate: 0,
      system_version: '',
      water_trends: [],
      filters: []
    });
    const lastUpdateTime = ref(new Date());
    let refreshTimer = null;
    
    // 格式化日期
    const formatDate = (date) => {
      return date.toLocaleString('zh-CN', { 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };
    
    // 格式化流量
    const formatFlow = (flow) => {
      if (!flow) return '0L';
      return `${parseFloat(flow).toFixed(1)}L`;
    };
    
    // 格式化瓶数 (1L = 2瓶)
    const formatBottleCount = (flow) => {
      if (!flow) return '0';
      return `${Math.round(parseFloat(flow) * 2)}`;
    };
    
    // 获取滤芯颜色
    const getFilterColor = (percent) => {
      if (percent <= 20) return '#ee0a24';
      if (percent <= 50) return '#ff9500';
      return '#07c160';
    };
    
    // 计算净化率
    const calculatePurificationRate = () => {
      const raw = parseFloat(deviceInfo.value.raw_water_value) || 0;
      const pure = parseFloat(deviceInfo.value.purification_water_value) || 0;
      
      if (raw === 0) return '0';
      
      const rate = ((raw - pure) / raw * 100).toFixed(1);
      return isNaN(rate) ? '0' : rate;
    };
    
    // 获取水质评级
    const getWaterQualityRating = () => {
      const pure = parseFloat(deviceInfo.value.purification_water_value) || 0;
      
      if (pure === 0) return '未知';
      if (pure < 50) return '优';
      if (pure < 100) return '良';
      if (pure < 200) return '一般';
      return '差';
    };
    
    // 获取设备监控数据
    const getDeviceMonitorData = async () => {
      loading.value = true;
      try {
        const deviceId = route.params.id;
        if (!deviceId) {
          showFailToast('设备ID不能为空');
          router.back();
          return;
        }
        
        const res = await getPurifierDeviceMonitor(deviceId);
        if (res.code === 0) {
          deviceInfo.value = res.data || {};
          // 确保filters是数组
          if (!deviceInfo.value.filters) {
            deviceInfo.value.filters = [];
          }
          // 确保water_trends是数组
          if (!deviceInfo.value.water_trends) {
            deviceInfo.value.water_trends = [];
          }
          lastUpdateTime.value = new Date();
        } else {
          showFailToast(res.message || '获取设备监控数据失败');
        }
      } catch (error) {
        console.error('获取设备监控数据失败:', error);
        showFailToast('获取设备监控数据失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 刷新数据
    const refreshData = () => {
      getDeviceMonitorData();
      showToast('刷新成功');
    };
    
    // 跳转到设备详情
    const goToDetail = () => {
      router.push(`/purifier/device-detail/${deviceInfo.value.device_id}`);
    };
    
    // 跳转到维护预约
    const goToMaintenance = () => {
      router.push('/user/orders?type=maintenance');
    };
    
    // 组件挂载后获取数据
    onMounted(() => {
      getDeviceMonitorData();
      
      // 设置定时刷新 (每30秒刷新一次)
      refreshTimer = setInterval(() => {
        getDeviceMonitorData();
      }, 30000);
    });
    
    // 组件销毁前清除定时器
    onUnmounted(() => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    });
    
    return {
      loading,
      deviceInfo,
      lastUpdateTime,
      formatDate,
      formatFlow,
      formatBottleCount,
      getFilterColor,
      calculatePurificationRate,
      getWaterQualityRating,
      refreshData,
      goToDetail,
      goToMaintenance
    };
  }
};
</script>

<style scoped>
.device-monitor-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.loading-block {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.device-info-card {
  padding: 0 16px;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0 8px;
}

.device-name {
  font-size: 18px;
  font-weight: bold;
}

.device-status {
  font-size: 14px;
  padding: 2px 10px;
  border-radius: 12px;
}

.device-status.online {
  background-color: #e8f7ef;
  color: #07c160;
}

.device-status.offline {
  background-color: #fef0f0;
  color: #ee0a24;
}

.device-id {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.update-time {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
  margin-bottom: 16px;
}

.monitor-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
  border-left: 3px solid #1989fa;
  padding-left: 8px;
}

.data-card {
  background-color: #f8f8f8;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.data-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.data-item {
  text-align: center;
  padding: 8px;
  background-color: #fff;
  border-radius: 6px;
}

.data-value {
  font-size: 18px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 4px;
}

.data-label {
  font-size: 12px;
  color: #999;
}

.filter-list {
  margin-top: 12px;
}

.filter-item {
  margin-bottom: 16px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.filter-name {
  font-size: 14px;
}

.filter-percent {
  font-size: 14px;
  font-weight: bold;
}

.filter-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.filter-empty {
  padding: 20px 0;
}

.chart-container {
  min-height: 200px;
}

.chart-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.usage-summary {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
}

.summary-item {
  text-align: center;
}

.summary-value {
  font-size: 18px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 4px;
}

.summary-label {
  font-size: 12px;
  color: #999;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}
</style> 