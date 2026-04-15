<template>
  <div class="error-stats-page">
    <van-nav-bar
      title="错误统计"
      left-text="返回"
      left-arrow
      @click-left="$router.go(-1)"
    />

    <div class="stats-container">
      <!-- 总体统计 -->
      <van-card class="stats-card">
        <template #title>
          <div class="card-title">总体统计</div>
        </template>
        <template #desc>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ errorStats.total }}</div>
              <div class="stat-label">总错误数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ criticalCount }}</div>
              <div class="stat-label">严重错误</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ highCount }}</div>
              <div class="stat-label">高级错误</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ mediumCount }}</div>
              <div class="stat-label">中级错误</div>
            </div>
          </div>
        </template>
      </van-card>

      <!-- 按类型统计 -->
      <van-card class="stats-card">
        <template #title>
          <div class="card-title">错误类型分布</div>
        </template>
        <template #desc>
          <div class="type-stats">
            <div 
              v-for="(count, type) in errorStats.byType" 
              :key="type"
              class="type-item"
            >
              <div class="type-name">{{ getTypeLabel(type) }}</div>
              <div class="type-count">{{ count }}</div>
              <div class="type-bar">
                <div 
                  class="type-bar-fill"
                  :style="{ width: (count / errorStats.total * 100) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </template>
      </van-card>

      <!-- 最近错误列表 -->
      <van-card class="stats-card">
        <template #title>
          <div class="card-title">最近错误 (最新10条)</div>
        </template>
        <template #desc>
          <div class="recent-errors">
            <div 
              v-for="error in errorStats.recent" 
              :key="error.id"
              class="error-item"
              @click="showErrorDetail(error)"
            >
              <div class="error-header">
                <span class="error-type">{{ getTypeLabel(error.type) }}</span>
                <span :class="['error-level', `level-${error.level}`]">
                  {{ getLevelLabel(error.level) }}
                </span>
                <span class="error-time">{{ formatTime(error.timestamp) }}</span>
              </div>
              <div class="error-message">{{ error.message }}</div>
              <div class="error-location" v-if="error.filename">
                {{ error.filename }}:{{ error.lineno }}
              </div>
            </div>
          </div>
        </template>
      </van-card>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button 
          type="primary" 
          block 
          @click="refreshStats"
          :loading="loading"
        >
          刷新统计
        </van-button>
        <van-button 
          type="warning" 
          block 
          @click="clearErrors"
          style="margin-top: 12px;"
        >
          清除错误记录
        </van-button>
      </div>
    </div>

    <!-- 错误详情弹窗 -->
    <van-popup 
      v-model:show="showDetail" 
      position="bottom" 
      :style="{ height: '70%' }"
    >
      <div class="error-detail">
        <van-nav-bar
          title="错误详情"
          left-text="关闭"
          @click-left="showDetail = false"
        />
        
        <div class="detail-content" v-if="selectedError">
          <van-cell-group>
            <van-cell title="错误ID" :value="selectedError.id" />
            <van-cell title="时间" :value="formatFullTime(selectedError.timestamp)" />
            <van-cell title="类型" :value="getTypeLabel(selectedError.type)" />
            <van-cell title="级别" :value="getLevelLabel(selectedError.level)" />
            <van-cell title="消息" :value="selectedError.message" />
            <van-cell title="文件" :value="selectedError.filename" v-if="selectedError.filename" />
            <van-cell title="行号" :value="selectedError.lineno" v-if="selectedError.lineno" />
            <van-cell title="列号" :value="selectedError.colno" v-if="selectedError.colno" />
            <van-cell title="URL" :value="selectedError.url" v-if="selectedError.url" />
          </van-cell-group>

          <!-- 堆栈信息 -->
          <div class="stack-section" v-if="selectedError.stack">
            <div class="section-title">堆栈信息</div>
            <div class="stack-content">{{ selectedError.stack }}</div>
          </div>

          <!-- 设备信息 -->
          <div class="device-section" v-if="selectedError.deviceInfo">
            <div class="section-title">设备信息</div>
            <van-cell-group>
              <van-cell 
                v-for="(value, key) in selectedError.deviceInfo" 
                :key="key"
                :title="key" 
                :value="String(value)" 
              />
            </van-cell-group>
          </div>

          <!-- 网络状态 -->
          <div class="network-section" v-if="selectedError.networkStatus">
            <div class="section-title">网络状态</div>
            <van-cell-group>
              <van-cell 
                v-for="(value, key) in selectedError.networkStatus" 
                :key="key"
                :title="key" 
                :value="String(value)" 
              />
            </van-cell-group>
          </div>

          <!-- 上下文信息 -->
          <div class="context-section" v-if="selectedError.context && Object.keys(selectedError.context).length > 0">
            <div class="section-title">上下文信息</div>
            <div class="context-content">{{ JSON.stringify(selectedError.context, null, 2) }}</div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getErrorStats, clearErrors as clearErrorsUtil } from '@/utils/error-monitor'
import { showToast, showConfirmDialog } from 'vant'

const errorStats = ref({
  total: 0,
  byType: {},
  byLevel: {},
  recent: []
})

const loading = ref(false)
const showDetail = ref(false)
const selectedError = ref(null)

// 计算各级别错误数量
const criticalCount = computed(() => errorStats.value.byLevel.critical || 0)
const highCount = computed(() => errorStats.value.byLevel.high || 0)
const mediumCount = computed(() => errorStats.value.byLevel.medium || 0)

// 获取错误统计
const refreshStats = async () => {
  loading.value = true
  try {
    errorStats.value = getErrorStats()
    showToast('统计已刷新')
  } catch (error) {
    console.error('获取错误统计失败:', error)
    showToast('获取统计失败')
  } finally {
    loading.value = false
  }
}

// 清除错误记录
const clearErrors = async () => {
  try {
    await showConfirmDialog({
      title: '确认清除',
      message: '确定要清除所有错误记录吗？此操作不可恢复。'
    })
    
    clearErrorsUtil()
    await refreshStats()
    showToast('错误记录已清除')
  } catch (error) {
    // 用户取消操作
  }
}

// 显示错误详情
const showErrorDetail = (error) => {
  selectedError.value = error
  showDetail.value = true
}

// 获取类型标签
const getTypeLabel = (type) => {
  const labels = {
    javascript: 'JavaScript',
    promise: 'Promise',
    network: '网络',
    api: 'API',
    wechat: '微信',
    vue: 'Vue',
    resource: '资源'
  }
  return labels[type] || type
}

// 获取级别标签
const getLevelLabel = (level) => {
  const labels = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '严重'
  }
  return labels[level] || level
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return Math.floor(diff / 60000) + '分钟前'
  } else if (diff < 86400000) { // 1天内
    return Math.floor(diff / 3600000) + '小时前'
  } else {
    return date.toLocaleDateString()
  }
}

// 格式化完整时间
const formatFullTime = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

onMounted(() => {
  refreshStats()
})
</script>

<style scoped>
.error-stats-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.stats-container {
  padding: 16px;
}

.stats-card {
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 12px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1989fa;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #969799;
}

.type-stats {
  margin-top: 12px;
}

.type-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.type-name {
  flex: 1;
  font-size: 14px;
  color: #323233;
}

.type-count {
  width: 40px;
  text-align: right;
  font-size: 14px;
  font-weight: 600;
  color: #1989fa;
  margin-right: 12px;
}

.type-bar {
  flex: 2;
  height: 6px;
  background-color: #f2f3f5;
  border-radius: 3px;
  overflow: hidden;
}

.type-bar-fill {
  height: 100%;
  background-color: #1989fa;
  transition: width 0.3s ease;
}

.recent-errors {
  margin-top: 12px;
}

.error-item {
  padding: 12px;
  background-color: #fff;
  border-radius: 6px;
  margin-bottom: 8px;
  border-left: 4px solid #f2f3f5;
  cursor: pointer;
  transition: all 0.2s ease;
}

.error-item:hover {
  background-color: #f8f9fa;
}

.error-item:last-child {
  margin-bottom: 0;
}

.error-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.error-type {
  background-color: #f2f3f5;
  color: #646566;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 8px;
}

.error-level {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 8px;
}

.level-low {
  background-color: #e8f5e8;
  color: #52c41a;
}

.level-medium {
  background-color: #fff7e6;
  color: #fa8c16;
}

.level-high {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.level-critical {
  background-color: #f6ffed;
  color: #722ed1;
}

.error-time {
  margin-left: auto;
  font-size: 12px;
  color: #969799;
}

.error-message {
  font-size: 14px;
  color: #323233;
  margin-bottom: 4px;
  line-height: 1.4;
}

.error-location {
  font-size: 12px;
  color: #969799;
}

.action-buttons {
  margin-top: 24px;
}

.error-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 16px 0 8px 0;
}

.stack-content,
.context-content {
  background-color: #f7f8fa;
  padding: 12px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  color: #323233;
}

.device-section,
.network-section {
  margin-top: 16px;
}
</style> 