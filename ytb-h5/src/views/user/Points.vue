<template>
  <div class="points-container">
    <NavBar
      title="我的积分"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />
    
    <div class="points-content">
      <!-- 积分卡片 -->
      <div class="points-card">
        <div class="points-title">我的积分</div>
        <div class="points-amount">{{ userAssets.points || '0' }}</div>
        <div class="points-tip">积分可用于商城兑换商品或抵扣</div>
        <div class="points-actions">
          <Button round type="primary" size="small" @click="goToMall">去使用</Button>
          <Button round plain type="primary" size="small" @click="showPointsRules">积分规则</Button>
        </div>
      </div>
      
      <!-- 积分统计 -->
      <div class="points-stats">
        <div class="stats-item">
          <div class="stats-value">{{ pointsStats.total || '0' }}</div>
          <div class="stats-label">累计积分</div>
        </div>
        <div class="stats-divider"></div>
        <div class="stats-item">
          <div class="stats-value">{{ pointsStats.used || '0' }}</div>
          <div class="stats-label">已使用</div>
        </div>
        <div class="stats-divider"></div>
        <div class="stats-item">
          <div class="stats-value">{{ pointsStats.expired || '0' }}</div>
          <div class="stats-label">已过期</div>
        </div>
      </div>
      
      <!-- 积分明细 -->
      <div class="points-detail">
        <div class="list-header">
          <span>积分明细</span>
          <Tabs v-model:active="activeTab" @click-tab="onTabChange">
            <Tab title="全部" name="all" />
            <Tab title="收入" name="income" />
            <Tab title="支出" name="expense" />
            <Tab title="过期" name="expired" />
          </Tabs>
        </div>
        
        <PullRefresh v-model="refreshing" @refresh="onRefresh">
          <List
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
          >
            <Cell v-for="item in pointsList" :key="item.id" class="points-item">
              <template #title>
                <div class="points-info">
                  <div class="points-desc">{{ item.desc }}</div>
                  <div class="points-date">{{ item.createTime }}</div>
                </div>
              </template>
              <template #right-icon>
                <span :class="['points-amount', item.type]">
                  {{ item.type === 'income' ? '+' : item.type === 'expense' ? '-' : '' }}{{ item.amount }}
                </span>
              </template>
            </Cell>
            
            <!-- 空状态 -->
            <div v-if="pointsList.length === 0 && !loading" class="empty-state">
              <Icon name="points" size="48" />
              <p>暂无积分记录</p>
            </div>
          </List>
        </PullRefresh>
      </div>
    </div>
    
    <!-- 积分规则弹窗 -->
    <van-popup
      v-model:show="showRules"
      round
      position="bottom"
      :style="{ height: '70%' }"
    >
      <div class="rules-header">
        <div class="rules-title">积分规则</div>
        <Icon name="cross" @click="showRules = false" />
      </div>
      <div class="rules-content">
        <div class="rule-item">
          <div class="rule-title">获取积分</div>
          <div class="rule-desc">
            <p>1. 积分来源于商户支付的手续费，按1:1比例兑换</p>
            <p>2. 通过推荐新商户获得额外10%的积分奖励</p>
            <p>3. 完成任务可获得相应积分奖励</p>
            <p>4. 参与活动可获得积分奖励</p>
          </div>
        </div>
        <div class="rule-item">
          <div class="rule-title">使用积分</div>
          <div class="rule-desc">
            <p>1. 积分可用于商城商品兑换</p>
            <p>2. 积分可在指定商户消费时抵扣部分金额</p>
            <p>3. 积分可参与积分专区活动</p>
          </div>
        </div>
        <div class="rule-item">
          <div class="rule-title">积分有效期</div>
          <div class="rule-desc">
            <p>1. 积分自获取之日起一年内有效</p>
            <p>2. 即将过期的积分会在App进行提醒</p>
            <p>3. 使用积分时，优先扣减最早获取的积分</p>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Button, Tabs, Tab, PullRefresh, List, Cell, Icon, Popup as VanPopup, Toast } from 'vant'
import { getUserAssets } from '@/api/user'
import { getUserPoints, getPointRecords } from '@/api/userPoints'

const router = useRouter()
const activeTab = ref('all')
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const pageSize = 10
const showRules = ref(false)

// 用户资产
const userAssets = ref({
  points: '0.00'
})

// 积分统计
const pointsStats = ref({
  total: '0.00',
  used: '0.00',
  expired: '0.00'
})

// 积分明细列表
const pointsList = ref([])

// 获取用户积分信息
const fetchUserPointsInfo = async () => {
  try {
    const res = await getUserPoints()
    if (res.code === 0 && res.data) {
      const pointsData = res.data.points
      
      // 更新积分显示
      userAssets.value = {
        points: Number(pointsData.available_points || 0).toFixed(2)
      }
      
      // 更新积分统计数据
      pointsStats.value = {
        total: Number(pointsData.total_earned || 0).toFixed(2),
        used: Number(pointsData.total_spent || 0).toFixed(2),
        expired: '0' // 暂时设为0，后续可扩展
      }
      
      console.log('用户积分信息:', res.data)
    }
  } catch (error) {
    console.error('获取用户积分信息失败:', error)
    // 如果新API失败，尝试使用旧API
    await fetchUserAssets()
  }
}

// 获取用户资产（兼容旧版本）
const fetchUserAssets = async () => {
  try {
    const res = await getUserAssets()
    if (res.code === 0) {
      // 处理新的数据结构
      if (res.data && typeof res.data.points === 'object') {
        // 这是新的数据结构，points是一个对象，提取可用积分值
        userAssets.value = {
          points: Number(res.data.points.available_points || 0).toFixed(2)
        }
        
        // 更新积分统计数据
        pointsStats.value = {
          total: Number(res.data.points.total_points || res.data.points.total_earned || 0).toFixed(2),
          used: Number(res.data.points.used_points || res.data.points.total_spent || 0).toFixed(2),
          expired: Number(res.data.points.expired_points || 0).toFixed(2)
        }
      } else {
        // 兼容旧数据结构
        userAssets.value = res.data || { points: '0.00' }
        
        // 模拟统计数据
        const legacyPoints = Number(res.data?.points || 0)
        pointsStats.value = {
          total: (legacyPoints).toFixed(2),
          used: '0.00',
          expired: '0.00'
        }
      }
    }
  } catch (error) {
    console.error('获取用户资产失败', error)
  }
}

// 获取积分记录
const fetchPointRecords = async (reset = false) => {
  try {
    const params = {
      page: reset ? 1 : page.value,
      pageSize
    }

    // 根据当前标签过滤
    if (activeTab.value === 'income') {
      params.type = 'earn'
    } else if (activeTab.value === 'expense') {
      params.type = 'spend'
    }

    const res = await getPointRecords(params)
    if (res.code === 0 && res.data) {
      const pagination = res.data.pagination || {}
      const apiList = res.data.list || res.data.records || []

      const records = apiList.map(item => {
        const type = item.display_type || (item.type === 'earn' ? 'income' : item.type === 'spend' ? 'expense' : 'adjust')
        const amount = Number(item.points ?? item.points_display ?? item.change ?? 0)
        const descParts = [item.source_name, item.description].filter(Boolean)

        return {
          id: item.id,
          desc: descParts.length ? descParts.join(' · ') : '积分变动',
          type,
          amount: Math.abs(amount).toFixed(2),
          createTime: item.created_at || item.recorded_at || ''
        }
      })

      if (reset || refreshing.value) {
        pointsList.value = records
        refreshing.value = false
        page.value = 1
      } else {
        pointsList.value.push(...records)
      }

      const hasMore = pagination.has_more ?? ((pagination.current_page || 1) < (pagination.last_page || 0))
      finished.value = !hasMore
      if (hasMore) {
        page.value = (pagination.current_page || page.value) + 1
      }
    }
  } catch (error) {
    console.error('获取积分记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载更多积分记录
const onLoad = () => {
  fetchPointRecords()
}

// 下拉刷新
const onRefresh = () => {
  // 重置状态
  finished.value = false
  loading.value = true
  page.value = 1
  
  // 重新加载数据
  fetchPointRecords(true)
}

// 切换标签
const onTabChange = (name) => {
  // 重置状态
  finished.value = false
  page.value = 1
  pointsList.value = []
  
  // 重新加载数据
  loading.value = true
  fetchPointRecords(true)
}

// 去商城使用积分
const goToMall = () => {
  router.push('/')
  Toast('积分商城功能开发中...')
}

// 显示积分规则
const showPointsRules = () => {
  showRules.value = true
}

// 页面加载时获取数据
onMounted(() => {
  fetchUserPointsInfo()
  fetchPointRecords(true)
})
</script>

<style scoped>
.points-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.points-content {
  padding-bottom: 20px;
}

/* 积分卡片 */
.points-card {
  margin: 12px;
  padding: 20px;
  background: linear-gradient(135deg, #ff9500, #ff5500);
  border-radius: 12px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.2);
  text-align: center;
}

.points-title {
  font-size: 14px;
  opacity: 0.8;
}

.points-amount {
  font-size: 36px;
  font-weight: 500;
  margin: 10px 0;
}

.points-tip {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 15px;
}

.points-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
}

/* 积分统计 */
.points-stats {
  margin: 12px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  padding: 15px 0;
}

.stats-item {
  flex: 1;
  text-align: center;
}

.stats-value {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.stats-label {
  font-size: 12px;
  color: #999;
}

.stats-divider {
  width: 1px;
  background-color: #eee;
  margin: 5px 0;
}

/* 积分明细 */
.points-detail {
  margin: 12px;
  background: #fff;
  border-radius: 8px;
}

.list-header {
  padding: 15px;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid #f5f5f5;
}

.points-item {
  padding: 12px 16px;
}

.points-info {
  display: flex;
  flex-direction: column;
}

.points-desc {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.points-date {
  font-size: 12px;
  color: #999;
}

.points-amount {
  font-size: 16px;
  font-weight: 500;
}

.points-amount.income {
  color: #ff9500;
}

.points-amount.expense {
  color: #1989fa;
}

.points-amount.expired {
  color: #999;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
  color: #999;
}

.empty-state :deep(.van-icon) {
  color: #ddd;
  margin-bottom: 10px;
}

/* 积分规则弹窗 */
.rules-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.rules-title {
  font-size: 16px;
  font-weight: 500;
}

.rules-content {
  padding: 16px;
  height: calc(100% - 60px);
  overflow-y: auto;
}

.rule-item {
  margin-bottom: 20px;
}

.rule-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 10px;
  color: #333;
}

.rule-desc p {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 8px 0;
}
</style>
