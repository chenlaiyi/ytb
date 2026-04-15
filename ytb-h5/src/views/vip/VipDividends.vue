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
          @click="$router.push('/vip/dividend-history')"
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
        @click="$router.push('/vip/dividend-ranking')"
      >
        查看分红排行
      </van-button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { getUserDividendPreview, getUserDividends } from '@/api/vipDividends'
import { useUserStore } from '@/stores/user'
import { showToast } from 'vant'

export default {
  name: 'VipDividends',
  setup() {
    const userStore = useUserStore()
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
    
    // 加载分红预估
    const loadPreview = async () => {
      if (!userStore.userInfo?.id) {
        showToast('请先登录')
        return
      }
      
      try {
        previewLoading.value = true
        const response = await getUserDividendPreview(userStore.userInfo.id)
        
        if (response.success && response.data) {
          const data = response.data
          currentPeriod.value = data.period
          
          // 更新VIP预估数据
          Object.assign(vipPreview, data.vip)
          
          // 更新充值预估数据
          Object.assign(rechargePreview, data.recharge)
        } else {
          showToast(response.message || '获取分红预估失败')
        }
      } catch (error) {
        console.error('获取分红预估失败:', error)
        showToast('获取分红预估失败')
      } finally {
        previewLoading.value = false
      }
    }
    
    // 加载最近分红记录
    const loadRecentRecords = async () => {
      if (!userStore.userInfo?.id || recordsLoading.value) {
        return
      }
      
      try {
        recordsLoading.value = true
        const response = await getUserDividends({
          user_id: userStore.userInfo.id,
          page: 1,
          limit: 10
        })
        
        if (response.success) {
          recentRecords.value = response.data || []
          recordsFinished.value = true
        } else {
          showToast(response.message || '获取分红记录失败')
        }
      } catch (error) {
        console.error('获取分红记录失败:', error)
        showToast('获取分红记录失败')
      } finally {
        recordsLoading.value = false
      }
    }
    
    // 刷新预估
    const refreshPreview = () => {
      loadPreview()
    }
    
    // 获取分红类型文本
    const getDividendTypeText = (type) => {
      const typeMap = {
        'vip': 'VIP招募',
        'recharge': '充值'
      }
      return typeMap[type] || type
    }
    
    // 获取等级文本
    const getLevelText = (level) => {
      const levelMap = {
        'junior': '初级',
        'middle': '中级',
        'senior': '高级'
      }
      return levelMap[level] || level
    }
    
    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        'pending': '待发放',
        'paid': '已发放',
        'cancelled': '已取消'
      }
      return statusMap[status] || status
    }
    
    // 格式化金额
    const formatAmount = (amount) => {
      if (!amount) return '0.00'
      return parseFloat(amount).toFixed(2)
    }
    
    onMounted(() => {
      loadPreview()
      loadRecentRecords()
    })
    
    return {
      previewLoading,
      recordsLoading,
      recordsFinished,
      activeRules,
      recentRecords,
      currentPeriod,
      vipPreview,
      rechargePreview,
      refreshPreview,
      loadRecentRecords,
      getDividendTypeText,
      getLevelText,
      getStatusText,
      formatAmount
    }
  }
}
</script>

<style lang="scss" scoped>
.vip-dividends {
  background-color: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 80px;
  
  .dividend-preview {
    margin: 16px;
    
    .preview-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
      font-weight: 500;
    }
    
    .preview-content {
      padding: 16px 0;
      
      .dividend-type {
        margin-bottom: 20px;
        
        h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #323233;
        }
        
        .qualification-info {
          .team-info {
            display: flex;
            gap: 16px;
            margin-bottom: 8px;
            font-size: 12px;
            color: #969799;
          }
          
          .qualification-status {
            display: flex;
            gap: 8px;
          }
        }
      }
    }
  }
  
  .dividend-rules {
    margin: 0 16px 16px;
    
    .rule-content {
      padding: 12px 0;
      
      p {
        margin: 8px 0;
        font-size: 14px;
        line-height: 1.5;
        color: #646566;
      }
    }
  }
  
  .recent-dividends {
    margin: 0 16px 16px;
    
    .dividend-list {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      
      .dividend-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid #f7f8fa;
        
        &:last-child {
          border-bottom: none;
        }
        
        .dividend-info {
          flex: 1;
          
          .dividend-title {
            font-size: 14px;
            font-weight: 500;
            color: #323233;
            margin-bottom: 4px;
          }
          
          .dividend-detail {
            font-size: 12px;
            color: #969799;
          }
        }
        
        .dividend-amount {
          text-align: right;
          
          .amount {
            font-size: 16px;
            font-weight: bold;
            color: #ee0a24;
            margin-bottom: 2px;
          }
          
          .status {
            font-size: 12px;
            color: #969799;
          }
        }
      }
    }
  }
  
  .bottom-actions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px;
    background: white;
    border-top: 1px solid #ebedf0;
  }
}
</style> 