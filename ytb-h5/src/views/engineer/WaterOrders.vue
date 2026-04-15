<template>
  <div class="water-orders">
    <!-- 标题栏 -->
    <div class="header">
      <van-nav-bar title="滤芯预警" left-arrow @click-left="$router.go(-1)" />
    </div>

    <!-- 简洁的统计信息 -->
    <div class="simple-stats">
      <div class="stat-item">
        <span class="count">{{ filterStats.critical_count || 0 }}</span>
        <span class="label">严重预警</span>
      </div>
      <div class="stat-item">
        <span class="count">{{ filterStats.warning_count || 0 }}</span>
        <span class="label">一般预警</span>
      </div>
      <div class="stat-item">
        <span class="count">{{ filterStats.total_devices || 0 }}</span>
        <span class="label">监控设备</span>
      </div>
    </div>

    <!-- 工单列表标题 -->
    <div class="list-header">
      <h3>需要处理的滤芯预警</h3>
    </div>

    <!-- 工单列表 -->
    <WaterOrderList 
      :type="'filter_alert'" 
      :status="'pending'"
      @refresh="loadFilterStats"
    />
  </div>
</template>

<script>
import WaterOrderList from './components/WaterOrderList.vue'

export default {
  name: 'WaterOrders',
  components: {
    WaterOrderList
  },
  data() {
    return {
      filterStats: {
        critical_count: 0,
        warning_count: 0,
        total_devices: 0
      },
      orderType: 'filter_alert'
    }
  },
  mounted() {
    this.loadFilterStats()
  },
  methods: {
    async loadFilterStats() {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          console.error('未找到登录token')
          return
        }

        const response = await fetch('/api/mobile/v1/engineer/filter-alert-stats', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.code === 0 && result.data) {
          this.filterStats = result.data
        } else {
          console.error('API返回错误:', result.message)
        }
      } catch (error) {
        console.error('加载滤芯预警统计数据失败:', error)
      }
    }
  }
}
</script>

<style scoped>
.water-orders {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* 简洁统计样式 */
.simple-stats {
  display: flex;
  justify-content: space-around;
  background: white;
  padding: 20px;
  margin: 10px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stat-item {
  text-align: center;
}

.stat-item .count {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 4px;
}

.stat-item .label {
  font-size: 14px;
  color: #666;
}

.list-header {
  padding: 20px;
  background: white;
  margin: 10px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.list-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}
</style>
