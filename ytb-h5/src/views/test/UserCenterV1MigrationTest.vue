<template>
  <div class="migration-test-container">
    <van-nav-bar title="用户中心V1迁移测试" left-arrow @click-left="goBack" />
    
    <div class="test-section">
      <h3>🔄 个人中心API迁移测试</h3>
      
      <div class="test-results">
        <div class="test-item">
          <h4>1. 获取用户信息 (getUserInfo)</h4>
          <van-button 
            type="primary" 
            size="small" 
            @click="testGetUserInfo"
            :loading="loading.getUserInfo"
          >
            测试获取用户信息
          </van-button>
          <div class="result-box" v-if="results.getUserInfo">
            <div :class="['status', results.getUserInfo.success ? 'success' : 'error']">
              {{ results.getUserInfo.success ? '✅ 成功' : '❌ 失败' }}
            </div>
            <div class="response">
              <strong>API来源:</strong> {{ results.getUserInfo.source }}<br>
              <strong>响应时间:</strong> {{ results.getUserInfo.time }}ms<br>
              <strong>状态码:</strong> {{ results.getUserInfo.code }}<br>
              <strong>消息:</strong> {{ results.getUserInfo.message }}<br>
              <details>
                <summary>完整响应</summary>
                <pre>{{ JSON.stringify(results.getUserInfo.data, null, 2) }}</pre>
              </details>
            </div>
          </div>
        </div>

        <div class="test-item">
          <h4>2. 获取用户资产 (getUserAssets)</h4>
          <van-button 
            type="primary" 
            size="small" 
            @click="testGetUserAssets"
            :loading="loading.getUserAssets"
          >
            测试获取用户资产
          </van-button>
          <div class="result-box" v-if="results.getUserAssets">
            <div :class="['status', results.getUserAssets.success ? 'success' : 'error']">
              {{ results.getUserAssets.success ? '✅ 成功' : '❌ 失败' }}
            </div>
            <div class="response">
              <strong>API来源:</strong> {{ results.getUserAssets.source }}<br>
              <strong>响应时间:</strong> {{ results.getUserAssets.time }}ms<br>
              <strong>状态码:</strong> {{ results.getUserAssets.code }}<br>
              <strong>消息:</strong> {{ results.getUserAssets.message }}<br>
              <details>
                <summary>完整响应</summary>
                <pre>{{ JSON.stringify(results.getUserAssets.data, null, 2) }}</pre>
              </details>
            </div>
          </div>
        </div>

        <div class="test-item">
          <h4>3. 获取订单统计 (getOrderStats)</h4>
          <van-button 
            type="primary" 
            size="small" 
            @click="testGetOrderStats"
            :loading="loading.getOrderStats"
          >
            测试获取订单统计
          </van-button>
          <div class="result-box" v-if="results.getOrderStats">
            <div :class="['status', results.getOrderStats.success ? 'success' : 'error']">
              {{ results.getOrderStats.success ? '✅ 成功' : '❌ 失败' }}
            </div>
            <div class="response">
              <strong>API来源:</strong> {{ results.getOrderStats.source }}<br>
              <strong>响应时间:</strong> {{ results.getOrderStats.time }}ms<br>
              <strong>状态码:</strong> {{ results.getOrderStats.code }}<br>
              <strong>消息:</strong> {{ results.getOrderStats.message }}<br>
              <details>
                <summary>完整响应</summary>
                <pre>{{ JSON.stringify(results.getOrderStats.data, null, 2) }}</pre>
              </details>
            </div>
          </div>
        </div>
      </div>

      <div class="test-actions">
        <van-button 
          type="success" 
          @click="testAll"
          :loading="loading.all"
          block
        >
          🚀 测试所有API
        </van-button>
      </div>

      <div class="migration-summary">
        <h4>📊 迁移总结</h4>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="label">总测试数:</span>
            <span class="value">{{ totalTests }}</span>
          </div>
          <div class="stat-item">
            <span class="label">成功数:</span>
            <span class="value success">{{ successfulTests }}</span>
          </div>
          <div class="stat-item">
            <span class="label">V1 API使用率:</span>
            <span class="value">{{ v1UsagePercentage }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Button, showToast } from 'vant'
import { getUserInfo, getUserAssets, getOrderStats } from '@/api/user'

const router = useRouter()

const loading = ref({
  getUserInfo: false,
  getUserAssets: false,
  getOrderStats: false,
  all: false
})

const results = ref({
  getUserInfo: null,
  getUserAssets: null,
  getOrderStats: null
})

// 计算统计信息
const totalTests = computed(() => {
  return Object.keys(results.value).filter(key => results.value[key]).length
})

const successfulTests = computed(() => {
  return Object.keys(results.value).filter(key => 
    results.value[key] && results.value[key].success
  ).length
})

const v1UsagePercentage = computed(() => {
  const v1Tests = Object.keys(results.value).filter(key => 
    results.value[key] && results.value[key].source === 'V1 API'
  ).length
  return totalTests.value > 0 ? Math.round((v1Tests / totalTests.value) * 100) : 0
})

const goBack = () => {
  router.back()
}

// 测试获取用户信息
const testGetUserInfo = async () => {
  loading.value.getUserInfo = true
  const startTime = Date.now()
  
  try {
    console.log('🧪 [测试] 开始测试获取用户信息')
    const response = await getUserInfo()
    const endTime = Date.now()
    
    results.value.getUserInfo = {
      success: response.code === 0,
      code: response.code,
      message: response.message || 'success',
      data: response.data,
      time: endTime - startTime,
      source: response._apiSource || '未知'
    }
    
    console.log('✅ [测试] 用户信息测试完成:', results.value.getUserInfo)
    showToast(`用户信息测试${results.value.getUserInfo.success ? '成功' : '失败'}`)
    
  } catch (error) {
    const endTime = Date.now()
    console.error('❌ [测试] 用户信息测试失败:', error)
    
    results.value.getUserInfo = {
      success: false,
      code: error.response?.data?.code || 500,
      message: error.message || '测试失败',
      data: error.response?.data || null,
      time: endTime - startTime,
      source: '错误'
    }
    
    showToast('用户信息测试失败')
  } finally {
    loading.value.getUserInfo = false
  }
}

// 测试获取用户资产
const testGetUserAssets = async () => {
  loading.value.getUserAssets = true
  const startTime = Date.now()
  
  try {
    console.log('🧪 [测试] 开始测试获取用户资产')
    const response = await getUserAssets()
    const endTime = Date.now()
    
    results.value.getUserAssets = {
      success: response.code === 0,
      code: response.code,
      message: response.message || 'success',
      data: response.data,
      time: endTime - startTime,
      source: response._apiSource || '未知'
    }
    
    console.log('✅ [测试] 用户资产测试完成:', results.value.getUserAssets)
    showToast(`用户资产测试${results.value.getUserAssets.success ? '成功' : '失败'}`)
    
  } catch (error) {
    const endTime = Date.now()
    console.error('❌ [测试] 用户资产测试失败:', error)
    
    results.value.getUserAssets = {
      success: false,
      code: error.response?.data?.code || 500,
      message: error.message || '测试失败',
      data: error.response?.data || null,
      time: endTime - startTime,
      source: '错误'
    }
    
    showToast('用户资产测试失败')
  } finally {
    loading.value.getUserAssets = false
  }
}

// 测试获取订单统计
const testGetOrderStats = async () => {
  loading.value.getOrderStats = true
  const startTime = Date.now()
  
  try {
    console.log('🧪 [测试] 开始测试获取订单统计')
    const response = await getOrderStats()
    const endTime = Date.now()
    
    results.value.getOrderStats = {
      success: response.code === 0,
      code: response.code,
      message: response.message || 'success',
      data: response.data,
      time: endTime - startTime,
      source: response._apiSource || '未知'
    }
    
    console.log('✅ [测试] 订单统计测试完成:', results.value.getOrderStats)
    showToast(`订单统计测试${results.value.getOrderStats.success ? '成功' : '失败'}`)
    
  } catch (error) {
    const endTime = Date.now()
    console.error('❌ [测试] 订单统计测试失败:', error)
    
    results.value.getOrderStats = {
      success: false,
      code: error.response?.data?.code || 500,
      message: error.message || '测试失败',
      data: error.response?.data || null,
      time: endTime - startTime,
      source: '错误'
    }
    
    showToast('订单统计测试失败')
  } finally {
    loading.value.getOrderStats = false
  }
}

// 测试所有API
const testAll = async () => {
  loading.value.all = true
  
  try {
    console.log('🚀 [测试] 开始测试所有个人中心API')
    showToast.loading('正在测试所有API...')
    
    await Promise.all([
      testGetUserInfo(),
      testGetUserAssets(),
      testGetOrderStats()
    ])
    
    showToast.clear()
    showToast(`测试完成！成功率: ${Math.round((successfulTests.value / totalTests.value) * 100)}%`)
    
  } catch (error) {
    console.error('❌ [测试] 批量测试失败:', error)
    showToast.clear()
    showToast('批量测试失败')
  } finally {
    loading.value.all = false
  }
}
</script>

<style scoped>
.migration-test-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.test-section {
  padding: 16px;
}

.test-section h3 {
  margin: 0 0 20px 0;
  color: #323233;
  font-size: 18px;
  font-weight: 600;
}

.test-results {
  margin-bottom: 20px;
}

.test-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.test-item h4 {
  margin: 0 0 12px 0;
  color: #323233;
  font-size: 16px;
  font-weight: 500;
}

.result-box {
  margin-top: 12px;
  padding: 12px;
  background-color: #f7f8fa;
  border-radius: 6px;
  border-left: 4px solid #ddd;
}

.status {
  font-weight: 600;
  margin-bottom: 8px;
}

.status.success {
  color: #07c160;
  border-left-color: #07c160;
}

.status.error {
  color: #ee0a24;
  border-left-color: #ee0a24;
}

.response {
  font-size: 14px;
  line-height: 1.5;
  color: #646566;
}

.response details {
  margin-top: 8px;
}

.response summary {
  cursor: pointer;
  color: #1989fa;
  font-weight: 500;
}

.response pre {
  background-color: #f2f3f5;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.test-actions {
  margin-bottom: 20px;
}

.migration-summary {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.migration-summary h4 {
  margin: 0 0 12px 0;
  color: #323233;
  font-size: 16px;
  font-weight: 500;
}

.summary-stats {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background-color: #f7f8fa;
  border-radius: 6px;
  flex: 1;
  min-width: 80px;
}

.stat-item .label {
  font-size: 12px;
  color: #969799;
  margin-bottom: 4px;
}

.stat-item .value {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.stat-item .value.success {
  color: #07c160;
}
</style> 