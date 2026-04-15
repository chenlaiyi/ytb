<template>
  <div class="dividend-detail-page">
    <van-nav-bar
      title="分红详情"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
    />

    <div class="detail-container" v-if="!loading && dividendDetail">
      <!-- 分红金额卡片 -->
      <div class="amount-card">
        <div class="amount-header">
          <div class="amount-type" :class="getTypeClass(dividendDetail.type, dividendDetail.level)">
            <van-icon :name="getTypeIcon(dividendDetail.type)" />
            <span>{{ getTypeLabel(dividendDetail.type, dividendDetail.level) }}</span>
          </div>
          <div class="amount-status">
            <van-tag :type="getStatusType(dividendDetail.status)">
              {{ getStatusLabel(dividendDetail.status) }}
            </van-tag>
          </div>
        </div>
        
        <div class="amount-value">
          <span class="currency">¥</span>
          <span class="value">{{ Number(dividendDetail.amount).toFixed(2) }}</span>
        </div>
        
        <div class="amount-info">
          <div class="info-item">
            <span class="label">分红周期</span>
            <span class="value">{{ dividendDetail.period }}期</span>
          </div>
          <div class="info-item">
            <span class="label">结算时间</span>
            <span class="value">{{ formatDate(dividendDetail.settled_at) || '待结算' }}</span>
          </div>
        </div>
      </div>

      <!-- 分红详情信息 -->
      <div class="detail-card">
        <div class="card-title">分红详情</div>
        
        <div class="detail-list">
          <div class="detail-item">
            <div class="item-label">分红类型</div>
            <div class="item-value">{{ dividendDetail.type === 'vip_recruitment' ? 'VIP招募分红' : '充值套餐分红' }}</div>
          </div>
          
          <div class="detail-item">
            <div class="item-label">分红等级</div>
            <div class="item-value">{{ getLevelLabel(dividendDetail.level) }}</div>
          </div>
          
          <div class="detail-item">
            <div class="item-label">分红周期</div>
            <div class="item-value">{{ dividendDetail.period }}期 ({{ formatPeriod(dividendDetail.period) }})</div>
          </div>
          
          <div class="detail-item">
            <div class="item-label">团队VIP数</div>
            <div class="item-value">{{ dividendDetail.team_vip_count || 0 }}人</div>
          </div>
          
          <div class="detail-item">
            <div class="item-label">团队充值数</div>
            <div class="item-value">{{ dividendDetail.team_device_count || 0 }}台</div>
          </div>
          
          <div class="detail-item">
            <div class="item-label">直推VIP数</div>
            <div class="item-value">{{ dividendDetail.direct_vip_count || 0 }}人</div>
          </div>
          
          <div class="detail-item">
            <div class="item-label">直推充值数</div>
            <div class="item-value">{{ dividendDetail.direct_device_count || 0 }}台</div>
          </div>
          
          <div class="detail-item">
            <div class="item-label">本月直推VIP</div>
            <div class="item-value">{{ dividendDetail.month_direct_vip_count || 0 }}人</div>
          </div>
          
          <div class="detail-item">
            <div class="item-label">本月直推充值</div>
            <div class="item-value">{{ dividendDetail.month_direct_device_count || 0 }}台</div>
          </div>
          
          <div class="detail-item" v-if="dividendDetail.pool_amount">
            <div class="item-label">奖金池总额</div>
            <div class="item-value">¥{{ Number(dividendDetail.pool_amount).toFixed(2) }}</div>
          </div>
          
          <div class="detail-item" v-if="dividendDetail.qualified_users_count">
            <div class="item-label">达标人数</div>
            <div class="item-value">{{ dividendDetail.qualified_users_count }}人</div>
          </div>
          
          <div class="detail-item" v-if="dividendDetail.direct_ratio">
            <div class="item-label">直推占比</div>
            <div class="item-value">{{ (dividendDetail.direct_ratio * 100).toFixed(2) }}%</div>
          </div>
          
          <div class="detail-item">
            <div class="item-label">创建时间</div>
            <div class="item-value">{{ formatDate(dividendDetail.created_at) }}</div>
          </div>
          
          <div class="detail-item" v-if="dividendDetail.qualification_reason">
            <div class="item-label">达标原因</div>
            <div class="item-value">{{ dividendDetail.qualification_reason }}</div>
          </div>
          
          <div class="detail-item" v-if="dividendDetail.settlement_remark">
            <div class="item-label">结算备注</div>
            <div class="item-value">{{ dividendDetail.settlement_remark }}</div>
          </div>
        </div>
      </div>

      <!-- 分红计算说明 -->
      <div class="calculation-card">
        <div class="card-title">分红计算说明</div>
        
        <div class="calculation-content">
          <div class="calculation-formula">
            <div class="formula-title">计算公式</div>
            <div class="formula-text" v-if="dividendDetail.level === 'senior'">
              个人分红 = 奖金池总额 × (个人直推数 ÷ 所有达标者直推总数)
            </div>
            <div class="formula-text" v-else>
              个人分红 = 奖金池总额 ÷ 达标人数
            </div>
          </div>
          
          <div class="calculation-steps">
            <div class="step-title">计算步骤</div>
            <div class="step-item">
              <span class="step-number">1</span>
              <span class="step-text">统计{{ dividendDetail.period }}期{{ dividendDetail.type === 'vip_recruitment' ? 'VIP招募' : '充值套餐' }}数据</span>
            </div>
            <div class="step-item">
              <span class="step-number">2</span>
              <span class="step-text">计算奖金池：{{ dividendDetail.type === 'vip_recruitment' ? '新增VIP数 × 300元 × 3轮' : '新增充值数 × 15元 × 3轮' }}</span>
            </div>
            <div class="step-item">
              <span class="step-number">3</span>
              <span class="step-text">判断{{ getLevelLabel(dividendDetail.level) }}达标条件</span>
            </div>
            <div class="step-item">
              <span class="step-number">4</span>
              <span class="step-text">按{{ dividendDetail.level === 'senior' ? '直推占比' : '人数均分' }}分配奖金池</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 达标条件说明 -->
      <div class="qualification-card">
        <div class="card-title">达标条件说明</div>
        
        <div class="qualification-content">
          <div class="qualification-item" :class="{ 'active': dividendDetail.level === 'junior' }">
            <div class="qualification-level">初级分红</div>
            <div class="qualification-condition">
              {{ dividendDetail.type === 'vip_recruitment' ? '团队VIP满3人' : '团队充值满10台' }}
            </div>
          </div>
          
          <div class="qualification-item" :class="{ 'active': dividendDetail.level === 'middle' }">
            <div class="qualification-level">中级分红</div>
            <div class="qualification-condition">
              {{ dividendDetail.type === 'vip_recruitment' ? '团队VIP满10人' : '团队充值满30台' }}
            </div>
          </div>
          
          <div class="qualification-item" :class="{ 'active': dividendDetail.level === 'senior' }">
            <div class="qualification-level">高级分红</div>
            <div class="qualification-condition">
              {{ dividendDetail.type === 'vip_recruitment' ? '团队VIP满30人且本月直推≠0' : '团队充值满80台且本月直推≠0' }}
            </div>
          </div>
        </div>
      </div>

      <!-- 计算详情 -->
      <div class="calculation-detail-card" v-if="dividendDetail.calculation_detail">
        <div class="card-title">计算详情</div>
        <div class="calculation-detail-content">
          <pre>{{ JSON.stringify(dividendDetail.calculation_detail, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div class="loading-container" v-if="loading">
      <van-loading color="#ff9500" />
      <span class="loading-text">加载中...</span>
    </div>

    <!-- 错误状态 -->
    <van-empty 
      v-if="!loading && !dividendDetail"
      image="error"
      description="分红记录不存在或已被删除"
    >
      <van-button type="primary" @click="onClickLeft">返回</van-button>
    </van-empty>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Toast } from 'vant'
import { getVipDividendDetail } from '@/api/vip'
import { formatDate as formatDateUtil } from '@/utils/date'

const router = useRouter()
const route = useRoute()

// 响应式数据
const loading = ref(true)
const dividendDetail = ref(null)

// 获取分红详情
const fetchDividendDetail = async () => {
  try {
    loading.value = true
    const dividendId = route.params.id
    
    const response = await getVipDividendDetail(dividendId)
    
    if (response.code === 0 && response.data) {
      dividendDetail.value = response.data
    } else {
      Toast({ type: 'fail', message: response.msg || '获取分红详情失败' })
    }
  } catch (error) {
    console.error('获取分红详情失败:', error)
    Toast({ type: 'fail', message: '网络错误，请稍后重试' })
  } finally {
    loading.value = false
  }
}

// 返回上一页
const onClickLeft = () => {
  router.back()
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    return formatDateUtil(new Date(dateStr), 'YYYY-MM-DD HH:mm')
  } catch (error) {
    return dateStr
  }
}

// 格式化周期
const formatPeriod = (period) => {
  if (!period) return ''
  return period.replace('-', '年') + '月'
}

// 获取类型样式类
const getTypeClass = (type, level) => {
  return `${type}-${level}`
}

// 获取类型图标
const getTypeIcon = (type) => {
  return type === 'vip_recruitment' ? 'diamond-o' : 'balance-o'
}

// 获取类型标签
const getTypeLabel = (type, level) => {
  const typeMap = {
    'vip_recruitment': 'VIP招募',
    'device_recharge': '充值分红'
  }
  const levelMap = {
    'junior': '初级',
    'middle': '中级', 
    'senior': '高级'
  }
  return `${typeMap[type] || type}${levelMap[level] || level}分红`
}

// 获取等级标签
const getLevelLabel = (level) => {
  const levelMap = {
    'junior': '初级分红',
    'middle': '中级分红',
    'senior': '高级分红'
  }
  return levelMap[level] || level
}

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    'pending': 'warning',
    'approved': 'primary',
    'settled': 'success',
    'cancelled': 'danger'
  }
  return statusMap[status] || 'default'
}

// 获取状态标签
const getStatusLabel = (status) => {
  const statusMap = {
    'pending': '待审核',
    'approved': '已审核',
    'settled': '已结算',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

// 页面初始化
onMounted(() => {
  fetchDividendDetail()
})
</script>

<style scoped>
.dividend-detail-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 20px;
}

.detail-container {
  padding: 15px;
}

/* 金额卡片 */
.amount-card {
  background: linear-gradient(135deg, #ff9500, #ff6b35);
  border-radius: 16px;
  padding: 24px;
  color: white;
  margin-bottom: 15px;
}

.amount-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.amount-type {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}

.amount-type .van-icon {
  margin-right: 8px;
  font-size: 20px;
}

.amount-status .van-tag {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.amount-value {
  text-align: center;
  margin-bottom: 20px;
}

.currency {
  font-size: 24px;
  font-weight: 500;
  opacity: 0.9;
}

.value {
  font-size: 48px;
  font-weight: 700;
  margin-left: 4px;
}

.amount-info {
  display: flex;
  justify-content: space-around;
}

.amount-info .info-item {
  text-align: center;
}

.amount-info .label {
  display: block;
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.amount-info .value {
  font-size: 14px;
  font-weight: 600;
}

/* 详情卡片 */
.detail-card,
.calculation-card,
.qualification-card,
.calculation-detail-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

/* 详情列表 */
.detail-list {
  space-y: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f8f8f8;
}

.detail-item:last-child {
  border-bottom: none;
}

.item-label {
  font-size: 14px;
  color: #666;
  flex-shrink: 0;
  width: 100px;
}

.item-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  text-align: right;
  flex: 1;
}

/* 计算说明 */
.calculation-content {
  space-y: 16px;
}

.formula-title,
.step-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.formula-text {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.calculation-steps {
  margin-top: 16px;
}

.step-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #ff9500;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  margin-right: 12px;
  flex-shrink: 0;
}

.step-text {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

/* 达标条件 */
.qualification-content {
  space-y: 12px;
}

.qualification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s ease;
}

.qualification-item.active {
  background: linear-gradient(135deg, #ff9500, #ff6b35);
  color: white;
  border-color: #ff9500;
}

.qualification-level {
  font-size: 14px;
  font-weight: 600;
}

.qualification-condition {
  font-size: 13px;
  opacity: 0.8;
}

/* 计算详情 */
.calculation-detail-content {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
}

.calculation-detail-content pre {
  font-size: 12px;
  color: #666;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
}

/* 类型样式 */
.vip_recruitment-junior {
  color: #52c41a;
}

.vip_recruitment-middle {
  color: #1890ff;
}

.vip_recruitment-senior {
  color: #722ed1;
}

.device_recharge-junior {
  color: #fa8c16;
}

.device_recharge-middle {
  color: #eb2f96;
}

.device_recharge-senior {
  color: #f5222d;
}
</style> 