<template>
  <div class="dividend-ranking">
    <!-- 头部导航 -->
    <van-nav-bar
      title="分红排行"
      left-text="返回"
      left-arrow
      @click-left="$router.go(-1)"
    />

    <!-- 筛选条件 -->
    <div class="filter-section">
      <van-cell-group>
        <van-field
          v-model="filters.period"
          label="分红期间"
          placeholder="选择分红期间"
          readonly
          is-link
          @click="showPeriodPicker = true"
        />
        <van-field
          v-model="filters.dividendTypeText"
          label="分红类型"
          placeholder="选择分红类型"
          readonly
          is-link
          @click="showTypePicker = true"
        />
      </van-cell-group>
      
      <div class="filter-actions">
        <van-button 
          type="primary" 
          size="small" 
          @click="loadRanking"
          :loading="loading"
        >
          查询
        </van-button>
        <van-button 
          size="small" 
          @click="resetFilters"
        >
          重置
        </van-button>
      </div>
    </div>

    <!-- 排行榜列表 -->
    <div class="ranking-list">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadRanking"
      >
        <div
          v-for="(item, index) in rankingList"
          :key="`${item.user_id}-${index}`"
          class="ranking-item"
        >
          <div class="rank-badge">
            <van-icon 
              v-if="item.rank <= 3"
              :name="getRankIcon(item.rank)"
              :color="getRankColor(item.rank)"
              size="24"
            />
            <span v-else class="rank-number">{{ item.rank }}</span>
          </div>
          
          <div class="user-info">
            <div class="user-name">{{ item.user_name || '未知用户' }}</div>
            <div class="user-stats">
              <span>团队：{{ item.total_team_count || 0 }}</span>
              <span>直推：{{ item.total_direct_count || 0 }}</span>
            </div>
          </div>
          
          <div class="dividend-amount">
            <div class="amount">¥{{ formatAmount(item.total_dividend) }}</div>
            <div class="amount-label">总分红</div>
          </div>
        </div>
        
        <van-empty 
          v-if="!loading && rankingList.length === 0"
          description="暂无排行数据"
          image="search"
        />
      </van-list>
    </div>

    <!-- 期间选择器 -->
    <van-popup v-model:show="showPeriodPicker" position="bottom">
      <van-picker
        :columns="periodColumns"
        @confirm="onPeriodConfirm"
        @cancel="showPeriodPicker = false"
      />
    </van-popup>

    <!-- 类型选择器 -->
    <van-popup v-model:show="showTypePicker" position="bottom">
      <van-picker
        :columns="typeColumns"
        @confirm="onTypeConfirm"
        @cancel="showTypePicker = false"
      />
    </van-popup>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { getDividendRanking } from '@/api/vipDividends'
import { showToast } from 'vant'

export default {
  name: 'DividendRanking',
  setup() {
    const loading = ref(false)
    const finished = ref(false)
    const rankingList = ref([])
    const showPeriodPicker = ref(false)
    const showTypePicker = ref(false)
    
    const filters = reactive({
      period: '',
      dividendType: '',
      dividendTypeText: '',
      limit: 50
    })
    
    // 期间选项
    const periodColumns = computed(() => {
      const periods = []
      const now = new Date()
      
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const text = `${date.getFullYear()}年${date.getMonth() + 1}月`
        periods.push({ text, value: period })
      }
      
      return periods
    })
    
    // 类型选项
    const typeColumns = [
      { text: '全部类型', value: '' },
      { text: 'VIP招募分红', value: 'vip' },
      { text: '充值分红', value: 'recharge' }
    ]
    
    // 初始化筛选条件
    const initFilters = () => {
      const now = new Date()
      filters.period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      filters.dividendType = ''
      filters.dividendTypeText = '全部类型'
    }
    
    // 加载排行榜数据
    const loadRanking = async () => {
      if (loading.value) return
      
      try {
        loading.value = true
        
        const params = {
          period: filters.period,
          limit: filters.limit
        }
        
        if (filters.dividendType) {
          params.dividend_type = filters.dividendType
        }
        
        const response = await getDividendRanking(params)
        
        if (response.success) {
          rankingList.value = response.data || []
          finished.value = true
        } else {
          showToast(response.message || '获取排行榜失败')
        }
      } catch (error) {
        console.error('获取分红排行榜失败:', error)
        showToast('获取排行榜失败')
      } finally {
        loading.value = false
      }
    }
    
    // 重置筛选条件
    const resetFilters = () => {
      initFilters()
      rankingList.value = []
      finished.value = false
      loadRanking()
    }
    
    // 期间选择确认
    const onPeriodConfirm = ({ selectedOptions }) => {
      filters.period = selectedOptions[0].value
      showPeriodPicker.value = false
      rankingList.value = []
      finished.value = false
      loadRanking()
    }
    
    // 类型选择确认
    const onTypeConfirm = ({ selectedOptions }) => {
      filters.dividendType = selectedOptions[0].value
      filters.dividendTypeText = selectedOptions[0].text
      showTypePicker.value = false
      rankingList.value = []
      finished.value = false
      loadRanking()
    }
    
    // 获取排名图标
    const getRankIcon = (rank) => {
      const icons = {
        1: 'medal',
        2: 'medal-o',
        3: 'medal'
      }
      return icons[rank] || 'medal'
    }
    
    // 获取排名颜色
    const getRankColor = (rank) => {
      const colors = {
        1: '#FFD700', // 金色
        2: '#C0C0C0', // 银色
        3: '#CD7F32'  // 铜色
      }
      return colors[rank] || '#999'
    }
    
    // 格式化金额
    const formatAmount = (amount) => {
      if (!amount) return '0.00'
      return parseFloat(amount).toFixed(2)
    }
    
    onMounted(() => {
      initFilters()
      loadRanking()
    })
    
    return {
      loading,
      finished,
      rankingList,
      showPeriodPicker,
      showTypePicker,
      filters,
      periodColumns,
      typeColumns,
      loadRanking,
      resetFilters,
      onPeriodConfirm,
      onTypeConfirm,
      getRankIcon,
      getRankColor,
      formatAmount
    }
  }
}
</script>

<style lang="scss" scoped>
.dividend-ranking {
  background-color: #f7f8fa;
  min-height: 100vh;
  
  .filter-section {
    background: white;
    margin-bottom: 8px;
    
    .filter-actions {
      display: flex;
      gap: 12px;
      padding: 16px;
      justify-content: center;
    }
  }
  
  .ranking-list {
    .ranking-item {
      display: flex;
      align-items: center;
      padding: 16px;
      background: white;
      margin-bottom: 8px;
      
      .rank-badge {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        
        .rank-number {
          font-size: 18px;
          font-weight: bold;
          color: #666;
        }
      }
      
      .user-info {
        flex: 1;
        
        .user-name {
          font-size: 16px;
          font-weight: 500;
          color: #323233;
          margin-bottom: 4px;
        }
        
        .user-stats {
          font-size: 12px;
          color: #969799;
          
          span {
            margin-right: 12px;
          }
        }
      }
      
      .dividend-amount {
        text-align: right;
        
        .amount {
          font-size: 18px;
          font-weight: bold;
          color: #ee0a24;
          margin-bottom: 2px;
        }
        
        .amount-label {
          font-size: 12px;
          color: #969799;
        }
      }
    }
  }
}
</style> 