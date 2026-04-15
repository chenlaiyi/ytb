<template>
  <div class="vip-dividends">
    <!-- 头部导航 -->
    <van-nav-bar
      title="VIP分红"
      left-text="返回"
      left-arrow
      @click-left="$router.go(-1)"
    />

    <!-- 分红预估卡片 -->
    <div class="dividend-preview">
      <van-card>
        <template #title>
          <div class="preview-title">
            <span>{{ currentPeriod }}月分红预估</span>
            <van-button 
              size="mini" 
              type="primary" 
              @click="refreshPreview"
              :loading="previewLoading"
            >
              刷新
            </van-button>
          </div>
        </template>
        
        <div class="preview-content">
          <!-- VIP招募分红 -->
          <div class="dividend-type">
            <h4>VIP招募分红</h4>
            <div class="qualification-info">
              <div class="team-info">
                <span>团队VIP：{{ vipPreview.team_count }}人</span>
                <span>直推VIP：{{ vipPreview.direct_count }}人</span>
              </div>
              <div class="qualification-status">
                <van-tag 
                  :type="vipPreview.qualification.junior ? 'success' : 'default'"
                  size="small"
                >
                  初级{{ vipPreview.qualification.junior ? '✓' : '✗' }}
                </van-tag>
                <van-tag 
                  :type="vipPreview.qualification.middle ? 'success' : 'default'"
                  size="small"
                >
                  中级{{ vipPreview.qualification.middle ? '✓' : '✗' }}
                </van-tag>
                <van-tag 
                  :type="vipPreview.qualification.senior ? 'success' : 'default'"
                  size="small"
                >
                  高级{{ vipPreview.qualification.senior ? '✓' : '✗' }}
                </van-tag>
              </div>
            </div>
          </div>

          <!-- 充值分红 -->
          <div class="dividend-type">
            <h4>充值分红</h4>
            <div class="qualification-info">
              <div class="team-info">
                <span>团队设备：{{ rechargePreview.team_count }}台</span>
                <span>直推设备：{{ rechargePreview.direct_count }}台</span>
              </div>
              <div class="qualification-status">
                <van-tag 
                  :type="rechargePreview.qualification.junior ? 'success' : 'default'"
                  size="small"
                >
                  初级{{ rechargePreview.qualification.junior ? '✓' : '✗' }}
                </van-tag>
                <van-tag 
                  :type="rechargePreview.qualification.middle ? 'success' : 'default'"
                  size="small"
                >
                  中级{{ rechargePreview.qualification.middle ? '✓' : '✗' }}
                </van-tag>
                <van-tag 
                  :type="rechargePreview.qualification.senior ? 'success' : 'default'"
                  size="small"
                >
                  高级{{ rechargePreview.qualification.senior ? '✓' : '✗' }}
                </van-tag>
              </div>
            </div>
          </div>
        </div>
      </van-card>
    </div>

    <!-- 分红规则 -->
    <div class="dividend-rules">
      <van-collapse v-model="activeRules">
        <van-collapse-item title="VIP招募分红规则" name="vip">
          <div class="rule-content">
            <p><strong>初级分红：</strong>团队VIP ≥ 3人</p>
            <p><strong>中级分红：</strong>团队VIP ≥ 10人</p>
            <p><strong>高级分红：</strong>团队VIP ≥ 30人 且 有直推VIP</p>
            <p><strong>奖金池：</strong>每新增1个VIP贡献300元</p>
            <p><strong>分配方式：</strong>初级和中级按人数平分，高级按直推比例分配</p>
          </div>
        </van-collapse-item>
        
        <van-collapse-item title="充值分红规则" name="recharge">
          <div class="rule-content">
            <p><strong>初级分红：</strong>团队设备 ≥ 10台</p>
            <p><strong>中级分红：</strong>团队设备 ≥ 30台</p>
            <p><strong>高级分红：</strong>团队设备 ≥ 80台 且 有直推设备</p>
            <p><strong>奖金池：</strong>每台设备贡献15元</p>
            <p><strong>分配方式：</strong>初级和中级按人数平分，高级按直推比例分配</p>
          </div>
        </van-collapse-item>
      </van-collapse>
    </div>

    <!-- 最近分红记录 -->
    <div class="recent-dividends">
      <van-cell-group>
        <van-cell 
          title="最近分红记录" 
          is-link 
          @click="$router.push('/branch/vip/dividend-history')"
        >
          <template #right-icon>
            <van-icon name="arrow" />
          </template>
        </van-cell>
      </van-cell-group>
      
      <div class="dividend-list">
        <van-list
          v-model:loading="recordsLoading"
          :finished="recordsFinished"
          finished-text="没有更多了"
          @load="loadRecentRecords"
        >
          <div
            v-for="record in recentRecords"
            :key="`${record.id}-${record.period}`"
            class="dividend-item"
          >
            <div class="dividend-info">
              <div class="dividend-title">
                {{ record.period }} {{ getDividendTypeText(record.dividend_type) }}{{ getLevelText(record.level) }}分红
              </div>
              <div class="dividend-detail">
                团队：{{ record.team_count }} | 直推：{{ record.direct_count }}
              </div>
            </div>
            <div class="dividend-amount">
              <div class="amount">¥{{ formatAmount(record.dividend_amount) }}</div>
              <div class="status">{{ getStatusText(record.status) }}</div>
            </div>
          </div>
          
          <van-empty 
            v-if="!recordsLoading && recentRecords.length === 0"
            description="暂无分红记录"
            image="search"
          />
        </van-list>
      </div>
    </div>

    <!-- 底部操作 -->
    <div class="bottom-actions">
      <van-button 
        type="primary" 
        block 
        @click="$router.push('/branch/vip/dividend-ranking')"
      >
        查看分红排行
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getBranchUserDividendPreview, getBranchUserDividends } from '@/api/branchVip'
import { useBranchUserStore } from '@/stores/branchUser'
import { showToast } from 'vant'

const branchUserStore = useBranchUserStore()
const previewLoading = ref(false)
const recordsLoading = ref(false)
const recordsFinished = ref(false)
const activeRules = ref([])
const recentRecords = ref([])

const currentPeriod = ref(new Date().toISOString().slice(0, 7))

const vipPreview = reactive({
  team_count: 0,
  direct_count: 0,
  qualification: {
    junior: false,
    middle: false,
    senior: false
  }
})

const rechargePreview = reactive({
  team_count: 0,
  direct_count: 0,
  qualification: {
    junior: false,
    middle: false,
    senior: false
  }
})

// 获取分红预估
const fetchDividendPreview = async () => {
  previewLoading.value = true
  try {
    const res = await getBranchUserDividendPreview({
      period: currentPeriod.value
    })
    
    if (res.code === 0) {
      const data = res.data
      
      // 更新VIP招募分红预估
      Object.assign(vipPreview, {
        team_count: data.vip_team_count || 0,
        direct_count: data.vip_direct_count || 0,
        qualification: {
          junior: (data.vip_team_count || 0) >= 3,
          middle: (data.vip_team_count || 0) >= 10,
          senior: (data.vip_team_count || 0) >= 30 && (data.vip_direct_count || 0) > 0
        }
      })
      
      // 更新充值分红预估
      Object.assign(rechargePreview, {
        team_count: data.recharge_team_count || 0,
        direct_count: data.recharge_direct_count || 0,
        qualification: {
          junior: (data.recharge_team_count || 0) >= 10,
          middle: (data.recharge_team_count || 0) >= 30,
          senior: (data.recharge_team_count || 0) >= 80 && (data.recharge_direct_count || 0) > 0
        }
      })
    } else {
      showToast(res.message || '获取分红预估失败')
    }
  } catch (error) {
    console.error('获取分红预估错误:', error)
    showToast('网络错误，请稍后重试')
  } finally {
    previewLoading.value = false
  }
}

// 刷新预估
const refreshPreview = () => {
  fetchDividendPreview()
}

// 加载最近分红记录
const loadRecentRecords = async () => {
  if (recordsFinished.value) return
  
  recordsLoading.value = true
  try {
    const res = await getBranchUserDividends({
      page: Math.floor(recentRecords.value.length / 10) + 1,
      page_size: 10
    })
    
    if (res.code === 0) {
      const data = res.data
      const newRecords = data.records || []
      
      if (newRecords.length === 0) {
        recordsFinished.value = true
      } else {
        recentRecords.value.push(...newRecords)
      }
    } else {
      showToast(res.message || '获取分红记录失败')
      recordsFinished.value = true
    }
  } catch (error) {
    console.error('获取分红记录错误:', error)
    showToast('网络错误，请稍后重试')
    recordsFinished.value = true
  } finally {
    recordsLoading.value = false
  }
}

// 获取分红类型文本
const getDividendTypeText = (type) => {
  const typeMap = {
    1: 'VIP招募',
    2: '充值'
  }
  return typeMap[type] || '未知'
}

// 获取等级文本
const getLevelText = (level) => {
  const levelMap = {
    1: '初级',
    2: '中级',
    3: '高级'
  }
  return levelMap[level] || '未知'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    0: '待发放',
    1: '已发放',
    2: '已取消'
  }
  return statusMap[status] || '未知'
}

// 格式化金额
const formatAmount = (amount) => {
  return (amount || 0).toFixed(2)
}

// 页面加载时获取数据
onMounted(() => {
  fetchDividendPreview()
})
</script>

<style scoped>
.vip-dividends {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-bottom: 20px;
}

.dividend-preview {
  padding: 16px;
}

.preview-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.preview-content {
  padding: 16px 0;
}

.dividend-type {
  margin-bottom: 24px;
}

.dividend-type:last-child {
  margin-bottom: 0;
}

.dividend-type h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.qualification-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
}

.team-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.qualification-status {
  display: flex;
  gap: 8px;
}

.dividend-rules {
  margin: 16px;
}

.rule-content {
  padding: 8px 0;
  line-height: 1.6;
}

.rule-content p {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
}

.rule-content strong {
  color: #333;
}

.recent-dividends {
  margin: 16px;
}

.dividend-list {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.dividend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.dividend-item:last-child {
  border-bottom: none;
}

.dividend-info {
  flex: 1;
}

.dividend-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.dividend-detail {
  font-size: 12px;
  color: #999;
}

.dividend-amount {
  text-align: right;
}

.amount {
  font-size: 16px;
  font-weight: 600;
  color: #ff4a47;
  margin-bottom: 4px;
}

.status {
  font-size: 12px;
  color: #999;
}

.bottom-actions {
  padding: 16px;
}

.bottom-actions .van-button {
  height: 44px;
  border-radius: 22px;
  font-size: 16px;
  font-weight: 600;
}
</style> 