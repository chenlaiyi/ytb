<template>
  <div class="reward-list-page">
    <van-nav-bar
      title="分红奖励名单"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
    >
      <template #right>
        <van-icon name="replay" size="18" @click="refreshData" :class="{ 'refresh-loading': isRefreshing }" />
      </template>
    </van-nav-bar>

    <!-- 统计概览 -->
    <div class="summary-card">
      <div class="summary-item">
        <div class="summary-value">{{ summaryData.totalMembers || 0 }}人</div>
        <div class="summary-label">达标总人数</div>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <div class="summary-value">{{ summaryData.totalAmount || '0.00' }}元</div>
        <div class="summary-label">奖金总额</div>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <div class="summary-value">{{ summaryData.averageAmount || '0.00' }}元</div>
        <div class="summary-label">人均奖励</div>
      </div>
    </div>

    <!-- 筛选Tab -->
    <van-tabs v-model="activeTab" @change="handleTabChange" :sticky="true" color="#ff4a47">
      <van-tab title="全部" name="all" />
      <van-tab title="初级分红" name="junior" />
      <van-tab title="中级分红" name="middle" />
      <van-tab title="高级分红" name="senior" />
    </van-tabs>

    <!-- 分红类型筛选 -->
    <div class="filter-bar">
      <van-dropdown-menu active-color="#ff4a47">
        <van-dropdown-item v-model="filterType" :options="typeOptions" />
        <van-dropdown-item v-model="filterMonth" :options="monthOptions" />
        <van-dropdown-item v-model="filterSort" :options="sortOptions" />
      </van-dropdown-menu>
    </div>

    <!-- 列表内容 -->
    <div class="reward-content">
      <template v-if="rewardList.length > 0">
        <div class="reward-list">
          <div 
            v-for="(member, index) in rewardList" 
            :key="index" 
            class="reward-item"
            @click="showMemberDetail(member)"
          >
            <div class="member-avatar">
              <van-image
                round
                width="50"
                height="50"
                :src="member.avatar"
                :error-content="'头像'"
              />
              <div class="member-level">{{ getLevelLabel(member.level) }}</div>
            </div>
            <div class="member-info">
              <div class="member-name">
                {{ member.name || '用户' + member.id }}
                <van-tag 
                  type="success" 
                  size="mini" 
                  class="type-tag"
                >
                  {{ member.type === 'vip' ? 'VIP招募' : '充值' }}
                </van-tag>
                <van-tag
                  color="#ff9500"
                  size="mini"
                  style="margin-left: 4px;"
                >
                  已达标
                </van-tag>
              </div>
              <div class="member-date">
                <span>达标时间: {{ member.qualify_date }}</span>
                <span class="contribution-tag">贡献: {{ member.contribution }}</span>
              </div>
            </div>
            <div class="member-stats">
              <div class="stats-item">
                <span class="stats-value">{{ member.reward_amount }}元</span>
                <span class="stats-label">奖励金额</span>
              </div>
              <div class="stats-divider"></div>
              <div class="stats-item">
                <span class="stats-value">{{ member.team_count || 0 }}人</span>
                <span class="stats-label">团队规模</span>
              </div>
            </div>
            
            <!-- 点击查看详情提示 -->
            <div class="detail-hint">
              <van-icon name="arrow" size="14" color="#999" />
            </div>
          </div>
        </div>
        
        <!-- 分页 -->
        <van-pagination 
          v-model="currentPage" 
          :total-items="total" 
          :items-per-page="pageSize"
          force-ellipses
          @change="handlePageChange"
        />
      </template>
      
      <!-- 空状态 -->
      <van-empty v-else description="暂无达标成员" />
    </div>
    
    <!-- 加载状态 -->
    <div class="loading-container" v-if="loading">
      <van-loading color="#ff4a47" />
      <span class="loading-text">加载中...</span>
    </div>

    <!-- 详情弹窗 -->
    <van-popup
      v-model:show="showDetail"
      round
      position="bottom"
      :style="{ height: '70%' }"
      @close="closeDetail"
    >
      <div class="member-detail" v-if="currentMember">
        <div class="detail-header">
          <div class="title">成员详情</div>
          <van-icon name="cross" @click="closeDetail" />
        </div>
        
        <div class="detail-content">
          <div class="detail-item">
            <div class="item-label">用户ID</div>
            <div class="item-value">{{ currentMember.user_id }}</div>
          </div>
          <div class="detail-item">
            <div class="item-label">用户昵称</div>
            <div class="item-value">{{ currentMember.nickname }}</div>
          </div>
          <div class="detail-item">
            <div class="item-label">会员等级</div>
            <div class="item-value">{{ getLevelLabel(currentMember.level) }}</div>
          </div>
          <div class="detail-item">
            <div class="item-label">贡献金额</div>
            <div class="item-value">{{ formatAmount(currentMember.amount, 2, '') }}</div>
          </div>
          <div class="detail-item">
            <div class="item-label">奖励金额</div>
            <div class="item-value highlight">{{ formatAmount(currentMember.reward, 2, '') }}</div>
          </div>
          <div class="detail-item">
            <div class="item-label">创建时间</div>
            <div class="item-value">{{ formatDate(currentMember.created_at) }}</div>
          </div>
          <div class="detail-item" v-if="currentMember.remark">
            <div class="item-label">备注信息</div>
            <div class="item-value">{{ currentMember.remark }}</div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NavBar, Icon, Empty, Loading, Pagination, Tag, DropdownMenu, DropdownItem, Popup, Image as VanImage } from 'vant'
import { getRewardList, getVipWorkspace } from '@/api/vip'
import { useUserStore } from '@/stores/user'
import { formatDate, formatAmount } from '@/utils/format'
import Toast from '@/utils/toast-fix'

const router = useRouter()
const route = useRoute()
const isRefreshing = ref(false)
const loading = ref(false)
const rewardList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const showDetail = ref(false)
const currentMember = ref(null)

// 标签页和筛选条件
const activeTab = ref('all')
const filterType = ref('all')
const filterMonth = ref('current')
const filterSort = ref('amount_desc')

// 从URL查询参数中获取初始等级
onMounted(() => {
  const levelParam = route.query.level
  if (levelParam && ['junior', 'middle', 'senior'].includes(levelParam)) {
    activeTab.value = levelParam
  }
  
  fetchRewardList()
})

// 筛选选项
const typeOptions = [
  { text: '全部类型', value: 'all' },
  { text: 'VIP招募', value: 'vip' },
  { text: '充值', value: 'recharge' }
]

const monthOptions = [
  { text: '本月', value: 'current' },
  { text: '上月', value: 'last' },
  { text: '全部时间', value: 'all' }
]

const sortOptions = [
  { text: '奖励金额↓', value: 'amount_desc' },
  { text: '奖励金额↑', value: 'amount_asc' },
  { text: '达标时间↓', value: 'time_desc' },
  { text: '达标时间↑', value: 'time_asc' }
]

// 统计汇总数据
const summaryData = ref({
  totalMembers: 0,
  totalAmount: '0.00',
  averageAmount: '0.00'
})

// 返回按钮处理
const onClickLeft = () => {
  router.back()
}

// 获取奖励名单数据
const fetchRewardList = async () => {
  if (loading.value) return
  
  loading.value = true
  isRefreshing.value = true
  
  try {
    // 构建请求参数
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      level: activeTab.value !== 'all' ? activeTab.value : undefined,
      type: filterType.value !== 'all' ? filterType.value : undefined,
      period: filterMonth.value !== 'all' ? filterMonth.value : undefined,
      sort: filterSort.value
    }
    
    console.log('获取奖励名单, 参数:', params)
    const res = await getRewardList(params)
    console.log('奖励名单API返回结果:', res)
    
    if (res.code === 0 && res.data) {
      console.log('处理返回的奖励名单数据')
      // 处理返回的奖励名单数据
      rewardList.value = res.data.list || []
      total.value = res.data.total || 0
      
      // 更新汇总数据
      if (res.data.summary) {
        summaryData.value = {
          totalMembers: res.data.summary.totalMembers || 0,
          totalAmount: res.data.summary.totalAmount || '0.00',
          averageAmount: res.data.summary.averageAmount || '0.00'
        }
      }
    } else {
      // 详细记录错误信息
      console.error('API返回错误:', res.code, res.message)
      Toast({ type: 'fail', message: res.message || '获取奖励名单失败' })
      rewardList.value = []
      total.value = 0
      summaryData.value = {
        totalMembers: 0,
        totalAmount: '0.00',
        averageAmount: '0.00'
      }
    }
  } catch (error) {
    // 捕获并详细记录异常
    console.error('获取奖励名单异常:', error)
    const errorMessage = error.message || '网络异常，请稍后重试'
    console.log('显示错误消息:', errorMessage)
    Toast({ type: 'fail', message: errorMessage })
    rewardList.value = []
    total.value = 0
    summaryData.value = {
      totalMembers: 0,
      totalAmount: '0.00',
      averageAmount: '0.00'
    }
  } finally {
    loading.value = false
    isRefreshing.value = false
  }
}

// 手动刷新数据
const refreshData = () => {
  if (isRefreshing.value) return
  
  Toast.loading({
    message: '刷新中...',
    duration: 1000
  })
  
  fetchRewardList()
}

// 处理分页变化
const handlePageChange = (page) => {
  currentPage.value = page
  fetchRewardList()
}

// 处理标签页切换
const handleTabChange = () => {
  currentPage.value = 1
  fetchRewardList()
}

// 获取等级标签
const getLevelLabel = (level) => {
  switch (level) {
    case 'junior': return '初级分红'
    case 'middle': return '中级分红'
    case 'senior': return '高级分红'
    default: return '未知等级'
  }
}

// 获取类型样式
const getTypeClass = (type, level) => {
  if (type === 'vip') {
    return 'type-vip'
  } else {
    return 'type-recharge'
  }
}

// 获取计算公式提示
const getFormulaTip = (level, type) => {
  if (type === 'vip') {
    switch (level) {
      case 'junior': return '300元/人均分'
      case 'middle': return '300元/人均分'
      case 'senior': return '300元×直推占比'
      default: return '-'
    }
  } else {
    switch (level) {
      case 'junior': return '15元/台均分'
      case 'middle': return '15元/台均分'
      case 'senior': return '15元×直推占比'
      default: return '-'
    }
  }
}

// 显示成员详情
const showMemberDetail = (member) => {
  currentMember.value = member
  showDetail.value = true
}

// 关闭详情弹窗
const closeDetail = () => {
  showDetail.value = false
  currentMember.value = null
}

// 监听筛选条件变化
watch([filterType, filterMonth, filterSort], () => {
  currentPage.value = 1
  fetchRewardList()
})
</script>

<style scoped>
.reward-list-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

/* 统计概览 */
.summary-card {
  display: flex;
  justify-content: space-between;
  background: linear-gradient(135deg, #ff4a47 0%, #ff7676 100%);
  color: #fff;
  padding: 20px 15px;
  border-radius: 0 0 16px 16px;
  margin-bottom: 15px;
  box-shadow: 0 4px 12px rgba(255, 74, 71, 0.2);
}

.summary-item {
  flex: 1;
  text-align: center;
}

.summary-value {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.summary-label {
  font-size: 12px;
  opacity: 0.9;
}

.summary-divider {
  width: 1px;
  height: 30px;
  background-color: rgba(255, 255, 255, 0.3);
  margin: auto 10px;
}

/* 筛选栏 */
.filter-bar {
  margin: 0 15px 15px;
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 列表内容 */
.reward-content {
  padding: 15px;
}

.reward-list {
  padding-bottom: 20px;
}

.reward-item {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  transition: all 0.3s ease;
}

.reward-item:active {
  background-color: #f9f9f9;
  transform: scale(0.98);
}

.member-avatar {
  position: relative;
  margin-right: 15px;
}

.member-level {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background-color: #ff4a47;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
}

.type-tag {
  margin-left: 8px;
}

.member-date {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.contribution-tag {
  background-color: #f7ece0;
  color: #e6b36e;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
}

.member-stats {
  display: flex;
  align-items: center;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 8px 12px;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 10px;
}

.stats-value {
  font-size: 14px;
  font-weight: bold;
  color: #ff4a47;
  margin-bottom: 2px;
}

.stats-label {
  font-size: 10px;
  color: #999;
}

.stats-divider {
  width: 1px;
  height: 20px;
  background-color: #ddd;
}

/* 分页 */
:deep(.van-pagination) {
  margin-top: 20px;
  margin-bottom: 20px;
}

:deep(.van-pagination__item--active) {
  color: #fff;
  background-color: #ff4a47;
}

/* 加载状态 */
.loading-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.loading-text {
  margin-top: 10px;
  font-size: 14px;
  color: #999;
}

.refresh-loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 弹窗 */
.member-detail {
  padding: 20px;
  
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 15px;
    margin-bottom: 15px;
    border-bottom: 1px solid var(--van-gray-2);
    
    .title {
      font-size: 18px;
      font-weight: bold;
    }
  }
  
  .detail-content {
    .detail-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid var(--van-gray-1);
      
      .item-label {
        color: var(--van-gray-6);
      }
      
      .item-value {
        font-weight: 500;
        
        &.highlight {
          color: var(--van-red);
          font-weight: bold;
        }
      }
    }
  }
}

.detail-hint {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
}
</style> 