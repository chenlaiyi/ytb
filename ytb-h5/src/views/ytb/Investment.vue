<template>
  <div class="ytb-page investment-page">
    <van-nav-bar
      title="BossCP 投资管理"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
    />

    <div class="page-content" v-if="loading">
      <van-loading type="spinner" vertical>加载中...</van-loading>
    </div>

    <div class="page-content" v-else>
      <!-- 顶部卡片：总览 -->
      <div class="stats-card">
        <div class="stats-header">我的投资总览</div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="value">¥{{ stats.total_invested }}</div>
            <div class="label">累计投入</div>
          </div>
          <div class="stat-item">
            <div class="value">{{ stats.total_quota }}台</div>
            <div class="label">获得额度</div>
          </div>
          <div class="stat-item highlight">
            <div class="value">¥{{ stats.total_refunded }}</div>
            <div class="label">已回款</div>
          </div>
          <div class="stat-item">
            <div class="value">{{ stats.remaining_quota }}台</div>
            <div class="label">剩余额度</div>
          </div>
        </div>
        <div class="action-bar">
          <van-button type="primary" size="small" block @click="showReinvest = true">追加投入</van-button>
        </div>
      </div>

      <!-- 投资记录列表 -->
      <div class="list-section">
        <div class="section-title">投资记录</div>
        <van-list
          v-model:loading="listLoading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div class="investment-item" v-for="item in list" :key="item.id">
            <div class="item-header">
              <span class="time">{{ item.created_at }}</span>
              <span class="status" :class="item.status">{{ item.status_name }}</span>
            </div>
            <div class="item-body">
              <div class="row">
                <span class="label">投入金额</span>
                <span class="value">¥{{ item.amount }}</span>
              </div>
              <div class="row">
                <span class="label">回款进度</span>
                <span class="value highlight">{{ item.refunded_amount }} / {{ parseFloat(item.amount) + 200 }} ({{ item.refund_progress }}%)</span>
              </div>
              <div class="progress-bar">
                <div class="progress" :style="{ width: item.refund_progress + '%' }"></div>
              </div>
              <div class="row small">
                <span class="label">额度消耗</span>
                <span class="value">{{ item.allocated_count }} / {{ item.quota }} 台</span>
              </div>
            </div>
          </div>
        </van-list>
      </div>
    </div>

    <!-- 追加投入弹窗 -->
    <van-dialog v-model:show="showReinvest" title="追加BossCP投入" show-cancel-button @confirm="handleReinvest">
      <div class="reinvest-dialog">
        <p>确认再次投入 <strong>¥29,800</strong> 吗？</p>
        <p class="desc">您将获得300台净水器额度，全系统每安装一台回款100元，直至回款30,000元。</p>
        <van-radio-group v-model="paymentMethod">
          <van-radio name="wechat">微信支付</van-radio>
          <!-- <van-radio name="offline">线下转账</van-radio> -->
        </van-radio-group>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { getInvestments, getInvestmentStats, applyBossCp } from '@/api/ytb'
import { useYtbShare } from '@/composables/useYtbShare'

// 设置亿拓宝分享配置
useYtbShare('亿拓宝联盟 - BossCP投资')

const router = useRouter()
const loading = ref(true)
const listLoading = ref(false)
const finished = ref(false)
const list = ref([])
const page = ref(1)
const stats = ref({
  total_invested: 0,
  total_quota: 0,
  total_refunded: 0,
  remaining_quota: 0
})

const showReinvest = ref(false)
const paymentMethod = ref('wechat')

const loadStats = async () => {
  try {
    const res = await getInvestmentStats()
    if (res.code === 0) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('Failed to load stats', error)
  }
}

const onLoad = async () => {
  try {
    const res = await getInvestments({ page: page.value })
    if (res.code === 0) {
      if (page.value === 1) {
        list.value = res.data.list
      } else {
        list.value = [...list.value, ...res.data.list]
      }
      
      // Check if finished
      if (list.value.length >= res.data.total) {
        finished.value = true
      } else {
        page.value++
      }
    }
  } catch (error) {
    console.error('Failed to load list', error)
    finished.value = true
  } finally {
    listLoading.value = false
    loading.value = false
  }
}

const handleReinvest = async () => {
  if (!paymentMethod.value) {
    showToast('请选择支付方式')
    return
  }
  
  const toast = showLoadingToast({
    message: '正在提交...',
    forbidClick: true,
  })
  
  try {
    const res = await applyBossCp(paymentMethod.value)
    if (res.code === 0) {
      showToast('申请成功，请完成支付')
      // TODO: Handle Wechat Payment
      if (paymentMethod.value === 'wechat') {
        // Mock payment success for now or redirect
        setTimeout(() => {
          showToast('支付模拟成功')
          page.value = 1
          finished.value = false
          loadStats()
          onLoad()
        }, 1500)
      }
    } else {
      showToast(res.message || '申请失败')
    }
  } catch (error) {
    showToast('网络错误')
  } finally {
    closeToast()
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style lang="less" scoped>
.ytb-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.page-content {
  padding: 16px;
}

.stats-card {
  background: linear-gradient(135deg, #1989fa 0%, #39b9f5 100%);
  border-radius: 12px;
  padding: 16px;
  color: white;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.3);

  .stats-header {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 16px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    
    .stat-item {
      .value {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 4px;
      }
      .label {
        font-size: 12px;
        opacity: 0.8;
      }
      
      &.highlight .value {
        color: #ffeb3b;
      }
    }
  }
  
  .action-bar {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 4px solid #1989fa;
}

.investment-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .item-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 14px;
    
    .time {
      color: #999;
    }
    
    .status {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      
      &.active {
        color: #1989fa;
        background: #e6f7ff;
      }
      &.completed {
        color: #52c41a;
        background: #f6ffed;
      }
    }
  }

  .item-body {
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      color: #666;
      
      .value {
        color: #333;
        font-weight: 500;
        
        &.highlight {
          color: #ff976a;
        }
      }
      
      &.small {
        font-size: 12px;
        margin-top: 8px;
      }
    }

    .progress-bar {
      height: 6px;
      background: #f0f0f0;
      border-radius: 3px;
      overflow: hidden;
      margin: 8px 0;
      
      .progress {
        height: 100%;
        background: linear-gradient(90deg, #ff976a, #ff6b6b);
        border-radius: 3px;
        transition: width 0.3s;
      }
    }
  }
}

.reinvest-dialog {
  padding: 20px;
  text-align: center;
  
  p {
    margin-bottom: 10px;
    font-size: 16px;
  }
  
  .desc {
    font-size: 12px;
    color: #999;
    margin-bottom: 20px;
  }
}
</style>
