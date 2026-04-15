<template>
  <div class="targets-container">
    <!-- 移除头部导航条，界面更简洁 -->
    
    <div class="content">
      <!-- 目标概览卡片 -->
      <div class="targets-overview">
        <div class="card-title">目标概览</div>
        <div class="tabs">
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'month' }" 
            @click="activeTab = 'month'"
          >
            月度目标
          </div>
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'year' }" 
            @click="activeTab = 'year'"
          >
            年度目标
          </div>
        </div>
        
        <!-- 月度目标详情 -->
        <div v-if="activeTab === 'month'" class="target-detail">
          <div class="target-header">
            <div class="target-period">{{ currentMonth }}</div>
            <div class="target-status" :class="getStatusClass(monthTargetData.status)">
              {{ getStatusText(monthTargetData.status) }}
            </div>
          </div>
          
          <div class="target-progress">
            <div class="progress-header">
              <div class="progress-title">销量目标</div>
              <div class="progress-value">{{ monthTargetData.achievement || 0 }}/{{ monthTargetData.target_quantity || 0 }} 台</div>
            </div>
            <Progress
              :percentage="getPercentage(monthTargetData.achievement, monthTargetData.target_quantity)"
              :show-pivot="false"
              stroke-width="10"
              :color="getProgressColor(monthTargetData.status)"
            />
            <div class="progress-info">
              <div>距离目标还差 {{ getRemaining(monthTargetData.achievement, monthTargetData.target_quantity) }} 台</div>
              <div>完成率 {{ getPercentage(monthTargetData.achievement, monthTargetData.target_quantity) }}%</div>
            </div>
          </div>
          
          <div class="target-details">
            <div class="detail-item">
              <div class="detail-label">开始日期</div>
              <div class="detail-value">{{ formatDate(monthTargetData.start_date) }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">结束日期</div>
              <div class="detail-value">{{ formatDate(monthTargetData.end_date) }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">备注</div>
              <div class="detail-value">{{ monthTargetData.remarks || '无' }}</div>
            </div>
          </div>
        </div>
        
        <!-- 年度目标详情 -->
        <div v-if="activeTab === 'year'" class="target-detail">
          <div class="target-header">
            <div class="target-period">{{ currentYear }}</div>
            <div class="target-status" :class="getStatusClass(yearTargetData.status)">
              {{ getStatusText(yearTargetData.status) }}
            </div>
          </div>
          
          <div class="target-progress">
            <div class="progress-header">
              <div class="progress-title">销量目标</div>
              <div class="progress-value">{{ yearTargetData.achievement || 0 }}/{{ yearTargetData.target_quantity || 0 }} 台</div>
            </div>
            <Progress
              :percentage="getPercentage(yearTargetData.achievement, yearTargetData.target_quantity)"
              :show-pivot="false"
              stroke-width="10"
              :color="getProgressColor(yearTargetData.status)"
            />
            <div class="progress-info">
              <div>距离目标还差 {{ getRemaining(yearTargetData.achievement, yearTargetData.target_quantity) }} 台</div>
              <div>完成率 {{ getPercentage(yearTargetData.achievement, yearTargetData.target_quantity) }}%</div>
            </div>
          </div>
          
          <div class="target-details">
            <div class="detail-item">
              <div class="detail-label">开始日期</div>
              <div class="detail-value">{{ formatDate(yearTargetData.start_date) }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">结束日期</div>
              <div class="detail-value">{{ formatDate(yearTargetData.end_date) }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">备注</div>
              <div class="detail-value">{{ yearTargetData.remarks || '无' }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 历史目标列表 -->
      <div class="historical-targets">
        <div class="card-title">历史目标</div>
        <div class="filter-tabs">
          <div 
            class="filter-tab" 
            :class="{ active: filterType === 'all' }" 
            @click="filterType = 'all'"
          >
            全部
          </div>
          <div 
            class="filter-tab" 
            :class="{ active: filterType === 'month' }" 
            @click="filterType = 'month'"
          >
            月度
          </div>
          <div 
            class="filter-tab" 
            :class="{ active: filterType === 'year' }" 
            @click="filterType = 'year'"
          >
            年度
          </div>
        </div>
        
        <div class="targets-list">
          <div v-if="filteredTargets.length === 0" class="empty-list">
            <Icon name="flag-o" size="40" color="#cccccc" />
            <div>暂无历史目标数据</div>
          </div>
          
          <div v-for="(target, index) in filteredTargets" :key="index" class="target-item">
            <div class="target-item-left">
              <div class="target-period-label">{{ getTargetPeriodLabel(target) }}</div>
              <div class="target-item-info">
                销量目标：{{ target.achievement || 0 }}/{{ target.target_quantity || 0 }} 台
              </div>
              <div class="target-item-date">
                {{ formatDate(target.start_date) }} 至 {{ formatDate(target.end_date) }}
              </div>
            </div>
            <div class="target-item-right">
              <div class="target-item-status" :class="getStatusClass(target.status)">
                {{ getStatusText(target.status) }}
              </div>
              <div class="target-item-completion">
                完成率: {{ getPercentage(target.achievement, target.target_quantity) }}%
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="hasMoreTargets" class="load-more" @click="loadMoreTargets">
          <Icon name="arrow-down" size="16" />
          <span>加载更多</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Progress, Icon } from 'vant'
import Toast from '@/utils/toast-fix'
import { useUserStore } from '@/stores/user'

// 用户状态
const userStore = useUserStore()

// 激活的目标类型选项卡
const activeTab = ref('month')

// 目标列表筛选类型
const filterType = ref('all')

// 目标数据
const monthTargetData = ref({
  target_quantity: 30,
  achievement: 0,
  status: 'in_progress',
  start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  remarks: '当月销售目标'
})

const yearTargetData = ref({
  target_quantity: 360,
  achievement: 0,
  status: 'in_progress',
  start_date: new Date(new Date().getFullYear(), 0, 1),
  end_date: new Date(new Date().getFullYear(), 11, 31),
  remarks: '年度销售目标'
})

// 历史目标列表
const historicalTargets = ref([])
const page = ref(1)
const pageSize = ref(10)
const hasMoreTargets = ref(false)

// 获取当前月份和年份
const currentMonth = ref(new Date().getFullYear() + '年' + (new Date().getMonth() + 1) + '月')
const currentYear = ref(new Date().getFullYear() + '年')

// 过滤目标列表
const filteredTargets = computed(() => {
  if (filterType.value === 'all') {
    return historicalTargets.value
  } else {
    return historicalTargets.value.filter(target => target.period_type === filterType.value)
  }
})

// 获取目标状态文字
const getStatusText = (status) => {
  const statusMap = {
    'in_progress': '进行中',
    'completed': '已完成',
    'failed': '未达标'
  }
  return statusMap[status] || '未知'
}

// 获取目标状态类名
const getStatusClass = (status) => {
  const classMap = {
    'in_progress': 'status-progress',
    'completed': 'status-completed',
    'failed': 'status-failed'
  }
  return classMap[status] || ''
}

// 获取目标进度颜色
const getProgressColor = (status) => {
  const colorMap = {
    'in_progress': '#1989fa',
    'completed': '#07c160',
    'failed': '#ee0a24'
  }
  return colorMap[status] || '#1989fa'
}

// 计算目标完成百分比
const getPercentage = (achievement, target) => {
  const achieved = parseFloat(achievement) || 0
  const targetValue = parseFloat(target) || 1
  return Math.min(Math.floor((achieved / targetValue) * 100), 100)
}

// 计算距离目标差距
const getRemaining = (achievement, target) => {
  const achieved = parseFloat(achievement) || 0
  const targetValue = parseFloat(target) || 0
  return Math.max(targetValue - achieved, 0)
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '未设置'
  
  if (typeof date === 'string') {
    date = new Date(date)
  }
  
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 获取目标期间标签
const getTargetPeriodLabel = (target) => {
  if (!target.period) return '未设置期间'
  
  if (target.period_type === 'month') {
    return target.period.replace('-', '年') + '月'
  } else if (target.period_type === 'year') {
    return target.period + '年'
  } else {
    return target.period
  }
}

// 加载目标数据
const fetchTargetData = async () => {
  try {
    Toast.loading({
      message: '加载中...',
      forbidClick: true
    })
    
    // 构建API请求URL
    const token = localStorage.getItem('token') || ''
    const apiUrl = `https://pay.itapgo.com/Tapp/admin/api/user/salesman_targets.php?token=${encodeURIComponent(token)}`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('获取目标数据失败: ' + response.status)
    }
    
    const result = await response.json()
    
    if (result.code === 0 && result.data) {
      console.log('获取到目标数据', result.data)
      
      // 更新月度目标数据
      if (result.data.currentMonthTarget) {
        monthTargetData.value = result.data.currentMonthTarget
      }
      
      // 更新年度目标数据
      if (result.data.currentYearTarget) {
        yearTargetData.value = result.data.currentYearTarget
      }
      
      // 更新历史目标列表
      if (result.data.historicalTargets && result.data.historicalTargets.length > 0) {
        historicalTargets.value = result.data.historicalTargets
        hasMoreTargets.value = result.data.hasMore || false
      }
    } else {
      console.error('获取目标数据返回错误:', result.message)
      Toast({ type: 'fail', message: result.message || '获取目标数据失败' })
    }
    
    Toast.clear()
  } catch (error) {
    console.error('获取目标数据出错:', error)
    Toast.clear()
    Toast({ type: 'fail', message: '获取目标数据失败：' + error.message })
    
    // 使用模拟数据
    useDefaultData()
  }
}

// 加载更多历史目标
const loadMoreTargets = async () => {
  if (!hasMoreTargets.value) return
  
  try {
    Toast.loading({
      message: '加载更多...',
      forbidClick: true
    })
    
    // 增加页码
    page.value++
    
    // 构建API请求URL
    const token = localStorage.getItem('token') || ''
    const apiUrl = `https://pay.itapgo.com/Tapp/admin/api/user/salesman_targets.php?token=${encodeURIComponent(token)}&page=${page.value}&pageSize=${pageSize.value}`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('获取更多目标数据失败: ' + response.status)
    }
    
    const result = await response.json()
    
    if (result.code === 0 && result.data) {
      console.log('获取到更多目标数据', result.data)
      
      // 追加历史目标列表
      if (result.data.historicalTargets && result.data.historicalTargets.length > 0) {
        historicalTargets.value.push(...result.data.historicalTargets)
        hasMoreTargets.value = result.data.hasMore || false
      } else {
        hasMoreTargets.value = false
      }
    } else {
      console.error('获取更多目标数据返回错误:', result.message)
      Toast({ type: 'fail', message: result.message || '获取更多目标数据失败' })
    }
    
    Toast.clear()
  } catch (error) {
    console.error('获取更多目标数据出错:', error)
    Toast.clear()
    Toast({ type: 'fail', message: '获取更多目标数据失败：' + error.message })
    hasMoreTargets.value = false
  }
}

// 使用默认数据（当API调用失败时）
const useDefaultData = () => {
  // 保持现有的默认目标数据不变
  
  // 设置示例历史目标
  historicalTargets.value = [
    {
      id: 1,
      period_type: 'month',
      period: '2023-04',
      target_quantity: 30,
      achievement: 28,
      status: 'failed',
      start_date: new Date(2023, 3, 1),
      end_date: new Date(2023, 3, 30)
    },
    {
      id: 2,
      period_type: 'month',
      period: '2023-03',
      target_quantity: 30,
      achievement: 33,
      status: 'completed',
      start_date: new Date(2023, 2, 1),
      end_date: new Date(2023, 2, 31)
    },
    {
      id: 3,
      period_type: 'month',
      period: '2023-02',
      target_quantity: 25,
      achievement: 27,
      status: 'completed',
      start_date: new Date(2023, 1, 1),
      end_date: new Date(2023, 1, 28)
    }
  ]
  
  hasMoreTargets.value = false
}

// 初始化
onMounted(() => {
  // 加载目标数据
  fetchTargetData()
})
</script>

<style scoped>
.targets-container {
  background-color: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 20px;
  padding-top: 20px; /* 添加顶部内边距替代导航条空间 */
}

.content {
  padding: 0 12px;
}

/* 目标概览卡片 */
.targets-overview {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 15px;
}

.tabs {
  display: flex;
  background-color: #f7f8fa;
  border-radius: 16px;
  padding: 2px;
  margin-bottom: 15px;
}

.tab-item {
  flex: 1;
  text-align: center;
  font-size: 14px;
  color: #666;
  padding: 8px 0;
  border-radius: 14px;
  transition: all 0.3s;
  cursor: pointer;
}

.tab-item.active {
  background-color: #1989fa;
  color: #fff;
  font-weight: 500;
}

.target-detail {
  margin-top: 10px;
}

.target-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.target-period {
  font-size: 16px;
  font-weight: 500;
}

.target-status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.status-progress {
  background-color: #e6f7ff;
  color: #1989fa;
}

.status-completed {
  background-color: #e6fff0;
  color: #07c160;
}

.status-failed {
  background-color: #ffece6;
  color: #ee0a24;
}

.target-progress {
  margin-bottom: 15px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-title {
  font-size: 14px;
  color: #666;
}

.progress-value {
  font-size: 14px;
  color: #1989fa;
  font-weight: 500;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  margin-top: 6px;
}

.target-details {
  border-top: 1px solid #f5f5f5;
  padding-top: 15px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
}

.detail-label {
  color: #666;
}

.detail-value {
  color: #333;
}

/* 历史目标列表 */
.historical-targets {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.filter-tabs {
  display: flex;
  margin-bottom: 15px;
}

.filter-tab {
  margin-right: 15px;
  font-size: 14px;
  color: #666;
  padding-bottom: 5px;
  position: relative;
  cursor: pointer;
}

.filter-tab.active {
  color: #1989fa;
  font-weight: 500;
}

.filter-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #1989fa;
  border-radius: 1px;
}

.targets-list {
  margin-top: 10px;
}

.empty-list {
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 14px;
}

.target-item {
  display: flex;
  justify-content: space-between;
  padding: 15px 0;
  border-bottom: 1px solid #f5f5f5;
}

.target-item:last-child {
  border-bottom: none;
}

.target-period-label {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.target-item-info {
  font-size: 14px;
  color: #666;
  margin-bottom: 3px;
}

.target-item-date {
  font-size: 12px;
  color: #999;
}

.target-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
}

.target-item-status {
  margin-bottom: 5px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.target-item-completion {
  font-size: 12px;
  color: #666;
}

.load-more {
  margin-top: 15px;
  text-align: center;
  color: #999;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.load-more span {
  margin-left: 5px;
}
</style> 