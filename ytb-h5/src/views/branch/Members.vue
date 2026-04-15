<template>
  <div class="branch-members-container">
    <van-nav-bar 
      title="会员管理" 
      left-arrow 
      @click-left="$router.go(-1)"
      fixed
      placeholder
    >
      <template #right>
        <van-icon name="search" size="20" @click="showSearch = true" />
      </template>
    </van-nav-bar>

    <!-- 搜索弹出层 -->
    <van-popup v-model:show="showSearch" position="top" :style="{ height: '100%' }">
      <div class="search-container">
        <van-nav-bar title="搜索会员" left-arrow @click-left="showSearch = false" />
        <div class="search-content">
          <van-search
            v-model="searchKeyword"
            placeholder="请输入会员姓名或手机号"
            @search="handleSearch"
            @clear="handleClearSearch"
          />
        </div>
      </div>
    </van-popup>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stats-card">
        <div class="stat-item">
          <div class="stat-value">{{ memberStats.total }}</div>
          <div class="stat-label">总会员数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ memberStats.active }}</div>
          <div class="stat-label">活跃会员</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ memberStats.new }}</div>
          <div class="stat-label">本月新增</div>
        </div>
      </div>
    </div>

    <!-- 等级标签 -->
    <div class="level-tabs">
      <van-tabs v-model:active="activeLevel" @change="handleLevelChange" sticky>
        <van-tab 
          v-for="level in memberLevels" 
          :key="level.id" 
          :title="level.name"
          :name="level.id"
        />
      </van-tabs>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-item" @click="showSortPopup = true">
        <span>{{ currentSort.name }}</span>
        <van-icon name="arrow-down" />
      </div>
      <div class="filter-item" @click="showFilterPopup = true">
        <span>筛选</span>
        <van-icon name="filter-o" />
        <van-badge :content="filterCount" v-if="filterCount > 0" />
      </div>
      <div class="filter-item" @click="toggleViewMode">
        <van-icon :name="viewMode === 'card' ? 'apps-o' : 'list-switch'" />
      </div>
    </div>

    <!-- 会员列表 -->
    <div class="members-content">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <!-- 卡片视图 -->
          <div v-if="viewMode === 'card'" class="members-grid">
            <div 
              v-for="member in memberList"
              :key="member.id"
              class="member-card"
              @click="handleMemberClick(member)"
            >
              <div class="member-avatar">
                <van-image
                  :src="member.avatar"
                  round
                  width="60"
                  height="60"
                >
                  <template #error>
                    <div class="avatar-fallback">
                      {{ member.name.charAt(0) }}
                    </div>
                  </template>
                </van-image>
                <div class="member-level-badge" :class="member.level.toLowerCase()">
                  {{ member.level }}
                </div>
              </div>
              
              <div class="member-info">
                <div class="member-name">{{ member.name }}</div>
                <div class="member-phone">{{ formatPhone(member.phone) }}</div>
                <div class="member-stats">
                  <span class="stat">消费 ¥{{ member.totalSpent }}</span>
                  <span class="stat">积分 {{ member.points }}</span>
                </div>
                <div class="member-status" :class="member.status">
                  {{ getStatusText(member.status) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 列表视图 -->
          <div v-else class="members-list">
            <div 
              v-for="member in memberList"
              :key="member.id"
              class="member-item"
              @click="handleMemberClick(member)"
            >
              <div class="member-avatar">
                <van-image
                  :src="member.avatar"
                  round
                  width="48"
                  height="48"
                >
                  <template #error>
                    <div class="avatar-fallback small">
                      {{ member.name.charAt(0) }}
                    </div>
                  </template>
                </van-image>
                <div class="member-level-badge small" :class="member.level.toLowerCase()">
                  {{ member.level }}
                </div>
              </div>
              
              <div class="member-content">
                <div class="member-header">
                  <div class="member-name">{{ member.name }}</div>
                  <div class="member-status" :class="member.status">
                    {{ getStatusText(member.status) }}
                  </div>
                </div>
                <div class="member-phone">{{ formatPhone(member.phone) }}</div>
                <div class="member-footer">
                  <div class="member-stats">
                    <span class="stat">消费 ¥{{ member.totalSpent }}</span>
                    <span class="stat">积分 {{ member.points }}</span>
                  </div>
                  <div class="member-time">{{ formatTime(member.lastActiveTime) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <van-empty 
            v-if="!loading && memberList.length === 0"
            description="暂无会员"
            image="search"
          >
            <van-button type="primary" @click="onRefresh">刷新试试</van-button>
          </van-empty>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 排序弹出层 -->
    <van-popup v-model:show="showSortPopup" position="bottom" closeable>
      <div class="sort-popup">
        <div class="popup-header">排序方式</div>
        <div class="sort-options">
          <div 
            v-for="sort in sortOptions"
            :key="sort.key"
            class="sort-option"
            :class="{ active: currentSort.key === sort.key }"
            @click="handleSortChange(sort)"
          >
            <span>{{ sort.name }}</span>
            <van-icon name="success" v-if="currentSort.key === sort.key" />
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 筛选弹出层 -->
    <van-popup v-model:show="showFilterPopup" position="bottom" closeable>
      <div class="filter-popup">
        <div class="popup-header">
          <span>筛选</span>
          <van-button type="primary" size="mini" plain @click="resetFilters">重置</van-button>
        </div>
        
        <!-- 会员状态 -->
        <div class="filter-section">
          <div class="filter-title">会员状态</div>
          <div class="filter-options">
            <van-radio-group v-model="filters.status">
              <van-radio name="">全部</van-radio>
              <van-radio name="active">活跃</van-radio>
              <van-radio name="inactive">不活跃</van-radio>
              <van-radio name="new">新会员</van-radio>
            </van-radio-group>
          </div>
        </div>

        <!-- 消费金额 -->
        <div class="filter-section">
          <div class="filter-title">消费金额</div>
          <div class="amount-range">
            <van-field
              v-model="filters.minAmount"
              placeholder="最低消费"
              type="number"
              class="amount-input"
            />
            <span class="amount-separator">-</span>
            <van-field
              v-model="filters.maxAmount"
              placeholder="最高消费"
              type="number"
              class="amount-input"
            />
          </div>
        </div>

        <div class="filter-actions">
          <van-button @click="showFilterPopup = false" class="cancel-btn">取消</van-button>
          <van-button type="primary" @click="applyFilters" class="confirm-btn">确定</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 会员详情弹出层 -->
    <van-popup v-model:show="showMemberDetail" position="bottom" :style="{ height: '90%' }" closeable>
      <div class="member-detail" v-if="selectedMember">
        <div class="detail-header">
          <div class="member-profile">
            <van-image
              :src="selectedMember.avatar"
              round
              width="80"
              height="80"
            >
              <template #error>
                <div class="avatar-fallback large">
                  {{ selectedMember.name.charAt(0) }}
                </div>
              </template>
            </van-image>
            <div class="member-level-badge large" :class="selectedMember.level.toLowerCase()">
              {{ selectedMember.level }}
            </div>
          </div>
          
          <div class="member-basic">
            <div class="member-name">{{ selectedMember.name }}</div>
            <div class="member-phone">{{ selectedMember.phone }}</div>
            <div class="member-join-time">
              加入时间: {{ formatTime(selectedMember.joinTime) }}
            </div>
            <div class="member-status-badge" :class="selectedMember.status">
              {{ getStatusText(selectedMember.status) }}
            </div>
          </div>
        </div>
        
        <div class="detail-content">
          <!-- 会员数据 -->
          <div class="detail-section">
            <div class="section-title">会员数据</div>
            <div class="data-grid">
              <div class="data-item">
                <div class="data-value">¥{{ selectedMember.totalSpent }}</div>
                <div class="data-label">累计消费</div>
              </div>
              <div class="data-item">
                <div class="data-value">{{ selectedMember.points }}</div>
                <div class="data-label">当前积分</div>
              </div>
              <div class="data-item">
                <div class="data-value">{{ selectedMember.orderCount }}</div>
                <div class="data-label">订单数量</div>
              </div>
              <div class="data-item">
                <div class="data-value">{{ selectedMember.visitCount }}</div>
                <div class="data-label">访问次数</div>
              </div>
            </div>
          </div>
          
          <!-- 等级权益 -->
          <div class="detail-section">
            <div class="section-title">等级权益</div>
            <div class="benefits-list">
              <div v-for="(benefit, index) in selectedMember.benefits" :key="index" class="benefit-item">
                <van-icon name="gift-o" />
                <span>{{ benefit }}</span>
              </div>
            </div>
          </div>
          
          <!-- 最近订单 -->
          <div class="detail-section">
            <div class="section-title">最近订单</div>
            <div class="orders-list">
              <div 
                v-for="(order, index) in selectedMember.recentOrders" 
                :key="index" 
                class="order-item"
              >
                <div class="order-info">
                  <div class="order-title">{{ order.productName }}</div>
                  <div class="order-time">{{ formatTime(order.orderTime) }}</div>
                </div>
                <div class="order-amount">¥{{ order.amount }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="detail-actions">
          <van-button type="primary" class="action-btn" @click="handleContactMember">联系会员</van-button>
          <van-button class="action-btn" @click="handleViewOrders">查看订单</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'

export default {
  name: 'BranchMembers',
  setup() {
    const router = useRouter()
    
    // 响应式数据
    const showSearch = ref(false)
    const searchKeyword = ref('')
    const activeLevel = ref('all')
    const viewMode = ref('card')
    const showSortPopup = ref(false)
    const showFilterPopup = ref(false)
    const showMemberDetail = ref(false)
    const selectedMember = ref(null)
    
    const refreshing = ref(false)
    const loading = ref(false)
    const finished = ref(false)
    
    const memberList = ref([])
    
    // 筛选器
    const filters = reactive({
      status: '',
      minAmount: '',
      maxAmount: ''
    })
    
    // 会员统计
    const memberStats = ref({
      total: 2856,
      active: 1234,
      new: 156
    })
    
    // 会员等级
    const memberLevels = ref([
      { id: 'all', name: '全部' },
      { id: 'bronze', name: '青铜' },
      { id: 'silver', name: '白银' },
      { id: 'gold', name: '黄金' },
      { id: 'platinum', name: '铂金' },
      { id: 'diamond', name: '钻石' }
    ])
    
    // 排序选项
    const sortOptions = ref([
      { key: 'default', name: '默认排序' },
      { key: 'spent_desc', name: '消费金额从高到低' },
      { key: 'spent_asc', name: '消费金额从低到高' },
      { key: 'points_desc', name: '积分从高到低' },
      { key: 'join_time', name: '加入时间' },
      { key: 'last_active', name: '最近活跃' }
    ])
    
    const currentSort = ref(sortOptions.value[0])
    
    // 计算属性
    const filterCount = computed(() => {
      let count = 0
      if (filters.status) count++
      if (filters.minAmount || filters.maxAmount) count++
      return count
    })
    
    // 模拟会员数据
    const mockMembers = [
      {
        id: 1,
        name: '张先生',
        phone: '13800138001',
        avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
        level: 'Gold',
        status: 'active',
        totalSpent: 15680,
        points: 3456,
        orderCount: 28,
        visitCount: 156,
        joinTime: '2023-06-15 10:30',
        lastActiveTime: '2024-01-20 14:25',
        benefits: ['9折优惠', '免费配送', '专属客服', '生日礼品'],
        recentOrders: [
          { productName: '智能净水器Pro', amount: 2999, orderTime: '2024-01-18 15:30' },
          { productName: '空气净化器', amount: 1899, orderTime: '2024-01-10 09:45' }
        ]
      },
      {
        id: 2,
        name: '李女士',
        phone: '13900139002',
        avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
        level: 'Silver',
        status: 'active',
        totalSpent: 8960,
        points: 1256,
        orderCount: 15,
        visitCount: 89,
        joinTime: '2023-08-22 16:20',
        lastActiveTime: '2024-01-19 11:15',
        benefits: ['95折优惠', '免费配送', '专属客服'],
        recentOrders: [
          { productName: '热水器', amount: 3299, orderTime: '2024-01-15 12:20' }
        ]
      },
      {
        id: 3,
        name: '王先生',
        phone: '13700137003',
        avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
        level: 'Bronze',
        status: 'inactive',
        totalSpent: 2340,
        points: 456,
        orderCount: 6,
        visitCount: 23,
        joinTime: '2023-11-05 14:10',
        lastActiveTime: '2023-12-20 16:30',
        benefits: ['免费配送'],
        recentOrders: [
          { productName: '滤芯套装', amount: 299, orderTime: '2023-12-15 10:15' }
        ]
      },
      {
        id: 4,
        name: '赵女士',
        phone: '13600136004',
        avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
        level: 'Platinum',
        status: 'active',
        totalSpent: 25680,
        points: 5678,
        orderCount: 42,
        visitCount: 234,
        joinTime: '2023-03-10 09:45',
        lastActiveTime: '2024-01-21 08:50',
        benefits: ['85折优惠', '免费配送', '专属客服', '生日礼品', '优先服务'],
        recentOrders: [
          { productName: '智能家电套装', amount: 8999, orderTime: '2024-01-20 16:45' },
          { productName: '上门服务', amount: 299, orderTime: '2024-01-18 10:30' }
        ]
      }
    ]
    
    // 方法
    const handleSearch = () => {
      if (!searchKeyword.value.trim()) {
        showToast('请输入搜索关键词')
        return
      }
      
      showSearch.value = false
      onRefresh()
      showToast(`搜索 "${searchKeyword.value}"`)
    }
    
    const handleClearSearch = () => {
      searchKeyword.value = ''
    }
    
    const handleLevelChange = (levelId) => {
      activeLevel.value = levelId
      onRefresh()
    }
    
    const handleSortChange = (sort) => {
      currentSort.value = sort
      showSortPopup.value = false
      onRefresh()
      showToast(`已按${sort.name}`)
    }
    
    const toggleViewMode = () => {
      viewMode.value = viewMode.value === 'card' ? 'list' : 'card'
    }
    
    const resetFilters = () => {
      filters.status = ''
      filters.minAmount = ''
      filters.maxAmount = ''
    }
    
    const applyFilters = () => {
      showFilterPopup.value = false
      onRefresh()
      showToast('筛选已应用')
    }
    
    const getStatusText = (status) => {
      const statusMap = {
        'active': '活跃',
        'inactive': '不活跃',
        'new': '新会员'
      }
      return statusMap[status] || '未知'
    }
    
    const formatPhone = (phone) => {
      if (!phone) return ''
      return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    }
    
    const formatTime = (timeStr) => {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`
    }
    
    const handleMemberClick = (member) => {
      selectedMember.value = member
      showMemberDetail.value = true
    }
    
    const handleContactMember = () => {
      showToast('联系会员功能')
      showMemberDetail.value = false
    }
    
    const handleViewOrders = () => {
      showToast('查看订单功能')
      showMemberDetail.value = false
    }
    
    const loadMembers = () => {
      // 模拟API调用
      let filteredMembers = [...mockMembers]
      
      // 等级筛选
      if (activeLevel.value !== 'all') {
        filteredMembers = filteredMembers.filter(m => m.level.toLowerCase() === activeLevel.value.toLowerCase())
      }
      
      // 搜索筛选
      if (searchKeyword.value) {
        filteredMembers = filteredMembers.filter(m => 
          m.name.includes(searchKeyword.value) || 
          m.phone.includes(searchKeyword.value)
        )
      }
      
      // 状态筛选
      if (filters.status) {
        filteredMembers = filteredMembers.filter(m => m.status === filters.status)
      }
      
      // 消费金额筛选
      if (filters.minAmount) {
        filteredMembers = filteredMembers.filter(m => m.totalSpent >= parseFloat(filters.minAmount))
      }
      if (filters.maxAmount) {
        filteredMembers = filteredMembers.filter(m => m.totalSpent <= parseFloat(filters.maxAmount))
      }
      
      // 排序
      switch (currentSort.value.key) {
        case 'spent_desc':
          filteredMembers.sort((a, b) => b.totalSpent - a.totalSpent)
          break
        case 'spent_asc':
          filteredMembers.sort((a, b) => a.totalSpent - b.totalSpent)
          break
        case 'points_desc':
          filteredMembers.sort((a, b) => b.points - a.points)
          break
        case 'join_time':
          filteredMembers.sort((a, b) => new Date(b.joinTime) - new Date(a.joinTime))
          break
        case 'last_active':
          filteredMembers.sort((a, b) => new Date(b.lastActiveTime) - new Date(a.lastActiveTime))
          break
      }
      
      return filteredMembers
    }
    
    const onRefresh = () => {
      refreshing.value = true
      memberList.value = []
      finished.value = false
      
      setTimeout(() => {
        const members = loadMembers()
        memberList.value = members
        refreshing.value = false
        finished.value = true
      }, 1000)
    }
    
    const onLoad = () => {
      setTimeout(() => {
        loading.value = false
        finished.value = true
      }, 1000)
    }
    
    // 生命周期
    onMounted(() => {
      onRefresh()
    })
    
    return {
      // 响应式数据
      showSearch,
      searchKeyword,
      activeLevel,
      viewMode,
      showSortPopup,
      showFilterPopup,
      showMemberDetail,
      selectedMember,
      refreshing,
      loading,
      finished,
      memberList,
      filters,
      memberStats,
      memberLevels,
      sortOptions,
      currentSort,
      filterCount,
      
      // 方法
      handleSearch,
      handleClearSearch,
      handleLevelChange,
      handleSortChange,
      toggleViewMode,
      resetFilters,
      applyFilters,
      getStatusText,
      formatPhone,
      formatTime,
      handleMemberClick,
      handleContactMember,
      handleViewOrders,
      onRefresh,
      onLoad
    }
  }
}
</script>

<style scoped>
.branch-members-container {
  background: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 20px;
}

/* 搜索容器 */
.search-container {
  background: #fff;
  height: 100%;
}

.search-content {
  padding: 16px;
}

/* 统计卡片 */
.stats-section {
  padding: 16px;
}

.stats-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: space-around;
  color: #fff;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

/* 等级标签 */
.level-tabs {
  background: #fff;
  position: sticky;
  top: 46px;
  z-index: 99;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 90px;
  z-index: 98;
}

.filter-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-right: 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  position: relative;
}

.filter-item:last-child {
  margin-left: auto;
  margin-right: 0;
}

.filter-item .van-icon {
  margin-left: 4px;
  font-size: 12px;
}

/* 会员列表 */
.members-content {
  padding: 0 16px;
}

/* 卡片视图 */
.members-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.member-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.member-card:active {
  transform: scale(0.98);
}

.member-avatar {
  position: relative;
  display: inline-block;
  margin-bottom: 12px;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f0f9ff;
  color: #1989fa;
  font-size: 20px;
  font-weight: 600;
}

.avatar-fallback.small {
  width: 48px;
  height: 48px;
  font-size: 16px;
}

.avatar-fallback.large {
  width: 80px;
  height: 80px;
  font-size: 24px;
}

.member-level-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
  color: #fff;
  border: 2px solid #fff;
}

.member-level-badge.small {
  font-size: 8px;
  padding: 1px 4px;
}

.member-level-badge.large {
  font-size: 12px;
  padding: 3px 8px;
}

.member-level-badge.bronze {
  background: #cd7f32;
}

.member-level-badge.silver {
  background: #c0c0c0;
}

.member-level-badge.gold {
  background: #ffd700;
  color: #333;
}

.member-level-badge.platinum {
  background: #e5e4e2;
  color: #333;
}

.member-level-badge.diamond {
  background: #b9f2ff;
  color: #333;
}

.member-info {
  text-align: center;
}

.member-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.member-phone {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.member-stats {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.stat {
  font-size: 10px;
  color: #666;
}

.member-status {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  color: #fff;
}

.member-status.active {
  background: #4caf50;
}

.member-status.inactive {
  background: #999;
}

.member-status.new {
  background: #ff9800;
}

/* 列表视图 */
.members-list {
  margin-top: 12px;
}

.member-item {
  display: flex;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.member-item:active {
  transform: scale(0.98);
}

.member-item .member-avatar {
  margin-right: 12px;
}

.member-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.member-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.member-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.member-time {
  font-size: 12px;
  color: #999;
}

/* 弹出层 */
.sort-popup, .filter-popup {
  background: #fff;
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.sort-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sort-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.sort-option.active {
  color: #1989fa;
}

.sort-option:last-child {
  border-bottom: none;
}

/* 筛选弹出层 */
.filter-section {
  margin-bottom: 24px;
}

.filter-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.amount-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.amount-input {
  flex: 1;
}

.amount-separator {
  color: #999;
  font-size: 14px;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.cancel-btn, .confirm-btn {
  flex: 1;
}

/* 会员详情弹出层 */
.member-detail {
  background: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  padding: 20px;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.member-profile {
  position: relative;
  margin-right: 16px;
}

.member-basic {
  flex: 1;
}

.member-basic .member-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.member-basic .member-phone {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.member-join-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.member-status-badge {
  display: inline-block;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  color: #fff;
}

.member-status-badge.active {
  background: #4caf50;
}

.member-status-badge.inactive {
  background: #999;
}

.member-status-badge.new {
  background: #ff9800;
}

.detail-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.data-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.data-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.data-label {
  font-size: 12px;
  color: #666;
}

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.benefit-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
}

.benefit-item .van-icon {
  margin-right: 8px;
  color: #ff9800;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.order-info {
  flex: 1;
}

.order-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.order-time {
  font-size: 12px;
  color: #999;
}

.order-amount {
  font-size: 14px;
  font-weight: 500;
  color: #ff4444;
}

.detail-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.action-btn {
  flex: 1;
}
</style>
